-- Phase B.5 — Usage Monthly Rollups
-- Pre-aggregated monthly totals for fast dashboard queries and limit enforcement
-- Created: 2026-05-10

-- Create usage_monthly_rollups table
create table if not exists usage_monthly_rollups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  year integer not null,
  month integer not null check (month >= 1 and month <= 12),
  metric_key text not null,
  total_count integer not null default 0,
  total_value numeric(15, 2) default 0, -- for tokens, storage bytes, payment volume, etc.
  estimated_cost_usd numeric(10, 4) default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint unique_org_month_metric unique(organization_id, year, month, metric_key)
);

create index idx_usage_rollups_organization_id on usage_monthly_rollups(organization_id);
create index idx_usage_rollups_year_month on usage_monthly_rollups(year, month);
create index idx_usage_rollups_metric_key on usage_monthly_rollups(metric_key);
create index idx_usage_rollups_org_month_metric on usage_monthly_rollups(organization_id, year, month, metric_key);

-- RLS Policy: usage_monthly_rollups
alter table usage_monthly_rollups enable row level security;

create policy "Organization members can view their rollups"
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

create policy "Only service role can insert/update rollups"
  on usage_monthly_rollups
  using (auth.jwt() ->> 'role' = 'service_role');
