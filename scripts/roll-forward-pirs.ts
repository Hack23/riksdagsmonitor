#!/usr/bin/env tsx
/**
 * @module roll-forward-pirs
 * @description Roll-forward PIR (Priority Intelligence Requirement) status
 * sidecars between analysis cycles. Thin shim that re-exports the
 * implementation from `./roll-forward-pirs/` so existing callers
 * (`tests/pir-status-contract.test.ts`,
 * `tests/roll-forward-pirs.rollforward-md.test.ts`, and the
 * `npx tsx scripts/roll-forward-pirs.ts` CLI invocation) keep working.
 *
 * Usage:
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --from analysis/daily/2026-04-26/month-ahead \
 *     --to   analysis/daily/2026-04-27/month-ahead
 *
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --date 2026-04-27 --cycle month-ahead [--dry-run] [--max-lookback N]
 *
 * Exit codes:
 *   0 — success (file written or dry-run)
 *   1 — no source found, missing args, unknown cycle
 *   2 — schema validation error in source file
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export * from './roll-forward-pirs/types.js';
export {
  ANALYSIS_DIR,
  CONFIDENCE_ORDER,
  CYCLE_HORIZON_DAYS,
  PIR_FILE,
  PIR_ID_PATTERN,
  REPO_ROOT,
  VALID_CONFIDENCES,
  VALID_CYCLES,
  VALID_STATUSES,
} from './roll-forward-pirs/constants.js';
export { addDays, subtractDays } from './roll-forward-pirs/date-helpers.js';
export { degrade } from './roll-forward-pirs/confidence.js';
export { findLatestSource } from './roll-forward-pirs/source-locator.js';
export { validateSource } from './roll-forward-pirs/validator.js';
export { rollForward } from './roll-forward-pirs/roll-forward.js';
export { determineOrigin, isLongHorizon } from './roll-forward-pirs/horizon.js';
export { emitRollforwardMd } from './roll-forward-pirs/emitter.js';
export { parseArgs, runMain } from './roll-forward-pirs/cli.js';

import { runMain } from './roll-forward-pirs/cli.js';

// CLI guard — only run main() when invoked directly.
const isMainModule = (() => {
  try {
    const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
    const modulePath = fileURLToPath(import.meta.url);
    return invokedPath === modulePath;
  } catch {
    return false;
  }
})();

if (isMainModule) {
  try {
    runMain(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`Unexpected error: ${String(e)}\n`);
    process.exit(1);
  }
}
