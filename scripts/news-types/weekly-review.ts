/**
 * @module ContentGeneration/WeeklyReview
 * @category ContentGeneration
 * 
 * @title Weekly Review Article Generator - Retrospective Weekly Analysis
 * 
 * @description
 * Generates retrospective weekly review articles analyzing the past 7 days
 * of parliamentary activity. Provides comprehensive lookback coverage of
 * completed votes, committee decisions, government announcements, and
 * legislative developments during the week.
 * 
 * **COVERAGE SCOPE - 7-DAY LOOKBACK:**
 * - Completed parliamentary votes and their outcomes
 * - Committee report releases and recommendations
 * - Government propositions and policy announcements
 * - Opposition motions and interpellations
 * - Key speeches and debates in the chamber
 * 
 * **MCP DATA SOURCES:**
 * Primary tools: search_dokument, search_voteringar
 * Secondary: get_betankanden, get_propositioner, get_motioner
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
  type RawDocument
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
 * Generate Weekly Review article in specified languages
 */
export async function generateWeeklyReview(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], lookbackDays = 7, writeArticle = null } = options;

  console.log('📊 Generating Weekly Review article...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const fromStr = formatDateForSlug(startDate);
    const toStr = formatDateForSlug(today);

    console.log(`  🔄 Fetching documents ${fromStr} → ${toStr}...`);

    // Fetch committee reports, propositions, and motions for richer content
    const [reports, propositions, motions] = await Promise.all([
      client.fetchCommitteeReports(30, '2025/26').catch(() => [] as unknown[]),
      client.fetchPropositions(30, '2025/26').catch(() => [] as unknown[]),
      client.fetchMotions(30, '2025/26').catch(() => [] as unknown[]),
    ]);

    // Filter to only recent items within lookback period
    const filterRecent = (docs: unknown[]): RawDocument[] =>
      (docs as RawDocument[]).filter(d => {
        const date = (d as Record<string, string>).datum ?? (d as Record<string, string>).publicerad ?? '';
        return date >= fromStr && date <= toStr;
      });

    const recentReports = filterRecent(reports);
    const recentPropositions = filterRecent(propositions);
    const recentMotions = filterRecent(motions);

    // Tag documents with their type for content generation
    for (const d of recentReports) (d as Record<string, string>).doktyp = (d as Record<string, string>).doktyp || 'bet';
    for (const d of recentPropositions) (d as Record<string, string>).doktyp = (d as Record<string, string>).doktyp || 'prop';
    for (const d of recentMotions) (d as Record<string, string>).doktyp = (d as Record<string, string>).doktyp || 'mot';

    const documents: RawDocument[] = [...recentReports, ...recentPropositions, ...recentMotions];
    mcpCalls.push({ tool: 'get_betankanden', result: recentReports });
    mcpCalls.push({ tool: 'get_propositioner', result: recentPropositions });
    mcpCalls.push({ tool: 'get_motioner', result: recentMotions });
    console.log(`  📊 Found ${documents.length} documents (${recentReports.length} reports, ${recentPropositions.length} propositions, ${recentMotions.length} motions)`);

    if (documents.length === 0) {
      console.log('  ℹ️ No documents found for the past week, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    const slug = `${formatDateForSlug(today)}-weekly-review`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent({ documents }, 'weekly-review', lang);
      const watchPoints = extractWatchPoints({ documents }, lang);
      const metadata = generateMetadata({ documents }, 'weekly-review', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_betankanden', 'get_propositioner', 'get_motioner']);

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
        sources: ['get_betankanden', 'get_propositioner', 'get_motioner']
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
