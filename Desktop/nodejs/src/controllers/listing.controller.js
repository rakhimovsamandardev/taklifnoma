import listingStates from '../config/listing.constants.js';
import { Markup } from 'telegraf';
import { CALLBACKS } from '../config/constants.js';
import {
  tenantTypeInlineKeyboard,
  roomsInlineKeyboard,
  houseTypeInlineKeyboard,
  conditionInlineKeyboard,
  confirmInlineKeyboard,
  mainMenuReplyKeyboard,
  regionReplyKeyboard,
  districtReplyKeyboard,
  phoneReplyKeyboard,
  backOnlyReplyKeyboard
} from '../utils/keyboard.js';
import { resolveRegionByLabel } from '../utils/locations.js';
import { listingSummary as formatListingSummary } from '../utils/formatters.js';
import { translate } from '../services/translation.service.js';
import { runSequential } from '../utils/updateQueue.js';
import { isPrivilegedAdmin } from '../utils/adminAccess.js';
import { log } from '../utils/logger.js';

/** @returns {(k: string, vars?: Record<string, string | number>) => string} */
function mkTranslate(lang) {
  return (k, v) => translate(k, lang, v);
}

/** Extra line when there is no reply keyboard — guides typing in the input field. */
function withInputHint(t, mainKey, hintKey, vars) {
  const body = vars !== undefined ? t(mainKey, vars) : t(mainKey);
  return `${body}\n\n${t(hintKey)}`;
}


export class ListingController {
  constructor(listingService, stateService, authController, settingsService, adminController = null) {
    this.listings = listingService;
    this.states = stateService;
    this.auth = authController;
    this.settings = settingsService;
    this.adminController = adminController;
  }

  async clearAdminButtons(ctx) {
    if (!ctx.callbackQuery?.message) return;
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {
      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch {}
    }
  }

  formatChannelCaption(listing, tUz) {
    const isMeaningful = (v) => {
      if (v === null || v === undefined) return false;
      const s = String(v).trim();
      return s !== '' && s !== '-' && s !== '—' && s.toLowerCase() !== 'n/a';
    };
    const region = listing?.region ?? null;
    const district = listing?.district ?? null;
    const rooms = listing?.rooms ?? null;
    const price = listing?.price ?? null;
    const tenantKey = listing?.tenant_type ? `tenant_type_${listing.tenant_type}` : null;
    const tenant = tenantKey ? tUz(tenantKey) : null;
    const phone = listing?.contact_phone ?? null;
    const currency = listing?.price_currency === 'USD' ? '$' : "so'm";

    const lines = [`🏠 #Uy #Ijaraga`];
    const loc = [region, district].filter(isMeaningful).join(', ');
    if (isMeaningful(loc)) lines.push(`📍 Location: ${loc}`);
    if (isMeaningful(rooms)) lines.push(`🚪 Rooms: ${rooms}`);
    if (isMeaningful(price)) lines.push(`💰 Price: ${new Intl.NumberFormat('en-US').format(Number(price))} ${currency}`);
    if (isMeaningful(tenant)) lines.push(`👤 For: ${tenant}`);
    if (isMeaningful(phone)) lines.push(`📞 Contact: ${phone}`);

    return lines.join('\n');
  }

  enqueueIncomingPhoto(ctx, fileId, mediaGroupId) {
    const uid = ctx.from.id;
    this.listings.enqueuePhoto(uid, mediaGroupId, fileId, (batch) =>
      runSequential(uid, async () => {
        const outcome = await this.listings.onPhotoFlush(uid, batch);
        const lang = ctx.state.lang;
        const t = mkTranslate(lang);
        if (outcome.type === 'ignore') return;
        if (outcome.type === 'need_more_photos') {
          await this.replyWithMarkup(ctx, withInputHint(t, 'ask_photos', 'placeholder_photos_inline'), Markup.removeKeyboard());
          return;
        }
        if (outcome.type === 'advanced_to_region') {
          const record = await this.states.getUserRecord(uid);
          const totalPhotos = record.stateData?.photos?.length ?? batch.length;
          await this.replyWithMarkup(
            ctx,
            `${t('photos_saved', { count: totalPhotos })}\n\n${t('ask_region')}`,
            regionReplyKeyboard(t, lang)
          );
        }
      })
    );
  }

