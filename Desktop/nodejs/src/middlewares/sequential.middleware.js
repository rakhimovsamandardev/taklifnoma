import { runSequential } from '../utils/updateQueue.js';

export function sequentialUpdateMiddleware(getUserKey = (ctx) => ctx.from?.id) {
  return async (ctx, next) => {
    const key = getUserKey(ctx);
    if (key === undefined || key === null) {
      await next();
      return;
    }
    await runSequential(key, async () => {
      await next();
    });
  };
}
