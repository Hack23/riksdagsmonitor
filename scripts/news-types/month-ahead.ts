/**
 * @module ContentGeneration/MonthAheadAnalysis
 * @category ContentGeneration
 * 
 * @title Month-Ahead Calendar Article Generator - Strategic Monthly Outlook
 * 
 * @description
 * Generates forward-looking monthly outlook articles covering the next 30 days
 * of parliamentary activity. Provides strategic intelligence about upcoming
 * legislative milestones, scheduled votes, committee cycles, and government
 * calendar events at a monthly horizon.
 * 
 * **COVERAGE SCOPE - 30-DAY CALENDAR:**
 * - Parliamentary session schedule and recess periods
 * - Major scheduled votes and budget milestones
 * - Committee report deadlines and hearing schedules
 * - Government policy announcements and EU coordination
 * - International parliamentary events (EU, Nordic Council)
 * 
 * **MCP DATA SOURCE:**
 * Primary tool: get_calendar_events (30-day range)
 * Secondary: search_dokument, get_propositioner
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
 * Required MCP tools for month-ahead articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'get_calendar_events'
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface MonthAheadValidationResult {
  hasCalendarEvents: boolean;
  hasMinimumSources: boolean;
  hasForwardLookingTone: boolean;
  hasStrategicContext: boolean;
  passed: boolean;
}

export interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface GenerationOptions {
  languages?: Language[];
  daysAhead?: number;
  writeArticle?: ((html: string, filename: string) => Promise<void>) | null;
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Generate Month-Ahead article in specified languages
 */
export async function generateMonthAhead(options: GenerationOptions = {}): Promise<GenerationResult> {
  const { languages = ['en', 'sv'], daysAhead = 30, writeArticle = null } = options;

  console.log('📅 Generating Month-Ahead outlook article...');

  const mcpCalls: MCPCallRecord[] = [];

  try {
    const client = new MCPClient();

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    const fromStr = formatDateForSlug(today);
    const toStr = formatDateForSlug(endDate);

    console.log(`  🔄 Fetching calendar events ${fromStr} → ${toStr}...`);
    const events = await client.fetchCalendarEvents(fromStr, toStr) as RawDocument[];
    mcpCalls.push({ tool: 'get_calendar_events', result: events });
    console.log(`  📊 Found ${events.length} calendar events`);

    if (events.length === 0) {
      console.log('  ℹ️ No upcoming calendar events found, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    const slug = `${formatDateForSlug(today)}-month-ahead`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const content: string = generateArticleContent({ events }, 'month-ahead', lang);
      const watchPoints = extractWatchPoints({ events }, lang);
      const metadata = generateMetadata({ events }, 'month-ahead', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_calendar_events']);

      const titles: TitleSet = getTitles(lang, events.length);

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0] ?? '',
        type: 'prospective' as ArticleCategory,
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
        event: `${events.length} events over ${daysAhead} days`,
        sources: ['calendar_events']
      }
    };
  } catch (error: unknown) {
    console.error('❌ Error generating Month-Ahead:', (error as Error).message);
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
function getTitles(lang: Language, eventCount: number): TitleSet {
  const titles: Record<Language, TitleSet> = {
    en: {
      title: `Month Ahead: Parliamentary Outlook`,
      subtitle: `Strategic preview of ${eventCount} upcoming events shaping Sweden's legislative agenda`
    },
    sv: {
      title: `Månaden framåt: Parlamentarisk utblick`,
      subtitle: `Strategisk förhandsvisning av ${eventCount} kommande händelser`
    },
    da: {
      title: `Måneden forude: Parlamentarisk udsigt`,
      subtitle: `Strategisk forhåndsvisning af ${eventCount} kommende begivenheder`
    },
    no: {
      title: `Måneden fremover: Parlamentarisk utsikt`,
      subtitle: `Strategisk forhåndsvisning av ${eventCount} kommende hendelser`
    },
    fi: {
      title: `Kuukausi eteenpäin: Parlamentaarinen näkymä`,
      subtitle: `Strateginen ennakkokatsaus ${eventCount} tulevaan tapahtumaan`
    },
    de: {
      title: `Monatsausblick: Parlamentarische Vorschau`,
      subtitle: `Strategische Vorschau auf ${eventCount} bevorstehende Ereignisse`
    },
    fr: {
      title: `Mois à venir : Perspective parlementaire`,
      subtitle: `Aperçu stratégique de ${eventCount} événements à venir`
    },
    es: {
      title: `Mes adelante: Perspectiva parlamentaria`,
      subtitle: `Vista previa estratégica de ${eventCount} eventos próximos`
    },
    nl: {
      title: `Maand vooruit: Parlementair vooruitzicht`,
      subtitle: `Strategisch overzicht van ${eventCount} aankomende evenementen`
    },
    ar: {
      title: `الشهر القادم: التوقعات البرلمانية`,
      subtitle: `معاينة استراتيجية لـ ${eventCount} أحداث قادمة`
    },
    he: {
      title: `החודש הקרוב: תחזית פרלמנטרית`,
      subtitle: `תצוגה מקדימה אסטרטגית של ${eventCount} אירועים קרובים`
    },
    ja: {
      title: `月間展望：議会見通し`,
      subtitle: `${eventCount}件の今後のイベントの戦略的プレビュー`
    },
    ko: {
      title: `월간 전망: 의회 전망`,
      subtitle: `${eventCount}개 향후 이벤트에 대한 전략적 미리보기`
    },
    zh: {
      title: `月度展望：议会前瞻`,
      subtitle: `${eventCount}个即将到来的事件的战略预览`
    }
  };

  return titles[lang] || titles.en;
}

/**
 * Validate month-ahead article structure
 */
export function validateMonthAhead(article: ArticleInput): MonthAheadValidationResult {
  const hasCalendarEvents = checkCalendarEvents(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasForwardLookingTone = checkForwardLookingTone(article);
  const hasStrategicContext = checkStrategicContext(article);

  return {
    hasCalendarEvents,
    hasMinimumSources,
    hasForwardLookingTone,
    hasStrategicContext,
    passed: hasCalendarEvents && hasMinimumSources && hasForwardLookingTone && hasStrategicContext
  };
}

function checkCalendarEvents(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('calendar') ||
         article.content.toLowerCase().includes('event') ||
         article.content.toLowerCase().includes('schedule');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkForwardLookingTone(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const forwardKeywords = ['upcoming', 'scheduled', 'expected', 'anticipated', 'planned', 'forecast'];
  return forwardKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}

function checkStrategicContext(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const strategicKeywords = ['strategic', 'milestone', 'outlook', 'priorities', 'agenda'];
  return strategicKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}
