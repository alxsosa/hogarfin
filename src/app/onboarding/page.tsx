import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserHouseholds } from "@/features/households/data";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const households = await getUserHouseholds();
  if (households.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-b from-white to-muted/30 p-6">
      <OnboardingWizard />
    </div>
  );
}
