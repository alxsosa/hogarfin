import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdAccounts } from "@/features/accounts/data";
import {
  getHouseholdTransactions,
  getHouseholdCategories,
} from "@/features/transactions/data";
import {
  Card,
  CardContent,
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
import { Button } from "@/components/ui/button";
import { NewTransactionDialog } from "./new-transaction-dialog";
import { DeleteTransactionButton } from "./delete-transaction-button";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function TransactionsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const [transactions, categories, accounts] = await Promise.all([
    getHouseholdTransactions(active.id, { limit: 50 }),
    getHouseholdCategories(active.id),
    getHouseholdAccounts(active.id),
  ]);
  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="text-sm text-muted-foreground">
            Ingresos y gastos recientes de {active.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/settings/categories" />} nativeButton={false}>
            Categorías
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/settings/rules" />} nativeButton={false}>
            Reglas
          </Button>
          <NewTransactionDialog
            householdId={active.id}
            accounts={accountOptions}
            categories={categories}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay transacciones. Crea la primera con &quot;Nueva
              transacción&quot;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{t.description}</span>
                        {t.merchant && (
                          <span className="text-xs text-muted-foreground">
                            {t.merchant}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.category ? (
                        <span className="inline-flex items-center gap-1.5">
                          {t.category.color && (
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: t.category.color }}
                            />
                          )}
                          {t.category.icon && <span>{t.category.icon}</span>}
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell>{t.account?.name ?? "—"}</TableCell>
                    <TableCell
                      className={
                        "text-right font-medium " +
                        (t.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : t.type === "EXPENSE"
                            ? "text-destructive"
                            : "text-foreground")
                      }
                    >
                      {t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(t.amount, t.currency)}
                    </TableCell>
                    <TableCell>
                      <DeleteTransactionButton id={t.id} />
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
