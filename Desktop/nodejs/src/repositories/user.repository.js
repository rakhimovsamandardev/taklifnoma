import { supabase } from '../database/supabase.js';

const TABLE = 'profile';

function toTelegramIdString(id) {
  return String(id);
}

function stateDataToDb(value) {
  if (value === undefined || value === null) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) || {};
    } catch {
      return {};
    }
  }
  return value;
}

function stateDataToRawString(value) {
  const obj = stateDataToDb(value);
  return JSON.stringify(obj);
}

/**
 * Maps Supabase `profile` row to the shape expected by StateService / legacy code.
 * @param {Record<string, unknown> | null} row
 */
function mapProfileRow(row) {
  if (!row) return null;
  const tid = row.telegram_id != null ? String(row.telegram_id) : '';
  const idNum = Number(tid);
  const stateDataRaw = stateDataToRawString(row.state_data);
  return {
    id: Number.isFinite(idNum) ? idNum : tid,
    language: row.language ?? 'uz',
    state: row.state ?? 'IDLE',
    stateDataRaw
  };
}

export class UserRepository {
  /**
   * @param {string | number} id Telegram user id (stored as string in DB)
   * @returns {Promise<ReturnType<typeof mapProfileRow>>}
   */
  async getByTelegramId(id) {
    const telegramId = toTelegramIdString(id);
    const { data, error } = await supabase
      .from(TABLE)
      .select('telegram_id, language, state, state_data')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) throw new Error(`getByTelegramId: ${error.message}`);
    return mapProfileRow(data);
  }

  /**
   * @param {{ telegram_id: string | number; language?: string; state?: string; state_data?: unknown }} userData
   */
  async create(userData) {
    const row = {
      telegram_id: toTelegramIdString(userData.telegram_id),
      language: userData.language ?? 'uz',
      state: userData.state ?? 'IDLE',
      state_data: stateDataToDb(userData.state_data)
    };

    const { error } = await supabase.from(TABLE).insert([row]);
    if (error) {
      if (error.code === '23505') return;
      throw new Error(`create profile: ${error.message}`);
    }
  }

  /**
   * @param {string | number} id Telegram user id
   * @param {Record<string, unknown>} data Partial profile fields
   */
  async update(id, data) {
    const telegramId = toTelegramIdString(id);
    const patch = { ...data };
    if (patch.state_data !== undefined) {
      patch.state_data = stateDataToDb(patch.state_data);
    }

    const { error } = await supabase.from(TABLE).update(patch).eq('telegram_id', telegramId);
    if (error) throw new Error(`update profile: ${error.message}`);
  }

  /** Same as {@link getByTelegramId}; kept for StateService compatibility. */
  findById(id) {
    return this.getByTelegramId(id);
  }

  async setLanguage(id, language) {
    await this.update(id, { language });
  }

  async setState(id, state, stateData) {
    await this.update(id, {
      state,
      state_data: stateDataToDb(stateData)
    });
  }

  async clearSession(id) {
    await this.setState(id, 'IDLE', {});
  }

  async patchStateData(id, state, partial) {
    const row = await this.getByTelegramId(id);
    let prev = {};
    try {
      prev = JSON.parse(row?.stateDataRaw ?? '{}') || {};
    } catch {
      prev = {};
    }
    const next = { ...prev, ...partial };
    await this.setState(id, state ?? row?.state ?? 'IDLE', next);
    return next;
  }
}
