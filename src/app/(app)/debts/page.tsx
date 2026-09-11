import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdDebts } from "@/features/funds/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/features/funds/format";
import { DebtsList } from "./debts-list";
import { CreateDebtButton } from "./create-debt-button";

export default async function DebtsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const debts = await getHouseholdDebts(active.id);
  const total = debts.reduce((sum, d) => sum + d.current_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deudas</h1>
          <p className="text-sm text-muted-foreground">
            Da seguimiento a lo que debes y a tu plan para pagarlo.
          </p>
        </div>
        <CreateDebtButton householdId={active.id} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Deuda total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {formatCurrency(total, active.currency)}
          </p>
        </CardContent>
      </Card>

      {debts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No tienes deudas registradas. Agrega una para llevar el control de
          tus pagos.
        </div>
      ) : (
        <DebtsList debts={debts} currency={active.currency} />
      )}
    </div>
  );
}
