/**
 * @module data-transformers/content-generators/shared
 * @description Shared internal helpers and templates used by all content generators.
 * Contains TITLE_SUFFIX_TEMPLATES, keyword extraction, event/document matching helpers,
 * and the deep analysis section generator (5W framework).
 *
 * Implementation is split into focused sub-modules:
 * - doc-type-helpers.ts    — DOC_TYPE_DISPLAY, localizeDocType, TITLE_SUFFIX_TEMPLATES
 * - event-helpers.ts       — findRelatedDocuments, findRelatedQuestions, extractMinister
 * - impact-helpers.ts      — generateImpactAnalysis, generateConsequencesAnalysis
 * - framework-renderers.ts — PESTLE/stakeholder/risk/implementation HTML renderers
 * - ai-marker-helpers.ts   — detectBannedPatterns
 *
 * ⚠️ DEPRECATED FOR ANALYSIS GENERATION (v3.0, 2026-04-02):
 * Per analysis/methodologies/ai-driven-analysis-guide.md Rule 2, the following
 * functions are DEPRECATED for generating analysis content:
 * - generateDeepAnalysisSection() → Replace with AI prompt in workflow .md
 * - All *Text() template functions (govAdvantageText, oppPressureText, etc.)
 *   → Replace with AI-generated editorial analysis from actual document data
 * - renderAggregatedPestle(), renderStakeholderImpactSummary(),
 *   renderRiskAssessment(), renderImplementationAssessment()
 *   → Replace with AI prompts for framework analysis
 *
 * Their output is treated as FALLBACK STUBS. AI agents in agentic workflow .md
 * files MUST overwrite all template-generated text with genuine political intelligence.
 *
 * HTML utility functions (escapeHtml, pickLang, TITLE_SUFFIX_TEMPLATES) and
 * structural helpers remain active and are NOT deprecated.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { RawDocument, CIAContext } from '../types.js';
import { L, normalizePartyKey } from '../helpers.js';
import { detectPolicyDomains } from '../policy-analysis.js';

// ── Re-exports from sub-modules (backward-compatible) ──────────────────────
export type { DocTypeLocalization } from './doc-type-helpers.js';
export { DOC_TYPE_DISPLAY, localizeDocType, TITLE_SUFFIX_TEMPLATES } from './doc-type-helpers.js';
export { findRelatedDocuments, findRelatedQuestions, extractMinister } from './event-helpers.js';
export { detectBannedPatterns } from './ai-marker-helpers.js';

// ── Sub-module imports used by the deep analysis section ───────────────────
import { generateImpactAnalysis, generateConsequencesAnalysis } from './impact-helpers.js';
import {
  type DocumentAnalysis, type BatchAnalysisResult, type RiskAssessment,
  analyzeDocumentsBatch, analyzeDocumentsPerspectives,
  MAX_PERSPECTIVE_INSIGHTS,
  renderAggregatedPestle, renderStakeholderImpactSummary,
  renderRiskAssessment, renderImplementationAssessment,
} from './framework-renderers.js';
import { localizeDocType } from './doc-type-helpers.js';

// ---------------------------------------------------------------------------
// Deep Analysis Section (5W Framework)
// ---------------------------------------------------------------------------

/** Options for generating the deep analysis section */
export interface DeepAnalysisOptions {
  documents: RawDocument[];
  lang: Language | string;
  cia?: CIAContext;
  articleType: string;
  /** Extra context sentences to inject into the "Why" subsection */
  whyContext?: string;
  /**
   * Pre-computed document analyses from the AI analysis framework.
   * When provided, the deep analysis section is enriched with PESTLE
   * dimensions, stakeholder impact assessments, risk assessments, and
   * implementation feasibility data from the framework.
   *
   * Use `analyzeDocumentsForContent()` to produce this map.
   */
  frameworkAnalysis?: Map<string, DocumentAnalysis>;
  /**
   * Multi-perspective analysis from the analysis-framework (6 lenses:
   * government, opposition, citizen, economic, international, media).
   * When provided, key insights and perspective summaries are injected
   * into the deep analysis section.
   *
   * Use `analyzeDocumentsForContent()` to produce this automatically.
   */
  perspectiveAnalysis?: BatchAnalysisResult;
}

