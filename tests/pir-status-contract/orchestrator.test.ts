/**
 * @module tests/pir-status-contract/orchestrator
 * @description Orchestrator spine — schema integrity, CLI runMain, find-
 * latest-source, analysis-gate contract, module export sanity. Split per
 * Hack23/riksdagsmonitor#2624 from `tests/pir-status-contract.test.ts`
 * (889 lines).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type PirStatusFile,
  findLatestSource,
  runMain,
} from '../../scripts/roll-forward-pirs';

import { validFixture, runMainSafe } from './_shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..', '..');

describe('schemas/pir-status.schema.json', () => {
  const schemaPath = resolve(repoRoot, 'schemas', 'pir-status.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Record<string, unknown>;

  it('schema file exists and is valid JSON', () => {
    expect(existsSync(schemaPath)).toBe(true);
    expect(typeof schema).toBe('object');
  });

  it('schema uses JSON Schema 2020-12', () => {
    expect(String(schema['$schema'])).toContain('2020-12');
  });

  it('schema $id is scoped to riksdagsmonitor.com', () => {
    expect(String(schema['$id'])).toContain('riksdagsmonitor.com');
  });

  it('schema requires mandatory top-level fields', () => {
    const required = (schema['required'] ?? []) as string[];
    for (const f of [
      'schema_version',
      'cycle',
      'date',
      'subfolder',
      'pirs',
      'generated_at',
    ]) {
      expect(required).toContain(f);
    }
  });

  it('schema defines pir_id pattern', () => {
    const defs = (schema['$defs'] ?? {}) as Record<string, unknown>;
    const pirEntry = (defs['pirEntry'] ?? {}) as Record<string, unknown>;
    const props = (pirEntry['properties'] ?? {}) as Record<string, { pattern?: string }>;
    expect(props['pir_id']?.pattern).toMatch(/PIR/);
  });

  it('schema lists all valid cycle types', () => {
    const props = (schema['properties'] ?? {}) as Record<string, { enum?: string[] }>;
    const cycleEnum = props['cycle']?.enum ?? [];
    for (const c of [
      'committeeReports',
      'propositions',
      'month-ahead',
      'week-ahead',
      'motions',
      'interpellations',
    ]) {
      expect(cycleEnum).toContain(c);
    }
  });

  it('top-level and pirEntry both enforce additionalProperties: false', () => {
    expect(schema['additionalProperties']).toBe(false);
    const defs = (schema['$defs'] ?? {}) as Record<string, { additionalProperties?: boolean }>;
    expect(defs['pirEntry']?.additionalProperties).toBe(false);
  });

  it('schema enforces conditional answer_summary via if/then/else', () => {
    const defs = (schema['$defs'] ?? {}) as Record<string, { allOf?: unknown[] }>;
    const allOf = defs['pirEntry']?.allOf ?? [];
    expect(Array.isArray(allOf)).toBe(true);
    expect(allOf.length).toBeGreaterThan(0);
    const conditional = allOf[0] as Record<string, unknown>;
    expect(conditional).toHaveProperty('if');
    expect(conditional).toHaveProperty('then');
    expect(conditional).toHaveProperty('else');
  });

  it('schema requires answer_summary to be non-empty when present', () => {
    const defs = (schema['$defs'] ?? {}) as Record<string, unknown>;
    const pirEntry = (defs['pirEntry'] ?? {}) as Record<string, unknown>;
    const props = (pirEntry['properties'] ?? {}) as Record<string, { minLength?: number }>;
    expect(props['answer_summary']?.minLength).toBe(1);
  });

  it('subfolder description acknowledges schema cannot enforce equality with cycle', () => {
    const props = (schema['properties'] ?? {}) as Record<string, { description?: string }>;
    expect(props['subfolder']?.description).toMatch(/not enforced|gate|writer/i);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Pure helper unit tests (direct import → full coverage)
// ---------------------------------------------------------------------------


describe('findLatestSource', () => {
  let tmpRoot: string;
  beforeEach(() => {
    tmpRoot = mkdtempSync(join(os.tmpdir(), 'pir-find-'));
  });
  afterEach(() => {
    if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('returns null when no source exists in lookback window', () => {
    const result = findLatestSource('month-ahead', '2026-04-27', 5, tmpRoot);
    expect(result).toBeNull();
  });

  it('finds nearest source within lookback', () => {
    const dir = join(tmpRoot, '2026-04-25', 'month-ahead');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'pir-status.json');
    writeFileSync(file, '{}');
    const result = findLatestSource('month-ahead', '2026-04-27', 5, tmpRoot);
    expect(result).toBe(file);
  });

  it('respects maxLookback limit', () => {
    const dir = join(tmpRoot, '2026-04-15', 'month-ahead');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'pir-status.json'), '{}');
    // Only 5 days lookback from 2026-04-27 (looks at 04-26..04-22) — not found.
    expect(findLatestSource('month-ahead', '2026-04-27', 5, tmpRoot)).toBeNull();
    // 30 days lookback finds it.
    expect(findLatestSource('month-ahead', '2026-04-27', 30, tmpRoot)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Section 5 — runMain (end-to-end via injected IO)
// ---------------------------------------------------------------------------


describe('runMain', () => {
  let tmpRoot: string;
  beforeEach(() => {
    tmpRoot = mkdtempSync(join(os.tmpdir(), 'pir-run-'));
  });
  afterEach(() => {
    if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('prints usage and exits 1 with no args', () => {
    const out = runMainSafe([]);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toMatch(/Usage:/);
  });

  it('exits 1 when --from source not found', () => {
    const out = runMainSafe([
      '--from',
      join(tmpRoot, 'no-such-dir'),
      '--to',
      join(tmpRoot, 'target'),
    ]);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toMatch(/Source not found/);
  });

  it('exits 1 when --to path cannot derive date/cycle', () => {
    const sourceDir = join(tmpRoot, 'src', 'pir-stuff');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'pir-status.json'),
      JSON.stringify(validFixture()),
    );
    const out = runMainSafe([
      '--from',
      sourceDir,
      '--to',
      join(tmpRoot, 'not', 'a', 'daily', 'path'),
    ]);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toMatch(/Cannot derive/);
  });

  it('exits 1 with unknown cycle', () => {
    const out = runMainSafe(['--date', '2026-04-27', '--cycle', 'unknown-cycle']);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toMatch(/Unknown cycle/);
  });

  it('exits 1 with invalid --max-lookback', () => {
    const out = runMainSafe([
      '--date',
      '2026-04-27',
      '--cycle',
      'month-ahead',
      '--max-lookback',
      '0',
    ]);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toMatch(/Argument error: --max-lookback must be a positive integer/);
  });

  it('exits 2 when source JSON is malformed', () => {
    const sourceDir = join(tmpRoot, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    const targetDir = join(tmpRoot, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(join(sourceDir, 'pir-status.json'), '{ broken json');
    const out = runMainSafe(['--from', sourceDir, '--to', targetDir]);
    expect(out.exitCode).toBe(2);
    expect(out.stderr).toMatch(/Failed to read source/);
  });

  it('exits 2 when source fails strict validation', () => {
    const sourceDir = join(tmpRoot, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    const targetDir = join(tmpRoot, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const bad = validFixture({
      pirs: [
        {
          pir_id: 'PIR-1',
          statement: 'A reasonably long statement here',
          status: 'open',
          confidence: 'EXTREME' as Confidence,
        },
      ],
    });
    writeFileSync(join(sourceDir, 'pir-status.json'), JSON.stringify(bad));
    const out = runMainSafe(['--from', sourceDir, '--to', targetDir]);
    expect(out.exitCode).toBe(2);
    expect(out.stderr).toMatch(/Schema validation error/);
  });

  it('writes target file successfully on happy path', () => {
    const sourceDir = join(tmpRoot, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    const targetDir = join(tmpRoot, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'pir-status.json'),
      JSON.stringify(validFixture(), null, 2),
    );

    const out = runMainSafe(['--from', sourceDir, '--to', targetDir], {
      now: () => new Date('2026-04-27T10:00:00Z'),
    });
    expect(out.exitCode).toBeNull(); // success → no exit() call
    expect(existsSync(join(targetDir, 'pir-status.json'))).toBe(true);

    const result = JSON.parse(
      readFileSync(join(targetDir, 'pir-status.json'), 'utf-8'),
    ) as PirStatusFile;
    expect(result.schema_version).toBe('1.0');
    expect(result.date).toBe('2026-04-27');
    expect(result.cycle).toBe('month-ahead');
    expect(result.subfolder).toBe('month-ahead');
    // Open PIR (PIR-1) confidence degraded HIGH → MEDIUM.
    expect(result.pirs.find((p) => p.pir_id === 'PIR-1')?.confidence).toBe('MEDIUM');
    // Answered PIR (PIR-2) preserved.
    expect(result.pirs.find((p) => p.pir_id === 'PIR-2')?.status).toBe('answered');
  });

  it('--dry-run writes JSON to stdout and does not create file', () => {
    const sourceDir = join(tmpRoot, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    const targetDir = join(tmpRoot, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'pir-status.json'),
      JSON.stringify(validFixture(), null, 2),
    );

    const out = runMainSafe(['--from', sourceDir, '--to', targetDir, '--dry-run']);
    expect(out.exitCode).toBeNull();
    expect(out.stdout).toContain('"schema_version": "1.0"');
    expect(existsSync(join(targetDir, 'pir-status.json'))).toBe(false);
  });

  it('creates target directory when missing', () => {
    const sourceDir = join(tmpRoot, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    const targetDir = join(tmpRoot, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'pir-status.json'),
      JSON.stringify(validFixture(), null, 2),
    );
    expect(existsSync(targetDir)).toBe(false);
    runMainSafe(['--from', sourceDir, '--to', targetDir]);
    expect(existsSync(join(targetDir, 'pir-status.json'))).toBe(true);
  });

  it('--date / --cycle resolves prior cycle within lookback window', () => {
    // We can't easily exercise the auto-discovery branch since it scans the
    // real ANALYSIS_DIR; ensure unknown cycle still routes through the args
    // branch deterministically.
    const out = runMainSafe(['--date', '2099-12-31', '--cycle', 'month-ahead']);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toMatch(/No previous pir-status\.json/);
  });
});

// ---------------------------------------------------------------------------
// Section 6 — Analysis-gate integration contract
// ---------------------------------------------------------------------------


describe('analysis-gate pir-status.json contract', () => {
  const gate = readFileSync(
    resolve(repoRoot, '.github', 'prompts', '05-analysis-gate.md'),
    'utf-8',
  );
  const guide = readFileSync(
    resolve(repoRoot, 'analysis', 'methodologies', 'ai-driven-analysis-guide.md'),
    'utf-8',
  );

  it('05-analysis-gate.md references pir-status.json', () => {
    expect(gate).toContain('pir-status.json');
  });
  it('05-analysis-gate.md references pir-status.schema.json', () => {
    expect(gate).toContain('pir-status.schema');
  });
  it('05-analysis-gate.md enforces subfolder === cycle invariant', () => {
    expect(gate).toMatch(/subfolder.*equal.*cycle|subfolder.*===.*cycle/);
  });
  it('05-analysis-gate.md enforces conditional answer_summary', () => {
    expect(gate).toMatch(/status.*answered.*answer_summary/);
  });
  it('05-analysis-gate.md keeps PIR and supplementary checks sequential', () => {
    expect(gate).toContain('# Check 9 — PIR status sidecar');
    // Check 10 is now "top-2 full-text availability" (added by --auto-full-text-top-n);
    // supplementary artifacts shifted to Check 11.
    expect(gate).toContain('# Check 10 — top-2 full-text availability');
    expect(gate).toContain('# Check 11 — supplementary artifacts');
  });
  it('ai-driven-analysis-guide.md references pir-status.json', () => {
    expect(guide).toContain('pir-status.json');
  });
  it('ai-driven-analysis-guide.md references roll-forward script', () => {
    expect(guide).toContain('roll-forward-pirs');
  });
  it('ai-driven-analysis-guide.md clarifies open vs preserved status semantics', () => {
    expect(guide).toMatch(/preserve their existing status|preserve.*status/i);
  });
});

// ---------------------------------------------------------------------------
// Section 7 — Module behavior sanity (CycleType / type exports)
// ---------------------------------------------------------------------------


describe('module export sanity', () => {
  it('CycleType values are usable in fixtures', () => {
    const cycles: CycleType[] = [
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
    ];
    expect(cycles).toHaveLength(10);
  });
});
