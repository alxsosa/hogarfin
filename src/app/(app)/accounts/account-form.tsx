"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createAccount, updateAccount } from "@/features/accounts/actions";
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
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import type { Account } from "@/features/accounts/data";
import type { AccountType } from "@/lib/validations/account";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Cuenta de cheques",
  savings: "Cuenta de ahorro",
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  investment: "Inversión",
  retirement: "Cuenta de retiro",
  loan: "Préstamo",
  mortgage: "Hipoteca",
  other_asset: "Otro activo",
  other_liability: "Otro pasivo",
};

const CREDIT_LIKE_TYPES = new Set(["credit_card", "loan", "mortgage"]);

export function AccountForm({
  householdId,
  account,
  onSuccess,
}: {
  householdId: string;
  account?: Account;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(account);
  const action = isEdit ? updateAccount : createAccount;
  const [state, formAction, pending] = useActionState(action, null);
  const [type, setType] = useState<string>(account?.type ?? "checking");

  useEffect(() => {
    if (state === null) return;
    if (!state.error && !state.fieldErrors) {
      toast.success(isEdit ? "Cuenta actualizada." : "Cuenta creada.");
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const showCreditFields = CREDIT_LIKE_TYPES.has(type);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="householdId" value={householdId} />
      {account && <input type="hidden" name="id" value={account.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ej. Cuenta principal BBVA"
          defaultValue={account?.name}
          required
        />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            name="type"
            value={type}
            onValueChange={(value) => setType(value ?? "checking")}
          >
            <SelectTrigger id="type" className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value
                    ? ACCOUNT_TYPE_LABELS[value as AccountType]
                    : "Selecciona un tipo"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="institution">Institución</Label>
          <Input
            id="institution"
            name="institution"
            placeholder="Ej. BBVA"
            defaultValue={account?.institution ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentBalance">Saldo actual</Label>
          <Input
            id="currentBalance"
            name="currentBalance"
            type="number"
            step="0.01"
            defaultValue={account?.current_balance ?? 0}
            required
          />
          {state?.fieldErrors?.currentBalance && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.currentBalance[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input
            id="currency"
            name="currency"
            maxLength={3}
            defaultValue={account?.currency ?? "MXN"}
            required
          />
        </div>
      </div>

      {showCreditFields && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Límite de crédito</Label>
            <Input
              id="creditLimit"
              name="creditLimit"
              type="number"
              step="0.01"
              defaultValue={account?.credit_limit ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Tasa de interés (%)</Label>
            <Input
              id="interestRate"
              name="interestRate"
              type="number"
              step="0.000001"
              defaultValue={account?.interest_rate ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statementDate">Día de corte</Label>
            <Input
              id="statementDate"
              name="statementDate"
              type="number"
              min={1}
              max={31}
              defaultValue={account?.statement_date ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Día de pago</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="number"
              min={1}
              max={31}
              defaultValue={account?.due_date ?? ""}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={account?.notes ?? ""}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cuenta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