/**
 * Run the document analysis framework over a set of documents and return
 * both the per-document analysis map and the multi-perspective batch result.
 *
 * Content generators should call this once per article and pass the results
 * into `generateDeepAnalysisSection()` via the `frameworkAnalysis` and
 * `perspectiveAnalysis` options.
 *
 * Results are cached internally by the framework, so repeated calls with
 * the same documents are cheap.
 */
export function analyzeDocumentsForContent(
  docs: RawDocument[],
  lang: Language | string,
  cia?: CIAContext,
): { frameworkAnalysis: Map<string, DocumentAnalysis>; perspectiveAnalysis: BatchAnalysisResult } {
  const frameworkAnalysis = analyzeDocumentsBatch(docs, lang, cia);
  const perspectiveAnalysis = analyzeDocumentsPerspectives(docs, cia, lang);
  return { frameworkAnalysis, perspectiveAnalysis };
}

// ---------------------------------------------------------------------------
// Deep Analysis section private helpers
// ---------------------------------------------------------------------------

/**
 * Extract unique party names from a set of documents for "Who" analysis.
 */
function extractKeyActors(docs: RawDocument[]): { parties: Map<string, number>; authors: string[] } {
  const parties = new Map<string, number>();
  const authorSet = new Set<string>();

  for (const doc of docs) {
    const party = normalizePartyKey(doc.parti);
    if (party && party !== 'other') {
      parties.set(party, (parties.get(party) ?? 0) + 1);
    }
    const author = doc.intressent_namn || doc.author || '';
    if (author && author !== 'Unknown' && author.length > 1) {
      authorSet.add(author);
    }
  }

  return { parties, authors: Array.from(authorSet).slice(0, 8) };
}

/**
 * Aggregate policy domains across all documents for "What" analysis.
 */
function aggregateDomains(docs: RawDocument[], lang: Language | string): Map<string, number> {
  const domainCounts = new Map<string, number>();
  for (const doc of docs) {
    for (const domain of detectPolicyDomains(doc, lang)) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }
  return domainCounts;
}

/**
 * Determine winners and losers based on document patterns and CIA context.
 */
function analyseWinnersLosers(
  docs: RawDocument[],
  cia: CIAContext | undefined,
  lang: Language | string,
): string {
  const parts: string[] = [];

  // Count government vs opposition documents
  const govDocs = docs.filter(d => d.doktyp === 'prop' || d.doktyp === 'bet' || d.doktyp === 'skr');
  const oppDocs = docs.filter(d => d.doktyp === 'mot');

  if (govDocs.length > 0 && oppDocs.length > 0) {
    const ratio = govDocs.length / Math.max(1, oppDocs.length);
    if (ratio > 2) {
      parts.push(govAdvantageText(lang, govDocs.length, oppDocs.length));
    } else if (ratio < 0.5) {
      parts.push(oppPressureText(lang, oppDocs.length));
    } else {
      parts.push(balancedText(lang));
    }
  }

  if (cia) {
    const margin = cia.coalitionStability?.majorityMargin ?? 0;
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (margin <= 3 && stability < 60) {
      parts.push(coalitionRiskText(lang, margin));
    }
  }

  return parts.join(' ') || '<!-- AI_MUST_REPLACE: winners_losers_analysis — Analyse the political winners and losers of these developments, identifying which parties gain strategic advantage and why. Output MUST be in the article\'s language. -->';
}

