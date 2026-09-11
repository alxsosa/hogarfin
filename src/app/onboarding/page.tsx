import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserHouseholds } from "@/features/households/data";
import { CreateHouseholdForm } from "./create-household-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const households = await getUserHouseholds();
  if (households.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Crea tu hogar</CardTitle>
            <CardDescription>
              Un hogar agrupa cuentas, presupuesto y miembros — puedes
              invitar a tu pareja después, sin mezclar cuentas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateHouseholdForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
