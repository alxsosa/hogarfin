import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserHouseholds } from "@/features/households/data";
import { InviteMemberForm } from "./invite-member-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function MembersPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const supabase = await createClient();

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("household_members")
      .select("id, role, user_id, profiles(full_name, avatar_url)")
      .eq("household_id", active.id),
    supabase
      .from("household_invitations")
      .select("id, email, role, status, expires_at")
      .eq("household_id", active.id)
      .eq("status", "PENDING"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Miembros</h1>
        <p className="text-sm text-muted-foreground">
          Quién forma parte de {active.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitar a alguien</CardTitle>
          <CardDescription>
            Se creará una invitación pendiente que la otra persona puede
            aceptar con su propia cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm householdId={active.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Miembros actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => {
                const profile = m.profiles as unknown as {
                  full_name: string | null;
                } | null;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{profile?.full_name ?? "Sin nombre"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.role}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Expira</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString("es-MX")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
