import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdFunds, getHouseholdGoals } from "@/features/funds/data";
import { PageHeader } from "@/components/layout/page-header";
import { FundsGoalsTabs } from "./funds-goals-tabs";

export default async function FundsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const [funds, goals] = await Promise.all([
    getHouseholdFunds(active.id),
    getHouseholdGoals(active.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fondos y metas"
        description="Ahorra para lo que importa, con un propósito claro para cada peso."
      />

      <FundsGoalsTabs
        householdId={active.id}
        currency={active.currency}
        funds={funds}
        goals={goals}
      />
    </div>
  );
}
