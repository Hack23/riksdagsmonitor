/**
 * @module parliamentary-data/enrichment/full-text/stitcher
 * @description Merge full-text payload onto base document + persist `.md`.
 *
 * Implements `fetchFullTextForTopN` — the explicit top-N persistence flow
 * that writes one `.md` file per successfully fetched document to
 * `{outputDir}/full-text/`. Returns per-document `FullTextFetchOutcome`
 * records for the data-download manifest and analysis gate.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import type { RawDocument } from '../../../data-transformers/types.js';
import type { MCPClient } from '../../../mcp-client/client.js';
import { buildMcpProvenance, inferDocumentCoverageState } from '../../../mcp-client/coverage.js';
import type { MCPCoverageState, MCPProvenance } from '../../../types/mcp.js';
import { FULL_TEXT_MIN_LENGTH } from '../../full-text-threshold.js';
import { isDocumentNotIndexedError } from '../../errors/not-indexed.js';

import {
  sanitize,
  selectContent,
  selectTopNCandidates,
} from './top-n-selection.js';

/**
 * Outcome record for a single document in a top-N full-text fetch.
 * Used in the data-download-manifest and as the return value of
 * `fetchFullTextForTopN`.
 */
export interface FullTextFetchOutcome {
  /** Riksdag document identifier */
  dokId: string;
  /** Whether meaningful full-text content was retrieved and persisted */
  success: boolean;
  /** Length (chars) of the persisted content; 0 when success is false */
  chars: number;
  /** Relative path to the persisted `.md` file (undefined when success is false) */
  filePath?: string;
  /** Human-readable reason when success is false */
  reason?: string;
  /** Machine-readable coverage state after the fetch attempt */
  coverageState: MCPCoverageState;
  /** Provenance block mirroring economicProvenance */
  provenance: MCPProvenance;
  /** True when the attempt originated from the deferred retry queue */
  deferred?: boolean;
}

/**
 * Fetch full-text content for the top-N documents in `docs` and persist each
 * to `{outputDir}/full-text/{dok_id}.md`.
 *
 * This function has filesystem side effects: it creates `outputDir/full-text/`
 * (including any missing parent directories) and writes one `.md` file per
 * successfully fetched document.
 *
 * Documents that lack a resolvable `dok_id` are skipped. If the MCP call
 * succeeds but returns no meaningful content (< FULL_TEXT_MIN_LENGTH chars),
 * the outcome is recorded as `success: false` with an explanatory `reason` so
 * the caller (and the analysis gate) can distinguish "not tried" from
 * "tried but only metadata returned".
 */
export async function fetchFullTextForTopN(
  client: MCPClient,
  docs: RawDocument[],
  topN: number,
  outputDir: string,
  options: { runDate?: string } = {},
): Promise<FullTextFetchOutcome[]> {
  if (topN <= 0 || docs.length === 0) return [];

  // Coverage inference must be tied to the analysis run date (the date the
  // pipeline is producing analysis for), not the host machine's wall clock.
  const runDate =
    typeof options.runDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(options.runDate)
      ? options.runDate
      : new Date().toISOString().slice(0, 10);

  const fullTextDir = path.join(outputDir, 'full-text');
  fs.mkdirSync(fullTextDir, { recursive: true });

  const candidates = selectTopNCandidates(docs, topN);
  const outcomes: FullTextFetchOutcome[] = [];

  for (const { dokId, doc } of candidates) {
    outcomes.push(
      await stitchFullTextForDocument(client, doc, dokId, fullTextDir, outputDir, runDate),
    );
  }

  return outcomes;
}

async function stitchFullTextForDocument(
  client: MCPClient,
  doc: RawDocument,
  dokId: string,
  fullTextDir: string,
  outputDir: string,
  runDate: string,
): Promise<FullTextFetchOutcome> {
  try {
    const docRecord = doc as Record<string, unknown>;
    let details: Record<string, unknown> | null = null;
    let content = selectContent(docRecord);

    if (content.length <= FULL_TEXT_MIN_LENGTH) {
      const detailsWithCoverage = await client.fetchDocumentDetailsWithCoverage(
        dokId,
        true,
        { requestedDate: runDate },
      );
      details = detailsWithCoverage.document;
      content = selectContent(details);
    }

    const coverageState = inferDocumentCoverageState(
      { ...docRecord, ...(details ?? {}) },
      { requestedDate: runDate, fullTextRequested: true },
    );
    const provenance = buildMcpProvenance({
      endpoint: client.baseURL,
      tool: 'get_dokument_innehall',
      query: { dok_id: dokId, include_full_text: true },
      resultCount: details ? 1 : 0,
      coverageState,
    });

    if (content.length > FULL_TEXT_MIN_LENGTH) {
      const filenameSafeDokId = dokId.replace(/[^A-Za-z0-9_-]/g, '_');
      const filePath = path.join(fullTextDir, `${filenameSafeDokId}.md`);
      const snippet =
        sanitize(docRecord['snippet']) ||
        sanitize(docRecord['summary']) ||
        sanitize(details?.['snippet']) ||
        sanitize(details?.['summary']) ||
        '';
      const headerLines = [
        `# Full Text — ${dokId}`,
        '',
        ...(snippet ? [`> ${snippet}`, ''] : []),
        '---',
        '',
      ];
      const header = headerLines.join('\n');
      fs.writeFileSync(filePath, header + content, 'utf8');
      docRecord['contentFetched'] = true;
      docRecord['fullContent'] = content;
      docRecord['mcpCoverageState'] = 'full_text';
      docRecord['mcpProvenance'] = { ...provenance, coverageState: 'full_text', resultCount: 1 };
      return {
        dokId,
        success: true,
        chars: content.length,
        filePath: path.relative(outputDir, filePath).split(path.sep).join('/'),
        coverageState: 'full_text',
        provenance: { ...provenance, coverageState: 'full_text', resultCount: 1 },
      };
    }

    docRecord['contentFetched'] = true;
    docRecord['mcpCoverageState'] = coverageState;
    docRecord['mcpProvenance'] = provenance;
    return {
      dokId,
      success: false,
      chars: 0,
      reason: `content below FULL_TEXT_MIN_LENGTH (${FULL_TEXT_MIN_LENGTH}) — metadata-only`,
      coverageState,
      provenance,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isNotIndexed = isDocumentNotIndexedError(errMsg, dokId);
    const state: MCPCoverageState = isNotIndexed ? 'not_indexed' : 'fetch_error';
    const provenance = buildMcpProvenance({
      endpoint: client.baseURL,
      tool: 'get_dokument_innehall',
      query: { dok_id: dokId, include_full_text: true },
      resultCount: 0,
      coverageState: state,
    });
    return {
      dokId,
      success: false,
      chars: 0,
      reason: `fetchDocumentDetails failed: ${errMsg}`,
      coverageState: state,
      provenance,
    };
  }
}
