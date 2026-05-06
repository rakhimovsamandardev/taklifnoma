import { env } from '../config/env.js';
import { mapAdminEnum, tAdmin } from '../config/admin.constants.js';
import { Markup } from 'telegraf';
import { CALLBACKS, buildModerationCallbackRegex } from '../config/constants.js';
import { isPrivilegedAdmin } from '../utils/adminAccess.js';
import {
  adminMenuInlineKeyboardByLang,
  adminManageAdminsKeyboard,
  adminSubMenuBackInlineKeyboardByLang,
  mainMenuReplyKeyboard
} from '../utils/keyboard.js';
import { translate } from '../services/translation.service.js';
import { SETTINGS_KEYS } from '../services/settings.service.js';

const CHANNEL_ENUM_MAPPING = Object.freeze({
  tenant_type: {
    everyone: { ru_krill: 'Ҳамма учун' },
    family: { ru_krill: 'Оила учун' },
    family_and_girls: { ru_krill: 'Оила ва қизлар учун' },
    girls: { ru_krill: 'Қизлар учун' },
    children: { ru_krill: 'Йигитлар / эркаклар учун' }
  },
  house_types: {
    brick: { ru_krill: 'Ғишт' },
    panel: { ru_krill: 'Панель' },
    monolith: { ru_krill: 'Монолит' }
  },
  conditions: {
    new: { ru_krill: 'Янги' },
    good: { ru_krill: 'Яхши' },
    needs_repair: { ru_krill: "Таъмир керак" }
  }
});

export class AdminController {
  constructor(adminService, settingsService) {
    this.admin = adminService;
    this.settings = settingsService;
    this.sessionByAdminId = new Map();
  }

  async _isAdmin(ctx) {
    console.log('[AdminController] _isAdmin called', { fromId: ctx.from?.id });
    return isPrivilegedAdmin(ctx.from?.id, this.settings);
  }

  _getSession(adminId) {
    const id = String(adminId);
    let s = this.sessionByAdminId.get(id);
    if (!s) {
      s = { mode: null, field: null };
      this.sessionByAdminId.set(id, s);
    }
    return s;
  }

  async _resolveAdminLang(ctx) {
    console.log('[AdminController] _resolveAdminLang called', { fromId: ctx.from?.id });
    const lang = await this.admin.getUserLanguage(ctx.from?.id);
    return lang === 'ru' ? 'ru' : 'uz';
  }

  _formatModerationText(listing, lang) {
    const unknown = tAdmin(lang, 'unknown_value');
    const owner = listing?.owner?.telegram_id ?? listing?.user_id ?? unknown;
    const isMeaningful = (v) => {
      if (v === null || v === undefined) return false;
      const s = String(v).trim();
      return s !== '' && s !== '-' && s !== '—' && s.toLowerCase() !== 'n/a';
    };
    const location = [listing?.region, listing?.district].filter(isMeaningful).join(', ');
    const lines = [`${tAdmin(lang, 'moderation_title')} #${listing.id ?? unknown}`, `${tAdmin(lang, 'label_owner')}: ${owner}`];
    if (isMeaningful(location)) lines.push(`${tAdmin(lang, 'label_location')}: ${location}`);
    if (isMeaningful(listing?.rooms)) lines.push(`${tAdmin(lang, 'label_rooms')}: ${listing.rooms}`);
    lines.push(`${tAdmin(lang, 'label_house_type')}: ${mapAdminEnum(lang, 'house_type', listing?.house_type)}`);
    lines.push(`${tAdmin(lang, 'label_condition')}: ${mapAdminEnum(lang, 'condition', listing?.condition)}`);
    lines.push(`${tAdmin(lang, 'label_tenant')}: ${mapAdminEnum(lang, 'tenant_type', listing?.tenant_type)}`);
    if (isMeaningful(listing?.price)) lines.push(`${tAdmin(lang, 'label_price')}: ${listing.price} $`);
    if (isMeaningful(listing?.contact_phone)) lines.push(`${tAdmin(lang, 'label_phone')}: ${listing.contact_phone}`);
    return lines.join('\n');
  }

