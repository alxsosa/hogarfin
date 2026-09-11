import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import {
  getSpendByCategory,
  getMonthlyIncomeVsExpense,
  getBudgetVsActual,
} from "@/features/reports/data";
import { periodMonthKey } from "@/features/budget/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CategorySpendChart } from "./category-spend-chart";
import { MonthlyFlowChart } from "./monthly-flow-chart";
import { BudgetVsActualChart } from "./budget-vs-actual-chart";

export default async function ReportsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const period = periodMonthKey();

  const [spendByCategory, monthlyFlow, budgetVsActual] = await Promise.all([
    getSpendByCategory(active.id),
    getMonthlyIncomeVsExpense(active.id, 6),
    getBudgetVsActual(active.id, period),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description={`El panorama financiero de ${active.name}, a partir de tus transacciones reales.`}
        action={
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/export/transactions" />}
            nativeButton={false}
          >
            <Download />
            Exportar CSV
          </Button>
        }
      />

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Gastos por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategorySpendChart
            data={spendByCategory}
            currency={active.currency}
          />
        </CardContent>
      </Card>

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Ingresos vs. gastos (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyFlowChart data={monthlyFlow} currency={active.currency} />
        </CardContent>
      </Card>

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Presupuesto vs. real este mes</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetVsActualChart
            data={budgetVsActual}
            currency={active.currency}
          />
        </CardContent>
      </Card>
    </div>
  );
}
