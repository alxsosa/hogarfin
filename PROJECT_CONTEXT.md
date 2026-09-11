# Oikos — Contexto del proyecto

App de finanzas familiares (Next.js + Supabase). Repo: `alxsosa/hogarfin` en GitHub. Producción: **https://oikossosa.vercel.app**

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript
- Supabase (Postgres + Auth) — proyecto cloud, no local (no hay Docker/Supabase CLI local corriendo)
- Tailwind v4 + shadcn/ui (Base UI bajo el capó, no Radix)
- pnpm

## Estado del diseño (sept 2026)
Rediseño completo aplicado: paleta "dollar green" (`#6cb585` primary, `#5a9b72` secondary), tipografía Playfair Display (headings, vía `next/font/google`, variable `--font-display`) + Montserrat/Geist (body). Sidebar verde oscuro (`#2a4a3f`/`#1f3a32`). Todas las páginas usan `PageHeader` y `StatCard` ([src/components/layout/](src/components/layout/)) para consistencia.

Tokens en [src/app/globals.css](src/app/globals.css). **No uses `@import url(...)` de Google Fonts en ese archivo** — Tailwind v4 lo rompe en producción (el import termina después de otras reglas en el CSS procesado). Usa `next/font/google` en `layout.tsx` en su lugar.

## Onboarding
Wizard de 6 pasos en [src/app/onboarding/](src/app/onboarding/): household → invite (opcional) → accounts (opcional) → income (opcional) → budget inicial (opcional) → done. Reutiliza server actions existentes, no duplica lógica. `createHousehold` ya NO hace `redirect()` — devuelve `{ id }` y el wizard navega client-side.

## Gap analysis vs plan de producto (feature completo)
El usuario compartió un plan extenso (multi-hogar, RLS, conciliación bancaria, cash flow forecast, deudas snowball/avalanche, reportes, reglas, import CSV, audit logs, etc.). Auditoría hecha contra código real:

**Sólido / existe:** multi-hogar + roles (OWNER/ADMIN/MEMBER/VIEWER), RLS en todas las tablas, cuentas completas, transacciones con splits y transfers (transferencias no cuentan como gasto), presupuesto, funds vs goals separados, patrimonio neto con snapshots históricos.

**Falta o incompleto (por prioridad):**
1. **Conciliación bancaria** — solo existe el campo `reconciled`, sin flujo/UI. Explícitamente pedida por el usuario como diferenciador.
2. **Cash Flow Forecast** (30/60/90 días con alertas de déficit) — no existe.
3. Deudas: campo `strategy` (snowball/avalanche) existe pero sin motor de cálculo de tiempo/intereses.
4. Reglas automáticas: solo `categorize` implementado de 6 acciones posibles en el schema.
5. Reportes: 4 de ~15 pedidos (categoría, ingreso vs gasto, presupuesto vs real, export).
6. Audit logs: tabla y RLS listos, nada escribe en ella activamente.
7. No existe: import CSV/Excel, notificaciones, modo demo, SaaS prep (subscriptions/plans).
8. **Descartado explícitamente por el usuario**: conexión bancaria (Plaid), i18n (queda solo en español/México).

## Bugs corregidos en esta sesión (no repetir)
- `DropdownMenuTrigger` con un `<Button>` hijo directo causa hydration error (`<button>` anidado). Usar `render={<Button>...}` (patrón Base UI), no children. Afectó `fund-card.tsx`, `goal-card.tsx`.
- `DropdownMenuLabel` (= `Menu.GroupLabel` en Base UI) requiere estar envuelto en `DropdownMenuGroup`, si no crashea al abrir el menú. Afectó `user-menu.tsx`.
- Módulos con `import "server-only"` (ej. `features/budget/data.ts`) no pueden ser importados desde client components — rompe `next build` en producción aunque funcione en dev. Si necesitas una función pura de un módulo server-only en el cliente, sácala a un archivo separado sin ese import (ver `features/budget/period.ts`).

## Notas de entorno
- Supabase Auth (cloud) tiene rate limit bajo de emails de confirmación (~pocos por hora en el tier actual) — si necesitas probar signup repetidamente, espaciar los intentos o usar Supabase Studio para crear usuarios de prueba directamente.
- Deploy: `npx vercel --prod` (proyecto ya vinculado, ver `.vercel/project.json`). Siempre hacer `git push` antes o junto con el deploy para mantener GitHub sincronizado.
- Dev server: `.claude/launch.json` ya configurado para `npm run dev` en puerto 3000 (usable con el Browser pane de Claude Code).
