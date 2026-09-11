"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveBill, markBillPaid } from "@/features/bills/actions";
import { billFrequencyLabels } from "@/lib/validations/bills";
import { formatCurrency, formatDate, daysUntil } from "@/features/bills/format";
import type { BillRow } from "@/features/bills/data";
import type { CategoryRow } from "@/features/transactions/data";
import type { Account } from "@/features/accounts/data";
import { BillFormDialog } from "./bill-form-dialog";

export function BillsList({
  bills,
  currency,
  householdId,
  categories,
  accounts,
}: {
  bills: BillRow[];
  currency: string;
  householdId: string;
  categories: CategoryRow[];
  accounts: Account[];
}) {
  const [editing, setEditing] = useState<BillRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      const result = await markBillPaid(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Factura marcada como pagada.");
      }
    });
  }

  function handleArchive(id: string, name: string) {
    if (!confirm(`¿Archivar la factura "${name}"? Podrás seguir viéndola en tu historial.`)) {
      return;
    }
    startTransition(async () => {
      const result = await archiveBill(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Factura archivada.");
      }
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Frecuencia</TableHead>
            <TableHead>Próximo pago</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => {
            const dueSoon =
              bill.next_due_date != null &&
              daysUntil(bill.next_due_date) <= bill.reminder_days_before &&
              daysUntil(bill.next_due_date) >= 0;

            return (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => setEditing(bill)}
                  >
                    {bill.name}
                  </button>
                </TableCell>
                <TableCell>{formatCurrency(bill.amount, currency)}</TableCell>
                <TableCell>
                  {billFrequencyLabels[bill.frequency as keyof typeof billFrequencyLabels] ??
                    bill.frequency}
                </TableCell>
                <TableCell>
                  {bill.next_due_date ? formatDate(bill.next_due_date) : "—"}
                </TableCell>
                <TableCell>{bill.categories?.name ?? "—"}</TableCell>
                <TableCell>{bill.accounts?.name ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {bill.auto_pay && <Badge variant="secondary">Auto-pago</Badge>}
                    {dueSoon && (
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Próximo a vencer
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleMarkPaid(bill.id)}
                    >
                      Marcar como pagada
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleArchive(bill.id, bill.name)}
                    >
                      Archivar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editing && (
        <BillFormDialog
          householdId={householdId}
          categories={categories}
          accounts={accounts}
          bill={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
}
