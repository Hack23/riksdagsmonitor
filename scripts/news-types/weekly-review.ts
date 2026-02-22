/**
 * @module ContentGeneration/WeeklyReview
 * @category ContentGeneration
 * 
 * @title Weekly Review Article Generator - Deep Intelligence Analysis
 * 
 * @description
 * Generates retrospective weekly review articles with full-document analysis.
 * Pipeline: search_dokument (IDs) → get_dokument_innehall per doc (full text)
 * → search_anforanden (speeches) → CIA static data → deep intelligence analysis.
 * 
 * **DATA PIPELINE:**
 * 1. search_dokument  – find document IDs and types for the period
 * 2. get_dokument_innehall – load every document completely (concurrency 3)
 * 3. search_anforanden – fetch speeches from the same period
 * 4. get_betankanden / get_propositioner / get_motioner – typed metadata
 * 5. CIA static context – party performance, motion success rates, coalition data
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from '../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  type RawDocument,
  type CIAContext
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';
import type { Language } from '../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../types/article.js';

/**
 * Required MCP tools for weekly-review articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'search_dokument'
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface WeeklyReviewValidationResult {
  hasWeeklySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasKeyOutcomes: boolean;
  passed: boolean;
}

export interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface GenerationOptions {
  languages?: Language[];
  lookbackDays?: number;
  writeArticle?: ((html: string, filename: string) => Promise<void | boolean>) | null;
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Resolve the repo data directory path.
 * Works both in Node.js ESM and from compiled paths.
 */
export function repoDataDir(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // From scripts/news-types/ → up two levels to repo root → data/
    return join(__dirname, '..', '..', 'data');
  } catch {
    return join(process.cwd(), 'data');
  }
}

/**
 * Load CIA intelligence context from static JSON files.
 * Returns a populated CIAContext or a minimal fallback when files are missing.
 */
export function loadCIAContext(): CIAContext {
  const dataDir = repoDataDir();

  // Attempt to read party-performance.json
  let partyPerformance: CIAContext['partyPerformance'] = [];
  const ppPath = join(dataDir, 'cia-exports', 'current', 'party-performance.json');
  if (existsSync(ppPath)) {
    try {
      const raw = JSON.parse(readFileSync(ppPath, 'utf-8')) as {
        parties?: Array<{
          id: string;
          partyName: string;
          metrics: { seats: number; successRate: number; motionsSubmitted: number; motionsPassed: number };
          voting?: { cohesionScore?: number };
          trends: { supportTrend: string; activityTrend: string };
        }>;
      };
      partyPerformance = (raw.parties ?? []).map(p => ({
        id: p.id,
        partyName: p.partyName,
        metrics: {
          seats: p.metrics.seats,
          successRate: p.metrics.successRate,
          motionsSubmitted: p.metrics.motionsSubmitted,
          motionsPassed: p.metrics.motionsPassed,
          cohesionScore: p.voting?.cohesionScore,
        },
        trends: p.trends,
      }));
    } catch (err) {
      console.error('Failed to load party-performance.json:', err);
    }
  }

  // Overview dashboard for coalition metrics
  let coalitionStability: CIAContext['coalitionStability'] = {
    stabilityScore: 72,
    riskLevel: 'moderate',
    defectionProbability: 15,
    majorityMargin: 1,
  };
  const odPath = join(dataDir, 'cia-exports', 'current', 'overview-dashboard.json');
  if (existsSync(odPath)) {
    try {
      const raw = JSON.parse(readFileSync(odPath, 'utf-8')) as {
        keyMetrics?: { majorityMargin?: number };
        coalitionStability?: { stabilityScore?: number; riskLevel?: string; defectionProbability?: number };
      };
      coalitionStability = {
        stabilityScore: raw.coalitionStability?.stabilityScore ?? 72,
        riskLevel: raw.coalitionStability?.riskLevel ?? 'moderate',
        defectionProbability: raw.coalitionStability?.defectionProbability ?? 15,
        majorityMargin: raw.keyMetrics?.majorityMargin ?? 1,
      };
    } catch (err) {
      console.error('Failed to load overview-dashboard.json:', err);
    }
  }

  // Voting patterns for key issues
  let votingPatterns: CIAContext['votingPatterns'] = { keyIssues: [] };
  const vpPath = join(dataDir, 'cia-exports', 'current', 'voting-patterns.json');
  if (existsSync(vpPath)) {
    try {
      const raw = JSON.parse(readFileSync(vpPath, 'utf-8')) as {
        keyIssues?: Array<{ topic: string; coalitionAlignment: number; oppositionAlignment: number; crossPartyVotes: number }>;
      };
      votingPatterns = { keyIssues: raw.keyIssues ?? [] };
    } catch (err) {
      console.error('Failed to load voting-patterns.json:', err);
    }
  }

  // Overall motion denial rate: weighted average across all parties
  let overallMotionDenialRate = 99;
  if (partyPerformance.length > 0) {
    const totalSubmitted = partyPerformance.reduce((s, p) => s + p.metrics.motionsSubmitted, 0);
    const totalPassed = partyPerformance.reduce((s, p) => s + p.metrics.motionsPassed, 0);
    if (totalSubmitted > 0) {
      overallMotionDenialRate = Math.round(((totalSubmitted - totalPassed) / totalSubmitted) * 100);
    }
  }

  return { partyPerformance, coalitionStability, votingPatterns, overallMotionDenialRate };
}

