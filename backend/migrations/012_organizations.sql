-- Phase B.1 — Organizations table
-- Adds organization entity to support multi-user teams, plans, and usage tracking
-- Created: 2026-05-10

-- Create organizations table
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

-- Backfill: Create one organization per existing user
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

-- Add organization_id to team_members (nullable initially)
alter table team_members
add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- Backfill organization_id in team_members from admin_user_id
update team_members tm
set organization_id = (
  select id from organizations o
  where o.owner_user_id = tm.admin_user_id
  limit 1
)
where organization_id is null and admin_user_id is not null;

-- Add index for team_members.organization_id
create index if not exists idx_team_members_organization_id on team_members(organization_id);

-- Add organization_id to opportunities (nullable initially)
alter table opportunities
add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- Backfill organization_id in opportunities from user_id
update opportunities o
set organization_id = (
  select id from organizations org
  where org.owner_user_id = o.user_id
  limit 1
)
where organization_id is null and user_id is not null;

-- Add index for opportunities.organization_id
create index if not exists idx_opportunities_organization_id on opportunities(organization_id);

-- RLS Policy: Organizations table
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

-- RLS Policy: team_members — add organization check
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

-- RLS Policy: opportunities — add organization check
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
