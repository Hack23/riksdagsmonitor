/**
 * @module analysis-framework/lenses/media
 * @description Media/public discourse lens for parliamentary document analysis.
 *
 * Evaluates every document from the media and public discourse vantage point:
 * - Newsworthiness scoring
 * - Public sentiment indicators
 * - Narrative framing analysis
 * - Controversy potential
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../../data-transformers/types.js';
import type { Language } from '../../types/language.js';
import type { PerspectiveAnalysis, ImpactLevel, Sentiment, SwotContribution, DashboardMetric, MindmapNode } from '../types.js';
import { detectPolicyDomains, detectNarrativeFrames } from '../../data-transformers/policy-analysis.js';
import { scoreNewsworthiness, type NewsworthinessScore } from '../../data-transformers/content-generators/newsworthiness.js';

// ---------------------------------------------------------------------------
// Controversy keyword banks
// ---------------------------------------------------------------------------

/** Topics that reliably generate media controversy */
const CONTROVERSY_KEYWORDS: readonly string[] = [
  'migration', 'invandring', 'kriminalitet', 'gängbrott', 'gang crime',
  'skattehöjning', 'tax rise', 'skattesänkning', 'tax cut',
  'sjukvårdskris', 'healthcare crisis', 'vårdkö', 'healthcare queue',
  'skolresultat', 'school results', 'klimatkris', 'climate crisis',
  'pensionstrygghet', 'pension security', 'bostadskris', 'housing crisis',
  'lön', 'wage', 'pensionsgap', 'pension gap', 'könsgap', 'gender gap',
  'korruption', 'corruption', 'svågerpolitik', 'cronyism', 'lobbying',
  'mutor', 'bribery', 'bedrägeri', 'fraud',
];

/** Human-interest / emotive keywords that boost media salience */
const EMOTIVE_KEYWORDS: readonly string[] = [
  'barn', 'children', 'äldre', 'elderly', 'sjuka', 'sick', 'utsatt', 'vulnerable',
  'offer', 'victim', 'kris', 'crisis', 'nödläge', 'emergency', 'katastrof', 'catastrophe',
  'hopp', 'hope', 'framtid', 'future', 'reform', 'förändring', 'change',
];

// ---------------------------------------------------------------------------
// Localised labels
// ---------------------------------------------------------------------------

