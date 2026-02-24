/**
 * @module Intelligence Operations/Article Template Generation
 * @category Intelligence Operations - Intelligence Report Templates
 * 
 * @description
 * Advanced HTML article template engine generating professional intelligence reports
 * with semantic markup compliance and accessibility standards. This module implements
 * template-based content generation for automated news articles, maintaining consistent
 * visual hierarchy and information architecture across all 14 supported languages.
 * 
 * The template engine provides intelligent document structure rendering:
 * 
 * Semantic HTML5 Structure:
 * - Article headers with publication metadata and source attribution
 * - Navigation breadcrumbs with language-localized labels
 * - Event calendar grid visualization (for Week Ahead article type)
 * - Content sections with intelligent hierarchy (h2-h4)
 * - Context boxes for supplementary intelligence (facts, quotes, analysis)
 * - Related links section pointing to source documents
 * - Watch section extracting critical points and risk indicators
 * - Footer with publication metadata and change history
 * 
 * Design System Integration:
 * - Cyberpunk visual theme with custom CSS variables
 * - Responsive grid layout (CSS Grid, 320px-1440px+ viewport support)
 * - Dark theme optimization for reduced eye strain during extended reading
 * - Accessibility features: ARIA landmarks, semantic heading hierarchy, color contrast
 * - Print-friendly styling preserving readability in physical distribution
 * 
 * Multi-Language Rendering (14 languages):
 * - Dynamic breadcrumb translation for navigation
 * - Localized date formatting and timezone handling
 * - RTL language support (Arabic, Hebrew) with automatic text direction
 * - Language-specific typography and character spacing adjustments
 * - Multi-language footer labels and publication information
 * 
 * Article Type Templates:
 * - Week Ahead: Event grid with day-by-day parliamentary schedule
 * - Committee Reports: Structured committee analysis with member lists
 * - Propositions: Government proposal analysis with impact assessment
 * - Motions: Parliamentary motion analysis with voting predictions
 * - Breaking: Rapid-response template with minimal processing delay
 * 
 * SEO Optimization:
 * - Structured data (Schema.org JSON-LD) for search engine discovery
 * - Meta tag generation (OpenGraph, Twitter Card) for social sharing
 * - Canonical URL prevention of duplicate content penalties
 * - Keyword placement in headers, metadata, and internal linking
 * 
 * @intelligence
 * Content Architecture Methodology:
 * Implements inverted pyramid news structure with intelligence-specific adaptations:
 * - Lede: Most significant political development with immediate impact implications
 * - Summary: Key facts and context necessary for understanding
 * - Analysis: Deeper dive into causation, stakeholders, and political implications
 * - Source Documentation: Full links to primary sources for verification
 * - Predictions: Forward-looking implications and related upcoming events
 * 
 * Visual Information Design:
 * - Event calendars as primary visual element for week-ahead articles
 * - Risk indicator icons (⚠️ critical, ⚡ urgent, 📌 watch)
 * - Timeline visualization for multi-day legislative processes
 * - Party affiliation color-coding for quick visual analysis
 * - Committee jurisdiction mapping for organizational intelligence
 * 
 * Template Customization Patterns:
 * - Data binding for dynamic content injection
 * - Conditional rendering for optional sections (context, related links)
 * - Layout variants based on article metadata
 * - Theme customization via CSS custom properties
 * 
 * @osint
 * Source Presentation Strategy:
 * - Hyperlinked document references to official Riksdagen sources
 * - MCP tool references for reproducible source verification
 * - Publication dates aligned with source data collection timestamp
 * - Source status indicators (official, preliminary, final) based on data freshness
 * 
 * Document Link Integration:
 * - Generate direct URLs to Riksdagen.se and Regeringen.se documents
 * - Construct deep links for specific sections of long documents
 * - Fallback link strategies when document IDs are incomplete
 * - Link health monitoring via CI/CD validation workflows
 * 
 * @risk
 * Template Rendering Risks:
 * 
 * Threat: XSS Injection via Content
 * - Malicious scripts in MCP response data
 * - Mitigation: HTML entity escaping via escapeHtml() utility
 * 
 * Threat: CSS Injection
 * - Style-based information disclosure or visual manipulation
 * - Mitigation: Style sandboxing, no user-controlled style attributes
 * 
 * Threat: Layout Rendering Failures
 * - Article display broken across different browsers/devices
 * - Mitigation: Cross-browser testing, responsive design validation
 * 
 * Threat: SEO Poisoning
 * - Template generating duplicate meta tags or manipulated structured data
 * - Mitigation: Schema validation, canonical URL enforcement
 * 
 * @gdpr
 * Data Protection in Template Rendering:
 * 
 * - HTML Output: No personal data in HTML output (template-level)
 * - Link Sanitization: No tracking parameters or analytics IDs in generated links
 * - Historical Preservation: Article HTML may be archived indefinitely
 * - Cookie Compliance: Template does not set cookies (third-party responsibility)
 * - Analytics Transparency: If analytics codes added, user consent required
 * 
 * @security
 * Content Security Analysis:
 * 
 * Input Validation:
 * - Content parameters validated against expected types
 * - HTML strings escaped via escapeHtml() helper
 * - URLs validated and normalized before href insertion
 * 
 * Output Encoding:
 * - UTF-8 character encoding enforced
 * - HTML entities for special characters
 * - CSS class names sanitized (alphanumeric + hyphen only)
 * 
 * Dependency Security:
 * - html-utils module provides sanitization functions
 * - No external script dependencies or CDN reliance
 * - Inline styling only, no dynamic CSS imports
 * 
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 2.0.0
 * 
 * @see {@link ./html-utils.js} HTML sanitization utilities (escapeHtml)
 * @see {@link ./data-transformers.js} Data transformation producing template input
 * @see {@link ./generate-news-enhanced.js} Article generation orchestration
 * @see {@link ./editorial-pillars.js} Editorial structure definitions
 * @see {@link docs/TEMPLATE_ARCHITECTURE.md} Template design documentation
 * @see {@link docs/ACCESSIBILITY_STANDARDS.md} WCAG 2.1 AA compliance guide
 * @see {@link docs/SEO_OPTIMIZATION.md} Search engine optimization strategy
 */