/**
 * Enrich a flat list of documents with full text via get_dokument_innehall.
 * Mutates each document in place; never throws — failures are logged and skipped.
 */
export async function enrichWithFullText(
  client: MCPClient,
  documents: RawDocument[],
  mcpCalls: MCPCallRecord[],
  concurrency = 3,
): Promise<void> {
  console.log(`  📖 Enriching ${documents.length} documents with full text (concurrency ${concurrency})...`);
  let enriched = 0;

  for (let i = 0; i < documents.length; i += concurrency) {
    const batch = documents.slice(i, i + concurrency);

    await Promise.allSettled(batch.map(async (doc) => {
      const dokId = (doc as Record<string, string>).dok_id
        ?? (doc as Record<string, string>).dokumentnamn
        ?? (doc as Record<string, string>).id;
      if (!dokId) return;

      try {
        const details = await client.fetchDocumentDetails(dokId, true);
        mcpCalls.push({ tool: 'get_dokument_innehall', result: details });

        // Merge full text fields into document.
        // NOTE: details['text'] from get_dokument_innehall is a raw database metadata
        // dump (IDs, dates, URLs), NOT human-readable prose — do not use as fullText.
        const d = doc as Record<string, unknown>;
        d['fullText'] = (details['fullText'] as string)
          ?? (details['summary'] as string)
          ?? (details['notis'] as string)
          ?? '';
        d['fullContent'] = (details['html'] as string) ?? '';
        if (!d['summary'] && details['summary']) d['summary'] = details['summary'] as string;
        if (!d['notis'] && details['notis']) d['notis'] = details['notis'] as string;
        d['contentFetched'] = true;
        enriched++;
      } catch (err: unknown) {
        console.error(`  ⚠ Failed to fetch full text for ${dokId}:`, (err as Error).message);
      }
    }));

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < documents.length) {
      await new Promise<void>(r => setTimeout(r, 300));
    }
  }

  console.log(`  ✅ Enriched ${enriched}/${documents.length} documents with full text`);
}

/**
 * Attach related speeches to documents that share the same dokId.
 */
export function attachSpeechesToDocuments(
  documents: RawDocument[],
  speeches: Array<Record<string, unknown>>,
): void {
  if (speeches.length === 0) return;
  // Build a loose index: dok_id → speeches
  const speechIndex = new Map<string, Array<{ talare?: string; parti?: string; text?: string; anforande_nummer?: string }>>();
  for (const s of speeches) {
    const ref = String(s['intressent_id'] ?? s['dok_id'] ?? s['rel_dok_id'] ?? '');
    if (!ref) continue;
    if (!speechIndex.has(ref)) speechIndex.set(ref, []);
    speechIndex.get(ref)!.push({
      talare: s['talare'] as string | undefined,
      parti: s['parti'] as string | undefined,
      text: (s['anforande_text'] as string | undefined)?.slice(0, 300),
      anforande_nummer: s['anforande_nummer'] as string | undefined,
    });
  }
  for (const doc of documents) {
    const dokId = (doc as Record<string, string>).dok_id ?? '';
    const related = speechIndex.get(dokId);
    if (related && related.length > 0) {
      (doc as Record<string, unknown>).speeches = related;
    }
  }
}

/**
 * Generate Weekly Review article in specified languages
 */
