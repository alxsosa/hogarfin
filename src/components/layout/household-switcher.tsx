"use client";

import { Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type HouseholdOption = {
  id: string;
  name: string;
};

/**
 * Lets a user switch between the households they belong to (e.g. a
 * shared "Familia Sosa" household and a personal one). The selected
 * household id is expected to be persisted server-side (cookie or
 * profile.active_household_id) once Phase 1 data access lands.
 */
export function HouseholdSwitcher({
  households,
  activeId,
  onSwitch,
}: {
  households: HouseholdOption[];
  activeId: string | null;
  onSwitch?: (id: string) => void;
}) {
  const active = households.find((h) => h.id === activeId) ?? households[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="justify-start gap-2">
            <Home className="h-4 w-4" />
            {active?.name ?? "Selecciona un hogar"}
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Tus hogares</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {households.map((h) => (
          <DropdownMenuItem key={h.id} onClick={() => onSwitch?.(h.id)}>
            {h.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
