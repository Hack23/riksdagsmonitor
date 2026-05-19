/**
 * @module roll-forward-pirs/types
 * @description Type definitions for the roll-forward-pirs CLI. Extracted
 * from the monolithic `scripts/roll-forward-pirs.ts` so the shapes can be
 * imported without pulling in node:fs / path side-effects.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type PirStatus = 'open' | 'answered' | 'superseded' | 'deferred' | 'cancelled';
export type Confidence = 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
export type CycleType =
  | 'committeeReports'
  | 'propositions'
  | 'motions'
  | 'interpellations'
  | 'evening-analysis'
  | 'realtime-pulse'
  | 'week-ahead'
  | 'month-ahead'
  | 'weekly-review'
  | 'monthly-review'
  | 'quarter-ahead'
  | 'year-ahead'
  | 'election-cycle';

export interface PirEntry {
  pir_id: string;
  statement: string;
  trigger?: string;
  status: PirStatus;
  confidence: Confidence;
  answer_summary?: string;
  inherits_from?: string[];
  evidence_refs?: string[];
  horizon?: string;
  admiralty_grade?: string;
}

export interface PirStatusFile {
  schema_version: '1.0';
  cycle: CycleType;
  date: string;
  subfolder: string;
  generated_at: string;
  inherited_from?: string | null;
  pirs: PirEntry[];
}

export interface CliArgs {
  from?: string;
  to?: string;
  date?: string;
  cycle?: CycleType;
  dryRun: boolean;
  maxLookback: number;
  emitRollforwardMd: boolean;
}

export interface RunIO {
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
  cwd?: string;
  exit?: (code: number) => never;
  now?: () => Date;
}
