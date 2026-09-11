"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateDebtDialog } from "./create-debt-dialog";

export function CreateDebtButton({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Nueva deuda
      </Button>
      <CreateDebtDialog householdId={householdId} open={open} onOpenChange={setOpen} />
    </>
  );
}
