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
import { escapeHtml } from './html-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NEWS_DIR = path.join(__dirname, '..', 'news');

const LANGUAGES = {
  en: {
    name: 'English', code: 'en', locale: 'en_US',
    title: 'News',
    subtitle: 'Latest news and analysis from Sweden\'s Riksdag. The Economist-style political journalism covering parliament, government, and agencies with systematic transparency.',
    keywords: 'riksdag news, swedish parliament, government analysis, political journalism, transparency, democracy',
    breadcrumbs: { home: 'Home', news: 'News' },
    backLink: 'Back to Main',
    filters: {
      type: 'Type:', allTypes: 'All types', prospective: 'Prospective', retrospective: 'Retrospective', analysis: 'Analysis', breaking: 'Breaking news',
      topic: 'Topic:', allTopics: 'All Topics', parliament: 'Parliament', government: 'Government', defense: 'Defense', environment: 'Environment', committees: 'Committees', legislation: 'Legislation',
      sort: 'Sort:', newest: 'Newest First', oldest: 'Oldest First', titleSort: 'Title'
    },
    noResults: 'No articles matched the filters',
    i18n: { noArticles: 'No articles available', loading: 'Loading articles...', articleCount: '(n) => n === 1 ? \'1 article\' : \'\' + n + \' articles\'' }
  },
  sv: {
    name: 'Svenska', code: 'sv', locale: 'sv_SE',
    title: 'Nyheter',
    subtitle: 'Senaste nyheterna och analyser från Sveriges Riksdag. Politisk journalistik i The Economist-stil som täcker riksdag, regering och myndigheter med systematisk transparens.',
    keywords: 'riksdag nyheter, svenska riksdagen, regeringsanalys, politisk journalistik, öppenhet, demokrati',
    breadcrumbs: { home: 'Hem', news: 'Nyheter' },
    backLink: 'Tillbaka till huvudsidan',
    filters: {
      type: 'Typ:', allTypes: 'Alla typer', prospective: 'Framåtblickande', retrospective: 'Återblickande', analysis: 'Analys', breaking: 'Senaste nytt',
      topic: 'Ämne:', allTopics: 'Alla ämnen', parliament: 'Riksdagen', government: 'Regeringen', defense: 'Försvar', environment: 'Miljö', committees: 'Utskott', legislation: 'Lagstiftning',
      sort: 'Sortera:', newest: 'Nyast först', oldest: 'Äldst först', titleSort: 'Titel'
    },
    noResults: 'Inga artiklar matchade filtren',
    i18n: { noArticles: 'Inga artiklar tillgängliga', loading: 'Laddar artiklar...', articleCount: '(n) => n === 1 ? \'1 artikel\' : \'\' + n + \' artiklar\'' }
  },
  da: {
    name: 'Dansk', code: 'da', locale: 'da_DK',
    title: 'Nyheder',
    subtitle: 'Seneste nyheder og analyser fra Sveriges Rigsdag. Politisk journalistik i The Economist-stil.',
    keywords: 'riksdag nyheder, svensk parlament, regeringsanalyse, politisk journalistik, gennemsigtighed, demokrati',
    breadcrumbs: { home: 'Hjem', news: 'Nyheder' },
    backLink: 'Tilbage til hovedsiden',
    filters: {
      type: 'Type:', allTypes: 'Alle typer', prospective: 'Fremadrettet', retrospective: 'Tilbageblik', analysis: 'Analyse', breaking: 'Seneste nyt',
      topic: 'Emne:', allTopics: 'Alle emner', parliament: 'Parlamentet', government: 'Regeringen', defense: 'Forsvar', environment: 'Miljø', committees: 'Udvalg', legislation: 'Lovgivning',
      sort: 'Sorter:', newest: 'Nyeste først', oldest: 'Ældste først', titleSort: 'Titel'
    },
    noResults: 'Ingen artikler matchede filtrene',
    i18n: { noArticles: 'Ingen artikler tilgængelige', loading: 'Indlæser artikler...', articleCount: '(n) => n === 1 ? \'1 artikel\' : \'\' + n + \' artikler\'' }
  },
  no: {
    name: 'Norsk', code: 'no', locale: 'no_NO',
    title: 'Nyheter',
    subtitle: 'Siste nyheter og analyser fra Sveriges Riksdag. Politisk journalistikk i The Economist-stil.',
    keywords: 'riksdag nyheter, svensk parlament, regjeringsanalyse, politisk journalistikk, åpenhet, demokrati',
    breadcrumbs: { home: 'Hjem', news: 'Nyheter' },
    backLink: 'Tilbake til hovedsiden',
    filters: {
      type: 'Type:', allTypes: 'Alle typer', prospective: 'Fremtidsrettet', retrospective: 'Tilbakeblikk', analysis: 'Analyse', breaking: 'Siste nytt',
      topic: 'Emne:', allTopics: 'Alle emner', parliament: 'Parlamentet', government: 'Regjeringen', defense: 'Forsvar', environment: 'Miljø', committees: 'Utvalg', legislation: 'Lovgivning',
      sort: 'Sorter:', newest: 'Nyeste først', oldest: 'Eldste først', titleSort: 'Tittel'
    },
    noResults: 'Ingen artikler matchet filtrene',
    i18n: { noArticles: 'Ingen artikler tilgjengelige', loading: 'Laster artikler...', articleCount: '(n) => n === 1 ? \'1 artikkel\' : \'\' + n + \' artikler\'' }
  },
  fi: {
    name: 'Suomi', code: 'fi', locale: 'fi_FI',
    title: 'Uutiset',
    subtitle: 'Viimeisimmät uutiset ja analyysit Ruotsin valtiopäivistä. The Economist -tyylistä poliittista journalismia.',
    keywords: 'riksdag uutiset, ruotsin parlamentti, hallitusanalyysi, poliittinen journalismi, avoimuus, demokratia',
    breadcrumbs: { home: 'Etusivu', news: 'Uutiset' },
    backLink: 'Takaisin etusivulle',
    filters: {
      type: 'Tyyppi:', allTypes: 'Kaikki tyypit', prospective: 'Ennakoiva', retrospective: 'Takautuva', analysis: 'Analyysi', breaking: 'Viimeisimmät',
      topic: 'Aihe:', allTopics: 'Kaikki aiheet', parliament: 'Parlamentti', government: 'Hallitus', defense: 'Puolustus', environment: 'Ympäristö', committees: 'Valiokunnat', legislation: 'Lainsäädäntö',
      sort: 'Järjestä:', newest: 'Uusimmat ensin', oldest: 'Vanhimmat ensin', titleSort: 'Otsikko'
    },
    noResults: 'Mikään artikkeli ei vastannut suodattimia',
    i18n: { noArticles: 'Ei artikkeleita saatavilla', loading: 'Ladataan artikkeleita...', articleCount: '(n) => n === 1 ? \'1 artikkeli\' : \'\' + n + \' artikkelia\'' }
  },
  de: {
    name: 'Deutsch', code: 'de', locale: 'de_DE',
    title: 'Nachrichten',
    subtitle: 'Neueste Nachrichten und Analysen aus dem schwedischen Reichstag. Politischer Journalismus im Stil des Economist.',
    keywords: 'riksdag nachrichten, schwedisches parlament, regierungsanalyse, politischer journalismus, transparenz, demokratie',
    breadcrumbs: { home: 'Startseite', news: 'Nachrichten' },
    backLink: 'Zurück zur Hauptseite',
    filters: {
      type: 'Typ:', allTypes: 'Alle Typen', prospective: 'Vorausschauend', retrospective: 'Rückblickend', analysis: 'Analyse', breaking: 'Eilmeldungen',
      topic: 'Thema:', allTopics: 'Alle Themen', parliament: 'Parlament', government: 'Regierung', defense: 'Verteidigung', environment: 'Umwelt', committees: 'Ausschüsse', legislation: 'Gesetzgebung',
      sort: 'Sortieren:', newest: 'Neueste zuerst', oldest: 'Älteste zuerst', titleSort: 'Titel'
    },
    noResults: 'Keine Artikel entsprachen den Filtern',
    i18n: { noArticles: 'Keine Artikel verfügbar', loading: 'Artikel werden geladen...', articleCount: '(n) => n === 1 ? \'1 Artikel\' : \'\' + n + \' Artikel\'' }
  },
  fr: {
    name: 'Français', code: 'fr', locale: 'fr_FR',
    title: 'Actualités',
    subtitle: 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme politique dans le style de The Economist.',
    keywords: 'riksdag actualités, parlement suédois, analyse gouvernementale, journalisme politique, transparence, démocratie',
    breadcrumbs: { home: 'Accueil', news: 'Actualités' },
    backLink: 'Retour à l\'accueil',
    filters: {
      type: 'Type :', allTypes: 'Tous types', prospective: 'Prospectif', retrospective: 'Rétrospectif', analysis: 'Analyse', breaking: 'Dernières nouvelles',
      topic: 'Sujet :', allTopics: 'Tous sujets', parliament: 'Parlement', government: 'Gouvernement', defense: 'Défense', environment: 'Environnement', committees: 'Comités', legislation: 'Législation',
      sort: 'Trier :', newest: 'Plus récent', oldest: 'Plus ancien', titleSort: 'Titre'
    },
    noResults: 'Aucun article ne correspond aux filtres',
    i18n: { noArticles: 'Aucun article disponible', loading: 'Chargement des articles...', articleCount: '(n) => n === 1 ? \'1 article\' : \'\' + n + \' articles\'' }
  },
  es: {
    name: 'Español', code: 'es', locale: 'es_ES',
    title: 'Noticias',
    subtitle: 'Últimas noticias y análisis del Parlamento sueco. Periodismo político al estilo de The Economist.',
    keywords: 'riksdag noticias, parlamento sueco, análisis gubernamental, periodismo político, transparencia, democracia',
    breadcrumbs: { home: 'Inicio', news: 'Noticias' },
    backLink: 'Volver a la página principal',
    filters: {
      type: 'Tipo:', allTypes: 'Todos los tipos', prospective: 'Prospectivo', retrospective: 'Retrospectivo', analysis: 'Análisis', breaking: 'Última hora',
      topic: 'Tema:', allTopics: 'Todos los temas', parliament: 'Parlamento', government: 'Gobierno', defense: 'Defensa', environment: 'Medio ambiente', committees: 'Comités', legislation: 'Legislación',
      sort: 'Ordenar:', newest: 'Más reciente', oldest: 'Más antiguo', titleSort: 'Título'
    },
    noResults: 'Ningún artículo coincidió con los filtros',
    i18n: { noArticles: 'No hay artículos disponibles', loading: 'Cargando artículos...', articleCount: '(n) => n === 1 ? \'1 artículo\' : \'\' + n + \' artículos\'' }
  },
  nl: {
    name: 'Nederlands', code: 'nl', locale: 'nl_NL',
    title: 'Nieuws',
    subtitle: 'Laatste nieuws en analyses uit het Zweedse Parlement. Politieke journalistiek in de stijl van The Economist.',
    keywords: 'riksdag nieuws, zweeds parlement, regeringsanalyse, politieke journalistiek, transparantie, democratie',
    breadcrumbs: { home: 'Home', news: 'Nieuws' },
    backLink: 'Terug naar hoofdpagina',
    filters: {
      type: 'Type:', allTypes: 'Alle types', prospective: 'Vooruitziend', retrospective: 'Terugblik', analysis: 'Analyse', breaking: 'Laatste nieuws',
      topic: 'Onderwerp:', allTopics: 'Alle onderwerpen', parliament: 'Parlement', government: 'Regering', defense: 'Defensie', environment: 'Milieu', committees: 'Commissies', legislation: 'Wetgeving',
      sort: 'Sorteren:', newest: 'Nieuwste eerst', oldest: 'Oudste eerst', titleSort: 'Titel'
    },
    noResults: 'Geen artikelen voldeden aan de filters',
    i18n: { noArticles: 'Geen artikelen beschikbaar', loading: 'Artikelen laden...', articleCount: '(n) => n === 1 ? \'1 artikel\' : \'\' + n + \' artikelen\'' }
  },
  ar: {
    name: 'العربية', code: 'ar', locale: 'ar_SA', rtl: true,
    title: 'أخبار',
    subtitle: 'آخر الأخبار والتحليلات من البرلمان السويدي. صحافة سياسية على طراز ذا إيكونوميست.',
    keywords: 'أخبار البرلمان, البرلمان السويدي, تحليل حكومي, صحافة سياسية, شفافية, ديمقراطية',
    breadcrumbs: { home: 'الرئيسية', news: 'أخبار' },
    backLink: 'العودة إلى الصفحة الرئيسية',
    filters: {
      type: 'النوع:', allTypes: 'جميع الأنواع', prospective: 'استشرافي', retrospective: 'استعادي', analysis: 'تحليل', breaking: 'أخبار عاجلة',
      topic: 'الموضوع:', allTopics: 'جميع المواضيع', parliament: 'البرلمان', government: 'الحكومة', defense: 'الدفاع', environment: 'البيئة', committees: 'اللجان', legislation: 'التشريعات',
      sort: 'الترتيب:', newest: 'الأحدث أولاً', oldest: 'الأقدم أولاً', titleSort: 'العنوان'
    },
    noResults: 'لا توجد مقالات تطابق الفلاتر',
    i18n: { noArticles: 'لا توجد مقالات متاحة', loading: 'جارٍ تحميل المقالات...', articleCount: '(n) => n === 1 ? \'مقال واحد\' : \'\' + n + \' مقالات\'' }
  },
  he: {
    name: 'עברית', code: 'he', locale: 'he_IL', rtl: true,
    title: 'חדשות',
    subtitle: 'חדשות ואנליזות אחרונות מהפרלמנט השוודי. עיתונות פוליטית בסגנון דה אקונומיסט.',
    keywords: 'חדשות הפרלמנט, הפרלמנט השוודי, ניתוח ממשלתי, עיתונות פוליטית, שקיפות, דמוקרטיה',
    breadcrumbs: { home: 'בית', news: 'חדשות' },
    backLink: 'חזרה לדף הבית',
    filters: {
      type: 'סוג:', allTypes: 'כל הסוגים', prospective: 'פרוספקטיבי', retrospective: 'רטרוספקטיבי', analysis: 'ניתוח', breaking: 'חדשות אחרונות',
      topic: 'נושא:', allTopics: 'כל הנושאים', parliament: 'פרלמנט', government: 'ממשלה', defense: 'הגנה', environment: 'סביבה', committees: 'ועדות', legislation: 'חקיקה',
      sort: 'מיון:', newest: 'החדש ביותר', oldest: 'הישן ביותר', titleSort: 'כותרת'
    },
    noResults: 'אין מאמרים שתואמים את הסינון',
    i18n: { noArticles: 'אין מאמרים זמינים', loading: 'טוען מאמרים...', articleCount: '(n) => n === 1 ? \'מאמר אחד\' : \'\' + n + \' מאמרים\'' }
  },
  ja: {
    name: '日本語', code: 'ja', locale: 'ja_JP',
    title: 'ニュース',
    subtitle: 'スウェーデン国会からの最新ニュースと分析。エコノミスト・スタイルの政治ジャーナリズム。',
    keywords: '国会ニュース, スウェーデン議会, 政府分析, 政治ジャーナリズム, 透明性, 民主主義',
    breadcrumbs: { home: 'ホーム', news: 'ニュース' },
    backLink: 'ホームページに戻る',
    filters: {
      type: '種類：', allTypes: 'すべてのタイプ', prospective: '予測', retrospective: '振り返り', analysis: '分析', breaking: '速報',
      topic: 'トピック：', allTopics: 'すべてのトピック', parliament: '議会', government: '政府', defense: '防衛', environment: '環境', committees: '委員会', legislation: '立法',
      sort: '並び替え：', newest: '最新順', oldest: '古い順', titleSort: 'タイトル'
    },
    noResults: 'フィルターに一致する記事がありません',
    i18n: { noArticles: '記事がありません', loading: '記事を読み込み中...', articleCount: '(n) => n === 1 ? \'1件の記事\' : \'\' + n + \'件の記事\'' }
  },
  ko: {
    name: '한국어', code: 'ko', locale: 'ko_KR',
    title: '뉴스',
    subtitle: '스웨덴 의회의 최신 뉴스 및 분석. 이코노미스트 스타일의 정치 저널리즘.',
    keywords: '의회 뉴스, 스웨덴 의회, 정부 분석, 정치 저널리즘, 투명성, 민주주의',
    breadcrumbs: { home: '홈', news: '뉴스' },
    backLink: '홈페이지로 돌아가기',
    filters: {
      type: '유형:', allTypes: '모든 유형', prospective: '전망', retrospective: '회고', analysis: '분석', breaking: '속보',
      topic: '주제:', allTopics: '모든 주제', parliament: '의회', government: '정부', defense: '국방', environment: '환경', committees: '위원회', legislation: '입법',
      sort: '정렬:', newest: '최신순', oldest: '오래된 순', titleSort: '제목'
    },
    noResults: '필터와 일치하는 기사가 없습니다',
    i18n: { noArticles: '기사가 없습니다', loading: '기사 로딩 중...', articleCount: '(n) => n === 1 ? \'1개의 기사\' : \'\' + n + \'개의 기사\'' }
  },
  zh: {
    name: '中文', code: 'zh', locale: 'zh_CN',
    title: '新闻',
    subtitle: '来自瑞典议会的最新新闻和分析。经济学人风格的政治新闻报道。',
    keywords: '议会新闻, 瑞典议会, 政府分析, 政治新闻, 透明度, 民主',
    breadcrumbs: { home: '主页', news: '新闻' },
    backLink: '返回主页',
    filters: {
      type: '类型：', allTypes: '所有类型', prospective: '前瞻', retrospective: '回顾', analysis: '分析', breaking: '最新消息',
      topic: '主题：', allTopics: '所有主题', parliament: '议会', government: '政府', defense: '国防', environment: '环境', committees: '委员会', legislation: '立法',
      sort: '排序：', newest: '最新优先', oldest: '最旧优先', titleSort: '标题'
    },
    noResults: '没有与过滤器匹配的文章',
    i18n: { noArticles: '没有可用的文章', loading: '正在加载文章...', articleCount: '(n) => n === 1 ? \'1篇文章\' : \'\' + n + \'篇文章\'' }
  }
};

