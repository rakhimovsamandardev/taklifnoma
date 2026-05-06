function isMeaningful(value) {
  if (value === null || value === undefined) return false;
  const s = String(value).trim();
  return s !== '' && s !== '-' && s !== '—' && s.toLowerCase() !== 'n/a';
}

function formatNumber(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function formatPrice(amount, currency) {
  const formatted = formatNumber(amount);
  if (!formatted) return null;
  if (currency === 'RUB') return `${formatted} ₽`;
  return `${formatted} $`;
}

export function listingSummary(data, t) {
  const address = data.address ?? {};
  const locationLine = [address.region, address.district].filter(isMeaningful).join(', ');
  const manual = address.manual_address ?? null;
  const currency = data.price_currency === 'USD' ? 'USD' : (data.price_currency === 'RUB' ? 'RUB' : 'UZS');
  const priceLine = formatPrice(data.price, currency);

  const lines = [];

  if (isMeaningful(data.tenant_type)) {
    lines.push(`${t('summary_tenant_type')}: ${t(`tenant_type_${data.tenant_type}`)}`);
  }
  lines.push(`${t('summary_photos')}: ${data.photos?.length ?? 0}`);
  if (isMeaningful(data.rooms)) lines.push(`${t('summary_rooms')}: ${data.rooms}`);
  if (isMeaningful(data.type)) lines.push(`${t('summary_type')}: ${t(`house_type_${data.type}`)}`);
  if (isMeaningful(locationLine)) lines.push(`${t('summary_location')}: ${locationLine}`);
  if (isMeaningful(manual)) lines.push(`${t('summary_address')}: ${manual}`);
  if (isMeaningful(data.area)) lines.push(`${t('summary_area')}: ${data.area}`);
  if (isMeaningful(data.total_floors)) lines.push(`${t('summary_total_floors')}: ${data.total_floors}`);
  if (isMeaningful(data.current_floor)) lines.push(`${t('summary_current_floor')}: ${data.current_floor}`);
  if (isMeaningful(data.condition)) lines.push(`${t('summary_condition')}: ${t(`condition_${data.condition}`)}`);
  if (isMeaningful(priceLine)) lines.push(`${t('summary_price')}: ${priceLine}`);
  if (isMeaningful(data.phone)) lines.push(`${t('summary_phone')}: ${data.phone}`);

  return lines.join('\n');
}
