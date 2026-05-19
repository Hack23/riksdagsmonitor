/**
 * @module parliamentary-data/persistence/world-bank
 * @description World Bank API response persistence (sidecar discipline).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { sanitizeDokId } from './shared/sanitize.js';
import { DATA_ROOT, ensureDir } from './shared/meta-sidecar.js';

/**
 * Persist World Bank API response data.
 * Stored under `analysis/data/worldbank/{sanitized-indicator}/{sanitized-country}.json`
 * where both segments are sanitized via `sanitizeDokId` (path traversal prevention).
 *
 * @param indicator  - World Bank indicator ID (e.g. 'NY.GDP.MKTP.CD')
 * @param country    - Country code (e.g. 'SWE')
 * @param response   - Raw API response data
 * @param dataRoot   - Override for the data root directory (for testing)
 */
export function persistWorldBankData(
  indicator: string,
  country: string,
  response: unknown,
  dataRoot: string = DATA_ROOT,
): string {
  const dir = path.join(dataRoot, 'worldbank', sanitizeDokId(indicator));
  ensureDir(dir);

  const filename = `${sanitizeDokId(country)}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const metaFilename = `${sanitizeDokId(country)}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'world-bank-api',
      indicator,
      country,
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}
