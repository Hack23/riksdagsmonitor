#!/usr/bin/env node

/**
 * Dynamic News Index Generation Script
 * 
 * Scans news/ directory for article HTML files and generates dynamic index pages
 * for all 14 languages with proper article aggregation and metadata.
 * 
 * Solves the critical problem of hardcoded article arrays in news/index*.html files.
 * 
 * Usage: node scripts/generate-news-indexes.js
 * 
 * @see NEWS_WORKFLOW_EXECUTIVE_SUMMARY.md for context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NEWS_DIR = path.join(__dirname, '..', 'news');

/**
 * Helper: Escape HTML special characters for safe inclusion in HTML/JSON-LD
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

const LANGUAGES = {
  en: { name: 'English', code: 'en', locale: 'en_US', title: 'News', subtitle: 'Latest news and analysis from Sweden\'s Riksdag. The Economist-style political journalism covering parliament, government, and agencies with systematic transparency.' },
  sv: { name: 'Svenska', code: 'sv', locale: 'sv_SE', title: 'Nyheter', subtitle: 'Senaste nyheterna och analyser från Sveriges Riksdag. Politisk journalistik i The Economist-stil som täcker riksdag, regering och myndigheter med systematisk transparens.' },
  da: { name: 'Dansk', code: 'da', locale: 'da_DK', title: 'Nyheder', subtitle: 'Seneste nyheder og analyser fra Sveriges Rigsdag. Politisk journalistik i The Economist-stil.' },
  no: { name: 'Norsk', code: 'nb', locale: 'nb_NO', title: 'Nyheter', subtitle: 'Siste nyheter og analyser fra Sveriges Riksdag. Politisk journalistikk i The Economist-stil.' },
  fi: { name: 'Suomi', code: 'fi', locale: 'fi_FI', title: 'Uutiset', subtitle: 'Viimeisimmät uutiset ja analyysit Ruotsin valtiopäivistä. The Economist -tyylistä poliittista journalismia.' },
  de: { name: 'Deutsch', code: 'de', locale: 'de_DE', title: 'Nachrichten', subtitle: 'Neueste Nachrichten und Analysen aus dem schwedischen Reichstag. Politischer Journalismus im Stil des Economist.' },
  fr: { name: 'Français', code: 'fr', locale: 'fr_FR', title: 'Actualités', subtitle: 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme politique dans le style de The Economist.' },
  es: { name: 'Español', code: 'es', locale: 'es_ES', title: 'Noticias', subtitle: 'Últimas noticias y análisis del Parlamento sueco. Periodismo político al estilo de The Economist.' },
  nl: { name: 'Nederlands', code: 'nl', locale: 'nl_NL', title: 'Nieuws', subtitle: 'Laatste nieuws en analyses uit het Zweedse Parlement. Politieke journalistiek in de stijl van The Economist.' },
  ar: { name: 'العربية', code: 'ar', locale: 'ar_SA', title: 'أخبار', subtitle: 'آخر الأخبار والتحليلات من البرلمان السويدي. صحافة سياسية على طراز ذا إيكونوميست.', rtl: true },
  he: { name: 'עברית', code: 'he', locale: 'he_IL', title: 'חדשות', subtitle: 'חדשות ואנליזות אחרונות מהפרלמנט השוודי. עיתונות פוליטית בסגנון דה אקונומיסט.', rtl: true },
  ja: { name: '日本語', code: 'ja', locale: 'ja_JP', title: 'ニュース', subtitle: 'スウェーデン国会からの最新ニュースと分析。エコノミスト・スタイルの政治ジャーナリズム。' },
  ko: { name: '한국어', code: 'ko', locale: 'ko_KR', title: '뉴스', subtitle: '스웨덴 의회의 최신 뉴스 및 분석. 이코노미스트 스타일의 정치 저널리즘.' },
  zh: { name: '中文', code: 'zh', locale: 'zh_CN', title: '新闻', subtitle: '来自瑞典议会的最新新闻和分析。经济学人风格的政治新闻报道。' }
};

console.log('🗂️ Dynamic News Index Generation');
console.log('📍 Scanning news directory:', NEWS_DIR);

/**
 * Parse HTML file to extract article metadata
 */
