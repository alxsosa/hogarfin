"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DebtRow } from "@/features/funds/data";
import { formatCurrency, formatDate } from "@/features/funds/format";

export function DebtsList({
  debts,
  currency,
}: {
  debts: DebtRow[];
  currency: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Acreedor</TableHead>
          <TableHead>Saldo actual</TableHead>
          <TableHead>Interés</TableHead>
          <TableHead>Pago mínimo</TableHead>
          <TableHead>Pago planeado</TableHead>
          <TableHead>Fecha límite</TableHead>
          <TableHead>Estimado de liquidación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {debts.map((debt) => {
          const payment = debt.planned_payment || debt.minimum_payment;
          const showEstimate =
            debt.interest_rate != null &&
            debt.current_balance > 0 &&
            payment != null &&
            payment > 0;
          const months = showEstimate
            ? Math.ceil(debt.current_balance / payment!)
            : null;

          return (
            <TableRow key={debt.id}>
              <TableCell className="font-medium">{debt.creditor}</TableCell>
              <TableCell>{formatCurrency(debt.current_balance, currency)}</TableCell>
              <TableCell>
                {debt.interest_rate != null ? `${debt.interest_rate}%` : "—"}
              </TableCell>
              <TableCell>
                {debt.minimum_payment != null
                  ? formatCurrency(debt.minimum_payment, currency)
                  : "—"}
              </TableCell>
              <TableCell>
                {debt.planned_payment != null
                  ? formatCurrency(debt.planned_payment, currency)
                  : "—"}
              </TableCell>
              <TableCell>
                {debt.due_date ? formatDate(debt.due_date) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {months != null ? (
                  <span title="Estimado simplificado, sin interés compuesto. La lógica completa de amortización/avalancha/bola de nieve llegará más adelante.">
                    ~{months} {months === 1 ? "mes" : "meses"}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
