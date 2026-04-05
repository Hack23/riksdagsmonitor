/**
 * @module generate-news-enhanced/ai-analysis-pipeline
 * @description Heuristic-based multi-iteration analysis pipeline for deep political
 * intelligence. Uses deterministic document classification, template-driven
 * per-document analysis, cross-document synthesis, and quality scoring to produce
 * context-aware political insights from every stakeholder perspective.
 *
 * ⚠️ DEPRECATED FOR ANALYSIS GENERATION (v3.0, 2026-04-02):
 * Per analysis/methodologies/ai-driven-analysis-guide.md Rule 2, the following
 * functions in this module are DEPRECATED for generating analysis content:
 * - buildDynamicSwot() → Replace with AI prompt in workflow .md
 * - buildStrategicImplications() → Replace with AI prompt in workflow .md
 * - buildKeyTakeaways() → Replace with AI prompt in workflow .md
 * - buildLegislativeImpact() → Replace with AI prompt in workflow .md
 * - buildCrossPartyImplications() → Replace with AI prompt in workflow .md
 * - scoreAnalysisDepth() → Replace with AI prompt quality evaluation
 *
 * Their output is treated as FALLBACK STUBS. AI agents in agentic workflow .md
 * files MUST overwrite all template-generated text with genuine, evidence-based
 * political intelligence analysis. See SHARED_PROMPT_PATTERNS.md for AI prompts.
 *
 * This module retains data classification, document type detection, and HTML
 * formatting functions which are NOT deprecated.
 *
 * NOTE: This module does NOT integrate with external LLM/MCP services. All analysis
 * is performed via rule-based heuristics and localised template interpolation. The
 * "iteration" depth controls how many passes run (see {@link AIAnalysisPipeline}).
 *
 * Architecture — four analysis passes (gated by iteration depth):
 *  1. Data Collection & Classification — classify by type/domain, detect policy areas
 *  2. Deep Analysis (iterations ≥ 2) — per-document legislative impact, cross-party
 *     implications, historical context, and EU/Nordic comparison
 *  3. Cross-Document Synthesis (iterations ≥ 2) — convergence/divergence patterns,
 *     coalition stress, emerging trends, stakeholder power dynamics
 *  4. Quality Assurance & Refinement (iterations ≥ 3) — score output, re-generate
 *     below threshold
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import type { RawDocument } from '../data-transformers.js';
import type { Language } from '../types/language.js';
import type { SwotEntry } from '../types/article.js';

import {
  pickLang,
  interp,
  plural,
  betVerbForm,
  motVerbForm,
  propNounForm,
  betNounForm,
  motNounForm,
  LEGISLATIVE_SIGNAL,
  SCRUTINY_SIGNAL,
  EU_ALIGNMENT_SIGNAL,
  GOV_STRENGTH_LABELS,
  OPP_STRENGTH_LABELS,
  EU_OPPORTUNITY,
  GOV_WEAKNESS_IMPL,
  GOV_THREAT_EXEC,
  OPP_WEAKNESS_INFO,
  OPP_OPPORTUNITY_CONSENSUS,
  OPP_THREAT_MAJORITY,
  PRIVATE_STRENGTH_DOMAIN,
  PRIVATE_WEAKNESS_COMPLIANCE,
  PRIVATE_OPPORTUNITY_INVESTMENT,
  PRIVATE_THREAT_UNCERTAINTY,
  STRATEGIC_IMPL_TEMPLATES,
  SIGNAL_GOVT_AGENDA,
  SIGNAL_PARL_SCRUTINY,
  SIGNAL_BALANCED,
  SIGNAL_PRESS,
  SIGNAL_EXTERNAL,
  TYPE_DESC_PRESS,
  TYPE_DESC_EXTERNAL,
  TYPE_DESC_REGULATORY,
  SIGNAL_SNAPSHOT,
  TAKEAWAY_PROP,
  TAKEAWAY_BET,
  TAKEAWAY_MOT,
  TAKEAWAY_EU,
  TAKEAWAY_ENRICHED,
  TAKEAWAY_COALITION_STRESS,
} from './analysis-labels.js';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Per-document deep analysis produced in Pass 2. */
export interface AIDocumentAnalysis {
  /** Riksdag document identifier. */
  dok_id: string;
  /** Document title. */
  title: string;
  /** Assessment of the document's legislative impact in the target language. */
  legislativeImpact: string;
  /** Cross-party implications of the document. */
  crossPartyImplications: string;
  /** Historical context or precedent relevant to the document. */
  historicalContext: string;
  /** EU and Nordic comparative dimension. */
  euNordicComparison: string;
  /** Analysis depth score 0–100 (distinct from the 0.0–1.0 qualityScore used by article-quality-enhancer). */
  analysisScore: number;
}

