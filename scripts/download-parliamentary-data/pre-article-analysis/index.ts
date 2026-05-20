/**
 * @module download-parliamentary-data/pre-article-analysis
 * @description Main pipeline body — downloads documents from
 * riksdag-regering-mcp, filters by analysis date (with business-day lookback),
 * applies the deferred retry queue, persists raw MCP data, fetches top-N
 * full-text content, and writes the data-download manifest + per-document
 * JSON files. Pure data-only — NO political intelligence analysis.
 *
 * Originally a single 531-line module — now an orchestrator that composes
 * four focused siblings:
 *   - {@link ./document-filter}    — filter by date + lookback + ID fetch
 *   - {@link ./retry-merge}        — merge resolved retry-queue results
 *   - {@link ./coverage-tagging}   — coverage state + retry-queue entries
 *   - {@link ./output-writer}      — manifest + per-doc JSON + final logs
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from '../../mcp-client/client.js';
import {
  downloadAllDocuments,
  flattenDocuments,
  fetchFullTextForTopN,
} from '../../parliamentary-data/data-downloader.js';
import type {
  DocumentTypeKey,
  FullTextFetchOutcome,
} from '../../parliamentary-data/data-downloader.js';
import { persistDownloadedData } from '../../parliamentary-data/data-persistence.js';
import {
  DEFAULT_MCP_RETRY_QUEUE_PATH,
  drainMcpRetryQueue,
  enqueueRetryEntries,
} from '../../parliamentary-data/mcp-retry-queue.js';

import { resolveAutoFullTextTopN } from '../args.js';
import { riksMoteFromDate } from '../rm-helpers.js';
import { runWeeklyAggregation } from '../weekly-aggregation.js';
import {
  buildDocumentCoverageSummary,
  formatTimestampForMarkdown,
  serializeDataManifest,
} from '../manifest.js';

import {
  fetchMissingDocumentsByIds,
  filterByDateWithLookback,
} from './document-filter.js';
import {
  mergeResolvedDocuments,
  mergeResolvedVoteringar,
} from './retry-merge.js';
import {
  buildFallbackNotIndexedEntries,
  buildFullTextOutcomeEntries,
  buildVoteringarLagEntries,
  tagDocumentsWithCoverage,
} from './coverage-tagging.js';
import {
  ensureDir,
  logFinalSummary,
  logFullTextStepHeader,
  writeDocumentJsonFiles,
  writeManifest,
} from './output-writer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const ANALYSIS_DIR = path.join(REPO_ROOT, 'analysis');

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
  const { selected: allDocs, dataFreshness } = filterByDateWithLookback(
    flattenedDocs,
    date,
    requestedIdSet,
  );

  if (requestedIdSet.size > 0) {
    await fetchMissingDocumentsByIds(client, allDocs, documentIds, date);
  }

  mergeResolvedVoteringar(data, retryDrain.resolvedVoteringar);
  mergeResolvedDocuments(allDocs, retryDrain.resolvedDocuments);

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
  const queueEntries = buildVoteringarLagEntries(manifest.toolDiagnostics, docType);

  const effectiveAutoFullTextTopN = resolveAutoFullTextTopN(
    limit,
    autoFullTextTopN,
    fullTextForAll,
    allDocs.length,
  );
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0 && allDocs.length > 0) {
    logFullTextStepHeader({ effectiveAutoFullTextTopN, autoFullTextTopN, fullTextForAll });
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

  tagDocumentsWithCoverage(client, allDocs, date);
  queueEntries.push(
    ...buildFullTextOutcomeEntries(fullTextOutcomes, allDocs, docType, date),
  );

  const alreadyQueuedDocIds = new Set(
    queueEntries
      .filter((e) => e.resourceType === 'document_fulltext')
      .map((e) => e.resourceId),
  );
  queueEntries.push(
    ...buildFallbackNotIndexedEntries(allDocs, alreadyQueuedDocIds, docType, date),
  );

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
  writeManifest(outputDir, manifestContent);

  const storedCount = writeDocumentJsonFiles(outputDir, allDocs);

  logFinalSummary({
    outputDir,
    storedCount,
    allDocsLength: allDocs.length,
    effectiveAutoFullTextTopN,
    fullTextOutcomes,
    fullTextForAll,
    docType,
  });
}
