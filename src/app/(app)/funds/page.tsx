import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdFunds, getHouseholdGoals } from "@/features/funds/data";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Fondos y metas
        </h1>
        <p className="text-sm text-muted-foreground">
          Ahorra para lo que importa, con un propósito claro para cada peso.
        </p>
      </div>

      <FundsGoalsTabs
        householdId={active.id}
        currency={active.currency}
        funds={funds}
        goals={goals}
      />
    </div>
  );
}
