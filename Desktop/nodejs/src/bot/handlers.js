import { translate } from '../services/translation.service.js';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { stateMiddleware } from '../middlewares/state.middleware.js';
import { dedupeMiddleware } from '../middlewares/dedupe.middleware.js';
import { sequentialUpdateMiddleware } from '../middlewares/sequential.middleware.js';
import { registerStartCommand } from './commands/start.js';
import listingStates from '../config/listing.constants.js';
import { isPrivilegedAdmin } from '../utils/adminAccess.js';

export function setupHandlers(bot, deps) {
  bot.use(errorMiddleware());
  bot.use(sequentialUpdateMiddleware());
  bot.use(authMiddleware(deps.userService));
  bot.use(stateMiddleware(deps.stateService));
  bot.use(dedupeMiddleware(deps.processedMessageRepository));

  registerStartCommand(bot, deps.authController);

  bot.on('callback_query', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const data = ctx.callbackQuery?.data;
    if (!data) return;

    const langHandled = await deps.authController.handleLanguageSelection(ctx, data);
    if (langHandled) return;

    const adminHandled = await deps.adminController?.handleCallback(ctx, data);
    if (adminHandled) return;

    await deps.listingController.routeCallback(ctx, data);
  });

  bot.on('photo', async (ctx) => {
    if (await isPrivilegedAdmin(ctx.from?.id, deps.settingsService)) {
      void deps.adminController?.handleMedia(ctx);
      return;
    }
    const sizes = ctx.message.photo;
    const fileId = sizes?.length ? sizes.at(-1)?.file_id : undefined;
    if (!fileId) return;
    const mediaGroupId = ctx.message.media_group_id ?? undefined;
    deps.listingController.enqueueIncomingPhoto(ctx, fileId, mediaGroupId);
  });

  bot.on('video', async (ctx) => {
    if (await isPrivilegedAdmin(ctx.from?.id, deps.settingsService)) {
      void deps.adminController?.handleMedia(ctx);
    }
  });

  bot.on('location', async (ctx) => {
    const location = ctx.message?.location;
    if (!location) return;
    await deps.listingController.handleListingLocation(ctx, location);
  });

  bot.on('contact', async (ctx) => {
    const contact = ctx.message?.contact;
    if (!contact) return;
    await deps.listingController.handleListingContact(ctx, contact);
  });

  bot.on('text', async (ctx) => {
    const record = ctx.state.dbUser;
    const text = ctx.message.text ?? '';
    const lang = ctx.state.lang ?? 'uz';
    const t = (k, v) => translate(k, lang, v);
    const isAdmin = await isPrivilegedAdmin(ctx.from?.id, deps.settingsService);
    if (text.startsWith('/') && !(isAdmin && text.trim() === '/admin')) return;

    if (record?.stateData?.awaiting_language_selection === true) {
      const ok = await deps.authController.handleLanguageReply(ctx, text);
      if (!ok) await deps.authController.promptLanguageSelection(ctx);
      return;
    }

    if (isAdmin) {
      if (text.trim() === '/admin' || text.trim() === t('admin_panel_button')) {
        const adminHandled = await deps.adminController?.handleAdminCommand(ctx);
        if (adminHandled) return;
      }
      const adminTextHandled = await deps.adminController?.handleText(ctx, text);
      if (adminTextHandled) return;
    }

    if (text.trim() === t('btn_language')) {
      await deps.authController.promptChangeLanguage(ctx);
      return;
    }

    if (text.trim() === t('btn_main_menu')) {
      await deps.userService.resetUserSession(ctx.from.id);
      await deps.authController.sendMainMenu(ctx, lang);
      return;
    }

    if (record?.state === listingStates.IDLE) {
      await deps.listingController.handleIdleText(ctx, text);
      return;
    }

    await deps.listingController.handleListingText(ctx, text);
  });
}
