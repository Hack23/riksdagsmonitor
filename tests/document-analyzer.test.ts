/**
 * Tests for the AI-powered document analysis framework.
 * Validates: analyzeDocument, analyzeDocuments, selectRelevantStakeholders,
 * buildPestleAnalysis, buildCoalitionDynamics, buildHistoricalContext,
 * buildImplementationAssessment, buildRiskAssessment, generateExecutiveSummary,
 * caching, batch analysis, and confidence scoring.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeDocument,
  analyzeDocuments,
  clearAnalysisCache,
  selectRelevantStakeholders,
  buildPestleAnalysis,
  buildCoalitionDynamics,
  buildHistoricalContext,
  buildImplementationAssessment,
  buildRiskAssessment,
  generateExecutiveSummary,
} from '../scripts/ai-analysis/document-analyzer.js';
import type { RawDocument, CIAContext } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Government proposition fixture */
const propDoc: RawDocument = {
  dok_id: 'H9031',
  doktyp: 'prop',
  titel: 'Proposition om hälso- och sjukvårdsreform',
  datum: '2026-02-01',
  organ: 'SoU',
  fullText: 'Denna proposition innehåller förslag till reform av hälso- och sjukvården i Sverige.',
};

/** Opposition motion fixture */
const motionDoc: RawDocument = {
  dok_id: 'H902S123',
  doktyp: 'mot',
  titel: 'Motion om miljöpolitik och klimatförändringar',
  parti: 'MP',
  datum: '2026-01-15',
  fullText: 'Vi föreslår att Sverige stärker sin klimatpolitik och miljöskyddslagar.',
};

/** Document with EU dimension */
const euDoc: RawDocument = {
  dok_id: 'H903EU01',
  doktyp: 'prop',
  titel: 'Proposition om EU-direktiv implementering',
  organ: 'UU',
  datum: '2026-02-10',
  fullText: 'Implementering av EU-direktiv rörande digitala tjänster och internationell handel.',
};

/** Budget/fiscal document */
const budgetDoc: RawDocument = {
  dok_id: 'H904FI',
  doktyp: 'prop',
  titel: 'Budgetproposition 2026 — finanspolitik',
  organ: 'FiU',
  datum: '2026-01-20',
  fullText: 'Statsbudgeten för 2026 innehåller skatteändringar och utgiftsökningar.',
};

/** Document with no content */
const minimalDoc: RawDocument = {
  dok_id: 'MINIMAL01',
  titel: 'Okänt dokument',
};

/** Stable CIA context */
const stableCIA: CIAContext = {
  partyPerformance: [
    {
      id: 'M',
      partyName: 'Moderaterna',
      metrics: { seats: 68, successRate: 72, motionsSubmitted: 120, motionsPassed: 86, cohesionScore: 90 },
      trends: { supportTrend: 'stable', activityTrend: 'stable' },
    },
  ],
  coalitionStability: { stabilityScore: 80, riskLevel: 'LOW', defectionProbability: 0.05, majorityMargin: 15 },
  votingPatterns: { keyIssues: [{ topic: 'Budget', coalitionAlignment: 95, oppositionAlignment: 10, crossPartyVotes: 5 }] },
  overallMotionDenialRate: 99,
};

/** Unstable CIA context */
const unstableCIA: CIAContext = {
  partyPerformance: [
    {
      id: 'S',
      partyName: 'Socialdemokraterna',
      metrics: { seats: 107, successRate: 55, motionsSubmitted: 200, motionsPassed: 110, cohesionScore: 45 },
      trends: { supportTrend: 'declining', activityTrend: 'decreasing' },
    },
  ],
  coalitionStability: { stabilityScore: 20, riskLevel: 'CRITICAL', defectionProbability: 0.65, majorityMargin: 1 },
  votingPatterns: { keyIssues: [{ topic: 'Migration', coalitionAlignment: 55, oppositionAlignment: 60, crossPartyVotes: 45 }] },
  overallMotionDenialRate: 98,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearAnalysisCache();
});

// ---------------------------------------------------------------------------
// analyzeDocument — shape
// ---------------------------------------------------------------------------

