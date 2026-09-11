"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { createTransaction } from "@/features/transactions/actions";
import type { AccountOption, CategoryRow } from "@/features/transactions/data";
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
import { cn } from "cn";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  householdId,
  accounts,
  categories,
  onSuccess,
}: {
  householdId: string;
  accounts: AccountOption[];
  categories: CategoryRow[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createTransaction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Transacción guardada.");
      formRef.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="type" value={type} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            type === "EXPENSE"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-input text-muted-foreground hover:bg-muted"
          )}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            type === "INCOME"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-input text-muted-foreground hover:bg-muted"
          )}
        >
          Ingreso
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
          {state?.fieldErrors?.date && (
            <p className="text-sm text-destructive">{state.fieldErrors.date[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
          />
          {state?.fieldErrors?.amount && (
            <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" placeholder="Ej. Compra de despensa" required />
        {state?.fieldErrors?.description && (
          <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchant">Comercio (opcional)</Label>
        <Input id="merchant" name="merchant" placeholder="Ej. Walmart" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountId">Cuenta</Label>
          <Select name="accountId">
            <SelectTrigger id="accountId" className="w-full">
              <SelectValue placeholder="Elige una cuenta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.fieldErrors?.accountId && (
            <p className="text-sm text-destructive">{state.fieldErrors.accountId[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <Select name="categoryId">
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.parentId ? `   ${c.name}` : `${c.icon ?? ""} ${c.name}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Etiquetas (opcional, separadas por coma)</Label>
        <Input id="tags" name="tags" placeholder="ej. viaje, reembolsable" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          placeholder="Detalles adicionales"
        />
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar transacción"}
        </Button>
      </div>
    </form>
  );
}
