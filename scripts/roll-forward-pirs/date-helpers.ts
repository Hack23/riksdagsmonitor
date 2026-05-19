/**
 * @module roll-forward-pirs/date-helpers
 * @description Pure UTC date arithmetic used to compute lookback windows
 * and obsolescence dates for rolled-forward PIRs.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Subtract N calendar days from an ISO date string, returning YYYY-MM-DD. */
export function subtractDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Add N calendar days to an ISO date string, returning YYYY-MM-DD. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
