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
 * `findLatestSource`, `parseArgs`, `subtractDays`, `addDays`, `isLongHorizon`,
 * `emitRollforwardMd`, `runMain`. The CLI entry point only fires when this
 * file is invoked directly (see isMainModule guard at the bottom of the file).
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
  'quarter-ahead',
  'year-ahead',
  'election-cycle',
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

/** Add N calendar days to an ISO date string, returning YYYY-MM-DD. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
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
 * `schema_version`, `cycle`, `date`, `subfolder`, `generated_at`, optional
 * `inherited_from`, `pirs` array shape, and each PIR's `pir_id` pattern,
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
  for (const key of ['schema_version', 'cycle', 'date', 'subfolder', 'generated_at', 'pirs'] as const) {
    if (!(key in obj)) throw new Error(`${filePath}: missing required field '${key}'`);
  }
  if (obj['schema_version'] !== '1.0') {
    throw new Error(
      `${filePath}: unsupported schema_version '${String(obj['schema_version'])}'`,
    );
  }
  if (typeof obj['cycle'] !== 'string' || !VALID_CYCLES.has(obj['cycle'] as CycleType)) {
    throw new Error(`${filePath}: cycle '${String(obj['cycle'])}' is not a valid cycle`);
  }
  if (typeof obj['date'] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj['date'])) {
    throw new Error(`${filePath}: date '${String(obj['date'])}' must match YYYY-MM-DD`);
  }
  if (typeof obj['subfolder'] !== 'string' || obj['subfolder'].length === 0) {
    throw new Error(`${filePath}: subfolder must be a non-empty string`);
  }
  if (obj['subfolder'] !== obj['cycle']) {
    throw new Error(
      `${filePath}: subfolder '${String(obj['subfolder'])}' must equal cycle '${String(obj['cycle'])}'`,
    );
  }
  if (typeof obj['generated_at'] !== 'string' || Number.isNaN(Date.parse(obj['generated_at']))) {
    throw new Error(`${filePath}: generated_at '${String(obj['generated_at'])}' must be a valid date-time string`);
  }
  if (
    obj['inherited_from'] !== undefined &&
    obj['inherited_from'] !== null &&
    typeof obj['inherited_from'] !== 'string'
  ) {
    throw new Error(`${filePath}: inherited_from must be a string or null when present`);
  }
  if (!Array.isArray(obj['pirs'])) {
    throw new Error(`${filePath}: 'pirs' must be an array`);
  }
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
      return { ...p };
    }
    const { answer_summary: _dropped, ...rest } = p;
    void _dropped;
    return {
      ...rest,
      confidence: degrade(p.confidence),
      inherits_from: [...(p.inherits_from ?? []), p.pir_id],
    };
  });

  const relativeToRepo = path.relative(repoRoot, sourcePath);
  const relativeSourcePath =
    relativeToRepo &&
    !relativeToRepo.startsWith('..') &&
    !path.isAbsolute(relativeToRepo)
      ? relativeToRepo.split(path.sep).join('/')
      : sourcePath.split(path.sep).join('/');

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
// Horizon PIR roll-forward Markdown emission
// ---------------------------------------------------------------------------

/**
 * Horizon days for each cycle type. Values sourced from
 * `analysis/article-types.json` → `horizonBands`. All cycles are explicitly
 * listed so there is no silent fallback.
 */
