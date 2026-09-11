"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { incomeFrequencyValues, incomeFrequencyLabels } from "@/lib/validations/income";
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

export type DraftIncome = {
  name: string;
  expectedAmount: number;
  frequency: (typeof incomeFrequencyValues)[number];
};

export function StepIncome({
  pending,
  currency,
  onSubmit,
  onSkip,
  onBack,
}: {
  pending: boolean;
  currency: string;
  onSubmit: (sources: DraftIncome[]) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [drafts, setDrafts] = useState<DraftIncome[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] =
    useState<(typeof incomeFrequencyValues)[number]>("monthly");

  function addDraft() {
    if (!name || amount === "") return;
    setDrafts((d) => [...d, { name, expectedAmount: Number(amount), frequency }]);
    setName("");
    setAmount("");
  }

  function removeDraft(index: number) {
    setDrafts((d) => d.filter((_, i) => i !== index));
  }

  function handleContinue() {
    if (drafts.length === 0) {
      onSkip();
      return;
    }
    onSubmit(drafts);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Agrega tus ingresos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sueldo, negocio, freelance — lo que esperas recibir cada periodo.
          Podrás compararlo con lo que realmente recibas.
        </p>
      </div>

      {drafts.length > 0 && (
        <ul className="space-y-2">
          {drafts.map((d, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{d.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {d.expectedAmount} {currency} ·{" "}
                  {incomeFrequencyLabels[d.frequency]}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeDraft(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="inc-name">Nombre</Label>
          <Input
            id="inc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sueldo"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inc-frequency">Frecuencia</Label>
          <Select
            value={frequency}
            onValueChange={(v) =>
              setFrequency(v as (typeof incomeFrequencyValues)[number])
            }
          >
            <SelectTrigger id="inc-frequency" className="w-36">
              <SelectValue>
                {(value: string | null) =>
                  incomeFrequencyLabels[
                    (value ?? "monthly") as (typeof incomeFrequencyValues)[number]
                  ]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {incomeFrequencyValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {incomeFrequencyLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inc-amount">Monto esperado</Label>
          <Input
            id="inc-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-32"
          />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={addDraft}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          Atrás
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onSkip}
          disabled={pending}
        >
          Omitir
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleContinue}
          disabled={pending}
        >
          {pending ? "Guardando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
