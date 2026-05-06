import { BaseRepository } from './base.repository.js';

export class ProcessedMessageRepository extends BaseRepository {
  tryConsume(chatId, messageId) {
    try {
      this.db.prepare(`INSERT INTO processed_messages (chat_id, message_id) VALUES (?, ?)`).run(chatId, messageId);
      return true;
    } catch {
      return false;
    }
  }
}