function govAdvantageText(lang: Language | string, gov: number, opp: number): string {
  const templates: Record<string, string> = {
    en: `The governing coalition holds the initiative with ${gov} legislative items versus ${opp} opposition motions, suggesting strong agenda control.`,
    sv: `Regeringskoalitionen håller initiativet med ${gov} lagstiftningsärenden mot ${opp} oppositionsyrkanden, vilket tyder på stark agendakontroll.`,
    da: `Regeringskoalitionen har initiativet med ${gov} lovgivningspunkter mod ${opp} oppositionsforslag.`,
    no: `Regjeringskoalisjonen holder initiativet med ${gov} lovforslag mot ${opp} opposisjonsforslag.`,
    fi: `Hallituskoalitio pitää aloitteen ${gov} lainsäädäntöasialla vastaan ${opp} opposition aloitetta.`,
    de: `Die Regierungskoalition hält die Initiative mit ${gov} Gesetzgebungspunkten gegenüber ${opp} Oppositionsanträgen.`,
    fr: `La coalition gouvernementale tient l'initiative avec ${gov} points législatifs contre ${opp} motions de l'opposition.`,
    es: `La coalición gobernante mantiene la iniciativa con ${gov} puntos legislativos frente a ${opp} mociones de la oposición.`,
    nl: `De regeringscoalitie houdt het initiatief met ${gov} wetgevingspunten versus ${opp} oppositiemoties.`,
    ar: `يحتفظ الائتلاف الحاكم بالمبادرة بـ${gov} بنداً تشريعياً مقابل ${opp} اقتراحات معارضة.`,
    he: `הקואליציה שומרת על היוזמה עם ${gov} סעיפי חקיקה מול ${opp} הצעות אופוזיציה.`,
    ja: `与党連合は${gov}の立法項目で主導権を握り、野党の${opp}動議に対して優位に立っています。`,
    ko: `여당 연합은 ${gov}건의 입법 항목으로 주도권을 유지하며, 야당의 ${opp}건 동의에 대해 우위를 보이고 있습니다.`,
    zh: `执政联盟以${gov}项立法议题保持主动权，对比反对党的${opp}项动议。`,
  };
  return templates[lang as string] ?? templates.en;
}

function oppPressureText(lang: Language | string, opp: number): string {
  const templates: Record<string, string> = {
    en: `The opposition is applying significant pressure with ${opp} motions, signalling broad dissatisfaction with government policy.`,
    sv: `Oppositionen utövar betydande tryck med ${opp} motioner, vilket signalerar brett missnöje med regeringens politik.`,
  };
  return templates[lang as string] ?? templates.en;
}

function balancedText(lang: Language | string): string {
  const templates: Record<string, string> = {
    en: 'The balance between government and opposition activity suggests a competitive legislative environment where neither side dominates.',
    sv: 'Balansen mellan regerings- och oppositionsaktivitet tyder på en konkurrensutsatt lagstiftningsmiljö.',
  };
  return templates[lang as string] ?? templates.en;
}

function coalitionRiskText(lang: Language | string, margin: number): string {
  const templates: Record<string, string> = {
    en: `With a majority margin of only ${margin} seats, the coalition faces elevated risk of legislative defeats on contested measures.`,
    sv: `Med en majoritetsmarginal på bara ${margin} mandat löper koalitionen förhöjd risk för nederlag vid omstridda omröstningar.`,
  };
  return templates[lang as string] ?? templates.en;
}

// ---------------------------------------------------------------------------
// Deep Analysis subsection generators
// ---------------------------------------------------------------------------

function generateTimelineContext(docs: RawDocument[], _lang: Language | string, articleType: string): string {
  const count = docs.length;
  const committees = new Set(docs.map(d => d.organ || d.committee || '').filter(Boolean));

  // Provide minimal factual scaffold — AI agent MUST replace with genuine timeline analysis
  // that explains political significance, scheduling strategy, and contextual importance.
  const committeeCount = committees.size;
  const committeeNames = [...committees].map(name => escapeHtml(name)).join(', ');

  const prospective = articleType.includes('ahead');
  const retrospective = articleType.includes('review');

  const typeLabel = prospective ? 'scheduled' : retrospective ? 'recorded' : 'active';

  // Entire paragraph is comment-only so AI must write the full rendered text in the target language
  const factualHint = committeeCount > 0
    ? `${count} ${typeLabel} items across ${committeeCount} committee(s): ${committeeNames}`
    : `${count} ${typeLabel} parliamentary items`;

  return `<!-- AI_MUST_REPLACE: timeline_context — DATA: ${factualHint}. Write specific analysis of scheduling significance, political timing strategy, and why this legislative calendar matters now. Output MUST be in the article's language. -->`;
}

