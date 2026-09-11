"use client";

import { useState, useTransition } from "react";
import { Plus, Archive, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { GoalRow } from "@/features/funds/data";
import {
  formatCurrency,
  formatDate,
  neededMonthly,
  progressPct,
} from "@/features/funds/format";
import { goalTypeLabels } from "@/lib/validations/funds";
import { archiveGoal } from "@/features/funds/actions";
import { ContributeDialog } from "./contribute-dialog";

export function GoalCard({
  goal,
  currency,
  onEdit,
}: {
  goal: GoalRow;
  currency: string;
  onEdit?: (goal: GoalRow) => void;
}) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pct = progressPct(goal.current_amount, goal.target_amount);
  const needsHint =
    goal.target_date &&
    goal.current_amount < goal.target_amount &&
    neededMonthly(goal.current_amount, goal.target_amount, goal.target_date);

  const typeLabel =
    goalTypeLabels[goal.type as keyof typeof goalTypeLabels] ?? goal.type;

  function handleArchive() {
    if (!confirm("¿Archivar esta meta? Los datos se conservarán.")) return;
    startTransition(async () => {
      const result = await archiveGoal(goal.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Meta archivada.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1 cursor-pointer hover:underline" onClick={() => onEdit?.(goal)}>
          <CardTitle className="text-base">{goal.name}</CardTitle>
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setContributeOpen(true)}
          >
            <Plus />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={isPending}
              >
                <span className="text-xl">⋯</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive} className="text-destructive">
                <Archive className="w-4 h-4 mr-2" />
                Archivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(goal.current_amount, currency)} de{" "}
            {formatCurrency(goal.target_amount, currency)}
          </p>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {goal.target_date && <p>Fecha meta: {formatDate(goal.target_date)}</p>}
          {needsHint ? (
            <p className="text-foreground">
              Necesitas ahorrar {formatCurrency(needsHint, currency)}/mes para
              llegar a tiempo.
            </p>
          ) : null}
        </div>
      </CardContent>

      <ContributeDialog
        kind="goal"
        id={goal.id}
        name={goal.name}
        open={contributeOpen}
        onOpenChange={setContributeOpen}
      />
    </Card>
  );
}
