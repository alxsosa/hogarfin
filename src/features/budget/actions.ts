"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setBudgetLineSchema } from "@/lib/validations/budget";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/** Finds or creates the budget_periods row for a household + month, then
 * returns its id. The trg_budget_periods_normalize trigger truncates
 * period_month to the 1st of the month regardless of what we send. */
export async function ensureBudgetPeriod(
  householdId: string,
  periodMonth: string
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("budget_periods")
    .select("id")
    .eq("household_id", householdId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("budget_periods")
    .insert({ household_id: householdId, period_month: periodMonth })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "No se pudo crear el presupuesto." };
  }

  return { id: created.id };
}

/** Sets (creates or updates) the budgeted amount for one category in one
 * period. budget_lines has a unique (budget_period_id, category_id), so
 * this upserts on that pair. */
export async function setBudgetLine(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = setBudgetLineSchema.safeParse({
    householdId: formData.get("householdId"),
    periodMonth: formData.get("periodMonth"),
    categoryId: formData.get("categoryId"),
    budgetedAmount: formData.get("budgetedAmount"),
    rollover: formData.get("rollover") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const period = await ensureBudgetPeriod(
    parsed.data.householdId,
    parsed.data.periodMonth
  );
  if ("error" in period) return { error: period.error };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_lines").upsert(
    {
      budget_period_id: period.id,
      category_id: parsed.data.categoryId,
      budgeted_amount: parsed.data.budgetedAmount,
      rollover: parsed.data.rollover,
    },
    { onConflict: "budget_period_id,category_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return null;
}

export async function removeBudgetLine(budgetLineId: string) {
  const supabase = await createClient();
  await supabase.from("budget_lines").delete().eq("id", budgetLineId);
  revalidatePath("/budget");
}
