/**
 * @module ContentGeneration/MonthlyReview
 * @category ContentGeneration
 * 
 * @title Monthly Review Article Generator - Retrospective Monthly Analysis
 * 
 * @description
 * Generates comprehensive monthly review articles analyzing the past 30 days
 * of parliamentary activity. Provides deep retrospective analysis of legislative
 * outcomes, policy trends, coalition dynamics, and government performance
 * over the full monthly cycle.
 * 
 * **COVERAGE SCOPE - 30-DAY LOOKBACK:**
 * - Legislative output: bills passed, motions debated, committee reports issued
 * - Government performance: propositions tabled, policy announcements
 * - Coalition dynamics: voting patterns, party discipline, cross-party cooperation
 * - Committee activity: reports issued, hearings conducted
 * - Opposition effectiveness: motions filed, interpellations submitted
 * 
 * **MCP DATA SOURCES:**
 * Primary tools: search_dokument, get_betankanden
 * Secondary: get_propositioner, get_motioner, search_voteringar
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
 * Required MCP tools for monthly-review articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'search_dokument'
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
 * Generate Monthly Review article in specified languages
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

    console.log(`  🔄 Fetching documents ${fromStr} → ${toStr}...`);
    const documents = await client.searchDocuments({
      from_date: fromStr,
      to_date: toStr,
      limit: 50
    }) as RawDocument[];
    mcpCalls.push({ tool: 'search_dokument', result: documents });
    console.log(`  📊 Found ${documents.length} documents from past month`);

    if (documents.length === 0) {
      console.log('  ℹ️ No documents found for the past month, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    const slug = `${formatDateForSlug(today)}-monthly-review`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent({ documents }, 'monthly-review', lang);
      const watchPoints = extractWatchPoints({ documents }, lang);
      const metadata = generateMetadata({ documents }, 'monthly-review', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['search_dokument']);

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
        sources: ['search_dokument']
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

  return {
    hasMonthlySummary,
    hasMinimumSources,
    hasRetrospectiveTone,
    hasTrendAnalysis,
    passed: hasMonthlySummary && hasMinimumSources && hasRetrospectiveTone && hasTrendAnalysis
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
