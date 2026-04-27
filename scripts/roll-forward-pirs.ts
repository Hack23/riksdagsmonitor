#!/usr/bin/env tsx
/**
 * @module roll-forward-pirs
 * @description Roll-forward PIR (Priority Intelligence Requirement) status
 * sidecars between analysis cycles.
 *
 * Reads `pir-status.json` from a previous analysis cycle and propagates all
 * open PIRs into the target cycle directory, creating a fresh `pir-status.json`
 * that inherits the `pir_id` chain. Answered, superseded, cancelled, and
 * deferred PIRs are carried forward with their status preserved so analysts
 * can see the full history.
 *
 * Usage:
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --from analysis/daily/2026-04-26/month-ahead \
 *     --to   analysis/daily/2026-04-27/month-ahead
 *
 *   # Auto-detect previous day:
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --date 2026-04-27 \
 *     --cycle month-ahead
 *
 *   # Dry-run (print JSON, do not write):
 *   npx tsx scripts/roll-forward-pirs.ts \
 *     --date 2026-04-27 --cycle month-ahead --dry-run
 *
 * Exit codes:
 *   0 — success (file written or dry-run)
 *   1 — no source found (non-fatal when source dir does not exist yet)
 *   2 — schema validation error in source file
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

type PirStatus = 'open' | 'answered' | 'superseded' | 'deferred' | 'cancelled';
type Confidence = 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
type CycleType =
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

interface PirEntry {
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

interface PirStatusFile {
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
const REPO_ROOT = path.resolve(__dirname, '..');
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Subtract N calendar days from an ISO date string, returning YYYY-MM-DD. */
function subtractDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Walk backwards up to `maxLookback` days to find the most recent
 * `pir-status.json` for the given cycle.
 */
