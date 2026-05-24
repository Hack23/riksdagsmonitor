/**
 * @module Tests/ArticlePipeline
 * @description
 * Comprehensive tests for the article.md generation pipeline:
 * - Pipeline interfaces and types
 * - Pipeline orchestrator (runArticlePipeline)
 * - Extracted modules (heading-demotion, link-rewriting)
 * - Edge cases (empty folders, missing artifacts, malformed files)
 * - Integration test with full pipeline execution
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { demoteHeadings } from '../scripts/render-lib/aggregator/cleaning/heading-demotion.js';
import { rewriteRelativeLinks } from '../scripts/render-lib/aggregator/cleaning/link-rewriting.js';
import { runArticlePipeline } from '../scripts/render-lib/aggregator/pipeline.js';
import type {
  ArticleSection,
  PipelineResult,
  ReadStageInput,
  ValidationDiagnostic,
} from '../scripts/render-lib/aggregator/interfaces.js';

// ─── Test Utilities ──────────────────────────────────────────────────────────

/**
 * Narrows a `PipelineResult<T>` to the success branch and returns the value.
 * Throws (failing the test) if the result is an error, printing the message.
 * Eliminates the need for `!` non-null assertions throughout tests.
 */
function requireOk<T>(result: PipelineResult<T>): T {
  if (!result.ok) {
    throw new Error(`Expected ok result but got error: ${result.error}`);
  }
  return result.value;
}

// ─── Test Fixtures ───────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFixture(fileName: string, content: string): void {
  fs.writeFileSync(path.join(tmpDir, fileName), content, 'utf8');
}

function createMinimalAnalysisFolder(): void {
  writeFixture('executive-brief.md', [
    '# Budget Analysis 2026',
    '',
    '## 🎯 BLUF',
    '',
    'The government proposes increased defence spending by 15% in the 2026 budget.',
    '',
    '## Key Findings',
    '',
    '- Defence spending up 15%',
    '- Education flat',
    '- Healthcare reduced 3%',
  ].join('\n'));
}

// ─── Pipeline Interface Type Tests ───────────────────────────────────────────

describe('pipeline interfaces — type contracts', () => {
  it('PipelineResult success branch has ok=true and value', () => {
    const result: PipelineResult<string> = { ok: true, value: 'hello' };
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('hello');
    }
  });

  it('PipelineResult failure branch has ok=false and error', () => {
    const result: PipelineResult<string> = { ok: false, error: 'boom' };
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('boom');
    }
  });

  it('PipelineResult success branch supports optional warnings', () => {
    const result: PipelineResult<string> = {
      ok: true,
      value: 'data',
      warnings: ['minor issue'],
    };
    expect(result.warnings).toHaveLength(1);
  });

  it('PipelineResult failure branch supports optional warnings', () => {
    const result: PipelineResult<string> = {
      ok: false,
      error: 'bad input',
      warnings: ['check X'],
    };
    expect(result.warnings).toHaveLength(1);
  });

  it('ValidationDiagnostic supports all severity levels', () => {
    const diags: ValidationDiagnostic[] = [
      { level: 'error', message: 'Missing artifact', file: 'exec.md' },
      { level: 'warning', message: 'Short description' },
      { level: 'info', message: 'Generated successfully' },
    ];
    expect(diags).toHaveLength(3);
    const [firstDiag, secondDiag] = diags;
    expect(firstDiag!.level).toBe('error');
    expect(secondDiag!.file).toBeUndefined();
  });

  it('ArticleSection ties markdown to its source file', () => {
    const section: ArticleSection = {
      sourceFile: 'executive-brief.md',
      markdown: '## Executive Brief\n\nContent here.',
    };
    expect(section.sourceFile).toBe('executive-brief.md');
    expect(section.markdown).toContain('## Executive Brief');
  });
});

// ─── Pipeline Orchestrator Tests ─────────────────────────────────────────────

