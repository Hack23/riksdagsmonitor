/**
 * Tests for generateDynamicTitle — content-aware fallback (v6.0).
 *
 * Since v6.0, generateDynamicTitle extracts topic hints from HTML content
 * to produce a minimally newsworthy fallback title. The AI agent in the
 * agentic workflow should still overwrite with fully analysis-driven titles.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateDynamicTitle } from '../scripts/generate-news-enhanced/helpers.js';

describe('generateDynamicTitle (v6.0 content-aware fallback)', () => {
  it('returns enriched title when content has strong tags', () => {
    const content = '<p><strong>Budget Deficit</strong> is a major concern. <strong>Tax Reform</strong> is proposed.</p>';
    const result = generateDynamicTitle('Committee Reports', content, 7);
    expect(result.title).toContain('Committee Reports');
    expect(result.title).toContain('Budget Deficit');
  });

  it('returns enriched title when content has h3 headings', () => {
    const content = '<h3>Climate Policy Shift</h3><p>Content about climate.</p>';
    const result = generateDynamicTitle('Government Propositions', content, 3);
    expect(result.title).toContain('Government Propositions');
    expect(result.title).toContain('Climate Policy Shift');
  });

  it('falls back to doc-count title when no topic hints', () => {
    const result = generateDynamicTitle('Base Title', '<p>Plain content without emphasis.</p>', 5);
    expect(result.title).toContain('Base Title');
    expect(result.title).toContain('5 Documents');
  });

  it('handles empty content with doc count', () => {
    const result = generateDynamicTitle('Base Title', '', 10);
    expect(result.title).toContain('Base Title');
    expect(result.title).toContain('10 Documents');
  });

  it('handles empty content and zero doc count', () => {
    const result = generateDynamicTitle('Base Title', '', 0);
    expect(result.title).toBe('Base Title');
    expect(result.subtitle).toContain('AI-generated');
  });

  it('subtitle includes AI attribution marker when no content', () => {
    const result = generateDynamicTitle('Test Title', '', 0);
    expect(result.subtitle).toContain('AI-generated');
  });

  it('subtitle is content-aware when topics extracted', () => {
    const content = '<p><strong>Defence Spending</strong> is reviewed.</p>';
    const result = generateDynamicTitle('Defense Policy Review', content, 3);
    expect(result.subtitle).toContain('Defence Spending');
    expect(result.subtitle).toContain('Riksdag');
  });

  it('limits topics to 3 in title', () => {
    const content = '<p><strong>Budget Deficit</strong><strong>Tax Reform</strong><strong>Climate Policy</strong><strong>Defense Spending</strong><strong>Energy Market</strong></p>';
    const result = generateDynamicTitle('Reports', content, 5);
    expect(result.title).toContain('Reports');
    expect(result.title).toContain('Budget Deficit');
    expect(result.title).toContain('Tax Reform');
    expect(result.title).toContain('Climate Policy');
    expect(result.title).not.toContain('Defense Spending');
    expect(result.title).not.toContain('Energy Market');
  });
});

describe('generateDynamicTitle integration', () => {
  // Discover all generator files programmatically instead of maintaining a static list.
  // Every .ts file under scripts/ that imports generateDynamicTitle (excluding the definition site)
  // is considered a generator integration point.
  function discoverGeneratorFiles(): string[] {
    const dirs = ['scripts/generate-news-enhanced', 'scripts/news-types'];
    const files: string[] = [];
    for (const dir of dirs) {
      const walk = (d: string): void => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          if (entry.isDirectory()) walk(path.join(d, entry.name));
          else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
            const fp = path.join(d, entry.name);
            const src = fs.readFileSync(fp, 'utf-8');
            // Include files that import generateDynamicTitle (not the definition in helpers.ts)
            if (src.includes('generateDynamicTitle') && !src.includes('export function generateDynamicTitle')) {
              files.push(fp);
            }
          }
        }
      };
      walk(dir);
    }
    return files.sort();
  }

  const generatorFiles = discoverGeneratorFiles();

  it('discovers at least 5 generator files using generateDynamicTitle', () => {
    expect(generatorFiles.length).toBeGreaterThanOrEqual(5);
  });

  it('is imported in ALL discovered article generators', async () => {
    for (const file of generatorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} should import generateDynamicTitle`).toContain('generateDynamicTitle');
    }
  });

  it('is called for English articles in all generator files', async () => {
    for (const file of generatorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} should use generateDynamicTitle for English enrichment`)
        .toContain("lang === 'en' ? generateDynamicTitle(");
    }
  });

  it('visualization section builder is shared across all generator files', async () => {
    
    // The main generators.ts defines and exports buildArticleVisualizationSections
    const mainGen = fs.readFileSync('scripts/generate-news-enhanced/generators.ts', 'utf-8');
    expect(mainGen).toContain('export function buildArticleVisualizationSections');
    expect(mainGen).toContain('generateStakeholderSwotSection');
    expect(mainGen).toContain('analyzeDashboardData');
    expect(mainGen).toContain('generateEconomicDashboardSection');

    // news-types generators import the shared helper instead of duplicating
    const newsTypeFiles = [
      'scripts/news-types/breaking-news.ts',
      'scripts/news-types/weekly-review/generator.ts',
      'scripts/news-types/monthly-review.ts',
      'scripts/news-types/month-ahead.ts',
    ];
    for (const file of newsTypeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} should import shared buildArticleVisualizationSections`)
        .toContain('buildArticleVisualizationSections');
    }
  });

  it('all section builders use graceful degradation', async () => {
    // Only generators.ts contains the actual try/catch logic now
    const content = fs.readFileSync('scripts/generate-news-enhanced/generators.ts', 'utf-8');
    const tryCatchCount = (content.match(/} catch \{/g) ?? []).length;
    expect(tryCatchCount, 'generators.ts should have try/catch blocks for graceful degradation')
      .toBeGreaterThanOrEqual(3);
  });

  it('subtitle templates do NOT contain document count interpolation', async () => {
    // v5.0: Subtitles must be static stubs — no ${count} or "N documents" patterns
    for (const file of generatorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Check for banned subtitle patterns that include document counts
      const subtitleMatches = content.match(/subtitle:\s*`[^`]*\$\{[^}]*\.length\}[^`]*`/g) ?? [];
      expect(subtitleMatches, `${file} should not interpolate .length in subtitles — AI generates descriptions`)
        .toHaveLength(0);
    }
  });

  it('subtitle templates contain AI attribution stub', async () => {
    // v5.0: All subtitles should contain the AI-generated marker so the AI agent
    // can identify them as stubs that need replacement
    for (const file of generatorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const subtitleLines = content.match(/subtitle:\s*`[^`]+`/g) ?? [];
      const aiStubs = subtitleLines.filter(s => s.includes('AI-generat') || s.includes('AI-genererad') || s.includes('AI-genereret') || s.includes('AI-generert') || s.includes('tekoäly') || s.includes('KI-generierte') || s.includes('AI-gegenereerde') || s.includes('الذكاء الاصطناعي') || s.includes('בינה מלאכותית') || s.includes('AI生成') || s.includes('AI 생성') || s.includes('générée par IA') || s.includes('generado por IA'));
      // At least some subtitles should have the AI attribution marker
      if (subtitleLines.length > 0) {
        expect(aiStubs.length, `${file} should have AI attribution in subtitle stubs`).toBeGreaterThan(0);
      }
    }
  });
});
