import { z } from 'zod';
import { HOUSE_CONDITIONS, HOUSE_TYPES } from '../config/constants.js';

const phoneRe = /^\+998\d{9}$/;

export const roomsSchema = z.coerce.number().int().positive();

/** Strips emoji/keycap noise so reply labels like "2️⃣" still parse as a room count. */
export function normalizeRoomsAnswer(raw) {
  const s = String(raw).trim();
  const m = s.match(/\d+/);
  return m ? m[0] : s;
}
export const areaSchema = z.coerce.number().positive();
export const floorsSchema = z.coerce.number().int().min(0);
export const priceSchema = z.coerce.number().nonnegative();
export const phoneSchema = z
  .string()
  .trim()
  .regex(phoneRe, 'invalid_phone');

export const houseTypeSchema = z.enum([
  HOUSE_TYPES.BRICK,
  HOUSE_TYPES.PANEL,
  HOUSE_TYPES.MONOLITH
]);

export const conditionSchema = z.enum([
  HOUSE_CONDITIONS.NEW,
  HOUSE_CONDITIONS.GOOD,
  HOUSE_CONDITIONS.NEEDS_REPAIR
]);

export function parseCurrentFloor(current, total) {
  const c = floorsSchema.safeParse(current);
  const t = floorsSchema.safeParse(total);
  if (!c.success || !t.success) return { ok: false };
  if (c.data > t.data) return { ok: false, errorKey: 'err_current_floor_gt_total' };
  return { ok: true, value: c.data };
}
