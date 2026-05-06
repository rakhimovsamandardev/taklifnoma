-- Supabase schema for listing flow persistence and payment moderation.

create table if not exists public.listings (
  id bigserial primary key,
  user_id text not null,
  tenant_type text,
  photos jsonb not null default '[]'::jsonb,
  region text,
  district text,
  rooms integer,
  house_type text,
  condition text,
  price numeric not null,
  service_fee numeric not null,
  contact_phone text,
  payment_screenshot text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_user_id on public.listings (user_id);
create index if not exists idx_listings_status on public.listings (status);

-- Square meters + floors (optional columns; bot inserts with schema-drift fallback if missing)
alter table if exists public.listings
  add column if not exists area numeric,
  add column if not exists total_floors integer,
  add column if not exists current_floor integer,
  add column if not exists price_currency text;

alter table if exists public.profile
  add column if not exists language text not null default 'uz',
  add column if not exists state text not null default 'IDLE',
  add column if not exists state_data jsonb not null default '{}'::jsonb;

alter table public.listings enable row level security;

drop policy if exists listings_select_own on public.listings;
create policy listings_select_own
on public.listings
for select
to authenticated
using (auth.uid()::text = user_id);

-- Service role can bypass RLS and is used by this bot.
