/**
 * Tests for scripts/fetch-calendar.ts
 *
 * Covers:
 * - Primary MCP path (JSON response with `kalender` array)
 * - HTML-error response detection + fallback trigger
 * - Fallback HTML parser (article and list-item patterns)
 * - Retry exhaustion (primary) → fallback
 * - Retry exhaustion on both paths → empty result with `path: 'none'`
 * - `normalizeMcpCalendarEvent` – field extraction
 * - `parseCalendarArgs` – CLI flag parsing
 * - `formatManifestMarkdown` – manifest rendering
 * - `isHtmlErrorResponse` – HTML detection
 *
 * No live network calls — all transport is controlled via `fetchFn` injection.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isHtmlErrorResponse,
  callMcpCalendarEvents,
  CalendarMcpError,
  normalizeMcpCalendarEvent,
  parseRiksdagKalendariumHtml,
  parseCalendarArticle,
  parseCalendarListItem,
  fetchCalendarWithFallback,
  fetchWebCalendar,
  formatManifestMarkdown,
  parseCalendarArgs,
  type CalendarFetchConfig,
  type CalendarEvent,
} from '../scripts/fetch-calendar.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal CalendarFetchConfig with all network calls mocked. */
function makeConfig(overrides: Partial<CalendarFetchConfig> = {}): CalendarFetchConfig {
  return {
    mcpUrl: 'https://mcp.test/mcp',
    webBaseUrl: 'https://riksdagen.test',
    timeout: 3_000,
    maxRetries: 1,
    sleepFn: () => Promise.resolve(), // skip delays
    ...overrides,
  };
}

/** Stub a fetch call that returns a JSON body with the given status. */
function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(async (_url, _init) => {
    const text = JSON.stringify(body);
    return new Response(text, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

/** Stub a fetch call that returns an HTML body (e.g. an error page). */
function htmlFetch(html: string, status = 200): typeof fetch {
  return vi.fn(async (_url, _init) => {
    return new Response(html, {
      status,
      headers: { 'Content-Type': 'text/html' },
    });
  }) as unknown as typeof fetch;
}

/** Stub a fetch call that always throws a network error. */
function errorFetch(message = 'network error'): typeof fetch {
  return vi.fn(async () => {
    throw new Error(message);
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// MCP JSON-RPC fixture helpers
// ---------------------------------------------------------------------------

/** Wrap events in a valid MCP JSON-RPC 2.0 response envelope. */
function mcpJsonRpcResponse(events: unknown[]): object {
  return {
    jsonrpc: '2.0',
    id: 1,
    result: {
      content: [
        {
          text: JSON.stringify({ kalender: events }),
        },
      ],
    },
  };
}

/** Build a valid calendar event as returned by the MCP server. */
function mockMcpEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    dtstart: '2026-04-28T10:00:00',
    organ: 'FiU',
    akt: 'votering',
    summary: 'Slutlig rösträkning — Budget 2026',
    dok_id: 'H901FiU10',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isHtmlErrorResponse
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// callMcpCalendarEvents
// ---------------------------------------------------------------------------

describe('callMcpCalendarEvents', () => {
  it('returns events from a valid MCP JSON-RPC `kalender` response', async () => {
    const events = [mockMcpEvent(), mockMcpEvent({ dtstart: '2026-04-29T09:00:00' })];
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch(mcpJsonRpcResponse(events)),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toHaveLength(2);
  });

  it('returns events from a direct `result.kalender` response (no content wrapper)', async () => {
    const events = [mockMcpEvent()];
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ jsonrpc: '2.0', id: 1, result: { kalender: events } }),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toHaveLength(1);
  });

  it('returns events from a `result.events` key', async () => {
    const events = [mockMcpEvent()];
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ jsonrpc: '2.0', id: 1, result: { events } }),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toHaveLength(1);
  });

  it('throws CalendarMcpError(html) when MCP returns an HTML document', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: htmlFetch('<!DOCTYPE html><html><body>Error 503</body></html>'),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toThrow(CalendarMcpError);

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'html' });
  });

  it('throws CalendarMcpError(http) on a non-OK HTTP status with non-HTML body', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ error: 'internal' }, 500),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'http' });
  });

  it('throws CalendarMcpError(network) on a fetch network error', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: errorFetch('ECONNREFUSED'),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'network' });
  });

  it('throws CalendarMcpError(tool) when the JSON-RPC response has an `error` field', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32000, message: 'Tool execution failed' },
      }),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'tool' });
  });

  it('returns an empty array when `result.kalender` is an empty array', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch(mcpJsonRpcResponse([])),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toEqual([]);
  });

  it('returns an empty array when `result` has no recognised events key', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ jsonrpc: '2.0', id: 1, result: { something: 'else' } }),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// normalizeMcpCalendarEvent
