export const ADMIN_UI_TEXT = Object.freeze({
  panel_button: { uz: '💻 Admin Panel', ru: '💻 Панель администратора' },
  menu_title: { uz: '💻 Admin Panel', ru: '💻 Панель администратора' },
  stats_button: { uz: '📊 Statistika', ru: '📊 Статистика' },
  moderation_button: { uz: '🛡 Moderatsiya', ru: '🛡 Модерация' },
  broadcast_button: { uz: '📢 Reklama tarqatish', ru: '📢 Рассылка' },
  settings_button: { uz: '⚙️ Sozlamalar', ru: '⚙️ Настройки' },
  exit_button: { uz: '🚪 Chiqish', ru: '🚪 Выход' },
  back_button: { uz: '🔙 Orqaga', ru: '🔙 Назад' },
  admin_mgmt_button: { uz: '👮 Admin boshqaruvi', ru: '👮 Управление админами' },
  admin_mgmt_title: { uz: "👮 Adminlar ro'yxati", ru: '👮 Список администраторов' },
  admin_mgmt_empty: { uz: "Adminlar yo'q.", ru: 'Администраторы не найдены.' },
  admin_mgmt_add_button: { uz: "➕ Admin qo'shish", ru: '➕ Добавить админа' },
  admin_mgmt_add_prompt: { uz: 'Admin Telegram ID sini yuboring:', ru: 'Отправьте Telegram ID нового админа:' },
  admin_mgmt_added: { uz: "✅ Admin qo'shildi: {id}", ru: '✅ Админ добавлен: {id}' },
  admin_mgmt_removed: { uz: "✅ Admin o'chirildi: {id}", ru: '✅ Админ удалён: {id}' },
  admin_mgmt_invalid_id: { uz: "Noto'g'ri ID. Raqam kiriting.", ru: 'Неверный ID. Введите число.' },
  broadcast_prompt: {
    uz: 'Yuboriladigan xabar (matn/rasm/video) ni yuboring.',
    ru: 'Отправьте сообщение (текст/фото/видео) для рассылки.'
  },
  saved: { uz: '✅ Saqlandi', ru: '✅ Сохранено' },
  generic_error: { uz: 'Xatolik yuz berdi.', ru: 'Произошла ошибка.' },
  broadcast_context_missing: {
    uz: "Reklama yuborilmadi: xabar konteksti topilmadi.",
    ru: 'Рассылка не выполнена: контекст сообщения не найден.'
  },
  moderation_empty: {
    uz: "Kutilayotgan e'lonlar tugadi!",
    ru: 'Ожидающих объявлений больше нет!'
  },
  moderation_approve_button: { uz: '✅ Tasdiqlash', ru: '✅ Одобрить' },
  moderation_reject_button: { uz: '❌ Rad etish', ru: '❌ Отклонить' },
  moderation_back_button: { uz: '🔙 Orqaga', ru: '🔙 Назад' },
  moderation_approved: { uz: "✅ E'lon tasdiqlandi.", ru: '✅ Объявление одобрено.' },
  moderation_rejected: { uz: "❌ E'lon rad etildi.", ru: '❌ Объявление отклонено.' },
  moderation_title: { uz: '🛡 Moderatsiya', ru: '🛡 Модерация' },
  label_owner: { uz: '👤 Egasi', ru: '👤 Владелец' },
  label_location: { uz: '📍 Joylashuv', ru: '📍 Локация' },
  label_price: { uz: '💰 Narx', ru: '💰 Цена' },
  label_rooms: { uz: '🚪 Xonalar', ru: '🚪 Комнаты' },
  label_house_type: { uz: '🏢 Uy turi', ru: '🏢 Тип дома' },
  label_condition: { uz: '🧱 Holati', ru: '🧱 Состояние' },
  label_tenant: { uz: '🎯 Kim uchun', ru: '🎯 Для кого' },
  label_phone: { uz: '📞 Telefon', ru: '📞 Телефон' },
  moderation_ask_reject_reason: {
    uz: '✏️ Rad etish sababini yozing:',
    ru: '✏️ Напишите причину отказа:'
  },
  moderation_reject_reason_label: { uz: 'Sabab', ru: 'Причина' },
  unknown_value: { uz: "Noma'lum", ru: 'Неизвестно' }
});

const ENUM_TRANSLATIONS = Object.freeze({
  tenant_type: {
    everyone: { uz: 'Barcha uchun', ru: 'Для всех' },
    family: { uz: 'Oila', ru: 'Семья' },
    family_and_girls: { uz: "Oila va qizlar", ru: 'Семья и девушки' },
    girls: { uz: 'Qizlar', ru: 'Девушки' },
    children: { uz: 'Yigitlar / Erkaklar uchun', ru: 'Для мужчин / парней' }
  },
  house_type: {
    brick: { uz: "G'ishtli", ru: 'Кирпичный' },
    panel: { uz: 'Panel', ru: 'Панельный' },
    monolith: { uz: 'Monolit', ru: 'Монолит' }
  },
  condition: {
    new: { uz: 'Yangi', ru: 'Новый' },
    good: { uz: 'Yaxshi', ru: 'Хорошее' },
    needs_repair: { uz: "Ta'mir kerak", ru: 'Требует ремонта' }
  },
  status: {
    pending: { uz: 'Kutilmoqda', ru: 'Ожидает' },
    approved: { uz: 'Tasdiqlangan', ru: 'Одобрено' },
    rejected: { uz: 'Rad etilgan', ru: 'Отклонено' }
  }
});

export function tAdmin(lang, key, vars = {}) {
  const safeLang = lang === 'ru' ? 'ru' : 'uz';
  const raw = ADMIN_UI_TEXT[key]?.[safeLang] ?? ADMIN_UI_TEXT[key]?.ru ?? key;
  if (typeof raw !== 'string') return String(raw);
  return raw.replace(/\{(\w+)\}/g, (_, token) => String(vars[token] ?? ''));
}

export function mapAdminEnum(lang, group, value) {
  if (value === null || value === undefined || value === '') return tAdmin(lang, 'unknown_value');
  const safeLang = lang === 'ru' ? 'ru' : 'uz';
  const normalized = String(value).toLowerCase();
  return ENUM_TRANSLATIONS[group]?.[normalized]?.[safeLang] ?? String(value);
}

export const ADMIN_STRINGS = Object.freeze({
  panelButton: ADMIN_UI_TEXT.panel_button.uz,
  backButton: ADMIN_UI_TEXT.back_button.uz,
  menuTitle: ADMIN_UI_TEXT.menu_title.uz,
  statsButton: ADMIN_UI_TEXT.stats_button.uz,
  adminMgmtButton: ADMIN_UI_TEXT.admin_mgmt_button.uz,
  moderationButton: ADMIN_UI_TEXT.moderation_button.uz,
  broadcastButton: ADMIN_UI_TEXT.broadcast_button.uz,
  settingsButton: ADMIN_UI_TEXT.settings_button.uz
});
