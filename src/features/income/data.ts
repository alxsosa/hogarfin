import "server-only";
import { createClient } from "@/lib/supabase/server";

export type IncomeSourceRow = {
  id: string;
  household_id: string;
  name: string;
  expected_amount: number | null;
  frequency: "weekly" | "biweekly" | "monthly" | "yearly" | "custom";
  account_id: string | null;
  category_id: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  account: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
};

/** Active income sources for a household, ordered by name, joined with
 * account/category names. income_sources has only one FK to each, so a
 * plain nested embed is unambiguous. */
export async function getHouseholdIncomeSources(
  householdId: string
): Promise<IncomeSourceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_sources")
    .select(
      "id, household_id, name, expected_amount, frequency, account_id, category_id, notes, active, created_at, updated_at, accounts(id, name), categories(id, name)"
    )
    .eq("household_id", householdId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as unknown as IncomeSourceRow & {
      accounts: { id: string; name: string } | null;
      categories: { id: string; name: string } | null;
    };
    return {
      id: r.id,
      household_id: r.household_id,
      name: r.name,
      expected_amount: r.expected_amount,
      frequency: r.frequency,
      account_id: r.account_id,
      category_id: r.category_id,
      notes: r.notes,
      active: r.active,
      created_at: r.created_at,
      updated_at: r.updated_at,
      account: r.accounts,
      category: r.categories,
    };
  });
}

/** Sum of actual income transactions received this calendar month. */
export async function getMonthlyActualIncome(
  householdId: string
): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("household_id", householdId)
    .eq("type", "INCOME")
    .neq("status", "void")
    .gte("date", startStr)
    .lt("date", endStr);

  if (error || !data) return 0;

  return data.reduce((sum, row) => sum + (row.amount as number), 0);
}
