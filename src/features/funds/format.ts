export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string) {
  // Parse as local date (date-only strings from Postgres are "YYYY-MM-DD")
  // to avoid an off-by-one-day shift from UTC parsing.
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function progressPct(current: number, goal: number) {
  if (goal <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (current / goal) * 100));
}

/** Months remaining between now and a target date (min 1). */
export function monthsRemaining(targetDate: string) {
  const [year, month, day] = targetDate.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(1, months);
}

/** How much needs to be saved per month to hit a target by its date. */
export function neededMonthly(
  current: number,
  goal: number,
  targetDate: string
) {
  const remaining = goal - current;
  if (remaining <= 0) return 0;
  return remaining / monthsRemaining(targetDate);
}
