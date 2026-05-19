/**
 * @module download-parliamentary-data/pre-article-analysis
 * @description Main pipeline body — downloads documents from
 * riksdag-regering-mcp, filters by analysis date (with business-day lookback),
 * applies the deferred retry queue, persists raw MCP data, fetches top-N
 * full-text content, and writes the data-download manifest + per-document
 * JSON files. Pure data-only — NO political intelligence analysis.
 *
 * Extracted verbatim from the original `scripts/download-parliamentary-data.ts`
 * so test contracts (`tests/auto-full-text-top-n.test.ts`, etc.) stay valid.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from '../mcp-client/client.js';
import type { RawDocument } from '../data-transformers/types.js';
import type { MCPCoverageState } from '../types/mcp.js';

import {
  downloadAllDocuments,
  flattenDocuments,
  subtractBusinessDays,
  MAX_LOOKBACK_BUSINESS_DAYS,
  fetchFullTextForTopN,
} from '../parliamentary-data/data-downloader.js';
import type {
  DocumentTypeKey,
  FullTextFetchOutcome,
} from '../parliamentary-data/data-downloader.js';

import {
  persistDownloadedData,
  sanitizeDokId,
} from '../parliamentary-data/data-persistence.js';
import {
  createRetryQueueEntry,
  DEFAULT_MCP_RETRY_QUEUE_PATH,
  drainMcpRetryQueue,
  enqueueRetryEntries,
} from '../parliamentary-data/mcp-retry-queue.js';
import {
  buildMcpProvenance,
  inferDocumentCoverageState,
} from '../mcp-client/coverage.js';

import { resolveAutoFullTextTopN } from './args.js';
import { riksMoteFromDate } from './rm-helpers.js';
import { runWeeklyAggregation } from './weekly-aggregation.js';
import {
  buildDocumentCoverageSummary,
  extractDokId,
  formatTimestampForMarkdown,
  serializeDataManifest,
} from './manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export interface RunPreArticleAnalysisOptions {
  date: string;
  limit: number;
  aggregate: boolean;
  weekLabel: string | null;
  rm: string | null;
  docType: DocumentTypeKey | null;
  documentIds: string[];
  autoFullTextTopN: number | null;
  fullTextForAll: boolean;
}

/**
 * Run the full pre-article data download pipeline. Writes manifest + per-doc
 * JSON files to `analysis/daily/{date}/{docType?}/` and, when running in
 * `--aggregate weekly` mode, delegates to `runWeeklyAggregation()`.
 */
