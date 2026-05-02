/**
 * Tests for the horizon-pir-rollforward.md emission feature in
 * `scripts/roll-forward-pirs.ts`.
 *
 * Covers:
 *   - `addDays` helper
 *   - `isLongHorizon` classification
 *   - `emitRollforwardMd` output structure and obsolescence dates
 *   - `runMain` integration: auto-emit for long-horizon cycles
 *   - `--emit-rollforward-md` explicit flag
 *   - Idempotency (re-running produces identical output)
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
import { join } from 'node:path';

import {
  type PirStatusFile,
  addDays,
  emitRollforwardMd,
  isLongHorizon,
  rollForward,
  runMain,
} from '../scripts/roll-forward-pirs';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function validFixture(overrides: Partial<PirStatusFile> = {}): PirStatusFile {
  return {
    schema_version: '1.0',
    cycle: 'quarter-ahead',
    date: '2026-04-01',
    subfolder: 'quarter-ahead',
    generated_at: '2026-04-01T10:00:00Z',
    inherited_from: null,
    pirs: [
      {
        pir_id: 'PIR-1-coalition',
        statement: 'Coalition stability assessment for Q3 2026',
        trigger: 'Budget vote alignment check',
        status: 'open',
        confidence: 'HIGH',
        inherits_from: [],
        evidence_refs: ['HD01FiU48'],
        horizon: '2026-07-01',
        admiralty_grade: 'B2',
      },
      {
        pir_id: 'PIR-2-pension',
        statement: 'Pension reform trajectory — long-term fiscal impact',
        status: 'answered',
        confidence: 'HIGH',
        answer_summary: 'Resolved by SoU 2026:12 report publication.',
        inherits_from: ['PIR-2-pension-prev'],
        evidence_refs: ['SoU-2026-12'],
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
  } as NodeJS.WritableStream;
  const err = {
    write: (chunk: string | Uint8Array): boolean => {
      captured.stderr += String(chunk);
      return true;
    },
  } as NodeJS.WritableStream;
  const exit = (code: number): never => {
    captured.exitCode = code;
    throw new Error(`EXIT_${code}`);
  };
  return { captured, out, err, exit };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('addDays', () => {
  it('adds days to a date string', () => {
    expect(addDays('2026-04-01', 90)).toBe('2026-06-30');
  });

  it('handles year boundary', () => {
    expect(addDays('2026-12-01', 365)).toBe('2027-12-01');
  });

  it('adds 0 days returns same date', () => {
    expect(addDays('2026-05-15', 0)).toBe('2026-05-15');
  });
});

describe('isLongHorizon', () => {
  it('returns true for quarter-ahead', () => {
    expect(isLongHorizon('quarter-ahead')).toBe(true);
  });

  it('returns true for year-ahead', () => {
    expect(isLongHorizon('year-ahead')).toBe(true);
  });

  it('returns true for election-cycle', () => {
    expect(isLongHorizon('election-cycle')).toBe(true);
  });

  it('returns false for month-ahead', () => {
    expect(isLongHorizon('month-ahead')).toBe(false);
  });

  it('returns false for week-ahead', () => {
    expect(isLongHorizon('week-ahead')).toBe(false);
  });

  it('returns false for morning cycles', () => {
    expect(isLongHorizon('committeeReports')).toBe(false);
    expect(isLongHorizon('propositions')).toBe(false);
  });
});

describe('emitRollforwardMd', () => {
  const targetDate = '2026-05-01';
  const sourcePath = '/tmp/repo/analysis/daily/2026-04-01/quarter-ahead/pir-status.json';

  it('produces Markdown with correct header', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    expect(md).toContain('# 🔁 Horizon PIR Roll-Forward');
    expect(md).toContain('Cycle: **quarter-ahead**');
    expect(md).toContain('Date: **2026-05-01**');
  });

  it('includes predecessor manifest with days-since', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    expect(md).toContain('## 1 — Predecessor Manifest');
    expect(md).toContain('Predecessor folder: analysis/daily/2026-04-01/quarter-ahead/');
    expect(md).toContain('Days since predecessor: 30');
  });

  it('includes PIR genealogy table with correct columns', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    expect(md).toContain('## 2 — PIR Genealogy Table');
    expect(md).toContain('| PIR ID | Status | Origin | Confidence | Obsolescence Date | Notes |');
    expect(md).toContain('PIR-1-coalition');
    expect(md).toContain('PIR-2-pension');
  });

  it('stamps open PIRs with obsolescence date = targetDate + horizonDays', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    // quarter-ahead horizonDays = 90; 2026-05-01 + 90 = 2026-07-30
    const expectedObsolescence = addDays('2026-05-01', 90);
    expect(expectedObsolescence).toBe('2026-07-30');
    expect(md).toContain(expectedObsolescence);
  });

  it('marks non-open PIRs with "—" for obsolescence date', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    // Find the line with PIR-2-pension — it should have "—" for obsolescence
    const lines = md.split('\n');
    const pir2Line = lines.find((l) => l.includes('PIR-2-pension'));
    expect(pir2Line).toContain('| — |');
  });

  it('includes section 3 with active PIR details', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    expect(md).toContain('## 3 — Active PIRs (with obsolescence dates)');
    expect(md).toContain('### PIR-1-coalition');
    expect(md).toContain('- **Statement:** Coalition stability assessment');
    expect(md).toContain('- **Confidence:** MEDIUM'); // degraded from HIGH
    expect(md).toContain('- **Obsolescence date:** 2026-07-30');
  });

  it('includes section 4 with archived PIRs', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, sourcePath, targetDate, { repoRoot: '/tmp/repo' });

    expect(md).toContain('## 4 — Archived / Resolved PIRs');
    expect(md).toContain('PIR-2-pension');
    expect(md).toContain('answered');
  });

  it('uses 365 days for year-ahead cycle', () => {
    const fixture = validFixture({ cycle: 'year-ahead', subfolder: 'year-ahead' });
    const yearSourcePath = '/tmp/repo/analysis/daily/2026-01-01/year-ahead/pir-status.json';
    const output = rollForward(fixture, yearSourcePath, '2026-05-01', 'year-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const md = emitRollforwardMd(output, yearSourcePath, '2026-05-01', { repoRoot: '/tmp/repo' });

    // year-ahead horizonDays = 365; 2026-05-01 + 365 = 2027-05-01
    expect(md).toContain('2027-05-01');
  });

  it('derives predecessor from output.inherited_from (not path.relative)', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    // Even if sourcePath is outside repoRoot, output.inherited_from is used
    const md = emitRollforwardMd(output, '/some/other/path/pir-status.json', targetDate, {
      repoRoot: '/different/root',
    });
    // Should still use output.inherited_from, not the mismatched path
    expect(md).toContain('analysis/daily/2026-04-01/quarter-ahead');
    expect(md).not.toContain('..');
  });

  it('marks all PIRs as inherited when sourcePirIds contains them', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    const sourcePirIds = new Set(fixture.pirs.map((p) => p.pir_id));
    const md = emitRollforwardMd(output, sourcePath, targetDate, {
      repoRoot: '/tmp/repo',
      sourcePirIds,
    });
    // Only check lines in the genealogy table (Section 2) which has Origin column
    const allLines = md.split('\n');
    const genealogyStart = allLines.findIndex((l) => l.includes('## 2 — PIR Genealogy Table'));
    const genealogyEnd = allLines.findIndex((l, i) => i > genealogyStart && l.startsWith('---'));
    const genealogyLines = allLines
      .slice(genealogyStart, genealogyEnd)
      .filter((l) => l.startsWith('| PIR-'));
    for (const line of genealogyLines) {
      expect(line).toContain('inherited');
    }
  });

  it('marks new PIRs as "this run" when not in sourcePirIds', () => {
    const fixture = validFixture();
    const output = rollForward(fixture, sourcePath, targetDate, 'quarter-ahead', {
      now: () => new Date('2026-05-01T10:00:00Z'),
      repoRoot: '/tmp/repo',
    });
    // Add a new PIR to the output that wasn't in the source
    output.pirs.push({
      pir_id: 'PIR-NEW-test',
      statement: 'Newly created PIR',
      status: 'open',
      confidence: 'HIGH',
      inherits_from: [],
      evidence_refs: [],
    });
    const sourcePirIds = new Set(fixture.pirs.map((p) => p.pir_id));
    const md = emitRollforwardMd(output, sourcePath, targetDate, {
      repoRoot: '/tmp/repo',
      sourcePirIds,
    });
    const newLine = md.split('\n').find((l) => l.includes('PIR-NEW-test'));
    expect(newLine).toContain('this run');
  });
});

describe('runMain — rollforward-md integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(os.tmpdir(), 'pir-rf-md-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('auto-emits horizon-pir-rollforward.md for quarter-ahead cycle', () => {
    // Set up source in from directory
    const fromDir = join(tmpDir, 'analysis', 'daily', '2026-04-01', 'quarter-ahead');
    mkdirSync(fromDir, { recursive: true });
    writeFileSync(join(fromDir, 'pir-status.json'), JSON.stringify(validFixture()));

    const toDir = join(tmpDir, 'analysis', 'daily', '2026-05-01', 'quarter-ahead');

    const { captured, out, err, exit } = captureIO();
    runMain(['--from', fromDir, '--to', toDir], {
      stdout: out,
      stderr: err,
      exit,
      now: () => new Date('2026-05-01T10:00:00Z'),
    });

    // pir-status.json should exist
    expect(existsSync(join(toDir, 'pir-status.json'))).toBe(true);
    // horizon-pir-rollforward.md should be auto-emitted
    expect(existsSync(join(toDir, 'horizon-pir-rollforward.md'))).toBe(true);

    const md = readFileSync(join(toDir, 'horizon-pir-rollforward.md'), 'utf-8');
    expect(md).toContain('# 🔁 Horizon PIR Roll-Forward');
    expect(md).toContain('quarter-ahead');
    expect(captured.stdout).toContain('📄 Emitted');
  });

  it('does NOT auto-emit for month-ahead cycle (horizonDays < 90)', () => {
    const fixture = validFixture({ cycle: 'month-ahead', subfolder: 'month-ahead' });
    const fromDir = join(tmpDir, 'analysis', 'daily', '2026-04-01', 'month-ahead');
    mkdirSync(fromDir, { recursive: true });
    writeFileSync(join(fromDir, 'pir-status.json'), JSON.stringify(fixture));

    const toDir = join(tmpDir, 'analysis', 'daily', '2026-05-01', 'month-ahead');

    const { out, err, exit } = captureIO();
    runMain(['--from', fromDir, '--to', toDir], {
      stdout: out,
      stderr: err,
      exit,
      now: () => new Date('2026-05-01T10:00:00Z'),
    });

    expect(existsSync(join(toDir, 'pir-status.json'))).toBe(true);
    expect(existsSync(join(toDir, 'horizon-pir-rollforward.md'))).toBe(false);
  });

  it('emits when --emit-rollforward-md flag is used even for non-long-horizon', () => {
    const fixture = validFixture({ cycle: 'month-ahead', subfolder: 'month-ahead' });
    const fromDir = join(tmpDir, 'analysis', 'daily', '2026-04-01', 'month-ahead');
    mkdirSync(fromDir, { recursive: true });
    writeFileSync(join(fromDir, 'pir-status.json'), JSON.stringify(fixture));

    const toDir = join(tmpDir, 'analysis', 'daily', '2026-05-01', 'month-ahead');

    const { captured, out, err, exit } = captureIO();
    runMain(['--from', fromDir, '--to', toDir, '--emit-rollforward-md'], {
      stdout: out,
      stderr: err,
      exit,
      now: () => new Date('2026-05-01T10:00:00Z'),
    });

    expect(existsSync(join(toDir, 'horizon-pir-rollforward.md'))).toBe(true);
    expect(captured.stdout).toContain('📄 Emitted');
  });

  it('idempotency — re-running produces identical output', () => {
    const fromDir = join(tmpDir, 'analysis', 'daily', '2026-04-01', 'quarter-ahead');
    mkdirSync(fromDir, { recursive: true });
    writeFileSync(join(fromDir, 'pir-status.json'), JSON.stringify(validFixture()));

    const toDir = join(tmpDir, 'analysis', 'daily', '2026-05-01', 'quarter-ahead');
    const fixedNow = () => new Date('2026-05-01T10:00:00Z');

    // First run
    const io1 = captureIO();
    runMain(['--from', fromDir, '--to', toDir], {
      stdout: io1.out,
      stderr: io1.err,
      exit: io1.exit,
      now: fixedNow,
    });
    const md1 = readFileSync(join(toDir, 'horizon-pir-rollforward.md'), 'utf-8');

    // Second run (overwrite)
    const io2 = captureIO();
    runMain(['--from', fromDir, '--to', toDir], {
      stdout: io2.out,
      stderr: io2.err,
      exit: io2.exit,
      now: fixedNow,
    });
    const md2 = readFileSync(join(toDir, 'horizon-pir-rollforward.md'), 'utf-8');

    expect(md1).toBe(md2);
  });

  it('auto-emits for election-cycle', () => {
    const fixture = validFixture({
      cycle: 'election-cycle',
      subfolder: 'election-cycle',
    });
    const fromDir = join(tmpDir, 'analysis', 'daily', '2026-01-01', 'election-cycle');
    mkdirSync(fromDir, { recursive: true });
    writeFileSync(join(fromDir, 'pir-status.json'), JSON.stringify(fixture));

    const toDir = join(tmpDir, 'analysis', 'daily', '2026-05-01', 'election-cycle');

    const { out, err, exit } = captureIO();
    runMain(['--from', fromDir, '--to', toDir], {
      stdout: out,
      stderr: err,
      exit,
      now: () => new Date('2026-05-01T10:00:00Z'),
    });

    expect(existsSync(join(toDir, 'horizon-pir-rollforward.md'))).toBe(true);
    const md = readFileSync(join(toDir, 'horizon-pir-rollforward.md'), 'utf-8');
    expect(md).toContain('election-cycle');
    // election-cycle horizonDays = 1460; check the obsolescence date
    const expectedDate = addDays('2026-05-01', 1460);
    expect(md).toContain(expectedDate);
  });
});
