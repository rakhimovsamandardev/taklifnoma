import { Markup } from 'telegraf';
import { CALLBACKS, HOUSE_CONDITIONS, HOUSE_TYPES } from '../config/constants.js';
import { ADMIN_STRINGS, tAdmin } from '../config/admin.constants.js';
import { getDistrictOptions, getRegionOptions } from './locations.js';

/**
 * Reply keyboard helper: compact (resize), optional one-time dismissal, placeholder, persistence.
 * @param {string[][]} labelRows
 * @param {{ placeholder?: string; oneTime?: boolean; persistent?: boolean }} [opts]
 *   — `oneTime: true` for wizard steps so the pad hides after a choice (helper, not blocker).
 *   — `persistent: false` on the main menu so Telegram does not pin it like a sticky tray.
 */
export function replyKeyboard(labelRows, opts = {}) {
  const { placeholder, oneTime = false, persistent } = opts;
  let m = Markup.keyboard(labelRows).resize();
  if (oneTime) {
    m = m.oneTime(true);
  }
  if (persistent !== undefined) {
    m = m.persistent(persistent);
  }
  if (placeholder) {
    m = m.placeholder(placeholder);
  }
  return m;
}

/** Registration / change-language — single row, dismiss after tap */
/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function languageReplyKeyboard(t) {
  return replyKeyboard([[t('reply_lang_uz'), t('reply_lang_ru'), t('reply_lang_en')]], {
    placeholder: t('placeholder_language'),
    oneTime: true,
    persistent: false
  });
}

/** Main menu — not one-time; explicit non-persistent so users can collapse it */
/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function mainMenuReplyKeyboard(t, options = {}) {
  const { includeAdminPanel = false, adminPanelLabel = ADMIN_STRINGS.panelButton } = options;
  const rows = [[t('btn_add_house'), t('btn_my_profile')], [t('btn_language'), t('btn_main_menu')]];
  if (includeAdminPanel) {
    rows.push([adminPanelLabel]);
  }
  return replyKeyboard(
    rows,
    {
    placeholder: t('placeholder_main_menu'),
    persistent: false
    }
  );
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function adminMainMenuReplyKeyboard(t, pendingCount = 0) {
  return replyKeyboard(
    [
      [t('admin_btn_stats')],
      [t('admin_btn_pending', { count: pendingCount })],
      [t('admin_btn_broadcast')],
      [t('admin_btn_settings')]
    ],
    { placeholder: t('admin_placeholder'), persistent: false }
  );
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function languageInlineKeyboard(t, restartFlow = false) {
  const suffix = restartFlow ? ':restart_add_house' : '';
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('reply_lang_uz'), `${CALLBACKS.LANG_PREFIX}uz${suffix}`),
      Markup.button.callback(t('reply_lang_ru'), `${CALLBACKS.LANG_PREFIX}ru${suffix}`),
      Markup.button.callback(t('reply_lang_en'), `${CALLBACKS.LANG_PREFIX}en${suffix}`)
    ]
  ]);
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function roomsInlineKeyboard(t) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('rooms_quick_1'), `${CALLBACKS.ROOMS_PREFIX}1`),
      Markup.button.callback(t('rooms_quick_2'), `${CALLBACKS.ROOMS_PREFIX}2`),
      Markup.button.callback(t('rooms_quick_3'), `${CALLBACKS.ROOMS_PREFIX}3`)
    ],
    [
      Markup.button.callback(t('rooms_quick_4'), `${CALLBACKS.ROOMS_PREFIX}4`),
      Markup.button.callback(t('rooms_quick_5p'), `${CALLBACKS.ROOMS_PREFIX}5`)
    ],
    [Markup.button.callback(t('btn_back'), CALLBACKS.BACK_LISTING)]
  ]);
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function houseTypeInlineKeyboard(t) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('house_type_brick'), `${CALLBACKS.HOUSE_TYPE_PREFIX}${HOUSE_TYPES.BRICK}`),
      Markup.button.callback(t('house_type_panel'), `${CALLBACKS.HOUSE_TYPE_PREFIX}${HOUSE_TYPES.PANEL}`),
      Markup.button.callback(
        t('house_type_monolith'),
        `${CALLBACKS.HOUSE_TYPE_PREFIX}${HOUSE_TYPES.MONOLITH}`
      )
    ],
    [Markup.button.callback(t('btn_back'), CALLBACKS.BACK_LISTING)]
  ]);
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function conditionInlineKeyboard(t) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('condition_new'), `${CALLBACKS.CONDITION_PREFIX}${HOUSE_CONDITIONS.NEW}`),
      Markup.button.callback(
        t('condition_good'),
        `${CALLBACKS.CONDITION_PREFIX}${HOUSE_CONDITIONS.GOOD}`
      )
    ],
    [
      Markup.button.callback(
        t('condition_needs_repair'),
        `${CALLBACKS.CONDITION_PREFIX}${HOUSE_CONDITIONS.NEEDS_REPAIR}`
      )
    ],
    [Markup.button.callback(t('btn_back'), CALLBACKS.BACK_LISTING)]
  ]);
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function tenantTypeInlineKeyboard(t) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('tenant_type_everyone'), `${CALLBACKS.TENANT_TYPE_PREFIX}everyone`),
      Markup.button.callback(t('tenant_type_family'), `${CALLBACKS.TENANT_TYPE_PREFIX}family`)
    ],
    [
      Markup.button.callback(
        t('tenant_type_family_and_girls'),
        `${CALLBACKS.TENANT_TYPE_PREFIX}family_and_girls`
      )
    ],
    [Markup.button.callback(t('tenant_type_girls'), `${CALLBACKS.TENANT_TYPE_PREFIX}girls`)],
    [Markup.button.callback(t('tenant_type_children'), `${CALLBACKS.TENANT_TYPE_PREFIX}children`)]
  ]);
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function confirmInlineKeyboard(t) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('btn_confirm'), CALLBACKS.CONFIRM_LISTING),
      Markup.button.callback(t('btn_cancel'), CALLBACKS.CANCEL_LISTING)
    ]
  ]);
}

