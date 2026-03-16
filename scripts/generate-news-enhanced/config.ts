/**
 * @module generate-news-enhanced/config
 * @description CLI argument parsing, language configuration, and shared state
 * for the enhanced news generation system.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from '../mcp-client.js';
import type { Language } from '../types/language.js';
import type { GenerationStats } from '../types/article.js';
import type { BatchStatus } from './types.js';
import type { AnalysisDepth } from '../ai-analysis/types.js';

const __filename: string = fileURLToPath(import.meta.url);
export const __dirname: string = path.dirname(__filename);

/** Extract YYYY-MM-DD from a Date, guaranteed non-undefined. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args: string[] = process.argv.slice(2);

/** Extract the value after the first '=' from a CLI argument, or empty string if absent. */
function parseArgValue(arg: string | undefined): string {
  if (!arg) return '';
  const idx = arg.indexOf('=');
  return idx >= 0 ? arg.slice(idx + 1).trim() : '';
}

const typesArg: string | undefined = args.find(arg => arg.startsWith('--types='));
const languagesArg: string | undefined = args.find(arg => arg.startsWith('--languages='));
export const dryRunArg: boolean = args.includes('--dry-run');
const batchSizeArg: string | undefined = args.find(arg => arg.startsWith('--batch-size='));
export const skipExistingArg: boolean = args.includes('--skip-existing');
export const batchSize: number = batchSizeArg ? parseInt(parseArgValue(batchSizeArg) || '0', 10) : 0;
const qualityThresholdArg: string | undefined = args.find(arg => arg.startsWith('--quality-threshold='));

// Deep-inspection arguments: document IDs, URLs, and focus topic for targeted analysis
const documentIdsArg: string | undefined = args.find(arg => arg.startsWith('--document-ids='));
const documentUrlsArg: string | undefined = args.find(arg => arg.startsWith('--document-urls='));
const focusTopicArg: string | undefined = args.find(arg => arg.startsWith('--focus-topic='));

/** Comma-separated Riksdag document IDs for deep-inspection (e.g. H901FiU1,H901JuU25) */
const rawDocumentIds: string = parseArgValue(documentIdsArg);
export const documentIds: string[] = rawDocumentIds
  ? rawDocumentIds.split(',').map(id => id.trim()).filter(Boolean)
  : [];

/** Comma-separated URLs for deep-inspection analysis */
const rawDocumentUrls: string = parseArgValue(documentUrlsArg);
export const documentUrls: string[] = rawDocumentUrls
  ? rawDocumentUrls.split(',').map(u => u.trim()).filter(Boolean)
  : [];

/** Specific policy topic to focus deep-inspection analysis on */
export const focusTopic: string = parseArgValue(focusTopicArg);

// ---------------------------------------------------------------------------
// Analysis depth (controls number of AI analysis iterations)
// ---------------------------------------------------------------------------

/**
 * --analysis-depth=<quick|standard|deep>
 *
 * Controls how many AI analysis iterations run for deep-inspection articles:
 * - `quick`    — 1 pass (initial analysis only; fast)
 * - `standard` — 2 passes (initial + SWOT refinement; default)
 * - `deep`     — 3 passes (initial + refinement + stakeholder validation)
 */
const analysisDepthArg: string | undefined = args.find(arg => arg.startsWith('--analysis-depth='));
const rawAnalysisDepth: string = parseArgValue(analysisDepthArg ?? '').toLowerCase();
const VALID_ANALYSIS_DEPTHS: readonly AnalysisDepth[] = ['quick', 'standard', 'deep'];

function parseAnalysisDepth(raw: string): AnalysisDepth {
  if ((VALID_ANALYSIS_DEPTHS as readonly string[]).includes(raw)) {
    return raw as AnalysisDepth;
  }
  if (raw && raw !== '') {
    console.warn(`⚠️ Unknown --analysis-depth value "${raw}", falling back to "standard". Valid values: ${VALID_ANALYSIS_DEPTHS.join(', ')}`);
  }
  return 'standard';
}

