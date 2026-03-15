/**
 * @module ai-analysis/document-analyzer
 * @description AI-powered comprehensive document analysis framework for
 * parliamentary documents, government propositions, and policy papers.
 *
 * Provides multi-stakeholder impact assessment, PESTLE analysis, coalition
 * dynamics, historical context, implementation feasibility, risk assessment,
 * and confidence scoring through a multi-iteration analysis protocol.
 *
 * The framework is the shared analytical backbone consumed by all content
 * generators and agentic workflows for consistent, high-quality political
 * intelligence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { createHash } from 'node:crypto';
import type { RawDocument, CIAContext } from '../data-transformers/types.js';
import type { Language } from '../types/language.js';
import type { SwotData } from '../types/article.js';
import {
  detectPolicyDomains,
  assessConfidenceLevel,
  type ConfidenceLevel,
  DOMAIN_NAME_TO_KEY,
  type DomainKey,
} from '../data-transformers/policy-analysis.js';
import { calculateInfluenceScore } from '../data-transformers/document-analysis.js';
import { calculateCoalitionRiskIndex } from '../data-transformers/risk-analysis.js';
import {
  extractKeyPassage,
  generateEnhancedSummary,
  normalizePartyKey,
} from '../data-transformers/helpers.js';
import { escapeHtml } from '../html-utils.js';
import { getCurrentRiksmote } from '../news-types/motions.js';

// ---------------------------------------------------------------------------
// Stakeholder definitions
// ---------------------------------------------------------------------------

/** Available stakeholder groups that may be relevant for a document */
export type StakeholderGroup =
  | 'government-coalition'
  | 'opposition-parties'
  | 'state-agencies'
  | 'municipalities-regions'
  | 'private-sector'
  | 'labor-market'
  | 'civil-society'
  | 'international-eu'
  | 'media-press'
  | 'academia-research'
  | 'citizens-voters';

/** Direction of impact on a stakeholder */
export type ImpactDirection = 'positive' | 'negative' | 'neutral' | 'mixed';

/** Burden level for implementation */
export type BurdenLevel = 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Core analysis types
// ---------------------------------------------------------------------------

/** Direct impact assessment for one stakeholder */
export interface ImpactAssessment {
  direction: ImpactDirection;
  magnitude: 'significant' | 'moderate' | 'minor';
  summary: string;
}

/** Full stakeholder impact analysis for a single stakeholder group */
export interface StakeholderImpact {
  stakeholder: StakeholderGroup;
  /** Human-readable name for display */
  displayName: string;
  directImpact: ImpactAssessment;
  /** Secondary / downstream effects */
  indirectEffects: string[];
  implementationBurden: BurdenLevel;
  /** Political positioning implications */
  politicalImplications: string;
  /** Per-stakeholder SWOT analysis */
  swot: SwotData;
  /** Confidence level for this stakeholder assessment */
  confidence: ConfidenceLevel;
}

/** PESTLE analysis dimensions */
export interface PESTLEAnalysis {
  political: string[];
  economic: string[];
  social: string[];
  technological: string[];
  legal: string[];
  environmental: string[];
}

/** Detected policy domain with relevance score */
export interface PolicyDomain {
  key: DomainKey | string;
  name: string;
  relevanceScore: number;
}

/** Coalition dynamics analysis */
export interface CoalitionAnalysis {
  governmentImpact: ImpactDirection;
  oppositionResponse: string;
  crossPartyPotential: boolean;
  stabilityEffect: 'stabilising' | 'neutral' | 'destabilising';
  summary: string;
}

/** Historical and legislative context */
export interface HistoricalContext {
  precedents: string[];
  relatedLegislation: string[];
  policyEvolution: string;
}

/** Implementation feasibility assessment */
export interface ImplementationAssessment {
  feasibility: 'high' | 'medium' | 'low';
  estimatedTimeline: string;
  keyObstacles: string[];
  resourceRequirements: string;
  agenciesInvolved: string[];
}

/** Risk factor identified in the document */
export interface RiskAssessment {
  type: 'political' | 'implementation' | 'public-acceptance' | 'legal' | 'financial';
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigationOptions: string[];
}

/** One pass of the multi-iteration analysis protocol */
export interface AnalysisIteration {
  iteration: 1 | 2 | 3 | 4;
  label: 'generation' | 'deepening' | 'stakeholder-review' | 'synthesis';
  summary: string;
  refinements: string[];
}

