/**
 * @module ContentGeneration/InterpellationAnalysis
 * @category ContentGeneration
 *
 * @title Interpellation Debates Article Generator - Parliamentary Accountability Intelligence
 *
 * @description
 * **INTELLIGENCE OPERATIVE PERSPECTIVE**
 *
 * This module generates analysis articles on interpellation debates (interpellationsdebatter),
 * which are formal parliamentary questions demanding a minister's personal response in
 * the Riksdag chamber. Interpellations represent the strongest tool for opposition
 * accountability and ministerial scrutiny, making them critical for understanding
 * government pressure points and opposition strategy.
 *
 * **PARLIAMENTARY CONTEXT - SWEDISH INTERPELLATION SYSTEM:**
 * Interpellations (interpellationer) are formal questions from individual MPs to
 * government ministers that require a written response AND a chamber debate. Unlike
 * written questions (skriftliga frågor), interpellations guarantee floor time and
 * public confrontation, making them the primary tool for opposition accountability.
 *
 * **INTERPELLATION INTELLIGENCE VALUE:**
 * Interpellations reveal:
 * 1. **Government Pressure Points**: Which ministers face the most scrutiny
 * 2. **Opposition Priorities**: What issues opposition parties consider most urgent
 * 3. **Ministerial Vulnerability**: How well ministers defend their positions
 * 4. **Policy Failures**: Areas where government policy is perceived as inadequate
 * 5. **Cross-Party Accountability**: Which parties cooperate on oversight
 *
 * **MCP DATA SOURCE:**
 * Primary tool: get_interpellationer
 * Additional tools (with graceful degradation):
 * - search_dokument_fulltext: Full-text interpellation analysis
 * - search_anforanden: Debate context and minister responses
 * - get_calendar_events: Scheduled interpellation debate times
 *
 * @author Hack23 AB (Parliamentary Accountability & Oversight Intelligence)
 * @license Apache-2.0
 */

import { MCPClient } from '../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  filterFreshDocuments,
  type RawDocument
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';
import type { Language } from '../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../types/article.js';

/**
 * Required MCP tools for interpellation articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'get_interpellationer',
  'search_dokument_fulltext',
  'search_anforanden',
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface InterpellationsValidationResult {
  hasInterpellations: boolean;
  hasMinimumSources: boolean;
  hasAccountabilityAnalysis: boolean;
  passed: boolean;
}

export interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface GenerationOptions {
  languages?: Language[];
  limit?: number;
  writeArticle?: ((html: string, filename: string) => Promise<void>) | null;
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Calculate the current Swedish riksmöte (parliamentary session) string.
 * The session runs September–August: e.g. September 2025 → "2025/26".
 */
export function getCurrentRiksmote(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based; September = 8
  const startYear = month >= 8 ? year : year - 1;
  const endYY = String(startYear + 1).slice(-2);
  return `${startYear}/${endYY}`;
}

/**
 * Generate Interpellation Debates article
 */
