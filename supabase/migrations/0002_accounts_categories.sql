-- 0002_accounts_categories.sql
-- accounts, categories with RLS

-- ============================================================================
-- accounts
-- ============================================================================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  institution text,
  name text not null,
  type text not null check (type in (
    'checking','savings','cash','credit_card','investment',
    'retirement','loan','mortgage','other_asset','other_liability'
  )),
  currency char(3) not null default 'MXN',
  current_balance numeric(14,2) not null default 0,
  cleared_balance numeric(14,2) not null default 0,
  available_balance numeric(14,2) not null default 0,
  credit_limit numeric(14,2) check (credit_limit is null or credit_limit >= 0),
  interest_rate numeric(9,6) check (interest_rate is null or interest_rate >= 0),
  statement_date int check (statement_date is null or (statement_date between 1 and 31)),
  due_date int check (due_date is null or (due_date between 1 and 31)),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounts_household_id on public.accounts(household_id);
create index if not exists idx_accounts_owner_user_id on public.accounts(owner_user_id);
create index if not exists idx_accounts_type on public.accounts(type);

drop trigger if exists trg_accounts_updated_at on public.accounts;
create trigger trg_accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

drop policy if exists "accounts_select" on public.accounts;
create policy "accounts_select" on public.accounts
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "accounts_insert" on public.accounts;
create policy "accounts_insert" on public.accounts
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "accounts_update" on public.accounts;
create policy "accounts_update" on public.accounts
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "accounts_delete" on public.accounts;
create policy "accounts_delete" on public.accounts
  for delete using (public.is_household_member(household_id, 'admin'));

-- ============================================================================
-- categories (self-referencing tree: group -> subcategory)
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  sort_order int not null default 0,
  archived boolean not null default false,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_household_id on public.categories(household_id);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create unique index if not exists uq_categories_household_parent_name
  on public.categories(household_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- prevent a category from being its own ancestor (basic self-parent guard;
-- deeper cycle detection left to application layer given max 2 levels expected)
alter table public.categories
  drop constraint if exists chk_categories_not_self_parent;
alter table public.categories
  add constraint chk_categories_not_self_parent check (parent_id is distinct from id);

alter table public.categories enable row level security;

drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "categories_insert" on public.categories;
create policy "categories_insert" on public.categories
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "categories_update" on public.categories;
create policy "categories_update" on public.categories
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "categories_delete" on public.categories;
create policy "categories_delete" on public.categories
  for delete using (public.is_household_member(household_id, 'admin'));