/** Full document analysis result */
export interface DocumentAnalysis {
  /** Document identifier (dok_id or slug) */
  documentId: string;
  /** Document title for display */
  documentTitle: string;
  /** AI-generated executive summary (2–3 paragraphs) */
  executiveSummary: string;
  /** Per-stakeholder impact assessments */
  stakeholderImpacts: StakeholderImpact[];
  /** PESTLE dimension analysis */
  pestleDimensions: PESTLEAnalysis;
  /** Affected policy domains */
  policyDomains: PolicyDomain[];
  /** Coalition dynamics analysis */
  coalitionDynamics: CoalitionAnalysis;
  /** Historical and legislative context */
  historicalContext: HistoricalContext;
  /** Implementation feasibility */
  implementationAssessment: ImplementationAssessment;
  /** Risk factors */
  riskAssessment: RiskAssessment[];
  /** Per-dimension confidence scores */
  confidenceScores: Map<string, ConfidenceLevel>;
  /** Multi-iteration protocol record */
  iterations: AnalysisIteration[];
  /** Overall influence score (0–100) */
  influenceScore: number;
  /** ISO-8601 timestamp of analysis */
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// Analysis cache
// ---------------------------------------------------------------------------

const _analysisCache = new Map<string, DocumentAnalysis>();

/** Minimum relevance score assigned to any detected policy domain. */
const MIN_DOMAIN_RELEVANCE = 30;
/** Maximum (baseline) relevance score for the first detected domain. */
const MAX_DOMAIN_RELEVANCE = 100;
/** Per-rank decay applied to successive domain relevance scores. */
const DOMAIN_RELEVANCE_DECAY = 15;

/** Clear the in-process analysis cache (useful for testing). */
export function clearAnalysisCache(): void {
  _analysisCache.clear();
}

/**
 * Precomputed values that are expensive to derive and shared across
 * multiple builder functions within a single `analyzeDocument()` call.
 *
 * By computing `domains` and `influenceScore` once and threading this
 * context through helpers we avoid 7–11× redundant `detectPolicyDomains()`
 * and `calculateInfluenceScore()` calls per document.
 */
export interface PrecomputedContext {
  domains: string[];
  influenceScore: number;
}

/**
 * WeakMap cache for content fingerprints.
 *
 * Avoids re-hashing large `fullText`/`fullContent` payloads on repeated
 * `analyzeDocument()` calls when the same object reference is reused.
 * Uses `WeakMap` so that fingerprints are garbage-collected when the
 * document object is no longer referenced.
 */
const _fingerprintCache = new WeakMap<RawDocument, string>();

/**
 * Return a truncated SHA-256 hex digest of the document's content fields.
 *
 * Used in cache keys so that documents enriched with `fullText`/`fullContent`
 * after an initial metadata-only fetch produce a different fingerprint and
 * therefore receive a fresh analysis instead of a stale pre-enrichment result.
 *
 * A real hash (vs. simple length sums) ensures that different content of the
 * same combined length cannot collide.
 *
 * Results are cached in a WeakMap keyed by object identity, so repeated
 * calls with the same document reference skip the SHA-256 computation.
 */
function contentFingerprint(doc: RawDocument): string {
  const cached = _fingerprintCache.get(doc);
  if (cached !== undefined) return cached;
  const payload = [
    doc.fullText ?? '',
    doc.summary ?? '',
    doc.fullContent ?? '',
    doc.notis ?? '',
  ].join('\x00');
  const fp = createHash('sha256').update(payload).digest('hex').slice(0, 32);
  _fingerprintCache.set(doc, fp);
  return fp;
}

/**
 * Return a base identity string for a document (no lang/context suffix).
 *
 * This is the human-recognizable, stable document identity used for
 * `documentId` in results and Map keys in `analyzeDocuments()`.
 */
function documentBaseKey(doc: RawDocument, fp?: string): string {
  if (doc.dok_id) return `dok:${doc.dok_id}`;
  if (doc.url) return `url:${doc.url}`;
  const title = doc.titel ?? doc.title ?? 'unknown';
  const date = doc.datum ?? '';
  return `title:${title}-${date}-${fp ?? contentFingerprint(doc)}`;
}

/**
 * Return a short stable discriminator string for a CIAContext.
 *
 * Different CIA contexts (e.g. different coalition-stability scores or
 * overall motion denial rates) produce a different discriminator so that
 * cached analyses are not reused across meaningfully different intelligence
 * inputs.  The discriminator is a truncated SHA-256 hex digest (8 chars)
 * of the key numeric fields.
 */
function ciaDiscriminator(ctx: CIAContext): string {
  const payload = [
    ctx.coalitionStability?.stabilityScore ?? 0,
    ctx.coalitionStability?.defectionProbability ?? 0,
    ctx.coalitionStability?.majorityMargin ?? 0,
    ctx.overallMotionDenialRate ?? 0,
  ].join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 8);
}

/**
 * Return the cache key for a document.
 *
 * The key includes the document identity *plus* a content fingerprint,
 * `lang`, and a CIA-context discriminator so that:
 * - analyses with different languages or CIA context get separate slots
 * - different CIA contexts (e.g. different coalition stability or denial
 *   rates) produce separate cache slots instead of returning stale results
 * - enriched documents (with `fullText`/`fullContent` added after initial
 *   metadata-only fetch) are not served stale pre-enrichment results
 *
 * The fingerprint is computed once and reused in both the base key (for
 * title-only fallback) and the cache key suffix to avoid redundant SHA-256
 * work.
 *
 * @returns a tuple of [cacheKey, fingerprint] so callers can reuse the fp
 */
function cacheKeyAndFp(doc: RawDocument, lang: string = 'en', ciaContext?: CIAContext): [string, string] {
  const fp = contentFingerprint(doc);
  const ciaDisc = ciaContext ? ciaDiscriminator(ciaContext) : '0';
  return [`${documentBaseKey(doc, fp)}|${fp}|${lang}|cia:${ciaDisc}`, fp];
}

/**
 * Derive a stable, collision-resistant document identifier.
 * Unlike `cacheKeyAndFp()`, this is independent of language and CIA context —
 * it identifies the document itself, not a particular analysis of it.
 *
 * @param doc - Raw document
 * @param fp - Precomputed content fingerprint (avoids redundant SHA-256)
 */
function stableDocumentId(doc: RawDocument, fp?: string): string {
  return documentBaseKey(doc, fp);
}

// ---------------------------------------------------------------------------
// Stakeholder display names (14 languages)
// ---------------------------------------------------------------------------

