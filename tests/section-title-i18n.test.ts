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
    // Secondary analysis artifacts + recurring journalist sections added for
    // full 14-language TOC coverage.
    'deep-dive-political-classification',
    'pestle-analysis',
    'quantitative-swot',
    'wildcards--black-swans',
    'political-stride-assessment',
    'cycle-trajectory',
    'election-cycle-analysis',
    'parliamentary-season-outlook',
    'horizon-pir-roll-forward',
    'actor-analysis',
    'actor-assessment',
    'actor-network',
    'civil-society-analysis',
    'coalition-stability',
    'coalition-dynamics',
    'coalition-implications',
    'defence-policy-analysis',
    'defence-security',
    'economic-policy-analysis',
    'economic-context',
    'economic-impact',
    'election-proximity-analysis',
    'electoral-implications',
    'electoral-analysis',
    'electoral-forecast',
    'infrastructure-analysis',
    'international-context',
    'geopolitical-context',
    'eu-context',
    'comparative-context',
    'comparative-analysis',
    'media-narrative-analysis',
    'media-narrative',
    'media-framing',
    'opposition-mapping',
    'opposition-analysis',
    'opposition-response',
    'policy-implications',
    'policy-impact',
    'policy-domain-analysis',
    'social-welfare-analysis',
    'strategic-intelligence-brief',
    'strategic-implications',
    'timeline-analysis',
    'key-developments',
    'key-actors',
    'party-positions',
    'political-landscape',
    'public-opinion',
    'historical-baseline',
    'historical-context',
    'horizon-assessment',
    'intelligence-gaps',
    'information-gaps',
    'institutional-constraints',
    'confidence-calibration',
    'confidence-assessment',
    'risk-register',
    'risk-indicators',
    'scenario-tree',
    'forward-look',
    'network-analysis',
    'trend-analysis',
    'voting-analysis',
    'committee-analysis',
    'legislative-calendar',
    'stakeholder-mapping',
    'stakeholder-map',
    'methodology-notes',
    'source-registry',
    'source-inventory',
    'source-quality',
    'document-registry',
    'analysis-index',
    'reference-analysis-quality',
    'workflow-audit',
    'mcp-reliability-audit',
    'cross-session-intelligence',
    'cross-run-diff',
    'session-baseline',
    'diw-scores',
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

  it('localises recurring journalist topical sections (Korean regression)', () => {
    // These previously fell back to English in non-English article TOCs
    // (see the cited 2026-05-22 interpellations Korean article).
    expect(localizedSectionTitle('actor-analysis', 'ko')).toBe('행위자 분석');
    expect(localizedSectionTitle('defence-policy-analysis', 'ko')).toBe('국방 정책 분석');
    expect(localizedSectionTitle('strategic-intelligence-brief', 'ko')).toBe('전략 정보 브리핑');
    expect(localizedSectionTitle('timeline-analysis', 'ko')).toBe('타임라인 분석');
    expect(localizedSectionTitle('international-context', 'ja')).toBe('国際的背景');
    expect(localizedSectionTitle('social-welfare-analysis', 'de')).toBe('Sozialstaatsanalyse');
  });

  it('reuses the vetted artifact translation for the stakeholder-map slug', () => {
    // Delegated through SLUG_TO_ARTIFACT_FILE → ARTIFACT_TITLE_I18N.
    expect(localizedSectionTitle('stakeholder-map', 'en')).toBe('Stakeholder Map');
    expect(localizedSectionTitle('stakeholder-map', 'sv')).toBe('Intressentkarta');
  });

  it('returns undefined for slugs without a curated localisation', () => {
    expect(localizedSectionTitle('quux-unknown', 'sv')).toBeUndefined();
    expect(localizedSectionTitle('', 'en')).toBeUndefined();
  });
});
