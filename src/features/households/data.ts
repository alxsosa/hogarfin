import "server-only";
import { createClient } from "@/lib/supabase/server";

export type HouseholdSummary = {
  id: string;
  name: string;
  currency: string;
  role: string;
};

/** All households the current user belongs to, via household_members
 * (RLS-scoped — this only ever returns rows the user is a member of). */
export async function getUserHouseholds(): Promise<HouseholdSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("household_members")
    .select("role, households(id, name, currency)")
    .eq("user_id", user.id);

  if (error || !data) return [];

  return data
    .filter((row) => row.households)
    .map((row) => {
      // Supabase types household relation as an object here since
      // household_id is unique per (household_id, user_id).
      const household = row.households as unknown as {
        id: string;
        name: string;
        currency: string;
      };
      return {
        id: household.id,
        name: household.name,
        currency: household.currency,
        role: row.role,
      };
    });
}