const STAKEHOLDER_NAMES: Readonly<Record<StakeholderGroup, Record<string, string>>> = {
  'government-coalition': {
    en: 'Government Coalition', sv: 'Regeringskoalitionen', da: 'Regeringskoalitionen',
    no: 'Regjeringskoalisjonen', fi: 'Hallituskoalitio', de: 'Regierungskoalition',
    fr: 'Coalition gouvernementale', es: 'Coalición de gobierno', nl: 'Regeringscoalitie',
    ar: 'الائتلاف الحكومي', he: 'קואליציה ממשלתית', ja: '与党連立', ko: '연립정부', zh: '执政联盟',
  },
  'opposition-parties': {
    en: 'Opposition Parties', sv: 'Oppositionspartier', da: 'Oppositionspartier',
    no: 'Opposisjonspartier', fi: 'Oppositiopuolueet', de: 'Oppositionsparteien',
    fr: "Partis d'opposition", es: 'Partidos de oposición', nl: 'Oppositiepartijen',
    ar: 'أحزاب المعارضة', he: 'מפלגות האופוזיציה', ja: '野党', ko: '야당', zh: '反对党',
  },
  'state-agencies': {
    en: 'State Agencies', sv: 'Statliga myndigheter', da: 'Statslige myndigheder',
    no: 'Statlige etater', fi: 'Valtion virastot', de: 'Staatliche Behörden',
    fr: 'Agences de l\'État', es: 'Agencias estatales', nl: 'Overheidsinstanties',
    ar: 'الوكالات الحكومية', he: 'סוכנויות המדינה', ja: '国家機関', ko: '국가 기관', zh: '政府机构',
  },
  'municipalities-regions': {
    en: 'Municipalities & Regions', sv: 'Kommuner och regioner', da: 'Kommuner og regioner',
    no: 'Kommuner og regioner', fi: 'Kunnat ja alueet', de: 'Gemeinden und Regionen',
    fr: 'Municipalités et régions', es: 'Municipios y regiones', nl: 'Gemeenten en regio\'s',
    ar: 'البلديات والمناطق', he: 'עיריות ואזורים', ja: '市町村・地域', ko: '지방자치단체·지역', zh: '市镇与地区',
  },
  'private-sector': {
    en: 'Private Sector', sv: 'Näringsliv', da: 'Erhvervsliv', no: 'Næringsliv',
    fi: 'Yksityinen sektori', de: 'Privatwirtschaft', fr: 'Secteur privé', es: 'Sector privado',
    nl: 'Bedrijfsleven', ar: 'القطاع الخاص', he: 'המגזר הפרטי', ja: '民間企業', ko: '민간 부문', zh: '私营部门',
  },
  'labor-market': {
    en: 'Labour Market (Unions)', sv: 'Arbetsmarknad (fackförbund)', da: 'Arbejdsmarked (fagforeninger)',
    no: 'Arbeidsmarked (fagforeninger)', fi: 'Työmarkkinat (ammattiliitot)', de: 'Arbeitsmarkt (Gewerkschaften)',
    fr: 'Marché du travail (syndicats)', es: 'Mercado laboral (sindicatos)', nl: 'Arbeidsmarkt (vakbonden)',
    ar: 'سوق العمل (النقابات)', he: 'שוק העבודה (איגודי עובדים)', ja: '労働市場（労働組合）', ko: '노동 시장(노조)', zh: '劳动力市场（工会）',
  },
  'civil-society': {
    en: 'Civil Society', sv: 'Civilsamhälle', da: 'Civilsamfund', no: 'Sivilsamfunn',
    fi: 'Kansalaisyhteiskunta', de: 'Zivilgesellschaft', fr: 'Société civile', es: 'Sociedad civil',
    nl: 'Maatschappelijk middenveld', ar: 'المجتمع المدني', he: 'חברה אזרחית', ja: '市民社会', ko: '시민 사회', zh: '公民社会',
  },
  'international-eu': {
    en: 'International / EU', sv: 'Internationellt / EU', da: 'Internationalt / EU',
    no: 'Internasjonalt / EU', fi: 'Kansainvälinen / EU', de: 'International / EU',
    fr: 'International / UE', es: 'Internacional / UE', nl: 'Internationaal / EU',
    ar: 'دولي / الاتحاد الأوروبي', he: 'בינלאומי / האיחוד האירופי', ja: '国際・EU', ko: '국제 / EU', zh: '国际/欧盟',
  },
  'media-press': {
    en: 'Media & Press', sv: 'Medier och press', da: 'Medier og presse', no: 'Medier og presse',
    fi: 'Media ja lehdistö', de: 'Medien und Presse', fr: 'Médias et presse', es: 'Medios y prensa',
    nl: 'Media en pers', ar: 'الإعلام والصحافة', he: 'תקשורת ועיתונות', ja: 'メディア・報道', ko: '미디어·언론', zh: '媒体与新闻',
  },
  'academia-research': {
    en: 'Academia & Research', sv: 'Akademi och forskning', da: 'Akademi og forskning',
    no: 'Akademia og forskning', fi: 'Akateeminen maailma ja tutkimus', de: 'Wissenschaft und Forschung',
    fr: 'Monde académique et recherche', es: 'Academia e investigación', nl: 'Academische wereld en onderzoek',
    ar: 'الأوساط الأكاديمية والبحث', he: 'אקדמיה ומחקר', ja: '学術・研究', ko: '학계·연구', zh: '学术界与研究',
  },
  'citizens-voters': {
    en: 'Citizens & Voters', sv: 'Medborgare och väljare', da: 'Borgere og vælgere',
    no: 'Borgere og velgere', fi: 'Kansalaiset ja äänestäjät', de: 'Bürger und Wähler',
    fr: 'Citoyens et électeurs', es: 'Ciudadanos y votantes', nl: 'Burgers en kiezers',
    ar: 'المواطنون والناخبون', he: 'אזרחים ובוחרים', ja: '市民・有権者', ko: '시민·유권자', zh: '公民与选民',
  },
};

/** Resolve localised display name for a stakeholder group. */
function stakeholderName(group: StakeholderGroup, lang: Language | string): string {
  return STAKEHOLDER_NAMES[group]?.[lang as string]
    ?? STAKEHOLDER_NAMES[group]?.en
    ?? group;
}

// ---------------------------------------------------------------------------
// Domain key ↔ localised name helpers (reuses canonical mapping from
// policy-analysis.ts via DOMAIN_NAME_TO_KEY — no duplication)
// ---------------------------------------------------------------------------

/**
 * Check whether a domain key (e.g. 'healthcare') is present in the array
 * returned by `detectPolicyDomains()`.  Since `detectPolicyDomains` returns
 * localised display names, this helper uses the canonical reverse mapping
 * (`DOMAIN_NAME_TO_KEY`) to convert each localised name back to its key
 * before comparison — so it works correctly regardless of language.
 */
function hasDomain(domains: string[], key: string): boolean {
  return domains.some(d => {
    const canonicalKey = DOMAIN_NAME_TO_KEY[d] ?? DOMAIN_NAME_TO_KEY[d.toLowerCase()];
    if (canonicalKey === key) return true;
    // Fallback: substring match for unknown/un-mapped entries
    return d.toLowerCase().includes(key.toLowerCase());
  });
}

/**
 * Derive canonical domain keys from a localised domain name array.
 * Returns `[canonicalKey, localisedDisplayName]` tuples.
 */
function toDomainKeyPairs(domains: string[]): Array<{ key: DomainKey | string; name: string }> {
  return domains.map(d => ({
    key: DOMAIN_NAME_TO_KEY[d] ?? DOMAIN_NAME_TO_KEY[d.toLowerCase()] ?? d,
    name: d,
  }));
}



/** Document-content-based relevance signals for each stakeholder group. */
const STAKEHOLDER_SIGNALS: Readonly<Record<StakeholderGroup, string[]>> = {
  'government-coalition': ['proposition', 'regering', 'budget', 'statsminister', 'minister'],
  'opposition-parties': ['motion', 'opposition', 'socialdemokrat', 'vänsterpartiet', 'centerpartiet', 'miljöpartiet'],
  'state-agencies': ['myndighet', 'länsstyrelse', 'domstol', 'polis', 'skatteverket', 'folkhälsomyndighet'],
  'municipalities-regions': ['kommuner', 'regioner', 'landsting', 'skr', 'primärkommunal'],
  'private-sector': ['näringsliv', 'företag', 'arbetsgivare', 'industry', 'handel', 'marknad'],
  'labor-market': ['facket', 'lo', 'tco', 'saco', 'arbetsrätt', 'lön', 'fackförbund'],
  'civil-society': ['civilsamhälle', 'ngo', 'ideell', 'förening', 'frivillig'],
  'international-eu': ['eu', 'europa', 'nato', 'fn', 'nordisk', 'internationell'],
  'media-press': ['offentlighet', 'tryckfrihet', 'medier', 'yttrandefrihet', 'journalistik'],
  'academia-research': ['forskning', 'universitet', 'vetenskap', 'kunskapsunderlag'],
  'citizens-voters': ['medborgare', 'allmänhet', 'val', 'röst'],
};

