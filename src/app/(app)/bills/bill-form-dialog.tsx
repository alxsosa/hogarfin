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
import { createBill, updateBill } from "@/features/bills/actions";
import { billFrequencyLabels, billFrequencyValues } from "@/lib/validations/bills";
import type { BillRow } from "@/features/bills/data";
import type { CategoryRow } from "@/features/transactions/data";
import type { Account } from "@/features/accounts/data";

const NONE = "__none__";

export function BillFormDialog({
  householdId,
  categories,
  accounts,
  open,
  onOpenChange,
  bill,
}: {
  householdId: string;
  categories: CategoryRow[];
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: BillRow;
}) {
  const isEdit = !!bill;
  const action = isEdit ? updateBill : createBill;
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success(isEdit ? "Factura actualizada." : "Factura creada.");
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar factura" : "Nueva factura"}</DialogTitle>
          <DialogDescription>
            Registra un gasto recurrente para no perder de vista sus pagos.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          id="bill-form"
          action={formAction}
          className="space-y-3"
        >
          <input type="hidden" name="householdId" value={householdId} />
          {isEdit && <input type="hidden" name="id" value={bill.id} />}

          <div className="space-y-2">
            <Label htmlFor="bill-name">Nombre</Label>
            <Input
              id="bill-name"
              name="name"
              placeholder="Renta, luz, internet..."
              defaultValue={bill?.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bill-amount">Monto</Label>
              <Input
                id="bill-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={bill?.amount}
                required
              />
              {state?.fieldErrors?.amount && (
                <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill-frequency">Frecuencia</Label>
              <Select name="frequency" defaultValue={bill?.frequency ?? "monthly"}>
                <SelectTrigger id="bill-frequency" className="w-full">
                  <SelectValue placeholder="Frecuencia">
                    {(value: string | null) =>
                      value
                        ? billFrequencyLabels[value as keyof typeof billFrequencyLabels]
                        : "Frecuencia"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {billFrequencyValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {billFrequencyLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bill-nextDueDate">Próxima fecha de pago</Label>
              <Input
                id="bill-nextDueDate"
                name="nextDueDate"
                type="date"
                defaultValue={bill?.next_due_date ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill-reminderDaysBefore">Aviso (días antes)</Label>
              <Input
                id="bill-reminderDaysBefore"
                name="reminderDaysBefore"
                type="number"
                min="0"
                step="1"
                placeholder="3"
                defaultValue={bill?.reminder_days_before ?? 3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bill-categoryId">Categoría (opcional)</Label>
              <Select name="categoryId" defaultValue={bill?.category_id ?? NONE}>
                <SelectTrigger id="bill-categoryId" className="w-full">
                  <SelectValue placeholder="Sin categoría">
                    {(value: string | null) => {
                      if (!value || value === NONE) return "Sin categoría";
                      return categories.find((c) => c.id === value)?.name ?? "Sin categoría";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill-accountId">Cuenta (opcional)</Label>
              <Select name="accountId" defaultValue={bill?.account_id ?? NONE}>
                <SelectTrigger id="bill-accountId" className="w-full">
                  <SelectValue placeholder="Sin cuenta">
                    {(value: string | null) => {
                      if (!value || value === NONE) return "Sin cuenta";
                      return accounts.find((a) => a.id === value)?.name ?? "Sin cuenta";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin cuenta</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="bill-autoPay"
              name="autoPay"
              type="checkbox"
              defaultChecked={bill?.auto_pay ?? false}
              className="h-4 w-4 rounded border border-input accent-primary"
            />
            <Label htmlFor="bill-autoPay" className="font-normal">
              Pago automático
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-notes">Notas (opcional)</Label>
            <textarea
              id="bill-notes"
              name="notes"
              rows={2}
              defaultValue={bill?.notes ?? undefined}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="bill-form" disabled={pending}>
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear factura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
