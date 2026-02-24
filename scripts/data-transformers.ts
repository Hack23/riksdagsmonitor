/**
 * @module Intelligence Operations/Data Transformation Pipeline
 * @category Intelligence Operations - Intelligence Data Transformation
 * 
 * @description
 * Core data transformation pipeline converting raw MCP server responses into
 * structured intelligence article content. This module implements advanced semantic
 * processing algorithms for legislative data, parliamentary event analysis, and
 * multi-dimensional data mapping for automated journalism.
 * 
 * The transformation pipeline provides four specialized processing stages:
 * 
 * Stage 1 - Calendar Event Processing (transformCalendarToEventGrid):
 * Transforms raw calendar data from riksdag-regering-mcp into structured event grid
 * suitable for visual presentation. Handles multiple timestamp formats (MCP responses
 * may use 'datum', 'from', 'start' fields), performs temporal normalization, and
 * groups events by date for calendar visualization. Implements date comparison logic
 * for marking "today" events with visual indicators.
 * 
 * Stage 2 - Document Content Generation (generateArticleContent):
 * Processes structured parliamentary documents into narrative article prose. Maps
 * document types (propositions, motions, reports) to narrative structures, extracts
 * semantic meaning from legislative language, and generates coherent paragraphs
 * suitable for journalist review. Applies natural language processing techniques
 * for readability optimization and audience targeting.
 * 
 * Stage 3 - Intelligence Extraction (extractWatchPoints):
 * Performs analytical extraction of critical intelligence points from parliamentary
 * data. Identifies policy implications, fiscal impacts, timeline constraints, and
 * political risk factors. Uses rule-based analysis for common legislative patterns
 * (votes, committee decisions, government actions) and produces structured watch
 * points for inclusion in article "watch sections".
 * 
 * Stage 4 - Metadata Generation (generateMetadata, calculateReadTime, generateSources):
 * Synthesizes article metadata including publication date, author attribution, reading
 * time estimates, source citations, and SEO keywords. Generates machine-readable
 * metadata for structured data (Schema.org JSON-LD) and social media sharing.
 * 
 * Supported Data Types:
 * - Calendar events (committee meetings, plenary sessions, parliamentary breaks)
 * - Legislative documents (propositions, motions, parliamentary inquiries)
 * - Voting records (roll-call votes with party/member positions)
 * - Government announcements (press releases, policy documents, ministerial statements)
 * - Committee reports (analysis, recommendations, decisions)
 * - Debate transcripts (parliamentary speeches with speaker context)
 * 
 * Multi-Language Processing:
 * - Swedish source content transformation into 14 target languages
 * - Terminology mapping for political/legal concepts
 * - Date formatting and timezone adjustment per target language
 * - Pluralization and grammatical agreement handling
 * - RTL language support for Arabic and Hebrew output
 * 
 * Data Validation & Quality Assurance:
 * - Schema validation against CIA data model definitions
 * - Null/undefined field handling with intelligent fallbacks
 * - Temporal consistency checking (dates in correct order)
 * - Cross-reference validation (referenced documents exist)
 * - Semantic completeness assessment
 * 
 * @intelligence
 * Semantic Processing Methodology:
 * 
 * Legislative Intent Analysis:
 * Extracts implicit meaning from formal parliamentary language through:
 * - Keyword detection for policy domains (fiscal, healthcare, defense, etc.)
 * - Stakeholder identification (ministries, agencies, party groups)
 * - Impact type classification (regulatory, fiscal, social)
 * - Timeline extraction (implementation dates, decision deadlines)
 * - Precedent linking (related historical legislative actions)
 * 
 * Party Position Inference:
 * Maps voting records and committee recommendations to political positions:
 * - Consensus detection (all parties agree vs. split votes)
 * - Coalition formation analysis (which parties vote together)
 * - Opposition mapping (which parties consistently oppose)
 * - Swing vote identification (MPs changing position across votes)
 * 
 * Risk Indicator Extraction:
 * Identifies critical intelligence points:
 * - Fiscal implications and budget impacts
 * - Timeline constraints and urgent decisions
 * - Stakeholder conflicts and controversy indicators
 * - Implementation risks and dependency chains
 * - Political feasibility assessments
 * 
 * Content Generation Patterns:
 * - Inverted pyramid structure (most important facts first)
 * - Narrative coherence preservation across transformations
 * - Tone consistency (journalistic neutrality in automated output)
 * - Rhetorical device detection and adaptation
 * 
 * @osint
 * Source Data Processing Strategies:
 * 
 * MCP API Response Handling:
 * - Graceful handling of incomplete or malformed MCP responses
 * - Field mapping flexibility for varying API versions
 * - Timestamp normalization across multiple formats
 * - Array and object structure flattening for template consumption
 * 
 * Data Quality Assessment:
 * - Completeness scoring (what percentage of fields populated?)
 * - Freshness validation (data collection timestamp vs. processing time)
 * - Consistency checking (cross-field validation)
 * - Accuracy verification (comparison against official sources where possible)
 * 
 * Source Attribution:
 * - MCP tool reference tracking (which API call produced this data?)
 * - Data timestamp preservation (when was this data collected?)
 * - Source URL generation for primary documents
 * - Author/department attribution for government documents
 * 
 * @risk
 * Data Transformation Risks & Mitigations:
 * 
 * Threat: Semantic Loss in Translation
 * - Complex political concepts losing nuance in transformation
 * - Mitigation: Preserve original language for key terms, human review process
 * 
 * Threat: Data Hallucination
 * - Algorithm generating plausible but incorrect inferences
 * - Mitigation: Strict fact-based extraction, no speculative inference
 * 
 * Threat: Timestamp Ambiguity
 * - Multiple timestamp fields with different meanings causing confusion
 * - Mitigation: Explicit field mapping, validation against known formats
 * 
 * Threat: Array Data Loss
 * - Simplified array flattening losing important structure
 * - Mitigation: Preserve hierarchical structure in intermediate representations
 * 
 * Threat: Language Pair Incompleteness
 * - Missing translations causing incomplete or English article fallback
 * - Mitigation: Fallback chain (target > Swedish > English), quality validation
 * 
 * @gdpr
 * Data Processing Compliance:
 * 
 * - Personal Data Exclusion:
 *   * Exclude contact information, addresses, phone numbers
 *   * Exclude email addresses and social media handles
 *   * Process public officials in official capacity only
 * 
 * - Data Minimization:
 *   * Extract only necessary fields for article generation
 *   * Remove internal government identifiers and batch IDs
 *   * Exclude audit logs and technical metadata
 * 
 * - Purpose Limitation:
 *   * Generate public articles only
 *   * No profiling or behavioral analysis
 *   * No commercial use beyond journalism platform
 * 
 * - Processing Transparency:
 *   * Document all transformation rules
 *   * Publish source attribution with articles
 *   * Maintain audit trail via Git
 * 
 * @security
 * Content Security Implementation:
 * 
 * Input Validation:
 * - Type checking for all input parameters
 * - Array/object structure validation before processing
 * - String content sanitization via escapeHtml()
 * - Numeric field validation (dates, counts, percentages)
 * 
 * Output Encoding:
 * - HTML entity escaping for all narrative text
 * - URL encoding for generated links
 * - No code injection vectors in generated content
 * - CSS selector sanitization for class/ID generation
 * 
 * Dependency Security:
 * - html-utils module provides sanitization
 * - No eval() or Function() constructor usage
 * - No dynamic require() or import() patterns
 * - Direct module imports only
 * 
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 2.0.0
 * 
 * @see {@link ./mcp-client.js} MCP API client providing raw data
 * @see {@link ./article-template.js} Template rendering consuming transformed data
 * @see {@link ./generate-news-enhanced.js} Article generation orchestration
 * @see {@link ./html-utils.js} HTML sanitization (escapeHtml)
 * @see {@link docs/DATA_TRANSFORMATION_GUIDE.md} Detailed transformation algorithms
 * @see {@link docs/MCP_DATA_SCHEMA.md} MCP response schema definitions
 * @see {@link docs/INTELLIGENCE_EXTRACTION.md} Intelligence analysis methodology
 */

import { escapeHtml } from './html-utils.js';
import type { Language } from './types/language.js';
import type { ContentLabelSet, CommitteeName, CommitteeNameMap } from './types/content.js';
import type { EventGridItem, WatchPoint, ArticleMetadata, ArticleType } from './types/article.js';

/**
 * Sanitize a URL for safe use in href attributes.
 * Rejects javascript:, data:, vbscript: schemes and returns '#' for invalid URLs.
 * Also escapes HTML attribute characters in the URL.
 */
function sanitizeUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  // Block dangerous schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  // Only allow http, https, and relative URLs
  if (/^[a-z]+:/i.test(trimmed) && !/^https?:/i.test(trimmed)) return '#';
  // Escape HTML attribute characters
  return trimmed.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Emit a Swedish-language span.
 *
 * For Swedish articles (`lang === 'sv'`) the span carries both the
 * `lang="sv"` accessibility attribute AND `data-translate="true"` so
 * quality-validation tooling can verify that Swedish articles contain the
 * original text.
 *
 * For **all other** languages the span carries only `lang="sv"` (screen
 * readers still know the text is Swedish) but the `data-translate` marker is
 * intentionally omitted — it signals "this text should be translated" but no
 * client-side translation mechanism exists, so the marker only causes false
 * validation failures in non-Swedish articles.
 *
 * @param escapedText - Already HTML-escaped text content
 * @param lang        - Target article language (e.g. `'sv'`, `'en'`)
 */
function svSpan(escapedText: string, lang: Language | string): string {
  if (lang === 'sv') {
    return `<span data-translate="true" lang="sv">${escapedText}</span>`;
  }
  return `<span lang="sv">${escapedText}</span>`;
}

// ---------------------------------------------------------------------------
// Data interfaces shared with news-type modules
// ---------------------------------------------------------------------------

/** Raw calendar event from MCP server */
export interface RawCalendarEvent {
  datum?: string;
  from?: string;
  start?: string;
  tid?: string;
  time?: string;
  rubrik?: string;
  titel?: string;
  title?: string;
  description?: string;
  details?: string;
  dayName?: string;
}

/** Raw document from MCP server */
export interface RawDocument {
  doktyp?: string;
  organ?: string;
  committee?: string;
  titel?: string;
  rubrik?: string;
  undertitel?: string;
  title?: string;
  dokumentnamn?: string;
  dok_id?: string;
  subtyp?: string;
  subtype?: string;
  documentType?: string;
  url?: string;
  summary?: string;
  notis?: string;
  intressent_namn?: string;
  author?: string;
  parti?: string;
  /** Full document text loaded via get_dokument_innehall */
  fullText?: string;
  /** Full document HTML content from API */
  fullContent?: string;
  /** Whether this document was enriched with full content */
  contentFetched?: boolean;
  /** Related speeches mentioning this document */
  speeches?: Array<{ talare?: string; parti?: string; text?: string; anforande_nummer?: string }>;
}

/** CIA intelligence context for enriching analysis */
export interface CIAContext {
  partyPerformance: Array<{
    id: string;
    partyName: string;
    metrics: { seats: number; successRate: number; motionsSubmitted: number; motionsPassed: number; cohesionScore?: number };
    trends: { supportTrend: string; activityTrend: string };
  }>;
  coalitionStability: { stabilityScore: number; riskLevel: string; defectionProbability: number; majorityMargin: number };
  votingPatterns: { keyIssues: Array<{ topic: string; coalitionAlignment: number; oppositionAlignment: number; crossPartyVotes: number }> };
  overallMotionDenialRate: number; /** percentage of motions denied (typically 99%+) */
}

/** Week ahead data structure */
export interface WeekAheadData {
  events: RawCalendarEvent[];
  highlights?: Array<{ title: string; description: string }>;
  context?: string;
  /** Upcoming legislative documents — used when calendar is empty */
  documents?: RawDocument[];
  /** Parliamentary written questions (fragor) for the coming period */
  questions?: RawDocument[];
  /** Parliamentary interpellations (interpellationer) for the coming period */
  interpellations?: RawDocument[];
}

/** Article generation data */
export interface ArticleContentData {
  events?: RawCalendarEvent[];
  reports?: RawDocument[];
  propositions?: RawDocument[];
  motions?: RawDocument[];
  documents?: RawDocument[];
  highlights?: Array<{ title: string; description: string }>;
  context?: string;
  /** CIA intelligence context for enriched analysis */
  ciaContext?: CIAContext;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Map of custom locale codes to Intl-compatible locale strings
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en-GB', sv: 'sv-SE', da: 'da-DK', no: 'no-NO', fi: 'fi-FI',
  de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', ar: 'ar-SA',
  he: 'he-IL', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN'
};

/**
 * Map Swedish committee codes to full names for richer descriptions
 */
const COMMITTEE_NAMES: CommitteeNameMap = {
  AU: { en: 'Labour Market Committee', sv: 'Arbetsmarknadsutskottet' },
  CU: { en: 'Civil Affairs Committee', sv: 'Civilutskottet' },
  FiU: { en: 'Finance Committee', sv: 'Finansutskottet' },
  FöU: { en: 'Defence Committee', sv: 'Försvarsutskottet' },
  JuU: { en: 'Justice Committee', sv: 'Justitieutskottet' },
  KU: { en: 'Constitutional Committee', sv: 'Konstitutionsutskottet' },
  KrU: { en: 'Cultural Affairs Committee', sv: 'Kulturutskottet' },
  MJU: { en: 'Environment and Agriculture Committee', sv: 'Miljö- och jordbruksutskottet' },
  NU: { en: 'Industry and Trade Committee', sv: 'Näringsutskottet' },
  SkU: { en: 'Taxation Committee', sv: 'Skatteutskottet' },
  SfU: { en: 'Social Insurance Committee', sv: 'Socialförsäkringsutskottet' },
  SoU: { en: 'Social Committee', sv: 'Socialutskottet' },
  TU: { en: 'Transport Committee', sv: 'Trafikutskottet' },
  UbU: { en: 'Education Committee', sv: 'Utbildningsutskottet' },
  UU: { en: 'Foreign Affairs Committee', sv: 'Utrikesutskottet' },
};

