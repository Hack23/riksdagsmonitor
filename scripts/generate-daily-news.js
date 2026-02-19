#!/usr/bin/env node

/**
 * @module Intelligence Operations/Daily News Generation
 * @category Intelligence Operations - Nightly Automated News Generation
 *
 * @description
 * Nightly news generation orchestrator that queries the riksdag-regering-mcp server
 * for documents published in the last 24 hours, groups them by type, applies a
 * minimum-document threshold, and delegates article generation to the enhanced
 * news engine (generate-news-enhanced.js).
 *
 * Designed to run unattended at 02:00 CET via GitHub Actions but is also safely
 * triggerable by hand.  All output files are written into news/ and the metadata
 * directory, exactly as the enhanced script does, so downstream index / sitemap
 * updates work without modification.
 *
 * Workflow
 * ────────
 * 1. Fetch new documents from riksdag-regering-mcp published since yesterday
 * 2. Group by document type  (bet, prop, mot)
 * 3. Generate articles for types that meet the threshold  (default ≥5 documents)
 * 4. Always generate the Week-Ahead calendar article
 * 5. Write generation report to news/metadata/daily-report.json
 * 6. Exit 0 on full success, 1 if any article generation failed
 *
 * CLI flags
 * ─────────
 *   --date=YYYY-MM-DD       Override "yesterday" date for document window
 *   --threshold=N           Override minimum document count (default 5)
 *   --types=t1,t2           Restrict article types  (committee-reports,propositions,motions,week-ahead)
 *   --languages=l1,l2       Language codes or presets (en,sv | nordic | eu-core | all)
 *   --dry-run               Log what would happen without writing files
 *   --skip-existing         Skip languages that already have today's articles
 *   --no-week-ahead         Suppress the always-on Week Ahead article
 *   --batch-size=N          Pass through to enhanced generator for batching
 *
 * Environment variables
 * ─────────────────────
 *   MCP_AUTH_TOKEN          Bearer token for riksdag-regering-mcp (optional)
 *   MCP_SERVER_URL          Override MCP server URL
 *   MCP_CLIENT_TIMEOUT_MS   Request timeout in ms (default 90000 for cold start)
 *
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 1.0.0
 *
 * @see {@link ./generate-news-enhanced.js}   Enhanced multi-language article engine
 * @see {@link ./mcp-client.js}               MCP transport layer
 * @see {@link ../ARTICLE_ENHANCEMENT_GUIDE.md} Workflow documentation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from './mcp-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── CLI argument parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(prefix) {
  const hit = args.find(a => a.startsWith(prefix + '='));
  return hit ? hit.slice(prefix.length + 1) : null;
}

const dryRun        = args.includes('--dry-run');
const skipExisting  = args.includes('--skip-existing');
const noWeekAhead   = args.includes('--no-week-ahead');

const dateArg       = getArg('--date');
const thresholdArg  = getArg('--threshold');
const typesArg      = getArg('--types');
const languagesArg  = getArg('--languages');
const batchSizeArg  = getArg('--batch-size');

const DOCUMENT_THRESHOLD = thresholdArg ? parseInt(thresholdArg, 10) : 5;

// ─── Language helpers ────────────────────────────────────────────────────────

const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

const LANGUAGE_PRESETS = {
  all:      ALL_LANGUAGES,
  nordic:   ['en', 'sv', 'da', 'no', 'fi'],
  'eu-core':['en', 'sv', 'de', 'fr', 'es', 'nl']
};

let languagesInput = languagesArg ? languagesArg.trim().toLowerCase() : 'all';
if (LANGUAGE_PRESETS[languagesInput]) {
  languagesInput = LANGUAGE_PRESETS[languagesInput].join(',');
}
const LANGUAGES = languagesInput.split(',').map(l => l.trim()).filter(l => ALL_LANGUAGES.includes(l));

if (LANGUAGES.length === 0) {
  console.error('❌ No valid language codes. Valid codes:', ALL_LANGUAGES.join(', '));
  process.exit(1);
}

// ─── Date helpers ────────────────────────────────────────────────────────────

/**
 * Return yesterday's date as YYYY-MM-DD (or the override from --date flag).
 * @returns {string}
 */
