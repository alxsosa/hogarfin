"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AccountType } from "@/lib/validations/account";
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

export type DraftAccount = {
  name: string;
  type: AccountType;
  currentBalance: number;
};

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

export function StepAccounts({
  pending,
  currency,
  onSubmit,
  onSkip,
  onBack,
}: {
  pending: boolean;
  currency: string;
  onSubmit: (accounts: DraftAccount[]) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [drafts, setDrafts] = useState<DraftAccount[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [balance, setBalance] = useState("");

  function addDraft() {
    if (!name || balance === "") return;
    setDrafts((d) => [...d, { name, type, currentBalance: Number(balance) }]);
    setName("");
    setBalance("");
  }

  function removeDraft(index: number) {
    setDrafts((d) => d.filter((_, i) => i !== index));
  }

  function handleContinue() {
    if (drafts.length === 0) {
      onSkip();
      return;
    }
    onSubmit(drafts);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Agrega tus cuentas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bancos, tarjetas o efectivo. Agrega las que quieras ahora — el resto
          las puedes crear después desde Cuentas.
        </p>
      </div>

      {drafts.length > 0 && (
        <ul className="space-y-2">
          {drafts.map((d, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{d.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {ACCOUNT_TYPE_LABELS[d.type]} · {d.currentBalance} {currency}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeDraft(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="acc-name">Nombre</Label>
          <Input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cuenta principal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-type">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
            <SelectTrigger id="acc-type" className="w-44">
              <SelectValue>
                {(value: string | null) =>
                  ACCOUNT_TYPE_LABELS[(value ?? "checking") as AccountType]
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
        <div className="space-y-1.5">
          <Label htmlFor="acc-balance">Saldo actual</Label>
          <Input
            id="acc-balance"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className="w-32"
          />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={addDraft}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          Atrás
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onSkip}
          disabled={pending}
        >
          Omitir
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleContinue}
          disabled={pending}
        >
          {pending ? "Guardando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
