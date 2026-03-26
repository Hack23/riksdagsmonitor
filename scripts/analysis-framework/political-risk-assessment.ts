/**
 * @module analysis-framework/political-risk-assessment
 * @description Political risk scoring engine implementing Likelihood × Impact
 * risk assessment for parliamentary documents.
 *
 * Inspired by ISMS Risk_Assessment_Methodology.md (Quantitative risk scoring),
 * adapted for political intelligence analysis of Swedish parliamentary context.
 *
 * ## Risk Categories
 * - Coalition Stability — Government collapse or realignment risk
 * - Policy Implementation — Policy failure or stalling risk
 * - Democratic Process — Threat to democratic norms and institutions
 * - Economic Policy — Fiscal/monetary policy decision risk
 * - Social Cohesion — Societal division or unrest risk
 * - International Standing — Sweden's international position risk
 *
 * ## Scoring Formula
 * Risk Score = likelihood_probability × impact_weight × 10, clamped to 0–100
 *
 * The engine is **pure** — deterministic for the same input, no side effects.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../data-transformers/types.js';
import type {
  PoliticalRiskAssessment,
  PoliticalRiskProfile,
  PoliticalRiskCategory,
  LikelihoodLevel,
  RiskImpactLevel,
} from './methodology-types.js';
import {
  LIKELIHOOD_PROBABILITY,
  IMPACT_WEIGHT,
} from './methodology-types.js';

// ---------------------------------------------------------------------------
// Keyword banks per risk category
// ---------------------------------------------------------------------------

/** Keywords signalling coalition stability risk */
const COALITION_RISK_KEYWORDS: readonly string[] = [
  'tidöavtal', 'samarbetspartier', 'sd-stöd', 'partiledare',
  'oenighet', 'spricka', 'misstroendevotum', 'misstroende',
  'koalitionskris', 'budgetomröstning', 'budgetkompromiss',
  'coalition', 'confidence vote', 'no-confidence', 'government crisis',
];

/** Keywords signalling policy implementation risk */
const POLICY_RISK_KEYWORDS: readonly string[] = [
  'remissrunda', 'parlamentarisk beredning', 'utredning', 'betänkande',
  'genomförande', 'implementering', 'lagstiftningsprocess',
  'opposition blockerar', 'riksdagen avslår', 'avslag',
  'implementation', 'legislative process', 'parliamentary approval', 'blocked',
];

/** Keywords signalling democratic process risk */
const DEMOCRATIC_RISK_KEYWORDS: readonly string[] = [
  'grundlag', 'konstitutionsutskott', 'KU-granskning', 'demokrati',
  'offentlighetsprincipen', 'transparens', 'yttrandefrihet', 'pressfrihet',
  'vallag', 'rösträtt', 'minoritetsskydd',
  'constitutional', 'democratic', 'transparency', 'freedom of press',
  'voting rights', 'minority rights', 'rule of law', 'rättsstat',
];

/** Keywords signalling economic policy risk */
const ECONOMIC_RISK_KEYWORDS: readonly string[] = [
  'statsbudget', 'budgetproposition', 'skatt', 'inflation', 'ränta',
  'konjunktur', 'BNP', 'statsskuld', 'underskott', 'surplus',
  'miljoner', 'miljarder', 'penningpolitik', 'riksbanken',
  'fiscal', 'monetary', 'GDP', 'debt', 'deficit', 'tax', 'interest rate',
];

/** Keywords signalling social cohesion risk */
const SOCIAL_RISK_KEYWORDS: readonly string[] = [
  'segregation', 'diskriminering', 'jämlikhet', 'ojämlikhet',
  'välfärd', 'socialbidrag', 'fattigdom', 'integration',
  'invandring', 'flyktingar', 'social oro', 'strejk',
  'discrimination', 'equality', 'welfare', 'poverty', 'social unrest',
  'migration', 'integration', 'vulnerable groups',
];

/** Keywords signalling international standing risk */
const INTERNATIONAL_RISK_KEYWORDS: readonly string[] = [
  'NATO', 'FN', 'nordiskt samarbete', 'utrikespolitik',
  'handelsavtal', 'sanktioner', 'diplomatisk', 'ambassad',
  'internationella åtaganden', 'EU-direktiv', 'EU-förordning',
  'treaty', 'international obligations', 'foreign policy', 'sanctions',
  'diplomacy', 'Nordic cooperation', 'European Union',
];

