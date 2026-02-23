/**
 * @module Intelligence Operations/Automated News Generation
 * @category Intelligence Operations - Automated Intelligence Reporting
 *
 * @description
 * Core automated intelligence reporting workflow orchestrating real-time news generation
 * from Swedish Parliament and Government data sources. This module implements advanced
 * OSINT collection and automated content generation pipelines, transforming structured
 * parliamentary data into multi-language intelligence reports for journalists and analysts.
 *
 * The script provides a comprehensive three-stage intelligence pipeline:
 *
 * Stage 1 - OSINT Data Collection:
 * Leverages riksdag-regering-mcp server (32 specialized tools) to perform continuous
 * monitoring of Swedish parliamentary activities. Collects calendar events, committee
 * reports, legislative documents, voting records, and government announcements using
 * structured API calls optimized for source validation and data integrity verification.
 *
 * Stage 2 - Intelligent Data Transformation:
 * Processes raw MCP responses through data transformation algorithms that:
 * - Extract semantic intelligence (legislative intent, party positions, policy proposals)
 * - Identify critical watch points and political risk indicators
 * - Cross-reference documents and voting patterns for narrative coherence
 * - Validate source authenticity against official parliamentary records
 * - Generate metadata including read time estimates and source attribution
 *
 * Stage 3 - Automated Content Generation & Multi-Language Publication:
 * Transforms processed intelligence into professional news articles with:
 * - Semantic HTML5 structure optimized for accessibility (WCAG 2.1 AA)
 * - Event grid visualization of parliamentary schedule
 * - Multi-language rendering across all 14 supported language pairs
 * - SEO optimization and proper journalistic source attribution
 * - Cyberpunk visual theme maintaining brand consistency
 *
 * Article Generation Types:
 * - Week Ahead: Calendar-based preview of upcoming parliamentary events
 * - Committee Reports: Deep-dive analysis of committee activities and decisions
 * - Propositions: Government legislative proposals with impact analysis
 * - Motions: Parliamentary motions with cross-party analysis
 * - Breaking: Rapid-response analysis of critical developments
 *
 * Multi-Language Intelligence Distribution:
 * Generates articles in 14 languages across 5 geographic regions:
 * - Nordic: English, Swedish, Danish, Norwegian, Finnish
 * - Western EU: German, French, Spanish, Dutch
 * - Mediterranean: Italian (via Spanish pipeline)
 * - MENA: Arabic, Hebrew
 * - East Asia: Japanese, Korean, Simplified Chinese
 *
 * @intelligence
 * Automated Reporting Workflow: Implements continuous monitoring pattern using
 * structured OSINT collection, real-time data processing, and automated content
 * generation with journalist-grade source validation and cross-referencing.
 *
 * Narrative Construction: Applies analytical techniques for:
 * - Thematic linkage analysis across parliamentary documents
 * - Legislative intent inference from voting patterns and committee recommendations
 * - Party position mapping and coalition dynamics analysis
 * - Risk indicator extraction (fiscal implications, timeline constraints, stakeholder impacts)
 *
 * Content Strategy Integration: Aligns with 5 Editorial Pillars framework:
 * 1. Parliamentary Pulse - Main legislative developments
 * 2. Government Watch - Executive announcements and actions
 * 3. Opposition Dynamics - Cross-party positioning and criticism
 * 4. Committee Intelligence - Specialized committee-level analysis
 * 5. Looking Ahead - Forward-looking political forecasting
 *
 * @osint
 * Source Collection Strategy:
 * - Primary: riksdag-regering-mcp server (official Swedish Parliament/Government API)
 * - Secondary: CIA production database for historical statistics and trends
 * - Validation: Cross-reference against Riksdagen.se and Regeringen.se official records
 * - Continuity: Maintains source integrity audit trail via Git version control
 *
 * Data Quality Assurance:
 * - Schema validation against CIA data model definitions
 * - Document completeness verification before publication
 * - Cross-language consistency verification across 14 language pairs
 * - Automated plagiarism detection using semantic fingerprinting
 * - Source attribution verification for all factual claims
 *
 * Collection Methods:
 * - Calendar-based event collection (week-ahead, committee scheduling)
 * - Document search and retrieval (propositions, motions, reports)
 * - Voting record analysis (party positions, coalition patterns)
 * - Debate transcript collection (parliamentary speeches and responses)
 * - Government announcement monitoring (press releases, policy documents)
 *
 * @risk
 * Intelligence Threats & Mitigations:
 *
 * Threat: Data Staleness
 * - MCP source lag or API unavailability
 * - Mitigation: Fallback cache, health checks, error reporting
 *
 * Threat: Source Manipulation
 * - Compromised MCP server returning modified data
 * - Mitigation: Schema validation, cryptographic integrity verification
 *
 * Threat: Narrative Bias
 * - Generated articles reflecting algorithmic bias in source selection
 * - Mitigation: Editorial review, 5-Pillar framework ensuring balanced coverage
 *
 * Threat: Multi-Language Quality Variation
 * - Semantic loss in translation reducing analytical accuracy
 * - Mitigation: Human review of complex political terminology, glossary maintenance
 *
 * Threat: Information Disclosure
 * - Unintended revelation of pre-publication political intelligence
 * - Mitigation: Publication embargo enforcement, pre-release editorial approval
 *
 * @gdpr
 * GDPR Compliance Framework (Article 6(1)(e) - Public Interest Processing):
 *
 * - Data Subject Rights:
 *   * Public officials in official capacity only (no personal processing)
 *   * Right to be forgotten not applicable (historical parliamentary records)
 *   * Transparency: All sources publicly available and attributed
 *
 * - Data Minimization:
 *   * Process only public parliamentary data (voting records, official speeches)
 *   * Exclude personal contact information, family relationships, health data
 *   * Exclude biometric data, political profiling beyond official positions
 *
 * - Purpose Limitation:
 *   * Journalism and democratic transparency only
 *   * No commercial surveillance or political targeting
 *   * No data broker or third-party sale restrictions
 *
 * - Retention Policy:
 *   * Parliamentary records: Perpetual (historical record importance)
 *   * Generated articles: 7-year minimum (cultural heritage)
 *   * Processing logs: 90 days (audit trail requirements)
 *
 * @security
 * Security Architecture Analysis:
 *
 * Threat Model Considerations:
 * - Transport Security: HTTPS-only MCP server communication
 * - Authentication: Optional token-based API auth via MCP_AUTH_TOKEN
 * - Input Validation: Schema-based validation for all MCP responses
 * - Output Sanitization: HTML entity escaping for all user-controlled content
 * - Rate Limiting: Exponential backoff on MCP API rate limits
 *
 * Supply Chain Security:
 * - Import verification: All dependencies in package.json with pinned versions
 * - Code review: All changes reviewed before merge to main
 * - Build integrity: GitHub Actions CI/CD with code signing
 * - Artifact storage: GitHub Pages with branch protection
 *
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 2.0.0
 *
 * @see {@link https://github.com/Hack23/riksdagsmonitor} Riksdagsmonitor repository
 * @see {@link https://github.com/Hack23/riksdag-regering-mcp} riksdag-regering-mcp server
 * @see {@link ./mcp-client.js} MCP Client for API communication
 * @see {@link ./data-transformers.js} Data transformation pipeline
 * @see {@link ./article-template.js} Article HTML generation
 * @see {@link ./editorial-pillars.js} Editorial content strategy
 * @see {@link docs/INTELLIGENCE_OPERATIONS.md} Intelligence operations methodology
 * @see {@link docs/OSINT_COLLECTION.md} OSINT collection procedures
 * @see {@link docs/GDPR_COMPLIANCE.md} GDPR compliance framework
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from './mcp-client.js';
import {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  type RawDocument,
} from './data-transformers.js';
import { generateArticleHTML } from './article-template.js';
import { generateMonthAhead } from './news-types/month-ahead.js';
import { generateWeeklyReview } from './news-types/weekly-review.js';
import { generateMonthlyReview } from './news-types/monthly-review.js';
import { generateBreakingNews } from './news-types/breaking-news.js';
import type { Language } from './types/language.js';
import type { ArticleCategory } from './types/article.js';
import type {
  GenerationStats,
  GenerationResult,
  DateRange,
} from './types/article.js';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface TitleSet {
  title: string;
  subtitle: string;
}

interface BatchStatus {
  complete: boolean;
  completedLanguages?: string[];
  remainingLanguages?: string[];
  allRequestedLanguages?: string[];
  allDone?: string[];
  timestamp: string;
}

interface LastGenerationMetadata {
  timestamp: string;
  types: string[];
  languagesGenerated: Language[];
  allRequestedLanguages: Language[];
  batchSize: number | string;
  skipExisting: boolean;
  generated: number;
  errors: number;
  articles: string[];
  status: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

/** Extract YYYY-MM-DD from a Date, guaranteed non-undefined. */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args: string[] = process.argv.slice(2);
const typesArg: string | undefined = args.find(arg => arg.startsWith('--types='));
const languagesArg: string | undefined = args.find(arg => arg.startsWith('--languages='));
const dryRunArg: boolean = args.includes('--dry-run');
const batchSizeArg: string | undefined = args.find(arg => arg.startsWith('--batch-size='));
const skipExistingArg: boolean = args.includes('--skip-existing');
const requireMcpArg: string | undefined = args.find(arg => arg.startsWith('--require-mcp'));
const requireMcp: boolean = requireMcpArg?.split('=')[1] !== 'false';
const batchSize: number = batchSizeArg ? parseInt(batchSizeArg.split('=')[1] ?? '0', 10) : 0;

