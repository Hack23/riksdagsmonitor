/**
 * @module parliamentary-data/helpers/business-days
 * @description Business-day arithmetic helpers used by the lookback fallback
 * when zero documents match the requested analysis date.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Maximum number of business days to look back when zero documents match the requested date. */
export const MAX_LOOKBACK_BUSINESS_DAYS = 5;

/**
 * Subtract a number of business days (Mon–Fri) from a YYYY-MM-DD date string.
 * Returns the resulting date in YYYY-MM-DD format.
 *
 * Fractional values are rounded down, and negative values are treated as 0.
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @param days    - Number of business days to subtract
 * @throws {RangeError} If `dateStr` is not a valid YYYY-MM-DD date string
 */
export function subtractBusinessDays(dateStr: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new RangeError(`subtractBusinessDays: invalid date string "${dateStr}" — expected YYYY-MM-DD`);
  }
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`subtractBusinessDays: "${dateStr}" is not a valid calendar date`);
  }
  let remaining = Math.max(0, Math.floor(days));
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      remaining--;
    }
  }
  return d.toISOString().slice(0, 10);
}
