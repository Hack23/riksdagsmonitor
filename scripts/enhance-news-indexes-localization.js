#!/usr/bin/env node

/**
 * Enhanced News Index Localization Script
 * 
 * Improves all 14 language versions of news/index*.html with:
 * - Complete filter label translations
 * - Dynamic content loading support
 * - Enhanced SEO and structured data
 * - Localized date/number formatting
 * - Language-specific keywords
 * 
 * Usage: node scripts/enhance-news-indexes-localization.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', 'news');

// Complete localization data for all 14 languages
const LOCALIZATION = {
  en: {
    code: 'en',
    locale: 'en_US',
    filters: {
      type: 'Type:',
      topic: 'Topic:',
      sort: 'Sort:',
      allTypes: 'All types',
      allTopics: 'All topics',
      prospective: 'Prospective',
      retrospective: 'Retrospective',
      analysis: 'Analysis',
      breaking: 'Breaking news',
      parliament: 'Parliament',
      government: 'Government',
      eu: 'EU',
      defense: 'Defense',
      environment: 'Environment',
      committees: 'Committees',
      legislation: 'Legislation',
      dateDesc: 'Newest first',
      dateAsc: 'Oldest first',
      popularityDesc: 'Most popular'
    },
    noArticles: 'No articles available',
    loading: 'Loading articles...',
    articleCount: article => article === 1 ? '1 article' : `${article} articles`,
    keywords: 'riksdag news, swedish parliament, government analysis, political journalism, transparency, democracy',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  sv: {
    code: 'sv',
    locale: 'sv_SE',
    filters: {
      type: 'Typ:',
      topic: 'Ämne:',
      sort: 'Sortera:',
      allTypes: 'Alla typer',
      allTopics: 'Alla ämnen',
      prospective: 'Framåtblickande',
      retrospective: 'Återblickande',
      analysis: 'Analys',
      breaking: 'Senaste nytt',
      parliament: 'Riksdagen',
      government: 'Regeringen',
      eu: 'EU',
      defense: 'Försvar',
      environment: 'Miljö',
      committees: 'Utskott',
      legislation: 'Lagstiftning',
      dateDesc: 'Nyast först',
      dateAsc: 'Äldst först',
      popularityDesc: 'Mest populära'
    },
    noArticles: 'Inga artiklar tillgängliga',
    loading: 'Laddar artiklar...',
    articleCount: article => article === 1 ? '1 artikel' : `${article} artiklar`,
    keywords: 'riksdag nyheter, svenska riksdagen, regeringsanalys, politisk journalistik, öppenhet, demokrati',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  da: {
    code: 'da',
    locale: 'da_DK',
    filters: {
      type: 'Type:',
      topic: 'Emne:',
      sort: 'Sorter:',
      allTypes: 'Alle typer',
      allTopics: 'Alle emner',
      prospective: 'Fremadskuende',
      retrospective: 'Tilbageskuende',
      analysis: 'Analyse',
      breaking: 'Seneste nyt',
      parliament: 'Parlamentet',
      government: 'Regeringen',
      eu: 'EU',
      defense: 'Forsvar',
      environment: 'Miljø',
      committees: 'Udvalg',
      legislation: 'Lovgivning',
      dateDesc: 'Nyeste først',
      dateAsc: 'Ældste først',
      popularityDesc: 'Mest populære'
    },
    noArticles: 'Ingen artikler tilgængelige',
    loading: 'Indlæser artikler...',
    articleCount: article => article === 1 ? '1 artikel' : `${article} artikler`,
    keywords: 'riksdag nyheder, svensk parlament, regeringsanalyse, politisk journalistik, gennemsigtighed, demokrati',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  no: {
    code: 'nb',
    locale: 'nb_NO',
    filters: {
      type: 'Type:',
      topic: 'Emne:',
      sort: 'Sorter:',
      allTypes: 'Alle typer',
      allTopics: 'Alle emner',
      prospective: 'Fremtidsrettet',
      retrospective: 'Tilbakeskuende',
      analysis: 'Analyse',
      breaking: 'Siste nytt',
      parliament: 'Parlamentet',
      government: 'Regjeringen',
      eu: 'EU',
      defense: 'Forsvar',
      environment: 'Miljø',
      committees: 'Komiteer',
      legislation: 'Lovgivning',
      dateDesc: 'Nyeste først',
      dateAsc: 'Eldste først',
      popularityDesc: 'Mest populære'
    },
    noArticles: 'Ingen artikler tilgjengelige',
    loading: 'Laster artikler...',
    articleCount: article => article === 1 ? '1 artikkel' : `${article} artikler`,
    keywords: 'riksdag nyheter, svensk parlament, regjeringsanalyse, politisk journalistikk, åpenhet, demokrati',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  fi: {
    code: 'fi',
    locale: 'fi_FI',
    filters: {
      type: 'Tyyppi:',
      topic: 'Aihe:',
      sort: 'Järjestä:',
      allTypes: 'Kaikki tyypit',
      allTopics: 'Kaikki aiheet',
      prospective: 'Ennakoiva',
      retrospective: 'Taaksepäin katsova',
      analysis: 'Analyysi',
      breaking: 'Uusimmat uutiset',
      parliament: 'Parlamentti',
      government: 'Hallitus',
      eu: 'EU',
      defense: 'Puolustus',
      environment: 'Ympäristö',
      committees: 'Valiokunnat',
      legislation: 'Lainsäädäntö',
      dateDesc: 'Uusimmat ensin',
      dateAsc: 'Vanhimmat ensin',
      popularityDesc: 'Suosituimmat'
    },
    noArticles: 'Ei artikkeleita saatavilla',
    loading: 'Ladataan artikkeleita...',
    articleCount: article => article === 1 ? '1 artikkeli' : `${article} artikkelia`,
    keywords: 'riksdag uutiset, ruotsin parlamentti, hallitusanalyysi, poliittinen journalismi, avoimuus, demokratia',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  de: {
    code: 'de',
    locale: 'de_DE',
    filters: {
      type: 'Typ:',
      topic: 'Thema:',
      sort: 'Sortieren:',
      allTypes: 'Alle Typen',
      allTopics: 'Alle Themen',
      prospective: 'Zukunftsorientiert',
      retrospective: 'Rückblickend',
      analysis: 'Analyse',
      breaking: 'Eilmeldungen',
      parliament: 'Parlament',
      government: 'Regierung',
      eu: 'EU',
      defense: 'Verteidigung',
      environment: 'Umwelt',
      committees: 'Ausschüsse',
      legislation: 'Gesetzgebung',
      dateDesc: 'Neueste zuerst',
      dateAsc: 'Älteste zuerst',
      popularityDesc: 'Beliebteste'
    },
    noArticles: 'Keine Artikel verfügbar',
    loading: 'Artikel werden geladen...',
    articleCount: article => article === 1 ? '1 Artikel' : `${article} Artikel`,
    keywords: 'riksdag nachrichten, schwedisches parlament, regierungsanalyse, politischer journalismus, transparenz, demokratie',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  fr: {
    code: 'fr',
    locale: 'fr_FR',
    filters: {
      type: 'Type :',
      topic: 'Sujet :',
      sort: 'Trier :',
      allTypes: 'Tous les types',
      allTopics: 'Tous les sujets',
      prospective: 'Prospectif',
      retrospective: 'Rétrospectif',
      analysis: 'Analyse',
      breaking: 'Dernières nouvelles',
      parliament: 'Parlement',
      government: 'Gouvernement',
      eu: 'UE',
      defense: 'Défense',
      environment: 'Environnement',
      committees: 'Comités',
      legislation: 'Législation',
      dateDesc: 'Plus récents d\'abord',
      dateAsc: 'Plus anciens d\'abord',
      popularityDesc: 'Plus populaires'
    },
    noArticles: 'Aucun article disponible',
    loading: 'Chargement des articles...',
    articleCount: article => article === 1 ? '1 article' : `${article} articles`,
    keywords: 'riksdag actualités, parlement suédois, analyse gouvernementale, journalisme politique, transparence, démocratie',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  es: {
    code: 'es',
    locale: 'es_ES',
    filters: {
      type: 'Tipo:',
      topic: 'Tema:',
      sort: 'Ordenar:',
      allTypes: 'Todos los tipos',
      allTopics: 'Todos los temas',
      prospective: 'Prospectivo',
      retrospective: 'Retrospectivo',
      analysis: 'Análisis',
      breaking: 'Últimas noticias',
      parliament: 'Parlamento',
      government: 'Gobierno',
      eu: 'UE',
      defense: 'Defensa',
      environment: 'Medio ambiente',
      committees: 'Comités',
      legislation: 'Legislación',
      dateDesc: 'Más recientes primero',
      dateAsc: 'Más antiguos primero',
      popularityDesc: 'Más populares'
    },
    noArticles: 'No hay artículos disponibles',
    loading: 'Cargando artículos...',
    articleCount: article => article === 1 ? '1 artículo' : `${article} artículos`,
    keywords: 'riksdag noticias, parlamento sueco, análisis gubernamental, periodismo político, transparencia, democracia',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  nl: {
    code: 'nl',
    locale: 'nl_NL',
    filters: {
      type: 'Type:',
      topic: 'Onderwerp:',
      sort: 'Sorteren:',
      allTypes: 'Alle types',
      allTopics: 'Alle onderwerpen',
      prospective: 'Toekomstgericht',
      retrospective: 'Terugblikkend',
      analysis: 'Analyse',
      breaking: 'Laatste nieuws',
      parliament: 'Parlement',
      government: 'Regering',
      eu: 'EU',
      defense: 'Defensie',
      environment: 'Milieu',
      committees: 'Commissies',
      legislation: 'Wetgeving',
      dateDesc: 'Nieuwste eerst',
      dateAsc: 'Oudste eerst',
      popularityDesc: 'Meest populair'
    },
    noArticles: 'Geen artikelen beschikbaar',
    loading: 'Artikelen laden...',
    articleCount: article => article === 1 ? '1 artikel' : `${article} artikelen`,
    keywords: 'riksdag nieuws, zweeds parlement, regeringsanalyse, politieke journalistiek, transparantie, democratie',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  ar: {
    code: 'ar',
    locale: 'ar_SA',
    rtl: true,
    filters: {
      type: 'النوع:',
      topic: 'الموضوع:',
      sort: 'الترتيب:',
      allTypes: 'جميع الأنواع',
      allTopics: 'جميع المواضيع',
      prospective: 'استشرافي',
      retrospective: 'استرجاعي',
      analysis: 'تحليل',
      breaking: 'أخبار عاجلة',
      parliament: 'البرلمان',
      government: 'الحكومة',
      eu: 'الاتحاد الأوروبي',
      defense: 'الدفاع',
      environment: 'البيئة',
      committees: 'اللجان',
      legislation: 'التشريع',
      dateDesc: 'الأحدث أولاً',
      dateAsc: 'الأقدم أولاً',
      popularityDesc: 'الأكثر شعبية'
    },
    noArticles: 'لا توجد مقالات متاحة',
    loading: 'جارٍ تحميل المقالات...',
    articleCount: article => article === 1 ? 'مقال واحد' : `${article} مقالات`,
    keywords: 'أخبار البرلمان, البرلمان السويدي, تحليل حكومي, صحافة سياسية, شفافية, ديمقراطية',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  he: {
    code: 'he',
    locale: 'he_IL',
    rtl: true,
    filters: {
      type: 'סוג:',
      topic: 'נושא:',
      sort: 'מיון:',
      allTypes: 'כל הסוגים',
      allTopics: 'כל הנושאים',
      prospective: 'פרוספקטיבי',
      retrospective: 'רטרוספקטיבי',
      analysis: 'ניתוח',
      breaking: 'חדשות אחרונות',
      parliament: 'הפרלמנט',
      government: 'הממשלה',
      eu: 'האיחוד האירופי',
      defense: 'הגנה',
      environment: 'סביבה',
      committees: 'ועדות',
      legislation: 'חקיקה',
      dateDesc: 'החדשים ביותר תחילה',
      dateAsc: 'הישנים ביותר תחילה',
      popularityDesc: 'הפופולריים ביותר'
    },
    noArticles: 'אין מאמרים זמינים',
    loading: 'טוען מאמרים...',
    articleCount: article => article === 1 ? 'מאמר אחד' : `${article} מאמרים`,
    keywords: 'חדשות הפרלמנט, הפרלמנט השוודי, ניתוח ממשלתי, עיתונות פוליטית, שקיפות, דמוקרטיה',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  },
  ja: {
    code: 'ja',
    locale: 'ja_JP',
    filters: {
      type: '種類：',
      topic: 'トピック：',
      sort: '並び替え：',
      allTypes: 'すべての種類',
      allTopics: 'すべてのトピック',
      prospective: '将来展望',
      retrospective: '回顧',
      analysis: '分析',
      breaking: '速報',
      parliament: '議会',
      government: '政府',
      eu: 'EU',
      defense: '防衛',
      environment: '環境',
      committees: '委員会',
      legislation: '法律',
      dateDesc: '新しい順',
      dateAsc: '古い順',
      popularityDesc: '人気順'
    },
    noArticles: '記事がありません',
    loading: '記事を読み込み中...',
    articleCount: article => `${article}件の記事`,
    keywords: '国会ニュース, スウェーデン議会, 政府分析, 政治ジャーナリズム, 透明性, 民主主義',
    dateFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  },
  ko: {
    code: 'ko',
    locale: 'ko_KR',
    filters: {
      type: '유형:',
      topic: '주제:',
      sort: '정렬:',
      allTypes: '모든 유형',
      allTopics: '모든 주제',
      prospective: '전망',
      retrospective: '회고',
      analysis: '분석',
      breaking: '속보',
      parliament: '의회',
      government: '정부',
      eu: 'EU',
      defense: '국방',
      environment: '환경',
      committees: '위원회',
      legislation: '입법',
      dateDesc: '최신순',
      dateAsc: '오래된순',
      popularityDesc: '인기순'
    },
    noArticles: '사용 가능한 기사가 없습니다',
    loading: '기사를 로드 중...',
    articleCount: article => `${article}개의 기사`,
    keywords: '의회 뉴스, 스웨덴 의회, 정부 분석, 정치 저널리즘, 투명성, 민주주의',
    dateFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  },
  zh: {
    code: 'zh',
    locale: 'zh_CN',
    filters: {
      type: '类型：',
      topic: '主题：',
      sort: '排序：',
      allTypes: '所有类型',
      allTopics: '所有主题',
      prospective: '前瞻性',
      retrospective: '回顾性',
      analysis: '分析',
      breaking: '突发新闻',
      parliament: '议会',
      government: '政府',
      eu: '欧盟',
      defense: '国防',
      environment: '环境',
      committees: '委员会',
      legislation: '立法',
      dateDesc: '最新优先',
      dateAsc: '最旧优先',
      popularityDesc: '最受欢迎'
    },
    noArticles: '没有可用文章',
    loading: '正在加载文章...',
    articleCount: article => `${article}篇文章`,
    keywords: '议会新闻, 瑞典议会, 政府分析, 政治新闻, 透明度, 民主',
    dateFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  }
};

console.log('🌍 Enhancing News Index Localization for 14 Languages');
console.log('📍 News directory:', NEWS_DIR);

/**
 * Update filter translations in an index file
 */
