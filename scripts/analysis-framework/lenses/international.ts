/**
 * @module analysis-framework/lenses/international
 * @description International perspective lens for parliamentary document analysis.
 *
 * Evaluates every document from the international vantage point:
 * - EU regulatory alignment
 * - Nordic cooperation implications
 * - Global treaty obligations
 * - Diplomatic signal assessment
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../../data-transformers/types.js';
import type { Language } from '../../types/language.js';
import type { PerspectiveAnalysis, ImpactLevel, Sentiment, SwotContribution, DashboardMetric, MindmapNode } from '../types.js';
import { detectPolicyDomains } from '../../data-transformers/policy-analysis.js';

// ---------------------------------------------------------------------------
// International keyword banks
// ---------------------------------------------------------------------------

/** EU-specific alignment keywords */
const EU_KEYWORDS: readonly string[] = [
  'eu-direktiv', 'eu directive', 'eu-förordning', 'eu regulation', 'europaparlamentet',
  'eu-kommissionen', 'european commission', 'europeiska unionen', 'european union',
  'schengen', 'euratom', 'eurozon', 'eurozone', 'eu-anpassning', 'eu alignment',
  'eu-konform', 'eu-rätt', 'eu law', 'eu-implementering', 'eu implementation',
  'inre marknaden', 'single market', 'fria rörligheten', 'free movement',
  'statsstödsregler', 'state aid rules', 'konkurrensrätt', 'competition law',
];

/** Nordic cooperation keywords */
const NORDIC_KEYWORDS: readonly string[] = [
  'nordisk', 'nordic', 'norge', 'norway', 'finland', 'danmark', 'denmark',
  'island', 'iceland', 'färöarna', 'faroe', 'nordisk råd', 'nordic council',
  'nordiskt samarbete', 'nordic cooperation', 'norden', 'öresund', 'arktis', 'arctic',
];

/** NATO/defence treaty keywords */
const TREATY_KEYWORDS: readonly string[] = [
  'nato', 'förenta nationerna', 'united nations', 'fördrag', 'treaty',
  'konvention', 'convention', 'protokoll', 'protocol', 'avtal', 'agreement',
  'wto', 'imf', 'världsbanken', 'world bank', 'oecd', 'coe', 'europarådet',
  'council of europe', 'mänskliga rättigheter', 'human rights',
  'folkrätt', 'international law', 'haag', 'hague', 'internationell domstol',
];

/** Diplomatic signal keywords */
const DIPLOMATIC_KEYWORDS: readonly string[] = [
  'utrikespolitik', 'foreign policy', 'diplomatisk', 'diplomatic', 'ambassad', 'embassy',
  'bilateralt', 'bilateral', 'multilateralt', 'multilateral', 'sanktion', 'sanction',
  'handelsavtal', 'trade agreement', 'frihandelsavtal', 'free trade agreement',
  'geopolitisk', 'geopolitical', 'säkerhetsråd', 'security council',
];

// ---------------------------------------------------------------------------
// Localised labels
// ---------------------------------------------------------------------------

const LENS_LABELS: Readonly<Record<string, { lensName: string; stakeholder: string }>> = {
  en: { lensName: 'International Perspective', stakeholder: 'International Community' },
  sv: { lensName: 'Internationellt perspektiv', stakeholder: 'Internationella samfundet' },
  da: { lensName: 'Internationalt perspektiv', stakeholder: 'Det internationale samfund' },
  no: { lensName: 'Internasjonalt perspektiv', stakeholder: 'Det internasjonale samfunnet' },
  fi: { lensName: 'Kansainvälinen näkökulma', stakeholder: 'Kansainvälinen yhteisö' },
  de: { lensName: 'Internationale Perspektive', stakeholder: 'Internationale Gemeinschaft' },
  fr: { lensName: 'Perspective internationale', stakeholder: 'Communauté internationale' },
  es: { lensName: 'Perspectiva internacional', stakeholder: 'Comunidad internacional' },
  nl: { lensName: 'Internationaal perspectief', stakeholder: 'Internationale gemeenschap' },
  ar: { lensName: 'المنظور الدولي', stakeholder: 'المجتمع الدولي' },
  he: { lensName: 'פרספקטיבה בינלאומית', stakeholder: 'הקהילה הבינלאומית' },
  ja: { lensName: '国際的視点', stakeholder: '国際社会' },
  ko: { lensName: '국제적 관점', stakeholder: '국제 사회' },
  zh: { lensName: '国际视角', stakeholder: '国际社会' },
};

