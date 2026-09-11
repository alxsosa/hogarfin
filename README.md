# Oikos

Plataforma de finanzas del hogar — presupuesto, cuentas, transacciones,
deudas, metas, patrimonio y flujo de efectivo, diseñada desde cero como
multiusuario/multi-hogar (no un simple clon de EveryDollar). Ver
[docs/data-model.md](docs/data-model.md) para el modelo de datos completo
y [docs/env-setup.md](docs/env-setup.md) para conectar Supabase y la
lectura de tickets con IA.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Supabase (Postgres + Auth + RLS), vía integración de Vercel Marketplace
- Zod + React Hook Form
- Recharts
- Anthropic API (`@anthropic-ai/sdk`, Claude Haiku 4.5) para el escáner
  de tickets

## Desarrollo

```bash
pnpm install
pnpm dev
```

Antes de correr la app necesitas conectar Supabase y (para el escáner de
tickets) una `ANTHROPIC_API_KEY` — ver [docs/env-setup.md](docs/env-setup.md).

## Estado del proyecto

Todas las secciones del menú están implementadas y funcionando con datos
reales:

- **Auth y hogares** — registro/login, crear hogar, invitar miembros por
  correo (RPC segura), RLS exhaustivo vía `is_household_member()`
- **Cuentas** — bancos, tarjetas, efectivo, inversiones
- **Transacciones** — ingreso/gasto, categorías personalizables,
  transferencias excluidas de reportes, **escáner de tickets con IA**
  (foto → Claude extrae monto/comercio/fecha y sugiere categoría → tú
  confirmas)
- **Presupuesto** — estilo "cada peso asignado", calculado en vivo desde
  transacciones reales
- **Fondos y metas** — ahorro con propósito, aportaciones rápidas
- **Deudas** — seguimiento de saldo, interés, estrategia de pago
- **Facturas** — gastos recurrentes con recordatorio de vencimiento
- **Ingresos** — fuentes esperadas vs. recibido real
- **Patrimonio neto** — activos menos pasivos, con histórico mensual
  (snapshots automáticos + gráfica de evolución)
- **Reportes** — gastos por categoría, ingresos vs. gastos, presupuesto
  vs. real, exportar CSV
- **Reglas de categorización** — auto-asigna categoría a transacciones
  sin categoría manual

**Pendiente (documentado, no bloqueante):** reglas con acciones adicionales
(tag/flag/split), importación CSV/Excel, integración bancaria real
(deliberadamente fuera de alcance por ahora), notificaciones, conciliación
bancaria, SaaS/billing.

## Aplicar las migraciones

```bash
vercel link
vercel integration add supabase --yes
vercel env pull --yes
supabase link --project-ref <tu-proyecto>
supabase db push
```
