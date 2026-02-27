/**
 * @module ContentGeneration/MonthlyReview
 * @category ContentGeneration
 * 
 * @title Monthly Review Article Generator - Retrospective Monthly Analysis
 * 
 * @description
 * Generates comprehensive monthly review articles analyzing the past 30 days
 * of parliamentary activity using the same 5-step enrichment pipeline as weekly-review:
 * 1. search_dokument  – find document IDs and types for the period
 * 2. get_betankanden / get_propositioner / get_motioner – typed metadata fetchers
 * 3. get_dokument_innehall – load every document completely (concurrency 3)
 * 4. search_anforanden – fetch speeches from the same period
 * 5. CIA static context – secondary historical context only
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { MCPClient } from '../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  type RawDocument,
  type CIAContext,
  type MonthlyMetrics,
} from '../data-transformers.js';
import {
  enrichWithFullText,
  attachSpeechesToDocuments,
  loadCIAContext,
} from './weekly-review.js';
import { getCurrentRiksmote } from './motions.js';
import { generateArticleHTML } from '../article-template.js';
import type { Language } from '../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../types/article.js';

/**
 * Required MCP tools for monthly-review articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'search_dokument',
  'get_dokument_innehall',
  'search_anforanden',
  'get_betankanden',
  'get_propositioner',
  'get_motioner',
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface MonthlyReviewValidationResult {
  hasMonthlySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasTrendAnalysis: boolean;
  hasPartyRankings: boolean;
  hasLegislativeEfficiency: boolean;
  hasMonthInNumbers: boolean;
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
 * Generate Monthly Review article in specified languages using the full enrichment pipeline.
 */