// Language flags mapping for badges
const LANGUAGE_FLAGS = {
  en: '🇬🇧', sv: '🇸🇪', da: '🇩🇰', no: '🇳🇴', fi: '🇫🇮',
  de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', nl: '🇳🇱', ar: '🇸🇦',
  he: '🇮🇱', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳'
};

// "Available in" translations for each language
const AVAILABLE_IN_TRANSLATIONS = {
  en: 'Available in', sv: 'Tillgänglig på', da: 'Tilgængelig på', no: 'Tilgjengelig på', fi: 'Saatavilla kielellä',
  de: 'Verfügbar in', fr: 'Disponible en', es: 'Disponible en', nl: 'Beschikbaar in', ar: 'متاح في',
  he: 'זמין ב', ja: '利用可能な言語', ko: '사용 가능 언어', zh: '可用语言'
};

/**
 * Generate language badge HTML for an article
 * @param {string} lang - Language code (e.g., 'en', 'sv')
 * @param {boolean} isRTL - Whether the current display language is RTL
 * @returns {string} HTML for language badge
 */
function generateLanguageBadge(lang, isRTL = false) {
  const flag = LANGUAGE_FLAGS[lang] || '🌐';
  const langUpper = lang.toUpperCase();
  const dirAttr = isRTL ? ' dir="ltr"' : '';
  return `<span class="language-badge"${dirAttr} aria-label="${LANGUAGES[lang]?.name || lang} language"><span aria-hidden="true">${flag}</span> ${langUpper}</span>`;
}

