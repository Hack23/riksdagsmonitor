/**
 * @module pre-article-analysis/data-persistence
 * @description Persists raw MCP data to a structured, version-controlled
 * directory tree under `analysis/data/`.  Every document, vote, event, or
 * MP record fetched from MCP tools is written here with a consistent
 * filename derived from its official Riksdag identifier (e.g. `dok_id`,
 * `intressent_id`, `bet`).
 *
 * **Collision-free design** (v2):
 *   - **Data files** (`{id}.json`) contain ONLY the raw source data — no
 *     injected metadata.  Two parallel workflows writing the same document
 *     produce byte-identical output, eliminating git merge conflicts.
 *   - **Sidecar metadata** (`{id}.meta.json`) tracks provenance (fetch
 *     timestamp, MCP tool name, riksmöte, document type) in a separate file
 *     that is safely overwritten on each run.
 *   - **All MCP tools**: riksdag-regering, World Bank, SCB, and any other
 *     MCP tool responses are stored under `analysis/data/`.
 *
 * Design principles:
 *   - **Upsert**: writes overwrite existing files (mutable data like MP
 *     profiles) or create new ones (immutable data like dated votes).
 *   - **Provenance**: sidecar `.meta.json` files track fetch origin.
 *   - **Date-stamped**: time-bound data (votes, events) is stored under
 *     `analysis/data/{type}/YYYY-MM-DD/` subdirectories.
 *   - **Side-effect-aware**: this module intentionally writes to disk;
 *     callers control when persistence is triggered.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RawDocument } from '../data-transformers/types.js';
import { sanitizeDokId } from './markdown-serializer.js';
import type { DownloadedData, DocumentTypeKey } from './data-downloader.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const DATA_ROOT = path.join(REPO_ROOT, 'analysis', 'data');

/** ISO 8601 date format pattern (YYYY-MM-DD). Checks format only, not date validity. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Sidecar metadata written alongside data files. */
export interface PersistenceMetadata {
  fetchedAt: string;
  mcpTool: string;
  riksmote: string;
  documentType: string;
}

/** Summary returned after a persistence run. */
export interface PersistenceResult {
  /** Total files written (created or updated). */
  written: number;
  /** Total files skipped (already up-to-date or empty). */
  skipped: number;
  /** Root directory the data was written to. */
  dataRoot: string;
}

/** Description of an MCP tool call for generic response storage. */
export interface MCPToolCall {
  /** MCP tool name (e.g. 'get_propositioner', 'search_tables', 'get-country-info') */
  tool: string;
  /** Parameters passed to the tool */
  params: Record<string, unknown>;
  /** MCP server identifier (e.g. 'riksdag-regering', 'scb', 'world-bank') */
  server: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Resolve the best identifier for a document.
 * Falls back through the standard candidate chain.
 */
export function resolveDocId(doc: RawDocument, index: number): string {
  const record = doc as Record<string, unknown>;
  const candidates = [
    record['dok_id'],
    record['dokument_id'],
    record['id'],
    record['rel_dok_id'],
    record['titel'],
    record['title'],
  ];
  const id = candidates.find(
    (c): c is string => typeof c === 'string' && c.trim().length > 0,
  )?.trim() ?? `unknown-${index + 1}`;
  return sanitizeDokId(id) || `unknown-${index + 1}`;
}

/**
 * Write raw data to disk as pretty-printed JSON (NO metadata injection).
 * Metadata is written to a separate sidecar file to prevent merge conflicts
 * when parallel workflows persist the same document.
 */
function writeDocumentAndMeta(
  dir: string,
  baseFilename: string,
  doc: RawDocument,
  metadata: PersistenceMetadata,
): void {
  ensureDir(dir);
  // Write raw data only — deterministic across parallel workflow runs
  fs.writeFileSync(
    path.join(dir, baseFilename),
    JSON.stringify(doc, null, 2),
    'utf8',
  );
  // Write provenance sidecar — safe to overwrite (non-conflicting)
  const metaFilename = baseFilename.replace(/\.json$/, '.meta.json');
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );
}

