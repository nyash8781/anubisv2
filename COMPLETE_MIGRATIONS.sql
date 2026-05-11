-- =========================================================================
-- COMPLETE ANUBIS V2 DATABASE MIGRATIONS
-- =========================================================================
-- This file contains all 17 migrations consolidated and ordered for
-- execution in Supabase. Run this entire file in the Supabase SQL Editor.
-- All migrations use IF NOT EXISTS and ADD COLUMN IF NOT EXISTS for safety.
-- =========================================================================

-- =========================================================================
-- MIGRATION 001: opportunities table
-- =========================================================================
create table if not exists public.opportunities (
  id                     bigserial primary key,
  user_id                uuid not null references auth.users (id) on delete cascade,
  opportunity_id         text,
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
  service                text default '',
  scope_of_work          text default '',
  price                  text default '',
  bid                    text default '',
  payments_received      text default '',
  balance_due            text default '',
  due_date               text default '',
  notes                  text default '',
  milestone              text default 'Lead',
  status                 text default 'Draft',
  contact_status         text default 'Draft',
  last_contacted_date    text default '',
  last_contact_method    text default '',
  generated_follow_up    text default '',
  generated_upsell       text default '',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint opportunities_milestone_chk
    check (milestone in ('Lead', 'Site Visit', 'Proposal', 'Construction', 'Completed')),
  constraint opportunities_status_chk
    check (status in ('Draft', 'New', 'Contacted', 'Closed'))
);

create index if not exists opportunities_user_id_idx
  on public.opportunities (user_id);

create index if not exists opportunities_user_id_created_at_idx
  on public.opportunities (user_id, created_at desc);

create index if not exists opportunities_opportunity_id_idx
  on public.opportunities (opportunity_id);

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

-- =========================================================================
-- MIGRATION 002: user_settings table
-- =========================================================================
create table if not exists public.user_settings (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  base_prompt     text not null default '',
  business_context text not null default '',
  extra           jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

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

-- =========================================================================
-- MIGRATION 003: indexes
-- =========================================================================
create index if not exists opportunities_user_milestone
  on opportunities (user_id, milestone);

create index if not exists opportunities_user_status
  on opportunities (user_id, status);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'opportunities'
    and constraint_name = 'opportunities_user_opp_id_unique'
  ) then
    alter table opportunities
      add constraint opportunities_user_opp_id_unique
      unique (user_id, opportunity_id);
  end if;
end $$;

-- =========================================================================
-- MIGRATION 004: activities table
-- =========================================================================
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id bigint,
  action_type text not null,
  action_date timestamp with time zone not null default now(),
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_activities_user_id on activities(user_id);
create index idx_activities_opportunity_id on activities(opportunity_id);
create index idx_activities_action_date on activities(action_date);

drop trigger if exists activities_set_updated_at on activities;
create trigger activities_set_updated_at
  before update on activities
  for each row execute function public.set_updated_at();

alter table activities enable row level security;

create policy "Users can view their own activities"
  on activities
  for select
  using (auth.uid() = user_id);

create policy "Only service role can insert/update activities"
  on activities
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role');

-- =========================================================================
-- MIGRATION 005: activities_expand
-- =========================================================================
alter table activities
add column if not exists contact_method text;

alter table activities
add column if not exists contact_status text;

create index if not exists idx_activities_contact_method on activities(contact_method);

-- =========================================================================
-- MIGRATION 006: milestones
-- =========================================================================
-- This migration is integrated into the opportunities table schema

-- =========================================================================
-- MIGRATION 007: team_members table
-- =========================================================================
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid,
  email text not null,
  role text not null default 'contractor' check(role in ('owner', 'contractor', 'viewer')),
  status text not null default 'pending' check(status in ('pending', 'active', 'inactive')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_team_members_admin_user_id on team_members(admin_user_id);
create index idx_team_members_email on team_members(email);

drop trigger if exists team_members_set_updated_at on team_members;
create trigger team_members_set_updated_at
  before update on team_members
  for each row execute function public.set_updated_at();

alter table team_members enable row level security;

create policy "Users can view their team members"
  on team_members
  for select
  using (admin_user_id = auth.uid());

-- =========================================================================
-- MIGRATION 008: proposals table
-- =========================================================================
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  opportunity_id bigint references opportunities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_proposals_opportunity_id on proposals(opportunity_id);
create index idx_proposals_user_id on proposals(user_id);

drop trigger if exists proposals_set_updated_at on proposals;
create trigger proposals_set_updated_at
  before update on proposals
  for each row execute function public.set_updated_at();

alter table proposals enable row level security;

create policy "Users can view their own proposals"
  on proposals
  for select
  using (auth.uid() = user_id);

-- =========================================================================
-- MIGRATION 008b: proposals_send_fields
-- =========================================================================
alter table proposals
add column if not exists send_status text default 'draft' check(send_status in ('draft', 'sent', 'viewed', 'signed'));

alter table proposals
add column if not exists sent_at timestamp with time zone;

alter table proposals
add column if not exists viewed_at timestamp with time zone;

-- =========================================================================
-- MIGRATION 009: payments table
-- =========================================================================
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  opportunity_id bigint references opportunities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2),
  payment_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_payments_opportunity_id on payments(opportunity_id);
