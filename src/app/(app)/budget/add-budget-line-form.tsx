"use client";

import { useActionState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { setBudgetLine } from "@/features/budget/actions";
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

export function AddBudgetLineForm({
  householdId,
  periodMonth,
  categories,
}: {
  householdId: string;
  periodMonth: string;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(setBudgetLine, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Categoría agregada al presupuesto.");
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
      <input type="hidden" name="periodMonth" value={periodMonth} />

      <div className="flex-1 space-y-2">
        <Label htmlFor="categoryId">Categoría</Label>
        <Select name="categoryId" required>
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budgetedAmount">Monto</Label>
        <Input
          id="budgetedAmount"
          name="budgetedAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          className="w-36"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Agregando..." : "Agregar"}
      </Button>

      {state?.error && (
        <Alert variant="destructive" className="sm:basis-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
