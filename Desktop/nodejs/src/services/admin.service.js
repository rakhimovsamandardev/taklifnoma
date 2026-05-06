import { supabase } from '../database/supabase.js';

const SETTINGS_TABLE = 'settings';

export class AdminService {
  constructor() {
    this.client = supabase;
  }

  async getAllUserIds() {
    console.log('[db] admin.getAllUserIds: select telegram_id from profile');
    try {
      const { data, error } = await supabase.from('profile').select('telegram_id');
      if (error) {
        console.error('[db] admin.getAllUserIds error:', error);
        return [];
      }
      const ids = (data ?? []).map((r) => String(r?.telegram_id ?? '')).filter(Boolean);
      console.log('[db] admin.getAllUserIds ok:', { rows: data?.length ?? 0, ids: ids.length });
      return ids;
    } catch (error) {
      console.error('[db] admin.getAllUserIds exception:', error);
      return [];
    }
  }

  async getUserLanguage(telegramId) {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('language')
        .eq('telegram_id', String(telegramId))
        .maybeSingle();
      if (error) throw new Error(`admin.getUserLanguage: ${error.message}`);
      return data?.language === 'uz' ? 'uz' : 'ru';
    } catch (error) {
      console.error('[db] admin.getUserLanguage error:', error);
      return 'ru';
    }
  }

  async getStats() {
    try {
      console.log('[db] admin.getStats: counting profile + listings');
      const [users, listingsTotal, listingsApproved, listingsPending] = await Promise.all([
        supabase.from('profile').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      if (users.error) throw new Error(`admin.getStats.users: ${users.error.message}`);
      if (listingsTotal.error) throw new Error(`admin.getStats.listingsTotal: ${listingsTotal.error.message}`);
      if (listingsApproved.error) throw new Error(`admin.getStats.listingsApproved: ${listingsApproved.error.message}`);
      if (listingsPending.error) throw new Error(`admin.getStats.listingsPending: ${listingsPending.error.message}`);

      console.log('[db] admin.getStats ok:', {
        users: users.count ?? 0,
        listingsTotal: listingsTotal.count ?? 0,
        listingsApproved: listingsApproved.count ?? 0,
        listingsPending: listingsPending.count ?? 0
      });
      return {
        users: users.count ?? 0,
        listings: {
          total: listingsTotal.count ?? 0,
          approved: listingsApproved.count ?? 0,
          pending: listingsPending.count ?? 0
        }
      };
    } catch (error) {
      console.error('[db] admin.getStats error:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      console.log('[db] admin.getSettings: select key,value from settings');
      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .select('key,value')
        .in('key', ['SERVICE_FEE_PCT', 'PAYMENT_CARD_NUMBER']);
      if (error) throw new Error(`admin.getSettings: ${error.message}`);
      console.log('[db] admin.getSettings ok:', { rows: data?.length ?? 0 });
      const m = new Map((data ?? []).map((r) => [r.key, r.value]));
      return {
        serviceFeePct: m.get('SERVICE_FEE_PCT') ?? process.env.SERVICE_FEE_PCT ?? null,
        cardNumber: m.get('PAYMENT_CARD_NUMBER') ?? process.env.PAYMENT_CARD_NUMBER ?? null
      };
    } catch (error) {
      console.error('[db] admin.getSettings error:', error);
      if (String(error?.message ?? '').includes('does not exist')) {
        return {
          serviceFeePct: process.env.SERVICE_FEE_PCT ?? null,
          cardNumber: process.env.PAYMENT_CARD_NUMBER ?? null
        };
      }
      throw error;
    }
  }

  async getPendingListing() {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (error) {
        const noRowsFound =
          error.code === 'PGRST116' ||
          String(error.message ?? '').toLowerCase().includes('0 rows') ||
          String(error.details ?? '').toLowerCase().includes('0 rows');
        if (noRowsFound) return null;
        throw new Error(`admin.getPendingListing: ${error.message}`);
      }
      if (!data) return null;

      let owner = null;
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('telegram_id, language, first_name, last_name')
          .eq('telegram_id', String(data.user_id))
          .maybeSingle();
        if (!profileError) owner = profile ?? null;
      } catch {
        owner = null;
      }

      const normalizedPhotos = Array.isArray(data?.photos)
        ? data.photos
        : (Array.isArray(data?.images) ? data.images : []);
      const normalizedPaymentProof = data?.payment_proof ?? data?.payment_screenshot ?? null;
      return {
        ...data,
        photos: normalizedPhotos,
        payment_proof: normalizedPaymentProof,
        owner
      };
    } catch (error) {
      console.error('[db] admin.getPendingListing error:', error);
      throw error;
    }
  }

  async updateListingStatus(id, status) {
    const allowed = new Set(['approved', 'rejected']);
    if (!allowed.has(status)) throw new Error(`admin.updateListingStatus: unsupported status "${status}"`);
    try {
      const { data, error } = await supabase
        .from('listings')
        .update({ status })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(`admin.updateListingStatus: ${error.message}`);
      return data ?? null;
    } catch (error) {
      console.error('[db] admin.updateListingStatus error:', { id, status, error });
      throw error;
    }
  }

  async approveListing(listingId) {
    console.log('[AdminService] approveListing:', { listingId });
    const { data: beforeUpdate } = await supabase
      .from('listings')
      .select('id, area, total_floors, current_floor, square_meters, photos')
      .eq('id', listingId)
      .maybeSingle();
    const updated = await this.updateListingStatus(listingId, 'approved');
    if (!updated) return updated;
    return {
      ...updated,
      area: updated?.area ?? beforeUpdate?.area ?? null,
      total_floors: updated?.total_floors ?? beforeUpdate?.total_floors ?? null,
      current_floor: updated?.current_floor ?? beforeUpdate?.current_floor ?? null,
      photos: Array.isArray(updated?.photos) ? updated.photos : (Array.isArray(beforeUpdate?.photos) ? beforeUpdate.photos : []),
      square_meters: updated?.square_meters ?? beforeUpdate?.square_meters ?? updated?.area ?? beforeUpdate?.area ?? null
    };
  }

  async rejectListing(listingId, reason) {
    console.log('[AdminService] rejectListing:', { listingId, reason });
    const updated = await this.updateListingStatus(listingId, 'rejected');
    return updated;
  }

  async updateSettings(key, value) {
    try {
      console.log('[db] admin.updateSettings: upsert settings', { key, value });
      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .upsert([{ key, value: value ?? null }], { onConflict: 'key' });
      if (error) throw new Error(`admin.updateSettings(${key}): ${error.message}`);
      console.log('[db] admin.updateSettings ok:', { key });
    } catch (error) {
      console.error('[db] admin.updateSettings error:', error);
      throw error;
    }
  }
}

