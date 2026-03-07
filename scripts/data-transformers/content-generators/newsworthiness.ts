/**
 * @module data-transformers/content-generators/newsworthiness
 * @description Strategic newsworthiness scoring for documents, events, and press
 * releases. Evaluates political intelligence significance across multiple dimensions
 * to detect important strategic content that should trigger deep inspection analysis.
 *
 * Used by agentic workflows to prioritise content and decide when to generate
 * deep-inspection articles vs standard coverage.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Individual scoring dimension */
export interface NewsworthinessDimension {
  /** Dimension name */
  name: string;
  /** Score 0–100 */
  score: number;
  /** Explanation */
  reason: string;
}

/** Full newsworthiness assessment */
export interface NewsworthinessScore {
  /** Overall score 0–100 */
  overall: number;
  /** Per-dimension breakdown */
  dimensions: NewsworthinessDimension[];
  /** Whether this warrants deep inspection analysis */
  warrantsDeepInspection: boolean;
  /** Suggested article type */
  suggestedType: 'deep-inspection' | 'standard' | 'brief';
  /** Key topics detected */
  topics: string[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Minimum overall score to trigger deep-inspection article generation */
const DEEP_INSPECTION_THRESHOLD = 65;

/** Keywords that indicate high-impact strategic content */
const STRATEGIC_KEYWORDS: readonly string[] = [
  // Budget / fiscal
  'budget', 'statsbudget', 'budgetproposition', 'vårproposition', 'höständringsbudget',
  'finansplan', 'fiscal', 'appropriation',
  // Constitutional / fundamental
  'grundlag', 'constitution', 'grundlagsändring', 'constitutional amendment',
  'folkomröstning', 'referendum',
  // Security / defence
  'nato', 'försvar', 'defence', 'defense', 'säkerhetspolitik', 'security policy',
  'totalförsvar', 'civil defense', 'militär', 'military',
  // EU / international
  'eu-direktiv', 'eu directive', 'eu-förordning', 'eu regulation',
  'brexit', 'schengen', 'eurozone', 'handelsavtal', 'trade agreement',
  // Crisis
  'kris', 'crisis', 'pandemi', 'pandemic', 'nödläge', 'emergency',
  'extraordinär', 'extraordinary',
  // Reform / structural
  'reform', 'omstrukturering', 'restructuring', 'privatisering', 'privatization',
  'centralisering', 'decentralisation',
  // Election
  'val', 'election', 'valkampanj', 'campaign', 'väljarundersökning', 'opinion poll',
  // Government formation
  'regeringsbildning', 'government formation', 'misstroendevotum', 'vote of no confidence',
  'ministerskifte', 'cabinet reshuffle',
  // Major policy areas
  'migration', 'invandring', 'immigration', 'integration',
  'klimat', 'climate', 'energi', 'energy', 'kärnkraft', 'nuclear',
  'pension', 'sjukvård', 'healthcare', 'utbildning', 'education',
];

/** Document types with inherently high strategic value */
const HIGH_VALUE_DOC_TYPES: readonly string[] = [
  'prop',   // Government propositions
  'bet',    // Committee reports
  'skr',    // Government communications
  'sou',    // Government official reports (SOU)
  'ds',     // Departmental series
  'dir',    // Committee directives
];

/** Committee abbreviations for key policy areas */
const STRATEGIC_COMMITTEES: readonly string[] = [
  'FiU',  // Finance
  'KU',   // Constitutional
  'FöU',  // Defence
  'UU',   // Foreign Affairs
  'JuU',  // Justice
  'SfU',  // Social Insurance
];

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/**
 * Score the strategic keyword density of content.
 */
function scoreStrategicKeywords(text: string): NewsworthinessDimension {
  const lower = text.toLowerCase();
  const hits = STRATEGIC_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
  const density = Math.min(100, (hits.length / 3) * 25);

  return {
    name: 'Strategic Keywords',
    score: Math.round(density),
    reason: hits.length > 0
      ? `${hits.length} strategic keyword(s): ${hits.slice(0, 5).join(', ')}`
      : 'No strategic keywords detected',
  };
}

/**
 * Score based on document type importance.
 */
function scoreDocumentType(doc: RawDocument): NewsworthinessDimension {
  const docType = (doc.doktyp || doc.documentType || '').toLowerCase();
  const isHighValue = HIGH_VALUE_DOC_TYPES.some(t => t.toLowerCase() === docType);

  return {
    name: 'Document Type',
    score: isHighValue ? 80 : docType === 'mot' ? 40 : 20,
    reason: isHighValue
      ? `High-value document type: ${docType}`
      : `Standard document type: ${docType || 'unknown'}`,
  };
}

/**
 * Score based on committee strategic importance.
 */
function scoreCommitteeImportance(doc: RawDocument): NewsworthinessDimension {
  const committee = doc.organ || doc.committee || '';
  const isStrategic = STRATEGIC_COMMITTEES.some(c => c.toLowerCase() === committee.toLowerCase());

  return {
    name: 'Committee Importance',
    score: isStrategic ? 75 : committee ? 40 : 10,
    reason: isStrategic
      ? `Strategic committee: ${committee}`
      : committee ? `Committee: ${committee}` : 'No committee attribution',
  };
}

/**
 * Score based on multi-party involvement (cross-party issues are more newsworthy).
 */
function scoreMultiPartyInvolvement(docs: RawDocument[]): NewsworthinessDimension {
  const parties = new Set<string>();
  for (const doc of docs) {
    const p = (doc.parti || '').toUpperCase().trim();
    if (p && p !== '-') parties.add(p);
  }

  const count = parties.size;
  const score = count >= 6 ? 90 : count >= 4 ? 70 : count >= 2 ? 50 : 20;

  return {
    name: 'Multi-Party Involvement',
    score,
    reason: count > 0
      ? `${count} parties involved: ${Array.from(parties).slice(0, 8).join(', ')}`
      : 'Single-party or no party attribution',
  };
}

/**
 * Score based on coalition stability context (if available).
 */
function scoreCoalitionContext(cia: CIAContext | undefined): NewsworthinessDimension {
  if (!cia?.coalitionStability) {
    return { name: 'Coalition Context', score: 30, reason: 'No CIA context available' };
  }

  const stability = cia.coalitionStability.stabilityScore ?? 100;
  const margin = cia.coalitionStability.majorityMargin ?? 10;

  let score = 30;
  const reasons: string[] = [];

  if (stability < 40) {
    score += 40;
    reasons.push('Critical coalition instability');
  } else if (stability < 60) {
    score += 25;
    reasons.push('Elevated coalition stress');
  }

  if (margin <= 3) {
    score += 20;
    reasons.push(`Razor-thin majority (${margin} seats)`);
  } else if (margin <= 5) {
    score += 10;
    reasons.push(`Thin majority (${margin} seats)`);
  }

  return {
    name: 'Coalition Context',
    score: Math.min(100, score),
    reason: reasons.length > 0 ? reasons.join('; ') : 'Coalition context stable',
  };
}

/**
 * Score based on content volume and richness.
 */
function scoreContentRichness(docs: RawDocument[]): NewsworthinessDimension {
  const withContent = docs.filter(d => d.fullText || d.fullContent || d.summary);
  const ratio = docs.length > 0 ? withContent.length / docs.length : 0;

  let score = Math.round(ratio * 60);
  if (docs.length >= 5) score += 20;
  if (docs.length >= 10) score += 20;

  return {
    name: 'Content Richness',
    score: Math.min(100, score),
    reason: `${withContent.length}/${docs.length} documents with substantive content`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score the newsworthiness of a set of documents for strategic importance.
 *
 * Evaluates across 6 dimensions:
 * 1. **Strategic Keywords** — Presence of high-impact political terms
 * 2. **Document Type** — Propositions/reports score higher than motions
 * 3. **Committee Importance** — Finance, Constitutional, Defence committees score higher
 * 4. **Multi-Party Involvement** — Cross-party issues are more newsworthy
 * 5. **Coalition Context** — Instability amplifies newsworthiness
 * 6. **Content Richness** — More substantive content enables deeper analysis
 *
 * @param docs - Documents to evaluate
 * @param cia - Optional CIA context for coalition stability
 * @returns Comprehensive newsworthiness assessment
 */
export function scoreNewsworthiness(docs: RawDocument[], cia?: CIAContext): NewsworthinessScore {
  if (docs.length === 0) {
    return {
      overall: 0,
      dimensions: [],
      warrantsDeepInspection: false,
      suggestedType: 'brief',
      topics: [],
    };
  }

  // Combine all text for keyword analysis
  const allText = docs.map(d =>
    [d.titel, d.title, d.summary, d.notis, d.fullText, d.fullContent].filter(Boolean).join(' ')
  ).join(' ');

  // Score each dimension — use the best score across all docs for type/committee
  // so the result is order-independent and reflects the most significant document.
  const docTypeScores = docs.map(d => scoreDocumentType(d));
  const bestDocType = docTypeScores.reduce((best, cur) => cur.score > best.score ? cur : best, docTypeScores[0]);

  const committeeScores = docs.map(d => scoreCommitteeImportance(d));
  const bestCommittee = committeeScores.reduce((best, cur) => cur.score > best.score ? cur : best, committeeScores[0]);

  const dimensions: NewsworthinessDimension[] = [
    scoreStrategicKeywords(allText),
    bestDocType,
    bestCommittee,
    scoreMultiPartyInvolvement(docs),
    scoreCoalitionContext(cia),
    scoreContentRichness(docs),
  ];

  // Weighted average
  const weights = [0.25, 0.15, 0.15, 0.15, 0.15, 0.15];
  const overall = Math.round(
    dimensions.reduce((sum, dim, i) => sum + dim.score * (weights[i] ?? 0.15), 0)
  );

  // Extract topics
  const lower = allText.toLowerCase();
  const topics = STRATEGIC_KEYWORDS
    .filter(kw => lower.includes(kw.toLowerCase()))
    .slice(0, 10);

  return {
    overall,
    dimensions,
    warrantsDeepInspection: overall >= DEEP_INSPECTION_THRESHOLD,
    suggestedType: overall >= DEEP_INSPECTION_THRESHOLD ? 'deep-inspection'
      : overall >= 35 ? 'standard'
      : 'brief',
    topics,
  };
}