  /**
   * @param {object} [opts]
   * @param {string} [opts.prefix] — prepended validation error or hint (same bubble as prompt)
   */
  async sendListingPrompt(ctx, opts = {}) {
    const lang = ctx.state.lang;
    const t = mkTranslate(lang);
    const uid = ctx.from.id;
    const record = await this.states.getUserRecord(uid);
    const head = opts.prefix ? `${opts.prefix}\n\n` : '';
    switch (record.state) {
      case listingStates.ADD_HOUSE_TENANT_TYPE:
        await this.replyWithMarkup(ctx, `${head}${t('ask_tenant_type')}`, tenantTypeInlineKeyboard(t));
        return;
      case listingStates.ADD_HOUSE_PHOTOS:
        await this.replyWithMarkup(
          ctx,
          `${head}${withInputHint(t, 'ask_photos', 'placeholder_photos_inline')}`,
          Markup.removeKeyboard()
        );
        return;
      case listingStates.ADD_HOUSE_ROOMS:
        await this.replyWithMarkup(ctx, `${head}${t('ask_rooms')}`, roomsInlineKeyboard(t));
        return;
      case listingStates.ADD_HOUSE_TYPE:
        await this.replyWithMarkup(ctx, `${head}${t('ask_type')}`, houseTypeInlineKeyboard(t));
        return;
      case listingStates.ADD_HOUSE_REGION:
        await this.replyWithMarkup(ctx, `${head}${t('ask_region')}`, regionReplyKeyboard(t, lang));
        return;
      case listingStates.ADD_HOUSE_DISTRICT: {
        const selected = resolveRegionByLabel(record.stateData.address?.region ?? '', lang);
        if (!selected) {
          await this.replyWithMarkup(ctx, `${head}${t('ask_region')}`, regionReplyKeyboard(t, lang));
          return;
        }
        await this.replyWithMarkup(
          ctx,
          `${head}${t('ask_district', { region: selected.label })}`,
          districtReplyKeyboard(t, lang, selected.key)
        );
        return;
      }
      case listingStates.ADD_HOUSE_AREA:
        await this.replyWithMarkup(
          ctx,
          `${head}${withInputHint(t, 'ask_area', 'placeholder_area_inline')}`,
          backOnlyReplyKeyboard(t, 'placeholder_area_inline')
        );
        return;
      case listingStates.ADD_HOUSE_TOTAL_FLOORS:
        await this.replyWithMarkup(
          ctx,
          `${head}${withInputHint(t, 'ask_total_floors', 'placeholder_total_floors_inline')}`,
          backOnlyReplyKeyboard(t, 'placeholder_total_floors_inline')
        );
        return;
      case listingStates.ADD_HOUSE_CURRENT_FLOOR:
        await this.replyWithMarkup(
          ctx,
          `${head}${withInputHint(t, 'ask_current_floor', 'placeholder_current_floor_inline')}`,
          backOnlyReplyKeyboard(t, 'placeholder_current_floor_inline')
        );
        return;
      case listingStates.ADD_HOUSE_CONDITION:
        await this.replyWithMarkup(ctx, `${head}${t('ask_condition')}`, conditionInlineKeyboard(t));
        return;
      case listingStates.ADD_HOUSE_PRICE:
        await this.replyWithMarkup(
          ctx,
          `${head}${withInputHint(t, 'ask_price', 'placeholder_price_inline')}`,
          backOnlyReplyKeyboard(t, 'placeholder_price_inline')
        );
        return;
      case listingStates.ADD_HOUSE_PHONE:
        await this.replyWithMarkup(
          ctx,
          `${head}${withInputHint(t, 'ask_phone', 'placeholder_phone_inline')}`,
          phoneReplyKeyboard(t)
        );
        return;
      case listingStates.ADD_HOUSE_CONFIRM: {
        const summary = formatListingSummary(record.stateData ?? {}, t);
        await this.replyWithMarkup(ctx, `${head}${t('confirm_prompt')}\n\n${summary}`, confirmInlineKeyboard(t));
        return;
      }
      default:
        return;
    }
  }

  /**
   * Reply Keyboard actions while user is IDLE (main menu).
   * @returns {Promise<boolean>} true if the message was handled
   */
  async handleIdleText(ctx, text) {
    const lang = ctx.state.lang;
    const t = mkTranslate(lang);
    const trimmed = text.trim();
    const isAdmin = await isPrivilegedAdmin(ctx.from?.id, this.settings);
    const mainMenuKeyboard = mainMenuReplyKeyboard(t, { includeAdminPanel: Boolean(isAdmin) });
    if (trimmed === t('btn_add_house')) {
      const res = await this.listings.consumeCallback(ctx.from.id, CALLBACKS.MENU_ADD_HOUSE);
      if (res.type === 'accepted' && res.action === 'start_flow') {
        await this.sendListingPrompt(ctx);
      }
      return true;
    }
    if (trimmed === t('btn_language')) {
      await this.auth.promptChangeLanguage(ctx);
      return true;
    }
    if (trimmed === t('btn_my_profile')) {
      await this.replyWithMarkup(ctx, t('profile_soon'), mainMenuKeyboard);
      return true;
    }
    await this.replyWithMarkup(ctx, t('idle_unknown_action'), mainMenuKeyboard);
    return true;
  }

