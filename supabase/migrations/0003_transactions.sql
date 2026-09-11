-- 0003_transactions.sql
-- transactions, transaction_splits, transfers with RLS
-- + trigger enforcing splits sum to parent amount
-- + v_household_cashflow view excluding transfers/adjustments from income/expense

-- ============================================================================
-- transactions
-- ============================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  date date not null default current_date,
  description text,
  merchant text,
  amount numeric(14,2) not null,
  currency char(3) not null default 'MXN',
  type text not null check (type in ('INCOME','EXPENSE','TRANSFER','ADJUSTMENT')),
  notes text,
  tags text[] not null default '{}',
  status text not null default 'cleared' check (status in ('pending','cleared','reconciled','void')),
  source text not null default 'manual' check (source in ('manual','import','rule','api')),
  external_id text,
  recurring_transaction_id uuid,
  transfer_id uuid,
  reconciled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_household_id on public.transactions(household_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_date on public.transactions(date);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_transfer_id on public.transactions(transfer_id);

-- Scaffold for future duplicate-import detection: at most one row per
-- household+account+external_id when external_id is supplied by an importer.
create unique index if not exists uq_transactions_household_external
  on public.transactions(household_id, account_id, external_id)
  where external_id is not null;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

drop policy if exists "transactions_select" on public.transactions;
create policy "transactions_select" on public.transactions
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert" on public.transactions
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "transactions_update" on public.transactions;
create policy "transactions_update" on public.transactions
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "transactions_delete" on public.transactions;
create policy "transactions_delete" on public.transactions
  for delete using (public.is_household_member(household_id, 'member'));

-- ============================================================================
-- transaction_splits
-- ============================================================================
create table if not exists public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transaction_splits_transaction_id on public.transaction_splits(transaction_id);
create index if not exists idx_transaction_splits_category_id on public.transaction_splits(category_id);

drop trigger if exists trg_transaction_splits_updated_at on public.transaction_splits;
create trigger trg_transaction_splits_updated_at
  before update on public.transaction_splits
  for each row execute function public.set_updated_at();

-- Enforce sum(splits.amount) = parent.amount via deferred constraint trigger
-- so multi-row inserts within one transaction settle before commit.
create or replace function public.enforce_split_sum()
returns trigger
language plpgsql
as $$
declare
  v_transaction_id uuid;
  v_parent_amount numeric(14,2);
  v_split_sum numeric(14,2);
begin
  v_transaction_id := coalesce(new.transaction_id, old.transaction_id);

  select amount into v_parent_amount
  from public.transactions
  where id = v_transaction_id;

  if v_parent_amount is null then
    return coalesce(new, old);
  end if;

  select coalesce(sum(amount), 0) into v_split_sum
  from public.transaction_splits
  where transaction_id = v_transaction_id;

  -- Only enforce once splits exist for the transaction; a transaction with
  -- zero splits is not required to be split.
  if v_split_sum <> 0 and v_split_sum <> v_parent_amount then
    raise exception 'transaction_splits sum (%) does not equal parent transaction amount (%) for transaction %',
      v_split_sum, v_parent_amount, v_transaction_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_enforce_split_sum on public.transaction_splits;
create constraint trigger trg_enforce_split_sum
  after insert or update or delete on public.transaction_splits
  deferrable initially deferred
  for each row execute function public.enforce_split_sum();

alter table public.transaction_splits enable row level security;

drop policy if exists "transaction_splits_select" on public.transaction_splits;
create policy "transaction_splits_select" on public.transaction_splits
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_splits.transaction_id
        and public.is_household_member(t.household_id, 'viewer')
    )
  );

drop policy if exists "transaction_splits_insert" on public.transaction_splits;
create policy "transaction_splits_insert" on public.transaction_splits
  for insert with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_splits.transaction_id
        and public.is_household_member(t.household_id, 'member')
    )
  );

drop policy if exists "transaction_splits_update" on public.transaction_splits;
create policy "transaction_splits_update" on public.transaction_splits
  for update using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_splits.transaction_id
        and public.is_household_member(t.household_id, 'member')
    )
  );

drop policy if exists "transaction_splits_delete" on public.transaction_splits;
create policy "transaction_splits_delete" on public.transaction_splits
  for delete using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_splits.transaction_id
        and public.is_household_member(t.household_id, 'member')
    )
  );

-- ============================================================================
-- transfers (links two transactions between own accounts)
-- ============================================================================
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid not null references public.accounts(id) on delete cascade,
  from_transaction_id uuid not null references public.transactions(id) on delete cascade,
  to_transaction_id uuid not null references public.transactions(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_transaction_id),
  unique (to_transaction_id),
  check (from_account_id <> to_account_id)
);

create index if not exists idx_transfers_household_id on public.transfers(household_id);
create index if not exists idx_transfers_from_account_id on public.transfers(from_account_id);
create index if not exists idx_transfers_to_account_id on public.transfers(to_account_id);

drop trigger if exists trg_transfers_updated_at on public.transfers;
create trigger trg_transfers_updated_at
  before update on public.transfers
  for each row execute function public.set_updated_at();

-- Keep transactions.transfer_id in sync so per-transaction queries can
-- cheaply detect transfer membership without joining transfers.
create or replace function public.sync_transfer_transaction_links()
returns trigger
language plpgsql
as $$
begin
  update public.transactions set transfer_id = new.id, type = 'TRANSFER'
    where id in (new.from_transaction_id, new.to_transaction_id);
  return new;
end;
$$;

drop trigger if exists trg_sync_transfer_links on public.transfers;
create trigger trg_sync_transfer_links
  after insert on public.transfers
  for each row execute function public.sync_transfer_transaction_links();

alter table public.transfers enable row level security;

drop policy if exists "transfers_select" on public.transfers;
create policy "transfers_select" on public.transfers
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "transfers_insert" on public.transfers;
create policy "transfers_insert" on public.transfers
  for insert with check (public.is_household_member(household_id, 'member'));

drop policy if exists "transfers_update" on public.transfers;
create policy "transfers_update" on public.transfers
  for update using (public.is_household_member(household_id, 'member'));

drop policy if exists "transfers_delete" on public.transfers;
create policy "transfers_delete" on public.transfers
  for delete using (public.is_household_member(household_id, 'member'));

-- ============================================================================
-- v_household_cashflow: income/expense aggregate that excludes transfers
-- and adjustments, per household per month.
-- ============================================================================
create or replace view public.v_household_cashflow
with (security_invoker = true)
as
select
  t.household_id,
  date_trunc('month', t.date)::date as period_month,
  sum(case when t.type = 'INCOME' then t.amount else 0 end) as total_income,
  sum(case when t.type = 'EXPENSE' then t.amount else 0 end) as total_expense,
  sum(case when t.type = 'INCOME' then t.amount else 0 end)
    - sum(case when t.type = 'EXPENSE' then t.amount else 0 end) as net_cashflow
from public.transactions t
where t.type in ('INCOME','EXPENSE')
  and t.status <> 'void'
group by t.household_id, date_trunc('month', t.date);