describe('runArticlePipeline — happy path', () => {
  it('produces a successful result with minimal analysis folder', () => {
    createMinimalAnalysisFolder();
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.markdown).toContain('---');
    expect(value.title).toBeTruthy();
    expect(value.description).toBeTruthy();
    expect(value.artifactsUsed).toContain('executive-brief.md');
  });

  it('extracts title from the executive-brief H1', () => {
    createMinimalAnalysisFolder();
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.title).toContain('Budget Analysis 2026');
  });

  it('extracts description from the BLUF paragraph', () => {
    createMinimalAnalysisFolder();
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.description).toContain('defence spending');
  });

  it('includes YAML front-matter with required fields', () => {
    createMinimalAnalysisFolder();
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.markdown).toMatch(/^---\n/);
    // Post-`2026-05-24` SEO contract — `title:` / `description:` lines
    // are no longer written to the article.md front-matter; the
    // renderer sources both directly from executive-brief.md via
    // `deriveBriefSeoOverrides`. The in-memory pipeline result still
    // exposes them on `value.title` / `value.description` for callers
    // (see runArticlePipeline result type).
    expect(value.markdown).not.toMatch(/^title:/m);
    expect(value.markdown).not.toMatch(/^description:/m);
    expect(value.title.length).toBeGreaterThan(0);
    expect(value.description.length).toBeGreaterThan(0);
    expect(value.markdown).toContain('date: 2026-05-06');
    expect(value.markdown).toContain('subfolder: propositions');
    expect(value.markdown).toContain('language: en');
    expect(value.markdown).toContain('layout: article');
  });

  it('config overrides are wired into the front-matter', () => {
    createMinimalAnalysisFolder();
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input, {
      generated_at: '2026-05-06T00:00:00.000Z',
      language: 'sv',
      layout: 'article-full',
    }));
    expect(value.markdown).toContain('generated_at: 2026-05-06T00:00:00.000Z');
    expect(value.markdown).toContain('language: sv');
    expect(value.markdown).toContain('layout: article-full');
  });

  it('aggregates multiple artifacts in canonical order', () => {
    createMinimalAnalysisFolder();
    writeFixture('significance-scoring.md', [
      '# Significance Scoring',
      '',
      'High priority items ranked by impact.',
    ].join('\n'));
    writeFixture('stakeholder-perspectives.md', [
      '# Stakeholder Perspectives',
      '',
      'Opposition parties critique the defence increase.',
    ].join('\n'));

    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.artifactsUsed).toContain('significance-scoring.md');
    expect(value.artifactsUsed).toContain('stakeholder-perspectives.md');
    // executive-brief should come before significance-scoring
    const briefIdx = value.artifactsUsed.indexOf('executive-brief.md');
    const sigIdx = value.artifactsUsed.indexOf('significance-scoring.md');
    expect(briefIdx).toBeGreaterThanOrEqual(0);
    expect(sigIdx).toBeGreaterThanOrEqual(0);
    expect(briefIdx).toBeLessThan(sigIdx);
  });
});

describe('runArticlePipeline — error cases', () => {
  it('returns error when subfolder does not exist', () => {
    const input: ReadStageInput = {
      subfolderAbsPath: '/nonexistent/path/that/does/not/exist',
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/xyz',
      date: '2026-05-06',
      subfolder: 'xyz',
    };
    const result = runArticlePipeline(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('not found');
    }
  });

  it('returns error when executive-brief.md is missing', () => {
    // Empty folder — no executive-brief.md
    writeFixture('significance-scoring.md', '# Significance\n\nContent.');
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const result = runArticlePipeline(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('executive-brief.md');
    }
  });

  it('handles empty executive-brief.md gracefully', () => {
    writeFixture('executive-brief.md', '');
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    // Should not crash — may produce a fallback title/description
    const value = requireOk(runArticlePipeline(input));
    expect(value.title).toBeTruthy(); // Fallback title
  });

  it('handles executive-brief.md with only YAML front-matter', () => {
    writeFixture('executive-brief.md', '---\ntitle: Test\n---\n');
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.title).toBeTruthy();
  });
});