export const analysisDepth: AnalysisDepth = parseAnalysisDepth(rawAnalysisDepth);

const DEFAULT_QUALITY_THRESHOLD = 40;
let parsedQualityThreshold: number = DEFAULT_QUALITY_THRESHOLD;
if (qualityThresholdArg) {
  const rawValue: string = parseArgValue(qualityThresholdArg);
  const numericValue: number = rawValue === '' ? NaN : Number(rawValue);
  if (Number.isFinite(numericValue)) {
    parsedQualityThreshold = Math.min(100, Math.max(0, numericValue));
  } else {
    console.warn(`Invalid --quality-threshold value "${rawValue}", falling back to default ${DEFAULT_QUALITY_THRESHOLD}.`);
  }
}
export const QUALITY_THRESHOLD: number = parsedQualityThreshold;

// --require-mcp flag: when true (default), abort if MCP server is unreachable after all retries.
// Set --require-mcp=false for local development/testing without a live MCP server.
const requireMcpArg: string | undefined = args.find(arg => arg.startsWith('--require-mcp'));
export const requireMcp: boolean = parseArgValue(requireMcpArg ?? '') !== 'false';

// ---------------------------------------------------------------------------
// Valid article types
// ---------------------------------------------------------------------------

export const VALID_ARTICLE_TYPES: readonly string[] = ['week-ahead', 'month-ahead', 'weekly-review', 'monthly-review', 'committee-reports', 'propositions', 'motions', 'interpellations', 'breaking', 'deep-inspection'];

const rawArticleTypes: string[] = typesArg
  ? parseArgValue(typesArg).split(',').map(t => t.trim()).filter(Boolean)
  : [];

const filteredArticleTypes: string[] = rawArticleTypes.filter(t => VALID_ARTICLE_TYPES.includes(t));

if (rawArticleTypes.length > 0 && filteredArticleTypes.length === 0) {
  throw new Error(
    `No valid article types specified via --types. Valid types are: ${VALID_ARTICLE_TYPES.join(', ')}`
  );
}

export const articleTypes: string[] = filteredArticleTypes.length > 0
  ? filteredArticleTypes
  : ['week-ahead'];

// ---------------------------------------------------------------------------
// Language configuration
// ---------------------------------------------------------------------------

export const ALL_LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

export const LANGUAGE_PRESETS: Readonly<Record<string, Language[]>> = {
  'all': [...ALL_LANGUAGES],
  'nordic': ['en', 'sv', 'da', 'no', 'fi'],
  'eu-core': ['en', 'sv', 'de', 'fr', 'es', 'nl']
};

let languagesInput: string = languagesArg ? parseArgValue(languagesArg).trim().toLowerCase() : 'all';

// Expand presets (after trimming and normalizing)
const presetLanguages: Language[] | undefined = LANGUAGE_PRESETS[languagesInput];
if (presetLanguages) {
  languagesInput = presetLanguages.join(',');
}

export let languages: Language[] = languagesInput
  .split(',')
  .map(l => l.trim())
  .filter((l): l is Language => (ALL_LANGUAGES as readonly string[]).includes(l));

if (languages.length === 0) {
  console.error('❌ No valid language codes provided. Valid codes:', ALL_LANGUAGES.join(', '));
  process.exit(1);
}