export async function generateMonthlyReview(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], lookbackDays = 30, writeArticle = null } = options;

  console.log('📊 Generating Monthly Review article...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const fromStr = formatDateForSlug(startDate);
    const toStr = formatDateForSlug(today);

    // Step 1: search_dokument for document IDs and types
    console.log(`  🔄 Step 1 — Searching documents ${fromStr} → ${toStr}...`);
    const allDocs = await client.searchDocuments({
      from_date: fromStr,
      to_date: toStr,
      limit: 50,
    }) as RawDocument[];
    mcpCalls.push({ tool: 'search_dokument', result: allDocs });

    // Step 2: typed metadata fetchers (robust: errors → empty [])
    console.log('  🔄 Step 2 — Fetching typed metadata (reports, propositions, motions)...');
    const rm = getCurrentRiksmote(today);
    const [recentReports, recentPropositions, recentMotions] = await Promise.all([
      Promise.resolve().then(() => client.fetchCommitteeReports(30, getCurrentRiksmote(today)))
        .catch((err: unknown) => { console.error('Failed to fetch committee reports:', err); return [] as unknown[]; }),
      Promise.resolve().then(() => client.fetchPropositions(20, getCurrentRiksmote(today)))
        .catch((err: unknown) => { console.error('Failed to fetch propositions:', err); return [] as unknown[]; }),
      Promise.resolve().then(() => client.fetchMotions(20, getCurrentRiksmote(today)))
        .catch((err: unknown) => { console.error('Failed to fetch motions:', err); return [] as unknown[]; }),
    ]);

    // Record MCP calls for traceability
    mcpCalls.push({ tool: 'get_betankanden', result: recentReports });
    mcpCalls.push({ tool: 'get_propositioner', result: recentPropositions });
    mcpCalls.push({ tool: 'get_motioner', result: recentMotions });

    // Filter typed results to the lookback window so only in-period documents are merged
    const filterByDate = (docs: unknown[]): unknown[] =>
      docs.filter(d => {
        const rec = d as Record<string, string>;
        const docDate: string = rec['datum'] ?? rec['date'] ?? '';
        if (!docDate) return true; // no date field — keep (can't filter)
        return docDate >= fromStr && docDate <= toStr;
      });

    const filteredReports = filterByDate(recentReports as unknown[]);
    const filteredPropositions = filterByDate(recentPropositions as unknown[]);
    const filteredMotions = filterByDate(recentMotions as unknown[]);

    // Merge: typed docs first (have dok_id), then search extras
    const typedDocs = [...filteredReports, ...filteredPropositions, ...filteredMotions] as RawDocument[];
    const typedDocIds = new Set<string>(
      typedDocs.flatMap(d => {
        const id = (d as Record<string, string>).dok_id;
        return id ? [id] : [];
      }),
    );
    const searchExtras = allDocs.filter(d => {
      const id = (d as Record<string, string>).dok_id;
      const type = (d as Record<string, string>).doktyp;
      return id && type && !typedDocIds.has(id);
    });
    const documents: RawDocument[] = typedDocs.length > 0
      ? [...typedDocs, ...searchExtras]
      : allDocs;

    // Tag doktyp defaults where missing
    for (const d of documents) {
      const rec = d as Record<string, unknown>;
      if (!rec['doktyp']) {
        if (filteredReports.includes(d as unknown)) rec['doktyp'] = 'bet';
        else if (filteredPropositions.includes(d as unknown)) rec['doktyp'] = 'prop';
        else if (filteredMotions.includes(d as unknown)) rec['doktyp'] = 'mot';
      }
    }

    console.log(`  📊 Found ${documents.length} documents (${filteredReports.length} reports, ${filteredPropositions.length} propositions, ${filteredMotions.length} motions within lookback window)`);

    if (documents.length === 0) {
      console.log('  ℹ️ No documents found for the past month, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    // Step 3: enrich each document with full text
    console.log('  🔄 Step 3 — Loading full document content...');
    await enrichWithFullText(client, documents, mcpCalls, 3);

    // Step 4: fetch speeches from the period
    console.log('  🔄 Step 4 — Fetching speeches from the period...');
    const rawSpeeches = await Promise.resolve()
      .then(() => client.searchSpeeches({ from: fromStr, to: toStr, limit: 100 }))
      .catch((err: unknown) => { console.error('Failed to fetch speeches:', err); return [] as unknown[]; });
    const speeches: Array<Record<string, unknown>> = Array.isArray(rawSpeeches) ? rawSpeeches as Array<Record<string, unknown>> : [];
    mcpCalls.push({ tool: 'search_anforanden', result: speeches });
    console.log(`  🗣 Found ${speeches.length} speeches`);
    attachSpeechesToDocuments(documents, speeches);

    // Step 5: CIA intelligence context (secondary, historical)
    console.log('  🔄 Step 5 — Loading CIA intelligence context...');
    const ciaContext: CIAContext = loadCIAContext();
    console.log(`  🧠 CIA context: ${ciaContext.partyPerformance.length} parties, coalition stability ${ciaContext.coalitionStability.stabilityScore}/100, motion denial rate ${ciaContext.overallMotionDenialRate}%`);

    // Step 6: Fetch previous 2 months for multi-month trend analysis
    console.log('  🔄 Step 6 — Fetching previous months for trend analysis...');
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - lookbackDays);
    const prev2Start = new Date(prevStart);
    prev2Start.setDate(prev2Start.getDate() - lookbackDays);

    const [prevMonthDocs, twoMonthsDocs] = await Promise.all([
      // Use a higher per-period cap to better approximate total volume for trend metrics; full-text enrichment is not needed here
      client.searchDocuments({ from_date: formatDateForSlug(prevStart), to_date: fromStr, limit: 1000 })
        .catch((error) => {
          console.error(
            'MonthlyReview Step 6 — search_dokument failed for previous month trend window',
            { from_date: formatDateForSlug(prevStart), to_date: fromStr, limit: 1000 },
            error,
          );
          return [] as RawDocument[];
        }),
      client.searchDocuments({ from_date: formatDateForSlug(prev2Start), to_date: formatDateForSlug(prevStart), limit: 1000 })
        .catch((error) => {
          console.error(
            'MonthlyReview Step 6 — search_dokument failed for two-months-ago trend window',
            { from_date: formatDateForSlug(prev2Start), to_date: formatDateForSlug(prevStart), limit: 1000 },
            error,
          );
          return [] as RawDocument[];
        }),
    ]);
    mcpCalls.push({ tool: 'search_dokument', result: prevMonthDocs });
    mcpCalls.push({ tool: 'search_dokument', result: twoMonthsDocs });

    // Compute MonthlyMetrics from current-month data
    const reportCount = documents.filter(d => (d as Record<string, unknown>).doktyp === 'bet').length;
    const propositionCount = documents.filter(d => (d as Record<string, unknown>).doktyp === 'prop').length;
    const motionCount = documents.filter(d => (d as Record<string, unknown>).doktyp === 'mot').length;

    // Party rankings: aggregate motions and speeches by party
    // Filter party keys: trim whitespace and drop unknown/empty sentinels (returns null to exclude)
    // Note: distinct from the normalizePartyKey helper in helpers.ts which maps unknowns to 'other'
    const filterPartyKey = (raw: unknown): string | null => {
      const value = String(raw ?? '').trim();
      if (!value) return null;
      const lower = value.toLowerCase();
      if (lower === 'unknown' || lower === 'okänd') return null;
      return value;
    };

    const partyMotions: Record<string, number> = {};
    const partySpeeches: Record<string, number> = {};
    for (const doc of documents) {
      const rec = doc as Record<string, unknown>;
      if (rec['doktyp'] === 'mot') {
        const p = filterPartyKey(rec['parti']);
        if (p !== null) partyMotions[p] = (partyMotions[p] ?? 0) + 1;
      }
    }
    for (const speech of speeches) {
      const p = filterPartyKey(speech['parti']);
      if (p !== null) partySpeeches[p] = (partySpeeches[p] ?? 0) + 1;
    }
    const allParties = new Set([...Object.keys(partyMotions), ...Object.keys(partySpeeches)]);
    const partyRankings = Array.from(allParties)
      .map(party => ({
        party,
        motionCount: partyMotions[party] ?? 0,
        speechCount: partySpeeches[party] ?? 0,
      }))
      .sort((a, b) => (b.motionCount + b.speechCount) - (a.motionCount + a.speechCount));

    const monthlyMetrics: MonthlyMetrics = {
      totalDocuments: documents.length,
      reportCount,
      propositionCount,
      motionCount,
      speechCount: speeches.length,
      previousMonthDocCount: Array.isArray(prevMonthDocs) ? prevMonthDocs.length : 0,
      twoMonthsAgoDocCount: Array.isArray(twoMonthsDocs) ? twoMonthsDocs.length : 0,
      partyRankings,
      legislativeEfficiencyRate: propositionCount > 0 ? reportCount / propositionCount : 0,
    };
    console.log(`  📈 Monthly metrics: ${documents.length} docs this month, ${monthlyMetrics.previousMonthDocCount} last month, ${partyRankings.length} active parties`);

    const slug = `${formatDateForSlug(today)}-monthly-review`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent(
        { documents, reports: recentReports as RawDocument[], propositions: recentPropositions as RawDocument[], motions: recentMotions as RawDocument[], ciaContext, monthlyMetrics },
        'monthly-review',
        lang,
      );
      const watchPoints = extractWatchPoints({ documents }, lang);
      const metadata = generateMetadata({ documents }, 'monthly-review', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources([
        'search_dokument', 'get_dokument_innehall', 'search_anforanden',
        'get_betankanden', 'get_propositioner', 'get_motioner',
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
        tags: metadata.tags,
      });

      articles.push({
        lang,
        html,
        filename: `${slug}-${lang}.html`,
        slug: `${slug}-${lang}`,
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
        sources: ['search_dokument', 'get_dokument_innehall', 'search_anforanden', 'get_betankanden', 'get_propositioner', 'get_motioner'],
      }
    };
  } catch (error: unknown) {
    console.error('❌ Error generating Monthly Review:', (error as Error).message);
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
      title: `Monthly Review: Parliament in Perspective`,
      subtitle: `Comprehensive analysis of ${documentCount} developments from the past month in Swedish politics`
    },
    sv: {
      title: `Månadskrönika: Riksdagen i perspektiv`,
      subtitle: `Omfattande analys av ${documentCount} händelser från den gångna månaden`
    },
    da: {
      title: `Månedsgennemgang: Parlamentet i perspektiv`,
      subtitle: `Omfattende analyse af ${documentCount} begivenheder fra den forgangne måned`
    },
    no: {
      title: `Månedsgjennomgang: Stortinget i perspektiv`,
      subtitle: `Omfattende analyse av ${documentCount} hendelser fra den siste måneden`
    },
    fi: {
      title: `Kuukausikatsaus: Eduskunta perspektiivissä`,
      subtitle: `Kattava analyysi ${documentCount} tapahtumasta viime kuukaudelta`
    },
    de: {
      title: `Monatsrückblick: Parlament in Perspektive`,
      subtitle: `Umfassende Analyse von ${documentCount} Entwicklungen des vergangenen Monats`
    },
    fr: {
      title: `Revue mensuelle : Le Parlement en perspective`,
      subtitle: `Analyse complète de ${documentCount} développements du mois écoulé`
    },
    es: {
      title: `Revisión mensual: El Parlamento en perspectiva`,
      subtitle: `Análisis integral de ${documentCount} desarrollos del mes pasado`
    },
    nl: {
      title: `Maandelijkse terugblik: Parlement in perspectief`,
      subtitle: `Uitgebreide analyse van ${documentCount} ontwikkelingen van de afgelopen maand`
    },
    ar: {
      title: `المراجعة الشهرية: البرلمان في منظور`,
      subtitle: `تحليل شامل لـ ${documentCount} تطور من الشهر الماضي`
    },
    he: {
      title: `סקירה חודשית: הפרלמנט בפרספקטיבה`,
      subtitle: `ניתוח מקיף של ${documentCount} התפתחויות מהחודש שעבר`
    },
    ja: {
      title: `月間レビュー：議会を展望する`,
      subtitle: `先月の${documentCount}件の動向の包括的分析`
    },
    ko: {
      title: `월간 리뷰: 의회 전망`,
      subtitle: `지난 달 ${documentCount}건의 동향에 대한 종합 분석`
    },
    zh: {
      title: `月度回顾：议会纵览`,
      subtitle: `过去一个月${documentCount}项发展的综合分析`
    }
  };

  return titles[lang] || titles.en;
}

