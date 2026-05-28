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
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md', 'classification-results.md'],
    });
    expect(html).toContain('class="rm-reader-guide"');
    expect(html).toContain('Reader Intelligence Guide');
    expect(html).toContain('class="rm-reader-guide-table"');
    // Localised artifact labels surface as anchor link text — the
    // legacy <code>filename</code> column is removed, audit-grade
    // traceability lives in the Analysis Sources card grid instead.
    expect(html).toContain('Lede and editorial decisions');
    expect(html).toContain('Risk assessment');
    expect(html).not.toContain('<code>executive-brief.md</code>');
    expect(html).not.toContain('<code>risk-assessment.md</code>');
    // Per-row icon <td> cells are present (assert the actual cell
    // marker, not the column-header class `rm-reader-guide-icon-col`
    // which is a substring superset and would mask removal of the
    // per-row cells).
    expect(html).toContain('<td class="rm-reader-guide-icon"><span aria-hidden="true">');
    expect(html).toContain('📊'); // executive-brief icon
    expect(html).toContain('⚠️'); // risk-assessment icon
    // Always-present audit appendix row.
    expect(html).toContain('rm-deep-dive-classification-results');
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

  it('always includes the audit-appendix row even when no curated artifacts matched', () => {
    // The audit appendix row is unconditionally pushed so the function
    // never returns an empty string. With no audit artifact present
    // the row falls back to the `#rm-article-sources` anchor (the
    // wrapping <section> id, distinct from the h2 id
    // `rm-article-sources-heading` so reader-nav links don't
    // accidentally match the heading id when the sources block is
    // absent — see render-lib-architecture.test.ts).
    const html = renderReaderNavigation({ lang: 'en', artifactsUsed: [] });
    expect(html).toContain('href="#rm-article-sources"');
    expect(html).not.toContain('rm-article-sources-heading');
  });

  it('points the audit row at political-classification when that is the available audit artifact', () => {
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: ['executive-brief.md', 'political-classification.md'],
    });
    expect(html).toContain('href="#rm-deep-dive-political-classification"');
    expect(html).not.toContain('href="#rm-deep-dive-classification-results"');
  });

  it('renders rows for ALL analysis artifacts, not just the curated lenses', () => {
    // Non-curated artifacts (e.g. `pestle-analysis.md`,
    // `wildcards-blackswans.md`) must still appear as navigable rows
    // — the user-visible "always generate the whole section to include
    // all analysis artifacts" contract.
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: [
        'executive-brief.md',
        'pestle-analysis.md',
        'wildcards-blackswans.md',
      ],
    });
    expect(html).toContain('Lede and editorial decisions');
    // Non-curated artifacts (not in the per-language ENTRIES blocks)
    // now resolve their description from the centralised
    // READER_VALUE_I18N map, so every row carries a unique reader-
    // value sentence — no more silent fallback to the generic
    // "supporting analytical lens..." filler.
    expect(html).toMatch(/PESTLE/i);
    expect(html).toMatch(/Wildcard|Black/i);
    expect(html).toContain('political, economic, social, technological');
    expect(html).toContain('low-probability, high-impact disruptive events');
    // The localised generic fallback ("supporting analytical lens...")
    // must NOT appear when the central map provides a description.
    expect(html).not.toContain('supporting analytical lens');
  });

  it('uses the localised colIcon header for the icon column (not hard-coded English "Icon")', () => {
    const sv = renderReaderNavigation({ lang: 'sv', artifactsUsed: ['executive-brief.md'] });
    expect(sv).toContain('class="sr-only">Ikon<');
    expect(sv).not.toContain('class="sr-only">Icon<');

    const fr = renderReaderNavigation({ lang: 'fr', artifactsUsed: ['executive-brief.md'] });
    expect(fr).toContain('class="sr-only">Icône<');

    const ja = renderReaderNavigation({ lang: 'ja', artifactsUsed: ['executive-brief.md'] });
    expect(ja).toContain('class="sr-only">アイコン<');
  });

  it('skips JSON artifacts and unknown extensions (no broken in-page anchors)', () => {
    // `pir-status.json` and `economic-data.json` are referenced by the
    // audit appendix card grid, NOT emitted as their own `## <title>`
    // section. They must NOT appear as Reader Guide navigation rows
    // (an anchor to a non-existent heading is a broken link).
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: [
        'executive-brief.md',
        'pir-status.json',
        'classification-results.json',
        'economic-data.json',
      ],
    });
    // No JSON artifacts in the navigation rows.
    expect(html).not.toMatch(/href="#rm-pir-status"/);
    expect(html).not.toMatch(/href="#rm-economic-data"/);
    // Curated lens still renders.
    expect(html).toContain('Lede and editorial decisions');
  });

  it('de-duplicates filename-variant alias groups (election-2026-analysis vs election-cycle-analysis)', () => {
    // Aggregator emits at most one alias per folder — only the first
    // member encountered in AGGREGATION_ORDER. The Reader Guide must
    // mirror this so both rows don't try to point at the same heading
    // (which would render as a single `## Election ... Analysis`
    // section, leaving the second link broken).
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: [
        'executive-brief.md',
        'election-2026-analysis.md',
        'election-cycle-analysis.md',
      ],
    });
    // Only one election-analysis row should be present. We can verify
    // by counting how many anchor links target an `election-` heading.
    const electionAnchors = (html.match(/href="#rm-election-[^"]*"/g) ?? []);
    expect(electionAnchors.length).toBe(1);
  });

  it('skips README.md and article*.md aggregator outputs', () => {
    const html = renderReaderNavigation({
      lang: 'en',
      artifactsUsed: ['executive-brief.md', 'README.md', 'article.md', 'article.sv.md'],
    });
    expect(html).not.toContain('href="#rm-readme"');
    expect(html).not.toContain('href="#rm-article"');
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
    // Each card now carries a localised one-line description (the
    // same reader-value sentence used by the Reader Intelligence
    // Guide table) so the cards aren't visually identical filename
    // boxes.
    expect(html).toContain('class="rm-source-card-desc"');
    expect(html).toContain('fast answer to what happened');
    expect(html).toContain('policy, electoral, institutional');
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
