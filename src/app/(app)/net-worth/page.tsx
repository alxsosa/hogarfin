import { redirect } from "next/navigation";
import { Wallet, TrendingDown, Scale } from "lucide-react";
import { getUserHouseholds } from "@/features/households/data";
import {
  getNetWorthBreakdown,
  getNetWorthHistory,
  hasSnapshotToday,
} from "@/features/net-worth/data";
import { ensureMonthlySnapshot } from "@/features/net-worth/actions";
import type { Account } from "@/features/accounts/data";
import type { DebtRow } from "@/features/funds/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { NetWorthTrendChart } from "./net-worth-trend-chart";
import { SaveSnapshotButton } from "./save-snapshot-button";

// Duplicated from src/app/(app)/accounts/account-form.tsx (a "use client"
// component) so this server page doesn't pull a client form into its bundle.
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Cuenta de cheques",
  savings: "Cuenta de ahorro",
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  investment: "Inversión",
  retirement: "Cuenta de retiro",
  loan: "Préstamo",
  mortgage: "Hipoteca",
  other_asset: "Otro activo",
  other_liability: "Otro pasivo",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
  }).format(amount);
}

export default async function NetWorthPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  // Backfill a snapshot for the current month if the most recent one is
  // older — cheap after the first call this month (one query, no-op).
  await ensureMonthlySnapshot(active.id);

  const [breakdown, history, snapshotToday] = await Promise.all([
    getNetWorthBreakdown(active.id),
    getNetWorthHistory(active.id),
    hasSnapshotToday(active.id),
  ]);
  const currency = active.currency ?? "MXN";

  const { assets, liabilities, netWorth } = breakdown;
  const isEmpty =
    assets.accounts.length === 0 &&
    liabilities.accounts.length === 0 &&
    liabilities.debts.length === 0;

  const sortedAssetAccounts = [...assets.accounts].sort(
    (a, b) => a.type.localeCompare(b.type) || b.current_balance - a.current_balance
  );

  type LiabilityRow =
    | { kind: "account"; key: string; label: string; source: string; balance: number }
    | { kind: "debt"; key: string; label: string; source: string; balance: number };

  const liabilityRows: LiabilityRow[] = [
    ...liabilities.accounts.map((a: Account): LiabilityRow => ({
      kind: "account",
      key: `account-${a.id}`,
      label: a.name,
      source: ACCOUNT_TYPE_LABELS[a.type] ?? a.type,
      balance: a.current_balance,
    })),
    ...liabilities.debts.map((d: DebtRow): LiabilityRow => ({
      kind: "debt",
      key: `debt-${d.id}`,
      label: d.creditor,
      source: "Deuda",
      balance: d.current_balance,
    })),
  ].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrimonio neto"
        description={`Activos menos pasivos de ${active.name}, calculado con tus saldos actuales.`}
        action={<SaveSnapshotButton householdId={active.id} hasToday={snapshotToday} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Activos totales"
          value={formatCurrency(assets.total, currency)}
          icon={Wallet}
          hint={`${assets.accounts.length} ${assets.accounts.length === 1 ? "cuenta" : "cuentas"}`}
        />
        <StatCard
          label="Pasivos totales"
          value={formatCurrency(liabilities.total, currency)}
          icon={TrendingDown}
          tone="danger"
          hint={`${liabilities.accounts.length} cuentas, ${liabilities.debts.length} ${liabilities.debts.length === 1 ? "deuda" : "deudas"}`}
        />
        <StatCard
          label="Patrimonio neto"
          value={formatCurrency(netWorth, currency)}
          icon={Scale}
          tone={netWorth >= 0 ? "default" : "danger"}
        />
      </div>

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Evolución</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthTrendChart data={history} currency={currency} />
        </CardContent>
      </Card>

      {isEmpty ? (
        <Card className="ring-1 ring-foreground/5">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Agrega tus cuentas para ver tu patrimonio neto aquí. Ve a{" "}
            <a href="/accounts" className="underline underline-offset-2">
              Cuentas
            </a>{" "}
            para comenzar.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Activos</h2>
            {sortedAssetAccounts.length === 0 ? (
              <Card className="ring-1 ring-foreground/5">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No tienes cuentas de activos registradas.
                </CardContent>
              </Card>
            ) : (
              <Card className="ring-1 ring-foreground/5">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Institución</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAssetAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {account.institution ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(account.current_balance, account.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Pasivos</h2>
            {liabilityRows.length === 0 ? (
              <Card className="ring-1 ring-foreground/5">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No tienes cuentas ni deudas de pasivos registradas.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="ring-1 ring-foreground/5">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Tipo / institución</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {liabilityRows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell className="font-medium">{row.label}</TableCell>
                            <TableCell>
                              <Badge variant={row.kind === "debt" ? "outline" : "secondary"}>
                                {row.kind === "debt" ? "Deuda" : "Cuenta"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {row.source}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.balance, currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">
                  Si una deuda también está registrada como cuenta, podría
                  duplicarse en el total de pasivos.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