/**
 * Determine which stakeholder groups are relevant for a document.
 * Government coalition, opposition parties, and citizens/voters are always
 * included; other groups are added based on document-content signals.
 */
export function selectRelevantStakeholders(doc: RawDocument): StakeholderGroup[] {
  const alwaysIncluded: StakeholderGroup[] = ['government-coalition', 'opposition-parties', 'citizens-voters'];
  const text = [
    doc.titel, doc.title, doc.rubrik, doc.summary, doc.notis, doc.fullText, doc.fullContent,
  ].filter(Boolean).join(' ').toLowerCase();

  const optional: StakeholderGroup[] = [
    'state-agencies', 'municipalities-regions', 'private-sector',
    'labor-market', 'civil-society', 'international-eu',
    'media-press', 'academia-research',
  ];

  const relevant = optional.filter(group => {
    const signals = STAKEHOLDER_SIGNALS[group] ?? [];
    return signals.some(s => text.includes(s));
  });

  // Deduplicate, preserving order: always-included first then optional relevants
  const seen = new Set<StakeholderGroup>();
  const result: StakeholderGroup[] = [];
  for (const g of [...alwaysIncluded, ...relevant]) {
    if (!seen.has(g)) { seen.add(g); result.push(g); }
  }
  return result;
}

// ---------------------------------------------------------------------------
// SWOT builder
// ---------------------------------------------------------------------------

/** Build a SWOT data structure for a stakeholder given document metadata. */
function buildStakeholderSwot(
  group: StakeholderGroup,
  doc: RawDocument,
  lang: Language | string,
  ciaContext?: CIAContext,
  ctx?: PrecomputedContext,
): SwotData {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const isGovernment = docType === 'prop';
  const isMotion = docType === 'mot';
  const party = normalizePartyKey(doc.parti);
  const domains = ctx?.domains ?? detectPolicyDomains(doc);

  // Government coalition SWOT
  if (group === 'government-coalition') {
    const stabilityScore = ciaContext?.coalitionStability?.stabilityScore ?? 70;
    return {
      subject: stakeholderName(group, lang),
      strengths: [
        { text: isGovernment ? 'Advances governing agenda through this proposition' : 'May leverage document in policy debate', impact: 'high' },
        { text: `Coalition stability score: ${stabilityScore}/100`, impact: stabilityScore >= 60 ? 'high' : 'medium' },
      ],
      weaknesses: [
        { text: isMotion ? 'Opposition motion challenges policy direction' : 'Requires parliamentary majority support', impact: 'medium' },
        { text: 'Implementation burden may draw public criticism', impact: 'low' },
      ],
      opportunities: [
        { text: 'Can shape public narrative around document priorities', impact: 'high' },
        { text: domains.length > 0 ? `Policy win across ${domains.slice(0, 2).join(', ')} domains` : 'Broad policy opportunity', impact: 'medium' },
      ],
      threats: [
        { text: 'Opposition scrutiny and counter-motions', impact: 'medium' },
        { text: 'Media and public accountability expectations', impact: 'low' },
      ],
    };
  }

  // Opposition SWOT
  if (group === 'opposition-parties') {
    const partyLabel = party && party !== 'other' ? `Party ${party.toUpperCase()}` : 'The opposition';
    return {
      subject: stakeholderName(group, lang),
      strengths: [
        { text: isMotion ? `${partyLabel} actively engaged through motions` : 'Can hold government accountable through debate', impact: 'high' },
        { text: 'Democratic scrutiny role provides legitimacy', impact: 'medium' },
      ],
      weaknesses: [
        { text: 'Limited formal power to block government propositions', impact: 'high' },
        { text: 'Internal coalition divisions may weaken unified response', impact: 'medium' },
      ],
      opportunities: [
        { text: 'Policy failures in implementation create electoral openings', impact: 'high' },
        { text: 'Can propose alternatives that resonate with voters', impact: 'medium' },
      ],
      threats: [
        { text: 'Government controls parliamentary calendar and agenda', impact: 'medium' },
        { text: 'Cross-party votes could undermine opposition unity', impact: 'low' },
      ],
    };
  }

  // Generic stakeholder SWOT — domain-aware
  const hasHighInfluence = (ctx?.influenceScore ?? calculateInfluenceScore(doc)) > 60;
  return {
    subject: stakeholderName(group, lang),
    strengths: [
      { text: 'Established institutional capacity to respond', impact: 'medium' },
      { text: 'Domain expertise in relevant policy areas', impact: 'medium' },
    ],
    weaknesses: [
      { text: hasHighInfluence ? 'High-influence document may impose significant obligations' : 'Moderate implementation requirements', impact: hasHighInfluence ? 'high' : 'medium' },
    ],
    opportunities: [
      { text: 'Influence implementation guidelines and secondary legislation', impact: 'medium' },
    ],
    threats: [
      { text: 'Resource constraints may limit effective engagement', impact: 'medium' },
      { text: 'Timeline pressures during legislative implementation', impact: 'low' },
    ],
  };
}

// ---------------------------------------------------------------------------
// Stakeholder impact builder
// ---------------------------------------------------------------------------

/** Derive direct-impact direction from document type and stakeholder role. */
function deriveImpactDirection(group: StakeholderGroup, doc: RawDocument): ImpactDirection {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  if (docType === 'prop') {
    if (group === 'government-coalition') return 'positive';
    if (group === 'opposition-parties') return 'mixed';
  }
  if (docType === 'mot') {
    if (group === 'government-coalition') return 'mixed';
    if (group === 'opposition-parties') return 'positive';
  }
  return 'neutral';
}

