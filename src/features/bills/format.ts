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

/**
 * Approximate monthly-equivalent cost for a recurring bill. This is a
 * simplification (calendar months vary in length, and weeks/biweeks don't
 * divide evenly into a month) using standard average-frequency factors:
 * weekly ≈ 4.33 occurrences/month, biweekly ≈ 2.17, yearly / 12. Custom
 * frequency has no fixed period, so it's excluded from monthly totals
 * entirely (callers should note this to the user).
 */
export function monthlyEquivalent(amount: number, frequency: string): number | null {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    case "custom":
    default:
      return null;
  }
}

/** Days between today (local, midnight) and a "YYYY-MM-DD" date string. */
export function daysUntil(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