const LENS_LABELS: Readonly<Record<string, { lensName: string; stakeholder: string }>> = {
  en: { lensName: 'Media & Public Discourse', stakeholder: 'Media & Public' },
  sv: { lensName: 'Media och offentlig debatt', stakeholder: 'Media och allmänheten' },
  da: { lensName: 'Medier og offentlig debat', stakeholder: 'Medier og offentlighed' },
  no: { lensName: 'Medier og offentlig debatt', stakeholder: 'Medier og offentligheten' },
  fi: { lensName: 'Media ja julkinen diskurssi', stakeholder: 'Media ja yleisö' },
  de: { lensName: 'Medien und öffentlicher Diskurs', stakeholder: 'Medien und Öffentlichkeit' },
  fr: { lensName: 'Médias et discours public', stakeholder: 'Médias et public' },
  es: { lensName: 'Medios y discurso público', stakeholder: 'Medios y público' },
  nl: { lensName: 'Media en publiek discours', stakeholder: 'Media en publiek' },
  ar: { lensName: 'الإعلام والخطاب العام', stakeholder: 'الإعلام والجمهور' },
  he: { lensName: 'תקשורת ושיח ציבורי', stakeholder: 'תקשורת וציבור' },
  ja: { lensName: 'メディア・公論の視点', stakeholder: 'メディア・世論' },
  ko: { lensName: '미디어·공론 관점', stakeholder: '미디어·여론' },
  zh: { lensName: '媒体与公共话语视角', stakeholder: '媒体与公众' },
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

function computeImpact(newsScore: { overall: number }): ImpactLevel {
  if (newsScore.overall >= 65) return 'high';
  if (newsScore.overall >= 35) return 'medium';
  return 'low';
}

function computeSentiment(doc: RawDocument): Sentiment {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');
  const controversyCount = countKeywords(allText, CONTROVERSY_KEYWORDS);
  const emotiveCount = countKeywords(allText, EMOTIVE_KEYWORDS);

  // High controversy typically generates negative public framing
  if (controversyCount >= 2) return 'negative';
  if (emotiveCount >= 2 && controversyCount === 0) return 'positive';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function buildSummary(doc: RawDocument, newsScore: NewsworthinessScore, _lang: Language | string): string {
  const docType = doc.doktyp || doc.documentType || 'document';
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');
  const frames = detectNarrativeFrames(doc);

  const controversyNote = containsAny(allText, CONTROVERSY_KEYWORDS)
    ? ' This document touches on topics with high controversy potential and is likely to attract media attention.'
    : '';

  const frameNote = frames.length > 0
    ? ` Narrative frames detected: ${frames.slice(0, 2).join(', ')}.`
    : '';

  const newsworthinessLevel = newsScore.overall >= 65 ? 'high' : newsScore.overall >= 35 ? 'moderate' : 'low';

  return `From the media perspective, this ${docType} has ${newsworthinessLevel} newsworthiness (score: ${newsScore.overall}/100).${controversyNote}${frameNote}`.trim();
}

// ---------------------------------------------------------------------------
// SWOT contributions
// ---------------------------------------------------------------------------

function buildSwotContributions(doc: RawDocument, newsScore: NewsworthinessScore, lang: Language | string): SwotContribution[] {
  const { stakeholder } = label(lang);
  const contributions: SwotContribution[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  if (newsScore.warrantsDeepInspection) {
    contributions.push({
      quadrant: 'opportunity',
      forStakeholder: stakeholder,
      text: `High newsworthiness score (${newsScore.overall}/100) creates strong public communication opportunity for political actors.`,
      impact: 'high',
    });
  }

  if (containsAny(allText, CONTROVERSY_KEYWORDS)) {
    contributions.push({
      quadrant: 'threat',
      forStakeholder: stakeholder,
      text: 'Document addresses controversial topics with high potential for negative media framing and public backlash.',
      impact: 'high',
    });
  }

  if (newsScore.topics.length > 0) {
    contributions.push({
      quadrant: 'strength',
      forStakeholder: stakeholder,
      text: `Strategic topics detected (${newsScore.topics.slice(0, 3).join(', ')}) align with current public agenda.`,
      impact: 'medium',
    });
  }

  return contributions;
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

function buildDashboardMetrics(doc: RawDocument, newsScore: NewsworthinessScore): DashboardMetric[] {
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');

  return [
    { metricName: 'Newsworthiness Score', value: newsScore.overall, unit: '/100' },
    { metricName: 'Controversy Signals', value: countKeywords(allText, CONTROVERSY_KEYWORDS), unit: 'hits' },
    { metricName: 'Emotive Keywords', value: countKeywords(allText, EMOTIVE_KEYWORDS), unit: 'hits' },
    { metricName: 'Strategic Topics', value: newsScore.topics.length, unit: 'topics' },
  ];
}

// ---------------------------------------------------------------------------
// Mindmap nodes
// ---------------------------------------------------------------------------

function buildMindmapNodes(doc: RawDocument, _lang: Language | string): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  const allText = [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ');
  const frames = detectNarrativeFrames(doc);

  if (containsAny(allText, CONTROVERSY_KEYWORDS)) {
    nodes.push({ branch: 'Controversy Risk', item: 'High Media Salience', weight: 'critical' });
  }

  for (const frame of frames.slice(0, 2)) {
    nodes.push({ branch: 'Narrative Frames', item: frame, weight: 'significant' });
  }

  nodes.push({ branch: 'Public Discourse', item: 'News Agenda Relevance', weight: 'moderate' });

  return nodes;
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function computeConfidence(doc: RawDocument, cia: CIAContext | undefined): number {
  let score = 45;
  if (doc.fullText || doc.fullContent) score += 20;
  if (doc.summary || doc.notis) score += 10;
  if (cia) score += 15;
  if (doc.speeches && doc.speeches.length > 0) score += 10;
  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply the Media/Public Discourse analysis lens to a single parliamentary document.
 *
 * Evaluates newsworthiness, public sentiment, narrative framing, and controversy
 * potential.
 *
 * @param doc  - The document to analyse
 * @param cia  - Optional CIA context
 * @param lang - Target language
 * @returns    A `PerspectiveAnalysis` for the media lens
 */
export function analyzeMediaPerspective(
  doc: RawDocument,
  cia: CIAContext | undefined,
  lang: Language | string,
  precomputedDomains?: string[],
): PerspectiveAnalysis {
  const keyActors = ['Swedish Media', 'SVT', 'DN', 'Aftonbladet', 'SR'];
  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');
  const newsScore = scoreNewsworthiness([doc], cia);
  const relatedPolicies = [...domains, ...newsScore.topics.slice(0, 2)].filter(Boolean);

  return {
    lens: 'media',
    summary: buildSummary(doc, newsScore, lang),
    impact: computeImpact(newsScore),
    sentiment: computeSentiment(doc),
    keyActors: keyActors.slice(0, 5),
    relatedPolicies: relatedPolicies.slice(0, 5),
    swotContribution: buildSwotContributions(doc, newsScore, lang),
    dashboardMetrics: buildDashboardMetrics(doc, newsScore),
    mindmapNodes: buildMindmapNodes(doc, lang),
    confidence: computeConfidence(doc, cia),
  };
}
