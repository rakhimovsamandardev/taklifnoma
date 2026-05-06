import { PHOTO_GROUP_DEBOUNCE_MS } from '../config/constants.js';
import { log } from '../utils/logger.js';

/**
 * Debounced photo ingestion: merges media_group batches and sequential single-photo messages.
 */
export class PhotoFlushService {
  constructor() {
    /** @type {Map<string, ReturnType<typeof setTimeout>>} */
    this.timers = new Map();
    /** @type {Map<string, string[]>} */
    this.buckets = new Map();
  }

  /**
   * @param {bigint | number | undefined | null} userId
   * @param {string | undefined} mediaGroupId
   */
  _key(userId, mediaGroupId) {
    const uid = String(userId);
    return mediaGroupId ? `g:${uid}:${mediaGroupId}` : `s:${uid}`;
  }

  /**
   * @param {(fileIds: string[]) => Promise<void>} onFlush Telegram `photo` file_ids (pick largest elsewhere)
   */
  addPhoto(userId, mediaGroupId, fileId, onFlush) {
    const key = this._key(userId, mediaGroupId);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = [];
      this.buckets.set(key, bucket);
    }
    if (!bucket.includes(fileId)) {
      bucket.push(fileId);
    }

    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      this.timers.delete(key);
      const queued = [...(this.buckets.get(key) ?? [])];
      this.buckets.delete(key);
      if (queued.length === 0) return;
      try {
        await onFlush(queued);
      } catch (err) {
        log.error('photo_flush_failed', { err: String(err?.message ?? err), userId: String(userId) });
      }
    }, PHOTO_GROUP_DEBOUNCE_MS);
    this.timers.set(key, timer);
  }
}