export async function generateInterpellations(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], limit = 15, writeArticle = null } = options;

  console.log('🔔 Generating Interpellation Debates article...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    console.log('  🔄 Fetching interpellations from riksdag-regering-mcp...');
    const interpellations = filterFreshDocuments(await client.fetchInterpellations({ limit }) as RawDocument[]);
    mcpCalls.push({ tool: 'get_interpellationer', result: interpellations });
    console.log(`  📊 Found ${interpellations.length} interpellations`);

    if (interpellations.length === 0) {
      console.log('  ℹ️ No new interpellations found, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    // Tool 2: search_dokument_fulltext — full-text interpellation analysis
    try {
      const topTitle = interpellations[0]?.titel || interpellations[0]?.title || '';
      if (topTitle) {
        const ftResponse = await client.request('search_dokument_fulltext', { query: topTitle, limit: 3 });
        const ftDocs = (ftResponse['dokument'] ?? ftResponse['results'] ?? []) as RawDocument[];
        mcpCalls.push({ tool: 'search_dokument_fulltext', result: ftDocs });
        console.log(`  📄 Full text: ${ftDocs.length} results`);
        const primaryInterp = interpellations[0] as Record<string, unknown> | undefined;
        if (primaryInterp && ftDocs.length > 0 && !primaryInterp['fullText']) {
          const bestDoc = ftDocs[0] as Record<string, unknown>;
          primaryInterp['fullText'] = (bestDoc['fullText'] as string) || (bestDoc['summary'] as string) || '';
        }
      }
    } catch (err) {
      console.warn('  ⚠ search_dokument_fulltext unavailable:', (err as Error).message);
      mcpCalls.push({ tool: 'search_dokument_fulltext', result: [] });
    }

    // Tool 3: search_anforanden — debate context and minister responses
    try {
      const debateQuery = interpellations[0]?.titel || interpellations[0]?.title || '';
      if (debateQuery) {
        const speeches = await client.searchSpeeches({ text: debateQuery, rm: getCurrentRiksmote(), limit: 10 }) as Array<Record<string, unknown>>;
        mcpCalls.push({ tool: 'search_anforanden', result: speeches });
        console.log(`  🗣 Debate speeches: ${speeches.length} found`);
        if (speeches.length > 0) {
          for (const interp of interpellations) {
            const m = interp as Record<string, unknown>;
            if (!m['speeches']) {
              m['speeches'] = speeches.slice(0, 3).map((s: Record<string, unknown>) => ({
                talare: s['talare'],
                parti: s['parti'],
                text: (s['anforande_text'] as string | undefined)?.slice(0, 300),
                anforande_nummer: s['anforande_nummer'],
              }));
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn('  ⚠ search_anforanden unavailable:', (err as Error).message);
      mcpCalls.push({ tool: 'search_anforanden', result: [] });
    }

    const today = new Date();
    const slug = `${formatDateForSlug(today)}-interpellation-debates`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      // Reuse motions content generator — interpellations share the same document structure
      const content: string = generateArticleContent({ motions: interpellations }, 'interpellations', lang);
      const watchPoints = extractWatchPoints({ motions: interpellations }, lang);
      const metadata = generateMetadata({ motions: interpellations }, 'interpellations', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources([
        'get_interpellationer',
        'search_dokument_fulltext',
        'search_anforanden',
      ]);

      const titles: TitleSet = getTitles(lang, interpellations.length, interpellations);

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0] ?? '',
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
        event: `${interpellations.length} interpellations`,
        sources: ['interpellationer', 'fulltext', 'speeches']
      }
    };

  } catch (error: unknown) {
    console.error('❌ Error generating Interpellations:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      mcpCalls
    };
  }
}

function getTitles(lang: Language, count: number, _documents: RawDocument[] = []): TitleSet {
  const titles: Record<Language, TitleSet> = {
    en: {
      title: `Interpellation Debates: Holding Government to Account`,
      subtitle: `Analysis of ${count} interpellation debates demanding ministerial accountability`
    },
    sv: {
      title: `Interpellationsdebatter: Regeringen ställs till svars`,
      subtitle: `Analys av ${count} interpellationsdebatter som kräver ministersvar`
    },
    da: {
      title: `Interpellationsdebatter: Regeringen stilles til ansvar`,
      subtitle: `Analyse af ${count} interpellationsdebatter`
    },
    no: {
      title: `Interpellasjonsdebatter: Regjeringen stilles til ansvar`,
      subtitle: `Analyse av ${count} interpellasjonsdebatter`
    },
    fi: {
      title: `Välikysymyskeskustelut: Hallitus tilivelvollisena`,
      subtitle: `Analyysi ${count} välikysymyskeskustelusta`
    },
    de: {
      title: `Interpellationsdebatten: Regierung in der Verantwortung`,
      subtitle: `Analyse von ${count} Interpellationsdebatten`
    },
    fr: {
      title: `Débats d'interpellation: Le gouvernement sommé de répondre`,
      subtitle: `Analyse de ${count} débats d'interpellation`
    },
    es: {
      title: `Debates de interpelación: El gobierno rinde cuentas`,
      subtitle: `Análisis de ${count} debates de interpelación`
    },
    nl: {
      title: `Interpellatiedebatten: Regering ter verantwoording`,
      subtitle: `Analyse van ${count} interpellatiedebatten`
    },
    ar: {
      title: `مناقشات الاستجواب: محاسبة الحكومة`,
      subtitle: `تحليل ${count} مناقشات استجواب`
    },
    he: {
      title: `דיוני אינטרפלציה: הממשלה נדרשת לתת דין וחשבון`,
      subtitle: `ניתוח ${count} דיוני אינטרפלציה`
    },
    ja: {
      title: `質問主意書討論：政府の説明責任を追及`,
      subtitle: `${count}件の質問主意書討論の分析`
    },
    ko: {
      title: `대정부 질의 토론: 정부 책임 추궁`,
      subtitle: `${count}건의 대정부 질의 토론 분석`
    },
    zh: {
      title: `质询辩论：追究政府责任`,
      subtitle: `${count}场质询辩论分析`
    }
  };

  return titles[lang] || titles.en;
}

export function validateInterpellations(article: ArticleInput): InterpellationsValidationResult {
  const hasInterpellations = checkInterpellations(article);
  const hasMinimumSources = countSources(article) >= 2;
  const hasAccountabilityAnalysis = checkAccountabilityAnalysis(article);

  return {
    hasInterpellations,
    hasMinimumSources,
    hasAccountabilityAnalysis,
    passed: hasInterpellations && hasMinimumSources && hasAccountabilityAnalysis
  };
}

function checkInterpellations(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('interpellation') ||
         article.content.toLowerCase().includes('minister') ||
         article.content.toLowerCase().includes('accountability');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkAccountabilityAnalysis(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const keywords = ['accountability', 'minister', 'interpellation', 'parliamentary'];
  return keywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}