function generateWhyAnalysis(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined, extraContext?: string): string {
  const parts: string[] = [];

  // Domain breadth signals policy ambition
  const domains = aggregateDomains(docs, lang);
  const domainCount = domains.size;
  if (domainCount >= 4) {
    parts.push(broadAgendaText(lang, domainCount));
  } else if (domainCount >= 2) {
    parts.push(focusedAgendaText(lang, domainCount));
  }

  // Coalition stability context
  if (cia) {
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (stability < 50) {
      parts.push(instabilityText(lang));
    }
  }

  if (extraContext) {
    parts.push(escapeHtml(extraContext));
  }

  if (parts.length === 0) {
    parts.push(defaultWhyText(lang));
  }

  return parts.join(' ');
}

function broadAgendaText(_lang: Language | string, n: number): string {
  // Entire output is comment-only — AI writes the full rendered paragraph in the target language
  return `<!-- AI_MUST_REPLACE: why_matters — DATA: ${n} policy domains active. Explain WHY these specific domains matter politically right now, what strategic intent drives this breadth, and what it reveals about coalition priorities. Output MUST be in the article's language. -->`;
}

function focusedAgendaText(_lang: Language | string, n: number): string {
  return `<!-- AI_MUST_REPLACE: why_matters — DATA: ${n} policy domains active. Explain the strategic significance of this focused legislative approach and what it reveals about government priorities. Output MUST be in the article's language. -->`;
}

function instabilityText(_lang: Language | string): string {
  return '<!-- AI_MUST_REPLACE: coalition_instability — Provide specific analysis of current coalition stability indicators, recent fractures, and how instability affects these specific legislative items. Output MUST be in the article\'s language. -->';
}

function defaultWhyText(_lang: Language | string): string {
  return '<!-- AI_MUST_REPLACE: why_matters — Write specific analysis of why these particular parliamentary developments matter, citing concrete political dynamics, stakeholder impacts, and strategic implications. Output MUST be in the article\'s language. -->';
}

function generateCriticalAssessment(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined): string {
  const parts: string[] = [];

  // Check for single-party dominance in motions (potential echo chamber)
  const motionParties = new Map<string, number>();
  docs.filter(d => d.doktyp === 'mot').forEach(d => {
    const p = normalizePartyKey(d.parti);
    if (p && p !== 'other') motionParties.set(p, (motionParties.get(p) ?? 0) + 1);
  });
  const totalMotions = [...motionParties.values()].reduce((a, b) => a + b, 0);
  if (motionParties.size === 1 && totalMotions > 3) {
    parts.push(singlePartyDominanceText(lang));
  }

  // Check for lack of debate data (information gap)
  const withSpeeches = docs.filter(d => d.speeches && d.speeches.length > 0).length;
  if (withSpeeches === 0 && docs.length > 3) {
    parts.push(debateAnalysisMarker());
  }

  // Thin majority risk assessment
  if (cia) {
    const stability = cia.coalitionStability?.stabilityScore ?? 100;
    if (stability < 40) {
      parts.push(criticalStabilityText(lang));
    }
  }

  if (parts.length === 0) {
    parts.push(defaultCriticalText(lang));
  }

  return parts.join(' ');
}

function singlePartyDominanceText(_lang: Language | string): string {
  return '<!-- AI_MUST_REPLACE: single_party_dominance — Analyse why one party dominates opposition activity: strategic focus, internal party dynamics, or failure of other parties to engage? Cite specific evidence. Output MUST be in the article\'s language. -->';
}

function debateAnalysisMarker(): string {
  return '<!-- AI_MUST_REPLACE: debate_analysis — Analyse the available debate data and provide specific insights on parliamentary discourse. Output MUST be in the article\'s language. -->';
}

function criticalStabilityText(lang: Language | string): string {
  const t: Record<string, string> = {
    en: 'Coalition stability has deteriorated to critical levels. The risk of a government crisis is non-trivial, and any procedural surprise could trigger a confidence vote. All legislative analysis must be read through this lens of instability.',
    sv: 'Koalitionsstabiliteten har försämrats till kritiska nivåer. Risken för en regeringskris är icke-trivial.',
  };
  return t[lang as string] ?? t.en;
}