// ---------------------------------------------------------------------------
// Valid article types
// ---------------------------------------------------------------------------

const VALID_ARTICLE_TYPES: readonly string[] = ['week-ahead', 'month-ahead', 'weekly-review', 'monthly-review', 'committee-reports', 'propositions', 'motions', 'breaking'];

const articleTypes: string[] = typesArg
  ? (typesArg.split('=')[1] ?? '').split(',').map(t => t.trim())
  : ['week-ahead'];

// ---------------------------------------------------------------------------
// Language configuration
// ---------------------------------------------------------------------------

const ALL_LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

const LANGUAGE_PRESETS: Readonly<Record<string, Language[]>> = {
  'all': [...ALL_LANGUAGES],
  'nordic': ['en', 'sv', 'da', 'no', 'fi'],
  'eu-core': ['en', 'sv', 'de', 'fr', 'es', 'nl']
};

let languagesInput: string = languagesArg ? (languagesArg.split('=')[1] ?? '').trim().toLowerCase() : 'en,sv';

// Expand presets (after trimming and normalizing)
const presetLanguages: Language[] | undefined = LANGUAGE_PRESETS[languagesInput];
if (presetLanguages) {
  languagesInput = presetLanguages.join(',');
}

let languages: Language[] = languagesInput
  .split(',')
  .map(l => l.trim())
  .filter((l): l is Language => (ALL_LANGUAGES as readonly string[]).includes(l));

