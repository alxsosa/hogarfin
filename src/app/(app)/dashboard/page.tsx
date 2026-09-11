import {
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Banknote,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { getUserHouseholds } from "@/features/households/data";

const cards = [
  { label: "Patrimonio neto", value: "$0.00", icon: TrendingUp, tone: "default" as const },
  { label: "Dinero disponible", value: "$0.00", icon: Wallet, tone: "default" as const },
  { label: "Ingresos del mes", value: "$0.00", icon: Banknote, tone: "info" as const },
  { label: "Gastos del mes", value: "$0.00", icon: TrendingDown, tone: "danger" as const },
  { label: "Ahorro", value: "$0.00", icon: PiggyBank, tone: "default" as const },
  { label: "Deuda", value: "$0.00", icon: CreditCard, tone: "danger" as const },
];

export default async function DashboardPage() {
  const households = await getUserHouseholds();
  const active = households[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={active?.name ?? "Dashboard"}
        description="Resumen financiero del hogar."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            tone={c.tone}
          />
        ))}
      </div>

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Empieza a configurar tu hogar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Agrega tus cuentas bancarias, tarjetas y efectivo para ver tu
          patrimonio y flujo de efectivo aquí. Este dashboard es un punto de
          partida — Fase 2 agregará cuentas y transacciones, Fase 3 el
          presupuesto mensual.
        </CardContent>
      </Card>
    </div>
  );
}
