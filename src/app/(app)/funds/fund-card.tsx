"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FundRow } from "@/features/funds/data";
import {
  formatCurrency,
  formatDate,
  neededMonthly,
  progressPct,
} from "@/features/funds/format";
import { ContributeDialog } from "./contribute-dialog";

export function FundCard({
  fund,
  currency,
}: {
  fund: FundRow;
  currency: string;
}) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const pct = progressPct(fund.current_balance, fund.goal_amount);
  const needsHint =
    fund.target_date &&
    fund.current_balance < fund.goal_amount &&
    neededMonthly(fund.current_balance, fund.goal_amount, fund.target_date);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{fund.name}</CardTitle>
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
            {formatCurrency(fund.current_balance, currency)} de{" "}
            {formatCurrency(fund.goal_amount, currency)}
          </p>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {fund.target_date && <p>Fecha meta: {formatDate(fund.target_date)}</p>}
          {fund.monthly_contribution != null && (
            <p>
              Aportación mensual:{" "}
              {formatCurrency(fund.monthly_contribution, currency)}
            </p>
          )}
          {needsHint ? (
            <p className="text-foreground">
              Necesitas ahorrar {formatCurrency(needsHint, currency)}/mes para
              llegar a tiempo.
            </p>
          ) : null}
        </div>
      </CardContent>

      <ContributeDialog
        kind="fund"
        id={fund.id}
        name={fund.name}
        open={contributeOpen}
        onOpenChange={setContributeOpen}
      />
    </Card>
  );
}