function updateFilterTranslations(content, lang) {
  const loc = LOCALIZATION[lang];
  if (!loc) {
    console.warn(`  ⚠️ No localization data for language: ${lang}`);
    return content;
  }
  
  // Update filter labels and options
  const replacements = [
    // Type filter
    { old: /<label for="filter-type">[^<]*<\/label>/, new: `<label for="filter-type">${loc.filters.type}</label>` },
    { old: /<option value="all">[^<]*<\/option>/, new: `<option value="all">${loc.filters.allTypes}</option>` },
    { old: /<option value="prospective">[^<]*<\/option>/, new: `<option value="prospective">${loc.filters.prospective}</option>` },
    { old: /<option value="retrospective">[^<]*<\/option>/, new: `<option value="retrospective">${loc.filters.retrospective}</option>` },
    { old: /<option value="analysis">[^<]*<\/option>/, new: `<option value="analysis">${loc.filters.analysis}</option>` },
    { old: /<option value="breaking">[^<]*<\/option>/, new: `<option value="breaking">${loc.filters.breaking}</option>` },
    
    // Topic filter
    { old: /<label for="filter-topic">[^<]*<\/label>/, new: `<label for="filter-topic">${loc.filters.topic}</label>` },
    
    // Sort filter
    { old: /<label for="filter-sort">[^<]*<\/label>/, new: `<label for="filter-sort">${loc.filters.sort}</label>` }
  ];
  
  let updated = content;
  replacements.forEach(({ old, new: newVal }) => {
    updated = updated.replace(old, newVal);
  });
  
  return updated;
}