// ---------------------------------------------------------------------------

describe('normalizeMcpCalendarEvent', () => {
  it('maps standard MCP event fields', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      organ: 'FiU',
      akt: 'votering',
      summary: 'Budget-omröstning',
      dok_id: 'H901FiU10',
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtstart).toBe('2026-04-28T10:00:00');
    expect(event.org).toBe('FiU');
    expect(event.akt).toBe('votering');
    expect(event.summary).toBe('Budget-omröstning');
    expect(event.doc_refs).toContain('H901FiU10');
    expect(event.source).toBe('mcp-primary');
  });

  it('handles upper-case DTSTART / SUMMARY keys', () => {
    const raw = {
      DTSTART: '2026-04-29T14:00:00',
      SUMMARY: 'Utskottsmöte',
      organ: 'NU',
      akt: 'utskottsmöte',
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtstart).toBe('2026-04-29T14:00:00');
    expect(event.summary).toBe('Utskottsmöte');
  });

  it('includes dtend when present', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      dtend: '2026-04-28T12:00:00',
      organ: 'KU',
      akt: 'beredning',
      summary: 'Konstitutionsutskottets beredning',
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.dtend).toBe('2026-04-28T12:00:00');
  });

  it('collects multiple doc_refs from array fields', () => {
    const raw = {
      dtstart: '2026-04-28T10:00:00',
      organ: 'FiU',
      akt: 'debatt',
      summary: 'Plenidebatt',
      url: ['https://riksdagen.se/dokument/H901FiU1', 'https://riksdagen.se/dokument/H901FiU2'],
    };
    const event = normalizeMcpCalendarEvent(raw);
    expect(event.doc_refs).toHaveLength(2);
  });

  it('handles null / undefined gracefully', () => {
    const event = normalizeMcpCalendarEvent(null);
    expect(event.dtstart).toBe('');
    expect(event.org).toBe('');
    expect(event.doc_refs).toEqual([]);
    expect(event.source).toBe('mcp-primary');
  });
});

// ---------------------------------------------------------------------------
// parseRiksdagKalendariumHtml + parseCalendarArticle + parseCalendarListItem
// ---------------------------------------------------------------------------

describe('parseRiksdagKalendariumHtml', () => {
  it('parses article pattern events', () => {
    const html = `
      <article class="calendar-item" data-akt="votering" data-organ="FiU">
        <time datetime="2026-04-28T10:00:00">Måndag 28 april 10.00</time>
        <h2 class="calendar-item__title">
          <a href="/sv/dokument-och-lagar/utskottens-arbete/betankanden/H901FiU1/">Budget 2026</a>
        </h2>
      </article>
      <article class="calendar-item" data-akt="utskottsmöte" data-organ="NU">
        <time datetime="2026-04-28T13:00:00">Måndag 28 april 13.00</time>
        <h2 class="calendar-item__title">Näringspolitik</h2>
      </article>
    `;
    const events = parseRiksdagKalendariumHtml(html);
    expect(events).toHaveLength(2);
    expect(events[0]?.dtstart).toBe('2026-04-28T10:00:00');
    expect(events[0]?.org).toBe('FIU');
    expect(events[0]?.akt).toBe('votering');
    expect(events[0]?.summary).toContain('Budget 2026');
    expect(events[0]?.doc_refs).toContain('/sv/dokument-och-lagar/utskottens-arbete/betankanden/H901FiU1/');
    expect(events[0]?.source).toBe('web-fallback');
    expect(events[1]?.dtstart).toBe('2026-04-28T13:00:00');
    expect(events[1]?.org).toBe('NU');
  });

  it('falls back to list-item pattern when no articles found', () => {
    const html = `
      <ul>
        <li class="calendar-list__item">
          <time datetime="2026-04-29T09:00:00">Tisdag 29 april 09.00</time>
          <span class="calendar-list__organ">KU</span>
          <span class="calendar-list__type">Beredning</span>
          <a href="/sv/dokument-och-lagar/interpellationer/abc123/">KU-beredning</a>
        </li>
      </ul>
    `;
    const events = parseRiksdagKalendariumHtml(html);
    expect(events).toHaveLength(1);
    expect(events[0]?.dtstart).toBe('2026-04-29T09:00:00');
    expect(events[0]?.org).toBe('KU');
    expect(events[0]?.source).toBe('web-fallback');
  });

  it('returns empty array for HTML with no recognisable calendar markup', () => {
    const html = '<html><body><p>No events today.</p></body></html>';
    expect(parseRiksdagKalendariumHtml(html)).toEqual([]);
  });
});