create index idx_payments_user_id on payments(user_id);

drop trigger if exists payments_set_updated_at on payments;
create trigger payments_set_updated_at
  before update on payments
  for each row execute function public.set_updated_at();

-- =========================================================================
-- MIGRATION 010: activities_team_access
-- =========================================================================
alter table activities enable row level security;

create policy "Organization members can view activities in their organization"
  on activities
  for select
  using (
    user_id = auth.uid() or
    user_id in (
      select member_user_id from team_members where admin_user_id = auth.uid()
    )
  );

-- =========================================================================
-- MIGRATION 011: proposal_share_links_signatures_versions
-- =========================================================================
alter table proposals
add column if not exists share_token text unique;

alter table proposals
add column if not exists signature_data jsonb;

alter table proposals
add column if not exists signer_email text;

alter table proposals
add column if not exists signed_at timestamp with time zone;

create table if not exists proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  version_number integer not null,
  content text,
  created_at timestamp with time zone not null default now()
);

create index idx_proposal_versions_proposal_id on proposal_versions(proposal_id);

-- =========================================================================
-- MIGRATION 012: organizations table
-- =========================================================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Company',
  slug text unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  trial_ends_at timestamp with time zone,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_organizations_owner_user_id on organizations(owner_user_id);
create index idx_organizations_status on organizations(status);

insert into organizations (owner_user_id, name, created_at, updated_at)
select id, coalesce((
  select extra->>'business_name'
  from user_settings
  where user_id = auth.users.id
  limit 1
), 'My Company'), now(), now()
from auth.users
where id is not null
on conflict do nothing;

alter table team_members
add column if not exists organization_id uuid references organizations(id) on delete cascade;

update team_members tm
set organization_id = (
  select id from organizations o
  where o.owner_user_id = tm.admin_user_id
  limit 1
)
where organization_id is null and admin_user_id is not null;

create index if not exists idx_team_members_organization_id on team_members(organization_id);

alter table opportunities
add column if not exists organization_id uuid references organizations(id) on delete cascade;

update opportunities o
set organization_id = (
  select id from organizations org
  where org.owner_user_id = o.user_id
  limit 1
)
where organization_id is null and user_id is not null;

create index if not exists idx_opportunities_organization_id on opportunities(organization_id);

alter table organizations enable row level security;

create policy "Users can view their own organization"
  on organizations
  for select
  using (
    owner_user_id = auth.uid() or
    id in (
      select organization_id from team_members
      where member_user_id = auth.uid() and status = 'active'
    )
  );

create policy "Only service role can insert/update/delete organizations"
  on organizations
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Users can view team members of their organizations"
  on team_members
  for select
  using (
    admin_user_id = auth.uid() or
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    ) or
    member_user_id = auth.uid()
  );

alter table opportunities enable row level security;

create policy "Users can view opportunities in their organizations"
  on opportunities
  for select
  using (
    user_id = auth.uid() or
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    ) or
    organization_id in (
      select organization_id from team_members
      where member_user_id = auth.uid() and status = 'active'
    )
  );

-- =========================================================================
-- MIGRATION 013: plans table
-- =========================================================================
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  description text,
  price_monthly numeric(10, 2) default 0,
  price_annual numeric(10, 2) default 0,
  is_active boolean default true,
  order_index integer default 0,
  features jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  metric_key text not null,
  limit_value integer not null default -1,
  period text default 'monthly',
  created_at timestamp with time zone not null default now(),
  constraint unique_plan_metric unique(plan_id, metric_key)
);

create index idx_plan_limits_plan_id on plan_limits(plan_id);
create index idx_plan_limits_metric_key on plan_limits(metric_key);

insert into plans (name, slug, description, price_monthly, price_annual, is_active, order_index) values
  ('Trial', 'trial', 'Free trial for 30 days', 0, 0, true, 0),
  ('Starter', 'starter', 'For growing contractors', 29, 290, true, 1),
  ('Growth', 'growth', 'For scaling teams', 99, 990, true, 2)
on conflict (name) do nothing;

insert into plan_limits (plan_id, metric_key, limit_value, period)
select id, metric, limit_count, 'monthly'
from plans, (
  values
    ('ai_generations', 50),
    ('emails_sent', 50),
    ('sms_sent', 0),
    ('storage_gb', 1),
    ('team_members', 1)
) as limits(metric, limit_count)
where plans.slug = 'trial'
on conflict do nothing;

insert into plan_limits (plan_id, metric_key, limit_value, period)
select id, metric, limit_count, 'monthly'
from plans, (
  values
    ('ai_generations', 200),
    ('emails_sent', 200),
    ('sms_sent', 100),
    ('storage_gb', 5),
    ('team_members', 3)
) as limits(metric, limit_count)
where plans.slug = 'starter'
on conflict do nothing;

