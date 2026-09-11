"use client";

import { useActionState } from "react";
import { createHousehold } from "@/features/households/actions";
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

const CURRENCY_LABELS: Record<string, string> = {
  MXN: "MXN — Peso mexicano",
  USD: "USD — Dólar",
  EUR: "EUR — Euro",
};

export function CreateHouseholdForm() {
  const [state, formAction, pending] = useActionState(createHousehold, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del hogar</Label>
        <Input
          id="name"
          name="name"
          placeholder="Familia Sosa"
          required
        />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Moneda principal</Label>
        <Select name="currency" defaultValue="MXN">
          <SelectTrigger id="currency" className="w-full">
            <SelectValue>
              {(value: string | null) => CURRENCY_LABELS[value ?? "MXN"]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
            <SelectItem value="USD">USD — Dólar</SelectItem>
            <SelectItem value="EUR">EUR — Euro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando..." : "Crear hogar"}
      </Button>
    </form>
  );
}
