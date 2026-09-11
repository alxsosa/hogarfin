-- 0005_funds_goals_debts.sql
-- funds (sinking funds), goals, debts with RLS

-- ============================================================================
-- funds (sinking funds)
-- ============================================================================
create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  goal_amount numeric(14,2) not null default 0 check (goal_amount >= 0),
  current_balance numeric(14,2) not null default 0 check (current_balance >= 0),
  target_date date,
  monthly_contribution numeric(14,2) check (monthly_contribution is null or monthly_contribution >= 0),
  linked_category_id uuid references public.categories(id) on delete set null,
  linked_account_id uuid references public.accounts(id) on delete set null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_funds_household_id on public.funds(household_id);

drop trigger if exists trg_funds_updated_at on public.funds;
create trigger trg_funds_updated_at
  before update on public.funds
  for each row execute function public.set_updated_at();

alter table public.funds enable row level security;

drop policy if exists "funds_select" on public.funds;
create policy "funds_select" on public.funds
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "funds_insert" on public.funds;
create policy "funds_insert" on public.funds
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "funds_update" on public.funds;
create policy "funds_update" on public.funds
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "funds_delete" on public.funds;
create policy "funds_delete" on public.funds
  for delete using (public.is_household_member(household_id, 'admin'));

-- ============================================================================
-- goals
-- ============================================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null default 'custom' check (type in (
    'savings','emergency_fund','purchase','debt_free','investment','custom'
  )),
  target_amount numeric(14,2) not null default 0 check (target_amount >= 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  priority int not null default 0,
  linked_account_id uuid references public.accounts(id) on delete set null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_household_id on public.goals(household_id);
create index if not exists idx_goals_type on public.goals(type);

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

alter table public.goals enable row level security;

drop policy if exists "goals_select" on public.goals;
create policy "goals_select" on public.goals
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "goals_insert" on public.goals;
create policy "goals_insert" on public.goals
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "goals_update" on public.goals;
create policy "goals_update" on public.goals
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "goals_delete" on public.goals;
create policy "goals_delete" on public.goals
  for delete using (public.is_household_member(household_id, 'admin'));

-- ============================================================================
-- debts
-- ============================================================================
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  linked_account_id uuid references public.accounts(id) on delete set null,
  creditor text not null,
  original_balance numeric(14,2) not null default 0 check (original_balance >= 0),
  current_balance numeric(14,2) not null default 0 check (current_balance >= 0),
  interest_rate numeric(9,6) check (interest_rate is null or interest_rate >= 0),
  minimum_payment numeric(14,2) check (minimum_payment is null or minimum_payment >= 0),
  planned_payment numeric(14,2) check (planned_payment is null or planned_payment >= 0),
  strategy text check (strategy is null or strategy in ('snowball','avalanche','custom')),
  opened_date date,
  due_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_debts_household_id on public.debts(household_id);

drop trigger if exists trg_debts_updated_at on public.debts;
create trigger trg_debts_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

alter table public.debts enable row level security;

drop policy if exists "debts_select" on public.debts;
create policy "debts_select" on public.debts
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "debts_insert" on public.debts;
create policy "debts_insert" on public.debts
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "debts_update" on public.debts;
create policy "debts_update" on public.debts
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "debts_delete" on public.debts;
create policy "debts_delete" on public.debts
  for delete using (public.is_household_member(household_id, 'admin'));
