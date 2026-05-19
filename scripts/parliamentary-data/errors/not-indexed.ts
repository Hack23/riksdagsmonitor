/**
 * @module parliamentary-data/errors/not-indexed
 * @description Thin wrapper around the authoritative not-indexed error
 * classifier. Keeps the original `isDocumentNotIndexedError` public name
 * stable for tests (`tests/auto-full-text-top-n.test.ts`).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { classifyDocumentErrorAsNotIndexed } from '../../mcp-client/error-classification/not-indexed.js';

/**
 * Decide whether an upstream error message indicates a document-level
 * indexing gap (`not_indexed`) versus an operational failure (`fetch_error`).
 *
 * Thin re-export wrapper around
 * {@link classifyDocumentErrorAsNotIndexed} from
 * `scripts/mcp-client/error-classification/not-indexed.ts` — the single
 * authoritative source for not-indexed pattern matching.
 */
export function isDocumentNotIndexedError(message: string, dokId?: string): boolean {
  return classifyDocumentErrorAsNotIndexed(message ?? '', dokId);
}
