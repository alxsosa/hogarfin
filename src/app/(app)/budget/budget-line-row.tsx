"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setBudgetLine, removeBudgetLine } from "@/features/budget/actions";
import type { BudgetLineRow as BudgetLineRowData } from "@/features/budget/data";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(
    amount
  );
}

export function BudgetLineRow({
  line,
  currency,
  householdId,
  periodMonth,
}: {
  line: BudgetLineRowData;
  currency: string;
  householdId: string;
  periodMonth: string;
}) {
  const [amount, setAmount] = useState(String(line.budgeted_amount));
  const [isPending, startTransition] = useTransition();

  function saveAmount() {
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed === line.budgeted_amount) return;

    const formData = new FormData();
    formData.set("householdId", householdId);
    formData.set("periodMonth", periodMonth);
    formData.set("categoryId", line.category_id);
    formData.set("budgetedAmount", String(parsed));

    startTransition(() => {
      setBudgetLine(null, formData);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{line.category_name}</TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={saveAmount}
          disabled={isPending}
          className="ml-auto w-28 text-right"
        />
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(line.actual_amount, currency)}
      </TableCell>
      <TableCell
        className={`text-right font-medium ${
          line.remaining < 0 ? "text-destructive" : ""
        }`}
      >
        {formatCurrency(line.remaining, currency)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (confirm(`¿Quitar "${line.category_name}" del presupuesto?`)) {
              startTransition(() => {
                removeBudgetLine(line.budget_line_id);
              });
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