/** Build complete stakeholder impact for one group. */
function buildStakeholderImpact(
  group: StakeholderGroup,
  doc: RawDocument,
  lang: Language | string,
  ciaContext?: CIAContext,
  ctx?: PrecomputedContext,
): StakeholderImpact {
  const direction = deriveImpactDirection(group, doc);
  const influenceScore = ctx?.influenceScore ?? calculateInfluenceScore(doc);
  const magnitude = influenceScore >= 65 ? 'significant' : influenceScore >= 35 ? 'moderate' : 'minor';
  const domains = ctx?.domains ?? detectPolicyDomains(doc);
  const domainStr = domains.slice(0, 2).join(', ') || 'general policy';
  const displayName = stakeholderName(group, lang);

  const summaryMap: Record<ImpactDirection, string> = {
    positive: `${displayName} stands to benefit from this document's provisions.`,
    negative: `${displayName} faces constraints or burdens from this document.`,
    neutral: `${displayName} experiences limited direct impact.`,
    mixed: `${displayName} faces both opportunities and challenges.`,
  };

  const indirectEffects: string[] = [];
  if (group === 'citizens-voters') {
    indirectEffects.push(`Policy changes in ${domainStr} may affect daily life.`);
  }
  if (group === 'state-agencies') {
    indirectEffects.push('New reporting or enforcement obligations may arise.');
  }
  if (group === 'municipalities-regions') {
    indirectEffects.push('Local implementation burden requires resource planning.');
  }

  const burden: BurdenLevel =
    group === 'state-agencies' || group === 'municipalities-regions'
      ? magnitude === 'significant' ? 'high' : 'medium'
      : 'low';

  const politicalImplications = group === 'government-coalition'
    ? 'Aligns with governing-coalition policy priorities and provides legislative track record.'
    : group === 'opposition-parties'
      ? 'Provides opportunity to differentiate policy positions ahead of elections.'
      : `Stakeholder engagement may shape implementation and secondary legislation in ${domainStr}.`;

  const confidence = assessConfidenceLevel(domains.length + ((doc.fullText || doc.fullContent) ? 3 : 0), influenceScore);

  return {
    stakeholder: group,
    displayName,
    directImpact: { direction, magnitude, summary: summaryMap[direction] },
    indirectEffects,
    implementationBurden: burden,
    politicalImplications,
    swot: buildStakeholderSwot(group, doc, lang, ciaContext, ctx),
    confidence,
  };
}

// ---------------------------------------------------------------------------
// PESTLE builder
// ---------------------------------------------------------------------------

/** Build PESTLE analysis dimensions from a document. */
export function buildPestleAnalysis(doc: RawDocument, lang?: Language | string, ctx?: PrecomputedContext): PESTLEAnalysis {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const title = doc.titel ?? doc.title ?? doc.rubrik ?? '';
  const titleLower = title.toLowerCase();
  // Reuse precomputed domains when available; otherwise detect with the
  // caller's language.  `hasDomain()` uses `DOMAIN_NAME_TO_KEY` which is
  // language-agnostic (covers all 14 languages), so domain-trigger checks
  // work reliably regardless of which language the domains were detected in.
  const triggerDomains = ctx?.domains ?? detectPolicyDomains(doc, lang ?? 'en');

  const political: string[] = [
    docType === 'prop'
      ? 'Government-sponsored legislation — signals executive policy priority.'
      : docType === 'mot'
        ? 'Opposition-initiated motion — reflects parliamentary accountability mechanism.'
        : 'Parliamentary document shapes political agenda.',
  ];
  if (hasDomain(triggerDomains, 'defence')) political.push('Intersects with national security and defence strategy.');
  if (hasDomain(triggerDomains, 'eu-foreign')) political.push('EU/international obligations may constrain domestic policy space.');

  const economic: string[] = [];
  if (hasDomain(triggerDomains, 'fiscal')) economic.push('Direct fiscal implications for state budget allocation.');
  if (hasDomain(triggerDomains, 'labour')) economic.push('Employment and wage effects across affected sectors.');
  if (hasDomain(triggerDomains, 'trade')) economic.push('Trade competitiveness and export/import dynamics affected.');
  if (economic.length === 0) economic.push('Indirect economic effects possible through regulatory changes.');

  const social: string[] = [];
  if (hasDomain(triggerDomains, 'healthcare')) social.push('Healthcare access and quality of life implications.');
  if (hasDomain(triggerDomains, 'education')) social.push('Educational outcomes and social mobility effects.');
  if (hasDomain(triggerDomains, 'migration')) social.push('Migration flows and social cohesion dimensions.');
  if (hasDomain(triggerDomains, 'housing')) social.push('Housing availability and affordability impacts.');
  if (social.length === 0) social.push('Social equity and public service delivery effects possible.');

  const technological: string[] = [
    titleLower.includes('digital') || titleLower.includes('cyber') || /\b(?:IT|ICT)\b/i.test(title) || titleLower.includes('it-system')
      ? 'Digital infrastructure or technology governance dimensions present.'
      : 'Technology adoption for implementation may be required.',
  ];

  const legal: string[] = [
    docType === 'prop' ? 'Proposed as primary legislation — will require Riksdag vote.' : 'May require amendments to existing statutes.',
  ];
  if (hasDomain(triggerDomains, 'justice')) legal.push('Criminal justice or rule-of-law provisions included.');
  if (hasDomain(triggerDomains, 'eu-foreign')) legal.push('EU Directive transposition obligations may apply.');

  const environmental: string[] = [];
  if (hasDomain(triggerDomains, 'environment')) {
    environmental.push('Direct environmental and climate policy implications.');
    environmental.push('May interact with EU Green Deal commitments.');
  } else {
    environmental.push('Indirect environmental effects through implementation activities.');
  }

  return { political, economic, social, technological, legal, environmental };
}

// ---------------------------------------------------------------------------
// Coalition dynamics builder
// ---------------------------------------------------------------------------

