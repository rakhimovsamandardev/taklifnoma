import { supabase } from '../database/supabase.js';

const TABLE = 'listings';
const DB_TIMEOUT_MS = 10000;

async function withTimeout(promise, label) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: timeout`)), DB_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

export class ListingRepository {
  _getMissingColumnName(error) {
    const msg = String(error?.message ?? error ?? '');
    const m1 = /Could not find the '([^']+)' column/i.exec(msg);
    if (m1?.[1]) return m1[1];
    const m2 = /column\s+(?:"?[\w$]+"?\.)?"?([\w$]+)"?\s+does not exist/i.exec(msg);
    if (m2?.[1]) return m2[1];
    return null;
  }

  async insert(row) {
    const payload = {
      user_id: String(row.user_id),
      tenant_type: row.tenant_type ?? null,
      photos: row.photos ?? [],
      region: row.region ?? null,
      district: row.district ?? null,
      rooms: row.rooms ?? null,
      house_type: row.house_type ?? null,
      area: row.area ?? null,
      total_floors: row.total_floors ?? null,
      current_floor: row.current_floor ?? null,
      condition: row.condition ?? null,
      price: row.price ?? null,
      price_currency: row.price_currency ?? null,
      contact_phone: row.contact_phone ?? null,
      status: row.status ?? 'pending'
    };

    const attempt = async (p) =>
      withTimeout(supabase.from(TABLE).insert(p).select('id').single(), 'insert listing');

    let current = { ...payload };
    for (let i = 0; i < 6; i += 1) {
      const res = await attempt(current);
      if (!res.error) return res.data?.id ?? null;

      const missing = this._getMissingColumnName(res.error);
      if (!missing || !(missing in current)) {
        throw new Error(`insert listing: ${res.error.message}`);
      }

      // Drop missing column and retry (schema drift tolerance).
      // eslint-disable-next-line no-unused-vars
      const { [missing]: _ignored, ...next } = current;
      current = next;
    }

    throw new Error('insert listing: failed after schema fallback retries');
  }

  async getById(id) {
    let select =
      'id,user_id,tenant_type,photos,region,district,rooms,house_type,area,total_floors,current_floor,condition,price,price_currency,service_fee,contact_phone,status,created_at';
    const attempt = async (s) =>
      withTimeout(supabase.from(TABLE).select(s).eq('id', id).maybeSingle(), 'get listing');

    for (let i = 0; i < 6; i += 1) {
      const res = await attempt(select);
      if (!res.error) return res.data ?? null;

      const missing = this._getMissingColumnName(res.error);
      if (!missing) throw new Error(`get listing: ${res.error.message}`);

      // Remove missing field from select list and retry.
      const fields = select.split(',').map((f) => f.trim()).filter(Boolean);
      const nextFields = fields.filter((f) => f !== missing);
      if (nextFields.length === fields.length) throw new Error(`get listing: ${res.error.message}`);
      select = nextFields.join(',');
    }

    throw new Error('get listing: failed after schema fallback retries');
  }

  async updateStatus(id, status) {
    const { error } = await withTimeout(
      supabase.from(TABLE).update({ status }).eq('id', id),
      'update listing status'
    );
    if (error) throw new Error(`update listing status: ${error.message}`);
  }
}