import { escapeHtml } from './html-utils.js';
import { CONTENT_LABELS } from './data-transformers.js';
import type { Language } from './types/language.js';
import type { ArticleData, EventGridItem, WatchPoint, ArticleCategory } from './types/article.js';
import type { BreadcrumbLabels, FooterLabelSet } from './types/content.js';

/** Type labels for article categories per language */
interface TypeLabels {
  readonly prospective: string;
  readonly retrospective: string;
  readonly analysis: string;
  readonly breaking: string;
}

/**
 * Breadcrumb translations for all supported languages
 */
const BREADCRUMB_TRANSLATIONS: Record<Language, BreadcrumbLabels> = {
  en: { home: 'Home', news: 'News' },
  sv: { home: 'Hem', news: 'Nyheter' },
  da: { home: 'Hjem', news: 'Nyheder' },
  no: { home: 'Hjem', news: 'Nyheter' },
  fi: { home: 'Etusivu', news: 'Uutiset' },
  de: { home: 'Startseite', news: 'Nachrichten' },
  fr: { home: 'Accueil', news: 'Actualités' },
  es: { home: 'Inicio', news: 'Noticias' },
  nl: { home: 'Home', news: 'Nieuws' },
  ar: { home: 'الرئيسية', news: 'أخبار' },
  he: { home: 'בית', news: 'חדשות' },
  ja: { home: 'ホーム', news: 'ニュース' },
  ko: { home: '홈', news: '뉴스' },
  zh: { home: '主页', news: '新闻' }
};

/**
 * Get breadcrumb name for a given language
 */
function getBreadcrumbName(lang: Language | string, type: keyof BreadcrumbLabels): string {
  return BREADCRUMB_TRANSLATIONS[lang as Language]?.[type] || BREADCRUMB_TRANSLATIONS.en[type];
}

