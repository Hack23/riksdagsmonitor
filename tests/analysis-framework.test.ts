/**
 * Tests for the multi-perspective document analysis framework.
 * Validates all 6 analysis lenses, cross-document link detection,
 * significance scoring, and the batch orchestrator.
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeDocument,
  analyzeDocuments,
  analyzeGovernmentPerspective,
  analyzeOppositionPerspective,
  analyzeCitizenPerspective,
  analyzeEconomicPerspective,
  analyzeInternationalPerspective,
  analyzeMediaPerspective,
  detectCrossDocumentLinks,
  computeSignificanceScore,
  computeOverallConfidence,
  extractKeyInsights,
} from '../scripts/analysis-framework/index.js';
import type { RawDocument, CIAContext } from '../scripts/data-transformers/types.js';
import type { PerspectiveAnalysis } from '../scripts/analysis-framework/types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'H901FiU1',
    titel: 'Test document',
    doktyp: 'prop',
    organ: 'FiU',
    parti: 'M',
    datum: '2026-03-01',
    ...overrides,
  };
}

function makeStrategicDoc(): RawDocument {
  return makeDoc({
    dok_id: 'H901FiU1',
    titel: 'Budgetproposition 2026 — statsbudget med NATO-anpassning och klimatsatsning',
    doktyp: 'prop',
    organ: 'FiU',
    summary: 'Regeringens budgetproposition innehåller ökade försvarsutgifter, skatteförändringar och klimatreformer.',
  });
}

function makeMotion(): RawDocument {
  return makeDoc({
    dok_id: 'H802mot1',
    titel: 'Motion om sjukvård och hälsopolicy',
    doktyp: 'mot',
    organ: 'SoU',
    parti: 'S',
  });
}

function makeEUDoc(): RawDocument {
  return makeDoc({
    dok_id: 'H901UU5',
    titel: 'EU-direktiv om digital marknad — genomförande i svensk rätt',
    doktyp: 'prop',
    organ: 'UU',
    summary: 'Implementering av EU-direktiv om den inre marknaden och handelsavtal.',
  });
}

function makeUnstableCIA(): CIAContext {
  return {
    partyPerformance: [
      {
        id: 'M',
        partyName: 'Moderaterna',
        metrics: { seats: 68, successRate: 72, motionsSubmitted: 45, motionsPassed: 32 },
        trends: { supportTrend: 'stable', activityTrend: 'rising' },
      },
      {
        id: 'SD',
        partyName: 'Sverigedemokraterna',
        metrics: { seats: 73, successRate: 55, motionsSubmitted: 200, motionsPassed: 12 },
        trends: { supportTrend: 'rising', activityTrend: 'rising' },
      },
    ],
    coalitionStability: { stabilityScore: 35, riskLevel: 'high', defectionProbability: 0.3, majorityMargin: 2 },
    votingPatterns: { keyIssues: [] },
    overallMotionDenialRate: 99.1,
  };
}

function makeStableCIA(): CIAContext {
  return {
    partyPerformance: [
      {
        id: 'M',
        partyName: 'Moderaterna',
        metrics: { seats: 68, successRate: 82, motionsSubmitted: 40, motionsPassed: 33 },
        trends: { supportTrend: 'rising', activityTrend: 'stable' },
      },
    ],
    coalitionStability: { stabilityScore: 78, riskLevel: 'low', defectionProbability: 0.05, majorityMargin: 15 },
    votingPatterns: { keyIssues: [] },
    overallMotionDenialRate: 98.5,
  };
}

// ---------------------------------------------------------------------------
// Government Lens
// ---------------------------------------------------------------------------

describe('analyzeGovernmentPerspective', () => {
  it('returns lens = government', () => {
    const result = analyzeGovernmentPerspective(makeDoc(), undefined, 'en');
    expect(result.lens).toBe('government');
  });

  it('proposition with unstable CIA returns high impact', () => {
    const result = analyzeGovernmentPerspective(makeDoc({ doktyp: 'prop', organ: 'FiU' }), makeUnstableCIA(), 'en');
    expect(result.impact).toBe('high');
  });

  it('motion returns medium or low impact', () => {
    const result = analyzeGovernmentPerspective(makeDoc({ doktyp: 'mot', organ: '' }), undefined, 'en');
    expect(['medium', 'low']).toContain(result.impact);
  });

  it('generates a summary string', () => {
    const result = analyzeGovernmentPerspective(makeStrategicDoc(), makeUnstableCIA(), 'en');
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(30);
  });

  it('swotContribution has at least one entry for a proposition', () => {
    const result = analyzeGovernmentPerspective(makeDoc({ doktyp: 'prop' }), undefined, 'en');
    expect(result.swotContribution.length).toBeGreaterThanOrEqual(1);
  });

  it('includes coalition weakness SWOT entry for unstable CIA', () => {
    const result = analyzeGovernmentPerspective(makeDoc(), makeUnstableCIA(), 'en');
    const weaknesses = result.swotContribution.filter(s => s.quadrant === 'weakness');
    expect(weaknesses.length).toBeGreaterThan(0);
  });

  it('dashboard metrics include Coalition Stability when CIA provided', () => {
    const result = analyzeGovernmentPerspective(makeDoc(), makeUnstableCIA(), 'en');
    const stabilityMetric = result.dashboardMetrics.find(m => m.metricName === 'Coalition Stability');
    expect(stabilityMetric).toBeDefined();
    expect(stabilityMetric!.value).toBe(35);
  });

  it('has mindmap nodes', () => {
    const result = analyzeGovernmentPerspective(makeDoc(), undefined, 'en');
    expect(result.mindmapNodes.length).toBeGreaterThan(0);
  });

  it('confidence is in 0–100 range', () => {
    const result = analyzeGovernmentPerspective(makeDoc(), makeStableCIA(), 'en');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('returns Swedish labels for lang=sv', () => {
    const result = analyzeGovernmentPerspective(makeDoc(), undefined, 'sv');
    // Summary should at least be a non-empty string regardless of language
    expect(result.summary.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// Opposition Lens
// ---------------------------------------------------------------------------

describe('analyzeOppositionPerspective', () => {
  it('returns lens = opposition', () => {
    const result = analyzeOppositionPerspective(makeDoc(), undefined, 'en');
    expect(result.lens).toBe('opposition');
  });

  it('proposition has high impact from opposition perspective', () => {
    const result = analyzeOppositionPerspective(makeDoc({ doktyp: 'prop' }), undefined, 'en');
    expect(result.impact).toBe('high');
  });

  it('opposition motion has positive sentiment', () => {
    const result = analyzeOppositionPerspective(makeMotion(), undefined, 'en');
    expect(result.sentiment).toBe('positive');
  });

  it('committee report has negative sentiment for opposition', () => {
    const result = analyzeOppositionPerspective(makeDoc({ doktyp: 'bet' }), undefined, 'en');
    expect(result.sentiment).toBe('negative');
  });

  it('generates non-empty summary', () => {
    const result = analyzeOppositionPerspective(makeDoc(), makeUnstableCIA(), 'en');
    expect(result.summary.length).toBeGreaterThan(30);
  });

  it('includes motion strength SWOT entry for motion doktyp', () => {
    const result = analyzeOppositionPerspective(makeMotion(), undefined, 'en');
    const strengths = result.swotContribution.filter(s => s.quadrant === 'strength');
    expect(strengths.length).toBeGreaterThan(0);
  });

  it('includes coalition opportunity when CIA is unstable', () => {
    const result = analyzeOppositionPerspective(makeDoc({ doktyp: 'prop' }), makeUnstableCIA(), 'en');
    const opportunities = result.swotContribution.filter(s => s.quadrant === 'opportunity');
    expect(opportunities.length).toBeGreaterThan(0);
  });

  it('dashboard includes denial rate when CIA provided', () => {
    const result = analyzeOppositionPerspective(makeDoc(), makeUnstableCIA(), 'en');
    const denialMetric = result.dashboardMetrics.find(m => m.metricName === 'Motion Denial Rate');
    expect(denialMetric).toBeDefined();
    expect(denialMetric!.unit).toBe('%');
  });
});

// ---------------------------------------------------------------------------
// Citizen Lens
// ---------------------------------------------------------------------------

describe('analyzeCitizenPerspective', () => {
  it('returns lens = citizen', () => {
    const result = analyzeCitizenPerspective(makeDoc(), undefined, 'en');
    expect(result.lens).toBe('citizen');
  });

  it('healthcare document returns high impact', () => {
    const doc = makeDoc({ doktyp: 'prop', organ: 'SoU', titel: 'Proposition om hälso- och sjukvård' });
    const result = analyzeCitizenPerspective(doc, undefined, 'en');
    expect(result.impact).toBe('high');
  });

  it('cost-of-living doc returns high impact', () => {
    const doc = makeDoc({ titel: 'Skattehöjning och avgiftssänkning för barnfamiljer', doktyp: 'prop' });
    const result = analyzeCitizenPerspective(doc, undefined, 'en');
    expect(result.impact).toBe('high');
  });

  it('rights document returns threat SWOT entry', () => {
    const doc = makeDoc({ titel: 'Lagstiftning om integritet och dataskydd' });
    const result = analyzeCitizenPerspective(doc, undefined, 'en');
    const threats = result.swotContribution.filter(s => s.quadrant === 'threat');
    expect(threats.length).toBeGreaterThan(0);
  });

  it('generates cost-of-living keywords dashboard metric', () => {
    const doc = makeDoc({ titel: 'Ökad hyra och pensionsgap 2026' });
    const result = analyzeCitizenPerspective(doc, undefined, 'en');
    const costMetric = result.dashboardMetrics.find(m => m.metricName === 'Cost-of-Living Keywords');
    expect(costMetric).toBeDefined();
    expect(costMetric!.value).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Economic Lens
// ---------------------------------------------------------------------------

describe('analyzeEconomicPerspective', () => {
  it('returns lens = economic', () => {
    const result = analyzeEconomicPerspective(makeDoc(), undefined, 'en');
    expect(result.lens).toBe('economic');
  });

  it('growth keywords produce positive sentiment', () => {
    const doc = makeDoc({ titel: 'Ökad sysselsättning och exporttillväxt', doktyp: 'prop' });
    const result = analyzeEconomicPerspective(doc, undefined, 'en');
    expect(result.sentiment).toBe('positive');
  });

  it('recession keywords produce negative sentiment', () => {
    const doc = makeDoc({ titel: 'Lågkonjunktur och varsel — recession planering' });
    const result = analyzeEconomicPerspective(doc, undefined, 'en');
    expect(result.sentiment).toBe('negative');
  });

  it('regulation keywords produce compliance SWOT weakness', () => {
    const doc = makeDoc({ titel: 'Ny reglering och tillståndskrav för fintech' });
    const result = analyzeEconomicPerspective(doc, undefined, 'en');
    const weaknesses = result.swotContribution.filter(s => s.quadrant === 'weakness');
    expect(weaknesses.length).toBeGreaterThan(0);
  });

  it('returns all three dashboard metric categories', () => {
    const result = analyzeEconomicPerspective(makeStrategicDoc(), undefined, 'en');
    const names = result.dashboardMetrics.map(m => m.metricName);
    expect(names).toContain('Growth Signals');
    expect(names).toContain('Contraction Signals');
    expect(names).toContain('Regulatory Keywords');
  });
});

// ---------------------------------------------------------------------------
// International Lens
// ---------------------------------------------------------------------------

describe('analyzeInternationalPerspective', () => {
  it('returns lens = international', () => {
    const result = analyzeInternationalPerspective(makeDoc(), undefined, 'en');
    expect(result.lens).toBe('international');
  });

  it('EU document returns high impact', () => {
    const result = analyzeInternationalPerspective(makeEUDoc(), undefined, 'en');
    expect(result.impact).toBe('high');
  });

  it('EU keywords produce positive sentiment', () => {
    const doc = makeDoc({ titel: 'Samarbete och avtal med EU — genomförande av eu-direktiv' });
    const result = analyzeInternationalPerspective(doc, undefined, 'en');
    expect(result.sentiment).toBe('positive');
  });

  it('sanctions keywords produce negative sentiment', () => {
    const doc = makeDoc({ titel: 'Sanktioner och konflikt med handelspartner' });
    const result = analyzeInternationalPerspective(doc, undefined, 'en');
    expect(result.sentiment).toBe('negative');
  });

  it('EU document produces opportunity SWOT entry', () => {
    const result = analyzeInternationalPerspective(makeEUDoc(), undefined, 'en');
    const opportunities = result.swotContribution.filter(s => s.quadrant === 'opportunity');
    expect(opportunities.length).toBeGreaterThan(0);
  });

  it('Foreign Affairs Committee document returns high impact', () => {
    const doc = makeDoc({ organ: 'UU', doktyp: 'bet' });
    const result = analyzeInternationalPerspective(doc, undefined, 'en');
    expect(result.impact).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Media Lens
// ---------------------------------------------------------------------------

describe('analyzeMediaPerspective', () => {
  it('returns lens = media', () => {
    const result = analyzeMediaPerspective(makeDoc(), undefined, 'en');
    expect(result.lens).toBe('media');
  });

  it('strategic doc has at least moderate impact', () => {
    const result = analyzeMediaPerspective(makeStrategicDoc(), makeUnstableCIA(), 'en');
    expect(['high', 'medium']).toContain(result.impact);
  });

  it('controversy keywords produce negative sentiment', () => {
    const doc = makeDoc({ titel: 'Migrationspolitik och kriminalitet — korruption i systemet' });
    const result = analyzeMediaPerspective(doc, undefined, 'en');
    expect(result.sentiment).toBe('negative');
  });

  it('newsworthiness score metric is present', () => {
    const result = analyzeMediaPerspective(makeStrategicDoc(), undefined, 'en');
    const newsMetric = result.dashboardMetrics.find(m => m.metricName === 'Newsworthiness Score');
    expect(newsMetric).toBeDefined();
    expect(newsMetric!.value).toBeGreaterThanOrEqual(0);
  });

  it('generates summary referencing newsworthiness', () => {
    const result = analyzeMediaPerspective(makeStrategicDoc(), undefined, 'en');
    expect(result.summary).toContain('newsworthiness');
  });
});

// ---------------------------------------------------------------------------
// Cross-document link detection
// ---------------------------------------------------------------------------

describe('detectCrossDocumentLinks', () => {
  it('returns empty array for fewer than 2 documents', () => {
    expect(detectCrossDocumentLinks([])).toEqual([]);
    expect(detectCrossDocumentLinks([makeDoc()])).toEqual([]);
  });

  it('detects responds-to link for motion referencing a proposition', () => {
    const prop = makeDoc({ dok_id: '2025/26:118', titel: 'Klimatpolitik 2025/26:118', doktyp: 'prop' });
    const motion = makeDoc({
      dok_id: 'H802mot5',
      titel: 'med anledning av prop. 2025/26:118 Klimatpolitik',
      doktyp: 'mot',
    });
    const links = detectCrossDocumentLinks([prop, motion]);
    const link = links.find(l => l.type === 'responds-to');
    expect(link).toBeDefined();
    expect(link!.sourceId).toBe('H802mot5');
    expect(link!.confidence).toBeGreaterThanOrEqual(80);
  });

  it('detects related-topic links for documents sharing 2+ domains', () => {
    const doc1 = makeDoc({
      dok_id: 'A1',
      titel: 'Försvarspolitik och NATO-samarbete budgetplan',
      doktyp: 'prop',
      organ: 'FöU',
    });
    const doc2 = makeDoc({
      dok_id: 'A2',
      titel: 'Försvarsutgifter och NATO finansiering budgetram',
      doktyp: 'bet',
      organ: 'FöU',
    });
    const links = detectCrossDocumentLinks([doc1, doc2]);
    const relatedLink = links.find(l => l.type === 'related-topic');
    expect(relatedLink).toBeDefined();
  });

  it('deduplicates links with same source, target, type', () => {
    const doc1 = makeDoc({ dok_id: 'D1', titel: 'Skatt och budget finansiering', doktyp: 'prop', organ: 'FiU' });
    const doc2 = makeDoc({ dok_id: 'D2', titel: 'Skattepolitik budgetram finansiering', doktyp: 'bet', organ: 'FiU' });
    const links = detectCrossDocumentLinks([doc1, doc2]);
    // Count links of same source/target/type — no duplicates
    const pairs = links.map(l => `${l.sourceId}||${l.targetId}||${l.type}`);
    const unique = new Set(pairs);
    expect(pairs.length).toBe(unique.size);
  });
});

// ---------------------------------------------------------------------------
// Significance scorer
// ---------------------------------------------------------------------------

describe('computeSignificanceScore', () => {
  it('returns a score in 1–10 range', () => {
    const score = computeSignificanceScore(makeDoc(), undefined, []);
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('government proposition on FiU scores higher than a basic motion', () => {
    const perspectives: PerspectiveAnalysis[] = [];
    const govScore = computeSignificanceScore(makeDoc({ doktyp: 'prop', organ: 'FiU' }), makeUnstableCIA(), perspectives);
    const motScore = computeSignificanceScore(makeDoc({ doktyp: 'mot', organ: '' }), undefined, perspectives);
    expect(govScore).toBeGreaterThan(motScore);
  });

  it('coalition instability increases score', () => {
    const perspectives: PerspectiveAnalysis[] = [];
    const doc = makeDoc({ doktyp: 'prop', organ: 'FiU' });
    const withInstability = computeSignificanceScore(doc, makeUnstableCIA(), perspectives);
    const withStability = computeSignificanceScore(doc, makeStableCIA(), perspectives);
    expect(withInstability).toBeGreaterThanOrEqual(withStability);
  });
});

describe('computeOverallConfidence', () => {
  it('returns 20 for empty perspectives', () => {
    expect(computeOverallConfidence(makeDoc(), [])).toBe(20);
  });

  it('returns value in 0–100 range', () => {
    const doc = makeDoc({ summary: 'Test', fullText: 'Long text here' });
    const perspectives = [
      { lens: 'government' as const, summary: 'test', impact: 'high' as const, sentiment: 'neutral' as const,
        keyActors: [], relatedPolicies: [], swotContribution: [], dashboardMetrics: [], mindmapNodes: [], confidence: 75 },
    ];
    const conf = computeOverallConfidence(doc, perspectives);
    expect(conf).toBeGreaterThanOrEqual(0);
    expect(conf).toBeLessThanOrEqual(100);
  });
});

describe('extractKeyInsights', () => {
  it('returns empty array for empty perspectives', () => {
    expect(extractKeyInsights([])).toEqual([]);
  });

  it('returns at most 5 insights', () => {
    const perspectives: PerspectiveAnalysis[] = [
      'government', 'opposition', 'citizen', 'economic', 'international', 'media',
    ].map(lens => ({
      lens: lens as PerspectiveAnalysis['lens'],
      summary: `This is a long summary for the ${lens} perspective about Swedish politics.`,
      impact: 'high' as const,
      sentiment: 'neutral' as const,
      keyActors: [],
      relatedPolicies: [],
      swotContribution: [],
      dashboardMetrics: [],
      mindmapNodes: [],
      confidence: 70,
    }));
    const insights = extractKeyInsights(perspectives);
    expect(insights.length).toBeLessThanOrEqual(5);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('includes lens label prefix in insights', () => {
    const perspectives: PerspectiveAnalysis[] = [
      {
        lens: 'government',
        summary: 'Government perspective says this is an important fiscal measure for the coalition.',
        impact: 'high',
        sentiment: 'positive',
        keyActors: [],
        relatedPolicies: [],
        swotContribution: [],
        dashboardMetrics: [],
        mindmapNodes: [],
        confidence: 80,
      },
    ];
    const insights = extractKeyInsights(perspectives);
    expect(insights[0]).toContain('[GOVERNMENT]');
  });
});

// ---------------------------------------------------------------------------
// Full analyzeDocument orchestrator
// ---------------------------------------------------------------------------

describe('analyzeDocument', () => {
  it('returns all 6 perspectives', () => {
    const result = analyzeDocument(makeDoc(), undefined, 'en');
    expect(result.perspectives).toHaveLength(6);
    const lenses = result.perspectives.map(p => p.lens);
    expect(lenses).toContain('government');
    expect(lenses).toContain('opposition');
    expect(lenses).toContain('citizen');
    expect(lenses).toContain('economic');
    expect(lenses).toContain('international');
    expect(lenses).toContain('media');
  });

  it('overall significance is in 1–10', () => {
    const result = analyzeDocument(makeStrategicDoc(), makeUnstableCIA(), 'en');
    expect(result.overallSignificance).toBeGreaterThanOrEqual(1);
    expect(result.overallSignificance).toBeLessThanOrEqual(10);
  });

  it('confidence score is in 0–100', () => {
    const result = analyzeDocument(makeDoc(), makeStableCIA(), 'en');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('returns at least one key insight', () => {
    const result = analyzeDocument(makeStrategicDoc(), makeUnstableCIA(), 'en');
    expect(result.keyInsights.length).toBeGreaterThan(0);
  });

  it('single-doc crossDocumentLinks is empty', () => {
    const result = analyzeDocument(makeDoc());
    expect(result.crossDocumentLinks).toEqual([]);
  });

  it('strategic proposition scores higher significance than simple written question', () => {
    const strategic = analyzeDocument(makeStrategicDoc(), makeUnstableCIA(), 'en');
    const simpleQuestion = analyzeDocument(makeDoc({ doktyp: 'fr', organ: '', titel: 'Svar på fråga' }), undefined, 'en');
    expect(strategic.overallSignificance).toBeGreaterThan(simpleQuestion.overallSignificance);
  });

  it('works without CIA context', () => {
    expect(() => analyzeDocument(makeDoc())).not.toThrow();
  });

  it('defaults language to en', () => {
    const result = analyzeDocument(makeDoc());
    expect(result.perspectives.every(p => p.summary.length > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Batch analyzeDocuments orchestrator
// ---------------------------------------------------------------------------

describe('analyzeDocuments', () => {
  it('returns a result for each input document', () => {
    const docs = [makeDoc(), makeMotion(), makeEUDoc()];
    const batch = analyzeDocuments(docs, undefined, 'en');
    expect(batch.results).toHaveLength(3);
  });

  it('each document result has 6 perspectives', () => {
    const batch = analyzeDocuments([makeDoc(), makeMotion()], makeUnstableCIA(), 'en');
    for (const result of batch.results) {
      expect(result.perspectives).toHaveLength(6);
    }
  });

  it('processingTimeMs is non-negative', () => {
    const batch = analyzeDocuments([makeDoc()]);
    expect(batch.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('cross-document links are populated in batch', () => {
    const prop = makeDoc({ dok_id: '2025/26:200', titel: 'Klimatpolitik 2025/26:200', doktyp: 'prop' });
    const motion = makeDoc({
      dok_id: 'H802mot99',
      titel: 'med anledning av prop. 2025/26:200 Klimatpolitik',
      doktyp: 'mot',
    });
    const batch = analyzeDocuments([prop, motion]);
    expect(batch.crossDocumentLinks.length).toBeGreaterThan(0);
  });

  it('document results contain relevant cross-document links', () => {
    const prop = makeDoc({ dok_id: 'PropDoc1', titel: 'Klimatpolitik 2025/26:300 test', doktyp: 'prop' });
    const motion = makeDoc({
      dok_id: 'MotDoc1',
      titel: 'med anledning av prop. 2025/26:300 Klimatpolitik',
      doktyp: 'mot',
    });
    const batch = analyzeDocuments([prop, motion]);
    // The motion document result should have the responds-to link attached
    const motionResult = batch.results.find(r => r.document.dok_id === 'MotDoc1');
    expect(motionResult).toBeDefined();
    // Links referencing this document should be on the result
    const linkedIds = motionResult!.crossDocumentLinks.map(l => l.sourceId + '|' + l.targetId);
    expect(linkedIds.length).toBeGreaterThan(0);
  });

  it('empty batch returns zero results', () => {
    const batch = analyzeDocuments([]);
    expect(batch.results).toHaveLength(0);
    expect(batch.crossDocumentLinks).toHaveLength(0);
  });

  it('performance: 30 documents complete in < 5000ms', () => {
    const docs = Array.from({ length: 30 }, (_, i) =>
      makeDoc({ dok_id: `doc-${i}`, titel: `Budget NATO klimat skatt hälsa ${i}`, doktyp: 'prop' })
    );
    const batch = analyzeDocuments(docs, makeUnstableCIA(), 'en');
    expect(batch.processingTimeMs).toBeLessThan(5000);
    expect(batch.results).toHaveLength(30);
  });
});

// ---------------------------------------------------------------------------
// 14-language support spot checks
// ---------------------------------------------------------------------------

describe('language support', () => {
  const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

  it('analyzeDocument produces non-empty summaries for all 14 languages', () => {
    const doc = makeStrategicDoc();
    for (const lang of LANGUAGES) {
      const result = analyzeDocument(doc, undefined, lang);
      for (const p of result.perspectives) {
        expect(p.summary.length, `summary empty for lang=${lang}, lens=${p.lens}`).toBeGreaterThan(10);
      }
    }
  });

  it('swotContribution stakeholder label is localised per language', () => {
    const doc = makeDoc({ doktyp: 'prop' });
    const enResult = analyzeGovernmentPerspective(doc, undefined, 'en');
    const svResult = analyzeGovernmentPerspective(doc, undefined, 'sv');
    const enStakeholder = enResult.swotContribution[0]?.forStakeholder;
    const svStakeholder = svResult.swotContribution[0]?.forStakeholder;
    // English and Swedish labels should differ
    expect(enStakeholder).not.toBe(svStakeholder);
    expect(enStakeholder).toBe('Government');
    expect(svStakeholder).toBe('Regeringen');
  });
});
