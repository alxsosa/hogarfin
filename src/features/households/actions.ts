"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createHouseholdSchema,
  inviteMemberSchema,
} from "@/lib/validations/household";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type CreateHouseholdState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | { id: string }
  | null;

/**
 * Creates a household and returns its id (no redirect — the onboarding
 * wizard drives navigation client-side). The `on_household_created` DB
 * trigger (0001_profiles_households.sql) automatically adds the creator
 * as OWNER in household_members — no client-side membership insert
 * needed.
 */
export async function createHousehold(
  _prevState: CreateHouseholdState,
  formData: FormData
): Promise<CreateHouseholdState> {
  const parsed = createHouseholdSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency") || "MXN",
  });

  if (!parsed.success) {
    return { error: "", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const { data, error } = await supabase
    .from("households")
    .insert({
      name: parsed.data.name,
      currency: parsed.data.currency,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear el hogar." };
  }

  revalidatePath("/", "layout");
  return { id: data.id };
}

export async function inviteMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = inviteMemberSchema.safeParse({
    householdId: formData.get("householdId"),
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("household_invitations").insert({
    household_id: parsed.data.householdId,
    email: parsed.data.email,
    role: parsed.data.role,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/members");
  return null;
}

/** Accepts a pending invitation via the accept_household_invitation RPC
 * (0008_accept_invitation.sql), which validates the token belongs to the
 * caller's own email server-side. */
export async function acceptInvitation(token: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_household_invitation", {
    p_token: token,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