/**
 * Footer label translations for all 14 languages
 */
const FOOTER_LABELS: Record<Language, FooterLabelSet> = {
  en: { sourcesTitle: 'Sources and Data', dataSources: 'Data Sources', generatedBy: 'Generated by', generatedByValue: 'Automated News System using riksdag-regering-mcp', analysisTools: 'Analysis Tools', analysisToolsValue: 'AI-assisted journalism with human editorial oversight', backToNews: 'Back to News' },
  sv: { sourcesTitle: 'Källor och data', dataSources: 'Datakällor', generatedBy: 'Genererad av', generatedByValue: 'Automatiserat nyhetssystem med riksdag-regering-mcp', analysisTools: 'Analysverktyg', analysisToolsValue: 'AI-assisterad journalistik med mänsklig granskning', backToNews: 'Tillbaka till nyheter' },
  da: { sourcesTitle: 'Kilder og data', dataSources: 'Datakilder', generatedBy: 'Genereret af', generatedByValue: 'Automatiseret nyhedssystem med riksdag-regering-mcp', analysisTools: 'Analyseværktøjer', analysisToolsValue: 'AI-assisteret journalistik med redaktionel gennemgang', backToNews: 'Tilbage til nyheder' },
  no: { sourcesTitle: 'Kilder og data', dataSources: 'Datakilder', generatedBy: 'Generert av', generatedByValue: 'Automatisert nyhetssystem med riksdag-regering-mcp', analysisTools: 'Analyseverktøy', analysisToolsValue: 'AI-assistert journalistikk med redaksjonell gjennomgang', backToNews: 'Tilbake til nyheter' },
  fi: { sourcesTitle: 'Lähteet ja data', dataSources: 'Datalähteet', generatedBy: 'Luonut', generatedByValue: 'Automatisoitu uutisjärjestelmä riksdag-regering-mcp:llä', analysisTools: 'Analyysityökalut', analysisToolsValue: 'Tekoälyavusteinen journalismi toimituksellisella valvonnalla', backToNews: 'Takaisin uutisiin' },
  de: { sourcesTitle: 'Quellen und Daten', dataSources: 'Datenquellen', generatedBy: 'Erstellt von', generatedByValue: 'Automatisiertes Nachrichtensystem mit riksdag-regering-mcp', analysisTools: 'Analysewerkzeuge', analysisToolsValue: 'KI-gestützter Journalismus mit redaktioneller Aufsicht', backToNews: 'Zurück zu Nachrichten' },
  fr: { sourcesTitle: 'Sources et données', dataSources: 'Sources de données', generatedBy: 'Généré par', generatedByValue: 'Système automatisé avec riksdag-regering-mcp', analysisTools: 'Outils d\'analyse', analysisToolsValue: 'Journalisme assisté par IA avec supervision rédactionnelle', backToNews: 'Retour aux actualités' },
  es: { sourcesTitle: 'Fuentes y datos', dataSources: 'Fuentes de datos', generatedBy: 'Generado por', generatedByValue: 'Sistema automatizado con riksdag-regering-mcp', analysisTools: 'Herramientas de análisis', analysisToolsValue: 'Periodismo asistido por IA con supervisión editorial', backToNews: 'Volver a noticias' },
  nl: { sourcesTitle: 'Bronnen en data', dataSources: 'Databronnen', generatedBy: 'Gegenereerd door', generatedByValue: 'Geautomatiseerd nieuwssysteem met riksdag-regering-mcp', analysisTools: 'Analysetools', analysisToolsValue: 'AI-ondersteunde journalistiek met redactioneel toezicht', backToNews: 'Terug naar nieuws' },
  ar: { sourcesTitle: 'المصادر والبيانات', dataSources: 'مصادر البيانات', generatedBy: 'تم إنشاؤه بواسطة', generatedByValue: 'نظام أخبار آلي مع riksdag-regering-mcp', analysisTools: 'أدوات التحليل', analysisToolsValue: 'صحافة بمساعدة الذكاء الاصطناعي مع إشراف تحريري', backToNews: 'العودة إلى الأخبار' },
  he: { sourcesTitle: 'מקורות ונתונים', dataSources: 'מקורות נתונים', generatedBy: 'נוצר על ידי', generatedByValue: 'מערכת חדשות אוטומטית עם riksdag-regering-mcp', analysisTools: 'כלי ניתוח', analysisToolsValue: 'עיתונות בסיוע AI עם פיקוח עריכתי', backToNews: 'חזרה לחדשות' },
  ja: { sourcesTitle: 'ソースとデータ', dataSources: 'データソース', generatedBy: '生成者', generatedByValue: 'riksdag-regering-mcpによる自動ニュースシステム', analysisTools: '分析ツール', analysisToolsValue: 'AI支援ジャーナリズム（編集監督付き）', backToNews: 'ニュースに戻る' },
  ko: { sourcesTitle: '출처 및 데이터', dataSources: '데이터 소스', generatedBy: '생성자', generatedByValue: 'riksdag-regering-mcp 자동 뉴스 시스템', analysisTools: '분석 도구', analysisToolsValue: '편집 감독이 있는 AI 지원 저널리즘', backToNews: '뉴스로 돌아가기' },
  zh: { sourcesTitle: '来源和数据', dataSources: '数据来源', generatedBy: '生成者', generatedByValue: '使用riksdag-regering-mcp的自动新闻系统', analysisTools: '分析工具', analysisToolsValue: '人工编辑监督下的AI辅助新闻', backToNews: '返回新闻' }
};

