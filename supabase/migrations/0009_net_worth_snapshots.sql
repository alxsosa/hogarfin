-- 0009_net_worth_snapshots.sql
-- Monthly net worth history — snapshots (not live-computed, so history
-- survives balance changes). Complements the live getNetWorthBreakdown()
-- in src/features/net-worth/data.ts, which still drives the "right now"
-- view; this table only powers the trend chart.

-- ============================================================================
-- net_worth_snapshots
-- ============================================================================
create table if not exists public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  snapshot_date date not null,
  assets_total numeric(14,2) not null default 0,
  liabilities_total numeric(14,2) not null default 0,
  net_worth numeric(14,2) not null default 0,
  -- breakdown by account so a future "what changed" view doesn't need to
  -- reconstruct it from live account rows (which may since be edited,
  -- archived, or deleted) — keeps a snapshot a true point-in-time record.
  breakdown jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- one snapshot per household per calendar day — "record today's
  -- snapshot again" replaces the earlier one instead of duplicating.
  unique (household_id, snapshot_date)
);

create index if not exists idx_net_worth_snapshots_household_id
  on public.net_worth_snapshots(household_id);
create index if not exists idx_net_worth_snapshots_date
  on public.net_worth_snapshots(household_id, snapshot_date);

alter table public.net_worth_snapshots enable row level security;

drop policy if exists "net_worth_snapshots_select" on public.net_worth_snapshots;
create policy "net_worth_snapshots_select" on public.net_worth_snapshots
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "net_worth_snapshots_insert" on public.net_worth_snapshots;
create policy "net_worth_snapshots_insert" on public.net_worth_snapshots
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "net_worth_snapshots_update" on public.net_worth_snapshots;
create policy "net_worth_snapshots_update" on public.net_worth_snapshots
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "net_worth_snapshots_delete" on public.net_worth_snapshots;
create policy "net_worth_snapshots_delete" on public.net_worth_snapshots
  for delete using (public.is_household_member(household_id, 'admin'));
