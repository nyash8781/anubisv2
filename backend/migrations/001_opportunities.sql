-- =========================================================
-- Project Anubis — Migration 001: opportunities table
-- =========================================================
-- Run this in the Supabase SQL Editor:
--   Dashboard -> SQL Editor -> New Query -> paste -> Run
--
-- Idempotent: safe to re-run. Drops nothing. Creates table,
-- enables RLS, and installs per-user ownership policies.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------
create table if not exists public.opportunities (
  id                     bigserial primary key,
  user_id                uuid not null references auth.users (id) on delete cascade,

  -- Display identifier (e.g. P250423001). Generated at insert time in app code.
  opportunity_id         text,

  -- Customer
  customer_name          text default '',
  first_name             text default '',
  last_name              text default '',
  email                  text default '',
  phone                  text default '',
  mobile_number_1        text default '',
  mobile_number_2        text default '',
  address                text default '',
  address_1              text default '',
  city                   text default '',
  state                  text default '',
  zip_code               text default '',

  -- Work
  service                text default '',
  scope_of_work          text default '',

  -- Money (stored as text to match current frontend input behavior — migrate to numeric later)
  price                  text default '',
  bid                    text default '',
  payments_received      text default '',
  balance_due            text default '',
  due_date               text default '',

  -- Notes + workflow
  notes                  text default '',
  milestone              text default 'Lead',
  status                 text default 'Draft',
  contact_status         text default 'Draft',

  -- Contact tracking
  last_contacted_date    text default '',
  last_contact_method    text default '',

  -- AI-generated content (cached)
  generated_follow_up    text default '',
  generated_upsell       text default '',

  -- Timestamps
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  -- Milestone + status must be one of the allowed values (matches backend Zod schema)
  constraint opportunities_milestone_chk
    check (milestone in ('Lead', 'Site Visit', 'Proposal', 'Construction', 'Completed')),
  constraint opportunities_status_chk
    check (status in ('Draft', 'New', 'Contacted', 'Closed'))
);

-- ---------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------
create index if not exists opportunities_user_id_idx
  on public.opportunities (user_id);

create index if not exists opportunities_user_id_created_at_idx
  on public.opportunities (user_id, created_at desc);

create index if not exists opportunities_opportunity_id_idx
  on public.opportunities (opportunity_id);

-- ---------------------------------------------------------
-- 3. updated_at auto-maintenance
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 4. Row-Level Security
-- ---------------------------------------------------------
alter table public.opportunities enable row level security;

-- Each user sees and mutates only their own rows.
drop policy if exists "opportunities_select_own" on public.opportunities;
create policy "opportunities_select_own"
  on public.opportunities
  for select
  using (auth.uid() = user_id);

drop policy if exists "opportunities_insert_own" on public.opportunities;
create policy "opportunities_insert_own"
  on public.opportunities
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "opportunities_update_own" on public.opportunities;
create policy "opportunities_update_own"
  on public.opportunities
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "opportunities_delete_own" on public.opportunities;
create policy "opportunities_delete_own"
  on public.opportunities
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 5. Verify
-- ---------------------------------------------------------
-- Expect: 0 rows, no errors.
select count(*) as row_count from public.opportunities;

-- Expect: 4 policies named opportunities_{select,insert,update,delete}_own
select policyname from pg_policies where tablename = 'opportunities' order by policyname;
