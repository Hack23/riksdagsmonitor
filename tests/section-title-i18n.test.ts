/**
 * @fileoverview Tests for the localised article section-title source of truth
 * consumed by the in-article Table of Contents.
 */
import { describe, it, expect } from 'vitest';

import { LANGUAGES } from '../scripts/render-lib/constants.js';
import { localizedSectionTitle } from '../scripts/render-lib/section-title-i18n.js';

describe('localizedSectionTitle', () => {
  // Canonical slugs the TOC localiser is expected to cover: journalist-framed
  // sections, the reused-artifact sections, the per-document pointer, the
  // Deep Dive sections, and the coverage appendix.
  const MAPPED_SLUGS = [
    'what-happened',
    'why-it-matters',
    'key-findings',
    'significance-scoring',
    'per-document-intelligence',
    'stakeholder-perspectives',
    'coalition-mathematics',
    'voter-segmentation',
    'forward-indicators',
    'scenario-analysis',
    'election-2026-analysis',
    'risk-assessment',
    'swot-analysis',
    'threat-analysis',
    'historical-parallels',
    'comparative-international',
    'implementation-feasibility',
    'media-framing-analysis',
    'devils-advocate',
    'deep-dive-classification-results',
    'deep-dive-cross-reference-map',
    'deep-dive-methodology--limitations',
    'deep-dive-data-download-manifest',
    'analysis-artifact-coverage-report',
  ];

  it('returns a non-empty localised title for every mapped slug × language', () => {
    for (const slug of MAPPED_SLUGS) {
      for (const lang of LANGUAGES) {
        const title = localizedSectionTitle(slug, lang);
        expect(title, `${slug} / ${lang}`).toBeTruthy();
        expect((title ?? '').trim().length, `${slug} / ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps English titles byte-identical to the journalist body headings', () => {
    expect(localizedSectionTitle('what-happened', 'en')).toBe('What Happened');
    expect(localizedSectionTitle('why-it-matters', 'en')).toBe('Why It Matters');
    expect(localizedSectionTitle('key-findings', 'en')).toBe('Key Findings');
    expect(localizedSectionTitle('risk-assessment', 'en')).toBe('Risk Assessment');
    expect(localizedSectionTitle('devils-advocate', 'en')).toBe("Devil's Advocate");
    expect(localizedSectionTitle('per-document-intelligence', 'en')).toBe('Per-document intelligence');
    expect(localizedSectionTitle('deep-dive-methodology--limitations', 'en')).toBe(
      'Deep Dive: Methodology & Limitations',
    );
    expect(localizedSectionTitle('analysis-artifact-coverage-report', 'en')).toBe(
      'Analysis Artifact Coverage Report',
    );
  });

  it('reuses the vetted artifact translation for delegated sections', () => {
    // Swedish risk-assessment title comes from ARTIFACT_TITLE_I18N.
    expect(localizedSectionTitle('risk-assessment', 'sv')).toBe('Riskbedömning');
    expect(localizedSectionTitle('swot-analysis', 'de')).toBe('SWOT-Analyse');
  });

  it('localises journalist-framed and Deep Dive sections', () => {
    expect(localizedSectionTitle('what-happened', 'sv')).toBe('Vad som hände');
    expect(localizedSectionTitle('deep-dive-cross-reference-map', 'sv')).toBe(
      'Fördjupning: Korsreferenskarta',
    );
  });

  it('returns undefined for slugs without a curated localisation', () => {
    expect(localizedSectionTitle('quux-unknown', 'sv')).toBeUndefined();
    expect(localizedSectionTitle('', 'en')).toBeUndefined();
  });
});
