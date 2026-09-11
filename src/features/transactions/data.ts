import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TransactionRow = {
  id: string;
  date: string;
  description: string | null;
  merchant: string | null;
  amount: number;
  currency: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT";
  status: "pending" | "cleared" | "reconciled" | "void";
  notes: string | null;
  tags: string[];
  account: { id: string; name: string } | null;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
};

/** Recent transactions for a household, joined with account/category names.
 * Excludes voided transactions. Ordered by date desc, created_at desc. */
export async function getHouseholdTransactions(
  householdId: string,
  opts?: { limit?: number }
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const limit = opts?.limit ?? 50;

  // `categories!transactions_category_id_fkey` disambiguates the embed:
  // transactions has two FKs into categories (category_id, subcategory_id),
  // so a plain `categories(...)` is rejected by PostgREST as ambiguous
  // (PGRST201) and the query would otherwise fail silently here.
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, date, description, merchant, amount, currency, type, status, notes, tags, accounts(id, name), categories!transactions_category_id_fkey(id, name, icon, color)"
    )
    .eq("household_id", householdId)
    .neq("status", "void")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getHouseholdTransactions failed:", error);
    return [];
  }
  if (!data) return [];

  return data.map((row) => {
    const r = row as unknown as {
      id: string;
      date: string;
      description: string | null;
      merchant: string | null;
      amount: number;
      currency: string;
      type: TransactionRow["type"];
      status: TransactionRow["status"];
      notes: string | null;
      tags: string[];
      accounts: { id: string; name: string } | null;
      categories: { id: string; name: string; icon: string | null; color: string | null } | null;
    };
    return {
      id: r.id,
      date: r.date,
      description: r.description,
      merchant: r.merchant,
      amount: r.amount,
      currency: r.currency,
      type: r.type,
      status: r.status,
      notes: r.notes,
      tags: r.tags ?? [],
      account: r.accounts,
      category: r.categories,
    };
  });
}

export type CategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
};

/** Active categories for a household, ordered so groups (parent_id null)
 * come before their subcategories, each ordered by sort_order. */
export async function getHouseholdCategories(
  householdId: string
): Promise<CategoryRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, parent_id, icon, color, sort_order")
    .eq("household_id", householdId)
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];

  const rows: CategoryRow[] = data.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parent_id,
    icon: c.icon,
    color: c.color,
    sortOrder: c.sort_order,
  }));

  // Group parents first, each followed by its own subcategories, so a
  // flat Select can render with simple indentation.
  const groups = rows.filter((r) => !r.parentId);
  const bySortThenName = (a: CategoryRow, b: CategoryRow) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

  const ordered: CategoryRow[] = [];
  for (const group of groups.sort(bySortThenName)) {
    ordered.push(group);
    const children = rows
      .filter((r) => r.parentId === group.id)
      .sort(bySortThenName);
    ordered.push(...children);
  }
  return ordered;
}

/** Minimal account shape the transaction form's account Select needs. */
export type AccountOption = { id: string; name: string };
