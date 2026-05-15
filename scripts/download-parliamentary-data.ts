#!/usr/bin/env tsx
/**
 * @module download-parliamentary-data
 * @description Parliamentary data download pipeline.
 *
 * Downloads all relevant parliamentary documents from riksdag-regering-mcp
 * and persists raw data for AI-driven analysis.
 *
 * Pipeline steps:
 * 1. Download all relevant parliamentary documents from riksdag-regering-mcp
 * 2. Persist raw data to analysis/data/ (collision-free sidecar design)
 * 3. Store per-document JSON files in analysis/daily/YYYY-MM-DD/{docType}/documents/
 * 4. Write data-download-manifest.md (factual download summary only)
 *
 * Usage:
 *   npx tsx scripts/download-parliamentary-data.ts [--date YYYY-MM-DD] [--limit N]
 *   npx tsx scripts/download-parliamentary-data.ts --aggregate weekly [--date YYYY-WNN]
 *   npx tsx scripts/download-parliamentary-data.ts --auto-full-text-top-n 2
 *   npx tsx scripts/download-parliamentary-data.ts --limit 30 --auto-full-text-top-n 5
 *   npx tsx scripts/download-parliamentary-data.ts --full-text-for-all
 *
 * @see analysis/methodologies/ai-driven-analysis-guide.md
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from './mcp-client/client.js';
import type { RawDocument } from './data-transformers/types.js';
import type {
  MCPCoverageState,
  MCPToolInvocationDiagnostic,
} from './types/mcp.js';

import {
  downloadAllDocuments,
  flattenDocuments,
  subtractBusinessDays,
  MAX_LOOKBACK_BUSINESS_DAYS,
  fetchFullTextForTopN,
  LONG_HORIZON_FULL_TEXT_FLOOR,
} from './parliamentary-data/data-downloader.js';
import type { DocumentTypeKey, FullTextFetchOutcome } from './parliamentary-data/data-downloader.js';

import { persistDownloadedData, sanitizeDokId } from './parliamentary-data/data-persistence.js';
import {
  createRetryQueueEntry,
  DEFAULT_MCP_RETRY_QUEUE_PATH,
  drainMcpRetryQueue,
  enqueueRetryEntries,
} from './parliamentary-data/mcp-retry-queue.js';
import {
  buildMcpProvenance,
  inferDocumentCoverageState,
} from './mcp-client/coverage.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis');

function formatTimestampForMarkdown(date: Date = new Date()): string {
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): {
  date: string;
  aggregate: boolean;
  limit: number;
  weekLabel: string | null;
  rm: string | null;
  docType: DocumentTypeKey | null;
  documentIds: string[];
  autoFullTextTopN: number | null;
  fullTextForAll: boolean;
} {
  const args = argv.slice(2);
  const get = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    if (idx === -1) {
      return null;
    }
    const next = args[idx + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`Missing value for ${flag}.`);
    }
    return next;
  };

  const dateArg = get('--date');
  const aggregateArg = get('--aggregate');
  const aggregate = (() => {
    if (aggregateArg === null) {
      return false;
    }
    if (aggregateArg === 'weekly') {
      return true;
    }
    throw new Error(`Invalid --aggregate value: ${aggregateArg}. Supported value: 'weekly'.`);
  })();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const weekLabel = aggregate
    ? (dateArg || `${now.getUTCFullYear()}-W${isoWeekNumber(now).toString().padStart(2, '0')}`)
    : null;
  if (aggregate && weekLabel && !parseIsoWeekLabel(weekLabel)) {
    throw new Error(`Invalid weekly --date value: ${weekLabel}. Expected YYYY-WNN.`);
  }

  if (dateArg && dateArg !== 'today' && !aggregate && !parseAndValidateIsoDate(dateArg)) {
    throw new Error(`Invalid --date value: ${dateArg}. Expected YYYY-MM-DD or 'today'.`);
  }

  const isoDate = aggregate
    ? todayIso
    : (dateArg === 'today' || !dateArg ? todayIso : dateArg);

  const limitArg = get('--limit');
  const DEFAULT_LIMIT = 20;
  const parsedLimit = limitArg ? Number(limitArg) : DEFAULT_LIMIT;
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new Error(`Invalid --limit value: ${limitArg}. Expected a positive integer.`);
  }
  const limit = parsedLimit;
  const rm = get('--rm');

  const docTypeArg = get('--doc-type');
  const VALID_DOC_TYPES: readonly DocumentTypeKey[] = ['propositions', 'motions', 'committeeReports', 'votes', 'speeches', 'questions', 'interpellations'];
  const isDocumentTypeKey = (value: string): value is DocumentTypeKey =>
    VALID_DOC_TYPES.includes(value as DocumentTypeKey);
  let docType: DocumentTypeKey | null = null;
  if (docTypeArg !== null) {
    if (!isDocumentTypeKey(docTypeArg)) {
      throw new Error(
        `Invalid --doc-type value: ${docTypeArg}. Supported values: ${VALID_DOC_TYPES.join(', ')}.`,
      );
    }
    docType = docTypeArg;
  }

  const documentIdsArg = get('--document-ids');
  const DOK_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
  const documentIds = documentIdsArg
    ? documentIdsArg.split(',').map(id => id.trim()).filter(id => {
        if (!id) return false;
        if (!DOK_ID_PATTERN.test(id)) {
          console.warn(`⚠️ Skipping invalid document ID: ${id} (must be alphanumeric/hyphens/underscores only)`);
          return false;
        }
        return true;
      })
    : [];

  const autoFullTextTopNArg = get('--auto-full-text-top-n');
  let autoFullTextTopN: number | null = null;
  if (autoFullTextTopNArg !== null) {
    const parsed = Number(autoFullTextTopNArg);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`Invalid --auto-full-text-top-n value: ${autoFullTextTopNArg}. Expected a non-negative integer.`);
    }
    autoFullTextTopN = parsed;
  }

  const fullTextForAll = args.includes('--full-text-for-all');

  return { date: isoDate, aggregate, limit, weekLabel, rm, docType, documentIds, autoFullTextTopN, fullTextForAll };
}

/**
 * Resolve the effective full-text follow-up target for the current run.
 *
 * Resolution order:
 * 1. `--full-text-for-all` always wins and fetches the entire selected batch.
 * 2. `--auto-full-text-top-n 0` explicitly disables the follow-up fetch.
 * 3. Long-horizon batches (`--limit >= 30`) enforce a minimum floor of
 *    `LONG_HORIZON_FULL_TEXT_FLOOR` so year-ahead style runs cannot silently stay
 *    at the old top-5 behaviour.
 * 4. Shorter-horizon runs preserve the caller-supplied top-N or `null`.
 */
