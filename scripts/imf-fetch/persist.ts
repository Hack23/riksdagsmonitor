/**
 * @module scripts/imf-fetch/persist
 * @description Provenance persistence for the `weo` subcommand.
 *
 * Routes through `persistIMFData` (parliamentary-data layer) which
 * writes the JSON payload + sidecar `.meta.json`. Never overwrites
 * cache-recovered payloads — that would defeat the >6mo vintage
 * discipline check.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { persistIMFData } from '../parliamentary-data/data-persistence.js';
import type { ImfDataPoint } from '../imf/types.js';

export function maybePersistWeoPayload(
  payload: Record<string, unknown>,
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): void {
  if (!booleans.has('persist')) {
    return;
  }
  // Never rewrite cached IMF artifacts when the payload was itself
  // recovered from cache fallback — that would overwrite the original
  // `fetchedAt` and defeat the >6-month vintage discipline check.
  if (payload['transport'] === 'cache') {
    return;
  }
  const dataPoints = Array.isArray(payload['dataPoints'])
    ? (payload['dataPoints'] as ImfDataPoint[])
    : [];
  const vintage = dataPoints.find((p) => p.projectionVintage)?.projectionVintage;
  persistIMFData(String(payload['indicator']), String(payload['country']), payload, {
    database: flags.get('database') ?? 'WEO',
    ...(vintage ? { projectionVintage: vintage } : {}),
  });
}