/** Cross-document synthesis produced in Pass 3. */
export interface AISynthesis {
  /** Assessment of policy convergence or divergence across documents. */
  policyConvergence: string;
  /** Indicators of coalition stress visible in the document set. */
  coalitionStressIndicators: string;
  /**
   * Emerging legislative trends detected.
   * Format: comma-separated domain names with a single bracketed confidence
   * level appended to the whole list, e.g. "fiscal policy, defence, environment [HIGH]".
   * Empty string when no domains are detected.
   */
  emergingTrends: string;
  /** Stakeholder power dynamics implied by the document distribution. */
  stakeholderPowerDynamics: string;
}

/** Dynamically generated SWOT entries replacing hardcoded SWOT_DEFAULTS. */
export interface DynamicSwotEntries {
  government: {
    strengths: SwotEntry[];
    weaknesses: SwotEntry[];
    opportunities: SwotEntry[];
    threats: SwotEntry[];
  };
  opposition: {
    strengths: SwotEntry[];
    weaknesses: SwotEntry[];
    opportunities: SwotEntry[];
    threats: SwotEntry[];
  };
  privateSector: {
    strengths: SwotEntry[];
    weaknesses: SwotEntry[];
    opportunities: SwotEntry[];
    threats: SwotEntry[];
  };
}

