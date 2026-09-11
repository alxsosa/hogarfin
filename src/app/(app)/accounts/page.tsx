import { redirect } from "next/navigation";
import { Wallet, TrendingDown, Scale } from "lucide-react";
import { getUserHouseholds } from "@/features/households/data";
import {
  getHouseholdAccounts,
  isLiability,
  summarizeAccounts,
  type Account,
} from "@/features/accounts/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
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
      <PageHeader
        title="Cuentas"
        description={`Cuentas bancarias, tarjetas, efectivo y otros activos de ${active.name}.`}
        action={<NewAccountDialog householdId={active.id} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Activos totales"
          value={formatCurrency(totalAssets, currency)}
          icon={Wallet}
        />
        <StatCard
          label="Pasivos totales"
          value={formatCurrency(totalLiabilities, currency)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          label="Patrimonio neto"
          value={formatCurrency(net, currency)}
          icon={Scale}
          tone="info"
        />
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

  const liability = isLiability(account.type);

  return (
    <Card className="relative gap-3 ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={
          "absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-gradient-to-r " +
          (liability ? "from-destructive to-destructive/70" : "from-primary to-primary/70")
        }
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{account.name}</CardTitle>
            {account.institution && (
              <p className="text-xs text-muted-foreground">{account.institution}</p>
            )}
          </div>
          <Badge variant={liability ? "outline" : "secondary"}>
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
