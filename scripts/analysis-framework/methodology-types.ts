/**
 * @module analysis-framework/methodology-types
 * @description Shared TypeScript types for the three ISMS-inspired political
 * analysis methodologies:
 *
 * 1. **PoliticalClassification** — 7-dimension event classification
 *    (inspired by ISMS CLASSIFICATION.md — Impact Analysis Matrix)
 * 2. **PoliticalRiskAssessment** — Likelihood × Impact risk scoring
 *    (inspired by ISMS Risk_Assessment_Methodology.md)
 * 3. **PoliticalThreatAnalysis** — PRIDES threat framework
 *    (inspired by ISMS THREAT_MODEL.md — STRIDE → PRIDES adaptation)
 *
 * These types are consumed by:
 * - `political-classification.ts`
 * - `political-risk-assessment.ts`
 * - `political-threat-analysis.ts`
 * - Extended `DocumentAnalysisResult` in `types.ts`
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// ===========================================================================
// 1. POLITICAL CLASSIFICATION (inspired by ISMS CLASSIFICATION.md)
// ===========================================================================

// ---------------------------------------------------------------------------
// Classification dimension value types
// ---------------------------------------------------------------------------

/**
 * Public Interest Sensitivity — adapted from ISMS Confidentiality levels.
 * Measures how politically sensitive this event is in the public domain.
 *
 * - explosive: Imminent public controversy, coalition-threatening, media firestorm
 * - sensitive: Politically charged, significant public interest
 * - standard: Normal legislative activity with moderate public interest
 * - routine: Administrative/procedural, low public visibility
 */
export type PublicInterestSensitivity = 'explosive' | 'sensitive' | 'standard' | 'routine';

/**
 * Democratic Integrity Impact — adapted from ISMS Integrity levels.
 * Measures whether this event affects democratic processes and norms.
 *
 * - critical: Threatens constitutional or democratic foundations
 * - significant: Material impact on democratic participation or oversight
 * - moderate: Noticeable procedural or governance effects
 * - minor: Minimal democratic process implications
 */
export type DemocraticIntegrityImpact = 'critical' | 'significant' | 'moderate' | 'minor';

/**
 * Policy Urgency — adapted from ISMS Availability levels.
 * Measures how time-sensitive this is for citizens and policymakers.
 *
 * - immediate: Requires action within days; crisis or emergency context
 * - short-term: Action needed within weeks; active parliamentary timeline
 * - medium-term: Months-long implementation cycle; planned legislation
 * - long-term: Strategic direction; multi-year or structural change
 */
export type PolicyUrgency = 'immediate' | 'short-term' | 'medium-term' | 'long-term';

/**
 * Economic Impact — adapted from ISMS Financial Impact levels.
 * Measures the fiscal and economic consequence of this event.
 *
 * - transformative: Macro-level change; affects GDP, national budget, or SEK billions+
 * - major: Significant sectoral or fiscal consequence; large-scale redistribution
 * - moderate: Notable but bounded economic effect; affects specific industries or groups
 * - minimal: Limited fiscal consequence; administrative or procedural cost only
 */
export type EconomicImpact = 'transformative' | 'major' | 'moderate' | 'minimal';

/**
 * Governance Impact — adapted from ISMS Operational Impact levels.
 * Measures how this event affects government operations and institutional function.
 *
 * - systemic: Cross-government structural change; affects multiple agencies
 * - significant: Major departmental or policy-area impact
 * - procedural: Changes to administrative processes or regulations
 * - routine: Standard governmental operations; no structural change
 */
export type GovernanceImpact = 'systemic' | 'significant' | 'procedural' | 'routine';

/**
 * Political Capital Impact — adapted from ISMS Reputational Impact levels.
 * Measures the effect on party or politician standing and electoral viability.
 *
 * - career-defining: Permanently alters political trajectory; election-determining
 * - significant: Meaningful shift in public perception or party support
 * - notable: Observable but temporary reputational effect
 * - negligible: Minimal effect on political standing
 */
