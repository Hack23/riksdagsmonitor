/**
 * Tests for buildAnalysisEnrichmentSections — renders pre-computed analysis
 * enrichment into article TemplateSections (SWOT grid, stakeholder cards,
 * risk/threat, forward indicators, significance table).
 *
 * Validates HTML structure, heading hierarchy, 14-language labels,
 * impact type normalisation, and XSS escaping.
 */

import { describe, it, expect } from 'vitest';
import { buildAnalysisEnrichmentSections } from '../scripts/generate-news-enhanced/generators.js';
import type { AnalysisEnrichment } from '../scripts/generate-news-enhanced/helpers.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal enrichment with all sections populated */
function fullEnrichment(overrides?: Partial<AnalysisEnrichment>): AnalysisEnrichment {
  return {
    classificationLevel: 'MEDIUM',
    riskLevel: 'moderate',
    confidenceLabel: 'HIGH',
    swotAnalysis: {
      subject: 'Migration Policy',
      strengths: [{ text: 'Strong consensus', confidence: 'HIGH', impact: 'high' }],
      weaknesses: [{ text: 'Internal divisions', confidence: 'MEDIUM', impact: 'medium' }],
      opportunities: [{ text: 'EU alignment', confidence: 'HIGH', impact: 'high' }],
      threats: [{ text: 'Coalition pressure', confidence: 'LOW', impact: 'low' }],
    },
    stakeholderPerspectives: {
      government: 'Government supports reform',
      opposition: 'Opposition objects',
      citizen: 'Citizens concerned',
      economic: 'Business impact expected',
      international: 'EU watching closely',
      media: 'Active media debate',
    },
    riskSummary: 'Elevated political risk',
    democraticHealth: 'MEDIUM',
    threatIndicators: ['Rising polarisation', 'Coalition stress'],
    forwardIndicators: ['Committee vote on May 5', 'EU summit June 12'],
    topDocuments: [
      { docId: 'H901AU10', score: 85, reason: 'Key labour market reform' },
      { docId: 'H901FiU1', score: 72, reason: 'Budget implications' },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildAnalysisEnrichmentSections', () => {
  it('returns empty array when enrichment is null', () => {
    expect(buildAnalysisEnrichmentSections(null, 'en')).toEqual([]);
  });

  it('returns empty array when enrichment has no populated sections', () => {
    const minimal: AnalysisEnrichment = {
      classificationLevel: 'LOW',
      riskLevel: 'low',
      confidenceLabel: 'MEDIUM',
    };
    const result = buildAnalysisEnrichmentSections(minimal, 'en');
    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // SWOT section
  // -----------------------------------------------------------------------
  describe('SWOT section', () => {
    it('renders SWOT grid with correct section id and className', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const swot = sections.find(s => s.id === 'swot-analysis');
      expect(swot).toBeDefined();
      expect(swot!.className).toBe('swot-section');
    });

    it('contains all four quadrants with heading labels', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('swot-strengths');
      expect(html).toContain('swot-weaknesses');
      expect(html).toContain('swot-opportunities');
      expect(html).toContain('swot-threats');
      expect(html).toContain('Strengths');
      expect(html).toContain('Weaknesses');
      expect(html).toContain('Opportunities');
      expect(html).toContain('Threats');
    });

    it('renders Swedish labels for sv language', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'sv');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('SWOT-analys');
      expect(html).toContain('Styrkor');
      expect(html).toContain('Svagheter');
      expect(html).toContain('Möjligheter');
      expect(html).toContain('Hot');
    });

    it('renders localized labels for non-EN/SV languages', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'de');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('SWOT-Analyse');
      expect(html).toContain('Stärken');
      expect(html).toContain('Schwächen');
      expect(html).toContain('Chancen');
      expect(html).toContain('Risiken');
    });

    it('renders Japanese labels', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'ja');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('SWOT分析');
      expect(html).toContain('強み');
      expect(html).toContain('弱み');
    });

    it('renders impact badges with proper classes', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('impact-high');
      expect(html).toContain('impact-medium');
      expect(html).toContain('impact-low');
    });

    it('renders localized impact ARIA labels', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'sv');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('aria-label="Hög påverkan"');
      expect(html).toContain('aria-label="Medelpåverkan"');
      expect(html).toContain('aria-label="Låg påverkan"');
    });

    it('wraps impact emoji in aria-hidden for screen readers', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('aria-hidden="true">🔴</span>');
      expect(html).toContain('aria-hidden="true">🟡</span>');
      expect(html).toContain('aria-hidden="true">🟢</span>');
    });

    it('normalizes unknown impact values to medium', () => {
      const enrichment = fullEnrichment({
        swotAnalysis: {
          subject: 'Test',
          strengths: [{ text: 'Test entry', confidence: 'HIGH', impact: 'extreme' as never }],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
      });
      const sections = buildAnalysisEnrichmentSections(enrichment, 'en');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).toContain('impact-medium');
      expect(html).not.toContain('impact-extreme');
    });

    it('escapes XSS in SWOT entry text', () => {
      const enrichment = fullEnrichment({
        swotAnalysis: {
          subject: '<script>alert(1)</script>',
          strengths: [{ text: '<img onerror=alert(1)>', confidence: 'HIGH', impact: 'high' }],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
      });
      const sections = buildAnalysisEnrichmentSections(enrichment, 'en');
      const html = sections.find(s => s.id === 'swot-analysis')!.html;
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img onerror');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  // -----------------------------------------------------------------------
  // Stakeholder section
  // -----------------------------------------------------------------------
  describe('Stakeholder section', () => {
    it('renders stakeholder cards with correct section id', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const stakeholder = sections.find(s => s.id === 'stakeholder-perspectives');
      expect(stakeholder).toBeDefined();
      expect(stakeholder!.className).toBe('stakeholder-section');
    });

    it('uses h3 (not h4) for card headings under h2 section heading', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'stakeholder-perspectives')!.html;
      expect(html).toContain('<h2>');
      expect(html).toContain('<h3>');
      expect(html).not.toContain('<h4>');
    });

    it('renders per-language stakeholder labels', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'fr');
      const html = sections.find(s => s.id === 'stakeholder-perspectives')!.html;
      expect(html).toContain('Coalition gouvernementale');
      expect(html).toContain("Bloc d'opposition");
    });

    it('renders all 6 stakeholder perspectives', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'stakeholder-perspectives')!.html;
      expect(html).toContain('Government Coalition');
      expect(html).toContain('Opposition Bloc');
      expect(html).toContain('Citizens');
      expect(html).toContain('Business/Economy');
      expect(html).toContain('International/EU');
      expect(html).toContain('Media/Public Opinion');
    });

    it('wraps stakeholder emoji icons in aria-hidden', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'stakeholder-perspectives')!.html;
      expect(html).toContain('aria-hidden="true">🏛️</span>');
      expect(html).toContain('aria-hidden="true">⚔️</span>');
      expect(html).toContain('aria-hidden="true">📊</span>');
    });
  });

  // -----------------------------------------------------------------------
  // Risk & Threat section
  // -----------------------------------------------------------------------
  describe('Risk & Threat section', () => {
    it('renders risk section with correct id', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const risk = sections.find(s => s.id === 'risk-assessment');
      expect(risk).toBeDefined();
      expect(risk!.className).toBe('risk-section');
    });

    it('includes democratic health badge', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'risk-assessment')!.html;
      expect(html).toContain('democratic-health');
      expect(html).toContain('MEDIUM');
      expect(html).toContain('🟡');
    });

    it('renders AT_RISK democratic health with red badge', () => {
      const enrichment = fullEnrichment({ democraticHealth: 'AT_RISK' });
      const sections = buildAnalysisEnrichmentSections(enrichment, 'en');
      const html = sections.find(s => s.id === 'risk-assessment')!.html;
      expect(html).toContain('AT_RISK');
      expect(html).toContain('🔴');
    });

    it('wraps democratic health emoji in aria-hidden', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'risk-assessment')!.html;
      expect(html).toContain('aria-hidden="true">🟡</span>');
    });

    it('wraps threat indicator emoji in aria-hidden', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'risk-assessment')!.html;
      expect(html).toContain('aria-hidden="true">🎯</span>');
    });

    it('renders threat indicators list', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'risk-assessment')!.html;
      expect(html).toContain('Rising polarisation');
      expect(html).toContain('Coalition stress');
    });

    it('renders localized risk labels for Swedish', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'sv');
      const html = sections.find(s => s.id === 'risk-assessment')!.html;
      expect(html).toContain('Risk- och hotbedömning');
      expect(html).toContain('Demokratisk hälsa');
      expect(html).toContain('Hotindikatorer');
    });
  });

  // -----------------------------------------------------------------------
  // Forward Indicators section
  // -----------------------------------------------------------------------
  describe('Forward Indicators section', () => {
    it('renders forward indicators with correct id', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const forward = sections.find(s => s.id === 'forward-indicators');
      expect(forward).toBeDefined();
      expect(forward!.className).toBe('forward-section');
    });

    it('lists forward indicator items', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'forward-indicators')!.html;
      expect(html).toContain('Committee vote on May 5');
      expect(html).toContain('EU summit June 12');
    });

    it('renders localized heading for German', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'de');
      const html = sections.find(s => s.id === 'forward-indicators')!.html;
      expect(html).toContain('Was kommt als Nächstes?');
    });

    it('wraps forward indicator emoji in aria-hidden', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'forward-indicators')!.html;
      expect(html).toContain('aria-hidden="true">🔮</span>');
    });
  });

  // -----------------------------------------------------------------------
  // Significance table section
  // -----------------------------------------------------------------------
  describe('Significance table section', () => {
    it('renders significance table with correct id', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const sig = sections.find(s => s.id === 'significance-ranking');
      expect(sig).toBeDefined();
      expect(sig!.className).toBe('significance-section');
    });

    it('renders table with doc IDs and scores', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'significance-ranking')!.html;
      expect(html).toContain('H901AU10');
      expect(html).toContain('85');
      expect(html).toContain('H901FiU1');
      expect(html).toContain('72');
    });

    it('renders localized table headers for Swedish', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'sv');
      const html = sections.find(s => s.id === 'significance-ranking')!.html;
      expect(html).toContain('Dok-ID');
      expect(html).toContain('Poäng');
      expect(html).toContain('Motivering');
    });

    it('applies score-high/medium/low CSS classes based on score value', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'significance-ranking')!.html;
      expect(html).toContain('score-high');  // 85 >= 80
      expect(html).toContain('score-medium'); // 72 >= 50
    });

    it('uses role=table and aria-label for accessibility', () => {
      const sections = buildAnalysisEnrichmentSections(fullEnrichment(), 'en');
      const html = sections.find(s => s.id === 'significance-ranking')!.html;
      expect(html).toContain('role="table"');
      expect(html).toContain('aria-label="Most Significant Documents"');
    });
  });

  // -----------------------------------------------------------------------
  // All 14 languages produce sections
  // -----------------------------------------------------------------------
  describe('14-language coverage', () => {
    const ALL_LANGUAGES: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

    for (const lang of ALL_LANGUAGES) {
      it(`renders all 5 sections for lang="${lang}"`, () => {
        const sections = buildAnalysisEnrichmentSections(fullEnrichment(), lang);
        expect(sections.length).toBe(5);
        expect(sections.map(s => s.id)).toEqual([
          'swot-analysis',
          'stakeholder-perspectives',
          'risk-assessment',
          'forward-indicators',
          'significance-ranking',
        ]);
      });
    }
  });
});
