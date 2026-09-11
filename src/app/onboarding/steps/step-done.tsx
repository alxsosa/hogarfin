"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Todo listo
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu hogar está configurado. Puedes seguir ajustando cuentas,
          ingresos y presupuesto en cualquier momento desde el menú lateral.
        </p>
      </div>
      <Button type="button" className="w-full" onClick={onFinish}>
        Ir al dashboard
      </Button>
    </div>
  );
}
