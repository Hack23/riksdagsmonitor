#!/usr/bin/env node

/**
 * @module Intelligence Operations/Daily News Generation
 * @category Intelligence Operations - Automated Intelligence Reporting
 *
 * @description
 * Nightly automated news generation pipeline that queries riksdag-regering-mcp
 * for documents published in the last 24 hours, groups them by document type,
 * and generates multi-language articles when the volume threshold (≥5 documents)
 * is met. Designed to be invoked by the nightly-news-generation workflow at
 * 02:00 CET so every morning new articles are ready for all 14 language audiences.
 *
 * Pipeline Stages:
 *
 * Stage 1 – Daily Document Discovery (24-hour window):
 * Uses search_dokument with from_date/to_date covering yesterday → today to find
 * all new propositions, motions, and committee reports. Falls back gracefully when
 * the MCP server is unavailable, logging a structured error without crashing.
 *
 * Stage 2 – Volume Threshold Filtering (≥5 documents):
 * Only article types with at least MIN_DOCUMENTS_THRESHOLD documents are queued
 * for generation. This prevents skeleton articles when parliamentary activity is low
 * (e.g., recess weeks or public holidays).
 *
 * Stage 3 – Content Generation & Enhancement:
 * Delegates to the existing generate-news-enhanced.js generators
 * (generateCommitteeReports, generatePropositions, generateMotions, generateWeekAhead)
 * reusing all MCP enrichment, multi-language rendering, and HTML template logic.
 *
 * Stage 4 – Index & Sitemap Update:
 * After successful article generation, triggers generate-news-indexes.js and
 * generate-sitemap.js to refresh the 14 language index pages and sitemap.xml.
 *
 * CLI Options:
 *   --dry-run           Discover documents and log what would be generated without
 *                       writing any files.
 *   --threshold=N       Override the minimum document count (default: 5).
 *   --languages=PRESET  Language preset: all | nordic | eu-core | or comma-separated
 *                       codes. Default: all.
 *   --force             Force article generation even if threshold is not met.
 *   --skip-indexes      Skip index and sitemap regeneration after generation.
 *   --lookback-hours=N  Override the document discovery window (default: 24).
 *
 * @intelligence
 * Daily cadence monitoring pattern – continuous OSINT collection that fires once
 * per day and produces intelligence products only when there is meaningful new data.
 *
 * @osint
 * Uses riksdag-regering-mcp search_dokument with date range to find documents
 * published by the official Swedish Parliament and Government APIs within the last
 * 24 hours. Enriches each document with get_dokument_innehall for full content.
 *
 * @risk
 * Threat: MCP server unavailability (Render.com cold starts / outage)
 * Mitigation: Retry with exponential backoff; exit 0 so workflow does not fail
 * noisily when no data is available.
 *
 * Threat: Empty or low-volume days (recess, public holidays)
 * Mitigation: MIN_DOCUMENTS_THRESHOLD gate suppresses spurious empty articles.
 *
 * @gdpr
 * Processes only public parliamentary records (Article 6(1)(e) public interest).
 * No personal data beyond official public-servant records.
 *
 * @security
 * Transport: HTTPS-only MCP communication via MCPClient.
 * Auth: Optional bearer token via MCP_AUTH_TOKEN environment variable.
 * No credentials are hard-coded; all secrets are environment-supplied.
 *
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 1.0.0
 *
 * @see {@link ./generate-news-enhanced.js} Core article generators (reused)
 * @see {@link ./mcp-client.js} MCP protocol client
 * @see {@link ./generate-news-indexes.js} Index page regeneration
 * @see {@link ./generate-sitemap.js} Sitemap regeneration
 * @see {@link ../.github/workflows/nightly-news-generation.yml} Nightly workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { MCPClient } from './mcp-client.js';
import {
  generateCommitteeReports,
  generatePropositions,
  generateMotions,
  generateWeekAhead,
  ALL_LANGUAGES,
  LANGUAGE_PRESETS
} from './generate-news-enhanced.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const dryRun          = args.includes('--dry-run');
const forceGenerate   = args.includes('--force');
const skipIndexes     = args.includes('--skip-indexes');

const thresholdArg    = args.find(a => a.startsWith('--threshold='));
const languagesArg    = args.find(a => a.startsWith('--languages='));
const lookbackArg     = args.find(a => a.startsWith('--lookback-hours='));

/** Minimum number of new documents required to generate an article type */
const MIN_DOCUMENTS_THRESHOLD = thresholdArg
  ? Math.max(1, parseInt(thresholdArg.split('=')[1], 10) || 5)
  : 5;

