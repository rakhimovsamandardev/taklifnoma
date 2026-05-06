import { log } from '../utils/logger.js';
import { translate } from '../services/translation.service.js';

export function errorMiddleware() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      log.error('telegram_update_failed', {
        err: String(err?.message ?? err),
        updateType: ctx.updateType
      });
      const lang = ctx.state?.lang ?? 'en';
      try {
        await ctx.reply(translate('error_generic', lang));
      } catch {
        /* ignore downstream Telegram errors */
      }
    }
  };
}
