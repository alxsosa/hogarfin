"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CategorySpendRow } from "@/features/reports/data";

// Fixed categorical order (never cycled/reassigned per-render) — same
// eight-hue set validated by the dataviz skill's palette validator.
const PALETTE = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CategorySpendChart({
  data,
  currency,
}: {
  data: CategorySpendRow[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay gastos categorizados este año. Registra transacciones con
        categoría para ver este reporte.
      </p>
    );
  }

  // Cap to top 8 categories (matches the 8-slot palette) and fold the
  // rest into "Otros" per the skill's guidance — never generate a 9th hue.
  const top = data.slice(0, 8);
  const rest = data.slice(8);
  const restTotal = rest.reduce((sum, r) => sum + r.total, 0);
  const chartData =
    restTotal > 0
      ? [...top, { categoryId: "other", categoryName: "Otros", color: null, icon: null, total: restTotal }]
      : top;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
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
          <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((entry, i) => (
              <Cell
                key={entry.categoryId}
                fill={entry.color ?? PALETTE[i % PALETTE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
