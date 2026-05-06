import listingStates from '../states/listingStates.js';
import { CALLBACKS } from '../config/constants.js';
import {
  areaSchema,
  conditionSchema,
  floorsSchema,
  houseTypeSchema,
  parseCurrentFloor,
  phoneSchema,
  roomsSchema,
  normalizeRoomsAnswer
} from '../utils/validators.js';
import { translate } from './translation.service.js';
import { supabase } from '../database/supabase.js';
import {
  resolveDistrictByLabel,
  resolveRegionByLabel
} from '../utils/locations.js';

const listingFlowStates = [
  listingStates.ADD_HOUSE_TENANT_TYPE,
  listingStates.ADD_HOUSE_PHOTOS,
  listingStates.ADD_HOUSE_REGION,
  listingStates.ADD_HOUSE_DISTRICT,
  listingStates.ADD_HOUSE_AREA,
  listingStates.ADD_HOUSE_ROOMS,
  listingStates.ADD_HOUSE_TYPE,
  listingStates.ADD_HOUSE_TOTAL_FLOORS,
  listingStates.ADD_HOUSE_CURRENT_FLOOR,
  listingStates.ADD_HOUSE_CONDITION,
  listingStates.ADD_HOUSE_PRICE,
  listingStates.ADD_HOUSE_PHONE,
  listingStates.ADD_HOUSE_CONFIRM
];

const tenantTypes = new Set([
  'everyone',
  'family',
  'family_and_girls',
  'girls',
  'children'
]);

const stateCleanup = {
  [listingStates.ADD_HOUSE_TENANT_TYPE]: ['tenant_type'],
  [listingStates.ADD_HOUSE_PHOTOS]: ['photos'],
  [listingStates.ADD_HOUSE_REGION]: ['address.region', 'address.district', 'address.manual_address'],
  [listingStates.ADD_HOUSE_DISTRICT]: ['address.district', 'address.manual_address'],
  [listingStates.ADD_HOUSE_AREA]: ['area'],
  [listingStates.ADD_HOUSE_ROOMS]: ['rooms'],
  [listingStates.ADD_HOUSE_TYPE]: ['type'],
  [listingStates.ADD_HOUSE_TOTAL_FLOORS]: ['total_floors'],
  [listingStates.ADD_HOUSE_CURRENT_FLOOR]: ['current_floor'],
  [listingStates.ADD_HOUSE_CONDITION]: ['condition'],
  [listingStates.ADD_HOUSE_PRICE]: ['price'],
  [listingStates.ADD_HOUSE_PHONE]: ['phone']
};

function clearPath(obj, path) {
  if (path === 'photos') {
    obj.photos = [];
    return;
  }
  if (path.includes('.')) {
    const [parent, child] = path.split('.');
    if (!obj[parent] || typeof obj[parent] !== 'object') return;
    obj[parent][child] = null;
    return;
  }
  obj[path] = null;
}