/**
 * Generate "Available in" text with language badges
 * @param {Array} languages - Array of language codes
 * @param {string} currentLang - Current display language
 * @returns {string} HTML for available languages display
 */
function generateAvailableLanguages(languages, currentLang) {
  if (!languages || languages.length <= 1) return '';
  
  const isRTL = ['ar', 'he'].includes(currentLang);
  const availableText = AVAILABLE_IN_TRANSLATIONS[currentLang] || 'Available in';
  const badges = languages.map(lang => generateLanguageBadge(lang, isRTL)).join(' ');
  
  return `<p class="available-languages"><strong>${availableText}:</strong> ${badges}</p>`;
}

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
 * 
 * Fixed: regex now properly handles apostrophes and special characters in content
 */
function extractMetaContent(html, property) {
  // Match double-quoted attributes
  const doubleQuotePattern = new RegExp(`<meta\\s+(?:property|name)="${property}"\\s+content="([^"]+)"`, 'i');
  const doubleQuoteMatch = html.match(doubleQuotePattern);
  if (doubleQuoteMatch) return doubleQuoteMatch[1];
  
  // Match single-quoted attributes
  const singleQuotePattern = new RegExp(`<meta\\s+(?:property|name)='${property}'\\s+content='([^']+)'`, 'i');
  const singleQuoteMatch = html.match(singleQuotePattern);
  if (singleQuoteMatch) return singleQuoteMatch[1];
  
  // Try reversed order (content before property/name)
  const reversedDoublePattern = new RegExp(`<meta\\s+content="([^"]+)"\\s+(?:property|name)="${property}"`, 'i');
  const reversedDoubleMatch = html.match(reversedDoublePattern);
  if (reversedDoubleMatch) return reversedDoubleMatch[1];
  
  const reversedSinglePattern = new RegExp(`<meta\\s+content='([^']+)'\\s+(?:property|name)='${property}'`, 'i');
  const reversedSingleMatch = html.match(reversedSinglePattern);
  if (reversedSingleMatch) return reversedSingleMatch[1];
  
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
  
  // Initialize buckets for all 14 supported languages
  const articlesByLang = Object.fromEntries(
    Object.keys(LANGUAGES).map(lang => [lang, []])
  );
  
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
  
  const langCounts = Object.entries(articlesByLang)
    .filter(([, arr]) => arr.length > 0)
    .map(([lang, arr]) => `${lang.toUpperCase()} ${arr.length}`);
  console.log(`  📊 Articles by language: ${langCounts.length > 0 ? langCounts.join(', ') : 'none found'}`);
  
  return articlesByLang;
}

