-- =========================================================
-- Project Anubis — Migration 002: user_settings table
-- =========================================================
-- Run in Supabase SQL Editor after 001_opportunities.sql.
-- Stores per-user AI configuration (base_prompt, business_context)
-- and any other app-wide settings that should survive browser clears.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------
create table if not exists public.user_settings (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  base_prompt     text not null default '',
  business_context text not null default '',
  -- Catch-all JSONB column for future settings without schema migrations.
  extra           jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. updated_at auto-maintenance (reuse function from 001)
-- ---------------------------------------------------------
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 3. Row-Level Security
-- ---------------------------------------------------------
alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 4. Verify
-- ---------------------------------------------------------
select count(*) as row_count from public.user_settings;
