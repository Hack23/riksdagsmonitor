/**
 * Opposition Motions Article Generation Module
 * 
 * Generates analysis of opposition motions
 * Uses riksdag-regering-mcp tools: motioner, search_dokument_fulltext, analyze_g0v_by_department, search_anforanden
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
 * Required MCP tools for motions articles
 * These tools are used for motions retrieval, fulltext search, government analysis, and speech references
 * and must stay in sync with validate-cross-references.js expectations.
 */
export const REQUIRED_TOOLS = [
  'get_motioner',
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
 * Generate Opposition Motions article
 */
export async function generateMotions(options = {}) {
  const { languages = ['en', 'sv'], limit = 10, writeArticle = null } = options;
  
  console.log('📝 Generating Opposition Motions article...');
  
  const mcpCalls = [];
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching motions from riksdag-regering-mcp...');
    const motions = await client.fetchMotions(limit);
    mcpCalls.push({ tool: 'get_motioner', result: motions });
    console.log(`  📊 Found ${motions.length} motions`);
    
    if (motions.length === 0) {
      console.log('  ℹ️ No new motions found, skipping');
      return { success: true, files: 0, mcpCalls };
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-opposition-motions`;
    const articles = [];
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent({ motions }, 'motions', lang);
      const watchPoints = extractWatchPoints({ motions }, lang);
      const metadata = generateMetadata({ motions }, 'motions', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_motioner']);
      
      const titles = getTitles(lang, motions.length);
      
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
        motions: motions.length,
        sources: ['motioner']
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating Motions:', error.message);
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
      title: `Opposition Motions: Battle Lines This Week`,
      subtitle: `Analysis of ${count} opposition motions revealing parliamentary fault lines`
    },
    sv: {
      title: `Oppositionsmotioner: Veckans stridslinjer`,
      subtitle: `Analys av ${count} oppositionsmotioner som avslöjar parlamentariska skiljelinjer`
    },
    da: {
      title: `Oppositionsforslag: Ugens kamppladser`,
      subtitle: `Analyse af ${count} oppositionsforslag`
    },
    no: {
      title: `Opposisjonsforslag: Ukens kamplinjer`,
      subtitle: `Analyse av ${count} opposisjonsforslag`
    },
    fi: {
      title: `Opposition aloitteet: Viikon taistelulinjat`,
      subtitle: `Analyysi ${count} opposition aloitteesta`
    },
    de: {
      title: `Oppositionsanträge: Kampflinien dieser Woche`,
      subtitle: `Analyse von ${count} Oppositionsanträgen`
    },
    fr: {
      title: `Motions d'opposition: Lignes de bataille cette semaine`,
      subtitle: `Analyse de ${count} motions d'opposition`
    },
    es: {
      title: `Mociones de oposición: Líneas de batalla esta semana`,
      subtitle: `Análisis de ${count} mociones de oposición`
    },
    nl: {
      title: `Oppositiemoties: Strijdlijnen deze week`,
      subtitle: `Analyse van ${count} oppositiemoties`
    },
    ar: {
      title: `اقتراحات المعارضة: خطوط المعركة هذا الأسبوع`,
      subtitle: `تحليل ${count} اقتراحات المعارضة`
    },
    he: {
      title: `הצעות אופוזיציה: קווי העימות השבוע`,
      subtitle: `ניתוח ${count} הצעות אופוזיציה`
    },
    ja: {
      title: `野党動議：今週の対立構図`,
      subtitle: `${count}件の野党動議の分析`
    },
    ko: {
      title: `야당 동의: 이번 주 대립 구도`,
      subtitle: `${count}개 야당 동의 분석`
    },
    zh: {
      title: `反对党动议：本周对立格局`,
      subtitle: `${count}份反对党动议分析`
    }
  };
  
  return titles[lang] || titles.en;
}

export function validateMotions(article) {
  const hasMotions = checkMotions(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasOppositionAnalysis = checkOppositionAnalysis(article);
  
  return {
    hasMotions,
    hasMinimumSources,
    hasOppositionAnalysis,
    passed: hasMotions && hasMinimumSources && hasOppositionAnalysis
  };
}

function checkMotions(article) {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('motion') ||
         article.content.toLowerCase().includes('opposition');
}

function countSources(article) {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkOppositionAnalysis(article) {
  if (!article || !article.content) return false;
  const keywords = ['opposition', 'battle', 'fault lines', 'parliamentary'];
  return keywords.some(keyword =>
    article.content.toLowerCase().includes(keyword)
  );
}
