/**
 * @module analysis-framework/lenses/opposition
 * @description Opposition perspective lens for parliamentary document analysis.
 *
 * Evaluates every document from the opposition's vantage point:
 * - Scrutiny opportunities
 * - Alternative policy proposals
 * - Electoral positioning impact
 * - Coalition-building potential
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../../data-transformers/types.js';
import type { Language } from '../../types/language.js';
import type { PerspectiveAnalysis, ImpactLevel, Sentiment, SwotContribution, DashboardMetric, MindmapNode } from '../types.js';
import { detectPolicyDomains } from '../../data-transformers/policy-analysis.js';

// ---------------------------------------------------------------------------
// Scrutiny trigger keywords
// ---------------------------------------------------------------------------

/** Topics that typically attract intense opposition scrutiny */
const SCRUTINY_KEYWORDS: readonly string[] = [
  'privatisering', 'privatization', 'avreglering', 'deregulation',
  'skattesänkning', 'tax cut', 'neddragning', 'cut', 'nedskärning',
  'socialbidrag', 'welfare', 'sjukvård', 'healthcare', 'skola', 'school',
  'pension', 'arbetsmarknad', 'labour market', 'integration', 'migration',
  'bostadsbrist', 'housing shortage', 'korruption', 'corruption',
  'granskning', 'scrutiny', 'utredning', 'inquiry',
];

// ---------------------------------------------------------------------------
// Localised labels
// ---------------------------------------------------------------------------

const LENS_LABELS: Readonly<Record<string, { lensName: string; stakeholder: string }>> = {
  en: { lensName: 'Opposition Perspective', stakeholder: 'Opposition' },
  sv: { lensName: 'Oppositionsperspektiv', stakeholder: 'Oppositionen' },
  da: { lensName: 'Oppositionsperspektiv', stakeholder: 'Oppositionen' },
  no: { lensName: 'Opposisjonsperspektiv', stakeholder: 'Opposisjonen' },
  fi: { lensName: 'Oppositiönäkökulma', stakeholder: 'Oppositio' },
  de: { lensName: 'Oppositionsperspektive', stakeholder: 'Opposition' },
  fr: { lensName: "Perspective de l'opposition", stakeholder: "Opposition" },
  es: { lensName: 'Perspectiva de la oposición', stakeholder: 'Oposición' },
  nl: { lensName: 'Oppositieperspectief', stakeholder: 'Oppositie' },
  ar: { lensName: 'منظور المعارضة', stakeholder: 'المعارضة' },
  he: { lensName: 'פרספקטיבת האופוזיציה', stakeholder: 'האופוזיציה' },
  ja: { lensName: '野党の視点', stakeholder: '野党' },
  ko: { lensName: '야당 관점', stakeholder: '야당' },
  zh: { lensName: '反对党视角', stakeholder: '反对党' },
};

function label(lang: Language | string): { lensName: string; stakeholder: string } {
  return LENS_LABELS[lang] ?? LENS_LABELS['en'];
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function computeImpact(doc: RawDocument): ImpactLevel {
  const docType = doc.doktyp || doc.documentType || '';
  // Government propositions are prime opposition targets
  if (docType === 'prop') return 'high';
  // Committee reports signal a policy decision about to be enacted
  if (docType === 'bet') return 'high';
  // Opposition motions: medium self-originated impact
  if (docType === 'mot') return 'medium';
  return 'low';
}

function computeSentiment(doc: RawDocument): Sentiment {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  // Opposition motions are opportunities for the opposition → positive
  if (doc.doktyp === 'mot') return 'positive';

  // Scrutiny-triggering content from the government is an opportunity
  if (doc.doktyp === 'prop' && containsAny(allText, SCRUTINY_KEYWORDS)) return 'positive';

  // Committee reports passing government proposals: negative for opposition
  if (doc.doktyp === 'bet') return 'negative';

  return 'neutral';
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function buildSummary(doc: RawDocument, cia: CIAContext | undefined, _lang: Language | string, domains: string[]): string {
  const title = doc.titel || doc.title || 'Untitled';
  const docType = doc.doktyp || doc.documentType || 'document';
  const domainPhrase = domains.length > 0 ? ` in ${domains.slice(0, 2).join(' and ')}` : '';

  const denialNote = cia
    ? ` Note: approximately ${cia.overallMotionDenialRate ?? 99}% of opposition motions are denied.`
    : '';

  if (docType === 'mot') {
    return `From the opposition perspective, this motion${domainPhrase} signals a policy alternative and positions the party electorally.${denialNote} Success in passage is unlikely, but the motion builds party profile and accountability record.`;
  }

  const scrutiny = containsAny(title, SCRUTINY_KEYWORDS);
  const scrutinyNote = scrutiny ? ' This document creates scrutiny opportunities the opposition should exploit in debates and committee hearings.' : '';

  return `From the opposition perspective, this ${docType}${domainPhrase} warrants scrutiny for alignment with citizen welfare and democratic accountability.${scrutinyNote}`.trim();
}

// ---------------------------------------------------------------------------
// SWOT contributions
// ---------------------------------------------------------------------------

function buildSwotContributions(doc: RawDocument, cia: CIAContext | undefined, lang: Language | string): SwotContribution[] {
  const { stakeholder } = label(lang);
  const contributions: SwotContribution[] = [];
  const docType = doc.doktyp || doc.documentType || '';
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (docType === 'prop' && containsAny(allText, SCRUTINY_KEYWORDS)) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: 'Government proposal touches politically sensitive topics, creating scrutiny and differentiation opportunities.',
      impact: 'high',
    });
  }

  if (docType === 'mot') {
    contributions.push({
      quadrant: 'strength',
      forStakeholder: stakeholder,
      text: 'Opposition motion on record, building electoral positioning and demonstrating policy alternative.',
      impact: 'medium',
    });
  }

  if (cia && cia.coalitionStability.stabilityScore < 50) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: `Coalition fragility (stability: ${cia.coalitionStability.stabilityScore}) creates defection recruitment opportunities.`,
      impact: 'high',
    });
  }

  if (cia && cia.overallMotionDenialRate && cia.overallMotionDenialRate > 95) {
    contributions.push({
      quadrant: 'threat',
      forStakeholder: stakeholder,
      text: `High motion denial rate (${cia.overallMotionDenialRate}%) limits legislative impact of opposition proposals.`,
      impact: 'medium',
    });
  }

  return contributions;
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

