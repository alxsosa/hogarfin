"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBillSchema, updateBillSchema } from "@/lib/validations/bills";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/** The bill form uses a "__none__" sentinel for "no category/account"
 * selected (Base UI Select can't use an empty-string item value), so we
 * normalize it back to empty before validating. */
function normalizeOptional(value: FormDataEntryValue | null) {
  return value === "__none__" ? "" : value;
}

export async function createBill(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createBillSchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency") || "monthly",
    nextDueDate: formData.get("nextDueDate"),
    autoPay: formData.get("autoPay") === "on" || formData.get("autoPay") === "true",
    reminderDaysBefore: formData.get("reminderDaysBefore"),
    categoryId: normalizeOptional(formData.get("categoryId")),
    accountId: normalizeOptional(formData.get("accountId")),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bills").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name,
    amount: parsed.data.amount,
    frequency: parsed.data.frequency,
    next_due_date: parsed.data.nextDueDate ?? null,
    auto_pay: parsed.data.autoPay,
    reminder_days_before: parsed.data.reminderDaysBefore,
    category_id: parsed.data.categoryId ?? null,
    account_id: parsed.data.accountId ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bills");
  return null;
}

export async function updateBill(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateBillSchema.safeParse({
    id: formData.get("id"),
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency") || "monthly",
    nextDueDate: formData.get("nextDueDate"),
    autoPay: formData.get("autoPay") === "on" || formData.get("autoPay") === "true",
    reminderDaysBefore: formData.get("reminderDaysBefore"),
    categoryId: normalizeOptional(formData.get("categoryId")),
    accountId: normalizeOptional(formData.get("accountId")),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bills")
    .update({
      name: parsed.data.name,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_due_date: parsed.data.nextDueDate ?? null,
      auto_pay: parsed.data.autoPay,
      reminder_days_before: parsed.data.reminderDaysBefore,
      category_id: parsed.data.categoryId ?? null,
      account_id: parsed.data.accountId ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bills");
  return null;
}

/** Soft delete — bills are never hard-deleted, just marked inactive. */
export async function archiveBill(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bills")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bills");
  return null;
}

/**
 * Marks a bill as paid by advancing next_due_date by one period based on
 * frequency. `custom` frequency bills don't have a well-defined period, so
 * next_due_date is intentionally left as-is — the user edits it manually.
 */
export async function markBillPaid(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: bill, error: readError } = await supabase
    .from("bills")
    .select("frequency, next_due_date")
    .eq("id", id)
    .single();

  if (readError || !bill) {
    return { error: readError?.message ?? "Factura no encontrada." };
  }

  const current = bill.next_due_date ? new Date(bill.next_due_date) : new Date();
  let next: Date | null = null;

  switch (bill.frequency) {
    case "weekly":
      next = new Date(current);
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next = new Date(current);
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next = new Date(current);
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "custom":
    default:
      // Custom-frequency bills aren't auto-advanced since there's no fixed
      // period to add — leave next_due_date untouched and let the user
      // update it manually when they reschedule.
      next = null;
      break;
  }

  if (next) {
    const nextDueDate = next.toISOString().slice(0, 10);
    const { error } = await supabase
      .from("bills")
      .update({ next_due_date: nextDueDate })
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/bills");
  return null;
}
