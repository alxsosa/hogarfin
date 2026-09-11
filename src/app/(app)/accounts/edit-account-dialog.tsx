"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountForm } from "./account-form";
import type { Account } from "@/features/accounts/data";

export function EditAccountDialog({
  householdId,
  account,
}: {
  householdId: string;
  account: Account;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">Editar cuenta</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogDescription>Actualiza los datos de {account.name}.</DialogDescription>
        </DialogHeader>
        <AccountForm
          householdId={householdId}
          account={account}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
