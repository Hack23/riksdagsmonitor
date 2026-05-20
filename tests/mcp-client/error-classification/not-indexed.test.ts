/**
 * Error-classification — `not_indexed` pattern matcher.
 *
 * Covers `scripts/mcp-client/error-classification/not-indexed.ts`:
 *   - NOT_INDEXED_ERROR_PATTERNS literal set
 *   - classifyDocumentErrorAsNotIndexed() positive paths
 *   - transport-error sentinel suppression
 *   - dok_id-aware fallback heuristic
 *
 * Hack23/riksdagsmonitor#2578 follow-up — per-domain layout under
 * `tests/mcp-client/error-classification/`.
 */

import { describe, it, expect } from 'vitest';
import {
  NOT_INDEXED_ERROR_PATTERNS,
  classifyDocumentErrorAsNotIndexed,
} from '../../../scripts/mcp-client/error-classification/not-indexed.js';

describe('error-classification/not-indexed', () => {
  it('should expose a frozen pattern list with the documented signatures', () => {
    expect(NOT_INDEXED_ERROR_PATTERNS).toEqual([
      'not indexed',
      'no document',
      'document not found',
      'dok_id not found',
    ]);
  });

  it.each([
    ['document not indexed'],
    ['No document for that id'],
    ['Document not found in this riksmöte'],
    ['dok_id not found: H101FiU01'],
  ])('classifies known signal as not_indexed: %s', (msg) => {
    expect(classifyDocumentErrorAsNotIndexed(msg)).toBe(true);
  });

  it('does not classify bare "404"/"not found" as not_indexed', () => {
    expect(classifyDocumentErrorAsNotIndexed('MCP server error: 404 Not Found')).toBe(false);
    expect(classifyDocumentErrorAsNotIndexed('not found')).toBe(false);
  });

  it('suppresses not_indexed when message is a transport error', () => {
    expect(classifyDocumentErrorAsNotIndexed('MCP server error: document not found')).toBe(false);
    expect(classifyDocumentErrorAsNotIndexed('Network error — document not found')).toBe(false);
    expect(classifyDocumentErrorAsNotIndexed('fetch failed: document not found')).toBe(false);
  });

  it('uses dok_id-aware fallback when the dok_id appears in the message', () => {
    expect(classifyDocumentErrorAsNotIndexed('H101FiU01 not found', 'H101FiU01')).toBe(true);
    // Case-insensitive
    expect(classifyDocumentErrorAsNotIndexed('h101fiu01 not found', 'H101FiU01')).toBe(true);
  });

  it('does not use dok_id fallback when message is a transport error', () => {
    expect(
      classifyDocumentErrorAsNotIndexed('Network error: H101FiU01 not found', 'H101FiU01'),
    ).toBe(false);
  });

  it('returns false for empty / undefined messages', () => {
    expect(classifyDocumentErrorAsNotIndexed('')).toBe(false);
  });
});