export function adminReviewInlineKeyboard(approveData, rejectData) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Approve', approveData), Markup.button.callback('❌ Reject', rejectData)]
  ]);
}

export function adminMenuInlineKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ADMIN_STRINGS.statsButton, 'admin_stats')],
    [Markup.button.callback(ADMIN_STRINGS.settingsButton, 'admin_settings')],
    [Markup.button.callback(ADMIN_STRINGS.broadcastButton, 'admin_broadcast')]
  ]);
}

export function adminMenuInlineKeyboardByLang(lang = 'uz') {
  return Markup.inlineKeyboard([
    [Markup.button.callback(tAdmin(lang, 'stats_button'), 'admin_stats')],
    [Markup.button.callback(tAdmin(lang, 'moderation_button'), 'admin_moderation')],
    [Markup.button.callback(tAdmin(lang, 'admin_mgmt_button'), 'admin_manage_admins')],
    [Markup.button.callback(tAdmin(lang, 'broadcast_button'), 'admin_broadcast')],
    [Markup.button.callback(tAdmin(lang, 'settings_button'), 'admin_settings')],
    [Markup.button.callback(tAdmin(lang, 'exit_button'), 'admin_exit')]
  ]);
}

export function adminManageAdminsKeyboard(lang = 'uz', adminIds = []) {
  const rows = adminIds.map((id) => [
    Markup.button.callback(`🗑 ${id}`, `admin_rm:${id}`)
  ]);
  rows.push([Markup.button.callback(tAdmin(lang, 'admin_mgmt_add_button'), 'admin_add_admin')]);
  rows.push([Markup.button.callback(tAdmin(lang, 'back_button'), 'admin_back')]);
  return Markup.inlineKeyboard(rows);
}

export function adminSubMenuBackInlineKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ADMIN_STRINGS.backButton, 'admin_back')]
  ]);
}

export function adminSubMenuBackInlineKeyboardByLang(lang = 'uz') {
  return Markup.inlineKeyboard([
    [Markup.button.callback(tAdmin(lang, 'back_button'), 'admin_back')],
    [Markup.button.callback(tAdmin(lang, 'exit_button'), 'admin_exit')]
  ]);
}


function toRows(labels, perRow = 2) {
  const rows = [];
  for (let i = 0; i < labels.length; i += perRow) {
    rows.push(labels.slice(i, i + perRow));
  }
  return rows;
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function regionReplyKeyboard(t, lang) {
  const regions = getRegionOptions(lang).map((item) => item.label);
  const rows = toRows(regions, 2);
  rows.push([Markup.button.locationRequest(t('btn_send_location'))]);
  rows.push([t('btn_back')]);
  rows.push([t('btn_main_menu')]);
  return replyKeyboard(rows, {
    placeholder: t('placeholder_region'),
    oneTime: true,
    persistent: false
  });
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function districtReplyKeyboard(t, lang, regionKey) {
  const districts = getDistrictOptions(regionKey, lang).map((item) => item.label);
  const rows = toRows(districts, 2);
  rows.push([t('btn_back')]);
  rows.push([t('btn_main_menu')]);
  return replyKeyboard(rows, {
    placeholder: t('placeholder_district'),
    oneTime: true,
    persistent: false
  });
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function phoneReplyKeyboard(t) {
  return replyKeyboard(
    [[Markup.button.contactRequest(t('btn_send_phone'))], [t('btn_back')], [t('btn_main_menu')]],
    {
      placeholder: t('placeholder_phone_inline'),
      oneTime: true,
      persistent: false
    }
  );
}

/** @param {(k: string, vars?: Record<string, string | number>) => string} t */
export function backOnlyReplyKeyboard(t, placeholderKey = 'placeholder_main_menu') {
  return replyKeyboard([[t('btn_back')], [t('btn_main_menu')]], {
    placeholder: t(placeholderKey),
    oneTime: true,
    persistent: false
  });
}