// ---------------------------------------------------------------------------
// Likelihood assessment helpers
// ---------------------------------------------------------------------------

/** Committees with elevated social cohesion risk relevance */
const SOCIAL_COHESION_COMMITTEES = new Set(['SoU', 'SfU', 'AU']);

function getDocText(doc: RawDocument): string {
  return [
    doc.titel, doc.rubrik, doc.undertitel, doc.title,
    doc.summary, doc.notis, doc.fullText,
  ].filter(Boolean).join(' ');
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordMatches(textLower: string, keyword: string): boolean {
  // Use word-boundary matching for short/uppercase abbreviations to avoid
  // false positives (e.g. 'EU' matching inside unrelated words).
  const isShortAbbreviation = /^[A-ZÅÄÖ]{2,4}$/.test(keyword);
  if (isShortAbbreviation) {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, 'i');
    return pattern.test(textLower);
  }
  return textLower.includes(keyword.toLowerCase());
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => keywordMatches(lower, kw));
}

function countMatches(text: string, keywords: readonly string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => keywordMatches(lower, kw)).length;
}

/**
 * Assess coalition stability likelihood based on CIA data and document signals.
 */
function assessCoalitionLikelihood(doc: RawDocument, cia: CIAContext | undefined): LikelihoodLevel {
  const text = getDocText(doc);
  const keywordMatches = countMatches(text, COALITION_RISK_KEYWORDS);
  const stability = cia?.coalitionStability?.stabilityScore;
  const margin = cia?.coalitionStability?.majorityMargin;

  // Very unstable coalition + crisis keywords → almost certain
  if (stability !== undefined && stability < 30 && keywordMatches >= 2) return 'almost-certain';
  // Unstable coalition with some signals → likely
  if (stability !== undefined && stability < 50 && keywordMatches >= 1) return 'likely';
  // Thin majority + any signal → possible
  if (margin !== undefined && margin <= 2 && keywordMatches >= 1) return 'possible';
  // Document mentions coalition dynamics → unlikely
  if (keywordMatches >= 1) return 'unlikely';
  return 'rare';
}

/**
 * Assess policy implementation likelihood based on document type and content.
 */
function assessPolicyImplementationLikelihood(doc: RawDocument, cia: CIAContext | undefined): LikelihoodLevel {
  const text = getDocText(doc);
  const keywordMatches = countMatches(text, POLICY_RISK_KEYWORDS);
  const docType = doc.doktyp ?? '';

  // Committee reports are high-signal implementation inputs by default
  if (docType === 'bet') return keywordMatches >= 1 ? 'almost-certain' : 'likely';
  // Government propositions — high likelihood of implementation risk assessment needed
  if (docType === 'prop') {
    const motionDenialRate = cia?.overallMotionDenialRate ?? 50;
    // When most opposition motions are denied, government policy faces less obstruction
    if (motionDenialRate > 90) return 'likely';
    return 'possible';
  }
  // Interpellations signal policy criticism
  if (docType === 'ip' && keywordMatches >= 1) return 'possible';
  if (keywordMatches >= 2) return 'possible';
  if (keywordMatches >= 1) return 'unlikely';
  return 'rare';
}

/**
 * Assess democratic process risk likelihood.
 */
function assessDemocraticProcessLikelihood(doc: RawDocument): LikelihoodLevel {
  const text = getDocText(doc);
  const keywordMatches = countMatches(text, DEMOCRATIC_RISK_KEYWORDS);

  if (doc.organ === 'KU') return 'almost-certain'; // KU documents always involve democratic oversight
  if (keywordMatches >= 3) return 'likely';
  if (keywordMatches >= 2) return 'possible';
  if (keywordMatches >= 1) return 'unlikely';
  return 'rare';
}

/**
 * Assess economic policy risk likelihood.
 */
