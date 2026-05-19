/**
 * @module roll-forward-pirs/constants
 * @description Path, validation, and horizon constants shared by every
 * roll-forward-pirs submodule. Re-exported via the legacy
 * `scripts/roll-forward-pirs.ts` shim for backwards compatibility.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Confidence, CycleType, PirStatus } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Repo root resolved relative to this module (one level above `scripts/`). */
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis', 'daily');
export const PIR_FILE = 'pir-status.json';

export const VALID_CYCLES = new Set<CycleType>([
  'committeeReports',
  'propositions',
  'motions',
  'interpellations',
  'evening-analysis',
  'realtime-pulse',
  'week-ahead',
  'month-ahead',
  'weekly-review',
  'monthly-review',
  'quarter-ahead',
  'year-ahead',
  'election-cycle',
]);

export const VALID_STATUSES = new Set<PirStatus>([
  'open',
  'answered',
  'superseded',
  'deferred',
  'cancelled',
]);

export const CONFIDENCE_ORDER: Confidence[] = [
  'VERY HIGH',
  'HIGH',
  'MEDIUM',
  'LOW',
  'VERY LOW',
];
export const VALID_CONFIDENCES = new Set<Confidence>(CONFIDENCE_ORDER);
export const PIR_ID_PATTERN = /^PIR-[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

/**
 * Horizon days for each cycle type. Values sourced from
 * `analysis/article-types.json` → `horizonBands`. All cycles are explicitly
 * listed so there is no silent fallback.
 */
export const CYCLE_HORIZON_DAYS: Record<CycleType, number> = {
  committeeReports: 7,
  propositions: 7,
  motions: 7,
  interpellations: 7,
  'evening-analysis': 3,
  'realtime-pulse': 3,
  'week-ahead': 7,
  'month-ahead': 30,
  'weekly-review': 7,
  'monthly-review': 30,
  'quarter-ahead': 90,
  'year-ahead': 365,
  'election-cycle': 1460,
};
