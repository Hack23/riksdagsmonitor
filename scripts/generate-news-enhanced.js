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
const dryRunArg = args.includes('--dry-run');
const articleTypes = typesArg 
  ? typesArg.split('=')[1].split(',')
  : ['week-ahead'];

console.log('📰 Enhanced News Generation Script');
console.log('Article types:', articleTypes.join(', '));
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
 * Write EN/SV article pair
 */
async function writeArticlePair(htmlEN, htmlSV, slug) {
  const filenameEN = `${slug}-en.html`;
  const filenameSV = `${slug}-sv.html`;
  
  await writeArticle(htmlEN, filenameEN);
  await writeArticle(htmlSV, filenameSV);
  
  stats.generated += 2;
  stats.articles.push(filenameEN, filenameSV);
}

/**
 * Generate Week Ahead article
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
    
    // 2. Transform for English version
    console.log('  🔄 Transforming data for EN version...');
    const eventGridEN = transformCalendarToEventGrid(events, 'en');
    const contentEN = generateArticleContent({ events, highlights: [] }, 'week-ahead', 'en');
    const watchPointsEN = extractWatchPoints({ events }, 'en');
    const metadataEN = generateMetadata({ events }, 'week-ahead', 'en');
    const readTime = calculateReadTime(contentEN);
    const sources = generateSources(['get_calendar_events']);
    
    // 3. Generate English HTML
    const today = new Date();
    const slug = `${formatDateForSlug(today)}-week-ahead`;
    const titleEN = `Week Ahead: ${dateRange.start} to ${dateRange.end}`;
    const subtitleEN = `Parliamentary calendar, committee meetings, and chamber debates for the coming week`;
    
    const htmlEN = generateArticleHTML({
      slug: `${slug}-en.html`,
      title: titleEN,
      subtitle: subtitleEN,
      date: today.toISOString().split('T')[0],
      type: 'prospective',
      readTime,
      lang: 'en',
      content: contentEN,
      events: eventGridEN,
      watchPoints: watchPointsEN,
      sources,
      keywords: metadataEN.keywords,
      topics: metadataEN.topics,
      tags: metadataEN.tags
    });
    
    // 4. Transform for Swedish version
    console.log('  🔄 Transforming data for SV version...');
    const eventGridSV = transformCalendarToEventGrid(events, 'sv');
    const contentSV = generateArticleContent({ events, highlights: [] }, 'week-ahead', 'sv');
    const watchPointsSV = extractWatchPoints({ events }, 'sv');
    const metadataSV = generateMetadata({ events }, 'week-ahead', 'sv');
    
    // 5. Generate Swedish HTML
    const titleSV = `Vecka Framåt: ${dateRange.start} till ${dateRange.end}`;
    const subtitleSV = `Riksdagens kalender, utskottsmöten och kammarens debatter för kommande vecka`;
    
    const htmlSV = generateArticleHTML({
      slug: `${slug}-sv.html`,
      title: titleSV,
      subtitle: subtitleSV,
      date: today.toISOString().split('T')[0],
      type: 'prospective',
      readTime,
      lang: 'sv',
      content: contentSV,
      events: eventGridSV,
      watchPoints: watchPointsSV,
      sources,
      keywords: metadataSV.keywords,
      topics: metadataSV.topics,
      tags: metadataSV.tags
    });
    
    // 6. Write article pair
    await writeArticlePair(htmlEN, htmlSV, slug);
    
    console.log('  ✅ Week Ahead article generated successfully');
    return { success: true, files: 2, slug };
    
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
    generated: stats.generated,
    errors: stats.errors,
    articles: stats.articles,
    status: 'enhanced',
    note: 'Enhanced script with MCP integration'
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
