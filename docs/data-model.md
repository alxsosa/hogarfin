# Oikos — Data Model (PostgreSQL / Supabase)

Multi-tenant household finance SaaS. Tenancy boundary is the **household**
(`households.id`), enforced end-to-end with Postgres Row Level Security (RLS).
The frontend is never trusted for isolation — every household-scoped table
has RLS enabled and policies that verify membership server-side.

## 0. Conventions

- Primary keys: `uuid default gen_random_uuid()`.
- Timestamps: `timestamptz`, `created_at default now()`, `updated_at`
  maintained by a shared `set_updated_at()` trigger.
- Soft delete: boolean flags (`active`, `archived`) instead of hard deletes
  on domain/master data (accounts, categories, funds, goals, debts, bills,
  income sources, rules). Transactional rows (transactions, splits,
  transfers) are not soft-deleted in phase 1; `status` covers voids.
- Money: `numeric(14,2)` for currency amounts, `numeric(9,6)` for rates.
- Currency: `char(3)` ISO 4217, default `'MXN'`.
- Every household-scoped table has a `household_id uuid not null references
  households(id) on delete cascade` and a btree index on it.
- RLS helper: `is_household_member(household_id uuid, min_role text default
  'viewer')` — `SECURITY DEFINER` function defined in migration 0001, used
  by every policy in every later migration. This avoids recursive-RLS
  problems (a policy on `household_members` that queries
  `household_members` to check itself) and keeps every policy body a
  one-liner.
- Role hierarchy (phase 1): `OWNER > ADMIN > MEMBER > VIEWER`. Stored as
  text with a check constraint rather than a hard enum so `ACCOUNTANT` /
  `ADVISOR` can be added later with a simple constraint change instead of
  an enum migration.

## 1. Entity overview

```
auth.users (Supabase managed)
   └─ profiles (1:1)
        └─ household_members (N:N bridge) ─── households
                                                  ├─ household_invitations
                                                  ├─ accounts
                                                  ├─ categories (self-referencing tree)
                                                  ├─ transactions ── transaction_splits
                                                  │        └─ transfers (pairs 2 transactions)
                                                  ├─ budget_periods ── budget_lines ── budget_categories
                                                  ├─ funds
                                                  ├─ goals
                                                  ├─ debts
                                                  ├─ bills / recurring_expenses
                                                  ├─ income_sources
                                                  ├─ rules
                                                  └─ audit_logs
```

## 2. Phase 1 — Identity & tenancy

### profiles
Extends `auth.users`. `id` = `auth.users.id` (shared PK, `references
auth.users(id) on delete cascade`). Holds display name, avatar, locale,
default currency. Auto-created via `on_auth_user_created` trigger on
`auth.users` (AFTER INSERT), `SECURITY DEFINER`.

### households
`id`, `name`, `currency` (default household currency), `timezone`,
`created_by`, timestamps. A household is the tenancy root; every
downstream table cascades from it.

### household_members
Bridge `user_id` × `household_id`, unique together. `role text check
(role in ('OWNER','ADMIN','MEMBER','VIEWER'))`. `invited_by`, `joined_at`.
A user can belong to many households (personal + shared), so no unique
constraint on `user_id` alone.

### household_invitations
`household_id`, `email`, `role`, `token` (unique, random), `status`
(`PENDING/ACCEPTED/EXPIRED/REVOKED`), `expires_at`, `invited_by`,
`accepted_by` (nullable, filled on accept). Accepting converts to a
`household_members` row (application logic / a `accept_invitation()` RPC
in a later phase — not required for phase 1 schema).

## 3. Phase 2 — Money primitives

### accounts
Household-scoped, optionally `owner_user_id` (personal vs shared account
within the household). `type` constrained to: `checking, savings, cash,
credit_card, investment, retirement, loan, mortgage, other_asset,
other_liability`. Balance fields: `current_balance, cleared_balance,
available_balance` (all nullable-safe defaults 0), plus credit-specific
`credit_limit, interest_rate, statement_date, due_date`. `active boolean`
for soft archive. No blanket non-negative constraint on balance (credit
cards/loans are legitimately negative-as-liability or represented as
positive liability depending on convention) — instead a lighter check
that `credit_limit >= 0` and `interest_rate >= 0` when present.

### categories
Household-scoped, self-referencing (`parent_id`) for group → subcategory.
`name, icon, color, sort_order, archived`. Seed defaults are inserted by
migration 0007's function, not hardcoded into the table.

## 4. Phase 2 — Transactions

### transactions
`household_id, account_id, category_id, subcategory_id (fk categories,
nullable), user_id (who entered it), date, description, merchant, amount
numeric(14,2), currency, type check in ('INCOME','EXPENSE','TRANSFER',
'ADJUSTMENT'), notes, tags text[], status check in ('pending','cleared',
'reconciled','void'), source (manual/import/rule/api), external_id (for
import dedupe), recurring_transaction_id, transfer_id, reconciled
boolean`. Indexes on `household_id`, `account_id`, `category_id`, `date`,
and a partial unique-ish scaffold `(household_id, external_id)` where
`external_id is not null` for future duplicate-import detection.