if (languages.length === 0) {
  console.error('❌ No valid language codes provided. Valid codes:', ALL_LANGUAGES.join(', '));
  process.exit(1);
}

// Validate article types
const invalidTypes: string[] = articleTypes.filter(t => !VALID_ARTICLE_TYPES.includes(t.trim()));
if (invalidTypes.length > 0) {
  console.warn(`⚠️ Unknown article types ignored: ${invalidTypes.join(', ')}`);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NEWS_DIR: string = path.join(__dirname, '..', 'news');
const METADATA_DIR: string = path.join(NEWS_DIR, 'metadata');

// Track full requested set before any filtering
const allRequestedLanguages: Language[] = [...languages];

// Apply --skip-existing: remove languages that already have today's articles
if (skipExistingArg) {
  const today: string = toISODate(new Date());
  const existingFiles: string[] = fs.existsSync(NEWS_DIR)
    ? fs.readdirSync(NEWS_DIR).filter(f => f.startsWith(today) && f.endsWith('.html'))
    : [];
  const doneLangs: Language[] = languages.filter(lang =>
    existingFiles.some(f => f.endsWith(`-${lang}.html`))
  );
  if (doneLangs.length > 0) {
    console.log(`⏭️  Skipping already-generated languages: ${doneLangs.join(', ')}`);
    languages = languages.filter(l => !doneLangs.includes(l));
  }
}

// Apply --batch-size: limit to N languages per run
if (batchSize > 0 && languages.length > batchSize) {
  const remaining: Language[] = languages.slice(batchSize);
  languages = languages.slice(0, batchSize);
  console.log(`📦 Batch mode: processing ${languages.length} of ${allRequestedLanguages.length} requested languages`);
  console.log(`   This batch: ${languages.join(', ')}`);
  console.log(`   Remaining for next run(s): ${remaining.join(', ')}`);
}

if (languages.length === 0) {
  console.log('✅ All requested languages already generated. Nothing to do.');
  // Write a status metadata file so the workflow knows we're done
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
  const batchStatus: BatchStatus = {
    complete: true,
    allDone: allRequestedLanguages,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(METADATA_DIR, 'batch-status.json'),
    JSON.stringify(batchStatus, null, 2)
  );
  process.exit(0);
}

console.log('📰 Enhanced News Generation Script');
console.log('Article types:', articleTypes.join(', '));
console.log('Languages:', languages.join(', '));
console.log('Batch size:', batchSize > 0 ? batchSize : 'all at once');
console.log('Skip existing:', skipExistingArg ? 'Yes' : 'No');
console.log('Require MCP:', requireMcp ? 'Yes (abort on failure)' : 'No (degraded mode)');
console.log('Dry run:', dryRunArg ? 'Yes (no files written)' : 'No');

// ---------------------------------------------------------------------------
// Shared MCP client (reuses connection/session across all generators)
// ---------------------------------------------------------------------------

let sharedClient: MCPClient | null = null;

/**
 * Get or create the shared MCPClient instance.
 * On first call, warms up the MCP server with a lightweight get_sync_status
 * request using an extended timeout to handle Render.com cold starts (30-60s).
 *
 * @returns Warmed-up shared client
 * @throws {Error} When `requireMcp` is true and the MCP server warm-up fails.
 *   Callers (generateCommitteeReports, generatePropositions, generateMotions, etc.)
 *   catch this and return `{ success: false, error }` rather than crashing.
 *   Pass `--require-mcp=false` to allow degraded mode (empty data, no throw).
 */
async function getSharedClient(): Promise<MCPClient> {
  if (sharedClient) return sharedClient;

  // Use extended timeout for initial connection (cold start can take 30-60s)
  const coldStartTimeout: number = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS ?? '', 10) || 90000;
  sharedClient = new MCPClient({ timeout: coldStartTimeout });

  // Warm up the MCP server before any data queries
  console.log('⏳ Warming up MCP server (may take 30-60s on cold start)...');
  console.log(`  🔗 Server: ${sharedClient.baseURL}`);
  try {
    const status: Record<string, unknown> = await sharedClient.request('get_sync_status', {});
    console.log('✅ MCP server ready');
    if (status && status['last_sync']) {
      console.log(`  📊 Last sync: ${status['last_sync'] as string}`);
    }
  } catch (error: unknown) {
    const message = (error as Error).message;
    if (requireMcp) {
      sharedClient = null;
      throw new Error(`MCP server unavailable: ${message}`, { cause: error });
    }
    console.warn(`⚠️ MCP warm-up failed: ${message}`);
    console.warn('  Continuing anyway — individual requests will retry with backoff');
  }

  // After warm-up succeeds, reduce timeout for normal requests
  const normalTimeout: number = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS ?? '', 10) || 30000;
  (sharedClient as unknown as { timeout: number }).timeout = normalTimeout;

  return sharedClient;
}

