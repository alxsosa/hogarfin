import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HouseholdSettingsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hogar</h1>
        <p className="text-sm text-muted-foreground">
          Configuración general de {active.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{active.name}</CardTitle>
          <CardDescription>
            Moneda principal: <Badge variant="secondary">{active.currency}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tu rol: <Badge variant="outline">{active.role}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