export function resolveAutoFullTextTopN(
  limit: number,
  autoFullTextTopN: number | null,
  fullTextForAll: boolean,
  docCount = 0,
): number | null {
  if (fullTextForAll) {
    return Math.max(0, docCount);
  }
  if (autoFullTextTopN === 0) {
    return 0;
  }
  const longHorizonFloorApplies = limit >= 30;
  if (autoFullTextTopN === null) {
    return longHorizonFloorApplies ? LONG_HORIZON_FULL_TEXT_FLOOR : null;
  }
  if (longHorizonFloorApplies && autoFullTextTopN > 0) {
    return Math.max(autoFullTextTopN, LONG_HORIZON_FULL_TEXT_FLOOR);
  }
  return autoFullTextTopN;
}

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function parseAndValidateIsoDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) return null;
  return d;
}

function riksMoteFromDate(dateStr: string): string {
  const parsed = parseAndValidateIsoDate(dateStr) ?? new Date();
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  if (month >= 10) return `${year}/${String(year + 1).slice(-2)}`;
  return `${year - 1}/${String(year).slice(-2)}`;
}

function parseIsoWeekLabel(label: string): { year: number; week: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(label);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

function isDateInIsoWeek(dateStr: string, weekLabel: string): boolean {
  const parsedDate = parseAndValidateIsoDate(dateStr);
  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedDate || !parsedWeek) return false;

  const isoThursday = new Date(parsedDate);
  const dayNum = isoThursday.getUTCDay() || 7;
  isoThursday.setUTCDate(isoThursday.getUTCDate() + 4 - dayNum);
  const isoYear = isoThursday.getUTCFullYear();
  const isoWeek = isoWeekNumber(parsedDate);

  return isoYear === parsedWeek.year && isoWeek === parsedWeek.week;
}

// ---------------------------------------------------------------------------
// File utilities
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Escape a value for use inside a single GitHub-flavoured Markdown table cell.
 *
 * MCP error/notes text and serialised queries can include `|`, raw newlines,
 * and backticks — all of which corrupt the table layout and make the
 * diagnostics unparseable for downstream gates. We collapse whitespace and
 * escape pipes so each diagnostic row remains a single, parseable row.
 */
function escapeMarkdownCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  return str
    .replace(/\r\n?/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\|/g, '\\|')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Data manifest serialization (factual download summary — NOT analysis)
// ---------------------------------------------------------------------------

