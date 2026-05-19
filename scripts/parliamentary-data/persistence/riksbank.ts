/**
 * @module parliamentary-data/persistence/riksbank
 * @description Riksbank public web/JSON artifact persistence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { sanitizeDokId } from './shared/sanitize.js';
import { DATA_ROOT, ensureDir } from './shared/meta-sidecar.js';

/**
 * Persist Riksbank public web/JSON artifacts.
 *
 * Stored under `analysis/data/riksbank/{kind}.json`. Riksbank data is public
 * and unauthenticated; provenance sidecars record the source URL/kind and the
 * TypeScript CLI used to retrieve it.
 *
 * @param kind      - Logical artifact kind (e.g. 'repo-rate-path', 'minutes').
 * @param response  - Raw or normalized Riksbank payload.
 * @param dataRoot  - Override for the data root directory (for testing).
 * @returns Absolute path to the persisted data file.
 */
export function persistRiksbankData(
  kind: string,
  response: unknown,
  dataRoot: string = DATA_ROOT,
): string {
  const dir = path.join(dataRoot, 'riksbank');
  ensureDir(dir);

  const sanitized = sanitizeDokId(kind);
  const filename = `${sanitized}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const candidateUrl = typeof response === 'object' && response !== null && 'url' in response
    ? (response as { url?: unknown }).url
    : undefined;
  const sourceUrl = typeof candidateUrl === 'string' && candidateUrl.length > 0
    ? candidateUrl
    : undefined;
  const metaFilename = `${sanitized}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'riksbank-ts-client',
      kind,
      ...(sourceUrl ? { url: sourceUrl } : {}),
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}