function buildDashboardMetrics(_doc: RawDocument, cia: CIAContext | undefined): DashboardMetric[] {
  const metrics: DashboardMetric[] = [];

  if (cia) {
    metrics.push({
      metricName: 'Motion Denial Rate',
      value: cia.overallMotionDenialRate ?? 99,
      unit: '%',
    });
    metrics.push({
      metricName: 'Coalition Stability',
      value: cia.coalitionStability.stabilityScore,
      unit: 'score',
    });
  }

  return metrics;
}

// ---------------------------------------------------------------------------
// Mindmap nodes
// ---------------------------------------------------------------------------

function buildMindmapNodes(doc: RawDocument, _lang: Language | string, domains: string[]): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  const docType = doc.doktyp || doc.documentType || '';

  nodes.push({
    branch: 'Scrutiny Targets',
    item: docType === 'prop' ? 'Government Bill Accountability' : 'Legislative Oversight',
    weight: docType === 'prop' ? 'critical' : 'significant',
  });

  for (const domain of domains.slice(0, 2)) {
    nodes.push({
      branch: 'Electoral Positioning',
      item: domain,
      weight: 'moderate',
    });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function computeConfidence(doc: RawDocument, cia: CIAContext | undefined): number {
  let score = 40;
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
 * Apply the Opposition analysis lens to a single parliamentary document.
 *
 * Evaluates scrutiny opportunities, alternative policy proposals, electoral
 * positioning impact, and coalition-building potential.
 *
 * @param doc  - The document to analyse
 * @param cia  - Optional CIA context
 * @param lang - Target language
 * @returns    A `PerspectiveAnalysis` for the opposition lens
 */
export function analyzeOppositionPerspective(
  doc: RawDocument,
  cia: CIAContext | undefined,
  lang: Language | string,
  precomputedDomains?: string[],
): PerspectiveAnalysis {
  // Key actors: opposition parties in parliament
  const keyActors: string[] = ['Opposition Leader', 'Shadow Cabinet'];
  if (cia) {
    // Include parties that are not the largest governing bloc
    const parties = cia.partyPerformance.slice(0, 4).map(p => p.partyName);
    keyActors.push(...parties);
  }
  if (doc.parti) keyActors.unshift(doc.parti);

  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');
  const relatedPolicies = [...domains, 'Electoral Programme', 'Parliamentary Scrutiny'].filter(Boolean);

  return {
    lens: 'opposition',
    summary: buildSummary(doc, cia, lang, domains),
    impact: computeImpact(doc),
    sentiment: computeSentiment(doc),
    keyActors: [...new Set(keyActors)].slice(0, 5),
    relatedPolicies: relatedPolicies.slice(0, 5),
    swotContribution: buildSwotContributions(doc, cia, lang),
    dashboardMetrics: buildDashboardMetrics(doc, cia),
    mindmapNodes: buildMindmapNodes(doc, lang, domains),
    confidence: computeConfidence(doc, cia),
  };
}
