import "server-only";
import { createClient } from "@/lib/supabase/server";

export type BillRow = {
  id: string;
  household_id: string;
  name: string;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  frequency: string;
  next_due_date: string | null;
  auto_pay: boolean;
  reminder_days_before: number;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  categories: { name: string } | null;
  accounts: { name: string } | null;
};

/**
 * Active bills for a household, ordered by next_due_date ascending (nulls
 * last), then name. `bills` has only a single FK to `categories` (via
 * category_id), unlike `transactions` which has two — so a plain
 * `categories(name)` embed is unambiguous here and needs no disambiguation
 * hint.
 */
export async function getHouseholdBills(householdId: string): Promise<BillRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*, categories(name), accounts(name)")
    .eq("household_id", householdId)
    .eq("active", true)
    .order("next_due_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as BillRow[];
}
