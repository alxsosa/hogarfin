import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdRules } from "@/features/rules/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import { matchFieldLabels, matchTypeLabels } from "@/lib/validations/rules";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateRuleForm } from "./create-rule-form";
import { ArchiveRuleButton } from "./archive-rule-button";

export default async function RulesPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const [rules, categories] = await Promise.all([
    getHouseholdRules(active.id),
    getHouseholdCategories(active.id),
  ]);

  // Rules assign leaf categories, not top-level groups — same
  // convention as budget lines (0004_budget.sql).
  const leafCategories = categories.filter((c) => c.parentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reglas de categorización
        </h1>
        <p className="text-sm text-muted-foreground">
          Cuando registras una transacción sin elegir categoría, Oikos
          revisa estas reglas en orden de prioridad y la asigna
          automáticamente si alguna coincide.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nueva regla</CardTitle>
          <CardDescription>
            Ejemplo: si la descripción contiene &quot;OXXO&quot;, categoriza
            como &quot;Supermercado&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateRuleForm householdId={active.id} categories={leafCategories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reglas activas</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no tienes reglas. Las transacciones sin categoría se
              quedarán sin categorizar hasta que crees una.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.name || "Sin nombre"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {matchFieldLabels[rule.matchField]}{" "}
                      {matchTypeLabels[rule.matchType].toLowerCase()} &quot;
                      {rule.matchValue}&quot;
                    </TableCell>
                    <TableCell>{rule.categoryName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {rule.priority}
                    </TableCell>
                    <TableCell>
                      <ArchiveRuleButton id={rule.id} name={rule.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
