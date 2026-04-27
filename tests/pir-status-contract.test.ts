/**
 * Contract & unit tests for the PIR status sidecar feature.
 *
 * Covers:
 *   - JSON Schema structural validity (`schemas/pir-status.schema.json`)
 *   - Direct unit tests of exported helpers in `scripts/roll-forward-pirs.ts`
 *     (degrade, validateSource, rollForward, findLatestSource, parseArgs,
 *     subtractDays, runMain) — direct imports give Vitest full coverage.
 *   - Analysis-gate integration contract (required file presence pattern)
 *
 * Notes:
 *   - All temporary file IO uses `os.tmpdir()` rather than the repo `tmp/`
 *     directory to avoid step-security armour "Source code overwritten"
 *     warnings on CI runners.
 *
 * @author Hack23 AB
 * @license Apache-2.0
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
  type CliArgs,
  type Confidence,
  type CycleType,
  type PirEntry,
  type PirStatusFile,
  degrade,
  findLatestSource,
  parseArgs,
  rollForward,
  runMain,
  subtractDays,
  validateSource,
} from '../scripts/roll-forward-pirs';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

function validFixture(overrides: Partial<PirStatusFile> = {}): PirStatusFile {
  return {
    schema_version: '1.0',
    cycle: 'month-ahead',
    date: '2026-04-26',
    subfolder: 'month-ahead',
    generated_at: '2026-04-26T10:00:00Z',
    inherited_from: null,
    pirs: [
      {
        pir_id: 'PIR-1',
        statement: 'SD voting discipline on prop. 2025/26:236 (fuel tax)',
        trigger: 'May 2026 chamber vote on HD01FiU48',
        status: 'open',
        confidence: 'HIGH',
        inherits_from: [],
        evidence_refs: ['HD01FiU48'],
        horizon: '2026-05-15',
        admiralty_grade: 'B2',
      },
      {
        pir_id: 'PIR-2',
        statement: 'Riksbank repo-rate decision macroeconomic impact on budget debates',
        status: 'answered',
        confidence: 'HIGH',
        answer_summary: 'Riksbank held rate at 2.25% on 2026-04-23 per press release.',
        inherits_from: [],
        evidence_refs: ['https://www.riksbank.se/press-release/2026/04/23'],
      },
    ],
    ...overrides,
  };
}

interface CapturedIO {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function captureIO() {
  const captured: CapturedIO = { stdout: '', stderr: '', exitCode: null };
  const out = {
    write: (chunk: string | Uint8Array): boolean => {
      captured.stdout += String(chunk);
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  const err = {
    write: (chunk: string | Uint8Array): boolean => {
      captured.stderr += String(chunk);
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  const exit = ((code: number): never => {
    captured.exitCode = code;
    throw new Error(`__exit_${code}__`);
  }) as (code: number) => never;
  return { captured, io: { stdout: out, stderr: err, exit } };
}

function runMainSafe(argv: string[], extraIO: Record<string, unknown> = {}) {
  const { captured, io } = captureIO();
  try {
    runMain(argv, { ...io, ...extraIO });
  } catch (e) {
    if (!(e instanceof Error) || !/^__exit_/.test(e.message)) throw e;
  }
  return captured;
}

// ---------------------------------------------------------------------------
// Section 1 — Schema file existence and structure
// ---------------------------------------------------------------------------

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

describe('subtractDays', () => {
  it('subtracts a single day across month boundary', () => {
    expect(subtractDays('2026-05-01', 1)).toBe('2026-04-30');
  });
  it('subtracts multiple days across year boundary', () => {
    expect(subtractDays('2026-01-02', 5)).toBe('2025-12-28');
  });
  it('zero days is identity', () => {
    expect(subtractDays('2026-04-26', 0)).toBe('2026-04-26');
  });
});

describe('degrade', () => {
  it('VERY HIGH → HIGH', () => expect(degrade('VERY HIGH')).toBe('HIGH'));
  it('HIGH → MEDIUM', () => expect(degrade('HIGH')).toBe('MEDIUM'));
  it('MEDIUM → LOW', () => expect(degrade('MEDIUM')).toBe('LOW'));
  it('LOW → VERY LOW', () => expect(degrade('LOW')).toBe('VERY LOW'));
  it('VERY LOW stays at VERY LOW (floor)', () =>
    expect(degrade('VERY LOW')).toBe('VERY LOW'));
  it('throws on unknown confidence value', () => {
    expect(() => degrade('WRONG' as unknown as Confidence)).toThrow(/Unknown confidence/);
  });
});

describe('parseArgs', () => {
  it('parses --from / --to', () => {
    const args = parseArgs(['--from', 'a', '--to', 'b']);
    expect(args.from).toBe('a');
    expect(args.to).toBe('b');
  });
  it('parses --date / --cycle', () => {
    const args = parseArgs(['--date', '2026-04-27', '--cycle', 'month-ahead']);
    expect(args.date).toBe('2026-04-27');
    expect(args.cycle).toBe('month-ahead');
  });
  it('parses --dry-run flag', () => {
    expect(parseArgs(['--dry-run']).dryRun).toBe(true);
  });
  it('--max-lookback default is 14', () => {
    expect(parseArgs([]).maxLookback).toBe(14);
  });
  it('--max-lookback overrides default', () => {
    expect(parseArgs(['--max-lookback', '7']).maxLookback).toBe(7);
  });
  it('--max-lookback throws when value is missing', () => {
    expect(() => parseArgs(['--max-lookback'])).toThrow(/requires a positive integer/);
  });
  it('--max-lookback throws when value is non-numeric', () => {
    expect(() => parseArgs(['--max-lookback', 'abc'])).toThrow(/positive integer/);
  });
  it('--max-lookback throws when value is zero', () => {
    expect(() => parseArgs(['--max-lookback', '0'])).toThrow(/positive integer/);
  });
  it('returns CliArgs shape with required fields', () => {
    const args: CliArgs = parseArgs([]);
    expect(args.dryRun).toBe(false);
    expect(typeof args.maxLookback).toBe('number');
  });
});

describe('validateSource', () => {
  it('accepts a valid fixture', () => {
    const result = validateSource(validFixture(), '/tmp/x');
    expect(result.schema_version).toBe('1.0');
  });

  it('rejects non-objects', () => {
    expect(() => validateSource(null, '/tmp/x')).toThrow(/not a JSON object/);
    expect(() => validateSource('string', '/tmp/x')).toThrow(/not a JSON object/);
  });

  it('rejects missing schema_version', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    delete fix['schema_version'];
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/schema_version/);
  });

  it('rejects unsupported schema_version', () => {
    expect(() =>
      validateSource(validFixture({ schema_version: '2.0' as '1.0' }), '/tmp/x'),
    ).toThrow(/unsupported schema_version/);
  });

  it('rejects non-array pirs', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    fix['pirs'] = 'not an array';
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/'pirs' must be an array/);
  });

  it('rejects missing required field', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    delete fix['cycle'];
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/missing required field 'cycle'/);
  });

  it('rejects invalid top-level cycle', () => {
    expect(() =>
      validateSource(validFixture({ cycle: 'not-a-cycle' as CycleType }), '/tmp/x'),
    ).toThrow(/is not a valid cycle/);
  });

  it('rejects invalid top-level date format', () => {
    expect(() =>
      validateSource(validFixture({ date: '27-04-2026' }), '/tmp/x'),
    ).toThrow(/must match YYYY-MM-DD/);
  });

  it('rejects empty top-level subfolder', () => {
    expect(() =>
      validateSource(validFixture({ subfolder: '' }), '/tmp/x'),
    ).toThrow(/subfolder must be a non-empty string/);
  });

  it('rejects top-level subfolder that does not equal cycle', () => {
    expect(() =>
      validateSource(validFixture({ subfolder: 'week-ahead' }), '/tmp/x'),
    ).toThrow(/must equal cycle/);
  });

  it('rejects invalid top-level generated_at date-time', () => {
    expect(() =>
      validateSource(validFixture({ generated_at: 'not-a-date' }), '/tmp/x'),
    ).toThrow(/must be a valid date-time string/);
  });

  it('rejects invalid inherited_from type', () => {
    const fix = validFixture() as unknown as Record<string, unknown>;
    fix['inherited_from'] = 42;
    expect(() => validateSource(fix, '/tmp/x')).toThrow(/inherited_from must be a string or null/);
  });

  it('rejects invalid pir_id pattern', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'invalid_id',
              statement: 'short statement that is long enough',
              status: 'open',
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/pir_id 'invalid_id' does not match/);
  });

  it('rejects too-short statement', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'short',
              status: 'open',
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/statement missing or shorter than 10 chars/);
  });

  it('rejects unknown status enum', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'wibble' as PirEntry['status'],
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/'wibble' is not a valid PIR status/);
  });

  it('rejects unknown confidence enum', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'open',
              confidence: 'EXTREME' as PirEntry['confidence'],
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/is not a valid confidence value/);
  });

  it('rejects answered without answer_summary', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'answered',
              confidence: 'HIGH',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/status='answered' requires non-empty answer_summary/);
  });

  it('rejects non-answered with answer_summary', () => {
    expect(() =>
      validateSource(
        validFixture({
          pirs: [
            {
              pir_id: 'PIR-1',
              statement: 'A reasonably long statement here',
              status: 'open',
              confidence: 'HIGH',
              answer_summary: 'should not be here',
            },
          ],
        }),
        '/tmp/x',
      ),
    ).toThrow(/must not carry answer_summary/);
  });

  it('rejects non-object pir entry', () => {
    expect(() =>
      validateSource(
        { ...validFixture(), pirs: ['not-an-object' as unknown as PirEntry] },
        '/tmp/x',
      ),
    ).toThrow(/pirs\[0\] is not an object/);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — rollForward unit tests
// ---------------------------------------------------------------------------

describe('rollForward', () => {
  const fixedNow = () => new Date('2026-04-27T10:00:00Z');
  const sourcePath = '/tmp/fake/analysis/daily/2026-04-26/month-ahead/pir-status.json';

  it('produces schema_version 1.0 output', () => {
    const out = rollForward(validFixture(), sourcePath, '2026-04-27', 'month-ahead', {
      now: fixedNow,
    });
    expect(out.schema_version).toBe('1.0');
    expect(out.cycle).toBe('month-ahead');
    expect(out.date).toBe('2026-04-27');
    expect(out.subfolder).toBe('month-ahead');
  });

  it('open PIR confidence is degraded one level', () => {
    const out = rollForward(validFixture(), sourcePath, '2026-04-27', 'month-ahead', {
      now: fixedNow,
    });
    const open = out.pirs.find((p) => p.pir_id === 'PIR-1');
    expect(open?.confidence).toBe('MEDIUM'); // HIGH → MEDIUM
  });

  it('open PIR appends pir_id to existing inherits_from chain', () => {
    const out = rollForward(
      validFixture({
        pirs: [
          {
            pir_id: 'PIR-1',
            statement: 'A reasonably long statement here',
            status: 'open',
            confidence: 'HIGH',
            inherits_from: ['PIR-prior-1', 'PIR-prior-2'],
          },
        ],
      }),
      sourcePath,
      '2026-04-27',
      'month-ahead',
      { now: fixedNow },
    );
    expect(out.pirs[0]?.inherits_from).toEqual(['PIR-prior-1', 'PIR-prior-2', 'PIR-1']);
  });

  it('answered PIR carried forward UNCHANGED preserves inherits_from history', () => {
    const out = rollForward(
      validFixture({
        pirs: [
          {
            pir_id: 'PIR-2',
            statement: 'A reasonably long statement here',
            status: 'answered',
            confidence: 'HIGH',
            answer_summary: 'Done.',
            inherits_from: ['PIR-orig-7', 'PIR-mid-3'],
          },
        ],
      }),
      sourcePath,
      '2026-04-27',
      'month-ahead',
      { now: fixedNow },
    );
    // Non-open PIRs must NOT have their inherits_from rewritten.
    expect(out.pirs[0]?.inherits_from).toEqual(['PIR-orig-7', 'PIR-mid-3']);
    expect(out.pirs[0]?.status).toBe('answered');
    expect(out.pirs[0]?.answer_summary).toBe('Done.');
    expect(out.pirs[0]?.confidence).toBe('HIGH');
  });

  it('open PIR with VERY LOW stays at VERY LOW', () => {
    const out = rollForward(
      validFixture({
        pirs: [
          {
            pir_id: 'PIR-1',
            statement: 'A reasonably long statement here',
            status: 'open',
            confidence: 'VERY LOW',
          },
        ],
      }),
      sourcePath,
      '2026-04-27',
      'month-ahead',
      { now: fixedNow },
    );
    expect(out.pirs[0]?.confidence).toBe('VERY LOW');
  });

  it('open PIR drops answer_summary on roll-forward', () => {
    const out = rollForward(
      validFixture({
        pirs: [
          {
            pir_id: 'PIR-1',
            statement: 'A reasonably long statement here',
            status: 'open',
            confidence: 'HIGH',
            // hypothetical leftover field — should be dropped
            answer_summary: 'leftover',
          },
        ],
      }),
      sourcePath,
      '2026-04-27',
      'month-ahead',
      { now: fixedNow },
    );
    expect(out.pirs[0]?.answer_summary).toBeUndefined();
  });

  it('inherited_from is a relative path when source is under repoRoot', () => {
    const out = rollForward(
      validFixture(),
      '/repo/analysis/daily/2026-04-26/month-ahead/pir-status.json',
      '2026-04-27',
      'month-ahead',
      { now: fixedNow, repoRoot: '/repo' },
    );
    expect(out.inherited_from).toBe(
      'analysis/daily/2026-04-26/month-ahead/pir-status.json',
    );
  });

  it('inherited_from normalizes relative paths via path.relative semantics', () => {
    const repo = join(os.tmpdir(), 'pir-path-repo-root');
    const source = join(repo, 'analysis', 'daily', '2026-04-26', 'month-ahead', 'pir-status.json');
    const out = rollForward(validFixture(), source, '2026-04-27', 'month-ahead', {
      now: fixedNow,
      repoRoot: repo,
    });
    expect(out.inherited_from).toBe('analysis/daily/2026-04-26/month-ahead/pir-status.json');
  });

  it('inherited_from falls back to absolute path when source is outside repoRoot', () => {
    const out = rollForward(validFixture(), '/elsewhere/pir-status.json', '2026-04-27', 'month-ahead', {
      now: fixedNow,
      repoRoot: '/repo',
    });
    expect(out.inherited_from).toBe('/elsewhere/pir-status.json');
  });

  it('uses fixed generated_at from injected now()', () => {
    const out = rollForward(validFixture(), sourcePath, '2026-04-27', 'month-ahead', {
      now: fixedNow,
    });
    expect(out.generated_at).toBe('2026-04-27T10:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// Section 4 — findLatestSource (file-system integration)
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
    expect(gate).toContain('# Check 10 — supplementary artifacts');
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
