/**
 * @module analysis-framework/lenses/citizen
 * @description Citizen perspective lens for parliamentary document analysis.
 *
 * Evaluates every document from the citizen's vantage point:
 * - Service delivery impact
 * - Rights and freedoms implications
 * - Cost of living effects
 * - Democratic participation impact
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../../data-transformers/types.js';
import type { Language } from '../../types/language.js';
import type { PerspectiveAnalysis, ImpactLevel, Sentiment, SwotContribution, DashboardMetric, MindmapNode } from '../types.js';
import { detectPolicyDomains } from '../../data-transformers/policy-analysis.js';

// ---------------------------------------------------------------------------
// Domain to citizen service mapping
// ---------------------------------------------------------------------------

/** Policy domains with direct citizen service-delivery impact */
const HIGH_CITIZEN_IMPACT_DOMAINS: readonly string[] = [
  'healthcare policy', 'education policy', 'housing', 'labour', 'fiscal policy',
  'justice', 'migration', 'hälso- och sjukvårdspolitik', 'utbildningspolitik',
  'arbetsmarknad', 'bostad', 'rättvisa', 'migration',
];

/** Keywords indicating direct cost-of-living impact */
const COST_OF_LIVING_KEYWORDS: readonly string[] = [
  'skatt', 'tax', 'avgift', 'fee', 'hyra', 'rent', 'prisökning', 'price increase',
  'inflation', 'köpkraft', 'purchasing power', 'levnadskostnad', 'cost of living',
  'energipris', 'energy price', 'bensinpris', 'fuel price', 'matpris', 'food price',
  'barnbidrag', 'child benefit', 'sjukpenning', 'sick pay', 'a-kassa', 'unemployment benefit',
  'pension',
];

/** Keywords indicating rights or freedoms impact */
const RIGHTS_KEYWORDS: readonly string[] = [
  'rättighet', 'right', 'frihet', 'freedom', 'integritet', 'privacy', 'gdpr',
  'diskriminering', 'discrimination', 'jämlikhet', 'equality', 'tillgänglighet', 'accessibility',
  'tryckfrihet', 'press freedom', 'yttrandefrihet', 'freedom of expression',
  'dataskydd', 'data protection', 'personuppgifter', 'personal data',
];

// ---------------------------------------------------------------------------
// Localised labels
// ---------------------------------------------------------------------------

