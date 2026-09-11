# HogarFin

Plataforma de finanzas del hogar — presupuesto, cuentas, transacciones,
deudas, metas, patrimonio y flujo de efectivo, diseñada desde cero como
multiusuario/multi-hogar (no un simple clon de EveryDollar). Ver
[docs/data-model.md](docs/data-model.md) para el modelo de datos completo
y [docs/env-setup.md](docs/env-setup.md) para conectar Supabase.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Supabase (Postgres + Auth + RLS), vía integración de Vercel Marketplace
- Zod + React Hook Form
- Recharts, Zustand / TanStack Query

## Desarrollo

```bash
pnpm install
pnpm dev
```

Antes de correr la app necesitas conectar Supabase — ver
[docs/env-setup.md](docs/env-setup.md).

## Estado del proyecto

**Fase 1 — Arquitectura, auth, hogares (✅ implementada):**
- Registro/login (Supabase Auth)
- Crear hogar, ver hogares propios
- Invitar miembros por correo, aceptar invitación (RPC segura)
- RLS exhaustivo: cada tabla con `household_id` está aislada por
  membresía, vía el helper `is_household_member()` en
  `supabase/migrations/0001_profiles_households.sql`

**Fase 2 — Cuentas, transacciones, categorías (schema ✅, UI pendiente):**
- Migraciones `0002_accounts_categories.sql`, `0003_transactions.sql`
- Divide transacciones, transferencias (excluidas de reportes de
  ingreso/gasto), categorías personalizables (no hardcodeadas)

**Fase 3 — Presupuesto (schema ✅, UI pendiente):**
- `0004_budget.sql` — presupuesto mensual estilo "cada peso asignado",
  vistas `v_budget_vs_actual` y `v_budget_unassigned`

**Diseñado pero no implementado aún (Fases 5+):** fondos, metas, deudas,
facturas recurrentes, ingresos, flujo de efectivo proyectado, patrimonio
neto histórico, reportes, reglas de auto-categorización, importación
CSV/Excel, integración bancaria real, notificaciones, conciliación,
SaaS/billing. El schema para fondos/metas/deudas/facturas/reglas/auditoría
ya existe (`0005`–`0007`) para no tener que rediseñar tablas después.

## Aplicar las migraciones

```bash
vercel link
vercel integration add supabase --yes
vercel env pull --yes
supabase link --project-ref <tu-proyecto>
supabase db push
```