function serializeDataManifest(
  date: string,
  generatedAt: string,
  dataSources: string[],
  docCounts: Record<string, number>,
  dateFilteredTotal: number,
  dataFreshness: string | null,
  toolDiagnostics: MCPToolInvocationDiagnostic[],
  documentCoverage: Array<{
    dokId: string;
    coverageState: MCPCoverageState;
    retrieval: string;
    tool: string;
    resultCount: number;
    notes: string;
  }>,
  retryQueueSummary: {
    processed: number;
    resolved: number;
    retained: number;
    expired: number;
    enqueued: number;
  },
  fullTextOutcomes?: FullTextFetchOutcome[],
  fullTextMode: 'top-n' | 'all' = 'top-n',
): string {
  const totalDocs = Object.values(docCounts).reduce((a, b) => a + b, 0);
  const lines: string[] = [
    `# Data Download Manifest — ${date}`,
    '',
    `**Generated**: ${generatedAt}`,
    `**Data Sources**: ${dataSources.join(', ')}`,
    `**Documents Downloaded**: ${totalDocs}`,
    `**Documents Selected (date-filtered)**: ${dateFilteredTotal}`,
    `**Produced By**: download-parliamentary-data script (data download only)`,
    '',
    '> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.',
    '> All political intelligence analysis (classification, risk assessment, SWOT,',
    '> threat analysis, stakeholder perspectives, significance scoring, cross-references,',
    '> and synthesis) MUST be performed by the AI agent following',
    '> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates',
    '> from `analysis/templates/`.',
    '',
    '## Document Counts by Type',
    '',
  ];

  for (const [type, count] of Object.entries(docCounts)) {
    lines.push(`- **${type}**: ${count} documents`);
  }

  lines.push('', '## Data Quality Notes', '');
  lines.push('All documents sourced from official riksdag-regering-mcp API.');
  if (dataFreshness) {
    lines.push(`Data sourced from ${dataFreshness} via lookback fallback — check freshness indicators.`);
  }

  if (toolDiagnostics.length > 0) {
    lines.push('', '## MCP Query Diagnostics', '');
    lines.push('| tool | query | result_count | coverage_state | notes |');
    lines.push('|------|-------|-------------:|----------------|-------|');
    for (const diag of toolDiagnostics) {
      const notes = diag.signal?.code
        ? `${diag.signal.code}: ${diag.signal.message}`
        : (diag.notes ?? '');
      const queryCell = '`' + escapeMarkdownCell(JSON.stringify(diag.query)) + '`';
      lines.push(
        `| ${escapeMarkdownCell(diag.tool)} | ${queryCell} | ${diag.resultCount} | ${escapeMarkdownCell(diag.coverageState)} | ${escapeMarkdownCell(notes)} |`,
      );
    }
  }

  if (documentCoverage.length > 0) {
    lines.push('', '## MCP Coverage State', '');
    lines.push('| dok_id | coverage_state | retrieval | tool | result_count | notes |');
    lines.push('|--------|----------------|-----------|------|-------------:|-------|');
    for (const row of documentCoverage) {
      lines.push(
        `| ${escapeMarkdownCell(row.dokId)} | ${escapeMarkdownCell(row.coverageState)} | ${escapeMarkdownCell(row.retrieval)} | ${escapeMarkdownCell(row.tool)} | ${row.resultCount} | ${escapeMarkdownCell(row.notes)} |`,
      );
    }
  }

  if (fullTextOutcomes && fullTextOutcomes.length > 0) {
    lines.push('', '## Full-Text Fetch Outcomes', '');
    lines.push('| dok_id | coverage_state | full_text_available | chars | retrieval | notes |');
    lines.push('|--------|----------------|--------------------:|------:|-----------|-------|');
    for (const o of fullTextOutcomes) {
      const available = o.success ? 'true' : 'false';
      const chars = o.chars > 0 ? String(o.chars) : '0';
      const notes = o.reason ?? (o.filePath ? `persisted: ${o.filePath}` : '');
      lines.push(`| ${escapeMarkdownCell(o.dokId)} | ${escapeMarkdownCell(o.coverageState)} | ${available} | ${chars} | ${escapeMarkdownCell(o.provenance.retrieval)} | ${escapeMarkdownCell(notes)} |`);
    }
    const successCount = fullTextOutcomes.filter(o => o.success).length;
    const coverageLabel = fullTextMode === 'all' ? 'selected documents' : 'top documents';
    lines.push('', `**Full-text retrieved**: ${successCount}/${fullTextOutcomes.length} ${coverageLabel}`);
  }

  lines.push('', '## Deferred Retrieval Queue', '');
  lines.push('| processed | resolved | retained | expired | enqueued |');
  lines.push('|----------:|---------:|---------:|--------:|---------:|');
  lines.push(
    `| ${retryQueueSummary.processed} | ${retryQueueSummary.resolved} | ${retryQueueSummary.retained} | ${retryQueueSummary.expired} | ${retryQueueSummary.enqueued} |`,
  );

  return lines.join('\n');
}

export { serializeDataManifest };

/**
 * Resolve a stable document identifier from the fields used across MCP payloads.
 *
 * Falls back through `dok_id`, `dokument_id`, and `dokumentnamn`, then returns
 * the supplied fallback when none of those identifiers are available.
 */
function extractDokId(doc: RawDocument, fallback: string): string {
  const asNonEmptyString = (value: unknown): string => typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : '';
  return (
    asNonEmptyString(doc.dok_id)
    || asNonEmptyString((doc as Record<string, unknown>)['dokument_id'])
    || asNonEmptyString((doc as Record<string, unknown>)['dokumentnamn'])
    || fallback
  );
}

