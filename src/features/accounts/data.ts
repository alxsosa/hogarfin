import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  id: string;
  household_id: string;
  owner_user_id: string | null;
  institution: string | null;
  name: string;
  type: string;
  currency: string;
  current_balance: number;
  cleared_balance: number;
  available_balance: number;
  credit_limit: number | null;
  interest_rate: number | null;
  statement_date: number | null;
  due_date: number | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const LIABILITY_TYPES = new Set([
  "credit_card",
  "loan",
  "mortgage",
  "other_liability",
]);

/** All active accounts for a household, ordered by type then name. */
export async function getHouseholdAccounts(
  householdId: string
): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("household_id", householdId)
    .eq("active", true)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as Account[];
}

export function isLiability(type: string): boolean {
  return LIABILITY_TYPES.has(type);
}

/** Totals derived from a set of accounts: assets, liabilities and net worth. */
export function summarizeAccounts(accounts: Account[]) {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    if (isLiability(account.type)) {
      totalLiabilities += account.current_balance;
    } else {
      totalAssets += account.current_balance;
    }
  }

  return {
    totalAssets,
    totalLiabilities,
    net: totalAssets - totalLiabilities,
  };
}