/**
 * Build map of base slugs to available languages for cross-language discovery
 * 
 * Detects articles with the same base slug (e.g., "2026-02-14-week-ahead")
 * across different languages and maps slug -> [language codes].
 * 
 * @param {Object} articlesByLang - Articles grouped by language
 * @returns {Object} Map of slug -> array of language codes
 */
function buildSlugToLanguagesMap(articlesByLang) {
  const slugToLanguages = {};
  
  // Iterate through all articles in all languages
  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach(article => {
      // Strip language suffix from slug to get base slug
      // e.g., "2026-02-14-article-en.html" -> "2026-02-14-article.html"
      const baseSlug = article.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '.html');
      
      if (!slugToLanguages[article.slug]) {
        // Initialize with base slug mapping
        slugToLanguages[article.slug] = [];
      }
      
      // Find all articles with the same base slug across languages
      Object.entries(articlesByLang).forEach(([otherLang, otherArticles]) => {
        otherArticles.forEach(otherArticle => {
          const otherBaseSlug = otherArticle.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '.html');
          
          if (baseSlug === otherBaseSlug && !slugToLanguages[article.slug].includes(otherLang)) {
            slugToLanguages[article.slug].push(otherLang);
          }
        });
      });
    });
  });
  
  return slugToLanguages;
}