export type PoliticalCapitalImpact = 'career-defining' | 'significant' | 'notable' | 'negligible';

/**
 * Legislative Impact — adapted from ISMS Regulatory Impact levels.
 * Measures whether this event changes laws, regulations, or constitutional order.
 *
 * - constitutional: Affects fundamental law (RF) or constitutional principles
 * - legislative: Creates or amends riksdag-level statute (lag)
 * - regulatory: Changes government ordinances or agency regulations (förordning)
 * - administrative: Internal government guidance or procedural decisions
 */
export type LegislativeImpact = 'constitutional' | 'legislative' | 'regulatory' | 'administrative';

/**
 * Overall classification summary — aggregated across all 7 dimensions.
 *
 * - critical: Explosive, democratic-integrity-critical, immediate urgency
 * - high: Multiple high-severity dimensions
 * - medium: Mixed severity profile
 * - low: Routine across most dimensions
 */
export type OverallClassification = 'critical' | 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Classification result type
// ---------------------------------------------------------------------------

/** Complete 7-dimension political classification for a parliamentary document */
export interface PoliticalClassification {
  /** How politically sensitive this event is in the public domain */
  publicInterestSensitivity: PublicInterestSensitivity;
  /** Whether this affects democratic processes and norms */
  democraticIntegrityImpact: DemocraticIntegrityImpact;
  /** How time-sensitive this is for citizens and policymakers */
  policyUrgency: PolicyUrgency;
  /** Fiscal and economic consequence */
  economicImpact: EconomicImpact;
  /** Effect on government operations and institutional function */
  governanceImpact: GovernanceImpact;
  /** Effect on party or politician standing */
  politicalCapitalImpact: PoliticalCapitalImpact;
  /** Whether this changes laws, regulations, or constitutional order */
  legislativeImpact: LegislativeImpact;
  /** Aggregated summary classification across all 7 dimensions */
  overallClassification: OverallClassification;
  /**
   * Numeric classification score (0–100).
   * Weighted composite of all 7 dimensions.
   */
  classificationScore: number;
  /**
   * Rationale for the classification.
   * Lists the primary signals that determined each dimension.
   */
  rationale: string[];
}

// ===========================================================================
// 2. POLITICAL RISK ASSESSMENT (inspired by ISMS Risk_Assessment_Methodology.md)
// ===========================================================================

// ---------------------------------------------------------------------------
// Risk categories
// ---------------------------------------------------------------------------

/**
 * Political risk categories for Swedish parliamentary context.
 * Each maps to a distinct failure mode in governance or democratic function.
 */
export type PoliticalRiskCategory =
  | 'coalition-stability'      // Risk of government collapse or realignment
  | 'policy-implementation'    // Risk that proposed policies fail or stall
  | 'democratic-process'       // Risk to democratic norms and institutions
  | 'economic-policy'          // Risk from fiscal/monetary policy decisions
  | 'social-cohesion'          // Risk of societal division or unrest
  | 'international-standing';  // Risk to Sweden's international position

// ---------------------------------------------------------------------------
// Likelihood scale (adapted from ISMS)
// ---------------------------------------------------------------------------

/**
 * Likelihood levels for political risk assessment.
 * Adapted from ISMS probability scale to Swedish parliamentary context.
 *
 * - almost-certain: Multiple parliamentary signals confirm (80-99%)
 * - likely: Strong indicators from committee/debate activity (60-79%)
 * - possible: Mixed signals, uncertain outcome (40-59%)
 * - unlikely: Weak indicators, strong opposition (20-39%)
 * - rare: Exceptional circumstances required (5-19%)
 * - exceptional: Black swan political events (<5%)
 */
export type LikelihoodLevel =
  | 'almost-certain'  // 80-99% — Multiple signals confirm
  | 'likely'          // 60-79% — Strong committee/debate indicators
  | 'possible'        // 40-59% — Mixed signals
  | 'unlikely'        // 20-39% — Weak indicators, strong opposition
  | 'rare'            // 5-19%  — Exceptional circumstances
  | 'exceptional';    // <5%    — Black swan events