// Multi-language labels for content generation
export const CONTENT_LABELS: Record<Language, ContentLabelSet> = {
  en: {
    whyMatters: 'Why This Week Matters',
    whyMattersDefault: 'This week features significant parliamentary activity with key debates, committee meetings, and government consultations that will shape Sweden\'s political landscape.',
    keyEvents: 'Key Events This Week',
    whatToWatch: 'What to Watch',
    latestReports: 'Latest Committee Reports',
    noReports: 'No committee reports available at this time.',
    committee: 'Committee', document: 'Document',
    reportDefault: 'Committee report on parliamentary matter.',
    govProps: 'Government Propositions',
    noProps: 'No government propositions available at this time.',
    propDefault: 'Government proposal to Parliament.',
    oppMotions: 'Opposition Motions',
    noMotions: 'No opposition motions available at this time.',
    author: 'Author', party: 'Party',
    motionDefault: 'Parliamentary motion by opposition member.',
    genericContent: 'Content generation in progress.',
    monitorDev: 'Monitor developments and outcomes',
    committeeDebates: 'Committee Debates',
    committeeDebatesDesc: (n: number): string => `${n} committee reports scheduled for chamber debate`,
    govProposals: 'Government Proposals',
    govProposalsDesc: (n: number): string => `${n} new government propositions under review`,
    weekAhead: 'Week Ahead', committeeReportsTag: 'Committee Reports',
    govPropsTag: 'Government Propositions', oppMotionsTag: 'Opposition Motions',
    // Enhanced summary labels
    committeeReport: 'committee report',
    on: 'on',
    governmentProposition: 'Government proposition',
    regarding: 'regarding',
    referredTo: 'referred to',
    motionBy: 'Motion by',
    parliamentaryMotion: 'Parliamentary motion',
    unknown: 'Unknown',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `The Swedish Parliament's committees have published ${n} new reports, reflecting ongoing legislative work across multiple policy areas.`,
    reportSignificance: 'This report addresses',
    readFullReport: 'Read the full report',
    propsOverview: (n: number): string => `The government has submitted ${n} new propositions to Parliament, each requiring committee review and chamber debate before potential adoption.`,
    propSignificance: 'This proposition concerns',
    readFullProp: 'Read the full proposition',
    motionsOverview: (n: number): string => `Opposition MPs have filed ${n} new motions, pressing the government on issues ranging across policy domains.`,
    motionSignificance: 'This motion addresses',
    readFullMotion: 'Read the full motion',
    policyContext: 'Policy context',
    filedBy: 'Filed by',
    politicalContext: 'Political Context',
    policyImplications: 'Policy Implications',
    keyTakeaways: 'Key Takeaways',
    thematicAnalysis: 'Thematic Analysis',
    legislativePipeline: 'Legislative Pipeline',
    oppositionStrategy: 'Opposition Strategy',
    coalitionDynamics: 'Coalition Dynamics',
    whatThisMeans: 'What This Means',
    whyItMatters: 'Why It Matters',
    committeeBreakdown: (n: number, c: number): string => `This batch of ${n} committee reports spans ${c} different committees, reflecting the breadth of legislative activity in the current parliamentary session. The thematic spread reveals the Riksdag's multi-front policy engagement and the government's legislative priorities.`,
    propsBreakdown: (n: number): string => `The government has submitted ${n} new propositions, signalling its policy priorities and the pace of its legislative agenda. Each proposition must navigate committee review and chamber debate, providing insight into the coalition's strategic direction and its ability to build cross-party support.`,
    motionsBreakdown: (n: number): string => `Opposition MPs have filed ${n} new motions, mapping the political fault lines in the current Riksdag. These motions reveal not just policy disagreements but the strategic positioning of parties as they prepare for the next electoral contest.`
,
    committeeCountContext: (n: number): string => `${n} reports from this committee signal intensive legislative work within its portfolio.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Parliamentary committees have been active across ${committees} and ${extra} further policy domains.` : `Parliamentary committees have been active across ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `A total of ${n} reports demonstrates sustained legislative momentum and ongoing policy prioritisation.`,
    oppositionStrategyContext: (n: number): string => `Motions from ${n} different parties reveal the breadth of opposition political criticism and alternative policy agendas.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `These ${propCount} propositions touch on ${domainCount} policy domain${domainCount > 1 ? 's' : ''}, demonstrating the government's broad legislative ambition. Committee review and chamber debate will determine whether these proposals command sufficient support to become law.`,
    genericOverview: (n: number): string => `During this period, ${n} documents were processed in parliament, offering a snapshot of ongoing legislative work.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} motion${n > 1 ? 's' : ''} filed`,
    otherCommittee: 'Other committees',
    otherDocuments: 'Other documents',
    policySignificanceTouches: (domains: string): string => `Touches on ${domains}.`,
    policySignificanceGeneric: 'Requires committee review and chamber debate before a decision is reached.',
    generalMatters: 'General matters',
    responsesToProp: 'Responses to Government Propositions',
    independentMotions: 'Independent Motions'
  },
  sv: {
    whyMatters: 'Varför denna vecka är viktig',
    whyMattersDefault: 'Denna vecka innehåller betydande parlamentarisk aktivitet med viktiga debatter, kommittémöten och regeringskonsultationer som kommer att forma Sveriges politiska landskap.',
    keyEvents: 'Nyckelhändelser denna vecka',
    whatToWatch: 'Vad man ska följa',
    latestReports: 'Senaste kommittérapporter',
    noReports: 'Inga kommittérapporter tillgängliga för tillfället.',
    committee: 'Kommitté', document: 'Dokument',
    reportDefault: 'Kommittérapport om riksdagsärende.',
    govProps: 'Regeringens propositioner',
    noProps: 'Inga regeringspropositioner tillgängliga för tillfället.',
    propDefault: 'Regeringens förslag till riksdagen.',
    oppMotions: 'Oppositionens motioner',
    noMotions: 'Inga oppositionsmotioner tillgängliga för tillfället.',
    author: 'Författare', party: 'Parti',
    motionDefault: 'Riksdagsmotion av oppositionsmedlem.',
    genericContent: 'Innehållsgenerering pågår.',
    monitorDev: 'Övervaka utveckling och resultat',
    committeeDebates: 'Kommittédebatter',
    committeeDebatesDesc: (n: number): string => `${n} kommittérapporter planerade för kammarens debatt`,
    govProposals: 'Regeringsförslag',
    govProposalsDesc: (n: number): string => `${n} nya regeringspropositioner under granskning`,
    weekAhead: 'Veckan som kommer', committeeReportsTag: 'Kommittérapporter',
    govPropsTag: 'Regeringens propositioner', oppMotionsTag: 'Oppositionens motioner',
    // Enhanced summary labels
    committeeReport: 'kommittérapport',
    on: 'om',
    governmentProposition: 'Regeringens proposition',
    regarding: 'angående',
    referredTo: 'hänvisad till',
    motionBy: 'Motion av',
    parliamentaryMotion: 'Riksdagsmotion',
    unknown: 'Okänd',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Riksdagens utskott har publicerat ${n} nya betänkanden som speglar det pågående lagstiftningsarbetet inom flera politikområden.`,
    reportSignificance: 'Detta betänkande behandlar',
    readFullReport: 'Läs hela betänkandet',
    propsOverview: (n: number): string => `Regeringen har överlämnat ${n} nya propositioner till riksdagen, var och en kräver utskottsbehandling och kammardebatt.`,
    propSignificance: 'Denna proposition avser',
    readFullProp: 'Läs hela propositionen',
    motionsOverview: (n: number): string => `Oppositionsriksdagsledamöter har lämnat in ${n} nya motioner som pressar regeringen inom flera politikområden.`,
    motionSignificance: 'Denna motion behandlar',
    readFullMotion: 'Läs hela motionen',
    policyContext: 'Politisk kontext',
    filedBy: 'Inlämnad av',
    politicalContext: 'Politisk kontext',
    policyImplications: 'Politiska konsekvenser',
    keyTakeaways: 'Centrala slutsatser',
    thematicAnalysis: 'Tematisk analys',
    legislativePipeline: 'Lagstiftningsprocess',
    oppositionStrategy: 'Oppositionens strategi',
    coalitionDynamics: 'Koalitionsdynamik',
    whatThisMeans: 'Vad detta innebär',
    whyItMatters: 'Varför det spelar roll',
    committeeBreakdown: (n: number, c: number): string => `Denna omgång med ${n} utskottsbetänkanden omfattar ${c} olika utskott, vilket speglar bredden i riksdagens lagstiftningsarbete under innevarande session.`,
    propsBreakdown: (n: number): string => `Regeringen har överlämnat ${n} nya propositioner, som signalerar dess politiska prioriteringar och takten i den lagstiftande agendan.`,
    motionsBreakdown: (n: number): string => `Oppositionsledamöter har lämnat in ${n} nya motioner som kartlägger de politiska skiljelinjerna i nuvarande riksdag.`
,
    committeeCountContext: (n: number): string => `${n} betänkanden från detta utskott signalerar intensivt lagstiftningsarbete inom dess ansvarsområde.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Riksdagens utskott har varit aktiva inom ${committees} och ${extra} ytterligare områden.` : `Riksdagens utskott har varit aktiva inom ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `Totalt ${n} betänkanden visar lagstiftande momentum och pågående politisk prioritering.`,
    oppositionStrategyContext: (n: number): string => `Motioner från ${n} olika partier visar bredden i oppositionens politiska kritik och alternativa agenda.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Dessa ${propCount} propositioner berör ${domainCount} politikområde${domainCount > 1 ? 'n' : ''}, vilket visar regeringens breda lagstiftningsambition. Utskottsbehandling och kammardebatt avgör om förslagen vinner tillräckligt stöd för att bli lag.`,
    genericOverview: (n: number): string => `Under perioden har ${n} dokument behandlats i riksdagen, vilket ger en bild av det pågående lagstiftningsarbetet.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} motion${n > 1 ? 'er' : ''} inlämnade`,
    otherCommittee: 'Övriga utskott',
    otherDocuments: 'Övriga dokument',
    policySignificanceTouches: (domains: string): string => `Berör ${domains}.`,
    policySignificanceGeneric: 'Kräver utskottsbehandling och kammardebatt innan beslut fattas.',
    generalMatters: 'Övriga frågor',
    responsesToProp: 'Svar på propositioner',
    independentMotions: 'Övriga motioner'
  },
  da: {
    whyMatters: 'Hvorfor denne uge er vigtig',
    whyMattersDefault: 'Denne uge byder på vigtig parlamentarisk aktivitet med centrale debatter, udvalgsmøder og regeringskonsultationer.',
    keyEvents: 'Vigtige begivenheder denne uge',
    whatToWatch: 'Hvad man skal følge',
    latestReports: 'Seneste udvalgsbetænkninger',
    noReports: 'Ingen udvalgsbetænkninger tilgængelige på nuværende tidspunkt.',
    committee: 'Udvalg', document: 'Dokument',
    reportDefault: 'Udvalgsbetænkning om parlamentarisk sag.',
    govProps: 'Regeringsforslag',
    noProps: 'Ingen regeringsforslag tilgængelige på nuværende tidspunkt.',
    propDefault: 'Regeringsforslag til parlamentet.',
    oppMotions: 'Oppositionsforslag',
    noMotions: 'Ingen oppositionsforslag tilgængelige på nuværende tidspunkt.',
    author: 'Forfatter', party: 'Parti',
    motionDefault: 'Parlamentarisk forslag fra oppositionsmedlem.',
    genericContent: 'Indhold genereres.',
    monitorDev: 'Overvåg udviklingen og resultaterne',
    committeeDebates: 'Udvalgsedebatter',
    committeeDebatesDesc: (n: number): string => `${n} udvalgsbetænkninger planlagt til kammerdebat`,
    govProposals: 'Regeringsforslag',
    govProposalsDesc: (n: number): string => `${n} nye regeringsforslag under behandling`,
    weekAhead: 'Ugen fremover', committeeReportsTag: 'Udvalgsbetænkninger',
    govPropsTag: 'Regeringsforslag', oppMotionsTag: 'Oppositionsforslag',
    // Enhanced summary labels
    committeeReport: 'udvalgsbetænkning',
    on: 'om',
    governmentProposition: 'Regeringsforslag',
    regarding: 'vedrørende',
    referredTo: 'henvist til',
    motionBy: 'Forslag fra',
    parliamentaryMotion: 'Parlamentarisk forslag',
    unknown: 'Ukendt',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Sverigesrigsdagens udvalg har offentliggjort ${n} nye betænkninger, der afspejler igangværende lovgivningsarbejde.`,
    reportSignificance: 'Denne betænkning omhandler',
    readFullReport: 'Læs hele betænkningen',
    propsOverview: (n: number): string => `Regeringen har fremsat ${n} nye lovforslag til parlamentet.`,
    propSignificance: 'Dette forslag vedrører',
    readFullProp: 'Læs hele forslaget',
    motionsOverview: (n: number): string => `Oppositionsmedlemmer har indgivet ${n} nye forslag.`,
    motionSignificance: 'Dette forslag omhandler',
    readFullMotion: 'Læs hele forslaget',
    policyContext: 'Politisk kontekst',
    filedBy: 'Indgivet af',
    politicalContext: 'Politisk kontekst',
    policyImplications: 'Politiske konsekvenser',
    keyTakeaways: 'Centrale konklusioner',
    thematicAnalysis: 'Tematisk analyse',
    legislativePipeline: 'Lovgivningsprocessen',
    oppositionStrategy: 'Oppositionens strategi',
    coalitionDynamics: 'Koalitionsdynamik',
    whatThisMeans: 'Hvad dette betyder',
    whyItMatters: 'Hvorfor det er vigtigt',
    committeeBreakdown: (n: number, c: number): string => `Denne omgang med ${n} udvalgsbetænkninger dækker ${c} forskellige udvalg.`,
    propsBreakdown: (n: number): string => `Regeringen har fremsat ${n} nye lovforslag.`,
    motionsBreakdown: (n: number): string => `Oppositionsmedlemmer har indgivet ${n} nye forslag.`
,
    committeeCountContext: (n: number): string => `${n} betænkninger fra dette udvalg signalerer intensivt lovgivningsarbejde.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Parlamentets udvalg har været aktive inden for ${committees} og ${extra} yderligere politikområder.` : `Parlamentets udvalg har været aktive inden for ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `I alt ${n} betænkninger viser vedvarende lovgivningsmæssig fremdrift.`,
    oppositionStrategyContext: (n: number): string => `Forslag fra ${n} forskellige partier viser bredden i oppositionens politiske kritik.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Disse ${propCount} lovforslag berører ${domainCount} politikområde${domainCount > 1 ? 'r' : ''}, hvilket viser regeringens brede lovgivningsambition.`,
    genericOverview: (n: number): string => `I denne periode er ${n} dokumenter blevet behandlet i parlamentet.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} forslag indgivet`,
    otherCommittee: 'Andre udvalg',
    otherDocuments: 'Andre dokumenter',
    policySignificanceTouches: (domains: string): string => `Berører ${domains}.`,
    policySignificanceGeneric: 'Kræver udvalgsbehandling og kammerdebat, før der træffes afgørelse.',
    generalMatters: 'Generelle spørgsmål',
    responsesToProp: 'Svar på regeringsforslag',
    independentMotions: 'Andre forslag'
  },
  no: {
    whyMatters: 'Hvorfor denne uken er viktig',
    whyMattersDefault: 'Denne uken byr på viktig parlamentarisk aktivitet med sentrale debatter, komitémøter og regjeringskonsultasjoner.',
    keyEvents: 'Viktige hendelser denne uken',
    whatToWatch: 'Hva man bør følge med på',
    latestReports: 'Siste komitéinnstillinger',
    noReports: 'Ingen komitéinnstillinger tilgjengelige for øyeblikket.',
    committee: 'Komité', document: 'Dokument',
    reportDefault: 'Komitéinnstilling om parlamentarisk sak.',
    govProps: 'Regjeringens proposisjoner',
    noProps: 'Ingen regjeringsproposisjoner tilgjengelige for øyeblikket.',
    propDefault: 'Regjeringens forslag til parlamentet.',
    oppMotions: 'Opposisjonsforslag',
    noMotions: 'Ingen opposisjonsforslag tilgjengelige for øyeblikket.',
    author: 'Forfatter', party: 'Parti',
    motionDefault: 'Parlamentarisk forslag fra opposisjonsmedlem.',
    genericContent: 'Innholdsgenerering pågår.',
    monitorDev: 'Overvåk utviklingen og resultatene',
    committeeDebates: 'Komitédebatter',
    committeeDebatesDesc: (n: number): string => `${n} komitéinnstillinger planlagt for kammerdebatt`,
    govProposals: 'Regjeringsforslag',
    govProposalsDesc: (n: number): string => `${n} nye regjeringsproposisjoner under vurdering`,
    weekAhead: 'Uke fremover', committeeReportsTag: 'Komitéinnstillinger',
    govPropsTag: 'Regjeringens proposisjoner', oppMotionsTag: 'Opposisjonsforslag',
    // Enhanced summary labels
    committeeReport: 'komitéinnstilling',
    on: 'om',
    governmentProposition: 'Regjeringens proposisjon',
    regarding: 'vedrørende',
    referredTo: 'henvist til',
    motionBy: 'Forslag fra',
    parliamentaryMotion: 'Parlamentarisk forslag',
    unknown: 'Ukjent',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Den svenske riksdagens komiteer har publisert ${n} nye innstillinger som gjenspeiler pågående lovgivningsarbeid.`,
    reportSignificance: 'Denne innstillingen omhandler',
    readFullReport: 'Les hele innstillingen',
    propsOverview: (n: number): string => `Regjeringen har fremmet ${n} nye proposisjoner til Stortinget.`,
    propSignificance: 'Denne proposisjonen gjelder',
    readFullProp: 'Les hele proposisjonen',
    motionsOverview: (n: number): string => `Opposisjonsmedlemmer har fremmet ${n} nye forslag.`,
    motionSignificance: 'Dette forslaget omhandler',
    readFullMotion: 'Les hele forslaget',
    policyContext: 'Politisk kontekst',
    filedBy: 'Innsendt av',
    politicalContext: 'Politisk kontekst',
    policyImplications: 'Politiske konsekvenser',
    keyTakeaways: 'Sentrale konklusjoner',
    thematicAnalysis: 'Tematisk analyse',
    legislativePipeline: 'Lovgivningsprosessen',
    oppositionStrategy: 'Opposisjonens strategi',
    coalitionDynamics: 'Koalisjonsdynamikk',
    whatThisMeans: 'Hva dette betyr',
    whyItMatters: 'Hvorfor det er viktig',
    committeeBreakdown: (n: number, c: number): string => `Denne runden med ${n} komitéinnstillinger dekker ${c} forskjellige komiteer.`,
    propsBreakdown: (n: number): string => `Regjeringen har fremmet ${n} nye proposisjoner.`,
    motionsBreakdown: (n: number): string => `Opposisjonsmedlemmer har innsendt ${n} nye forslag.`
,
    committeeCountContext: (n: number): string => `${n} innstillinger fra denne komiteen signaliserer intensivt lovgivningsarbeid.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Stortingets komiteer har vært aktive innen ${committees} og ${extra} ytterligere politikkområder.` : `Stortingets komiteer har vært aktive innen ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `Totalt ${n} innstillinger viser vedvarende lovgivende fremdrift.`,
    oppositionStrategyContext: (n: number): string => `Forslag fra ${n} ulike partier viser bredden i opposisjonens politiske kritikk.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Disse ${propCount} proposisjonene berører ${domainCount} politikkområde${domainCount > 1 ? 'r' : ''}, og viser regjeringens brede lovgivningsambisjon.`,
    genericOverview: (n: number): string => `I denne perioden er ${n} dokumenter blitt behandlet i parlamentet.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} forslag innsendt`,
    otherCommittee: 'Andre komiteer',
    otherDocuments: 'Andre dokumenter',
    policySignificanceTouches: (domains: string): string => `Berører ${domains}.`,
    policySignificanceGeneric: 'Krever komitébehandling og kammerdebatt før avgjørelse fattes.',
    generalMatters: 'Generelle spørsmål',
    responsesToProp: 'Svar på regjeringforslag',
    independentMotions: 'Andre forslag'
  },
  fi: {
    whyMatters: 'Miksi tämä viikko on tärkeä',
    whyMattersDefault: 'Tällä viikolla on merkittävää parlamentaarista toimintaa, johon kuuluu tärkeitä keskusteluja, valiokuntakokouksia ja hallituksen kuulemisia.',
    keyEvents: 'Viikon tärkeimmät tapahtumat',
    whatToWatch: 'Mitä seurata',
    latestReports: 'Uusimmat valiokuntamietinnöt',
    noReports: 'Ei valiokuntamietintöjä saatavilla tällä hetkellä.',
    committee: 'Valiokunta', document: 'Asiakirja',
    reportDefault: 'Valiokuntamietintö parlamentaarisesta asiasta.',
    govProps: 'Hallituksen esitykset',
    noProps: 'Ei hallituksen esityksiä saatavilla tällä hetkellä.',
    propDefault: 'Hallituksen esitys eduskunnalle.',
    oppMotions: 'Opposition aloitteet',
    noMotions: 'Ei opposition aloitteita saatavilla tällä hetkellä.',
    author: 'Tekijä', party: 'Puolue',
    motionDefault: 'Opposition jäsenen eduskunta-aloite.',
    genericContent: 'Sisältöä luodaan.',
    monitorDev: 'Seuraa kehitystä ja tuloksia',
    committeeDebates: 'Valiokuntakeskustelut',
    committeeDebatesDesc: (n: number): string => `${n} valiokuntamietintöä aikataulutettu täysistuntokeskusteluun`,
    govProposals: 'Hallituksen esitykset',
    govProposalsDesc: (n: number): string => `${n} uutta hallituksen esitystä käsittelyssä`,
    weekAhead: 'Tuleva viikko', committeeReportsTag: 'Valiokuntamietinnöt',
    govPropsTag: 'Hallituksen esitykset', oppMotionsTag: 'Opposition aloitteet',
    // Enhanced summary labels
    committeeReport: 'valiokunnan mietintö',
    on: 'aiheesta',
    governmentProposition: 'Hallituksen esitys',
    regarding: 'koskien',
    referredTo: 'lähetetty valiokuntaan',
    motionBy: 'Aloite',
    parliamentaryMotion: 'Eduskunnan aloite',
    unknown: 'Tuntematon',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Ruotsin valtiopäivien valiokunnat ovat julkaisseet ${n} uutta mietintöä, jotka heijastavat meneillään olevaa lainsäädäntötyötä.`,
    reportSignificance: 'Tämä mietintö käsittelee',
    readFullReport: 'Lue koko mietintö',
    propsOverview: (n: number): string => `Hallitus on jättänyt ${n} uutta esitystä eduskunnalle.`,
    propSignificance: 'Tämä esitys koskee',
    readFullProp: 'Lue koko esitys',
    motionsOverview: (n: number): string => `Opposition kansanedustajat ovat jättäneet ${n} uutta aloitetta.`,
    motionSignificance: 'Tämä aloite käsittelee',
    readFullMotion: 'Lue koko aloite',
    policyContext: 'Poliittinen konteksti',
    filedBy: 'Jättänyt',
    politicalContext: 'Poliittinen konteksti',
    policyImplications: 'Poliittiset vaikutukset',
    keyTakeaways: 'Keskeiset havainnot',
    thematicAnalysis: 'Temaattinen analyysi',
    legislativePipeline: 'Lainsäädäntöprosessi',
    oppositionStrategy: 'Opposition strategia',
    coalitionDynamics: 'Koalitiodynamiikka',
    whatThisMeans: 'Mitä tämä tarkoittaa',
    whyItMatters: 'Miksi tämä on tärkeää',
    committeeBreakdown: (n: number, c: number): string => `Tämä erä ${n} valiokunnan mietintöä kattaa ${c} eri valiokuntaa.`,
    propsBreakdown: (n: number): string => `Hallitus on jättänyt ${n} uutta esitystä.`,
    motionsBreakdown: (n: number): string => `Oppositiokansanedustajat ovat jättäneet ${n} uutta aloitetta.`
,
    committeeCountContext: (n: number): string => `${n} mietintöä tästä valiokunnasta osoittavat intensiivistä lainsäädäntötyötä.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Eduskunnan valiokunnat ovat olleet aktiivisia aloilla ${committees} ja ${extra} muulla politiikka-alueella.` : `Eduskunnan valiokunnat ovat olleet aktiivisia aloilla ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `Yhteensä ${n} mietintöä osoittaa jatkuvaa lainsäädännöllistä vauhtia.`,
    oppositionStrategyContext: (n: number): string => `${n} eri puolueen aloitteet osoittavat opposition poliittisen kritiikin laajuuden.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Nämä ${propCount} esitystä koskevat ${domainCount} politiikka-aluetta, mikä osoittaa hallituksen laajaa lainsäädäntökunnianhimoa.`,
    genericOverview: (n: number): string => `Tänä aikana eduskunnassa käsiteltiin ${n} asiakirjaa.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} aloitetta jätetty`,
    otherCommittee: 'Muut valiokunnat',
    otherDocuments: 'Muut asiakirjat',
    policySignificanceTouches: (domains: string): string => `Koskee aloja ${domains}.`,
    policySignificanceGeneric: 'Vaatii valiokuntakäsittelyn ja täysistuntokeskustelun ennen päätöksentekoa.',
    generalMatters: 'Yleiset asiat',
    responsesToProp: 'Vastaukset hallituksen esityksiin',
    independentMotions: 'Muut aloitteet'
  },
  de: {
    whyMatters: 'Warum diese Woche wichtig ist',
    whyMattersDefault: 'Diese Woche bietet bedeutende parlamentarische Aktivitäten mit wichtigen Debatten, Ausschusssitzungen und Regierungskonsultationen.',
    keyEvents: 'Wichtige Ereignisse diese Woche',
    whatToWatch: 'Was zu beobachten ist',
    latestReports: 'Neueste Ausschussberichte',
    noReports: 'Derzeit keine Ausschussberichte verfügbar.',
    committee: 'Ausschuss', document: 'Dokument',
    reportDefault: 'Ausschussbericht über parlamentarische Angelegenheit.',
    govProps: 'Regierungsvorlagen',
    noProps: 'Derzeit keine Regierungsvorlagen verfügbar.',
    propDefault: 'Regierungsvorlage an das Parlament.',
    oppMotions: 'Oppositionsanträge',
    noMotions: 'Derzeit keine Oppositionsanträge verfügbar.',
    author: 'Autor', party: 'Partei',
    motionDefault: 'Parlamentarischer Antrag eines Oppositionsmitglieds.',
    genericContent: 'Inhaltserstellung läuft.',
    monitorDev: 'Entwicklungen und Ergebnisse überwachen',
    committeeDebates: 'Ausschussdebatten',
    committeeDebatesDesc: (n: number): string => `${n} Ausschussberichte für Plenardebatte geplant`,
    govProposals: 'Regierungsvorlagen',
    govProposalsDesc: (n: number): string => `${n} neue Regierungsvorlagen in Prüfung`,
    weekAhead: 'Woche Voraus', committeeReportsTag: 'Ausschussberichte',
    govPropsTag: 'Regierungsvorlagen', oppMotionsTag: 'Oppositionsanträge',
    // Enhanced summary labels
    committeeReport: 'Ausschussbericht',
    on: 'über',
    governmentProposition: 'Regierungsvorlage',
    regarding: 'bezüglich',
    referredTo: 'verwiesen an',
    motionBy: 'Antrag von',
    parliamentaryMotion: 'Parlamentarischer Antrag',
    unknown: 'Unbekannt',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Die Ausschüsse des schwedischen Reichstags haben ${n} neue Berichte veröffentlicht, die laufende Gesetzgebungsarbeit widerspiegeln.`,
    reportSignificance: 'Dieser Bericht befasst sich mit',
    readFullReport: 'Den vollständigen Bericht lesen',
    propsOverview: (n: number): string => `Die Regierung hat ${n} neue Vorlagen an das Parlament übermittelt.`,
    propSignificance: 'Diese Vorlage betrifft',
    readFullProp: 'Die vollständige Vorlage lesen',
    motionsOverview: (n: number): string => `Oppositionsabgeordnete haben ${n} neue Anträge eingereicht.`,
    motionSignificance: 'Dieser Antrag befasst sich mit',
    readFullMotion: 'Den vollständigen Antrag lesen',
    policyContext: 'Politischer Kontext',
    filedBy: 'Eingereicht von',
    politicalContext: 'Politischer Kontext',
    policyImplications: 'Politische Auswirkungen',
    keyTakeaways: 'Zentrale Erkenntnisse',
    thematicAnalysis: 'Thematische Analyse',
    legislativePipeline: 'Gesetzgebungsverfahren',
    oppositionStrategy: 'Oppositionsstrategie',
    coalitionDynamics: 'Koalitionsdynamik',
    whatThisMeans: 'Was dies bedeutet',
    whyItMatters: 'Warum es wichtig ist',
    committeeBreakdown: (n: number, c: number): string => `Diese Runde von ${n} Ausschussberichten umfasst ${c} verschiedene Ausschüsse.`,
    propsBreakdown: (n: number): string => `Die Regierung hat ${n} neue Vorlagen eingebracht.`,
    motionsBreakdown: (n: number): string => `Oppositionsabgeordnete haben ${n} neue Anträge eingereicht.`
,
    committeeCountContext: (n: number): string => `${n} Berichte dieses Ausschusses signalisieren intensive Gesetzgebungsarbeit.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Die Parlamentsausschüsse waren in den Bereichen ${committees} und ${extra} weiteren Politikfeldern aktiv.` : `Die Parlamentsausschüsse waren in den Bereichen ${committees} aktiv.`,
    committeeMomentumTakeaway: (n: number): string => `Insgesamt ${n} Berichte zeugen von anhaltendem Gesetzgebungsmomentum.`,
    oppositionStrategyContext: (n: number): string => `Anträge aus ${n} verschiedenen Parteien zeigen die Breite der oppositionellen politischen Kritik.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Diese ${propCount} Vorlagen betreffen ${domainCount} Politikbereich${domainCount > 1 ? 'e' : ''} und demonstrieren den breiten Gesetzgebungsanspruch der Regierung.`,
    genericOverview: (n: number): string => `In diesem Zeitraum wurden ${n} Dokumente im Parlament behandelt.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} Antrag${n > 1 ? 'e' : ''} eingereicht`,
    otherCommittee: 'Sonstige Ausschüsse',
    otherDocuments: 'Sonstige Dokumente',
    policySignificanceTouches: (domains: string): string => `Betrifft ${domains}.`,
    policySignificanceGeneric: 'Erfordert Ausschussberatung und Kammerdebatte vor einer Entscheidung.',
    generalMatters: 'Allgemeine Angelegenheiten',
    responsesToProp: 'Antworten auf Regierungsvorlagen',
    independentMotions: 'Sonstige Anträge'
  },
  fr: {
    whyMatters: 'Pourquoi cette semaine est importante',
    whyMattersDefault: 'Cette semaine est marquée par une activité parlementaire significative avec des débats clés, des réunions de commission et des consultations gouvernementales.',
    keyEvents: 'Événements clés cette semaine',
    whatToWatch: 'À suivre',
    latestReports: 'Derniers rapports de commission',
    noReports: 'Aucun rapport de commission disponible pour le moment.',
    committee: 'Commission', document: 'Document',
    reportDefault: 'Rapport de commission sur une affaire parlementaire.',
    govProps: 'Propositions gouvernementales',
    noProps: 'Aucune proposition gouvernementale disponible pour le moment.',
    propDefault: 'Proposition du gouvernement au Parlement.',
    oppMotions: 'Motions d\'opposition',
    noMotions: 'Aucune motion d\'opposition disponible pour le moment.',
    author: 'Auteur', party: 'Parti',
    motionDefault: 'Motion parlementaire d\'un membre de l\'opposition.',
    genericContent: 'Génération de contenu en cours.',
    monitorDev: 'Suivre les développements et les résultats',
    committeeDebates: 'Débats en commission',
    committeeDebatesDesc: (n: number): string => `${n} rapports de commission prévus pour débat en séance`,
    govProposals: 'Propositions gouvernementales',
    govProposalsDesc: (n: number): string => `${n} nouvelles propositions gouvernementales à l'examen`,
    weekAhead: 'Semaine à venir', committeeReportsTag: 'Rapports de commission',
    govPropsTag: 'Propositions gouvernementales', oppMotionsTag: 'Motions d\'opposition',
    // Enhanced summary labels
    committeeReport: 'rapport de commission',
    on: 'sur',
    governmentProposition: 'Proposition gouvernementale',
    regarding: 'concernant',
    referredTo: 'renvoyée à',
    motionBy: 'Motion de',
    parliamentaryMotion: 'Motion parlementaire',
    unknown: 'Inconnu',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Les commissions du Riksdag suédois ont publié ${n} nouveaux rapports reflétant le travail législatif en cours.`,
    reportSignificance: 'Ce rapport traite de',
    readFullReport: 'Lire le rapport complet',
    propsOverview: (n: number): string => `Le gouvernement a soumis ${n} nouvelles propositions au Parlement.`,
    propSignificance: 'Cette proposition concerne',
    readFullProp: 'Lire la proposition complète',
    motionsOverview: (n: number): string => `Des députés de l'opposition ont déposé ${n} nouvelles motions.`,
    motionSignificance: 'Cette motion traite de',
    readFullMotion: 'Lire la motion complète',
    policyContext: 'Contexte politique',
    filedBy: 'Déposé par',
    politicalContext: 'Contexte politique',
    policyImplications: 'Implications politiques',
    keyTakeaways: 'Points clés',
    thematicAnalysis: 'Analyse thématique',
    legislativePipeline: 'Processus législatif',
    oppositionStrategy: 'Stratégie de l\'opposition',
    coalitionDynamics: 'Dynamique de coalition',
    whatThisMeans: 'Ce que cela signifie',
    whyItMatters: 'Pourquoi c\'est important',
    committeeBreakdown: (n: number, c: number): string => `Ce lot de ${n} rapports de commission couvre ${c} commissions différentes.`,
    propsBreakdown: (n: number): string => `Le gouvernement a soumis ${n} nouvelles propositions.`,
    motionsBreakdown: (n: number): string => `Les députés de l'opposition ont déposé ${n} nouvelles motions.`
,
    committeeCountContext: (n: number): string => `${n} rapports de cette commission témoignent d'un travail législatif intensif.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Les commissions parlementaires ont été actives dans les domaines ${committees} et ${extra} autres domaines politiques.` : `Les commissions parlementaires ont été actives dans les domaines ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `Un total de ${n} rapports démontre un élan législatif soutenu.`,
    oppositionStrategyContext: (n: number): string => `Des motions de ${n} partis différents révèlent l'étendue de la critique politique de l'opposition.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Ces ${propCount} propositions touchent à ${domainCount} domaine${domainCount > 1 ? 's' : ''} politique${domainCount > 1 ? 's' : ''}, démontrant l'ambition législative du gouvernement.`,
    genericOverview: (n: number): string => `Durant cette période, ${n} documents ont été traités au parlement.`,
    partyMotionsFiled: (party: string, n: number): string => `${party} : ${n} motion${n > 1 ? 's' : ''} déposée${n > 1 ? 's' : ''}`,
    otherCommittee: 'Autres commissions',
    otherDocuments: 'Autres documents',
    policySignificanceTouches: (domains: string): string => `Touche aux domaines ${domains}.`,
    policySignificanceGeneric: 'Nécessite un examen en commission et un débat en séance avant toute décision.',
    generalMatters: 'Questions générales',
    responsesToProp: 'Réponses aux propositions gouvernementales',
    independentMotions: 'Autres motions'
  },
  es: {
    whyMatters: 'Por qué esta semana es importante',
    whyMattersDefault: 'Esta semana presenta actividad parlamentaria significativa con debates clave, reuniones de comisión y consultas gubernamentales.',
    keyEvents: 'Eventos clave esta semana',
    whatToWatch: 'Qué observar',
    latestReports: 'Últimos informes de comisión',
    noReports: 'No hay informes de comisión disponibles en este momento.',
    committee: 'Comisión', document: 'Documento',
    reportDefault: 'Informe de comisión sobre asunto parlamentario.',
    govProps: 'Proposiciones gubernamentales',
    noProps: 'No hay proposiciones gubernamentales disponibles en este momento.',
    propDefault: 'Propuesta del gobierno al Parlamento.',
    oppMotions: 'Mociones de oposición',
    noMotions: 'No hay mociones de oposición disponibles en este momento.',
    author: 'Autor', party: 'Partido',
    motionDefault: 'Moción parlamentaria de un miembro de la oposición.',
    genericContent: 'Generación de contenido en curso.',
    monitorDev: 'Monitorear desarrollos y resultados',
    committeeDebates: 'Debates en comisión',
    committeeDebatesDesc: (n: number): string => `${n} informes de comisión programados para debate en pleno`,
    govProposals: 'Propuestas gubernamentales',
    govProposalsDesc: (n: number): string => `${n} nuevas proposiciones gubernamentales en revisión`,
    weekAhead: 'Semana próxima', committeeReportsTag: 'Informes de comisión',
    govPropsTag: 'Proposiciones gubernamentales', oppMotionsTag: 'Mociones de oposición',
    // Enhanced summary labels
    committeeReport: 'informe de comisión',
    on: 'sobre',
    governmentProposition: 'Proposición gubernamental',
    regarding: 'referente a',
    referredTo: 'remitida a',
    motionBy: 'Moción de',
    parliamentaryMotion: 'Moción parlamentaria',
    unknown: 'Desconocido',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `Las comisiones del Riksdag sueco han publicado ${n} nuevos informes que reflejan el trabajo legislativo en curso.`,
    reportSignificance: 'Este informe aborda',
    readFullReport: 'Leer el informe completo',
    propsOverview: (n: number): string => `El gobierno ha presentado ${n} nuevas proposiciones al Parlamento.`,
    propSignificance: 'Esta proposición se refiere a',
    readFullProp: 'Leer la proposición completa',
    motionsOverview: (n: number): string => `Diputados de la oposición han presentado ${n} nuevas mociones.`,
    motionSignificance: 'Esta moción aborda',
    readFullMotion: 'Leer la moción completa',
    policyContext: 'Contexto político',
    filedBy: 'Presentada por',
    politicalContext: 'Contexto político',
    policyImplications: 'Implicaciones políticas',
    keyTakeaways: 'Conclusiones clave',
    thematicAnalysis: 'Análisis temático',
    legislativePipeline: 'Proceso legislativo',
    oppositionStrategy: 'Estrategia de la oposición',
    coalitionDynamics: 'Dinámica de coalición',
    whatThisMeans: 'Qué significa esto',
    whyItMatters: 'Por qué es importante',
    committeeBreakdown: (n: number, c: number): string => `Este lote de ${n} informes de comisión abarca ${c} comisiones diferentes.`,
    propsBreakdown: (n: number): string => `El gobierno ha presentado ${n} nuevas proposiciones.`,
    motionsBreakdown: (n: number): string => `Los diputados de la oposición han presentado ${n} nuevas mociones.`
,
    committeeCountContext: (n: number): string => `${n} informes de esta comisión señalan un trabajo legislativo intensivo.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `Las comisiones parlamentarias han estado activas en las áreas de ${committees} y ${extra} dominios políticos más.` : `Las comisiones parlamentarias han estado activas en las áreas de ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `Un total de ${n} informes demuestra un impulso legislativo sostenido.`,
    oppositionStrategyContext: (n: number): string => `Mociones de ${n} partidos diferentes revelan la amplitud de la crítica política de la oposición.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Estas ${propCount} proposiciones abarcan ${domainCount} dominio${domainCount > 1 ? 's' : ''} político${domainCount > 1 ? 's' : ''}, demostrando la amplia ambición legislativa del gobierno.`,
    genericOverview: (n: number): string => `Durante este período, ${n} documentos fueron procesados en el parlamento.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} moción${n > 1 ? 'es' : ''} presentada${n > 1 ? 's' : ''}`,
    otherCommittee: 'Otras comisiones',
    otherDocuments: 'Otros documentos',
    policySignificanceTouches: (domains: string): string => `Toca los ámbitos de ${domains}.`,
    policySignificanceGeneric: 'Requiere revisión en comisión y debate en cámara antes de tomar una decisión.',
    generalMatters: 'Asuntos generales',
    responsesToProp: 'Respuestas a proposiciones del gobierno',
    independentMotions: 'Otras mociones'
  },
  nl: {
    whyMatters: 'Waarom deze week belangrijk is',
    whyMattersDefault: 'Deze week biedt belangrijke parlementaire activiteit met cruciale debatten, commissievergaderingen en regeringsconsultaties.',
    keyEvents: 'Belangrijke gebeurtenissen deze week',
    whatToWatch: 'Wat te volgen',
    latestReports: 'Nieuwste commissierapporten',
    noReports: 'Geen commissierapporten beschikbaar op dit moment.',
    committee: 'Commissie', document: 'Document',
    reportDefault: 'Commissierapport over parlementaire zaak.',
    govProps: 'Regeringsvoorstellen',
    noProps: 'Geen regeringsvoorstellen beschikbaar op dit moment.',
    propDefault: 'Regeringsvoorstel aan het parlement.',
    oppMotions: 'Oppositiemoties',
    noMotions: 'Geen oppositiemoties beschikbaar op dit moment.',
    author: 'Auteur', party: 'Partij',
    motionDefault: 'Parlementaire motie van een oppositielid.',
    genericContent: 'Inhoud wordt gegenereerd.',
    monitorDev: 'Ontwikkelingen en resultaten volgen',
    committeeDebates: 'Commissiedebatten',
    committeeDebatesDesc: (n: number): string => `${n} commissierapporten gepland voor plenair debat`,
    govProposals: 'Regeringsvoorstellen',
    govProposalsDesc: (n: number): string => `${n} nieuwe regeringsvoorstellen in behandeling`,
    weekAhead: 'Week vooruit', committeeReportsTag: 'Commissierapporten',
    govPropsTag: 'Regeringsvoorstellen', oppMotionsTag: 'Oppositiemoties',
    // Enhanced summary labels
    committeeReport: 'commissierapport',
    on: 'over',
    governmentProposition: 'Regeringsvoorstel',
    regarding: 'betreffende',
    referredTo: 'doorverwezen naar',
    motionBy: 'Motie van',
    parliamentaryMotion: 'Parlementaire motie',
    unknown: 'Onbekend',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `De commissies van de Zweedse Riksdag hebben ${n} nieuwe rapporten gepubliceerd die het lopende wetgevingswerk weerspiegelen.`,
    reportSignificance: 'Dit rapport behandelt',
    readFullReport: 'Lees het volledige rapport',
    propsOverview: (n: number): string => `De regering heeft ${n} nieuwe voorstellen bij het parlement ingediend.`,
    propSignificance: 'Dit voorstel betreft',
    readFullProp: 'Lees het volledige voorstel',
    motionsOverview: (n: number): string => `Oppositieleden hebben ${n} nieuwe moties ingediend.`,
    motionSignificance: 'Deze motie behandelt',
    readFullMotion: 'Lees de volledige motie',
    policyContext: 'Politieke context',
    filedBy: 'Ingediend door',
    politicalContext: 'Politieke context',
    policyImplications: 'Beleidsimplicaties',
    keyTakeaways: 'Belangrijkste bevindingen',
    thematicAnalysis: 'Thematische analyse',
    legislativePipeline: 'Wetgevingsproces',
    oppositionStrategy: 'Oppositiestrategie',
    coalitionDynamics: 'Coalitiedynamiek',
    whatThisMeans: 'Wat dit betekent',
    whyItMatters: 'Waarom het belangrijk is',
    committeeBreakdown: (n: number, c: number): string => `Deze reeks van ${n} commissierapporten bestrijkt ${c} verschillende commissies.`,
    propsBreakdown: (n: number): string => `De regering heeft ${n} nieuwe voorstellen ingediend.`,
    motionsBreakdown: (n: number): string => `Oppositieleden hebben ${n} nieuwe moties ingediend.`
,
    committeeCountContext: (n: number): string => `${n} rapporten van deze commissie signaleren intensief wetgevend werk.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `De parlementaire commissies zijn actief geweest op het gebied van ${committees} en ${extra} verdere beleidsterreinen.` : `De parlementaire commissies zijn actief geweest op het gebied van ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `In totaal ${n} rapporten tonen aanhoudend wetgevend momentum.`,
    oppositionStrategyContext: (n: number): string => `Moties van ${n} verschillende partijen tonen de breedte van de politieke kritiek van de oppositie.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `Deze ${propCount} wetsvoorstellen bestrijken ${domainCount} beleidsterrein${domainCount > 1 ? 'en' : ''}, wat de brede wetgevende ambitie van de regering laat zien.`,
    genericOverview: (n: number): string => `In deze periode zijn ${n} documenten in het parlement behandeld.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} motie${n > 1 ? 's' : ''} ingediend`,
    otherCommittee: 'Overige commissies',
    otherDocuments: 'Overige documenten',
    policySignificanceTouches: (domains: string): string => `Raakt aan ${domains}.`,
    policySignificanceGeneric: 'Vereist commissiebehandeling en plenair debat voor een besluit wordt genomen.',
    generalMatters: 'Algemene zaken',
    responsesToProp: 'Antwoorden op regeringsvoorstellen',
    independentMotions: 'Overige moties'
  },
  ar: {
    whyMatters: 'لماذا هذا الأسبوع مهم',
    whyMattersDefault: 'يتميز هذا الأسبوع بنشاط برلماني كبير يشمل مناقشات رئيسية واجتماعات لجان ومشاورات حكومية.',
    keyEvents: 'الأحداث الرئيسية هذا الأسبوع',
    whatToWatch: 'ما يجب متابعته',
    latestReports: 'أحدث تقارير اللجان',
    noReports: 'لا توجد تقارير لجان متاحة حالياً.',
    committee: 'اللجنة', document: 'الوثيقة',
    reportDefault: 'تقرير لجنة عن مسألة برلمانية.',
    govProps: 'مقترحات الحكومة',
    noProps: 'لا توجد مقترحات حكومية متاحة حالياً.',
    propDefault: 'مقترح حكومي للبرلمان.',
    oppMotions: 'اقتراحات المعارضة',
    noMotions: 'لا توجد اقتراحات معارضة متاحة حالياً.',
    author: 'المؤلف', party: 'الحزب',
    motionDefault: 'اقتراح برلماني من عضو في المعارضة.',
    genericContent: 'جارٍ إنشاء المحتوى.',
    monitorDev: 'متابعة التطورات والنتائج',
    committeeDebates: 'مناقشات اللجان',
    committeeDebatesDesc: (n: number): string => `${n} تقارير لجان مجدولة للمناقشة في الجلسة العامة`,
    govProposals: 'مقترحات حكومية',
    govProposalsDesc: (n: number): string => `${n} مقترحات حكومية جديدة قيد المراجعة`,
    weekAhead: 'الأسبوع القادم', committeeReportsTag: 'تقارير اللجان',
    govPropsTag: 'مقترحات الحكومة', oppMotionsTag: 'اقتراحات المعارضة',
    // Enhanced summary labels
    committeeReport: 'تقرير لجنة',
    on: 'بشأن',
    governmentProposition: 'مقترح حكومي',
    regarding: 'فيما يتعلق بـ',
    referredTo: 'محال إلى',
    motionBy: 'اقتراح من',
    parliamentaryMotion: 'اقتراح برلماني',
    unknown: 'غير معروف',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `نشرت لجان البرلمان السويدي ${n} تقارير جديدة تعكس العمل التشريعي الجاري.`,
    reportSignificance: 'يتناول هذا التقرير',
    readFullReport: 'قراءة التقرير الكامل',
    propsOverview: (n: number): string => `قدمت الحكومة ${n} مقترحات جديدة إلى البرلمان.`,
    propSignificance: 'يتعلق هذا المقترح بـ',
    readFullProp: 'قراءة المقترح الكامل',
    motionsOverview: (n: number): string => `قدم أعضاء المعارضة ${n} اقتراحات جديدة.`,
    motionSignificance: 'يتناول هذا الاقتراح',
    readFullMotion: 'قراءة الاقتراح الكامل',
    policyContext: 'السياق السياسي',
    filedBy: 'مقدم من',
    politicalContext: 'السياق السياسي',
    policyImplications: 'الآثار السياسية',
    keyTakeaways: 'النقاط الرئيسية',
    thematicAnalysis: 'التحليل الموضوعي',
    legislativePipeline: 'المسار التشريعي',
    oppositionStrategy: 'استراتيجية المعارضة',
    coalitionDynamics: 'ديناميكيات الائتلاف',
    whatThisMeans: 'ماذا يعني هذا',
    whyItMatters: 'لماذا هذا مهم',
    committeeBreakdown: (n: number, c: number): string => `تغطي هذه الدفعة من ${n} تقارير لجان ${c} لجان مختلفة.`,
    propsBreakdown: (n: number): string => `قدمت الحكومة ${n} مقترحات جديدة.`,
    motionsBreakdown: (n: number): string => `قدم نواب المعارضة ${n} اقتراحات جديدة.`
,
    committeeCountContext: (n: number): string => `${n} تقارير من هذه اللجنة تشير إلى عمل تشريعي مكثف.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `كانت اللجان البرلمانية نشطة في مجالات ${committees} و${extra} مجالات سياسية أخرى.` : `كانت اللجان البرلمانية نشطة في مجالات ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `إجمالي ${n} تقارير يدل على زخم تشريعي مستمر.`,
    oppositionStrategyContext: (n: number): string => `اقتراحات من ${n} أحزاب مختلفة تكشف عن اتساع النقد السياسي للمعارضة.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `تمس هذه المقترحات الـ ${propCount} ${domainCount} مجال${domainCount > 1 ? 'ات' : ''} سياسي${domainCount > 1 ? 'ة' : ''}.`,
    genericOverview: (n: number): string => `خلال هذه الفترة، تمت معالجة ${n} وثائق في البرلمان.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} اقتراح${n > 1 ? 'ات' : ''} مقدمة`,
    otherCommittee: 'لجان أخرى',
    otherDocuments: 'وثائق أخرى',
    policySignificanceTouches: (domains: string): string => `يتعلق بمجالات ${domains}.`,
    policySignificanceGeneric: 'يتطلب مراجعة في اللجنة ونقاش في الجلسة العامة قبل اتخاذ القرار.',
    generalMatters: 'مسائل عامة',
    responsesToProp: 'ردود على مقترحات الحكومة',
    independentMotions: 'اقتراحات أخرى'
  },
  he: {
    whyMatters: 'למה השבוע הזה חשוב',
    whyMattersDefault: 'השבוע כולל פעילות פרלמנטרית משמעותית עם דיונים מרכזיים, ישיבות ועדה והתייעצויות ממשלתיות.',
    keyEvents: 'אירועים מרכזיים השבוע',
    whatToWatch: 'מה לעקוב אחריו',
    latestReports: 'דוחות ועדה אחרונים',
    noReports: 'אין דוחות ועדה זמינים כרגע.',
    committee: 'ועדה', document: 'מסמך',
    reportDefault: 'דוח ועדה בנושא פרלמנטרי.',
    govProps: 'הצעות ממשלה',
    noProps: 'אין הצעות ממשלה זמינות כרגע.',
    propDefault: 'הצעת ממשלה לפרלמנט.',
    oppMotions: 'הצעות אופוזיציה',
    noMotions: 'אין הצעות אופוזיציה זמינות כרגע.',
    author: 'מחבר', party: 'מפלגה',
    motionDefault: 'הצעה פרלמנטרית של חבר אופוזיציה.',
    genericContent: 'יצירת תוכן בתהליך.',
    monitorDev: 'לעקוב אחר התפתחויות ותוצאות',
    committeeDebates: 'דיוני ועדות',
    committeeDebatesDesc: (n: number): string => `${n} דוחות ועדה מתוכננים לדיון במליאה`,
    govProposals: 'הצעות ממשלה',
    govProposalsDesc: (n: number): string => `${n} הצעות ממשלה חדשות בבחינה`,
    weekAhead: 'השבוע הקרוב', committeeReportsTag: 'דוחות ועדה',
    govPropsTag: 'הצעות ממשלה', oppMotionsTag: 'הצעות אופוזיציה',
    // Enhanced summary labels
    committeeReport: 'דוח ועדה',
    on: 'על',
    governmentProposition: 'הצעת ממשלה',
    regarding: 'בנוגע ל',
    referredTo: 'הועבר ל',
    motionBy: 'הצעה של',
    parliamentaryMotion: 'הצעה פרלמנטרית',
    unknown: 'לא ידוע',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `ועדות הריקסדאג השוודי פרסמו ${n} דוחות חדשים המשקפים עבודת חקיקה שוטפת.`,
    reportSignificance: 'דוח זה עוסק ב',
    readFullReport: 'קראו את הדוח המלא',
    propsOverview: (n: number): string => `הממשלה הגישה ${n} הצעות חדשות לפרלמנט.`,
    propSignificance: 'הצעה זו נוגעת ל',
    readFullProp: 'קראו את ההצעה המלאה',
    motionsOverview: (n: number): string => `חברי אופוזיציה הגישו ${n} הצעות חדשות.`,
    motionSignificance: 'הצעה זו עוסקת ב',
    readFullMotion: 'קראו את ההצעה המלאה',
    policyContext: 'הקשר מדיני',
    filedBy: 'הוגשה על ידי',
    politicalContext: 'הקשר פוליטי',
    policyImplications: 'השלכות מדיניות',
    keyTakeaways: 'מסקנות מרכזיות',
    thematicAnalysis: 'ניתוח נושאי',
    legislativePipeline: 'תהליך החקיקה',
    oppositionStrategy: 'אסטרטגיית האופוזיציה',
    coalitionDynamics: 'דינמיקת הקואליציה',
    whatThisMeans: 'מה זה אומר',
    whyItMatters: 'למה זה חשוב',
    committeeBreakdown: (n: number, c: number): string => `קבוצה זו של ${n} דוחות ועדה מכסה ${c} ועדות שונות.`,
    propsBreakdown: (n: number): string => `הממשלה הגישה ${n} הצעות חדשות.`,
    motionsBreakdown: (n: number): string => `חברי האופוזיציה הגישו ${n} הצעות חדשות.`
,
    committeeCountContext: (n: number): string => `${n} דוחות מוועדה זו מעידים על עבודת חקיקה אינטנסיבית.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `ועדות הפרלמנט היו פעילות בתחומי ${committees} ו-${extra} תחומי מדיניות נוספים.` : `ועדות הפרלמנט היו פעילות בתחומי ${committees}.`,
    committeeMomentumTakeaway: (n: number): string => `סך של ${n} דוחות מעיד על מומנטום חקיקתי מתמשך.`,
    oppositionStrategyContext: (n: number): string => `הצעות מ-${n} מפלגות שונות חושפות את רוחב הביקורת הפוליטית של האופוזיציה.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `${propCount} הצעות חוק אלה נוגעות ל-${domainCount} תחומ${domainCount > 1 ? 'י' : ''} מדיניות, המדגימות את שאיפת החקיקה הרחבה של הממשלה.`,
    genericOverview: (n: number): string => `במהלך תקופה זו, ${n} מסמכים עברו טיפול בפרלמנט.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n} הצע${n > 1 ? 'ות' : 'ה'} הוגש${n > 1 ? 'ו' : 'ה'}`,
    otherCommittee: 'ועדות אחרות',
    otherDocuments: 'מסמכים אחרים',
    policySignificanceTouches: (domains: string): string => `נוגע בתחומי ${domains}.`,
    policySignificanceGeneric: 'מחייב בחינה בוועדה ודיון במליאה לפני קבלת החלטה.',
    generalMatters: 'עניינים כלליים',
    responsesToProp: 'תשובות להצעות הממשלה',
    independentMotions: 'הצעות אחרות'
  },
  ja: {
    whyMatters: 'なぜ今週が重要か',
    whyMattersDefault: '今週は重要な議会活動があり、主要な討論、委員会会議、政府協議が予定されています。',
    keyEvents: '今週の主要イベント',
    whatToWatch: '注目すべきポイント',
    latestReports: '最新の委員会報告',
    noReports: '現在、委員会報告はありません。',
    committee: '委員会', document: '文書',
    reportDefault: '議会事案に関する委員会報告。',
    govProps: '政府提案',
    noProps: '現在、政府提案はありません。',
    propDefault: '政府から議会への提案。',
    oppMotions: '野党動議',
    noMotions: '現在、野党動議はありません。',
    author: '著者', party: '政党',
    motionDefault: '野党議員による議会動議。',
    genericContent: 'コンテンツ生成中。',
    monitorDev: '動向と結果を監視',
    committeeDebates: '委員会討論',
    committeeDebatesDesc: (n: number): string => `${n}件の委員会報告が本会議討論に予定`,
    govProposals: '政府提案',
    govProposalsDesc: (n: number): string => `${n}件の新しい政府提案が審議中`,
    weekAhead: '来週の展望', committeeReportsTag: '委員会報告',
    govPropsTag: '政府提案', oppMotionsTag: '野党動議',
    // Enhanced summary labels
    committeeReport: '委員会報告',
    on: 'について',
    governmentProposition: '政府提案',
    regarding: 'に関する',
    referredTo: 'に付託',
    motionBy: '動議提出者',
    parliamentaryMotion: '議会動議',
    unknown: '不明',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `スウェーデン国会の委員会が${n}件の新しい報告書を発表し、現在進行中の立法作業を反映しています。`,
    reportSignificance: 'この報告書は',
    readFullReport: '報告書全文を読む',
    propsOverview: (n: number): string => `政府は議会に${n}件の新しい提案を提出しました。`,
    propSignificance: 'この提案は',
    readFullProp: '提案全文を読む',
    motionsOverview: (n: number): string => `野党議員が${n}件の新しい動議を提出しました。`,
    motionSignificance: 'この動議は',
    readFullMotion: '動議全文を読む',
    policyContext: '政策的背景',
    filedBy: '提出者',
    politicalContext: '政治的背景',
    policyImplications: '政策への影響',
    keyTakeaways: '主要ポイント',
    thematicAnalysis: 'テーマ別分析',
    legislativePipeline: '立法プロセス',
    oppositionStrategy: '野党の戦略',
    coalitionDynamics: '連立の力学',
    whatThisMeans: 'これが意味すること',
    whyItMatters: 'なぜ重要か',
    committeeBreakdown: (n: number, c: number): string => `この${n}件の委員会報告は${c}の異なる委員会にまたがっています。`,
    propsBreakdown: (n: number): string => `政府は${n}件の新たな法案を提出しました。`,
    motionsBreakdown: (n: number): string => `野党議員が${n}件の新たな動議を提出しました。`
,
    committeeCountContext: (n: number): string => `この委員会からの${n}件の報告書は、集中的な立法作業を示しています。`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `議会の委員会は${committees}および他${extra}の政策分野で活動しています。` : `議会の委員会は${committees}の分野で活動しています。`,
    committeeMomentumTakeaway: (n: number): string => `合計${n}件の報告書は、持続的な立法の勢いを示しています。`,
    oppositionStrategyContext: (n: number): string => `${n}つの異なる政党からの動議は、野党の政治的批判の幅を示しています。`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `これら${propCount}件の法案は${domainCount}つの政策分野に及び、政府の幅広い立法意欲を示しています。`,
    genericOverview: (n: number): string => `この期間中、議会で${n}件の文書が処理されました。`,
    partyMotionsFiled: (party: string, n: number): string => `${party}：${n}件の動議を提出`,
    otherCommittee: 'その他の委員会',
    otherDocuments: 'その他の文書',
    policySignificanceTouches: (domains: string): string => `${domains}に関連します。`,
    policySignificanceGeneric: '決定前に委員会審査と本会議討論が必要です。',
    generalMatters: '一般事項',
    responsesToProp: '政府提案への回答',
    independentMotions: 'その他の動議'
  },
  ko: {
    whyMatters: '이번 주가 중요한 이유',
    whyMattersDefault: '이번 주에는 주요 토론, 위원회 회의 및 정부 협의를 포함한 중요한 의회 활동이 있습니다.',
    keyEvents: '이번 주 주요 일정',
    whatToWatch: '주목할 사항',
    latestReports: '최신 위원회 보고서',
    noReports: '현재 이용 가능한 위원회 보고서가 없습니다.',
    committee: '위원회', document: '문서',
    reportDefault: '의회 사안에 대한 위원회 보고서.',
    govProps: '정부 법안',
    noProps: '현재 이용 가능한 정부 법안이 없습니다.',
    propDefault: '정부의 의회 법안.',
    oppMotions: '야당 동의',
    noMotions: '현재 이용 가능한 야당 동의가 없습니다.',
    author: '저자', party: '정당',
    motionDefault: '야당 의원의 의회 동의.',
    genericContent: '콘텐츠 생성 중.',
    monitorDev: '동향 및 결과 모니터링',
    committeeDebates: '위원회 토론',
    committeeDebatesDesc: (n: number): string => `${n}개 위원회 보고서가 본회의 토론에 예정`,
    govProposals: '정부 법안',
    govProposalsDesc: (n: number): string => `${n}개 새 정부 법안 검토 중`,
    weekAhead: '다음 주 전망', committeeReportsTag: '위원회 보고서',
    govPropsTag: '정부 법안', oppMotionsTag: '야당 동의',
    // Enhanced summary labels
    committeeReport: '위원회 보고서',
    on: '에 관한',
    governmentProposition: '정부 법안',
    regarding: '에 관하여',
    referredTo: '에 회부',
    motionBy: '동의 제안자',
    parliamentaryMotion: '의회 동의',
    unknown: '알 수 없음',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `스웨덴 의회 위원회가 진행 중인 입법 작업을 반영하는 ${n}개의 새 보고서를 발표했습니다.`,
    reportSignificance: '이 보고서는',
    readFullReport: '전체 보고서 읽기',
    propsOverview: (n: number): string => `정부가 의회에 ${n}개의 새 법안을 제출했습니다.`,
    propSignificance: '이 법안은',
    readFullProp: '전체 법안 읽기',
    motionsOverview: (n: number): string => `야당 의원들이 ${n}개의 새 동의안을 제출했습니다.`,
    motionSignificance: '이 동의안은',
    readFullMotion: '전체 동의안 읽기',
    policyContext: '정책 맥락',
    filedBy: '제출자',
    politicalContext: '정치적 맥락',
    policyImplications: '정책적 시사점',
    keyTakeaways: '핵심 요점',
    thematicAnalysis: '주제별 분석',
    legislativePipeline: '입법 과정',
    oppositionStrategy: '야당 전략',
    coalitionDynamics: '연립 역학',
    whatThisMeans: '이것이 의미하는 바',
    whyItMatters: '왜 중요한가',
    committeeBreakdown: (n: number, c: number): string => `이 ${n}개 위원회 보고서는 ${c}개의 서로 다른 위원회에 걸쳐 있습니다.`,
    propsBreakdown: (n: number): string => `정부가 ${n}개의 새 법안을 제출했습니다.`,
    motionsBreakdown: (n: number): string => `야당 의원들이 ${n}개의 새 동의안을 제출했습니다.`
,
    committeeCountContext: (n: number): string => `이 위원회의 ${n}건의 보고서는 집중적인 입법 작업을 나타냅니다.`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `의회 위원회는 ${committees} 및 ${extra}개의 추가 정책 분야에서 활동했습니다.` : `의회 위원회는 ${committees} 분야에서 활동했습니다.`,
    committeeMomentumTakeaway: (n: number): string => `총 ${n}건의 보고서는 지속적인 입법 추진력을 보여줍니다.`,
    oppositionStrategyContext: (n: number): string => `${n}개 정당의 동의안은 야당의 정치적 비판의 폭을 보여줍니다.`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `이 ${propCount}건의 법안은 ${domainCount}개 정책 영역에 걸쳐 있으며, 정부의 광범위한 입법 야심을 보여줍니다.`,
    genericOverview: (n: number): string => `이 기간 동안 의회에서 ${n}건의 문서가 처리되었습니다.`,
    partyMotionsFiled: (party: string, n: number): string => `${party}: ${n}건의 동의안 제출`,
    otherCommittee: '기타 위원회',
    otherDocuments: '기타 문서',
    policySignificanceTouches: (domains: string): string => `${domains} 분야에 관련됩니다.`,
    policySignificanceGeneric: '결정 전에 위원회 심사와 본회의 토론이 필요합니다.',
    generalMatters: '일반 사항',
    responsesToProp: '정부 제안에 대한 응답',
    independentMotions: '기타 동의'
  },
  zh: {
    whyMatters: '为什么本周很重要',
    whyMattersDefault: '本周有重要的议会活动，包括关键辩论、委员会会议和政府磋商。',
    keyEvents: '本周重要事件',
    whatToWatch: '值得关注的要点',
    latestReports: '最新委员会报告',
    noReports: '目前没有可用的委员会报告。',
    committee: '委员会', document: '文件',
    reportDefault: '关于议会事务的委员会报告。',
    govProps: '政府提案',
    noProps: '目前没有可用的政府提案。',
    propDefault: '政府向议会提交的提案。',
    oppMotions: '反对党动议',
    noMotions: '目前没有可用的反对党动议。',
    author: '作者', party: '政党',
    motionDefault: '反对党议员的议会动议。',
    genericContent: '内容生成中。',
    monitorDev: '监测发展动态和结果',
    committeeDebates: '委员会辩论',
    committeeDebatesDesc: (n: number): string => `${n}份委员会报告安排在全体会议上辩论`,
    govProposals: '政府提案',
    govProposalsDesc: (n: number): string => `${n}项新政府提案正在审查中`,
    weekAhead: '下周展望', committeeReportsTag: '委员会报告',
    govPropsTag: '政府提案', oppMotionsTag: '反对党动议',
    // Enhanced summary labels
    committeeReport: '委员会报告',
    on: '关于',
    governmentProposition: '政府提案',
    regarding: '关于',
    referredTo: '提交至',
    motionBy: '动议提出者',
    parliamentaryMotion: '议会动议',
    unknown: '未知',
    // Analytical narrative labels
    reportsOverview: (n: number): string => `瑞典国会各委员会发布了${n}份新报告，反映了正在进行的立法工作。`,
    reportSignificance: '该报告涉及',
    readFullReport: '阅读完整报告',
    propsOverview: (n: number): string => `政府向议会提交了${n}项新提案。`,
    propSignificance: '该提案涉及',
    readFullProp: '阅读完整提案',
    motionsOverview: (n: number): string => `反对党议员提交了${n}项新动议。`,
    motionSignificance: '该动议涉及',
    readFullMotion: '阅读完整动议',
    policyContext: '政策背景',
    filedBy: '提交者',
    politicalContext: '政治背景',
    policyImplications: '政策影响',
    keyTakeaways: '关键要点',
    thematicAnalysis: '主题分析',
    legislativePipeline: '立法进程',
    oppositionStrategy: '反对党策略',
    coalitionDynamics: '联盟动态',
    whatThisMeans: '这意味着什么',
    whyItMatters: '为什么重要',
    committeeBreakdown: (n: number, c: number): string => `这批${n}份委员会报告涵盖${c}个不同委员会。`,
    propsBreakdown: (n: number): string => `政府提交了${n}项新提案。`,
    motionsBreakdown: (n: number): string => `反对党议员提交了${n}项新动议。`
,
    committeeCountContext: (n: number): string => `该委员会的${n}份报告表明密集的立法工作。`,
    committeeActivityTakeaway: (committees: string, extra: number): string => extra > 0 ? `议会委员会在${committees}以及其他${extra}个政策领域积极开展工作。` : `议会委员会在${committees}领域积极开展工作。`,
    committeeMomentumTakeaway: (n: number): string => `共${n}份报告展示了持续的立法势头。`,
    oppositionStrategyContext: (n: number): string => `来自${n}个不同政党的动议显示了反对派政治批评的广度。`,
    policyImplicationsContext: (propCount: number, domainCount: number): string => `这${propCount}项提案涉及${domainCount}个政策领域，展示了政府广泛的立法雄心。`,
    genericOverview: (n: number): string => `在此期间，议会处理了${n}份文件。`,
    partyMotionsFiled: (party: string, n: number): string => `${party}：提交了${n}项动议`,
    otherCommittee: '其他委员会',
    otherDocuments: '其他文件',
    policySignificanceTouches: (domains: string): string => `涉及${domains}领域。`,
    policySignificanceGeneric: '在作出决定之前需要委员会审查和全体辩论。',
    generalMatters: '一般事项',
    responsesToProp: '对政府提案的回应',
    independentMotions: '其他动议'
  }
};

