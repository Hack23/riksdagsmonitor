#!/usr/bin/env tsx
/**
 * @module roll-forward-pirs
 * @description Roll-forward PIR (Priority Intelligence Requirement) status
 * sidecars between analysis cycles.
 *
 * Reads `pir-status.json` from a previous analysis cycle and propagates all
 * open PIRs into the target cycle directory, creating a fresh `pir-status.json`
 * that inherits the `pir_id` chain. Answered, superseded, cancelled, and
 * deferred PIRs are carried forward unchanged (preserving their existing
 * `inherits_from` history) so analysts can see the full chain.
 *
 * Module exports (for unit testing): `degrade`, `validateSource`, `rollForward`,
 * `findLatestSource`, `parseArgs`, `subtractDays`, `runMain`. The CLI entry
 * point only fires when this file is invoked directly (see isMainModule guard
 * at the bottom of the file).
 *
 * Usage:
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --from analysis/daily/2026-04-26/month-ahead \
 *     --to   analysis/daily/2026-04-27/month-ahead
 *
 *   # Auto-detect previous cycle within 14 days:
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --date 2026-04-27 --cycle month-ahead
 *
 *   # Dry-run (print JSON, do not write):
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --date 2026-04-27 --cycle month-ahead --dry-run
 *
 * Exit codes:
 *   0 — success (file written or dry-run)
 *   1 — no source found, missing args, unknown cycle
 *   2 — schema validation error in source file (malformed JSON, unknown
 *       status/confidence enum, missing required field, bad pir_id)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types (inlined to keep the module self-contained)
// ---------------------------------------------------------------------------

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
  | 'monthly-review';

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis', 'daily');
const PIR_FILE = 'pir-status.json';

const VALID_CYCLES = new Set<CycleType>([
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
]);

const VALID_STATUSES = new Set<PirStatus>([
  'open',
  'answered',
  'superseded',
  'deferred',
  'cancelled',
]);

const CONFIDENCE_ORDER: Confidence[] = [
  'VERY HIGH',
  'HIGH',
  'MEDIUM',
  'LOW',
  'VERY LOW',
];
const VALID_CONFIDENCES = new Set<Confidence>(CONFIDENCE_ORDER);
const PIR_ID_PATTERN = /^PIR-[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/** Subtract N calendar days from an ISO date string, returning YYYY-MM-DD. */
export function subtractDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

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

/**
 * Walk backwards up to `maxLookback` days to find the most recent
 * `pir-status.json` for the given cycle.
 */