function label(lang: Language | string): { lensName: string; stakeholder: string } {
  return LENS_LABELS[lang] ?? LENS_LABELS['en'];
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function countKeywords(text: string, keywords: readonly string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function computeImpact(doc: RawDocument): ImpactLevel {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const euSignals = countKeywords(allText, EU_KEYWORDS);
  const treatySignals = countKeywords(allText, TREATY_KEYWORDS);
  const nordicSignals = countKeywords(allText, NORDIC_KEYWORDS);

  if (euSignals >= 2 || treatySignals >= 2) return 'high';
  if (euSignals >= 1 || treatySignals >= 1 || nordicSignals >= 1) return 'medium';

  const organ = doc.organ || doc.committee || '';
  if (organ === 'UU') return 'high'; // Foreign Affairs Committee
  if (organ === 'FöU') return 'medium'; // Defence Committee (NATO context)

  return 'low';
}

function computeSentiment(doc: RawDocument): Sentiment {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (containsAny(allText, ['sanktion', 'sanction', 'protest', 'konflikt', 'conflict',
    'spänning', 'tension', 'brott mot', 'violation'])) {
    return 'negative';
  }

  if (containsAny(allText, ['samarbete', 'cooperation', 'avtal', 'agreement', 'partnerskap',
    'partnership', 'integration', 'harmonisering', 'harmonisation', 'ratificering', 'ratification'])) {
    return 'positive';
  }

  return 'neutral';
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function buildSummary(doc: RawDocument, _cia: CIAContext | undefined, _lang: Language | string): string {
  const docType = doc.doktyp || doc.documentType || 'document';
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const hasEU = containsAny(allText, EU_KEYWORDS);
  const hasNordic = containsAny(allText, NORDIC_KEYWORDS);
  const hasTreaty = containsAny(allText, TREATY_KEYWORDS);
  const hasDiplomatic = containsAny(allText, DIPLOMATIC_KEYWORDS);

  const notes: string[] = [];
  if (hasEU) notes.push('EU compliance and transposition requirements should be verified');
  if (hasNordic) notes.push('Nordic Council coordination implications warrant assessment');
  if (hasTreaty) notes.push('treaty obligation compatibility must be reviewed');
  if (hasDiplomatic) notes.push('diplomatic signalling effects should be considered');

  const notePhrase = notes.length > 0 ? ` Key international dimensions: ${notes.join('; ')}.` : ' International context dimensions are limited for this document.';

  return `From the international perspective, this ${docType} must be assessed for EU regulatory alignment and treaty obligations.${notePhrase}`.trim();
}

// ---------------------------------------------------------------------------
// SWOT contributions
// ---------------------------------------------------------------------------

function buildSwotContributions(doc: RawDocument, _cia: CIAContext | undefined, lang: Language | string): SwotContribution[] {
  const { stakeholder } = label(lang);
  const contributions: SwotContribution[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (containsAny(allText, EU_KEYWORDS)) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: 'EU alignment opportunity: document may strengthen Sweden\'s position within EU regulatory framework.',
      impact: 'high',
    });
  }

  if (containsAny(allText, NORDIC_KEYWORDS)) {
    contributions.push({
      quadrant: 'strength',
      forStakeholder: stakeholder,
      text: 'Nordic cooperation dimension adds regional legitimacy and shared implementation potential.',
      impact: 'medium',
    });
  }

  if (containsAny(allText, ['sanktion', 'sanction', 'brott mot', 'violation', 'överträdelse'])) {
    contributions.push({
      quadrant: 'threat',
      forStakeholder: stakeholder,
      text: 'Risk of international treaty violation or sanctions exposure if document is implemented without alignment review.',
      impact: 'high',
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
    { metricName: 'EU Alignment Signals', value: countKeywords(allText, EU_KEYWORDS), unit: 'hits' },
    { metricName: 'Treaty References', value: countKeywords(allText, TREATY_KEYWORDS), unit: 'hits' },
    { metricName: 'Nordic Cooperation Signals', value: countKeywords(allText, NORDIC_KEYWORDS), unit: 'hits' },
  ];
}

// ---------------------------------------------------------------------------
// Mindmap nodes
// ---------------------------------------------------------------------------

function buildMindmapNodes(doc: RawDocument, _lang: Language | string): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (containsAny(allText, EU_KEYWORDS)) {
    nodes.push({ branch: 'EU Context', item: 'Regulatory Alignment', weight: 'critical' });
  }
  if (containsAny(allText, NORDIC_KEYWORDS)) {
    nodes.push({ branch: 'Nordic Context', item: 'Regional Cooperation', weight: 'significant' });
  }
  if (containsAny(allText, TREATY_KEYWORDS)) {
    nodes.push({ branch: 'Treaty Obligations', item: 'International Law Compliance', weight: 'critical' });
  }
  if (containsAny(allText, DIPLOMATIC_KEYWORDS)) {
    nodes.push({ branch: 'Diplomatic Signals', item: 'Foreign Policy Messaging', weight: 'moderate' });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function computeConfidence(doc: RawDocument, cia: CIAContext | undefined): number {
  let score = 35;
  if (doc.fullText || doc.fullContent) score += 25;
  if (doc.summary || doc.notis) score += 15;
  if (cia) score += 15;
  if (doc.speeches && doc.speeches.length > 0) score += 10;
  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply the International analysis lens to a single parliamentary document.
 *
 * Evaluates EU regulatory alignment, Nordic cooperation implications,
 * global treaty obligations, and diplomatic signal assessment.
 *
 * @param doc  - The document to analyse
 * @param cia  - Optional CIA context
 * @param lang - Target language
 * @returns    A `PerspectiveAnalysis` for the international lens
 */
export function analyzeInternationalPerspective(
  doc: RawDocument,
  cia: CIAContext | undefined,
  lang: Language | string,
  precomputedDomains?: string[],
): PerspectiveAnalysis {
  const keyActors = ['EU Commission', 'Foreign Ministry', 'NATO', 'Nordic Council', 'UN'];
  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  const relatedPolicies = [...domains];
  if (containsAny(allText, EU_KEYWORDS)) relatedPolicies.push('EU Single Market');
  if (containsAny(allText, TREATY_KEYWORDS)) relatedPolicies.push('International Treaty Framework');
  if (containsAny(allText, NORDIC_KEYWORDS)) relatedPolicies.push('Nordic Cooperation');

  return {
    lens: 'international',
    summary: buildSummary(doc, cia, lang),
    impact: computeImpact(doc),
    sentiment: computeSentiment(doc),
    keyActors: keyActors.slice(0, 5),
    relatedPolicies: relatedPolicies.slice(0, 5),
    swotContribution: buildSwotContributions(doc, cia, lang),
    dashboardMetrics: buildDashboardMetrics(doc, cia),
    mindmapNodes: buildMindmapNodes(doc, lang),
    confidence: computeConfidence(doc, cia),
  };
}