function assessEconomicPolicyLikelihood(doc: RawDocument, cia: CIAContext | undefined): LikelihoodLevel {
  const text = getDocText(doc);
  const keywordMatches = countMatches(text, ECONOMIC_RISK_KEYWORDS);

  if (doc.organ === 'FiU') {
    if (keywordMatches >= 2) return 'almost-certain';
    return 'likely';
  }
  if (keywordMatches >= 3) return 'likely';
  if (keywordMatches >= 2) return 'possible';
  if (keywordMatches >= 1) return 'unlikely';
  // High instability makes economic risk more likely even without direct signals
  if (cia?.coalitionStability?.stabilityScore !== undefined && cia.coalitionStability.stabilityScore < 40) {
    return 'unlikely';
  }
  return 'rare';
}

/**
 * Assess social cohesion risk likelihood.
 */
function assessSocialCohesionLikelihood(doc: RawDocument): LikelihoodLevel {
  const text = getDocText(doc);
  const keywordMatches = countMatches(text, SOCIAL_RISK_KEYWORDS);
  const committee = doc.organ ?? '';

  if (SOCIAL_COHESION_COMMITTEES.has(committee) && keywordMatches >= 2) return 'likely';
  if (keywordMatches >= 3) return 'likely';
  if (keywordMatches >= 2) return 'possible';
  if (keywordMatches >= 1) return 'unlikely';
  return 'rare';
}

/**
 * Assess international standing risk likelihood.
 */
function assessInternationalLikelihood(doc: RawDocument): LikelihoodLevel {
  const text = getDocText(doc);
  const keywordMatches = countMatches(text, INTERNATIONAL_RISK_KEYWORDS);

  if (doc.organ === 'UU') {
    if (keywordMatches >= 2) return 'almost-certain';
    return 'likely';
  }
  if (doc.organ === 'FöU' && keywordMatches >= 1) return 'likely';
  if (keywordMatches >= 3) return 'likely';
  if (keywordMatches >= 2) return 'possible';
  if (keywordMatches >= 1) return 'unlikely';
  return 'rare';
}

// ---------------------------------------------------------------------------
// Impact assessment helpers
// ---------------------------------------------------------------------------

function assessCoalitionImpact(doc: RawDocument, cia: CIAContext | undefined): RiskImpactLevel {
  const stability = cia?.coalitionStability?.stabilityScore;
  const text = getDocText(doc);
  const hasExplosiveContent = containsAny(text, ['misstroendevotum', 'misstroende', 'no-confidence']);

  if (hasExplosiveContent) return 'transformative';
  if (stability !== undefined && stability < 30) return 'critical';
  if (stability !== undefined && stability < 50) return 'high';
  return 'moderate';
}

function assessPolicyImpact(doc: RawDocument): RiskImpactLevel {
  const docType = doc.doktyp ?? '';
  if (docType === 'prop' || docType === 'bet') return 'high';
  if (docType === 'sou' || docType === 'skr') return 'moderate';
  return 'low';
}

function assessDemocraticImpact(doc: RawDocument): RiskImpactLevel {
  const text = getDocText(doc);
  if (containsAny(text, ['grundlag', 'konstitution', 'constitutional', 'fundamental law'])) {
    return 'transformative';
  }
  if (doc.organ === 'KU') return 'critical';
  return 'high';
}

function assessEconomicImpact(doc: RawDocument): RiskImpactLevel {
  if (doc.organ === 'FiU' && (doc.doktyp === 'bet' || doc.doktyp === 'prop')) return 'transformative';
  const text = getDocText(doc);
  if (containsAny(text, ['statsbudget', 'budgetproposition', 'BNP', 'GDP'])) return 'critical';
  if (containsAny(text, ECONOMIC_RISK_KEYWORDS)) return 'high';
  return 'moderate';
}

function assessSocialImpact(doc: RawDocument): RiskImpactLevel {
  const committee = doc.organ ?? '';
  if (new Set(['SoU', 'SfU']).has(committee) && doc.doktyp === 'prop') return 'high';
  const text = getDocText(doc);
  if (containsAny(text, ['segregation', 'diskriminering', 'discrimination', 'poverty', 'fattigdom'])) return 'high';
  return 'moderate';
}