// ---------------------------------------------------------------------------
// Private helper functions
// ---------------------------------------------------------------------------

/**
 * Check if date is today
 */
function isTodayDate(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Format day name (Monday, Tuesday, etc.) using Intl for all 14 languages
 */
function formatDayName(date: Date, lang: Language | string = 'en'): string {
  const locale = LOCALE_MAP[lang] || lang;
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
  }
}

/**
 * Format day label (e.g., "February 10 - Monday") using Intl for all 14 languages
 */
function formatDayLabel(date: Date, lang: Language | string = 'en'): string {
  const locale = LOCALE_MAP[lang] || lang;
  try {
    const dayName = formatDayName(date, lang);
    const monthDay = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(date);
    return `${monthDay} - ${dayName}`;
  } catch {
    const dayName = formatDayName(date, 'en');
    const monthDay = new Intl.DateTimeFormat('en-GB', { month: 'long', day: 'numeric' }).format(date);
    return `${monthDay} - ${dayName}`;
  }
}

/**
 * Determine if event is high priority
 */
function isHighPriority(event: RawCalendarEvent): boolean {
  const title = (event.title || event.rubrik || '').toLowerCase();
  return (
    title.includes('pm') ||
    title.includes('prime minister') ||
    title.includes('statsminister') ||
    title.includes('vote') ||
    title.includes('votering') ||
    title.includes('eu') ||
    title.includes('summit')
  );
}

