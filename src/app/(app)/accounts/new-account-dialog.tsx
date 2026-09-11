"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
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

export function NewAccountDialog({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Nueva cuenta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
          <DialogDescription>
            Agrega una cuenta bancaria, tarjeta, efectivo u otro activo o
            pasivo del hogar.
          </DialogDescription>
        </DialogHeader>
        <AccountForm householdId={householdId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
