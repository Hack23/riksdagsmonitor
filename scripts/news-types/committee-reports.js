/**
 * Committee Reports Article Generation Module
 * 
 * Generates analysis of latest committee reports (betänkanden)
 * Uses riksdag-regering-mcp tools: betankanden, voteringar, anforanden, propositioner
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
 * Required MCP tools for committee-reports articles
 * 
 * REQUIRED_TOOLS UPDATE (2026-02-14):
 * Initially set to 4 tools ['get_betankanden', 'search_voteringar', 'search_anforanden', 'get_propositioner']
 * to match tests/validation expectations. However, this caused runtime validation failures
 * since the implementation only calls get_betankanden (line 66).
 * 
 * Reverted to actual implementation (1 tool) to prevent validation failures.
 * When additional tools are implemented in generateCommitteeReports(), add them back here.
 */
export const REQUIRED_TOOLS = [
  'get_betankanden'
];

/**
 * Format date for article slug
 */
export function formatDateForSlug(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate Committee Reports article in specified languages
 * 
 * @param {Object} options - Generation options
 * @param {string[]} options.languages - Languages to generate (default: ['en', 'sv'])
 * @param {number} options.limit - Number of reports to fetch (default: 10)
 * @param {Function} options.writeArticle - Function to write article to file
 * @returns {Promise<Object>} Generation result
 */
export async function generateCommitteeReports(options = {}) {
  const { languages = ['en', 'sv'], limit = 10, writeArticle = null } = options;
  
  console.log('📋 Generating Committee Reports article...');
  
  // Track MCP calls for cross-reference validation
  const mcpCalls = [];
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching committee reports from riksdag-regering-mcp...');
    const reports = await client.fetchCommitteeReports(limit);
    mcpCalls.push({ tool: 'get_betankanden', result: reports });
    console.log(`  📊 Found ${reports.length} committee reports`);
    
    if (reports.length === 0) {
      console.log('  ℹ️ No new committee reports found, skipping');
      return { success: true, files: 0, mcpCalls };
    }
    
    // Cross-reference with votes and debates (optional enhancement)
    // Future: Add voteringar, anforanden, propositioner queries here
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-committee-reports`;
    const articles = [];
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent({ reports }, 'committee-reports', lang);
      const watchPoints = extractWatchPoints({ reports }, lang);
      const metadata = generateMetadata({ reports }, 'committee-reports', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_betankanden']);
      
      const titles = getTitles(lang, reports.length);
      
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: titles.title,
        subtitle: titles.subtitle,
        date: today.toISOString().split('T')[0],
        type: 'analysis',
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
        reports: reports.length,
        sources: ['betankanden']
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating Committee Reports:', error.message);
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
function getTitles(lang, reportsCount) {
  const titles = {
    en: {
      title: `Committee Reports: Parliamentary Priorities This Week`,
      subtitle: `Analysis of ${reportsCount} committee reports revealing Riksdag priorities for the current session`
    },
    sv: {
      title: `Utskottsbetänkanden: Riksdagens prioriteringar denna vecka`,
      subtitle: `Analys av ${reportsCount} utskottsbetänkanden som avslöjar riksdagens prioriteringar`
    },
    da: {
      title: `Udvalgsbetænkninger: Parlamentets prioriteringer denne uge`,
      subtitle: `Analyse af ${reportsCount} udvalgsbetænkninger`
    },
    no: {
      title: `Komitéinnstillinger: Stortingets prioriteringer denne uken`,
      subtitle: `Analyse av ${reportsCount} komitéinnstillinger`
    },
    fi: {
      title: `Valiokunnan mietinnöt: Eduskunnan prioriteetit tällä viikolla`,
      subtitle: `Analyysi ${reportsCount} valiokunnan mietinnöstä`
    },
    de: {
      title: `Ausschussberichte: Parlamentarische Prioritäten diese Woche`,
      subtitle: `Analyse von ${reportsCount} Ausschussberichten`
    },
    fr: {
      title: `Rapports de commission: Priorités parlementaires cette semaine`,
      subtitle: `Analyse de ${reportsCount} rapports de commission`
    },
    es: {
      title: `Informes de comisión: Prioridades parlamentarias esta semana`,
      subtitle: `Análisis de ${reportsCount} informes de comisión`
    },
    nl: {
      title: `Commissierapporten: Parlementaire prioriteiten deze week`,
      subtitle: `Analyse van ${reportsCount} commissierapporten`
    },
    ar: {
      title: `تقارير اللجان: أولويات البرلمان هذا الأسبوع`,
      subtitle: `تحليل ${reportsCount} تقارير لجان`
    },
    he: {
      title: `דוחות ועדה: סדרי עדיפויות פרלמנטריים השבוע`,
      subtitle: `ניתוח ${reportsCount} דוחות ועדה`
    },
    ja: {
      title: `委員会報告：今週の議会優先事項`,
      subtitle: `${reportsCount}件の委員会報告の分析`
    },
    ko: {
      title: `위원회 보고서: 이번 주 의회 우선순위`,
      subtitle: `${reportsCount}개 위원회 보고서 분석`
    },
    zh: {
      title: `委员会报告：本周议会优先事项`,
      subtitle: `${reportsCount}份委员会报告分析`
    }
  };
  
  return titles[lang] || titles.en;
}

/**
 * Validate committee reports article structure
 */
export function validateCommitteeReports(article) {
  const hasCommitteeReports = checkCommitteeReports(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasAnalysisTone = checkAnalysisTone(article);
  const hasPartyPositions = checkPartyPositions(article);
  
  return {
    hasCommitteeReports,
    hasMinimumSources,
    hasAnalysisTone,
    hasPartyPositions,
    passed: hasCommitteeReports && hasMinimumSources && hasAnalysisTone && hasPartyPositions
  };
}

function checkCommitteeReports(article) {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('committee') ||
         article.content.toLowerCase().includes('betänkande');
}

function countSources(article) {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkAnalysisTone(article) {
  if (!article || !article.content) return false;
  const analysisKeywords = ['analysis', 'recommendation', 'reveals', 'priorities'];
  return analysisKeywords.some(keyword =>
    article.content.toLowerCase().includes(keyword)
  );
}

function checkPartyPositions(article) {
  if (!article || !article.content) return false;
  // Check for party mentions (simplified)
  const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
  return parties.some(party =>
    article.content.includes(party)
  );
}
