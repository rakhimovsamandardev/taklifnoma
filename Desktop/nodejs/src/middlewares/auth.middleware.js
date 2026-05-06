export function authMiddleware(userService) {
  return async (ctx, next) => {
    const from = ctx.from;
    if (!from) {
      await next();
      return;
    }
    await userService.ensureUser(from);
    await next();
  };
}
