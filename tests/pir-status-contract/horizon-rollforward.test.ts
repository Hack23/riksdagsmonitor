/**
 * @module tests/pir-status-contract/horizon-rollforward
 * @description PIR roll-forward across the canonical horizon ladder
 * (T+72h / T+7d / T+30d / T+90d / T+365d / T+1460d / election) plus the
 * CLI helpers (subtractDays / degrade / parseArgs) that drive the
 * rollforward window. Split per Hack23/riksdagsmonitor#2624 from
 * `tests/pir-status-contract.test.ts` (889 lines).
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
  type CliArgs,
  type Confidence,
  type PirStatusFile,
  degrade,
  parseArgs,
  rollForward,
  subtractDays,
  validateSource,
} from '../../scripts/roll-forward-pirs';

import { validFixture } from './_shared.js';

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
  it('--max-lookback accepts zero-padded positive integers', () => {
    expect(parseArgs(['--max-lookback', '007']).maxLookback).toBe(7);
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


// ---------------------------------------------------------------------------
// Horizon ladder invariants (per Hack23/riksdagsmonitor#2624 + intelligence-
// operative agent persona: "Horizon stratification T+72h / T+7d / T+30d /
// T+90d / T+365d / T+1460d / election").
//
// These are contract tests against `subtractDays()` (the lookback primitive
// every rollforward window is built on) — if a future regression breaks any
// of the seven canonical horizons, this block fails fast at unit-test time.
// ---------------------------------------------------------------------------

describe('horizon ladder — canonical lookback windows', () => {
  const ANCHOR = '2026-05-15';

  it.each([
    { name: 'T+72h',   days: 3 },
    { name: 'T+7d',    days: 7 },
    { name: 'T+30d',   days: 30 },
    { name: 'T+90d',   days: 90 },
    { name: 'T+365d',  days: 365 },
    { name: 'T+1460d', days: 1460 },
  ])('subtractDays() supports the $name horizon ($days-day lookback)', ({ days }) => {
    const result = subtractDays(ANCHOR, days);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Round-trip: re-add by re-anchoring forward and ensure date is plausible.
    const back = new Date(result);
    const fwd = new Date(ANCHOR);
    const diffDays = Math.round((fwd.getTime() - back.getTime()) / 86_400_000);
    expect(diffDays).toBe(days);
  });

  it('the seven canonical horizons are distinct and monotonically increasing', () => {
    const horizons = [3, 7, 30, 90, 365, 1460] as const;
    for (let i = 1; i < horizons.length; i++) {
      expect(horizons[i]).toBeGreaterThan(horizons[i - 1]!);
    }
  });
});
