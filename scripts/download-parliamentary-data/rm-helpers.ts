/**
 * @module download-parliamentary-data/rm-helpers
 * @description Pure date/riksmöte helpers extracted from the original
 * `scripts/download-parliamentary-data.ts`. No filesystem or network I/O.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** ISO week number (1–53) for a given date. */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Parse a YYYY-MM-DD string into a UTC Date, returning null if invalid. */
export function parseAndValidateIsoDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

/**
 * Derive a Swedish parliamentary session label (`YYYY/YY`) from a date string.
 * October–December → `N/N+1`, January–September → `N-1/N`. Falls back to
 * today when the input is unparseable.
 */
export function riksMoteFromDate(dateStr: string): string {
  const parsed = parseAndValidateIsoDate(dateStr) ?? new Date();
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  if (month >= 10) return `${year}/${String(year + 1).slice(-2)}`;
  return `${year - 1}/${String(year).slice(-2)}`;
}

/** Parse a `YYYY-WNN` ISO-week label into its parts, returning null on invalid input. */
export function parseIsoWeekLabel(label: string): { year: number; week: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(label);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

/** True iff `dateStr` (YYYY-MM-DD) falls inside the supplied `YYYY-WNN` ISO week. */
export function isDateInIsoWeek(dateStr: string, weekLabel: string): boolean {
  const parsedDate = parseAndValidateIsoDate(dateStr);
  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedDate || !parsedWeek) return false;

  const isoThursday = new Date(parsedDate);
  const dayNum = isoThursday.getUTCDay() || 7;
  isoThursday.setUTCDate(isoThursday.getUTCDate() + 4 - dayNum);
  const isoYear = isoThursday.getUTCFullYear();
  const isoWeek = isoWeekNumber(parsedDate);

  return isoYear === parsedWeek.year && isoWeek === parsedWeek.week;
}
