/**
 * @module parliamentary-data/persistence/statskontoret
 * @description Statskontoret open-data persistence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { sanitizeDokId } from './shared/sanitize.js';
import { DATA_ROOT, ensureDir } from './shared/meta-sidecar.js';

/**
 * Persist Statskontoret open-data responses and derived datasets.
 *
 * Stored under `analysis/data/statskontoret/{dataset}/{artifact}.json`.
 * Statskontoret data is public and unauthenticated; provenance sidecars record
 * the source dataset and the TypeScript client/CLI used to retrieve or derive
 * the artifact.
 *
 * @param dataset   - Statskontoret source key (e.g. 'myndighetsforteckning').
 * @param artifact  - Logical artifact name (e.g. 'downloads',
 *                    'headcount-by-department').
 * @param response  - Raw or derived Statskontoret payload.
 * @param dataRoot  - Override for the data root directory (for testing).
 * @returns Absolute path to the persisted data file.
 */
export function persistStatskontoretData(
  dataset: string,
  artifact: string,
  response: unknown,
  dataRoot: string = DATA_ROOT,
): string {
  const dir = path.join(dataRoot, 'statskontoret', sanitizeDokId(dataset));
  ensureDir(dir);

  const sanitizedArtifact = sanitizeDokId(artifact);
  const filename = `${sanitizedArtifact}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const metaFilename = `${sanitizedArtifact}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'statskontoret-ts-client',
      dataset,
      artifact,
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}
