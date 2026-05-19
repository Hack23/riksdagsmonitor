/**
 * @module parliamentary-data/persistence/imf
 * @description IMF (Datamapper / SDMX 3.0) response persistence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { sanitizeDokId } from './shared/sanitize.js';
import { DATA_ROOT, ensureDir } from './shared/meta-sidecar.js';

/**
 * Persist IMF API response data (Datamapper JSON or SDMX 3.0).
 *
 * Stored under `analysis/data/imf/{indicator}/{country}.json`, mirroring the
 * World Bank persistence layout. Introduced by the hybrid IMF integration
 * (Economic Data Contract v2.0, 2026-04). Supports all IMF providers:
 * Datamapper (WEO) and SDMX 3.0 (IFS/BOP/FM/GFS/DOTS/MFS), all accessed
 * through the pure-TypeScript client `scripts/imf-client.ts` (there is no
 * Python MCP / `uvx` runtime; agentic workflows invoke the `tsx
 * scripts/imf-fetch.ts` CLI via the `bash` tool).
 *
 * @param indicator  - IMF indicator code (e.g. 'NGDP_RPCH', 'GGXWDG_NGDP',
 *                     'PCPIPCH', 'LUR', 'FM_EXP_G01_GDP_PT').
 * @param country    - IMF AREA code (ISO3 for Datamapper; varies by dataset
 *                     per `scripts/imf-codes.ts`).
 * @param response   - Raw IMF response payload.
 * @param options    - Optional provenance (`database`, `projectionVintage`,
 *                     `dataRoot` override for testing).
 * @returns Absolute path to the persisted data file.
 */
export function persistIMFData(
  indicator: string,
  country: string,
  response: unknown,
  options: {
    database?: string;
    projectionVintage?: string;
    dataRoot?: string;
  } = {},
): string {
  const dataRoot = options.dataRoot ?? DATA_ROOT;
  const dir = path.join(dataRoot, 'imf', sanitizeDokId(indicator));
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
      mcpTool: 'imf-ts-client',
      indicator,
      country,
      ...(options.database ? { database: options.database } : {}),
      ...(options.projectionVintage ? { projectionVintage: options.projectionVintage } : {}),
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}
