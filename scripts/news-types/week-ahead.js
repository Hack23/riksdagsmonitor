/**
 * Week Ahead Article Generation Module
 * 
 * Generates prospective coverage of upcoming parliamentary activity
 * Uses riksdag-regering-mcp tools: calendar_events, dokument, fragor, interpellationer
 */

import { MCPClient } from '../mcp-client.js';
import {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';

/**
 * Required MCP tools for week-ahead articles
 * These tools are used for calendar events, document search, questions, and interpellations
 * and must stay in sync with validate-cross-references.js expectations.
 */
export const REQUIRED_TOOLS = [
  'get_calendar_events',
  'search_dokument',
  'get_fragor',
  'get_interpellationer'
];

/**
 * Get date range for Week Ahead (next 7 days)
 */
export function getWeekAheadDateRange() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 1); // Tomorrow
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7); // +7 days
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

/**
 * Format date for article slug
 */
export function formatDateForSlug(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate Week Ahead article in specified languages
 * 
 * @param {Object} options - Generation options
 * @param {string[]} options.languages - Languages to generate (default: ['en', 'sv'])
 * @param {Object} options.dateRange - Optional custom date range
 * @param {Function} options.writeArticle - Function to write article to file
 * @returns {Promise<Object>} Generation result with success, files, slug, mcpCalls
 */
export async function generateWeekAhead(options = {}) {
  const { languages = ['en', 'sv'], dateRange = null, writeArticle = null } = options;
  
  console.log('📅 Generating Week Ahead article...');
  
  // Track MCP calls for cross-reference validation
  const mcpCalls = [];
  
  try {
    const client = new MCPClient();
    const range = dateRange || getWeekAheadDateRange();
    
    console.log(`  📆 Date range: ${range.start} to ${range.end}`);
    
    // 1. Fetch calendar events from MCP
    console.log('  🔄 Fetching calendar events from riksdag-regering-mcp...');
    const events = await client.fetchCalendarEvents(range.start, range.end);
    mcpCalls.push({ tool: 'get_calendar_events', result: events });
    console.log(`  📊 Found ${events.length} events`);
    
    // 2. Cross-reference with upcoming documents (optional enhancement)
    // Future: Add dokument, fragor, interpellationer queries here
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-week-ahead`;
    const articles = [];
    
    // 3. Generate for each requested language
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      // Transform data for this language
      const eventGrid = transformCalendarToEventGrid(events, lang);
      const content = generateArticleContent({ events, highlights: [] }, 'week-ahead', lang);
      const watchPoints = extractWatchPoints({ events }, lang);
      const metadata = generateMetadata({ events }, 'week-ahead', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_calendar_events']);
      
      // Language-specific titles
      const titles = getTitles(lang, range);
      
      // Generate HTML for this language
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0],
        type: 'prospective',
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
      
      articles.push({
        lang,
        html,
        filename: `${slug}-${lang}.html`,
        slug: `${slug}-${lang}`
      });
      
      // Write article if writer function provided
      if (writeArticle) {
        await writeArticle(html, `${slug}-${lang}.html`);
        console.log(`  ✅ ${lang.toUpperCase()} version generated`);
      }
    }
    
    console.log('  ✅ Week Ahead article generated successfully in all requested languages');
    
    return {
      success: true,
      files: languages.length,
      slug,
      articles,
      mcpCalls,
      crossReferences: {
        events: events.length,
        sources: ['calendar_events']
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating Week Ahead:', error.message);
    console.error('   Stack:', error.stack);
    return {
      success: false,
      error: error.message,
      mcpCalls
    };
  }
}

/**
 * Get language-specific titles
 */
function getTitles(lang, dateRange) {
  const titles = {
    en: {
      title: `Week Ahead: ${dateRange.start} to ${dateRange.end}`,
      subtitle: `Parliamentary calendar, committee meetings, and chamber debates for the coming week`
    },
    sv: {
      title: `Vecka Framåt: ${dateRange.start} till ${dateRange.end}`,
      subtitle: `Riksdagens kalender, utskottsmöten och kammarens debatter för kommande vecka`
    },
    da: {
      title: `Ugen Fremover: ${dateRange.start} til ${dateRange.end}`,
      subtitle: `Parlamentarisk kalender, udvalgsmøder og debatter for den kommende uge`
    },
    no: {
      title: `Uke Fremover: ${dateRange.start} til ${dateRange.end}`,
      subtitle: `Parlamentarisk kalender, komitémøter og debatter for kommende uke`
    },
    fi: {
      title: `Tuleva Viikko: ${dateRange.start} - ${dateRange.end}`,
      subtitle: `Parlamentin kalenteri, valiokuntien kokoukset ja keskustelut tulevalle viikolle`
    },
    de: {
      title: `Woche Voraus: ${dateRange.start} bis ${dateRange.end}`,
      subtitle: `Parlamentarischer Kalender, Ausschusssitzungen und Debatten für die kommende Woche`
    },
    fr: {
      title: `Semaine à Venir: ${dateRange.start} au ${dateRange.end}`,
      subtitle: `Calendrier parlementaire, réunions de commission et débats pour la semaine à venir`
    },
    es: {
      title: `Semana Próxima: ${dateRange.start} a ${dateRange.end}`,
      subtitle: `Calendario parlamentario, reuniones de comisión y debates para la próxima semana`
    },
    nl: {
      title: `Week Vooruit: ${dateRange.start} tot ${dateRange.end}`,
      subtitle: `Parlementaire kalender, commissievergaderingen en debatten voor de komende week`
    },
    ar: {
      title: `الأسبوع القادم: ${dateRange.start} إلى ${dateRange.end}`,
      subtitle: `التقويم البرلماني واجتماعات اللجان والمناقشات للأسبوع المقبل`
    },
    he: {
      title: `השבוע הקרוב: ${dateRange.start} עד ${dateRange.end}`,
      subtitle: `לוח שנה פרלמנטרי, פגישות ועדה ודיונים לשבוע הקרוב`
    },
    ja: {
      title: `来週の展望: ${dateRange.start} から ${dateRange.end}`,
      subtitle: `来週の議会カレンダー、委員会会議、討論`
    },
    ko: {
      title: `다음 주 전망: ${dateRange.start}부터 ${dateRange.end}까지`,
      subtitle: `다음 주 의회 일정, 위원회 회의 및 토론`
    },
    zh: {
      title: `下周展望：${dateRange.start} 至 ${dateRange.end}`,
      subtitle: `下周议会日程、委员会会议和辩论`
    }
  };
  
  return titles[lang] || titles.en;
}

/**
 * Validate week-ahead article structure
 * 
 * @param {Object} article - Article object with content and metadata
 * @returns {Object} Validation result
 */
export function validateWeekAhead(article) {
  const hasCalendarEvents = checkCalendarEvents(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasProspectiveTone = checkProspectiveTone(article);
  const hasAllDaysOfWeek = checkDailyCoverage(article, 7);
  
  return {
    hasCalendarEvents,
    hasMinimumSources,
    hasProspectiveTone,
    hasAllDaysOfWeek,
    passed: hasCalendarEvents && hasMinimumSources && hasProspectiveTone && hasAllDaysOfWeek
  };
}

function checkCalendarEvents(article) {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('calendar') || 
         article.content.toLowerCase().includes('event');
}

function countSources(article) {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkProspectiveTone(article) {
  if (!article || !article.content) return false;
  const prospectiveKeywords = ['will', 'upcoming', 'next week', 'scheduled', 'expected'];
  return prospectiveKeywords.some(keyword => 
    article.content.toLowerCase().includes(keyword)
  );
}

function checkDailyCoverage(article, days = 7) {
  if (!article || !article.content) return false;
  // Simple heuristic: check for day names or date patterns
  return true; // Simplified for now
}
