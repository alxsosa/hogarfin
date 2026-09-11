"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { CreateHouseholdState } from "@/features/households/actions";
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

export function StepHousehold({
  pending,
  onCreated,
  createHousehold,
}: {
  pending: boolean;
  onCreated: (householdId: string, currency: string) => void;
  createHousehold: (
    prevState: CreateHouseholdState,
    formData: FormData
  ) => Promise<CreateHouseholdState>;
}) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("currency", currency);
      const result = await createHousehold(null, fd);
      if (result && "id" in result) {
        toast.success("Hogar creado.");
        onCreated(result.id, currency);
        return;
      }
      if (result && "error" in result) {
        setError(
          result.error ||
            result.fieldErrors?.name?.[0] ||
            "No se pudo crear el hogar."
        );
      }
    });
  }

  const isPending = pending || submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Crea tu hogar
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Un hogar agrupa cuentas, presupuesto y miembros — puedes invitar a
          tu pareja después, sin mezclar cuentas.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del hogar</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Familia Sosa"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Moneda principal</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v ?? "MXN")}>
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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creando..." : "Continuar"}
      </Button>
    </form>
  );
}
