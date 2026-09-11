import "server-only";
import { createClient } from "@/lib/supabase/server";

export { periodMonthKey } from "./period";

export type BudgetLineRow = {
  budget_line_id: string;
  category_id: string;
  category_name: string;
  budgeted_amount: number;
  rollover: boolean;
  actual_amount: number;
  remaining: number;
};

export type BudgetUnassignedRow = {
  total_income: number;
  total_allocated: number;
  unassigned: number;
};

/** Finds (but does not create) the budget_periods row for a household +
 * month. Returns null if the household hasn't started a budget for that
 * month yet — the page decides whether to prompt creating one. */
export async function getBudgetPeriod(householdId: string, periodMonth: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_periods")
    .select("id, period_month, notes")
    .eq("household_id", householdId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Budget lines for a period joined with live actuals, via
 * v_budget_vs_actual (actual is always computed from transactions,
 * never stored — see 0004_budget.sql). */
export async function getBudgetLines(
  budgetPeriodId: string
): Promise<BudgetLineRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_budget_vs_actual")
    .select(
      "budget_line_id, category_id, category_name, budgeted_amount, rollover, actual_amount, remaining"
    )
    .eq("budget_period_id", budgetPeriodId)
    .order("category_name");

  if (error || !data) return [];
  return data as BudgetLineRow[];
}

export async function getBudgetUnassigned(
  budgetPeriodId: string
): Promise<BudgetUnassignedRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_budget_unassigned")
    .select("total_income, total_allocated, unassigned")
    .eq("budget_period_id", budgetPeriodId)
    .maybeSingle();

  if (error || !data) {
    return { total_income: 0, total_allocated: 0, unassigned: 0 };
  }
  return data as BudgetUnassignedRow;
}

/** Categories not yet added to this period's budget_lines, so the UI can
 * offer them in an "agregar categoría" picker. EXPENSE-oriented budgeting
 * only shows non-income category groups; income categories are tracked
 * via v_budget_unassigned's total_income instead. */
export async function getUnbudgetedCategories(
  householdId: string,
  budgetPeriodId: string | null
) {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("household_id", householdId)
    .eq("archived", false)
    .not("parent_id", "is", null) // leaf categories only for budget lines
    .order("name");

  if (error || !categories) return [];
  if (!budgetPeriodId) return categories;

  const { data: lines } = await supabase
    .from("budget_lines")
    .select("category_id")
    .eq("budget_period_id", budgetPeriodId);

  const used = new Set((lines ?? []).map((l) => l.category_id));
  return categories.filter((c) => !used.has(c.id));
}