const CYCLE_HORIZON_DAYS: Record<CycleType, number> = {
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
function determineOrigin(
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

/**
 * Render a `horizon-pir-rollforward.md` Markdown document from a rolled-forward
 * PIR status file. Groups PIRs by status and stamps each open PIR with an
 * obsolescence date calculated as `targetDate + horizonDays`.
 *
 * @param output - The rolled-forward PIR status file to render.
 * @param sourcePath - Path of the source file that produced `output`, used to
 *   compute repo-relative paths in the rendered Markdown.
 * @param targetDate - The roll-forward target date (YYYY-MM-DD), anchor for
 *   the obsolescence calculation.
 * @param options - Optional `repoRoot` override and the `sourcePirIds` Set
 *   identifying which PIRs were inherited from the source file (vs. newly
 *   created during this run).
 * @returns Markdown text for the `horizon-pir-rollforward.md` artifact.
 */
export function emitRollforwardMd(
  output: PirStatusFile,
  sourcePath: string,
  targetDate: string,
  options: { repoRoot?: string; sourcePirIds?: Set<string> } = {},
): string {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const horizonDays = CYCLE_HORIZON_DAYS[output.cycle];

  let predecessorFolder: string;
  if (output.inherited_from) {
    predecessorFolder = output.inherited_from.replace(/\/pir-status\.json$/, '');
    if (predecessorFolder.endsWith('/')) {
      predecessorFolder = predecessorFolder.slice(0, -1);
    }
  } else {
    const relSource = path.relative(repoRoot, sourcePath).split(path.sep).join('/');
    predecessorFolder = path.dirname(relSource);
  }

  const sourceDate = output.inherited_from
    ? (() => {
        const match = /(\d{4}-\d{2}-\d{2})/.exec(predecessorFolder);
        return match ? match[1] : 'unknown';
      })()
    : 'unknown';
  const daysSince =
    sourceDate !== 'unknown'
      ? Math.round(
          (new Date(`${targetDate}T12:00:00Z`).getTime() -
            new Date(`${sourceDate}T12:00:00Z`).getTime()) /
            86_400_000,
        )
      : 0;

  const lines: string[] = [];

  lines.push(`# 🔁 Horizon PIR Roll-Forward`);
  lines.push('');
  lines.push(`> Auto-generated by \`scripts/roll-forward-pirs.ts --emit-rollforward-md\``);
  lines.push(`> Cycle: **${output.cycle}** | Date: **${targetDate}**`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 1 — Predecessor Manifest');
  lines.push('');
  lines.push('```');
  lines.push(`Predecessor folder: ${predecessorFolder}/`);
  lines.push(`Days since predecessor: ${daysSince}`);
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 2 — PIR Genealogy Table');
  lines.push('');
  lines.push('| PIR ID | Status | Origin | Confidence | Obsolescence Date | Notes |');
  lines.push('|--------|--------|--------|------------|-------------------|-------|');

  for (const pir of output.pirs) {
    const origin = determineOrigin(pir, options.sourcePirIds, output);
    const obsolescenceDate =
      pir.status === 'open' ? addDays(targetDate, horizonDays) : '—';
    const notes =
      pir.status === 'open'
        ? `Confidence degraded on roll-forward`
        : `Status: ${pir.status}`;
    lines.push(
      `| ${pir.pir_id} | ${pir.status} | ${origin} | ${pir.confidence} | ${obsolescenceDate} | ${notes} |`,
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  const openPirs = output.pirs.filter((p) => p.status === 'open');
  lines.push('## 3 — Active PIRs (with obsolescence dates)');
  lines.push('');
  if (openPirs.length === 0) {
    lines.push('_No open PIRs carried forward._');
  } else {
    for (const pir of openPirs) {
      lines.push(`### ${pir.pir_id}`);
      lines.push(`- **Statement:** ${pir.statement}`);
      lines.push(`- **Confidence:** ${pir.confidence}`);
      lines.push(`- **Obsolescence date:** ${addDays(targetDate, horizonDays)}`);
      if (pir.inherits_from && pir.inherits_from.length > 0) {
        lines.push(`- **Inherits from:** ${pir.inherits_from.join(' → ')}`);
      }
      if (pir.evidence_refs && pir.evidence_refs.length > 0) {
        lines.push(`- **Evidence:** ${pir.evidence_refs.join(', ')}`);
      }
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  const archivedPirs = output.pirs.filter((p) => p.status !== 'open');
  lines.push('## 4 — Archived / Resolved PIRs');
  lines.push('');
  if (archivedPirs.length === 0) {
    lines.push('_No archived PIRs in this roll-forward._');
  } else {
    lines.push('| PIR ID | Status | Confidence | Notes |');
    lines.push('|--------|--------|------------|-------|');
    for (const pir of archivedPirs) {
      const notes = pir.answer_summary ? pir.answer_summary : '—';
      lines.push(`| ${pir.pir_id} | ${pir.status} | ${pir.confidence} | ${notes} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
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
  emitRollforwardMd: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, maxLookback: 14, emitRollforwardMd: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from') args.from = argv[++i];
    else if (arg === '--to') args.to = argv[++i];
    else if (arg === '--date') args.date = argv[++i];
    else if (arg === '--cycle') args.cycle = argv[++i] as CycleType;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--emit-rollforward-md') args.emitRollforwardMd = true;
    else if (arg === '--max-lookback') {
      const raw = argv[++i];
      if (!raw || raw.startsWith('--')) {
        throw new Error('--max-lookback requires a positive integer value');
      }
      const parsed = Number.parseInt(raw, 10);
      if (!/^[0-9]+$/.test(raw.trim()) || !Number.isFinite(parsed) || parsed < 1) {
        throw new Error(`--max-lookback must be a positive integer (received '${raw}')`);
      }
      args.maxLookback = parsed;
    }
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
  let args: CliArgs;
  try {
    args = parseArgs(argv);
  } catch (e) {
    err.write(`Argument error: ${String(e instanceof Error ? e.message : e)}\n`);
    exit(1);
    return;
  }

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

  if (args.emitRollforwardMd || isLongHorizon(targetCycle)) {
    const sourcePirIds = new Set(source.pirs.map((p) => p.pir_id));
    const md = emitRollforwardMd(output, sourcePath, targetDate, { sourcePirIds });
    const mdPath = path.join(targetDir, 'horizon-pir-rollforward.md');
    fs.writeFileSync(mdPath, md, 'utf-8');
    out.write(
      `📄 Emitted ${mdPath.replace(REPO_ROOT + path.sep, '')}\n`,
    );
  }
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