/**
 * Parse author and party from raw Swedish motion text.
 * Handles "av Fredrik Olovsson m.fl. (S)" and similar patterns.
 */
function parseMotionAuthorParty(text: string): { author: string; party: string } | null {
  const m = text.match(/\bav\s+([^(]+?)\s+\(([A-ZÅÄÖ]{1,5})\)/u);
  if (m) return { author: m[1].trim().replace(/\s+/g, ' '), party: m[2] };
  return null;
}

/**
 * Clean raw Swedish motion notis text into a readable subject.
 * Strips "Motion till riksdagen XXXX av AUTHOR (PARTY) med anledning av..."
 * and truncates at "Förslag till riksdagsbeslut".
 */
function cleanMotionText(raw: string): string {
  // Minimum cleaned text length before falling back to raw; max excerpt lengths
  const MIN_CLEANED = 20;
  const MAX_CLEANED = 300;
  const MAX_RAW_FALLBACK = 200;
  // Truncate at formal ballot section
  let text = raw.replace(/Förslag till riksdagsbeslut[\s\S]*/i, '').trim();
  // Strip leading "Motion till riksdagen YYYY/YY:NNN av AUTHOR (PARTY) " prefix
  text = text.replace(/^Motion till riksdagen\s+\S+\s+av\s+[^(]+\([A-ZÅÄÖ]{1,5}\)\s*/i, '').trim();
  // Strip "med anledning av prop. YYYY/YY:NNN " prefix
  text = text.replace(/^med anledning av prop\.\s+\S+\s*/i, '').trim();
  return text.length > MIN_CLEANED ? text.slice(0, MAX_CLEANED) : raw.slice(0, MAX_RAW_FALLBACK);
}

/**
 * Detect when a text string is an MP/politician profile page excerpt rather than
 * document content. Returns true for texts that begin with Swedish MP-status phrases
 * or contain profile-specific markers such as:
 *   - "Tjänstgörande riksdagsledamot …"   (active MP)
 *   - "Tidigare riksdagsledamot …"        (former MP)
 *   - "Avgången riksdagsledamot …"        (resigned MP)
 *   - "Tillgänglig ersättare …"           (substitute MP)
 *   - "Tjänstgörande ersättare …"         (active substitute)
 *   - "Tidigare ersättare …"              (former substitute)
 *   - "Tjänstgörande statsrådsersättare"  (acting minister substitute)
 *   - "Tidigare statsråd …"              (former minister)
 *   - "Tidigare statsminister …"          (former PM)
 *   - "Inga uppdrag"                      (no assignments)
 *   - "Avgången …"                        (resigned)
 *   - "Avliden YYYY-MM-DD …"              (deceased MP)
 *
 * This data comes from the riksdag API's person/ledamot profile pages, and must never
 * appear in article document-entry content.
 */
export function isPersonProfileText(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trimStart();
  // Ordered from most specific to least; any match → it is a person profile excerpt
  return (
    /^Tjänstgörande riksdagsledamot/u.test(trimmed) ||
    /^Tidigare riksdagsledamot/u.test(trimmed) ||
    /^Avgången riksdagsledamot/u.test(trimmed) ||
    /^Tillgänglig ersättare/u.test(trimmed) ||
    /^Tjänstgörande ersättare/u.test(trimmed) ||
    /^Tidigare ersättare/u.test(trimmed) ||
    /^Tjänstgörande statsrådsersättare/u.test(trimmed) ||
    /^Tidigare statsråd/u.test(trimmed) ||
    /^Tidigare statsminister/u.test(trimmed) ||
    /^Inga uppdrag/u.test(trimmed) ||
    /^Avgången/u.test(trimmed) ||
    // Deceased: "Avliden YYYY-MM-DD ..."
    /^Avliden\s+\d{4}-\d{2}-\d{2}/u.test(trimmed) ||
    // Contains riksdag email address — always a profile page
    /[a-zA-Z0-9._%+-]+@riksdagen\.se/u.test(trimmed) ||
    // Contains "Aktuella uppdrag Riksdagsledamot" — profile header
    /Aktuella uppdrag\s+Riksdagsledamot/u.test(trimmed)
  );
}

/**
 * Build a descriptive proposition summary from the ministry organ.
 * Returns a ministry-specific framing sentence.
 */
function propSummaryFromOrgan(organ: string, lang: Language | string): string {
  const ministryMap: Record<string, { sv: string; en: string }> = {
    Justitiedepartementet:    { sv: 'Justitiedepartementets förslag rör rättsliga förändringar.', en: 'This Justice Ministry proposal amends existing legal framework.' },
    Finansdepartementet:      { sv: 'Finansdepartementets förslag påverkar statsbudget eller finansreglering.', en: 'This Finance Ministry proposal has fiscal or budgetary implications.' },
    Försvarsdepartementet:    { sv: 'Försvarsdepartementets förslag rör försvars- eller säkerhetspolitik.', en: 'This Defence Ministry proposal concerns national security or defence posture.' },
    Utbildningsdepartementet: { sv: 'Utbildningsdepartementets förslag berör skolsystem eller forskning.', en: 'This Education Ministry proposal affects schools, universities or research funding.' },
    Socialdepartementet:      { sv: 'Socialdepartementets förslag rör välfärd eller socialpolitik.', en: 'This Social Affairs Ministry proposal affects welfare entitlements or social services.' },
    Miljödepartementet:       { sv: 'Klimat- och miljödepartementets förslag rör klimat- eller miljöpolitik.', en: 'This Climate and Environment Ministry proposal targets emissions or ecological regulation.' },
    'Klimat- och miljödepartementet': { sv: 'Klimat- och miljödepartementets förslag rör klimat- eller miljöpolitik.', en: 'This Climate and Environment Ministry proposal targets emissions or ecological regulation.' },
    'Klimat- och näringslivsdepartementet': { sv: 'Klimat- och näringslivsdepartementets förslag rör klimat- och näringspolitik.', en: 'This Climate and Enterprise Ministry proposal addresses both environmental and industrial policy.' },
    Utrikesdepartementet:     { sv: 'Utrikesdepartementets förslag rör utrikespolitik eller internationella relationer.', en: 'This Foreign Affairs Ministry proposal concerns international relations or Sweden’s global obligations.' },
    Infrastrukturdepartementet: { sv: 'Infrastrukturdepartementets förslag rör transport eller samhällsinfrastruktur.', en: 'This Infrastructure Ministry proposal affects transport networks or public utilities.' },
  };
  const entry = ministryMap[organ];
  if (!entry) return '';
  return lang === 'sv' ? entry.sv : entry.en;
}

/**
 * Generate enhanced summary from document metadata when summary field is missing
 * Uses document type, subtype, organ, and other metadata to create informative placeholder
 */
function generateEnhancedSummary(doc: RawDocument, type: string, lang: Language | string): string {
  // For motions: clean raw Swedish notis text before returning
  if ((type === 'motion') && (doc.summary || doc.notis)) {
    const raw = (doc.summary || doc.notis || '');
    // Skip person-profile data (e.g. "Tjänstgörande riksdagsledamot...", "Avliden 2011-09-20...")
    if (!isPersonProfileText(raw)) {
      if (raw.includes('Motion till riksdagen') || raw.includes('Förslag till riksdagsbeslut')) {
        return cleanMotionText(raw);
      }
      return raw;
    }
  }

  // If we have a real summary or notis (not person profile data), use it as-is
  if (doc.summary || doc.notis) {
    const text = doc.summary || doc.notis || '';
    if (!isPersonProfileText(text)) {
      return text;
    }
  }

  // Generate enhanced summary based on metadata
  const organ = doc.organ || doc.committee;
  const subtyp = doc.subtyp || doc.subtype;
  const doktyp = doc.doktyp || doc.documentType;

  // Build contextual summary based on available metadata
  const parts: string[] = [];

  if (type === 'report' && organ) {
    const labelVal = L(lang, 'committeeReport');
    parts.push(`${organ} ${typeof labelVal === 'string' ? labelVal : ''}`);
    if (subtyp) {
      const onVal = L(lang, 'on');
      parts.push(`${typeof onVal === 'string' ? onVal : ''} ${subtyp}`);
    }
  } else if (type === 'proposition') {
    // Try ministry-specific framing first
    const ministrySummary = organ ? propSummaryFromOrgan(organ, lang) : '';
    if (ministrySummary) {
      return ministrySummary;
    }
    const propLabel = L(lang, 'governmentProposition');
    parts.push(typeof propLabel === 'string' ? propLabel : '');
    if (organ) {
      const referredVal = L(lang, 'referredTo');
      parts.push(`${typeof referredVal === 'string' ? referredVal : ''} ${organ}`);
    }
  } else if (type === 'motion') {
    const author = (doc.intressent_namn !== 'Unknown' ? doc.intressent_namn : null) || doc.author;
    const party = doc.parti !== 'Unknown' ? doc.parti : undefined;
    if (author && party) {
      const motionByVal = L(lang, 'motionBy');
      parts.push(`${typeof motionByVal === 'string' ? motionByVal : ''} ${author} (${party})`);
    } else if (author) {
      const motionByVal = L(lang, 'motionBy');
      parts.push(`${typeof motionByVal === 'string' ? motionByVal : ''} ${author}`);
    } else {
      const parlMotion = L(lang, 'parliamentaryMotion');
      parts.push(typeof parlMotion === 'string' ? parlMotion : '');
    }
    if (subtyp) {
      const onVal = L(lang, 'on');
      parts.push(`${typeof onVal === 'string' ? onVal : ''} ${subtyp}`);
    }
  }

  // Add document type information if useful
  if (doktyp && doktyp !== type) {
    parts.push(`(${doktyp})`);
  }

  // Fallback to default if no useful metadata
  if (parts.length === 0) {
    const fallback = type === 'report' ? L(lang, 'reportDefault') :
           type === 'proposition' ? L(lang, 'propDefault') :
           L(lang, 'motionDefault');
    return typeof fallback === 'string' ? fallback : '';
  }

  return parts.join(' ') + '.';
}

/**
 * Get human-readable committee name from code
 */
function getCommitteeName(code: string | undefined, lang: Language | string): string {
  if (!code) {
    const unknownVal = L(lang, 'unknown');
    return typeof unknownVal === 'string' ? unknownVal : 'Unknown';
  }
  if (code === 'unknown') {
    const otherVal = L(lang, 'otherCommittee');
    return typeof otherVal === 'string' ? otherVal : 'Other committees';
  }
  const entry: CommitteeName | undefined = COMMITTEE_NAMES[code];
  if (!entry) return code;
  // Use Swedish name for sv, English for all others (other languages get translated via data-translate)
  return lang === 'sv' ? entry.sv : entry.en;
}

/**
 * Generate Week Ahead article content
 */
function generateWeekAheadContent(data: WeekAheadData, lang: Language | string): string {
  const { events, highlights, context } = data;
  // Cast to ArticleContentData to access documents field (passed via switch cast)
  const documents = (data as unknown as ArticleContentData).documents ?? [];
  const questions = data.questions ?? [];
  const interpellations = data.interpellations ?? [];

  let content = '';

  // Introduction section
  content += `
    <div class="context-box">
      <h3>${L(lang, 'whyMatters')}</h3>
      <p>${context || L(lang, 'whyMattersDefault')}</p>
    </div>
`;

  // Group events by significance
  const highPriority = events.filter(e => isHighPriority(e));

  if (highPriority.length > 0) {
    content += `\n    <h2>${L(lang, 'keyEvents')}</h2>\n`;

    highPriority.forEach(event => {
      // Derive dayName from event date if not present
      const dayName = event.dayName || (event.datum || event.from || event.start ? formatDayName(new Date(event.datum || event.from || event.start || ''), lang) : '');
      const eventTime = event.time || event.tid || 'Expected';
      const eventTitle = event.title || event.titel || 'Event';

      // Mark Swedish API titles for LLM translation post-processing
      const escapedEventTitle = escapeHtml(eventTitle);
      const titleHtml = (event.titel && !event.title)
        ? svSpan(escapedEventTitle, lang)
        : escapedEventTitle;

      content += `
    <h3>${dayName ? dayName + ' - ' : ''}${titleHtml}</h3>
    <p>${event.description || `${eventTime}: ${event.details || 'Parliamentary session scheduled.'}`}</p>
`;
    });
  }

  // Legislative Pipeline: show upcoming documents when calendar is sparse or empty
  if (documents.length > 0) {
    const sectionLabel = lang === 'sv'
      ? 'Kommande i den lagstiftande processen'
      : lang === 'de' ? 'Bevorstehende legislative Tagesordnung'
      : lang === 'fr' ? 'Agenda législatif à venir'
      : lang === 'es' ? 'Agenda legislativa próxima'
      : lang === 'da' ? 'Kommende lovgivningsmæssig dagsorden'
      : lang === 'no' ? 'Kommende lovgivningsmessig agenda'
      : lang === 'fi' ? 'Tuleva lainsäädäntöohjelma'
      : lang === 'nl' ? 'Komende wetgevende agenda'
      : lang === 'ar' ? 'جدول الأعمال التشريعي القادم'
      : lang === 'he' ? 'סדר היום החקיקתי הקרוב'
      : lang === 'ja' ? '今後の立法スケジュール'
      : lang === 'ko' ? '향후 입법 일정'
      : lang === 'zh' ? '未来立法议程'
      : 'Upcoming Legislative Agenda';

    content += `\n    <h2>${sectionLabel}</h2>\n`;

    // Show top documents — prioritise propositions and committee reports
    const priorityDocs = [
      ...documents.filter(d => (d as Record<string, string>).doktyp === 'prop' || (d as Record<string, string>).doktyp === 'proposition'),
      ...documents.filter(d => (d as Record<string, string>).doktyp === 'bet' || (d as Record<string, string>).doktyp === 'betankande'),
      ...documents.filter(d => {
        const t = (d as Record<string, string>).doktyp;
        return t !== 'prop' && t !== 'proposition' && t !== 'bet' && t !== 'betankande';
      }),
    ].slice(0, 15);

    priorityDocs.forEach(doc => {
      const rec = doc as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || rec['doktyp'] || 'Document';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (rec['titel'] && !rec['title'])
        ? svSpan(escapedTitle, lang)
        : escapedTitle;

      const significance = generatePolicySignificance(doc, lang);
      const dokId = rec['dok_id'] ?? rec['id'] ?? '';
      const urlBase = 'https://riksdagen.se/sv/dokument-och-lagar/dokument/';
      const safeUrl = dokId ? sanitizeUrl(`${urlBase}${encodeURIComponent(dokId)}/`) : '';

      content += `\n    <div class="document-entry">\n`;
      content += `      <h4>${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">` : ''}${titleHtml}${safeUrl ? '</a>' : ''}</h4>\n`;
      if (significance) {
        content += `      <p class="policy-significance">${escapeHtml(significance)}</p>\n`;
      }
      content += `    </div>\n`;
    });
  }

  // Parliamentary Questions: upcoming written questions to ministers
  if (questions.length > 0) {
    const questionsLabel = lang === 'sv' ? 'Skriftliga frågor till statsråd'
      : lang === 'de' ? 'Schriftliche parlamentarische Anfragen'
      : lang === 'fr' ? 'Questions écrites au gouvernement'
      : lang === 'es' ? 'Preguntas escritas al gobierno'
      : lang === 'da' ? 'Skriftlige spørgsmål til ministrene'
      : lang === 'no' ? 'Skriftlige spørsmål til statsrådene'
      : lang === 'fi' ? 'Kirjalliset kysymykset ministerille'
      : lang === 'nl' ? 'Schriftelijke vragen aan ministers'
      : lang === 'ar' ? 'أسئلة مكتوبة للحكومة'
      : lang === 'he' ? 'שאלות כתובות לממשלה'
      : lang === 'ja' ? '大臣への書面質問'
      : lang === 'ko' ? '장관에 대한 서면 질문'
      : lang === 'zh' ? '书面质询政府'
      : 'Parliamentary Questions to Ministers';
    content += `\n    <h2>${questionsLabel}</h2>\n`;
    questions.slice(0, 8).forEach(q => {
      const rec = q as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || 'Question';
      const party = rec['parti'] ? ` (${escapeHtml(rec['parti'])})` : '';
      const dok_id = rec['dok_id'] ?? '';
      const qUrl = dok_id ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(dok_id)}/`) : '';
      content += `    <div class="document-entry">\n`;
      content += `      <h4>${qUrl ? `<a href="${qUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(titleText), lang)}${qUrl ? '</a>' : ''}</h4>\n`;
      if (party) content += `      <p class="policy-significance">${escapeHtml(party)}</p>\n`;
      content += `    </div>\n`;
    });
  }

  // Interpellations: formal parliamentary interpellations awaiting ministerial response
  if (interpellations.length > 0) {
    const interLabel = lang === 'sv' ? 'Interpellationer under behandling'
      : lang === 'de' ? 'Interpellationen in Bearbeitung'
      : lang === 'fr' ? 'Interpellations en cours'
      : lang === 'es' ? 'Interpelaciones en curso'
      : lang === 'da' ? 'Forespørgsler til behandling'
      : lang === 'no' ? 'Interpellasjoner til behandling'
      : lang === 'fi' ? 'Käsittelyssä olevat välikysymykset'
      : lang === 'nl' ? 'Interpellaties in behandeling'
      : lang === 'ar' ? 'الاستجوابات البرلمانية قيد المعالجة'
      : lang === 'he' ? 'בקשות הבהרה בטיפול'
      : lang === 'ja' ? '処理中の質問主意書'
      : lang === 'ko' ? '처리 중인 대정부 질문'
      : lang === 'zh' ? '待处理的质询'
      : 'Interpellations Pending';
    content += `\n    <h2>${interLabel}</h2>\n`;
    interpellations.slice(0, 8).forEach(interp => {
      const rec = interp as Record<string, string>;
      const titleText = rec['titel'] || rec['title'] || 'Interpellation';
      const party = rec['parti'] ? ` (${escapeHtml(rec['parti'])})` : '';
      const dok_id = rec['dok_id'] ?? '';
      const iUrl = dok_id ? sanitizeUrl(`https://riksdagen.se/sv/dokument-och-lagar/dokument/${encodeURIComponent(dok_id)}/`) : '';
      // Extract clean summary: content starts after "till MINISTER\n" line
      const rawSummary = rec['summary'] ?? '';
      // Find start of actual content after the header lines (Interpellation NNN / av AUTHOR / till MINISTER)
      const tillMatch = rawSummary.match(/\btill\s+[^\n]+\n\s*/i);
      const contentStart = tillMatch
        ? rawSummary.indexOf(tillMatch[0]) + tillMatch[0].length
        : rawSummary.replace(/^Interpellation\s+\S+[^\n]*\n\s*/i, '').replace(/^\s*av\s+[^\n]+\n\s*/i, '').length === rawSummary.length
          ? 0
          : 0;
      const cleanedSummary = (tillMatch ? rawSummary.slice(contentStart) : rawSummary
        .replace(/^Interpellation\s+\S+[^\n]*\n\s*/i, '')
        .replace(/^\s*av\s+[^\n]+\n\s*/i, '')
        .replace(/^\s*till\s+[^\n]+\n\s*/i, ''))
        .trim()
        .slice(0, 200);
      content += `    <div class="document-entry">\n`;
      content += `      <h4>${iUrl ? `<a href="${iUrl}" target="_blank" rel="noopener noreferrer">` : ''}${svSpan(escapeHtml(titleText), lang)}${iUrl ? '</a>' : ''}</h4>\n`;
      if (party) content += `      <p class="policy-significance">${escapeHtml(party)}</p>\n`;
      if (cleanedSummary) content += `      <p>${svSpan(escapeHtml(cleanedSummary) + '…', lang)}</p>\n`;
      content += `    </div>\n`;
    });
  }

  // Additional context
  if (highlights && highlights.length > 0) {
    content += `\n    <h2>${L(lang, 'whatToWatch')}</h2>\n    <ul>\n`;

    highlights.forEach(highlight => {
      content += `      <li><strong>${highlight.title}:</strong> ${highlight.description}</li>\n`;
    });

    content += '    </ul>\n';
  }

  return content;
}