describe('parseCalendarArticle', () => {
  it('returns null when no datetime found', () => {
    const result = parseCalendarArticle('data-akt="debatt"', '<h2>No time element</h2>');
    expect(result).toBeNull();
  });

  it('extracts organ and akt from data attributes', () => {
    const body = `<time datetime="2026-04-28T11:00:00">11.00</time><h2>Test</h2>`;
    const event = parseCalendarArticle('data-organ="SoU" data-akt="debatt"', body);
    expect(event?.org).toBe('SOU');
    expect(event?.akt).toBe('debatt');
  });

  it('falls back to span text for org and akt when data attributes absent', () => {
    const body = `
      <time datetime="2026-04-28T10:00:00">10.00</time>
      <span class="organ">CU</span>
      <span class="akt">Utskottsmöte</span>
      <h2>Civilutskottets möte</h2>
    `;
    const event = parseCalendarArticle('', body);
    expect(event?.org).toBe('CU');
  });
});

describe('parseCalendarListItem', () => {
  it('returns null when no datetime found', () => {
    const result = parseCalendarListItem('', '<span class="organ">FiU</span>');
    expect(result).toBeNull();
  });

  it('extracts all fields from a well-formed list item', () => {
    const body = `
      <time datetime="2026-05-02T14:00:00">Lördag 2 maj 14.00</time>
      <span class="calendar-list__organ">JuU</span>
      <span class="calendar-list__type">Votering</span>
      <a href="/sv/dokument-och-lagar/betankanden/H901JuU10/">JuU-betänkande</a>
    `;
    const event = parseCalendarListItem('', body);
    expect(event?.dtstart).toBe('2026-05-02T14:00:00');
    expect(event?.org).toBe('JUU');
    expect(event?.doc_refs).toContain('/sv/dokument-och-lagar/betankanden/H901JuU10/');
    expect(event?.source).toBe('web-fallback');
  });
});

// ---------------------------------------------------------------------------
// fetchWebCalendar
// ---------------------------------------------------------------------------

describe('fetchWebCalendar', () => {
  it('fetches and parses a calendar page with article events', async () => {
    const html = `
      <article class="calendar-item" data-akt="votering" data-organ="FiU">
        <time datetime="2026-04-28T10:00:00">10.00</time>
        <h2><a href="/sv/dokument-och-lagar/betankanden/H901FiU1/">Budget</a></h2>
      </article>
    `;
    const config = {
      webBaseUrl: 'https://riksdagen.test',
      timeout: 3_000,
      fetchFn: htmlFetch(html),
    };

    const events = await fetchWebCalendar('2026-04-28', '2026-05-04', config);
    expect(events).toHaveLength(1);
    expect(events[0]?.dtstart).toBe('2026-04-28T10:00:00');
    expect(events[0]?.source).toBe('web-fallback');
  });

  it('throws on a non-OK HTTP response', async () => {
    const config = {
      webBaseUrl: 'https://riksdagen.test',
      timeout: 3_000,
      fetchFn: htmlFetch('<html>Not Found</html>', 404),
    };

    await expect(
      fetchWebCalendar('2026-04-28', '2026-05-04', config),
    ).rejects.toThrow(/HTTP error: 404/);
  });

  it('throws on a network fetch failure', async () => {
    const config = {
      webBaseUrl: 'https://riksdagen.test',
      timeout: 3_000,
      fetchFn: errorFetch('EHOSTUNREACH'),
    };

    await expect(
      fetchWebCalendar('2026-04-28', '2026-05-04', config),
    ).rejects.toThrow(/EHOSTUNREACH/);
  });
});

// ---------------------------------------------------------------------------
// fetchCalendarWithFallback
// ---------------------------------------------------------------------------

