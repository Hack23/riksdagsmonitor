/**
 * Tests for generateDynamicTitle — content-based article title/description generation.
 * Validates title enrichment from article highlights, theme extraction,
 * and graceful fallback behavior.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
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

  // Swedish content detection

  it('detects Swedish committee name (Finansutskottet) from content', () => {
    const content = '<p>Finansutskottet har behandlat budgetpropositionen.</p>';
    const result = generateDynamicTitle('Committee Reports', content, 3);
    expect(result.title).toContain('Finansutskottet');
  });

  it('detects Swedish committee name (Försvarsutskottet) from content', () => {
    const content = '<p>Försvarsutskottet diskuterade NATO-samarbete.</p>';
    const result = generateDynamicTitle('Committee Reports', content, 2);
    expect(result.title).toContain('Försvarsutskottet');
  });

  it('detects climate theme from Swedish content', () => {
    const content = '<p>Miljöfrågor och hållbar utveckling diskuterades i kammaren.</p>';
    const result = generateDynamicTitle('Government Propositions', content, 4);
    expect(result.title).toContain('Climate');
  });
});

describe('generateDynamicTitle integration', () => {
  it('is imported in ALL article generators', async () => {
    // Verify that all generator files import generateDynamicTitle
    
    const generatorFiles = [
      'scripts/generate-news-enhanced/generators.ts',
      'scripts/news-types/month-ahead.ts',
      'scripts/news-types/monthly-review.ts',
      'scripts/news-types/weekly-review/generator.ts',
      'scripts/news-types/breaking-news.ts',
    ];

    for (const file of generatorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} should import generateDynamicTitle`).toContain('generateDynamicTitle');
    }
  });

  it('is called for English articles in all generator files', async () => {
    
    const generatorFiles = [
      'scripts/generate-news-enhanced/generators.ts',
      'scripts/news-types/month-ahead.ts',
      'scripts/news-types/monthly-review.ts',
      'scripts/news-types/weekly-review/generator.ts',
      'scripts/news-types/breaking-news.ts',
    ];

    for (const file of generatorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} should use generateDynamicTitle for English enrichment`)
        .toContain("lang === 'en' ? generateDynamicTitle(");
    }
  });

  it('visualization section builders exist in all generator files', async () => {
    
    // The main generators.ts has buildArticleVisualizationSections
    const mainGen = fs.readFileSync('scripts/generate-news-enhanced/generators.ts', 'utf-8');
    expect(mainGen).toContain('buildArticleVisualizationSections');
    expect(mainGen).toContain('generateStakeholderSwotSection');
    expect(mainGen).toContain('analyzeDashboardData');
    expect(mainGen).toContain('generateEconomicDashboardSection');

    // news-types generators have their own section builders
    const breakingNews = fs.readFileSync('scripts/news-types/breaking-news.ts', 'utf-8');
    expect(breakingNews).toContain('buildBreakingSections');

    const weeklyReview = fs.readFileSync('scripts/news-types/weekly-review/generator.ts', 'utf-8');
    expect(weeklyReview).toContain('buildWeeklyReviewSections');

    const monthlyReview = fs.readFileSync('scripts/news-types/monthly-review.ts', 'utf-8');
    expect(monthlyReview).toContain('buildReviewSections');

    const monthAhead = fs.readFileSync('scripts/news-types/month-ahead.ts', 'utf-8');
    expect(monthAhead).toContain('buildMonthAheadSections');
  });

  it('all section builders use graceful degradation', async () => {
    
    const files = [
      'scripts/generate-news-enhanced/generators.ts',
      'scripts/news-types/breaking-news.ts',
      'scripts/news-types/weekly-review/generator.ts',
      'scripts/news-types/monthly-review.ts',
      'scripts/news-types/month-ahead.ts',
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Each section builder should have try/catch for graceful degradation
      const tryCatchCount = (content.match(/} catch \{/g) ?? []).length;
      expect(tryCatchCount, `${file} should have try/catch blocks for graceful degradation`)
        .toBeGreaterThanOrEqual(2);
    }
  });
});
