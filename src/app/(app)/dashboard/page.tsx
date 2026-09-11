import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserHouseholds } from "@/features/households/data";

const cards = [
  { label: "Patrimonio neto", value: "$0.00" },
  { label: "Dinero disponible", value: "$0.00" },
  { label: "Ingresos del mes", value: "$0.00" },
  { label: "Gastos del mes", value: "$0.00" },
  { label: "Ahorro", value: "$0.00" },
  { label: "Deuda", value: "$0.00" },
];

export default async function DashboardPage() {
  const households = await getUserHouseholds();
  const active = households[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {active?.name ?? "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen financiero del hogar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
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
