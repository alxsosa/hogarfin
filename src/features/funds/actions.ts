"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createFundSchema,
  updateFundSchema,
  createGoalSchema,
  updateGoalSchema,
  createDebtSchema,
  updateDebtSchema,
  contributeSchema,
} from "@/lib/validations/funds";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

// ---------------------------------------------------------------------------
// Funds
// ---------------------------------------------------------------------------

export async function createFund(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createFundSchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    goalAmount: formData.get("goalAmount"),
    currentBalance: formData.get("currentBalance") || 0,
    targetDate: formData.get("targetDate"),
    monthlyContribution: formData.get("monthlyContribution"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("funds").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name,
    goal_amount: parsed.data.goalAmount,
    current_balance: parsed.data.currentBalance,
    target_date: parsed.data.targetDate ?? null,
    monthly_contribution: parsed.data.monthlyContribution ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

export async function updateFund(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateFundSchema.safeParse({
    id: formData.get("id"),
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    goalAmount: formData.get("goalAmount"),
    currentBalance: formData.get("currentBalance") || 0,
    targetDate: formData.get("targetDate"),
    monthlyContribution: formData.get("monthlyContribution"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("funds")
    .update({
      name: parsed.data.name,
      goal_amount: parsed.data.goalAmount,
      current_balance: parsed.data.currentBalance,
      target_date: parsed.data.targetDate ?? null,
      monthly_contribution: parsed.data.monthlyContribution ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

export async function archiveFund(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("funds")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

export async function contributeToFund(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = contributeSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: fund, error: readError } = await supabase
    .from("funds")
    .select("current_balance")
    .eq("id", parsed.data.id)
    .single();

  if (readError || !fund) {
    return { error: readError?.message ?? "Fondo no encontrado." };
  }

  const { error } = await supabase
    .from("funds")
    .update({ current_balance: fund.current_balance + parsed.data.amount })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function createGoal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createGoalSchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    type: formData.get("type") || "custom",
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || 0,
    targetDate: formData.get("targetDate"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name,
    type: parsed.data.type,
    target_amount: parsed.data.targetAmount,
    current_amount: parsed.data.currentAmount,
    target_date: parsed.data.targetDate ?? null,
    priority: parsed.data.priority ?? 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

export async function updateGoal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateGoalSchema.safeParse({
    id: formData.get("id"),
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    type: formData.get("type") || "custom",
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || 0,
    targetDate: formData.get("targetDate"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      target_amount: parsed.data.targetAmount,
      current_amount: parsed.data.currentAmount,
      target_date: parsed.data.targetDate ?? null,
      priority: parsed.data.priority ?? 0,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

export async function archiveGoal(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

export async function contributeToGoal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = contributeSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: goal, error: readError } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", parsed.data.id)
    .single();

  if (readError || !goal) {
    return { error: readError?.message ?? "Meta no encontrada." };
  }

  const { error } = await supabase
    .from("goals")
    .update({ current_amount: goal.current_amount + parsed.data.amount })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/funds");
  return null;
}

// ---------------------------------------------------------------------------
// Debts
// ---------------------------------------------------------------------------

export async function createDebt(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createDebtSchema.safeParse({
    householdId: formData.get("householdId"),
    creditor: formData.get("creditor"),
    originalBalance: formData.get("originalBalance"),
    currentBalance: formData.get("currentBalance"),
    interestRate: formData.get("interestRate"),
    minimumPayment: formData.get("minimumPayment"),
    plannedPayment: formData.get("plannedPayment"),
    strategy: formData.get("strategy"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("debts").insert({
    household_id: parsed.data.householdId,
    creditor: parsed.data.creditor,
    original_balance: parsed.data.originalBalance,
    current_balance: parsed.data.currentBalance,
    interest_rate: parsed.data.interestRate ?? null,
    minimum_payment: parsed.data.minimumPayment ?? null,
    planned_payment: parsed.data.plannedPayment ?? null,
    strategy: parsed.data.strategy ?? null,
    due_date: parsed.data.dueDate ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/debts");
  return null;
}

export async function updateDebt(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateDebtSchema.safeParse({
    id: formData.get("id"),
    householdId: formData.get("householdId"),
    creditor: formData.get("creditor"),
    originalBalance: formData.get("originalBalance"),
    currentBalance: formData.get("currentBalance"),
    interestRate: formData.get("interestRate"),
    minimumPayment: formData.get("minimumPayment"),
    plannedPayment: formData.get("plannedPayment"),
    strategy: formData.get("strategy"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .update({
      creditor: parsed.data.creditor,
      original_balance: parsed.data.originalBalance,
      current_balance: parsed.data.currentBalance,
      interest_rate: parsed.data.interestRate ?? null,
      minimum_payment: parsed.data.minimumPayment ?? null,
      planned_payment: parsed.data.plannedPayment ?? null,
      strategy: parsed.data.strategy ?? null,
      due_date: parsed.data.dueDate ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/debts");
  return null;
}

export async function archiveDebt(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/debts");
  return null;
}
