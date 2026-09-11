import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CategorySpendRow = {
  categoryId: string;
  categoryName: string;
  color: string | null;
  icon: string | null;
  total: number;
};

/** Total EXPENSE amount per top-level category group for a household,
 * within an optional date range (defaults to the current calendar year).
 * Subcategory spend rolls up into its parent group so the chart reads at
 * a glance; categories with no parent are their own group. */
export async function getSpendByCategory(
  householdId: string,
  opts?: { from?: string; to?: string }
): Promise<CategorySpendRow[]> {
  const supabase = await createClient();
  const from = opts?.from ?? `${new Date().getFullYear()}-01-01`;
  const to = opts?.to ?? `${new Date().getFullYear()}-12-31`;

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, parent_id, color, icon")
      .eq("household_id", householdId),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("household_id", householdId)
      .eq("type", "EXPENSE")
      .neq("status", "void")
      .gte("date", from)
      .lte("date", to),
  ]);

  if (!categories || !transactions) return [];

  const byId = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (!t.category_id) continue;
    const cat = byId.get(t.category_id);
    if (!cat) continue;
    // Roll subcategory spend up into its top-level parent group.
    const groupId = cat.parent_id ?? cat.id;
    totals.set(groupId, (totals.get(groupId) ?? 0) + Number(t.amount));
  }

  const rows: CategorySpendRow[] = [];
  for (const [groupId, total] of totals.entries()) {
    const group = byId.get(groupId);
    if (!group) continue;
    rows.push({
      categoryId: groupId,
      categoryName: group.name,
      color: group.color,
      icon: group.icon,
      total,
    });
  }

  return rows.sort((a, b) => b.total - a.total);
}

export type MonthlyFlowRow = {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
};

/** Income vs expense per calendar month for the trailing N months
 * (default 6), computed directly from transactions — mirrors the same
 * INCOME/EXPENSE-only, non-void filter as v_household_cashflow. */
export async function getMonthlyIncomeVsExpense(
  householdId: string,
  months = 6
): Promise<MonthlyFlowRow[]> {
  const supabase = await createClient();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
  const fromDate = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, type")
    .eq("household_id", householdId)
    .in("type", ["INCOME", "EXPENSE"])
    .neq("status", "void")
    .gte("date", fromDate);

  if (error || !data) return [];

  const byMonth = new Map<string, MonthlyFlowRow>();
  // Pre-seed every month in range so empty months still render as $0 bars
  // instead of disappearing from the chart.
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, { month: key, income: 0, expense: 0 });
  }

  for (const t of data) {
    const key = t.date.slice(0, 7);
    const row = byMonth.get(key);
    if (!row) continue;
    if (t.type === "INCOME") row.income += Number(t.amount);
    else row.expense += Number(t.amount);
  }

  return Array.from(byMonth.values());
}

export type BudgetVsActualRow = {
  categoryName: string;
  budgeted: number;
  actual: number;
  remaining: number;
};

/** Budget vs actual for a given period month ("YYYY-MM-01"), reading
 * directly from v_budget_vs_actual (0004_budget.sql) — actual is always
 * computed live from transactions there, never stored. */
export async function getBudgetVsActual(
  householdId: string,
  periodMonth: string
): Promise<BudgetVsActualRow[]> {
  const supabase = await createClient();

  const { data: period } = await supabase
    .from("budget_periods")
    .select("id")
    .eq("household_id", householdId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (!period) return [];

  const { data, error } = await supabase
    .from("v_budget_vs_actual")
    .select("category_name, budgeted_amount, actual_amount, remaining")
    .eq("budget_period_id", period.id)
    .order("actual_amount", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    categoryName: r.category_name,
    budgeted: Number(r.budgeted_amount),
    actual: Number(r.actual_amount),
    remaining: Number(r.remaining),
  }));
}

export type ExportTransactionRow = {
  date: string;
  description: string | null;
  merchant: string | null;
  category: string | null;
  account: string | null;
  type: string;
  amount: number;
  currency: string;
  notes: string | null;
};

/** All non-void transactions for CSV export, joined with account and
 * category names. Uses the disambiguated FK name
 * (categories!transactions_category_id_fkey) — transactions has two FKs
 * into categories (category_id, subcategory_id), so a plain nested
 * `categories(...)` embed is rejected by PostgREST as ambiguous. */
export async function getTransactionsForExport(
  householdId: string
): Promise<ExportTransactionRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "date, description, merchant, amount, currency, type, notes, accounts(name), categories!transactions_category_id_fkey(name)"
    )
    .eq("household_id", householdId)
    .neq("status", "void")
    .order("date", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as unknown as {
      date: string;
      description: string | null;
      merchant: string | null;
      amount: number;
      currency: string;
      type: string;
      notes: string | null;
      accounts: { name: string } | null;
      categories: { name: string } | null;
    };
    return {
      date: r.date,
      description: r.description,
      merchant: r.merchant,
      category: r.categories?.name ?? null,
      account: r.accounts?.name ?? null,
      type: r.type,
      amount: r.amount,
      currency: r.currency,
      notes: r.notes,
    };
  });
}
