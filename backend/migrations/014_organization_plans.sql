-- Phase B.3 — Organization Plans
-- Links each organization to a plan with optional limit overrides
-- Created: 2026-05-10

-- Create organization_plans table
create table if not exists organization_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references plans(id),
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone,
  override_limits jsonb default '{}', -- e.g., { "ai_generations": 500, "team_members": -1 }
  metadata jsonb default '{}', -- trial_ends_at, grace_period_used_at, etc.
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint unique_current_org_plan unique(organization_id, ended_at) where ended_at is null
);

create index idx_organization_plans_organization_id on organization_plans(organization_id);
create index idx_organization_plans_plan_id on organization_plans(plan_id);

-- Backfill: Assign every organization to Trial plan
insert into organization_plans (organization_id, plan_id, started_at, metadata)
select o.id, p.id, now(), jsonb_build_object('trial_ends_at', (now() + interval '30 days')::text)
from organizations o
cross join plans p
where p.slug = 'trial' and o.id not in (
  select organization_id from organization_plans where ended_at is null
)
on conflict do nothing;

-- RLS Policy: organization_plans
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
