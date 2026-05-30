/**
 * MCP error detection + CalendarMcpError class.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describes
 * 'isHtmlErrorResponse' and 'CalendarMcpError'). Adds NEW
 * HTML_PREFIX_RE guard tests required by acceptance criteria of #2620.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  isHtmlErrorResponse,
  isDegradedKalenderSentinel,
  CalendarMcpError,
  HTML_PREFIX_RE,
} from '../../../scripts/fetch-calendar.js';

describe('isHtmlErrorResponse', () => {
  it('returns true for a DOCTYPE HTML response', () => {
    expect(isHtmlErrorResponse('<!DOCTYPE html><html>')).toBe(true);
  });

  it('returns true for a lower-case <!doctype html> response', () => {
    expect(isHtmlErrorResponse('<!doctype html><html>')).toBe(true);
  });

  it('returns true for a bare <html> opening tag', () => {
    expect(isHtmlErrorResponse('<html lang="sv">')).toBe(true);
  });

  it('returns true for an uppercase <HTML> opening tag', () => {
    expect(isHtmlErrorResponse('<HTML lang="sv">')).toBe(true);
  });

  it('returns true for a leading <head> tag fragment', () => {
    expect(isHtmlErrorResponse('<head><title>Error</title></head>')).toBe(true);
  });

  it('returns true for a self-closing <meta /> fragment', () => {
    expect(isHtmlErrorResponse('<meta charset="utf-8" />')).toBe(true);
  });

  it('returns false for a JSON response', () => {
    expect(isHtmlErrorResponse('{"jsonrpc":"2.0","id":1}')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isHtmlErrorResponse('')).toBe(false);
  });

  it('returns false for a leading whitespace + JSON response', () => {
    expect(isHtmlErrorResponse('  \n{"result":{}}  ')).toBe(false);
  });

  it('returns true for whitespace before DOCTYPE', () => {
    expect(isHtmlErrorResponse('  \n<!DOCTYPE html>')).toBe(true);
  });
});

describe('HTML_PREFIX_RE (regex guard against future drift)', () => {
  // NEW (acceptance criteria of #2620): pin the regex contract so
  // that a tightening / loosening of detection rules surfaces here
  // rather than as a silent change in MCP failure semantics.
  it('matches the canonical HTML opening sequences', () => {
    expect(HTML_PREFIX_RE.test('<!DOCTYPE html>')).toBe(true);
    expect(HTML_PREFIX_RE.test('<!doctype html>')).toBe(true);
    expect(HTML_PREFIX_RE.test('<html>')).toBe(true);
    expect(HTML_PREFIX_RE.test('<HTML>')).toBe(true);
  });

  it('does NOT match JSON or JSON-RPC payloads', () => {
    expect(HTML_PREFIX_RE.test('{"jsonrpc":"2.0"}')).toBe(false);
    expect(HTML_PREFIX_RE.test('  {"id":1}')).toBe(false);
    expect(HTML_PREFIX_RE.test('[]')).toBe(false);
    expect(HTML_PREFIX_RE.test('null')).toBe(false);
  });

  it('does NOT match plain text or empty strings', () => {
    expect(HTML_PREFIX_RE.test('')).toBe(false);
    expect(HTML_PREFIX_RE.test('hello world')).toBe(false);
    expect(HTML_PREFIX_RE.test('error: 503')).toBe(false);
  });
});

describe('isDegradedKalenderSentinel', () => {
  it('returns true when an upstream error string is present', () => {
    expect(
      isDegradedKalenderSentinel({
        count: 0,
        events: [],
        error: 'Riksdagens kalender-API returnerade HTML istället för JSON.',
      }),
    ).toBe(true);
  });

  it('returns true when a rawHtml field is present', () => {
    expect(
      isDegradedKalenderSentinel({ count: 0, events: [], rawHtml: '<script>…</script>' }),
    ).toBe(true);
  });

  it('returns true when both error and rawHtml are present', () => {
    expect(
      isDegradedKalenderSentinel({
        count: 0,
        events: [],
        error: 'API degraded',
        rawHtml: '<!DOCTYPE html><html></html>',
        notice: 'API:et fungerar inte korrekt för närvarande.',
        suggestions: ['Försök igen senare'],
      }),
    ).toBe(true);
  });

  it('returns true for rawHtml-only sentinel without error field', () => {
    expect(
      isDegradedKalenderSentinel({ count: 0, events: [], rawHtml: '<html><body>503</body></html>' }),
    ).toBe(true);
  });

  it('returns false for a legitimate empty calendar window', () => {
    expect(isDegradedKalenderSentinel({ count: 0, events: [] })).toBe(false);
    expect(isDegradedKalenderSentinel({ kalender: [] })).toBe(false);
  });

  it('returns false when error/rawHtml are empty or whitespace', () => {
    expect(isDegradedKalenderSentinel({ events: [], error: '' })).toBe(false);
    expect(isDegradedKalenderSentinel({ events: [], rawHtml: '   ' })).toBe(false);
  });

  it('returns false when error/rawHtml are non-string types', () => {
    expect(isDegradedKalenderSentinel({ events: [], error: null })).toBe(false);
    expect(isDegradedKalenderSentinel({ events: [], rawHtml: 0 })).toBe(false);
    expect(isDegradedKalenderSentinel({ events: [], error: undefined })).toBe(false);
    expect(isDegradedKalenderSentinel({ events: [], rawHtml: true })).toBe(false);
    expect(isDegradedKalenderSentinel({ events: [], error: [] })).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(isDegradedKalenderSentinel({})).toBe(false);
  });
});

describe('CalendarMcpError', () => {
  it('has the correct name and kind', () => {
    const err = new CalendarMcpError('test error', 'html', '<html>error</html>');
    expect(err.name).toBe('CalendarMcpError');
    expect(err.kind).toBe('html');
    expect(err.responseText).toBe('<html>error</html>');
    expect(err).toBeInstanceOf(Error);
  });

  it('correctly identifies all error kinds', () => {
    for (const kind of ['html', 'http', 'network', 'json', 'tool'] as const) {
      const err = new CalendarMcpError(`${kind} error`, kind);
      expect(err.kind).toBe(kind);
    }
  });
});
