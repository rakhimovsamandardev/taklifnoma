-- Migration: Pivot to free model — remove payment columns, add settings table & admin_users support.

-- 1. Drop payment columns (run after backing up data if needed)
alter table public.listings
  drop column if exists payment_screenshot,
  alter column service_fee set default 0;

-- 2. Create settings table (key/value store for bot configuration)
create table if not exists public.settings (
  key   text primary key,
  value text
);

-- Seed: ADMIN_IDS defaults to empty JSON array
insert into public.settings (key, value)
values ('ADMIN_IDS', '[]')
on conflict (key) do nothing;

-- 3. (Optional) Remove legacy payment setting rows if they exist
delete from public.settings where key in ('PAYMENT_CARD_NUMBER', 'SERVICE_FEE_PCT');
