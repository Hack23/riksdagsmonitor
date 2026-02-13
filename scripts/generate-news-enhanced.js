#!/usr/bin/env node

/**
 * Enhanced Automated News Generation Script
 * 
 * Generates news articles using riksdag-regering-mcp data
 * Integrates MCP client, data transformers, and article template
 * 
 * Usage: node generate-news-enhanced.js --types="week-ahead,committee-reports"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from './mcp-client.js';
import { 
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources
} from './data-transformers.js';
import { generateArticleHTML } from './article-template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const typesArg = args.find(arg => arg.startsWith('--types='));
const languagesArg = args.find(arg => arg.startsWith('--languages='));
const dryRunArg = args.includes('--dry-run');

// Valid article types
const VALID_ARTICLE_TYPES = ['week-ahead', 'committee-reports', 'propositions', 'motions', 'breaking'];

const articleTypes = typesArg 
  ? typesArg.split('=')[1].split(',')
  : ['week-ahead'];

// Language preset expansion
const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
const LANGUAGE_PRESETS = {
  'all': ALL_LANGUAGES,
  'nordic': ['en', 'sv', 'da', 'no', 'fi'],
  'eu-core': ['en', 'sv', 'de', 'fr', 'es', 'nl']
};

let languagesInput = languagesArg ? languagesArg.split('=')[1] : 'en,sv';

// Expand presets
if (LANGUAGE_PRESETS[languagesInput]) {
  languagesInput = LANGUAGE_PRESETS[languagesInput].join(',');
}

const languages = languagesInput.split(',').filter(l => ALL_LANGUAGES.includes(l.trim()));

if (languages.length === 0) {
  console.error('❌ No valid language codes provided. Valid codes:', ALL_LANGUAGES.join(', '));
  process.exit(1);
}

// Validate article types
const invalidTypes = articleTypes.filter(t => !VALID_ARTICLE_TYPES.includes(t.trim()));
if (invalidTypes.length > 0) {
  console.warn(`⚠️ Unknown article types ignored: ${invalidTypes.join(', ')}`);
}

console.log('📰 Enhanced News Generation Script');
console.log('Article types:', articleTypes.join(', '));
console.log('Languages:', languages.join(', '));
console.log('Dry run:', dryRunArg ? 'Yes (no files written)' : 'No');

// Configuration
const NEWS_DIR = path.join(__dirname, '..', 'news');
const METADATA_DIR = path.join(NEWS_DIR, 'metadata');

// Ensure directories exist
if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

// Generation statistics
const stats = {
  generated: 0,
  errors: 0,
  articles: [],
  timestamp: new Date().toISOString()
};

/**
 * Get date range for Week Ahead (next 7 days)
 */
