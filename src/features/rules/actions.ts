"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createRuleSchema } from "@/lib/validations/rules";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createRule(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createRuleSchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name") || undefined,
    matchField: formData.get("matchField"),
    matchType: formData.get("matchType"),
    matchValue: formData.get("matchValue"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority") || 0,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rules").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name || null,
    match_field: parsed.data.matchField,
    match_type: parsed.data.matchType,
    match_value: parsed.data.matchValue,
    action: "categorize",
    action_value: { category_id: parsed.data.categoryId },
    priority: parsed.data.priority,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/rules");
  return null;
}

export async function archiveRule(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rules")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/rules");
  return null;
}

/**
 * Finds the highest-priority active 'categorize' rule that matches the
 * given transaction fields, if any. Called from createTransaction
 * (src/features/transactions/actions.ts) right before insert, so a rule
 * match pre-fills category_id — the user's own category selection in the
 * form always wins if they picked one explicitly (rules only fill gaps,
 * never override an explicit choice). Returns null on no match.
 */
export async function matchCategorizationRule(
  householdId: string,
  fields: { description: string | null; merchant: string | null; amount: number }
): Promise<string | null> {
  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from("rules")
    .select("match_field, match_type, match_value, action_value")
    .eq("household_id", householdId)
    .eq("action", "categorize")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (error || !rules) return null;

  for (const rule of rules) {
    if (ruleMatches(rule, fields)) {
      const categoryId = (rule.action_value as { category_id?: string } | null)
        ?.category_id;
      if (categoryId) return categoryId;
    }
  }

  return null;
}

function ruleMatches(
  rule: {
    match_field: string;
    match_type: string;
    match_value: string;
  },
  fields: { description: string | null; merchant: string | null; amount: number }
): boolean {
  if (rule.match_field === "amount") {
    const target = Number(rule.match_value);
    if (Number.isNaN(target)) return false;
    if (rule.match_type === "amount_gt") return fields.amount > target;
    if (rule.match_type === "amount_lt") return fields.amount < target;
    if (rule.match_type === "equals") return fields.amount === target;
    return false;
  }

  const haystack = (
    rule.match_field === "merchant" ? fields.merchant : fields.description
  )
    ?.toLowerCase()
    .trim();
  const needle = rule.match_value.toLowerCase().trim();
  if (!haystack || !needle) return false;

  switch (rule.match_type) {
    case "contains":
      return haystack.includes(needle);
    case "starts_with":
      return haystack.startsWith(needle);
    case "ends_with":
      return haystack.endsWith(needle);
    case "equals":
      return haystack === needle;
    default:
      return false;
  }
}
