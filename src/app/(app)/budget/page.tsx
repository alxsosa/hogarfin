import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import {
  getBudgetPeriod,
  getBudgetLines,
  getBudgetUnassigned,
  getUnbudgetedCategories,
  periodMonthKey,
} from "@/features/budget/data";
import { AddBudgetLineForm } from "./add-budget-line-form";
import { BudgetLineRow } from "./budget-line-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);
}

function monthLabel(periodMonth: string) {
  // periodMonth is "YYYY-MM-01" (or a Postgres date string) — parse as
  // local, not UTC, to avoid an off-by-one-day month shift.
  const [year, month] = periodMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function BudgetPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const period = periodMonthKey();
  const budgetPeriod = await getBudgetPeriod(active.id, period);

  const [lines, unassigned, unbudgetedCategories] = await Promise.all([
    budgetPeriod ? getBudgetLines(budgetPeriod.id) : Promise.resolve([]),
    budgetPeriod
      ? getBudgetUnassigned(budgetPeriod.id)
      : Promise.resolve({ total_income: 0, total_allocated: 0, unassigned: 0 }),
    getUnbudgetedCategories(active.id, budgetPeriod?.id ?? null),
  ]);

  const totalBudgeted = lines.reduce((sum, l) => sum + l.budgeted_amount, 0);
  const totalActual = lines.reduce((sum, l) => sum + l.actual_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight capitalize">
          Presupuesto — {monthLabel(period)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Cada peso asignado a una categoría. Basado en tus ingresos y
          transacciones reales del mes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatCurrency(unassigned.total_income, active.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatCurrency(unassigned.total_allocated, active.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Sin asignar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-xl font-semibold ${
                unassigned.unassigned < 0 ? "text-destructive" : ""
              }`}
            >
              {formatCurrency(unassigned.unassigned, active.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Gastado del presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatCurrency(totalActual, active.currency)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {formatCurrency(totalBudgeted, active.currency)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Presupuestado</TableHead>
                  <TableHead className="text-right">Real</TableHead>
                  <TableHead className="text-right">Restante</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <BudgetLineRow
                    key={line.budget_line_id}
                    line={line}
                    currency={active.currency}
                    householdId={active.id}
                    periodMonth={period}
                  />
                ))}
              </TableBody>
            </Table>
          )}

          {lines.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aún no has agregado categorías a este presupuesto.
            </p>
          )}

          {unbudgetedCategories.length > 0 && (
            <div className="border-t pt-4">
              <AddBudgetLineForm
                householdId={active.id}
                periodMonth={period}
                categories={unbudgetedCategories}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
