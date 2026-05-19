/**
 * @module roll-forward-pirs/cli
 * @description CLI argument parsing and the `runMain` orchestrator that
 * ties together source discovery, validation, roll-forward, and emission.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { ANALYSIS_DIR, PIR_FILE, REPO_ROOT, VALID_CYCLES } from './constants.js';
import { emitRollforwardMd } from './emitter.js';
import { isLongHorizon } from './horizon.js';
import { rollForward } from './roll-forward.js';
import { findLatestSource } from './source-locator.js';
import type { CliArgs, CycleType, PirStatusFile, RunIO } from './types.js';
import { validateSource } from './validator.js';

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
