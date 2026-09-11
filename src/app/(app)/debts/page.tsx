import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdDebts } from "@/features/funds/data";
import { formatCurrency } from "@/features/funds/format";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
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
      <PageHeader
        title="Deudas"
        description="Da seguimiento a lo que debes y a tu plan para pagarlo."
        action={<CreateDebtButton householdId={active.id} />}
      />

      <StatCard
        label="Deuda total"
        value={formatCurrency(total, active.currency)}
        icon={CreditCard}
        tone="danger"
        className="sm:max-w-xs"
      />

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
