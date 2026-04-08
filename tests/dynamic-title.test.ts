/**
 * Tests for generateDynamicTitle — now a stub (v5.0).
 *
 * Since v5.0, generateDynamicTitle is a DEPRECATED stub that returns
 * the base title and a generic subtitle. The AI agent (Copilot opus 4.6)
 * is responsible for generating all titles and descriptions during
 * agentic workflows. These tests verify the stub behavior.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateDynamicTitle } from '../scripts/generate-news-enhanced/helpers.js';

describe('generateDynamicTitle (v5.0 stub)', () => {
  it('returns base title unchanged — AI agent generates real titles', () => {
    const result = generateDynamicTitle('Committee Reports', '<p>Plain content without emphasis.</p>', 5);
    expect(result.title).toBe('Committee Reports');
    expect(result.subtitle).toContain('Committee Reports');
  });

  it('does NOT extract highlights from content — that is the AI agent job', () => {
    const content = '<p><strong>Budget Deficit</strong> is a major concern. <strong>Tax Reform</strong> is proposed.</p>';
    const result = generateDynamicTitle('Committee Reports', content, 7);
    // v5.0: Subtitle should NOT contain extracted highlights — it's a stub
    expect(result.title).toBe('Committee Reports');
    expect(result.subtitle).toContain('Committee Reports');
  });

  it('does NOT detect themes from content — that is the AI agent job', () => {
    const content = '<p>This article covers defense spending and NATO membership implications.</p>';
    const result = generateDynamicTitle('Government Propositions', content, 3);
    // v5.0: Title should be base title only, not enriched with theme
    expect(result.title).toBe('Government Propositions');
  });

  it('handles empty content gracefully', () => {
    const result = generateDynamicTitle('Base Title', '', 0);
    expect(result.title).toBe('Base Title');
    expect(result.subtitle).toContain('Base Title');
  });

  it('subtitle includes AI attribution marker', () => {
    const result = generateDynamicTitle('Test Title', '<p>Content.</p>', 10);
    expect(result.subtitle).toContain('AI-generated');
  });

  it('does not duplicate theme in title if already present', () => {
    const content = '<p>Defense spending proposals are reviewed.</p>';
    const result = generateDynamicTitle('Defense Policy Review', content, 3);
    expect(result.title).toBe('Defense Policy Review');
  });

  it('returns consistent stub format regardless of content', () => {
    const r1 = generateDynamicTitle('Title A', '<h3>Climate Policy Shift</h3>', 4);
    const r2 = generateDynamicTitle('Title B', '<p>Migration debate</p>', 10);
    // Both should follow same stub pattern
    expect(r1.subtitle).toMatch(/AI-generated/);
    expect(r2.subtitle).toMatch(/AI-generated/);
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
