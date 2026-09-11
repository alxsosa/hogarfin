"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createIncomeSource,
  updateIncomeSource,
} from "@/features/income/actions";
import {
  incomeFrequencyLabels,
  incomeFrequencyValues,
} from "@/lib/validations/income";
import type { IncomeSourceRow } from "@/features/income/data";
import type { Account } from "@/features/accounts/data";
import type { CategoryRow } from "@/features/transactions/data";

export function IncomeForm({
  householdId,
  accounts,
  categories,
  incomeSource,
  open,
  onOpenChange,
}: {
  householdId: string;
  accounts: Account[];
  categories: CategoryRow[];
  incomeSource?: IncomeSourceRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!incomeSource;
  const action = isEdit ? updateIncomeSource : createIncomeSource;
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success(isEdit ? "Fuente de ingreso actualizada." : "Fuente de ingreso creada.");
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar fuente de ingreso" : "Nueva fuente de ingreso"}
          </DialogTitle>
          <DialogDescription>
            Registra un ingreso recurrente para dar seguimiento a lo esperado
            contra lo recibido.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          id="income-source-form"
          action={formAction}
          className="space-y-3"
        >
          <input type="hidden" name="householdId" value={householdId} />
          {isEdit && <input type="hidden" name="id" value={incomeSource.id} />}

          <div className="space-y-2">
            <Label htmlFor="income-name">Nombre</Label>
            <Input
              id="income-name"
              name="name"
              placeholder="Sueldo, freelance, renta..."
              defaultValue={incomeSource?.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="income-expectedAmount">
                Monto esperado (opcional)
              </Label>
              <Input
                id="income-expectedAmount"
                name="expectedAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={incomeSource?.expected_amount ?? undefined}
              />
              {state?.fieldErrors?.expectedAmount && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.expectedAmount[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-frequency">Frecuencia</Label>
              <Select
                name="frequency"
                defaultValue={incomeSource?.frequency ?? "monthly"}
              >
                <SelectTrigger id="income-frequency" className="w-full">
                  <SelectValue placeholder="Mensual">
                    {(value: string | null) =>
                      value
                        ? incomeFrequencyLabels[
                            value as keyof typeof incomeFrequencyLabels
                          ]
                        : "Mensual"
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="income-accountId">Cuenta (opcional)</Label>
              <Select
                name="accountId"
                defaultValue={incomeSource?.account_id ?? ""}
              >
                <SelectTrigger id="income-accountId" className="w-full">
                  <SelectValue placeholder="Sin definir">
                    {(value: string | null) =>
                      value
                        ? (accounts.find((a) => a.id === value)?.name ??
                          "Sin definir")
                        : "Sin definir"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-categoryId">Categoría (opcional)</Label>
              <Select
                name="categoryId"
                defaultValue={incomeSource?.category_id ?? ""}
              >
                <SelectTrigger id="income-categoryId" className="w-full">
                  <SelectValue placeholder="Sin definir">
                    {(value: string | null) =>
                      value
                        ? (categories.find((c) => c.id === value)?.name ??
                          "Sin definir")
                        : "Sin definir"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-notes">Notas (opcional)</Label>
            <textarea
              id="income-notes"
              name="notes"
              rows={3}
              defaultValue={incomeSource?.notes ?? undefined}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
            />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="income-source-form" disabled={pending}>
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear fuente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