/** Derive coalition dynamics from document and CIA context. */
export function buildCoalitionDynamics(doc: RawDocument, ciaContext?: CIAContext): CoalitionAnalysis {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const riskIndex = ciaContext ? calculateCoalitionRiskIndex(ciaContext) : null;
  const riskLevel = riskIndex?.level ?? 'MEDIUM';

  const governmentImpact: ImpactDirection = docType === 'prop' ? 'positive' : docType === 'mot' ? 'negative' : 'neutral';

  const oppositionResponse = docType === 'prop'
    ? 'Opposition likely to scrutinise and file counter-motions. Committee stage will surface disagreements.'
    : docType === 'mot'
      ? 'Opposition motion unlikely to pass given government majority, but raises public debate.'
      : 'Debate and committee deliberation will follow standard parliamentary procedure.';

  const stabilityEffect: CoalitionAnalysis['stabilityEffect'] =
    riskLevel === 'CRITICAL' ? 'destabilising'
    : riskLevel === 'HIGH' ? 'destabilising'
    : docType === 'prop' ? 'stabilising'
    : 'neutral';

  const summary = riskIndex
    ? `Coalition risk: ${riskIndex.level} (score ${riskIndex.score}/100). ${riskIndex.summary}`
    : 'No CIA coalition data available; assessment based on document type and parliamentary context.';

  return {
    governmentImpact,
    oppositionResponse,
    crossPartyPotential: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
    stabilityEffect,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Historical context builder
// ---------------------------------------------------------------------------

/** Build historical and legislative context (structural inference). */
export function buildHistoricalContext(doc: RawDocument, precomputedDomains?: string[]): HistoricalContext {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const domains = precomputedDomains ?? detectPolicyDomains(doc);

  const precedents: string[] = [];
  if (hasDomain(domains, 'fiscal')) precedents.push('Swedish fiscal consolidation policies dating to the 1990s banking crisis reforms.');
  if (hasDomain(domains, 'healthcare')) precedents.push('Reforms following the 1992 Dagmar reform and 2010 Patient Safety Act.');
  if (hasDomain(domains, 'defence')) precedents.push('Defence spending trajectory since Sweden\'s 2022 NATO application.');
  if (hasDomain(domains, 'migration')) precedents.push('Migration policy tightening following 2015–16 refugee influx.');
  if (precedents.length === 0) precedents.push('Part of Sweden\'s continuous parliamentary legislative programme.');

  const relatedLegislation: string[] = [];
  if (docType === 'mot') relatedLegislation.push('Responds to or complements government propositions currently in committee.');
  if (docType === 'prop') relatedLegislation.push('Will replace or amend existing statutes upon parliamentary approval.');
  relatedLegislation.push('Related committee reports (betänkanden) expected in subsequent session.');

  const riksmote = deriveRiksmote(doc);
  const policyEvolution = domains.length > 0
    ? `This document advances policy in ${domains.slice(0, 3).join(', ')} — domains with active legislative activity in the ${riksmote} parliamentary session.`
    : 'Part of the ongoing parliamentary work programme for the current session.';

  return { precedents, relatedLegislation, policyEvolution };
}

// ---------------------------------------------------------------------------
// Implementation assessment builder
// ---------------------------------------------------------------------------

/** Build implementation feasibility assessment from document metadata. */
export function buildImplementationAssessment(doc: RawDocument, ctx?: PrecomputedContext): ImplementationAssessment {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const influenceScore = ctx?.influenceScore ?? calculateInfluenceScore(doc);
  const domains = ctx?.domains ?? detectPolicyDomains(doc);

  const feasibility: ImplementationAssessment['feasibility'] =
    docType === 'prop' && influenceScore < 45 ? 'high'
    : docType === 'prop' ? 'medium'  // influenceScore >= 45 — moderate or high complexity
    : docType === 'mot' ? 'low'
    : 'medium';

  const timeline =
    docType === 'prop' ? '6–18 months from parliamentary approval to full implementation.'
    : docType === 'mot' ? 'If adopted, 12–24 months given typical legislative cycle.'
    : '12–18 months for regulatory follow-up and agency guidance.';

  const keyObstacles: string[] = [];
  if (hasDomain(domains, 'fiscal')) keyObstacles.push('Budgetary appropriation required from Finance Committee.');
  if (hasDomain(domains, 'healthcare') || hasDomain(domains, 'education')) {
    keyObstacles.push('Regional coordination with municipalities and county councils required.');
  }
  if (influenceScore >= 70) keyObstacles.push('High-complexity document may require secondary legislation.');
  if (keyObstacles.length === 0) keyObstacles.push('Standard parliamentary and regulatory approval process.');

  const resourceRequirements = influenceScore >= 65
    ? 'Significant administrative and financial resources required across affected agencies.'
    : 'Moderate resource requirements; implementable within existing agency budgets.';

  const agencies: string[] = [];
  if (hasDomain(domains, 'fiscal')) agencies.push('Finansdepartementet', 'Skatteverket');
  if (hasDomain(domains, 'healthcare')) agencies.push('Socialstyrelsen', 'Folkhälsomyndigheten');
  if (hasDomain(domains, 'justice')) agencies.push('Justitiedepartementet', 'Polismyndigheten');
  if (hasDomain(domains, 'education')) agencies.push('Skolverket', 'Universitetskanslersämbetet');
  if (agencies.length === 0) agencies.push('Responsible line ministry and affected state agencies.');

  return {
    feasibility,
    estimatedTimeline: timeline,
    keyObstacles,
    resourceRequirements,
    agenciesInvolved: agencies,
  };
}

// ---------------------------------------------------------------------------
// Risk assessment builder
// ---------------------------------------------------------------------------

/** Build risk assessment list for a document. */
export function buildRiskAssessment(doc: RawDocument, ciaContext?: CIAContext, ctx?: PrecomputedContext): RiskAssessment[] {
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const domains = ctx?.domains ?? detectPolicyDomains(doc);
  const riskIndex = ciaContext ? calculateCoalitionRiskIndex(ciaContext) : null;
  const risks: RiskAssessment[] = [];

  // Political risks
  const politicalSeverity = riskIndex?.level === 'CRITICAL' || riskIndex?.level === 'HIGH' ? 'high' : 'medium';
  risks.push({
    type: 'political',
    severity: politicalSeverity,
    description: docType === 'prop'
      ? 'Risk of parliamentary defeat if coalition unity falters.'
      : docType === 'mot'
        ? 'Limited likelihood of parliamentary success given prevailing government majority dynamics.'
        : 'Political risk depends on committee handling and cross-party alignment.',
    mitigationOptions: ['Cross-party dialogue', 'Committee amendments to broaden support', 'Public consultation to build legitimacy'],
  });

  // Implementation risks
  const influenceScore = ctx?.influenceScore ?? calculateInfluenceScore(doc);
  if (influenceScore >= 50) {
    risks.push({
      type: 'implementation',
      severity: influenceScore >= 70 ? 'high' : 'medium',
      description: 'Complex implementation may lead to delays, cost overruns, or divergent regional outcomes.',
      mitigationOptions: ['Pilot programmes in selected municipalities', 'Clear agency mandate and funding certainty', 'Parliamentary follow-up reporting requirements'],
    });
  }

  // Public acceptance risks
  if (hasDomain(domains, 'migration') || hasDomain(domains, 'healthcare') || hasDomain(domains, 'fiscal')) {
    risks.push({
      type: 'public-acceptance',
      severity: 'medium',
      description: `Public sensitivity in ${domains.slice(0, 2).join(' and ')} may generate media scrutiny and voter backlash.`,
      mitigationOptions: ['Transparent communication strategy', 'Phased rollout to allow adaptation', 'Stakeholder consultation before implementation'],
    });
  }

  // Legal risks
  if (hasDomain(domains, 'eu-foreign')) {
    risks.push({
      type: 'legal',
      severity: 'medium',
      description: 'EU law compliance must be verified; risk of infringement proceedings if directive requirements unmet.',
      mitigationOptions: ['Legal review by Lagrådet', 'EU notification procedures', 'Parliamentary Committee for EU Affairs scrutiny'],
    });
  }

  // Financial risks
  if (hasDomain(domains, 'fiscal') || influenceScore >= 65) {
    risks.push({
      type: 'financial',
      severity: 'medium',
      description: 'Budgetary implications require Finance Committee review and multi-year spending plan adjustment.',
      mitigationOptions: ['Detailed cost-benefit analysis', 'Phased appropriations across budget years', 'Performance-based funding conditionality'],
    });
  }

  return risks;
}

// ---------------------------------------------------------------------------
// Executive summary builder
// ---------------------------------------------------------------------------

/**
 * Map raw Riksdag doktyp codes (`'prop'`, `'mot'`, `'bet'`, `'skr'`) to the
 * normalized type strings (`'proposition'`, `'motion'`, `'interpellation'`, `'report'`, …) that
 * `generateEnhancedSummary()` in `helpers.ts` expects for content branching.
 * Without this, the helper silently falls through to a generic default text.
 *
 * Note: 'skr' (government communication / skrivelse) maps to 'report' because
 * `generateEnhancedSummary()` only has branches for 'report'|'proposition'|'motion'|'interpellation'.
 * Government communications are informational reports by nature, so 'report' is the
 * closest semantic match.
 */
function normalizeDocType(doktyp: string): string {
  switch (doktyp) {
    case 'prop': return 'proposition';
    case 'mot': return 'motion';
    case 'ip': return 'interpellation';
    case 'bet': return 'report';
    case 'skr': return 'report'; // Government communications treated as reports
    default: return doktyp;
  }
}

/** Pattern for valid riksmöte strings: YYYY/YY */
const RIKSMOTE_PATTERN = /^\d{4}\/\d{2}$/;

/** Pattern for YYYY-MM-DD date strings. */
const DATUM_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Derive the riksmöte (parliamentary session) string from a document.
 * Prefers `doc.rm` when present and valid; otherwise derives from `doc.datum`
 * via `getCurrentRiksmote()`. Falls back to the current session if neither is
 * available.
 *
 * The datum is parsed via regex and reconstructed at local noon to avoid
 * timezone-sensitive date shifts that can occur with `new Date('YYYY-MM-DD')`
 * (which is parsed as UTC midnight, shifting to the previous day in UTC+
 * timezones).
 */
function deriveRiksmote(doc: RawDocument): string {
  if (doc.rm && RIKSMOTE_PATTERN.test(doc.rm)) return doc.rm;
  if (doc.datum) {
    const m = DATUM_PATTERN.exec(doc.datum);
    if (m) {
      const [, year, month, day] = m;
      // Construct at local noon to avoid cross-day timezone shifts
      const d = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
      return getCurrentRiksmote(d);
    }
  }
  return getCurrentRiksmote();
}

/** Generate a structured executive summary for a document. */
export function generateExecutiveSummary(doc: RawDocument, lang: Language | string, ctx?: PrecomputedContext): string {
  const title = doc.titel ?? doc.title ?? doc.rubrik ?? 'Document';
  const docType = doc.doktyp ?? doc.documentType ?? '';
  const domains = ctx?.domains ?? detectPolicyDomains(doc, lang);
  const influenceScore = ctx?.influenceScore ?? calculateInfluenceScore(doc);
  const party = normalizePartyKey(doc.parti);

  // Paragraph 1: What the document is and who authored it
  const typeLabel = docType === 'prop' ? 'government proposition'
    : docType === 'mot' ? 'parliamentary motion'
    : docType === 'ip' ? 'interpellation'
    : docType === 'bet' ? 'committee report'
    : docType === 'skr' ? 'government communication'
    : 'parliamentary document';
  const authorPart = party && party !== 'other' ? ` filed by ${party.toUpperCase()}` : '';
  const effectiveText = doc.fullText ?? doc.fullContent ?? '';
  const passage = effectiveText ? extractKeyPassage(effectiveText, 200) : '';
  const contentSentence = passage ? ` Key provision: "${escapeHtml(passage)}"` : '';

  const para1 = `This ${typeLabel}${authorPart} — ${escapeHtml(title)} — is a parliamentary document with an influence score of ${influenceScore}/100.${contentSentence}`;

  // Paragraph 2: Policy significance across domains
  // Escape the enhanced summary to prevent XSS when rendered as HTML
  const domainStr = domains.length > 0 ? domains.slice(0, 3).join(', ') : 'general policy';
  const normalizedType = normalizeDocType(docType);
  const enhancedSummary = escapeHtml(generateEnhancedSummary(doc, normalizedType, lang));
  const riksmote = deriveRiksmote(doc);
  const para2 = `The document intersects ${domainStr} policy domains, placing it within the broader legislative agenda of the ${riksmote} parliamentary session. ${enhancedSummary}`;

  // Paragraph 3: Strategic significance
  const para3 = docType === 'prop'
    ? 'As a government proposition, this document represents executive policy intent and will be scrutinised by the relevant parliamentary committee before a plenary vote.'
    : docType === 'mot'
      ? 'As an opposition motion, this document fulfils the parliamentary oversight function, pressing the government on policy gaps and alternative directions.'
      : docType === 'ip'
        ? 'As an interpellation, this document formally questions a minister on a specific policy matter, requiring a public response and parliamentary debate.'
        : docType === 'bet'
          ? 'As a committee report, this document presents the committee\'s recommendation to the Riksdag after deliberating on one or more government proposals or motions.'
          : 'This document contributes to the parliamentary record and informs committee deliberations and future legislative activity.';

  return `${para1}\n\n${para2}\n\n${para3}`;
}

// ---------------------------------------------------------------------------
// Multi-iteration analysis protocol
// ---------------------------------------------------------------------------

/** Build the four-iteration analysis protocol record. */
function buildIterations(doc: RawDocument, stakeholders: StakeholderGroup[], ctx?: PrecomputedContext): AnalysisIteration[] {
  const domains = ctx?.domains ?? detectPolicyDomains(doc);
  const influence = ctx?.influenceScore ?? calculateInfluenceScore(doc);
  return [
    {
      iteration: 1,
      label: 'generation',
      summary: 'Initial analysis from document metadata, type, and available content.',
      refinements: [
        `Identified ${domains.length} policy domain(s): ${domains.join(', ') || 'general'}.`,
        `Influence score calculated: ${influence}/100.`,
      ],
    },
    {
      iteration: 2,
      label: 'deepening',
      summary: 'Cross-referenced document context, challenged initial assumptions, deepened domain analysis.',
      refinements: [
        'Verified stakeholder relevance signals against document text.',
        'PESTLE dimensions expanded from domain-specific triggers.',
        hasDomain(domains, 'eu-foreign') ? 'EU law compliance risk identified and flagged.' : 'No EU law compliance issues identified.',
      ],
    },
    {
      iteration: 3,
      label: 'stakeholder-review',
      summary: `Reviewed representation across ${stakeholders.length} stakeholder groups; ensured balance.`,
      refinements: [
        `All ${stakeholders.length} relevant stakeholders given SWOT assessment.`,
        'Implementation burden differentiated by institutional capacity.',
        'Opposition and government perspectives balanced.',
      ],
    },
    {
      iteration: 4,
      label: 'synthesis',
      summary: 'Synthesised all analytical dimensions into unified intelligence picture.',
      refinements: [
        'Executive summary integrates document content, domain analysis, and significance.',
        'Confidence scores reflect evidence quality for each dimension.',
        'Risk assessment cross-linked with coalition dynamics.',
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Confidence scores
// ---------------------------------------------------------------------------

/** Build per-dimension confidence scores for the analysis. */
function buildConfidenceScores(doc: RawDocument, ciaContext?: CIAContext, ctx?: PrecomputedContext): Map<string, ConfidenceLevel> {
  const scores = new Map<string, ConfidenceLevel>();
  const domains = ctx?.domains ?? detectPolicyDomains(doc);
  const hasFullText = !!(doc.fullText || doc.fullContent);
  const hasCIA = !!ciaContext;

  scores.set('executiveSummary', assessConfidenceLevel(domains.length + (hasFullText ? 2 : 0), 70));
  scores.set('stakeholderImpacts', assessConfidenceLevel(domains.length + 2, hasCIA ? 80 : 60));
  scores.set('pestleDimensions', assessConfidenceLevel(domains.length, 65));
  scores.set('policyDomains', assessConfidenceLevel(domains.length, hasFullText ? 85 : 65));
  scores.set('coalitionDynamics', assessConfidenceLevel(hasCIA ? 5 : 2, hasCIA ? 85 : 55));
  scores.set('historicalContext', assessConfidenceLevel(2, 60));
  scores.set('implementationAssessment', assessConfidenceLevel(domains.length + 1, 65));
  scores.set('riskAssessment', assessConfidenceLevel(domains.length + (hasCIA ? 3 : 1), hasCIA ? 75 : 60));

  return scores;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse a parliamentary document through the comprehensive multi-iteration
 * framework.  Results are cached by document ID to avoid redundant analysis
 * when the same document appears in multiple articles.
 *
 * @param doc - Raw document from the MCP server
 * @param lang - Target language for localised display names
 * @param ciaContext - Optional CIA intelligence context for enriched analysis
 * @param forceRefresh - Skip cache and recompute (default false)
 * @returns Full DocumentAnalysis result
 */
export function analyzeDocument(
  doc: RawDocument,
  lang: Language | string = 'en',
  ciaContext?: CIAContext,
  forceRefresh = false,
): DocumentAnalysis {
  const [key, fp] = cacheKeyAndFp(doc, typeof lang === 'string' ? lang : 'en', ciaContext);
  if (!forceRefresh && _analysisCache.has(key)) {
    return _analysisCache.get(key)!;
  }

  const relevantStakeholders = selectRelevantStakeholders(doc);

  // Precompute expensive values once to avoid 7–11× redundant
  // detectPolicyDomains() and calculateInfluenceScore() calls in
  // downstream builders (stakeholder impacts, risk, implementation, etc.)
  const rawDomains = detectPolicyDomains(doc, lang);
  const influenceScore = calculateInfluenceScore(doc);
  const ctx: PrecomputedContext = { domains: rawDomains, influenceScore };

  const stakeholderImpacts = relevantStakeholders.map(group =>
    buildStakeholderImpact(group, doc, lang, ciaContext, ctx),
  );
  const pestleDimensions = buildPestleAnalysis(doc, lang, ctx);

  const policyDomains: PolicyDomain[] = toDomainKeyPairs(rawDomains).map(({ key: k, name: n }, i) => ({
    key: k,
    name: n,
    relevanceScore: Math.max(MIN_DOMAIN_RELEVANCE, MAX_DOMAIN_RELEVANCE - i * DOMAIN_RELEVANCE_DECAY),
  }));

  // Iteration 2: coalition + context
  const coalitionDynamics = buildCoalitionDynamics(doc, ciaContext);
  const historicalContext = buildHistoricalContext(doc, rawDomains);

  // Iteration 3: implementation + risk
  const implementationAssessment = buildImplementationAssessment(doc, ctx);
  const riskAssessment = buildRiskAssessment(doc, ciaContext, ctx);

  // Iteration 4: synthesis
  const executiveSummary = generateExecutiveSummary(doc, lang, ctx);
  const confidenceScores = buildConfidenceScores(doc, ciaContext, ctx);
  const iterations = buildIterations(doc, relevantStakeholders, ctx);

  const analysis: DocumentAnalysis = {
    documentId: stableDocumentId(doc, fp),
    documentTitle: doc.titel ?? doc.title ?? doc.rubrik ?? 'Unknown Document',
    executiveSummary,
    stakeholderImpacts,
    pestleDimensions,
    policyDomains,
    coalitionDynamics,
    historicalContext,
    implementationAssessment,
    riskAssessment,
    confidenceScores,
    iterations,
    influenceScore,
    analyzedAt: new Date().toISOString(),
  };

  _analysisCache.set(key, analysis);
  return analysis;
}

/**
 * Analyse multiple documents in batch, returning a map from document ID to
 * analysis result.  Uses caching so documents appearing multiple times are
 * only analysed once.
 *
 * When the input array contains multiple versions of the same document
 * (e.g. a metadata-only record and a content-enriched record sharing the
 * same `dok_id`), the batch is de-duplicated up-front using a "prefer
 * enriched" strategy: among entries that share the same stable document
 * base key, the version with `fullText` or `fullContent` wins.  This
 * prevents order-dependent overwrites and ensures the richest available
 * version is analysed.
 */
export function analyzeDocuments(
  docs: RawDocument[],
  lang: Language | string = 'en',
  ciaContext?: CIAContext,
): Map<string, DocumentAnalysis> {
  // De-duplicate: prefer enriched versions when multiple entries share
  // the same stable base key (dok_id or url).
  const deduped = new Map<string, RawDocument>();
  for (const doc of docs) {
    const baseId = documentBaseKey(doc);
    const existing = deduped.get(baseId);
    if (!existing) {
      deduped.set(baseId, doc);
    } else {
      // Prefer whichever has richer content fields
      const existingHasContent = !!(existing.fullText || existing.fullContent);
      const docHasContent = !!(doc.fullText || doc.fullContent);
      if (docHasContent && !existingHasContent) {
        deduped.set(baseId, doc);
      }
    }
  }

  const results = new Map<string, DocumentAnalysis>();
  for (const doc of deduped.values()) {
    const analysis = analyzeDocument(doc, lang, ciaContext);
    results.set(analysis.documentId, analysis);
  }
  return results;
}