function parseArticleMetadata(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Extract language from filename (e.g., article-en.html → en, article-da.html → da)
    const langMatch = fileName.match(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    if (!langMatch) {
      console.warn(`  ⚠️ Skipping ${fileName}: no language suffix`);
      return null;
    }
    
    const lang = langMatch[1];
    
    // Extract metadata from HTML meta tags
    const metadata = {
      slug: fileName,
      lang,
      title: extractMetaContent(content, 'og:title') || extractTitle(content) || 'Untitled',
      description: extractMetaContent(content, 'og:description') || extractMetaContent(content, 'description') || '',
      date: extractMetaContent(content, 'article:published_time') || extractFromFilename(fileName),
      type: classifyArticleType(content, fileName),
      topics: extractTopics(content),
      tags: extractTags(content)
    };
    
    return metadata;
  } catch (error) {
    console.error(`  ❌ Error parsing ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

/**
 * Extract content from meta tags
 */
function extractMetaContent(html, property) {
  const patterns = [
    new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`, 'i'),
    new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Extract title from <title> tag
 */
function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].replace(' - Riksdagsmonitor', '').trim() : null;
}

/**
 * Extract date from filename (YYYY-MM-DD format)
 */
function extractFromFilename(fileName) {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString().split('T')[0];
}

/**
 * Classify article type based on content and filename
 */
function classifyArticleType(content, fileName) {
  if (fileName.includes('week-ahead') || content.includes('Week Ahead') || content.includes('Veckan som kommer')) {
    return 'prospective';
  }
  if (fileName.includes('committee-reports') || content.includes('Committee Reports') || content.includes('Utskottsbetänkanden')) {
    return 'analysis';
  }
  if (fileName.includes('propositions') || content.includes('Propositions') || content.includes('Propositioner')) {
    return 'analysis';
  }
  if (fileName.includes('motions') || content.includes('Motions') || content.includes('Motioner')) {
    return 'analysis';
  }
  if (fileName.includes('breaking') || content.includes('Breaking') || content.includes('Senaste nytt')) {
    return 'breaking';
  }
  return 'retrospective';
}

/**
 * Extract topics from article tags
 */
