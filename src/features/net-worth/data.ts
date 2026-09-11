import "server-only";
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
