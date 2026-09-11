"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveRule } from "@/features/rules/actions";

export function ArchiveRuleButton({
  id,
  name,
}: {
  id: string;
  name: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    if (!confirm(`¿Desactivar la regla "${name ?? "sin nombre"}"?`)) return;
    startTransition(async () => {
      const result = await archiveRule(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Regla desactivada.");
      }
    });
  }

  return (
    <Button variant="ghost" size="icon-sm" disabled={isPending} onClick={handleArchive}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