/**
 * Generate Committee Reports content with analytical narrative
 */
function generateCommitteeContent(data: ArticleContentData, lang: Language | string): string {
  const reports = data.reports || [];

  let content = `<h2>${L(lang, 'latestReports')}</h2>\n`;

  if (reports.length === 0) {
    content += `<p>${L(lang, 'noReports')}</p>\n`;
    return content;
  }

  // Group reports by committee for thematic coherence
  const byCommittee: Record<string, RawDocument[]> = {};
  reports.forEach(report => {
    const committee = report.organ || report.committee || 'unknown';
    if (!byCommittee[committee]) byCommittee[committee] = [];
    byCommittee[committee].push(report);
  });

  const committeeCount = Object.keys(byCommittee).length;

  // Analytical lede: contextual overview of committee activity
  const breakdown = L(lang, 'committeeBreakdown') as string | ((n: number, c: number) => string);
  const breakdownText = typeof breakdown === 'function'
    ? breakdown(reports.length, committeeCount)
    : `${reports.length} committee reports across ${committeeCount} committees.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Thematic analysis section header
  content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;

  // Generate content for each committee group with analysis
  Object.entries(byCommittee).forEach(([committeeCode, committeeReports]) => {
    const committeeName = getCommitteeName(committeeCode, lang);

    // Committee section header
    content += `\n    <h3>${escapeHtml(committeeName)}</h3>\n`;

    // Add committee context: how many reports from this committee
    if (committeeReports.length > 1) {
      const countContextFn = L(lang, 'committeeCountContext') as string | ((n: number) => string);
      const countContext = typeof countContextFn === 'function'
        ? countContextFn(committeeReports.length)
        : `${committeeReports.length} reports from this committee signal intensive legislative work within its portfolio.`;
      content += `    <p><em>${escapeHtml(String(countContext))}</em></p>\n`;
    }

    committeeReports.forEach(report => {
      const titleText = report.titel || report.title || '';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (report.titel && !report.title)
        ? svSpan(escapedTitle, lang)
        : escapedTitle;
      const docName = escapeHtml(report.dokumentnamn || report.dok_id || titleText);

      // Use enriched summary or enhanced summary from metadata
      const summaryText = generateEnhancedSummary(report, 'report', lang);
      const isFromAPI = report.summary || report.notis;
      const reportDefaultVal = L(lang, 'reportDefault');
      const summaryHtml = (report.titel && !report.title && isFromAPI && summaryText !== reportDefaultVal)
        ? svSpan(escapeHtml(summaryText), lang)
        : escapeHtml(summaryText);

      const reportSigVal = L(lang, 'reportSignificance');
      const readFullVal = L(lang, 'readFullReport');
      const whatThisMeansVal = L(lang, 'whatThisMeans');

      content += `
    <div class="report-entry">
      <h4>${titleHtml}</h4>
      <p><strong>${L(lang, 'committee')}:</strong> ${escapeHtml(committeeName)}</p>
      <p>${escapeHtml(String(reportSigVal))} ${summaryHtml}</p>
      <p><strong>${escapeHtml(String(whatThisMeansVal))}:</strong> ${generateDeepPolicyAnalysis(report, lang, 'bet')}</p>
      <p><a href="${sanitizeUrl(report.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
    });
  });

  // Key takeaways section
  content += `\n    <h2>${L(lang, 'keyTakeaways')}</h2>\n`;
  content += `    <div class="context-box">\n      <ul>\n`;

  // Generate analytical takeaways based on committees covered
  const committeeNames = Object.keys(byCommittee).map(c => getCommitteeName(c, lang));
  const activityFn = L(lang, 'committeeActivityTakeaway') as string | ((committees: string, extra: number) => string);
  const takeaway1 = typeof activityFn === 'function'
    ? activityFn(committeeNames.slice(0, 3).join(', '), committeeCount > 3 ? committeeCount - 3 : 0)
    : `Parliamentary committees have been active across ${committeeNames.slice(0, 3).join(', ')}.`;
  const momentumFn = L(lang, 'committeeMomentumTakeaway') as string | ((n: number) => string);
  const takeaway2 = typeof momentumFn === 'function'
    ? momentumFn(reports.length)
    : `A total of ${reports.length} reports demonstrates sustained legislative momentum.`;

  content += `        <li>${escapeHtml(takeaway1)}</li>\n`;
  content += `        <li>${escapeHtml(takeaway2)}</li>\n`;

  // Cross-committee domain analysis: identify which policy areas span multiple committees
  const allDomains = new Set<string>();
  reports.forEach(r => { detectPolicyDomains(r, lang).forEach(d => allDomains.add(d)); });
  if (allDomains.size > 0) {
    const isSv = lang === 'sv';
    const domainList = Array.from(allDomains).slice(0, 3).join(', ');
    const crossAnalysis = isSv
      ? `Betänkandena berör ${escapeHtml(domainList)} – ett mönster som tyder på breda lagstiftningsprioriteringar denna session.`
      : `Reports span ${escapeHtml(domainList)} — a cross-committee pattern signalling the government's broad legislative priorities this session.`;
    content += `        <li>${crossAnalysis}</li>\n`;
  }

  content += `      </ul>\n    </div>\n`;

  return content;
}

/**
 * Generate Propositions content with analytical narrative
 */