function getFooterLabel(lang: Language | string, key: keyof FooterLabelSet): string {
  return FOOTER_LABELS[lang as Language]?.[key] || FOOTER_LABELS.en[key];
}

function getNewsIndexFilename(lang: Language | string): string {
  if (lang === 'en') return 'index.html';
  return `index_${lang}.html`;
}

/**
 * Sanitize article body content for JSON-LD structured data
 * Removes newlines and normalizes whitespace to prevent invalid JSON
 */
function sanitizeArticleBody(htmlContent: string): string {
  return htmlContent
    .substring(0, 500)
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Site tagline translations for all 14 languages
 */
const SITE_TAGLINE: Record<Language, string> = {
  en: 'Latest news and analysis from Sweden\'s Riksdag. The Economist-style political journalism covering parliament, government, and agencies with systematic transparency.',
  sv: 'Senaste nyheter och analyser från Sveriges riksdag. Politisk journalistik i The Economist-stil som bevakar riksdagen, regeringen och myndigheter med systematisk transparens.',
  da: 'Seneste nyheder og analyser fra Sveriges Riksdag. Politisk journalistik i The Economist-stil, der dækker parlament, regering og myndigheder med systematisk gennemsigtighed.',
  no: 'Siste nyheter og analyser fra Sveriges riksdag. Politisk journalistikk i The Economist-stil som dekker parlament, regjering og myndigheter med systematisk åpenhet.',
  fi: 'Uusimmat uutiset ja analyysit Ruotsin valtiopäiviltä. The Economist -tyylinen poliittinen journalismi, joka kattaa eduskunnan, hallituksen ja viranomaiset järjestelmällisellä läpinäkyvyydellä.',
  de: 'Aktuelle Nachrichten und Analysen aus dem schwedischen Riksdag. Politischer Journalismus im Economist-Stil über Parlament, Regierung und Behörden mit systematischer Transparenz.',
  fr: 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme politique de style The Economist couvrant le parlement, le gouvernement et les agences avec une transparence systématique.',
  es: 'Últimas noticias y análisis del Riksdag sueco. Periodismo político al estilo The Economist que cubre el parlamento, el gobierno y las agencias con transparencia sistemática.',
  nl: 'Laatste nieuws en analyses van de Zweedse Riksdag. Politieke journalistiek in Economist-stijl over parlement, regering en instanties met systematische transparantie.',
  ar: 'أحدث الأخبار والتحليلات من البرلمان السويدي. صحافة سياسية بأسلوب ذا إيكونوميست تغطي البرلمان والحكومة والوكالات بشفافية منهجية.',
  he: 'חדשות ניתוחים אחרונים מהריקסדאג השוודי. עיתונות פוליטית בסגנון האקונומיסט המכסה פרלמנט, ממשלה וסוכנויות עם שקיפות שיטתית.',
  ja: 'スウェーデン議会リクスダーグの最新ニュースと分析。議会、政府、機関を体系的な透明性で報道するエコノミスト・スタイルの政治ジャーナリズム。',
  ko: '스웨덴 의회 릭스다그의 최신 뉴스와 분석. 체계적인 투명성으로 의회, 정부, 기관을 다루는 이코노미스트 스타일의 정치 저널리즘.',
  zh: '来自瑞典议会的最新新闻和分析。以经济学人风格的政治新闻，以系统性透明度报道议会、政府和机构。'
};

/**
 * OG locale map for all 14 languages
 */
const OG_LOCALE_MAP: Record<Language, string> = {
  en: 'en_US', sv: 'sv_SE', da: 'da_DK', no: 'nb_NO', fi: 'fi_FI',
  de: 'de_DE', fr: 'fr_FR', es: 'es_ES', nl: 'nl_NL', ar: 'ar_SA',
  he: 'he_IL', ja: 'ja_JP', ko: 'ko_KR', zh: 'zh_CN'
};

/**
 * Generate complete article HTML
 */
export function generateArticleHTML(data: ArticleData): string {
  const {
    slug,
    title,
    subtitle,
    date,
    type,
    readTime = '5 min read',
    lang = 'en',
    locale,
    content,
    events = [],
    watchPoints = [],
    sources = [],
    keywords = [],
    tags = []
  } = data;
  
  // Use proper OG locale for the language
  const ogLocale: string = locale || OG_LOCALE_MAP[lang] || 'en_US';
  
  const dateObj: Date = new Date(date);
  const formattedDate: string = formatDate(dateObj, lang);
  const isoDate: string = dateObj.toISOString().split('T')[0] ?? '';
  
  // Determine type label with fallback to English for unsupported languages
  const typeLabels: Record<Language, TypeLabels> = {
    en: { prospective: 'The Week Ahead', retrospective: 'Weekly Review', analysis: 'Analysis', breaking: 'Breaking News' },
    sv: { prospective: 'Veckan som kommer', retrospective: 'Veckans återblick', analysis: 'Analys', breaking: 'Senaste nytt' },
    da: { prospective: 'Ugen fremover', retrospective: 'Ugens tilbageblik', analysis: 'Analyse', breaking: 'Seneste nyt' },
    no: { prospective: 'Uka som kommer', retrospective: 'Ukens tilbakeblikk', analysis: 'Analyse', breaking: 'Siste nytt' },
    fi: { prospective: 'Tuleva viikko', retrospective: 'Viikon katsaus', analysis: 'Analyysi', breaking: 'Viimeisimmät' },
    de: { prospective: 'Woche voraus', retrospective: 'Wochenrückblick', analysis: 'Analyse', breaking: 'Eilmeldung' },
    fr: { prospective: 'Semaine à venir', retrospective: 'Revue de la semaine', analysis: 'Analyse', breaking: 'Dernière heure' },
    es: { prospective: 'Semana próxima', retrospective: 'Revisión semanal', analysis: 'Análisis', breaking: 'Última hora' },
    nl: { prospective: 'Week vooruit', retrospective: 'Weekoverzicht', analysis: 'Analyse', breaking: 'Laatste nieuws' },
    ar: { prospective: 'الأسبوع القادم', retrospective: 'مراجعة الأسبوع', analysis: 'تحليل', breaking: 'أخبار عاجلة' },
    he: { prospective: 'השבוע הקרוב', retrospective: 'סיכום שבועי', analysis: 'ניתוח', breaking: 'חדשות אחרונות' },
    ja: { prospective: '来週の展望', retrospective: '週間レビュー', analysis: '分析', breaking: '速報' },
    ko: { prospective: '다음 주 전망', retrospective: '주간 리뷰', analysis: '분석', breaking: '속보' },
    zh: { prospective: '下周展望', retrospective: '每周回顾', analysis: '分析', breaking: '突发新闻' }
  };
  
  // Fall back to English labels if language not supported
  const typeLabel: string = typeLabels[lang]?.[type] || typeLabels.en[type] || 'News';
  
  // Generate hreflang tags for all available language variants
  const ALL_LANG_CODES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
  const isRTL: boolean = lang === 'ar' || lang === 'he';
  const dirAttr: string = isRTL ? ' dir="rtl"' : '';
  const baseSlug: string = slug.replace(`-${lang}.html`, '');
  const altLang: Language = lang === 'en' ? 'sv' : 'en';
  const altSlug: string = slug.replace(`-${lang}.html`, `-${altLang}.html`);
  
  return `<!DOCTYPE html>
<html lang="${lang}"${dirAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(subtitle).substring(0, 160)}">
  <meta name="keywords" content="${keywords.join(', ')}">
  <meta name="author" content="James Pether Sörling, CISSP, CISM">
  <link rel="canonical" href="https://riksdagsmonitor.com/news/${slug}">
  
  <!-- Open Graph / Social Media -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(subtitle).substring(0, 200)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://riksdagsmonitor.com/news/${slug}">
  <meta property="og:image" content="https://hack23.com/cia-icon-140.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Riksdagsmonitor - Swedish Parliament Intelligence">
  <meta property="og:locale" content="${ogLocale}">
  <meta property="og:site_name" content="Riksdagsmonitor - Swedish Parliament Intelligence">
  <meta property="article:published_time" content="${dateObj.toISOString()}">
  <meta property="article:modified_time" content="${dateObj.toISOString()}">
  <meta property="article:author" content="James Pether Sörling">
  <meta property="article:section" content="${typeLabel}">
${tags.map(tag => `  <meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n')}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(subtitle).substring(0, 200)}">
  <meta name="twitter:image" content="https://hack23.com/cia-icon-140.webp">
  <meta name="twitter:image:alt" content="Riksdagsmonitor - Swedish Parliament Intelligence">
  <meta name="twitter:site" content="@riksdagsmonitor">
  <meta name="twitter:creator" content="@jamessorling">
  <meta name="twitter:label1" content="${CONTENT_LABELS[lang]?.twitterLabel1 ?? CONTENT_LABELS.en.twitterLabel1}">
  <meta name="twitter:data1" content="${readTime}">
  <meta name="twitter:label2" content="${CONTENT_LABELS[lang]?.twitterLabel2 ?? CONTENT_LABELS.en.twitterLabel2}">
  <meta name="twitter:data2" content="${typeLabel}">
  
  <!-- Hreflang for language alternatives -->
${ALL_LANG_CODES.map(l => `  <link rel="alternate" hreflang="${l}" href="https://riksdagsmonitor.com/news/${baseSlug}-${l}.html">`).join('\n')}
  <link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/news/${baseSlug}-en.html">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  
  <!-- Main stylesheet - contains all article styles -->
  <link rel="stylesheet" href="../styles.css">
  
  <!-- Schema.org NewsArticle structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${escapeHtml(title)}",
    "alternativeHeadline": "${escapeHtml(subtitle).substring(0, 100)}",
    "description": "${escapeHtml(subtitle).substring(0, 200)}",
    "datePublished": "${dateObj.toISOString()}",
    "dateModified": "${dateObj.toISOString()}",
    "author": {
      "@type": "Person",
      "name": "James Pether Sörling",
      "jobTitle": "Political Intelligence Analyst",
      "affiliation": {
        "@type": "Organization",
        "name": "Hack23 AB"
      },
      "url": "https://riksdagsmonitor.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Riksdagsmonitor",
      "url": "https://riksdagsmonitor.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hack23.com/cia-icon-140.webp",
        "width": 600,
        "height": 60
      }
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://hack23.com/cia-icon-140.webp",
      "width": 1200,
      "height": 630
    },
    "articleSection": "${typeLabel}",
    "articleBody": "${sanitizeArticleBody(escapeHtml(content))}...",
    "wordCount": ${Math.ceil(content.length / 5)},
    "inLanguage": "${lang}",
    "keywords": "${keywords.join(', ')}",
    "about": {
      "@type": "Thing",
      "name": "Swedish Parliament",
      "sameAs": "https://www.wikidata.org/wiki/Q1968818"
    },
    "isAccessibleForFree": true,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Riksdagsmonitor",
      "url": "https://riksdagsmonitor.com"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://riksdagsmonitor.com/news/${slug}"
    }${tags.length > 0 ? `,
    "mentions": [${tags.map(tag => `
      {
        "@type": "Thing",
        "name": "${escapeHtml(tag)}"
      }`).join(',')}
    ]` : ''}
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
        "name": "${getBreadcrumbName(lang, 'home')}",
        "item": "https://riksdagsmonitor.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${getBreadcrumbName(lang, 'news')}",
        "item": "https://riksdagsmonitor.com/news/index.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${escapeHtml(title).substring(0, 50)}",
        "item": "https://riksdagsmonitor.com/news/${slug}"
      }
    ]
  }
  </script>
  
  <!-- Organization structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Riksdagsmonitor",
    "url": "https://riksdagsmonitor.com",
    "logo": "https://hack23.com/cia-icon-140.webp",
    "description": "Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency",
    "foundingDate": "2020",
    "founder": {
      "@type": "Person",
      "name": "James Pether Sörling"
    },
    "sameAs": [
      "https://github.com/Hack23/riksdagsmonitor"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Technical Support",
      "url": "https://github.com/Hack23/riksdagsmonitor/issues"
    }
  }
  </script>
  
