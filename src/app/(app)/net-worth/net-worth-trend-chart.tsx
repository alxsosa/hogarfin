"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { NetWorthSnapshotRow } from "@/features/net-worth/data";

// Slot 1 (blue) = patrimonio neto, slot 3 (aqua) = activos, slot 8 (red)
// = pasivos — fixed, never-cycled three-series assignment, same
// categorical palette used in Reportes.
const NET_WORTH_COLOR = "#2a78d6";
const ASSETS_COLOR = "#1baf7a";
const LIABILITIES_COLOR = "#e34948";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthLabel(dateStr: string) {
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
    year: "2-digit",
  });
}

export function NetWorthTrendChart({
  data,
  currency,
}: {
  data: NetWorthSnapshotRow[];
  currency: string;
}) {
  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {data.length === 0
          ? "Aún no hay historial. Guarda tu primer snapshot para empezar a ver la evolución de tu patrimonio."
          : "Necesitas al menos dos snapshots para ver una tendencia. Vuelve el próximo mes o guarda uno manualmente."}
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: monthLabel(d.snapshotDate),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
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
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) =>
              value === "netWorth"
                ? "Patrimonio neto"
                : value === "assetsTotal"
                  ? "Activos"
                  : "Pasivos"
            }
          />
          <Line
            type="monotone"
            dataKey="assetsTotal"
            name="assetsTotal"
            stroke={ASSETS_COLOR}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="liabilitiesTotal"
            name="liabilitiesTotal"
            stroke={LIABILITIES_COLOR}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            name="netWorth"
            stroke={NET_WORTH_COLOR}
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
