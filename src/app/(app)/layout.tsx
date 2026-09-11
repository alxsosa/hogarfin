import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { getUserHouseholds } from "@/features/households/data";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const households = await getUserHouseholds();

  if (households.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b bg-background/95 px-8 backdrop-blur">
          <UserMenu email={user.email ?? ""} households={households} />
        </header>
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-muted/30 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
