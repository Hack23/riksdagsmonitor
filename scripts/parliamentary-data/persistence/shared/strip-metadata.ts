/**
 * @module parliamentary-data/persistence/shared/strip-metadata
 * @description Strip in-memory MCP coverage annotations from raw documents
 * before persisting. Keeps `analysis/data/` byte-identical across parallel
 * workflows. Extracted from the original `data-persistence.ts` monolith.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../../../data-transformers/types.js';

/**
 * Fields that the in-memory pipeline annotates onto documents for the
 * manifest/coverage layer but that must NOT be written into raw
 * `analysis/data/` files. Persisting these breaks byte-identical output
 * across parallel workflows (every run has a fresh `retrievedAt`).
 */
export const STRIPPED_METADATA_FIELDS = new Set<string>([
  'mcpCoverageState',
  'mcpProvenance',
  'mcpSignals',
]);

/**
 * Return a shallow clone of `doc` with in-memory MCP coverage metadata removed.
 *
 * Coverage state and provenance live in the manifest and sidecar `.meta.json`,
 * not in the raw persisted document, so this guarantees the data files remain
 * byte-identical regardless of how the in-memory record was decorated upstream.
 */
export function stripInMemoryCoverageMetadata(doc: RawDocument): RawDocument {
  const record = doc as Record<string, unknown>;
  let cloned: Record<string, unknown> | null = null;
  for (const field of STRIPPED_METADATA_FIELDS) {
    if (field in record) {
      if (!cloned) cloned = { ...record };
      delete cloned[field];
    }
  }
  return (cloned ?? record) as RawDocument;
}