describe('analyzeDocument — result shape', () => {
  it('returns a DocumentAnalysis with all required fields', () => {
    const result = analyzeDocument(propDoc, 'en');
    expect(result).toBeDefined();
    expect(result.documentId).toBe('dok:H9031');
    expect(result.documentTitle).toBe('Proposition om hälso- och sjukvårdsreform');
    expect(typeof result.executiveSummary).toBe('string');
    expect(result.executiveSummary.length).toBeGreaterThan(0);
    expect(Array.isArray(result.stakeholderImpacts)).toBe(true);
    expect(result.stakeholderImpacts.length).toBeGreaterThan(0);
    expect(typeof result.pestleDimensions).toBe('object');
    expect(Array.isArray(result.policyDomains)).toBe(true);
    expect(typeof result.coalitionDynamics).toBe('object');
    expect(typeof result.historicalContext).toBe('object');
    expect(typeof result.implementationAssessment).toBe('object');
    expect(Array.isArray(result.riskAssessment)).toBe(true);
    expect(result.confidenceScores instanceof Map).toBe(true);
    expect(Array.isArray(result.iterations)).toBe(true);
    expect(typeof result.influenceScore).toBe('number');
    expect(typeof result.analyzedAt).toBe('string');
  });

  it('uses dok_id as documentId when available', () => {
    const result = analyzeDocument(propDoc, 'en');
    expect(result.documentId).toBe('dok:H9031');
  });

  it('falls back to url then title for documentId when dok_id missing', () => {
    const doc: RawDocument = { url: 'https://example.com/doc', titel: 'Test' };
    const result = analyzeDocument(doc, 'en');
    expect(result.documentId).toBe('url:https://example.com/doc');
  });

  it('uses title-based fallback documentId when no primary identifier available', () => {
    const result = analyzeDocument({}, 'en');
    expect(result.documentId).toMatch(/^title:/);
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — stakeholder impacts
// ---------------------------------------------------------------------------

describe('analyzeDocument — stakeholder impacts', () => {
  it('always includes government-coalition, opposition-parties, citizens-voters', () => {
    const result = analyzeDocument(propDoc, 'en');
    const groups = result.stakeholderImpacts.map(s => s.stakeholder);
    expect(groups).toContain('government-coalition');
    expect(groups).toContain('opposition-parties');
    expect(groups).toContain('citizens-voters');
  });

  it('government proposition gives government-coalition positive impact', () => {
    const result = analyzeDocument(propDoc, 'en');
    const govImpact = result.stakeholderImpacts.find(s => s.stakeholder === 'government-coalition');
    expect(govImpact?.directImpact.direction).toBe('positive');
  });

  it('government proposition gives opposition mixed impact', () => {
    const result = analyzeDocument(propDoc, 'en');
    const oppImpact = result.stakeholderImpacts.find(s => s.stakeholder === 'opposition-parties');
    expect(oppImpact?.directImpact.direction).toBe('mixed');
  });

  it('motion gives opposition positive impact', () => {
    const result = analyzeDocument(motionDoc, 'en');
    const oppImpact = result.stakeholderImpacts.find(s => s.stakeholder === 'opposition-parties');
    expect(oppImpact?.directImpact.direction).toBe('positive');
  });

  it('each stakeholder impact has a SWOT with 4 quadrants', () => {
    const result = analyzeDocument(propDoc, 'en');
    for (const si of result.stakeholderImpacts) {
      expect(Array.isArray(si.swot.strengths)).toBe(true);
      expect(Array.isArray(si.swot.weaknesses)).toBe(true);
      expect(Array.isArray(si.swot.opportunities)).toBe(true);
      expect(Array.isArray(si.swot.threats)).toBe(true);
    }
  });

  it('each stakeholder impact has a confidence level', () => {
    const result = analyzeDocument(propDoc, 'en');
    for (const si of result.stakeholderImpacts) {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(si.confidence);
    }
  });

  it('provides localised displayName for Swedish', () => {
    const result = analyzeDocument(propDoc, 'sv');
    const govImpact = result.stakeholderImpacts.find(s => s.stakeholder === 'government-coalition');
    expect(govImpact?.displayName).toBe('Regeringskoalitionen');
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — PESTLE
// ---------------------------------------------------------------------------

describe('analyzeDocument — PESTLE dimensions', () => {
  it('all six PESTLE dimensions are arrays', () => {
    const { pestleDimensions } = analyzeDocument(propDoc, 'en');
    expect(Array.isArray(pestleDimensions.political)).toBe(true);
    expect(Array.isArray(pestleDimensions.economic)).toBe(true);
    expect(Array.isArray(pestleDimensions.social)).toBe(true);
    expect(Array.isArray(pestleDimensions.technological)).toBe(true);
    expect(Array.isArray(pestleDimensions.legal)).toBe(true);
    expect(Array.isArray(pestleDimensions.environmental)).toBe(true);
  });

  it('political dimension is non-empty', () => {
    const { pestleDimensions } = analyzeDocument(propDoc, 'en');
    expect(pestleDimensions.political.length).toBeGreaterThan(0);
  });

  it('healthcare proposition adds social dimension', () => {
    const { pestleDimensions } = analyzeDocument(propDoc, 'en');
    const socialJoined = pestleDimensions.social.join(' ');
    expect(socialJoined.toLowerCase()).toContain('healthcare');
  });

  it('EU document adds EU law compliance to legal dimension', () => {
    const { pestleDimensions } = analyzeDocument(euDoc, 'en');
    const legalJoined = pestleDimensions.legal.join(' ');
    expect(legalJoined.toLowerCase()).toContain('eu');
  });

  it('fiscal document adds budget/fiscal to economic dimension', () => {
    const { pestleDimensions } = analyzeDocument(budgetDoc, 'en');
    const economicJoined = pestleDimensions.economic.join(' ');
    expect(economicJoined.toLowerCase()).toContain('fiscal');
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — policy domains
// ---------------------------------------------------------------------------

describe('analyzeDocument — policy domains', () => {
  it('returns policy domains as array of PolicyDomain objects', () => {
    const { policyDomains } = analyzeDocument(propDoc, 'en');
    expect(Array.isArray(policyDomains)).toBe(true);
    for (const d of policyDomains) {
      expect(typeof d.key).toBe('string');
      expect(typeof d.name).toBe('string');
      expect(typeof d.relevanceScore).toBe('number');
    }
  });

  it('relevance scores are between 1 and 100', () => {
    const { policyDomains } = analyzeDocument(propDoc, 'en');
    for (const d of policyDomains) {
      expect(d.relevanceScore).toBeGreaterThanOrEqual(1);
      expect(d.relevanceScore).toBeLessThanOrEqual(100);
    }
  });

  it('policy domain keys are canonical identifiers, not localized display names', () => {
    clearAnalysisCache();
    const { policyDomains } = analyzeDocument({ ...propDoc, dok_id: 'DOMKEY-1' }, 'en');
    // Healthcare doc should produce a domain key like 'healthcare', not 'healthcare policy'
    const healthDomain = policyDomains.find(d => d.key === 'healthcare');
    if (healthDomain) {
      // key should be the short canonical form
      expect(healthDomain.key).not.toContain(' ');
      // name should be the localized display name
      expect(healthDomain.name.length).toBeGreaterThan(healthDomain.key.length);
    }
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — coalition dynamics
// ---------------------------------------------------------------------------

describe('analyzeDocument — coalition dynamics', () => {
  it('proposition has positive government impact', () => {
    const { coalitionDynamics } = analyzeDocument(propDoc, 'en');
    expect(coalitionDynamics.governmentImpact).toBe('positive');
  });

  it('motion has negative government impact', () => {
    const { coalitionDynamics } = analyzeDocument(motionDoc, 'en');
    expect(coalitionDynamics.governmentImpact).toBe('negative');
  });

  it('stable CIA gives stabilising effect for proposition', () => {
    const { coalitionDynamics } = analyzeDocument(propDoc, 'en', stableCIA);
    expect(coalitionDynamics.stabilityEffect).toBe('stabilising');
  });

  it('unstable CIA gives destabilising effect', () => {
    const { coalitionDynamics } = analyzeDocument(propDoc, 'en', unstableCIA);
    expect(coalitionDynamics.stabilityEffect).toBe('destabilising');
  });

  it('summary includes CIA risk summary when CIA provided', () => {
    const { coalitionDynamics } = analyzeDocument(propDoc, 'en', stableCIA);
    expect(coalitionDynamics.summary).toContain('LOW');
  });

  it('summary falls back gracefully when no CIA context', () => {
    const { coalitionDynamics } = analyzeDocument(propDoc, 'en');
    expect(coalitionDynamics.summary).toContain('No CIA');
  });

  it('coalitionDynamics has boolean crossPartyPotential', () => {
    const { coalitionDynamics } = analyzeDocument(propDoc, 'en');
    expect(typeof coalitionDynamics.crossPartyPotential).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — historical context
// ---------------------------------------------------------------------------

describe('analyzeDocument — historical context', () => {
  it('precedents is non-empty array of strings', () => {
    const { historicalContext } = analyzeDocument(propDoc, 'en');
    expect(Array.isArray(historicalContext.precedents)).toBe(true);
    expect(historicalContext.precedents.length).toBeGreaterThan(0);
    for (const p of historicalContext.precedents) {
      expect(typeof p).toBe('string');
    }
  });

  it('relatedLegislation is non-empty array', () => {
    const { historicalContext } = analyzeDocument(propDoc, 'en');
    expect(historicalContext.relatedLegislation.length).toBeGreaterThan(0);
  });

  it('policyEvolution is a string', () => {
    const { historicalContext } = analyzeDocument(propDoc, 'en');
    expect(typeof historicalContext.policyEvolution).toBe('string');
    expect(historicalContext.policyEvolution.length).toBeGreaterThan(0);
  });

  it('policyEvolution uses doc.rm when present', () => {
    const doc: RawDocument = { ...propDoc, dok_id: 'RM-TEST', rm: '2024/25' };
    const { historicalContext } = analyzeDocument(doc, 'en');
    expect(historicalContext.policyEvolution).toContain('2024/25');
  });

  it('policyEvolution derives riksmöte from datum when rm is absent', () => {
    // October 2025 → session 2025/26
    const doc: RawDocument = { ...propDoc, dok_id: 'DATE-TEST', rm: undefined, datum: '2025-10-15' };
    const { historicalContext } = analyzeDocument(doc, 'en');
    expect(historicalContext.policyEvolution).toContain('2025/26');
  });

  it('rejects invalid rm format and falls back to datum', () => {
    // Invalid rm format should be ignored; datum Oct 2025 → "2025/26"
    const doc: RawDocument = { ...propDoc, dok_id: 'BAD-RM', rm: 'bad-format', datum: '2025-10-15' };
    const { historicalContext } = analyzeDocument(doc, 'en');
    expect(historicalContext.policyEvolution).toContain('2025/26');
    expect(historicalContext.policyEvolution).not.toContain('bad-format');
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — implementation assessment
// ---------------------------------------------------------------------------

describe('analyzeDocument — implementation assessment', () => {
  it('has valid feasibility level', () => {
    const { implementationAssessment } = analyzeDocument(propDoc, 'en');
    expect(['high', 'medium', 'low']).toContain(implementationAssessment.feasibility);
  });

  it('has a non-empty estimatedTimeline', () => {
    const { implementationAssessment } = analyzeDocument(propDoc, 'en');
    expect(implementationAssessment.estimatedTimeline.length).toBeGreaterThan(0);
  });

  it('has at least one key obstacle', () => {
    const { implementationAssessment } = analyzeDocument(propDoc, 'en');
    expect(implementationAssessment.keyObstacles.length).toBeGreaterThan(0);
  });

  it('motions get low feasibility', () => {
    const { implementationAssessment } = analyzeDocument(motionDoc, 'en');
    expect(implementationAssessment.feasibility).toBe('low');
  });

  it('includes relevant agencies', () => {
    const { implementationAssessment } = analyzeDocument(propDoc, 'en');
    expect(implementationAssessment.agenciesInvolved.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — risk assessment
// ---------------------------------------------------------------------------

describe('analyzeDocument — risk assessment', () => {
  it('always includes at least one risk', () => {
    const { riskAssessment } = analyzeDocument(propDoc, 'en');
    expect(riskAssessment.length).toBeGreaterThan(0);
  });

  it('always has a political risk entry', () => {
    const { riskAssessment } = analyzeDocument(propDoc, 'en');
    expect(riskAssessment.some(r => r.type === 'political')).toBe(true);
  });

  it('each risk has valid severity', () => {
    const { riskAssessment } = analyzeDocument(propDoc, 'en');
    for (const r of riskAssessment) {
      expect(['high', 'medium', 'low']).toContain(r.severity);
    }
  });

  it('each risk has at least one mitigation option', () => {
    const { riskAssessment } = analyzeDocument(propDoc, 'en');
    for (const r of riskAssessment) {
      expect(r.mitigationOptions.length).toBeGreaterThan(0);
    }
  });

  it('EU document adds legal risk', () => {
    const { riskAssessment } = analyzeDocument(euDoc, 'en');
    expect(riskAssessment.some(r => r.type === 'legal')).toBe(true);
  });

  it('unstable CIA increases political risk severity', () => {
    const stableResult = analyzeDocument(propDoc, 'en', stableCIA);
    const unstableResult = analyzeDocument({ ...propDoc, dok_id: 'H9031-unstable' }, 'en', unstableCIA);
    const stablePolRisk = stableResult.riskAssessment.find(r => r.type === 'political');
    const unstablePolRisk = unstableResult.riskAssessment.find(r => r.type === 'political');
    // Unstable CIA should give high or same-as-stable severity
    const severityOrder = { low: 0, medium: 1, high: 2 };
    if (stablePolRisk && unstablePolRisk) {
      expect(severityOrder[unstablePolRisk.severity]).toBeGreaterThanOrEqual(severityOrder[stablePolRisk.severity]);
    }
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — confidence scores
// ---------------------------------------------------------------------------

describe('analyzeDocument — confidence scores', () => {
  it('confidence scores Map contains key dimensions', () => {
    const { confidenceScores } = analyzeDocument(propDoc, 'en');
    expect(confidenceScores.has('executiveSummary')).toBe(true);
    expect(confidenceScores.has('stakeholderImpacts')).toBe(true);
    expect(confidenceScores.has('pestleDimensions')).toBe(true);
    expect(confidenceScores.has('policyDomains')).toBe(true);
    expect(confidenceScores.has('coalitionDynamics')).toBe(true);
    expect(confidenceScores.has('historicalContext')).toBe(true);
    expect(confidenceScores.has('implementationAssessment')).toBe(true);
    expect(confidenceScores.has('riskAssessment')).toBe(true);
  });

  it('all confidence values are HIGH, MEDIUM, or LOW', () => {
    const { confidenceScores } = analyzeDocument(propDoc, 'en');
    for (const [, level] of confidenceScores) {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(level);
    }
  });

  it('CIA context raises coalition dynamics confidence vs no CIA', () => {
    clearAnalysisCache();
    const withCIA = analyzeDocument({ ...propDoc, dok_id: 'CIA-TEST-1' }, 'en', stableCIA);
    clearAnalysisCache();
    const withoutCIA = analyzeDocument({ ...propDoc, dok_id: 'CIA-TEST-2' }, 'en');
    const ciaCo = withCIA.confidenceScores.get('coalitionDynamics');
    const noCo = withoutCIA.confidenceScores.get('coalitionDynamics');
    const order = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    if (ciaCo && noCo) {
      expect(order[ciaCo]).toBeGreaterThanOrEqual(order[noCo]);
    }
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — iterations
// ---------------------------------------------------------------------------

describe('analyzeDocument — multi-iteration protocol', () => {
  it('returns exactly 4 iterations', () => {
    const { iterations } = analyzeDocument(propDoc, 'en');
    expect(iterations).toHaveLength(4);
  });

  it('iterations are labelled correctly', () => {
    const { iterations } = analyzeDocument(propDoc, 'en');
    expect(iterations[0].label).toBe('generation');
    expect(iterations[1].label).toBe('deepening');
    expect(iterations[2].label).toBe('stakeholder-review');
    expect(iterations[3].label).toBe('synthesis');
  });

  it('each iteration has a summary string', () => {
    const { iterations } = analyzeDocument(propDoc, 'en');
    for (const iter of iterations) {
      expect(typeof iter.summary).toBe('string');
      expect(iter.summary.length).toBeGreaterThan(0);
    }
  });

  it('each iteration has at least one refinement', () => {
    const { iterations } = analyzeDocument(propDoc, 'en');
    for (const iter of iterations) {
      expect(iter.refinements.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// analyzeDocument — influence score
// ---------------------------------------------------------------------------

describe('analyzeDocument — influence score', () => {
  it('influence score is a number between 0 and 100', () => {
    const { influenceScore } = analyzeDocument(propDoc, 'en');
    expect(influenceScore).toBeGreaterThanOrEqual(0);
    expect(influenceScore).toBeLessThanOrEqual(100);
  });

  it('government proposition scores higher than a simple motion', () => {
    clearAnalysisCache();
    const propResult = analyzeDocument(propDoc, 'en');
    clearAnalysisCache();
    const motResult = analyzeDocument(motionDoc, 'en');
    expect(propResult.influenceScore).toBeGreaterThan(motResult.influenceScore);
  });
});

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

describe('analyzeDocument — caching', () => {
  it('returns the same object reference on second call', () => {
    const first = analyzeDocument(propDoc, 'en');
    const second = analyzeDocument(propDoc, 'en');
    expect(first).toBe(second);
  });

  it('forceRefresh returns a new object', () => {
    const first = analyzeDocument(propDoc, 'en');
    const refreshed = analyzeDocument(propDoc, 'en', undefined, true);
    // New object, but same document ID
    expect(refreshed).not.toBe(first);
    expect(refreshed.documentId).toBe(first.documentId);
  });

  it('clearAnalysisCache removes cached results', () => {
    const first = analyzeDocument(propDoc, 'en');
    clearAnalysisCache();
    const second = analyzeDocument(propDoc, 'en');
    expect(second).not.toBe(first);
  });

  it('returns different cached objects for different languages', () => {
    clearAnalysisCache();
    const enResult = analyzeDocument(propDoc, 'en');
    const svResult = analyzeDocument(propDoc, 'sv');
    // Different cache slots for different languages
    expect(svResult).not.toBe(enResult);
    // But same document identity
    expect(svResult.documentId).toBe(enResult.documentId);
  });

  it('returns different cached objects with and without CIA context', () => {
    clearAnalysisCache();
    const withoutCIA = analyzeDocument(propDoc, 'en');
    const withCIA = analyzeDocument(propDoc, 'en', stableCIA);
    // Different cache slots when CIA context is provided
    expect(withCIA).not.toBe(withoutCIA);
    // Same document identity
    expect(withCIA.documentId).toBe(withoutCIA.documentId);
  });

  it('cache invalidates when document is enriched with fullText', () => {
    clearAnalysisCache();
    // Analyse the document without fullText
    const bare: RawDocument = { dok_id: 'ENRICH-1', titel: 'Enrichment test', doktyp: 'prop' };
    const before = analyzeDocument(bare, 'en');
    // "Enrich" the document by adding fullText (same dok_id)
    const enriched: RawDocument = { ...bare, fullText: 'Detailed body text about healthcare reform.' };
    const after = analyzeDocument(enriched, 'en');
    // Content fingerprint changed → different cache slot → new object
    expect(after).not.toBe(before);
    // But document identity is stable
    expect(after.documentId).toBe(before.documentId);
  });
});

// ---------------------------------------------------------------------------
// analyzeDocuments — batch
// ---------------------------------------------------------------------------

describe('analyzeDocuments — batch analysis', () => {
  it('returns a Map with one entry per document', () => {
    const results = analyzeDocuments([propDoc, motionDoc, euDoc], 'en');
    expect(results instanceof Map).toBe(true);
    expect(results.size).toBe(3);
  });

  it('each entry is a valid DocumentAnalysis', () => {
    const results = analyzeDocuments([propDoc, motionDoc], 'en');
    for (const [, analysis] of results) {
      expect(typeof analysis.executiveSummary).toBe('string');
      expect(Array.isArray(analysis.stakeholderImpacts)).toBe(true);
    }
  });

  it('batch reuses cache for duplicate documents', () => {
    // Prime cache with propDoc
    const first = analyzeDocument(propDoc, 'en');
    const results = analyzeDocuments([propDoc, motionDoc], 'en');
    const propResult = results.get('dok:H9031');
    // Same object reference since cache was primed
    expect(propResult).toBe(first);
  });

  it('handles empty array gracefully', () => {
    const results = analyzeDocuments([], 'en');
    expect(results.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// selectRelevantStakeholders
// ---------------------------------------------------------------------------

describe('selectRelevantStakeholders', () => {
  it('always includes government-coalition, opposition-parties, citizens-voters', () => {
    const groups = selectRelevantStakeholders(minimalDoc);
    expect(groups).toContain('government-coalition');
    expect(groups).toContain('opposition-parties');
    expect(groups).toContain('citizens-voters');
  });

  it('includes state-agencies when "myndighet" in text', () => {
    const doc: RawDocument = { titel: 'Reglering av myndighet och länsstyrelse', dok_id: 'X1' };
    const groups = selectRelevantStakeholders(doc);
    expect(groups).toContain('state-agencies');
  });

  it('includes municipalities-regions when "kommuner" in text', () => {
    const doc: RawDocument = { titel: 'Stöd till kommuner och regioner', dok_id: 'X2' };
    const groups = selectRelevantStakeholders(doc);
    expect(groups).toContain('municipalities-regions');
  });

  it('includes international-eu when "eu" in text', () => {
    const doc: RawDocument = { titel: 'EU-direktiv implementering', dok_id: 'X3' };
    const groups = selectRelevantStakeholders(doc);
    expect(groups).toContain('international-eu');
  });

  it('does not duplicate stakeholders', () => {
    const groups = selectRelevantStakeholders(propDoc);
    const seen = new Set(groups);
    expect(groups.length).toBe(seen.size);
  });

  it('detects stakeholder signals from fullContent when fullText is absent', () => {
    const doc: RawDocument = {
      dok_id: 'FC-SIGNALS',
      titel: 'Generiskt dokument',
      fullContent: '<p>Kommunerna och regionerna ska ansvara för genomförandet</p>',
    };
    const groups = selectRelevantStakeholders(doc);
    expect(groups).toContain('municipalities-regions');
  });
});

// ---------------------------------------------------------------------------
// buildPestleAnalysis
// ---------------------------------------------------------------------------

describe('buildPestleAnalysis', () => {
  it('returns all 6 PESTLE dimensions', () => {
    const pestle = buildPestleAnalysis(propDoc, 'en');
    expect(Array.isArray(pestle.political)).toBe(true);
    expect(Array.isArray(pestle.economic)).toBe(true);
    expect(Array.isArray(pestle.social)).toBe(true);
    expect(Array.isArray(pestle.technological)).toBe(true);
    expect(Array.isArray(pestle.legal)).toBe(true);
    expect(Array.isArray(pestle.environmental)).toBe(true);
  });

  it('proposition adds legislation-related legal entry', () => {
    const pestle = buildPestleAnalysis(propDoc, 'en');
    expect(pestle.legal.some(l => l.toLowerCase().includes('primary legislation') || l.toLowerCase().includes('riksdag'))).toBe(true);
  });

  it('motion adds relevant legal entry', () => {
    const pestle = buildPestleAnalysis(motionDoc, 'en');
    expect(pestle.legal.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildCoalitionDynamics
// ---------------------------------------------------------------------------

describe('buildCoalitionDynamics', () => {
  it('proposition has positive governmentImpact', () => {
    const cd = buildCoalitionDynamics(propDoc);
    expect(cd.governmentImpact).toBe('positive');
  });

  it('motion has negative governmentImpact', () => {
    const cd = buildCoalitionDynamics(motionDoc);
    expect(cd.governmentImpact).toBe('negative');
  });

  it('unknown type has neutral impact', () => {
    const cd = buildCoalitionDynamics(minimalDoc);
    expect(cd.governmentImpact).toBe('neutral');
  });

  it('crossPartyPotential is true for unstable coalition', () => {
    const cd = buildCoalitionDynamics(propDoc, unstableCIA);
    expect(cd.crossPartyPotential).toBe(true);
  });

  it('crossPartyPotential is false for stable coalition', () => {
    const cd = buildCoalitionDynamics(propDoc, stableCIA);
    expect(cd.crossPartyPotential).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildHistoricalContext
// ---------------------------------------------------------------------------

describe('buildHistoricalContext', () => {
  it('healthcare doc references healthcare-related precedents', () => {
    const hc = buildHistoricalContext(propDoc);
    const allPrecedents = hc.precedents.join(' ');
    // The healthcare precedent text references the Dagmar reform and Patient Safety Act
    expect(allPrecedents.toLowerCase()).toMatch(/dagmar|patient safety|health|reform/);
  });

  it('EU doc references EU precedents', () => {
    const hc = buildHistoricalContext(euDoc);
    const text = [...hc.precedents, ...hc.relatedLegislation, hc.policyEvolution].join(' ');
    expect(text.toLowerCase()).toContain('eu');
  });

  it('motion includes "amendment" or "committee" in relatedLegislation', () => {
    const hc = buildHistoricalContext(motionDoc);
    const text = hc.relatedLegislation.join(' ').toLowerCase();
    expect(text).toMatch(/committee|amend/);
  });
});

// ---------------------------------------------------------------------------
// buildImplementationAssessment
// ---------------------------------------------------------------------------

describe('buildImplementationAssessment', () => {
  it('proposition returns medium or high feasibility', () => {
    const impl = buildImplementationAssessment(propDoc);
    expect(['high', 'medium']).toContain(impl.feasibility);
  });

  it('motion returns low feasibility', () => {
    const impl = buildImplementationAssessment(motionDoc);
    expect(impl.feasibility).toBe('low');
  });

  it('simple proposition returns high feasibility', () => {
    // A simple prop with no committee, no party → low influence score → high feasibility
    const simpleProp: RawDocument = {
      dok_id: 'SIMPLE-01', doktyp: 'prop', titel: 'Enkel proposition',
    };
    const impl = buildImplementationAssessment(simpleProp);
    expect(impl.feasibility).toBe('high');
  });

  it('fiscal doc references Finansdepartementet or Skatteverket', () => {
    const impl = buildImplementationAssessment(budgetDoc);
    const agencies = impl.agenciesInvolved.join(' ');
    expect(agencies).toMatch(/Finansdepartementet|Skatteverket/);
  });
});

// ---------------------------------------------------------------------------
// buildRiskAssessment
// ---------------------------------------------------------------------------

describe('buildRiskAssessment', () => {
  it('always returns at least one risk', () => {
    const risks = buildRiskAssessment(propDoc);
    expect(risks.length).toBeGreaterThan(0);
  });

  it('EU doc always includes legal risk', () => {
    const risks = buildRiskAssessment(euDoc);
    expect(risks.some(r => r.type === 'legal')).toBe(true);
  });

  it('fiscal doc includes financial risk', () => {
    const risks = buildRiskAssessment(budgetDoc);
    expect(risks.some(r => r.type === 'financial')).toBe(true);
  });

  it('all risks have non-empty description', () => {
    const risks = buildRiskAssessment(propDoc, stableCIA);
    for (const r of risks) {
      expect(r.description.length).toBeGreaterThan(0);
    }
  });

  it('motion political risk mentions "parliamentary success"', () => {
    const risks = buildRiskAssessment(motionDoc);
    const politicalRisk = risks.find(r => r.type === 'political');
    expect(politicalRisk).toBeDefined();
    expect(politicalRisk!.description).toContain('parliamentary success');
  });

  it('non-motion non-prop doc uses neutral risk description', () => {
    const doc: RawDocument = { dok_id: 'BET-01', doktyp: 'bet', titel: 'Utskottsbetänkande' };
    const risks = buildRiskAssessment(doc);
    const politicalRisk = risks.find(r => r.type === 'political');
    expect(politicalRisk).toBeDefined();
    expect(politicalRisk!.description).toContain('cross-party alignment');
  });
});

// ---------------------------------------------------------------------------
// generateExecutiveSummary
// ---------------------------------------------------------------------------

describe('generateExecutiveSummary', () => {
  it('returns a multi-paragraph string', () => {
    const summary = generateExecutiveSummary(propDoc, 'en');
    expect(typeof summary).toBe('string');
    expect(summary).toContain('\n\n');
  });

  it('includes document title in summary', () => {
    const summary = generateExecutiveSummary(propDoc, 'en');
    expect(summary).toContain('hälso- och sjukvårdsreform');
  });

  it('mentions government proposition type for prop documents', () => {
    const summary = generateExecutiveSummary(propDoc, 'en');
    expect(summary.toLowerCase()).toContain('government proposition');
  });

  it('mentions parliamentary motion for motion documents', () => {
    const summary = generateExecutiveSummary(motionDoc, 'en');
    expect(summary.toLowerCase()).toContain('parliamentary motion');
  });

  it('includes key passage when fullText is available', () => {
    const summary = generateExecutiveSummary(propDoc, 'en');
    // propDoc has fullText so a key passage should appear
    expect(summary.length).toBeGreaterThan(100);
  });

  it('uses fullContent as fallback when fullText is absent', () => {
    const doc: RawDocument = { ...propDoc, dok_id: 'FC-1', fullText: undefined, fullContent: '<p>HTML enriched content from fullContent field</p>' };
    const summary = generateExecutiveSummary(doc, 'en');
    // Should extract passage from fullContent (HTML stripped by extractKeyPassage)
    expect(summary).toContain('Key provision');
    expect(summary).toContain('HTML enriched content');
  });

  it('does not throw when fullText is absent', () => {
    expect(() => generateExecutiveSummary(minimalDoc, 'en')).not.toThrow();
  });

  it('includes influence score in summary', () => {
    const summary = generateExecutiveSummary(propDoc, 'en');
    expect(summary).toContain('influence score');
  });

  it('uses doc.rm for session reference when present', () => {
    const doc: RawDocument = { ...propDoc, dok_id: 'RM-SUM', rm: '2024/25' };
    const summary = generateExecutiveSummary(doc, 'en');
    expect(summary).toContain('2024/25');
  });

  it('derives riksmöte from datum when rm is absent', () => {
    const doc: RawDocument = { ...propDoc, dok_id: 'DATE-SUM', rm: undefined, datum: '2025-10-15' };
    const summary = generateExecutiveSummary(doc, 'en');
    expect(summary).toContain('2025/26');
  });

  it('handles skr documents without throwing', () => {
    const skrDoc: RawDocument = { dok_id: 'SKR-01', doktyp: 'skr', titel: 'Skrivelse om infrastruktur', datum: '2026-01-20' };
    expect(() => generateExecutiveSummary(skrDoc, 'en')).not.toThrow();
    const summary = generateExecutiveSummary(skrDoc, 'en');
    expect(summary.length).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// Multi-language support
// ---------------------------------------------------------------------------

describe('multi-language support', () => {
  const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

  it('returns a valid analysis for every supported language', () => {
    for (const lang of LANGUAGES) {
      clearAnalysisCache();
      const result = analyzeDocument({ ...propDoc, dok_id: `LANG-${lang}` }, lang);
      expect(result.stakeholderImpacts.length).toBeGreaterThan(0);
      const gov = result.stakeholderImpacts.find(s => s.stakeholder === 'government-coalition');
      expect(gov?.displayName.length).toBeGreaterThan(0);
    }
  });

  it('Swedish displayName for citizens-voters is correct', () => {
    clearAnalysisCache();
    const result = analyzeDocument({ ...propDoc, dok_id: 'LANG-SV' }, 'sv');
    const cit = result.stakeholderImpacts.find(s => s.stakeholder === 'citizens-voters');
    expect(cit?.displayName).toBe('Medborgare och väljare');
  });

  it('PESTLE triggers work correctly for non-EN language (Swedish)', () => {
    clearAnalysisCache();
    // Use a healthcare doc — PESTLE should include healthcare entry regardless of lang
    const svResult = analyzeDocument({ ...propDoc, dok_id: 'PESTLE-SV' }, 'sv');
    const enResult = analyzeDocument({ ...propDoc, dok_id: 'PESTLE-EN' }, 'en');
    // Both should have the same number of social entries (healthcare trigger fires for both)
    expect(svResult.pestleDimensions.social.length).toBe(enResult.pestleDimensions.social.length);
  });

  it('SWOT subject is localized when lang is non-EN', () => {
    clearAnalysisCache();
    const result = analyzeDocument({ ...propDoc, dok_id: 'SWOT-SV' }, 'sv');
    const gov = result.stakeholderImpacts.find(s => s.stakeholder === 'government-coalition');
    expect(gov?.swot.subject).toBe('Regeringskoalitionen');
  });
});