describe('fetchCalendarWithFallback', () => {
  let sleepCount: number;
  let sleepFn: (ms: number) => Promise<void>;

  beforeEach(() => {
    sleepCount = 0;
    sleepFn = async () => { sleepCount++; };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('succeeds via MCP primary path and records manifest correctly', async () => {
    const rawEvents = [mockMcpEvent()];
    const config = makeConfig({
      fetchFn: jsonFetch(mcpJsonRpcResponse(rawEvents)),
      sleepFn,
    });

    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(result.manifest.path).toBe('mcp-primary');
    expect(result.manifest.eventCount).toBe(1);
    expect(result.manifest.primaryError).toBeUndefined();
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.source).toBe('mcp-primary');
    expect(result.events[0]?.org).toBe('FiU');
  });

  it('triggers web fallback when MCP returns HTML error page', async () => {
    // MCP returns an HTML error page; web returns a valid calendar HTML page.
    const webHtml = `
      <article class="calendar-item" data-akt="debatt" data-organ="UU">
        <time datetime="2026-04-28T13:00:00">13.00</time>
        <h2>Utrikespolitik</h2>
      </article>
    `;

    let callCount = 0;
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      callCount++;
      const urlStr = String(url);
      if (urlStr.includes('onrender.com') || urlStr.includes('mcp.test')) {
        // MCP endpoint returns HTML error
        return new Response('<!DOCTYPE html><html><body>503 Service Unavailable</body></html>', {
          status: 200, // MCP sometimes returns 200 with HTML body
          headers: { 'Content-Type': 'text/html' },
        });
      }
      // Web fallback endpoint returns calendar HTML
      return new Response(webHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(result.manifest.path).toBe('web-fallback');
    expect(result.manifest.primaryError).toMatch(/HTML/i);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.source).toBe('web-fallback');
    expect(result.events[0]?.org).toBe('UU');
    expect(callCount).toBeGreaterThanOrEqual(2); // at least 1 MCP + 1 web
  });

  it('retries MCP on network error before falling back', async () => {
    const webHtml = `
      <article class="calendar-item" data-akt="votering" data-organ="FiU">
        <time datetime="2026-04-28T10:00:00">10.00</time>
        <h2>Budget</h2>
      </article>
    `;

    let callCount = 0;
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      callCount++;
      const urlStr = String(url);
      if (urlStr.includes('mcp.test')) {
        throw new Error('ECONNREFUSED');
      }
      return new Response(webHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn, maxRetries: 1 });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    // With maxRetries=1 there are 2 MCP attempts (attempt 0 + 1 retry) before fallback
    expect(result.manifest.path).toBe('web-fallback');
    expect(result.manifest.primaryError).toBeDefined();
    expect(result.events).toHaveLength(1);
    expect(sleepCount).toBeGreaterThanOrEqual(1); // at least one sleep between retries
  });

  it('returns path=none when both paths fail after retry exhaustion', async () => {
    const fetchFn = errorFetch('ETIMEDOUT');
    const config = makeConfig({ fetchFn, sleepFn, maxRetries: 1 });

    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(result.manifest.path).toBe('none');
    expect(result.manifest.eventCount).toBe(0);
    expect(result.manifest.primaryError).toBeDefined();
    expect(result.manifest.fallbackError).toBeDefined();
    expect(result.events).toEqual([]);
  });

  it('manifest includes correct `date` and `dateTo` fields', async () => {
    const config = makeConfig({
      fetchFn: jsonFetch(mcpJsonRpcResponse([])),
      sleepFn,
    });

    const result = await fetchCalendarWithFallback('2026-05-01', '2026-05-31', config);
    expect(result.manifest.date).toBe('2026-05-01');
    expect(result.manifest.dateTo).toBe('2026-05-31');
    expect(result.manifest.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('does not sleep before the first MCP attempt', async () => {
    const config = makeConfig({
      fetchFn: jsonFetch(mcpJsonRpcResponse([mockMcpEvent()])),
      sleepFn,
    });
    await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);
    expect(sleepCount).toBe(0);
  });

  it('does not retry HTML errors (immediate fallback)', async () => {
    let mcpCallCount = 0;
    let webCallCount = 0;
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes('mcp.test')) {
        mcpCallCount++;
        return new Response('<!DOCTYPE html><html>Error</html>', { status: 200 });
      }
      webCallCount++;
      return new Response('<html>No calendar</html>', { status: 200 });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn, maxRetries: 2 });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    // HTML error should trigger immediate fallback — no retries on MCP.
    expect(mcpCallCount).toBe(1);
    expect(webCallCount).toBe(1);
    expect(result.manifest.path).toBe('web-fallback');
  });
});

// ---------------------------------------------------------------------------
// parseCalendarArgs
// ---------------------------------------------------------------------------

