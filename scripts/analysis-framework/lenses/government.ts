/**
 * @module analysis-framework/lenses/government
 * @description Government perspective lens for parliamentary document analysis.
 *
 * Evaluates every document from the government's vantage point:
 * - Policy execution feasibility
 * - Budget and resource implications
 * - Coalition agreement alignment
 * - International commitment compliance
 *
 * The lens produces a `PerspectiveAnalysis` with SWOT contributions,
 * dashboard metrics, and mindmap nodes ready for downstream generators.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../../data-transformers/types.js';
import type { Language } from '../../types/language.js';
import type { PerspectiveAnalysis, ImpactLevel, Sentiment, SwotContribution, DashboardMetric, MindmapNode } from '../types.js';
import { detectPolicyDomains } from '../../data-transformers/policy-analysis.js';

// ---------------------------------------------------------------------------
// Internal keyword banks
// ---------------------------------------------------------------------------

/** Keywords that indicate a document involves coalition-critical decisions */
const COALITION_CRITICAL_KEYWORDS: readonly string[] = [
  'tidöavtal', 'tidöpartner', 'samarbetspartier', 'januariavtal',
  'samarbetspartierna', 'sd-stöd', 'budgetram', 'budgetproposition',
  'statsbudget', 'ramproposition', 'takpolitik',
];

/** Keywords signalling budget pressure or fiscal constraint */
const FISCAL_PRESSURE_KEYWORDS: readonly string[] = [
  'kostnadsökning', 'budgetbelastning', 'finansiering', 'finansiellt utrymme',
  'anslagsökning', 'anslagnedskärning', 'nettoutgifter', 'statsskuld',
  'lånebehov', 'underskott', 'surplus', 'deficit', 'fiscal gap',
  'savings requirement', 'besparing',
];

/** High-influence committee codes for the government lens */
const GOV_HIGH_INFLUENCE_COMMITTEES = new Set(['FiU', 'KU', 'FöU', 'UU', 'JuU']);

// ---------------------------------------------------------------------------
// Localised lens labels
// ---------------------------------------------------------------------------

const LENS_LABELS: Readonly<Record<string, { lensName: string; stakeholder: string }>> = {
  en: { lensName: 'Government Perspective', stakeholder: 'Government' },
  sv: { lensName: 'Regeringsperspektiv', stakeholder: 'Regeringen' },
  da: { lensName: 'Regeringsperspektiv', stakeholder: 'Regeringen' },
  no: { lensName: 'Regjeringsperspektiv', stakeholder: 'Regjeringen' },
  fi: { lensName: 'Hallituksen näkökulma', stakeholder: 'Hallitus' },
  de: { lensName: 'Regierungsperspektive', stakeholder: 'Regierung' },
  fr: { lensName: 'Perspective gouvernementale', stakeholder: 'Gouvernement' },
  es: { lensName: 'Perspectiva gubernamental', stakeholder: 'Gobierno' },
  nl: { lensName: 'Regeringsperspectief', stakeholder: 'Regering' },
  ar: { lensName: 'منظور الحكومة', stakeholder: 'الحكومة' },
  he: { lensName: 'פרספקטיבת הממשלה', stakeholder: 'הממשלה' },
  ja: { lensName: '政府の視点', stakeholder: '政府' },
  ko: { lensName: '정부 관점', stakeholder: '정부' },
  zh: { lensName: '政府视角', stakeholder: '政府' },
};