function generatePropositionsContent(data: ArticleContentData, lang: Language | string): string {
  const propositions = data.propositions || [];

  let content = `<h2>${L(lang, 'govProps')}</h2>\n`;

  if (propositions.length === 0) {
    content += `<p>${L(lang, 'noProps')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'propsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(propositions.length)
    : `${propositions.length} new government propositions submitted.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Legislative pipeline section
  content += `\n    <h2>${L(lang, 'legislativePipeline')}</h2>\n`;

  // Group propositions by committee; multi-committee → h3 committee + h4 prop, single → h3 prop
  const byCommitteeGroup = groupPropositionsByCommittee(propositions);
  const multiCommittee = byCommitteeGroup.size > 1;

  byCommitteeGroup.forEach((committeeProps, committeeKey) => {
    if (multiCommittee) {
      const committeeLabel = committeeKey
        ? escapeHtml(getCommitteeName(committeeKey, lang))
        : escapeHtml(String(L(lang, 'otherCommittee')));
      content += `    <h3>${committeeLabel}</h3>\n`;
    }
    const headingTag = multiCommittee ? 'h4' : 'h3';

    committeeProps.forEach(prop => {
      const titleText = prop.titel || prop.title || '';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (prop.titel && !prop.title)
        ? svSpan(escapedTitle, lang)
        : escapedTitle;
      const docName = escapeHtml(prop.dokumentnamn || prop.dok_id || titleText);

      // Use enhanced summary based on metadata
      const summaryText = generateEnhancedSummary(prop, 'proposition', lang);
      const isFromAPI = prop.summary || prop.notis;
      const propDefaultVal = L(lang, 'propDefault');
      const summaryHtml = (prop.titel && !prop.title && isFromAPI && summaryText !== propDefaultVal)
        ? svSpan(escapeHtml(summaryText), lang)
        : escapeHtml(summaryText);

      // Show "Referred to" inline only in single-committee view (committee heading covers it otherwise)
      const referredCommittee = prop.organ || prop.committee;
      const referredLine = (!multiCommittee && referredCommittee)
        ? `<br><strong>${L(lang, 'referredTo')}:</strong> ${escapeHtml(getCommitteeName(referredCommittee, lang))}`
        : '';

      const propSigVal = L(lang, 'propSignificance');
      const readFullVal = L(lang, 'readFullProp');
      const whyItMattersVal = L(lang, 'whyItMatters');

      content += `
    <div class="proposition-entry">
      <${headingTag}>${titleHtml}</${headingTag}>
      <p>${escapeHtml(String(propSigVal))} ${summaryHtml}${referredLine}</p>
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${generateDeepPolicyAnalysis(prop, lang, 'prop')}</p>
      <p><a href="${sanitizeUrl(prop.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
    });
  });

  // Policy implications section
  content += `\n    <h2>${L(lang, 'policyImplications')}</h2>\n`;
  content += `    <div class="context-box">\n`;

  // Count unique policy domains across all propositions for accurate "N policy domains" text
  const allPropDomains = new Set<string>();
  propositions.forEach(p => detectPolicyDomains(p, lang).forEach(d => allPropDomains.add(d)));
  const domainCount = allPropDomains.size;

  // Group by referred committee for government priority signal (separate from domain count)
  const byCommittee: Record<string, number> = {};
  propositions.forEach(p => {
    const c = p.organ || p.committee || 'unknown';
    byCommittee[c] = (byCommittee[c] || 0) + 1;
  });

  const implicationFn = L(lang, 'policyImplicationsContext') as string | ((propCount: number, domainCount: number) => string);
  const implication = typeof implicationFn === 'function'
    ? implicationFn(propositions.length, domainCount)
    : `These ${propositions.length} propositions touch on ${domainCount} policy domains.`;
  content += `      <p>${escapeHtml(String(implication))}</p>\n`;

  // Government priority signal: identify the committee receiving the most propositions
  const sortedCommittees = Object.entries(byCommittee)
    .filter(([c]) => c !== 'unknown')
    .sort(([, a], [, b]) => b - a);
  if (sortedCommittees.length > 0) {
    const [topCommittee, topCount] = sortedCommittees[0];
    const topName = getCommitteeName(topCommittee, lang);
    const isSv = lang === 'sv';
    const priorityNote = isSv
      ? `${escapeHtml(topName)} tar emot ${topCount} av propositionerna – ett tecken på att detta är ett centralt prioriterat område för regeringen denna session.`
      : `${escapeHtml(topName)} receives ${topCount} of the propositions — a strong signal of government priority in this policy area this session.`;
    content += `      <p>${priorityNote}</p>\n`;
  }

  content += `    </div>\n`;

  return content;
}

/** Matches a strict proposition ID (YYYY/YY:NNN) in a motion title. */
const PROP_REFERENCE_REGEX = /med anledning av prop\.\s+(\d{4}\/\d{2}:\d+)/i;

/** Captures the descriptive title portion that follows the prop ID. */
const PROP_TITLE_SUFFIX_REGEX = /med anledning av prop\.\s+\d{4}\/\d{2}:\d+\s*(.*)/i;

/**
 * Extract the parent proposition reference (e.g. "2025/26:118") from a motion title.
 * Motions responding to a government proposition have titles like
 * "med anledning av prop. 2025/26:118 Tillståndsprövning enligt förnybartdirektivet".
 */
function extractPropRef(title: string): string | null {
  const m = title.match(PROP_REFERENCE_REGEX);
  return m?.[1] || null;
}

/**
 * Group motions by the parent government proposition they respond to.
 * Motions without a proposition reference are returned separately as "independent".
 */
export function groupMotionsByProposition(motions: RawDocument[]): {
  grouped: Map<string, RawDocument[]>;
  independent: RawDocument[];
} {
  const grouped = new Map<string, RawDocument[]>();
  const independent: RawDocument[] = [];
  for (const motion of motions) {
    const title = motion.titel || motion.title || '';
    const ref = extractPropRef(title);
    if (ref) {
      if (!grouped.has(ref)) grouped.set(ref, []);
      grouped.get(ref)!.push(motion);
    } else {
      independent.push(motion);
    }
  }
  return { grouped, independent };
}

/**
 * Group propositions by their referred committee (organ/committee field).
 * Propositions without a committee use the empty-string key.
 */
export function groupPropositionsByCommittee(propositions: RawDocument[]): Map<string, RawDocument[]> {
  const map = new Map<string, RawDocument[]>();
  for (const prop of propositions) {
    const key = prop.organ ?? prop.committee ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(prop);
  }
  return map;
}

/**
 * Generate Motions content with analytical narrative
 */
function generateMotionsContent(data: ArticleContentData, lang: Language | string): string {
  const motions = data.motions || [];

  let content = `<h2>${L(lang, 'oppMotions')}</h2>\n`;

  if (motions.length === 0) {
    content += `<p>${L(lang, 'noMotions')}</p>\n`;
    return content;
  }

  // Analytical lede paragraph
  const breakdownFn = L(lang, 'motionsBreakdown') as string | ((n: number) => string);
  const breakdownText = typeof breakdownFn === 'function'
    ? breakdownFn(motions.length)
    : `${motions.length} new opposition motions filed.`;
  content += `<p class="article-lede">${escapeHtml(String(breakdownText))}</p>\n`;

  // Group motions by party for strategic analysis
  const byParty: Record<string, RawDocument[]> = {};
  motions.forEach(motion => {
    const party = normalizePartyKey(motion.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(motion);
  });

  // Opposition strategy section with per-party analysis
  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;
  if (partyCount > 1) {
    content += `\n    <h2>${L(lang, 'oppositionStrategy')}</h2>\n`;
    const strategyFn = L(lang, 'oppositionStrategyContext') as string | ((n: number) => string);
    const strategyContext = typeof strategyFn === 'function'
      ? strategyFn(partyCount)
      : `Motions from ${partyCount} different parties reveal the breadth of opposition political criticism and alternative policy agendas.`;
    content += `    <p>${escapeHtml(String(strategyContext))}</p>\n`;
    // Per-party analysis with domain focus
    content += generateOppositionStrategySection(motions, lang);
  }

  // Group "med anledning av prop." motions by parent proposition to eliminate duplicate headings
  const { grouped: groupedByProp, independent: independentMotions } = groupMotionsByProposition(motions);

  if (groupedByProp.size > 0) {
    content += `\n    <h2>${L(lang, 'responsesToProp')}</h2>\n`;
    groupedByProp.forEach((propMotions, propRef) => {
      // Extract the descriptive title portion that follows the prop ID
      const firstTitle = propMotions[0]?.titel || propMotions[0]?.title || '';
      const suffixMatch = firstTitle.match(PROP_TITLE_SUFFIX_REGEX);
      const propTitle = suffixMatch?.[1]?.trim() || String(propRef);
      const safePropRef = escapeHtml(String(propRef));
      const safePropTitle = escapeHtml(propTitle);
      content += `    <h3>Prop. ${safePropRef}: ${svSpan(safePropTitle, lang)}</h3>\n`;
      // Individual motions inside a prop group use h4 to maintain h2→h3→h4 hierarchy
      propMotions.forEach(m => {
        const html = renderMotionEntry(m, lang);
        content += html.replace(/<h3(\b[^>]*)?>/g, '<h4$1>').replace(/<\/h3>/g, '</h4>');
      });
    });
  }

  // Motions to render with thematic analysis:
  // - when proposition groups exist: only independent motions (non-"med anledning av")
  // - when no proposition groups: all motions (preserves existing thematic behaviour)
  const thematicMotions = groupedByProp.size > 0 ? independentMotions : motions;

  if (thematicMotions.length > 0) {
    if (groupedByProp.size > 0) {
      content += `\n    <h2>${L(lang, 'independentMotions')}</h2>\n`;
    }

    // Group motions by primary policy theme for thematic analysis
    const byTheme: Record<string, RawDocument[]> = {};
    thematicMotions.forEach(motion => {
      const domains = detectPolicyDomains(motion, lang);
      const theme = domains[0] || String(L(lang, 'generalMatters'));
      if (!byTheme[theme]) byTheme[theme] = [];
      byTheme[theme].push(motion);
    });
    const themeCount = Object.keys(byTheme).length;

    if (themeCount > 1 && groupedByProp.size === 0) {
      // Suppress "Thematic Analysis" h2 when already under an "Independent Motions" h2
      // (groupedByProp.size === 0 means we are NOT in the split-section layout, so it is
      // safe to emit the additional h2 without creating two consecutive section headers)
      content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;
      Object.entries(byTheme).forEach(([theme, themeMotions]) => {
        content += `\n    <h3>${escapeHtml(theme)} (${themeMotions.length})</h3>\n`;
        themeMotions.forEach(motion => {
          // Demote motion entry headings one level when inside a themed section
          const entryHtml = renderMotionEntry(motion, lang);
          const demotedHtml = entryHtml
            .replace(/<h3(\b[^>]*)?>/g, '<h4$1>')
            .replace(/<\/h3>/g, '</h4>');
          content += demotedHtml;
        });
      });
    } else {
      // Single theme, no detection, or alongside proposition groups: flat list
      thematicMotions.forEach(motion => { content += renderMotionEntry(motion, lang); });
    }
  }

  // Party activity breakdown
  if (partyCount > 0) {
    content += `\n    <h2>${L(lang, 'coalitionDynamics')}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byParty).forEach(([party, partyMotions]) => {
      if (party !== 'other') {
        const detailFn = L(lang, 'partyMotionsFiled') as string | ((party: string, n: number) => string);
        const detail = typeof detailFn === 'function'
          ? detailFn(party, partyMotions.length)
          : `${party}: ${partyMotions.length} motions filed`;
        content += `        <li>${escapeHtml(String(detail))}</li>\n`;
      }
    });
    content += `      </ul>\n    </div>\n`;
  }

  return content;
}

/**
 * Render a single motion entry div (shared between flat list and themed sections).
 */
function renderMotionEntry(motion: RawDocument, lang: Language | string): string {
  const titleText = motion.titel || motion.title || '';
  const escapedTitle = escapeHtml(titleText);
  const titleHtml = (motion.titel && !motion.title)
    ? svSpan(escapedTitle, lang)
    : escapedTitle;
  const docName = escapeHtml(motion.dokumentnamn || motion.dok_id || titleText);

  // Use enriched author and party data, with fallback parsing from raw notis.
  // Treat 'Unknown' sentinel (set by enrichDocumentsWithContent) as missing so
  // we attempt parseMotionAuthorParty before giving up.
  const unknownVal = L(lang, 'unknown');
  let authorName = (motion.intressent_namn !== 'Unknown' ? motion.intressent_namn : null)
                || (motion.author !== 'Unknown' ? motion.author : null)
                || '';
  let partyName = (motion.parti !== 'Unknown' ? motion.parti : '') || '';
  // Fire fallback when EITHER author or party is missing — covers the party-only sentinel case
  // where intressent_namn is valid but parti was 'Unknown' and stripped to ''.
  if (!authorName || !partyName) {
    const rawText = motion.undertitel || motion.summary || motion.notis || motion.fullText || motion.titel || motion.rubrik || '';
    const parsed = parseMotionAuthorParty(rawText);
    if (parsed) {
      if (parsed.author && !authorName) authorName = parsed.author;
      if (parsed.party && !partyName) partyName = parsed.party;
    }
  }
  if (!authorName) authorName = typeof unknownVal === 'string' ? unknownVal : 'Unknown';
  const authorLine = partyName
    ? `${escapeHtml(authorName)} (${escapeHtml(partyName)})`
    : escapeHtml(authorName);

  // Use enhanced summary based on metadata (cleanMotionText strips Swedish boilerplate)
  const summaryText = generateEnhancedSummary(motion, 'motion', lang);
  const motionDefaultVal = L(lang, 'motionDefault');
  // Only wrap in Swedish-language span when the content comes from a Swedish source
  const isSwedishContent = (motion.titel && !motion.title)
    || (motion.summary || motion.notis || '').includes('Motion till riksdagen');
  const summaryHtml = (summaryText && summaryText !== motionDefaultVal && isSwedishContent)
    ? svSpan(escapeHtml(summaryText), lang)
    : escapeHtml(summaryText || (typeof motionDefaultVal === 'string' ? motionDefaultVal : ''));

  const readFullVal = L(lang, 'readFullMotion');
  const whyItMattersVal = L(lang, 'whyItMatters');

  return `
    <div class="motion-entry">
      <h3>${titleHtml}</h3>
      <p><strong>${L(lang, 'filedBy')}:</strong> ${authorLine}</p>
      <p>${summaryHtml}</p>
      <p><strong>${escapeHtml(String(whyItMattersVal))}:</strong> ${generateDeepPolicyAnalysis(motion, lang, 'mot')}</p>
      <p><a href="${sanitizeUrl(motion.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(String(readFullVal))}: ${docName}</a></p>
    </div>
`;
}

/**
 * Detect policy domains from a document's title and committee code.
 * Returns a deduplicated array of localised domain strings.
 */
function detectPolicyDomains(doc: RawDocument, lang: Language | string = 'en'): string[] {
  const title = (doc.titel || doc.title || '').toLowerCase();
  const organ = doc.organ || doc.committee || '';
  const isSv = lang === 'sv';
  const set = new Set<string>();

  if (title.includes('skatt') || title.includes('tax') || title.includes('budget') || title.includes('finans')
      || title.includes('makrotillsyn') || title.includes('macroprudential')
      || organ === 'SkU' || organ === 'FiU')
    set.add(isSv ? 'finanspolitik' : 'fiscal policy');
  if (title.includes('försvar') || title.includes('defen') || title.includes('militär') || title.includes('nato')
      || organ === 'FöU')
    set.add(isSv ? 'försvars- och säkerhetspolitik' : 'defence and security policy');
  if (title.includes('miljö') || title.includes('klimat') || title.includes('environ') || title.includes('energi')
      || title.includes('förnybart') || title.includes('renewable') || title.includes('koldioxid')
      || title.includes('hållbar') || title.includes('sustain')
      || organ === 'MJU')
    set.add(isSv ? 'miljö- och klimatpolitik' : 'environmental and climate policy');
  if (title.includes('utbildning') || title.includes('educ') || title.includes('skola') || title.includes('högskola')
      || organ === 'UbU')
    set.add(isSv ? 'utbildningspolitik' : 'education policy');
  if (title.includes('vård') || title.includes('hälsa') || title.includes('health') || title.includes('omsorg')
      || organ === 'SoU')
    set.add(isSv ? 'hälso- och sjukvårdspolitik' : 'healthcare policy');
  if (title.includes('migration') || title.includes('invandring') || title.includes('asyl') || title.includes('utlänning')
      || organ === 'SfU')
    set.add(isSv ? 'migrationspolitik' : 'migration policy');
  if (/\beu\b/.test(title) || title.includes('europa') || title.includes('utrik') || title.includes('foreign')
      || organ === 'UU')
    set.add(isSv ? 'EU- och utrikespolitik' : 'EU and foreign affairs');
  if (title.includes('brott') || title.includes('straff') || title.includes('polis') || title.includes('justice')
      || title.includes('kriminal') || organ === 'JuU')
    set.add(isSv ? 'rättspolitik' : 'justice policy');
  if (title.includes('arbetsmarknad') || title.includes('labour') || title.includes('anställning')
      || title.includes('facklig') || organ === 'AU')
    set.add(isSv ? 'arbetsmarknadspolitik' : 'labour market policy');
  if (title.includes('bostad') || title.includes('housing') || title.includes('hyra') || title.includes('bostadsrätt')
      || title.includes('lagfart') || title.includes('fastighet')
      || organ === 'CU')
    set.add(isSv ? 'bostadspolitik' : 'housing policy');
  if (title.includes('trafik') || title.includes('transport') || title.includes('järnväg') || title.includes('väg')
      || organ === 'TU')
    set.add(isSv ? 'transportpolitik' : 'transport policy');
  if (title.includes('näring') || title.includes('handel') || title.includes('trade') || title.includes('industri')
      || title.includes('företag') || organ === 'NU')
    set.add(isSv ? 'näringspolitik' : 'trade and industry policy');

  return Array.from(set);
}

type _LangPair = { en: Record<string, string>; sv: Record<string, string> };

/** Module-level constant — allocated once, shared across all calls. */
const DOMAIN_ANALYSES: Record<string, _LangPair> = {
    'fiscal policy': {
      en: {
        mot: 'Fiscal policy motions directly challenge the government\'s budget assumptions and signal opposition readiness to contest tax and spending priorities.',
        bet: 'The Finance Committee\'s position on fiscal matters is usually decisive — the chamber almost always follows its recommendation on budgetary questions.',
        default: 'Government fiscal proposals must clear rigorous Finance Committee scrutiny and align with Sweden\'s fiscal surplus rule, making the committee\'s verdict pivotal.'
      },
      sv: {
        mot: 'Finanspolitiska motioner utmanar direkt regeringens budgetantaganden och signalerar oppositionens beredskap att bestrida skatte- och utgiftsprioriteringar.',
        bet: 'Finansutskottets ståndpunkt i finanspolitiska frågor är i regel avgörande – kammaren följer nästan alltid utskottets rekommendation.',
        default: 'Regeringens finanspolitiska förslag måste klara finansutskottets granskning och harmonisera med överskottsmålet för att nå bifall.'
      }
    },
    'defence and security policy': {
      en: {
        mot: 'Defence motions carry heightened strategic significance following Sweden\'s NATO accession, pressing the government on long-term security commitments.',
        bet: 'Committee reports on defence shape Sweden\'s military posture and NATO integration trajectory — decisions here have multi-decade consequences.',
        default: 'Defence proposals engage Sweden\'s NATO obligations and cross-party consensus-building mechanisms for national security legislation.'
      },
      sv: {
        mot: 'Försvarsrelaterade motioner har förhöjd strategisk betydelse efter Sveriges NATO-inträde och pressar regeringen om långsiktiga säkerhetsåtaganden.',
        bet: 'Utskottsbetänkanden om försvar formar Sveriges militära inriktning och NATO-integration – besluten har konsekvenser i decennier.',
        default: 'Försvarspropositioner engagerar Sveriges NATO-förpliktelser och mekanismer för brett partistöd inom säkerhetspolitiken.'
      }
    },
    'environmental and climate policy': {
      en: {
        mot: 'Climate motions reflect growing parliamentary pressure for faster decarbonisation, often targeting specific industries or the pace of policy implementation.',
        bet: 'The Environment Committee\'s recommendations balance climate ambition against economic competitiveness — its position sets the legislative baseline.',
        default: 'Environmental proposals must navigate competing interests from industry, regional governments, and EU climate commitments, making parliamentary support critical.'
      },
      sv: {
        mot: 'Klimatmotioner speglar växande parlamentariskt tryck för snabbare koldioxidminskning och riktar sig ofta mot specifika branscher.',
        bet: 'Miljöutskottet väger klimatambition mot ekonomisk konkurrenskraft – dess rekommendation sätter lagstiftningens utgångspunkt.',
        default: 'Miljöförslag måste navigera konkurrerande intressen från industrin, regionerna och EU:s klimatåtaganden.'
      }
    },
    'healthcare policy': {
      en: {
        mot: 'Healthcare motions typically target gaps in regional service delivery, pressing for national minimum standards, additional funding, or new patient rights.',
        bet: 'Social Affairs Committee reports on healthcare set the framework for Sweden\'s regionally delivered but nationally financed health system.',
        default: 'Healthcare proposals require coordination between national government, regional councils, and professional bodies — a complexity that shapes the legislative timeline.'
      },
      sv: {
        mot: 'Hälso- och sjukvårdsmotioner riktar sig typiskt mot brister i regionala tjänster och driver på för nationella miniminivåer eller nya patienträttigheter.',
        bet: 'Socialutskottets betänkanden om hälso- och sjukvård sätter ramarna för det regionalt levererade men nationellt finansierade hälsosystemet.',
        default: 'Hälso- och sjukvårdspropositioner kräver samordning mellan stat, regioner och professioner – en komplexitet som formar lagstiftningens tidslinje.'
      }
    },
    'migration policy': {
      en: {
        mot: 'Migration motions reflect one of Sweden\'s most contested policy areas, with parties divided on asylum rules, integration requirements, and deportation procedures.',
        bet: 'The Social Insurance Committee\'s migration reports navigate Sweden\'s EU law obligations and UN Refugee Convention commitments alongside domestic political pressures.',
        default: 'Migration proposals must balance EU regulatory obligations with national political imperatives, making cross-party support essential for durable legislation.'
      },
      sv: {
        mot: 'Migrationsmotioner speglar ett av Sveriges mest omtvistade politikområden, med partier delade om asylregler, integrationskrav och återvändanderutiner.',
        bet: 'Socialförsäkringsutskottets migrationsbetänkanden navigerar Sveriges åtaganden enligt EU-rätten och FN:s flyktingkonvention.',
        default: 'Migrationspropositioner måste balansera EU-rättsliga förpliktelser med nationella politiska imperativ.'
      }
    },
    'EU and foreign affairs': {
      en: {
        mot: 'EU and foreign affairs motions signal parliamentary expectations for government negotiating positions — influential despite executive prerogative in external relations.',
        bet: 'The Foreign Affairs Committee\'s reports on EU matters reflect Sweden\'s positioning within the bloc and may bind future negotiating postures.',
        default: 'EU and foreign affairs proposals engage Sweden\'s treaty obligations and often require coordination with European partners before domestic enactment.'
      },
      sv: {
        mot: 'EU- och utrikespolitiska motioner signalerar parlamentets förväntningar på regeringens förhandlingspositioner.',
        bet: 'Utrikesutskottets betänkanden om EU-frågor speglar Sveriges positionering inom unionen och kan binda framtida förhandlingslinjer.',
        default: 'EU- och utrikespropositioner engagerar Sveriges fördragsförpliktelser och kräver samordning med europeiska partner.'
      }
    },
    'justice policy': {
      en: {
        mot: 'Justice motions address crime, sentencing, and policing — areas with high public salience where opposition parties frequently press for tougher or more targeted measures.',
        bet: 'The Justice Committee shapes the criminal law framework; its reports on sentencing and policing directly affect prosecution practice and enforcement priorities.',
        default: 'Justice proposals balance rule-of-law principles, human rights obligations, and public safety demands — requiring careful drafting to withstand constitutional scrutiny.'
      },
      sv: {
        mot: 'Rättsliga motioner rör brott, straff och polis – frågor med hög allmän relevans där oppositionen ofta driver på för hårdare åtgärder.',
        bet: 'Justitieutskottet formar den straffrättsliga ramen; dess betänkanden om straffsatser och polisverksamhet påverkar direkt åklagarnas praxis.',
        default: 'Rättsliga propositioner balanserar rättsstatsprinciper, mänskliga rättigheter och allmän säkerhet.'
      }
    },
    'labour market policy': {
      en: {
        mot: 'Labour market motions engage sensitive negotiations between employers, unions, and the state — every motion sends a signal to Sweden\'s social partners.',
        bet: 'The Labour Committee\'s reports on workplace legislation must navigate collective bargaining autonomy while setting minimum statutory floors.',
        default: 'Labour market proposals enter an arena where tripartite negotiation shapes the final legislative outcome as much as parliamentary votes.'
      },
      sv: {
        mot: 'Arbetsmarknadsmotioner engagerar känsliga förhandlingar mellan arbetsgivare, fackförbund och stat – varje motion signalerar till parterna.',
        bet: 'Arbetsmarknadsutskottets betänkanden om arbetsplatslagar måste navigera kollektivavtalens självständighet.',
        default: 'Arbetsmarknadspropositioner träder in i en arena där trepartsförhandlingar formar det slutliga lagstiftningsresultatet.'
      }
    },
    'housing policy': {
      en: {
        mot: 'Housing motions reflect structural tension between demand for affordable homes and constraints of planning law, rent regulation, and construction cost pressures.',
        bet: 'The Civil Affairs Committee\'s housing reports address one of Sweden\'s most persistent policy challenges, where committee decisions unlock or block major regulatory change.',
        default: 'Housing proposals must reconcile competing interests from municipalities, property owners, tenants, and developers — a coalition rarely achieved quickly.'
      },
      sv: {
        mot: 'Bostadsmotioner speglar strukturell spänning mellan efterfrågan på prisvärda bostäder och begränsningarna i plan- och hyreslagstiftning.',
        bet: 'Civilutskottets bostadsbetänkanden hanterar en av Sveriges mest ihållande politiska utmaningar.',
        default: 'Bostadspropositioner måste balansera konkurrerande intressen från kommuner, fastighetsägare, hyresgäster och byggföretag.'
      }
    },
    'transport policy': {
      en: {
        mot: 'Transport motions address infrastructure investment, road safety, and public transit — areas where regional and national interests frequently diverge.',
        bet: 'The Transport Committee\'s reports guide Sweden\'s national infrastructure planning cycle, directly affecting long-term investment priorities.',
        default: 'Transport proposals engage the national infrastructure budget, regional equity, and climate transition targets — all must be balanced in committee deliberation.'
      },
      sv: {
        mot: 'Transportmotioner rör infrastrukturinvesteringar, trafiksäkerhet och kollektivtrafik – frågor där regionala och nationella intressen ofta divergerar.',
        bet: 'Trafikutskottets betänkanden vägleder Sveriges nationella infrastrukturplanering och påverkar direkt långsiktiga investeringsprioriteringar.',
        default: 'Transportpropositioner engagerar den nationella infrastrukturbudgeten, regional jämlikhet och klimatomställningsmål.'
      }
    },
    'trade and industry policy': {
      en: {
        mot: 'Industry and trade motions often target competitiveness, innovation, or trade agreements — signalling party positions ahead of EU-level or bilateral negotiations.',
        bet: 'The Committee on Industry and Trade shapes Sweden\'s business environment through reports that set conditions for investment, innovation, and exports.',
        default: 'Industry and trade proposals engage international commitments, EU single-market rules, and domestic competitiveness imperatives simultaneously.'
      },
      sv: {
        mot: 'Näringspolitiska motioner riktar sig ofta mot konkurrenskraft, innovation eller handelsavtal och signalerar partipositioner inför förhandlingar.',
        bet: 'Näringsutskottets betänkanden formar Sveriges affärsmiljö och sätter villkoren för investeringar och export.',
        default: 'Näringspolitiska propositioner engagerar internationella åtaganden, EU:s inre marknadsregler och inhemsk konkurrenskraft.'
      }
    },
    'education policy': {
      en: {
        mot: 'Education motions reflect deep disagreements on school standards, teacher pay, and the role of independent schools — one of Sweden\'s most contested domestic debates.',
        bet: 'The Education Committee\'s reports directly shape curriculum standards, funding formulas, and school regulation — decisions with long generational consequences.',
        default: 'Education proposals must balance national curriculum standards with municipal delivery autonomy and the contested role of private providers in the Swedish school system.'
      },
      sv: {
        mot: 'Utbildningsmotioner speglar djupa meningsskiljaktigheter om skolstandard, lärarlöner och friskolornas roll.',
        bet: 'Utbildningsutskottets betänkanden formar direkt läroplaner, finansieringsmodeller och skolreglering.',
        default: 'Utbildningspropositioner måste balansera nationella läroplaner med kommunalt leveransansvar och de privata aktörernas omstridda roll.'
      }
    }
};

/** Module-level constant — allocated once, shared across all calls. */
const EN_DOMAIN_MAP: Record<string, string> = {
  'finanspolitik': 'fiscal policy',
  'försvars- och säkerhetspolitik': 'defence and security policy',
  'miljö- och klimatpolitik': 'environmental and climate policy',
  'utbildningspolitik': 'education policy',
  'hälso- och sjukvårdspolitik': 'healthcare policy',
  'migrationspolitik': 'migration policy',
  'EU- och utrikespolitik': 'EU and foreign affairs',
  'rättspolitik': 'justice policy',
  'arbetsmarknadspolitik': 'labour market policy',
  'bostadspolitik': 'housing policy',
  'transportpolitik': 'transport policy',
  'näringspolitik': 'trade and industry policy'
};

/**
 * Return a substantive domain-specific and type-specific analysis sentence.
 * Each of 12 policy domains has tailored text for motions (mot), committee
 * reports (bet), and propositions/default, in both English and Swedish.
 */
function getDomainSpecificAnalysis(primaryDomain: string, doktyp: string, lang: Language | string): string {
  const isSv = lang === 'sv';

  const lookupKey = EN_DOMAIN_MAP[primaryDomain] ?? primaryDomain;
  const entry = DOMAIN_ANALYSES[lookupKey];
  if (!entry) return '';

  const langEntry = isSv ? entry.sv : entry.en;
  const typeKey = (doktyp === 'mot' || doktyp === 'bet') ? doktyp : 'default';
  return langEntry[typeKey] ?? langEntry['default'] ?? '';
}

/**
 * Generate policy significance context for a document based on its metadata.
 * Uses the localised policySignificanceTouches label plus a domain-specific
 * analysis sentence instead of generic boilerplate.
 * @param impliedDoktyp - document type inferred from the calling context
 *   ('mot', 'bet', 'prop') when doc.doktyp / doc.documentType is absent.
 */
function generatePolicySignificance(doc: RawDocument, lang: Language | string, impliedDoktyp?: string): string {
  const domains = detectPolicyDomains(doc, lang);

  if (domains.length > 0) {
    const domainsStr = domains.join(', ');
    const touchesFn = L(lang, 'policySignificanceTouches') as string | ((d: string) => string);
    const baseText = typeof touchesFn === 'function'
      ? touchesFn(escapeHtml(domainsStr))
      : `Touches on ${escapeHtml(domainsStr)}.`;

    const doktyp = doc.doktyp || doc.documentType || impliedDoktyp || '';
    const deepAnalysis = getDomainSpecificAnalysis(domains[0] ?? '', doktyp, lang);
    return deepAnalysis ? `${baseText} ${deepAnalysis}` : baseText;
  }

  // Generic significance when no domain detected
  const genericVal = L(lang, 'policySignificanceGeneric');
  return typeof genericVal === 'string' ? genericVal : 'Requires committee review and chamber debate before a decision is reached.';
}

/**
 * Generate deep policy analysis for a single document entry.
 * Only uses `fullText` / `fullContent` (enriched content fetched separately)
 * as the passage source — summary/notis are already shown in the summary line
 * above in structured views and must not be duplicated here.
 * Falls back to generatePolicySignificance when no enriched text is available.
 * @param impliedDoktyp - document type inferred from the calling context
 *   ('mot', 'bet', 'prop') when doc.doktyp / doc.documentType is absent.
 */
function generateDeepPolicyAnalysis(doc: RawDocument, lang: Language | string, impliedDoktyp?: string): string {
  const effectiveDoktyp = doc.doktyp || doc.documentType || impliedDoktyp || '';
  const rawText = doc.fullText || doc.fullContent || '';
  if (rawText && !isPersonProfileText(rawText)) {
    const cleanedText = (effectiveDoktyp === 'mot' && rawText.includes('Motion till riksdagen'))
      ? cleanMotionText(rawText)
      : rawText;
    const passage = extractKeyPassage(cleanedText, 300);
    if (passage) {
      const isSwedishSource = !!(doc.titel && !doc.title);
      const passageHtml = isSwedishSource
        ? svSpan(escapeHtml(passage), lang)
        : escapeHtml(passage);
      return `${passageHtml} ${generatePolicySignificance(doc, lang, impliedDoktyp)}`;
    }
  }
  return generatePolicySignificance(doc, lang, impliedDoktyp);
}

/**
 * Normalise a raw `parti` field to a canonical party key.
 * Maps missing, empty, or any capitalisation of 'unknown' to 'other'.
 * Used in both generateMotionsContent (party grouping) and
 * generateOppositionStrategySection so both sections treat the sentinel
 * identically regardless of capitalisation.
 */
function normalizePartyKey(parti: unknown): string {
  const raw = typeof parti === 'string' ? parti.trim() : '';
  return !raw || raw.toLowerCase() === 'unknown' ? 'other' : raw;
}

/**
 * Generate an opposition-strategy analysis paragraph.
 * Identifies which party is most active, what policy areas they focus on,
 * and which other party follows — turning raw party counts into narrative.
 */
function generateOppositionStrategySection(motions: RawDocument[], lang: Language | string): string {
  const byParty: Record<string, RawDocument[]> = {};
  motions.forEach(m => {
    const party = normalizePartyKey(m.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(m);
  });

  const sortedParties = Object.entries(byParty)
    .filter(([p]) => p !== 'other')
    .sort(([, a], [, b]) => b.length - a.length);

  if (sortedParties.length === 0) return '';

  const [topParty, topMotions] = sortedParties[0];

  // Identify primary policy domain(s) for the most-active party
  const topDomainSet = new Set<string>();
  topMotions.forEach(m => {
    detectPolicyDomains(m, lang).forEach(d => topDomainSet.add(d));
  });
  const topDomains = Array.from(topDomainSet).slice(0, 2);

  const isSv = lang === 'sv';
  const count = topMotions.length;
  let text = '';

  if (isSv) {
    const domainList = topDomains.join(' och ');
    text = `<strong>${escapeHtml(topParty)}</strong> är mest aktiv med ${count} motion${count !== 1 ? 'er' : ''}`;
    if (domainList) text += `, med fokus på ${escapeHtml(domainList)}`;
    text += '.';
  } else {
    const domainList = topDomains.join(' and ');
    text = `<strong>${escapeHtml(topParty)}</strong> leads opposition activity with ${count} motion${count !== 1 ? 's' : ''}`;
    if (domainList) text += `, focused on ${escapeHtml(domainList)}`;
    text += '.';
  }

  if (sortedParties.length > 1) {
    const [secondParty, secondMotions] = sortedParties[1];
    const n = secondMotions.length;
    text += isSv
      ? ` ${escapeHtml(secondParty)} följer med ${n} motion${n !== 1 ? 'er' : ''}.`
      : ` ${escapeHtml(secondParty)} follows with ${n} motion${n !== 1 ? 's' : ''}.`;
  }

  return `    <p>${text}</p>\n`;
}

/**
 * Extract the most analytically useful excerpt from full document text.
 * Returns first substantive paragraph (skips short headings/metadata lines).
 */
function extractKeyPassage(fullText: string | undefined, maxChars = 600): string {
  if (!fullText) return '';
  // Strip HTML tags if present
  const plain = fullText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= maxChars) return plain;
  // Find a sentence boundary near maxChars
  const cut = plain.lastIndexOf('.', maxChars);
  return cut > 100 ? plain.slice(0, cut + 1) : plain.slice(0, maxChars) + '…';
}

/**
 * Look up party motion success rate from CIA context.
 * Returns null when data is unavailable so callers can skip the annotation.
 */
function partyMotionSuccessRate(party: string | undefined, cia: CIAContext | undefined): number | null {
  if (!cia || !party) return null;
  const p = cia.partyPerformance.find(x => x.id === party || x.partyName.toLowerCase().startsWith(party.toLowerCase()));
  return p ? p.metrics.successRate : null;
}

/**
 * Generate per-document analysis.
 * PRIMARY: full document text, policy significance, related speeches.
 * SECONDARY (only when genuinely informative): CIA historical context footnote.
 */
function generateDocumentIntelligenceAnalysis(doc: RawDocument, docType: string, cia: CIAContext | undefined, lang: Language | string): string {
  const parts: string[] = [];

  // Normalise short doktyp codes to the names used by generateEnhancedSummary
  const normalizedType = docType === 'prop' ? 'proposition'
    : docType === 'bet' ? 'report'
    : docType === 'mot' ? 'motion'
    : docType;

  // ── PRIMARY: full document text or best available summary ────────────────
  const rawText = doc.fullText || doc.fullContent || doc.summary || doc.notis || '';
  // Discard person-profile data (MP status lines, deceased notices) — these are
  // not document content and must never appear in article document entries.
  const safeRawText = isPersonProfileText(rawText) ? '' : rawText;
  // For motions, clean Swedish boilerplate before extracting passage
  const cleanedText = (normalizedType === 'motion' && safeRawText.includes('Motion till riksdagen'))
    ? cleanMotionText(safeRawText)
    : safeRawText;
  const passage = extractKeyPassage(cleanedText, 500);
  if (passage) {
    const isSwedishSource = !!(doc.titel && !doc.title);
    parts.push(isSwedishSource
      ? svSpan(escapeHtml(passage), lang)
      : escapeHtml(passage));
  } else {
    parts.push(escapeHtml(generateEnhancedSummary(doc, normalizedType, lang)));
  }

  // ── PRIMARY: policy domain significance derived from document content ────
  const significance = generatePolicySignificance(doc, lang, docType);
  parts.push(`<strong>${escapeHtml(String(L(lang, 'whatThisMeans')))}:</strong> ${significance}`);

  // ── PRIMARY: related speeches (direct evidence from the chamber) ─────────
  const speeches = doc.speeches || [];
  if (speeches.length > 0) {
    const speakerLines = speeches.slice(0, 2).map(s => {
      const who = [s.talare, s.parti ? `(${s.parti})` : ''].filter(Boolean).join(' ');
      return who ? escapeHtml(who) : 'Unknown speaker';
    }).join(', ');
    parts.push(`<em>Debate contributions from: ${speakerLines}.</em>`);
  }

  // ── SECONDARY: CIA historical context — only where it adds real perspective
  // For motions: historical passage rate is highly relevant context since
  // almost all opposition motions are denied (~99%). Only show when we have
  // an actual party-specific rate, so the note is concrete, not generic.
  if (docType === 'mot' && cia) {
    // Try to get party from doc fields, else parse from raw text
    let party = doc.parti;
    if (!party) {
      const rawText2 = doc.summary || doc.notis || doc.fullText || '';
      const parsed2 = parseMotionAuthorParty(rawText2);
      if (parsed2) party = parsed2.party;
    }
    const rate = partyMotionSuccessRate(party, cia);
    if (rate !== null && party) {
      parts.push(
        `<small class="cia-context">Historical context: ${escapeHtml(party)} motions have a ${escapeHtml(rate.toFixed(1))}% passage rate ` +
        `(${escapeHtml(String(cia.overallMotionDenialRate))}% of all opposition motions are rejected). ` +
        `This motion signals a policy position rather than an imminent legislative change.</small>`
      );
    }
  }

  // For propositions: coalition note is already in the article-level summary; skip per-document repetition.
  // (Moved to generateGenericContent key-takeaways section.)

  return parts.join(' ');
}

/**
 * Generate generic content with deep per-document analysis.
 * Document content is the primary source. CIA data provides historical
 * context only where it genuinely adds perspective.
 * Used for weekly-review, monthly-review, and breaking article types.
 */
function generateGenericContent(data: ArticleContentData, lang: Language | string): string {
  const docs = data.documents || [];
  if (docs.length === 0) {
    return `<p>${L(lang, 'genericContent')}</p>`;
  }

  const cia = data.ciaContext;
  let content = '';

  // ── Overview lede (from document count) ────────────────────────────────
  const overviewFn = L(lang, 'genericOverview') as string | ((n: number) => string);
  const overview = typeof overviewFn === 'function'
    ? overviewFn(docs.length)
    : `During this period, ${docs.length} documents were processed in parliament.`;
  content += `<p class="article-lede">${escapeHtml(String(overview))}</p>\n`;

  // ── Group by document type ───────────────────────────────────────────────
  const byType: Record<string, RawDocument[]> = {};
  docs.forEach(doc => {
    const docType = doc.doktyp || doc.documentType || 'other';
    if (!byType[docType]) byType[docType] = [];
    byType[docType].push(doc);
  });

  content += `\n    <h2>${L(lang, 'thematicAnalysis')}</h2>\n`;

  // Render in significance order: propositions → committee reports → motions → rest
  const typeOrder = ['prop', 'bet', 'skr', 'mot', 'other'];
  const sortedTypes = [...Object.keys(byType)].sort((a, b) => {
    const ai = typeOrder.indexOf(a); const bi = typeOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const docType of sortedTypes) {
    const typeDocs = byType[docType] ?? [];
    const otherDocsVal = L(lang, 'otherDocuments');
    const otherDocsLabel = typeof otherDocsVal === 'string' ? otherDocsVal : 'Other documents';
    const typeLabel = docType === 'mot' ? (lang === 'sv' ? 'Motioner' : 'Motions')
      : docType === 'prop' ? (lang === 'sv' ? 'Propositioner' : 'Propositions')
      : docType === 'bet' ? (lang === 'sv' ? 'Betänkanden' : 'Committee Reports')
      : docType === 'skr' ? (lang === 'sv' ? 'Skrivelser' : 'Government Communications')
      : docType === 'other' ? otherDocsLabel
      : docType;

    content += `\n    <h3>${escapeHtml(typeLabel)} (${typeDocs.length})</h3>\n`;

    // ── Per-document deep analysis ───────────────────────────────────────
    for (const doc of typeDocs) {
      const titleText = doc.titel || doc.title || '';
      const escapedTitle = escapeHtml(titleText);
      const titleHtml = (doc.titel && !doc.title)
        ? svSpan(escapedTitle, lang)
        : escapedTitle;

      const analysis = generateDocumentIntelligenceAnalysis(doc, docType, cia, lang);

      content += `    <div class="document-entry">\n`;
      content += `      <h4>${titleHtml}</h4>\n`;
      content += `      <p>${analysis}</p>\n`;
      if (doc.url) {
        content += `      <p><a href="${sanitizeUrl(doc.url)}" class="document-link" rel="noopener noreferrer">${escapeHtml(doc.dokumentnamn || doc.dok_id || titleText)}</a></p>\n`;
      }
      content += `    </div>\n`;
    }
  }

  // ── Key takeaways ────────────────────────────────────────────────────────
  content += `\n    <h2>${L(lang, 'keyTakeaways')}</h2>\n`;
  content += `    <div class="context-box">\n      <ul>\n`;

  // Document type distribution
  const typeDescriptions = sortedTypes.map(docType => {
    const typeDocs = byType[docType] ?? [];
    const label = docType === 'mot' ? 'motions'
      : docType === 'prop' ? 'propositions'
      : docType === 'bet' ? 'committee reports'
      : docType === 'skr' ? 'government communications'
      : docType;
    return `${typeDocs.length} ${label}`;
  });
  if (typeDescriptions.length > 0) {
    content += `        <li>${escapeHtml(typeDescriptions.join(', '))} processed this period</li>\n`;
  }

  // Policy domains — show labels only to keep the bullet concise
  const allDomains = new Set<string>();
  const enrichedCount = docs.filter(d => d.contentFetched).length;
  docs.forEach(doc => {
    detectPolicyDomains(doc, lang).forEach(d => allDomains.add(d));
  });
  if (allDomains.size > 0) {
    const policyContextVal = L(lang, 'policyContext');
    content += `        <li>${escapeHtml(String(policyContextVal))}: ${escapeHtml(Array.from(allDomains).slice(0, 4).join('; '))}</li>\n`;
  }
  if (enrichedCount > 0) {
    content += `        <li><strong>Analysis depth:</strong> ${enrichedCount} of ${docs.length} documents analysed with full text</li>\n`;
  }

  // ── SECONDARY: CIA context only when it changes interpretation ───────────
  // Razor-thin majority is actionable intelligence worth flagging once, in summary
  if (cia && cia.coalitionStability.majorityMargin <= 2) {
    content += `        <li><small class="cia-context">Historical context: the current ${cia.coalitionStability.majorityMargin}-seat majority means ` +
      `any single defection or absence could reverse outcomes this week.</small></li>\n`;
  }

  content += `      </ul>\n    </div>\n`;

  return content;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Get localized label with fallback to English
 */
export function L(lang: Language | string, key: string): ContentLabelSet[keyof ContentLabelSet] {
  const langLabels = CONTENT_LABELS[lang as Language];
  const value = langLabels?.[key as keyof ContentLabelSet];
  if (value !== undefined) return value;
  return CONTENT_LABELS.en[key as keyof ContentLabelSet];
}

/**
 * Transform calendar events into event grid structure for template
 */
export function transformCalendarToEventGrid(events: RawCalendarEvent[], lang: Language = 'en'): EventGridItem[] {
  if (!events || events.length === 0) return [];

  // Group events by date
  const eventsByDate: Record<string, RawCalendarEvent[]> = {};
  events.forEach(event => {
    // Extract date from various field formats (MCP responses use 'from', 'start', or 'datum')
    let dateStr = event.datum || event.from || event.start;
    if (dateStr) {
      // Extract just the date part if it's an ISO timestamp
      dateStr = dateStr.split('T')[0];
    }
    if (!dateStr) return;

    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = [];
    }
    eventsByDate[dateStr]!.push(event);
  });

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();

  // Convert to grid format
  const eventGrid: EventGridItem[] = sortedDates.map(date => {
    const dateObj = new Date(date);
    const isTodayFlag = isTodayDate(dateObj);

    return {
      date: date,
      dayName: formatDayName(dateObj, lang),
      dayNumber: dateObj.getDate().toString(),
      dayLabel: formatDayLabel(dateObj, lang),
      isToday: isTodayFlag,
      items: (eventsByDate[date] ?? []).map(event => ({
        time: event.tid || event.time || 'Expected',
        title: event.rubrik || event.titel || event.title || 'Event'
      }))
    };
  });

  return eventGrid;
}

/**
 * Extract key topics from documents
 */
export function extractTopics(documents: RawDocument[]): string[] {
  const topics = new Set<string>();

  documents.forEach(doc => {
    // Extract from document type
    if (doc.doktyp) {
      switch (doc.doktyp) {
        case 'mot': topics.add('motions'); break;
        case 'prop': topics.add('propositions'); break;
        case 'bet': topics.add('committee-reports'); break;
        case 'skr': topics.add('government-communication'); break;
      }
    }

    // Extract from organ/committee
    if (doc.organ) {
      topics.add(`${doc.organ.toLowerCase()}-committee`);
    }

    // Extract from title keywords
    const title = (doc.titel || doc.rubrik || '').toLowerCase();
    if (title.includes('eu')) topics.add('eu');
    if (title.includes('försvar')) topics.add('defense');
    if (title.includes('ekonomi')) topics.add('economy');
    if (title.includes('miljö')) topics.add('environment');
    if (title.includes('migration')) topics.add('migration');
    if (title.includes('utbildning')) topics.add('education');
    if (title.includes('vård')) topics.add('healthcare');
  });

  return Array.from(topics).slice(0, 10); // Max 10 topics
}

/**
 * Generate article content from MCP data
 */
export function generateArticleContent(data: ArticleContentData, type: ArticleType | string, lang: Language = 'en'): string {
  switch (type) {
    case 'week-ahead':
      return generateWeekAheadContent(data as WeekAheadData, lang);
    case 'month-ahead':
      return generateWeekAheadContent(data as WeekAheadData, lang);
    case 'committee-reports':
      return generateCommitteeContent(data, lang);
    case 'propositions':
      return generatePropositionsContent(data, lang);
    case 'motions':
      return generateMotionsContent(data, lang);
    case 'weekly-review':
    case 'monthly-review':
    case 'breaking':
    default:
      return generateGenericContent(data, lang);
  }
}

/**
 * Extract "Watch Points" from data
 */
export function extractWatchPoints(data: ArticleContentData, lang: Language = 'en'): WatchPoint[] {
  const watchPoints: WatchPoint[] = [];

  // From calendar events
  if (data.events) {
    const highPriorityEvents = data.events.filter(isHighPriority);
    highPriorityEvents.forEach(event => {
      // Derive dayName from event date if not present
      const rawDate = event.datum || event.from || event.start;
      const dateOnly = rawDate ? rawDate.split('T')[0] ?? rawDate : '';
      const dayName = event.dayName || (dateOnly ? formatDayName(new Date(dateOnly), lang) : '');
      const eventTitle = event.title || event.titel || 'Event';

      // Mark Swedish API titles for LLM translation post-processing
      const escapedEventTitle = escapeHtml(eventTitle);
      const titleDisplay = (event.titel && !event.title)
        ? svSpan(escapedEventTitle, lang)
        : escapedEventTitle;

      const monitorVal = L(lang, 'monitorDev');
      watchPoints.push({
        title: dayName ? `${dayName}: ${titleDisplay}` : titleDisplay,
        description: event.description || (typeof monitorVal === 'string' ? monitorVal : '')
      });
    });
  }

  // From committee reports
  if (data.reports && data.reports.length > 0) {
    const debatesVal = L(lang, 'committeeDebates');
    const debatesDescFn = L(lang, 'committeeDebatesDesc') as string | ((n: number) => string);
    watchPoints.push({
      title: typeof debatesVal === 'string' ? debatesVal : '',
      description: typeof debatesDescFn === 'function' ? debatesDescFn(data.reports.length) : ''
    });
  }

  // From propositions
  if (data.propositions && data.propositions.length > 0) {
    const proposalsVal = L(lang, 'govProposals');
    const proposalsDescFn = L(lang, 'govProposalsDesc') as string | ((n: number) => string);
    watchPoints.push({
      title: typeof proposalsVal === 'string' ? proposalsVal : '',
      description: typeof proposalsDescFn === 'function' ? proposalsDescFn(data.propositions.length) : ''
    });
  }

  return watchPoints.slice(0, 5); // Max 5 watch points
}

/**
 * Generate article metadata
 */
export function generateMetadata(data: ArticleContentData, type: ArticleType | string, lang: Language = 'en'): ArticleMetadata {
  const keywords: string[] = [];
  const topics: string[] = [];
  const tags: string[] = [];

  // Add type-specific keywords
  switch (type) {
    case 'week-ahead':
      keywords.push('parliament', 'week ahead', 'calendar', 'events');
      topics.push('parliament');
      {
        const tagVal = L(lang, 'weekAhead');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'committee-reports':
      keywords.push('committee', 'reports', 'betänkanden', 'parliament');
      topics.push('committees', 'reports');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'propositions':
      keywords.push('government', 'propositions', 'parliament', 'legislation');
      topics.push('government', 'legislation');
      {
        const tagVal = L(lang, 'govPropsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'motions':
      keywords.push('motions', 'opposition', 'parliament', 'proposals');
      topics.push('parliament', 'opposition');
      {
        const tagVal = L(lang, 'oppMotionsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'month-ahead':
      keywords.push('parliament', 'month ahead', 'calendar', 'outlook');
      topics.push('parliament', 'outlook');
      {
        const tagVal = L(lang, 'weekAhead');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'weekly-review':
      keywords.push('parliament', 'weekly review', 'analysis', 'recap');
      topics.push('parliament', 'review');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'monthly-review':
      keywords.push('parliament', 'monthly review', 'analysis', 'recap');
      topics.push('parliament', 'review');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'breaking':
      keywords.push('breaking news', 'parliament', 'urgent', 'alert');
      topics.push('breaking', 'parliament');
      break;
  }

  // Extract additional keywords from data
  if (data.events) {
    keywords.push('calendar', 'events', 'debates');
  }
  if (data.reports) {
    keywords.push('committees', 'reports');
  }

  // Add common keywords
  keywords.push('Swedish Parliament', 'Riksdag', 'politics', 'Sweden');

  return {
    keywords: keywords.slice(0, 15),
    topics: topics.slice(0, 5),
    tags: tags.slice(0, 10)
  };
}

/**
 * Calculate estimated read time
 */
export function calculateReadTime(content: string): string {
  // Remove HTML tags for word count
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;

  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200);

  return `${minutes} min read`;
}

/**
 * Policy domain keywords (Swedish) for extracting themes from parliamentary documents.
 * Scans `titel`, `rubrik`, `summary`, and `notis` fields for these terms.
 */
const POLICY_DOMAIN_KEYWORDS: Record<string, string[]> = {
  energy:      ['energi', 'elproduktion', 'kärnkraft', 'förnybar', 'vindkraft', 'solenergi'],
  environment: ['miljö', 'klimat', 'utsläpp', 'naturvård', 'avfall', 'biologisk'],
  housing:     ['bostäder', 'hyra', 'fastighet', 'byggande', 'bostadsmark', 'bostadsbrist'],
  defense:     ['försvar', 'militär', 'nato', 'säkerhetspolitik', 'försvarsutgifter'],
  healthcare:  ['sjukvård', 'hälso', 'omsorg', 'läkemedel', 'primärvård'],
  education:   ['utbildning', 'skola', 'högskola', 'forskning', 'gymnasium'],
  economy:     ['skatt', 'budget', 'ekonomi', 'finans', 'moms', 'konjunktur'],
  migration:   ['migration', 'asyl', 'flyktingar', 'invandrare', 'uppehållstillstånd'],
  justice:     ['brott', 'rättsväsende', 'polis', 'straff', 'kriminalitet'],
  social:      ['sociala', 'välfärd', 'pension', 'trygghet', 'socialbidrag'],
  transport:   ['trafik', 'järnväg', 'vägar', 'infrastruktur', 'kollektivtrafik'],
  trade:       ['näringsliv', 'industri', 'export', 'konkurrens', 'utrikeshandel', 'handelspolitik'],
  eu:          ['europeisk', 'europaparlament', 'direktiv', 'eu-', 'europafrågor'],
};

/** Localized domain names for all 14 supported languages */
const DOMAIN_TRANSLATIONS: Record<string, Record<string, string>> = {
  energy:      { en: 'Energy', sv: 'Energi', da: 'Energi', no: 'Energi', fi: 'Energia', de: 'Energie', fr: 'Énergie', es: 'Energía', nl: 'Energie', ar: 'الطاقة', he: 'אנרגיה', ja: 'エネルギー', ko: '에너지', zh: '能源' },
  environment: { en: 'Environment', sv: 'Miljö', da: 'Miljø', no: 'Miljø', fi: 'Ympäristö', de: 'Umwelt', fr: 'Environnement', es: 'Medio Ambiente', nl: 'Milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境' },
  housing:     { en: 'Housing', sv: 'Bostäder', da: 'Boliger', no: 'Boliger', fi: 'Asuminen', de: 'Wohnungsbau', fr: 'Logement', es: 'Vivienda', nl: 'Huisvesting', ar: 'الإسكان', he: 'דיור', ja: '住宅', ko: '주택', zh: '住房' },
  defense:     { en: 'Defense', sv: 'Försvar', da: 'Forsvar', no: 'Forsvar', fi: 'Puolustus', de: 'Verteidigung', fr: 'Défense', es: 'Defensa', nl: 'Defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  healthcare:  { en: 'Healthcare', sv: 'Sjukvård', da: 'Sundhed', no: 'Helse', fi: 'Terveydenhuolto', de: 'Gesundheit', fr: 'Santé', es: 'Sanidad', nl: 'Gezondheidszorg', ar: 'الرعاية الصحية', he: 'בריאות', ja: '医療', ko: '의료', zh: '医疗' },
  education:   { en: 'Education', sv: 'Utbildning', da: 'Uddannelse', no: 'Utdanning', fi: 'Koulutus', de: 'Bildung', fr: 'Éducation', es: 'Educación', nl: 'Onderwijs', ar: 'التعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育' },
  economy:     { en: 'Economy', sv: 'Ekonomi', da: 'Økonomi', no: 'Økonomi', fi: 'Talous', de: 'Wirtschaft', fr: 'Économie', es: 'Economía', nl: 'Economie', ar: 'الاقتصاد', he: 'כלכלה', ja: '経済', ko: '경제', zh: '经济' },
  migration:   { en: 'Migration', sv: 'Migration', da: 'Migration', no: 'Migrasjon', fi: 'Maahanmuutto', de: 'Migration', fr: 'Migration', es: 'Migración', nl: 'Migratie', ar: 'الهجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民' },
  justice:     { en: 'Justice', sv: 'Rättsväsende', da: 'Retsvæsen', no: 'Rettsvesen', fi: 'Oikeus', de: 'Justiz', fr: 'Justice', es: 'Justicia', nl: 'Justitie', ar: 'العدالة', he: 'משפט', ja: '司法', ko: '사법', zh: '司法' },
  social:      { en: 'Welfare', sv: 'Välfärd', da: 'Velfærd', no: 'Velferd', fi: 'Sosiaaliturva', de: 'Sozialpolitik', fr: 'Protection sociale', es: 'Bienestar Social', nl: 'Sociale zekerheid', ar: 'الرعاية الاجتماعية', he: 'רווחה', ja: '社会保障', ko: '사회복지', zh: '社会保障' },
  transport:   { en: 'Transport', sv: 'Trafik', da: 'Transport', no: 'Transport', fi: 'Liikenne', de: 'Verkehr', fr: 'Transport', es: 'Transporte', nl: 'Transport', ar: 'النقل', he: 'תחבורה', ja: '交通', ko: '교통', zh: '交通' },
  trade:       { en: 'Industry', sv: 'Näringsliv', da: 'Erhvervsliv', no: 'Næringsliv', fi: 'Elinkeinoelämä', de: 'Wirtschaft', fr: 'Industrie', es: 'Industria', nl: 'Industrie', ar: 'الصناعة', he: 'תעשייה', ja: '産業', ko: '산업', zh: '产业' },
  eu:          { en: 'EU Affairs', sv: 'EU-frågor', da: 'EU-spørgsmål', no: 'EU-saker', fi: 'EU-asiat', de: 'EU-Angelegenheiten', fr: 'Affaires européennes', es: 'Asuntos Europeos', nl: 'EU-zaken', ar: 'الشؤون الأوروبية', he: 'ענייני אירופה', ja: 'EU問題', ko: 'EU사무', zh: '欧盟事务' },
};

/**
 * Title and subtitle templates keyed by article type then language.
 * Placeholders: {d1} first domain, {d2} second domain, {count} document count.
 */
const CONTENT_TITLE_TEMPLATES: Record<string, Record<string, { title: string; subtitle: string }>> = {
  motions: {
    en: { title: 'Opposition Challenges {d1} and {d2}', subtitle: 'Analysis of {count} opposition motions on {d1} & {d2}' },
    sv: { title: 'Oppositionen utmanar {d1} och {d2}', subtitle: 'Analys av {count} oppositionsmotioner om {d1} & {d2}' },
    da: { title: 'Opposition udfordrer {d1} og {d2}', subtitle: 'Analyse af {count} oppositionsforslag om {d1} & {d2}' },
    no: { title: 'Opposisjonen utfordrer {d1} og {d2}', subtitle: 'Analyse av {count} opposisjonsforslag om {d1} & {d2}' },
    fi: { title: 'Oppositio haastaa {d1} ja {d2}', subtitle: 'Analyysi {count} opposition aloitteesta: {d1} & {d2}' },
    de: { title: 'Opposition fordert {d1} und {d2} heraus', subtitle: 'Analyse von {count} Oppositionsanträgen zu {d1} & {d2}' },
    fr: { title: "L'opposition défie {d1} et {d2}", subtitle: "Analyse de {count} motions d'opposition sur {d1} & {d2}" },
    es: { title: 'La oposición desafía {d1} y {d2}', subtitle: 'Análisis de {count} mociones de oposición sobre {d1} & {d2}' },
    nl: { title: 'Oppositie daagt {d1} en {d2} uit', subtitle: 'Analyse van {count} oppositiemoties over {d1} & {d2}' },
    ar: { title: 'المعارضة تتحدى {d1} و{d2}', subtitle: 'تحليل {count} اقتراح معارضة حول {d1} و{d2}' },
    he: { title: 'האופוזיציה מאתגרת {d1} ו{d2}', subtitle: 'ניתוח {count} הצעות אופוזיציה: {d1} ו{d2}' },
    ja: { title: '野党が{d1}と{d2}に挑む', subtitle: '{d1}と{d2}に関する{count}件の野党動議の分析' },
    ko: { title: '야당이 {d1}과 {d2}에 도전', subtitle: '{d1}과 {d2}에 관한 {count}개 야당 동의 분析' },
    zh: { title: '反对党挑战{d1}和{d2}', subtitle: '关于{d1}和{d2}的{count}份反对党动议分析' },
  },
  propositions: {
    en: { title: 'Government Targets {d1} and {d2} Reform', subtitle: 'Analysis of {count} government propositions on {d1} & {d2}' },
    sv: { title: 'Regeringen satsar på {d1} och {d2}', subtitle: 'Analys av {count} propositioner om {d1} & {d2}' },
    da: { title: 'Regeringen fokuserer på {d1} og {d2}', subtitle: 'Analyse af {count} regeringsforslag om {d1} & {d2}' },
    no: { title: 'Regjeringen satser på {d1} og {d2}', subtitle: 'Analyse av {count} regjeringsproposisjoner om {d1} & {d2}' },
    fi: { title: 'Hallitus panostaa {d1} ja {d2}', subtitle: 'Analyysi {count} hallituksen esityksestä: {d1} & {d2}' },
    de: { title: 'Regierung adressiert {d1} und {d2}', subtitle: 'Analyse von {count} Regierungsvorlagen zu {d1} & {d2}' },
    fr: { title: 'Le gouvernement cible {d1} et {d2}', subtitle: 'Analyse de {count} propositions gouvernementales sur {d1} & {d2}' },
    es: { title: 'El gobierno apunta a {d1} y {d2}', subtitle: 'Análisis de {count} proposiciones gubernamentales sobre {d1} & {d2}' },
    nl: { title: 'Regering richt zich op {d1} en {d2}', subtitle: 'Analyse van {count} regeringsvoorstellen over {d1} & {d2}' },
    ar: { title: 'الحكومة تستهدف {d1} و{d2}', subtitle: 'تحليل {count} مقترح حكومي حول {d1} و{d2}' },
    he: { title: 'הממשלה מתמקדת ב{d1} וב{d2}', subtitle: 'ניתוח {count} הצעות ממשלה: {d1} ו{d2}' },
    ja: { title: '政府が{d1}と{d2}に着手', subtitle: '{d1}と{d2}に関する{count}件の政府提案の分析' },
    ko: { title: '정부가 {d1}과 {d2} 추진', subtitle: '{d1}과 {d2}에 관한 {count}개 정부 법안 분析' },
    zh: { title: '政府推进{d1}和{d2}改革', subtitle: '关于{d1}和{d2}的{count}份政府提案分析' },
  },
  'committee-reports': {
    en: { title: 'Committees Address {d1} and {d2}', subtitle: 'Analysis of {count} committee reports on {d1} & {d2}' },
    sv: { title: 'Utskotten behandlar {d1} och {d2}', subtitle: 'Analys av {count} utskottsbetänkanden om {d1} & {d2}' },
    da: { title: 'Udvalg behandler {d1} og {d2}', subtitle: 'Analyse af {count} udvalgsbetænkninger om {d1} & {d2}' },
    no: { title: 'Komiteer behandler {d1} og {d2}', subtitle: 'Analyse av {count} komitéinnstillinger om {d1} & {d2}' },
    fi: { title: 'Valiokunnat käsittelevät {d1} ja {d2}', subtitle: 'Analyysi {count} valiokunnan mietinnöstä: {d1} & {d2}' },
    de: { title: 'Ausschüsse beraten {d1} und {d2}', subtitle: 'Analyse von {count} Ausschussberichten zu {d1} & {d2}' },
    fr: { title: 'Les commissions examinent {d1} et {d2}', subtitle: 'Analyse de {count} rapports de commission sur {d1} & {d2}' },
    es: { title: 'Comisiones examinan {d1} y {d2}', subtitle: 'Análisis de {count} informes de comisión sobre {d1} & {d2}' },
    nl: { title: 'Commissies behandelen {d1} en {d2}', subtitle: 'Analyse van {count} commissierapporten over {d1} & {d2}' },
    ar: { title: 'اللجان تعالج {d1} و{d2}', subtitle: 'تحليل {count} تقرير لجنة حول {d1} و{d2}' },
    he: { title: 'הוועדות עוסקות ב{d1} וב{d2}', subtitle: 'ניתוח {count} דוחות ועדה: {d1} ו{d2}' },
    ja: { title: '委員会が{d1}と{d2}を審議', subtitle: '{d1}と{d2}に関する{count}件の委員会報告の分析' },
    ko: { title: '위원회가 {d1}과 {d2}을 심의', subtitle: '{d1}과 {d2}에 관한 {count}개 위원회 보고서 분析' },
    zh: { title: '委员会审议{d1}和{d2}', subtitle: '关于{d1}和{d2}的{count}份委员会报告分析' },
  },
};

/**
 * Extract the top policy domains from a set of parliamentary documents.
 * Scans `titel`, `rubrik`, `summary`, and `notis` fields for Swedish keywords.
 *
 * @internal Use {@link generateContentTitle} instead.
 */
function extractPolicyDomains(documents: RawDocument[]): string[] {
  const counts: Record<string, number> = {};
  for (const doc of documents) {
    const text = `${doc.titel ?? ''} ${doc.rubrik ?? ''} ${doc.summary ?? ''} ${doc.notis ?? ''}`.toLowerCase();
    for (const [domain, keywords] of Object.entries(POLICY_DOMAIN_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        counts[domain] = (counts[domain] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);
}

/**
 * Generate a content-aware article title derived from the policy domains found in documents.
 *
 * Extracts the top 2 policy themes from the provided documents and returns a
 * language-specific title that reflects the actual content. Returns `null` when
 * fewer than 2 distinct domains can be detected so callers can fall back to
 * their static titles.
 *
 * @param documents - Source documents to analyse for policy themes
 * @param lang - Target language code (e.g. `'en'`, `'sv'`, `'de'`)
 * @param articleType - Article type: `'motions'` | `'propositions'` | `'committee-reports'`
 * @returns Content-based `{ title, subtitle }`, or `null` when analysis is insufficient
 */
export function generateContentTitle(
  documents: RawDocument[],
  lang: Language | string,
  articleType: 'motions' | 'propositions' | 'committee-reports'
): { title: string; subtitle: string } | null {
  const domains = extractPolicyDomains(documents);
  if (domains.length < 2) return null;

  const langKey = lang as string;
  const trans0 = DOMAIN_TRANSLATIONS[domains[0]!];
  const trans1 = DOMAIN_TRANSLATIONS[domains[1]!];
  const d1 = trans0?.[langKey] ?? trans0?.['en'];
  const d2 = trans1?.[langKey] ?? trans1?.['en'];
  if (!d1 || !d2) return null;

  const typeTemplates = CONTENT_TITLE_TEMPLATES[articleType];
  const tmpl = typeTemplates?.[langKey] ?? typeTemplates?.['en'];
  if (!tmpl) return null;

  return {
    title:    tmpl.title.replace('{d1}', d1).replace('{d2}', d2),
    subtitle: tmpl.subtitle
      .replace('{count}', String(documents.length))
      .replace('{d1}', d1)
      .replace('{d2}', d2),
  };
}

/**
 * Generate article sources list
 */
export function generateSources(tools: string[] = []): string[] {
  const sources: string[] = ['riksdag-regering-mcp'];

  if (tools.includes('get_calendar_events')) {
    sources.push('Riksdagen Calendar');
  }
  if (tools.includes('get_betankanden')) {
    sources.push('Committee Reports');
  }
  if (tools.includes('get_propositioner')) {
    sources.push('Government Propositions');
  }
  if (tools.includes('get_motioner')) {
    sources.push('Parliamentary Motions');
  }
  if (tools.includes('search_dokument')) {
    sources.push('Riksdagen Documents');
  }
  if (tools.includes('get_dokument_innehall')) {
    sources.push('Riksdagen Document Content');
  }

  return sources;
}
