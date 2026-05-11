-- Phase B.2 — Plans and Plan Limits
-- Defines pricing tiers and their limits
-- Created: 2026-05-10

-- Create plans table
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

-- Create plan_limits table
create table if not exists plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  metric_key text not null,
  limit_value integer not null default -1, -- -1 = unlimited
  period text default 'monthly', -- monthly, annual, total
  created_at timestamp with time zone not null default now(),
  constraint unique_plan_metric unique(plan_id, metric_key)
);

create index idx_plan_limits_plan_id on plan_limits(plan_id);
create index idx_plan_limits_metric_key on plan_limits(metric_key);

-- Seed plans
insert into plans (name, slug, description, price_monthly, price_annual, is_active, order_index) values
  ('Trial', 'trial', 'Free trial for 30 days', 0, 0, true, 0),
  ('Starter', 'starter', 'For growing contractors', 29, 290, true, 1),
  ('Growth', 'growth', 'For scaling teams', 99, 990, true, 2)
on conflict (name) do nothing;

-- Seed plan limits for Trial plan
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

-- Seed plan limits for Starter plan
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

-- Seed plan limits for Growth plan
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

-- RLS Policy: Plans table — readable by all authenticated users (for upgrade prompts), writable by service role only
alter table plans enable row level security;

create policy "All authenticated users can view plans"
  on plans
  for select
  using (auth.role() = 'authenticated');

create policy "Only service role can modify plans"
  on plans
  using (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policy: Plan limits — same as plans
alter table plan_limits enable row level security;

create policy "All authenticated users can view plan limits"
  on plan_limits
  for select
  using (auth.role() = 'authenticated');

create policy "Only service role can modify plan limits"
  on plan_limits
  using (auth.jwt() ->> 'role' = 'service_role');
