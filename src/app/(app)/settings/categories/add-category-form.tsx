"use client";

import { useActionState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { createCategory } from "@/features/transactions/actions";
import type { CategoryRow } from "@/features/transactions/data";
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

export function AddCategoryForm({
  householdId,
  groups,
}: {
  householdId: string;
  groups: CategoryRow[];
}) {
  const [state, formAction, pending] = useActionState(createCategory, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Categoría creada.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="householdId" value={householdId} />

      <div className="flex-1 space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" placeholder="Ej. Gimnasio" required />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentId">Grupo (opcional)</Label>
        <Select name="parentId">
          <SelectTrigger id="parentId" className="w-48">
            <SelectValue placeholder="Categoría principal" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.icon ? `${g.icon} ` : ""}
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color (opcional)</Label>
        <Input id="color" name="color" type="color" className="h-8 w-14 p-1" defaultValue="#6366F1" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Agregar"}
      </Button>

      {state?.error && (
        <Alert variant="destructive" className="sm:basis-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
