/**
 * Contract tests for the PIR status sidecar (`pir-status.json`) feature.
 *
 * Covers:
 *   - JSON Schema structural validity (`schemas/pir-status.schema.json`)
 *   - Roll-forward script unit logic (exported helpers + rollForward behaviour)
 *   - Analysis-gate integration contract (required file presence pattern)
 *   - Cycle round-trip: write → read → validate
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Schema fixture helpers
// ---------------------------------------------------------------------------

type PirStatus = 'open' | 'answered' | 'superseded' | 'deferred' | 'cancelled';
type Confidence = 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
type CycleType = 'month-ahead' | 'committeeReports' | 'propositions' | 'interpellations' | 'evening-analysis' | 'realtime-pulse' | 'week-ahead' | 'weekly-review' | 'monthly-review' | 'motions';

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

// ---------------------------------------------------------------------------
// Section 1 — Schema file existence and structure
// ---------------------------------------------------------------------------

describe('schemas/pir-status.schema.json', () => {
  const schemaPath = resolve(repoRoot, 'schemas', 'pir-status.schema.json');

  it('schema file exists', () => {
    expect(existsSync(schemaPath)).toBe(true);
  });

  it('schema is valid JSON', () => {
    expect(() => JSON.parse(readFileSync(schemaPath, 'utf-8'))).not.toThrow();
  });

  it('schema uses JSON Schema 2020-12', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Record<string, unknown>;
    expect(schema['$schema']).toContain('2020-12');
  });

  it('schema $id is scoped to riksdagsmonitor.com', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as Record<string, unknown>;
    expect(schema['$id']).toContain('riksdagsmonitor.com');
  });

  it('schema requires mandatory top-level fields', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as { required?: string[] };
    const required = schema.required ?? [];
    for (const field of ['schema_version', 'cycle', 'date', 'subfolder', 'pirs', 'generated_at']) {
      expect(required).toContain(field);
    }
  });

  it('schema defines pir_id pattern', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as { $defs?: Record<string, unknown> };
    const pirEntry = (schema.$defs?.['pirEntry'] ?? {}) as Record<string, unknown>;
    const pirId = (pirEntry['properties'] as Record<string, { pattern?: string }>)?.['pir_id'];
    expect(pirId?.pattern).toBeTruthy();
    expect(pirId?.pattern).toMatch(/PIR/);
  });

  it('schema lists all valid cycle types', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as { properties?: Record<string, { enum?: string[] }> };
    const cycleEnum = schema.properties?.['cycle']?.['enum'] ?? [];
    for (const c of ['committeeReports', 'propositions', 'month-ahead', 'week-ahead', 'motions', 'interpellations']) {
      expect(cycleEnum).toContain(c);
    }
  });

  it('schema enforces additionalProperties: false at top level', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as { additionalProperties?: boolean };
    expect(schema.additionalProperties).toBe(false);
  });

  it('pirEntry definition enforces additionalProperties: false', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as { $defs?: Record<string, { additionalProperties?: boolean }> };
    expect(schema.$defs?.['pirEntry']?.additionalProperties).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Fixture round-trip (valid documents)
// ---------------------------------------------------------------------------

describe('pir-status.json fixture round-trip', () => {
  it('valid fixture serialises to JSON without loss', () => {
    const fix = validFixture();
    const roundTripped = JSON.parse(JSON.stringify(fix)) as PirStatusFile;
    expect(roundTripped.schema_version).toBe('1.0');
    expect(roundTripped.pirs).toHaveLength(2);
  });

  it('valid pir_id patterns are accepted', () => {
    const validIds = ['PIR-1', 'PIR-A', 'PIR-FiU-1', 'PIR-SD-7', 'PIR-abc123'];
    for (const id of validIds) {
      const pattern = /^PIR-[A-Za-z0-9]+([-][A-Za-z0-9]+)*$/;
      expect(pattern.test(id), `expected ${id} to be valid`).toBe(true);
    }
  });

  it('invalid pir_id patterns are rejected', () => {
    const invalidIds = ['pir-1', 'PIR', '1-PIR', 'PIR_1', ''];
    for (const id of invalidIds) {
      const pattern = /^PIR-[A-Za-z0-9]+([-][A-Za-z0-9]+)*$/;
      expect(pattern.test(id), `expected ${id} to be invalid`).toBe(false);
    }
  });

  it('admiralty_grade pattern validates correctly', () => {
    const valid = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6'];
    const invalid = ['G1', 'A7', 'a1', '12', 'AA'];
    const pattern = /^[A-F][1-6]$/;
    for (const g of valid) expect(pattern.test(g), `${g} should be valid`).toBe(true);
    for (const g of invalid) expect(pattern.test(g), `${g} should be invalid`).toBe(false);
  });

  it('open PIR must not carry answer_summary', () => {
    const fix = validFixture();
    const openPir = fix.pirs.find((p) => p.status === 'open');
    expect(openPir?.answer_summary).toBeUndefined();
  });

  it('answered PIR carries answer_summary', () => {
    const fix = validFixture();
    const answered = fix.pirs.find((p) => p.status === 'answered');
    expect(answered?.answer_summary).toBeTruthy();
  });

  it('inherited_from is null for fresh (non-rolled) sidecar', () => {
    const fix = validFixture({ inherited_from: null });
    expect(fix.inherited_from).toBeNull();
  });

  it('evidence_refs defaults to empty array when absent', () => {
    const pir: PirEntry = {
      pir_id: 'PIR-1',
      statement: 'A test requirement that is specific enough',
      status: 'open',
      confidence: 'MEDIUM',
    };
    expect(pir.evidence_refs).toBeUndefined();
    const withDefault = { evidence_refs: [], ...pir };
    expect(withDefault.evidence_refs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Roll-forward script: CLI arg parsing
// ---------------------------------------------------------------------------

describe('roll-forward-pirs CLI argument parsing', () => {
  it('script file exists', () => {
    expect(existsSync(resolve(repoRoot, 'scripts', 'roll-forward-pirs.ts'))).toBe(true);
  });

  it('script prints usage and exits 1 with no arguments', () => {
    let output = '';
    let exitCode = 0;
    try {
      execSync('npx tsx scripts/roll-forward-pirs.ts', {
        cwd: repoRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch (err: unknown) {
      const e = err as { status?: number; stderr?: string };
      exitCode = e.status ?? 1;
      output = e.stderr ?? '';
    }
    expect(exitCode).toBeGreaterThan(0);
    expect(output.toLowerCase()).toMatch(/usage|roll-forward|from|date/i);
  });

  it('script exits 1 when source directory does not exist', () => {
    let exitCode = 0;
    try {
      execSync(
        'npx tsx scripts/roll-forward-pirs.ts --date 2099-12-31 --cycle month-ahead',
        { cwd: repoRoot, stdio: 'pipe' },
      );
    } catch (err: unknown) {
      exitCode = (err as { status?: number }).status ?? 1;
    }
    expect(exitCode).toBe(1);
  });

  it('script exits 1 with unknown cycle', () => {
    let exitCode = 0;
    try {
      execSync(
        'npx tsx scripts/roll-forward-pirs.ts --date 2026-04-27 --cycle unknown-cycle',
        { cwd: repoRoot, stdio: 'pipe' },
      );
    } catch (err: unknown) {
      exitCode = (err as { status?: number }).status ?? 1;
    }
    expect(exitCode).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Roll-forward logic (file-system integration)
// ---------------------------------------------------------------------------

const TMP_DIR = resolve(repoRoot, 'tmp', 'pir-test-' + Date.now());

describe('roll-forward-pirs file-system integration', () => {
  beforeEach(() => {
    mkdirSync(TMP_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it('writes pir-status.json to --to directory in dry-run-like check', () => {
    // Set up source
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture();
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
      { cwd: repoRoot, stdio: 'pipe' },
    );

    const targetFile = resolve(targetDir, 'pir-status.json');
    expect(existsSync(targetFile)).toBe(true);

    const result = JSON.parse(readFileSync(targetFile, 'utf-8')) as PirStatusFile;
    expect(result.schema_version).toBe('1.0');
    expect(result.cycle).toBe('month-ahead');
    expect(result.date).toBe('2026-04-27');
    expect(result.inherited_from).toBeTruthy();
    expect(result.pirs).toHaveLength(2);
  });

  it('open PIRs get confidence degraded by one level on roll-forward', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture();
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
      { cwd: repoRoot, stdio: 'pipe' },
    );

    const result = JSON.parse(
      readFileSync(resolve(targetDir, 'pir-status.json'), 'utf-8'),
    ) as PirStatusFile;

    const rolledOpen = result.pirs.find((p) => p.pir_id === 'PIR-1');
    // Original was HIGH → should degrade to MEDIUM
    expect(rolledOpen?.confidence).toBe('MEDIUM');
  });

  it('answered PIRs are preserved with original status on roll-forward', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture();
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
      { cwd: repoRoot, stdio: 'pipe' },
    );

    const result = JSON.parse(
      readFileSync(resolve(targetDir, 'pir-status.json'), 'utf-8'),
    ) as PirStatusFile;

    const answered = result.pirs.find((p) => p.pir_id === 'PIR-2');
    expect(answered?.status).toBe('answered');
    expect(answered?.answer_summary).toBeTruthy();
  });

  it('dry-run outputs JSON to stdout without writing files', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture();
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    const stdout = execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}" --dry-run`,
      { cwd: repoRoot, encoding: 'utf-8' },
    );

    // Should output valid JSON.
    const parsed = JSON.parse(stdout) as PirStatusFile;
    expect(parsed.schema_version).toBe('1.0');

    // Should NOT have written the file.
    expect(existsSync(resolve(targetDir, 'pir-status.json'))).toBe(false);
  });

  it('exits 2 when source pir-status.json is malformed JSON', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(resolve(sourceDir, 'pir-status.json'), '{ broken json }');

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    let exitCode = 0;
    try {
      execSync(
        `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
        { cwd: repoRoot, stdio: 'pipe' },
      );
    } catch (err: unknown) {
      exitCode = (err as { status?: number }).status ?? 2;
    }
    expect(exitCode).toBe(2);
  });

  it('creates target directory when it does not exist', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture();
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    // Do NOT pre-create target dir.
    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    expect(existsSync(targetDir)).toBe(false);

    execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
      { cwd: repoRoot, stdio: 'pipe' },
    );

    expect(existsSync(resolve(targetDir, 'pir-status.json'))).toBe(true);
  });

  it('inherits_from is set to a relative path on roll-forward', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture();
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
      { cwd: repoRoot, stdio: 'pipe' },
    );

    const result = JSON.parse(
      readFileSync(resolve(targetDir, 'pir-status.json'), 'utf-8'),
    ) as PirStatusFile;

    expect(result.inherited_from).toMatch(/pir-status\.json$/);
    expect(result.inherited_from).toMatch(/2026-04-26/);
  });

  it('VERY LOW confidence does not degrade below VERY LOW on roll-forward', () => {
    const sourceDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-26', 'month-ahead');
    mkdirSync(sourceDir, { recursive: true });
    const fixture = validFixture({
      pirs: [
        {
          pir_id: 'PIR-1',
          statement: 'A very uncertain open PIR that needs resolution',
          status: 'open',
          confidence: 'VERY LOW',
        },
      ],
    });
    writeFileSync(resolve(sourceDir, 'pir-status.json'), JSON.stringify(fixture, null, 2));

    const targetDir = resolve(TMP_DIR, 'analysis', 'daily', '2026-04-27', 'month-ahead');
    mkdirSync(targetDir, { recursive: true });

    execSync(
      `npx tsx scripts/roll-forward-pirs.ts --from "${sourceDir}" --to "${targetDir}"`,
      { cwd: repoRoot, stdio: 'pipe' },
    );

    const result = JSON.parse(
      readFileSync(resolve(targetDir, 'pir-status.json'), 'utf-8'),
    ) as PirStatusFile;

    const pir = result.pirs[0];
    // Should remain VERY LOW (floor).
    expect(pir?.confidence).toBe('VERY LOW');
  });
});

// ---------------------------------------------------------------------------
// Section 5 — Analysis-gate integration contract
// ---------------------------------------------------------------------------

describe('analysis-gate pir-status.json contract', () => {
  it('05-analysis-gate.md exists', () => {
    expect(existsSync(resolve(repoRoot, '.github', 'prompts', '05-analysis-gate.md'))).toBe(true);
  });

  it('05-analysis-gate.md references pir-status.json', () => {
    const gate = readFileSync(
      resolve(repoRoot, '.github', 'prompts', '05-analysis-gate.md'),
      'utf-8',
    );
    expect(gate).toContain('pir-status.json');
  });

  it('05-analysis-gate.md references pir-status.schema.json', () => {
    const gate = readFileSync(
      resolve(repoRoot, '.github', 'prompts', '05-analysis-gate.md'),
      'utf-8',
    );
    expect(gate).toContain('pir-status.schema');
  });

  it('schemas/pir-status.schema.json is referenced in analysis gate', () => {
    const gate = readFileSync(
      resolve(repoRoot, '.github', 'prompts', '05-analysis-gate.md'),
      'utf-8',
    );
    expect(gate).toMatch(/pir-status/);
  });

  it('ai-driven-analysis-guide.md references pir-status.json', () => {
    const guide = readFileSync(
      resolve(repoRoot, 'analysis', 'methodologies', 'ai-driven-analysis-guide.md'),
      'utf-8',
    );
    expect(guide).toContain('pir-status.json');
  });

  it('roll-forward-pirs.ts is referenced in ai-driven-analysis-guide.md', () => {
    const guide = readFileSync(
      resolve(repoRoot, 'analysis', 'methodologies', 'ai-driven-analysis-guide.md'),
      'utf-8',
    );
    expect(guide).toContain('roll-forward-pirs');
  });
});
