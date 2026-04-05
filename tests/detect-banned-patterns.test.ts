/**
 * Tests for detectBannedPatterns utility function.
 * Validates detection of banned boilerplate patterns per SHARED_PROMPT_PATTERNS.md.
 */

import { describe, it, expect } from 'vitest';
import { detectBannedPatterns } from '../scripts/data-transformers/content-generators/shared.js';

describe('detectBannedPatterns', () => {
  it('returns empty array for clean content', () => {
    const html = '<p>Sweden held elections in September 2026, with the Social Democrats gaining seats.</p>';
    expect(detectBannedPatterns(html)).toEqual([]);
  });

  it('detects "The political landscape remains fluid" pattern', () => {
    const html = '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'neutralText: "The political landscape remains fluid…"',
    ]);
  });

  it('detects "No chamber debate data is available" pattern', () => {
    const html = '<p>No chamber debate data is available for these items, limiting our ability to assess deliberation.</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'noDebateDataText: "No chamber debate data is available…"',
    ]);
  });

  it('detects "Touches on X policy" pattern', () => {
    const html = '<p>Touches on education policy.</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'policySignificanceTouches: "Touches on {domains}."',
    ]);
  });

  it('detects "Touches on X, Y policy" pattern with comma-separated domains', () => {
    const html = '<p>Touches on education policy, health policy.</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'policySignificanceTouches: "Touches on {domains}."',
    ]);
  });

  it('detects "Touches on EU and foreign affairs" pattern without policy suffix', () => {
    const html = '<p>Touches on EU and foreign affairs.</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'policySignificanceTouches: "Touches on {domains}."',
    ]);
  });

  it('detects "Analysis of N documents covering" pattern', () => {
    const html = '<p>Analysis of 5 documents covering Defence, Finance:</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'analysisOfNDocuments: "Analysis of N documents covering…"',
    ]);
  });

  it('detects "Requires committee review and chamber debate" pattern', () => {
    const html = '<p>Requires committee review and chamber debate before a decision is reached.</p>';
    expect(detectBannedPatterns(html)).toEqual([
      'policySignificanceGeneric: "Requires committee review and chamber debate…"',
    ]);
  });

  it('detects multiple banned patterns in the same content', () => {
    const html = [
      '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>',
      '<p>Requires committee review and chamber debate.</p>',
    ].join('\n');
    expect(detectBannedPatterns(html)).toEqual([
      'neutralText: "The political landscape remains fluid…"',
      'policySignificanceGeneric: "Requires committee review and chamber debate…"',
    ]);
  });

  it('does not flag AI replacement markers as banned', () => {
    const html = '<!-- AI_MUST_REPLACE: winners_losers_analysis -->';
    expect(detectBannedPatterns(html)).toEqual([]);
  });
});
