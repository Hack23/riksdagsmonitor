/**
 * Tests for scripts/horizon-context.ts — long-horizon workflow context helpers.
 *
 * Asserts:
 *   - Registry loads and caches
 *   - `getArticleType` returns the right entry, throws on unknown
 *   - `daysToElection` is signed (negative past, positive future)
 *   - `activeCycleAnchor` flips at the next-cycle start
 *   - `weoVintage` correctly maps month → vintage
 *   - `sessionPhase` covers all four Riksmöte phases
 *   - `horizonContext` composes a coherent record
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  loadRegistry,
  getArticleType,
  daysToElection,
  activeCycleAnchor,
  weoVintage,
  sessionPhase,
  horizonContext,
} from '../scripts/horizon-context.js';

describe('horizon-context — registry loading', () => {
  it('loads and returns the registry', () => {
    const reg = loadRegistry();
    expect(reg.version).toMatch(/^\d+\.\d+/);
    expect(reg.types.length).toBeGreaterThanOrEqual(13);
  });

  it('caches the result (same reference on repeat call)', () => {
    const a = loadRegistry();
    const b = loadRegistry();
    expect(a).toBe(b);
  });
});

describe('horizon-context — getArticleType', () => {
  it('returns the canonical entry for week-ahead', () => {
    const t = getArticleType('week-ahead');
    expect(t.family).toBe('long-horizon-forecast');
    expect(t.horizonDays).toBe(7);
    expect(t.workflow).toBe('news-week-ahead.md');
  });

  it('returns election-cycle with correct multiplier', () => {
    const t = getArticleType('election-cycle');
    expect(t.tierCMultiplier).toBe(2.5);
    expect(t.electionCycleAnchor).toBe('both');
    expect(t.dispatchOnly).toBe(true);
  });

  it('throws on unknown id', () => {
    expect(() => getArticleType('not-a-real-type')).toThrow(/Unknown article type/);
  });
});

describe('horizon-context — daysToElection', () => {
  it('is positive for dates before 2026-09-13', () => {
    expect(daysToElection('2026-05-01')).toBeGreaterThan(0);
  });

  it('is negative for dates after 2026-09-13', () => {
    expect(daysToElection('2026-12-01')).toBeLessThan(0);
  });

  it('is zero on election day', () => {
    expect(daysToElection('2026-09-13')).toBe(0);
  });
});

describe('horizon-context — activeCycleAnchor', () => {
  it('returns current before 2026-09-13', () => {
    expect(activeCycleAnchor('2026-09-12')).toBe('current');
  });

  it('returns next on or after 2026-09-13', () => {
    expect(activeCycleAnchor('2026-09-13')).toBe('next');
    expect(activeCycleAnchor('2026-09-14')).toBe('next');
  });
});

describe('horizon-context — weoVintage', () => {
  it('Apr-YEAR for May–Oct of YEAR', () => {
    expect(weoVintage('2026-05-15')).toBe('Apr-2026');
    expect(weoVintage('2026-07-01')).toBe('Apr-2026');
    expect(weoVintage('2026-10-15')).toBe('Apr-2026');
  });

  it('Oct-YEAR for Nov–Dec of YEAR', () => {
    expect(weoVintage('2026-11-15')).toBe('Oct-2026');
    expect(weoVintage('2026-12-31')).toBe('Oct-2026');
  });

  it('Oct-YEAR-1 for Jan–Apr of YEAR', () => {
    expect(weoVintage('2026-01-15')).toBe('Oct-2025');
    expect(weoVintage('2026-04-30')).toBe('Oct-2025');
  });
});

describe('horizon-context — sessionPhase', () => {
  it('autumn covers Sep–early Dec', () => {
    expect(sessionPhase('2026-09-15')).toBe('autumn');
    expect(sessionPhase('2026-11-01')).toBe('autumn');
    expect(sessionPhase('2026-12-10')).toBe('autumn');
  });

  it('xmas-recess covers late Dec–Jan', () => {
    expect(sessionPhase('2026-12-25')).toBe('xmas-recess');
    expect(sessionPhase('2027-01-10')).toBe('xmas-recess');
  });

  it('spring covers Feb–early Jun', () => {
    expect(sessionPhase('2026-03-01')).toBe('spring');
    expect(sessionPhase('2026-05-15')).toBe('spring');
  });

  it('summer-recess covers late Jun–Aug', () => {
    expect(sessionPhase('2026-07-15')).toBe('summer-recess');
    expect(sessionPhase('2026-08-30')).toBe('summer-recess');
  });
});

describe('horizon-context — horizonContext composition', () => {
  it('composes a coherent record for year-ahead 2026-07-05 (typical run)', () => {
    const ctx = horizonContext('year-ahead', '2026-07-05');
    expect(ctx.articleType.id).toBe('year-ahead');
    expect(ctx.cycleAnchor).toBe('current');
    expect(ctx.daysToElection).toBeGreaterThan(0);
    expect(ctx.weoVintage).toBe('Apr-2026');
    expect(ctx.sessionPhase).toBe('summer-recess');
    expect(ctx.cycleRolloverActive).toBe(false);
  });

  it('flags cycleRolloverActive within ± 30 days of election', () => {
    const ctx = horizonContext('election-cycle', '2026-08-20');
    expect(ctx.cycleRolloverActive).toBe(true);
  });

  it('flags cycleRolloverActive outside ± 30 days as false', () => {
    const ctx = horizonContext('election-cycle', '2026-05-01');
    expect(ctx.cycleRolloverActive).toBe(false);
  });
});
