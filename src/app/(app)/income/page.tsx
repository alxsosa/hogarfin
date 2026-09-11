import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import {
  getHouseholdIncomeSources,
  getMonthlyActualIncome,
} from "@/features/income/data";
import { getHouseholdAccounts } from "@/features/accounts/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/features/funds/format";
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingresos</h1>
          <p className="text-sm text-muted-foreground">
            Da seguimiento a tus fuentes de ingreso y compáralas con lo
            recibido cada mes.
          </p>
        </div>
        <CreateIncomeButton
          householdId={active.id}
          accounts={accounts}
          categories={categories}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ingreso mensual esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(expectedMonthly, active.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ingreso recibido este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(actualIncome, active.currency)}
            </p>
            {variancePct != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {variancePct.toFixed(0)}% de lo esperado
              </p>
            )}
          </CardContent>
        </Card>
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