function getWeekAheadDateRange() {
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
function formatDateForSlug(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Write article to file
 */
async function writeArticle(html, filename) {
  if (dryRunArg) {
    console.log(`  [DRY RUN] Would write: ${filename}`);
    return true;
  }
  
  const filepath = path.join(NEWS_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`  ✅ Wrote: ${filename}`);
  return true;
}

/**
 * Write article in specified language
 */
async function writeSingleArticle(html, slug, lang) {
  const filename = `${slug}-${lang}.html`;
  await writeArticle(html, filename);
  stats.generated += 1;
  stats.articles.push(filename);
  return filename;
}

/**
 * Write EN/SV article pair (legacy function for backward compatibility)
 */
async function writeArticlePair(htmlEN, htmlSV, slug) {
  await writeSingleArticle(htmlEN, slug, 'en');
  await writeSingleArticle(htmlSV, slug, 'sv');
}

/**
 * Generate Week Ahead article in specified languages
 */
async function generateWeekAhead() {
  console.log('📅 Generating Week Ahead article...');
  
  try {
    const client = new MCPClient();
    const dateRange = getWeekAheadDateRange();
    
    console.log(`  📆 Date range: ${dateRange.start} to ${dateRange.end}`);
    
    // 1. Fetch calendar events from MCP
    console.log('  🔄 Fetching calendar events from riksdag-regering-mcp...');
    const events = await client.fetchCalendarEvents(dateRange.start, dateRange.end);
    console.log(`  📊 Found ${events.length} events`);
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-week-ahead`;
    
    // 2. Generate for each requested language
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
      const titles = {
        en: { title: `Week Ahead: ${dateRange.start} to ${dateRange.end}`, subtitle: `Parliamentary calendar, committee meetings, and chamber debates for the coming week` },
        sv: { title: `Vecka Framåt: ${dateRange.start} till ${dateRange.end}`, subtitle: `Riksdagens kalender, utskottsmöten och kammarens debatter för kommande vecka` },
        da: { title: `Ugen Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, udvalgsm\u00f8der og debatter for den kommende uge` },
        no: { title: `Uke Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, komitémøter og debatter for kommende uke` },
        fi: { title: `Tuleva Viikko: ${dateRange.start} - ${dateRange.end}`, subtitle: `Parlamentin kalenteri, valiokuntien kokoukset ja keskustelut tulevalle viikolle` },
        de: { title: `Woche Voraus: ${dateRange.start} bis ${dateRange.end}`, subtitle: `Parlamentarischer Kalender, Ausschusssitzungen und Debatten für die kommende Woche` },
        fr: { title: `Semaine à Venir: ${dateRange.start} au ${dateRange.end}`, subtitle: `Calendrier parlementaire, réunions de commission et débats pour la semaine à venir` },
        es: { title: `Semana Próxima: ${dateRange.start} a ${dateRange.end}`, subtitle: `Calendario parlamentario, reuniones de comisión y debates para la próxima semana` },
        nl: { title: `Week Vooruit: ${dateRange.start} tot ${dateRange.end}`, subtitle: `Parlementaire kalender, commissievergaderingen en debatten voor de komende week` },
        ar: { title: `الأسبوع القادم: ${dateRange.start} إلى ${dateRange.end}`, subtitle: `التقويم البرلماني واجتماعات اللجان والمناقشات للأسبوع المقبل` },
        he: { title: `השבוע הקרוב: ${dateRange.start} עד ${dateRange.end}`, subtitle: `לוח שנה פרלמנטרי, פגישות ועדה ודיונים לשבוע הקרוב` },
        ja: { title: `来週の展望: ${dateRange.start} から ${dateRange.end}`, subtitle: `来週の議会カレンダー、委員会会議、討論` },
        ko: { title: `다음 주 전망: ${dateRange.start}부터 ${dateRange.end}까지`, subtitle: `다음 주 의회 일정, 위원회 회의 및 토론` },
        zh: { title: `下周展望：${dateRange.start} 至 ${dateRange.end}`, subtitle: `下周议会日程、委员会会议和辩论` }
      };
      
      const langTitles = titles[lang] || titles.en;
      
      // Generate HTML for this language
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
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
      
      // Write article
      await writeSingleArticle(html, slug, lang);
      console.log(`  ✅ ${lang.toUpperCase()} version generated`);
    }
    
    console.log('  ✅ Week Ahead article generated successfully in all requested languages');
    return { success: true, files: languages.length, slug };
    
  } catch (error) {
    console.error('❌ Error generating Week Ahead:', error.message);
    console.error('   Stack:', error.stack);
    stats.errors++;
    return { success: false, error: error.message };
  }
}

/**
 * Generate Committee Reports article
 */
async function generateCommitteeReports() {
  console.log('📋 Generating Committee Reports article...');
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching committee reports from riksdag-regering-mcp...');
    const reports = await client.fetchCommitteeReports(10);
    console.log(`  📊 Found ${reports.length} committee reports`);
    
    if (reports.length === 0) {
      console.log('  ℹ️ No new committee reports found, skipping');
      return { success: true, files: 0 };
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-committee-reports`;
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent({ reports }, 'committee-reports', lang);
      const watchPoints = extractWatchPoints({ reports }, lang);
      const metadata = generateMetadata({ reports }, 'committee-reports', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_betankanden']);
      
      const titles = {
        en: { title: `Committee Reports: Parliamentary Priorities This Week`, subtitle: `Analysis of ${reports.length} committee reports revealing Riksdag priorities for the current session` },
        sv: { title: `Utskottsbetänkanden: Riksdagens prioriteringar denna vecka`, subtitle: `Analys av ${reports.length} utskottsbetänkanden som avslöjar riksdagens prioriteringar` },
        da: { title: `Udvalgsbetænkninger: Parlamentets prioriteringer denne uge`, subtitle: `Analyse af ${reports.length} udvalgsbetænkninger` },
        no: { title: `Komitéinnstillinger: Stortingets prioriteringer denne uken`, subtitle: `Analyse av ${reports.length} komitéinnstillinger` },
        fi: { title: `Valiokunnan mietinnöt: Eduskunnan prioriteetit tällä viikolla`, subtitle: `Analyysi ${reports.length} valiokunnan mietinnöstä` },
        de: { title: `Ausschussberichte: Parlamentarische Prioritäten diese Woche`, subtitle: `Analyse von ${reports.length} Ausschussberichten` },
        fr: { title: `Rapports de commission: Priorités parlementaires cette semaine`, subtitle: `Analyse de ${reports.length} rapports de commission` },
        es: { title: `Informes de comisión: Prioridades parlamentarias esta semana`, subtitle: `Análisis de ${reports.length} informes de comisión` },
        nl: { title: `Commissierapporten: Parlementaire prioriteiten deze week`, subtitle: `Analyse van ${reports.length} commissierapporten` },
        ar: { title: `تقارير اللجان: أولويات البرلمان هذا الأسبوع`, subtitle: `تحليل ${reports.length} تقارير لجان` },
        he: { title: `דוחות ועדה: סדרי עדיפויות פרלמנטריים השבוע`, subtitle: `ניתוח ${reports.length} דוחות ועדה` },
        ja: { title: `委員会報告：今週の議会優先事項`, subtitle: `${reports.length}件の委員会報告の分析` },
        ko: { title: `위원회 보고서: 이번 주 의회 우선순위`, subtitle: `${reports.length}개 위원회 보고서 분석` },
        zh: { title: `委员会报告：本周议会优先事项`, subtitle: `${reports.length}份委员会报告分析` }
      };
      
      const langTitles = titles[lang] || titles.en;
      
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
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
      
      await writeSingleArticle(html, slug, lang);
    }
    
    return { success: true, files: languages.length, slug };
    
  } catch (error) {
    console.error('❌ Error generating Committee Reports:', error.message);
    stats.errors++;
    return { success: false, error: error.message };
  }
}

/**
 * Generate Government Propositions article
 */
async function generatePropositions() {
  console.log('📜 Generating Government Propositions article...');
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching propositions from riksdag-regering-mcp...');
    const propositions = await client.fetchPropositions(10);
    console.log(`  📊 Found ${propositions.length} propositions`);
    
    if (propositions.length === 0) {
      console.log('  ℹ️ No new propositions found, skipping');
      return { success: true, files: 0 };
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-government-propositions`;
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent({ propositions }, 'propositions', lang);
      const watchPoints = extractWatchPoints({ propositions }, lang);
      const metadata = generateMetadata({ propositions }, 'propositions', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_propositioner']);
      
      const titles = {
        en: { title: `Government Propositions: Policy Priorities This Week`, subtitle: `Analysis of ${propositions.length} government propositions shaping the legislative agenda` },
        sv: { title: `Regeringens propositioner: Veckans prioriteringar`, subtitle: `Analys av ${propositions.length} propositioner som formar den lagstiftande agendan` },
        da: { title: `Regeringsforslag: Politiske prioriteringer denne uge`, subtitle: `Analyse af ${propositions.length} regeringsforslag` },
        no: { title: `Regjeringens proposisjoner: Politiske prioriteringer denne uken`, subtitle: `Analyse av ${propositions.length} regjeringsproposisjoner` },
        fi: { title: `Hallituksen esitykset: Viikon poliittiset prioriteetit`, subtitle: `Analyysi ${propositions.length} hallituksen esityksestä` },
        de: { title: `Regierungsvorlagen: Politische Prioritäten diese Woche`, subtitle: `Analyse von ${propositions.length} Regierungsvorlagen` },
        fr: { title: `Propositions gouvernementales: Priorités politiques cette semaine`, subtitle: `Analyse de ${propositions.length} propositions gouvernementales` },
        es: { title: `Proposiciones gubernamentales: Prioridades políticas esta semana`, subtitle: `Análisis de ${propositions.length} proposiciones gubernamentales` },
        nl: { title: `Regeringsvoorstellen: Politieke prioriteiten deze week`, subtitle: `Analyse van ${propositions.length} regeringsvoorstellen` },
        ar: { title: `مقترحات الحكومة: الأولويات السياسية هذا الأسبوع`, subtitle: `تحليل ${propositions.length} مقترحات حكومية` },
        he: { title: `הצעות ממשלה: סדרי עדיפויות מדיניים השבוע`, subtitle: `ניתוח ${propositions.length} הצעות ממשלה` },
        ja: { title: `政府提案：今週の政策優先事項`, subtitle: `${propositions.length}件の政府提案の分析` },
        ko: { title: `정부 법안: 이번 주 정책 우선순위`, subtitle: `${propositions.length}개 정부 법안 분석` },
        zh: { title: `政府提案：本周政策优先事项`, subtitle: `${propositions.length}份政府提案分析` }
      };
      
      const langTitles = titles[lang] || titles.en;
      
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
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
      
      await writeSingleArticle(html, slug, lang);
    }
    
    return { success: true, files: languages.length, slug };
    
  } catch (error) {
    console.error('❌ Error generating Propositions:', error.message);
    stats.errors++;
    return { success: false, error: error.message };
  }
}

/**
 * Generate Opposition Motions article
 */
async function generateMotions() {
  console.log('📝 Generating Opposition Motions article...');
  
  try {
    const client = new MCPClient();
    
    console.log('  🔄 Fetching motions from riksdag-regering-mcp...');
    const motions = await client.fetchMotions(10);
    console.log(`  📊 Found ${motions.length} motions`);
    
    if (motions.length === 0) {
      console.log('  ℹ️ No new motions found, skipping');
      return { success: true, files: 0 };
    }
    
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-opposition-motions`;
    
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);
      
      const content = generateArticleContent({ motions }, 'motions', lang);
      const watchPoints = extractWatchPoints({ motions }, lang);
      const metadata = generateMetadata({ motions }, 'motions', lang);
      const readTime = calculateReadTime(content);
      const sources = generateSources(['get_motioner']);
      
      const titles = {
        en: { title: `Opposition Motions: Battle Lines This Week`, subtitle: `Analysis of ${motions.length} opposition motions revealing parliamentary fault lines` },
        sv: { title: `Oppositionsmotioner: Veckans stridslinjer`, subtitle: `Analys av ${motions.length} oppositionsmotioner som avslöjar parlamentariska skiljelinjer` },
        da: { title: `Oppositionsforslag: Ugens kamppladser`, subtitle: `Analyse af ${motions.length} oppositionsforslag` },
        no: { title: `Opposisjonsforslag: Ukens kamplinjer`, subtitle: `Analyse av ${motions.length} opposisjonsforslag` },
        fi: { title: `Opposition aloitteet: Viikon taistelulinjat`, subtitle: `Analyysi ${motions.length} opposition aloitteesta` },
        de: { title: `Oppositionsanträge: Kampflinien dieser Woche`, subtitle: `Analyse von ${motions.length} Oppositionsanträgen` },
        fr: { title: `Motions d'opposition: Lignes de bataille cette semaine`, subtitle: `Analyse de ${motions.length} motions d'opposition` },
        es: { title: `Mociones de oposición: Líneas de batalla esta semana`, subtitle: `Análisis de ${motions.length} mociones de oposición` },
        nl: { title: `Oppositiemoties: Strijdlijnen deze week`, subtitle: `Analyse van ${motions.length} oppositiemoties` },
        ar: { title: `اقتراحات المعارضة: خطوط المعركة هذا الأسبوع`, subtitle: `تحليل ${motions.length} اقتراحات المعارضة` },
        he: { title: `הצעות אופוזיציה: קווי העימות השבוע`, subtitle: `ניתוח ${motions.length} הצעות אופוזיציה` },
        ja: { title: `野党動議：今週の対立構図`, subtitle: `${motions.length}件の野党動議の分析` },
        ko: { title: `야당 동의: 이번 주 대립 구도`, subtitle: `${motions.length}개 야당 동의 분석` },
        zh: { title: `反对党动议：本周对立格局`, subtitle: `${motions.length}份反对党动议分析` }
      };
      
      const langTitles = titles[lang] || titles.en;
      
      const html = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
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
      
      await writeSingleArticle(html, slug, lang);
    }
    
    return { success: true, files: languages.length, slug };
    
  } catch (error) {
    console.error('❌ Error generating Motions:', error.message);
    stats.errors++;
    return { success: false, error: error.message };
  }
}

