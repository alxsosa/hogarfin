"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { createRule } from "@/features/rules/actions";
import {
  matchFieldValues,
  matchFieldLabels,
  matchTypeValues,
  matchTypeLabels,
} from "@/lib/validations/rules";
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

const AMOUNT_MATCH_TYPES = new Set(["amount_gt", "amount_lt", "equals"]);
const TEXT_MATCH_TYPES = new Set(["contains", "starts_with", "ends_with", "equals"]);

export function CreateRuleForm({
  householdId,
  categories,
}: {
  householdId: string;
  categories: CategoryRow[];
}) {
  const [state, formAction, pending] = useActionState(createRule, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [matchField, setMatchField] = useState<string>("description");

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Regla creada.");
      // Resets the native inputs (name, matchValue, category, priority).
      // matchField's own React state is deliberately left as-is — it
      // only controls which "Condición" options are offered, and
      // resetting it here would mean a second setState call inside this
      // same effect body (react-hooks/set-state-in-effect flags that).
      // Leaving it is harmless: the user can just pick "Campo" again if
      // they want a different one for their next rule.
      formRef.current?.reset();
    }
  }, [state]);

  const allowedMatchTypes =
    matchField === "amount"
      ? matchTypeValues.filter((v) => AMOUNT_MATCH_TYPES.has(v))
      : matchTypeValues.filter((v) => TEXT_MATCH_TYPES.has(v));

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="householdId" value={householdId} />

      <div className="space-y-2">
        <Label htmlFor="name">Nombre (opcional)</Label>
        <Input id="name" name="name" placeholder="Ej. OXXO → Supermercado" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="matchField">Campo</Label>
          <Select
            name="matchField"
            defaultValue="description"
            onValueChange={(v) => setMatchField(v ?? "description")}
          >
            <SelectTrigger id="matchField" className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value
                    ? matchFieldLabels[value as (typeof matchFieldValues)[number]]
                    : "Campo"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {matchFieldValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {matchFieldLabels[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="matchType">Condición</Label>
          <Select name="matchType" defaultValue={allowedMatchTypes[0]} key={matchField}>
            <SelectTrigger id="matchType" className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value
                    ? matchTypeLabels[value as (typeof matchTypeValues)[number]]
                    : "Condición"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allowedMatchTypes.map((v) => (
                <SelectItem key={v} value={v}>
                  {matchTypeLabels[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="matchValue">Valor</Label>
          <Input
            id="matchValue"
            name="matchValue"
            placeholder={matchField === "amount" ? "500" : "OXXO"}
            type={matchField === "amount" ? "number" : "text"}
            step={matchField === "amount" ? "0.01" : undefined}
            required
          />
          {state?.fieldErrors?.matchValue && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.matchValue[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Asignar categoría</Label>
          <Select name="categoryId" required>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Selecciona una categoría">
                {(value: string | null) =>
                  categories.find((c) => c.id === value)?.name ??
                  "Selecciona una categoría"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.fieldErrors?.categoryId && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.categoryId[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad (mayor gana)</Label>
          <Input
            id="priority"
            name="priority"
            type="number"
            defaultValue={0}
            step={1}
          />
        </div>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear regla"}
      </Button>
    </form>
  );
}
