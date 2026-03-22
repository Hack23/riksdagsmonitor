/**
 * Tests for scripts/ai-analysis/coalition-detector.ts
 *
 * Covers:
 * - Coalition tension detection from document sets
 * - Stress level classification (low, medium, high)
 * - Government vs opposition document counting
 * - Challenge ratio calculation
 * - Multi-language narrative generation
 * - Edge cases (empty docs, single doc, no opposition, no government)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { coalitionDetector } from '../scripts/ai-analysis/coalition-detector.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Test document factory
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST001',
    titel: 'Test document',
    title: 'Test document',
    doktyp: 'prop',
    datum: '2026-03-01',
    ...overrides,
  } as RawDocument;
}

// Document type presets
const PROP = makeDoc({ dok_id: 'PROP1', doktyp: 'prop' });
const PROP2 = makeDoc({ dok_id: 'PROP2', doktyp: 'prop' });
const SFS = makeDoc({ dok_id: 'SFS1', doktyp: 'sfs' });
const SKR = makeDoc({ dok_id: 'SKR1', doktyp: 'skr' });
const PRESSM = makeDoc({ dok_id: 'PR1', doktyp: 'pressm' });
const MOT = makeDoc({ dok_id: 'MOT1', doktyp: 'mot' });
const MOT2 = makeDoc({ dok_id: 'MOT2', doktyp: 'mot' });
const MOT3 = makeDoc({ dok_id: 'MOT3', doktyp: 'mot' });
const IP1 = makeDoc({ dok_id: 'IP1', doktyp: 'ip' });
const IP2 = makeDoc({ dok_id: 'IP2', doktyp: 'ip' });
const IP3 = makeDoc({ dok_id: 'IP3', doktyp: 'ip' });
const IP4 = makeDoc({ dok_id: 'IP4', doktyp: 'ip' });
const IP5 = makeDoc({ dok_id: 'IP5', doktyp: 'ip' });
const BET = makeDoc({ dok_id: 'BET1', doktyp: 'bet' });

// ===========================================================================
// Coalition tension detection
// ===========================================================================

describe('coalitionDetector.detect', () => {
  it('returns low stress for empty document set', () => {
    const result = coalitionDetector.detect([], 'en');
    expect(result.stressLevel).toBe('low');
    expect(result.governmentDocCount).toBe(0);
    expect(result.oppositionDocCount).toBe(0);
    expect(result.challengeRatio).toBe(0);
    expect(result.sourceDocIds).toHaveLength(0);
    expect(result.narrative).toBeTruthy();
  });

  it('returns low stress when government output dominates', () => {
    const docs = [PROP, PROP2, SFS, SKR, PRESSM, MOT];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.stressLevel).toBe('low');
    expect(result.governmentDocCount).toBe(5);
    expect(result.oppositionDocCount).toBe(1);
    expect(result.challengeRatio).toBeLessThan(0.3);
    expect(result.sourceDocIds).toHaveLength(6);
  });

  it('returns medium stress for significant opposition activity', () => {
    // 3 gov + 3 opp → challengeRatio = 3/6 = 0.5 → medium
    const docs = [PROP, PROP2, SKR, MOT, MOT2, IP1];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.stressLevel).toBe('medium');
    expect(result.oppositionDocCount).toBe(3);
    expect(result.challengeRatio).toBe(0.5);
  });

  it('returns high stress when opposition challenges outpace government', () => {
    const docs = [PROP, MOT, MOT2, MOT3, IP1, IP2, IP3, IP4];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.stressLevel).toBe('high');
    expect(result.challengeRatio).toBeGreaterThanOrEqual(0.6);
  });

  it('boosts stress to medium when ≥5 interpellations present', () => {
    // Government output strongly dominates but many interpellations present
    const docs = [
      // 12 government-aligned documents (unique dok_ids)
      PROP, PROP2, SFS, SKR, PRESSM,
      makeDoc({ dok_id: 'PROP3', doktyp: 'prop' }),
      makeDoc({ dok_id: 'PROP4', doktyp: 'prop' }),
      makeDoc({ dok_id: 'SFS2', doktyp: 'sfs' }),
      makeDoc({ dok_id: 'SKR2', doktyp: 'skr' }),
      makeDoc({ dok_id: 'PR2', doktyp: 'pressm' }),
      makeDoc({ dok_id: 'PROP5', doktyp: 'prop' }),
      makeDoc({ dok_id: 'PROP6', doktyp: 'prop' }),
      // 5 interpellations (opposition challenges)
      IP1, IP2, IP3, IP4, IP5,
    ];
    const result = coalitionDetector.detect(docs, 'en');
    // 5 opposition docs (IP) vs 12 government docs → challengeRatio = 5 / 17 ≈ 0.29 (< 0.3)
    // Baseline would be "low" stress, so "medium" here verifies the ≥5 IP boost rule.
    expect(result.stressLevel).toBe('medium');
    expect(result.oppositionDocCount).toBe(5);
    expect(result.challengeRatio).toBeLessThan(0.3);
  });

  it('boosts stress from medium to high when ≥5 interpellations present', () => {
    // 7 government docs + 5 IPs → ratio = 5/12 ≈ 0.42 → medium baseline
    // IP boost (≥5) pushes medium → high
    const docs = [
      PROP, PROP2, SFS, SKR, PRESSM,
      makeDoc({ dok_id: 'PROP3', doktyp: 'prop' }),
      makeDoc({ dok_id: 'PROP4', doktyp: 'prop' }),
      IP1, IP2, IP3, IP4, IP5,
    ];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.challengeRatio).toBeGreaterThanOrEqual(0.3);
    expect(result.challengeRatio).toBeLessThan(0.6);
    expect(result.stressLevel).toBe('high');
  });

  it('excludes committee reports from government/opposition counts', () => {
    const docs = [PROP, BET, BET, MOT];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.governmentDocCount).toBe(1);
    expect(result.oppositionDocCount).toBe(1);
    // Committee reports don't count in challenge ratio
    expect(result.challengeRatio).toBe(0.5);
  });

  it('handles all-opposition document set as high stress', () => {
    const docs = [MOT, MOT2, MOT3, IP1, IP2];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.stressLevel).toBe('high');
    expect(result.governmentDocCount).toBe(0);
    expect(result.oppositionDocCount).toBe(5);
    expect(result.challengeRatio).toBe(1);
  });

  it('handles all-government document set as low stress', () => {
    const docs = [PROP, PROP2, SFS, SKR, PRESSM];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.stressLevel).toBe('low');
    expect(result.governmentDocCount).toBe(5);
    expect(result.oppositionDocCount).toBe(0);
    expect(result.challengeRatio).toBe(0);
  });

  it('returns narrative in Swedish', () => {
    const docs = [PROP, MOT, MOT2, MOT3, IP1, IP2];
    const result = coalitionDetector.detect(docs, 'sv');
    expect(result.narrative).toContain('koalitionsspänning');
  });

  it('returns narrative in Japanese', () => {
    const result = coalitionDetector.detect([PROP, MOT], 'ja');
    expect(result.narrative).toContain('連立');
  });

  it('includes all document IDs as source evidence', () => {
    const docs = [PROP, MOT, IP1];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.sourceDocIds).toContain('PROP1');
    expect(result.sourceDocIds).toContain('MOT1');
    expect(result.sourceDocIds).toContain('IP1');
  });

  it('handles single government document', () => {
    const result = coalitionDetector.detect([PROP], 'en');
    expect(result.stressLevel).toBe('low');
    expect(result.governmentDocCount).toBe(1);
    expect(result.oppositionDocCount).toBe(0);
  });

  it('handles single opposition document', () => {
    const result = coalitionDetector.detect([MOT], 'en');
    expect(result.stressLevel).toBe('high');
    expect(result.oppositionDocCount).toBe(1);
    expect(result.challengeRatio).toBe(1);
  });

  it('handles only committee reports (no gov/opp classification)', () => {
    const docs = [BET, makeDoc({ dok_id: 'BET2', doktyp: 'bet' })];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.stressLevel).toBe('low');
    expect(result.governmentDocCount).toBe(0);
    expect(result.oppositionDocCount).toBe(0);
    expect(result.challengeRatio).toBe(0);
    expect(result.sourceDocIds).toHaveLength(2);
    // Neutral set should use the dedicated neutral narrative, not "government output dominates"
    expect(result.narrative).toContain('neutral');
    expect(result.narrative).not.toContain('government output dominates');
  });

  it('falls back to documentType when doktyp is missing', () => {
    const docWithDocumentType = makeDoc({
      dok_id: 'DT1',
      doktyp: undefined,
      documentType: 'mot',
    });
    const docs = [PROP, docWithDocumentType];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.governmentDocCount).toBe(1);
    expect(result.oppositionDocCount).toBe(1);
    expect(result.challengeRatio).toBe(0.5);
  });

  it('classifies ds, sou, and dir as government-aligned', () => {
    const ds = makeDoc({ dok_id: 'DS1', doktyp: 'ds' });
    const sou = makeDoc({ dok_id: 'SOU1', doktyp: 'sou' });
    const dir = makeDoc({ dok_id: 'DIR1', doktyp: 'dir' });
    const docs = [ds, sou, dir, MOT];
    const result = coalitionDetector.detect(docs, 'en');
    expect(result.governmentDocCount).toBe(3);
    expect(result.oppositionDocCount).toBe(1);
    expect(result.challengeRatio).toBe(0.25);
    expect(result.stressLevel).toBe('low');
  });
});