/**
 * Build the per-document coverage summary table rendered into the manifest.
 *
 * This joins each downloaded document with any explicit full-text fetch outcome
 * and falls back to inferred MCP coverage metadata when no top-N outcome exists.
 */
function buildDocumentCoverageSummary(
  docs: RawDocument[],
  fullTextOutcomes: FullTextFetchOutcome[] | undefined,
  analysisRunDate?: string,
): Array<{
  dokId: string;
  coverageState: MCPCoverageState;
  retrieval: string;
  tool: string;
  resultCount: number;
  notes: string;
}> {
  const outcomeMap = new Map(fullTextOutcomes?.map(outcome => [outcome.dokId, outcome]) ?? []);
  // The analysis-run date should drive same-day inference, not the host
  // machine's wall clock. Fall back to today only when the caller did not
  // supply one (e.g. test helpers).
  const runDate = analysisRunDate ?? new Date().toISOString().slice(0, 10);
  return docs.map((doc, index) => {
    const dokId = extractDokId(doc, `unknown-doc-${index + 1}`);
    const outcome = outcomeMap.get(dokId);
    // Prefer outcome provenance (from fetchFullTextForTopN) over document-level provenance
    const provenance = outcome?.provenance ?? doc.mcpProvenance ?? buildMcpProvenance({
      endpoint: 'unknown',
      tool: 'unknown',
      query: { dok_id: dokId },
      resultCount: 0,
      coverageState: inferDocumentCoverageState(
        doc as Record<string, unknown>,
        {
          requestedDate: runDate,
          fullTextRequested: Boolean(doc.contentFetched),
        },
      ),
    });
    const notes = outcome?.reason
      ?? outcome?.filePath
      ?? (doc.contentFetched
        ? (typeof doc.summary === 'string' && doc.summary.trim().length > 0 ? 'summary present' : 'metadata-only payload')
        : 'list payload only; get_dokument_innehall not attempted in this run');
    return {
      dokId,
      coverageState: outcome?.coverageState ?? provenance.coverageState,
      retrieval: provenance.retrieval,
      tool: provenance.tool,
      resultCount: provenance.resultCount,
      notes,
    };
  });
}

// ---------------------------------------------------------------------------
// Weekly aggregation (data summary only — no analysis)
// ---------------------------------------------------------------------------

function runWeeklyAggregation(weekLabel: string): void {
  const weekDir = path.join(ANALYSIS_DIR, 'weekly', weekLabel);
  ensureDir(weekDir);

  const dailyRoot = path.join(ANALYSIS_DIR, 'daily');
  let includedDays = 0;
  let aggregatedDocumentsDownloaded = 0;
  const dayList: string[] = [];

  const parsedWeek = parseIsoWeekLabel(weekLabel);
  if (!parsedWeek) {
    throw new Error(`Invalid ISO week label: ${weekLabel}. Expected format YYYY-WNN`);
  }

  if (fs.existsSync(dailyRoot)) {
    const dailyDirs = fs.readdirSync(dailyRoot).sort();
    const KNOWN_DOC_TYPES = new Set<string>([
      'propositions', 'motions', 'committeeReports', 'votes',
      'speeches', 'questions', 'interpellations',
    ]);
    for (const dir of dailyDirs) {
      if (!isDateInIsoWeek(dir, weekLabel)) continue;
      const dayDir = path.join(dailyRoot, dir);
      const unscopedManifest = path.join(dayDir, 'data-download-manifest.md');
      let dayHasData = false;

      if (fs.existsSync(unscopedManifest)) {
        dayHasData = true;
        const content = fs.readFileSync(unscopedManifest, 'utf8');
        const docsMatch = /(?:^|\n)\*\*Documents Downloaded\*\*:\s*(\d+)/.exec(content)
          || /(?:^|\n)\*\*Documents Analyzed\*\*:\s*(\d+)/.exec(content);
        if (docsMatch?.[1]) {
          aggregatedDocumentsDownloaded += Number(docsMatch[1]);
        }
      }

      if (fs.existsSync(dayDir) && fs.statSync(dayDir).isDirectory()) {
        for (const sub of fs.readdirSync(dayDir).sort()) {
          if (!KNOWN_DOC_TYPES.has(sub)) continue;
          const subManifest = path.join(dayDir, sub, 'data-download-manifest.md');
          if (fs.existsSync(subManifest) && !dayHasData) {
            dayHasData = true;
            const content = fs.readFileSync(subManifest, 'utf8');
            const docsMatch = /(?:^|\n)\*\*Documents Downloaded\*\*:\s*(\d+)/.exec(content)
              || /(?:^|\n)\*\*Documents Analyzed\*\*:\s*(\d+)/.exec(content);
            if (docsMatch?.[1]) {
              aggregatedDocumentsDownloaded += Number(docsMatch[1]);
            }
          }
        }
      }

      if (dayHasData) {
        includedDays++;
        dayList.push(dir);
      }
    }
  }

  const weeklyContent = buildWeeklySummaryMarkdown({
    weekLabel,
    generatedAt: formatTimestampForMarkdown(),
    documentsDownloaded: aggregatedDocumentsDownloaded,
    daysIncluded: includedDays,
    dayList,
  });

  const filePath = path.join(weekDir, 'weekly-data-summary.md');
  fs.writeFileSync(filePath, weeklyContent, 'utf8');
  console.log(`  ✅ Written: ${path.relative(REPO_ROOT, filePath)}`);
  console.log(`\n✅ Weekly data summary written to analysis/weekly/${weekLabel}/`);
}

