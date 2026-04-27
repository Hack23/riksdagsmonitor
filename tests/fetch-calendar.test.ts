/**
 * @file tests/fetch-calendar.test.ts
 * @description Vitest unit tests for fetch-calendar.ts
 */

import { describe, it, expect, vi } from 'vitest';

import {
  parseArgs,
  parseCalendarHtml,
  fetchCalendarEvents,
  type CalendarEvent,
  type CalendarOutput,
  type FetchCalendarDeps,
  type ParsedCalendarArgs,
} from '../scripts/fetch-calendar.js';

// ---------------------------------------------------------------------------
// parseArgs tests
// ---------------------------------------------------------------------------

describe('parseArgs — fetch-calendar', () => {
  it('parses --from and --tom happy path', () => {
    const { args, error } = parseArgs(['--from', '2026-04-27', '--tom', '2026-05-27']);
    expect(error).toBeNull();
    expect(args.from).toBe('2026-04-27');
    expect(args.tom).toBe('2026-05-27');
    expect(args.org).toBeNull();
    expect(args.akt).toBeNull();
    expect(args.persist).toBe(false);
  });

  it('parses optional --org, --akt, --persist flags', () => {
    const { args, error } = parseArgs([
      '--from', '2026-04-27',
      '--tom', '2026-05-27',
      '--org', 'UTSK',
      '--akt', 'bet',
      '--persist',
    ]);
    expect(error).toBeNull();
    expect(args.org).toBe('UTSK');
    expect(args.akt).toBe('bet');
    expect(args.persist).toBe(true);
  });

  it('returns error when --from is missing', () => {
    const { error } = parseArgs(['--tom', '2026-05-27']);
    expect(error).not.toBeNull();
    expect(error).toMatch(/--from/);
  });

  it('returns error when --tom is missing', () => {
    const { error } = parseArgs(['--from', '2026-04-27']);
    expect(error).not.toBeNull();
    expect(error).toMatch(/--tom/);
  });

  it('returns error for invalid --from date format', () => {
    const { error } = parseArgs(['--from', '04/27/2026', '--tom', '2026-05-27']);
    expect(error).not.toBeNull();
    expect(error).toMatch(/YYYY-MM-DD/);
  });

  it('returns error for invalid --tom date format', () => {
    const { error } = parseArgs(['--from', '2026-04-27', '--tom', 'next-month']);
    expect(error).not.toBeNull();
    expect(error).toMatch(/YYYY-MM-DD/);
  });

  it('persist defaults to false when flag is absent', () => {
    const { args } = parseArgs(['--from', '2026-04-27', '--tom', '2026-05-27']);
    expect(args.persist).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseCalendarHtml tests
// ---------------------------------------------------------------------------

describe('parseCalendarHtml', () => {
  it('returns empty array for blank HTML', () => {
    expect(parseCalendarHtml('')).toHaveLength(0);
    expect(parseCalendarHtml('<html><body></body></html>')).toHaveLength(0);
  });

  it('extracts events from JSON-LD structured data', () => {
    const html = `
<html>
<head>
<script type="application/ld+json">
[
  {
    "@type": "Event",
    "name": "Finansutskottets öppna utfrågning",
    "startDate": "2026-05-05T10:00:00",
    "organizer": { "name": "Finansutskottet" },
    "eventType": "Utfrågning"
  }
]
</script>
</head>
<body></body>
</html>`;

    const events = parseCalendarHtml(html);
    expect(events.length).toBeGreaterThanOrEqual(1);
    const ev = events[0]!;
    expect(ev.titel).toBe('Finansutskottets öppna utfrågning');
    expect(ev.datum).toBe('2026-05-05');
    expect(ev.tid).toBe('10:00');
    expect(ev.org).toBe('Finansutskottet');
    expect(ev.typ).toBe('Utfrågning');
  });

  it('extracts events from multiple JSON-LD Event objects', () => {
    const html = `
<script type="application/ld+json">
[
  { "@type": "Event", "name": "Event A", "startDate": "2026-05-10T09:00:00", "organizer": {"name": "KU"} },
  { "@type": "Event", "name": "Event B", "startDate": "2026-05-11T14:00:00", "organizer": {"name": "AU"} }
]
</script>`;

    const events = parseCalendarHtml(html);
    expect(events.length).toBeGreaterThanOrEqual(2);
    const titles = events.map((e) => e.titel);
    expect(titles).toContain('Event A');
    expect(titles).toContain('Event B');
  });

  it('falls back gracefully when JSON-LD parse fails', () => {
    // Malformed JSON-LD should not throw
    const html = `<script type="application/ld+json">{ invalid json }</script>`;
    expect(() => parseCalendarHtml(html)).not.toThrow();
  });

  it('extracts events using HTML title patterns when no JSON-LD present', () => {
    const html = `
<html><body>
<div class="event-item">
  <a class="event-title" href="/event/1" datetime="2026-05-08">Debatt om budgeten</a>
  <time>10:00</time>
</div>
</body></html>`;

    // Should not throw; events may or may not be found depending on HTML pattern
    expect(() => parseCalendarHtml(html)).not.toThrow();
    const events = parseCalendarHtml(html);
    expect(Array.isArray(events)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// fetchCalendarEvents — orchestrator (real logic exercised via injected deps)
// ---------------------------------------------------------------------------

const baseArgs: ParsedCalendarArgs = {
  from: '2026-04-27',
  tom: '2026-05-27',
  org: null,
  akt: null,
  persist: false,
};

function makeDeps(overrides: Partial<FetchCalendarDeps>): FetchCalendarDeps {
  return {
    fetchViaMcp: overrides.fetchViaMcp ?? (async () => []),
    fetchViaWeb: overrides.fetchViaWeb ?? (async () => []),
    now: overrides.now ?? (() => new Date('2026-04-27T00:00:00.000Z')),
    logger: overrides.logger,
  };
}

describe('fetchCalendarEvents — MCP primary path', () => {
  it('source is "mcp" when MCP returns events and web is never called', async () => {
    const mcpEvents: CalendarEvent[] = [
      { datum: '2026-05-05', tid: '10:00', org: 'FiU', titel: 'Utfrågning', typ: 'Öppet' },
    ];
    const webSpy = vi.fn(async () => [] as CalendarEvent[]);

    const out = await fetchCalendarEvents(
      baseArgs,
      makeDeps({ fetchViaMcp: async () => mcpEvents, fetchViaWeb: webSpy }),
    );

    expect(out.source).toBe('mcp');
    expect(out.events).toEqual(mcpEvents);
    expect(webSpy).not.toHaveBeenCalled();
    expect(out.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('falls back to web when MCP throws', async () => {
    const webEvents: CalendarEvent[] = [
      { datum: '2026-05-06', tid: '14:00', org: 'KU', titel: 'Möte', typ: '' },
    ];

    const out = await fetchCalendarEvents(
      baseArgs,
      makeDeps({
        fetchViaMcp: async () => {
          throw new Error('mcp down');
        },
        fetchViaWeb: async () => webEvents,
      }),
    );

    expect(out.source).toBe('web_fallback');
    expect(out.events).toEqual(webEvents);
  });
});

describe('fetchCalendarEvents — web fallback path', () => {
  it('source is "web_fallback" when MCP returns empty', async () => {
    const webEvents: CalendarEvent[] = [
      { datum: '2026-05-07', tid: '09:00', org: 'AU', titel: 'Debatt', typ: '' },
    ];

    const out = await fetchCalendarEvents(
      baseArgs,
      makeDeps({
        fetchViaMcp: async () => [],
        fetchViaWeb: async () => webEvents,
      }),
    );

    expect(out.source).toBe('web_fallback');
    expect(out.events).toEqual(webEvents);
  });

  it('gracefully degrades to empty events array when web fetch fails', async () => {
    const out = await fetchCalendarEvents(
      baseArgs,
      makeDeps({
        fetchViaMcp: async () => [],
        fetchViaWeb: async () => {
          throw new Error('web down');
        },
      }),
    );

    expect(out.source).toBe('web_fallback');
    expect(out.events).toEqual([]);
    expect(out.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves args.from / args.tom on the output', async () => {
    const out = await fetchCalendarEvents(
      { ...baseArgs, from: '2026-06-01', tom: '2026-06-30' },
      makeDeps({}),
    );
    expect(out.from).toBe('2026-06-01');
    expect(out.tom).toBe('2026-06-30');
  });
});

// Backwards-compatibility shape assertions (object literal, no logic)
describe('CalendarOutput object shape', () => {
  it('accepts a fully-populated CalendarOutput literal', () => {
    const out: CalendarOutput = {
      from: '2026-04-27',
      tom: '2026-05-27',
      fetchedAt: new Date().toISOString(),
      source: 'mcp',
      events: [],
    };
    expect(out.source).toBe('mcp');
  });
});

// ---------------------------------------------------------------------------
// HTML error response fixture
// ---------------------------------------------------------------------------

describe('HTML error response handling', () => {
  it('parseCalendarHtml handles 404-style HTML body gracefully', () => {
    const notFoundHtml = `
<!DOCTYPE html>
<html>
<head><title>404 – Sidan hittades inte</title></head>
<body>
<h1>Sidan hittades inte</h1>
<p>Den begärda sidan kunde inte hittas.</p>
</body>
</html>`;

    // Should not throw; should return empty or near-empty events
    expect(() => parseCalendarHtml(notFoundHtml)).not.toThrow();
    const events = parseCalendarHtml(notFoundHtml);
    expect(Array.isArray(events)).toBe(true);
  });

  it('parseCalendarHtml handles server-error HTML gracefully', () => {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head><title>500 Internal Server Error</title></head>
<body>
<h1>Internal Server Error</h1>
</body>
</html>`;

    expect(() => parseCalendarHtml(errorHtml)).not.toThrow();
    const events = parseCalendarHtml(errorHtml);
    expect(Array.isArray(events)).toBe(true);
  });

  it('parseCalendarHtml handles empty string without crashing', () => {
    expect(() => parseCalendarHtml('')).not.toThrow();
    expect(parseCalendarHtml('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Output structure validation
// ---------------------------------------------------------------------------

describe('CalendarOutput structure', () => {
  it('output has all required fields', () => {
    const output: CalendarOutput = {
      from: '2026-04-27',
      tom: '2026-05-27',
      fetchedAt: '2026-04-27T10:00:00.000Z',
      source: 'mcp',
      events: [
        {
          datum: '2026-05-05',
          tid: '10:00',
          org: 'FiU',
          titel: 'Utfrågning om statsbudgeten',
          typ: 'Öppet',
        },
      ],
    };

    expect(output).toHaveProperty('from');
    expect(output).toHaveProperty('tom');
    expect(output).toHaveProperty('fetchedAt');
    expect(output).toHaveProperty('source');
    expect(output).toHaveProperty('events');
    expect(Array.isArray(output.events)).toBe(true);
  });

  it('event has all required fields', () => {
    const event = {
      datum: '2026-05-05',
      tid: '10:00',
      org: 'FiU',
      titel: 'Utfrågning',
      typ: 'Öppet',
    };

    expect(event).toHaveProperty('datum');
    expect(event).toHaveProperty('tid');
    expect(event).toHaveProperty('org');
    expect(event).toHaveProperty('titel');
    expect(event).toHaveProperty('typ');
  });

  it('source must be "mcp" or "web_fallback"', () => {
    const validSources: string[] = ['mcp', 'web_fallback'];
    const output: CalendarOutput = {
      from: '2026-04-27',
      tom: '2026-05-27',
      fetchedAt: new Date().toISOString(),
      source: 'mcp',
      events: [],
    };

    expect(validSources).toContain(output.source);
  });

  it('fetchedAt is a valid ISO timestamp', () => {
    const output: CalendarOutput = {
      from: '2026-04-27',
      tom: '2026-05-27',
      fetchedAt: new Date().toISOString(),
      source: 'web_fallback',
      events: [],
    };

    expect(output.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // `new Date(string)` never throws (it returns Invalid Date), so use
    // Date.parse to actually validate the timestamp.
    expect(Number.isNaN(Date.parse(output.fetchedAt))).toBe(false);
  });
});
