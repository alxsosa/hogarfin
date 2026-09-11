"use client";

import { useState, useTransition } from "react";
import { Plus, Archive, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { FundRow } from "@/features/funds/data";
import {
  formatCurrency,
  formatDate,
  neededMonthly,
  progressPct,
} from "@/features/funds/format";
import { archiveFund } from "@/features/funds/actions";
import { ContributeDialog } from "./contribute-dialog";

export function FundCard({
  fund,
  currency,
  onEdit,
}: {
  fund: FundRow;
  currency: string;
  onEdit?: (fund: FundRow) => void;
}) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pct = progressPct(fund.current_balance, fund.goal_amount);
  const needsHint =
    fund.target_date &&
    fund.current_balance < fund.goal_amount &&
    neededMonthly(fund.current_balance, fund.goal_amount, fund.target_date);

  function handleArchive() {
    if (!confirm("¿Archivar este fondo? Los datos se conservarán.")) return;
    startTransition(async () => {
      const result = await archiveFund(fund.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Fondo archivado.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-base cursor-pointer hover:underline" onClick={() => onEdit?.(fund)}>
          {fund.name}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setContributeOpen(true)}
          >
            <Plus />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon-sm" variant="ghost" disabled={isPending}>
                  <span className="text-xl">⋯</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(fund)}>
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