function findLatestSource(
  cycle: string,
  beforeDate: string,
  maxLookback = 14,
): string | null {
  for (let i = 1; i <= maxLookback; i++) {
    const candidate = path.join(
      ANALYSIS_DIR,
      subtractDays(beforeDate, i),
      cycle,
      PIR_FILE,
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Basic structural validation — not a full JSON Schema validator. */
function validateSource(raw: unknown, filePath: string): PirStatusFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${filePath}: not a JSON object`);
  }
  const obj = raw as Record<string, unknown>;
  for (const key of ['schema_version', 'cycle', 'date', 'pirs'] as const) {
    if (!(key in obj)) throw new Error(`${filePath}: missing required field '${key}'`);
  }
  if (obj['schema_version'] !== '1.0') {
    throw new Error(`${filePath}: unsupported schema_version '${String(obj['schema_version'])}'`);
  }
  if (!Array.isArray(obj['pirs'])) {
    throw new Error(`${filePath}: 'pirs' must be an array`);
  }
  return obj as unknown as PirStatusFile;
}

/**
 * Build a rolled-forward PIR status file.
 *
 * Open PIRs are carried forward with confidence degraded by one level
 * (HIGH → MEDIUM, etc.) to signal that staleness must be addressed.
 * All other PIRs are preserved as-is so the history is visible.
 */
function rollForward(
  source: PirStatusFile,
  sourcePath: string,
  targetDate: string,
  targetCycle: CycleType,
): PirStatusFile {
  const CONFIDENCE_ORDER: Confidence[] = [
    'VERY HIGH',
    'HIGH',
    'MEDIUM',
    'LOW',
    'VERY LOW',
  ];

  const degrade = (c: Confidence): Confidence => {
    const idx = CONFIDENCE_ORDER.indexOf(c);
    return idx < CONFIDENCE_ORDER.length - 1
      ? (CONFIDENCE_ORDER[idx + 1] as Confidence)
      : 'VERY LOW';
  };

  const pirs: PirEntry[] = source.pirs.map((p) => {
    if (p.status !== 'open') {
      // Non-open PIRs are carried forward unchanged for history.
      return { ...p, inherits_from: [p.pir_id] };
    }
    // Destructure to explicitly drop answer_summary for open (carried-forward) PIRs.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { answer_summary: _dropped, ...rest } = p;
    return {
      ...rest,
      // Degrade confidence to signal this PIR needs fresh review.
      confidence: degrade(p.confidence),
      inherits_from: [...(p.inherits_from ?? []), p.pir_id],
    };
  });

  return {
    schema_version: '1.0',
    cycle: targetCycle,
    date: targetDate,
    subfolder: targetCycle,
    generated_at: new Date().toISOString(),
    inherited_from: sourcePath.replace(REPO_ROOT + path.sep, '').replace(/\\/g, '/'),
    pirs,
  };
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  from?: string;
  to?: string;
  date?: string;
  cycle?: CycleType;
  dryRun: boolean;
  maxLookback: number;
}

function parseArgs(argv: string[]): CliArgs {
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
// Main
// ---------------------------------------------------------------------------

async function main(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  let sourcePath: string;
  let targetDir: string;
  let targetDate: string;
  let targetCycle: CycleType;

  if (args.from && args.to) {
    // Explicit paths provided.
    sourcePath = path.isAbsolute(args.from)
      ? path.join(args.from, PIR_FILE)
      : path.join(REPO_ROOT, args.from, PIR_FILE);
    targetDir = path.isAbsolute(args.to)
      ? args.to
      : path.join(REPO_ROOT, args.to);

    if (!fs.existsSync(sourcePath)) {
      console.error(`Source not found: ${sourcePath}`);
      process.exit(1);
    }
    // Derive targetDate and targetCycle from `--to` path.
    const parts = targetDir.replace(/\\/g, '/').split('/');
    const dailyIdx = parts.indexOf('daily');
    const datePart = dailyIdx >= 0 && dailyIdx + 1 < parts.length ? (parts[dailyIdx + 1] ?? '') : '';
    const cyclePart = dailyIdx >= 0 && dailyIdx + 2 < parts.length ? (parts[dailyIdx + 2] ?? '') : '';
    targetDate = datePart;
    targetCycle = cyclePart as CycleType;
    if (!targetDate.match(/^\d{4}-\d{2}-\d{2}$/) || !VALID_CYCLES.has(targetCycle)) {
      console.error(`Cannot derive date/cycle from --to path: ${args.to}`);
      process.exit(1);
    }
  } else if (args.date && args.cycle) {
    if (!VALID_CYCLES.has(args.cycle)) {
      console.error(`Unknown cycle: ${args.cycle}. Valid: ${[...VALID_CYCLES].join(', ')}`);
      process.exit(1);
    }
    targetDate = args.date;
    targetCycle = args.cycle;
    targetDir = path.join(ANALYSIS_DIR, targetDate, targetCycle);

    const found = findLatestSource(targetCycle, targetDate, args.maxLookback);
    if (!found) {
      console.warn(
        `No previous pir-status.json found for cycle '${targetCycle}' within ${args.maxLookback} days before ${targetDate}. Exiting with code 1.`,
      );
      process.exit(1);
    }
    sourcePath = found;
  } else {
    console.error(
      'Usage:\n' +
        '  roll-forward-pirs --from <dir> --to <dir>\n' +
        '  roll-forward-pirs --date YYYY-MM-DD --cycle <cycle> [--dry-run] [--max-lookback N]',
    );
    process.exit(1);
  }

  // Read and validate source.
  let rawSource: unknown;
  try {
    rawSource = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to read source: ${String(err)}`);
    process.exit(2);
  }

  let source: PirStatusFile;
  try {
    source = validateSource(rawSource, sourcePath);
  } catch (err) {
    console.error(`Schema validation error: ${String(err)}`);
    process.exit(2);
  }

  // Build rolled-forward output.
  const output = rollForward(source, sourcePath, targetDate, targetCycle);

  const json = JSON.stringify(output, null, 2) + '\n';

  if (args.dryRun) {
    process.stdout.write(json);
    return;
  }

  // Write to target directory (create if needed).
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const targetPath = path.join(targetDir, PIR_FILE);
  fs.writeFileSync(targetPath, json, 'utf-8');

  console.log(
    `✅ Rolled forward ${source.pirs.filter((p) => p.status === 'open').length} open PIR(s) ` +
      `from ${sourcePath.replace(REPO_ROOT + path.sep, '')} → ${targetPath.replace(REPO_ROOT + path.sep, '')}`,
  );
}

main(process.argv.slice(2)).catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