// ---------------------------------------------------------------------------
// Public API — Riksdag documents
// ---------------------------------------------------------------------------

/**
 * Persist all downloaded MCP data to the structured `analysis/data/` tree.
 *
 * Documents are organised by type under `analysis/data/documents/{type}/`.
 * Date-stamped data (votes, events) is further partitioned by date.
 *
 * Data files contain only raw source data (no metadata injection) to ensure
 * parallel workflows writing the same document produce identical output,
 * preventing git merge conflicts.
 *
 * @param data        - Downloaded data collections from `downloadAllDocuments()`
 * @param riksmote    - Current riksmöte identifier (e.g. "2025/26")
 * @param mcpToolMap  - Map of document type → MCP tool name for provenance
 * @returns Summary of files written and skipped.
 */
export function persistDownloadedData(
  data: DownloadedData,
  riksmote: string,
  mcpToolMap?: Partial<Record<DocumentTypeKey, string>>,
): PersistenceResult {
  const defaultToolMap: Record<DocumentTypeKey, string> = {
    propositions: 'get_propositioner',
    motions: 'get_motioner',
    committeeReports: 'get_betankanden',
    votes: 'search_voteringar',
    speeches: 'search_anforanden',
    questions: 'get_fragor',
    interpellations: 'get_interpellationer',
  };
  const toolMap = { ...defaultToolMap, ...mcpToolMap };
  const fetchedAt = new Date().toISOString();

  let written = 0;
  let skipped = 0;

  const docTypes: DocumentTypeKey[] = [
    'propositions',
    'motions',
    'committeeReports',
    'votes',
    'speeches',
    'questions',
    'interpellations',
  ];

  for (const docType of docTypes) {
    const docs = data[docType];
    if (!docs || docs.length === 0) {
      continue;
    }

    const typeDir = path.join(DATA_ROOT, 'documents', docType);
    const metadata: PersistenceMetadata = {
      fetchedAt,
      mcpTool: toolMap[docType],
      riksmote,
      documentType: docType,
    };

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc) {
        skipped++;
        continue;
      }

      const docId = resolveDocId(doc, i);
      const filename = `${docId}.json`;

      // For date-stamped vote ballots, also persist under votes/{date}/
      if (docType === 'votes' && doc.datum) {
        const voteDate = typeof doc.datum === 'string'
          ? doc.datum.slice(0, 10)
          : '';
        if (ISO_DATE_RE.test(voteDate)) {
          const voteDateDir = path.join(DATA_ROOT, 'votes', voteDate);
          writeDocumentAndMeta(voteDateDir, filename, doc, {
            ...metadata,
            documentType: 'votes',
          });
        }
      }

      writeDocumentAndMeta(typeDir, filename, doc, metadata);
      written++;
    }
  }

  return { written, skipped, dataRoot: DATA_ROOT };
}

/**
 * Persist a set of calendar events to `analysis/data/events/{date}/`.
 */
export function persistEvents(
  events: RawDocument[],
  riksmote: string,
): PersistenceResult {
  const fetchedAt = new Date().toISOString();
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) { skipped++; continue; }

    const record = event as Record<string, unknown>;
    const dateStr = typeof record['datum'] === 'string'
      ? (record['datum'] as string).slice(0, 10)
      : typeof record['from'] === 'string'
        ? (record['from'] as string).slice(0, 10)
        : '';

    const eventDate = ISO_DATE_RE.test(dateStr) ? dateStr : 'undated';
    const eventDir = path.join(DATA_ROOT, 'events', eventDate);

    const eventId = resolveDocId(event, i);
    writeDocumentAndMeta(eventDir, `${eventId}.json`, event, {
      fetchedAt,
      mcpTool: 'get_calendar_events',
      riksmote,
      documentType: 'events',
    });
    written++;
  }

  return { written, skipped, dataRoot: DATA_ROOT };
}

