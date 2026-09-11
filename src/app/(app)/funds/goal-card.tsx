"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GoalRow } from "@/features/funds/data";
import {
  formatCurrency,
  formatDate,
  neededMonthly,
  progressPct,
} from "@/features/funds/format";
import { goalTypeLabels } from "@/lib/validations/funds";
import { ContributeDialog } from "./contribute-dialog";

export function GoalCard({
  goal,
  currency,
}: {
  goal: GoalRow;
  currency: string;
}) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const pct = progressPct(goal.current_amount, goal.target_amount);
  const needsHint =
    goal.target_date &&
    goal.current_amount < goal.target_amount &&
    neededMonthly(goal.current_amount, goal.target_amount, goal.target_date);

  const typeLabel =
    goalTypeLabels[goal.type as keyof typeof goalTypeLabels] ?? goal.type;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{goal.name}</CardTitle>
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setContributeOpen(true)}
        >
          <Plus />
        </Button>
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
