"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "./transaction-form";
import type { AccountOption, CategoryRow } from "@/features/transactions/data";

export function NewTransactionDialog({
  householdId,
  accounts,
  categories,
}: {
  householdId: string;
  accounts: AccountOption[];
  categories: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Nueva transacción
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva transacción</DialogTitle>
          <DialogDescription>
            Registra un ingreso o gasto para tu hogar.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TransactionForm
            householdId={householdId}
            accounts={accounts}
            categories={categories}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