export async function runPreArticleAnalysis(
  opts: RunPreArticleAnalysisOptions,
): Promise<void> {
  const {
    date,
    limit,
    aggregate,
    weekLabel,
    rm,
    docType,
    documentIds,
    autoFullTextTopN,
    fullTextForAll,
  } = opts;

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

  const downloadOpts: {
    limit: number;
    rm: string;
    docTypes?: DocumentTypeKey[];
    enrichLimit?: number;
    analysisRunDate?: string;
  } = { limit, rm: resolvedRm, analysisRunDate: date };
  if (docType) {
    downloadOpts.docTypes = [docType];
  }
  const prefetchEnrichLimit = resolveAutoFullTextTopN(limit, autoFullTextTopN, false);
  if (prefetchEnrichLimit !== null) {
    downloadOpts.enrichLimit = prefetchEnrichLimit;
    if (autoFullTextTopN !== null && prefetchEnrichLimit !== autoFullTextTopN) {
      console.log(
        `   📝 Full-text enrichment floor raised to ${prefetchEnrichLimit} for long-horizon batch (requested ${autoFullTextTopN})`,
      );
    } else if (autoFullTextTopN === null && prefetchEnrichLimit > 0) {
      console.log(
        `   📝 Full-text enrichment defaulted to top ${prefetchEnrichLimit} documents per type for long-horizon batch`,
      );
    } else {
      console.log(
        `   📝 Full-text enrichment: top ${prefetchEnrichLimit} documents per type (--auto-full-text-top-n=${prefetchEnrichLimit})`,
      );
    }
  }

  const { data, manifest } = await downloadAllDocuments(client, downloadOpts);
  const flattenedDocs = flattenDocuments(data);

  const requestedIdSet = new Set(documentIds.map((id) => id.toUpperCase()));

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
        console.log(
          `   🔄 Lookback fallback: 0 documents for ${date}, using ${lookbackDocs.length} documents from ${lookbackDate} (${lookback} business day(s) back)`,
        );
        break;
      }
    }
    if (allDocs.length === 0) {
      console.warn(
        `   ⚠️  Lookback exhausted (${MAX_LOOKBACK_BUSINESS_DAYS} business days) — no recent documents found in downloaded batch.`,
      );
    }
  }

  if (requestedIdSet.size > 0) {
    const foundIds = new Set(allDocs.map((d: RawDocument) => (d.dok_id ?? '').toUpperCase()));
    const missingIds = documentIds.filter((id) => !foundIds.has(id.toUpperCase()));
    if (missingIds.length > 0) {
      console.log(
        `   🔍 Fetching ${missingIds.length} targeted document(s) by ID: ${missingIds.join(', ')}`,
      );
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
            console.log(
              `   ✅ Fetched document ${dokId}: ${(doc as Record<string, unknown>).titel ?? (doc as Record<string, unknown>).title ?? '(no title)'}`,
            );
          }
        } catch (err) {
          console.warn(
            `   ⚠️ Failed to fetch document ${dokId}: ${err instanceof Error ? err.message : String(err)}`,
          );
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
      console.log(
        `   🔁 Deferred queue restored ${mergedVoteCount} voteringar row(s) — appended to current-run output`,
      );
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

  console.log(
    `   Downloaded ${flattenedDocs.length} unique documents from ${manifest.dataSources.length} MCP tools`,
  );
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
  console.log(
    `   🗄️  Persisted data for ${persistResult.written} documents to ${path.relative(REPO_ROOT, persistResult.dataRoot)}/ (${persistResult.skipped} skipped)`,
  );

  let fullTextOutcomes: FullTextFetchOutcome[] | undefined;
  const queueEntries = manifest.toolDiagnostics
    .filter((diag) => diag.signal?.code === 'MCP_INDEXING_LAG')
    .map((diag) =>
      createRetryQueueEntry({
        resourceType: 'voteringar_search',
        resourceId: `search_voteringar:${JSON.stringify(diag.query)}`,
        tool: diag.tool,
        coverageState: diag.coverageState,
        docType,
        params: diag.query,
        reason: diag.signal?.message,
        requestedAt: new Date().toISOString(),
      }),
    );
  const effectiveAutoFullTextTopN = resolveAutoFullTextTopN(
    limit,
    autoFullTextTopN,
    fullTextForAll,
    allDocs.length,
  );
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0 && allDocs.length > 0) {
    if (fullTextForAll) {
      console.log(
        `\n📄 Step 2b: Auto-fetching full text for ALL ${effectiveAutoFullTextTopN} selected documents (--full-text-for-all)...`,
      );
    } else if (autoFullTextTopN !== null && effectiveAutoFullTextTopN !== autoFullTextTopN) {
      console.log(
        `\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (long-horizon floor raised from ${autoFullTextTopN})...`,
      );
    } else if (autoFullTextTopN === null) {
      console.log(
        `\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (long-horizon default)...`,
      );
    } else {
      console.log(
        `\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (--auto-full-text-top-n=${effectiveAutoFullTextTopN})...`,
      );
    }
    console.log(
      '   ⏱️  This may take 30–60 s — documented quality investment for deep-analysis tiers.',
    );
    fullTextOutcomes = await fetchFullTextForTopN(
      client,
      allDocs,
      effectiveAutoFullTextTopN,
      outputDir,
      { runDate: date },
    );
    const successCount = fullTextOutcomes.filter((o) => o.success).length;
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
    const docMap = new Map(allDocs.map((doc) => [extractDokId(doc, ''), doc]));
    for (const outcome of fullTextOutcomes) {
      const doc = docMap.get(outcome.dokId);
      if (!doc) continue;
      if (
        outcome.coverageState !== 'full_text' &&
        typeof doc.datum === 'string' &&
        doc.datum.slice(0, 10) === date
      ) {
        queueEntries.push(
          createRetryQueueEntry({
            resourceType: 'document_fulltext',
            resourceId: outcome.dokId,
            tool: 'get_dokument_innehall',
            coverageState: outcome.coverageState,
            docType,
            params: { requestedDate: doc.datum.slice(0, 10), include_full_text: true },
            reason: outcome.reason,
            requestedAt: new Date().toISOString(),
          }),
        );
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
      .filter((e) => e.resourceType === 'document_fulltext')
      .map((e) => e.resourceId),
  );
  for (const doc of allDocs) {
    const record = doc as Record<string, unknown>;
    const coverageState = record['mcpCoverageState'] as MCPCoverageState | undefined;
    if (coverageState !== 'not_indexed') continue;
    if (typeof doc.datum !== 'string' || doc.datum.slice(0, 10) !== date) continue;
    const dokId = extractDokId(doc, '');
    if (!dokId || alreadyQueuedDocIds.has(dokId)) continue;
    const provenanceReason =
      record['mcpProvenance'] &&
      typeof (record['mcpProvenance'] as Record<string, unknown>)['signals'] === 'object'
        ? undefined
        : `Same-day enrichment returned ${coverageState} for ${dokId}`;
    queueEntries.push(
      createRetryQueueEntry({
        resourceType: 'document_fulltext',
        resourceId: dokId,
        tool: 'get_dokument_innehall',
        coverageState,
        docType,
        params: { requestedDate: doc.datum.slice(0, 10), include_full_text: true },
        reason: provenanceReason,
        requestedAt: new Date().toISOString(),
      }),
    );
    alreadyQueuedDocIds.add(dokId);
  }

  const updatedQueue =
    queueEntries.length > 0
      ? enqueueRetryEntries(queueEntries, DEFAULT_MCP_RETRY_QUEUE_PATH)
      : null;
  const queueRetainedTotal = updatedQueue?.entries.length ?? retryDrain.queue.entries.length;

  const documentCoverage = buildDocumentCoverageSummary(allDocs, fullTextOutcomes, date);
  const manifestContent = serializeDataManifest(
    date,
    generatedAt,
    manifest.dataSources,
    manifest.docCounts,
    allDocs.length,
    dataFreshness,
    [...manifest.toolDiagnostics, ...retryDrain.diagnostics],
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
  console.log(
    `   💾 Stored ${storedCount} documents as JSON in ${path.relative(REPO_ROOT, documentsDir)}/`,
  );

  if (allDocs.length === 0) {
    console.warn('\n⚠️  No documents downloaded for this date.');
  }

  const totalFiles = 1 + storedCount;
  console.log(`\n✅ Data download complete! Results in: ${path.relative(REPO_ROOT, outputDir)}/`);
  console.log(`   📄 ${totalFiles} total files written (1 manifest + ${storedCount} documents)`);
  console.log(`   📊 ${allDocs.length} documents available for AI analysis`);
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0) {
    const successCount = fullTextOutcomes?.filter((o) => o.success).length ?? 0;
    const attempted = fullTextOutcomes?.length ?? 0;
    if (fullTextForAll) {
      console.log(
        `   📄 Full text: ${successCount}/${attempted} document(s) (full batch coverage; see full-text/ sub-folder)`,
      );
    } else {
      console.log(
        `   📄 Full text: ${successCount}/${attempted} top-${effectiveAutoFullTextTopN} documents from flattened batch (see full-text/ sub-folder)`,
      );
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
      console.log(
        `      ℹ️  Significance-scoring note: all ${effectiveAutoFullTextTopN} selected documents`,
      );
      console.log('         (across types) had full text fetched to sidecar files.');
    } else {
      console.log(
        `      ℹ️  Significance-scoring note: top-${effectiveAutoFullTextTopN} documents from the`,
      );
      console.log('         flattened batch had full text fetched to sidecar files — AI');
      console.log(
        '         significance-scoring step should prioritise those documents for deeper analysis.',
      );
    }
  }
}