const LENS_LABELS: Readonly<Record<string, { lensName: string; stakeholder: string }>> = {
  en: { lensName: 'Citizen Perspective', stakeholder: 'Citizens' },
  sv: { lensName: 'Medborgarperspektiv', stakeholder: 'Medborgarna' },
  da: { lensName: 'Borgerperspektiv', stakeholder: 'Borgerne' },
  no: { lensName: 'Borgerperspektiv', stakeholder: 'Borgerne' },
  fi: { lensName: 'Kansalaisnäkökulma', stakeholder: 'Kansalaiset' },
  de: { lensName: 'Bürgerperspektive', stakeholder: 'Bürgerinnen und Bürger' },
  fr: { lensName: 'Perspective citoyenne', stakeholder: 'Citoyens' },
  es: { lensName: 'Perspectiva ciudadana', stakeholder: 'Ciudadanos' },
  nl: { lensName: 'Burgerperspectief', stakeholder: 'Burgers' },
  ar: { lensName: 'منظور المواطن', stakeholder: 'المواطنون' },
  he: { lensName: 'פרספקטיבת האזרח', stakeholder: 'האזרחים' },
  ja: { lensName: '市民の視点', stakeholder: '市民' },
  ko: { lensName: '시민 관점', stakeholder: '시민' },
  zh: { lensName: '公民视角', stakeholder: '公民' },
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

function computeImpact(doc: RawDocument, domains: string[]): ImpactLevel {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const hasCitizenDomain = domains.some(d =>
    HIGH_CITIZEN_IMPACT_DOMAINS.some(cd => d.toLowerCase().includes(cd.toLowerCase()))
  );

  if (hasCitizenDomain && (doc.doktyp === 'prop' || doc.doktyp === 'bet')) return 'high';
  if (containsAny(allText, COST_OF_LIVING_KEYWORDS) || containsAny(allText, RIGHTS_KEYWORDS)) return 'high';
  if (hasCitizenDomain) return 'medium';
  return 'low';
}

function computeSentiment(doc: RawDocument): Sentiment {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  // Any rights-reducing language → negative
  if (containsAny(allText, ['neddragning', 'nedskärning', 'cut', 'reduction', 'restriction',
    'begränsning', 'inskränkning', 'avgiftshöjning', 'fee increase'])) {
    return 'negative';
  }

  // Investment in services → positive
  if (containsAny(allText, ['satsning', 'investment', 'ökning', 'increase', 'förbättring',
    'improvement', 'förstärkning', 'strengthening', 'bidrag', 'grant', 'stöd', 'support'])) {
    return 'positive';
  }

  return 'neutral';
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function buildSummary(doc: RawDocument, _cia: CIAContext | undefined, _lang: Language | string, domains: string[]): string {
  const docType = doc.doktyp || doc.documentType || 'document';
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const hasCostImpact = containsAny(allText, COST_OF_LIVING_KEYWORDS);
  const hasRightsImpact = containsAny(allText, RIGHTS_KEYWORDS);
  const domainPhrase = domains.length > 0 ? ` affecting ${domains.slice(0, 2).join(' and ')}` : '';

  const costNote = hasCostImpact ? ' Citizens should assess potential cost-of-living implications closely.' : '';
  const rightsNote = hasRightsImpact ? ' Rights and freedoms dimensions of this document warrant public attention.' : '';

  return `From the citizen perspective, this ${docType}${domainPhrase} has direct implications for service delivery and everyday life.${costNote}${rightsNote}`.trim();
}

// ---------------------------------------------------------------------------
// SWOT contributions
// ---------------------------------------------------------------------------

function buildSwotContributions(doc: RawDocument, _cia: CIAContext | undefined, lang: Language | string, domains: string[]): SwotContribution[] {
  const { stakeholder } = label(lang);
  const contributions: SwotContribution[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (domains.some(d => HIGH_CITIZEN_IMPACT_DOMAINS.some(cd => d.toLowerCase().includes(cd.toLowerCase())))) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: 'Document addresses areas with high citizen service delivery impact.',
      impact: 'high',
    });
  }

  if (containsAny(allText, RIGHTS_KEYWORDS)) {
    contributions.push({
      quadrant: 'threat',
      forStakeholder: stakeholder,
      text: 'Document may affect citizen rights and freedoms — requires civil society monitoring.',
      impact: 'high',
    });
  }

  if (containsAny(allText, COST_OF_LIVING_KEYWORDS)) {
    contributions.push({
      quadrant: 'weakness',
      forStakeholder: stakeholder,
      text: 'Possible cost-of-living implications need transparent impact assessment for vulnerable groups.',
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
  const metrics: DashboardMetric[] = [];

  metrics.push({
    metricName: 'Cost-of-Living Keywords',
    value: COST_OF_LIVING_KEYWORDS.filter(kw => allText.toLowerCase().includes(kw.toLowerCase())).length,
    unit: 'hits',
  });

  metrics.push({
    metricName: 'Rights Keywords',
    value: RIGHTS_KEYWORDS.filter(kw => allText.toLowerCase().includes(kw.toLowerCase())).length,
    unit: 'hits',
  });

  return metrics;
}

// ---------------------------------------------------------------------------
// Mindmap nodes
// ---------------------------------------------------------------------------

function buildMindmapNodes(doc: RawDocument, _lang: Language | string): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  nodes.push({
    branch: 'Service Delivery',
    item: 'Direct Citizen Impact',
    weight: 'significant',
  });

  if (containsAny(allText, COST_OF_LIVING_KEYWORDS)) {
    nodes.push({ branch: 'Economic Wellbeing', item: 'Cost-of-Living Effect', weight: 'critical' });
  }

  if (containsAny(allText, RIGHTS_KEYWORDS)) {
    nodes.push({ branch: 'Rights & Freedoms', item: 'Civil Liberties Review', weight: 'critical' });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function computeConfidence(doc: RawDocument): number {
  let score = 40;
  if (doc.fullText || doc.fullContent) score += 25;
  if (doc.summary || doc.notis) score += 15;
  if (doc.speeches && doc.speeches.length > 0) score += 10;
  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply the Citizen analysis lens to a single parliamentary document.
 *
 * Evaluates service delivery impact, rights and freedoms implications,
 * cost of living effects, and democratic participation impact.
 *
 * @param doc  - The document to analyse
 * @param cia  - Optional CIA context
 * @param lang - Target language
 * @returns    A `PerspectiveAnalysis` for the citizen lens
 */
export function analyzeCitizenPerspective(
  doc: RawDocument,
  cia: CIAContext | undefined,
  lang: Language | string,
  precomputedDomains?: string[],
): PerspectiveAnalysis {
  const keyActors = ['Civil Society', 'Trade Unions', 'Consumer Groups', 'Ombudsmen'];
  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');
  const relatedPolicies = [...domains, 'Public Services Charter', 'Rights Framework'].filter(Boolean);

  return {
    lens: 'citizen',
    summary: buildSummary(doc, cia, lang, domains),
    impact: computeImpact(doc, domains),
    sentiment: computeSentiment(doc),
    keyActors: keyActors.slice(0, 5),
    relatedPolicies: relatedPolicies.slice(0, 5),
    swotContribution: buildSwotContributions(doc, cia, lang, domains),
    dashboardMetrics: buildDashboardMetrics(doc, cia),
    mindmapNodes: buildMindmapNodes(doc, lang),
    confidence: computeConfidence(doc),
  };
}
