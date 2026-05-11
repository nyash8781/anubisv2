-- Phase B.4 — Usage Events
-- Raw event log for cost tracking and limit enforcement
-- Created: 2026-05-10

-- Create usage_events table
create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null, -- ai_generation, email_sent, sms_sent, file_uploaded, payment_received, etc.
  input_tokens integer,
  output_tokens integer,
  count integer not null default 1, -- number of items (e.g., SMS segments)
  estimated_cost_usd numeric(10, 4) default 0,
  resource_type text, -- opportunity, proposal, job, etc.
  resource_id text,
  metadata jsonb default '{}', -- model, feature_key, to_email, template_key, etc.
  created_at timestamp with time zone not null default now()
);

-- Create indexes for rollup queries
create index idx_usage_events_organization_id on usage_events(organization_id);
create index idx_usage_events_user_id on usage_events(user_id);
create index idx_usage_events_event_type on usage_events(event_type);
create index idx_usage_events_created_at on usage_events(created_at);
create index idx_usage_events_org_type_date on usage_events(organization_id, event_type, created_at);

-- RLS Policy: usage_events — only service role can insert; org members/admins can read their own
alter table usage_events enable row level security;

create policy "Only service role can insert usage events"
  on usage_events
  for insert
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Organization members can view their usage events"
  on usage_events
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