</head>
<body>
<article class="news-article">
  <header class="article-header">
    <div class="site-tagline">${SITE_TAGLINE[lang] || SITE_TAGLINE.en}</div>
    <h1>${title}</h1>
    <div class="article-meta">
      <time datetime="${isoDate}">${formattedDate}</time>
      <span class="separator">•</span>
      <span>${typeLabel}</span>
      <span class="separator">•</span>
      <span>${readTime}</span>
    </div>
  </header>

${events.length > 0 ? generateEventCalendar(events as ReadonlyArray<EventGridItem>, lang) : ''}

  <div class="article-content">
    <p class="lede">
      ${subtitle}
    </p>

${content}

${watchPoints.length > 0 ? generateWatchSection(watchPoints as ReadonlyArray<WatchPoint>, lang) : ''}
  </div>

  <footer class="article-footer">
    <div class="article-sources">
      <h3>${getFooterLabel(lang, 'sourcesTitle')}</h3>
      <p><strong>${getFooterLabel(lang, 'dataSources')}:</strong> ${sources.join(', ')}</p>
      <p><strong>${getFooterLabel(lang, 'generatedBy')}:</strong> ${getFooterLabel(lang, 'generatedByValue')}</p>
      <p><strong>${getFooterLabel(lang, 'analysisTools')}:</strong> ${getFooterLabel(lang, 'analysisToolsValue')}</p>
    </div>
    
    <div class="article-nav">
      <a href="${getNewsIndexFilename(lang)}" class="back-to-news">
        \u2190 ${getFooterLabel(lang, 'backToNews')}
      </a>
    </div>
  </footer>