export async function generateWeeklyReview(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], lookbackDays = 7, writeArticle = null } = options;

  console.log('📊 Generating Weekly Review article (full-document analysis pipeline)...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const fromStr = formatDateForSlug(startDate);
    const toStr = formatDateForSlug(today);

    console.log(`  🔄 Step 1 — Searching documents ${fromStr} → ${toStr}...`);

    // ── Step 1: search_dokument to discover IDs and types ──────────────────
    const allDocs = await client.searchDocuments({
      from_date: fromStr,
      to_date: toStr,
      limit: 200,
    });

    mcpCalls.push({ tool: 'search_dokument', result: allDocs });

    const filterRecent = (docs: unknown[]): RawDocument[] =>
      (docs as RawDocument[]).filter(d => {
        const date = (d as Record<string, string>).datum ?? (d as Record<string, string>).publicerad ?? '';
        return date >= fromStr && date <= toStr;
      });

    // ── Step 2: type-specific fetchers for richer metadata (non-fatal) ─────
    console.log('  🔄 Step 2 — Fetching typed metadata (reports, propositions, motions)...');
    const [reports, propositions, motions] = await Promise.all([
      Promise.resolve()
        .then(() => client.fetchCommitteeReports(50, '2025/26') as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch committee reports:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchPropositions(50, '2025/26') as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch propositions:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchMotions(50, '2025/26') as Promise<unknown[]>)
        .catch((err: unknown) => { console.error('Failed to fetch motions:', err); return [] as unknown[]; }),
    ]);

    const recentReports = filterRecent(reports);
    const recentPropositions = filterRecent(propositions);
    const recentMotions = filterRecent(motions);

    for (const d of recentReports) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'bet'; }
    for (const d of recentPropositions) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'prop'; }
    for (const d of recentMotions) { if (!(d as Record<string, string>).doktyp) (d as Record<string, string>).doktyp = 'mot'; }

    mcpCalls.push({ tool: 'get_betankanden', result: recentReports });
    mcpCalls.push({ tool: 'get_propositioner', result: recentPropositions });
    mcpCalls.push({ tool: 'get_motioner', result: recentMotions });

    // Merge: typed docs (with dok_id) are highest quality; supplement with
    // real documents from general search (those that have both dok_id and doktyp).
    const typedDocs = [...recentReports, ...recentPropositions, ...recentMotions];
    const typedDocIds = new Set<string>(
      typedDocs.flatMap(d => {
        const id = (d as Record<string, string>).dok_id;
        return id ? [id] : [];
      }),
    );

    const searchExtras = (allDocs as RawDocument[]).filter(d => {
      const id = (d as Record<string, string>).dok_id;
      const type = (d as Record<string, string>).doktyp;
      return id && type && !typedDocIds.has(id);
    });

    // Use typed + extras when available; fall back to raw search results (test mocks / edge cases)
    const documents: RawDocument[] =
      typedDocs.length > 0 || searchExtras.length > 0
        ? [...typedDocs, ...searchExtras]
        : (allDocs as RawDocument[]);

    console.log(`  📊 Found ${documents.length} documents (${recentReports.length} reports, ${recentPropositions.length} propositions, ${recentMotions.length} motions)`);

    if (documents.length === 0) {
      console.log('  ℹ️ No documents found for the past week, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    // ── Step 3: load each document completely via get_dokument_innehall ────
    console.log('  🔄 Step 3 — Loading full document content...');
    await enrichWithFullText(client, documents, mcpCalls, 3);

    // ── Step 4: fetch speeches from the period ─────────────────────────────
    console.log('  🔄 Step 4 — Fetching speeches from the period...');
    const speeches = await Promise.resolve()
      .then(() => client.searchSpeeches({ rm: '2025/26', from: fromStr, to: toStr, limit: 100 }) as Promise<unknown[]>)
      .catch((err: unknown) => { console.error('Failed to fetch speeches:', err); return [] as unknown[]; });

    mcpCalls.push({ tool: 'search_anforanden', result: speeches });
    attachSpeechesToDocuments(documents, speeches as Array<Record<string, unknown>>);
    console.log(`  🗣 Found ${speeches.length} speeches`);

    // ── Step 5: load CIA intelligence context from static data ─────────────
    console.log('  🔄 Step 5 — Loading CIA intelligence context...');
    const ciaContext = loadCIAContext();
    console.log(`  🧠 CIA context: ${ciaContext.partyPerformance.length} parties, coalition stability ${ciaContext.coalitionStability.stabilityScore}/100, motion denial rate ${ciaContext.overallMotionDenialRate}%`);

    // ── Generate articles ──────────────────────────────────────────────────
    const slug = `${formatDateForSlug(today)}-weekly-review`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent({ documents, ciaContext }, 'weekly-review', lang);
      const watchPoints = extractWatchPoints({ documents, ciaContext }, lang);
      const metadata = generateMetadata({ documents, ciaContext }, 'weekly-review', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources([
        'search_dokument',
        'get_dokument_innehall',
        'search_anforanden',
        'get_betankanden',
        'get_propositioner',
        'get_motioner',
      ]);

      const titles: TitleSet = getTitles(lang, documents.length);

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0] ?? '',
        type: 'retrospective' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      articles.push({
        lang,
        html,
        filename: `${slug}-${lang}.html`,
        slug: `${slug}-${lang}`
      });

      if (writeArticle) {
        await writeArticle(html, `${slug}-${lang}.html`);
        console.log(`  ✅ ${lang.toUpperCase()} version generated`);
      }
    }

    return {
      success: true,
      files: languages.length,
      slug,
      articles,
      mcpCalls,
      crossReferences: {
        event: `${documents.length} documents over ${lookbackDays} days`,
        sources: ['search_dokument', 'get_dokument_innehall', 'search_anforanden', 'get_betankanden', 'get_propositioner', 'get_motioner']
      }
    };
  } catch (error: unknown) {
    console.error('❌ Error generating Weekly Review:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      mcpCalls
    };
  }
}