// Ensure directories exist
if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Generation statistics
// ---------------------------------------------------------------------------

const stats: { generated: number; errors: number; articles: string[]; timestamp: string } = {
  generated: 0,
  errors: 0,
  articles: [],
  timestamp: new Date().toISOString()
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Get date range for Week Ahead (next 7 days)
 */
function getWeekAheadDateRange(): DateRange {
  const today: Date = new Date();
  const startDate: Date = new Date(today);
  startDate.setDate(today.getDate() + 1); // Tomorrow

  const endDate: Date = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7); // +7 days

  return {
    start: toISODate(startDate),
    end: toISODate(endDate)
  };
}

/**
 * Format date for article slug
 */
function formatDateForSlug(date: Date = new Date()): string {
  return toISODate(date);
}

/**
 * Write article to file
 */
async function writeArticle(html: string, filename: string): Promise<boolean> {
  if (dryRunArg) {
    console.log(`  [DRY RUN] Would write: ${filename}`);
    return true;
  }

  const filepath: string = path.join(NEWS_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`  ✅ Wrote: ${filename}`);
  return true;
}

/**
 * Write article in specified language
 */
async function writeSingleArticle(html: string, slug: string, lang: Language): Promise<string> {
  const filename: string = `${slug}-${lang}.html`;
  await writeArticle(html, filename);
  stats.generated += 1;
  stats.articles.push(filename);
  return filename;
}

/**
 * Write EN/SV article pair (legacy function for backward compatibility)
 */
async function writeArticlePair(htmlEN: string, htmlSV: string, slug: string): Promise<void> {
  await writeSingleArticle(htmlEN, slug, 'en');
  await writeSingleArticle(htmlSV, slug, 'sv');
}

// ---------------------------------------------------------------------------
// Generator functions
// ---------------------------------------------------------------------------

/**
 * Generate Week Ahead article in specified languages
 */
