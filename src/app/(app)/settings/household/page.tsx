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
import { PageHeader } from "@/components/layout/page-header";

export default async function HouseholdSettingsPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hogar"
        description={`Configuración general de ${active.name}.`}
      />

      <Card className="ring-1 ring-foreground/5">
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
