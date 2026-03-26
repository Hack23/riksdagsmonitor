/**
 * @module analysis-framework/political-classification
 * @description Political classification engine implementing 7-dimension scoring
 * for parliamentary documents.
 *
 * Inspired by ISMS CLASSIFICATION.md (Impact Analysis Matrix — Confidentiality,
 * Integrity, Availability levels), adapted for political intelligence analysis.
 *
 * ## Dimensions
 * | ISMS Dimension          | Political Dimension              |
 * |-------------------------|----------------------------------|
 * | Confidentiality         | Public Interest Sensitivity      |
 * | Integrity               | Democratic Integrity Impact      |
 * | Availability            | Policy Urgency                   |
 * | Financial Impact        | Economic Impact                  |
 * | Operational Impact      | Governance Impact                |
 * | Reputational Impact     | Political Capital Impact         |
 * | Regulatory Impact       | Legislative Impact               |
 *
 * The engine is **pure** — deterministic for the same input, no side effects.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../data-transformers/types.js';
import type {
  PoliticalClassification,
  PublicInterestSensitivity,
  DemocraticIntegrityImpact,
  PolicyUrgency,
  EconomicImpact,
  GovernanceImpact,
  PoliticalCapitalImpact,
  LegislativeImpact,
  OverallClassification,
} from './methodology-types.js';

// ---------------------------------------------------------------------------
// Keyword banks
// ---------------------------------------------------------------------------

/** Keywords indicating explosive public interest / political controversy */
const EXPLOSIVE_KEYWORDS: readonly string[] = [
  'tidöavtal', 'misstroende', 'misstroendevotum', 'regeringskris',
  'koalitionskris', 'oenighet', 'spricka', 'uteslutning', 'partiledare',
  'skandal', 'korruption', 'mutor', 'fusk', 'avgå', 'avgångskrav',
  'riksrätt', 'konstitutionsbrott', 'olaglig', 'brottslig',
  'crisis', 'scandal', 'corruption', 'resignation', 'impeachment',
];

/** Keywords indicating politically sensitive content */
const SENSITIVE_KEYWORDS: readonly string[] = [
  'invandring', 'migration', 'flyktingar', 'asyl', 'integration',
  'skattehöjning', 'skattesänkning', 'välfärdsreform', 'sjukvård',
  'NATO', 'försvar', 'militär', 'beredskap', 'säkerhetspolitik',
  'klimat', 'energi', 'kärnkraft', 'abort', 'dödshjälp',
  'kriminalitet', 'gängkriminalitet', 'polisen', 'rättsstat',
  'immigration', 'defense', 'security', 'climate', 'nuclear', 'crime',
];

/** Keywords signalling immediate constitutional or democratic urgency */
const CONSTITUTIONAL_KEYWORDS: readonly string[] = [
  'grundlag', 'regeringsform', 'riksdagsordning', 'vallag', 'folkomröstning',
  'konstitution', 'konstitutionell', 'grundlagsskyddad', 'fri- och rättigheter',
  'constitutional', 'fundamental law', 'referendum', 'rights',
];

/** Keywords indicating legislative (riksdag-level) impact */
const LEGISLATIVE_KEYWORDS: readonly string[] = [
  'riksdagen beslutar', 'proposition', 'lagstiftning', 'lag om',
  'ändring i lagen', 'lagändring', 'ny lag', 'lagens tillämpning',
  'parliament decides', 'legislation', 'law amendment', 'new law',
];

/** Keywords indicating regulatory/ordinance level impact */
const REGULATORY_KEYWORDS: readonly string[] = [
  'förordning', 'föreskrift', 'myndighetsföreskrift', 'reglering',
  'regulation', 'ordinance', 'regulatory', 'rule change',
];

/** Keywords for economic/fiscal significance */
const ECONOMIC_HIGH_KEYWORDS: readonly string[] = [
  'statsbudget', 'budgetproposition', 'ramproposition', 'statsskuld',
  'BNP', 'konjunktur', 'inflation', 'ränta', 'riksbanken',
  'skatteintäkter', 'skatteuttag', 'anslag', 'miljarder',
  'GDP', 'budget', 'fiscal', 'monetary', 'inflation', 'interest rate', 'billions',
];