/** Final output of the full multi-iteration analysis pipeline. */
export interface AIAnalysisResult {
  /** Total iterations executed. */
  iterations: number;
  /** Per-document deep analyses from Pass 2. */
  documentAnalyses: AIDocumentAnalysis[];
  /** Cross-document synthesis from Pass 3. */
  synthesis: AISynthesis;
  /** Context-aware SWOT entries replacing hardcoded defaults. */
  dynamicSwotEntries: DynamicSwotEntries;
  /** Strategic implications paragraph in the target language. */
  strategicImplications: string;
  /** Bullet-list key takeaways. */
  keyTakeaways: string[];
  /** Overall analysis depth score 0–100 (distinct from the 0.0–1.0 qualityScore used by article-quality-enhancer). */
  analysisScore: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Minimum quality score below which Pass 4 triggers re-analysis. */
const QUALITY_THRESHOLD = 45;

/** Document type keywords used for legislative signal detection. */
const GOV_TYPES = new Set(['prop', 'pressm', 'skr', 'sfs', 'ds', 'sou']);
const OPP_TYPES = new Set(['bet', 'mot', 'ip', 'fr']);
const EU_TYPES = new Set(['fpm', 'eu']);
const EXT_TYPES = new Set(['ext', 'external']);

function docType(d: RawDocument): string {
  return (d.doktyp ?? d.documentType ?? '').toLowerCase();
}

function docTitle(d: RawDocument): string {
  return (d.titel ?? d.title ?? d.dokumentnamn ?? d.dok_id ?? '').slice(0, 120);
}

/** Classify a document into a stakeholder bucket. */
function classifyStakeholder(d: RawDocument): 'government' | 'opposition' | 'eu' | 'other' {
  const t = docType(d);
  if (GOV_TYPES.has(t)) return 'government';
  if (OPP_TYPES.has(t)) return 'opposition';
  if (EU_TYPES.has(t)) return 'eu';
  return 'other';
}

/** Identify whether a document signals cross-party coalition stress. */
function hasCoalitionStress(d: RawDocument): boolean {
  const title = docTitle(d).toLowerCase();
  const stressKeywords = [
    'avslag', 'reject', 'tillägg', 'amendment',
    'reservation', 'minoritet', 'minority',
  ];
  return stressKeywords.some(kw => title.includes(kw));
}

/** Maximum score contribution from word count alone. */
const WORD_SCORE_CAP = 60;
/** Words required per quality point from word-count scoring. */
const WORDS_PER_POINT = 3;
/** Bonus score added when the analysis references specific numeric figures. */
const SPECIFICITY_BONUS = 20;
/** Bonus score added when the analysis contains cross-reference terms. */
const CROSS_REF_BONUS = 20;

/** CJK Unicode range test — for languages without whitespace word boundaries (zh, ja, ko). */
const CJK_REGEX = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/;
/** Characters-per-point for CJK character-based scoring (replaces words/WORDS_PER_POINT). */
const CJK_CHARS_PER_POINT = 5;

/** Score analysis depth: 0–100 based on content length and richness. */
function scoreAnalysisDepth(text: string): number {
  if (!text || text.length === 0) return 0;

  const isCJK = CJK_REGEX.test(text);
  const contentSize = isCJK
    ? Math.floor(text.length / CJK_CHARS_PER_POINT)
    : text.split(/\s+/).length / WORDS_PER_POINT;
  let score = Math.min(WORD_SCORE_CAP, Math.floor(contentSize));

  const hasSpecific = /\d{4}|\d+\s*(kr|miljarder|miljoner|percent|%|万|億|兆|조|억)/.test(text);
  if (hasSpecific) score += SPECIFICITY_BONUS;

  const hasCrossRef = /cross-party|coalition|EU|EU-|Nordic|parliamentary|tvärs?parti|koalition|parlamentar|超党派|連立|議会|초당파|연립|의회|跨党派|联盟|议会/.test(text);
  if (hasCrossRef) score += CROSS_REF_BONUS;

  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Document classification result (Pass 1 output)
// ---------------------------------------------------------------------------

interface ClassifiedDocuments {
  propDocs: RawDocument[];
  betDocs: RawDocument[];
  motDocs: RawDocument[];
  skrDocs: RawDocument[];
  sfsDocs: RawDocument[];
  euDocs: RawDocument[];
  pressmDocs: RawDocument[];
  extDocs: RawDocument[];
  otherDocs: RawDocument[];
  allDomains: string[];
  hasCoalitionStress: boolean;
  enrichedCount: number;
}

// ---------------------------------------------------------------------------
// Pass 2: Per-document deep analysis (standalone functions)
// ---------------------------------------------------------------------------

function buildLegislativeImpact(
  doc: RawDocument,
  stake: 'government' | 'opposition' | 'eu' | 'other',
  topicStr: string,
  lang: Language,
): string {
  if (stake === 'government') {
    return `${pickLang(LEGISLATIVE_SIGNAL, lang)} ${docTitle(doc).slice(0, 80)} — ${topicStr}`;
  }
  if (stake === 'opposition') {
    return `${pickLang(SCRUTINY_SIGNAL, lang)} ${docTitle(doc).slice(0, 80)} — ${topicStr}`;
  }
  if (stake === 'eu') {
    return `${pickLang(EU_ALIGNMENT_SIGNAL, lang)} ${docTitle(doc).slice(0, 80)} — ${topicStr}`;
  }
  return `${docTitle(doc).slice(0, 80)} — ${topicStr}`;
}

function buildCrossPartyImplications(
  doc: RawDocument,
  classified: ClassifiedDocuments,
  topicStr: string,
  lang: Language,
): string {
  const stake = classifyStakeholder(doc);
  if (classified.hasCoalitionStress && stake === 'opposition') {
    return pickLang(TAKEAWAY_COALITION_STRESS, lang);
  }
  if (classified.propDocs.length > 0 && classified.motDocs.length > 0) {
    return pickLang(OPP_OPPORTUNITY_CONSENSUS, lang).replace('%t', topicStr);
  }
  return '';
}

function buildHistoricalContext(
  doc: RawDocument,
  topicStr: string,
): string {
  const contentSnippet = (doc.fullText ?? doc.fullContent ?? doc.summary ?? doc.notis ?? '');
  if (contentSnippet && contentSnippet.length > 50) {
    return contentSnippet.slice(0, 200).replace(/\s+/g, ' ');
  }
  const year = (doc.datum ?? '').slice(0, 4);
  if (year && year.length === 4) {
    return `${topicStr} — ${year}`;
  }
  return '';
}

function buildEuNordicComparison(
  doc: RawDocument,
  classified: ClassifiedDocuments,
  topicStr: string,
  lang: Language,
): string {
  if (classified.euDocs.length > 0 || EU_TYPES.has(docType(doc))) {
    return pickLang(EU_OPPORTUNITY, lang).replace('%t', topicStr);
  }
  return '';
}

function buildAnalysisDocId(doc: RawDocument): string {
  if (doc.dok_id) return doc.dok_id;
  const title = docTitle(doc);
  const datePart = (doc.datum ?? '').slice(0, 10);
  if (title) {
    return datePart ? `${docType(doc)}:${title}:${datePart}` : `${docType(doc)}:${title}`;
  }
  return datePart ? `${docType(doc)}:${datePart}` : docType(doc);
}

function createMinimalDocumentAnalysis(d: RawDocument): AIDocumentAnalysis {
  return {
    dok_id: buildAnalysisDocId(d),
    title: docTitle(d),
    legislativeImpact: '',
    crossPartyImplications: '',
    historicalContext: '',
    euNordicComparison: '',
    analysisScore: 0,
  };
}

function analyzeDocumentDeep(
  doc: RawDocument,
  focusTopic: string | null,
  classified: ClassifiedDocuments,
  lang: Language,
): AIDocumentAnalysis {
  const title = docTitle(doc);
  const stake = classifyStakeholder(doc);
  const domains = detectPolicyDomains(doc, lang);
  const topDomain = domains[0] ?? classified.allDomains[0] ?? (focusTopic ?? 'policy');
  const topicStr = focusTopic ?? topDomain;

  const legislativeImpact = buildLegislativeImpact(doc, stake, topicStr, lang);
  const crossPartyImplications = buildCrossPartyImplications(doc, classified, topicStr, lang);
  const historicalContext = buildHistoricalContext(doc, topicStr);
  const euNordicComparison = buildEuNordicComparison(doc, classified, topicStr, lang);

  const analysisText = [legislativeImpact, crossPartyImplications, historicalContext, euNordicComparison].join(' ');
  const analysisScore = scoreAnalysisDepth(analysisText);

  return {
    dok_id: buildAnalysisDocId(doc),
    title,
    legislativeImpact,
    crossPartyImplications,
    historicalContext,
    euNordicComparison,
    analysisScore,
  };
}

// ---------------------------------------------------------------------------
// AIAnalysisPipeline
// ---------------------------------------------------------------------------

/**
 * Heuristic-based multi-iteration analysis pipeline for deep political intelligence.
 *
 * Instantiate once per deep-inspection run; call analyze() to execute all passes.
 * The number of iterations gates which passes run:
 *  - 1 iteration: Pass 1 only (classification + templated SWOT/implications/takeaways)
 *  - 2 iterations: Passes 1–3 (adds per-document analysis + cross-document synthesis)
 *  - 3+ iterations (default): Passes 1–4 (adds QA scoring with refinement on failure)
 */
export class AIAnalysisPipeline {
  private readonly iterations: number;
  private readonly qualityThreshold: number;

  /** Module-level guard so deprecation warnings are emitted at most once per process. */
  private static _deprecationWarned = false;

  constructor(options: { iterations?: number; qualityThreshold?: number } = {}) {
    this.iterations = Math.min(10, Math.max(1, Math.floor(options.iterations ?? 3)));
    this.qualityThreshold = options.qualityThreshold ?? QUALITY_THRESHOLD;
  }

  analyze(
    documents: RawDocument[],
    focusTopic: string | null,
    lang: Language,
  ): AIAnalysisResult {
    if (documents.length === 0) {
      const empty: DynamicSwotEntries = {
        government:    { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        opposition:    { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        privateSector: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      };
      return {
        iterations: this.iterations,
        documentAnalyses: [],
        synthesis: this.createEmptySynthesis(),
        dynamicSwotEntries: empty,
        strategicImplications: '',
        keyTakeaways: [],
        analysisScore: 0,
      };
    }

    const normalizedFocusTopic = focusTopic?.trim() || null;

    // Pass 1 (always): classify documents
    const classified = this.classifyDocuments(documents, lang);

    // Pass 2 (iterations >= 2): per-document deep analysis
    const documentAnalyses = this.iterations >= 2
      ? this.analyzeDocumentsDeep(classified, normalizedFocusTopic, lang)
      : documents.map(d => createMinimalDocumentAnalysis(d));

    // Pass 3 (iterations >= 2): cross-document synthesis
    let synthesis = this.iterations >= 2
      ? this.synthesizeAcrossDocuments(classified, documentAnalyses, normalizedFocusTopic, lang)
      : this.createEmptySynthesis();

    // Emit a single consolidated deprecation warning per process for the
    // template-based builders that are slated for replacement by AI prompts.
    if (!AIAnalysisPipeline._deprecationWarned) {
      AIAnalysisPipeline._deprecationWarned = true;
      console.warn(
        '[DEPRECATED] buildDynamicSwot(), buildStrategicImplications(), buildKeyTakeaways(), '
        + 'buildLegislativeImpact(), buildCrossPartyImplications(), and scoreAnalysisDepth() '
        + 'are deprecated (v3.0). Use AI prompts in workflow .md files instead.',
      );
    }

    // Build dynamic SWOT (always — uses classification data from Pass 1)
    const dynamicSwotEntries = this.buildDynamicSwot(classified, normalizedFocusTopic, lang);

    // Build strategic implications (always)
    const strategicImplications = this.buildStrategicImplications(classified, normalizedFocusTopic, lang);

    // Build key takeaways (always)
    const keyTakeaways = this.buildKeyTakeaways(classified, normalizedFocusTopic, lang);

    // Pass 4 (iterations >= 3): QA + refinement
    let analysisScore = this.scoreAnalysis(documentAnalyses, synthesis, dynamicSwotEntries);
    if (this.iterations >= 3 && analysisScore < this.qualityThreshold) {
      const refinedSynthesis = this.synthesizeAcrossDocuments(
        classified, documentAnalyses, normalizedFocusTopic, lang,
      );
      const refinedScore = this.scoreAnalysis(documentAnalyses, refinedSynthesis, dynamicSwotEntries);
      if (refinedScore >= analysisScore) {
        analysisScore = refinedScore;
        synthesis = refinedSynthesis;
      }
    }

    return {
      iterations: this.iterations,
      documentAnalyses,
      synthesis,
      dynamicSwotEntries,
      strategicImplications,
      keyTakeaways,
      analysisScore,
    };
  }

  private createEmptySynthesis(): AISynthesis {
    return {
      policyConvergence: '',
      coalitionStressIndicators: '',
      emergingTrends: '',
      stakeholderPowerDynamics: '',
    };
  }

  private classifyDocuments(docs: RawDocument[], lang: Language): ClassifiedDocuments {
    const propDocs   = docs.filter(d => docType(d) === 'prop');
    const betDocs    = docs.filter(d => docType(d) === 'bet');
    const motDocs    = docs.filter(d => docType(d) === 'mot');
    const skrDocs    = docs.filter(d => docType(d) === 'skr');
    const sfsDocs    = docs.filter(d =>
      docType(d) === 'sfs' || (d.dokumentnamn ?? '').startsWith('SFS'));
    const euDocs     = docs.filter(d => EU_TYPES.has(docType(d)));
    const pressmDocs = docs.filter(d => docType(d) === 'pressm');
    const extDocs    = docs.filter(d => EXT_TYPES.has(docType(d)));
    const otherDocs  = docs.filter(d =>
      !['prop','bet','mot','skr','sfs','fpm','eu','pressm','ext','external'].includes(docType(d))
      && !(d.dokumentnamn ?? '').startsWith('SFS'));

    const domainSet = new Set<string>();
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => domainSet.add(dom)));

    const hasStress = docs.some(d => hasCoalitionStress(d));
    const enrichedCount = docs.filter(d => !!d.contentFetched).length;

    return {
      propDocs, betDocs, motDocs, skrDocs, sfsDocs, euDocs,
      pressmDocs, extDocs, otherDocs,
      allDomains: [...domainSet],
      hasCoalitionStress: hasStress,
      enrichedCount,
    };
  }

  private analyzeDocumentsDeep(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): AIDocumentAnalysis[] {
    const allDocs = [
      ...classified.propDocs,
      ...classified.betDocs,
      ...classified.motDocs,
      ...classified.sfsDocs,
      ...classified.skrDocs,
      ...classified.euDocs,
      ...classified.pressmDocs,
      ...classified.extDocs,
      ...classified.otherDocs,
    ];

    return allDocs.map(doc => analyzeDocumentDeep(doc, focusTopic, classified, lang));
  }

  private synthesizeAcrossDocuments(
    classified: ClassifiedDocuments,
    docAnalyses: AIDocumentAnalysis[],
    focusTopic: string | null,
    lang: Language,
  ): AISynthesis {
    const topicStr = focusTopic ?? classified.allDomains[0] ?? 'policy';
    const n = classified.propDocs.length + classified.betDocs.length + classified.motDocs.length;

    const converging = classified.propDocs.length > 0 && classified.betDocs.length > 0;
    const diverging = classified.motDocs.length > classified.propDocs.length;
    const policyConvergence = converging
      ? interp(pickLang(GOV_STRENGTH_LABELS.propositions, lang), {
          n: classified.propDocs.length,
          s: plural(classified.propDocs.length, lang),
          t: topicStr,
        })
      : diverging
        ? interp(pickLang(OPP_STRENGTH_LABELS.motions, lang), {
            n: classified.motDocs.length,
            s: plural(classified.motDocs.length, lang),
            t: topicStr,
          })
        : `${topicStr} — ${n}`;

    const coalitionStressIndicators = classified.hasCoalitionStress
      ? pickLang(TAKEAWAY_COALITION_STRESS, lang)
      : '';

    const avgQuality = docAnalyses.length > 0
      ? docAnalyses.reduce((sum, a) => sum + a.analysisScore, 0) / docAnalyses.length
      : 0;
    const trendConfidence = avgQuality >= 60 ? 'HIGH' : avgQuality >= 35 ? 'MEDIUM' : 'LOW';
    const domainList = classified.allDomains.slice(0, 3).join(', ');
    const emergingTrends = domainList
      ? `${domainList} [${trendConfidence}]`
      : '';

    const govDocs = classified.propDocs.length + classified.sfsDocs.length + classified.pressmDocs.length;
    const oppDocs = classified.betDocs.length + classified.motDocs.length;
    const stakeholderPowerDynamics = govDocs > oppDocs
      ? interp(pickLang(GOV_STRENGTH_LABELS.default, lang), { t: topicStr })
      : oppDocs > 0
        ? interp(pickLang(OPP_STRENGTH_LABELS.default, lang), { t: topicStr })
        : topicStr;

    return { policyConvergence, coalitionStressIndicators, emergingTrends, stakeholderPowerDynamics };
  }

  /**
   * @deprecated Since v3.0 — Replace with AI prompt in workflow .md files.
   * See analysis/methodologies/ai-driven-analysis-guide.md Rule 2.
   */
  private buildDynamicSwot(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): DynamicSwotEntries {
    const topic = focusTopic ?? classified.allDomains[0] ?? 'policy';
    const {
      propDocs, betDocs, motDocs, sfsDocs, skrDocs, euDocs, pressmDocs, extDocs,
    } = classified;

    const titleEntry = (d: RawDocument, impact: SwotEntry['impact'] = 'medium'): SwotEntry => ({
      text: docTitle(d),
      impact,
    });

    // ── Government SWOT
    const govStrengths: SwotEntry[] = [
      ...propDocs.slice(0, 3).map(d => titleEntry(d, 'high')),
      ...sfsDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
      ...skrDocs.slice(0, 1).map(d => titleEntry(d, 'medium')),
      ...pressmDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
    ];
    if (govStrengths.length === 0) {
      govStrengths.push({
        text: interp(pickLang(GOV_STRENGTH_LABELS.default, lang), { n: 0, s: plural(0, lang), t: topic }),
        impact: 'medium',
      });
    }

    const govWeaknesses: SwotEntry[] = [...betDocs.slice(0, 2).map(d => titleEntry(d, 'medium'))];
    if (govWeaknesses.length === 0) {
      govWeaknesses.push({ text: interp(pickLang(GOV_WEAKNESS_IMPL, lang), { t: topic }), impact: 'medium' });
    }

    const govOpportunities: SwotEntry[] = [
      ...euDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
      ...skrDocs.slice(1, 2).map(d => titleEntry(d, 'medium')),
    ];
    if (govOpportunities.length === 0) {
      govOpportunities.push({ text: interp(pickLang(EU_OPPORTUNITY, lang), { t: topic }), impact: 'high' });
    }

    const govThreats: SwotEntry[] = [...motDocs.slice(0, 2).map(d => titleEntry(d, 'medium'))];
    if (govThreats.length === 0) {
      govThreats.push({ text: interp(pickLang(GOV_THREAT_EXEC, lang), { t: topic }), impact: 'medium' });
    }

    // ── Opposition SWOT
    const oppStrengths: SwotEntry[] = [
      ...betDocs.slice(0, 3).map(d => titleEntry(d, 'high')),
      ...motDocs.slice(0, 2).map(d => titleEntry(d, 'medium')),
    ];
    if (oppStrengths.length === 0) {
      oppStrengths.push({
        text: interp(pickLang(
          betDocs.length > 0 ? OPP_STRENGTH_LABELS.committee : OPP_STRENGTH_LABELS.default,
          lang,
        ), { n: betDocs.length, s: plural(betDocs.length, lang), t: topic }),
        impact: 'high',
      });
    }

    const oppWeaknesses: SwotEntry[] = [];
    oppWeaknesses.push({ text: interp(pickLang(OPP_WEAKNESS_INFO, lang), { t: topic }), impact: 'medium' });

    const oppOpportunities: SwotEntry[] = [];
    oppOpportunities.push({ text: interp(pickLang(OPP_OPPORTUNITY_CONSENSUS, lang), { t: topic }), impact: 'high' });

    const oppThreats: SwotEntry[] = [...propDocs.slice(0, 1).map(d => titleEntry(d, 'medium'))];
    if (oppThreats.length === 0) {
      oppThreats.push({ text: interp(pickLang(OPP_THREAT_MAJORITY, lang), { t: topic }), impact: 'medium' });
    }

    // ── Private Sector / Civil Society SWOT
    const privateStrengths: SwotEntry[] = [
      { text: interp(pickLang(PRIVATE_STRENGTH_DOMAIN, lang), { t: topic }), impact: 'high' },
      ...sfsDocs.slice(0, 1).map(d => titleEntry(d, 'medium')),
      ...extDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
    ];

    const privateWeaknesses: SwotEntry[] = [
      { text: interp(pickLang(PRIVATE_WEAKNESS_COMPLIANCE, lang), { t: topic }), impact: 'medium' },
    ];

    const privateOpportunities: SwotEntry[] = [
      { text: interp(pickLang(PRIVATE_OPPORTUNITY_INVESTMENT, lang), { t: topic }), impact: 'high' },
      ...euDocs.slice(0, 1).map(d => titleEntry(d, 'high')),
    ];

    const privateThreats: SwotEntry[] = [
      { text: interp(pickLang(PRIVATE_THREAT_UNCERTAINTY, lang), { t: topic }), impact: 'high' },
    ];

    return {
      government: { strengths: govStrengths, weaknesses: govWeaknesses, opportunities: govOpportunities, threats: govThreats },
      opposition: { strengths: oppStrengths, weaknesses: oppWeaknesses, opportunities: oppOpportunities, threats: oppThreats },
      privateSector: { strengths: privateStrengths, weaknesses: privateWeaknesses, opportunities: privateOpportunities, threats: privateThreats },
    };
  }

  /**
   * @deprecated Since v3.0 — Replace with AI prompt in workflow .md files.
   * See analysis/methodologies/ai-driven-analysis-guide.md Rule 2.
   */
  private buildStrategicImplications(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): string {
    const esc = escapeHtml;
    const topic = focusTopic ?? classified.allDomains[0] ?? '';
    const { propDocs, betDocs, motDocs, pressmDocs, extDocs, enrichedCount, allDomains } = classified;
    const total = propDocs.length + betDocs.length + motDocs.length
      + pressmDocs.length + extDocs.length + classified.sfsDocs.length
      + classified.skrDocs.length + classified.euDocs.length + classified.otherDocs.length;
    const legislativeCount = propDocs.length + betDocs.length + motDocs.length;
    const isLegislative = legislativeCount > 0;
    const domainPhrase = allDomains.slice(0, 3).map(d => esc(d)).join(', ');
    const topicInsert = topic ? ` (${esc(topic)})` : '';
    const domainInsert = domainPhrase ? ` — ${domainPhrase}` : '';

    if (isLegislative) {
      const signalPhrase = propDocs.length > betDocs.length
        ? pickLang(SIGNAL_GOVT_AGENDA, lang)
        : betDocs.length > propDocs.length
          ? pickLang(SIGNAL_PARL_SCRUTINY, lang)
          : pickLang(SIGNAL_BALANCED, lang);
      const template = pickLang(STRATEGIC_IMPL_TEMPLATES.legislative, lang);
      return `<p>${interp(template, {
        total,
        enriched: enrichedCount,
        topic: topicInsert,
        prop: propDocs.length,
        bet: betDocs.length,
        mot: motDocs.length,
        signal: esc(signalPhrase),
        domain: domainInsert,
      })}</p>`;
    }

    const hasPressOrExt = pressmDocs.length > 0 || extDocs.length > 0;

    if (hasPressOrExt) {
      const typeDesc = esc(pressmDocs.length > 0
        ? `${pressmDocs.length} ${pickLang(TYPE_DESC_PRESS, lang)}`
        : `${extDocs.length} ${pickLang(TYPE_DESC_EXTERNAL, lang)}`);
      const signalText = pressmDocs.length > 0
        ? pickLang(SIGNAL_PRESS, lang)
        : pickLang(SIGNAL_EXTERNAL, lang);
      const template = pickLang(STRATEGIC_IMPL_TEMPLATES.nonLegislative, lang);
      return `<p>${interp(template, {
        total,
        enriched: enrichedCount,
        topic: topicInsert,
        typeDesc,
        domain: domainInsert,
        signalText: esc(signalText),
      })}</p>`;
    }

    const regulatoryCount = classified.sfsDocs.length + classified.skrDocs.length
      + classified.euDocs.length + classified.otherDocs.length;
    const typeDesc = esc(`${regulatoryCount} ${pickLang(TYPE_DESC_REGULATORY, lang)}`);
    const signalText = pickLang(SIGNAL_SNAPSHOT, lang);
    const template = pickLang(STRATEGIC_IMPL_TEMPLATES.nonLegislative, lang);
    return `<p>${interp(template, {
      total,
      enriched: enrichedCount,
      topic: topicInsert,
      typeDesc,
      domain: domainInsert,
      signalText: esc(signalText),
    })}</p>`;
  }

  // ── Key takeaways ─────────────────────────────────────────────────────────

  /**
   * @deprecated Since v3.0 — Replace with AI prompt in workflow .md files.
   * See analysis/methodologies/ai-driven-analysis-guide.md Rule 2.
   */
  private buildKeyTakeaways(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): string[] {
    const topic = focusTopic ?? classified.allDomains[0] ?? 'policy';
    const { propDocs, betDocs, motDocs, euDocs, enrichedCount } = classified;
    const total = propDocs.length + betDocs.length + motDocs.length
      + classified.sfsDocs.length + classified.skrDocs.length
      + classified.pressmDocs.length + classified.extDocs.length
      + classified.euDocs.length + classified.otherDocs.length;

    const items: string[] = [];

    if (propDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_PROP, lang), {
        n: propDocs.length, s: plural(propDocs.length, lang), t: topic, pnoun: propNounForm(propDocs.length, lang),
      }));
    }
    if (betDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_BET, lang), {
        n: betDocs.length, s: plural(betDocs.length, lang), t: topic, verb: betVerbForm(betDocs.length, lang), bnoun: betNounForm(betDocs.length, lang),
      }));
    }
    if (motDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_MOT, lang), {
        n: motDocs.length, s: plural(motDocs.length, lang), t: topic, verb: motVerbForm(motDocs.length, lang), mnoun: motNounForm(motDocs.length, lang),
      }));
    }
    if (euDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_EU, lang), { n: euDocs.length, t: topic }));
    }
    if (enrichedCount > 0 && enrichedCount >= Math.ceil(total / 2)) {
      items.push(interp(pickLang(TAKEAWAY_ENRICHED, lang), { n: enrichedCount, total }));
    }
    if (classified.hasCoalitionStress) {
      items.push(pickLang(TAKEAWAY_COALITION_STRESS, lang));
    }

    return items;
  }

  private scoreAnalysis(
    docAnalyses: AIDocumentAnalysis[],
    synthesis: AISynthesis,
    swot: DynamicSwotEntries,
  ): number {
    let score = 0;

    if (docAnalyses.length > 0) {
      const avgDoc = docAnalyses.reduce((sum, a) => sum + a.analysisScore, 0) / docAnalyses.length;
      score += Math.floor(avgDoc * 0.4);
    }

    const synthText = [
      synthesis.policyConvergence,
      synthesis.coalitionStressIndicators,
      synthesis.emergingTrends,
      synthesis.stakeholderPowerDynamics,
    ].join(' ');
    score += Math.min(30, Math.floor(scoreAnalysisDepth(synthText) * 0.3));

    const swotCount =
      swot.government.strengths.length + swot.government.weaknesses.length
      + swot.government.opportunities.length + swot.government.threats.length
      + swot.opposition.strengths.length + swot.opposition.weaknesses.length
      + swot.opposition.opportunities.length + swot.opposition.threats.length
      + swot.privateSector.strengths.length + swot.privateSector.weaknesses.length
      + swot.privateSector.opportunities.length + swot.privateSector.threats.length;
    score += Math.min(30, swotCount * 3);

    return Math.min(100, score);
  }
}