function assessInternationalImpact(doc: RawDocument): RiskImpactLevel {
  if (doc.organ === 'UU' || doc.organ === 'FöU') return 'high';
  const text = getDocText(doc);
  if (containsAny(text, ['NATO', 'EU-direktiv', 'internationella åtaganden', 'treaty obligations'])) return 'high';
  return 'moderate';
}

// ---------------------------------------------------------------------------
// Evidence extraction
// ---------------------------------------------------------------------------

function extractEvidence(doc: RawDocument, category: PoliticalRiskCategory, cia: CIAContext | undefined): string[] {
  const evidence: string[] = [];
  const docId = doc.dok_id;

  if (docId) {
    evidence.push(`Document: ${docId} (${doc.doktyp ?? 'unknown'} in ${doc.organ ?? 'unknown'})`);
  }

  if (doc.speeches && doc.speeches.length > 0) {
    const relevantSpeeches = doc.speeches
      .filter(s => s.text && s.text.length > 0)
      .slice(0, 2);
    for (const speech of relevantSpeeches) {
      if (speech.talare) {
        evidence.push(`Speech by ${speech.talare} (${speech.parti ?? 'unknown party'})`);
      }
    }
  }

  // Category-specific evidence signals
  switch (category) {
    case 'coalition-stability':
      if (doc.parti) evidence.push(`Party affiliation: ${doc.parti}`);
      if (cia?.coalitionStability?.stabilityScore !== undefined) {
        evidence.push(`CIA coalition stability score: ${cia.coalitionStability.stabilityScore}`);
      }
      if (cia?.coalitionStability?.majorityMargin !== undefined) {
        evidence.push(`CIA majority margin: ${cia.coalitionStability.majorityMargin}`);
      }
      if (cia?.coalitionStability?.defectionProbability !== undefined) {
        evidence.push(`CIA defection probability: ${cia.coalitionStability.defectionProbability}`);
      }
      break;
    case 'democratic-process':
      if (doc.organ === 'KU') evidence.push('Constitutional Committee (KU) involvement');
      break;
    case 'economic-policy':
      if (doc.organ === 'FiU') evidence.push('Finance Committee (FiU) involvement');
      break;
    case 'international-standing':
      if (doc.organ === 'UU') evidence.push('Foreign Affairs Committee (UU) involvement');
      if (doc.organ === 'FöU') evidence.push('Defence Committee (FöU) involvement');
      break;
    default:
      break;
  }

  if (category !== 'coalition-stability' && cia?.coalitionStability?.stabilityScore !== undefined) {
    evidence.push(`CIA coalition context: stability=${cia.coalitionStability.stabilityScore}, majorityMargin=${cia.coalitionStability.majorityMargin}, defectionProbability=${cia.coalitionStability.defectionProbability}`);
  }

  return evidence;
}

// ---------------------------------------------------------------------------
// Mitigating / escalating factors
// ---------------------------------------------------------------------------

function getMitigatingFactors(category: PoliticalRiskCategory, cia: CIAContext | undefined): string[] {
  const factors: string[] = [];
  const stability = cia?.coalitionStability?.stabilityScore;

  switch (category) {
    case 'coalition-stability':
      if (stability !== undefined && stability >= 70) {
        factors.push('Coalition stability score is high — low defection risk');
      }
      if (cia?.coalitionStability?.majorityMargin !== undefined && cia.coalitionStability.majorityMargin > 5) {
        factors.push('Comfortable parliamentary majority reduces collapse risk');
      }
      // Always include a baseline mitigating factor
      factors.push('Swedish constitutional norms require democratic transitions through electoral process');
      break;
    case 'policy-implementation':
      if (cia?.overallMotionDenialRate !== undefined && cia.overallMotionDenialRate > 95) {
        factors.push('Government controls parliament — high policy implementation success rate');
      }
      factors.push('Riksdag committee scrutiny provides quality assurance for legislation');
      factors.push('Lagrådet (Council on Legislation) reviews government proposals for legal compliance');
      break;
    case 'democratic-process':
      factors.push('Swedish constitutional review process (Lagrådet) provides safeguard');
      factors.push('Riksdag committee scrutiny provides democratic oversight');
      break;
    case 'economic-policy':
      factors.push('Riksbank independent mandate provides monetary policy buffer');
      factors.push('EU fiscal frameworks constrain extreme fiscal departures');
      break;
    case 'social-cohesion':
      factors.push('Swedish welfare state provides social safety net baseline');
      factors.push('Strong civil society organisations monitor social policy impacts');
      break;
    case 'international-standing':
      factors.push('NATO membership provides defence collective security guarantee');
      factors.push('EU membership binds Sweden to multilateral obligations and norms');
      break;
  }

  return factors;
}

