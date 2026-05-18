/**
 * @module mcp-client/error-classification/not-indexed
 * @description Classify document-level fetch errors as `not_indexed` vs.
 * transport errors.
 *
 * Adding a new "not-indexed" pattern is a one-file change; the bounded
 * scope avoids accidental coupling with transport-error wording in the
 * MCPClient request stack.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { TRANSPORT_ERROR_RE } from './transport.js';

/**
 * Phrases that indicate a document-level indexing gap rather than a
 * transport/operational MCP failure.
 *
 * Bare `404` and bare `not found` are intentionally excluded because they
 * also appear in transport-level errors such as `MCP server error: 404 Not
 * Found` from a wrong endpoint or unavailable route. Treating those as
 * `not_indexed` would mask MCP configuration/server outages as document
 * indexing lag. Use {@link classifyDocumentErrorAsNotIndexed} which combines
 * this list with a transport-error sentinel and a dok_id-aware fallback.
 */
export const NOT_INDEXED_ERROR_PATTERNS = [
  'not indexed',
  'no document',
  'document not found',
  'dok_id not found',
] as const;

/**
 * Returns true when the error message matches a known document-level
 * "not indexed" signal AND is not a transport/operational error.
 *
 * The `dokId` argument enables a fallback heuristic: upstream MCP tools that
 * return document-level "not found" responses typically echo the dok_id back
 * in the message, while transport-level failures never do.
 */
export function classifyDocumentErrorAsNotIndexed(message: string, dokId?: string): boolean {
  if (!message) return false;
  if (TRANSPORT_ERROR_RE.test(message)) return false;
  const lower = message.toLowerCase();
  if (NOT_INDEXED_ERROR_PATTERNS.some((p) => lower.includes(p))) return true;
  // Document-level "not found" responses from upstream MCP tools typically
  // echo the dok_id. Transport-level failures never do — so requiring the
  // dok_id to appear in the message disambiguates the two cases.
  if (dokId && lower.includes(dokId.toLowerCase()) && lower.includes('not found')) return true;
  return false;
}