/**
 * Get all articles with language information for cross-language discovery
 * 
 * NOTE: This function is currently UNUSED in production but preserved for potential
 * future use. It was implemented for Issue #155's cross-language discovery feature
 * but the requirement changed to language-specific filtering (each index shows only
 * articles in its target language).
 * 
 * If cross-language discovery is needed again, this function can be used instead of
 * passing articlesByLang[langKey] to generateIndexHTML() on line 958.
 * 
 * This function collects ALL articles from all languages and enriches each
 * with metadata about which language versions are available for the same slug.
 * 
 * @param {Object} articlesByLang - Articles grouped by language
 * @returns {Array} All articles with availableLanguages field
 * @deprecated Currently unused - kept for potential future cross-language discovery
 */
function getAllArticlesWithLanguageInfo(articlesByLang) {
  // Build a map of slugs to available languages
  const slugToLanguages = new Map();
  
  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach(article => {
      // Extract base slug (remove language suffix)
      const baseSlug = article.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '');
      
      if (!slugToLanguages.has(baseSlug)) {
        slugToLanguages.set(baseSlug, []);
      }
      slugToLanguages.get(baseSlug).push(lang);
    });
  });
  
  // Collect all articles and enrich with language info
  const allArticles = [];
  
  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach(article => {
      const baseSlug = article.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '');
      const availableLanguages = slugToLanguages.get(baseSlug) || [lang];
      
      allArticles.push({
        ...article,
        availableLanguages: availableLanguages.sort(),
        baseSlug
      });
    });
  });
  
  // Sort by date descending (newest first)
  allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return allArticles;
}

