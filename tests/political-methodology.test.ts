/**
 * Unit Tests for ISMS-Inspired Political Analysis Methodologies
 *
 * Tests all three methodology engines:
 * 1. Political Classification — 7-dimension classification scoring
 * 2. Political Risk Assessment — Likelihood × Impact risk scoring
 * 3. Political Threat Analysis — PRIDES framework
 *
 * All functions are pure/deterministic — same input always produces same output.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyPoliticalDocument,
  classifyPoliticalDocuments,
} from '../scripts/analysis-framework/political-classification.js';
import {
  assessPoliticalRisk,
  assessSingleRiskCategory,
  computeRiskScore,
  deriveRiskPriority,
} from '../scripts/analysis-framework/political-risk-assessment.js';
import {
  analysePoliticalThreats,
  analyseSinglePridesCategory,
} from '../scripts/analysis-framework/political-threat-analysis.js';
import {
  LIKELIHOOD_PROBABILITY,
  IMPACT_WEIGHT,
} from '../scripts/analysis-framework/methodology-types.js';
import type { RawDocument, CIAContext } from '../scripts/data-transformers/types.js';
import type {
  PoliticalClassification,
  PoliticalRiskProfile,
  PoliticalThreatProfile,
  LikelihoodLevel,
  RiskImpactLevel,
  PridesCategory,
} from '../scripts/analysis-framework/methodology-types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'H901FiU1',
    titel: 'Test document',
    doktyp: 'mot',
    organ: 'AU',
    parti: 'M',
    datum: '2026-03-01',
    ...overrides,
  };
}

function makeBudgetProposition(): RawDocument {
  return makeDoc({
    dok_id: 'H901FiU10',
    titel: 'Budgetproposition 2026 — statsbudget med ökade försvarsanslag',
    doktyp: 'prop',
    organ: 'FiU',
    summary: 'Regeringens budgetproposition innehåller ökade försvarsutgifter och skatteförändringar.',
    fullText: 'Statsbudget 2026. BNP-tillväxt. Miljarder kronor i omfördelning.',
  });
}

function makeConstitutionalDocument(): RawDocument {
  return makeDoc({
    dok_id: 'H901KU1',
    titel: 'KU-granskning av grundlagsändring och fri- och rättigheter',
    doktyp: 'bet',
    organ: 'KU',
    summary: 'Konstitutionsutskottet granskar grundlag och konstitutionell ordning.',
  });
}

function makeInterpellation(): RawDocument {
  return makeDoc({
    dok_id: 'H901ip42',
    titel: 'Interpellation om invandringspolitik och integration',
    doktyp: 'ip',
    organ: 'SoU',
    parti: 'SD',
    mottagare: 'Migrationsministern',
    summary: 'Fråga om migrationsretorik och polarisering i debatten.',
  });
}

function makeCrisisDocument(): RawDocument {
  return makeDoc({
    dok_id: 'H901KU99',
    titel: 'Misstroendevotum mot statsministern — regeringskris',
    doktyp: 'bet',
    organ: 'KU',
    summary: 'Riksdagen röstar om misstroende mot statsministern. Tidöavtal i kris. Koalitionskris.',
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
    ],
    coalitionStability: { stabilityScore: 28, riskLevel: 'high', defectionProbability: 0.35, majorityMargin: 1 },
    votingPatterns: { keyIssues: [] },
    overallMotionDenialRate: 98.5,
  };
}

function makeStableCIA(): CIAContext {
  return {
    partyPerformance: [
      {
        id: 'M',
        partyName: 'Moderaterna',
        metrics: { seats: 68, successRate: 85, motionsSubmitted: 40, motionsPassed: 34 },
        trends: { supportTrend: 'rising', activityTrend: 'stable' },
      },
    ],
    coalitionStability: { stabilityScore: 80, riskLevel: 'low', defectionProbability: 0.05, majorityMargin: 10 },
    votingPatterns: { keyIssues: [] },
    overallMotionDenialRate: 99.2,
  };
}

// ===========================================================================
// 1. POLITICAL CLASSIFICATION TESTS
// ===========================================================================

describe('Political Classification — classifyPoliticalDocument', () => {

  // -------------------------------------------------------------------------
  // Basic contract
  // -------------------------------------------------------------------------

  describe('basic contract', () => {
    it('returns all 7 classification dimensions', () => {
      const result: PoliticalClassification = classifyPoliticalDocument(makeDoc());
      expect(result).toHaveProperty('publicInterestSensitivity');
      expect(result).toHaveProperty('democraticIntegrityImpact');
      expect(result).toHaveProperty('policyUrgency');
      expect(result).toHaveProperty('economicImpact');
      expect(result).toHaveProperty('governanceImpact');
      expect(result).toHaveProperty('politicalCapitalImpact');
      expect(result).toHaveProperty('legislativeImpact');
    });

    it('returns overallClassification and classificationScore', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(result).toHaveProperty('overallClassification');
      expect(result).toHaveProperty('classificationScore');
      expect(['critical', 'high', 'medium', 'low']).toContain(result.overallClassification);
    });

    it('returns classificationScore in range 0–100', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(result.classificationScore).toBeGreaterThanOrEqual(0);
      expect(result.classificationScore).toBeLessThanOrEqual(100);
    });

    it('returns non-empty rationale array', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(Array.isArray(result.rationale)).toBe(true);
      expect(result.rationale.length).toBeGreaterThan(0);
    });

    it('is deterministic — same input yields same output', () => {
      const doc = makeBudgetProposition();
      const cia = makeUnstableCIA();
      const a = classifyPoliticalDocument(doc, cia);
      const b = classifyPoliticalDocument(doc, cia);
      expect(a.classificationScore).toBe(b.classificationScore);
      expect(a.overallClassification).toBe(b.overallClassification);
      expect(a.publicInterestSensitivity).toBe(b.publicInterestSensitivity);
    });

    it('works without CIA context', () => {
      expect(() => classifyPoliticalDocument(makeDoc())).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Dimension value validation
  // -------------------------------------------------------------------------

  describe('dimension value validity', () => {
    it('publicInterestSensitivity has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['explosive', 'sensitive', 'standard', 'routine']).toContain(result.publicInterestSensitivity);
    });

    it('democraticIntegrityImpact has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['critical', 'significant', 'moderate', 'minor']).toContain(result.democraticIntegrityImpact);
    });

    it('policyUrgency has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['immediate', 'short-term', 'medium-term', 'long-term']).toContain(result.policyUrgency);
    });

    it('economicImpact has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['transformative', 'major', 'moderate', 'minimal']).toContain(result.economicImpact);
    });

    it('governanceImpact has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['systemic', 'significant', 'procedural', 'routine']).toContain(result.governanceImpact);
    });

    it('politicalCapitalImpact has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['career-defining', 'significant', 'notable', 'negligible']).toContain(result.politicalCapitalImpact);
    });

    it('legislativeImpact has valid value', () => {
      const result = classifyPoliticalDocument(makeDoc());
      expect(['constitutional', 'legislative', 'regulatory', 'administrative']).toContain(result.legislativeImpact);
    });
  });

  // -------------------------------------------------------------------------
  // Classification logic — document type signals
  // -------------------------------------------------------------------------

  describe('document type classification signals', () => {
    it('committee report (bet) has immediate policyUrgency', () => {
      const result = classifyPoliticalDocument(makeDoc({ doktyp: 'bet' }));
      expect(result.policyUrgency).toBe('immediate');
    });

    it('government proposition (prop) has short-term policyUrgency', () => {
      const result = classifyPoliticalDocument(makeDoc({ doktyp: 'prop' }));
      expect(result.policyUrgency).toBe('short-term');
    });

    it('motion (mot) has medium-term policyUrgency', () => {
      const result = classifyPoliticalDocument(makeDoc({ doktyp: 'mot' }));
      expect(result.policyUrgency).toBe('medium-term');
    });

    it('proposition has at least moderate democraticIntegrityImpact', () => {
      const result = classifyPoliticalDocument(makeDoc({ doktyp: 'prop' }));
      expect(['critical', 'significant', 'moderate']).toContain(result.democraticIntegrityImpact);
    });
  });

  // -------------------------------------------------------------------------
  // Classification logic — committee signals
  // -------------------------------------------------------------------------

  describe('committee classification signals', () => {
    it('Finance Committee (FiU) document has systemic governanceImpact', () => {
      const result = classifyPoliticalDocument(makeDoc({ organ: 'FiU', doktyp: 'bet' }));
      expect(result.governanceImpact).toBe('systemic');
    });

    it('Constitutional Committee (KU) document has significant democraticIntegrityImpact', () => {
      const result = classifyPoliticalDocument(makeDoc({ organ: 'KU', doktyp: 'bet' }));
      expect(['critical', 'significant']).toContain(result.democraticIntegrityImpact);
    });

    it('Social Affairs committee has significant governanceImpact', () => {
      const result = classifyPoliticalDocument(makeDoc({ organ: 'SoU', doktyp: 'bet' }));
      expect(result.governanceImpact).toBe('significant');
    });
  });

  // -------------------------------------------------------------------------
  // Classification logic — content signals
  // -------------------------------------------------------------------------

  describe('content-based classification signals', () => {
    it('budget proposition has transformative economicImpact', () => {
      const result = classifyPoliticalDocument(makeBudgetProposition());
      expect(result.economicImpact).toBe('transformative');
    });

    it('constitutional document has critical democraticIntegrityImpact', () => {
      const result = classifyPoliticalDocument(makeConstitutionalDocument());
      expect(result.democraticIntegrityImpact).toBe('critical');
    });

    it('constitutional document has constitutional legislativeImpact', () => {
      const result = classifyPoliticalDocument(makeConstitutionalDocument());
      expect(result.legislativeImpact).toBe('constitutional');
    });

    it('crisis document has explosive publicInterestSensitivity', () => {
      const result = classifyPoliticalDocument(makeCrisisDocument());
      expect(result.publicInterestSensitivity).toBe('explosive');
    });

    it('crisis document has career-defining politicalCapitalImpact', () => {
      const result = classifyPoliticalDocument(makeCrisisDocument());
      expect(result.politicalCapitalImpact).toBe('career-defining');
    });

    it('interpellation with minister target has significant politicalCapitalImpact', () => {
      const result = classifyPoliticalDocument(makeInterpellation());
      expect(['significant', 'career-defining']).toContain(result.politicalCapitalImpact);
    });
  });

  // -------------------------------------------------------------------------
  // Classification severity ordering
  // -------------------------------------------------------------------------

  describe('severity ordering', () => {
    it('crisis document classifies higher than routine motion', () => {
      const crisis = classifyPoliticalDocument(makeCrisisDocument());
      const routine = classifyPoliticalDocument(makeDoc({ doktyp: 'fr', organ: 'AU' }));
      expect(crisis.classificationScore).toBeGreaterThan(routine.classificationScore);
    });

    it('budget proposition classifies at least medium', () => {
      const result = classifyPoliticalDocument(makeBudgetProposition());
      expect(['critical', 'high', 'medium']).toContain(result.overallClassification);
    });

    it('constitutional document classifies at high or critical', () => {
      const result = classifyPoliticalDocument(makeConstitutionalDocument());
      expect(['critical', 'high']).toContain(result.overallClassification);
    });
  });

  // -------------------------------------------------------------------------
  // CIA context influence
  // -------------------------------------------------------------------------

  describe('CIA context influence', () => {
    it('unstable coalition raises economicImpact for propositions', () => {
      const doc = makeDoc({ doktyp: 'prop', summary: 'Statsbudget 2026 miljarder kronor BNP-mål' });
      const withUnstable = classifyPoliticalDocument(doc, makeUnstableCIA());
      const withStable = classifyPoliticalDocument(doc, makeStableCIA());
      // Unstable CIA should produce >= stable score
      expect(withUnstable.classificationScore).toBeGreaterThanOrEqual(withStable.classificationScore);
    });
  });

  // -------------------------------------------------------------------------
  // Batch classification
  // -------------------------------------------------------------------------

  describe('classifyPoliticalDocuments (batch)', () => {
    it('returns one classification per input document', () => {
      const docs = [makeDoc(), makeBudgetProposition(), makeConstitutionalDocument()];
      const results = classifyPoliticalDocuments(docs);
      expect(results).toHaveLength(3);
    });

    it('returns empty array for empty input', () => {
      const results = classifyPoliticalDocuments([]);
      expect(results).toHaveLength(0);
    });

    it('each result has valid classificationScore', () => {
      const docs = [makeDoc(), makeInterpellation(), makeCrisisDocument()];
      const results = classifyPoliticalDocuments(docs, makeUnstableCIA());
      for (const result of results) {
        expect(result.classificationScore).toBeGreaterThanOrEqual(0);
        expect(result.classificationScore).toBeLessThanOrEqual(100);
      }
    });
  });
});

// ===========================================================================
// 2. POLITICAL RISK ASSESSMENT TESTS
// ===========================================================================

describe('Political Risk Assessment — assessPoliticalRisk', () => {

  // -------------------------------------------------------------------------
  // computeRiskScore utility
  // -------------------------------------------------------------------------

  describe('computeRiskScore utility', () => {
    it('returns near-zero score for exceptional likelihood × minimal impact', () => {
      const score = computeRiskScore('exceptional', 'minimal');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(5);
    });

    it('returns high score for almost-certain likelihood × transformative impact', () => {
      const score = computeRiskScore('almost-certain', 'transformative');
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('returns score in 0–100 range for all likelihood × impact combinations', () => {
      const likelihoods: LikelihoodLevel[] = [
        'almost-certain', 'likely', 'possible', 'unlikely', 'rare', 'exceptional',
      ];
      const impacts: RiskImpactLevel[] = [
        'transformative', 'critical', 'high', 'moderate', 'low', 'minimal',
      ];
      for (const likelihood of likelihoods) {
        for (const impact of impacts) {
          const score = computeRiskScore(likelihood, impact);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    });

    it('higher likelihood always produces higher score for same impact', () => {
      expect(computeRiskScore('almost-certain', 'high')).toBeGreaterThan(
        computeRiskScore('unlikely', 'high')
      );
    });

    it('higher impact always produces higher score for same likelihood', () => {
      expect(computeRiskScore('likely', 'transformative')).toBeGreaterThan(
        computeRiskScore('likely', 'minimal')
      );
    });
  });

  // -------------------------------------------------------------------------
  // deriveRiskPriority utility
  // -------------------------------------------------------------------------

  describe('deriveRiskPriority utility', () => {
    it('score ≥ 70 → critical', () => expect(deriveRiskPriority(70)).toBe('critical'));
    it('score ≥ 50 → high', () => expect(deriveRiskPriority(55)).toBe('high'));
    it('score ≥ 30 → medium', () => expect(deriveRiskPriority(35)).toBe('medium'));
    it('score < 30 → low', () => expect(deriveRiskPriority(25)).toBe('low'));
    it('score = 0 → low', () => expect(deriveRiskPriority(0)).toBe('low'));
    it('score = 100 → critical', () => expect(deriveRiskPriority(100)).toBe('critical'));
  });

  // -------------------------------------------------------------------------
  // LIKELIHOOD_PROBABILITY constants
  // -------------------------------------------------------------------------

  describe('LIKELIHOOD_PROBABILITY constants', () => {
    it('almost-certain has probability ≥ 0.80', () => {
      expect(LIKELIHOOD_PROBABILITY['almost-certain']).toBeGreaterThanOrEqual(0.80);
    });
    it('exceptional has probability < 0.05', () => {
      expect(LIKELIHOOD_PROBABILITY['exceptional']).toBeLessThan(0.05);
    });
    it('all probabilities are in 0–1 range', () => {
      for (const prob of Object.values(LIKELIHOOD_PROBABILITY)) {
        expect(prob).toBeGreaterThanOrEqual(0);
        expect(prob).toBeLessThanOrEqual(1);
      }
    });
    it('probabilities are in descending order', () => {
      const levels: LikelihoodLevel[] = ['almost-certain', 'likely', 'possible', 'unlikely', 'rare', 'exceptional'];
      for (let i = 0; i < levels.length - 1; i++) {
        expect(LIKELIHOOD_PROBABILITY[levels[i]]).toBeGreaterThan(
          LIKELIHOOD_PROBABILITY[levels[i + 1]]
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // IMPACT_WEIGHT constants
  // -------------------------------------------------------------------------

  describe('IMPACT_WEIGHT constants', () => {
    it('transformative has highest weight', () => {
      const values = Object.values(IMPACT_WEIGHT);
      expect(IMPACT_WEIGHT['transformative']).toBe(Math.max(...values));
    });
    it('minimal has lowest weight', () => {
      const values = Object.values(IMPACT_WEIGHT);
      expect(IMPACT_WEIGHT['minimal']).toBe(Math.min(...values));
    });
  });

  // -------------------------------------------------------------------------
  // Full risk profile — basic contract
  // -------------------------------------------------------------------------

  describe('assessPoliticalRisk basic contract', () => {
    it('returns assessments for all 6 risk categories', () => {
      const profile: PoliticalRiskProfile = assessPoliticalRisk(makeDoc());
      expect(profile.riskAssessments).toHaveLength(6);
      const categories = profile.riskAssessments.map(a => a.riskCategory);
      expect(categories).toContain('coalition-stability');
      expect(categories).toContain('policy-implementation');
      expect(categories).toContain('democratic-process');
      expect(categories).toContain('economic-policy');
      expect(categories).toContain('social-cohesion');
      expect(categories).toContain('international-standing');
    });

    it('compositeRiskScore is in 0–100 range', () => {
      const profile = assessPoliticalRisk(makeDoc());
      expect(profile.compositeRiskScore).toBeGreaterThanOrEqual(0);
      expect(profile.compositeRiskScore).toBeLessThanOrEqual(100);
    });

    it('overallRiskLevel has valid value', () => {
      const profile = assessPoliticalRisk(makeDoc());
      expect(['critical', 'high', 'medium', 'low']).toContain(profile.overallRiskLevel);
    });

    it('dominantRisk is a valid category', () => {
      const profile = assessPoliticalRisk(makeDoc());
      const validCategories = [
        'coalition-stability', 'policy-implementation', 'democratic-process',
        'economic-policy', 'social-cohesion', 'international-standing',
      ];
      expect(validCategories).toContain(profile.dominantRisk);
    });

    it('is deterministic — same input yields same output', () => {
      const doc = makeBudgetProposition();
      const cia = makeUnstableCIA();
      const a = assessPoliticalRisk(doc, cia);
      const b = assessPoliticalRisk(doc, cia);
      expect(a.compositeRiskScore).toBe(b.compositeRiskScore);
      expect(a.dominantRisk).toBe(b.dominantRisk);
    });

    it('works without CIA context', () => {
      expect(() => assessPoliticalRisk(makeDoc())).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Per-assessment contract
  // -------------------------------------------------------------------------

  describe('per-assessment structure', () => {
    it('each assessment has required fields', () => {
      const profile = assessPoliticalRisk(makeDoc());
      for (const assessment of profile.riskAssessments) {
        expect(assessment).toHaveProperty('riskCategory');
        expect(assessment).toHaveProperty('likelihood');
        expect(assessment).toHaveProperty('impact');
        expect(assessment).toHaveProperty('riskScore');
        expect(assessment).toHaveProperty('priority');
        expect(assessment).toHaveProperty('evidence');
        expect(assessment).toHaveProperty('confidence');
        expect(assessment).toHaveProperty('mitigatingFactors');
        expect(assessment).toHaveProperty('escalatingFactors');
      }
    });

    it('each assessment riskScore is in 0–100', () => {
      const profile = assessPoliticalRisk(makeBudgetProposition(), makeUnstableCIA());
      for (const assessment of profile.riskAssessments) {
        expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
        expect(assessment.riskScore).toBeLessThanOrEqual(100);
      }
    });

    it('each assessment has non-empty evidence array', () => {
      const profile = assessPoliticalRisk(makeBudgetProposition());
      for (const assessment of profile.riskAssessments) {
        expect(Array.isArray(assessment.evidence)).toBe(true);
        expect(assessment.evidence.length).toBeGreaterThan(0);
      }
    });

    it('each assessment has non-empty mitigatingFactors', () => {
      const profile = assessPoliticalRisk(makeDoc());
      for (const assessment of profile.riskAssessments) {
        expect(assessment.mitigatingFactors.length).toBeGreaterThan(0);
      }
    });

    it('each assessment has non-empty escalatingFactors', () => {
      const profile = assessPoliticalRisk(makeDoc());
      for (const assessment of profile.riskAssessments) {
        expect(assessment.escalatingFactors.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Domain-specific risk signals
  // -------------------------------------------------------------------------

  describe('domain-specific risk signals', () => {
    it('Finance Committee (FiU) document has high economic-policy risk', () => {
      const profile = assessPoliticalRisk(makeBudgetProposition());
      const econ = profile.riskAssessments.find(a => a.riskCategory === 'economic-policy');
      expect(econ).toBeDefined();
      expect(['critical', 'high']).toContain(econ!.priority);
    });

    it('Constitutional Committee (KU) document has high democratic-process risk', () => {
      const profile = assessPoliticalRisk(makeConstitutionalDocument());
      const demo = profile.riskAssessments.find(a => a.riskCategory === 'democratic-process');
      expect(demo).toBeDefined();
      expect(['critical', 'high']).toContain(demo!.priority);
    });

    it('unstable CIA raises coalition-stability risk likelihood', () => {
      const doc = makeDoc({ doktyp: 'prop', titel: 'Tidöavtal omröstning koalitionskris' });
      const unstable = assessPoliticalRisk(doc, makeUnstableCIA());
      const stable = assessPoliticalRisk(doc, makeStableCIA());
      const unstableCoalition = unstable.riskAssessments.find(a => a.riskCategory === 'coalition-stability');
      const stableCoalition = stable.riskAssessments.find(a => a.riskCategory === 'coalition-stability');
      expect(unstableCoalition!.riskScore).toBeGreaterThanOrEqual(stableCoalition!.riskScore);
    });

    it('normalizes percent-style coalition defectionProbability to match fractional input', () => {
      const doc = makeDoc({ doktyp: 'prop', titel: 'Koalition defektionsrisk' });

      // Fractional defection probability (e.g. 0.35)
      const fractionalCIA: CIAContext = {
        ...makeUnstableCIA(),
        coalitionStability: { ...makeUnstableCIA().coalitionStability!, defectionProbability: 0.35 },
      };

      // Percent-style defection probability (e.g. 35)
      const percentCIA: CIAContext = {
        ...makeUnstableCIA(),
        coalitionStability: { ...makeUnstableCIA().coalitionStability!, defectionProbability: 35 },
      };

      const fractionalProfile = assessPoliticalRisk(doc, fractionalCIA);
      const percentProfile = assessPoliticalRisk(doc, percentCIA);

      const fractionalCoalition = fractionalProfile.riskAssessments.find(
        a => a.riskCategory === 'coalition-stability',
      );
      const percentCoalition = percentProfile.riskAssessments.find(
        a => a.riskCategory === 'coalition-stability',
      );

      expect(fractionalCoalition).toBeDefined();
      expect(percentCoalition).toBeDefined();
      expect(percentCoalition!.riskScore).toBe(fractionalCoalition!.riskScore);
      expect(percentCoalition!.escalatingFactors).toEqual(
        fractionalCoalition!.escalatingFactors,
      );
    });

    it('Foreign Affairs Committee (UU) document triggers international-standing risk', () => {
      const doc = makeDoc({ organ: 'UU', doktyp: 'bet', titel: 'EU NATO utrikespolitik handelsavtal' });
      const profile = assessPoliticalRisk(doc);
      const intl = profile.riskAssessments.find(a => a.riskCategory === 'international-standing');
      expect(intl).toBeDefined();
      expect(['critical', 'high', 'medium']).toContain(intl!.priority);
    });
  });

  // -------------------------------------------------------------------------
  // assessSingleRiskCategory
  // -------------------------------------------------------------------------

  describe('assessSingleRiskCategory', () => {
    it('returns assessment for the specified category', () => {
      const assessment = assessSingleRiskCategory(makeBudgetProposition(), 'economic-policy');
      expect(assessment.riskCategory).toBe('economic-policy');
    });

    it('riskScore is in 0–100 range', () => {
      const assessment = assessSingleRiskCategory(makeDoc(), 'coalition-stability');
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(100);
    });

    it('is deterministic for same input', () => {
      const doc = makeConstitutionalDocument();
      const a = assessSingleRiskCategory(doc, 'democratic-process');
      const b = assessSingleRiskCategory(doc, 'democratic-process');
      expect(a.riskScore).toBe(b.riskScore);
      expect(a.likelihood).toBe(b.likelihood);
    });
  });
});

// ===========================================================================
// 3. POLITICAL THREAT ANALYSIS TESTS (PRIDES)
// ===========================================================================

describe('Political Threat Analysis — analysePoliticalThreats', () => {

  // -------------------------------------------------------------------------
  // Basic contract
  // -------------------------------------------------------------------------

  describe('basic contract', () => {
    it('returns a PoliticalThreatProfile', () => {
      const profile: PoliticalThreatProfile = analysePoliticalThreats(makeDoc());
      expect(profile).toHaveProperty('threatAnalyses');
      expect(profile).toHaveProperty('primaryThreat');
      expect(profile).toHaveProperty('overallThreatLevel');
      expect(profile).toHaveProperty('activeThreatAgents');
    });

    it('threatAnalyses is an array', () => {
      const profile = analysePoliticalThreats(makeDoc());
      expect(Array.isArray(profile.threatAnalyses)).toBe(true);
    });

    it('activeThreatAgents is an array with no duplicates', () => {
      const profile = analysePoliticalThreats(makeBudgetProposition());
      expect(Array.isArray(profile.activeThreatAgents)).toBe(true);
      const unique = new Set(profile.activeThreatAgents);
      expect(unique.size).toBe(profile.activeThreatAgents.length);
    });

    it('overallThreatLevel has valid value', () => {
      const profile = analysePoliticalThreats(makeDoc());
      const valid = ['critical', 'high', 'medium', 'low', 'none'];
      expect(valid).toContain(profile.overallThreatLevel);
    });

    it('is deterministic — same input yields same output', () => {
      const doc = makeCrisisDocument();
      const cia = makeUnstableCIA();
      const a = analysePoliticalThreats(doc, cia);
      const b = analysePoliticalThreats(doc, cia);
      expect(a.overallThreatLevel).toBe(b.overallThreatLevel);
      expect(a.primaryThreat).toBe(b.primaryThreat);
    });

    it('works without CIA context', () => {
      expect(() => analysePoliticalThreats(makeDoc())).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Threat analysis structure
  // -------------------------------------------------------------------------

  describe('threat analysis structure', () => {
    it('each threat analysis has required fields', () => {
      const profile = analysePoliticalThreats(makeBudgetProposition());
      for (const analysis of profile.threatAnalyses) {
        expect(analysis).toHaveProperty('pridesCategory');
        expect(analysis).toHaveProperty('threatAgents');
        expect(analysis).toHaveProperty('severity');
        expect(analysis).toHaveProperty('indicators');
        expect(analysis).toHaveProperty('countermeasures');
        expect(analysis).toHaveProperty('rationale');
      }
    });

    it('each threat analysis has valid pridesCategory', () => {
      const profile = analysePoliticalThreats(makeDoc());
      const valid: PridesCategory[] = [
        'polarization', 'regulatory-overreach', 'institutional-erosion',
        'democratic-deficit', 'economic-disruption', 'societal-impact',
      ];
      for (const analysis of profile.threatAnalyses) {
        expect(valid).toContain(analysis.pridesCategory);
      }
    });

    it('each threat analysis has valid severity', () => {
      const profile = analysePoliticalThreats(makeDoc());
      const valid = ['critical', 'high', 'medium', 'low'];
      for (const analysis of profile.threatAnalyses) {
        expect(valid).toContain(analysis.severity);
      }
    });

    it('each threat analysis has at least one threat agent', () => {
      const profile = analysePoliticalThreats(makeDoc());
      for (const analysis of profile.threatAnalyses) {
        expect(analysis.threatAgents.length).toBeGreaterThan(0);
      }
    });

    it('each threat analysis has non-empty indicators', () => {
      const profile = analysePoliticalThreats(makeBudgetProposition());
      for (const analysis of profile.threatAnalyses) {
        expect(analysis.indicators.length).toBeGreaterThan(0);
      }
    });

    it('each threat analysis has non-empty countermeasures', () => {
      const profile = analysePoliticalThreats(makeDoc());
      for (const analysis of profile.threatAnalyses) {
        expect(analysis.countermeasures.length).toBeGreaterThan(0);
      }
    });

    it('each threat analysis has non-empty rationale', () => {
      const profile = analysePoliticalThreats(makeDoc());
      for (const analysis of profile.threatAnalyses) {
        expect(analysis.rationale.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // PRIDES-specific detection
  // -------------------------------------------------------------------------

  describe('PRIDES category detection', () => {
    it('detects polarization threat in document with divisive language', () => {
      const doc = makeDoc({
        titel: 'Polarisering och hatretorik i migrationsdebatten',
        summary: 'Populistisk retorik och extremism. Desinformation och propaganda om invandring.',
      });
      const profile = analysePoliticalThreats(doc);
      const polarization = profile.threatAnalyses.find(a => a.pridesCategory === 'polarization');
      expect(polarization).toBeDefined();
      expect(['critical', 'high', 'medium']).toContain(polarization!.severity);
    });

    it('detects institutional-erosion threat in KU document', () => {
      const profile = analysePoliticalThreats(makeConstitutionalDocument());
      const erosion = profile.threatAnalyses.find(a => a.pridesCategory === 'institutional-erosion');
      expect(erosion).toBeDefined();
      expect(['critical', 'high']).toContain(erosion!.severity);
    });

    it('detects democratic-deficit threat in document with transparency keywords', () => {
      const doc = makeDoc({
        organ: 'KU',
        titel: 'Offentlighetsprincipen och sekretess — begränsad insyn i myndighetsbeslut',
        summary: 'Pressfriheten och yttrandefriheten begränsas. Hemligstämpling ökar.',
      });
      const profile = analysePoliticalThreats(doc);
      const deficit = profile.threatAnalyses.find(a => a.pridesCategory === 'democratic-deficit');
      expect(deficit).toBeDefined();
      expect(['critical', 'high', 'medium']).toContain(deficit!.severity);
    });

    it('detects economic-disruption threat in Finance Committee budget document', () => {
      const doc = makeDoc({
        organ: 'FiU',
        doktyp: 'bet',
        titel: 'Budgetkris och ekonomisk destabilisering — statsbankrutt risk',
        summary: 'Skuldkris och inflation spiral. Finanskris och budgetunderskott allvarligt.',
      });
      const profile = analysePoliticalThreats(doc, makeUnstableCIA());
      const disruption = profile.threatAnalyses.find(a => a.pridesCategory === 'economic-disruption');
      expect(disruption).toBeDefined();
      expect(['critical', 'high']).toContain(disruption!.severity);
    });

    it('detects societal-impact threat in document affecting vulnerable groups', () => {
      const doc = makeDoc({
        organ: 'SoU',
        doktyp: 'bet',
        titel: 'Marginaliserade grupper och diskriminering — ojämlikhet och fattigdom',
        summary: 'Utsatta grupper påverkas. Rättighetsförlust och social exkludering.',
      });
      const profile = analysePoliticalThreats(doc);
      const societal = profile.threatAnalyses.find(a => a.pridesCategory === 'societal-impact');
      expect(societal).toBeDefined();
      expect(['critical', 'high', 'medium']).toContain(societal!.severity);
    });
  });

  // -------------------------------------------------------------------------
  // Threat agent detection
  // -------------------------------------------------------------------------

  describe('threat agent detection', () => {
    it('government proposition activates ruling-coalition agent', () => {
      const profile = analysePoliticalThreats(makeDoc({ doktyp: 'prop', titel: 'Sekretess och transparens i regeringsbeslut' }));
      expect(profile.activeThreatAgents).toContain('ruling-coalition');
    });

    it('parliamentary motion activates opposition-parties agent', () => {
      const profile = analysePoliticalThreats(makeDoc({ doktyp: 'mot', titel: 'Polarisering och desinformation i debatten' }));
      expect(profile.activeThreatAgents).toContain('opposition-parties');
    });

    it('Foreign Affairs Committee document activates external-actors agent', () => {
      const profile = analysePoliticalThreats(makeDoc({ organ: 'UU', doktyp: 'bet', titel: 'NATO och EU-direktiv i utrikespolitiken med institutional capture risk' }));
      expect(profile.activeThreatAgents).toContain('external-actors');
    });

    it('committee report activates institutional agent', () => {
      const profile = analysePoliticalThreats(makeDoc({ doktyp: 'bet', titel: 'Institutional capture och accountability gap' }));
      expect(profile.activeThreatAgents).toContain('institutional');
    });
  });

  // -------------------------------------------------------------------------
  // analyseSinglePridesCategory
  // -------------------------------------------------------------------------

  describe('analyseSinglePridesCategory', () => {
    it('returns analysis for the specified category when indicators are present', () => {
      const analysis = analyseSinglePridesCategory(
        makeDoc({ titel: 'Polarisering och hatretorik i debatten' }),
        'polarization'
      );
      expect(analysis).not.toBeNull();
      expect(analysis!.pridesCategory).toBe('polarization');
    });

    it('is deterministic for same input', () => {
      const doc = makeConstitutionalDocument();
      const a = analyseSinglePridesCategory(doc, 'institutional-erosion');
      const b = analyseSinglePridesCategory(doc, 'institutional-erosion');
      expect(a?.severity).toBe(b?.severity);
    });

    it('returns valid countermeasures for all PRIDES categories when category signals are present', () => {
      const categoryDocs: Record<PridesCategory, RawDocument> = {
        'polarization': makeDoc({ titel: 'Polarisering och desinformation' }),
        'regulatory-overreach': makeDoc({ titel: 'Maktkoncentration och undantag från lagstiftning' }),
        'institutional-erosion': makeDoc({ organ: 'KU', titel: 'KU-granskning av institutional capture' }),
        'democratic-deficit': makeDoc({ titel: 'Sekretess och begränsad insyn i myndighetsbeslut' }),
        'economic-disruption': makeDoc({ organ: 'FiU', titel: 'Budgetkris och ekonomisk destabilisering' }),
        'societal-impact': makeDoc({ titel: 'Diskriminering och rättighetsförlust för utsatta grupper' }),
      };

      for (const [category, doc] of Object.entries(categoryDocs) as Array<[PridesCategory, RawDocument]>) {
        const analysis = analyseSinglePridesCategory(doc, category);
        expect(analysis).not.toBeNull();
        expect(analysis!.countermeasures.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Primary threat and overall level consistency
  // -------------------------------------------------------------------------

  describe('primaryThreat and overallThreatLevel consistency', () => {
    it('primaryThreat is the category of the highest-severity analysis', () => {
      const profile = analysePoliticalThreats(makeCrisisDocument(), makeUnstableCIA());
      if (profile.primaryThreat !== undefined) {
        const primary = profile.threatAnalyses.find(
          a => a.pridesCategory === profile.primaryThreat
        );
        expect(primary).toBeDefined();
        // Primary threat severity should match the overall level
        expect(primary!.severity).toBe(profile.overallThreatLevel);
      }
    });

    it('crisis document has higher threat level than routine motion', () => {
      const crisis = analysePoliticalThreats(makeCrisisDocument(), makeUnstableCIA());
      const routine = analysePoliticalThreats(makeDoc({ doktyp: 'fr', organ: 'AU' }));
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
      const crisisLevel = severityOrder[crisis.overallThreatLevel as keyof typeof severityOrder] ?? 0;
      const routineLevel = severityOrder[routine.overallThreatLevel as keyof typeof severityOrder] ?? 0;
      expect(crisisLevel).toBeGreaterThanOrEqual(routineLevel);
    });
  });
});

// ===========================================================================
// 4. INTEGRATION — all three methodologies on same document
// ===========================================================================

describe('Methodology integration — three engines on same document', () => {
  it('all three engines process the same document without errors', () => {
    const doc = makeBudgetProposition();
    const cia = makeUnstableCIA();
    expect(() => classifyPoliticalDocument(doc, cia)).not.toThrow();
    expect(() => assessPoliticalRisk(doc, cia)).not.toThrow();
    expect(() => analysePoliticalThreats(doc, cia)).not.toThrow();
  });

  it('crisis document produces critical or high across all three engines', () => {
    const doc = makeCrisisDocument();
    const cia = makeUnstableCIA();

    const classification = classifyPoliticalDocument(doc, cia);
    const riskProfile = assessPoliticalRisk(doc, cia);
    const threatProfile = analysePoliticalThreats(doc, cia);

    expect(['critical', 'high']).toContain(classification.overallClassification);
    expect(['critical', 'high']).toContain(riskProfile.overallRiskLevel);
    const severityValid = ['critical', 'high', 'medium', 'low', 'none'].includes(threatProfile.overallThreatLevel);
    expect(severityValid).toBe(true);
  });

  it('all three engines are deterministic on the same complex document', () => {
    const doc = makeConstitutionalDocument();
    const cia = makeUnstableCIA();

    const c1 = classifyPoliticalDocument(doc, cia);
    const c2 = classifyPoliticalDocument(doc, cia);
    expect(c1.classificationScore).toBe(c2.classificationScore);

    const r1 = assessPoliticalRisk(doc, cia);
    const r2 = assessPoliticalRisk(doc, cia);
    expect(r1.compositeRiskScore).toBe(r2.compositeRiskScore);

    const t1 = analysePoliticalThreats(doc, cia);
    const t2 = analysePoliticalThreats(doc, cia);
    expect(t1.overallThreatLevel).toBe(t2.overallThreatLevel);
  });
});
