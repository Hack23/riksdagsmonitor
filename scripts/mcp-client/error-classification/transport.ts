/**
 * @module mcp-client/error-classification/transport
 * @description Transport / operational error signature matcher.
 *
 * When the regex matches, the failure is a transport/operational MCP error
 * (network, gateway, 5xx, fetch failed, etc.) and MUST be surfaced as
 * `fetch_error` rather than collapsed into a document-level `not_indexed`
 * coverage state.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Transport / operational error signatures. When present, the failure must be
 * surfaced as `fetch_error`, never collapsed into `not_indexed`.
 */
export const TRANSPORT_ERROR_RE = /(mcp server error|transport error|server error|endpoint|econnrefused|etimedout|fetch failed|network|gateway|\b50[023]\b)/i;
