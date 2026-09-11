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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createFund } from "@/features/funds/actions";

export function CreateFundDialog({
  householdId,
  open,
  onOpenChange,
}: {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(createFund, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Fondo creado.");
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo fondo</DialogTitle>
          <DialogDescription>
            Un fondo de ahorro para un propósito específico (vacaciones,
            reparaciones, etc.).
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} id="create-fund-form" action={formAction} className="space-y-3">
          <input type="hidden" name="householdId" value={householdId} />

          <div className="space-y-2">
            <Label htmlFor="fund-name">Nombre</Label>
            <Input id="fund-name" name="name" placeholder="Vacaciones" required />
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fund-targetDate">Fecha meta (opcional)</Label>
              <Input id="fund-targetDate" name="targetDate" type="date" />
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fund-notes">Notas (opcional)</Label>
            <Input id="fund-notes" name="notes" placeholder="Notas" />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="create-fund-form" disabled={pending}>
            {pending ? "Guardando..." : "Crear fondo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
