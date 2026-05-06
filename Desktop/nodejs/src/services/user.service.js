import userStates from '../states/userStates.js';
import { SUPPORTED_LANGS } from '../config/constants.js';

export class UserService {
  constructor(userRepository, stateService) {
    this.users = userRepository;
    this.states = stateService;
  }

  /**
   * Ensures a `profile` row exists for the Telegram user (Start / every update).
   * New users: `language` = uz, `state` = IDLE, awaiting first language confirmation via Reply Keyboard.
   */
  async ensureUser(telegramUser) {
    const tid = String(telegramUser.id);
    const existing = await this.users.getByTelegramId(tid);
    if (!existing) {
      await this.users.create({
        telegram_id: tid,
        language: 'uz',
        state: userStates.IDLE,
        state_data: { awaiting_language_selection: true }
      });
    }
    return this.states.getUserRecord(telegramUser.id);
  }

  /**
   * @param {string} lang — `uz` | `ru` | `en`
   */
  async setLanguage(userId, lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      throw new Error('unsupported_language');
    }
    await this.users.setLanguage(userId, lang);
  }

  /**
   * Marks onboarding language step complete (Reply Keyboard registration).
   */
  async completeLanguageSelection(userId, lang) {
    await this.setLanguage(userId, lang);
    await this.users.patchStateData(userId, null, { awaiting_language_selection: false });
  }

  /**
   * Clears current flow/session before language switch.
   */
  async resetUserSession(telegramId) {
    await this.users.clearSession(telegramId);
  }

  async getLanguage(userId) {
    const row = await this.users.findById(userId);
    return row?.language ?? 'uz';
  }

  /**
   * Explicit state sync helper for multi-step flows.
   */
  async syncStateProgress(userId, state, stateData) {
    await this.users.setState(userId, state, stateData ?? {});
  }
}