function getEscalatingFactors(category: PoliticalRiskCategory, cia: CIAContext | undefined): string[] {
  const factors: string[] = [];
  const stability = cia?.coalitionStability?.stabilityScore;

  switch (category) {
    case 'coalition-stability':
      if (stability !== undefined && stability < 40) {
        factors.push('Coalition stability score is low — elevated defection and collapse risk');
      }
      if (cia?.coalitionStability?.defectionProbability !== undefined && cia.coalitionStability.defectionProbability > 0.2) {
        factors.push('High defection probability detected in CIA coalition data');
      }
      // Always include a baseline escalating factor
      factors.push('Tight parliamentary majority increases vulnerability to individual defections');
      break;
    case 'policy-implementation':
      if (stability !== undefined && stability < 50) {
        factors.push('Unstable coalition may fail to pass legislation through parliament');
      }
      factors.push('Opposition coordination can delay or block legislative priorities');
      break;
    case 'democratic-process':
      factors.push('Media narrative framing and public perception can accelerate democratic erosion');
      factors.push('Social media amplification of anti-democratic rhetoric poses systemic risk');
      break;
    case 'economic-policy':
      factors.push('Global economic uncertainty amplifies domestic policy risk');
      factors.push('Coalition budget disagreements may block timely fiscal adjustments');
      break;
    case 'social-cohesion':
      factors.push('Polarising political rhetoric elevates social division risk');
      factors.push('Unequal distribution of policy costs can accelerate social fragmentation');
      break;
    case 'international-standing':
      factors.push('Domestic political instability signals unpredictability to international partners');
      factors.push('Divergence from EU/NATO positions increases geopolitical exposure');
      break;
  }

  return factors;
}

// ---------------------------------------------------------------------------
// Confidence assessment
// ---------------------------------------------------------------------------

