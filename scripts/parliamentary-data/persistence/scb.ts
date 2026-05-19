/**
 * @module parliamentary-data/persistence/scb
 * @description Statistics Sweden (SCB) PxWeb table persistence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { sanitizeDokId } from './shared/sanitize.js';
import { DATA_ROOT, ensureDir } from './shared/meta-sidecar.js';

/**
 * Persist SCB (Statistics Sweden) table data.
 * Stored under `analysis/data/scb/{tableId}.json`
 *
 * @param tableId   - SCB table identifier (e.g. 'BE0101A')
 * @param response  - Raw SCB API response data
 * @param query     - Optional query parameters used for provenance
 * @param dataRoot  - Override for the data root directory (for testing)
 */
export function persistSCBData(
  tableId: string,
  response: unknown,
  query?: Record<string, unknown>,
  dataRoot: string = DATA_ROOT,
): string {
  const dir = path.join(dataRoot, 'scb');
  ensureDir(dir);

  const sanitized = sanitizeDokId(tableId);
  const filename = `${sanitized}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const metaFilename = `${sanitized}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'scb-pxweb',
      tableId,
      ...(query ? { query } : {}),
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}
