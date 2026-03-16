/**
 * Integration tests for the document analysis framework + content generator bridge.
 *
 * Validates:
 * - analyzeDocumentsForContent() returns both framework and perspective analyses
 * - generateDeepAnalysisSection() renders PESTLE, stakeholder, risk, and
 *   implementation sections when frameworkAnalysis is provided
 * - generateDeepAnalysisSection() renders perspective insights when
 *   perspectiveAnalysis is provided
 * - Content generators produce framework-enriched deep analysis sections
 * - 14-language label support for new framework sections
 * - Graceful degradation when frameworkAnalysis is not provided
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDeepAnalysisSection,
  analyzeDocumentsForContent,
} from '../scripts/data-transformers/content-generators/shared.js';
import { clearAnalysisCache } from '../scripts/ai-analysis/document-analyzer.js';
import type { RawDocument, CIAContext } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const propDoc: RawDocument = {
  dok_id: 'H9031',
  doktyp: 'prop',
  titel: 'Proposition om hälso- och sjukvårdsreform',
  datum: '2026-02-01',
  organ: 'SoU',
  fullText: 'Denna proposition innehåller förslag till reform av hälso- och sjukvården i Sverige.',
};

const motionDoc: RawDocument = {
  dok_id: 'H902S123',
  doktyp: 'mot',
  titel: 'Motion om miljöpolitik och klimatförändringar',
  parti: 'MP',
  datum: '2026-01-15',
  fullText: 'Vi föreslår att Sverige stärker sin klimatpolitik och miljöskyddslagar.',
};

const euDoc: RawDocument = {
  dok_id: 'H903EU01',
  doktyp: 'prop',
  titel: 'Proposition om EU-direktiv implementering',
  organ: 'UU',
  datum: '2026-02-10',
  fullText: 'Implementering av EU-direktiv rörande digitala tjänster och internationell handel.',
};

const ciaContext = {
  coalitionStability: {
    stabilityScore: 65,
    defectionProbability: 0.15,
    majorityMargin: 3,
  },
  partyPerformance: [
    { id: 'M', partyName: 'M', metrics: { cohesionScore: 85, seats: 68, successRate: 0.9, motionsSubmitted: 20, motionsPassed: 18, motionApprovalRate: 0.02, questions: 0 }, trends: { supportTrend: 'stable', activityTrend: 'increasing' } },
    { id: 'KD', partyName: 'KD', metrics: { cohesionScore: 80, seats: 19, successRate: 0.85, motionsSubmitted: 10, motionsPassed: 8, motionApprovalRate: 0.01, questions: 0 }, trends: { supportTrend: 'stable', activityTrend: 'stable' } },
    { id: 'S', partyName: 'S', metrics: { cohesionScore: 90, seats: 107, successRate: 0.1, motionsSubmitted: 50, motionsPassed: 5, motionApprovalRate: 0.05, questions: 0 }, trends: { supportTrend: 'increasing', activityTrend: 'increasing' } },
  ],
  votingPatterns: {},
  overallMotionDenialRate: 0.95,
} as unknown as CIAContext;

beforeEach(() => {
  clearAnalysisCache();
});

// ---------------------------------------------------------------------------
// analyzeDocumentsForContent bridge
// ---------------------------------------------------------------------------

describe('analyzeDocumentsForContent', () => {
  it('should return both frameworkAnalysis and perspectiveAnalysis', () => {
    const result = analyzeDocumentsForContent([propDoc, motionDoc], 'en');
    expect(result.frameworkAnalysis).toBeInstanceOf(Map);
    expect(result.frameworkAnalysis.size).toBeGreaterThan(0);
    expect(result.perspectiveAnalysis).toBeDefined();
    expect(result.perspectiveAnalysis.results).toBeInstanceOf(Array);
    expect(result.perspectiveAnalysis.results.length).toBe(2);
  });

  it('should produce framework analyses with all required fields', () => {
    const { frameworkAnalysis } = analyzeDocumentsForContent([propDoc], 'en', ciaContext);
    const analyses = [...frameworkAnalysis.values()];
    expect(analyses.length).toBe(1);
    const analysis = analyses[0];

    // All key fields from DocumentAnalysis
    expect(analysis.executiveSummary).toBeTruthy();
    expect(analysis.stakeholderImpacts.length).toBeGreaterThanOrEqual(3);
    expect(analysis.pestleDimensions.political.length).toBeGreaterThan(0);
    expect(analysis.pestleDimensions.economic.length).toBeGreaterThan(0);
    expect(analysis.policyDomains.length).toBeGreaterThan(0);
    expect(analysis.coalitionDynamics).toBeDefined();
    expect(analysis.historicalContext.precedents.length).toBeGreaterThan(0);
    expect(analysis.implementationAssessment).toBeDefined();
    expect(analysis.riskAssessment.length).toBeGreaterThan(0);
    expect(analysis.confidenceScores).toBeInstanceOf(Map);
    expect(analysis.iterations.length).toBe(4);
  });

  it('should produce perspective analyses with 6 lenses per document', () => {
    const { perspectiveAnalysis } = analyzeDocumentsForContent([propDoc], 'en');
    expect(perspectiveAnalysis.results.length).toBe(1);
    const result = perspectiveAnalysis.results[0];
    expect(result.perspectives.length).toBe(6);
    const lenses = result.perspectives.map(p => p.lens);
    expect(lenses).toContain('government');
    expect(lenses).toContain('opposition');
    expect(lenses).toContain('citizen');
    expect(lenses).toContain('economic');
    expect(lenses).toContain('international');
    expect(lenses).toContain('media');
  });

  it('should work with CIA context', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'en', ciaContext,
    );
    expect(frameworkAnalysis.size).toBe(2);
    expect(perspectiveAnalysis.results.length).toBe(2);
  });

  it('should support multiple languages', () => {
    for (const lang of ['en', 'sv', 'de', 'ja', 'ar']) {
      const { frameworkAnalysis } = analyzeDocumentsForContent([propDoc], lang);
      const analysis = [...frameworkAnalysis.values()][0];
      // Stakeholder display names should be localised
      expect(analysis.stakeholderImpacts[0].displayName).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// generateDeepAnalysisSection with framework analysis
// ---------------------------------------------------------------------------

describe('generateDeepAnalysisSection with framework analysis', () => {
  it('should render PESTLE analysis section when frameworkAnalysis is provided', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'en',
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'en',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('PESTLE Analysis');
    expect(html).toContain('pestle-analysis');
    expect(html).toContain('Political');
    expect(html).toContain('Economic');
  });

  it('should render stakeholder impact section', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'en',
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'en',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('Stakeholder Impact');
    expect(html).toContain('stakeholder-impact-list');
    expect(html).toContain('Government Coalition');
  });

  it('should render risk assessment section', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'en', ciaContext,
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'en',
      cia: ciaContext,
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('Risk Assessment');
    expect(html).toContain('risk-assessment-list');
  });

  it('should render implementation assessment section', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'en',
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'en',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('Implementation Assessment');
    expect(html).toContain('Feasibility');
  });

  it('should render perspective insights from 6-lens analysis', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'en',
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'en',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('perspective-insights');
  });

  it('should NOT render framework sections when frameworkAnalysis is undefined', () => {
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'en',
      articleType: 'generic',
    });
    expect(html).not.toContain('pestle-analysis');
    expect(html).not.toContain('stakeholder-impact-list');
    expect(html).not.toContain('risk-assessment-list');
    expect(html).not.toContain('perspective-insights');
    // But standard deep analysis sections should still be present
    expect(html).toContain('deep-analysis');
  });

  it('should use Swedish labels when lang is sv', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'sv',
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'sv',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('PESTLE-analys');
    expect(html).toContain('Intressentpåverkan');
    expect(html).toContain('Riskbedömning');
    expect(html).toContain('Genomförandebedömning');
  });

  it('should use German labels when lang is de', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc, motionDoc], 'de',
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc, motionDoc],
      lang: 'de',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('PESTLE-Analyse');
    expect(html).toContain('Auswirkung auf Interessengruppen');
  });

  it('should handle single-document deep-inspection analysis', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [propDoc], 'en', ciaContext,
    );
    const html = generateDeepAnalysisSection({
      documents: [propDoc],
      lang: 'en',
      cia: ciaContext,
      articleType: 'deep-inspection',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('deep-analysis');
    expect(html).toContain('pestle-analysis');
    expect(html).toContain('stakeholder-impact-list');
  });

  it('should properly escape HTML in rendered content', () => {
    const maliciousDoc: RawDocument = {
      dok_id: 'TEST01',
      doktyp: 'prop',
      titel: 'Test <script>alert("xss")</script>',
      datum: '2026-01-01',
    };
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [maliciousDoc, propDoc], 'en',
    );
    const html = generateDeepAnalysisSection({
      documents: [maliciousDoc, propDoc],
      lang: 'en',
      articleType: 'generic',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).not.toContain('<script>');
  });

  it('should handle EU-dimension documents with legal risk assessment', () => {
    const { frameworkAnalysis, perspectiveAnalysis } = analyzeDocumentsForContent(
      [euDoc, propDoc], 'en',
    );
    const html = generateDeepAnalysisSection({
      documents: [euDoc, propDoc],
      lang: 'en',
      articleType: 'propositions',
      frameworkAnalysis,
      perspectiveAnalysis,
    });
    expect(html).toContain('deep-analysis');
    expect(html).toContain('pestle-analysis');
  });
});

// ---------------------------------------------------------------------------
// Confidence and iteration metadata
// ---------------------------------------------------------------------------

describe('Framework analysis confidence and iterations', () => {
  it('should include confidence scores for all dimensions', () => {
    const { frameworkAnalysis } = analyzeDocumentsForContent([propDoc], 'en', ciaContext);
    const analysis = [...frameworkAnalysis.values()][0];
    expect(analysis.confidenceScores.size).toBeGreaterThanOrEqual(5);
    expect(analysis.confidenceScores.has('executiveSummary')).toBe(true);
    expect(analysis.confidenceScores.has('stakeholderImpacts')).toBe(true);
    expect(analysis.confidenceScores.has('pestleDimensions')).toBe(true);
    expect(analysis.confidenceScores.has('riskAssessment')).toBe(true);
  });

  it('should record 4 analysis iterations', () => {
    const { frameworkAnalysis } = analyzeDocumentsForContent([propDoc], 'en');
    const analysis = [...frameworkAnalysis.values()][0];
    expect(analysis.iterations.length).toBe(4);
    expect(analysis.iterations[0].label).toBe('generation');
    expect(analysis.iterations[1].label).toBe('deepening');
    expect(analysis.iterations[2].label).toBe('stakeholder-review');
    expect(analysis.iterations[3].label).toBe('synthesis');
  });

  it('should have 3+ stakeholder groups including always-included groups', () => {
    const { frameworkAnalysis } = analyzeDocumentsForContent([propDoc], 'en');
    const analysis = [...frameworkAnalysis.values()][0];
    expect(analysis.stakeholderImpacts.length).toBeGreaterThanOrEqual(3);
    // Government, opposition, and citizens are always included
    const groups = analysis.stakeholderImpacts.map(s => s.stakeholder);
    expect(groups).toContain('government-coalition');
    expect(groups).toContain('opposition-parties');
    expect(groups).toContain('citizens-voters');
  });
});
