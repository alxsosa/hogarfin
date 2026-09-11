"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomeForm } from "./income-form";
import type { Account } from "@/features/accounts/data";
import type { CategoryRow } from "@/features/transactions/data";

export function CreateIncomeButton({
  householdId,
  accounts,
  categories,
}: {
  householdId: string;
  accounts: Account[];
  categories: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Nueva fuente de ingreso
      </Button>
      <IncomeForm
        householdId={householdId}
        accounts={accounts}
        categories={categories}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