/** Committees with systemic governance impact */
const SYSTEMIC_GOVERNANCE_COMMITTEES = new Set(['FiU', 'KU', 'FöU', 'UU']);

/** Document types that are at least standard public-interest sensitivity */
const STANDARD_SENSITIVITY_TYPES = new Set(['prop', 'bet', 'sou', 'prot']);

/** Committees with significant governance impact */
const SIGNIFICANT_GOVERNANCE_COMMITTEES = new Set(['JuU', 'SoU', 'SfU', 'AU', 'MJU', 'UbU', 'SkU']);

/** Document types with immediate policy urgency */
const IMMEDIATE_URGENCY_TYPES = new Set(['bet', 'prot']);

/** Document types with short-term policy urgency */
const SHORT_TERM_URGENCY_TYPES = new Set(['prop', 'ip', 'sou']);

/** Document types with medium-term policy urgency */
const MEDIUM_TERM_URGENCY_TYPES = new Set(['skr', 'ds', 'dir', 'mot']);

// ---------------------------------------------------------------------------
// Numeric dimension value maps (for score computation)
// ---------------------------------------------------------------------------

const SENSITIVITY_SCORES: Readonly<Record<PublicInterestSensitivity, number>> = {
  explosive: 100, sensitive: 70, standard: 40, routine: 10,
};
const DEMOCRATIC_SCORES: Readonly<Record<DemocraticIntegrityImpact, number>> = {
  critical: 100, significant: 70, moderate: 40, minor: 10,
};
const URGENCY_SCORES: Readonly<Record<PolicyUrgency, number>> = {
  immediate: 100, 'short-term': 70, 'medium-term': 40, 'long-term': 10,
};
const ECONOMIC_SCORES: Readonly<Record<EconomicImpact, number>> = {
  transformative: 100, major: 70, moderate: 40, minimal: 10,
};
const GOVERNANCE_SCORES: Readonly<Record<GovernanceImpact, number>> = {
  systemic: 100, significant: 70, procedural: 40, routine: 10,
};
const POLITICAL_CAPITAL_SCORES: Readonly<Record<PoliticalCapitalImpact, number>> = {
  'career-defining': 100, significant: 70, notable: 40, negligible: 10,
};
const LEGISLATIVE_SCORES: Readonly<Record<LegislativeImpact, number>> = {
  constitutional: 100, legislative: 70, regulatory: 40, administrative: 10,
};

// ---------------------------------------------------------------------------
// Dimension weights (must sum to 1.0)
// ---------------------------------------------------------------------------

const DIMENSION_WEIGHTS = {
  publicInterestSensitivity: 0.20,
  democraticIntegrityImpact: 0.20,
  policyUrgency: 0.10,
  economicImpact: 0.15,
  governanceImpact: 0.15,
  politicalCapitalImpact: 0.10,
  legislativeImpact: 0.10,
} as const;

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function getDocText(doc: RawDocument): string {
  const fullContentText = doc.fullContent
    ? doc.fullContent.replace(/<[^>]+>/g, ' ')
    : undefined;
  const primaryText = doc.fullText ?? fullContentText;

  return [
    doc.titel, doc.rubrik, doc.undertitel, doc.title,
    doc.summary, doc.notis, primaryText,
  ].filter(Boolean).join(' ');
}

/**
 * Derive normalized document type from RawDocument.
 * Falls back from `doktyp` to `documentType`, lowercased and trimmed.
 */
function getDocType(doc: RawDocument): string {
  return String(doc.doktyp ?? doc.documentType ?? '').toLowerCase().trim();
}