/**
 * Get language-specific titles
 */
function getTitles(lang: Language, documentCount: number): TitleSet {
  const titles: Record<Language, TitleSet> = {
    en: {
      title: `Weekly Review: Parliament in Retrospect`,
      subtitle: `Analysis of ${documentCount} key developments from the past week in Swedish politics`
    },
    sv: {
      title: `Veckans sammanfattning: Riksdagen i retrospektiv`,
      subtitle: `Analys av ${documentCount} viktiga händelser från den gångna veckan`
    },
    da: {
      title: `Ugentlig gennemgang: Parlamentet i tilbageblik`,
      subtitle: `Analyse af ${documentCount} vigtige begivenheder fra den forgangne uge`
    },
    no: {
      title: `Ukentlig gjennomgang: Stortinget i retrospekt`,
      subtitle: `Analyse av ${documentCount} viktige hendelser fra den siste uken`
    },
    fi: {
      title: `Viikkokatsaus: Eduskunta jälkikäteen`,
      subtitle: `Analyysi ${documentCount} tärkeästä tapahtumasta viime viikolta`
    },
    de: {
      title: `Wochenrückblick: Parlament in Rückschau`,
      subtitle: `Analyse von ${documentCount} wichtigen Entwicklungen der vergangenen Woche`
    },
    fr: {
      title: `Revue hebdomadaire : Le Parlement en rétrospective`,
      subtitle: `Analyse de ${documentCount} développements clés de la semaine écoulée`
    },
    es: {
      title: `Revisión semanal: El Parlamento en retrospectiva`,
      subtitle: `Análisis de ${documentCount} desarrollos clave de la semana pasada`
    },
    nl: {
      title: `Wekelijkse terugblik: Parlement in retrospectief`,
      subtitle: `Analyse van ${documentCount} belangrijke ontwikkelingen van de afgelopen week`
    },
    ar: {
      title: `المراجعة الأسبوعية: البرلمان في استعراض`,
      subtitle: `تحليل ${documentCount} تطورات رئيسية من الأسبوع الماضي`
    },
    he: {
      title: `סקירה שבועית: הפרלמנט בראי`,
      subtitle: `ניתוח ${documentCount} התפתחויות מרכזיות מהשבוע שעבר`
    },
    ja: {
      title: `週間レビュー：議会の振り返り`,
      subtitle: `先週の${documentCount}件の主要な動向の分析`
    },
    ko: {
      title: `주간 리뷰: 의회 회고`,
      subtitle: `지난 주 ${documentCount}건의 주요 동향 분석`
    },
    zh: {
      title: `每周回顾：议会回顾`,
      subtitle: `过去一周${documentCount}项重要发展的分析`
    }
  };

  return titles[lang] || titles.en;
}

/**
 * Validate weekly review article structure
 */
export function validateWeeklyReview(article: ArticleInput): WeeklyReviewValidationResult {
  const hasWeeklySummary = checkWeeklySummary(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasRetrospectiveTone = checkRetrospectiveTone(article);
  const hasKeyOutcomes = checkKeyOutcomes(article);

  return {
    hasWeeklySummary,
    hasMinimumSources,
    hasRetrospectiveTone,
    hasKeyOutcomes,
    passed: hasWeeklySummary && hasMinimumSources && hasRetrospectiveTone && hasKeyOutcomes
  };
}

function checkWeeklySummary(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('week') ||
         article.content.toLowerCase().includes('summary') ||
         article.content.toLowerCase().includes('review');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkRetrospectiveTone(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const retroKeywords = ['concluded', 'passed', 'voted', 'decided', 'approved', 'rejected', 'completed'];
  return retroKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}

function checkKeyOutcomes(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const outcomeKeywords = ['outcome', 'result', 'decision', 'passed', 'adopted'];
  return outcomeKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}
