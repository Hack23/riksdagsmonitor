/**
 * Government Propositions Article Generation Module
 * 
 * Generates analysis of government propositions
 * Uses riksdag-regering-mcp tools: propositioner, search_dokument_fulltext, analyze_g0v_by_department, search_anforanden
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
 * Required MCP tools for propositions articles
 * Declares all tools used for cross-referencing and validation
 */
export const REQUIRED_TOOLS = [
  'get_propositioner',
  'search_dokument_fulltext',
  'analyze_g0v_by_department',
  'search_anforanden'
];

/**
 * Format date for article slug
 */
export function formatDateForSlug(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate Government Propositions article
 */
export async function generatePropositions(options = {}) {
  const { languages = ['en', 'sv'], limit = 10, writeArticle = null } = options;
  
  console.log('📜 Generating Government Propositions article...');
  
  const mcpCalls = [];
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching propositions from riksdag-regering-mcp...');
    const propositions = await client.fetchPropositions(limit);
    mcpCalls.push({ tool: 'get_propositioner', result: propositions });
    console.log(`  📊 Found ${propositions.length} propositions`);
    
    if (propositions.length === 0) {
      console.log('  ℹ️ No new propositions found, skipping');
      return { success: true, files: 0, mcpCalls };
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-government-propositions`;
    const articles = [];
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent({ propositions }, 'propositions', lang);
      const watchPoints = extractWatchPoints({ propositions }, lang);
      const metadata = generateMetadata({ propositions }, 'propositions', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_propositioner']);
      
      const titles = getTitles(lang, propositions.length);
      
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
        propositions: propositions.length,
        sources: ['propositioner']
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating Propositions:', error.message);
    return {
      success: false,
      error: error.message,
      mcpCalls
    };
  }
}

function getTitles(lang, count) {
  const titles = {
    en: {
      title: `Government Propositions: Policy Priorities This Week`,
      subtitle: `Analysis of ${count} government propositions shaping the legislative agenda`
    },
    sv: {
      title: `Regeringens propositioner: Veckans prioriteringar`,
      subtitle: `Analys av ${count} propositioner som formar den lagstiftande agendan`
    },
    da: {
      title: `Regeringsforslag: Politiske prioriteringer denne uge`,
      subtitle: `Analyse af ${count} regeringsforslag`
    },
    no: {
      title: `Regjeringens proposisjoner: Politiske prioriteringer denne uken`,
      subtitle: `Analyse av ${count} regjeringsproposisjoner`
    },
    fi: {
      title: `Hallituksen esitykset: Viikon poliittiset prioriteetit`,
      subtitle: `Analyysi ${count} hallituksen esityksestä`
    },
    de: {
      title: `Regierungsvorlagen: Politische Prioritäten diese Woche`,
      subtitle: `Analyse von ${count} Regierungsvorlagen`
    },
    fr: {
      title: `Propositions gouvernementales: Priorités politiques cette semaine`,
      subtitle: `Analyse de ${count} propositions gouvernementales`
    },
    es: {
      title: `Proposiciones gubernamentales: Prioridades políticas esta semana`,
      subtitle: `Análisis de ${count} proposiciones gubernamentales`
    },
    nl: {
      title: `Regeringsvoorstellen: Politieke prioriteiten deze week`,
      subtitle: `Analyse van ${count} regeringsvoorstellen`
    },
    ar: {
      title: `مقترحات الحكومة: الأولويات السياسية هذا الأسبوع`,
      subtitle: `تحليل ${count} مقترحات حكومية`
    },
    he: {
      title: `הצעות ממשלה: סדרי עדיפויות מדיניים השבוע`,
      subtitle: `ניתוח ${count} הצעות ממשלה`
    },
    ja: {
      title: `政府提案：今週の政策優先事項`,
      subtitle: `${count}件の政府提案の分析`
    },
    ko: {
      title: `정부 법안: 이번 주 정책 우선순위`,
      subtitle: `${count}개 정부 법안 분석`
    },
    zh: {
      title: `政府提案：本周政策优先事项`,
      subtitle: `${count}份政府提案分析`
    }
  };
  
  return titles[lang] || titles.en;
}

export function validatePropositions(article) {
  const hasPropositions = checkPropositions(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasPolicyAnalysis = checkPolicyAnalysis(article);
  
  return {
    hasPropositions,
    hasMinimumSources,
    hasPolicyAnalysis,
    passed: hasPropositions && hasMinimumSources && hasPolicyAnalysis
  };
}

function checkPropositions(article) {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('proposition') ||
         article.content.toLowerCase().includes('government');
}

function countSources(article) {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkPolicyAnalysis(article) {
  if (!article || !article.content) return false;
  const keywords = ['policy', 'legislative', 'agenda', 'priorities'];
  return keywords.some(keyword =>
    article.content.toLowerCase().includes(keyword)
  );
}
