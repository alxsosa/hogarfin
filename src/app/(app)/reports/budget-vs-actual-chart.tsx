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
import type { BudgetVsActualRow } from "@/features/reports/data";

// Slot 1 (blue) = presupuestado, slot 2 (orange) = real — fixed,
// never-cycled two-series assignment.
const BUDGETED_COLOR = "#2a78d6";
const ACTUAL_COLOR = "#eb6834";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetVsActualChart({
  data,
  currency,
}: {
  data: BudgetVsActualRow[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no has agregado categorías al presupuesto de este mes. Ve a{" "}
        <a href="/budget" className="underline underline-offset-4">
          Presupuesto
        </a>{" "}
        para empezar.
      </p>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v, currency)}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="categoryName"
            width={110}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
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
            formatter={(value) =>
              value === "budgeted" ? "Presupuestado" : "Real"
            }
          />
          <Bar
            dataKey="budgeted"
            name="budgeted"
            fill={BUDGETED_COLOR}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
          <Bar
            dataKey="actual"
            name="actual"
            fill={ACTUAL_COLOR}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
