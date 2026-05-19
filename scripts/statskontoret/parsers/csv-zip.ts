/**
 * @module scripts/statskontoret/parsers/csv-zip
 * @description CSV-in-ZIP archive parser for Statskontoret CSV download bundles.
 *
 * Returns an entry-name → CSV-text map preserving original archive names so
 * downstream code can rely on Statskontoret's `Inkomst.csv` / `Utgift.csv`
 * naming convention.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import JSZip from 'jszip';

export async function parseStatskontoretCsvZip(
  input: ArrayBuffer | Uint8Array,
): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(input);
  const out: Record<string, string> = {};
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!/\.csv$/i.test(name)) continue;
    out[name] = await entry.async('string');
  }
  return out;
}
