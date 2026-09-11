"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyFlowRow } from "@/features/reports/data";

// Slot 1 (blue) = income, slot 8 (red) = expense — a fixed, never-cycled
// two-series assignment per the dataviz skill's categorical rule.
const INCOME_COLOR = "#2a78d6";
const EXPENSE_COLOR = "#e34948";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
  });
}

export function MonthlyFlowChart({
  data,
  currency,
}: {
  data: MonthlyFlowRow[];
  currency: string;
}) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay suficientes transacciones para mostrar una tendencia.
      </p>
    );
  }

  const chartData = data.map((d) => ({ ...d, monthLabel: monthLabel(d.month) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
          <XAxis
            dataKey="monthLabel"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, currency)}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (value === "income" ? "Ingresos" : "Gastos")}
          />
          <Bar
            dataKey="income"
            name="income"
            fill={INCOME_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill={EXPENSE_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
