/**
 * Orchestrator integration spine — fetchCalendarWithFallback +
 * persistCalendarJson + CalendarEvent shape contract.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describes
 * 'fetchCalendarWithFallback', 'fetchCalendarWithFallback – MCP
 * succeeds on retry', 'CalendarEvent shape', 'persistCalendarJson').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  fetchCalendarWithFallback,
  normalizeMcpCalendarEvent,
  parseRiksdagKalendariumHtml,
  persistCalendarJson,
  type CalendarFetchConfig,
  type CalendarEvent,
} from '../../scripts/fetch-calendar.js';

// ---------------------------------------------------------------------------
// Helpers (full block — duplicated per spec)
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<CalendarFetchConfig> = {}): CalendarFetchConfig {
  return {
    mcpUrl: 'https://mcp.test/mcp',
    webBaseUrl: 'https://riksdagen.test',
    timeout: 3_000,
    maxRetries: 1,
    sleepFn: () => Promise.resolve(),
    ...overrides,
  };
}

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })) as unknown as typeof fetch;
}

function errorFetch(message = 'network error'): typeof fetch {
  return vi.fn(async () => { throw new Error(message); }) as unknown as typeof fetch;
}

function mcpJsonRpcResponse(events: unknown[]): object {
  return {
    jsonrpc: '2.0',
    id: 1,
    result: { content: [{ text: JSON.stringify({ kalender: events }) }] },
  };
}

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
      const hostname = (() => { try { return new URL(urlStr).hostname; } catch { return ''; } })();
      if (hostname === 'mcp.test') {
        return new Response('<!DOCTYPE html><html><body>503 Service Unavailable</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      }
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
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('triggers web fallback when MCP returns the degraded-kalender sentinel', async () => {
    // The riksdag-regering server wraps an upstream HTML outage in a
    // "successful" tool result with an empty events array plus an `error`
    // sentinel. The orchestrator must treat this as a primary failure and
    // fall back to the public-page scraper instead of recording a fake
    // zero-event window as a successful mcp-primary result.
    const sentinel = {
      count: 0,
      events: [],
      rawHtml: '<script>window.location…</script>',
      error: 'Riksdagens kalender-API returnerade HTML istället för JSON.',
    };
    const webHtml = `
      <article class="calendar-item" data-akt="debatt" data-organ="UU">
        <time datetime="2026-04-28T13:00:00">13.00</time>
        <h2>Utrikespolitik</h2>
      </article>
    `;

    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      const hostname = (() => { try { return new URL(String(url)).hostname; } catch { return ''; } })();
      if (hostname === 'mcp.test') {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { content: [{ text: JSON.stringify(sentinel) }] },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(webHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(result.manifest.path).toBe('web-fallback');
    expect(result.manifest.primaryError).toMatch(/degraded|HTML/i);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.source).toBe('web-fallback');
    expect(result.events[0]?.org).toBe('UU');
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
      const hostname = (() => { try { return new URL(urlStr).hostname; } catch { return ''; } })();
      if (hostname === 'mcp.test') {
        throw new Error('ECONNREFUSED');
      }
      return new Response(webHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn, maxRetries: 1 });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(result.manifest.path).toBe('web-fallback');
    expect(result.manifest.primaryError).toBeDefined();
    expect(result.events).toHaveLength(1);
    expect(sleepCount).toBeGreaterThanOrEqual(1);
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
      const hostname = (() => { try { return new URL(String(url)).hostname; } catch { return ''; } })();
      if (hostname === 'mcp.test') {
        mcpCallCount++;
        return new Response('<!DOCTYPE html><html>Error</html>', { status: 200 });
      }
      webCallCount++;
      return new Response('<html>No calendar</html>', { status: 200 });
    }) as unknown as typeof fetch;

    const config = makeConfig({ fetchFn, sleepFn, maxRetries: 2 });
    const result = await fetchCalendarWithFallback('2026-04-28', '2026-05-04', config);

    expect(mcpCallCount).toBe(1);
    expect(webCallCount).toBe(1);
    expect(result.manifest.path).toBe('web-fallback');
  });
});

// ---------------------------------------------------------------------------
// fetchCalendarWithFallback – MCP succeeds on retry
// ---------------------------------------------------------------------------

describe('fetchCalendarWithFallback – MCP succeeds on retry', () => {
  it('succeeds on the second MCP attempt without triggering fallback', async () => {
    let callCount = 0;
    const sleepFn = async () => {};
    const rawEvents = [mockMcpEvent()];
    const fetchFn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('ECONNRESET');
      }
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

// ---------------------------------------------------------------------------
// persistCalendarJson
// ---------------------------------------------------------------------------

describe('persistCalendarJson', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-calendar-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates the output directory and writes a JSON file', () => {
    const outputDir = path.join(tmpDir, 'calendar');
    const result = {
      manifest: {
        path: 'mcp-primary' as const,
        date: '2026-04-28',
        dateTo: '2026-04-28',
        eventCount: 1,
        fetchedAt: '2026-04-28T00:00:00.000Z',
      },
      events: [
        {
          dtstart: '2026-04-28T10:00:00',
          org: 'FiU',
          akt: 'debatt',
          summary: 'Test event',
          doc_refs: [],
          source: 'mcp-primary' as const,
        },
      ],
    };

    const outPath = persistCalendarJson('2026-04-28', result, outputDir);

    expect(fs.existsSync(outPath)).toBe(true);
    expect(outPath).toBe(path.join(outputDir, '2026-04-28.json'));
  });

  it('written file contains correct schema, manifest, and events', () => {
    const outputDir = path.join(tmpDir, 'calendar');
    const event: CalendarEvent = {
      dtstart: '2026-04-28T10:00:00',
      org: 'KU',
      akt: 'votering',
      summary: 'Omröstning',
      doc_refs: ['/sv/dokument-och-lagar/betankanden/KU10/'],
      source: 'web-fallback',
    };
    const result = {
      manifest: {
        path: 'web-fallback' as const,
        date: '2026-04-28',
        dateTo: '2026-04-28',
        eventCount: 1,
        fetchedAt: '2026-04-28T01:00:00.000Z',
        primaryError: 'HTML error page',
      },
      events: [event],
    };

    persistCalendarJson('2026-04-28', result, outputDir);

    const content = JSON.parse(
      fs.readFileSync(path.join(outputDir, '2026-04-28.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(content['schema']).toBe('riksdagsmonitor-calendar/1.0');
    expect(content['manifest']).toEqual(result.manifest);
    expect(content['events']).toEqual([event]);
  });

  it('returns the output file path', () => {
    const outputDir = path.join(tmpDir, 'calendar');
    const result = {
      manifest: { path: 'none' as const, date: '2026-05-01', dateTo: '2026-05-01', eventCount: 0, fetchedAt: '2026-04-28T00:00:00.000Z' },
      events: [],
    };

    const outPath = persistCalendarJson('2026-05-01', result, outputDir);
    expect(outPath).toBe(path.join(outputDir, '2026-05-01.json'));
  });

  it('uses {from}_{dateTo}.json when range spans multiple days', () => {
    const outputDir = path.join(tmpDir, 'calendar');
    const result = {
      manifest: {
        path: 'mcp-primary' as const,
        date: '2026-04-28',
        dateTo: '2026-05-04',
        eventCount: 0,
        fetchedAt: '2026-04-28T00:00:00.000Z',
      },
      events: [],
    };

    const outPath = persistCalendarJson('2026-04-28', result, outputDir);
    expect(outPath).toBe(path.join(outputDir, '2026-04-28_2026-05-04.json'));
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
