import { supabase } from '../database/supabase.js';

const TABLE = 'settings';
const CACHE_TTL_MS = 30_000;

export const SETTINGS_KEYS = Object.freeze({
  CONTACT_PHONE: 'contact_phone',
  TELEGRAM_LINK: 'telegram_link',
  INSTAGRAM_LINK: 'instagram_link',
  YOUTUBE_LINK: 'youtube_link',
  ADMIN_CONTACT_LINK: 'admin_contact_link'
});

const LEGACY_SETTINGS_KEYS = Object.freeze({
  TG_LINK: 'tg_link',
  INSTA_LINK: 'insta_link',
  YT_LINK: 'yt_link'
});

export class SettingsService {
  constructor() {
    this.cache = new Map();
  }

  _now() {
    return Date.now();
  }

  _getCached(key) {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= this._now()) {
      this.cache.delete(key);
      return null;
    }
    return hit.value;
  }

  _setCached(key, value) {
    this.cache.set(key, { value, expiresAt: this._now() + CACHE_TTL_MS });
  }

  async get(key) {
    const cached = this._getCached(key);
    if (cached !== null) return cached;

    const { data, error } = await supabase.from(TABLE).select('value').eq('key', key).maybeSingle();
    if (error) throw new Error(`settings.get(${key}): ${error.message}`);
    const value = data?.value ?? null;
    this._setCached(key, value);
    return value;
  }

  async set(key, value) {
    const { error } = await supabase
      .from(TABLE)
      .upsert([{ key, value: value ?? null }], { onConflict: 'key' });
    if (error) throw new Error(`settings.set(${key}): ${error.message}`);
    this._setCached(key, value ?? null);
  }

  async getPublicContacts() {
    const keys = [...Object.values(SETTINGS_KEYS), ...Object.values(LEGACY_SETTINGS_KEYS)];
    const cached = {};
    const missing = [];
    for (const k of keys) {
      const v = this._getCached(k);
      if (v !== null) cached[k] = v;
      else missing.push(k);
    }

    if (missing.length === 0) {
      return {
        contact_phone: cached[SETTINGS_KEYS.CONTACT_PHONE] ?? null,
        telegram_link: cached[SETTINGS_KEYS.TELEGRAM_LINK] ?? cached[LEGACY_SETTINGS_KEYS.TG_LINK] ?? null,
        instagram_link: cached[SETTINGS_KEYS.INSTAGRAM_LINK] ?? cached[LEGACY_SETTINGS_KEYS.INSTA_LINK] ?? null,
        youtube_link: cached[SETTINGS_KEYS.YOUTUBE_LINK] ?? cached[LEGACY_SETTINGS_KEYS.YT_LINK] ?? null,
        admin_contact_link: cached[SETTINGS_KEYS.ADMIN_CONTACT_LINK] ?? null
      };
    }

    const { data, error } = await supabase.from(TABLE).select('key,value').in('key', keys);
    if (error) throw new Error(`settings.getPublicContacts: ${error.message}`);

    const m = new Map((data ?? []).map((r) => [r.key, r.value]));
    for (const k of keys) {
      const v = m.get(k) ?? null;
      this._setCached(k, v);
    }

    return {
      contact_phone: m.get(SETTINGS_KEYS.CONTACT_PHONE) ?? null,
      telegram_link: m.get(SETTINGS_KEYS.TELEGRAM_LINK) ?? m.get(LEGACY_SETTINGS_KEYS.TG_LINK) ?? null,
      instagram_link: m.get(SETTINGS_KEYS.INSTAGRAM_LINK) ?? m.get(LEGACY_SETTINGS_KEYS.INSTA_LINK) ?? null,
      youtube_link: m.get(SETTINGS_KEYS.YOUTUBE_LINK) ?? m.get(LEGACY_SETTINGS_KEYS.YT_LINK) ?? null,
      admin_contact_link: m.get(SETTINGS_KEYS.ADMIN_CONTACT_LINK) ?? null
    };
  }

  async getAdminIds() {
    const raw = await this.get('ADMIN_IDS');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  async addAdminId(id) {
    const ids = await this.getAdminIds();
    const strId = String(id);
    if (!ids.includes(strId)) {
      ids.push(strId);
      await this.set('ADMIN_IDS', JSON.stringify(ids));
    }
  }

  async removeAdminId(id) {
    const ids = await this.getAdminIds();
    const filtered = ids.filter((i) => i !== String(id));
    await this.set('ADMIN_IDS', JSON.stringify(filtered));
  }
}