describe('parseCalendarArgs', () => {
  it('parses --from and --to flags', () => {
    const args = parseCalendarArgs(['--from', '2026-04-28', '--to', '2026-05-04']);
    expect(args.from).toBe('2026-04-28');
    expect(args.to).toBe('2026-05-04');
    expect(args.persist).toBe(false);
  });

  it('sets persist=true when --persist flag is present', () => {
    const args = parseCalendarArgs(['--from', '2026-04-28', '--to', '2026-05-04', '--persist']);
    expect(args.persist).toBe(true);
  });

  it('throws when --from is missing', () => {
    expect(() => parseCalendarArgs(['--to', '2026-05-04'])).toThrow(/--from/);
  });

  it('throws when --to is missing', () => {
    expect(() => parseCalendarArgs(['--from', '2026-04-28'])).toThrow(/--to/);
  });

  it('throws when date format is invalid', () => {
    expect(() =>
      parseCalendarArgs(['--from', '28-04-2026', '--to', '2026-05-04']),
    ).toThrow(/ISO 8601/);
  });
});

// ---------------------------------------------------------------------------
// formatManifestMarkdown
// ---------------------------------------------------------------------------

describe('formatManifestMarkdown', () => {
  it('formats a successful MCP primary manifest', () => {
    const md = formatManifestMarkdown({
      date: '2026-04-28',
      dateTo: '2026-05-04',
      path: 'mcp-primary',
      eventCount: 5,
      fetchedAt: '2026-04-28T06:00:00Z',
    });
    expect(md).toContain('MCP primary');
    expect(md).toContain('**Events**: 5');
    expect(md).not.toContain('error');
  });

  it('formats a web fallback manifest with primary error', () => {
    const md = formatManifestMarkdown({
      date: '2026-04-28',
      dateTo: '2026-05-04',
      path: 'web-fallback',
      eventCount: 3,
      primaryError: 'MCP returned HTML instead of JSON',
      fetchedAt: '2026-04-28T06:00:00Z',
    });
    expect(md).toContain('Web fallback');
    expect(md).toContain('Primary error');
    expect(md).toContain('MCP returned HTML');
  });

  it('formats a none (both failed) manifest', () => {
    const md = formatManifestMarkdown({
      date: '2026-04-28',
      dateTo: '2026-05-04',
      path: 'none',
      eventCount: 0,
      primaryError: 'ECONNREFUSED',
      fallbackError: 'EHOSTUNREACH',
      fetchedAt: '2026-04-28T06:00:00Z',
    });
    expect(md).toContain('None');
    expect(md).toContain('Fallback error');
  });
});

// ---------------------------------------------------------------------------
// CalendarMcpError
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Edge-case integration: MCP succeeds on second attempt
// ---------------------------------------------------------------------------

describe('fetchCalendarWithFallback – MCP succeeds on retry', () => {
  it('succeeds on the second MCP attempt without triggering fallback', async () => {
    let callCount = 0;
    const sleepFn = async () => {};
    const rawEvents = [mockMcpEvent()];
    const fetchFn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        // First attempt: transient network error
        throw new Error('ECONNRESET');
      }
      // Second attempt: success
      return new Response(JSON.stringify(mcpJsonRpcResponse(rawEvents)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn, maxRetries: 1 });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(result.manifest.path).toBe('mcp-primary');
    expect(result.events).toHaveLength(1);
    expect(callCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// CalendarEvent shape validation
// ---------------------------------------------------------------------------

describe('CalendarEvent shape', () => {
  it('MCP-normalized events have all required fields', () => {
    const raw = mockMcpEvent({ dtend: '2026-04-28T12:00:00' });
    const event: CalendarEvent = normalizeMcpCalendarEvent(raw);

    expect(typeof event.dtstart).toBe('string');
    expect(typeof event.org).toBe('string');
    expect(typeof event.akt).toBe('string');
    expect(typeof event.summary).toBe('string');
    expect(Array.isArray(event.doc_refs)).toBe(true);
    expect(event.source).toBe('mcp-primary');
    expect(event.dtend).toBe('2026-04-28T12:00:00');
  });

  it('web-fallback events have all required fields', () => {
    const html = `
      <article class="calendar-item" data-akt="debatt" data-organ="FiU">
        <time datetime="2026-04-28T10:00:00">10.00</time>
        <h2><a href="/sv/dokument-och-lagar/betankanden/H901FiU1/">Title</a></h2>
      </article>
    `;
    const [event] = parseRiksdagKalendariumHtml(html);
    expect(event).toBeDefined();
    if (!event) return;
    expect(typeof event.dtstart).toBe('string');
    expect(typeof event.org).toBe('string');
    expect(typeof event.akt).toBe('string');
    expect(typeof event.summary).toBe('string');
    expect(Array.isArray(event.doc_refs)).toBe(true);
    expect(event.source).toBe('web-fallback');
  });
});
