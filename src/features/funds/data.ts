import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FundRow = {
  id: string;
  household_id: string;
  name: string;
  goal_amount: number;
  current_balance: number;
  target_date: string | null;
  monthly_contribution: number | null;
  linked_category_id: string | null;
  linked_account_id: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type GoalRow = {
  id: string;
  household_id: string;
  name: string;
  type: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: number;
  linked_account_id: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type DebtRow = {
  id: string;
  household_id: string;
  linked_account_id: string | null;
  creditor: string;
  original_balance: number;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  planned_payment: number | null;
  strategy: string | null;
  opened_date: string | null;
  due_date: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/** Active funds for a household, target_date ascending (nulls last), then name. */
export async function getHouseholdFunds(householdId: string): Promise<FundRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funds")
    .select("*")
    .eq("household_id", householdId)
    .eq("active", true)
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as FundRow[];
}

/** Active goals for a household, target_date ascending (nulls last), then name. */
export async function getHouseholdGoals(householdId: string): Promise<GoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("household_id", householdId)
    .eq("active", true)
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as GoalRow[];
}

/** Active debts for a household, largest balance first. */
export async function getHouseholdDebts(householdId: string): Promise<DebtRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("household_id", householdId)
    .eq("active", true)
    .order("current_balance", { ascending: false });

  if (error || !data) return [];
  return data as DebtRow[];
}
