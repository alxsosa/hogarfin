import { redirect } from "next/navigation";
import { ReceiptText, Repeat } from "lucide-react";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdBills } from "@/features/bills/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import { getHouseholdAccounts } from "@/features/accounts/data";
import { formatCurrency, monthlyEquivalent } from "@/features/bills/format";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
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
      <PageHeader
        title="Facturas"
        description="Da seguimiento a tus gastos recurrentes y sus próximos pagos."
        action={
          <CreateBillButton
            householdId={active.id}
            categories={categories}
            accounts={accounts}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Costo mensual estimado"
          value={formatCurrency(monthlyTotal, active.currency)}
          icon={ReceiptText}
          tone="danger"
          hint={
            hasCustom
              ? "No incluye facturas de frecuencia personalizada."
              : undefined
          }
        />
        <StatCard
          label="Facturas activas"
          value={bills.length}
          icon={Repeat}
        />
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