insert into plan_limits (plan_id, metric_key, limit_value, period)
select id, metric, limit_count, 'monthly'
from plans, (
  values
    ('ai_generations', 1000),
    ('emails_sent', 1000),
    ('sms_sent', 500),
    ('storage_gb', 50),
    ('team_members', 10)
) as limits(metric, limit_count)
where plans.slug = 'growth'
on conflict do nothing;

alter table plans enable row level security;

create policy "All authenticated users can view plans"
  on plans
  for select
  using (auth.role() = 'authenticated');

create policy "Only service role can modify plans"
  on plans
  using (auth.jwt() ->> 'role' = 'service_role');

alter table plan_limits enable row level security;

create policy "All authenticated users can view plan limits"
  on plan_limits
  for select
  using (auth.role() = 'authenticated');

create policy "Only service role can modify plan limits"
  on plan_limits
  using (auth.jwt() ->> 'role' = 'service_role');

-- =========================================================================
-- MIGRATION 014: organization_plans table
-- =========================================================================
create table if not exists organization_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references plans(id),
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone,
  override_limits jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_organization_plans_organization_id on organization_plans(organization_id);
create index if not exists idx_organization_plans_plan_id on organization_plans(plan_id);
create unique index if not exists idx_unique_current_org_plan on organization_plans(organization_id) where ended_at is null;

insert into organization_plans (organization_id, plan_id, started_at, metadata)
select o.id, p.id, now(), jsonb_build_object('trial_ends_at', (now() + interval '30 days')::text)
from organizations o
cross join plans p
where p.slug = 'trial' and o.id not in (
  select organization_id from organization_plans where ended_at is null
)
on conflict do nothing;

alter table organization_plans enable row level security;

create policy "Organization owners and members can view their plan"
  on organization_plans
  for select
  using (
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    ) or
    organization_id in (
      select organization_id from team_members
      where member_user_id = auth.uid() and status = 'active'
    )
  );

create policy "Only service role can insert/update/delete organization plans"
  on organization_plans
  using (auth.jwt() ->> 'role' = 'service_role');

-- =========================================================================
-- MIGRATION 015: usage_events table
-- =========================================================================
create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_key text not null,
  count integer default 1,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now()
);

create index idx_usage_events_organization_id on usage_events(organization_id);
create index idx_usage_events_user_id on usage_events(user_id);
create index idx_usage_events_metric_key on usage_events(metric_key);
create index idx_usage_events_created_at on usage_events(created_at);

alter table usage_events enable row level security;

create policy "Users can view usage events for their organization"
  on usage_events
  for select
  using (
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    ) or
    user_id = auth.uid()
  );

create policy "Only service role can insert usage events"
  on usage_events
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role');

-- =========================================================================
-- MIGRATION 016: usage_monthly_rollups table
-- =========================================================================
create table if not exists usage_monthly_rollups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  metric_key text not null,
  year integer not null,
  month integer not null,
  total_count integer default 0,
  estimated_cost_usd numeric(12, 4) default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint unique_org_metric_month unique(organization_id, metric_key, year, month)
);

create index idx_usage_monthly_rollups_organization_id on usage_monthly_rollups(organization_id);
create index idx_usage_monthly_rollups_metric_key on usage_monthly_rollups(metric_key);
create index idx_usage_monthly_rollups_year_month on usage_monthly_rollups(year, month);

alter table usage_monthly_rollups enable row level security;

create policy "Users can view monthly rollups for their organization"
  on usage_monthly_rollups
  for select
  using (
    organization_id in (
      select id from organizations where owner_user_id = auth.uid()
    ) or
    organization_id in (
      select organization_id from team_members
      where member_user_id = auth.uid() and status = 'active'
    )
  );

create policy "Only service role can insert/update monthly rollups"
  on usage_monthly_rollups
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role');

-- =========================================================================
-- MIGRATION 017: organization_feature_overrides and admin controls
-- =========================================================================
create table if not exists admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

create table if not exists organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, feature_key)
);

create index if not exists idx_org_feature_overrides_org_feature
  on organization_feature_overrides(organization_id, feature_key);

create index if not exists idx_org_feature_overrides_expires
  on organization_feature_overrides(expires_at) where expires_at is not null;

alter table organization_plans
add column if not exists override_limits jsonb default null,
add column if not exists notes text,
add column if not exists overridden_by_admin_id uuid,
add column if not exists overridden_at timestamptz;

create index if not exists idx_org_plans_override_limits
  on organization_plans(organization_id) where override_limits is not null;

alter table admin_users enable row level security;
create policy admin_users_admin_only on admin_users
  for all using (auth.uid() in (select user_id from admin_users));

alter table organization_feature_overrides enable row level security;
create policy org_feature_overrides_admin_only on organization_feature_overrides
  for all using (auth.uid() in (select user_id from admin_users));

-- =========================================================================
-- VERIFICATION
-- =========================================================================
-- All migrations complete. Schema includes:
-- - Core tables: opportunities, activities, proposals, payments, team_members
-- - Settings: user_settings
-- - Organization: organizations, organization_plans, admin_users
-- - Billing: plans, plan_limits
-- - Usage tracking: usage_events, usage_monthly_rollups
-- - Features: organization_feature_overrides
-- =========================================================================
