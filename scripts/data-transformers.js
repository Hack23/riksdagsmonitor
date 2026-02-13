#!/usr/bin/env node

/**
 * Data Transformers for News Article Generation
 * 
 * Transforms MCP server responses into structured article content.
 * Handles calendar events, documents, debates, and more.
 * 
 * Usage:
 *   import { transformCalendarToEventGrid, generateArticleContent } from './data-transformers.js';
 */

/**
 * Transform calendar events into event grid structure for template
 * 
 * @param {Array} events - Calendar events from MCP server
 * @param {string} lang - Language code (en, sv)
 * @returns {Array} Event grid structure for article template
 */
export function transformCalendarToEventGrid(events, lang = 'en') {
  if (!events || events.length === 0) return [];
  
  // Group events by date
  const eventsByDate = {};
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
    eventsByDate[dateStr].push(event);
  });
  
  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();
  
  // Convert to grid format
  const eventGrid = sortedDates.map(date => {
    const dateObj = new Date(date);
    const isTodayFlag = isTodayDate(dateObj);
    
    return {
      date: date,
      dayName: formatDayName(dateObj, lang),
      dayNumber: dateObj.getDate().toString(),
      dayLabel: formatDayLabel(dateObj, lang),
      isToday: isTodayFlag,
      items: eventsByDate[date].map(event => ({
        time: event.tid || event.time || 'Expected',
        title: event.rubrik || event.titel || event.title || 'Event'
      }))
    };
  });
  
  return eventGrid;
}

/**
 * Check if date is today
 */
