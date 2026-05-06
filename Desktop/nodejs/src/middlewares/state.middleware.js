export function stateMiddleware(stateService) {
  return async (ctx, next) => {
    const from = ctx.from;
    if (!from) {
      await next();
      return;
    }
    const record = await stateService.getUserRecord(from.id);
    ctx.state.dbUser = record;
    ctx.state.lang = record.language ?? 'uz';
    await next();
  };
}