function getFromDate() {
  if (dateArg) return dateArg;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const TODAY      = new Date().toISOString().split('T')[0];
const FROM_DATE  = getFromDate();

// ─── Paths ───────────────────────────────────────────────────────────────────

const NEWS_DIR      = path.join(__dirname, '..', 'news');
const METADATA_DIR  = path.join(NEWS_DIR, 'metadata');

if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

// ─── Document type → article type mapping ───────────────────────────────────

/**
 * Maps riksdag document type codes to article type identifiers used by the
 * enhanced generator.
 */
const DOCTYPE_TO_ARTICLE_TYPE = {
  bet: 'committee-reports',
  prop: 'propositions',
  mot: 'motions'
};

const VALID_ARTICLE_TYPES = ['committee-reports', 'propositions', 'motions', 'week-ahead'];

// ─── Allowed article types from --types flag ─────────────────────────────────

const requestedTypes = typesArg
  ? typesArg.split(',').map(t => t.trim()).filter(t => VALID_ARTICLE_TYPES.includes(t))
  : VALID_ARTICLE_TYPES;

// ─── Report accumulator ──────────────────────────────────────────────────────

const report = {
  date:            TODAY,
  fromDate:        FROM_DATE,
  threshold:       DOCUMENT_THRESHOLD,
  languages:       LANGUAGES,
  dryRun,
  documentsFound:  {},
  typesTriggered:  [],
  typesSkipped:    [],
  articlesCreated: [],
  errors:          [],
  startTime:       new Date().toISOString()
};

// ─── MCP helpers ─────────────────────────────────────────────────────────────

let _client = null;

/**
 * Get (or lazily create) the shared MCPClient, with cold-start warm-up.
 * @returns {Promise<MCPClient>}
 */
async function getClient() {
  if (_client) return _client;

  const timeout = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS, 10) || 90000;
  _client = new MCPClient({ timeout });

  console.log('⏳ Warming up MCP server (cold start may take 30-60 s)…');
  try {
    await _client.request('get_sync_status', {});
    console.log('✅ MCP server ready');
  } catch (e) {
    console.warn(`⚠️  MCP warm-up failed: ${e.message} — will retry on individual requests`);
  }

  // Reduce timeout for normal requests after warm-up
  _client.timeout = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS, 10) || 30000;
  return _client;
}

/**
 * Fetch documents of a given riksdag type published since FROM_DATE.
 * Returns an array of document objects (may be empty).
 *
 * @param {MCPClient} client
 * @param {'bet'|'prop'|'mot'} doctype
 * @returns {Promise<object[]>}
 */
async function fetchDocumentsByType(client, doctype) {
  try {
    console.log(`  🔄 Searching for '${doctype}' documents since ${FROM_DATE}…`);
    const result = await client.request('search_dokument', {
      doktyp:    doctype,
      from_date: FROM_DATE,
      limit:     100
    });

    // The MCP server wraps results in different shapes depending on version
    let docs = [];
    if (Array.isArray(result)) {
      docs = result;
    } else if (result && Array.isArray(result.dokumentlista?.dokument)) {
      docs = result.dokumentlista.dokument;
    } else if (result && Array.isArray(result.dokument)) {
      docs = result.dokument;
    } else if (result && result.content) {
      // Text/JSON in content field
      try {
        const parsed = JSON.parse(
          Array.isArray(result.content) ? result.content[0].text : result.content
        );
        docs = parsed.dokumentlista?.dokument || parsed.dokument || [];
      } catch {
        docs = [];
      }
    }

    console.log(`  📊 Found ${docs.length} '${doctype}' documents`);
    return docs;
  } catch (error) {
    console.error(`  ❌ Error fetching '${doctype}' documents: ${error.message}`);
    report.errors.push({ type: doctype, error: error.message });
    return [];
  }
}

// ─── Article generation via enhanced script ──────────────────────────────────

/**
 * Build the CLI arguments string for generate-news-enhanced.js based on the
 * article type and the options passed to this script.
 *
 * @param {string} articleType
 * @returns {string[]} argv array to pass to the child process
 */
function buildEnhancedArgs(articleType) {
  const cliArgs = [`--types=${articleType}`, `--languages=${LANGUAGES.join(',')}`];
  if (dryRun)       cliArgs.push('--dry-run');
  if (skipExisting) cliArgs.push('--skip-existing');
  if (batchSizeArg) cliArgs.push(`--batch-size=${batchSizeArg}`);
  return cliArgs;
}

/**
 * Invoke generate-news-enhanced.js for a single article type via dynamic import
 * (same process, avoids spawn overhead and shares the warmed-up MCP connection).
 * Falls back to process.argv injection so the imported module sees our flags.
 *
 * @param {string} articleType - e.g. 'committee-reports'
 * @returns {Promise<boolean>} true on success
 */
async function generateArticleType(articleType) {
  console.log(`\n📰 Generating '${articleType}' article…`);

  if (dryRun) {
    console.log(`  [DRY RUN] Would call generate-news-enhanced.js --types=${articleType}`);
    return true;
  }

  // Temporarily patch process.argv so the enhanced module's top-level parsing
  // picks up our flags when it is imported / re-used.
  const savedArgv = process.argv.slice();
  process.argv = [
    process.argv[0],
    path.join(__dirname, 'generate-news-enhanced.js'),
    ...buildEnhancedArgs(articleType)
  ];

  try {
    // Dynamic import with cache-busting query so we can call multiple types
    const cacheBust = `?type=${articleType}&ts=${Date.now()}`;
    const mod = await import(`./generate-news-enhanced.js${cacheBust}`);

    let fn;
    switch (articleType) {
      case 'committee-reports': fn = mod.generateCommitteeReports; break;
      case 'propositions':      fn = mod.generatePropositions;      break;
      case 'motions':           fn = mod.generateMotions;           break;
      case 'week-ahead':        fn = mod.generateWeekAhead;         break;
      default:                  fn = mod.generateNews;
    }

    if (typeof fn !== 'function') {
      // Fall back to the main generateNews export
      fn = mod.generateNews || mod.default;
    }

    const result = await fn();
    return result && result.success !== false;

  } catch (importError) {
    // Dynamic import with same path fails on Node < 22 with module cache
    // Fall back to child_process spawn
    console.warn(`  ⚠️  Direct import failed (${importError.message}), using child process`);
    return generateViaChildProcess(articleType);
  } finally {
    process.argv = savedArgv;
  }
}

