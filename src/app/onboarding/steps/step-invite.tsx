"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StepInvite({
  pending,
  onInvite,
  onSkip,
  onBack,
}: {
  pending: boolean;
  onInvite: (email: string) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    onInvite(email);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Invita a tu pareja
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opcional. Podrán compartir cuentas, presupuesto y metas sin
          mezclar sus datos personales. Puedes hacerlo después desde
          Configuración → Miembros.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-email">Correo</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cynthia@ejemplo.com"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          Atrás
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onSkip}
          disabled={pending}
        >
          Omitir
        </Button>
        <Button type="submit" className="flex-1" disabled={pending || !email}>
          {pending ? "Enviando..." : "Invitar"}
        </Button>
      </div>
    </form>
  );
}