  async handleListingText(ctx, text) {
    const lang = ctx.state.lang;
    const t = mkTranslate(lang);
    const uid = ctx.from.id;
    const before = await this.states.getUserRecord(uid);
    const trimmed = text.trim();

    if (before.state === listingStates.ADD_HOUSE_PHOTOS && trimmed !== t('btn_back')) {
      await this.replyWithMarkup(
        ctx,
        `${t('warn_photo_only')}\n\n${withInputHint(t, 'ask_photos', 'placeholder_photos_inline')}`,
        Markup.removeKeyboard()
      );
      return;
    }

    const res = await this.listings.consumeTextAnswer(uid, text);
    if (res.type === 'ignore') {
      if (!this.listings.isInListingFlow(before.state)) return;
      await this.replyWithMarkup(
        ctx,
        `${t('use_buttons')}\n\n${t('reprompt_fallback')}`,
        Markup.removeKeyboard()
      );
      await this.sendListingPrompt(ctx);
      return;
    }

    if (res.type === 'error') {
      await this.sendListingPrompt(ctx, { prefix: t(res.errorKey) });
      return;
    }

    if (res.type === 'accepted' && res.action === 'saved') {
      await this.replyWithMarkup(ctx, t('listing_submitted_moderation'), Markup.removeKeyboard());
      await this.auth.sendMainMenu(ctx, lang);
      return;
    }
    if (res.type === 'accepted' && res.action === 'cancelled') {
      await this.replyWithMarkup(ctx, t('listing_cancelled'), Markup.removeKeyboard());
      await this.auth.sendMainMenu(ctx, lang);
      return;
    }

    if (res.type === 'accepted' && res.action === 'price_parsed') {
      await this.replyWithMarkup(ctx, t('price_saved', { price: res.displayPrice ?? res.parsedPrice }), Markup.removeKeyboard());
    }

    await this.sendListingPrompt(ctx);
  }

  async handleListingLocation(ctx, location) {
    const lang = ctx.state.lang;
    const t = mkTranslate(lang);
    const res = await this.listings.consumeLocation(ctx.from.id, location);
    if (res.type === 'ignore') return;
    if (res.action === 'location_captured') {
      await this.sendListingPrompt(ctx, { prefix: t('location_received') });
    }
  }

  async handleListingContact(ctx, contact) {
    const lang = ctx.state.lang;
    const t = mkTranslate(lang);
    const res = await this.listings.consumeContact(ctx.from.id, contact);
    if (res.type === 'ignore') return;
    if (res.type === 'error') {
      await this.sendListingPrompt(ctx, { prefix: t(res.errorKey) });
      return;
    }
    await this.sendListingPrompt(ctx);
  }

  /**
   * Caller must answer callback query before invoking.
   * @returns {Promise<boolean>} true when callback is consumed.
   */
  async routeCallback(ctx, data) {
    const lang = ctx.state.lang;
    const t = mkTranslate(lang);

    const res = await this.listings.consumeCallback(ctx.from.id, data);
    if (res.type === 'ignore') return false;
    if (res.type === 'error') {
      await this.sendListingPrompt(ctx, { prefix: t(res.errorKey) });
      return true;
    }
    if (res.action === 'start_flow') {
      await this.sendListingPrompt(ctx);
      return true;
    }
    if (res.action === 'went_back') {
      await this.sendListingPrompt(ctx);
      return true;
    }
    if (res.action === 'saved') {
      try {
        const listing = await this.listings.getListingById(res.listingId);
        if (listing && this.adminController?.sendNewListingNotification) {
          await this.adminController.sendNewListingNotification(ctx.telegram, listing, ctx.from?.first_name ?? 'Unknown');
        }
      } catch (error) {
        log.error('admin notification failed after listing confirm', {
          listingId: res.listingId,
          error: error?.message ?? String(error)
        });
      }
      await this.replyWithMarkup(ctx, t('listing_submitted_moderation'), Markup.removeKeyboard());
      await this.auth.sendMainMenu(ctx, lang);
      return true;
    }
    if (res.action === 'cancelled') {
      await this.replyWithMarkup(ctx, t('listing_cancelled'), Markup.removeKeyboard());
      await this.auth.sendMainMenu(ctx, lang);
      return true;
    }
    await this.sendListingPrompt(ctx);
    return true;
  }

  async replyWithMarkup(ctx, text, markup) {
    if (ctx.callbackQuery?.message?.message_id && markup?.reply_markup) {
      try {
        await ctx.editMessageText(text, { reply_markup: markup.reply_markup });
        return;
      } catch {
        // fall back to sending a normal message when edit is not possible
      }
    }
    if (!markup) {
      await ctx.reply(text, { ...Markup.removeKeyboard() });
      return;
    }
    await ctx.reply(text, { ...markup });
  }
}
