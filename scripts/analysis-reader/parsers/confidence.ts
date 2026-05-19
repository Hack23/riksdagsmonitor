/**
 * @module analysis-reader/parsers/confidence
 * @description Normalize free-form strings to a `ConfidenceLabel`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ConfidenceLabel } from '../types.js';

/**
 * Normalize a string to a ConfidenceLabel.
 * Returns 'MEDIUM' as default when unrecognized.
 */
export function toConfidenceLabel(value: string): ConfidenceLabel {
  const upper = value.toUpperCase().trim();
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'LOW') return 'LOW';
  return 'MEDIUM';
}
