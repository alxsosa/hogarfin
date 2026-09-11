"use client";

import { useActionState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { inviteMember } from "@/features/households/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MEMBER: "Miembro",
  VIEWER: "Solo lectura",
};

export function InviteMemberForm({ householdId }: { householdId: string }) {
  const [state, formAction, pending] = useActionState(inviteMember, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Invitación enviada.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <input type="hidden" name="householdId" value={householdId} />

      <div className="flex-1 space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="cynthia@correo.com" required />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select name="role" defaultValue="MEMBER">
          <SelectTrigger id="role" className="w-36">
            <SelectValue>
              {(value: string | null) => ROLE_LABELS[value ?? "MEMBER"]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Miembro</SelectItem>
            <SelectItem value="VIEWER">Solo lectura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Invitar"}
      </Button>

      {state?.error && (
        <Alert variant="destructive" className="sm:basis-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
