"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountSchema } from "@/lib/validations/account";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

function parseAccountForm(formData: FormData) {
  return accountSchema.safeParse({
    id: formData.get("id") || undefined,
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    type: formData.get("type"),
    institution: formData.get("institution") || undefined,
    currency: formData.get("currency") || "MXN",
    currentBalance: formData.get("currentBalance"),
    creditLimit: formData.get("creditLimit") || undefined,
    interestRate: formData.get("interestRate") || undefined,
    statementDate: formData.get("statementDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseAccountForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name,
    type: parsed.data.type,
    institution: parsed.data.institution ?? null,
    currency: parsed.data.currency,
    current_balance: parsed.data.currentBalance,
    credit_limit: parsed.data.creditLimit ?? null,
    interest_rate: parsed.data.interestRate ?? null,
    statement_date: parsed.data.statementDate ?? null,
    due_date: parsed.data.dueDate ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/accounts");
  return null;
}

export async function updateAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseAccountForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!parsed.data.id) {
    return { error: "Falta el identificador de la cuenta." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({
      household_id: parsed.data.householdId,
      name: parsed.data.name,
      type: parsed.data.type,
      institution: parsed.data.institution ?? null,
      currency: parsed.data.currency,
      current_balance: parsed.data.currentBalance,
      credit_limit: parsed.data.creditLimit ?? null,
      interest_rate: parsed.data.interestRate ?? null,
      statement_date: parsed.data.statementDate ?? null,
      due_date: parsed.data.dueDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/accounts");
  return null;
}

/** Soft-archives an account (active = false). Never hard-deletes. */
export async function archiveAccount(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/accounts");
  return null;
}