/**
 * Main generation function
 */
async function generateNews() {
  console.log('🚀 Starting enhanced news generation...\n');
  
  for (const type of articleTypes) {
    switch(type.trim()) {
      case 'week-ahead':
        await generateWeekAhead();
        break;
      case 'committee-reports':
        await generateCommitteeReports();
        break;
      case 'propositions':
        await generatePropositions();
        break;
      case 'motions':
        await generateMotions();
        break;
      case 'breaking':
        console.log('⚡ Breaking news generation requires manual trigger with specific event context');
        console.log('  ⚠️ Full implementation pending');
        break;
      default:
        console.warn(`⚠️ Unknown article type: ${type}`);
    }
  }
  
  // Save generation metadata
  const metadataFile = path.join(METADATA_DIR, 'last-generation.json');
  fs.writeFileSync(metadataFile, JSON.stringify({
    timestamp: stats.timestamp,
    types: articleTypes,
    languages: languages,
    generated: stats.generated,
    errors: stats.errors,
    articles: stats.articles,
    status: 'enhanced',
    note: 'Enhanced script with MCP integration and multi-language support'
  }, null, 2));
  
  // Save detailed results
  const resultFile = path.join(METADATA_DIR, 'generation-result.json');
  fs.writeFileSync(resultFile, JSON.stringify(stats, null, 2));
  
  console.log('\n✅ Enhanced news generation complete');
  console.log(`Generated: ${stats.generated} articles`);
  console.log(`Errors: ${stats.errors}`);
  
  if (stats.articles.length > 0) {
    console.log('\nArticles generated:');
    stats.articles.forEach(article => console.log(`  - ${article}`));
  }
  
  return stats;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNews()
    .then(stats => {
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { generateNews, generateWeekAhead, writeSingleArticle, VALID_ARTICLE_TYPES, ALL_LANGUAGES, LANGUAGE_PRESETS };