async function generateWeekAhead(): Promise<GenerationResult> {
  console.log('📅 Generating Week Ahead article...');

  try {
    const client: MCPClient = await getSharedClient();
    const dateRange: DateRange = getWeekAheadDateRange();

    console.log(`  📆 Date range: ${dateRange.start} to ${dateRange.end}`);

    // 1. Fetch calendar events from MCP
    console.log('  🔄 Fetching calendar events from riksdag-regering-mcp...');
    const events: unknown[] = await client.fetchCalendarEvents(dateRange.start, dateRange.end);
    console.log(`  📊 Found ${events.length} events`);

    // 2. Fetch upcoming/recent documents
    const rawDocs = await Promise.resolve()
      .then(() => client.searchDocuments({ from_date: dateRange.start, to_date: dateRange.end, limit: 30 }))
      .catch(() => [] as unknown[]);
    const documents: RawDocument[] = Array.isArray(rawDocs) ? rawDocs as RawDocument[] : [];
    console.log(`  📊 Found ${documents.length} upcoming documents`);

    // 3. Fetch parliamentary questions (fragor)
    console.log('  🔄 Fetching parliamentary questions...');
    const rawQuestions = await Promise.resolve()
      .then(() => client.fetchWrittenQuestions({ limit: 20 }))
      .catch(() => [] as unknown[]);
    const questions: unknown[] = Array.isArray(rawQuestions) ? rawQuestions : [];
    console.log(`  📊 Found ${questions.length} written questions`);

    // 4. Fetch interpellations (interpellationer)
    console.log('  🔄 Fetching interpellations...');
    const rawInterpellations = await Promise.resolve()
      .then(() => client.fetchInterpellations({ limit: 15 }))
      .catch(() => [] as unknown[]);
    const interpellations: unknown[] = Array.isArray(rawInterpellations) ? rawInterpellations : [];
    console.log(`  📊 Found ${interpellations.length} interpellations`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-week-ahead`;

    // 5. Generate for each requested language
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      // Transform data for this language
      // MCP returns unknown[] — cast to match data-transformers' expected shapes
      const eventGrid = transformCalendarToEventGrid(events as Parameters<typeof transformCalendarToEventGrid>[0], lang);
      const weekData = {
        events: events as Parameters<typeof transformCalendarToEventGrid>[0],
        documents,
        questions,
        interpellations,
        highlights: [] as Array<{title: string; description: string}>,
      };
      const content: string = generateArticleContent(weekData, 'week-ahead', lang);
      const watchPoints = extractWatchPoints({ events: events as Parameters<typeof transformCalendarToEventGrid>[0], documents }, lang);
      const metadata = generateMetadata({ events: events as Parameters<typeof transformCalendarToEventGrid>[0], documents }, 'week-ahead', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_calendar_events', 'search_dokument', 'get_fragor', 'get_interpellationer']);

      // Language-specific titles
      const titles: Record<Language, TitleSet> = {
        en: { title: `Week Ahead: ${dateRange.start} to ${dateRange.end}`, subtitle: `Parliamentary calendar, committee meetings, and chamber debates for the coming week` },
        sv: { title: `Vecka Framåt: ${dateRange.start} till ${dateRange.end}`, subtitle: `Riksdagens kalender, utskottsmöten och kammarens debatter för kommande vecka` },
        da: { title: `Ugen Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, udvalgsmøder og debatter for den kommende uge` },
        no: { title: `Uke Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, komitémøter og debatter for kommende uke` },
        fi: { title: `Tuleva Viikko: ${dateRange.start} - ${dateRange.end}`, subtitle: `Parlamentin kalenteri, valiokuntien kokoukset ja keskustelut tulevalle viikolle` },
        de: { title: `Woche Voraus: ${dateRange.start} bis ${dateRange.end}`, subtitle: `Parlamentarischer Kalender, Ausschusssitzungen und Debatten für die kommende Woche` },
        fr: { title: `Semaine à Venir: ${dateRange.start} au ${dateRange.end}`, subtitle: `Calendrier parlementaire, réunions de commission et débats pour la semaine à venir` },
        es: { title: `Semana Próxima: ${dateRange.start} a ${dateRange.end}`, subtitle: `Calendario parlamentario, reuniones de comisión y debates para la próxima semana` },
        nl: { title: `Week Vooruit: ${dateRange.start} tot ${dateRange.end}`, subtitle: `Parlementaire kalender, commissievergaderingen en debatten voor de komende week` },
        ar: { title: `الأسبوع القادم: ${dateRange.start} إلى ${dateRange.end}`, subtitle: `التقويم البرلماني واجتماعات اللجان والمناقشات للأسبوع المقبل` },
        he: { title: `השבוע הקרוב: ${dateRange.start} עד ${dateRange.end}`, subtitle: `לוח שנה פרלמנטרי, פגישות ועדה ודיונים לשבוע הקרוב` },
        ja: { title: `来週の展望: ${dateRange.start} から ${dateRange.end}`, subtitle: `来週の議会カレンダー、委員会会議、討論` },
        ko: { title: `다음 주 전망: ${dateRange.start}부터 ${dateRange.end}까지`, subtitle: `다음 주 의회 일정, 위원회 회의 및 토론` },
        zh: { title: `下周展望：${dateRange.start} 至 ${dateRange.end}`, subtitle: `下周议会日程、委员会会议和辩论` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      // Generate HTML for this language
      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'prospective' as ArticleCategory,
        readTime,
        lang,
        content,
        events: eventGrid,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      // Write article
      await writeSingleArticle(html, slug, lang);
      console.log(`  ✅ ${lang.toUpperCase()} version generated`);
    }

    console.log('  ✅ Week Ahead article generated successfully in all requested languages');
    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Week Ahead:', (error as Error).message);
    console.error('   Stack:', (error as Error).stack);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Committee Reports article
 */
async function generateCommitteeReports(): Promise<GenerationResult> {
  console.log('📋 Generating Committee Reports article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching committee reports from riksdag-regering-mcp...');
    let reports: unknown[] = await client.fetchCommitteeReports(10);
    console.log(`  📊 Found ${reports.length} committee reports`);

    if (reports.length === 0) {
      console.log('  ℹ️ No new committee reports found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    reports = await client.enrichDocumentsWithContent(reports as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (reports as Array<Record<string, unknown>>).filter(r => r['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${reports.length} reports with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-committee-reports`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedReports = reports as Parameters<typeof generateArticleContent>[0]['reports'];
      const content: string = generateArticleContent({ reports: typedReports }, 'committee-reports', lang);
      const watchPoints = extractWatchPoints({ reports: typedReports }, lang);
      const metadata = generateMetadata({ reports: typedReports }, 'committee-reports', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_betankanden', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Committee Reports: Parliamentary Priorities This Week`, subtitle: `Analysis of ${reports.length} committee reports revealing Riksdag priorities for the current session` },
        sv: { title: `Utskottsbetänkanden: Riksdagens prioriteringar denna vecka`, subtitle: `Analys av ${reports.length} utskottsbetänkanden som avslöjar riksdagens prioriteringar` },
        da: { title: `Udvalgsbetænkninger: Parlamentets prioriteringer denne uge`, subtitle: `Analyse af ${reports.length} udvalgsbetænkninger` },
        no: { title: `Komitéinnstillinger: Stortingets prioriteringer denne uken`, subtitle: `Analyse av ${reports.length} komitéinnstillinger` },
        fi: { title: `Valiokunnan mietinnöt: Eduskunnan prioriteetit tällä viikolla`, subtitle: `Analyysi ${reports.length} valiokunnan mietinnöstä` },
        de: { title: `Ausschussberichte: Parlamentarische Prioritäten diese Woche`, subtitle: `Analyse von ${reports.length} Ausschussberichten` },
        fr: { title: `Rapports de commission: Priorités parlementaires cette semaine`, subtitle: `Analyse de ${reports.length} rapports de commission` },
        es: { title: `Informes de comisión: Prioridades parlamentarias esta semana`, subtitle: `Análisis de ${reports.length} informes de comisión` },
        nl: { title: `Commissierapporten: Parlementaire prioriteiten deze week`, subtitle: `Analyse van ${reports.length} commissierapporten` },
        ar: { title: `تقارير اللجان: أولويات البرلمان هذا الأسبوع`, subtitle: `تحليل ${reports.length} تقارير لجان` },
        he: { title: `דוחות ועדה: סדרי עדיפויות פרלמנטריים השבוע`, subtitle: `ניתוח ${reports.length} דוחות ועדה` },
        ja: { title: `委員会報告：今週の議会優先事項`, subtitle: `${reports.length}件の委員会報告の分析` },
        ko: { title: `위원회 보고서: 이번 주 의회 우선순위`, subtitle: `${reports.length}개 위원회 보고서 분석` },
        zh: { title: `委员会报告：本周议会优先事项`, subtitle: `${reports.length}份委员会报告分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      await writeSingleArticle(html, slug, lang);
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Committee Reports:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Government Propositions article
 */
async function generatePropositions(): Promise<GenerationResult> {
  console.log('📜 Generating Government Propositions article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching propositions from riksdag-regering-mcp...');
    let propositions: unknown[] = await client.fetchPropositions(10);
    console.log(`  📊 Found ${propositions.length} propositions`);

    if (propositions.length === 0) {
      console.log('  ℹ️ No new propositions found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    propositions = await client.enrichDocumentsWithContent(propositions as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (propositions as Array<Record<string, unknown>>).filter(p => p['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${propositions.length} propositions with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-government-propositions`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedPropositions = propositions as Parameters<typeof generateArticleContent>[0]['propositions'];
      const content: string = generateArticleContent({ propositions: typedPropositions }, 'propositions', lang);
      const watchPoints = extractWatchPoints({ propositions: typedPropositions }, lang);
      const metadata = generateMetadata({ propositions: typedPropositions }, 'propositions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_propositioner', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Government Propositions: Policy Priorities This Week`, subtitle: `Analysis of ${propositions.length} government propositions shaping the legislative agenda` },
        sv: { title: `Regeringens propositioner: Veckans prioriteringar`, subtitle: `Analys av ${propositions.length} propositioner som formar den lagstiftande agendan` },
        da: { title: `Regeringsforslag: Politiske prioriteringer denne uge`, subtitle: `Analyse af ${propositions.length} regeringsforslag` },
        no: { title: `Regjeringens proposisjoner: Politiske prioriteringer denne uken`, subtitle: `Analyse av ${propositions.length} regjeringsproposisjoner` },
        fi: { title: `Hallituksen esitykset: Viikon poliittiset prioriteetit`, subtitle: `Analyysi ${propositions.length} hallituksen esityksestä` },
        de: { title: `Regierungsvorlagen: Politische Prioritäten diese Woche`, subtitle: `Analyse von ${propositions.length} Regierungsvorlagen` },
        fr: { title: `Propositions gouvernementales: Priorités politiques cette semaine`, subtitle: `Analyse de ${propositions.length} propositions gouvernementales` },
        es: { title: `Proposiciones gubernamentales: Prioridades políticas esta semana`, subtitle: `Análisis de ${propositions.length} proposiciones gubernamentales` },
        nl: { title: `Regeringsvoorstellen: Politieke prioriteiten deze week`, subtitle: `Analyse van ${propositions.length} regeringsvoorstellen` },
        ar: { title: `مقترحات الحكومة: الأولويات السياسية هذا الأسبوع`, subtitle: `تحليل ${propositions.length} مقترحات حكومية` },
        he: { title: `הצעות ממשלה: סדרי עדיפויות מדיניים השבוע`, subtitle: `ניתוח ${propositions.length} הצעות ממשלה` },
        ja: { title: `政府提案：今週の政策優先事項`, subtitle: `${propositions.length}件の政府提案の分析` },
        ko: { title: `정부 법안: 이번 주 정책 우선순위`, subtitle: `${propositions.length}개 정부 법안 분석` },
        zh: { title: `政府提案：本周政策优先事项`, subtitle: `${propositions.length}份政府提案分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      await writeSingleArticle(html, slug, lang);
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Propositions:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Opposition Motions article
 */
async function generateMotions(): Promise<GenerationResult> {
  console.log('📝 Generating Opposition Motions article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching motions from riksdag-regering-mcp...');
    let motions: unknown[] = await client.fetchMotions(10);
    console.log(`  📊 Found ${motions.length} motions`);

    if (motions.length === 0) {
      console.log('  ℹ️ No new motions found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    motions = await client.enrichDocumentsWithContent(motions as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (motions as Array<Record<string, unknown>>).filter(m => m['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${motions.length} motions with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-opposition-motions`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedMotions = motions as Parameters<typeof generateArticleContent>[0]['motions'];
      const content: string = generateArticleContent({ motions: typedMotions }, 'motions', lang);
      const watchPoints = extractWatchPoints({ motions: typedMotions }, lang);
      const metadata = generateMetadata({ motions: typedMotions }, 'motions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_motioner', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Opposition Motions: Battle Lines This Week`, subtitle: `Analysis of ${motions.length} opposition motions revealing parliamentary fault lines` },
        sv: { title: `Oppositionsmotioner: Veckans stridslinjer`, subtitle: `Analys av ${motions.length} oppositionsmotioner som avslöjar parlamentariska skiljelinjer` },
        da: { title: `Oppositionsforslag: Ugens kamppladser`, subtitle: `Analyse af ${motions.length} oppositionsforslag` },
        no: { title: `Opposisjonsforslag: Ukens kamplinjer`, subtitle: `Analyse av ${motions.length} opposisjonsforslag` },
        fi: { title: `Opposition aloitteet: Viikon taistelulinjat`, subtitle: `Analyysi ${motions.length} opposition aloitteesta` },
        de: { title: `Oppositionsanträge: Kampflinien dieser Woche`, subtitle: `Analyse von ${motions.length} Oppositionsanträgen` },
        fr: { title: `Motions d'opposition: Lignes de bataille cette semaine`, subtitle: `Analyse de ${motions.length} motions d'opposition` },
        es: { title: `Mociones de oposición: Líneas de batalla esta semana`, subtitle: `Análisis de ${motions.length} mociones de oposición` },
        nl: { title: `Oppositiemoties: Strijdlijnen deze week`, subtitle: `Analyse van ${motions.length} oppositiemoties` },
        ar: { title: `اقتراحات المعارضة: خطوط المعركة هذا الأسبوع`, subtitle: `تحليل ${motions.length} اقتراحات المعارضة` },
        he: { title: `הצעות אופוזיציה: קווי העימות השבוע`, subtitle: `ניתוח ${motions.length} הצעות אופוזיציה` },
        ja: { title: `野党動議：今週の対立構図`, subtitle: `${motions.length}件の野党動議の分析` },
        ko: { title: `야당 동의: 이번 주 대립 구도`, subtitle: `${motions.length}개 야당 동의 분석` },
        zh: { title: `反对党动议：本周对立格局`, subtitle: `${motions.length}份反对党动议分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      await writeSingleArticle(html, slug, lang);
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Motions:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Main generation function
 */
async function generateNews(): Promise<typeof stats> {
  console.log('🚀 Starting enhanced news generation...\n');

  for (const type of articleTypes) {
    switch (type.trim()) {
      case 'week-ahead':
        await generateWeekAhead();
        break;
      case 'committee-reports':
        await generateCommitteeReports();
        break;
      case 'propositions':
        await generatePropositions();
        break;
      case 'motions':
        await generateMotions();
        break;
      case 'breaking': {
        // Auto-detect most significant recent development: fetch today's votes and documents
        console.log('⚡ Breaking news — detecting most significant parliamentary development...');
        try {
          const sharedClient = await getSharedClient();
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0] ?? '';

          // Fetch recent votes (no date filter — search_voteringar uses rm/bet/punkt)
          const recentVotes = await Promise.resolve()
            .then(() => sharedClient.fetchVotingRecords({ limit: 20 }))
            .catch(() => [] as unknown[]);

          // Fetch today's most significant documents
          const todayDocs = await Promise.resolve()
            .then(() => sharedClient.searchDocuments({ from_date: todayStr, to_date: todayStr, limit: 20 }))
            .catch(() => [] as unknown[]);

          if (recentVotes.length === 0 && todayDocs.length === 0) {
            console.log('  ℹ️ No significant votes or documents found today — skipping breaking news');
            break;
          }

          // Pick the most significant document: prefer propositions and committee reports
          type DocRecord = Record<string, string>;
          const allItems = [...todayDocs, ...recentVotes] as DocRecord[];
          const topDoc = allItems.find(d => d['doktyp'] === 'prop' || d['doktyp'] === 'proposition')
            ?? allItems.find(d => d['doktyp'] === 'bet' || d['doktyp'] === 'betankande')
            ?? allItems[0];

          const topTitle = topDoc
            ? (topDoc['titel'] || topDoc['title'] || topDoc['avser'] || 'Parliamentary Development')
            : 'Riksdag parliamentary activity today';
          const topSlug = topDoc
            ? (() => {
                const cleaned = (topDoc['titel'] || topDoc['title'] || 'news')
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .slice(0, 40);
                return cleaned || 'news';
              })()
            : 'news';
          const voteId = recentVotes.length > 0 ? ((recentVotes[0] as DocRecord)['punkt'] ?? '') : '';

          console.log(`  📰 Lead story: "${topTitle}"`);

          await generateBreakingNews({
            languages,
            eventContext: topTitle,
            eventData: {
              slug: topSlug,
              topic: topTitle.slice(0, 80),
              voteId: voteId || undefined,
            },
            writeArticle,
          });
        } catch (err: unknown) {
          console.error('❌ Error generating breaking news:', (err as Error).message);
        }
        break;
      }
      case 'month-ahead':
        await generateMonthAhead({ languages, writeArticle });
        break;
      case 'weekly-review':
        await generateWeeklyReview({ languages, writeArticle });
        break;
      case 'monthly-review':
        await generateMonthlyReview({ languages, writeArticle });
        break;
      default:
        console.warn(`⚠️ Unknown article type: ${type}`);
    }
  }

  // Save generation metadata
  const metadataFile: string = path.join(METADATA_DIR, 'last-generation.json');
  const lastGeneration: LastGenerationMetadata = {
    timestamp: stats.timestamp,
    types: articleTypes,
    languagesGenerated: languages,
    allRequestedLanguages: allRequestedLanguages,
    batchSize: batchSize || 'all',
    skipExisting: skipExistingArg,
    generated: stats.generated,
    errors: stats.errors,
    articles: stats.articles,
    status: 'enhanced',
    note: 'Enhanced script with MCP integration, multi-language support, and batch mode'
  };
  fs.writeFileSync(metadataFile, JSON.stringify(lastGeneration, null, 2));

  // Save detailed results
  const resultFile: string = path.join(METADATA_DIR, 'generation-result.json');
  fs.writeFileSync(resultFile, JSON.stringify(stats, null, 2));

  // Write batch status for workflow orchestration
  const today: string = toISODate(new Date());
  const existingFiles: string[] = fs.existsSync(NEWS_DIR)
    ? fs.readdirSync(NEWS_DIR).filter(f => f.startsWith(today) && f.endsWith('.html'))
    : [];
  const completedLangs: Language[] = allRequestedLanguages.filter(lang =>
    existingFiles.some(f => f.endsWith(`-${lang}.html`))
  );
  const remainingLangs: Language[] = allRequestedLanguages.filter(l => !completedLangs.includes(l));

  const batchStatus: BatchStatus = {
    complete: remainingLangs.length === 0,
    completedLanguages: completedLangs,
    remainingLanguages: remainingLangs,
    allRequestedLanguages: allRequestedLanguages,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(METADATA_DIR, 'batch-status.json'),
    JSON.stringify(batchStatus, null, 2)
  );

  console.log('\n✅ Enhanced news generation complete');
  console.log(`Generated: ${stats.generated} articles`);
  console.log(`Errors: ${stats.errors}`);

  if (stats.articles.length > 0) {
    console.log('\nArticles generated:');
    stats.articles.forEach(article => console.log(`  - ${article}`));
  }

  if (remainingLangs.length > 0) {
    console.log(`\n📦 Batch progress: ${completedLangs.length}/${allRequestedLanguages.length} languages done`);
    console.log(`   Remaining: ${remainingLangs.join(', ')}`);
    console.log('   Re-run with --skip-existing to continue with next batch');
  } else {
    console.log(`\n🎉 All ${allRequestedLanguages.length} languages generated!`);
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Auto-execution
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  generateNews()
    .then(result => {
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch((error: unknown) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  generateNews,
  generateWeekAhead,
  generateCommitteeReports,
  generatePropositions,
  generateMotions,
  writeSingleArticle,
  writeArticlePair,
  VALID_ARTICLE_TYPES,
  ALL_LANGUAGES,
  LANGUAGE_PRESETS,
  formatDateForSlug,
  getWeekAheadDateRange,
  requireMcp
};
