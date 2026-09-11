"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { CategoryOption } from "../onboarding-wizard";
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

export type DraftBudgetLine = {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
};

export function StepBudget({
  pending,
  currency,
  categories,
  onSubmit,
  onSkip,
  onBack,
}: {
  pending: boolean;
  currency: string;
  categories: CategoryOption[];
  onSubmit: (lines: DraftBudgetLine[]) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [drafts, setDrafts] = useState<DraftBudgetLine[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");

  const available = categories.filter(
    (c) => !drafts.some((d) => d.categoryId === c.id)
  );

  function addDraft() {
    const category = categories.find((c) => c.id === categoryId);
    if (!category || amount === "") return;
    setDrafts((d) => [
      ...d,
      { categoryId: category.id, categoryName: category.name, budgetedAmount: Number(amount) },
    ]);
    setCategoryId("");
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

  const total = drafts.reduce((sum, d) => sum + d.budgetedAmount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Presupuesto inicial
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Asigna un monto a las categorías que quieras controlar este mes.
          Puedes agregar el resto después desde Presupuesto.
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
                <span className="font-medium">{d.categoryName}</span>{" "}
                <span className="text-muted-foreground">
                  · {d.budgetedAmount} {currency}
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
          <li className="flex items-center justify-between px-3 pt-1 text-sm font-medium">
            <span>Total asignado</span>
            <span>
              {total} {currency}
            </span>
          </li>
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="budget-category">Categoría</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger id="budget-category" className="w-full">
                <SelectValue placeholder="Selecciona una categoría">
                  {(value: string | null) =>
                    available.find((c) => c.id === value)?.name ??
                    "Selecciona una categoría"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Monto</Label>
            <Input
              id="budget-amount"
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
      )}

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
