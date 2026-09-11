import { NextResponse } from "next/server";
import { getUserHouseholds } from "@/features/households/data";
import { getTransactionsForExport } from "@/features/reports/data";

function csvEscape(value: string | number | null): string {
  if (value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Streams the active household's transaction history as CSV. Auth is
 * enforced the same way every other page in (app) is: proxy.ts redirects
 * unauthenticated requests to /login before this handler ever runs, and
 * getUserHouseholds() only returns households the caller actually
 * belongs to (RLS-scoped) — there is no separate household_id input to
 * trust, it's always "whatever this session's first household is". */
export async function GET() {
  const households = await getUserHouseholds();
  const active = households[0];

  if (!active) {
    return NextResponse.json({ error: "No perteneces a ningún hogar." }, { status: 404 });
  }

  const rows = await getTransactionsForExport(active.id);

  const header = [
    "Fecha",
    "Descripción",
    "Comercio",
    "Categoría",
    "Cuenta",
    "Tipo",
    "Monto",
    "Moneda",
    "Notas",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.date,
        csvEscape(r.description),
        csvEscape(r.merchant),
        csvEscape(r.category),
        csvEscape(r.account),
        r.type,
        r.amount,
        r.currency,
        csvEscape(r.notes),
      ].join(",")
    ),
  ];

  // Prepend a UTF-8 BOM so Excel on Windows renders acentos correctly
  // instead of mangling them as latin-1.
  const csv = "﻿" + lines.join("\n");
  const filename = `transacciones-${active.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