// Log filtered article types (invalid types were removed during parsing above)
const filteredTypes: string[] = rawArticleTypes.filter(t => !VALID_ARTICLE_TYPES.includes(t));
if (filteredTypes.length > 0) {
  console.warn(`⚠️ Unknown article types filtered out: ${filteredTypes.join(', ')}. Valid types: ${VALID_ARTICLE_TYPES.join(', ')}`);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const NEWS_DIR: string = path.join(__dirname, '..', '..', 'news');
export const METADATA_DIR: string = path.join(NEWS_DIR, 'metadata');

// Track full requested set before any filtering
export const allRequestedLanguages: Language[] = [...languages];

// Apply --skip-existing: remove languages that already have today's articles
if (skipExistingArg) {
  const today: string = toISODate(new Date());
  const existingFiles: string[] = fs.existsSync(NEWS_DIR)
    ? fs.readdirSync(NEWS_DIR).filter(f => f.startsWith(today) && f.endsWith('.html'))
    : [];
  const doneLangs: Language[] = languages.filter(lang =>
    existingFiles.some(f => f.endsWith(`-${lang}.html`))
  );
  if (doneLangs.length > 0) {
    console.log(`⏭️  Skipping already-generated languages: ${doneLangs.join(', ')}`);
    languages = languages.filter(l => !doneLangs.includes(l));
  }
}

// Apply --batch-size: limit to N languages per run
if (batchSize > 0 && languages.length > batchSize) {
  const remaining: Language[] = languages.slice(batchSize);
  languages = languages.slice(0, batchSize);
  console.log(`📦 Batch mode: processing ${languages.length} of ${allRequestedLanguages.length} requested languages`);
  console.log(`   This batch: ${languages.join(', ')}`);
  console.log(`   Remaining for next run(s): ${remaining.join(', ')}`);
}

if (languages.length === 0) {
  console.log('✅ All requested languages already generated. Nothing to do.');
  // Write a status metadata file so the workflow knows we're done
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
  const batchStatus: BatchStatus = {
    complete: true,
    allDone: allRequestedLanguages,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(METADATA_DIR, 'batch-status.json'),
    JSON.stringify(batchStatus, null, 2)
  );
  process.exit(0);
}

console.log('📰 Enhanced News Generation Script');
console.log('Article types:', articleTypes.join(', '));
console.log('Languages:', languages.join(', '));
console.log('Batch size:', batchSize > 0 ? batchSize : 'all at once');
console.log('Skip existing:', skipExistingArg ? 'Yes' : 'No');
console.log('Dry run:', dryRunArg ? 'Yes (no files written)' : 'No');

// ---------------------------------------------------------------------------
// Shared MCP client (reuses connection/session across all generators)
// ---------------------------------------------------------------------------

let sharedClient: MCPClient | null = null;

/**
 * Get or create the shared MCPClient instance.
 * On first call, warms up the MCP server with a lightweight get_sync_status
 * request using an extended timeout to handle Render.com cold starts (30-60s).
 *
 * @returns Warmed-up shared client
 */
export async function getSharedClient(): Promise<MCPClient> {
  if (sharedClient) return sharedClient;

  // Use extended timeout for initial connection (cold start can take 30-60s)
  const coldStartTimeout: number = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS ?? '', 10) || 90000;
  sharedClient = new MCPClient({ timeout: coldStartTimeout });

  // Warm up the MCP server before any data queries
  console.log('⏳ Warming up MCP server (may take 30-60s on cold start)...');
  console.log(`  🔗 Server: ${sharedClient.baseURL}`);
  try {
    const status: Record<string, unknown> = await sharedClient.request('get_sync_status', {});
    console.log('✅ MCP server ready');
    if (status && status['last_sync']) {
      console.log(`  📊 Last sync: ${status['last_sync'] as string}`);
    }
  } catch (error: unknown) {
    const message = (error as Error).message;
    if (requireMcp) {
      sharedClient = null;
      throw new Error(`MCP server unavailable: ${message}`, { cause: error });
    }
    console.warn(`⚠️ MCP warm-up failed: ${message}`);
    console.warn('  Continuing anyway — individual requests will retry with backoff');
  }

  // After warm-up succeeds, reduce timeout for normal requests
  const normalTimeout: number = parseInt(process.env.MCP_CLIENT_TIMEOUT_MS ?? '', 10) || 30000;
  (sharedClient as unknown as { timeout: number }).timeout = normalTimeout;

  return sharedClient;
}

// Ensure directories exist
if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Generation statistics
// ---------------------------------------------------------------------------

export const stats: GenerationStats = {
  generated: 0,
  errors: 0,
  articles: [],
  timestamp: new Date().toISOString(),
  qualityScores: []
};