/**
 * Persist MP profiles to `analysis/data/mps/`.
 */
export function persistMPs(
  mps: RawDocument[],
  riksmote: string,
): PersistenceResult {
  const fetchedAt = new Date().toISOString();
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < mps.length; i++) {
    const mp = mps[i];
    if (!mp) { skipped++; continue; }

    const record = mp as Record<string, unknown>;
    const id = (typeof record['intressent_id'] === 'string' && record['intressent_id'])
      || resolveDocId(mp, i);
    const sanitized = sanitizeDokId(id) || `mp-${i + 1}`;

    writeDocumentAndMeta(path.join(DATA_ROOT, 'mps'), `${sanitized}.json`, mp, {
      fetchedAt,
      mcpTool: 'search_ledamoter',
      riksmote,
      documentType: 'mps',
    });
    written++;
  }

  return { written, skipped, dataRoot: DATA_ROOT };
}

// ---------------------------------------------------------------------------
// Public API — Generic MCP response storage
// ---------------------------------------------------------------------------

/**
 * Persist a generic MCP tool response.  Supports any MCP server (riksdag,
 * SCB, World Bank, etc.).  Responses are stored under:
 *   `analysis/data/mcp-responses/{server}/{tool}/{id}.json`
 *
 * The response data is stored as-is (no metadata injection).  A sidecar
 * `.meta.json` tracks provenance.
 *
 * @param call     - Description of the MCP tool call
 * @param response - Raw response data from the MCP tool
 * @param id       - Unique identifier for this response (e.g. dok_id, table_id, country code)
 * @returns The absolute path where the response was written.
 */
export function persistMCPResponse(
  call: MCPToolCall,
  response: unknown,
  id: string,
): string {
  const sanitized = sanitizeDokId(id) || `response-${Date.now()}`;
  const dir = path.join(DATA_ROOT, 'mcp-responses', call.server, call.tool);
  ensureDir(dir);

  const filename = `${sanitized}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const metaFilename = `${sanitized}.meta.json`;
  const metadata: PersistenceMetadata & { params: Record<string, unknown> } = {
    fetchedAt: new Date().toISOString(),
    mcpTool: call.tool,
    riksmote: '',
    documentType: call.server,
    params: call.params,
  };
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}

/**
 * Persist World Bank API response data.
 * Stored under `analysis/data/worldbank/{indicator}/{country}.json`
 *
 * @param indicator  - World Bank indicator ID (e.g. 'NY.GDP.MKTP.CD')
 * @param country    - Country code (e.g. 'SWE')
 * @param response   - Raw API response data
 */
export function persistWorldBankData(
  indicator: string,
  country: string,
  response: unknown,
): string {
  const dir = path.join(DATA_ROOT, 'worldbank', sanitizeDokId(indicator));
  ensureDir(dir);

  const filename = `${sanitizeDokId(country)}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const metaFilename = `${sanitizeDokId(country)}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'world-bank-api',
      indicator,
      country,
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}

/**
 * Persist SCB (Statistics Sweden) table data.
 * Stored under `analysis/data/scb/{tableId}.json`
 *
 * @param tableId   - SCB table identifier (e.g. 'BE0101A')
 * @param response  - Raw SCB API response data
 * @param query     - Optional query parameters used for provenance
 */
export function persistSCBData(
  tableId: string,
  response: unknown,
  query?: Record<string, unknown>,
): string {
  const dir = path.join(DATA_ROOT, 'scb');
  ensureDir(dir);

  const sanitized = sanitizeDokId(tableId);
  const filename = `${sanitized}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(response, null, 2),
    'utf8',
  );

  const metaFilename = `${sanitized}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'scb-pxweb',
      tableId,
      ...(query ? { query } : {}),
    }, null, 2),
    'utf8',
  );

  return path.join(dir, filename);
}

/**
 * Return the absolute path to the data repository root.
 * Useful for callers that need to reference persisted files.
 */
export function getDataRoot(): string {
  return DATA_ROOT;
}