function classifyPublicInterestSensitivity(doc: RawDocument, cia: CIAContext | undefined): PublicInterestSensitivity {
  const text = getDocText(doc);
  if (containsAny(text, EXPLOSIVE_KEYWORDS)) return 'explosive';
  // Unstable coalition elevates sensitivity of policy documents
  if (cia?.coalitionStability?.stabilityScore !== undefined && cia.coalitionStability.stabilityScore < 30) {
    if (containsAny(text, SENSITIVE_KEYWORDS)) return 'explosive';
  }
  if (containsAny(text, SENSITIVE_KEYWORDS)) return 'sensitive';
  // Government propositions and committee reports are always at least standard
  if (STANDARD_SENSITIVITY_TYPES.has(getDocType(doc))) return 'standard';
  return 'routine';
}

function classifyDemocraticIntegrityImpact(doc: RawDocument): DemocraticIntegrityImpact {
  const text = getDocText(doc);
  if (containsAny(text, CONSTITUTIONAL_KEYWORDS)) return 'critical';
  // Constitutional/oversight committee involvement is significant
  if (doc.organ === 'KU' || doc.organ === 'FiU') return 'significant';
  // Propositions always have at least moderate democratic integrity impact
  const docType = getDocType(doc);
  if (docType === 'prop' || docType === 'bet') return 'moderate';
  return 'minor';
}

function classifyPolicyUrgency(doc: RawDocument): PolicyUrgency {
  const docType = getDocType(doc);
  if (IMMEDIATE_URGENCY_TYPES.has(docType)) return 'immediate';
  if (SHORT_TERM_URGENCY_TYPES.has(docType)) return 'short-term';
  if (MEDIUM_TERM_URGENCY_TYPES.has(docType)) return 'medium-term';
  return 'long-term';
}

function classifyEconomicImpact(doc: RawDocument, cia: CIAContext | undefined): EconomicImpact {
  const text = getDocText(doc);
  if (containsAny(text, ECONOMIC_HIGH_KEYWORDS)) {
    // Budget propositions or finance committee documents are transformative
    if (doc.organ === 'FiU' || getDocType(doc) === 'prop') return 'transformative';
    return 'major';
  }
  // Fiscal instability amplifies economic impact
  if (cia?.coalitionStability?.stabilityScore !== undefined && cia.coalitionStability.stabilityScore < 40) {
    return 'major';
  }
  if (getDocType(doc) === 'prop' || getDocType(doc) === 'bet') return 'moderate';
  return 'minimal';
}

function classifyGovernanceImpact(doc: RawDocument): GovernanceImpact {
  const committee = doc.organ ?? doc.committee ?? '';
  if (SYSTEMIC_GOVERNANCE_COMMITTEES.has(committee)) return 'systemic';
  if (SIGNIFICANT_GOVERNANCE_COMMITTEES.has(committee)) return 'significant';
  if (getDocType(doc) === 'prop' || getDocType(doc) === 'bet') return 'procedural';
  return 'routine';
}

function classifyPoliticalCapitalImpact(doc: RawDocument, cia: CIAContext | undefined): PoliticalCapitalImpact {
  const text = getDocText(doc);
  // Crisis keywords or coalition instability → career-defining
  if (containsAny(text, EXPLOSIVE_KEYWORDS)) return 'career-defining';
  // Interpellations targeting ministers are notable at minimum
  const docType = getDocType(doc);
  if (docType === 'ip' || docType === 'fr') {
    if (doc.mottagare && doc.mottagare.length > 0) return 'significant';
    return 'notable';
  }
  // Unstable coalition elevates political capital stakes
  if (cia?.coalitionStability?.stabilityScore !== undefined && cia.coalitionStability.stabilityScore < 50) {
    return 'significant';
  }
  if (docType === 'prop' || docType === 'bet') return 'notable';
  return 'negligible';
}

function classifyLegislativeImpact(doc: RawDocument): LegislativeImpact {
  const text = getDocText(doc);
  if (containsAny(text, CONSTITUTIONAL_KEYWORDS)) return 'constitutional';
  if (containsAny(text, LEGISLATIVE_KEYWORDS)) return 'legislative';
  if (containsAny(text, REGULATORY_KEYWORDS)) return 'regulatory';
  // Committee reports and propositions change legislation by default
  if (getDocType(doc) === 'bet' || getDocType(doc) === 'prop') return 'legislative';
  return 'administrative';
}

