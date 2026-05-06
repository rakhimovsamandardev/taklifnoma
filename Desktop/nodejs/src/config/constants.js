export const HOUSE_TYPES = Object.freeze({
  BRICK: 'brick',
  PANEL: 'panel',
  MONOLITH: 'monolith'
});

export const HOUSE_CONDITIONS = Object.freeze({
  NEW: 'new',
  GOOD: 'good',
  NEEDS_REPAIR: 'needs_repair'
});

export const SUPPORTED_LANGS = Object.freeze(['en', 'ru', 'uz']);

export const CALLBACKS = Object.freeze({
  LANG_PREFIX: 'lang:',
  MENU_ADD_HOUSE: 'menu:add_house',
  TENANT_TYPE_PREFIX: 'tenant_type:',
  ROOMS_PREFIX: 'rooms:',
  HOUSE_TYPE_PREFIX: 'house_type:',
  CONDITION_PREFIX: 'condition:',
  BACK_LISTING: 'listing:back',
  ADMIN_APPROVE_PREFIX: 'ap:',
  ADMIN_REJECT_PREFIX: 'rj:',
  CONFIRM_LISTING: 'listing:confirm',
  CANCEL_LISTING: 'listing:cancel'
});

/** Matches `ap:<id>` / `rj:<id>` for numeric or UUID listing ids (Telegram callback_data limit: 64 bytes). */
export function buildModerationCallbackRegex() {
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(${esc(CALLBACKS.ADMIN_APPROVE_PREFIX)}|${esc(CALLBACKS.ADMIN_REJECT_PREFIX)})([0-9a-fA-F-]{8,})$`);
}

export const PHOTO_GROUP_DEBOUNCE_MS = 2500;