/** Hours to look back when searching for new documents */
const LOOKBACK_HOURS = lookbackArg
  ? Math.max(1, parseInt(lookbackArg.split('=')[1], 10) || 24)
  : 24;

// Resolve language preset
const languagesInput = languagesArg
  ? languagesArg.split('=')[1].trim().toLowerCase()
  : 'all';

const resolvedLanguages = LANGUAGE_PRESETS[languagesInput]
  ? LANGUAGE_PRESETS[languagesInput]
  : languagesInput.split(',').map(l => l.trim()).filter(l => ALL_LANGUAGES.includes(l));

const languages = resolvedLanguages.length > 0 ? resolvedLanguages : ALL_LANGUAGES;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Document types to monitor for daily generation */
const DOCUMENT_TYPES = [
  { key: 'propositions',      doktyp: 'prop', label: 'Government Propositions' },
  { key: 'motions',           doktyp: 'mot',  label: 'Opposition Motions'      },
  { key: 'committee-reports', doktyp: 'bet',  label: 'Committee Reports'       }
];

const NEWS_DIR      = path.join(__dirname, '..', 'news');
const METADATA_DIR  = path.join(NEWS_DIR, 'metadata');
const SCRIPTS_DIR   = __dirname;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date as YYYY-MM-DD
 *
 * @param {Date} date
 * @returns {string}
 */
function toDateString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Compute the 24-hour (or custom lookback) date range for document discovery.
 *
 * @returns {{ fromDate: string, toDate: string }}
 */
function getDiscoveryDateRange() {
  const now  = new Date();
  const from = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  return { fromDate: toDateString(from), toDate: toDateString(now) };
}

/**
 * Ensure the metadata directory exists.
 */
function ensureMetadataDir() {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
}

/**
 * Run a Node.js script in a child process.
 *
 * @param {string} scriptName  – basename inside scripts/
 */