/**
 * Fallback: spawn generate-news-enhanced.js as a child process.
 * @param {string} articleType
 * @returns {Promise<boolean>}
 */
async function generateViaChildProcess(articleType) {
  const { spawn } = await import('child_process');

  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'generate-news-enhanced.js');
    const cliArgs    = buildEnhancedArgs(articleType);

    console.log(`  🔧 Spawning: node ${scriptPath} ${cliArgs.join(' ')}`);

    const child = spawn(process.execPath, [scriptPath, ...cliArgs], {
      stdio: 'inherit',
      env:   process.env
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`  ✅ '${articleType}' generation succeeded`);
        resolve(true);
      } else {
        console.error(`  ❌ '${articleType}' generation failed (exit code ${code})`);
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.error(`  ❌ Spawn error for '${articleType}': ${err.message}`);
      resolve(false);
    });
  });
}

// ─── Main orchestration ──────────────────────────────────────────────────────

async function main() {
  console.log('📰 Riksdagsmonitor — Daily News Generation');
  console.log(`   Date window : ${FROM_DATE} → ${TODAY}`);
  console.log(`   Threshold   : ≥${DOCUMENT_THRESHOLD} documents per type`);
  console.log(`   Languages   : ${LANGUAGES.join(', ')}`);
  console.log(`   Types       : ${requestedTypes.join(', ')}`);
  console.log(`   Dry run     : ${dryRun ? 'YES' : 'no'}`);
  console.log('');

  const client = await getClient();

  // ── 1. Fetch documents by type ─────────────────────────────────────────────

  const documentsByType = {};

  for (const [doctype, articleType] of Object.entries(DOCTYPE_TO_ARTICLE_TYPE)) {
    if (!requestedTypes.includes(articleType)) continue;

    const docs = await fetchDocumentsByType(client, doctype);
    documentsByType[articleType] = docs;
    report.documentsFound[articleType] = docs.length;
  }

  // ── 2. Decide which article types to generate ──────────────────────────────

  const typesToGenerate = [];

  // Week-ahead is always included unless suppressed
  if (!noWeekAhead && requestedTypes.includes('week-ahead')) {
    typesToGenerate.push('week-ahead');
  }

  for (const [articleType, docs] of Object.entries(documentsByType)) {
    if (docs.length >= DOCUMENT_THRESHOLD) {
      typesToGenerate.push(articleType);
      report.typesTriggered.push(articleType);
      console.log(`✅ '${articleType}': ${docs.length} documents ≥ threshold (${DOCUMENT_THRESHOLD}) → will generate`);
    } else {
      report.typesSkipped.push(articleType);
      console.log(`⏭️  '${articleType}': ${docs.length} documents < threshold (${DOCUMENT_THRESHOLD}) → skipping`);
    }
  }

  if (typesToGenerate.length === 0) {
    console.log('\nℹ️  No article types met the threshold. Nothing to generate today.');
    report.endTime = new Date().toISOString();
    saveReport();
    process.exit(0);
  }

  console.log(`\n🚀 Generating ${typesToGenerate.length} article type(s): ${typesToGenerate.join(', ')}\n`);

  // ── 3. Generate articles ───────────────────────────────────────────────────

  let hasErrors = false;

  for (const articleType of typesToGenerate) {
    const ok = await generateArticleType(articleType);

    if (ok) {
      report.articlesCreated.push(articleType);
    } else {
      report.errors.push({ type: articleType, error: 'generation failed' });
      hasErrors = true;
    }
  }

  // ── 4. Persist report ─────────────────────────────────────────────────────

  report.endTime = new Date().toISOString();
  saveReport();

  // ── 5. Summary ────────────────────────────────────────────────────────────

  console.log('\n─────────────────────────────────────────');
  console.log('📊 Daily Generation Summary');
  console.log(`   Documents found  : ${JSON.stringify(report.documentsFound)}`);
  console.log(`   Types triggered  : ${report.typesTriggered.join(', ') || 'none'}`);
  console.log(`   Types skipped    : ${report.typesSkipped.join(', ')  || 'none'}`);
  console.log(`   Articles created : ${report.articlesCreated.join(', ') || 'none'}`);
  console.log(`   Errors           : ${report.errors.length}`);
  if (report.errors.length > 0) {
    report.errors.forEach(e => console.error(`     ⚠️  ${e.type}: ${e.error}`));
  }
  console.log('─────────────────────────────────────────\n');

  process.exit(hasErrors ? 1 : 0);
}

function saveReport() {
  try {
    fs.writeFileSync(
      path.join(METADATA_DIR, 'daily-report.json'),
      JSON.stringify(report, null, 2)
    );
  } catch (e) {
    console.warn(`⚠️  Could not save daily report: ${e.message}`);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
