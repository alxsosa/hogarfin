-- 0004_budget.sql
-- budget_periods, budget_categories, budget_lines + budget vs actual view
-- Envelope / zero-based budgeting: income - allocated = unassigned

-- ============================================================================
-- budget_periods
-- ============================================================================
create table if not exists public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  period_month date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, period_month)
);

create index if not exists idx_budget_periods_household_id on public.budget_periods(household_id);

drop trigger if exists trg_budget_periods_updated_at on public.budget_periods;
create trigger trg_budget_periods_updated_at
  before update on public.budget_periods
  for each row execute function public.set_updated_at();

-- normalize period_month to the first of the month
create or replace function public.normalize_period_month()
returns trigger
language plpgsql
as $$
begin
  new.period_month := date_trunc('month', new.period_month)::date;
  return new;
end;
$$;

drop trigger if exists trg_budget_periods_normalize on public.budget_periods;
create trigger trg_budget_periods_normalize
  before insert or update on public.budget_periods
  for each row execute function public.normalize_period_month();

alter table public.budget_periods enable row level security;

drop policy if exists "budget_periods_select" on public.budget_periods;
create policy "budget_periods_select" on public.budget_periods
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "budget_periods_insert" on public.budget_periods;
create policy "budget_periods_insert" on public.budget_periods
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "budget_periods_update" on public.budget_periods;
create policy "budget_periods_update" on public.budget_periods
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "budget_periods_delete" on public.budget_periods;
create policy "budget_periods_delete" on public.budget_periods
  for delete using (public.is_household_member(household_id, 'admin'));

-- ============================================================================
-- budget_categories (toggle a category in/out of a period's budget)
-- ============================================================================
create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  budget_period_id uuid not null references public.budget_periods(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (budget_period_id, category_id)
);

create index if not exists idx_budget_categories_period_id on public.budget_categories(budget_period_id);
create index if not exists idx_budget_categories_category_id on public.budget_categories(category_id);

alter table public.budget_categories enable row level security;

drop policy if exists "budget_categories_select" on public.budget_categories;
create policy "budget_categories_select" on public.budget_categories
  for select using (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_categories.budget_period_id
        and public.is_household_member(bp.household_id, 'viewer')
    )
  );

drop policy if exists "budget_categories_insert" on public.budget_categories;
create policy "budget_categories_insert" on public.budget_categories
  for insert with check (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_categories.budget_period_id
        and public.is_household_member(bp.household_id, 'member')
    )
  );

drop policy if exists "budget_categories_delete" on public.budget_categories;
create policy "budget_categories_delete" on public.budget_categories
  for delete using (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_categories.budget_period_id
        and public.is_household_member(bp.household_id, 'member')
    )
  );

-- ============================================================================
-- budget_lines
-- ============================================================================
create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_period_id uuid not null references public.budget_periods(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  budgeted_amount numeric(14,2) not null default 0 check (budgeted_amount >= 0),
  rollover boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_period_id, category_id)
);

create index if not exists idx_budget_lines_period_id on public.budget_lines(budget_period_id);
create index if not exists idx_budget_lines_category_id on public.budget_lines(category_id);

drop trigger if exists trg_budget_lines_updated_at on public.budget_lines;
create trigger trg_budget_lines_updated_at
  before update on public.budget_lines
  for each row execute function public.set_updated_at();

alter table public.budget_lines enable row level security;

drop policy if exists "budget_lines_select" on public.budget_lines;
create policy "budget_lines_select" on public.budget_lines
  for select using (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_lines.budget_period_id
        and public.is_household_member(bp.household_id, 'viewer')
    )
  );

drop policy if exists "budget_lines_insert" on public.budget_lines;
create policy "budget_lines_insert" on public.budget_lines
  for insert with check (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_lines.budget_period_id
        and public.is_household_member(bp.household_id, 'member')
    )
  );

drop policy if exists "budget_lines_update" on public.budget_lines;
create policy "budget_lines_update" on public.budget_lines
  for update using (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_lines.budget_period_id
        and public.is_household_member(bp.household_id, 'member')
    )
  );

drop policy if exists "budget_lines_delete" on public.budget_lines;
create policy "budget_lines_delete" on public.budget_lines
  for delete using (
    exists (
      select 1 from public.budget_periods bp
      where bp.id = budget_lines.budget_period_id
        and public.is_household_member(bp.household_id, 'member')
    )
  );

-- ============================================================================
-- v_budget_vs_actual: budgeted vs actual spend per category per period,
-- actual computed live from transactions (never stored, never drifts).
-- ============================================================================
create or replace view public.v_budget_vs_actual
with (security_invoker = true)
as
select
  bp.household_id,
  bp.id as budget_period_id,
  bp.period_month,
  bl.id as budget_line_id,
  bl.category_id,
  c.name as category_name,
  bl.budgeted_amount,
  bl.rollover,
  coalesce(actual.actual_amount, 0) as actual_amount,
  bl.budgeted_amount - coalesce(actual.actual_amount, 0) as remaining
from public.budget_periods bp
join public.budget_lines bl on bl.budget_period_id = bp.id
join public.categories c on c.id = bl.category_id
left join lateral (
  select sum(t.amount) as actual_amount
  from public.transactions t
  where t.household_id = bp.household_id
    and t.category_id = bl.category_id
    and t.type = 'EXPENSE'
    and t.status <> 'void'
    and date_trunc('month', t.date)::date = bp.period_month
) actual on true;

-- ============================================================================
-- v_budget_unassigned: income - allocated = unassigned per household/period
-- ============================================================================
create or replace view public.v_budget_unassigned
with (security_invoker = true)
as
select
  bp.household_id,
  bp.id as budget_period_id,
  bp.period_month,
  coalesce(income.total_income, 0) as total_income,
  coalesce(allocated.total_allocated, 0) as total_allocated,
  coalesce(income.total_income, 0) - coalesce(allocated.total_allocated, 0) as unassigned
from public.budget_periods bp
left join lateral (
  select sum(t.amount) as total_income
  from public.transactions t
  where t.household_id = bp.household_id
    and t.type = 'INCOME'
    and t.status <> 'void'
    and date_trunc('month', t.date)::date = bp.period_month
) income on true
left join lateral (
  select sum(bl.budgeted_amount) as total_allocated
  from public.budget_lines bl
  where bl.budget_period_id = bp.id
) allocated on true;