### transaction_splits
One parent transaction → many category allocations. `transaction_id,
category_id, amount, notes`. A trigger (`enforce_split_sum`) checks
`sum(splits.amount) = parent.amount` on insert/update/delete (deferred
constraint trigger so multi-row inserts in one statement/transaction are
allowed to settle before commit).

### transfers
Links exactly two transactions (`from_transaction_id, to_transaction_id`,
both unique fk → transactions, `on delete cascade`) plus `from_account_id,
to_account_id, amount, date`. Transactions that belong to a transfer carry
`type = 'TRANSFER'` and are excluded from income/expense aggregates by
the `v_household_cashflow` view (`where type in ('INCOME','EXPENSE')`).

## 5. Phase 3 — Budgeting (envelope / zero-based)

### budget_periods
`household_id, period_month date` (first-of-month convention), unique
`(household_id, period_month)`.

### budget_categories
Denormalized-friendly link table `budget_period_id, category_id`,
allowing a category to be toggled in/out of a specific month's budget
without deleting history.

### budget_lines
`budget_period_id, category_id, budgeted_amount numeric(14,2) check (>=
0), rollover boolean, notes`. Actual spend is **not** stored — it's
computed via `v_budget_vs_actual`, joining `budget_lines` to
`transactions` (EXPENSE type, matching category+month) so it's always
consistent with ledger data. The view also computes household
`income - allocated = unassigned` via a per-period aggregate.

## 6. Forward-compatible modules (stubs now, full shape later)

- **funds** — sinking funds: `goal_amount, current_balance, target_date,
  monthly_contribution, linked_category_id, linked_account_id`.
- **goals** — `type check in ('savings','emergency_fund','purchase',
  'debt_free','investment','custom')`, `target_amount, current_amount,
  target_date, priority`.
- **debts** — `creditor, original_balance, current_balance,
  interest_rate, minimum_payment, planned_payment, due_date,
  opened_date`. `strategy` field (`snowball`/`avalanche`/`custom`) added
  now as nullable text so phase-2 payoff-planning logic can read it
  without a migration.
- **bills / recurring_expenses** — `name, amount, category_id, account_id,
  frequency (weekly/biweekly/monthly/yearly/custom), next_due_date,
  auto_pay, reminder_days_before`.
- **income_sources** — `name, expected_amount, frequency, account_id,
  category_id`.
- **audit_logs** — `user_id, household_id, action, entity, entity_id,
  changes jsonb, created_at`. Written by application code (not triggers)
  to keep it generic across all tables.
- **rules** — auto-categorization. `match_field (description/merchant/
  amount), match_type check in ('contains','starts_with','ends_with',
  'equals','amount_gt','amount_lt'), match_value, action check in
  ('categorize','tag','flag','split','ignore','convert_to_transfer'),
  action_value jsonb, priority, active`.

## 7. RLS pattern (applied uniformly)

```sql
alter table <table> enable row level security;

create policy "<table>_select" on <table>
  for select using (is_household_member(household_id));

create policy "<table>_write" on <table>
  for insert with check (is_household_member(household_id, 'member'));

create policy "<table>_update" on <table>
  for update using (is_household_member(household_id, 'member'));

create policy "<table>_delete" on <table>
  for delete using (is_household_member(household_id, 'admin'));
```

`households` and `household_members` themselves use `id` / `household_id`
respectively against the same helper. `household_invitations` restricts
insert/update/delete to `admin`+ and select to any member (so members can
see pending invites).

## 8. Notable design decisions

1. **Helper function instead of inline subqueries** avoids the classic
   Postgres RLS recursion trap where a policy on `household_members`
   needs to query `household_members`. `is_household_member` is
   `SECURITY DEFINER` with a locked-down `search_path`, callable from any
   policy.
2. **Role as text + check constraint, not enum** — enums are painful to
   extend (`ALTER TYPE ... ADD VALUE` can't run in a transaction in older
   PG, and Supabase migrations should stay simple/idempotent). A check
   constraint is trivially replaced with `alter table ... drop
   constraint ... add constraint ...` to add `ACCOUNTANT`/`ADVISOR` later.
3. **Splits validated by deferred trigger, not a CHECK** — CHECK
   constraints can't aggregate across sibling rows; a deferred
   `AFTER ... FOR EACH ROW` trigger recalculates the sum at
   transaction-commit time.
4. **Transfers as a link table over two real transaction rows** (rather
   than a special "no category" transaction type only) keeps
   double-entry bookkeeping honest — money leaves one account and lands
   in another, both rows exist for reconciliation, and the cashflow view
   simply filters `type` to exclude `TRANSFER`/`ADJUSTMENT`.
5. **Budget actuals computed via view, not stored** — prevents drift
   between the budget and the ledger; `v_budget_vs_actual` is the single
   source of truth for "actual spent".
6. **Default categories seeded by callable function**, not hardcoded
   rows or a fixture migration, so (a) re-running migrations in dev is
   idempotent, (b) new households created later still get sensible
   defaults via an `after insert on households` trigger, and (c) a
   household can re-seed intentionally via direct RPC call.
7. **Soft delete via `active`/`archived`** on master data preserves
   referential integrity for historical transactions/reports even after
   a user archives an account or category.
