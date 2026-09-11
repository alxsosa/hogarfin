"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillFormDialog } from "./bill-form-dialog";
import type { CategoryRow } from "@/features/transactions/data";
import type { Account } from "@/features/accounts/data";

export function CreateBillButton({
  householdId,
  categories,
  accounts,
}: {
  householdId: string;
  categories: CategoryRow[];
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Nueva factura
      </Button>
      <BillFormDialog
        householdId={householdId}
        categories={categories}
        accounts={accounts}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
