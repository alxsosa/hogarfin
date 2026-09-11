import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import {
  getHouseholdAccounts,
  isLiability,
  summarizeAccounts,
  type Account,
} from "@/features/accounts/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewAccountDialog } from "./new-account-dialog";
import { EditAccountDialog } from "./edit-account-dialog";
import { ArchiveAccountButton } from "./archive-account-button";

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

const GROUPS: { title: string; types: string[] }[] = [
  { title: "Cuentas bancarias", types: ["checking", "savings"] },
  { title: "Tarjetas de crédito", types: ["credit_card"] },
  { title: "Efectivo", types: ["cash"] },
  { title: "Inversiones", types: ["investment", "retirement"] },
  { title: "Deudas y préstamos", types: ["loan", "mortgage", "other_liability"] },
  { title: "Otros activos", types: ["other_asset"] },
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
  }).format(amount);
}

export default async function AccountsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const accounts = await getHouseholdAccounts(active.id);
  const { totalAssets, totalLiabilities, net } = summarizeAccounts(accounts);
  const currency = active.currency ?? "MXN";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Cuentas bancarias, tarjetas, efectivo y otros activos de {active.name}.
          </p>
        </div>
        <NewAccountDialog householdId={active.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Activos totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCurrency(totalAssets, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pasivos totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCurrency(totalLiabilities, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Patrimonio neto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCurrency(net, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no tienes cuentas registradas. Crea la primera con el botón
            &quot;Nueva cuenta&quot;.
          </CardContent>
        </Card>
      ) : (
        GROUPS.map((group) => {
          const groupAccounts = accounts.filter((a) => group.types.includes(a.type));
          if (groupAccounts.length === 0) return null;

          return (
            <div key={group.title} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">{group.title}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    householdId={active.id}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function AccountCard({
  account,
  householdId,
}: {
  account: Account;
  householdId: string;
}) {
  const availableCredit =
    account.type === "credit_card" && account.credit_limit != null
      ? account.credit_limit - account.current_balance
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{account.name}</CardTitle>
            {account.institution && (
              <p className="text-xs text-muted-foreground">{account.institution}</p>
            )}
          </div>
          <Badge variant={isLiability(account.type) ? "outline" : "secondary"}>
            {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xl font-semibold">
          {formatCurrency(account.current_balance, account.currency)}
        </p>
        {availableCredit != null && (
          <p className="text-xs text-muted-foreground">
            Crédito disponible: {formatCurrency(availableCredit, account.currency)}
          </p>
        )}
        <div className="flex items-center justify-end gap-1">
          <EditAccountDialog householdId={householdId} account={account} />
          <ArchiveAccountButton accountId={account.id} accountName={account.name} />
        </div>
      </CardContent>
    </Card>
  );
}
