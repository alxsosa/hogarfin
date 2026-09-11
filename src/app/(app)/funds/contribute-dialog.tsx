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
import { contributeToFund, contributeToGoal } from "@/features/funds/actions";

export function ContributeDialog({
  kind,
  id,
  name,
  open,
  onOpenChange,
}: {
  kind: "fund" | "goal";
  id: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = kind === "fund" ? contributeToFund : contributeToGoal;
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Aportación registrada.");
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aportar a {name}</DialogTitle>
          <DialogDescription>
            Registra una aportación manual. El saldo se actualizará de
            inmediato.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} id="contribute-form" action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
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
              autoFocus
            />
            {state?.fieldErrors?.amount && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.amount[0]}
              </p>
            )}
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="contribute-form" disabled={pending}>
            {pending ? "Guardando..." : "Aportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
