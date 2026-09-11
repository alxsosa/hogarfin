"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthBreakdown } from "./data";

export type ActionState = {
  error?: string;
} | null;

/** Records today's net worth as a snapshot, computed from the same live
 * breakdown the page already shows. Upserts on (household_id,
 * snapshot_date) — calling it again today replaces today's row instead
 * of creating a duplicate, so re-snapshotting after editing an account
 * balance mid-day is safe. */
export async function saveNetWorthSnapshot(
  householdId: string
): Promise<ActionState> {
  const breakdown = await getNetWorthBreakdown(householdId);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("net_worth_snapshots").upsert(
    {
      household_id: householdId,
      snapshot_date: new Date().toISOString().slice(0, 10),
      assets_total: breakdown.assets.total,
      liabilities_total: breakdown.liabilities.total,
      net_worth: breakdown.netWorth,
      breakdown: {
        assetAccounts: breakdown.assets.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.current_balance,
        })),
        liabilityAccounts: breakdown.liabilities.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.current_balance,
        })),
        debts: breakdown.liabilities.debts.map((d) => ({
          id: d.id,
          creditor: d.creditor,
          balance: d.current_balance,
        })),
      },
      created_by: user?.id ?? null,
    },
    { onConflict: "household_id,snapshot_date" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/net-worth");
  return null;
}

/**
 * Ensures a snapshot exists for the current calendar month by backfilling
 * one at the 1st of the month if the most recent snapshot is from an
 * earlier month. Called from the net-worth page on every load — cheap
 * (one query when a snapshot already exists this month) and avoids
 * needing a Vercel Cron job for something this low-stakes. Silently
 * no-ops on error; a missed month is not worth surfacing as a page error.
 */
export async function ensureMonthlySnapshot(householdId: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: latest } = await supabase
    .from("net_worth_snapshots")
    .select("snapshot_date")
    .eq("household_id", householdId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && latest.snapshot_date >= currentMonthStart) {
    return; // already have a snapshot from this month
  }

  const breakdown = await getNetWorthBreakdown(householdId);
  // Only worth recording once there's something to show — an empty
  // household (no accounts/debts yet) would just create $0 noise.
  if (breakdown.assets.total === 0 && breakdown.liabilities.total === 0) {
    return;
  }

  await supabase.from("net_worth_snapshots").upsert(
    {
      household_id: householdId,
      snapshot_date: currentMonthStart,
      assets_total: breakdown.assets.total,
      liabilities_total: breakdown.liabilities.total,
      net_worth: breakdown.netWorth,
    },
    { onConflict: "household_id,snapshot_date" }
  );
}
