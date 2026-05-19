/**
 * @module download-parliamentary-data/manifest
 * @description Pure markdown rendering for the data-download manifest plus
 * the small `extractDokId` / `buildDocumentCoverageSummary` /
 * `escapeMarkdownCell` / `formatTimestampForMarkdown` helpers. No filesystem
 * or network I/O — callers are responsible for writing.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';
import type { MCPCoverageState, MCPToolInvocationDiagnostic } from '../types/mcp.js';
import type { FullTextFetchOutcome } from '../parliamentary-data/data-downloader.js';
import {
  buildMcpProvenance,
  inferDocumentCoverageState,
} from '../mcp-client/coverage.js';

/** Format a Date as `YYYY-MM-DD HH:MM UTC` for Markdown headers. */
export function formatTimestampForMarkdown(date: Date = new Date()): string {
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

/**
 * Escape a value for use inside a single GitHub-flavoured Markdown table cell.
 *
 * MCP error/notes text and serialised queries can include `|`, raw newlines,
 * and backticks — all of which corrupt the table layout. We collapse
 * whitespace and escape pipes so each diagnostic row remains a single,
 * parseable row.
 *
 * **Escape ordering matters**: backslashes are doubled first so that any
 * subsequent `\|` insertion remains an unambiguous escaped pipe (an input
 * like `foo\` followed by `|bar` must not be misread as a literal pipe
 * preceded by an escaped backslash). This is the canonical fix flagged by
 * CodeQL `js/incomplete-sanitization`.
 */
export function escapeMarkdownCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\r\n?/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\|/g, '\\|')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Resolve a stable document identifier from the fields used across MCP payloads.
 *
 * Falls back through `dok_id`, `dokument_id`, and `dokumentnamn`, then returns
 * the supplied fallback when none of those identifiers are available.
 */
export function extractDokId(doc: RawDocument, fallback: string): string {
  const asNonEmptyString = (value: unknown): string =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
  return (
    asNonEmptyString(doc.dok_id) ||
    asNonEmptyString((doc as Record<string, unknown>)['dokument_id']) ||
    asNonEmptyString((doc as Record<string, unknown>)['dokumentnamn']) ||
    fallback
  );
}

export interface DocumentCoverageRow {
  dokId: string;
  coverageState: MCPCoverageState;
  retrieval: string;
  tool: string;
  resultCount: number;
  notes: string;
}

/**
 * Build the per-document coverage summary table rendered into the manifest.
 *
 * This joins each downloaded document with any explicit full-text fetch outcome
 * and falls back to inferred MCP coverage metadata when no top-N outcome exists.
 */
export function buildDocumentCoverageSummary(
  docs: RawDocument[],
  fullTextOutcomes: FullTextFetchOutcome[] | undefined,
  analysisRunDate?: string,
): DocumentCoverageRow[] {
  const outcomeMap = new Map(fullTextOutcomes?.map((outcome) => [outcome.dokId, outcome]) ?? []);
  // The analysis-run date should drive same-day inference, not the host
  // machine's wall clock. Fall back to today only when the caller did not
  // supply one (e.g. test helpers).
  const runDate = analysisRunDate ?? new Date().toISOString().slice(0, 10);
  return docs.map((doc, index) => {
    const dokId = extractDokId(doc, `unknown-doc-${index + 1}`);
    const outcome = outcomeMap.get(dokId);
    // Prefer outcome provenance (from fetchFullTextForTopN) over document-level provenance
    const provenance =
      outcome?.provenance ??
      doc.mcpProvenance ??
      buildMcpProvenance({
        endpoint: 'unknown',
        tool: 'unknown',
        query: { dok_id: dokId },
        resultCount: 0,
        coverageState: inferDocumentCoverageState(doc as Record<string, unknown>, {
          requestedDate: runDate,
          fullTextRequested: Boolean(doc.contentFetched),
        }),
      });
    const notes =
      outcome?.reason ??
      outcome?.filePath ??
      (doc.contentFetched
        ? typeof doc.summary === 'string' && doc.summary.trim().length > 0
          ? 'summary present'
          : 'metadata-only payload'
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

/**
 * Render the full data-download manifest as Markdown.
 *
 * Includes top-level counts, MCP query diagnostics, per-document coverage,
 * full-text fetch outcomes, and the deferred retrieval queue summary.
 */
export function serializeDataManifest(
  date: string,
  generatedAt: string,
  dataSources: string[],
  docCounts: Record<string, number>,
  dateFilteredTotal: number,
  dataFreshness: string | null,
  toolDiagnostics: MCPToolInvocationDiagnostic[],
  documentCoverage: DocumentCoverageRow[],
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
    lines.push(
      `Data sourced from ${dataFreshness} via lookback fallback — check freshness indicators.`,
    );
  }

  if (toolDiagnostics.length > 0) {
    lines.push('', '## MCP Query Diagnostics', '');
    lines.push('| tool | query | result_count | coverage_state | notes |');
    lines.push('|------|-------|-------------:|----------------|-------|');
    for (const diag of toolDiagnostics) {
      const notes = diag.signal?.code
        ? `${diag.signal.code}: ${diag.signal.message}`
        : diag.notes ?? '';
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
      lines.push(
        `| ${escapeMarkdownCell(o.dokId)} | ${escapeMarkdownCell(o.coverageState)} | ${available} | ${chars} | ${escapeMarkdownCell(o.provenance.retrieval)} | ${escapeMarkdownCell(notes)} |`,
      );
    }
    const successCount = fullTextOutcomes.filter((o) => o.success).length;
    const coverageLabel = fullTextMode === 'all' ? 'selected documents' : 'top documents';
    lines.push(
      '',
      `**Full-text retrieved**: ${successCount}/${fullTextOutcomes.length} ${coverageLabel}`,
    );
  }

  lines.push('', '## Deferred Retrieval Queue', '');
  lines.push('| processed | resolved | retained | expired | enqueued |');
  lines.push('|----------:|---------:|---------:|--------:|---------:|');
  lines.push(
    `| ${retryQueueSummary.processed} | ${retryQueueSummary.resolved} | ${retryQueueSummary.retained} | ${retryQueueSummary.expired} | ${retryQueueSummary.enqueued} |`,
  );

  return lines.join('\n');
}
