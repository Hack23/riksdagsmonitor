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
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('political landscape remains fluid'))).toBe(true);
  });

  it('detects "No chamber debate data is available" pattern', () => {
    const html = '<p>No chamber debate data is available for these items, limiting our ability to assess deliberation.</p>';
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('No chamber debate data'))).toBe(true);
  });

  it('detects "Touches on X policy" pattern', () => {
    const html = '<p>Touches on education policy.</p>';
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('Touches on'))).toBe(true);
  });

  it('detects "Touches on X, Y policy" pattern with comma-separated domains', () => {
    const html = '<p>Touches on education policy, health policy.</p>';
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('Touches on'))).toBe(true);
  });

  it('detects "Touches on EU and foreign affairs" pattern without policy suffix', () => {
    const html = '<p>Touches on EU and foreign affairs.</p>';
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('Touches on'))).toBe(true);
  });

  it('detects "Analysis of N documents covering" pattern', () => {
    const html = '<p>Analysis of 5 documents covering Defence, Finance:</p>';
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('Analysis of'))).toBe(true);
  });

  it('detects "Requires committee review and chamber debate" pattern', () => {
    const html = '<p>Requires committee review and chamber debate before a decision is reached.</p>';
    const found = detectBannedPatterns(html);
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(p => p.includes('Requires committee review'))).toBe(true);
  });

  it('detects multiple banned patterns in the same content', () => {
    const html = [
      '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>',
      '<p>Requires committee review and chamber debate.</p>',
    ].join('\n');
    const found = detectBannedPatterns(html);
    expect(found.length).toBe(2);
  });

  it('does not flag AI replacement markers as banned', () => {
    const html = '<!-- AI_MUST_REPLACE: winners_losers_analysis -->';
    expect(detectBannedPatterns(html)).toEqual([]);
  });
});
