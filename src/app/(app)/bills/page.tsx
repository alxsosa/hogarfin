import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdBills } from "@/features/bills/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import { getHouseholdAccounts } from "@/features/accounts/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, monthlyEquivalent } from "@/features/bills/format";
import { BillsList } from "./bills-list";
import { CreateBillButton } from "./create-bill-button";

export default async function BillsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const [bills, categories, accounts] = await Promise.all([
    getHouseholdBills(active.id),
    getHouseholdCategories(active.id),
    getHouseholdAccounts(active.id),
  ]);

  const hasCustom = bills.some((b) => b.frequency === "custom");
  const monthlyTotal = bills.reduce((sum, b) => {
    const equiv = monthlyEquivalent(b.amount, b.frequency);
    return equiv != null ? sum + equiv : sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            Da seguimiento a tus gastos recurrentes y sus próximos pagos.
          </p>
        </div>
        <CreateBillButton
          householdId={active.id}
          categories={categories}
          accounts={accounts}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Costo mensual estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(monthlyTotal, active.currency)}
            </p>
            {hasCustom && (
              <p className="mt-1 text-xs text-muted-foreground">
                No incluye facturas de frecuencia personalizada.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Facturas activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{bills.length}</p>
          </CardContent>
        </Card>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No tienes facturas registradas. Agrega una para llevar el control de
          tus gastos recurrentes.
        </div>
      ) : (
        <BillsList
          bills={bills}
          currency={active.currency}
          householdId={active.id}
          categories={categories}
          accounts={accounts}
        />
      )}
    </div>
  );
}
