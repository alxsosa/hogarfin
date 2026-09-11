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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateGoal } from "@/features/funds/actions";
import { goalTypeLabels, goalTypeValues } from "@/lib/validations/funds";
import type { GoalRow } from "@/features/funds/data";

export function EditGoalDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: GoalRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(updateGoal, null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleOnOpenChange = useCallback(onOpenChange, [onOpenChange]);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Meta actualizada.");
      formRef.current?.reset();
      handleOnOpenChange(false);
    }
  }, [state, handleOnOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar meta</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu meta financiera.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} id="edit-goal-form" action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={goal.id} />

          <div className="space-y-2">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input
              id="goal-name"
              name="name"
              placeholder="Fondo de emergencia"
              defaultValue={goal.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-type">Tipo</Label>
            <Select name="type" defaultValue={goal.type}>
              <SelectTrigger id="goal-type" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? goalTypeLabels[value as keyof typeof goalTypeLabels]
                      : "Selecciona un tipo"
                  }
                </SelectValue>
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
                defaultValue={goal.target_amount}
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
                defaultValue={goal.current_amount}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-targetDate">Fecha meta (opcional)</Label>
              <Input
                id="goal-targetDate"
                name="targetDate"
                type="date"
                defaultValue={goal.target_date ? goal.target_date.split("T")[0] : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-priority">Prioridad (opcional)</Label>
              <Input
                id="goal-priority"
                name="priority"
                type="number"
                step="1"
                placeholder="0"
                defaultValue={goal.priority ?? ""}
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
          <Button type="submit" form="edit-goal-form" disabled={pending}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