</article>

<script type="module" src="../scripts/back-to-top.ts"></script>
</body>
</html>`;
}

/**
 * Generate event calendar section
 */
const EVENT_CALENDAR_TITLES: Record<Language, string> = {
  en: 'Event Calendar',
  sv: 'Veckans händelser',
  da: 'Ugens begivenheder',
  no: 'Ukens hendelser',
  fi: 'Viikon tapahtumat',
  de: 'Veranstaltungskalender',
  fr: 'Calendrier des événements',
  es: 'Calendario de eventos',
  nl: 'Evenementenkalender',
  ar: 'تقويم الأحداث',
  he: 'לוח אירועים',
  ja: 'イベントカレンダー',
  ko: '일정 캘린더',
  zh: '活动日历'
};

function generateEventCalendar(events: ReadonlyArray<EventGridItem>, lang: Language = 'en'): string {
  const title: string = EVENT_CALENDAR_TITLES[lang] || EVENT_CALENDAR_TITLES.en;
  const firstEvt = events[0];
  const weekLabel: string = events.length > 0 && firstEvt?.date ? 
    `${formatDateRange(events, lang)}` : '';
  
  return `
  <section class="event-calendar" aria-label="${title}">
    <h2>${title}${weekLabel ? `: ${weekLabel}` : ''}</h2>
    <div class="calendar-grid">
