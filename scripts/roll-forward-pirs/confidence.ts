/**
 * @module roll-forward-pirs/confidence
 * @description Confidence-label degradation helper used when rolling open
 * PIRs forward into a new cycle.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { CONFIDENCE_ORDER } from './constants.js';
import type { Confidence } from './types.js';

/**
 * Degrade a confidence label one step toward `VERY LOW`.
 * Throws on unknown values rather than silently returning `VERY HIGH`.
 */
export function degrade(c: Confidence): Confidence {
  const idx = CONFIDENCE_ORDER.indexOf(c);
  if (idx === -1) {
    throw new Error(`Unknown confidence value: '${String(c)}'`);
  }
  if (idx >= CONFIDENCE_ORDER.length - 1) return 'VERY LOW';
  return CONFIDENCE_ORDER[idx + 1] as Confidence;
}
