import { redirect } from "next/navigation";
import { Banknote, TrendingUp } from "lucide-react";
import { getUserHouseholds } from "@/features/households/data";
import {
  getHouseholdIncomeSources,
  getMonthlyActualIncome,
} from "@/features/income/data";
import { getHouseholdAccounts } from "@/features/accounts/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import { formatCurrency } from "@/features/funds/format";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { IncomeList } from "./income-list";
import { CreateIncomeButton } from "./create-income-button";

// Weekly/biweekly/yearly amounts are normalized to a monthly equivalent
// using average-weeks-per-month (52/12 ≈ 4.33) and biweekly (26/12 ≈ 2.17)
// factors. "custom" frequency has no fixed period, so it's excluded from
// the expected-monthly total rather than guessed at.
function monthlyEquivalent(
  amount: number,
  frequency: "weekly" | "biweekly" | "monthly" | "yearly" | "custom"
): number {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    case "custom":
    default:
      return 0;
  }
}

export default async function IncomePage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const [incomeSources, actualIncome, accounts, categories] =
    await Promise.all([
      getHouseholdIncomeSources(active.id),
      getMonthlyActualIncome(active.id),
      getHouseholdAccounts(active.id),
      getHouseholdCategories(active.id),
    ]);

  const expectedMonthly = incomeSources.reduce((sum, income) => {
    if (income.expected_amount == null) return sum;
    return sum + monthlyEquivalent(income.expected_amount, income.frequency);
  }, 0);

  const variancePct =
    expectedMonthly > 0 ? (actualIncome / expectedMonthly) * 100 : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingresos"
        description="Da seguimiento a tus fuentes de ingreso y compáralas con lo recibido cada mes."
        action={
          <CreateIncomeButton
            householdId={active.id}
            accounts={accounts}
            categories={categories}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Ingreso mensual esperado"
          value={formatCurrency(expectedMonthly, active.currency)}
          icon={Banknote}
          tone="info"
        />
        <StatCard
          label="Ingreso recibido este mes"
          value={formatCurrency(actualIncome, active.currency)}
          icon={TrendingUp}
          hint={
            variancePct != null ? `${variancePct.toFixed(0)}% de lo esperado` : undefined
          }
        />
      </div>

      {incomeSources.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No tienes fuentes de ingreso registradas. Agrega una para dar
          seguimiento a lo que esperas recibir cada mes.
        </div>
      ) : (
        <IncomeList
          incomeSources={incomeSources}
          currency={active.currency}
          householdId={active.id}
          accounts={accounts}
          categories={categories}
        />
      )}
    </div>
  );
}