/**
 * Validate monthly review article structure
 */
export function validateMonthlyReview(article: ArticleInput): MonthlyReviewValidationResult {
  const hasMonthlySummary = checkMonthlySummary(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasRetrospectiveTone = checkRetrospectiveTone(article);
  const hasTrendAnalysis = checkTrendAnalysis(article);
  const hasPartyRankings = checkPartyRankings(article);
  const hasLegislativeEfficiency = checkLegislativeEfficiency(article);
  const hasMonthInNumbers = checkMonthInNumbers(article);

  return {
    hasMonthlySummary,
    hasMinimumSources,
    hasRetrospectiveTone,
    hasTrendAnalysis,
    hasPartyRankings,
    hasLegislativeEfficiency,
    hasMonthInNumbers,
    passed:
      hasMonthlySummary &&
      hasMinimumSources &&
      hasRetrospectiveTone &&
      hasTrendAnalysis &&
      hasPartyRankings &&
      hasLegislativeEfficiency &&
      hasMonthInNumbers
  };
}

function checkMonthlySummary(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('month') ||
         article.content.toLowerCase().includes('summary') ||
         article.content.toLowerCase().includes('review') ||
         article.content.toLowerCase().includes('retrospective');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkRetrospectiveTone(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const retroKeywords = ['concluded', 'passed', 'voted', 'decided', 'approved', 'rejected', 'completed', 'achieved'];
  return retroKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}

function checkTrendAnalysis(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const trendKeywords = ['trend', 'pattern', 'increase', 'decrease', 'shift', 'trajectory', 'momentum'];
  return trendKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}

function checkPartyRankings(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.includes('Party Performance Rankings') ||
         article.content.includes('Partiernas prestationsrankning') ||
         article.content.includes('🏆');
}

function checkLegislativeEfficiency(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.includes('Legislative Efficiency') ||
         article.content.includes('Lagstiftningseffektivitet') ||
         article.content.includes('⚖️');
}

function checkMonthInNumbers(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.includes('Month in Numbers') ||
         article.content.includes('Månaden i siffror') ||
         article.content.includes('📊');
}
