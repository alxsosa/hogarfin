"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveNetWorthSnapshot } from "@/features/net-worth/actions";

export function SaveSnapshotButton({
  householdId,
  hasToday,
}: {
  householdId: string;
  hasToday: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await saveNetWorthSnapshot(householdId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          hasToday
            ? "Snapshot de hoy actualizado."
            : "Snapshot guardado — ya aparece en la gráfica."
        );
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSave} disabled={isPending}>
      <Camera />
      {isPending
        ? "Guardando..."
        : hasToday
          ? "Actualizar snapshot de hoy"
          : "Guardar snapshot"}
    </Button>
  );
}