function sanitizePrice(raw) {
  const s = String(raw ?? '').trim();
  const cleaned = s.replace(/[^\d.,]/g, '').replace(/[.,]/g, '');
  if (!cleaned) return null;
  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function detectCurrency(raw) {
  const s = String(raw ?? '').toLowerCase();
  if (/\$|usd|dollar/.test(s)) return 'USD';
  if (/sum|so['’]?m|uzs/.test(s)) return 'UZS';
  if (/руб|rub|ruble/.test(s)) return 'RUB';
  return 'UZS';
}

function formatPriceForUi(amount, currency) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? '');
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
  if (currency === 'USD') return `${formatted} $`;
  if (currency === 'RUB') return `${formatted} ₽`;
  return `${formatted} so'm`;
}

function toNumericOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIntOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function uniqAppend(existing, incoming) {
  const set = new Set(existing ?? []);
  for (const id of incoming) set.add(id);
  return [...set];
}

export class ListingService {
  constructor(stateService, listingRepository, photoFlushService) {
    this.states = stateService;
    this.listings = listingRepository;
    this.photoFlush = photoFlushService;
  }

  isInListingFlow(state) {
    return listingFlowStates.includes(state);
  }

  enqueuePhoto(userId, mediaGroupId, fileId, flushHandler) {
    this.photoFlush.addPhoto(userId, mediaGroupId, fileId, flushHandler);
  }

  /**
   * @returns {Promise<{
   *   type: 'ignore'|'need_more_photos'|'advanced_to_region';
   *   count?: number;
   * }>}
   */
  async onPhotoFlush(userId, flushedFileIds) {
    const record = await this.states.getUserRecord(userId);
    if (!record) {
      return { type: 'ignore' };
    }

    const current = uniqAppend(record.stateData?.photos, flushedFileIds);
    const draft = { ...(record.stateData ?? {}), photos: current };
    if (draft.photos.length < 2) {
      if (record.state === listingStates.ADD_HOUSE_PHOTOS) {
        await this.states.setStateBundle(userId, listingStates.ADD_HOUSE_PHOTOS, draft);
      } else {
        await this.states.setStateBundle(userId, record.state, draft);
      }
      return { type: 'need_more_photos', count: draft.photos.length };
    }

    // If the media group flush comes in late (after we already advanced), still merge all photos.
    if (record.state !== listingStates.ADD_HOUSE_PHOTOS) {
      await this.states.setStateBundle(userId, record.state, draft);
      return { type: 'ignore' };
    }

    await this.states.setStateBundle(userId, listingStates.ADD_HOUSE_REGION, draft);
    return { type: 'advanced_to_region' };
  }

  /** @returns {Promise<{ type:'ignore'|'accepted'|'error'; errorKey?: string; next?: string }>} */
  async consumeTextAnswer(userId, text) {
    const record = await this.states.getUserRecord(userId);
    if (!record || !this.isInListingFlow(record.state)) {
      return { type: 'ignore' };
    }
    const lang = record.language ?? 'uz';
    if (String(text).trim() === translate('btn_back', lang)) {
      return this.goBack(userId);
    }
    switch (record.state) {
      case listingStates.ADD_HOUSE_TENANT_TYPE: {
        return { type: 'ignore' };
      }
      case listingStates.ADD_HOUSE_ROOMS: {
        const trimmed = text.trim();
        if (trimmed === translate('rooms_quick_5p', lang)) {
          const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_TYPE, {
            rooms: 5
          });
          return { type: 'accepted', next: draft };
        }
        const parsed = roomsSchema.safeParse(normalizeRoomsAnswer(trimmed));
        if (!parsed.success) return { type: 'error', errorKey: 'err_rooms' };
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_TYPE, {
          rooms: parsed.data
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_TYPE: {
        return { type: 'ignore' };
      }
      case listingStates.ADD_HOUSE_AREA: {
        const parsed = areaSchema.safeParse(text);
        if (!parsed.success) return { type: 'error', errorKey: 'err_area' };
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_ROOMS, {
          area: parsed.data
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_TOTAL_FLOORS: {
        const parsed = floorsSchema.safeParse(text);
        if (!parsed.success) return { type: 'error', errorKey: 'err_total_floors' };
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_CURRENT_FLOOR, {
          total_floors: parsed.data
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_CURRENT_FLOOR: {
        const recordNow = await this.states.getUserRecord(userId);
        const total = recordNow.stateData.total_floors;
        const check = parseCurrentFloor(text, total);
        if (!check.ok) {
          return {
            type: 'error',
            errorKey: check.errorKey ?? 'err_current_floor'
          };
        }
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_CONDITION, {
          current_floor: check.value
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_CONDITION: {
        return { type: 'ignore' };
      }
      case listingStates.ADD_HOUSE_REGION: {
        const lang = record.language ?? 'uz';
        const region = resolveRegionByLabel(text, lang);
        if (!region) return { type: 'error', errorKey: 'err_region' };
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_DISTRICT, {
          address: {
            region: region.label,
            district: null,
            manual_address: null
          }
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_DISTRICT: {
        const selectedRegion = resolveRegionByLabel(record.stateData.address?.region ?? '', lang);
        if (!selectedRegion) return { type: 'error', errorKey: 'err_region' };
        const trimmed = text.trim();
        if (trimmed.length < 2) return { type: 'error', errorKey: 'err_district' };
        const district = resolveDistrictByLabel(selectedRegion.key, trimmed, lang);
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_AREA, {
          address: {
            region: record.stateData.address?.region ?? null,
            district: district?.label ?? trimmed,
            manual_address: null
          },
          custom_entry:
            district === null
              ? {
                  type: 'district',
                  value: trimmed
                }
              : null
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_PRICE: {
        const parsedPrice = sanitizePrice(text);
        if (parsedPrice === null) return { type: 'error', errorKey: 'err_price' };
        const currency = detectCurrency(text);
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_PHONE, {
          price: parsedPrice,
          price_currency: currency
        });
        const displayPrice = formatPriceForUi(parsedPrice, currency);
        return {
          type: 'accepted',
          next: draft,
          action: 'price_parsed',
          parsedPrice,
          parsedCurrency: currency,
          displayPrice
        };
      }
      case listingStates.ADD_HOUSE_PHONE: {
        const parsed = phoneSchema.safeParse(text);
        if (!parsed.success) return { type: 'error', errorKey: 'err_phone' };
        const draft = await this.states.advance(userId, listingStates.ADD_HOUSE_CONFIRM, {
          phone: parsed.data
        });
        return { type: 'accepted', next: draft };
      }
      case listingStates.ADD_HOUSE_CONFIRM: {
        return { type: 'ignore' };
      }
      default:
        return { type: 'ignore' };
    }
  }

  /** @returns {Promise<{ type:'ignore'|'accepted'|'error'; errorKey?: string; action?: string }>} */
  async consumeCallback(userId, data) {
    const record = await this.states.getUserRecord(userId);
    if (!record) return { type: 'ignore' };

    if (data === CALLBACKS.MENU_ADD_HOUSE) {
      await this.states.startAddHouse(userId);
      return { type: 'accepted', action: 'start_flow' };
    }

    if (data === CALLBACKS.BACK_LISTING) {
      return this.goBack(userId);
    }

    if (
      record.state === listingStates.ADD_HOUSE_TENANT_TYPE &&
      data.startsWith(CALLBACKS.TENANT_TYPE_PREFIX)
    ) {
      const tenantType = data.slice(CALLBACKS.TENANT_TYPE_PREFIX.length);
      if (!tenantTypes.has(tenantType)) return { type: 'error', errorKey: 'use_buttons' };
      await this.states.advance(userId, listingStates.ADD_HOUSE_PHOTOS, { tenant_type: tenantType });
      return { type: 'accepted' };
    }

    if (
      record.state === listingStates.ADD_HOUSE_ROOMS &&
      data.startsWith(CALLBACKS.ROOMS_PREFIX)
    ) {
      const raw = data.slice(CALLBACKS.ROOMS_PREFIX.length);
      const parsed = roomsSchema.safeParse(raw);
      if (!parsed.success) return { type: 'error', errorKey: 'err_rooms' };
      await this.states.advance(userId, listingStates.ADD_HOUSE_TYPE, { rooms: parsed.data });
      return { type: 'accepted' };
    }

    if (
      record.state === listingStates.ADD_HOUSE_TYPE &&
      data.startsWith(CALLBACKS.HOUSE_TYPE_PREFIX)
    ) {
      const raw = data.slice(CALLBACKS.HOUSE_TYPE_PREFIX.length);
      const parsed = houseTypeSchema.safeParse(raw);
      if (!parsed.success) return { type: 'error', errorKey: 'err_type' };
      await this.states.advance(userId, listingStates.ADD_HOUSE_TOTAL_FLOORS, { type: parsed.data });
      return { type: 'accepted' };
    }

    if (
      record.state === listingStates.ADD_HOUSE_CONDITION &&
      data.startsWith(CALLBACKS.CONDITION_PREFIX)
    ) {
      const raw = data.slice(CALLBACKS.CONDITION_PREFIX.length);
      const parsed = conditionSchema.safeParse(raw);
      if (!parsed.success) return { type: 'error', errorKey: 'err_condition' };
      await this.states.advance(userId, listingStates.ADD_HOUSE_PRICE, { condition: parsed.data });
      return { type: 'accepted' };
    }

    if (data === CALLBACKS.CONFIRM_LISTING && record.state === listingStates.ADD_HOUSE_CONFIRM) {
      const d = record.stateData ?? {};
      const normalizedArea = toNumericOrNull(d.area);
      const normalizedTotalFloors = toIntOrNull(d.total_floors);
      const normalizedCurrentFloor = toIntOrNull(d.current_floor);
      const normalizedCurrency =
        typeof d.price_currency === 'string' && d.price_currency.trim()
          ? d.price_currency.trim().toUpperCase()
          : 'UZS';
      const listingId = await this.listings.insert({
        user_id: userId,
        tenant_type: d.tenant_type ?? null,
        photos: d.photos ?? [],
        region: d.address?.region ?? null,
        district: d.address?.district ?? null,
        rooms: d.rooms ?? null,
        house_type: d.type ?? null,
        area: normalizedArea,
        total_floors: normalizedTotalFloors,
        current_floor: normalizedCurrentFloor,
        condition: d.condition ?? null,
        price: d.price ?? null,
        price_currency: normalizedCurrency,
        contact_phone: d.phone ?? null,
        status: 'pending'
      });
      await this.states.setIdle(userId);
      return { type: 'accepted', action: 'saved', listingId };
    }

    if (data === CALLBACKS.CANCEL_LISTING && record.state === listingStates.ADD_HOUSE_CONFIRM) {
      await this.states.setIdle(userId);
      return { type: 'accepted', action: 'cancelled' };
    }

    return { type: 'ignore' };
  }

  async goBack(userId) {
    const record = await this.states.getUserRecord(userId);
    if (!record || !this.isInListingFlow(record.state)) return { type: 'ignore' };
    const idx = listingFlowStates.indexOf(record.state);
    if (idx <= 0) return { type: 'ignore' };
    const prevState = listingFlowStates[idx - 1];
    const nextDraft = { ...record.stateData };
    const cleanupPaths = stateCleanup[record.state] ?? [];
    for (const path of cleanupPaths) clearPath(nextDraft, path);
    await this.states.setStateBundle(userId, prevState, nextDraft);
    return { type: 'accepted', action: 'went_back', previousState: prevState };
  }

  async consumeLocation(userId, location) {
    const record = await this.states.getUserRecord(userId);
    if (!record || !this.isInListingFlow(record.state)) return { type: 'ignore' };
    if (
      record.state !== listingStates.ADD_HOUSE_REGION &&
      record.state !== listingStates.ADD_HOUSE_DISTRICT
    ) {
      return { type: 'ignore' };
    }
    await this.states.advance(userId, listingStates.ADD_HOUSE_AREA, {
      address: {
        region: record.stateData.address?.region ?? 'GPS',
        district: record.stateData.address?.district ?? 'GPS',
        manual_address: null
      },
      custom_entry: {
        type: 'location',
        value: `${location.latitude},${location.longitude}`
      }
    });
    return { type: 'accepted', action: 'location_captured' };
  }

  async consumeContact(userId, contact) {
    const record = await this.states.getUserRecord(userId);
    if (!record || record.state !== listingStates.ADD_HOUSE_PHONE) return { type: 'ignore' };
    const phoneRaw = String(contact?.phone_number ?? '').trim();
    const normalized = phoneRaw.startsWith('+') ? phoneRaw : `+${phoneRaw}`;
    const parsed = phoneSchema.safeParse(normalized);
    if (!parsed.success) return { type: 'error', errorKey: 'err_phone' };
    await this.states.advance(userId, listingStates.ADD_HOUSE_CONFIRM, {
      phone: parsed.data
    });
    return { type: 'accepted' };
  }

  async approveListing(listingId) {
    await this.listings.updateStatus(listingId, 'approved');
    return this.listings.getById(listingId);
  }

  async rejectListing(listingId) {
    await this.listings.updateStatus(listingId, 'rejected');
    return this.listings.getById(listingId);
  }

  async getListingById(listingId) {
    return this.listings.getById(listingId);
  }
}

export async function getPendingCount() {
  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw new Error(`getPendingCount: ${error.message}`);
  return count ?? 0;
}

export async function getTotalStats() {
  const [users, listings, deals] = await Promise.all([
    supabase.from('profile').select('telegram_id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'approved')
  ]);
  if (users.error) throw new Error(`getTotalStats.users: ${users.error.message}`);
  if (listings.error) throw new Error(`getTotalStats.listings: ${listings.error.message}`);
  if (deals.error) throw new Error(`getTotalStats.deals: ${deals.error.message}`);
  return {
    totalUsers: users.count ?? 0,
    totalListings: listings.count ?? 0,
    totalDeals: deals.count ?? 0
  };
}
