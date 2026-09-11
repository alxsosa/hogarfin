import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  matchFieldValues,
  matchTypeValues,
} from "@/lib/validations/rules";

export type RuleRow = {
  id: string;
  name: string | null;
  matchField: (typeof matchFieldValues)[number];
  matchType: (typeof matchTypeValues)[number];
  matchValue: string;
  categoryId: string | null;
  categoryName: string | null;
  priority: number;
  active: boolean;
};

/** Active categorization rules for a household, highest priority first.
 * The `rules` table (0006_bills_income_audit_rules.sql) has no FK column
 * to categories — the target lives inside action_value (jsonb), e.g.
 * {"category_id": "uuid"}, because a rule's action_value shape depends
 * on its action (tag/flag/split/etc would store something different).
 * Only 'categorize' rules are surfaced here — the schema supports other
 * actions for future phases, not built yet. */
export async function getHouseholdRules(householdId: string): Promise<RuleRow[]> {
  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from("rules")
    .select(
      "id, name, match_field, match_type, match_value, action_value, priority, active"
    )
    .eq("household_id", householdId)
    .eq("action", "categorize")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (error || !rules) return [];

  const categoryIds = Array.from(
    new Set(
      rules
        .map((r) => (r.action_value as { category_id?: string } | null)?.category_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const categoryNames = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);
    for (const c of categories ?? []) categoryNames.set(c.id, c.name);
  }

  return rules.map((r) => {
    const categoryId =
      (r.action_value as { category_id?: string } | null)?.category_id ?? null;
    return {
      id: r.id,
      name: r.name,
      matchField: r.match_field,
      matchType: r.match_type,
      matchValue: r.match_value,
      categoryId,
      categoryName: categoryId ? (categoryNames.get(categoryId) ?? null) : null,
      priority: r.priority,
      active: r.active,
    };
  });
}