/**
 * Generate index HTML for a specific language
 * 
 * Each language index displays only articles in that specific language.
 * Articles include metadata about which other languages they're available in
 * for cross-language discovery indicators.
 * 
 * @param {string} langKey - Language code (en, sv, etc.)
 * @param {Array} languageArticles - Articles in the target language only
 * @param {Object} allArticlesByLang - All articles grouped by language
 */
function generateIndexHTML(langKey, languageArticles, allArticlesByLang) {
  const lang = LANGUAGES[langKey];
  const f = lang.filters;
  const filename = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
  const mainIndex = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
  const isRTL = ['ar', 'he'].includes(langKey);
  
  // Display only articles in this language
  const displayArticles = languageArticles;
  const needsLanguageNotice = languageArticles.length === 0;
  
  const escapedSubtitle = escapeHtml(lang.subtitle);

  const html = `<!DOCTYPE html>
<html lang="${lang.code}"${lang.rtl ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(lang.title)} - Riksdagsmonitor</title>
  <meta name="description" content="${escapedSubtitle}">
  <meta name="keywords" content="${escapeHtml(lang.keywords)}">
  <meta name="author" content="James Pether Sörling, CISSP, CISM">
  <link rel="canonical" href="https://riksdagsmonitor.com/news/${filename}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(lang.title)} - Riksdagsmonitor">
  <meta property="og:description" content="${escapedSubtitle}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://riksdagsmonitor.com/news/${filename}">
  <meta property="og:image" content="https://hack23.com/cia-icon-140.webp">
  <meta property="og:site_name" content="Riksdagsmonitor">
  <meta property="og:locale" content="${lang.locale}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(lang.title)} - Riksdagsmonitor">
  <meta name="twitter:description" content="${escapedSubtitle}">
  <meta name="twitter:image" content="https://hack23.com/cia-icon-140.webp">
  
  <!-- Hreflang -->
${generateHreflangTags()}
  
  <!-- Schema.org ItemList structured data for article aggregation -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "${escapeHtml(lang.title)}",
    "description": "${escapedSubtitle}",
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
        "name": "${escapeHtml(lang.breadcrumbs.home)}",
        "item": "https://riksdagsmonitor.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${escapeHtml(lang.breadcrumbs.news)}",
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
        "url": "https://hack23.com/cia-icon-140.webp"
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
      <h1>${escapeHtml(lang.title)}</h1>
      <p class="subtitle">${lang.subtitle}</p>
      <a href="../${mainIndex}" class="back-link">\u2190 ${escapeHtml(lang.backLink)}</a>
    </div>
  </header>
  
  <div class="container">
${needsLanguageNotice ? generateLanguageNotice(langKey) : ''}
    
    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label for="filter-type">${f.type}</label>
        <select id="filter-type">
          <option value="all">${escapeHtml(f.allTypes)}</option>
          <option value="prospective">${escapeHtml(f.prospective)}</option>
          <option value="retrospective">${escapeHtml(f.retrospective)}</option>
          <option value="analysis">${escapeHtml(f.analysis)}</option>
          <option value="breaking">${escapeHtml(f.breaking)}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filter-topic">${f.topic}</label>
        <select id="filter-topic">
          <option value="all">${escapeHtml(f.allTopics)}</option>
          <option value="parliament">${escapeHtml(f.parliament)}</option>
          <option value="government">${escapeHtml(f.government)}</option>
          <option value="eu">EU</option>
          <option value="defense">${escapeHtml(f.defense)}</option>
          <option value="environment">${escapeHtml(f.environment)}</option>
          <option value="committees">${escapeHtml(f.committees)}</option>
          <option value="legislation">${escapeHtml(f.legislation)}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filter-sort">${f.sort}</label>
        <select id="filter-sort">
          <option value="date-desc">${escapeHtml(f.newest)}</option>
          <option value="date-asc">${escapeHtml(f.oldest)}</option>
          <option value="title">${escapeHtml(f.titleSort)}</option>
        </select>
      </div>
    </div>
    
    <!-- Articles Grid -->
    <div class="articles-grid" id="articles-grid"></div>
    
    <div id="no-results" style="display: none; text-align: center; padding: 3rem; color: #888;">
      ${escapeHtml(lang.noResults)}
    </div>
  </div>
  
  <script>
    // Language flags mapping (shared with server-side)
    const LANGUAGE_FLAGS = ${JSON.stringify(LANGUAGE_FLAGS)};
    
    // Available in translation (for current language)
    const AVAILABLE_IN_TEXT = '${escapeHtml(AVAILABLE_IN_TRANSLATIONS[langKey] || 'Available in')}';
    
    // Dynamic articles array - generated from news/ directory
    const articles = ${JSON.stringify(displayArticles.map(a => ({
      title: a.title,
      date: a.date,
      type: a.type,
      slug: a.slug,
      lang: a.lang,
      availableLanguages: a.availableLanguages || [a.lang],
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
      
      grid.innerHTML = articlesToRender.map(article => {
        // Generate language badge for the article using shared LANGUAGE_FLAGS
        const flag = LANGUAGE_FLAGS[article.lang] || '🌐';
        const langBadge = \`<span class="language-badge" aria-label="\${article.lang} language"><span aria-hidden="true">\${flag}</span> \${article.lang.toUpperCase()}</span>\`;
        
        // Generate available languages display if multiple languages exist
        const availableLangs = article.availableLanguages || [article.lang];
        let availableDisplay = '';
        if (availableLangs.length > 1) {
          const availableBadges = availableLangs.map(l => {
            const f = LANGUAGE_FLAGS[l] || '🌐';
            return \`<span class="lang-badge-sm"><span aria-hidden="true">\${f}</span> \${l.toUpperCase()}</span>\`;
          }).join(' ');
          availableDisplay = \`<p class="available-languages"><strong>\${AVAILABLE_IN_TEXT}:</strong> \${availableBadges}</p>\`;
        }
        
        return \`
        <article class="article-card">
          <div class="article-meta">
            <time class="article-date" datetime="\${article.date}">\${formatDate(article.date)}</time>
            <span class="article-type">\${localizeType(article.type)}</span>
            \${langBadge}
          </div>
          <h2 class="article-title">
            <a href="\${article.slug}">\${article.title}</a>
          </h2>
          <p class="article-excerpt">\${article.excerpt}</p>
          \${availableDisplay}
          <div class="article-tags">
            \${article.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
          </div>
        </article>
      \`;
      }).join('');
    }
    
    const typeLabels = ${JSON.stringify({
      prospective: f.prospective,
      retrospective: f.retrospective,
      analysis: f.analysis,
      breaking: f.breaking
    })};
    
    function localizeType(type) {
      return typeLabels[type] || type;
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

  <!-- Dynamic Content Loader -->
  <script>
    // Localization data
    const i18n = {
      noArticles: '${lang.i18n.noArticles}',
      loading: '${lang.i18n.loading}',
      articleCount: ${lang.i18n.articleCount}
    };
    
    // Dynamic content loader
    document.addEventListener('DOMContentLoaded', () => {
      const articlesGrid = document.querySelector('.articles-grid');
      if (!articlesGrid) return;
      
      const articleCards = articlesGrid.querySelectorAll('.article-card');
      const articleCount = articleCards.length;
      
      // Update article count if element exists
      const countElement = document.querySelector('.article-count');
      if (countElement) {
        countElement.textContent = i18n.articleCount(articleCount);
      }
      
      // Show no articles message if empty
      if (articleCount === 0) {
        articlesGrid.innerHTML = \`<p class="no-articles">\${i18n.noArticles}</p>\`;
      }
    });
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
  
  // Build slug-to-languages map for cross-language discovery
  const slugToLanguages = buildSlugToLanguagesMap(articlesByLang);
  
  // Generate index for each language
  console.log('\n📝 Generating index files...');
  
  let successCount = 0;
  let errorCount = 0;
  
  Object.keys(LANGUAGES).forEach(langKey => {
    try {
      const filename = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
      const filePath = path.join(NEWS_DIR, filename);
      
      // Use language-specific articles and enrich with availableLanguages
      const languageArticles = articlesByLang[langKey] || [];
      
      // Enrich each article with availableLanguages for cross-language discovery
      const enrichedArticles = languageArticles.map(article => ({
        ...article,
        availableLanguages: slugToLanguages[article.slug] || [article.lang]
      }));
      
      const html = generateIndexHTML(langKey, enrichedArticles, articlesByLang);
      fs.writeFileSync(filePath, html, 'utf-8');
      
      console.log(`  ✅ Generated: ${filename} (${languageArticles.length} articles)`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to generate ${langKey}:`, error.message);
      errorCount++;
    }
  });
  
  console.log('\n✨ Generation complete!');
  console.log(`  ✅ Success: ${successCount} files`);
  console.log(`  ❌ Errors: ${errorCount} files`);
  const totalArticles = Object.values(articlesByLang).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`  📊 Total articles: ${totalArticles}`);
  
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

export { 
  generateAllIndexes, 
  parseArticleMetadata, 
  scanNewsArticles,
  getAllArticlesWithLanguageInfo,
  generateLanguageBadge,
  generateAvailableLanguages
};
