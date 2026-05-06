export function registerStartCommand(bot, authController) {
  bot.start(async (ctx) => {
    await authController.handleStart(ctx);
  });
}
