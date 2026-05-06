import { CALLBACKS, SUPPORTED_LANGS } from '../config/constants.js';
import listingStates from '../states/listingStates.js';
import { languageInlineKeyboard, languageReplyKeyboard, mainMenuReplyKeyboard } from '../utils/keyboard.js';
import { translate } from '../services/translation.service.js';
import { isPrivilegedAdmin } from '../utils/adminAccess.js';

export class AuthController {
  constructor(userService, stateService, settingsService) {
    this.users = userService;
    this.states = stateService;
    this.settings = settingsService;
  }

  /**
   * Resolves Telegram button label / code to a supported language code.
   * @param {string} text
   * @param {(k: string, vars?: Record<string, string | number>) => string} t
   * @returns {string | null}
   */
  static resolveLanguageFromReply(text, t) {
    const trimmed = text.trim();
    for (const code of SUPPORTED_LANGS) {
      if (trimmed === t(`reply_lang_${code}`)) return code;
    }
    return null;
  }

  /**
   * /start: new users see language Reply Keyboard; returning users see the main menu.
   */
  async handleStart(ctx) {
    const lang = ctx.state.lang ?? 'uz';
    const t = (k, v) => translate(k, lang, v);
    const awaiting = ctx.state.dbUser?.stateData?.awaiting_language_selection === true;
    if (awaiting) {
      await ctx.reply(t('start_greeting'), { ...languageReplyKeyboard(t) });
      return;
    }
    await this.sendMainMenu(ctx, lang);
  }

  async sendMainMenu(ctx, lang) {
    const t = (k, v) => translate(k, lang, v);
    const isAdmin = await isPrivilegedAdmin(ctx.from?.id, this.settings);
    await ctx.reply(`${t('welcome')}\n\n${t('main_menu_hint')}`, {
      ...mainMenuReplyKeyboard(t, {
        includeAdminPanel: Boolean(isAdmin),
        adminPanelLabel: t('admin_panel_button')
      })
    });
  }

  /**
   * Consumes a language Reply Keyboard tap (registration or “change language”).
   * @returns {Promise<boolean>} true if a language option was recognized
   */
  async handleLanguageReply(ctx, text) {
    const lang = ctx.state.lang ?? 'uz';
    const t = (k, v) => translate(k, lang, v);
    const picked = AuthController.resolveLanguageFromReply(text, t);
    if (!picked) {
      return false;
    }
    const awaiting = ctx.state.dbUser?.stateData?.awaiting_language_selection === true;
    if (awaiting) {
      await this.users.completeLanguageSelection(ctx.from.id, picked);
    } else {
      await this.users.setLanguage(ctx.from.id, picked);
    }
    ctx.state.lang = picked;
    const tSaved = (k, v) => translate(k, picked, v);
    await ctx.reply(tSaved('language_saved'));
    await this.sendMainMenu(ctx, picked);
    return true;
  }

  /**
   * Re-prompt language when the user is in registration mode but sent invalid text.
   */
  async promptLanguageSelection(ctx) {
    const lang = ctx.state.lang ?? 'uz';
    const t = (k, v) => translate(k, lang, v);
    await ctx.reply(`${t('err_invalid_language_selection')}\n\n${t('choose_language')}`, {
      ...languageReplyKeyboard(t)
    });
  }

  async promptChangeLanguage(ctx) {
    const lang = ctx.state.lang ?? 'uz';
    const t = (k, v) => translate(k, lang, v);
    const wasInAddHouse = ctx.state.dbUser?.state !== listingStates.IDLE;
    await this.users.resetUserSession(ctx.from.id);
    await ctx.reply(t('choose_language'), {
      ...languageInlineKeyboard(t, wasInAddHouse)
    });
  }

  /**
   * Applies language change from callback payload `lang:<code>[:restart_add_house]`.
   * Resumes add-house from first step when requested by callback context.
   * @returns {Promise<boolean>} true when callback payload is consumed
   */
  async handleLanguageSelection(ctx, data) {
    if (!data.startsWith(CALLBACKS.LANG_PREFIX)) {
      return false;
    }
    const [, langCode, restartFlag] = data.split(':');
    if (!SUPPORTED_LANGS.includes(langCode)) {
      return false;
    }

    const awaiting = ctx.state.dbUser?.stateData?.awaiting_language_selection === true;
    if (awaiting) {
      await this.users.completeLanguageSelection(ctx.from.id, langCode);
    } else {
      await this.users.setLanguage(ctx.from.id, langCode);
    }
    ctx.state.lang = langCode;

    const t = (k, v) => translate(k, langCode, v);
    await ctx.reply(t('language_saved'));

    if (restartFlag === 'restart_add_house') {
      await this.states.startAddHouse(ctx.from.id);
      await ctx.reply(t('ask_photos'));
      return true;
    }

    await this.sendMainMenu(ctx, langCode);
    return true;
  }
}
