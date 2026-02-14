/**
 * Breaking News Article Generation Module
 * 
 * Generates event-driven coverage of significant developments
 * Uses riksdag-regering-mcp tools: voteringar, voting_group, anforanden, ledamoter
 */

import { MCPClient } from '../mcp-client.js';
import {
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources
} from '../data-transformers.js';
import { generateArticleHTML } from '../article-template.js';

/**
 * Required MCP tools for breaking news articles
 */
export const REQUIRED_TOOLS = [
  'search_voteringar',
  'get_voting_group',
  'search_anforanden',
  'search_ledamoter'
];

/**
 * Format date for article slug
 */
export function formatDateForSlug(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate Breaking News article
 * 
 * @param {Object} options - Generation options
 * @param {string[]} options.languages - Languages to generate
 * @param {string} options.eventContext - Context about the breaking event
 * @param {Object} options.eventData - Event data (votes, speeches, etc.)
 * @param {Function} options.writeArticle - Function to write article to file
 */
export async function generateBreakingNews(options = {}) {
  const {
    languages = ['en', 'sv'],
    eventContext = 'Breaking parliamentary development',
    eventData = null,
    writeArticle = null
  } = options;
  
  console.log('⚡ Generating Breaking News article...');
  
  const mcpCalls = [];
  
  try {
    const client = new MCPClient();
    
    // If no event data provided, this is a placeholder
    if (!eventData) {
      console.log('  ⚠️ No event data provided - breaking news requires manual trigger with context');
      return {
        success: false,
        error: 'Breaking news requires event context and data',
        mcpCalls
      };
    }
    
    // Example: Fetch related votes if event involves a vote
    if (eventData.voteId) {
      console.log('  🔄 Fetching voting details...');
      const votes = await client.searchVoteringar({ punkt: eventData.voteId });
      mcpCalls.push({ tool: 'search_voteringar', result: votes });
    }
    
    // Example: Fetch related speeches
    if (eventData.topic) {
      console.log('  🔄 Fetching related speeches...');
      const speeches = await client.searchAnforanden({ text: eventData.topic });
      mcpCalls.push({ tool: 'search_anforanden', result: speeches });
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-breaking-${eventData.slug || 'news'}`;
    const articles = [];
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent(
        { breaking: eventData, context: eventContext },
        'breaking',
        lang
      );
      const watchPoints = extractWatchPoints({ breaking: eventData }, lang);
      const metadata = generateMetadata({ breaking: eventData }, 'breaking', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(mcpCalls.map(call => call.tool));
      
      const titles = getTitles(lang, eventContext);
      
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0],
        type: 'breaking',
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
        event: eventContext,
        sources: mcpCalls.map(call => call.tool)
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating Breaking News:', error.message);
    return {
      success: false,
      error: error.message,
      mcpCalls
    };
  }
}

function getTitles(lang, eventContext) {
  const titles = {
    en: {
      title: `Breaking: ${eventContext}`,
      subtitle: `Live coverage of major parliamentary development`
    },
    sv: {
      title: `Senaste nytt: ${eventContext}`,
      subtitle: `Direktrapportering från riksdagen`
    },
    da: {
      title: `Seneste nyt: ${eventContext}`,
      subtitle: `Direkte dækning af parlamentarisk udvikling`
    },
    no: {
      title: `Siste nytt: ${eventContext}`,
      subtitle: `Direkte dekning av parlamentarisk utvikling`
    },
    fi: {
      title: `Viimeisimmät uutiset: ${eventContext}`,
      subtitle: `Suora raportointi parlamentaarisesta kehityksestä`
    },
    de: {
      title: `Eilmeldung: ${eventContext}`,
      subtitle: `Live-Berichterstattung über parlamentarische Entwicklung`
    },
    fr: {
      title: `Dernière minute: ${eventContext}`,
      subtitle: `Couverture en direct du développement parlementaire`
    },
    es: {
      title: `Última hora: ${eventContext}`,
      subtitle: `Cobertura en vivo del desarrollo parlamentario`
    },
    nl: {
      title: `Laatste nieuws: ${eventContext}`,
      subtitle: `Live verslag van parlementaire ontwikkeling`
    },
    ar: {
      title: `عاجل: ${eventContext}`,
      subtitle: `تغطية مباشرة للتطورات البرلمانية`
    },
    he: {
      title: `חדשות אחרונות: ${eventContext}`,
      subtitle: `סיקור חי של התפתחות פרלמנטרית`
    },
    ja: {
      title: `速報：${eventContext}`,
      subtitle: `議会の重要な展開のライブカバレッジ`
    },
    ko: {
      title: `속보: ${eventContext}`,
      subtitle: `의회 주요 발전 실시간 보도`
    },
    zh: {
      title: `快讯：${eventContext}`,
      subtitle: `议会重大发展实时报道`
    }
  };
  
  return titles[lang] || titles.en;
}

export function validateBreakingNews(article) {
  return {
    hasBreakingEvent: checkBreakingEvent(article),
    hasMinimumSources: countSources(article) >= 3,
    hasTimeliness: checkTimeliness(article),
    hasImpactAnalysis: checkImpactAnalysis(article),
    passed: false
  };
}

function checkBreakingEvent(article) {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('breaking') ||
         article.content.toLowerCase().includes('development');
}

function countSources(article) {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkTimeliness(article) {
  if (!article || !article.content) return false;
  const timeKeywords = ['today', 'just now', 'breaking', 'latest'];
  return timeKeywords.some(keyword =>
    article.content.toLowerCase().includes(keyword)
  );
}

function checkImpactAnalysis(article) {
  if (!article || !article.content) return false;
  const impactKeywords = ['impact', 'significance', 'implications', 'consequences'];
  return impactKeywords.some(keyword =>
    article.content.toLowerCase().includes(keyword)
  );
}
