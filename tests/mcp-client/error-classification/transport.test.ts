/**
 * Error-classification — transport-error regex.
 *
 * Covers `scripts/mcp-client/error-classification/transport.ts`:
 *   - TRANSPORT_ERROR_RE matches the documented signatures
 *   - does not over-match unrelated wording
 *
 * Hack23/riksdagsmonitor#2578 follow-up — per-domain layout.
 */

import { describe, it, expect } from 'vitest';
import { TRANSPORT_ERROR_RE } from '../../../scripts/mcp-client/error-classification/transport.js';

describe('error-classification/transport — TRANSPORT_ERROR_RE', () => {
  it.each([
    ['MCP server error: 500'],
    ['MCP transport error'],
    ['Server error'],
    ['/endpoint not reachable'],
    ['ECONNREFUSED 127.0.0.1:8080'],
    ['ETIMEDOUT'],
    ['fetch failed'],
    ['network unreachable'],
    ['gateway timeout'],
    ['HTTP 500'],
    ['HTTP 502'],
    ['HTTP 503'],
  ])('matches transport signature: %s', (msg) => {
    expect(TRANSPORT_ERROR_RE.test(msg)).toBe(true);
  });

  it.each([
    ['document not indexed'],
    ['no document for that id'],
    ['dok_id not found: H101FiU01'],
    ['Method not found'],
    ['Invalid tool name'],
  ])('does not match application-level signature: %s', (msg) => {
    expect(TRANSPORT_ERROR_RE.test(msg)).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(TRANSPORT_ERROR_RE.test('MCP SERVER ERROR')).toBe(true);
    expect(TRANSPORT_ERROR_RE.test('Fetch Failed')).toBe(true);
  });

  it('matches HTTP 500/502/503 as word boundary, not 5001 / 5023', () => {
    expect(TRANSPORT_ERROR_RE.test('error code 5001')).toBe(false);
    expect(TRANSPORT_ERROR_RE.test('error code 5023')).toBe(false);
    expect(TRANSPORT_ERROR_RE.test('error code 500')).toBe(true);
  });
});