function defaultCriticalText(_lang: Language | string): string {
  return '<!-- AI_MUST_REPLACE: critical_assessment — Write a critical assessment that challenges assumptions, identifies gaps between intent and likely outcomes, evaluates which measures face implementation risks, and provides an honest evaluation of the political dynamics at play. Output MUST be in the article\'s language. -->';
}

function generatePerspectivesAnalysis(docs: RawDocument[], lang: Language | string, parties: Map<string, number>): string {
  const sortedParties = [...parties.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const partyAnalyses: string[] = [];

  for (const [party, count] of sortedParties) {
    const partyDocs = docs.filter(d => normalizePartyKey(d.parti) === party);
    const partyDomains = aggregateDomains(partyDocs, lang);
    const topDomains = [...partyDomains.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([d]) => d);
    if (topDomains.length > 0) {
      partyAnalyses.push(
        `<strong>${escapeHtml(party)}</strong> (${count}): ${topDomains.map(d => escapeHtml(d)).join(', ')}`
      );
    } else {
      partyAnalyses.push(`<strong>${escapeHtml(party)}</strong> (${count})`);
    }
  }

  if (partyAnalyses.length === 0) return '';
  return partyAnalyses.join(' · ');
}

// ---------------------------------------------------------------------------
// Main deep analysis section generator
// ---------------------------------------------------------------------------

/**
 * Generate a comprehensive Deep Analysis section following the 5W framework
 * (Who, What, When, Why, Winners/Losers) plus impact, consequences, and critical
 * assessment subsections. This section is designed for highly analytical readers
 * who seek multi-perspective intelligence on parliamentary developments.
 *
 * @returns HTML string for the deep analysis section, or empty string if insufficient data
 */
export function generateDeepAnalysisSection(opts: DeepAnalysisOptions): string {
  const { documents, lang, cia, articleType, whyContext, frameworkAnalysis, perspectiveAnalysis } = opts;

  // Deep analysis requires at least 2 documents for cross-document insights
  // in standard article types. For deep-inspection articles, allow single-
  // document analysis since the whole article is dedicated to in-depth review.
  const minDocs = articleType === 'deep-inspection' ? 1 : 2;
  if (!documents || documents.length < minDocs) return '';

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const parts: string[] = [];
  parts.push(`\n    <section class="deep-analysis" aria-label="${escapeHtml(lbl('deepAnalysis'))}">`);
  parts.push(`    <h2>${escapeHtml(lbl('deepAnalysis'))}</h2>`);

  // ── WHO: Key Actors ────────────────────────────────────────────────────────
  const { parties, authors } = extractKeyActors(documents);
  if (parties.size > 0 || authors.length > 0) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWho'))}</h3>`);
    if (parties.size > 0) {
      const sortedParties = [...parties.entries()].sort((a, b) => b[1] - a[1]);
      const partyList = sortedParties
        .map(([p, count]) => `<strong>${escapeHtml(p)}</strong> (${count})`)
        .join(', ');
      parts.push(`    <p>${partyList}</p>`);
    }
    if (authors.length > 0) {
      parts.push(`    <p>${authors.map(a => escapeHtml(a)).join(', ')}</p>`);
    }
  }

  // ── WHAT: What Happened ────────────────────────────────────────────────────
  const domains = aggregateDomains(documents, lang);
  if (domains.size > 0) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhat'))}</h3>`);
    const sortedDomains = [...domains.entries()].sort((a, b) => b[1] - a[1]);
    const domainItems = sortedDomains.slice(0, 6)
      .map(([d, c]) => `${escapeHtml(d)} (${c})`)
      .join(', ');
    const docTypes = new Map<string, number>();
    for (const doc of documents) {
      const t = doc.doktyp || doc.documentType || 'other';
      docTypes.set(t, (docTypes.get(t) ?? 0) + 1);
    }
    const typeList = [...docTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${escapeHtml(localizeDocType(t, lang, c))}: ${c}`)
      .join(', ');
    parts.push(`    <p>${domainItems}</p>`);
    parts.push(`    <p><em>${typeList}</em></p>`);
  }

  // ── WHEN: Timeline & Context ───────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhen'))}</h3>`);
  const timelineContext = generateTimelineContext(documents, lang, articleType);
  parts.push(`    <p>${timelineContext}</p>`);

  // ── WHY: Why This Matters ──────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWhy'))}</h3>`);
  const whyText = generateWhyAnalysis(documents, lang, cia, whyContext);
  parts.push(`    <p>${whyText}</p>`);

  // ── WINNERS & LOSERS ───────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisWinners'))}</h3>`);
  const winnersText = analyseWinnersLosers(documents, cia, lang);
  parts.push(`    <p>${winnersText}</p>`);

  // ── POLITICAL IMPACT ───────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisImpact'))}</h3>`);
  const impactText = generateImpactAnalysis(documents, lang, cia);
  parts.push(`    <p>${impactText}</p>`);

  // ── ACTIONS & CONSEQUENCES ─────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisConsequences'))}</h3>`);
  const consequencesText = generateConsequencesAnalysis(documents, lang, articleType);
  parts.push(`    <p>${consequencesText}</p>`);

  // ── CRITICAL ASSESSMENT ────────────────────────────────────────────────────
  parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisCritical'))}</h3>`);
  const criticalText = generateCriticalAssessment(documents, lang, cia);
  parts.push(`    <p>${criticalText}</p>`);

  // ── MULTIPLE PERSPECTIVES ──────────────────────────────────────────────────
  if (parties.size >= 2) {
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisPerspectives'))}</h3>`);
    const perspectivesText = generatePerspectivesAnalysis(documents, lang, parties);
    parts.push(`    <p>${perspectivesText}</p>`);
  }

  // ── FRAMEWORK ANALYSIS SECTIONS ────────────────────────────────────────────
  // When the document analysis framework has been run, inject its richer
  // PESTLE, stakeholder impact, risk, and implementation assessment data.
  if (frameworkAnalysis && frameworkAnalysis.size > 0) {
    const analyses = [...frameworkAnalysis.values()];

    // PESTLE Analysis — aggregate across all analysed documents
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisPestle'))}</h3>`);
    parts.push(renderAggregatedPestle(analyses, lang));

    // Stakeholder Impact — summarise stakeholder impacts from the framework
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisStakeholderImpact'))}</h3>`);
    parts.push(renderStakeholderImpactSummary(analyses, lang));

    // Risk Assessment — aggregate risk factors across documents
    const allRisks = analyses.flatMap(a => a.riskAssessment as RiskAssessment[]);
    if (allRisks.length > 0) {
      parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisRisk'))}</h3>`);
      parts.push(renderRiskAssessment(allRisks, lang));
    }

    // Implementation Assessment — summarise implementation feasibility
    parts.push(`    <h3>${escapeHtml(lbl('deepAnalysisImplementation'))}</h3>`);
    parts.push(renderImplementationAssessment(analyses, lang));
  }

  // ── MULTI-PERSPECTIVE INSIGHTS (6 lenses) ────────────────────────────────
  // When the analysis-framework has been run, inject key insights from the
  // government, opposition, citizen, economic, international, and media lenses.
  if (perspectiveAnalysis && perspectiveAnalysis.results.length > 0) {
    const allInsights = perspectiveAnalysis.results.flatMap((r: unknown) => ((r as { keyInsights?: string[] }).keyInsights ?? []));
    if (allInsights.length > 0) {
      const uniqueInsights = [...new Set(allInsights)].slice(0, MAX_PERSPECTIVE_INSIGHTS);
      parts.push(`    <div class="perspective-insights">`);
      const insightItems = uniqueInsights.map(i => `      <li>${escapeHtml(i)}</li>`).join('\n');
      parts.push(`    <ul>\n${insightItems}\n    </ul>`);
      parts.push(`    </div>`);
    }
  }

  parts.push('    </section>\n');
  return parts.join('\n');
}
