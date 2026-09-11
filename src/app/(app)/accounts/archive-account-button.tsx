"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveAccount } from "@/features/accounts/actions";

export function ArchiveAccountButton({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`¿Archivar la cuenta "${accountName}"? Podrás seguir viendo su historial, pero dejará de aparecer en tus cuentas activas.`)) {
      return;
    }
    startTransition(async () => {
      const result = await archiveAccount(accountId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Cuenta archivada.");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={handleClick}
    >
      <Trash2Icon />
      <span className="sr-only">Archivar cuenta</span>
    </Button>
  );
}
