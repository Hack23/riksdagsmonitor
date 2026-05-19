/**
 * @module roll-forward-pirs/horizon
 * @description Cycle-horizon helpers used to decide when to emit a
 * roll-forward Markdown artifact and to attribute PIR origins.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { CYCLE_HORIZON_DAYS } from './constants.js';
import type { CycleType, PirEntry, PirStatusFile } from './types.js';

/**
 * Determine whether a cycle qualifies for automatic roll-forward Markdown
 * emission. Returns true when the cycle has `horizonDays >= 90`.
 */
export function isLongHorizon(cycle: CycleType): boolean {
  return CYCLE_HORIZON_DAYS[cycle] >= 90;
}

/**
 * Determine whether a PIR was inherited from the source or created in this run.
 * Uses `sourcePirIds` (authoritative) when available, otherwise falls back to
 * `output.inherited_from` presence or the PIR's own `inherits_from` chain.
 */
export function determineOrigin(
  pir: PirEntry,
  sourcePirIds: Set<string> | undefined,
  output: PirStatusFile,
): 'inherited' | 'this run' {
  if (sourcePirIds) {
    return sourcePirIds.has(pir.pir_id) ? 'inherited' : 'this run';
  }
  if (output.inherited_from) {
    return 'inherited';
  }
  return pir.inherits_from && pir.inherits_from.length > 0 ? 'inherited' : 'this run';
}
