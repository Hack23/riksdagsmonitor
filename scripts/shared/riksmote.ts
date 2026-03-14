/**
 * @module shared/riksmote
 * @description Shared riksmöte (parliamentary session) calculation utility.
 *
 * The Swedish parliamentary session runs September–August:
 * e.g. September 2025 → "2025/26", March 2026 → "2025/26".
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Calculate the Swedish riksmöte (parliamentary session) string for a given date.
 * The session runs September–August: month ≥ 8 (Sep) starts a new session.
 *
 * @param date - Date to calculate riksmöte for (defaults to current date)
 * @returns Riksmöte string in "YYYY/YY" format, e.g. "2025/26"
 */
export function getCurrentRiksmote(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based; September = 8
  const startYear = month >= 8 ? year : year - 1;
  const endYY = String(startYear + 1).slice(-2);
  return `${startYear}/${endYY}`;
}
