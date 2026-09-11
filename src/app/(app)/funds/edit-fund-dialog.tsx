"use client";

import { useActionState, useEffect, useRef, useCallback } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateFund } from "@/features/funds/actions";
import type { FundRow } from "@/features/funds/data";

export function EditFundDialog({
  fund,
  open,
  onOpenChange,
}: {
  fund: FundRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(updateFund, null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleOnOpenChange = useCallback(onOpenChange, [onOpenChange]);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Fondo actualizado.");
      formRef.current?.reset();
      handleOnOpenChange(false);
    }
  }, [state, handleOnOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar fondo</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu fondo de ahorro.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} id="edit-fund-form" action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={fund.id} />

          <div className="space-y-2">
            <Label htmlFor="fund-name">Nombre</Label>
            <Input
              id="fund-name"
              name="name"
              placeholder="Vacaciones"
              defaultValue={fund.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fund-goalAmount">Meta</Label>
              <Input
                id="fund-goalAmount"
                name="goalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={fund.goal_amount}
                required
              />
              {state?.fieldErrors?.goalAmount && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.goalAmount[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-currentBalance">Saldo actual</Label>
              <Input
                id="fund-currentBalance"
                name="currentBalance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={fund.current_balance}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fund-targetDate">Fecha meta (opcional)</Label>
              <Input
                id="fund-targetDate"
                name="targetDate"
                type="date"
                defaultValue={fund.target_date ? fund.target_date.split("T")[0] : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-monthlyContribution">
                Aportación mensual (opcional)
              </Label>
              <Input
                id="fund-monthlyContribution"
                name="monthlyContribution"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={fund.monthly_contribution ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fund-notes">Notas (opcional)</Label>
            <Input
              id="fund-notes"
              name="notes"
              placeholder="Notas"
              defaultValue={fund.notes ?? ""}
            />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="edit-fund-form" disabled={pending}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
