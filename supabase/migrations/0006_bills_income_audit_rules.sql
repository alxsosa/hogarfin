-- 0006_bills_income_audit_rules.sql
-- bills/recurring_expenses, income_sources, audit_logs, rules with RLS

-- ============================================================================
-- bills (recurring expenses)
-- ============================================================================
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  frequency text not null default 'monthly' check (frequency in (
    'weekly','biweekly','monthly','yearly','custom'
  )),
  next_due_date date,
  auto_pay boolean not null default false,
  reminder_days_before int not null default 3 check (reminder_days_before >= 0),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bills_household_id on public.bills(household_id);
create index if not exists idx_bills_next_due_date on public.bills(next_due_date);

drop trigger if exists trg_bills_updated_at on public.bills;
create trigger trg_bills_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

alter table public.bills enable row level security;

drop policy if exists "bills_select" on public.bills;
create policy "bills_select" on public.bills
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "bills_insert" on public.bills;
create policy "bills_insert" on public.bills
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "bills_update" on public.bills;
create policy "bills_update" on public.bills
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "bills_delete" on public.bills;
create policy "bills_delete" on public.bills
  for delete using (public.is_household_member(household_id, 'admin'));

-- ============================================================================
-- income_sources
-- ============================================================================
create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  expected_amount numeric(14,2) check (expected_amount is null or expected_amount >= 0),
  frequency text not null default 'monthly' check (frequency in (
    'weekly','biweekly','monthly','yearly','custom'
  )),
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_income_sources_household_id on public.income_sources(household_id);

drop trigger if exists trg_income_sources_updated_at on public.income_sources;
create trigger trg_income_sources_updated_at
  before update on public.income_sources
  for each row execute function public.set_updated_at();

alter table public.income_sources enable row level security;

drop policy if exists "income_sources_select" on public.income_sources;
create policy "income_sources_select" on public.income_sources
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "income_sources_insert" on public.income_sources;
create policy "income_sources_insert" on public.income_sources
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "income_sources_update" on public.income_sources;
create policy "income_sources_update" on public.income_sources
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "income_sources_delete" on public.income_sources;
create policy "income_sources_delete" on public.income_sources
  for delete using (public.is_household_member(household_id, 'admin'));

-- ============================================================================
-- audit_logs (append-only)
-- ============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_household_id on public.audit_logs(household_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

alter table public.audit_logs enable row level security;

-- Append-only: members can read their household's log, but nobody updates
-- or deletes via the API (writes happen through a SECURITY DEFINER RPC or
-- service-role key in application code, not direct client inserts, so no
-- insert policy is granted to regular members here — service role bypasses
-- RLS entirely).
drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs
  for select using (
    household_id is null or public.is_household_member(household_id, 'admin')
  );

-- ============================================================================
-- rules (auto-categorization)
-- ============================================================================
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text,
  match_field text not null default 'description' check (match_field in (
    'description','merchant','amount'
  )),
  match_type text not null check (match_type in (
    'contains','starts_with','ends_with','equals','amount_gt','amount_lt'
  )),
  match_value text not null,
  action text not null check (action in (
    'categorize','tag','flag','split','ignore','convert_to_transfer'
  )),
  action_value jsonb,
  priority int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rules_household_id on public.rules(household_id);
create index if not exists idx_rules_priority on public.rules(priority);

drop trigger if exists trg_rules_updated_at on public.rules;
create trigger trg_rules_updated_at
  before update on public.rules
  for each row execute function public.set_updated_at();

alter table public.rules enable row level security;

drop policy if exists "rules_select" on public.rules;
create policy "rules_select" on public.rules
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "rules_insert" on public.rules;
create policy "rules_insert" on public.rules
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "rules_update" on public.rules;
create policy "rules_update" on public.rules
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "rules_delete" on public.rules;
create policy "rules_delete" on public.rules
  for delete using (public.is_household_member(household_id, 'admin'));