export function buildWeeklySummaryMarkdown(opts: {
  weekLabel: string;
  generatedAt: string;
  documentsDownloaded: number;
  daysIncluded: number;
  dayList: string[];
}): string {
  return [
    `# Weekly Data Summary — ${opts.weekLabel}`,
    '',
    `**Generated**: ${opts.generatedAt}`,
    '**Data Sources**: Aggregated from daily data download manifests',
    `**Documents Downloaded**: ${opts.documentsDownloaded}`,
    `**Period**: ${opts.weekLabel}`,
    `**Days Included**: ${opts.daysIncluded}`,
    '',
    '> ℹ️ **Data-Only Summary**: This file summarizes downloaded data for the week.',
    '> All political intelligence analysis MUST be performed by AI agents following',
    '> `analysis/methodologies/ai-driven-analysis-guide.md`.',
    '',
    '## Days with Data',
    '',
    opts.dayList.length > 0
      ? opts.dayList.map(d => `- ${d}`).join('\n')
      : '_No data downloads found for this week._',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main pipeline — DATA DOWNLOAD ONLY
// ---------------------------------------------------------------------------

async function runPreArticleAnalysis(opts: {
  date: string;
  limit: number;
  aggregate: boolean;
  weekLabel: string | null;
  rm: string | null;
  docType: DocumentTypeKey | null;
  documentIds: string[];
  autoFullTextTopN: number | null;
  fullTextForAll: boolean;
}): Promise<void> {
  const { date, limit, aggregate, weekLabel, rm, docType, documentIds, autoFullTextTopN, fullTextForAll } = opts;

  if (aggregate && weekLabel) {
    console.log(`\n📅 Running weekly data summary for: ${weekLabel}`);
    runWeeklyAggregation(weekLabel);
    return;
  }

  console.log(`\n🚀 Pre-Article Data Download Pipeline — ${date}`);
  console.log('='.repeat(50));
  console.log('ℹ️  This script downloads data ONLY. Analysis is performed by AI agents.');
  console.log('   See: analysis/methodologies/ai-driven-analysis-guide.md');

  const outputDir = docType
    ? path.join(ANALYSIS_DIR, 'daily', date, docType)
    : path.join(ANALYSIS_DIR, 'daily', date);
  ensureDir(outputDir);

  const generatedAt = formatTimestampForMarkdown();

  console.log('\n📥 Step 1: Downloading documents from riksdag-regering-mcp...');
  if (docType) {
    console.log(`   📋 Scoped to document type: ${docType}`);
  }
  const client = new MCPClient();
  const retryDrain = await drainMcpRetryQueue(client, {
    docType,
    queuePath: DEFAULT_MCP_RETRY_QUEUE_PATH,
    maxEntries: 25,
  });
  const resolvedRm = rm ?? riksMoteFromDate(date);

  const downloadOpts: { limit: number; rm: string; docTypes?: DocumentTypeKey[]; enrichLimit?: number; analysisRunDate?: string } = { limit, rm: resolvedRm, analysisRunDate: date };
  if (docType) {
    downloadOpts.docTypes = [docType];
  }
  const prefetchEnrichLimit = resolveAutoFullTextTopN(limit, autoFullTextTopN, false);
  if (prefetchEnrichLimit !== null) {
    downloadOpts.enrichLimit = prefetchEnrichLimit;
    if (autoFullTextTopN !== null && prefetchEnrichLimit !== autoFullTextTopN) {
      console.log(`   📝 Full-text enrichment floor raised to ${prefetchEnrichLimit} for long-horizon batch (requested ${autoFullTextTopN})`);
    } else if (autoFullTextTopN === null && prefetchEnrichLimit > 0) {
      console.log(`   📝 Full-text enrichment defaulted to top ${prefetchEnrichLimit} documents per type for long-horizon batch`);
    } else {
      console.log(`   📝 Full-text enrichment: top ${prefetchEnrichLimit} documents per type (--auto-full-text-top-n=${prefetchEnrichLimit})`);
    }
  }

  const { data, manifest } = await downloadAllDocuments(client, downloadOpts);
  const flattenedDocs = flattenDocuments(data);

  const requestedIdSet = new Set(documentIds.map(id => id.toUpperCase()));

  const allDocs = flattenedDocs.filter((doc: RawDocument) => {
    const docId = doc.dok_id ?? '';
    if (requestedIdSet.size > 0 && requestedIdSet.has(docId.toUpperCase())) {
      return true;
    }
    if (doc.datum && typeof doc.datum === 'string') {
      return doc.datum.slice(0, 10) === date;
    }
    return false;
  });

  let dataFreshness: string | null = null;
  if (allDocs.length === 0 && requestedIdSet.size === 0) {
    for (let lookback = 1; lookback <= MAX_LOOKBACK_BUSINESS_DAYS; lookback++) {
      const lookbackDate = subtractBusinessDays(date, lookback);
      const lookbackDocs = flattenedDocs.filter((doc: RawDocument) => {
        if (doc.datum && typeof doc.datum === 'string') {
          return doc.datum.slice(0, 10) === lookbackDate;
        }
        return false;
      });
      if (lookbackDocs.length > 0) {
        allDocs.push(...lookbackDocs);
        dataFreshness = lookbackDate;
        console.log(`   🔄 Lookback fallback: 0 documents for ${date}, using ${lookbackDocs.length} documents from ${lookbackDate} (${lookback} business day(s) back)`);
        break;
      }
    }
    if (allDocs.length === 0) {
      console.warn(`   ⚠️  Lookback exhausted (${MAX_LOOKBACK_BUSINESS_DAYS} business days) — no recent documents found in downloaded batch.`);
    }
  }

  if (requestedIdSet.size > 0) {
    const foundIds = new Set(allDocs.map((d: RawDocument) => (d.dok_id ?? '').toUpperCase()));
    const missingIds = documentIds.filter(id => !foundIds.has(id.toUpperCase()));
    if (missingIds.length > 0) {
      console.log(`   🔍 Fetching ${missingIds.length} targeted document(s) by ID: ${missingIds.join(', ')}`);
      for (const dokId of missingIds) {
        try {
          const result = await client.fetchDocumentDetailsWithCoverage(dokId, false, {
            requestedDate: date,
          });
          if (result.document && typeof result.document === 'object') {
            const doc = result.document as unknown as RawDocument;
            if (!doc.dok_id) {
              (doc as Record<string, unknown>).dok_id = dokId;
            }
            allDocs.push(doc);
            console.log(`   ✅ Fetched document ${dokId}: ${(doc as Record<string, unknown>).titel ?? (doc as Record<string, unknown>).title ?? '(no title)'}`);
          }
        } catch (err) {
          console.warn(`   ⚠️ Failed to fetch document ${dokId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  if (Object.keys(retryDrain.resolvedVoteringar).length > 0) {
    let mergedVoteCount = 0;
    for (const [queryKey, items] of Object.entries(retryDrain.resolvedVoteringar)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      data.votes.push(...(items as RawDocument[]));
      mergedVoteCount += items.length;
      console.log(`   🗳️  Recovered ${items.length} voteringar from deferred queue (${queryKey})`);
    }
    if (mergedVoteCount > 0) {
      console.log(`   🔁 Deferred queue restored ${mergedVoteCount} voteringar row(s) — appended to current-run output`);
    }
  }

  if (Object.keys(retryDrain.resolvedDocuments).length > 0) {
    const resolvedIds = new Set(Object.keys(retryDrain.resolvedDocuments));
    const mergedIds = new Set<string>();
    for (const doc of allDocs) {
      const dokId = extractDokId(doc, '');
      if (!dokId || !resolvedIds.has(dokId)) continue;
      Object.assign(doc, retryDrain.resolvedDocuments[dokId]);
      mergedIds.add(dokId);
    }
    // Append resolved documents that aren't already in allDocs (e.g. from a prior
    // run's queue where the document is no longer selected by current date filters)
    for (const dokId of resolvedIds) {
      if (mergedIds.has(dokId)) continue;
      const resolvedDoc = retryDrain.resolvedDocuments[dokId] as RawDocument;
      if (resolvedDoc) {
        allDocs.push(resolvedDoc);
        mergedIds.add(dokId);
      }
    }
    console.log(`   🔁 Deferred queue restored full text for ${mergedIds.size} document(s)`);
  }

  const excludedDocsCount = Math.max(0, flattenedDocs.length - allDocs.length);

  console.log(`   Downloaded ${flattenedDocs.length} unique documents from ${manifest.dataSources.length} MCP tools`);
  console.log(
    `   Selected ${allDocs.length} documents for ${date} (${excludedDocsCount} with missing or non-matching dates excluded)`,
  );
  if (dataFreshness) {
    console.log(`   📅 Data freshness: documents sourced from ${dataFreshness} (lookback active)`);
  }
  console.log(`   Duration: ${manifest.durationMs}ms`);
  console.log(`   Riksmöte: ${resolvedRm}`);

  console.log('\n🗄️  Step 2: Persisting raw MCP data to analysis/data/...');
  const persistResult = persistDownloadedData(data, resolvedRm);
  console.log(`   🗄️  Persisted data for ${persistResult.written} documents to ${path.relative(REPO_ROOT, persistResult.dataRoot)}/ (${persistResult.skipped} skipped)`);

  let fullTextOutcomes: FullTextFetchOutcome[] | undefined;
  const queueEntries = manifest.toolDiagnostics
    .filter(diag => diag.signal?.code === 'MCP_INDEXING_LAG')
    .map(diag => createRetryQueueEntry({
      resourceType: 'voteringar_search',
      resourceId: `search_voteringar:${JSON.stringify(diag.query)}`,
      tool: diag.tool,
      coverageState: diag.coverageState,
      docType,
      params: diag.query,
      reason: diag.signal?.message,
      requestedAt: new Date().toISOString(),
    }));
  const effectiveAutoFullTextTopN = resolveAutoFullTextTopN(limit, autoFullTextTopN, fullTextForAll, allDocs.length);
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0 && allDocs.length > 0) {
    if (fullTextForAll) {
      console.log(`\n📄 Step 2b: Auto-fetching full text for ALL ${effectiveAutoFullTextTopN} selected documents (--full-text-for-all)...`);
    } else if (autoFullTextTopN !== null && effectiveAutoFullTextTopN !== autoFullTextTopN) {
      console.log(`\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (long-horizon floor raised from ${autoFullTextTopN})...`);
    } else if (autoFullTextTopN === null) {
      console.log(`\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (long-horizon default)...`);
    } else {
      console.log(`\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (--auto-full-text-top-n=${effectiveAutoFullTextTopN})...`);
    }
    console.log('   ⏱️  This may take 30–60 s — documented quality investment for deep-analysis tiers.');
    fullTextOutcomes = await fetchFullTextForTopN(client, allDocs, effectiveAutoFullTextTopN, outputDir, { runDate: date });
    const successCount = fullTextOutcomes.filter(o => o.success).length;
    console.log(`   ✅ Full text retrieved for ${successCount}/${fullTextOutcomes.length} document(s)`);
    for (const o of fullTextOutcomes) {
      if (o.success) {
        console.log(`      ✅ ${o.dokId}: ${o.chars} chars → ${o.filePath}`);
      } else {
        console.warn(`      ⚠️ ${o.dokId}: ${o.reason}`);
      }
    }
  }

  for (const doc of allDocs) {
    const record = doc as Record<string, unknown>;
    if (!record['mcpCoverageState']) {
      // Use the pipeline's analysis date (today's run, normalized via `date`)
      // as the `requestedDate`. Using `doc.datum` here would incorrectly
      // classify any dated metadata-only document as a same-day filing.
      const coverageState = inferDocumentCoverageState(record, {
        requestedDate: date,
        fullTextRequested: Boolean(doc.contentFetched),
      });
      record['mcpCoverageState'] = coverageState;
      record['mcpProvenance'] = buildMcpProvenance({
        endpoint: client.baseURL,
        tool: 'download-parliamentary-data',
        query: { dok_id: extractDokId(doc, '') },
        resultCount: 1,
        coverageState,
      });
    }
  }

  if (fullTextOutcomes) {
    const docMap = new Map(allDocs.map(doc => [extractDokId(doc, ''), doc]));
    for (const outcome of fullTextOutcomes) {
      const doc = docMap.get(outcome.dokId);
      if (!doc) continue;
      if (outcome.coverageState !== 'full_text' && typeof doc.datum === 'string' && doc.datum.slice(0, 10) === date) {
        queueEntries.push(createRetryQueueEntry({
          resourceType: 'document_fulltext',
          resourceId: outcome.dokId,
          tool: 'get_dokument_innehall',
          coverageState: outcome.coverageState,
          docType,
          params: { requestedDate: doc.datum.slice(0, 10), include_full_text: true },
          reason: outcome.reason,
          requestedAt: new Date().toISOString(),
        }));
      }
    }
  }

  // Fallback retry-queue enrolment for the default (non-top-N) flow:
  // `downloadAllDocuments()` already attempts limited full-text enrichment
  // (`MAX_ENRICHMENT_PER_TYPE`) and can set `mcpCoverageState: 'not_indexed'`,
  // but those documents are not represented in `fullTextOutcomes`. Without
  // this loop, same-day not-yet-indexed documents are silently dropped from
  // the deferred retry queue instead of being scheduled for a later run.
  const alreadyQueuedDocIds = new Set(
    queueEntries
      .filter(e => e.resourceType === 'document_fulltext')
      .map(e => e.resourceId),
  );
  for (const doc of allDocs) {
    const record = doc as Record<string, unknown>;
    const coverageState = record['mcpCoverageState'] as MCPCoverageState | undefined;
    if (coverageState !== 'not_indexed') continue;
    if (typeof doc.datum !== 'string' || doc.datum.slice(0, 10) !== date) continue;
    const dokId = extractDokId(doc, '');
    if (!dokId || alreadyQueuedDocIds.has(dokId)) continue;
    const provenanceReason = record['mcpProvenance']
      && typeof (record['mcpProvenance'] as Record<string, unknown>)['signals'] === 'object'
      ? undefined
      : `Same-day enrichment returned ${coverageState} for ${dokId}`;
    queueEntries.push(createRetryQueueEntry({
      resourceType: 'document_fulltext',
      resourceId: dokId,
      tool: 'get_dokument_innehall',
      coverageState,
      docType,
      params: { requestedDate: doc.datum.slice(0, 10), include_full_text: true },
      reason: provenanceReason,
      requestedAt: new Date().toISOString(),
    }));
    alreadyQueuedDocIds.add(dokId);
  }

  const updatedQueue = queueEntries.length > 0
    ? enqueueRetryEntries(queueEntries, DEFAULT_MCP_RETRY_QUEUE_PATH)
    : null;
  const queueRetainedTotal = updatedQueue?.entries.length ?? retryDrain.queue.entries.length;

  const documentCoverage = buildDocumentCoverageSummary(allDocs, fullTextOutcomes, date);
  const manifestContent = serializeDataManifest(
    date, generatedAt, manifest.dataSources, manifest.docCounts,
    allDocs.length, dataFreshness, [...manifest.toolDiagnostics, ...retryDrain.diagnostics],
    documentCoverage,
    {
      processed: retryDrain.processed,
      resolved: retryDrain.resolved,
      retained: queueRetainedTotal,
      expired: retryDrain.expired,
      enqueued: queueEntries.length,
    },
    fullTextOutcomes,
    fullTextForAll ? 'all' : 'top-n',
  );
  const manifestPath = path.join(outputDir, 'data-download-manifest.md');
  fs.writeFileSync(manifestPath, manifestContent, 'utf8');
  console.log(`  ✅ Written: ${path.relative(REPO_ROOT, manifestPath)}`);

  console.log('\n💾 Step 3: Storing downloaded documents as JSON...');
  const documentsDir = path.join(outputDir, 'documents');
  ensureDir(documentsDir);
  let storedCount = 0;
  for (let i = 0; i < allDocs.length; i++) {
    const doc = allDocs[i];
    const dokId = doc.dok_id || doc.titel || doc.title || `unknown-doc-${i + 1}`;
    const baseName = sanitizeDokId(dokId) || `unknown-doc-${i + 1}`;
    let fileName = baseName;
    let attempt = 0;
    while (fs.existsSync(path.join(documentsDir, `${fileName}.json`))) {
      attempt++;
      fileName = `${baseName}-${attempt}`;
    }
    const docJson = JSON.stringify(doc, null, 2);
    fs.writeFileSync(path.join(documentsDir, `${fileName}.json`), docJson, 'utf8');
    storedCount++;
  }
  console.log(`   💾 Stored ${storedCount} documents as JSON in ${path.relative(REPO_ROOT, documentsDir)}/`);

  if (allDocs.length === 0) {
    console.warn('\n⚠️  No documents downloaded for this date.');
  }

  const totalFiles = 1 + storedCount;
  console.log(`\n✅ Data download complete! Results in: ${path.relative(REPO_ROOT, outputDir)}/`);
  console.log(`   📄 ${totalFiles} total files written (1 manifest + ${storedCount} documents)`);
  console.log(`   📊 ${allDocs.length} documents available for AI analysis`);
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0) {
    const successCount = fullTextOutcomes?.filter(o => o.success).length ?? 0;
    const attempted = fullTextOutcomes?.length ?? 0;
    if (fullTextForAll) {
      console.log(`   📄 Full text: ${successCount}/${attempted} document(s) (full batch coverage; see full-text/ sub-folder)`);
    } else {
      console.log(`   📄 Full text: ${successCount}/${attempted} top-${effectiveAutoFullTextTopN} documents from flattened batch (see full-text/ sub-folder)`);
    }
  }
  if (docType) {
    console.log(`   📋 Scoped to: ${docType}`);
  }
  console.log('');
  console.log('   ℹ️  Next step: AI agent performs analysis using:');
  console.log('      - analysis/methodologies/ai-driven-analysis-guide.md');
  console.log('      - analysis/templates/ (per-file analysis templates)');
  console.log('      - npx tsx scripts/catalog-downloaded-data.ts --pending-only');
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0) {
    if (fullTextForAll) {
      console.log(`      ℹ️  Significance-scoring note: all ${effectiveAutoFullTextTopN} selected documents`);
      console.log('         (across types) had full text fetched to sidecar files.');
    } else {
      console.log(`      ℹ️  Significance-scoring note: top-${effectiveAutoFullTextTopN} documents from the`);
      console.log('         flattened batch had full text fetched to sidecar files — AI');
      console.log('         significance-scoring step should prioritise those documents for deeper analysis.');
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  const args = parseArgs(process.argv);

  runPreArticleAnalysis(args).catch((err: unknown) => {
    console.error('[download-parliamentary-data] Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
