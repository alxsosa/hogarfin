"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { deleteTransaction } from "@/features/transactions/actions";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await deleteTransaction(id);
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Transacción eliminada.");
          }
        });
      }}
    >
      <Trash2Icon className="text-muted-foreground" />
      <span className="sr-only">Eliminar</span>
    </Button>
  );
}
