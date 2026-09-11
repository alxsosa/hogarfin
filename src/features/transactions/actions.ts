"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createTransactionSchema,
  createCategorySchema,
  parseTags,
} from "@/lib/validations/transaction";
import { matchCategorizationRule } from "@/features/rules/actions";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

function readTransactionForm(formData: FormData) {
  return createTransactionSchema.safeParse({
    householdId: formData.get("householdId"),
    date: formData.get("date"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId") || "",
    description: formData.get("description"),
    merchant: formData.get("merchant") || "",
    notes: formData.get("notes") || "",
    tags: formData.get("tags") || "",
  });
}

export async function createTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = readTransactionForm(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  // A rule only fills the category when the user left it blank — an
  // explicit choice in the form always wins over auto-categorization.
  let categoryId = parsed.data.categoryId || null;
  if (!categoryId) {
    categoryId = await matchCategorizationRule(parsed.data.householdId, {
      description: parsed.data.description,
      merchant: parsed.data.merchant || null,
      amount: parsed.data.amount,
    });
  }

  const { error } = await supabase.from("transactions").insert({
    household_id: parsed.data.householdId,
    account_id: parsed.data.accountId,
    category_id: categoryId,
    user_id: user.id,
    date: parsed.data.date,
    description: parsed.data.description,
    merchant: parsed.data.merchant || null,
    amount: parsed.data.amount,
    type: parsed.data.type,
    notes: parsed.data.notes || null,
    tags: parseTags(parsed.data.tags),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  return null;
}

export async function updateTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Transacción inválida." };
  }

  const parsed = readTransactionForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: parsed.data.accountId,
      category_id: parsed.data.categoryId || null,
      date: parsed.data.date,
      description: parsed.data.description,
      merchant: parsed.data.merchant || null,
      amount: parsed.data.amount,
      type: parsed.data.type,
      notes: parsed.data.notes || null,
      tags: parseTags(parsed.data.tags),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  return null;
}

/** Voids a transaction (status = 'void') rather than hard-deleting it, so
 * it disappears from the default list view but history is preserved. */
export async function deleteTransaction(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ status: "void" })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  return null;
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createCategorySchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    parentId: formData.get("parentId") || "",
    icon: formData.get("icon") || "",
    color: formData.get("color") || "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    household_id: parsed.data.householdId,
    parent_id: parsed.data.parentId || null,
    name: parsed.data.name,
    icon: parsed.data.icon || null,
    color: parsed.data.color || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  revalidatePath("/settings/categories");
  return null;
}
