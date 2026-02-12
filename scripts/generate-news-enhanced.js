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
const translateFromArg = args.find(arg => arg.startsWith('--translate-from='));
const dryRunArg = args.includes('--dry-run');

const articleTypes = typesArg 
  ? typesArg.split('=')[1].split(',')
  : ['week-ahead'];

const languages = languagesArg
  ? languagesArg.split('=')[1].split(',')
  : ['en', 'sv'];

const translateFrom = translateFromArg
  ? translateFromArg.split('=')[1]
  : null;

console.log('📰 Enhanced News Generation Script');
console.log('Article types:', articleTypes.join(', '));
console.log('Languages:', languages.join(', '));
console.log('Translate from:', translateFrom || 'none (generate original)');
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
    
    // 1. Fetch latest committee reports
    console.log('  🔄 Fetching committee reports from riksdag-regering-mcp...');
    const reports = await client.fetchCommitteeReports(10);
    console.log(`  📊 Found ${reports.length} committee reports`);
    
    // 2. Generate article (simplified for now)
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-committee-reports`;
    
    console.log(`  ℹ️ Would generate: ${slug}-en.html, ${slug}-sv.html`);
    console.log('  ⚠️ Full implementation pending');
    
    return { success: true, files: 0 };
    
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
    
    console.log('  ⚠️ Full implementation pending');
    
    return { success: true, files: 0 };
    
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
    
    console.log('  ⚠️ Full implementation pending');
    
    return { success: true, files: 0 };
    
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
    translateFrom: translateFrom,
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

export { generateNews, generateWeekAhead, writeArticlePair };
