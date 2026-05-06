import { env } from '../config/env.js';

/**
 * Primary env admin or any Telegram ID stored in settings ADMIN_IDS.
 * @param {number|string|undefined} fromId
 * @param {{ getAdminIds: () => Promise<string[]> }} settingsService
 */
export async function isPrivilegedAdmin(fromId, settingsService) {
  if (fromId === undefined || fromId === null) return false;
  const id = String(fromId);
  if (env.ADMIN_CHAT_ID && id === String(env.ADMIN_CHAT_ID)) return true;
  if (!settingsService?.getAdminIds) return false;
  const ids = await settingsService.getAdminIds();
  return ids.includes(id);
}