/** Numeric probability midpoint for each likelihood level (0–1) */
export const LIKELIHOOD_PROBABILITY: Readonly<Record<LikelihoodLevel, number>> = {
  'almost-certain': 0.90,
  'likely': 0.70,
  'possible': 0.50,
  'unlikely': 0.30,
  'rare': 0.12,
  'exceptional': 0.02,
};

// ---------------------------------------------------------------------------
// Impact scale (adapted from ISMS)
// ---------------------------------------------------------------------------

/**
 * Impact levels for political risk assessment.
 * Adapted from ISMS consequence scale to political domain.
 *
 * - transformative: Constitutional or regime-level change
 * - critical: Major policy shift affecting millions of citizens
 * - high: Significant legislative change
 * - moderate: Notable policy adjustment
 * - low: Minor procedural change
 * - minimal: Routine parliamentary activity
 */
export type RiskImpactLevel =
  | 'transformative'  // Constitutional/regime-level change
  | 'critical'        // Major policy shift affecting millions
  | 'high'            // Significant legislative change
  | 'moderate'        // Notable policy adjustment
  | 'low'             // Minor procedural change
  | 'minimal';        // Routine parliamentary activity

/** Numeric impact weight for scoring each impact level (0–10) */
export const IMPACT_WEIGHT: Readonly<Record<RiskImpactLevel, number>> = {
  transformative: 10,
  critical: 8,
  high: 6,
  moderate: 4,
  low: 2,
  minimal: 1,
};

// ---------------------------------------------------------------------------
// Risk assessment result type
// ---------------------------------------------------------------------------

/** Complete political risk assessment for a single risk category */
export interface PoliticalRiskAssessment {
  /** The risk category being assessed */
  riskCategory: PoliticalRiskCategory;
  /** Likelihood that this risk materialises */
  likelihood: LikelihoodLevel;
  /** Severity of impact if this risk materialises */
  impact: RiskImpactLevel;
  /**
   * Composite risk score (0–100).
   * Computed as: (likelihood_probability × impact_weight × 10), clamped to 0–100.
   */
  riskScore: number;
  /**
   * Priority tier derived from risk score.
   * - critical: ≥70
   * - high: ≥50
   * - medium: ≥30
   * - low: <30
   */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /**
   * Evidence from parliamentary data supporting this assessment.
   * Should reference dok_id values, voting records, or speech excerpts.
   */
  evidence: string[];
  /** Confidence level in this risk assessment */
  confidence: 'high' | 'medium' | 'low';
  /** Factors that reduce the probability or impact of this risk */
  mitigatingFactors: string[];
  /** Factors that increase the probability or impact of this risk */
  escalatingFactors: string[];
}

/** Aggregated risk profile for a parliamentary document or event */
export interface PoliticalRiskProfile {
  /** Individual risk assessments per category */
  riskAssessments: PoliticalRiskAssessment[];
  /** Highest priority risk (for article focus) */
  dominantRisk: PoliticalRiskCategory;
  /**
   * Composite risk score (0–100), aggregated across all categories.
   * Weighted by risk priority.
   */
  compositeRiskScore: number;
  /**
   * Overall risk level derived from composite score.
   * - critical: ≥70
   * - high: ≥50
   * - medium: ≥30
   * - low: <30
   */
  overallRiskLevel: 'critical' | 'high' | 'medium' | 'low';
}

// ===========================================================================
// 3. POLITICAL THREAT ANALYSIS — PRIDES FRAMEWORK
//    (inspired by ISMS THREAT_MODEL.md — STRIDE → PRIDES)
// ===========================================================================

// ---------------------------------------------------------------------------
// PRIDES threat categories
// ---------------------------------------------------------------------------

/**
 * PRIDES framework — Political adaptation of ISMS STRIDE threat model.
 *
 * | ISMS STRIDE           | Political PRIDES             |
 * |-----------------------|------------------------------|
 * | Spoofing              | Polarization                 |
 * | Tampering             | Regulatory Overreach         |
 * | Repudiation           | Institutional Erosion        |
 * | Information Disclosure| Democratic Deficit           |
 * | Denial of Service     | Economic Disruption          |
 * | Elevation of Privilege| Societal Impact              |
 */