describe('runArticlePipeline — edge cases', () => {
  it('excludes README.md from aggregation', () => {
    createMinimalAnalysisFolder();
    writeFixture('README.md', '# README\n\nDo not include this.');
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.artifactsUsed).not.toContain('README.md');
    expect(value.markdown).not.toContain('Do not include this');
  });

  it('excludes article.md and article.<lang>.md from aggregation', () => {
    createMinimalAnalysisFolder();
    writeFixture('article.md', '---\ntitle: old\n---\n# Old article');
    writeFixture('article.sv.md', '---\ntitle: Swedish\n---\n# Gammal');
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.artifactsUsed).not.toContain('article.md');
    expect(value.artifactsUsed).not.toContain('article.sv.md');
  });

  it('handles artifacts with malformed YAML front-matter', () => {
    writeFixture('executive-brief.md', [
      '---',
      'title: "unclosed quote',
      '---',
      '# Analysis',
      '',
      '## 🎯 BLUF',
      '',
      'This is the lede.',
    ].join('\n'));
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    // gray-matter may throw on malformed YAML; pipeline should catch it
    const result = runArticlePipeline(input);
    // Either succeeds (gray-matter is lenient) or returns a clean error
    if (result.ok) {
      expect(result.value.title).toBeTruthy();
    } else {
      expect(result.error).toBeTruthy();
    }
  });

  it('handles supplementary artifacts not in AGGREGATION_ORDER', () => {
    createMinimalAnalysisFolder();
    writeFixture('pestle-analysis.md', [
      '# PESTLE Analysis',
      '',
      'Political, Economic, Social, Technological, Legal, Environmental.',
    ].join('\n'));
    const input: ReadStageInput = {
      subfolderAbsPath: tmpDir,
      subfolderRepoRelPath: 'analysis/daily/2026-05-06/propositions',
      date: '2026-05-06',
      subfolder: 'propositions',
    };
    const value = requireOk(runArticlePipeline(input));
    expect(value.artifactsUsed).toContain('pestle-analysis.md');
  });
});

// ─── Extracted Module Tests: heading-demotion.ts ─────────────────────────────

describe('heading-demotion (extracted module)', () => {
  it('demotes ## to ###', () => {
    expect(demoteHeadings('## Hello')).toBe('### Hello');
  });

  it('demotes ### to ####', () => {
    expect(demoteHeadings('### Sub')).toBe('#### Sub');
  });

  it('caps at ###### (does not produce #######)', () => {
    expect(demoteHeadings('###### H6')).toBe('###### H6');
  });

  it('leaves H1 untouched (already stripped upstream)', () => {
    expect(demoteHeadings('# Title')).toBe('# Title');
  });

  it('preserves headings inside fenced code blocks', () => {
    const input = '```\n## Not a heading\n```';
    expect(demoteHeadings(input)).toBe(input);
  });

  it('preserves headings inside tilde-fenced code blocks', () => {
    const input = '~~~\n## Not a heading\n~~~';
    expect(demoteHeadings(input)).toBe(input);
  });

  it('handles multiple headings at different levels', () => {
    const input = '## H2\n### H3\n#### H4\n##### H5';
    const expected = '### H2\n#### H3\n##### H4\n###### H5';
    expect(demoteHeadings(input)).toBe(expected);
  });

  it('handles empty string', () => {
    expect(demoteHeadings('')).toBe('');
  });

  it('handles text without headings', () => {
    const input = 'No headings here.\nJust prose.';
    expect(demoteHeadings(input)).toBe(input);
  });

  it('does not demote hash characters in non-heading context', () => {
    const input = 'Use #hashtag in text';
    expect(demoteHeadings(input)).toBe(input);
  });
});

// ─── Extracted Module Tests: link-rewriting.ts ───────────────────────────────

describe('link-rewriting (extracted module)', () => {
  it('rewrites relative .md links to GitHub blob URLs', () => {
    const input = 'See [doc](other.md) for details.';
    const result = rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props');
    expect(result).toContain('https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-05-06/props/other.md');
  });

  it('preserves absolute https:// links', () => {
    const input = 'Visit [site](https://example.com)';
    expect(rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props')).toBe(input);
  });

  it('preserves fragment-only links', () => {
    const input = 'Jump to [section](#overview)';
    expect(rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props')).toBe(input);
  });

  it('preserves mailto: links', () => {
    const input = 'Email [us](mailto:hi@example.com)';
    expect(rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props')).toBe(input);
  });

  it('handles relative links with anchors', () => {
    const input = 'See [section](doc.md#heading)';
    const result = rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props');
    expect(result).toContain('doc.md#heading');
  });

  it('handles relative paths with ../', () => {
    const input = 'See [parent](../other.md)';
    const result = rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props');
    expect(result).toContain('analysis/daily/2026-05-06/other.md');
  });

  it('handles empty body', () => {
    expect(rewriteRelativeLinks('', 'analysis/daily/2026-05-06/props')).toBe('');
  });

  it('handles multiple links in the same line', () => {
    const input = 'See [a](a.md) and [b](b.md)';
    const result = rewriteRelativeLinks(input, 'analysis/daily/2026-05-06/props');
    expect(result).toContain('a.md');
    expect(result).toContain('b.md');
  });
});
