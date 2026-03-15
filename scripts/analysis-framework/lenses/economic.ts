/**
 * @module analysis-framework/lenses/economic
 * @description Economic perspective lens for parliamentary document analysis.
 *
 * Evaluates every document from the economic vantage point:
 * - GDP/employment implications
 * - Business regulatory impact
 * - Investment climate effects
 * - Trade and competitiveness
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../../data-transformers/types.js';
import type { Language } from '../../types/language.js';
import type { PerspectiveAnalysis, ImpactLevel, Sentiment, SwotContribution, DashboardMetric, MindmapNode } from '../types.js';
import { detectPolicyDomains } from '../../data-transformers/policy-analysis.js';

// ---------------------------------------------------------------------------
// Economic keyword banks
// ---------------------------------------------------------------------------

/** Keywords indicating positive economic signals */
const POSITIVE_ECON_KEYWORDS: readonly string[] = [
  'tillväxt', 'growth', 'sysselsättning', 'employment', 'investering', 'investment',
  'konkurrenskraft', 'competitiveness', 'export', 'innovation', 'produktivitet', 'productivity',
  'avreglering', 'deregulation', 'skattelättnader', 'tax relief', 'incitament', 'incentive',
  'frihandel', 'free trade', 'handelsliberalisering', 'trade liberalisation',
];

/** Keywords indicating negative economic signals */
const NEGATIVE_ECON_KEYWORDS: readonly string[] = [
  'recession', 'lågkonjunktur', 'downturn', 'nedgång', 'nedskärning', 'cut',
  'avskedning', 'layoff', 'varsel', 'redundancy', 'konkurs', 'bankruptcy',
  'skuld', 'debt', 'underskott', 'deficit', 'protektionism', 'protectionism',
  'handelshinder', 'trade barrier', 'importrestriktion', 'import restriction',
  'strejk', 'strike', 'lockout', 'arbetskonflikt', 'labour dispute',
];

/** Keywords indicating business regulation impact */
const REGULATION_KEYWORDS: readonly string[] = [
  'tillstånd', 'permit', 'reglering', 'regulation', 'compliance', 'direktiv', 'directive',
  'rapporteringskrav', 'reporting requirement', 'bokföring', 'accounting', 'redovisning',
  'hållbarhetsredovisning', 'sustainability reporting', 'kapitalkrav', 'capital requirement',
  'tillsyn', 'supervision', 'tillsynsmyndighet', 'regulatory authority',
  'sanktionsavgift', 'sanction fee', 'böter', 'fine', 'straffavgift',
];

// ---------------------------------------------------------------------------
// Localised labels
// ---------------------------------------------------------------------------

const LENS_LABELS: Readonly<Record<string, { lensName: string; stakeholder: string }>> = {
  en: { lensName: 'Economic Perspective', stakeholder: 'Economy & Business' },
  sv: { lensName: 'Ekonomiperspektiv', stakeholder: 'Ekonomi och näringsliv' },
  da: { lensName: 'Økonomiperspektiv', stakeholder: 'Økonomi og erhvervsliv' },
  no: { lensName: 'Økonomiperspektiv', stakeholder: 'Økonomi og næringsliv' },
  fi: { lensName: 'Talousnäkökulma', stakeholder: 'Talous ja elinkeinoelämä' },
  de: { lensName: 'Wirtschaftsperspektive', stakeholder: 'Wirtschaft' },
  fr: { lensName: 'Perspective économique', stakeholder: 'Économie' },
  es: { lensName: 'Perspectiva económica', stakeholder: 'Economía' },
  nl: { lensName: 'Economisch perspectief', stakeholder: 'Economie' },
  ar: { lensName: 'المنظور الاقتصادي', stakeholder: 'الاقتصاد' },
  he: { lensName: 'פרספקטיבה כלכלית', stakeholder: 'הכלכלה' },
  ja: { lensName: '経済的視点', stakeholder: '経済' },
  ko: { lensName: '경제적 관점', stakeholder: '경제' },
  zh: { lensName: '经济视角', stakeholder: '经济' },
};

function label(lang: Language | string): { lensName: string; stakeholder: string } {
  return LENS_LABELS[lang] ?? LENS_LABELS['en'];
}

