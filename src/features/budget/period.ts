/** First-of-month string ("YYYY-MM-01") for a given Date, defaulting to
 * the current month. Matches the normalize_period_month trigger in
 * 0004_budget.sql, which truncates whatever date is inserted anyway —
 * this just keeps client-side display consistent with what's stored.
 *
 * Pure — no "server-only" import — so both server code and client
 * components (e.g. the onboarding wizard) can use it directly. */
export function periodMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}