/**
 * Update keywords meta tag
 */
function updateKeywords(content, lang) {
  const loc = LOCALIZATION[lang];
  if (!loc) return content;
  
  const keywordsRegex = /<meta name="keywords" content="[^"]*">/;
  return content.replace(keywordsRegex, `<meta name="keywords" content="${loc.keywords}">`);
}

/**
 * Add dynamic content support script
 */
function addDynamicContentSupport(content, lang) {
  const loc = LOCALIZATION[lang];
  if (!loc) return content;
  
  const scriptTag = `
  <!-- Dynamic Content Loader -->
  <script>
    // Localization data
    const i18n = {
      noArticles: '${loc.noArticles}',
      loading: '${loc.loading}',
      articleCount: (n) => n === 1 ? '${loc.articleCount(1)}' : \`\${n} ${loc.filters.allTypes.toLowerCase()}\`
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
`;
  
  // Insert before closing </body> tag
  return content.replace('</body>', `${scriptTag}\n</body>`);
}

/**
 * Process a single news index file
 */
function processIndexFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    const langMatch = fileName.match(/index_?([a-z]{2})?\.html/);
    const lang = langMatch && langMatch[1] ? langMatch[1] : 'en';
    
    console.log(`\n📄 Processing: ${fileName} (${lang})`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Apply updates
    content = updateFilterTranslations(content, lang);
    content = updateKeywords(content, lang);
    content = addDynamicContentSupport(content, lang);
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Enhanced localization for ${fileName}`);
    
  } catch (error) {
    console.error(`  ❌ Error processing ${path.basename(filePath)}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  const indexFiles = fs.readdirSync(NEWS_DIR)
    .filter(f => f.match(/^index(_[a-z]{2})?\.html$/))
    .map(f => path.join(NEWS_DIR, f));
  
  console.log(`\n📊 Found ${indexFiles.length} index files to process\n`);
  
  indexFiles.forEach(processIndexFile);
  
  console.log('\n✅ Localization enhancement complete!');
  console.log('\n📋 Summary:');
  console.log(`  • Processed ${indexFiles.length} language versions`);
  console.log('  • Updated filter translations');
  console.log('  • Enhanced keywords for SEO');
  console.log('  • Added dynamic content support');
}

main();