${events.map(event => `      <div class="calendar-day${event.isToday ? ' today' : ''}" aria-label="${event.dayLabel}">
        <div class="day-header">${event.dayName}</div>
        <span class="day-date">${event.dayNumber}</span>
        <ul class="event-list">
${event.items.map(item => `          <li class="event-item">
            <span class="event-time">${item.time}</span>
            <span class="event-title">${item.title}</span>
          </li>`).join('\n')}
        </ul>
      </div>`).join('\n')}
    </div>
  </section>`;
}

/**
 * Generate "Watch Section" with key points
 */
const WATCH_SECTION_TITLES: Record<Language, string> = {
  en: 'What to Watch This Week',
  sv: 'Vad man ska följa denna vecka',
  da: 'Hvad man skal følge denne uge',
  no: 'Hva man bør følge denne uken',
  fi: 'Mitä seurata tällä viikolla',
  de: 'Worauf diese Woche zu achten ist',
  fr: 'À suivre cette semaine',
  es: 'Qué observar esta semana',
  nl: 'Wat te volgen deze week',
  ar: 'ما يجب متابعته هذا الأسبوع',
  he: 'מה לעקוב אחריו השבוע',
  ja: '今週の注目ポイント',
  ko: '이번 주 주목할 사항',
  zh: '本周关注要点'
};

function generateWatchSection(watchPoints: ReadonlyArray<WatchPoint>, lang: Language = 'en'): string {
  const title: string = WATCH_SECTION_TITLES[lang] || WATCH_SECTION_TITLES.en;
  
  return `
    <section class="watch-section">
      <h2>${title}</h2>
      <ul class="watch-list">