export function findLatestSource(
  cycle: string,
  beforeDate: string,
  maxLookback = 14,
  analysisDir: string = ANALYSIS_DIR,
): string | null {
  for (let i = 1; i <= maxLookback; i++) {
    const candidate = path.join(
      analysisDir,
      subtractDays(beforeDate, i),
      cycle,
      PIR_FILE,
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Strict structural + enum validation. Validates top-level required fields,
 * `schema_version`, `pirs` array shape, and each PIR's `pir_id` pattern,
 * `status`, and `confidence` enum membership. Does not call ajv to keep the
 * script dependency-free.
 *
 * @throws Error with descriptive message on any validation failure.
 */
export function validateSource(raw: unknown, filePath: string): PirStatusFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${filePath}: not a JSON object`);
  }
  const obj = raw as Record<string, unknown>;
  for (const key of ['schema_version', 'cycle', 'date', 'pirs'] as const) {
    if (!(key in obj)) throw new Error(`${filePath}: missing required field '${key}'`);
  }
  if (obj['schema_version'] !== '1.0') {
    throw new Error(
      `${filePath}: unsupported schema_version '${String(obj['schema_version'])}'`,
    );
  }
  if (!Array.isArray(obj['pirs'])) {
    throw new Error(`${filePath}: 'pirs' must be an array`);
  }
  // Strict per-entry validation.
  for (let i = 0; i < (obj['pirs'] as unknown[]).length; i++) {
    const p = (obj['pirs'] as unknown[])[i] as Record<string, unknown>;
    if (typeof p !== 'object' || p === null) {
      throw new Error(`${filePath}: pirs[${i}] is not an object`);
    }
    if (typeof p['pir_id'] !== 'string' || !PIR_ID_PATTERN.test(p['pir_id'])) {
      throw new Error(
        `${filePath}: pirs[${i}].pir_id '${String(p['pir_id'])}' does not match ${PIR_ID_PATTERN}`,
      );
    }
    if (typeof p['statement'] !== 'string' || p['statement'].length < 10) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}).statement missing or shorter than 10 chars`,
      );
    }
    if (!VALID_STATUSES.has(p['status'] as PirStatus)) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}).status '${String(p['status'])}' is not a valid PIR status`,
      );
    }
    if (!VALID_CONFIDENCES.has(p['confidence'] as Confidence)) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}).confidence '${String(p['confidence'])}' is not a valid confidence value`,
      );
    }
    if (p['status'] === 'answered') {
      if (typeof p['answer_summary'] !== 'string' || p['answer_summary'].length === 0) {
        throw new Error(
          `${filePath}: pirs[${i}] (${String(p['pir_id'])}) status='answered' requires non-empty answer_summary`,
        );
      }
    } else if (p['answer_summary'] !== undefined) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}) status='${String(p['status'])}' must not carry answer_summary`,
      );
    }
  }
  return obj as unknown as PirStatusFile;
}

/**
 * Build a rolled-forward PIR status file.
 *
 * - Open PIRs are carried forward with confidence degraded by one level
 *   (HIGH → MEDIUM, etc.) to signal that staleness must be addressed; the
 *   prior `pir_id` is appended to the existing `inherits_from` chain so
 *   inheritance is fully preserved.
 * - Non-open PIRs (answered, superseded, deferred, cancelled) are carried
 *   forward UNCHANGED — including any pre-existing `inherits_from` chain —
 *   so the historical lineage is never lost.
 */
export function rollForward(
  source: PirStatusFile,
  sourcePath: string,
  targetDate: string,
  targetCycle: CycleType,
  options: { now?: () => Date; repoRoot?: string } = {},
): PirStatusFile {
  const now = options.now ?? (() => new Date());
  const repoRoot = options.repoRoot ?? REPO_ROOT;

  const pirs: PirEntry[] = source.pirs.map((p) => {
    if (p.status !== 'open') {
      // Non-open PIRs are carried forward UNCHANGED so prior inherits_from
      // chains are preserved in full.
      return { ...p };
    }
    // Destructure to explicitly drop answer_summary for open (carried-forward) PIRs.
    // (An open PIR may have inherited an answer_summary if a workflow ever
    // re-opens it; clearing on roll-forward keeps the schema invariant.)
    const { answer_summary: _dropped, ...rest } = p;
    void _dropped;
    return {
      ...rest,
      // Degrade confidence to signal this PIR needs fresh review.
      confidence: degrade(p.confidence),
      // Append the prior pir_id to any existing inherits_from chain.
      inherits_from: [...(p.inherits_from ?? []), p.pir_id],
    };
  });

  const relativeSourcePath = sourcePath.startsWith(repoRoot + path.sep)
    ? sourcePath.slice(repoRoot.length + 1).replace(/\\/g, '/')
    : sourcePath.replace(/\\/g, '/');

  return {
    schema_version: '1.0',
    cycle: targetCycle,
    date: targetDate,
    subfolder: targetCycle,
    generated_at: now().toISOString(),
    inherited_from: relativeSourcePath,
    pirs,
  };
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

export interface CliArgs {
  from?: string;
  to?: string;
  date?: string;
  cycle?: CycleType;
  dryRun: boolean;
  maxLookback: number;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, maxLookback: 14 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from') args.from = argv[++i];
    else if (arg === '--to') args.to = argv[++i];
    else if (arg === '--date') args.date = argv[++i];
    else if (arg === '--cycle') args.cycle = argv[++i] as CycleType;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--max-lookback') args.maxLookback = parseInt(argv[++i] ?? '14', 10);
  }
  return args;
}

// ---------------------------------------------------------------------------
// Main (CLI entry point)
// ---------------------------------------------------------------------------

export interface RunIO {
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
  cwd?: string;
  exit?: (code: number) => never;
  now?: () => Date;
}

export function runMain(argv: string[], io: RunIO = {}): void {
  const out = io.stdout ?? process.stdout;
  const err = io.stderr ?? process.stderr;
  const exit = io.exit ?? ((c: number): never => process.exit(c));
  const args = parseArgs(argv);

  let sourcePath: string;
  let targetDir: string;
  let targetDate: string;
  let targetCycle: CycleType;

  if (args.from && args.to) {
    sourcePath = path.isAbsolute(args.from)
      ? path.join(args.from, PIR_FILE)
      : path.join(REPO_ROOT, args.from, PIR_FILE);
    targetDir = path.isAbsolute(args.to) ? args.to : path.join(REPO_ROOT, args.to);

    if (!fs.existsSync(sourcePath)) {
      err.write(`Source not found: ${sourcePath}\n`);
      exit(1);
      return;
    }
    // Derive targetDate and targetCycle from `--to` path (bounds-checked).
    const parts = targetDir.replace(/\\/g, '/').split('/');
    const dailyIdx = parts.indexOf('daily');
    const datePart = dailyIdx >= 0 && dailyIdx + 1 < parts.length ? (parts[dailyIdx + 1] ?? '') : '';
    const cyclePart = dailyIdx >= 0 && dailyIdx + 2 < parts.length ? (parts[dailyIdx + 2] ?? '') : '';
    targetDate = datePart;
    targetCycle = cyclePart as CycleType;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || !VALID_CYCLES.has(targetCycle)) {
      err.write(`Cannot derive date/cycle from --to path: ${args.to}\n`);
      exit(1);
      return;
    }
  } else if (args.date && args.cycle) {
    if (!VALID_CYCLES.has(args.cycle)) {
      err.write(`Unknown cycle: ${args.cycle}. Valid: ${[...VALID_CYCLES].join(', ')}\n`);
      exit(1);
      return;
    }
    targetDate = args.date;
    targetCycle = args.cycle;
    targetDir = path.join(ANALYSIS_DIR, targetDate, targetCycle);

    const found = findLatestSource(targetCycle, targetDate, args.maxLookback);
    if (!found) {
      err.write(
        `No previous pir-status.json found for cycle '${targetCycle}' within ${args.maxLookback} days before ${targetDate}. Exiting with code 1.\n`,
      );
      exit(1);
      return;
    }
    sourcePath = found;
  } else {
    err.write(
      'Usage:\n' +
        '  roll-forward-pirs --from <dir> --to <dir>\n' +
        '  roll-forward-pirs --date YYYY-MM-DD --cycle <cycle> [--dry-run] [--max-lookback N]\n',
    );
    exit(1);
    return;
  }

  // Read and validate source.
  let rawSource: unknown;
  try {
    rawSource = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  } catch (e) {
    err.write(`Failed to read source: ${String(e)}\n`);
    exit(2);
    return;
  }

  let source: PirStatusFile;
  try {
    source = validateSource(rawSource, sourcePath);
  } catch (e) {
    err.write(`Schema validation error: ${String(e)}\n`);
    exit(2);
    return;
  }

  const opts: { now?: () => Date } = {};
  if (io.now) opts.now = io.now;
  const output = rollForward(source, sourcePath, targetDate, targetCycle, opts);
  const json = JSON.stringify(output, null, 2) + '\n';

  if (args.dryRun) {
    out.write(json);
    return;
  }

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, PIR_FILE);
  fs.writeFileSync(targetPath, json, 'utf-8');

  out.write(
    `✅ Rolled forward ${source.pirs.filter((p) => p.status === 'open').length} open PIR(s) ` +
      `from ${sourcePath.replace(REPO_ROOT + path.sep, '')} → ${targetPath.replace(REPO_ROOT + path.sep, '')}\n`,
  );
}

// ---------------------------------------------------------------------------
// CLI guard — only run main() when invoked directly.
// ---------------------------------------------------------------------------

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
