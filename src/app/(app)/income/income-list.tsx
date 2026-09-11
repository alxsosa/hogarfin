"use client";

import { useState, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { Archive } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { archiveIncomeSource } from "@/features/income/actions";
import { incomeFrequencyLabels } from "@/lib/validations/income";
import type { IncomeSourceRow } from "@/features/income/data";
import { formatCurrency } from "@/features/funds/format";
import { IncomeForm } from "./income-form";
import type { Account } from "@/features/accounts/data";
import type { CategoryRow } from "@/features/transactions/data";

export function IncomeList({
  incomeSources,
  currency,
  householdId,
  accounts,
  categories,
}: {
  incomeSources: IncomeSourceRow[];
  currency: string;
  householdId: string;
  accounts: Account[];
  categories: CategoryRow[];
}) {
  const [editing, setEditing] = useState<IncomeSourceRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setEditing(null);
  }, []);

  function handleArchive(id: string) {
    if (!confirm("¿Archivar esta fuente de ingreso?")) return;
    startTransition(async () => {
      const result = await archiveIncomeSource(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Fuente de ingreso archivada.");
      }
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Monto esperado</TableHead>
            <TableHead>Frecuencia</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomeSources.map((income) => (
            <TableRow key={income.id}>
              <TableCell
                className="cursor-pointer font-medium"
                onClick={() => setEditing(income)}
              >
                {income.name}
              </TableCell>
              <TableCell>
                {income.expected_amount != null
                  ? formatCurrency(income.expected_amount, currency)
                  : "—"}
              </TableCell>
              <TableCell>{incomeFrequencyLabels[income.frequency]}</TableCell>
              <TableCell>{income.account?.name ?? "—"}</TableCell>
              <TableCell>{income.category?.name ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleArchive(income.id)}
                  aria-label="Archivar"
                >
                  <Archive />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <IncomeForm
          householdId={householdId}
          accounts={accounts}
          categories={categories}
          incomeSource={editing}
          open={!!editing}
          onOpenChange={handleOpenChange}
        />
      )}
    </>
  );
}
