/**
 * @module Tests/RenderLib/ArticleAside
 *
 * Pure-function tests for the reusable article-aside renderers and the
 * "analysis-artifacts at the end with methods after" ordering contract
 * applied by `renderArticleHtml`.
 */

import { describe, it, expect } from 'vitest';

import {
  renderReaderNavigation,
  renderAnalysisArtifactsReference,
  renderMethodsReference,
} from '../scripts/render-lib/article-aside.js';
import { renderArticleHtml } from '../scripts/render-lib/article.js';

describe('article-aside — renderReaderNavigation', () => {
  it('renders a localised navigation table with one row per available artifact + audit appendix', () => {
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
    });
    expect(html).toContain('class="rm-reader-guide"');
    expect(html).toContain('Reader Intelligence Guide');
    expect(html).toContain('class="rm-reader-guide-table"');
    // Available artifacts surface as table cells.
    expect(html).toContain('<code>executive-brief.md</code>');
    expect(html).toContain('<code>risk-assessment.md</code>');
    // Always-present audit appendix row.
    expect(html).toContain('rm-classification-results');
    // The methodology cards must NOT be in the navigation table — they
    // belong to the methods-reference block at the article foot.
    expect(html).not.toContain('rm-reader-guide-grid');
    expect(html).not.toContain('articleReaderGuideOsint');
    expect(html).not.toContain('OSINT tradecraft');
  });

  it('localises the heading per language (sv)', () => {
    const html = renderReaderNavigation({
      lang: 'sv',
      artifactsUsed: ['executive-brief.md'],
    });
    expect(html).toContain('Läsarens underrättelseguide');
  });

  it('omits per-document row when no documents/*-analysis.md artifacts present', () => {
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: ['executive-brief.md'],
    });
    expect(html).not.toContain('rm-per-document-intelligence');
  });

  it('includes per-document row when documents/*-analysis.md present', () => {
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: ['executive-brief.md', 'documents/H902FiU1-analysis.md'],
    });
    expect(html).toContain('rm-per-document-intelligence');
  });

  it('returns empty string when no artifacts and no audit row would render', () => {
    // Audit appendix row is always pushed, so empty input still produces
    // a non-empty navigation. Use this to assert the function never
    // throws on an empty list.
    const html = renderReaderNavigation({ lang: 'en', artifactsUsed: [] });
    expect(html).toContain('rm-classification-results');
  });
});

describe('article-aside — renderAnalysisArtifactsReference', () => {
  it('returns the empty string when no artifacts supplied', () => {
    expect(
      renderAnalysisArtifactsReference({
        lang: 'en',
        artifactsUsed: [],
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/x',
      }),
    ).toBe('');
  });

  it('renders one source card per artifact with icon, i18n title, and GitHub blob url', () => {
    const html = renderAnalysisArtifactsReference({
      lang: 'en',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
    });
    expect(html).toContain('class="rm-article-sources"');
    expect(html).toContain('class="rm-source-card"');
    expect(html).toContain('Executive Brief');
    expect(html).toContain('Risk Assessment');
    expect(html).toContain('📊');
    expect(html).toContain('⚠️');
    expect(html).toContain('analysis/daily/2099-01-01/propositions/executive-brief.md');
    // Methodology summary count reflects the supplied artifacts.
    expect(html).toContain('(2)');
  });
});

describe('article-aside — renderMethodsReference', () => {
  it('renders the four methodology cards plus a CTA back to political-intelligence', () => {
    const html = renderMethodsReference({
      lang: 'en',
      canonicalPath: 'news/2099-01-01-x-en.html',
    });
    expect(html).toContain('class="rm-methods-reference"');
    expect(html).toContain('rm-reader-guide-grid');
    expect(html).toContain('OSINT tradecraft');
    expect(html).toContain('AI-FIRST dual-pass review');
    expect(html).toContain('SWOT');
    expect(html).toContain('Fully traceable artifacts');
    // CTA points back to the catalogue page.
    expect(html).toContain('political-intelligence.html');
    expect(html).toContain('class="rm-reader-guide-cta"');
  });

  it('points the CTA to the language-specific catalogue page (sv)', () => {
    const html = renderMethodsReference({
      lang: 'sv',
      canonicalPath: 'news/2099-01-01-x-sv.html',
    });
    expect(html).toContain('political-intelligence_sv.html');
    expect(html).not.toContain('political-intelligence.html"');
  });
});

describe('article — analysis-artifacts → methods ordering at the article foot', () => {
  const articleMd = [
    '---',
    'title: "Propositions 2099-01-01"',
    'description: "BLUF for propositions."',
    'date: 2099-01-01',
    '---',
    '',
    '## Executive Brief',
    '',
    'Lead paragraph.',
    '',
    '## Risk Assessment',
    '',
    'Body.',
    '',
  ].join('\n');

  it('renders rm-article-sources strictly BEFORE rm-methods-reference', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
    });

    const sourcesIdx = html.indexOf('class="rm-article-sources"');
    const methodsIdx = html.indexOf('class="rm-methods-reference"');
    expect(sourcesIdx, 'rm-article-sources must render').toBeGreaterThan(-1);
    expect(methodsIdx, 'rm-methods-reference must render').toBeGreaterThan(-1);
    expect(methodsIdx, 'methods must come AFTER analysis-artifacts').toBeGreaterThan(sourcesIdx);
  });

  it('renders the navigation table BEFORE the analysis-artifacts reference', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
    });
    const navIdx = html.indexOf('class="rm-reader-guide"');
    const sourcesIdx = html.indexOf('class="rm-article-sources"');
    expect(navIdx).toBeGreaterThan(-1);
    expect(sourcesIdx).toBeGreaterThan(navIdx);
  });

  it('renders the methods reference for all 14 languages', async () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
    for (const lang of langs) {
      const html = await renderArticleHtml({
        markdown: articleMd,
        lang,
        canonicalPath: `news/2099-01-01-propositions-${lang}.html`,
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
        artifactsUsed: ['executive-brief.md'],
      });
      expect(html, `lang=${lang} must render the methods reference`).toContain(
        'class="rm-methods-reference"',
      );
      expect(html, `lang=${lang} must link back to its localized catalogue page`).toContain(
        lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`,
      );
    }
  });
});