function label(lang: Language | string): { lensName: string; stakeholder: string } {
  return LENS_LABELS[lang] ?? LENS_LABELS['en'];
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Impact / Sentiment calculation
// ---------------------------------------------------------------------------

function computeImpact(doc: RawDocument, cia: CIAContext | undefined): ImpactLevel {
  const docType = doc.doktyp || doc.documentType || '';
  const committee = doc.organ || doc.committee || '';
  const isHighCommittee = GOV_HIGH_INFLUENCE_COMMITTEES.has(committee);
  const isHighDocType = ['prop', 'bet', 'skr'].includes(docType);

  // Propositions and committee reports on strategic committees are inherently high-impact
  if (isHighDocType && isHighCommittee) return 'high';
  if (docType === 'prop') return 'high';

  // Thin majority amplifies impact for all government-sponsored documents
  if (cia && cia.coalitionStability.majorityMargin <= 3) return 'high';

  if (isHighDocType || isHighCommittee) return 'medium';
  return 'low';
}

function computeSentiment(doc: RawDocument, cia: CIAContext | undefined): Sentiment {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  // Government-sponsored propositions are generally positive for the government
  if (doc.doktyp === 'prop') {
    // Unless they arrive during a coalition instability period
    if (cia && cia.coalitionStability.stabilityScore < 40) return 'neutral';
    return 'positive';
  }

  // Fiscal pressure signals negative impact on government agenda
  if (containsAny(allText, FISCAL_PRESSURE_KEYWORDS)) return 'negative';

  // Coalition-critical documents are neutral (could go either way)
  if (containsAny(allText, COALITION_CRITICAL_KEYWORDS)) return 'neutral';

  // Default neutral for motions
  if (doc.doktyp === 'mot') return 'neutral';

  return 'neutral';
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function buildSummary(doc: RawDocument, cia: CIAContext | undefined, _lang: Language | string, domains: string[]): string {
  const title = doc.titel || doc.title || 'Untitled';
  const docType = doc.doktyp || doc.documentType || 'document';
  const domainPhrase = domains.length > 0 ? ` touching ${domains.slice(0, 2).join(' and ')}` : '';

  const stabilityNote = cia && cia.coalitionStability.stabilityScore < 50
    ? ` Current coalition instability (stability score: ${cia.coalitionStability.stabilityScore}) increases execution risk.`
    : '';

  const coalitionNote = containsAny(title, COALITION_CRITICAL_KEYWORDS)
    ? ' Coalition agreement alignment must be verified before advancement.'
    : '';

  const fiscalNote = containsAny(title, FISCAL_PRESSURE_KEYWORDS)
    ? ' Fiscal feasibility assessment required; budget headroom may be constrained.'
    : '';

  return `From the government perspective, this ${docType}${domainPhrase} requires assessment of policy execution capacity and resource allocation.${stabilityNote}${coalitionNote}${fiscalNote}`.trim();
}

// ---------------------------------------------------------------------------
// SWOT contributions
// ---------------------------------------------------------------------------

function buildSwotContributions(doc: RawDocument, cia: CIAContext | undefined, lang: Language | string, domains: string[]): SwotContribution[] {
  const { stakeholder } = label(lang);
  const contributions: SwotContribution[] = [];
  const docType = doc.doktyp || doc.documentType || '';

  // Strength: government-initiated propositions reinforce policy mandate
  if (docType === 'prop') {
    contributions.push({
      quadrant: 'strength',
      forStakeholder: stakeholder,
      text: 'Government-initiated legislation reinforces policy mandate and demonstrates programme delivery.',
      impact: 'high',
    });
  }

  // Opportunity: policy domain expansion
  if (domains.length > 0) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: `Policy advancement opportunity in ${domains.slice(0, 2).join(' and ')} domain(s), aligned with coalition programme.`,
      impact: 'medium',
    });
  }

  // Weakness: coalition instability
  if (cia && cia.coalitionStability.stabilityScore < 50) {
    contributions.push({
      quadrant: 'weakness',
      forStakeholder: stakeholder,
      text: `Coalition fragility (stability score ${cia.coalitionStability.stabilityScore}) risks legislative delays or defeats.`,
      impact: 'high',
    });
  }

  // Threat: thin majority
  if (cia && cia.coalitionStability.majorityMargin <= 3) {
    contributions.push({
      quadrant: 'threat',
      forStakeholder: stakeholder,
      text: `Razor-thin majority (${cia.coalitionStability.majorityMargin} seat(s)) creates defeat risk on contested votes.`,
      impact: 'high',
    });
  }

  return contributions;
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

function buildDashboardMetrics(_doc: RawDocument, cia: CIAContext | undefined, domains: string[]): DashboardMetric[] {
  const metrics: DashboardMetric[] = [];

  if (cia) {
    metrics.push({
      metricName: 'Coalition Stability',
      value: cia.coalitionStability.stabilityScore,
      unit: 'score',
    });
    metrics.push({
      metricName: 'Majority Margin',
      value: cia.coalitionStability.majorityMargin,
      unit: 'seats',
    });
  }

  metrics.push({
    metricName: 'Policy Domains Affected',
    value: domains.length,
    unit: 'domains',
  });

  return metrics;
}

// ---------------------------------------------------------------------------
// Mindmap nodes
// ---------------------------------------------------------------------------

function buildMindmapNodes(doc: RawDocument, _lang: Language | string, domains: string[]): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  const docType = doc.doktyp || doc.documentType || '';

  nodes.push({
    branch: 'Legislative Pipeline',
    item: docType === 'prop' ? 'Government Bill' : docType === 'bet' ? 'Committee Report' : 'Parliamentary Document',
    weight: docType === 'prop' ? 'critical' : 'significant',
  });

  for (const domain of domains.slice(0, 3)) {
    nodes.push({
      branch: 'Policy Domains',
      item: domain,
      weight: 'significant',
    });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

function computeConfidence(doc: RawDocument, cia: CIAContext | undefined): number {
  let score = 40; // Base

  if (doc.fullText || doc.fullContent) score += 20;
  if (doc.summary || doc.notis) score += 10;
  if (cia) score += 20;
  if (doc.speeches && doc.speeches.length > 0) score += 10;

  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply the Government analysis lens to a single parliamentary document.
 *
 * Evaluates policy execution feasibility, budget implications, coalition
 * alignment, and international commitment compliance.
 *
 * @param doc  - The document to analyse
 * @param cia  - Optional CIA context for coalition stability data
 * @param lang - Target language for all generated text
 * @returns    A `PerspectiveAnalysis` for the government lens
 */
export function analyzeGovernmentPerspective(
  doc: RawDocument,
  cia: CIAContext | undefined,
  lang: Language | string,
): PerspectiveAnalysis {
  const keyActors: string[] = ['Prime Minister', 'Cabinet'];
  if (cia) {
    const govParties = cia.partyPerformance
      .filter(p => p.metrics.seats > 0)
      .slice(0, 3)
      .map(p => p.partyName);
    keyActors.push(...govParties);
  }

  const domains = detectPolicyDomains(doc, 'en');
  const relatedPolicies = [...domains, 'Coalition Programme 2022-2026'].filter(Boolean);

  return {
    lens: 'government',
    summary: buildSummary(doc, cia, lang, domains),
    impact: computeImpact(doc, cia),
    sentiment: computeSentiment(doc, cia),
    keyActors: [...new Set(keyActors)].slice(0, 5),
    relatedPolicies: relatedPolicies.slice(0, 5),
    swotContribution: buildSwotContributions(doc, cia, lang, domains),
    dashboardMetrics: buildDashboardMetrics(doc, cia, domains),
    mindmapNodes: buildMindmapNodes(doc, lang, domains),
    confidence: computeConfidence(doc, cia),
  };
}
