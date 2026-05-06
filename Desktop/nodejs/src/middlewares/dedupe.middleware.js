export function dedupeMiddleware(processedMessageRepository) {
  return async (ctx, next) => {
    const msg = ctx.message;
    const chatId = msg?.chat?.id;
    const messageId = msg?.message_id;
    if (chatId !== undefined && messageId !== undefined) {
      const fresh = processedMessageRepository.tryConsume(chatId, messageId);
      if (!fresh) {
        return;
      }
    }
    await next();
  };
}