  _moderationKeyboard(listingId, lang) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(tAdmin(lang, 'moderation_approve_button'), `${CALLBACKS.ADMIN_APPROVE_PREFIX}${listingId}`),
        Markup.button.callback(tAdmin(lang, 'moderation_reject_button'), `${CALLBACKS.ADMIN_REJECT_PREFIX}${listingId}`)
      ],
      [Markup.button.callback(tAdmin(lang, 'moderation_back_button'), 'admin_back')]
    ]);
  }

  getModerationTargetChatId() {
    return env.ADMIN_GROUP_ID || env.ADMIN_ID || env.ADMIN_CHAT_ID || null;
  }

  _formatNewListingNotificationText(listing, submitterName = 'Unknown') {
    const unknown = '—';
    const pick = (v) => (v === null || v === undefined || String(v).trim() === '' ? unknown : String(v));
    const mapTenantType = (v) => {
      const key = String(v ?? '').trim().toLowerCase();
      const labels = {
        everyone: 'Barcha uchun',
        family: 'Oila va qizlar uchun',
        family_and_girls: 'Oila va qizlar uchun',
        girls: 'Qizlar uchun',
        children: 'Yigitlar / erkaklar uchun'
      };
      return labels[key] ?? pick(v);
    };
    const mapHouseType = (v) => {
      const key = String(v ?? '').trim().toLowerCase();
      const labels = {
        brick: "G'ishtli",
        panel: 'Panelli',
        monolith: 'Monolit'
      };
      return labels[key] ?? pick(v);
    };
    const mapCondition = (v) => {
      const key = String(v ?? '').trim().toLowerCase();
      const labels = {
        new: 'Yangi/Yaxshi',
        good: 'Yaxshi',
        needs_repair: "Ta'mir talab"
      };
      return labels[key] ?? pick(v);
    };
    const photosCount = Array.isArray(listing?.photos) ? listing.photos.length : 0;
    return [
      "🔔 YANGI E'LON KELDI!",
      `👤 User: ${pick(submitterName)}`,
      `■ 🏠 Uy turi: ${mapHouseType(listing?.house_type)}`,
      `■ 👥 Kimlarga: ${mapTenantType(listing?.tenant_type)}`,
      `■ ✨ Holati: ${mapCondition(listing?.condition)}`,
      `■ 🖼️ Rasmlar: ${photosCount}`,
      `■ 📍 Viloyat: ${pick(listing?.region)}`,
      `■ 📍 Tuman: ${pick(listing?.district)}`,
      `■ 🚪 Xonalar: ${pick(listing?.rooms)}`,
      `■ 📐 Maydon: ${pick(listing?.area)}`,
      `■ 🏢 Qavatlar soni: ${pick(listing?.total_floors)}`,
      `■ 🏢 Joylashgan qavat: ${pick(listing?.current_floor)}`,
      `■ 💰 Narx: ${pick(listing?.price)} ${pick(listing?.price_currency)}`,
      `■ 📞 Telefon: ${pick(listing?.contact_phone)}`,
      `▫️ ID: ${pick(listing?.id)}`
    ].join('\n');
  }

  async sendNewListingNotification(telegram, listing, submitterName) {
    const targetChatId = this.getModerationTargetChatId();
    if (!targetChatId || !listing?.id) return false;
    const text = this._formatNewListingNotificationText(listing, submitterName);
    const keyboard = this._moderationKeyboard(listing.id, 'ru');
    await this._sendSeparatedListingDelivery(telegram, targetChatId, listing?.photos, { text, keyboard });
    return true;
  }

  _extractListingMedia(listing) {
    const photos = Array.isArray(listing?.photos)
      ? listing.photos
      : (Array.isArray(listing?.images) ? listing.images : []);
    const paymentProof = listing?.payment_proof ?? listing?.payment_screenshot ?? null;
    return {
      paymentProof: typeof paymentProof === 'string' ? paymentProof.trim() : null,
      photos: photos
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    };
  }

  _isValidHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  _isSafePhotoInput(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (!this._isValidHttpUrl(trimmed)) return false;
      if (trimmed.includes('/storage/v1/object/') && !trimmed.includes('/storage/v1/object/public/')) {
        return false;
      }
      return true;
    }
    return true;
  }

  _getValidListingPhotos(listing) {
    if (!Array.isArray(listing?.photos)) return [];
    return listing.photos.filter((p) => this._isSafePhotoInput(p));
  }

  async _sendSeparatedListingDelivery(telegram, chatId, photos, { text, keyboard = null, parseMode = null } = {}) {
    const validPhotos = Array.isArray(photos) ? photos.filter((p) => this._isSafePhotoInput(p)) : [];
    if (validPhotos.length > 1) {
      const media = validPhotos.map((photo) => ({
        type: 'photo',
        media: photo
      }));
      await telegram.sendMediaGroup(chatId, media);
    } else if (validPhotos.length === 1) {
      await telegram.sendPhoto(chatId, validPhotos[0]);
    }
    const messageText = (typeof text === 'string' && text.trim()) ? text : ' ';
    try {
      await telegram.sendMessage(chatId, messageText, {
        ...(parseMode ? { parse_mode: parseMode } : {}),
        link_preview_options: { is_disabled: false },
        ...(keyboard ?? {})
      });
    } catch (error) {
      console.error('[admin] text+buttons send failed, retrying plain message:', error);
      await telegram.sendMessage(chatId, messageText, {
        link_preview_options: { is_disabled: false },
        ...(keyboard ?? {})
      });
    }
    return true;
  }

  _formatChannelCaption(listing) {
    const region = listing?.region ?? 'N/A';
    const district = listing?.district ?? 'N/A';
    const rooms = listing?.rooms ?? 'N/A';
    const price = listing?.price ?? 'N/A';
    const tenant = listing?.tenant_type ?? 'N/A';
    const phone = listing?.contact_phone ?? 'N/A';
    return [
      '🏠 #Uy #Ijaraga',
      `📍 Location: ${region}, ${district}`,
      `🚪 Rooms: ${rooms}`,
      `💰 Price: ${price}`,
      `👤 For: ${tenant}`,
      `📞 Contact: ${phone}`
    ].join('\n');
  }

  _formatChannelCaptionWithContacts(listing, contacts) {
    const region = listing?.region ?? 'N/A';
    const district = listing?.district ?? 'N/A';
    const rooms = listing?.rooms ?? 'N/A';
    const price = listing?.price ?? 'N/A';
    const tenant = listing?.tenant_type ?? 'N/A';
    const phone = contacts?.contact_phone ?? listing?.contact_phone ?? 'N/A';
    const lines = [
      '🏠 #Uy #Ijaraga',
      `📍 Location: ${region}, ${district}`,
      `🚪 Rooms: ${rooms}`,
      `💰 Price: ${price}`,
      `👤 For: ${tenant}`,
      `📞 Contact: ${phone}`
    ];
    if (contacts?.telegram_link) lines.push(`🔗 Telegram: ${contacts.telegram_link}`);
    if (contacts?.instagram_link) lines.push(`🔗 Instagram: ${contacts.instagram_link}`);
    if (contacts?.youtube_link) lines.push(`🔗 YouTube: ${contacts.youtube_link}`);
    if (contacts?.admin_contact_link) lines.push(`🧑‍💼 Admin: ${contacts.admin_contact_link}`);
    return lines.join('\n');
  }

  _formatChannelCyrillicPost(listing, settings) {
    const tenantTypeKey = listing?.tenant_type ?? null;
    const houseTypeKey = listing?.house_type ?? listing?.type ?? null;
    const conditionKey = listing?.condition ?? null;
    const location = listing?.location ?? [listing?.region, listing?.district].filter(Boolean).join(', ');
    const safe = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
    const has = (v) => !(v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '-' || String(v).trim() === '—');
    const mdLink = (label, url) => {
      if (typeof url !== 'string' || !url.trim()) return label;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return label;
        return `[${label}](${url})`;
      } catch {
        return label;
      }
    };
    const mapEnum = (section, key) =>
      (key && CHANNEL_ENUM_MAPPING?.[section]?.[key]?.ru_krill) ? CHANNEL_ENUM_MAPPING[section][key].ru_krill : '-';

    const lines = ['🏠 КВАРТИРА МАЪЛУМОТЛАРИ', '🏢 *Ижарага квартира*', ''];

    lines.push(`■ Хоналар: ${safe(listing?.rooms)}`);
    {
      const mapped = mapEnum('tenant_type', tenantTypeKey);
      lines.push(`👥 Кимларга: ${mapped}`);
    }
    {
      const mapped = mapEnum('house_types', houseTypeKey);
      lines.push(`■ Уй тури: ${mapped}`);
    }
    lines.push(`■ Жойлашуви: ${safe(location)}`);
    lines.push(`■ Умумий майдон: ${safe(listing?.square_meters ?? listing?.area ?? '-')} м²`);
    lines.push(`■ Қаватлар сони: ${safe(listing?.total_floors ?? '-')}`);
    lines.push(`■ Жойлашган қават: ${safe(listing?.floor ?? listing?.current_floor ?? '-')}`);
    {
      const mapped = mapEnum('conditions', conditionKey);
      lines.push(`■ Ҳолати: ${mapped}`);
    }
    lines.push(`■ Нархи: ${safe(listing?.price)} $`);

    lines.push('', `💬 Тел: ${safe(settings?.contact_phone ?? '+998999267280')} (Admin)`, '');
    lines.push(
      `📱 ${mdLink('Telegram', settings?.telegram_link ?? 'https://t.me/buxoro_ijara')} 📸 ${mdLink('Instagram', settings?.instagram_link ?? 'https://instagram.com')} 📺 ${mdLink('YouTube', settings?.youtube_link ?? 'https://youtube.com')}`,
      ''
    );

    return lines.join('\n');
  }

  _channelPostInlineKeyboard(settings, listingPhone = null) {
    const rawPhone = (listingPhone ?? settings?.contact_phone ?? '+998999267280').toString().trim();
    const digits = rawPhone.replace(/[^\d]/g, '');
    const normalizedPhone = digits || '998999267280';
    const callUrl = `tg://resolve?phone=${normalizedPhone}`;
    return Markup.inlineKeyboard([
      [Markup.button.url("📞 Qo'ng'iroq qilish", callUrl)],
      [Markup.button.url("✅ E'lon berish", 'https://t.me/BOT_USERNAME_SHU_YERGA')],
      [Markup.button.url('👨‍💻 Adminga murojaat', settings?.admin_contact_link ?? 'https://t.me/admin_link')]
    ]);
  }

  _safeChannelSettings(rawSettings) {
    const safeHttp = (value, fallback) => (this._isValidHttpUrl(value) ? value : fallback);
    return {
      contact_phone: String(rawSettings?.contact_phone ?? '+998999267280').trim() || '+998999267280',
      telegram_link: safeHttp(rawSettings?.telegram_link, 'https://t.me/buxoro_ijara'),
      instagram_link: safeHttp(rawSettings?.instagram_link, 'https://instagram.com'),
      youtube_link: safeHttp(rawSettings?.youtube_link, 'https://youtube.com'),
      admin_contact_link: safeHttp(rawSettings?.admin_contact_link, 'https://t.me/admin_link')
    };
  }

  _settingsKeyboard(lang) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(lang === 'ru' ? '📞 Телефон' : '📞 Telefon', 'as:contact_phone')],
      [Markup.button.callback('Telegram', 'as:telegram_link')],
      [Markup.button.callback('Instagram', 'as:instagram_link')],
      [Markup.button.callback('YouTube', 'as:youtube_link')],
      [Markup.button.callback(lang === 'ru' ? '🧑‍💼 Контакт админа' : '🧑‍💼 Admin kontakt', 'as:admin_contact_link')],
      [Markup.button.callback(tAdmin(lang, 'back_button'), 'admin_back')]
    ]);
  }

  _settingsPrompt(lang, field) {
    const labels = {
      contact_phone: lang === 'ru' ? 'телефон' : 'telefon',
      telegram_link: 'Telegram link',
      instagram_link: 'Instagram link',
      youtube_link: 'YouTube link',
      admin_contact_link: lang === 'ru' ? 'ссылку для связи с админом' : 'admin bilan bog‘lanish linki'
    };
    return lang === 'ru'
      ? `Отправьте ${labels[field] ?? 'значение'} (или "-" чтобы очистить).`
      : `${labels[field] ?? 'qiymat'} yuboring (tozalash uchun "-" yuboring).`;
  }

  async _showSettings(ctx, { notice = null } = {}) {
    const lang = await this._resolveAdminLang(ctx);
    const contacts = await this.settings.getPublicContacts();
    const lines = [];
    if (notice) lines.push(notice, '');
    lines.push(lang === 'ru' ? '⚙️ Настройки' : '⚙️ Sozlamalar');
    lines.push(`contact_phone: ${contacts.contact_phone ?? '—'}`);
    lines.push(`telegram_link: ${contacts.telegram_link ?? '—'}`);
    lines.push(`instagram_link: ${contacts.instagram_link ?? '—'}`);
    lines.push(`youtube_link: ${contacts.youtube_link ?? '—'}`);
    lines.push(`admin_contact_link: ${contacts.admin_contact_link ?? '—'}`);
    await ctx.reply(lines.join('\n'), { ...this._settingsKeyboard(lang) });
  }

  async showModeration(ctx, { notice = null } = {}) {
    console.log('[AdminController] showModeration called', { notice });
    try {
      const lang = await this._resolveAdminLang(ctx);
      const listing = await this.admin.getPendingListing();
      if (!listing) {
        await ctx.reply(tAdmin(lang, 'moderation_empty'), { ...adminMenuInlineKeyboardByLang(lang) });
        return true;
      }
      const { photos } = this._extractListingMedia(listing);
      const mediaGroup = photos
        .filter((p) => this._isSafePhotoInput(p))
        .map((p) => ({ type: 'photo', media: p }));
      if (mediaGroup.length > 0) {
        await ctx.telegram.sendMediaGroup(ctx.chat.id, mediaGroup)
          .catch((e) => console.error('[admin.showModeration] sendMediaGroup failed:', e));
      }
      const text = this._formatModerationText(listing, lang);
      const messageText = notice ? `${notice}\n\n${text}` : text;
      await ctx.reply(messageText, { ...this._moderationKeyboard(listing.id, lang) });
      return true;
    } catch (error) {
      console.error('[admin.showModeration] error:', error);
      const lang = await this._resolveAdminLang(ctx);
      await ctx.reply(tAdmin(lang, 'generic_error'));
      return true;
    }
  }

  async _showAdminMgmt(ctx, { notice = null } = {}) {
    const lang = await this._resolveAdminLang(ctx);
    const adminIds = await this.settings.getAdminIds();
    const prefix = notice ? `${notice}\n\n` : '';
    const body = adminIds.length
      ? `${prefix}${tAdmin(lang, 'admin_mgmt_title')}:\n${adminIds.map((id) => `• ${id}`).join('\n')}`
      : `${prefix}${tAdmin(lang, 'admin_mgmt_empty')}`;
    await ctx.reply(body, { ...adminManageAdminsKeyboard(lang, adminIds) });
  }

  async handleAdminCommand(ctx) {
    console.log('[AdminController] handleAdminCommand called', { fromId: ctx.from?.id });
    if (!(await this._isAdmin(ctx))) return false;
    const lang = await this._resolveAdminLang(ctx);
    this._getSession(ctx.from.id).mode = null;
    this._getSession(ctx.from.id).field = null;
    await ctx.reply(tAdmin(lang, 'menu_title'), { ...Markup.removeKeyboard() });
    await ctx.reply(tAdmin(lang, 'menu_title'), { ...adminMenuInlineKeyboardByLang(lang) });
    return true;
  }

  async handleCallback(ctx, data) {
    console.log('[AdminController] handleCallback called', { fromId: ctx.from?.id, data });
    await ctx.answerCbQuery().catch(() => {});
    if (!(await this._isAdmin(ctx))) return false;
    try {
      const lang = await this._resolveAdminLang(ctx);
      const s = this._getSession(ctx.from.id);

      if (data === 'admin_stats') {
        s.mode = null;
        s.field = null;
        const stats = await this.admin.getStats();
        await ctx.reply(
          [
            tAdmin(lang, 'stats_button'),
            `${lang === 'ru' ? '👤 Пользователи' : '👤 Foydalanuvchilar'}: ${stats.users}`,
            `${lang === 'ru' ? '🏠 Объявления' : "🏠 E'lonlar"}: ${stats.listings.total}`,
            `${lang === 'ru' ? '✅ Одобрено' : '✅ Tasdiqlangan'}: ${stats.listings.approved}`,
            `${lang === 'ru' ? '⏳ Ожидают' : '⏳ Kutilmoqda'}: ${stats.listings.pending}`
          ].join('\n'),
          { ...adminSubMenuBackInlineKeyboardByLang(lang) }
        );
        return true;
      }

      if (data === 'admin_manage_admins') {
        s.mode = null;
        s.field = null;
        await this._showAdminMgmt(ctx);
        return true;
      }

      if (data === 'admin_add_admin') {
        s.mode = 'awaiting_input';
        s.field = 'admin_id';
        await ctx.reply(tAdmin(lang, 'admin_mgmt_add_prompt'), { ...adminSubMenuBackInlineKeyboardByLang(lang) });
        return true;
      }

      if (data.startsWith('admin_rm:')) {
        const targetId = data.slice('admin_rm:'.length).trim();
        await this.settings.removeAdminId(targetId);
        await this._showAdminMgmt(ctx, { notice: tAdmin(lang, 'admin_mgmt_removed', { id: targetId }) });
        return true;
      }

      if (data === 'admin_broadcast') {
        s.mode = 'broadcast';
        s.field = null;
        await ctx.reply(tAdmin(lang, 'broadcast_prompt'), { ...adminSubMenuBackInlineKeyboardByLang(lang) });
        return true;
      }

      if (data === 'admin_moderation') {
        s.mode = null;
        s.field = null;
        await this.showModeration(ctx);
        return true;
      }

      if (data === 'admin_settings') {
        s.mode = null;
        s.field = null;
        await this._showSettings(ctx);
        return true;
      }

      if (data.startsWith('as:')) {
        const field = data.slice('as:'.length).trim();
        const allowed = new Set([
          'contact_phone',
          'telegram_link',
          'instagram_link',
          'youtube_link',
          'admin_contact_link'
        ]);
        if (!allowed.has(field)) {
          await ctx.reply(tAdmin(lang, 'generic_error'));
          return true;
        }
        s.mode = 'settings';
        s.field = field;
        await ctx.reply(this._settingsPrompt(lang, field), { ...adminSubMenuBackInlineKeyboardByLang(lang) });
        return true;
      }

      const _modMatch = buildModerationCallbackRegex().exec(data);
      if (_modMatch) {
        s.mode = null;
        s.field = null;
        const isApprove = _modMatch[1] === CALLBACKS.ADMIN_APPROVE_PREFIX;
        const listingId = _modMatch[2];
        const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRe.test(listingId)) {
          await ctx.reply(tAdmin(lang, 'generic_error'));
          return true;
        }

        if (isApprove) {
          console.log('[AdminController] approve callback reached', { listingId, data, fromId: ctx.from?.id });
          const updated = await this.admin.approveListing(listingId);
          if (updated && env.CHANNEL_ID) {
            console.log('Listing object before post:', updated);
            const photos = this._getValidListingPhotos(updated);
            const rawSettings = await this.settings.getPublicContacts().catch(() => null);
            const settings = this._safeChannelSettings(rawSettings ?? {});
            const caption = this._formatChannelCyrillicPost(updated, settings);
            const postKeyboard = this._channelPostInlineKeyboard(settings, updated?.contact_phone ?? null);
            await this._sendSeparatedListingDelivery(ctx.telegram, env.CHANNEL_ID, photos, {
              text: caption,
              keyboard: postKeyboard,
              parseMode: 'Markdown'
            }).catch((e) => console.error('[admin] channel publish failed:', e));
          }
          const ownerId = Number(updated?.user_id);
          if (Number.isFinite(ownerId)) {
            const userLang = await this.admin.getUserLanguage(ownerId);
            await ctx.telegram
              .sendMessage(ownerId, translate('listing_approved_user', userLang))
              .catch(() => {});
          }
          await ctx.deleteMessage().catch(() => {});
          await this.showModeration(ctx);
        } else {
          await ctx.deleteMessage().catch(() => {});
          ctx.session.adminAction = 'WAITING_REJECT_REASON';
          ctx.session.targetListingId = listingId;
          await ctx.reply(tAdmin(lang, 'moderation_ask_reject_reason'));
        }
        return true;
      }

      if (data === 'admin_back') {
        s.mode = null;
        s.field = null;
        await ctx.reply(tAdmin(lang, 'menu_title'), { ...adminMenuInlineKeyboardByLang(lang) });
        return true;
      }

      if (data === 'admin_exit') {
        s.mode = null;
        s.field = null;
        await ctx.deleteMessage().catch(() => {});
        const t = (k, v) => translate(k, lang, v);
        const isAdmin = await isPrivilegedAdmin(ctx.from?.id, this.settings);
        await ctx.reply(`${t('welcome')}\n\n${t('main_menu_hint')}`, {
          ...mainMenuReplyKeyboard(t, { includeAdminPanel: Boolean(isAdmin), adminPanelLabel: t('admin_panel_button') })
        });
        return true;
      }

      return false;
    } catch (error) {
      console.log(error);
      const lang = await this._resolveAdminLang(ctx);
      await ctx.reply(tAdmin(lang, 'generic_error'));
      return true;
    }
  }

  async _runBroadcast(ctx) {
    console.log('[AdminController] _runBroadcast called', { fromId: ctx.from?.id });
    const lang = await this._resolveAdminLang(ctx);
    const users = await this.admin.getAllUserIds();
    const fromChatId = ctx.chat?.id;
    const messageId = ctx.message?.message_id;
    console.log('Starting broadcast to', users.length, 'users', { fromChatId, messageId });
    if (!fromChatId || !messageId) {
      console.error('Broadcast missing fromChatId/messageId');
      await ctx.reply(tAdmin(lang, 'broadcast_context_missing'));
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const telegramId of users) {
      try {
        await ctx.telegram.copyMessage(telegramId, fromChatId, messageId);
        successCount += 1;
      } catch (error) {
        console.error('Broadcast send failed:', { telegramId, error: error?.message ?? String(error) });
        failCount += 1;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    await ctx.reply(
      lang === 'ru'
        ? `✅ Рассылка завершена. Успешно: ${successCount}, Ошибок: ${failCount}`
        : `✅ Reklama yakunlandi. Muvaffaqiyatli: ${successCount}, Xatolar: ${failCount}`,
      { ...adminMenuInlineKeyboardByLang(lang) }
    );
  }

  async handleMedia(ctx) {
    console.log('[AdminController] handleMedia called', { fromId: ctx.from?.id });
    if (!(await this._isAdmin(ctx))) return false;
    const s = this._getSession(ctx.from.id);
    if (s.mode !== 'broadcast') return false;
    s.mode = null;
    s.field = null;
    await this._runBroadcast(ctx);
    return true;
  }

  async handleText(ctx, text) {
    console.log('[AdminController] handleText called', { fromId: ctx.from?.id, text, adminAction: ctx.session?.adminAction });
    if (!(await this._isAdmin(ctx))) return false;
    const lang = await this._resolveAdminLang(ctx);
    const s = this._getSession(ctx.from.id);
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return true;

    if (ctx.session?.adminAction === 'WAITING_REJECT_REASON') {
      const listingId = ctx.session.targetListingId;
      ctx.session.adminAction = null;
      ctx.session.targetListingId = null;
      const updated = await this.admin.rejectListing(listingId, trimmed);
      const ownerId = Number(updated?.user_id);
      if (Number.isFinite(ownerId)) {
        const userLang = await this.admin.getUserLanguage(ownerId);
        await ctx.telegram
          .sendMessage(
            ownerId,
            `${translate('listing_rejected_user', userLang)}\n\n${tAdmin(userLang, 'moderation_reject_reason_label')}: ${trimmed}`
          )
          .catch(() => {});
      }
      await this.showModeration(ctx);
      return true;
    }

    if (s.mode === 'broadcast') {
      s.mode = null;
      s.field = null;
      await this._runBroadcast(ctx);
      return true;
    }

    if (s.mode === 'awaiting_input' && s.field === 'admin_id') {
      if (!/^\d+$/.test(trimmed)) {
        await ctx.reply(tAdmin(lang, 'admin_mgmt_invalid_id'));
        return true;
      }
      s.mode = null;
      s.field = null;
      await this.settings.addAdminId(trimmed);
      await this._showAdminMgmt(ctx, { notice: tAdmin(lang, 'admin_mgmt_added', { id: trimmed }) });
      return true;
    }

    if (s.mode === 'settings' && s.field) {
      const field = s.field;
      s.mode = null;
      s.field = null;

      const nextValue = trimmed === '-' ? null : trimmed;
      if (field !== 'contact_phone' && nextValue !== null && !this._isValidHttpUrl(nextValue)) {
        await ctx.reply(lang === 'ru' ? 'Нужна ссылка http(s).' : 'http(s) link yuboring.');
        return true;
      }

      const keyByField = {
        contact_phone: SETTINGS_KEYS.CONTACT_PHONE,
        telegram_link: SETTINGS_KEYS.TELEGRAM_LINK,
        instagram_link: SETTINGS_KEYS.INSTAGRAM_LINK,
        youtube_link: SETTINGS_KEYS.YOUTUBE_LINK,
        admin_contact_link: SETTINGS_KEYS.ADMIN_CONTACT_LINK
      };
      const settingKey = keyByField[field];
      if (!settingKey) {
        await ctx.reply(tAdmin(lang, 'generic_error'));
        return true;
      }

      await this.settings.set(settingKey, nextValue);
      await this._showSettings(ctx, { notice: translate('admin_settings_saved', lang) });
      return true;
    }

    return false;
  }
}

