#!/usr/bin/env tsx
/**
 * @module scripts/imf-fetch
 * @description Thin CLI shim — entry point + re-export surface for the
 * bounded-context `scripts/imf-fetch/` modules.
 *
 * The implementation was split in the 2026-05 refactor
 * (Hack23/riksdagsmonitor#2580). This file keeps the stable
 * `tsx scripts/imf-fetch.ts <command>` entry point that all 14
 * `news-*.lock.yml` workflows invoke via `bash`, plus a `fetchWeoPayload`
 * + `classifyImfFetchError` re-export for `tests/imf-fetch-cli.test.ts`.
 *
 * ## Usage
 *
 *   tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 5
 *   tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU
 *   tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01"
 *   tsx scripts/imf-fetch.ts list-indicators
 *
 * ## Exit codes
 *
 *   0 — success (JSON written to stdout, optionally persisted)
 *   1 — runtime / network / validation error (human-readable message to stderr)
 *   2 — bad CLI arguments
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from './imf-fetch/cli.js';

// Public re-exports for tests + downstream callers.
export {
  fetchWeoPayload,
  WEO_FETCH_MAX_ATTEMPTS,
  type FetchWeoPayloadOptions,
  type FetchWeoPayloadDeps,
} from './imf-fetch/weo-pipeline.js';
export { classifyImfFetchError, EMPTY_DATAMAPPER_SERIES_CODE } from './imf-fetch/classifier.js';
export {
  createCliLogEvent,
  defaultCliLogger,
  type ImfCliLogEvent,
} from './imf-fetch/logger.js';

if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`imf-fetch: ${msg}\n`);
    process.exit(1);
  });
}