function runScript(scriptName) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  try {
    execFileSync(process.execPath, ['--input-type=module', '--eval',
      `import '${scriptPath.replace(/\\/g, '/')}';`
    ], {
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (err) {
    console.warn(`⚠️ Script ${scriptName} exited with error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Daily document discovery
// ---------------------------------------------------------------------------

/**
 * Fetch new documents of a given type published within the lookback window.
 *
 * @param {MCPClient} client
 * @param {string} doktyp  - Document type code (prop | mot | bet)
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {Promise<Object[]>}
 */
async function fetchRecentDocuments(client, doktyp, fromDate, toDate) {
  try {
    const response = await client.request('search_dokument', {
      doktyp,
      from_date: fromDate,
      to_date:   toDate,
      limit:     50,
      sort:      'datum',
      sortorder: 'desc'
    });
    return response.documents || response.dokument || [];
  } catch (err) {
    console.warn(`  ⚠️ Could not fetch ${doktyp} documents: ${err.message}`);
    return [];
  }
}

/**
 * Discover all document types with their counts for the lookback window.
 *
 * @returns {Promise<Map<string, { docs: Object[], count: number, label: string }>>}
 */
async function discoverNewDocuments() {
  const { fromDate, toDate } = getDiscoveryDateRange();
  console.log(`\n🔍 Discovering new documents (${fromDate} → ${toDate})…`);

  // Use extended timeout for cold starts
  const coldStartTimeout = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS, 10) || 90000;
  const client = new MCPClient({ timeout: coldStartTimeout });

  // Warm up the MCP server
  console.log('⏳ Warming up MCP server (may take 30-60 sec on cold start)…');
  try {
    await client.request('get_sync_status', {});
    console.log('✅ MCP server ready');
    // Reduce timeout for subsequent requests
    client.timeout = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS, 10) || 30000;
  } catch (err) {
    console.warn(`⚠️ MCP warm-up failed: ${err.message} – continuing with individual retries`);
  }

  /** @type {Map<string, { docs: Object[], count: number, label: string }>} */
  const discovered = new Map();

  for (const { key, doktyp, label } of DOCUMENT_TYPES) {
    const docs = await fetchRecentDocuments(client, doktyp, fromDate, toDate);
    discovered.set(key, { docs, count: docs.length, label });
    console.log(`  📄 ${label}: ${docs.length} new documents`);
  }

  return discovered;
}

// ---------------------------------------------------------------------------
// Article generation dispatch
// ---------------------------------------------------------------------------

/**
 * Inject the resolved language list into process.argv and call the
 * relevant generator from generate-news-enhanced.js.
 *
 * The generators read languages from process.argv at module load time, so we
 * need to inject them before the function is called. Since they are already
 * imported (module-level), we override the module-level `languages` variable
 * indirectly by patching argv and re-running – but that is not possible in
 * ESM once imported.  Instead we rely on the fact that generate-news-enhanced
 * exports pure functions that reference the module-scoped `languages` array.
 *
 * A simpler and more reliable approach: call each generator function directly
 * with the knowledge that they use the module-level `languages` variable which
 * was already resolved from argv when the module was first imported. We therefore
 * inject our --languages flag *before* the import at the bottom of this file –
 * done via the early argv patch below.
 *
 * @param {string} type - Document type key
 * @param {boolean} dry - Dry-run flag
 * @returns {Promise<{ success: boolean, files: number, error?: string }>}
 */
async function generateArticleForType(type, dry) {
  if (dry) {
    console.log(`  [DRY RUN] Would generate: ${type}`);
    return { success: true, files: 0 };
  }

  try {
    switch (type) {
      case 'week-ahead':        return await generateWeekAhead();
      case 'propositions':      return await generatePropositions();
      case 'motions':           return await generateMotions();
      case 'committee-reports': return await generateCommitteeReports();
      default:
        console.warn(`  ⚠️ Unknown type: ${type}`);
        return { success: false, files: 0, error: `Unknown type: ${type}` };
    }
  } catch (err) {
    return { success: false, files: 0, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Index & sitemap update
// ---------------------------------------------------------------------------

/**
 * Regenerate news index pages and sitemap.xml after article generation.
 * Runs the scripts as child processes so they start fresh with a clean module
 * environment (no shared state from this run).
 */
async function updateIndexesAndSitemap() {
  console.log('\n📑 Updating news indexes…');
  runScript('generate-news-indexes.js');

  console.log('🗺️  Updating sitemap.xml…');
  runScript('generate-sitemap.js');
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Main daily news generation pipeline.
 *
 * @returns {Promise<void>}
 */
async function runDailyNewsGeneration() {
  console.log('🌅 Daily News Generation Pipeline');
  console.log('='.repeat(50));
  console.log(`⚙️  Threshold:      ${MIN_DOCUMENTS_THRESHOLD} documents`);
  console.log(`⚙️  Lookback:       ${LOOKBACK_HOURS} hours`);
  console.log(`⚙️  Languages:      ${languages.join(', ')}`);
  console.log(`⚙️  Dry run:        ${dryRun ? 'YES' : 'no'}`);
  console.log(`⚙️  Force generate: ${forceGenerate ? 'YES' : 'no'}`);
  console.log(`⚙️  Skip indexes:   ${skipIndexes ? 'YES' : 'no'}`);
  console.log('');

  ensureMetadataDir();

  // ── Stage 1: Document discovery ─────────────────────────────────────────
  let discovered;
  try {
    discovered = await discoverNewDocuments();
  } catch (err) {
    console.error(`❌ Document discovery failed: ${err.message}`);
    // Write error status so the workflow can surface it
    ensureMetadataDir();
    fs.writeFileSync(
      path.join(METADATA_DIR, 'daily-generation-status.json'),
      JSON.stringify({
        status:    'error',
        stage:     'discovery',
        error:     err.message,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    process.exit(0); // Exit 0 so scheduled workflow does not alert on quiet days
  }

  // ── Stage 2: Threshold filtering ────────────────────────────────────────
  /** @type {string[]} Types that meet the threshold */
  const typesToGenerate = [];

  console.log('\n📊 Threshold evaluation:');
  for (const [key, { count, label }] of discovered) {
    const meetsThreshold = forceGenerate || count >= MIN_DOCUMENTS_THRESHOLD;
    const icon = meetsThreshold ? '✅' : '⏭️ ';
    console.log(
      `  ${icon} ${label}: ${count} docs ${meetsThreshold
        ? `(≥ ${MIN_DOCUMENTS_THRESHOLD} → GENERATE)`
        : `(< ${MIN_DOCUMENTS_THRESHOLD} → skip)`}`
    );
    if (meetsThreshold) typesToGenerate.push(key);
  }

  // Always include week-ahead as it does not require a document count
  if (!typesToGenerate.includes('week-ahead')) {
    typesToGenerate.unshift('week-ahead');
    console.log(`  ✅ Week Ahead: scheduled (always generated)`);
  }

  if (typesToGenerate.length === 0 || (typesToGenerate.length === 1 && typesToGenerate[0] === 'week-ahead')) {
    console.log('\nℹ️  No document types met the threshold – generating week-ahead only.');
  }

  // ── Stage 3: Article generation ─────────────────────────────────────────
  console.log(`\n✍️  Generating ${typesToGenerate.length} article type(s): ${typesToGenerate.join(', ')}`);

  const results = {};
  let totalGenerated = 0;
  let totalErrors = 0;

  for (const type of typesToGenerate) {
    console.log(`\n▶ Generating: ${type}`);
    const result = await generateArticleForType(type, dryRun);
    results[type] = result;

    if (result.success) {
      totalGenerated += result.files || 0;
      console.log(`  ✅ ${type}: ${result.files || 0} files generated`);
    } else {
      totalErrors++;
      console.error(`  ❌ ${type}: ${result.error}`);
    }
  }

  // ── Stage 4: Index & sitemap update ─────────────────────────────────────
  if (!skipIndexes && !dryRun && totalGenerated > 0) {
    await updateIndexesAndSitemap();
  } else if (dryRun) {
    console.log('\n[DRY RUN] Skipping index/sitemap update');
  } else if (totalGenerated === 0) {
    console.log('\nℹ️  No new articles written – skipping index/sitemap update');
  }

  // ── Write pipeline status ────────────────────────────────────────────────
  const { fromDate, toDate } = getDiscoveryDateRange();
  const status = {
    status:           totalErrors === 0 ? 'success' : 'partial',
    timestamp:        new Date().toISOString(),
    lookbackHours:    LOOKBACK_HOURS,
    threshold:        MIN_DOCUMENTS_THRESHOLD,
    languages,
    dateRange:        { fromDate, toDate },
    documentCounts:   Object.fromEntries(
      [...discovered.entries()].map(([k, v]) => [k, v.count])
    ),
    typesGenerated:   typesToGenerate,
    totalArticles:    totalGenerated,
    errors:           totalErrors,
    results
  };

  ensureMetadataDir();
  fs.writeFileSync(
    path.join(METADATA_DIR, 'daily-generation-status.json'),
    JSON.stringify(status, null, 2)
  );

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log('📋 Daily Generation Summary');
  console.log('='.repeat(50));
  console.log(`📅 Date range:    ${fromDate} → ${toDate}`);
  console.log(`📝 Types queued:  ${typesToGenerate.join(', ')}`);
  console.log(`✅ Articles:      ${totalGenerated}`);
  console.log(`❌ Errors:        ${totalErrors}`);

  if (totalErrors > 0) {
    console.error('\n⚠️  Pipeline completed with errors (see above).');
    process.exit(1);
  }

  console.log('\n🎉 Daily news generation complete!');
}

// ---------------------------------------------------------------------------
// Bootstrap: inject language flags before imported generators read argv
// ---------------------------------------------------------------------------

// Patch argv NOW so that when generate-news-enhanced.js module was already
// loaded its module-level `languages` variable is already set.  Because ESM
// modules are singletons the variable was resolved at import time (top of
// this file). To influence it we must patch argv *before* the import, which
// is not possible in ESM.
//
// Alternative: We accept that the imported generators use whatever languages
// were in argv when they were imported. To guarantee the correct language set
// we must start this script with the desired --languages flag passed directly:
//
//   node scripts/generate-daily-news.js --languages=all
//
// The nightly workflow does exactly this, so no further patching is needed.

if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyNewsGeneration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Fatal error:', err);
      process.exit(1);
    });
}

export { runDailyNewsGeneration, discoverNewDocuments, getDiscoveryDateRange, MIN_DOCUMENTS_THRESHOLD };