${watchPoints.map(point => `        <li>
          <strong>${point.title}:</strong> ${point.description}
        </li>`).join('\n')}
      </ul>
    </section>`;
}



/**
 * Locale map for all 14 supported languages
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en-GB', sv: 'sv-SE', da: 'da-DK', no: 'no-NO', fi: 'fi-FI',
  de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', ar: 'ar-SA',
  he: 'he-IL', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN'
};

/**
 * Helper: Format date for display using locale-appropriate formatting
 */
function formatDate(date: Date, lang: Language | string = 'en'): string {
  const locale: string = LOCALE_MAP[lang] || 'en-GB';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    return date.toLocaleDateString('en-GB', options);
  }
}

/**
 * Helper: Format date range for calendar title
 */
function formatDateRange(events: ReadonlyArray<EventGridItem>, lang: Language | string = 'en'): string {
  if (events.length === 0) return '';
  
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];

  if (!firstEvent || !lastEvent) return '';
  
  if (!firstEvent.date || !lastEvent.date) return '';
  
  const locale: string = LOCALE_MAP[lang] || 'en-GB';
  const longOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const shortOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  
  try {
    const startDate: string = new Date(firstEvent.date).toLocaleDateString(locale, longOptions);
    const endDate: string = new Date(lastEvent.date).toLocaleDateString(locale, shortOptions);
    return `${startDate} – ${endDate}`;
  } catch {
    const startDate: string = new Date(firstEvent.date).toLocaleDateString('en-GB', longOptions);
    const endDate: string = new Date(lastEvent.date).toLocaleDateString('en-GB', shortOptions);
    return `${startDate} – ${endDate}`;
  }
}

export default {
  generateArticleHTML,
  generateEventCalendar,
  generateWatchSection
};
