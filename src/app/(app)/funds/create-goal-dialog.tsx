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
import { createGoal } from "@/features/funds/actions";
import { goalTypeLabels, goalTypeValues } from "@/lib/validations/funds";

export function CreateGoalDialog({
  householdId,
  open,
  onOpenChange,
}: {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(createGoal, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Meta creada.");
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva meta</DialogTitle>
          <DialogDescription>
            Define una meta financiera y dale seguimiento a tu progreso.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} id="create-goal-form" action={formAction} className="space-y-3">
          <input type="hidden" name="householdId" value={householdId} />

          <div className="space-y-2">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input id="goal-name" name="name" placeholder="Fondo de emergencia" required />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-type">Tipo</Label>
            <Select name="type" defaultValue="custom">
              <SelectTrigger id="goal-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {goalTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-targetAmount">Meta</Label>
              <Input
                id="goal-targetAmount"
                name="targetAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
              {state?.fieldErrors?.targetAmount && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.targetAmount[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-currentAmount">Monto actual</Label>
              <Input
                id="goal-currentAmount"
                name="currentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-targetDate">Fecha meta (opcional)</Label>
              <Input id="goal-targetDate" name="targetDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-priority">Prioridad (opcional)</Label>
              <Input
                id="goal-priority"
                name="priority"
                type="number"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="create-goal-form" disabled={pending}>
            {pending ? "Guardando..." : "Crear meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
