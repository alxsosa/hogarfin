import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-3xl font-semibold tracking-tight">HogarFin</span>
      <p className="max-w-md text-lg text-muted-foreground">
        Presupuesto, cuentas, deudas, metas y patrimonio — pensado para tu
        hogar, no solo para ti.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/signup" />}>Crear cuenta</Button>
        <Button render={<Link href="/login" />} variant="outline">
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