function extractTopics(content) {
  const topics = [];
  const tagPattern = /<meta\s+property=["']article:tag["']\s+content=["']([^"']+)["']/gi;
  let match;
  
  while ((match = tagPattern.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    if (tag.includes('eu')) topics.push('eu');
    if (tag.includes('parliament') || tag.includes('riksdag')) topics.push('parliament');
    if (tag.includes('government') || tag.includes('regering')) topics.push('government');
    if (tag.includes('defense') || tag.includes('försvar')) topics.push('defense');
    if (tag.includes('environment') || tag.includes('miljö')) topics.push('environment');
    if (tag.includes('committee') || tag.includes('utskott')) topics.push('committees');
    if (tag.includes('legislation') || tag.includes('lagstiftning')) topics.push('legislation');
  }
  
  return [...new Set(topics)].slice(0, 5); // Unique, max 5
}

/**
 * Extract tags from article:tag meta tags
 */
function extractTags(content) {
  const tags = [];
  const tagPattern = /<meta\s+property=["']article:tag["']\s+content=["']([^"']+)["']/gi;
  let match;
  
  while ((match = tagPattern.exec(content)) !== null) {
    tags.push(match[1]);
  }
  
  return tags.slice(0, 4); // Max 4 tags for display
}

/**
 * Scan news directory and group articles by language
 */
function scanNewsArticles() {
  console.log('\n📰 Scanning for articles...');
  
  const files = fs.readdirSync(NEWS_DIR)
    .filter(file => file.endsWith('.html'))
    .filter(file => !file.startsWith('index')); // Exclude index files
  
  console.log(`  Found ${files.length} article files`);
  
  const articlesByLang = {
    en: [],
    sv: []
  };
  
  files.forEach(file => {
    const filePath = path.join(NEWS_DIR, file);
    const metadata = parseArticleMetadata(filePath);
    
    if (metadata && articlesByLang[metadata.lang]) {
      articlesByLang[metadata.lang].push(metadata);
    }
  });
  
  // Sort by date descending (newest first)
  Object.keys(articlesByLang).forEach(lang => {
    articlesByLang[lang].sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  
  console.log(`  📊 English articles: ${articlesByLang.en.length}`);
  console.log(`  📊 Swedish articles: ${articlesByLang.sv.length}`);
  
  return articlesByLang;
}

/**
 * Generate index HTML for a specific language
 */
function generateIndexHTML(langKey, articles, allArticlesByLang) {
  const lang = LANGUAGES[langKey];
  const filename = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
  
  // For languages without articles, use English articles with language notice
  const displayArticles = articles.length > 0 ? articles : allArticlesByLang.en;
  const needsLanguageNotice = articles.length === 0 && langKey !== 'en';
  
  const html = `<!DOCTYPE html>
<html lang="${lang.code}"${lang.rtl ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lang.title} - Riksdagsmonitor</title>
  <meta name="description" content="${lang.subtitle}">
  <meta name="keywords" content="riksdag news, swedish parliament, government analysis, political journalism, transparency, democracy">
  <meta name="author" content="James Pether Sörling, CISSP, CISM">
  <link rel="canonical" href="https://riksdagsmonitor.com/news/${filename}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${lang.title} - Riksdagsmonitor">
  <meta property="og:description" content="${lang.subtitle}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://riksdagsmonitor.com/news/${filename}">
  <meta property="og:image" content="https://cia.sourceforge.io/cia-logo.png">
  <meta property="og:site_name" content="Riksdagsmonitor">
  <meta property="og:locale" content="${lang.locale}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${lang.title} - Riksdagsmonitor">
  <meta name="twitter:description" content="${lang.subtitle}">
  <meta name="twitter:image" content="https://cia.sourceforge.io/cia-logo.png">
  
  <!-- Hreflang -->
${generateHreflangTags()}
  
  <!-- Schema.org ItemList structured data for article aggregation -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "${lang.title}",
    "description": "${lang.subtitle}",
    "numberOfItems": ${displayArticles.length},
    "itemListElement": [${displayArticles.slice(0, 10).map((article, index) => `
      {
        "@type": "ListItem",
        "position": ${index + 1},
        "item": {
          "@type": "NewsArticle",
          "headline": "${escapeHtml(article.title)}",
          "url": "https://riksdagsmonitor.com/news/${article.slug}",
          "datePublished": "${article.date}",
          "description": "${escapeHtml(article.description).substring(0, 150)}",
          "inLanguage": "${article.lang || lang.code}"
        }
      }`).join(',')}
    ]
  }
  </script>
  
  <!-- BreadcrumbList structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://riksdagsmonitor.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "News",
        "item": "https://riksdagsmonitor.com/news/${filename}"
      }
    ]
  }
  </script>
  
  <!-- WebSite structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Riksdagsmonitor",
    "url": "https://riksdagsmonitor.com",
    "description": "Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency",
    "publisher": {
      "@type": "Organization",
      "name": "Hack23 AB",
      "logo": {
        "@type": "ImageObject",
        "url": "https://cia.sourceforge.io/cia-logo.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://riksdagsmonitor.com/news/${filename}?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="../styles.css">
  ${generateRTLStyles(lang.rtl)}
</head>
<body class="news-page">
  <header class="header-section">
    <div class="header-content">
      <h1>${lang.title}</h1>
      <p class="subtitle">${lang.subtitle}</p>
      <a href="../${langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`}" class="back-link">← ${langKey === 'sv' ? 'Tillbaka till huvudsidan' : langKey === 'da' ? 'Tilbage til hovedsiden' : langKey === 'no' ? 'Tilbake til hovedsiden' : langKey === 'fi' ? 'Takaisin etusivulle' : langKey === 'de' ? 'Zurück zur Hauptseite' : langKey === 'fr' ? 'Retour à l\'accueil' : langKey === 'es' ? 'Volver a la página principal' : langKey === 'nl' ? 'Terug naar hoofdpagina' : langKey === 'ar' ? 'العودة إلى الصفحة الرئيسية' : langKey === 'he' ? 'חזרה לדף הבית' : langKey === 'ja' ? 'ホームページに戻る' : langKey === 'ko' ? '홈페이지로 돌아가기' : langKey === 'zh' ? '返回主页' : 'Back to Main'}</a>
    </div>
  </header>
  
  <div class="container">
${needsLanguageNotice ? generateLanguageNotice(langKey) : ''}
    
    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label for="filter-type">${langKey === 'sv' ? 'Typ' : langKey === 'da' ? 'Type' : langKey === 'no' ? 'Type' : langKey === 'fi' ? 'Tyyppi' : langKey === 'de' ? 'Typ' : langKey === 'fr' ? 'Type' : langKey === 'es' ? 'Tipo' : langKey === 'nl' ? 'Type' : langKey === 'ar' ? 'النوع' : langKey === 'he' ? 'סוג' : langKey === 'ja' ? 'タイプ' : langKey === 'ko' ? '유형' : langKey === 'zh' ? '类型' : 'Type'}:</label>
        <select id="filter-type">
          <option value="all">${langKey === 'sv' ? 'Alla typer' : langKey === 'da' ? 'Alle typer' : langKey === 'no' ? 'Alle typer' : langKey === 'fi' ? 'Kaikki tyypit' : langKey === 'de' ? 'Alle Typen' : langKey === 'fr' ? 'Tous types' : langKey === 'es' ? 'Todos los tipos' : langKey === 'nl' ? 'Alle types' : langKey === 'ar' ? 'جميع الأنواع' : langKey === 'he' ? 'כל הסוגים' : langKey === 'ja' ? 'すべてのタイプ' : langKey === 'ko' ? '모든 유형' : langKey === 'zh' ? '所有类型' : 'All Types'}</option>
          <option value="prospective">${langKey === 'sv' ? 'Framåtblickande' : langKey === 'da' ? 'Fremadrettet' : langKey === 'no' ? 'Fremtidsrettet' : langKey === 'fi' ? 'Ennakoiva' : langKey === 'de' ? 'Vorausschauend' : langKey === 'fr' ? 'Prospectif' : langKey === 'es' ? 'Prospectivo' : langKey === 'nl' ? 'Vooruitziend' : langKey === 'ar' ? 'استشرافي' : langKey === 'he' ? 'פרוספקטיבי' : langKey === 'ja' ? '予測' : langKey === 'ko' ? '전망' : langKey === 'zh' ? '前瞻' : 'Prospective'}</option>
          <option value="retrospective">${langKey === 'sv' ? 'Återblickande' : langKey === 'da' ? 'Tilbageblik' : langKey === 'no' ? 'Tilbakeblikk' : langKey === 'fi' ? 'Takautuva' : langKey === 'de' ? 'Rückblickend' : langKey === 'fr' ? 'Rétrospectif' : langKey === 'es' ? 'Retrospectivo' : langKey === 'nl' ? 'Terugblik' : langKey === 'ar' ? 'استعادي' : langKey === 'he' ? 'רטרוספקטיבי' : langKey === 'ja' ? '振り返り' : langKey === 'ko' ? '회고' : langKey === 'zh' ? '回顾' : 'Retrospective'}</option>
          <option value="analysis">${langKey === 'sv' ? 'Analys' : langKey === 'da' ? 'Analyse' : langKey === 'no' ? 'Analyse' : langKey === 'fi' ? 'Analyysi' : langKey === 'de' ? 'Analyse' : langKey === 'fr' ? 'Analyse' : langKey === 'es' ? 'Análisis' : langKey === 'nl' ? 'Analyse' : langKey === 'ar' ? 'تحليل' : langKey === 'he' ? 'ניתוח' : langKey === 'ja' ? '分析' : langKey === 'ko' ? '분석' : langKey === 'zh' ? '分析' : 'Analysis'}</option>
          <option value="breaking">${langKey === 'sv' ? 'Senaste nytt' : langKey === 'da' ? 'Seneste nyt' : langKey === 'no' ? 'Siste nytt' : langKey === 'fi' ? 'Viimeisimmät' : langKey === 'de' ? 'Eilmeldungen' : langKey === 'fr' ? 'Dernières nouvelles' : langKey === 'es' ? 'Última hora' : langKey === 'nl' ? 'Laatste nieuws' : langKey === 'ar' ? 'أخبار عاجلة' : langKey === 'he' ? 'חדשות אחרונות' : langKey === 'ja' ? '速報' : langKey === 'ko' ? '속보' : langKey === 'zh' ? '最新消息' : 'Breaking'}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filter-topic">${langKey === 'sv' ? 'Ämne' : langKey === 'da' ? 'Emne' : langKey === 'no' ? 'Emne' : langKey === 'fi' ? 'Aihe' : langKey === 'de' ? 'Thema' : langKey === 'fr' ? 'Sujet' : langKey === 'es' ? 'Tema' : langKey === 'nl' ? 'Onderwerp' : langKey === 'ar' ? 'الموضوع' : langKey === 'he' ? 'נושא' : langKey === 'ja' ? 'トピック' : langKey === 'ko' ? '주제' : langKey === 'zh' ? '主题' : 'Topic'}:</label>
        <select id="filter-topic">
          <option value="all">${langKey === 'sv' ? 'Alla ämnen' : langKey === 'da' ? 'Alle emner' : langKey === 'no' ? 'Alle emner' : langKey === 'fi' ? 'Kaikki aiheet' : langKey === 'de' ? 'Alle Themen' : langKey === 'fr' ? 'Tous sujets' : langKey === 'es' ? 'Todos los temas' : langKey === 'nl' ? 'Alle onderwerpen' : langKey === 'ar' ? 'جميع المواضيع' : langKey === 'he' ? 'כל הנושאים' : langKey === 'ja' ? 'すべてのトピック' : langKey === 'ko' ? '모든 주제' : langKey === 'zh' ? '所有主题' : 'All Topics'}</option>
          <option value="parliament">${langKey === 'sv' ? 'Riksdagen' : langKey === 'da' ? 'Parlamentet' : langKey === 'no' ? 'Parlamentet' : langKey === 'fi' ? 'Parlamentti' : langKey === 'de' ? 'Parlament' : langKey === 'fr' ? 'Parlement' : langKey === 'es' ? 'Parlamento' : langKey === 'nl' ? 'Parlement' : langKey === 'ar' ? 'البرلمان' : langKey === 'he' ? 'פרלמנט' : langKey === 'ja' ? '議会' : langKey === 'ko' ? '의회' : langKey === 'zh' ? '议会' : 'Parliament'}</option>
          <option value="government">${langKey === 'sv' ? 'Regeringen' : langKey === 'da' ? 'Regeringen' : langKey === 'no' ? 'Regjeringen' : langKey === 'fi' ? 'Hallitus' : langKey === 'de' ? 'Regierung' : langKey === 'fr' ? 'Gouvernement' : langKey === 'es' ? 'Gobierno' : langKey === 'nl' ? 'Regering' : langKey === 'ar' ? 'الحكومة' : langKey === 'he' ? 'ממשלה' : langKey === 'ja' ? '政府' : langKey === 'ko' ? '정부' : langKey === 'zh' ? '政府' : 'Government'}</option>
          <option value="eu">EU</option>
          <option value="defense">${langKey === 'sv' ? 'Försvar' : langKey === 'da' ? 'Forsvar' : langKey === 'no' ? 'Forsvar' : langKey === 'fi' ? 'Puolustus' : langKey === 'de' ? 'Verteidigung' : langKey === 'fr' ? 'Défense' : langKey === 'es' ? 'Defensa' : langKey === 'nl' ? 'Defensie' : langKey === 'ar' ? 'الدفاع' : langKey === 'he' ? 'הגנה' : langKey === 'ja' ? '防衛' : langKey === 'ko' ? '국방' : langKey === 'zh' ? '国防' : 'Defense'}</option>
          <option value="environment">${langKey === 'sv' ? 'Miljö' : langKey === 'da' ? 'Miljø' : langKey === 'no' ? 'Miljø' : langKey === 'fi' ? 'Ympäristö' : langKey === 'de' ? 'Umwelt' : langKey === 'fr' ? 'Environnement' : langKey === 'es' ? 'Medio ambiente' : langKey === 'nl' ? 'Milieu' : langKey === 'ar' ? 'البيئة' : langKey === 'he' ? 'סביבה' : langKey === 'ja' ? '環境' : langKey === 'ko' ? '환경' : langKey === 'zh' ? '环境' : 'Environment'}</option>
          <option value="committees">${langKey === 'sv' ? 'Utskott' : langKey === 'da' ? 'Udvalg' : langKey === 'no' ? 'Utvalg' : langKey === 'fi' ? 'Valiokunnat' : langKey === 'de' ? 'Ausschüsse' : langKey === 'fr' ? 'Comités' : langKey === 'es' ? 'Comités' : langKey === 'nl' ? 'Commissies' : langKey === 'ar' ? 'اللجان' : langKey === 'he' ? 'ועדות' : langKey === 'ja' ? '委員会' : langKey === 'ko' ? '위원회' : langKey === 'zh' ? '委员会' : 'Committees'}</option>
          <option value="legislation">${langKey === 'sv' ? 'Lagstiftning' : langKey === 'da' ? 'Lovgivning' : langKey === 'no' ? 'Lovgivning' : langKey === 'fi' ? 'Lainsäädäntö' : langKey === 'de' ? 'Gesetzgebung' : langKey === 'fr' ? 'Législation' : langKey === 'es' ? 'Legislación' : langKey === 'nl' ? 'Wetgeving' : langKey === 'ar' ? 'التشريعات' : langKey === 'he' ? 'חקיקה' : langKey === 'ja' ? '立法' : langKey === 'ko' ? '입법' : langKey === 'zh' ? '立法' : 'Legislation'}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filter-sort">${langKey === 'sv' ? 'Sortera' : langKey === 'da' ? 'Sorter' : langKey === 'no' ? 'Sorter' : langKey === 'fi' ? 'Lajittele' : langKey === 'de' ? 'Sortieren' : langKey === 'fr' ? 'Trier' : langKey === 'es' ? 'Ordenar' : langKey === 'nl' ? 'Sorteren' : langKey === 'ar' ? 'ترتيب' : langKey === 'he' ? 'מיון' : langKey === 'ja' ? '並べ替え' : langKey === 'ko' ? '정렬' : langKey === 'zh' ? '排序' : 'Sort'}:</label>
        <select id="filter-sort">
          <option value="date-desc">${langKey === 'sv' ? 'Nyast först' : langKey === 'da' ? 'Nyeste først' : langKey === 'no' ? 'Nyeste først' : langKey === 'fi' ? 'Uusimmat ensin' : langKey === 'de' ? 'Neueste zuerst' : langKey === 'fr' ? 'Plus récent' : langKey === 'es' ? 'Más reciente' : langKey === 'nl' ? 'Nieuwste eerst' : langKey === 'ar' ? 'الأحدث أولاً' : langKey === 'he' ? 'החדש ביותר' : langKey === 'ja' ? '最新順' : langKey === 'ko' ? '최신순' : langKey === 'zh' ? '最新优先' : 'Newest First'}</option>
          <option value="date-asc">${langKey === 'sv' ? 'Äldst först' : langKey === 'da' ? 'Ældste først' : langKey === 'no' ? 'Eldste først' : langKey === 'fi' ? 'Vanhimmat ensin' : langKey === 'de' ? 'Älteste zuerst' : langKey === 'fr' ? 'Plus ancien' : langKey === 'es' ? 'Más antiguo' : langKey === 'nl' ? 'Oudste eerst' : langKey === 'ar' ? 'الأقدم أولاً' : langKey === 'he' ? 'הישן ביותר' : langKey === 'ja' ? '古い順' : langKey === 'ko' ? '오래된 순' : langKey === 'zh' ? '最旧优先' : 'Oldest First'}</option>
          <option value="title">${langKey === 'sv' ? 'Titel' : langKey === 'da' ? 'Titel' : langKey === 'no' ? 'Tittel' : langKey === 'fi' ? 'Otsikko' : langKey === 'de' ? 'Titel' : langKey === 'fr' ? 'Titre' : langKey === 'es' ? 'Título' : langKey === 'nl' ? 'Titel' : langKey === 'ar' ? 'العنوان' : langKey === 'he' ? 'כותרת' : langKey === 'ja' ? 'タイトル' : langKey === 'ko' ? '제목' : langKey === 'zh' ? '标题' : 'Title'}</option>
        </select>
      </div>
    </div>
    
    <!-- Articles Grid -->
    <div class="articles-grid" id="articles-grid"></div>
    
    <div id="no-results" style="display: none; text-align: center; padding: 3rem; color: #888;">
      ${langKey === 'sv' ? 'Inga artiklar matchade filtren' : langKey === 'da' ? 'Ingen artikler matchede filtrene' : langKey === 'no' ? 'Ingen artikler matchet filtrene' : langKey === 'fi' ? 'Mikään artikkeli ei vastannut suodattimia' : langKey === 'de' ? 'Keine Artikel entsprachen den Filtern' : langKey === 'fr' ? 'Aucun article ne correspond aux filtres' : langKey === 'es' ? 'Ningún artículo coincidió con los filtros' : langKey === 'nl' ? 'Geen artikelen voldeden aan de filters' : langKey === 'ar' ? 'لا توجد مقالات تطابق الفلاتر' : langKey === 'he' ? 'אין מאמרים שתואמים את הסינון' : langKey === 'ja' ? 'フィルターに一致する記事がありません' : langKey === 'ko' ? '필터와 일치하는 기사가 없습니다' : langKey === 'zh' ? '没有与过滤器匹配的文章' : 'No articles matched the filters'}
    </div>
  </div>
  
  <script>
    // Dynamic articles array - generated from news/ directory
    const articles = ${JSON.stringify(displayArticles.map(a => ({
      title: a.title,
      date: a.date,
      type: a.type,
      slug: a.slug,
      excerpt: a.description.substring(0, 200),
      topics: a.topics,
      tags: a.tags
    })), null, 2)};
    
    let filteredArticles = [...articles];
    
    function renderArticles(articlesToRender) {
      const grid = document.getElementById('articles-grid');
      const noResults = document.getElementById('no-results');
      
      if (articlesToRender.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
      }
      
      noResults.style.display = 'none';
      
      grid.innerHTML = articlesToRender.map(article => \`
        <article class="article-card">
          <div class="article-meta">
            <time class="article-date" datetime="\${article.date}">\${formatDate(article.date)}</time>
            <span class="article-type">\${article.type}</span>
          </div>
          <h2 class="article-title">
            <a href="\${article.slug}">\${article.title}</a>
          </h2>
          <p class="article-excerpt">\${article.excerpt}</p>
          <div class="article-tags">
            \${article.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
          </div>
        </article>
      \`).join('');
    }
    
    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('${lang.code}', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    function filterArticles() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      
      let filtered = [...articles];
      
      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(article => article.type === typeFilter);
      }
      
      // Apply topic filter
      if (topicFilter !== 'all') {
        filtered = filtered.filter(article => article.topics.includes(topicFilter));
      }
      
      // Apply sorting
      switch(sortFilter) {
        case 'date-desc':
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'date-asc':
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'title':
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }
      
      filteredArticles = filtered;
      renderArticles(filteredArticles);
    }
    
    // Event listeners
    document.getElementById('filter-type').addEventListener('change', filterArticles);
    document.getElementById('filter-topic').addEventListener('change', filterArticles);
    document.getElementById('filter-sort').addEventListener('change', filterArticles);
    
    // Initial render
    filterArticles();
  </script>
</body>
</html>`;
  
  return html;
}

/**
 * Generate hreflang tags for all languages
 */
function generateHreflangTags() {
  const tags = [];
  
  Object.keys(LANGUAGES).forEach(langKey => {
    const filename = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
    const hrefLang = LANGUAGES[langKey].code;
    tags.push(`  <link rel="alternate" hreflang="${hrefLang}" href="https://riksdagsmonitor.com/news/${filename}">`);
  });
  
  tags.push(`  <link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/news/">`);
  
  return tags.join('\n');
}

/**
 * Generate inline CSS
 */
/**
 * Generate minimal RTL-specific styles
 * All other styles are now in styles.css under .news-page scope
 */
function generateRTLStyles(isRTL) {
  if (!isRTL) return '';
  
  return `
  <style>
    /* RTL-specific overrides for Arabic and Hebrew */
    .news-page .language-notice {
      border-left: none;
      border-right: 4px solid var(--primary-yellow, #ffbe0b);
    }
    
    .news-page .language-badge {
      margin-left: 0;
      margin-right: 0.5rem;
    }
    
    .news-page .back-link:hover {
      transform: translateX(5px); /* Reverse direction for RTL */
    }
  </style>`;
}

/**
 * Generate language availability notice for non-EN/SV indexes
 */
function generateLanguageNotice(langKey) {
  const messages = {
    da: { title: 'Artikler tilgængelige på engelsk', text: 'Artikler er i øjeblikket kun tilgængelige på engelsk og svensk. Automatisk oversættelse til dansk kommer snart.' },
    no: { title: 'Artikler tilgjengelige på engelsk', text: 'Artikler er for tiden kun tilgjengelige på engelsk og svensk. Automatisk oversettelse til norsk kommer snart.' },
    fi: { title: 'Artikkelit saatavilla englanniksi', text: 'Artikkelit ovat tällä hetkellä saatavilla vain englanniksi ja ruotsiksi. Automaattinen käännös suomeksi tulossa pian.' },
    de: { title: 'Artikel auf Englisch verfügbar', text: 'Artikel sind derzeit nur auf Englisch und Schwedisch verfügbar. Automatische Übersetzung ins Deutsche folgt in Kürze.' },
    fr: { title: 'Articles disponibles en anglais', text: 'Les articles ne sont actuellement disponibles qu\'en anglais et en suédois. La traduction automatique en français arrive bientôt.' },
    es: { title: 'Artículos disponibles en inglés', text: 'Los artículos actualmente solo están disponibles en inglés y sueco. La traducción automática al español estará disponible pronto.' },
    nl: { title: 'Artikelen beschikbaar in het Engels', text: 'Artikelen zijn momenteel alleen beschikbaar in het Engels en Zweeds. Automatische vertaling naar het Nederlands komt binnenkort.' },
    ar: { title: 'المقالات متاحة بالإنجليزية', text: 'المقالات متاحة حالياً باللغتين الإنجليزية والسويدية فقط. الترجمة الآلية إلى العربية قريباً.' },
    he: { title: 'מאמרים זמינים באנגלית', text: 'מאמרים זמינים כעת רק באנגלית ובשוודית. תרגום אוטומטי לעברית בקרוב.' },
    ja: { title: '英語で利用可能な記事', text: '記事は現在、英語とスウェーデン語のみで利用可能です。日本語への自動翻訳は近日公開予定です。' },
    ko: { title: '영어로 제공되는 기사', text: '기사는 현재 영어와 스웨덴어로만 제공됩니다. 한국어 자동 번역이 곧 제공될 예정입니다.' },
    zh: { title: '文章以英文提供', text: '文章目前仅提供英文和瑞典文版本。中文自动翻译即将推出。' }
  };
  
  const msg = messages[langKey];
  if (!msg) return '';
  
  const isRTL = ['ar', 'he'].includes(langKey);
  
  return `    <div class="language-notice">
      <h2>${msg.title}</h2>
      <p>${msg.text} <span class="language-badge"${isRTL ? ' dir="ltr"' : ''} aria-label="English language"><span aria-hidden="true">🇬🇧</span> EN</span></p>
    </div>
`;
}

/**
 * Main generation function
 */
function generateAllIndexes() {
  console.log('\n🚀 Generating dynamic news indexes...');
  
  // Scan news directory
  const articlesByLang = scanNewsArticles();
  
  // Generate index for each language
  console.log('\n📝 Generating index files...');
  
  let successCount = 0;
  let errorCount = 0;
  
  Object.keys(LANGUAGES).forEach(langKey => {
    try {
      const filename = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
      const filePath = path.join(NEWS_DIR, filename);
      
      const html = generateIndexHTML(langKey, articlesByLang[langKey] || [], articlesByLang);
      fs.writeFileSync(filePath, html, 'utf-8');
      
      console.log(`  ✅ Generated: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to generate ${langKey}:`, error.message);
      errorCount++;
    }
  });
  
  console.log('\n✨ Generation complete!');
  console.log(`  ✅ Success: ${successCount} files`);
  console.log(`  ❌ Errors: ${errorCount} files`);
  console.log(`  📊 Total articles: EN ${articlesByLang.en.length}, SV ${articlesByLang.sv.length}`);
  console.log('\n💡 Note: Languages without articles display English content with language notice');
  
  return {
    success: errorCount === 0,
    successCount,
    errorCount,
    articles: articlesByLang
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = generateAllIndexes();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

export { generateAllIndexes, parseArticleMetadata, scanNewsArticles };
