"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
} from "@/lib/validations/income";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createIncomeSource(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createIncomeSourceSchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    expectedAmount: formData.get("expectedAmount"),
    frequency: formData.get("frequency") || "monthly",
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("income_sources").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name,
    expected_amount: parsed.data.expectedAmount ?? null,
    frequency: parsed.data.frequency,
    account_id: parsed.data.accountId ?? null,
    category_id: parsed.data.categoryId ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/income");
  return null;
}

export async function updateIncomeSource(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateIncomeSourceSchema.safeParse({
    id: formData.get("id"),
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    expectedAmount: formData.get("expectedAmount"),
    frequency: formData.get("frequency") || "monthly",
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("income_sources")
    .update({
      name: parsed.data.name,
      expected_amount: parsed.data.expectedAmount ?? null,
      frequency: parsed.data.frequency,
      account_id: parsed.data.accountId ?? null,
      category_id: parsed.data.categoryId ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/income");
  return null;
}

export async function archiveIncomeSource(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("income_sources")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/income");
  return null;
}
