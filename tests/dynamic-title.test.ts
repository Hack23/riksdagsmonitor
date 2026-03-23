/**
 * Tests for generateDynamicTitle — content-based article title/description generation.
 * Validates title enrichment from article highlights, theme extraction,
 * and graceful fallback behavior.
 */

import { describe, it, expect } from 'vitest';
import { generateDynamicTitle } from '../scripts/generate-news-enhanced/helpers.js';

describe('generateDynamicTitle', () => {
  it('returns base title when content has no highlights', () => {
    const result = generateDynamicTitle('Committee Reports', '<p>Plain content without emphasis.</p>', 5);
    expect(result.title).toBe('Committee Reports');
    expect(result.subtitle).toContain('5');
    expect(result.subtitle).toContain('parliamentary documents');
  });

  it('enriches title with dominant theme from content', () => {
    const content = '<p>This article covers defense spending and NATO membership implications.</p>';
    const result = generateDynamicTitle('Government Propositions', content, 3);
    expect(result.title).toContain('Defense');
  });

  it('enriches subtitle with strong highlights', () => {
    const content = '<p><strong>Budget Deficit</strong> is a major concern. <strong>Tax Reform</strong> is proposed.</p>';
    const result = generateDynamicTitle('Committee Reports', content, 7);
    expect(result.subtitle).toContain('Budget Deficit');
    expect(result.subtitle).toContain('Tax Reform');
    expect(result.subtitle).toContain('7');
  });

  it('enriches subtitle with h3 headings as highlights', () => {
    const content = '<h3>Climate Policy Shift</h3><p>Details of the shift.</p><h3>Energy Transition</h3>';
    const result = generateDynamicTitle('Motions', content, 4);
    expect(result.subtitle).toContain('Climate Policy Shift');
    expect(result.subtitle).toContain('4');
  });

  it('detects migration theme from content', () => {
    const content = '<p>The migration debate continues with new asylum policies being discussed.</p>';
    const result = generateDynamicTitle('Interpellation Debates', content, 2);
    expect(result.title).toContain('Migration');
  });

  it('detects EU affairs theme from content', () => {
    const content = '<p>Sweden\'s position in the European Union has shifted significantly.</p>';
    const result = generateDynamicTitle('Government Propositions', content, 6);
    expect(result.title).toContain('EU Affairs');
  });

  it('does not duplicate theme in title if already present', () => {
    const content = '<p>Defense spending proposals are reviewed.</p>';
    const result = generateDynamicTitle('Defense Policy Review', content, 3);
    // Should not duplicate "Defense" in title
    expect(result.title).toBe('Defense Policy Review');
  });

  it('uses document count in subtitle', () => {
    const result = generateDynamicTitle('Test Title', '<p>Simple content.</p>', 42);
    expect(result.subtitle).toContain('42');
  });

  it('handles empty content gracefully', () => {
    const result = generateDynamicTitle('Base Title', '', 0);
    expect(result.title).toBe('Base Title');
    expect(result.subtitle).toContain('0');
  });

  it('deduplicates highlights from strong and h3 tags', () => {
    const content = '<strong>Same Topic</strong><h3>Same Topic</h3>';
    const result = generateDynamicTitle('Test', content, 1);
    // Should not repeat "Same Topic" in subtitle
    const count = (result.subtitle.match(/Same Topic/g) ?? []).length;
    expect(count).toBeLessThanOrEqual(1);
  });
});
