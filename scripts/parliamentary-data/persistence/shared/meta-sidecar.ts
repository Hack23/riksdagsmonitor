/**
 * @module parliamentary-data/persistence/shared/meta-sidecar
 * @description Sidecar-discipline write helper plus shared constants/types.
 *
 * Writes raw data files **without injected metadata** and a separate
 * `.meta.json` sidecar carrying provenance. This is the canonical sidecar
 * discipline that prevents parallel-workflow merge conflicts and must be
 * preserved by every persistence helper.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RawDocument } from '../../../data-transformers/types.js';
import type { DocumentTypeKey } from '../../data-downloader.js';
import { sanitizeDokId } from './sanitize.js';
import { stripInMemoryCoverageMetadata } from './strip-metadata.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repository root resolved from this module's filesystem path. */
export const REPO_ROOT = path.resolve(__dirname, '../../../..');
/** Default root for `analysis/data/` writes. */
export const DATA_ROOT = path.join(REPO_ROOT, 'analysis', 'data');

/** ISO 8601 date format pattern (YYYY-MM-DD). Checks format only, not date validity. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** All known document/data types that appear in sidecar metadata. */
export type PersistenceDocumentType =
  | DocumentTypeKey
  | 'events'
  | 'mps'
  | 'government'
  | 'worldbank'
  | 'imf'
  | 'statskontoret'
  | 'scb'
  | 'riksbank'
  | string; // extensible for generic MCP servers

/** Sidecar metadata written alongside data files. */
export interface PersistenceMetadata {
  fetchedAt: string;
  mcpTool: string;
  riksmote: string;
  documentType: PersistenceDocumentType;
}

/** Summary returned after a persistence run. */
export interface PersistenceResult {
  /**
   * Total logical records persisted.
   *
   * Note: a single logical record may produce multiple physical files or
   * data/sidecar pairs (for example, votes written under both
   * `documents/votes/` and `votes/{date}/`), but it is counted once here.
   */
  written: number;
  /** Total null/empty entries skipped. */
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

export function ensureDir(dir: string): void {
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
 *
 * In-memory MCP coverage annotations (`mcpCoverageState`, `mcpProvenance`,
 * `mcpSignals`) are stripped from the persisted JSON so byte-identical output
 * is preserved across parallel workflows; provenance is carried in the
 * sidecar `.meta.json` and the downstream manifest instead.
 *
 * **This sidecar discipline is a hard invariant** — the data file MUST be
 * pure source data with no injected metadata. See
 * `tests/parliamentary-data/persistence/meta-sidecar.test.ts`.
 */
export function writeDocumentAndMeta(
  dir: string,
  baseFilename: string,
  doc: RawDocument,
  metadata: PersistenceMetadata,
): void {
  ensureDir(dir);
  const persistable = stripInMemoryCoverageMetadata(doc);
  fs.writeFileSync(
    path.join(dir, baseFilename),
    JSON.stringify(persistable, null, 2),
    'utf8',
  );
  const metaFilename = baseFilename.replace(/\.json$/, '.meta.json');
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );
}

/**
 * Return the absolute path to the data repository root.
 * Useful for callers that need to reference persisted files.
 */
export function getDataRoot(): string {
  return DATA_ROOT;
}
