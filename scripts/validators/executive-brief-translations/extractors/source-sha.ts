/**
 * @module scripts/validators/executive-brief-translations/extractors/source-sha
 * @description Extract the trailing `<!-- source-sha: <40-hex> -->`
 *              marker and detect the RTL marker for ar/he translations.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              195–204. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Extract the trailing `<!-- source-sha: <40-hex> -->` marker, or null if missing/malformed. */
export function extractSourceShaMarker(md: string): string | null {
  const match = md.match(/(?:^|\n)\s*<!--\s*source-sha:\s*([0-9a-f]{40})\s*-->\s*$/i);
  return match?.[1] ?? null;
}

/** True if the file begins with an RTL marker (allowing optional YAML / blank lines before it). */
export function hasRtlMarker(md: string): boolean {
  return /<!--\s*dir:\s*rtl\s*-->/i.test(md.slice(0, 1024));
}
