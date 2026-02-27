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
  type RawDocument,
  type RawCalendarEvent
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';
import type { Language } from '../types/language.js';
import type { ArticleCategory, GeneratedArticle, GenerationResult, MCPCallRecord } from '../types/article.js';

/**
 * Required MCP tools for month-ahead articles.
 * Note: `search_dokument` is only invoked as a fallback when `get_calendar_events`
 * returns no events (calendar-empty path). It is listed here for traceability;
 * validation should treat it as conditional rather than always-required.
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'get_calendar_events',
  'search_dokument', // conditional: used only when calendar is empty
  'get_betankanden',
  'get_propositioner',
  'get_motioner',
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
  hasLegislativePipeline: boolean;
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
  writeArticle?: ((html: string, filename: string) => Promise<void | boolean>) | null;
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Generate Month-Ahead article in specified languages.
 * Falls back to searchDocuments when calendar returns 0 events.
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

    // Determine current riksmöte (Swedish parliamentary year: Sep 1 → Jun/Jul of next year).
    // Any date in September or later belongs to the new year's session (e.g. 2025-09-01 → "2025/26").
    // Note: month-ahead uses dynamic calculation unlike weekly-review/monthly-review which hardcode
    // '2025/26'. This is intentional: month-ahead must remain accurate across parliamentary years
    // without requiring a code change at each new session boundary.
    // Use endDate (not today) as the session reference so that a late-August run covering the
    // Sep-1 boundary fetches the new session's pipeline data, not the outgoing session's.
    const sessionRefYear = endDate.getFullYear();
    const sessionRefMonth = endDate.getMonth(); // 0-11, align with motions.ts pattern
    const currentRiksmote = sessionRefMonth >= 8
      ? `${sessionRefYear}/${String(sessionRefYear + 1).slice(-2)}`
      : `${sessionRefYear - 1}/${String(sessionRefYear).slice(-2)}`;

    console.log(`  🔄 Fetching calendar events ${fromStr} → ${toStr}...`);
    const events = await client.fetchCalendarEvents(fromStr, toStr) as RawCalendarEvent[];
    mcpCalls.push({ tool: 'get_calendar_events', result: events });
    console.log(`  📊 Found ${events.length} calendar events`);

    // When calendar is empty, fall back to upcoming documents (propositions/reports in pipeline)
    let documents: RawDocument[] = [];
    if (events.length === 0) {
      console.log('  ℹ️ No calendar events — fetching upcoming documents from legislative pipeline...');
      const rawDocs = await Promise.resolve()
        .then(() => client.searchDocuments({ from_date: fromStr, to_date: toStr, limit: 30 }))
        .catch((err: unknown) => { console.error('Failed to fetch documents:', err); return [] as unknown[]; });
      documents = Array.isArray(rawDocs) ? rawDocs as RawDocument[] : [];
      mcpCalls.push({ tool: 'search_dokument', result: documents });
      console.log(`  📊 Found ${documents.length} upcoming documents`);

      // When no future docs either, fall back to recent 30-day pipeline documents
      if (documents.length === 0) {
        console.log('  ℹ️ No upcoming documents — fetching recent 30-day legislative pipeline...');
        const pastStart = new Date(today);
        pastStart.setDate(pastStart.getDate() - daysAhead);
        const pastFromStr = formatDateForSlug(pastStart);
        const rawRecentDocs = await Promise.resolve()
          .then(() => client.searchDocuments({ from_date: pastFromStr, to_date: fromStr, limit: 50 }))
          .catch((err: unknown) => { console.error('Failed to fetch recent docs:', err); return [] as unknown[]; });
        documents = Array.isArray(rawRecentDocs) ? rawRecentDocs as RawDocument[] : [];
        mcpCalls.push({ tool: 'search_dokument', result: documents });
        console.log(`  📊 Found ${documents.length} recent pipeline documents`);
      }

    }

    // ── Fetch strategic legislative pipeline data (always, before early-return) ─
    // These fetches run unconditionally so that betankanden/propositioner/motioner
    // data can drive the Strategic Outlook / Pipeline / Trends sections even when
    // calendar events and document fallbacks both return empty results.
    console.log('  🔄 Fetching legislative pipeline (betankanden, propositioner, motioner)...');
    const [committeeReports, propositionDocs, motionDocs] = await Promise.all([
      Promise.resolve()
        .then(() => client.fetchCommitteeReports(20, currentRiksmote) as Promise<unknown[]>)
        .catch((err: unknown) => { console.warn('Non-fatal: failed to fetch committee reports, continuing with empty list:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchPropositions(15, currentRiksmote) as Promise<unknown[]>)
        .catch((err: unknown) => { console.warn('Non-fatal: failed to fetch propositions, continuing with empty list:', err); return [] as unknown[]; }),
      Promise.resolve()
        .then(() => client.fetchMotions(50, currentRiksmote) as Promise<unknown[]>)
        .catch((err: unknown) => { console.warn('Non-fatal: failed to fetch motions, continuing with empty list:', err); return [] as unknown[]; }),
    ]);

    mcpCalls.push({ tool: 'get_betankanden', result: committeeReports });
    mcpCalls.push({ tool: 'get_propositioner', result: propositionDocs });
    mcpCalls.push({ tool: 'get_motioner', result: motionDocs });

    console.log(
      `  📊 Pipeline: ${committeeReports.length} reports, ` +
      `${propositionDocs.length} propositions, ${motionDocs.length} motions`
    );

    // Only skip generation when all data sources (calendar, docs, and pipeline) are empty
    if (events.length === 0 && documents.length === 0 &&
        committeeReports.length === 0 && propositionDocs.length === 0 && motionDocs.length === 0) {
      console.log('  ℹ️ No data from any source, skipping');
      return { success: true, files: 0, mcpCalls };
    }

    const slug = `${formatDateForSlug(today)}-month-ahead`;
    const articles: GeneratedArticle[] = [];

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const dataForContent = events.length > 0
        ? {
            events,
            reports: committeeReports as RawDocument[],
            propositions: propositionDocs as RawDocument[],
            motions: motionDocs as RawDocument[],
          }
        : {
            events: [],
            documents,
            reports: committeeReports as RawDocument[],
            propositions: propositionDocs as RawDocument[],
            motions: motionDocs as RawDocument[],
          };

      const content: string = generateArticleContent(dataForContent, 'month-ahead', lang);
      const watchPoints = extractWatchPoints(dataForContent, lang);
      const metadata = generateMetadata(dataForContent, 'month-ahead', lang);
      const readTime: string = calculateReadTime(content);
      const usedTools = events.length > 0
        ? ['get_calendar_events', 'get_betankanden', 'get_propositioner', 'get_motioner']
        : ['get_calendar_events', 'search_dokument', 'get_betankanden', 'get_propositioner', 'get_motioner'];
      const sources: string[] = generateSources(usedTools);

      const itemCount = events.length > 0 ? events.length : documents.length;
      const titles: TitleSet = getTitles(lang, itemCount);

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
        event: events.length > 0
          ? `${events.length} events over ${daysAhead} days`
          : `${documents.length} upcoming documents`,
        sources: events.length > 0
          ? ['calendar_events', 'betankanden', 'propositioner', 'motioner']
          : ['calendar_events', 'search_dokument', 'betankanden', 'propositioner', 'motioner'],
      },
    };
  } catch (error: unknown) {
    console.error('❌ Error generating Month-Ahead:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      mcpCalls,
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
  const hasLegislativePipeline = checkLegislativePipeline(article);

  return {
    hasCalendarEvents,
    hasMinimumSources,
    hasForwardLookingTone,
    hasStrategicContext,
    hasLegislativePipeline,
    passed: hasCalendarEvents && hasMinimumSources && hasForwardLookingTone && hasStrategicContext && hasLegislativePipeline
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

function checkLegislativePipeline(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  // Match on specific <h2> section headings inserted by generateMonthAheadContent —
  // these only appear when the pipeline sections were actually generated, avoiding
  // false positives from generic words that can appear in ordinary calendar text.
  const pipelineSectionMarkers = [
    // English
    'strategic legislative outlook',
    'committee pipeline',
    'policy trends',
    // Swedish
    'strategisk lagstiftningsutsikt',
    'utskottspipeline',
    'politiska trender',
    // German
    'strategischer gesetzgebungsausblick',
    'ausschusspipeline',
    'politische trends',
    // French
    'perspectives législatives stratégiques',
    'pipeline des commissions',
    'tendances politiques',
    // Spanish
    'perspectiva legislativa estratégica',
    'proceso en comité',
    'tendencias políticas',
    // Danish
    'strategisk lovgivningsmæssigt udsyn',
    'udvalgspipeline',
    'politiske tendenser',
    // Norwegian
    'strategisk lovgivningsmessig utsikt',
    'komitépipeline',
    'politiske trender',
    // Finnish
    'strateginen lainsäädäntönäkymä',
    'valiokuntaputkisto',
    'poliittiset trendit',
    // Dutch
    'strategisch wetgevingsoverzicht',
    'commissiepijplijn',
    'politieke trends',
    // Japanese
    '戦略的立法見通し',
    '委員会パイプライン',
    '政策トレンド',
    // Korean
    '전략적 입법 전망',
    '위원회 파이프라인',
    '정책 트렌드',
    // Chinese
    '战略立法展望',
    '委员会审议流程',
    '政策趋势',
    // Arabic
    'التوقعات التشريعية الاستراتيجية',
    'مسار اللجان',
    'الاتجاهات السياسية',
    // Hebrew
    'תחזית חקיקתית אסטרטגית',
    'צינור הוועדות',
    'מגמות מדיניות',
  ];
  const content = (article.content as string).toLowerCase();
  return pipelineSectionMarkers.some(marker => content.includes(marker));
}
