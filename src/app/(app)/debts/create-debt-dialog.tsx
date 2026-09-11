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
import { createDebt } from "@/features/funds/actions";
import { debtStrategyLabels, debtStrategyValues } from "@/lib/validations/funds";

export function CreateDebtDialog({
  householdId,
  open,
  onOpenChange,
}: {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(createDebt, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Deuda creada.");
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva deuda</DialogTitle>
          <DialogDescription>
            Registra una deuda para dar seguimiento a su saldo y pagos.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} id="create-debt-form" action={formAction} className="space-y-3">
          <input type="hidden" name="householdId" value={householdId} />

          <div className="space-y-2">
            <Label htmlFor="debt-creditor">Acreedor</Label>
            <Input id="debt-creditor" name="creditor" placeholder="Banco XYZ" required />
            {state?.fieldErrors?.creditor && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.creditor[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-originalBalance">Saldo original</Label>
              <Input
                id="debt-originalBalance"
                name="originalBalance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
              {state?.fieldErrors?.originalBalance && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.originalBalance[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-currentBalance">Saldo actual</Label>
              <Input
                id="debt-currentBalance"
                name="currentBalance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
              {state?.fieldErrors?.currentBalance && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.currentBalance[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-interestRate">Tasa de interés % (opcional)</Label>
              <Input
                id="debt-interestRate"
                name="interestRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-dueDate">Fecha límite (opcional)</Label>
              <Input id="debt-dueDate" name="dueDate" type="date" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-minimumPayment">Pago mínimo (opcional)</Label>
              <Input
                id="debt-minimumPayment"
                name="minimumPayment"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-plannedPayment">Pago planeado (opcional)</Label>
              <Input
                id="debt-plannedPayment"
                name="plannedPayment"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-strategy">Estrategia (opcional)</Label>
            <Select name="strategy" defaultValue="">
              <SelectTrigger id="debt-strategy" className="w-full">
                <SelectValue placeholder="Sin definir" />
              </SelectTrigger>
              <SelectContent>
                {debtStrategyValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {debtStrategyLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="create-debt-form" disabled={pending}>
            {pending ? "Guardando..." : "Crear deuda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