export type PridesCategory =
  | 'polarization'           // P — Intentional division, misleading rhetoric
  | 'regulatory-overreach'   // R — Abuse of legislative power, norm erosion
  | 'institutional-erosion'  // I — Weakening of democratic institutions
  | 'democratic-deficit'     // D — Lack of transparency, restricted public access
  | 'economic-disruption'    // E — Policy-driven economic harm, fiscal irresponsibility
  | 'societal-impact';       // S — Disproportionate impact on vulnerable groups

// ---------------------------------------------------------------------------
// Threat agent classification
// ---------------------------------------------------------------------------

/**
 * Political threat agents — adapted from ISMS threat actor classification.
 * Identifies the actor whose actions create or amplify the threat.
 */
export type ThreatAgent =
  | 'ruling-coalition'   // Policy agenda risks, power concentration
  | 'opposition-parties' // Obstruction, populist pressure, destabilisation
  | 'external-actors'    // Foreign influence, EU regulatory pressure
  | 'special-interests'  // Lobbying, regulatory capture, corporate influence
  | 'media'              // Narrative manipulation, selective reporting
  | 'institutional';     // Bureaucratic inertia, implementation failures

// ---------------------------------------------------------------------------
// Threat severity
// ---------------------------------------------------------------------------

/**
 * Severity levels for PRIDES threat analysis.
 *
 * - critical: Immediate and fundamental threat to democratic function
 * - high: Serious and near-term threat requiring political response
 * - medium: Moderate threat with observable indicators
 * - low: Latent or low-probability threat, early warning
 */
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Threat analysis result type
// ---------------------------------------------------------------------------

/** PRIDES threat analysis for a single threat category */
export interface PoliticalThreatAnalysis {
  /** Which PRIDES category this threat belongs to */
  pridesCategory: PridesCategory;
  /** Actors whose actions manifest or amplify this threat */
  threatAgents: ThreatAgent[];
  /** Severity of this threat to democratic governance */
  severity: ThreatSeverity;
  /**
   * Observable indicators from parliamentary data (MCP sources).
   * Should reference specific speeches, votes, documents, or patterns.
   */
  indicators: string[];
  /**
   * Democratic safeguards and countermeasures available.
   * Institutional or procedural responses that mitigate this threat.
   */
  countermeasures: string[];
  /**
   * Rationale linking the observable signals to the PRIDES category.
   * Should be evidence-based, not generic.
   */
  rationale: string;
}

/** Aggregated PRIDES threat profile for a parliamentary document or event */
export interface PoliticalThreatProfile {
  /** Individual PRIDES threat analyses detected */
  threatAnalyses: PoliticalThreatAnalysis[];
  /**
   * Primary threat category (highest severity, or most evidence-dense).
   * `null` when no significant threats are detected (valid JSON output).
   */
  primaryThreat: PridesCategory | null;
  /**
   * Overall threat level across all PRIDES categories.
   * Derived from the highest-severity individual threat.
   */
  overallThreatLevel: ThreatSeverity | 'none';
  /**
   * Active threat agents across all detected threats (deduplicated).
   */
  activeThreatAgents: ThreatAgent[];
}

// ===========================================================================
// 4. COMBINED METHODOLOGY RESULT
// ===========================================================================

/**
 * Combined output of all three political analysis methodologies for a
 * single parliamentary document.
 *
 * This is attached to `DocumentAnalysisResult` as `methodologyAnalysis`
 * (see `types.ts`).
 */
export interface MethodologyAnalysis {
  /** 7-dimension political classification */
  classification: PoliticalClassification;
  /** Likelihood × Impact risk profile across 6 risk categories */
  riskProfile: PoliticalRiskProfile;
  /** PRIDES threat analysis across detected threat categories */
  threatProfile: PoliticalThreatProfile;
}
