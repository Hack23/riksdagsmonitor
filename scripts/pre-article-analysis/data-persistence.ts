/**
 * @module pre-article-analysis/data-persistence
 * @description Persists raw MCP data to a structured, version-controlled
 * directory tree under `analysis/data/`.  Every document, vote, event, or
 * MP record fetched from MCP tools is written here with a consistent
 * filename derived from its official Riksdag identifier (e.g. `dok_id`,
 * `intressent_id`, `bet`).
 *
 * Design principles:
 *   - **Upsert**: writes overwrite existing files (mutable data like MP
 *     profiles) or create new ones (immutable data like dated votes).
 *   - **Provenance**: each JSON file includes a `_metadata` block with
 *     fetch timestamp, MCP tool name, riksmöte, and document type.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata block injected into every persisted JSON file. */
export interface PersistenceMetadata {
  fetchedAt: string;
  mcpTool: string;
  riksmote: string;
  documentType: DocumentTypeKey | 'events' | 'mps' | 'government';
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
function resolveDocId(doc: RawDocument, index: number): string {
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
 * Write a document to disk as pretty-printed JSON with a `_metadata` block.
 * Overwrites any existing file (upsert semantics).
 */
function writeDocument(
  dir: string,
  filename: string,
  doc: RawDocument,
  metadata: PersistenceMetadata,
): void {
  ensureDir(dir);
  const payload = {
    _metadata: metadata,
    ...(doc as Record<string, unknown>),
  };
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist all downloaded MCP data to the structured `analysis/data/` tree.
 *
 * Documents are organised by type under `analysis/data/documents/{type}/`.
 * Date-stamped data (votes, events) is further partitioned by date.
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
        if (/^\d{4}-\d{2}-\d{2}$/.test(voteDate)) {
          const voteDateDir = path.join(DATA_ROOT, 'votes', voteDate);
          writeDocument(voteDateDir, filename, doc, {
            ...metadata,
            documentType: 'votes' as DocumentTypeKey,
          });
        }
      }

      writeDocument(typeDir, filename, doc, metadata);
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

    const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : 'undated';
    const eventDir = path.join(DATA_ROOT, 'events', eventDate);

    const eventId = resolveDocId(event, i);
    writeDocument(eventDir, `${eventId}.json`, event, {
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

    writeDocument(path.join(DATA_ROOT, 'mps'), `${sanitized}.json`, mp, {
      fetchedAt,
      mcpTool: 'search_ledamoter',
      riksmote,
      documentType: 'mps',
    });
    written++;
  }

  return { written, skipped, dataRoot: DATA_ROOT };
}

/**
 * Return the absolute path to the data repository root.
 * Useful for callers that need to reference persisted files.
 */
export function getDataRoot(): string {
  return DATA_ROOT;
}