// ---------------------------------------------------------------------------
// Overall classification derivation
// ---------------------------------------------------------------------------

/**
 * Derive the overall classification from the composite numeric score.
 *
 * Thresholds:
 * - ≥70 → critical
 * - ≥50 → high
 * - ≥30 → medium
 * - <30  → low
 */
function deriveOverallClassification(score: number): OverallClassification {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Score computation
// ---------------------------------------------------------------------------

/**
 * Compute the weighted composite classification score (0–100).
 */
function computeClassificationScore(dimensions: {
  publicInterestSensitivity: PublicInterestSensitivity;
  democraticIntegrityImpact: DemocraticIntegrityImpact;
  policyUrgency: PolicyUrgency;
  economicImpact: EconomicImpact;
  governanceImpact: GovernanceImpact;
  politicalCapitalImpact: PoliticalCapitalImpact;
  legislativeImpact: LegislativeImpact;
}): number {
  const weighted =
    SENSITIVITY_SCORES[dimensions.publicInterestSensitivity] * DIMENSION_WEIGHTS.publicInterestSensitivity +
    DEMOCRATIC_SCORES[dimensions.democraticIntegrityImpact] * DIMENSION_WEIGHTS.democraticIntegrityImpact +
    URGENCY_SCORES[dimensions.policyUrgency] * DIMENSION_WEIGHTS.policyUrgency +
    ECONOMIC_SCORES[dimensions.economicImpact] * DIMENSION_WEIGHTS.economicImpact +
    GOVERNANCE_SCORES[dimensions.governanceImpact] * DIMENSION_WEIGHTS.governanceImpact +
    POLITICAL_CAPITAL_SCORES[dimensions.politicalCapitalImpact] * DIMENSION_WEIGHTS.politicalCapitalImpact +
    LEGISLATIVE_SCORES[dimensions.legislativeImpact] * DIMENSION_WEIGHTS.legislativeImpact;

  return Math.min(100, Math.max(0, Math.round(weighted)));
}

// ---------------------------------------------------------------------------
// Rationale builder
// ---------------------------------------------------------------------------

function buildRationale(
  doc: RawDocument,
  dimensions: Omit<PoliticalClassification, 'overallClassification' | 'classificationScore' | 'rationale'>,
): string[] {
  const rationale: string[] = [];
  const docType = getDocType(doc) || 'unknown';
  const committee = doc.organ ?? doc.committee ?? 'unknown';

  // Public interest sensitivity
  if (dimensions.publicInterestSensitivity === 'explosive') {
    rationale.push('Explosive public interest: Keywords indicate scandal, crisis, or coalition threat');
  } else if (dimensions.publicInterestSensitivity === 'sensitive') {
    rationale.push('Sensitive topic: immigration, defence, climate, or tax policy detected');
  } else {
    rationale.push(
      `Public interest sensitivity rated as "${dimensions.publicInterestSensitivity}": no explosive or highly sensitive triggers detected`,
    );
  }

  // Democratic integrity impact
  if (dimensions.democraticIntegrityImpact === 'critical') {
    rationale.push('Critical democratic integrity: Constitutional law or fundamental rights involved');
  } else if (dimensions.democraticIntegrityImpact === 'significant') {
    rationale.push(`Significant democratic impact: Committee ${committee} has oversight/constitutional role`);
  } else {
    rationale.push(
      `Democratic integrity impact rated as "${dimensions.democraticIntegrityImpact}": limited or routine implications for democratic processes`,
    );
  }

  // Economic impact
  if (dimensions.economicImpact === 'transformative') {
    rationale.push('Transformative economic impact: Budget or macro-level fiscal content detected');
  } else if (dimensions.economicImpact === 'major') {
    rationale.push('Major economic impact: Significant fiscal or monetary policy implications');
  } else {
    rationale.push(
      `Economic impact rated as "${dimensions.economicImpact}": no major fiscal or monetary signals detected`,
    );
  }

  // Governance impact
  if (dimensions.governanceImpact === 'systemic') {
    rationale.push(`Systemic governance impact: Committee ${committee} drives cross-government policy`);
  } else {
    rationale.push(
      `Governance impact rated as "${dimensions.governanceImpact}": ${committee} committee scope`,
    );
  }

  // Legislative impact
  if (dimensions.legislativeImpact === 'constitutional') {
    rationale.push('Constitutional legislative impact: Affects fundamental law or constitutional order');
  } else if (dimensions.legislativeImpact === 'legislative') {
    rationale.push(`Legislative impact: Document type ${docType} typically creates or amends statutes`);
  } else {
    rationale.push(
      `Legislative impact rated as "${dimensions.legislativeImpact}": no statutory or constitutional changes detected`,
    );
  }

  // Policy urgency
  if (dimensions.policyUrgency === 'immediate') {
    rationale.push('Immediate policy urgency: Time-critical document requiring prompt attention');
  } else if (dimensions.policyUrgency === 'short-term') {
    rationale.push('Short-term policy urgency: Active legislative or committee timeline');
  } else {
    rationale.push(
      `Policy urgency rated as "${dimensions.policyUrgency}": standard parliamentary timeline`,
    );
  }

  // Political capital impact
  if (dimensions.politicalCapitalImpact === 'career-defining') {
    rationale.push('Career-defining political capital impact: Major reputational stakes for actors involved');
  } else if (dimensions.politicalCapitalImpact === 'significant') {
    rationale.push('Significant political capital impact: Notable reputational consequences');
  } else {
    rationale.push(
      `Political capital impact rated as "${dimensions.politicalCapitalImpact}": limited reputational stakes`,
    );
  }

  return rationale;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a parliamentary document across 7 political dimensions.
 *
 * Applies the ISMS-inspired Political Classification Framework to produce
 * a multi-dimensional classification with an aggregated score and rationale.
 *
 * The function is **pure** — deterministic for the same input, no side effects.
 *
 * @param doc  - The parliamentary document to classify
 * @param cia  - Optional CIA context (coalition stability influences several dimensions)
 * @returns    Complete 7-dimension political classification
 *
 * @example
 * ```typescript
 * const classification = classifyPoliticalDocument(doc, ciaContext);
 * console.log(classification.overallClassification); // 'critical' | 'high' | 'medium' | 'low'
 * console.log(classification.classificationScore);   // 0-100
 * ```
 */
export function classifyPoliticalDocument(
  doc: RawDocument,
  cia?: CIAContext,
): PoliticalClassification {
  const publicInterestSensitivity = classifyPublicInterestSensitivity(doc, cia);
  const democraticIntegrityImpact = classifyDemocraticIntegrityImpact(doc);
  const policyUrgency = classifyPolicyUrgency(doc);
  const economicImpact = classifyEconomicImpact(doc, cia);
  const governanceImpact = classifyGovernanceImpact(doc);
  const politicalCapitalImpact = classifyPoliticalCapitalImpact(doc, cia);
  const legislativeImpact = classifyLegislativeImpact(doc);

  const dimensions = {
    publicInterestSensitivity,
    democraticIntegrityImpact,
    policyUrgency,
    economicImpact,
    governanceImpact,
    politicalCapitalImpact,
    legislativeImpact,
  };

  const classificationScore = computeClassificationScore(dimensions);
  const overallClassification = deriveOverallClassification(classificationScore);
  const rationale = buildRationale(doc, dimensions);

  return {
    ...dimensions,
    overallClassification,
    classificationScore,
    rationale,
  };
}

/**
 * Classify a batch of parliamentary documents.
 *
 * Applies `classifyPoliticalDocument` to each document independently.
 * Useful for batch processing in the news generation pipeline.
 *
 * @param docs - Array of documents to classify
 * @param cia  - Optional shared CIA context for all documents
 * @returns    Array of classifications, one per input document
 */
export function classifyPoliticalDocuments(
  docs: RawDocument[],
  cia?: CIAContext,
): PoliticalClassification[] {
  return docs.map(doc => classifyPoliticalDocument(doc, cia));
}
