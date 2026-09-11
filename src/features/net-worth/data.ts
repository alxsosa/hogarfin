import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  getHouseholdAccounts,
  isLiability,
  type Account,
} from "@/features/accounts/data";
import { getHouseholdDebts, type DebtRow } from "@/features/funds/data";

export type NetWorthBreakdown = {
  assets: {
    accounts: Account[];
    total: number;
  };
  liabilities: {
    accounts: Account[];
    debts: DebtRow[];
    total: number;
  };
  netWorth: number;
};

/**
 * Live-computed net worth: activos (asset-type accounts) menos pasivos
 * (liability-type accounts + all debts). There is no net_worth_snapshots
 * table yet, so this always reflects the current balances.
 *
 * Note: a debt that is also tracked as a liability-type account would be
 * double-counted here — this pass does not attempt deduplication.
 */
export async function getNetWorthBreakdown(
  householdId: string
): Promise<NetWorthBreakdown> {
  const [accounts, debts] = await Promise.all([
    getHouseholdAccounts(householdId),
    getHouseholdDebts(householdId),
  ]);

  const assetAccounts = accounts.filter((a) => !isLiability(a.type));
  const liabilityAccounts = accounts.filter((a) => isLiability(a.type));

  const assetsTotal = assetAccounts.reduce(
    (sum, a) => sum + a.current_balance,
    0
  );
  const liabilityAccountsTotal = liabilityAccounts.reduce(
    (sum, a) => sum + a.current_balance,
    0
  );
  const debtsTotal = debts.reduce((sum, d) => sum + d.current_balance, 0);
  const liabilitiesTotal = liabilityAccountsTotal + debtsTotal;

  return {
    assets: {
      accounts: assetAccounts,
      total: assetsTotal,
    },
    liabilities: {
      accounts: liabilityAccounts,
      debts,
      total: liabilitiesTotal,
    },
    netWorth: assetsTotal - liabilitiesTotal,
  };
}

export type NetWorthSnapshotRow = {
  id: string;
  snapshotDate: string; // "YYYY-MM-DD"
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
};

/** Historical net worth snapshots for a household, oldest first — the
 * shape a trend chart wants. Reads net_worth_snapshots (0009 migration),
 * never recomputed from current balances, so a snapshot survives later
 * edits/archives to the accounts and debts it was built from. */
export async function getNetWorthHistory(
  householdId: string
): Promise<NetWorthSnapshotRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("net_worth_snapshots")
    .select("id, snapshot_date, assets_total, liabilities_total, net_worth")
    .eq("household_id", householdId)
    .order("snapshot_date", { ascending: true });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    snapshotDate: r.snapshot_date,
    assetsTotal: Number(r.assets_total),
    liabilitiesTotal: Number(r.liabilities_total),
    netWorth: Number(r.net_worth),
  }));
}

/** Whether a snapshot already exists for today — used to disable/relabel
 * the "Guardar snapshot" button so a second click updates today's row
 * (via the unique household_id+snapshot_date constraint's upsert) rather
 * than reading as "nothing happened". */
export async function hasSnapshotToday(householdId: string): Promise<boolean> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("net_worth_snapshots")
    .select("id")
    .eq("household_id", householdId)
    .eq("snapshot_date", today)
    .maybeSingle();

  return Boolean(data);
}