function countKeywords(text: string, keywords: readonly string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  return countKeywords(text, keywords) > 0;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function computeImpact(doc: RawDocument, domains: string[]): ImpactLevel {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const hasEconDomain = domains.some(d =>
    ['fiscal', 'trade', 'labour', 'housing', 'fiscal policy', 'trade', 'labour market'].some(
      ed => d.toLowerCase().includes(ed)
    )
  );

  const posCount = countKeywords(allText, POSITIVE_ECON_KEYWORDS);
  const negCount = countKeywords(allText, NEGATIVE_ECON_KEYWORDS);
  const regCount = countKeywords(allText, REGULATION_KEYWORDS);

  const totalSignals = posCount + negCount + regCount;

  if (hasEconDomain && (doc.doktyp === 'prop' || doc.doktyp === 'bet')) return 'high';
  if (totalSignals >= 3) return 'high';
  if (totalSignals >= 1 || hasEconDomain) return 'medium';
  return 'low';
}

function computeSentiment(doc: RawDocument): Sentiment {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');
  const posCount = countKeywords(allText, POSITIVE_ECON_KEYWORDS);
  const negCount = countKeywords(allText, NEGATIVE_ECON_KEYWORDS);

  if (posCount > negCount + 1) return 'positive';
  if (negCount > posCount + 1) return 'negative';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function buildSummary(doc: RawDocument, _cia: CIAContext | undefined, _lang: Language | string, domains: string[]): string {
  const docType = doc.doktyp || doc.documentType || 'document';
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const hasReg = containsAny(allText, REGULATION_KEYWORDS);
  const hasTrade = domains.some(d => d.toLowerCase().includes('trade'));
  const hasFiscal = domains.some(d => d.toLowerCase().includes('fiscal'));

  const notes: string[] = [];
  if (hasReg) notes.push('regulatory compliance costs require business impact assessment');
  if (hasTrade) notes.push('trade and competitiveness implications should be modelled');
  if (hasFiscal) notes.push('fiscal multiplier effects on GDP and employment warrant quantification');

  const notePhrase = notes.length > 0 ? ` Specifically, ${notes.join('; ')}.` : '';

  return `From the economic perspective, this ${docType} may affect business environment, employment levels, and investment climate.${notePhrase}`.trim();
}

// ---------------------------------------------------------------------------
// SWOT contributions
// ---------------------------------------------------------------------------

function buildSwotContributions(doc: RawDocument, _cia: CIAContext | undefined, lang: Language | string): SwotContribution[] {
  const { stakeholder } = label(lang);
  const contributions: SwotContribution[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (containsAny(allText, POSITIVE_ECON_KEYWORDS)) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: 'Document signals economic growth-oriented policy with potential investment and employment benefits.',
      impact: 'high',
    });
  }

  if (containsAny(allText, NEGATIVE_ECON_KEYWORDS)) {
    contributions.push({
      quadrant: 'threat',
      forStakeholder: stakeholder,
      text: 'Economic contraction indicators detected — assess potential GDP and employment downside risk.',
      impact: 'high',
    });
  }

  if (containsAny(allText, REGULATION_KEYWORDS)) {
    contributions.push({
      quadrant: 'weakness',
      forStakeholder: stakeholder,
      text: 'New regulatory requirements may increase business compliance costs and reduce competitiveness.',
      impact: 'medium',
    });
  }

  return contributions;
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

function buildDashboardMetrics(doc: RawDocument, _cia: CIAContext | undefined): DashboardMetric[] {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');
  return [
    { metricName: 'Growth Signals', value: countKeywords(allText, POSITIVE_ECON_KEYWORDS), unit: 'hits' },
    { metricName: 'Contraction Signals', value: countKeywords(allText, NEGATIVE_ECON_KEYWORDS), unit: 'hits' },
    { metricName: 'Regulatory Keywords', value: countKeywords(allText, REGULATION_KEYWORDS), unit: 'hits' },
  ];
}

// ---------------------------------------------------------------------------
// Mindmap nodes
// ---------------------------------------------------------------------------

function buildMindmapNodes(doc: RawDocument, _lang: Language | string, domains: string[]): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (containsAny(allText, POSITIVE_ECON_KEYWORDS)) {
    nodes.push({ branch: 'Growth Opportunities', item: 'Investment & Employment', weight: 'critical' });
  }
  if (containsAny(allText, REGULATION_KEYWORDS)) {
    nodes.push({ branch: 'Regulatory Environment', item: 'Business Compliance', weight: 'significant' });
  }
  if (containsAny(allText, NEGATIVE_ECON_KEYWORDS)) {
    nodes.push({ branch: 'Economic Risks', item: 'Contraction Indicators', weight: 'critical' });
  }
  for (const d of domains.filter(d =>
    ['fiscal', 'trade', 'labour'].some(e => d.toLowerCase().includes(e))
  ).slice(0, 2)) {
    nodes.push({ branch: 'Policy Domains', item: d, weight: 'moderate' });
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
 * Apply the Economic analysis lens to a single parliamentary document.
 *
 * Evaluates GDP/employment implications, business regulatory impact,
 * investment climate effects, and trade and competitiveness.
 *
 * @param doc  - The document to analyse
 * @param cia  - Optional CIA context
 * @param lang - Target language
 * @returns    A `PerspectiveAnalysis` for the economic lens
 */
export function analyzeEconomicPerspective(
  doc: RawDocument,
  cia: CIAContext | undefined,
  lang: Language | string,
  precomputedDomains?: string[],
): PerspectiveAnalysis {
  const keyActors = ['Finance Ministry', 'Riksbank', 'Employers Federation', 'Trade Unions', 'Chamber of Commerce'];
  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');
  const relatedPolicies = [...domains, 'Economic Policy Framework', 'Growth Strategy'].filter(Boolean);

  return {
    lens: 'economic',
    summary: buildSummary(doc, cia, lang, domains),
    impact: computeImpact(doc, domains),
    sentiment: computeSentiment(doc),
    keyActors: keyActors.slice(0, 5),
    relatedPolicies: relatedPolicies.slice(0, 5),
    swotContribution: buildSwotContributions(doc, cia, lang),
    dashboardMetrics: buildDashboardMetrics(doc, cia),
    mindmapNodes: buildMindmapNodes(doc, lang, domains),
    confidence: computeConfidence(doc, cia),
  };
}
