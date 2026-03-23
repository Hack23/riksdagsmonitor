/**
 * Brief integration tests for scripts/ai-analysis/coalition-detector.ts
 *
 * The coalition detector already has comprehensive tests in
 * tests/coalition-detector.test.ts. This file verifies basic module
 * interface compliance only.
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

// ---------------------------------------------------------------------------
// Basic interface verification
// ---------------------------------------------------------------------------

describe('coalitionDetector (interface)', () => {
  it('detect returns a CoalitionTensionResult', () => {
    const result = coalitionDetector.detect(
      [makeDoc({ doktyp: 'prop' }), makeDoc({ doktyp: 'mot' })],
      'en',
    );
    expect(result).toHaveProperty('stressLevel');
    expect(result).toHaveProperty('narrative');
    expect(result).toHaveProperty('governmentDocCount');
    expect(result).toHaveProperty('oppositionDocCount');
    expect(result).toHaveProperty('challengeRatio');
    expect(result).toHaveProperty('sourceDocIds');
  });

  it('returns low stress for empty docs', () => {
    const result = coalitionDetector.detect([], 'en');
    expect(result.stressLevel).toBe('low');
  });

  it('stress level is one of low/medium/high', () => {
    const result = coalitionDetector.detect(
      [makeDoc({ doktyp: 'prop' }), makeDoc({ doktyp: 'mot' })],
      'en',
    );
    expect(['low', 'medium', 'high']).toContain(result.stressLevel);
  });
});