function assessConfidence(doc: RawDocument, cia: CIAContext | undefined): 'high' | 'medium' | 'low' {
  let signals = 0;
  if (doc.fullText || doc.fullContent) signals += 2;
  if (doc.summary || doc.notis) signals += 1;
  if (doc.speeches && doc.speeches.length > 0) signals += 1;
  if (cia !== undefined) signals += 2;
  if (signals >= 4) return 'high';
  if (signals >= 2) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Risk score computation
// ---------------------------------------------------------------------------

/**
 * Compute a risk score (0–100) from likelihood and impact.
 *
 * Formula: likelihood_probability × impact_weight × 10
 * Clamped to [0, 100].
 */
export function computeRiskScore(
  likelihood: LikelihoodLevel,
  impact: RiskImpactLevel,
): number {
  const probability = LIKELIHOOD_PROBABILITY[likelihood];
  const weight = IMPACT_WEIGHT[impact];
  return Math.min(100, Math.max(0, Math.round(probability * weight * 10)));
}

/**
 * Derive priority tier from risk score.
 */
export function deriveRiskPriority(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Per-category assessment
// ---------------------------------------------------------------------------

function assessSingleCategory(
  doc: RawDocument,
  cia: CIAContext | undefined,
  category: PoliticalRiskCategory,
): PoliticalRiskAssessment {
  let likelihood: LikelihoodLevel;
  let impact: RiskImpactLevel;

  switch (category) {
    case 'coalition-stability':
      likelihood = assessCoalitionLikelihood(doc, cia);
      impact = assessCoalitionImpact(doc, cia);
      break;
    case 'policy-implementation':
      likelihood = assessPolicyImplementationLikelihood(doc, cia);
      impact = assessPolicyImpact(doc);
      break;
    case 'democratic-process':
      likelihood = assessDemocraticProcessLikelihood(doc);
      impact = assessDemocraticImpact(doc);
      break;
    case 'economic-policy':
      likelihood = assessEconomicPolicyLikelihood(doc, cia);
      impact = assessEconomicImpact(doc);
      break;
    case 'social-cohesion':
      likelihood = assessSocialCohesionLikelihood(doc);
      impact = assessSocialImpact(doc);
      break;
    case 'international-standing':
      likelihood = assessInternationalLikelihood(doc);
      impact = assessInternationalImpact(doc);
      break;
  }

  const riskScore = computeRiskScore(likelihood, impact);
  const priority = deriveRiskPriority(riskScore);
  const confidence = assessConfidence(doc, cia);

  return {
    riskCategory: category,
    likelihood,
    impact,
    riskScore,
    priority,
    evidence: extractEvidence(doc, category, cia),
    confidence,
    mitigatingFactors: getMitigatingFactors(category, cia),
    escalatingFactors: getEscalatingFactors(category, cia),
  };
}

// ---------------------------------------------------------------------------
// All categories
// ---------------------------------------------------------------------------

const ALL_RISK_CATEGORIES: readonly PoliticalRiskCategory[] = [
  'coalition-stability',
  'policy-implementation',
  'democratic-process',
  'economic-policy',
  'social-cohesion',
  'international-standing',
];

// ---------------------------------------------------------------------------
// Composite risk score
// ---------------------------------------------------------------------------

/**
 * Compute a composite risk score across all six categories.
 * Weighted by priority tier: critical×1.0, high×0.7, medium×0.5, low×0.3.
 */
function computeCompositeRiskScore(assessments: PoliticalRiskAssessment[]): number {
  if (assessments.length === 0) return 0;
  const priorityWeights: Readonly<Record<string, number>> = {
    critical: 1.0, high: 0.7, medium: 0.5, low: 0.3,
  };
  const totalWeight = assessments.reduce((sum, a) => sum + (priorityWeights[a.priority] ?? 0.3), 0);
  const weightedSum = assessments.reduce(
    (sum, a) => sum + a.riskScore * (priorityWeights[a.priority] ?? 0.3),
    0,
  );
  return Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assess political risk for a parliamentary document across all 6 risk categories.
 *
 * Applies the ISMS-inspired Likelihood × Impact methodology to each category
 * and returns a complete risk profile with composite scoring and priority ranking.
 *
 * The function is **pure** — deterministic for the same input, no side effects.
 *
 * @param doc  - The parliamentary document to assess
 * @param cia  - Optional CIA context (coalition stability data improves accuracy)
 * @returns    Complete political risk profile with per-category assessments
 *
 * @example
 * ```typescript
 * const profile = assessPoliticalRisk(doc, ciaContext);
 * console.log(profile.overallRiskLevel);      // 'critical' | 'high' | 'medium' | 'low'
 * console.log(profile.compositeRiskScore);    // 0–100
 * console.log(profile.dominantRisk);          // highest-priority category
 * ```
 */
export function assessPoliticalRisk(
  doc: RawDocument,
  cia?: CIAContext,
): PoliticalRiskProfile {
  const riskAssessments = ALL_RISK_CATEGORIES.map(category =>
    assessSingleCategory(doc, cia, category)
  );

  // Sort by risk score descending to identify dominant risk
  const sorted = [...riskAssessments].sort((a, b) => b.riskScore - a.riskScore);
  const dominantRisk = sorted[0]?.riskCategory ?? 'policy-implementation';

  const compositeRiskScore = computeCompositeRiskScore(riskAssessments);
  const overallRiskLevel = deriveRiskPriority(compositeRiskScore);

  return {
    riskAssessments,
    dominantRisk,
    compositeRiskScore,
    overallRiskLevel,
  };
}

/**
 * Assess political risk for a specific category only.
 *
 * Use when you need a targeted assessment for a single risk dimension
 * rather than the full 6-category profile.
 *
 * @param doc      - The parliamentary document to assess
 * @param category - The specific risk category to assess
 * @param cia      - Optional CIA context
 * @returns        Risk assessment for the specified category
 */
export function assessSingleRiskCategory(
  doc: RawDocument,
  category: PoliticalRiskCategory,
  cia?: CIAContext,
): PoliticalRiskAssessment {
  return assessSingleCategory(doc, cia, category);
}