function isTodayDate(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Map of custom locale codes to Intl-compatible locale strings
 */
const LOCALE_MAP = {
  en: 'en-GB', sv: 'sv-SE', da: 'da-DK', no: 'nb-NO', fi: 'fi-FI',
  de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', ar: 'ar-SA',
  he: 'he-IL', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN'
};

/**
 * Format day name (Monday, Tuesday, etc.) using Intl for all 14 languages
 */
function formatDayName(date, lang = 'en') {
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
function formatDayLabel(date, lang = 'en') {
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
 * Extract key topics from documents
 * 
 * @param {Array} documents - Documents from MCP server
 * @returns {Array} Topic tags
 */
export function extractTopics(documents) {
  const topics = new Set();
  
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
 * 
 * @param {Object} data - MCP data (events, documents, etc.)
 * @param {string} type - Article type (week-ahead, committee-reports, etc.)
 * @param {string} lang - Language code
 * @returns {string} Article HTML content
 */
export function generateArticleContent(data, type, lang = 'en') {
  switch (type) {
    case 'week-ahead':
      return generateWeekAheadContent(data, lang);
    case 'committee-reports':
      return generateCommitteeContent(data, lang);
    case 'propositions':
      return generatePropositionsContent(data, lang);
    case 'motions':
      return generateMotionsContent(data, lang);
    default:
      return generateGenericContent(data, lang);
  }
}

/**
 * Generate Week Ahead article content
 */
function generateWeekAheadContent(data, lang) {
  const { events, highlights, context } = data;
  
  let content = '';
  
  // Introduction section
  if (lang === 'en') {
    content += `
    <div class="context-box">
      <h3>Why This Week Matters</h3>
      <p>${context || 'This week features significant parliamentary activity with key debates, committee meetings, and government consultations that will shape Sweden\'s political landscape.'}</p>
    </div>
`;
  } else {
    content += `
    <div class="context-box">
      <h3>Varför denna vecka är viktig</h3>
      <p>${context || 'Denna vecka innehåller betydande parlamentarisk aktivitet med viktiga debatter, kommittémöten och regeringskonsultationer som kommer att forma Sveriges politiska landskap.'}</p>
    </div>
`;
  }
  
  // Group events by significance
  const highPriority = events.filter(e => isHighPriority(e));
  
  if (highPriority.length > 0) {
    content += lang === 'en' 
      ? '\n    <h2>Key Events This Week</h2>\n' 
      : '\n    <h2>Nyckel händelser denna vecka</h2>\n';
    
    highPriority.forEach(event => {
      // Derive dayName from event date if not present
      const dayName = event.dayName || (event.datum || event.from || event.start ? formatDayName(new Date(event.datum || event.from || event.start), lang) : '');
      const eventTime = event.time || event.tid || 'Expected';
      const eventTitle = event.title || event.titel || 'Event';
      
      content += `
    <h3>${dayName ? dayName + ' - ' : ''}${eventTitle}</h3>
    <p>${event.description || `${eventTime}: ${event.details || 'Parliamentary session scheduled.'}`}</p>
`;
    });
  }
  
  // Additional context
  if (highlights && highlights.length > 0) {
    content += lang === 'en' 
      ? '\n    <h2>What to Watch</h2>\n    <ul>\n' 
      : '\n    <h2>Vad man ska följa</h2>\n    <ul>\n';
    
    highlights.forEach(highlight => {
      content += `      <li><strong>${highlight.title}:</strong> ${highlight.description}</li>\n`;
    });
    
    content += '    </ul>\n';
  }
  
  return content;
}

/**
 * Determine if event is high priority
 */
function isHighPriority(event) {
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
 * Generate Committee Reports content
 */
function generateCommitteeContent(data, lang) {
  const reports = data.reports || [];
  
  let content = lang === 'en'
    ? '<h2>Latest Committee Reports</h2>\n'
    : '<h2>Senaste kommittérapporter</h2>\n';
  
  if (reports.length === 0) {
    content += lang === 'en'
      ? '<p>No committee reports available at this time.</p>\n'
      : '<p>Inga kommittérapporter tillgängliga för tillfället.</p>\n';
    return content;
  }
  
  reports.forEach(report => {
    content += `
    <h3>${report.titel || report.title}</h3>
    <p><strong>${lang === 'en' ? 'Committee' : 'Kommitté'}:</strong> ${report.organ}</p>
    <p><strong>${lang === 'en' ? 'Document' : 'Dokument'}:</strong> <a href="${report.url}" class="document-link" rel="noopener noreferrer">${report.dokumentnamn}</a></p>
    <p>${report.summary || (lang === 'en' ? 'Committee report on parliamentary matter.' : 'Kommittérapport om riksdagsärende.')}</p>
`;
  });
  
  return content;
}

/**
 * Generate Propositions content
 */
function generatePropositionsContent(data, lang) {
  const propositions = data.propositions || [];
  
  let content = lang === 'en'
    ? '<h2>Government Propositions</h2>\n'
    : '<h2>Regeringens propositioner</h2>\n';
  
  if (propositions.length === 0) {
    content += lang === 'en'
      ? '<p>No government propositions available at this time.</p>\n'
      : '<p>Inga regeringspropositioner tillgängliga för tillfället.</p>\n';
    return content;
  }
  
  propositions.forEach(prop => {
    content += `
    <h3>${prop.titel || prop.title}</h3>
    <p><strong>${lang === 'en' ? 'Document' : 'Dokument'}:</strong> <a href="${prop.url}" class="document-link" rel="noopener noreferrer">${prop.dokumentnamn}</a></p>
    <p>${prop.summary || (lang === 'en' ? 'Government proposal to Parliament.' : 'Regeringens förslag till riksdagen.')}</p>
`;
  });
  
  return content;
}

/**
 * Generate Motions content
 */
function generateMotionsContent(data, lang) {
  const motions = data.motions || [];
  
  let content = lang === 'en'
    ? '<h2>Opposition Motions</h2>\n'
    : '<h2>Oppositionens motioner</h2>\n';
  
  if (motions.length === 0) {
    content += lang === 'en'
      ? '<p>No opposition motions available at this time.</p>\n'
      : '<p>Inga oppositionsmotioner tillgängliga för tillfället.</p>\n';
    return content;
  }
  
  motions.forEach(motion => {
    content += `
    <h3>${motion.titel || motion.title}</h3>
    <p><strong>${lang === 'en' ? 'Author' : 'Författare'}:</strong> ${motion.intressent_namn || motion.author}</p>
    <p><strong>${lang === 'en' ? 'Party' : 'Parti'}:</strong> ${motion.parti}</p>
    <p><strong>${lang === 'en' ? 'Document' : 'Dokument'}:</strong> <a href="${motion.url}" class="document-link" rel="noopener noreferrer">${motion.dokumentnamn}</a></p>
    <p>${motion.summary || (lang === 'en' ? 'Parliamentary motion by opposition member.' : 'Riksdagsmotion av oppositionsmedlem.')}</p>
`;
  });
  
  return content;
}

/**
 * Generate generic content
 */
function generateGenericContent(data, lang) {
  return lang === 'en'
    ? '<p>Content generation in progress.</p>'
    : '<p>Innehållsgenerering pågår.</p>';
}

/**
 * Extract "Watch Points" from data
 * 
 * @param {Object} data - MCP data
 * @param {string} lang - Language code
 * @returns {Array} Watch points for article
 */
export function extractWatchPoints(data, lang = 'en') {
  const watchPoints = [];
  
  // From calendar events
  if (data.events) {
    const highPriorityEvents = data.events.filter(isHighPriority);
    highPriorityEvents.forEach(event => {
      // Derive dayName from event date if not present
      const dayName = event.dayName || (event.datum || event.from || event.start ? formatDayName(new Date((event.datum || event.from || event.start).split('T')[0]), lang) : '');
      const eventTitle = event.title || event.titel || 'Event';
      
      watchPoints.push({
        title: dayName ? `${dayName}: ${eventTitle}` : eventTitle,
        description: event.description || (lang === 'en' 
          ? 'Monitor developments and outcomes'
          : 'Övervaka utveckling och resultat')
      });
    });
  }
  
  // From committee reports
  if (data.reports && data.reports.length > 0) {
    watchPoints.push({
      title: lang === 'en' ? 'Committee Debates' : 'Kommittédebatter',
      description: lang === 'en'
        ? `${data.reports.length} committee reports scheduled for chamber debate`
        : `${data.reports.length} kommittérapporter planerade för kammarens debatt`
    });
  }
  
  // From propositions
  if (data.propositions && data.propositions.length > 0) {
    watchPoints.push({
      title: lang === 'en' ? 'Government Proposals' : 'Regeringsförslag',
      description: lang === 'en'
        ? `${data.propositions.length} new government propositions under review`
        : `${data.propositions.length} nya regeringspropositioner under granskning`
    });
  }
  
  return watchPoints.slice(0, 5); // Max 5 watch points
}

/**
 * Generate article metadata
 * 
 * @param {Object} data - Article data
 * @param {string} type - Article type
 * @param {string} lang - Language code
 * @returns {Object} Article metadata
 */
export function generateMetadata(data, type, lang = 'en') {
  const keywords = [];
  const topics = [];
  const tags = [];
  
  // Add type-specific keywords
  switch (type) {
    case 'week-ahead':
      keywords.push('parliament', 'week ahead', 'calendar', 'events');
      topics.push('parliament');
      tags.push(lang === 'en' ? 'Week Ahead' : 'Veckan som kommer');
      break;
    case 'committee-reports':
      keywords.push('committee', 'reports', 'betänkanden', 'parliament');
      topics.push('committees', 'reports');
      tags.push(lang === 'en' ? 'Committee Reports' : 'Kommittérapporter');
      break;
    case 'propositions':
      keywords.push('government', 'propositions', 'parliament', 'legislation');
      topics.push('government', 'legislation');
      tags.push(lang === 'en' ? 'Government Propositions' : 'Regeringens propositioner');
      break;
    case 'motions':
      keywords.push('motions', 'opposition', 'parliament', 'proposals');
      topics.push('parliament', 'opposition');
      tags.push(lang === 'en' ? 'Opposition Motions' : 'Oppositionens motioner');
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
 * 
 * @param {string} content - Article HTML content
 * @returns {string} Read time (e.g., "5 min read")
 */
export function calculateReadTime(content) {
  // Remove HTML tags for word count
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  
  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200);
  
  return `${minutes} min read`;
}

/**
 * Generate article sources list
 * 
 * @param {Array} tools - MCP tools used
 * @returns {Array} Sources list
 */
export function generateSources(tools = []) {
  const sources = ['riksdag-regering-mcp'];
  
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
  
  return sources;
}

export default {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  extractTopics,
  generateMetadata,
  calculateReadTime,
  generateSources
};
