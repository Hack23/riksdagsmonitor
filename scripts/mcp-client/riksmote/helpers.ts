/**
 * @module mcp-client/riksmote/helpers
 * @description Riksmöte (Swedish parliamentary year) helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Compute the immediately preceding riksmöte label from `YYYY/YY` input.
 *
 * Returns `null` when the input is not a valid riksmöte token.
 */
export function previousRiksmote(rm: string): string | null {
  const match = /^(\d{4})\/(\d{2})$/.exec(rm.trim());
  if (!match) return null;
  const startYear = Number.parseInt(match[1], 10) - 1;
  const endYear = Number.parseInt(match[1], 10);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  return `${startYear}/${String(endYear).slice(-2)}`;
}
