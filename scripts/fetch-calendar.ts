#!/usr/bin/env tsx
/**
 * @module scripts/fetch-calendar
 * @description Fetch riksdag calendar events using a primary (MCP) →
 * fallback (web fetch + HTML parsing) chain.
 *
 * Usage:
 *   npx tsx scripts/fetch-calendar.ts --from 2026-04-27 --tom 2026-05-27 [--org UTSK] [--akt bet] [--persist]
 *
 * Output:
 *   analysis/data/calendar/{from}_{tom}.json   — always written
 *
 * Exit codes:
 *   0 — success
 *   1 — runtime / network error
 *   2 — bad CLI arguments
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from './mcp-client.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedCalendarArgs {
  readonly from: string;
  readonly tom: string;
  readonly org: string | null;
  readonly akt: string | null;
  readonly persist: boolean;
}

export interface CalendarEvent {
  datum: string;
  tid: string;
  org: string;
  titel: string;
  typ: string;
}

export interface CalendarOutput {
  from: string;
  tom: string;
  fetchedAt: string;
  source: 'mcp' | 'web_fallback';
  events: CalendarEvent[];
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface CalendarParseArgsResult {
  readonly args: ParsedCalendarArgs;
  readonly error: string | null;
}

export function parseArgs(argv: readonly string[]): CalendarParseArgsResult {
  const flags = new Map<string, string>();
  const booleans = new Set<string>();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      booleans.add(key);
    }
  }

  const fromVal = flags.get('from');
  const tomVal = flags.get('tom');

  if (!fromVal) {
    return {
      args: { from: '', tom: '', org: null, akt: null, persist: false },
      error: 'missing required flag --from',
    };
  }
  if (!tomVal) {
    return {
      args: { from: fromVal, tom: '', org: null, akt: null, persist: false },
      error: 'missing required flag --tom',
    };
  }

  if (!DATE_RE.test(fromVal)) {
    return {
      args: { from: '', tom: '', org: null, akt: null, persist: false },
      error: `--from must be YYYY-MM-DD, got: ${fromVal}`,
    };
  }
  if (!DATE_RE.test(tomVal)) {
    return {
      args: { from: fromVal, tom: '', org: null, akt: null, persist: false },
      error: `--tom must be YYYY-MM-DD, got: ${tomVal}`,
    };
  }

  return {
    args: {
      from: fromVal,
      tom: tomVal,
      org: flags.get('org') ?? null,
      akt: flags.get('akt') ?? null,
      persist: booleans.has('persist'),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// MCP primary path
// ---------------------------------------------------------------------------

async function fetchViaMcp(client: MCPClient, args: ParsedCalendarArgs): Promise<CalendarEvent[]> {
  const raw = await client.fetchCalendarEvents(args.from, args.tom, args.org, args.akt);
  return raw.map((item) => {
    const r = item as Record<string, unknown>;
    return {
      datum: String(r['datum'] ?? r['date'] ?? r['dtstart'] ?? ''),
      tid: String(r['tid'] ?? r['time'] ?? r['starttid'] ?? ''),
      org: String(r['org'] ?? r['organ'] ?? r['organisation'] ?? ''),
      titel: String(r['titel'] ?? r['summary'] ?? r['title'] ?? r['rubrik'] ?? ''),
      typ: String(r['typ'] ?? r['type'] ?? r['akt'] ?? r['aktivitet'] ?? ''),
    };
  });
}

// ---------------------------------------------------------------------------
// Web fallback — parse riksdagen.se/sv/kalendarium/ HTML
// ---------------------------------------------------------------------------

const RIKSDAGEN_CALENDAR_URL = 'https://www.riksdagen.se/sv/kalendarium/';

/**
 * Parse calendar events from riksdagen.se HTML using regex patterns.
 * Since cheerio may not be available, we use Node's built-in fetch
 * and regex-based HTML extraction.
 */
export function parseCalendarHtml(html: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Pattern: extract event blocks.  The page wraps events in article/li
  // elements with class like "event-item", "event", "calendar-item".
  // We extract: date, time, organ, title, type using several heuristics.

  // Strategy 1: JSON-LD structured data (most reliable)
  const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(jsonLdRe)) {
    try {
      const raw = m[1];
      if (!raw) continue;
      const obj = JSON.parse(raw) as Record<string, unknown>;
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        if (typeof item !== 'object' || item === null) continue;
        const ev = item as Record<string, unknown>;
        if (ev['@type'] === 'Event' || ev['@type'] === 'SocialEvent') {
          events.push({
            datum: String(ev['startDate'] ?? ev['startdate'] ?? '').slice(0, 10),
            tid: String(ev['startDate'] ?? '').slice(11, 16),
            org: String(
              (ev['organizer'] as Record<string, unknown>)?.['name'] ?? '',
            ),
            titel: String(ev['name'] ?? ev['headline'] ?? ''),
            typ: String(ev['eventType'] ?? ev['category'] ?? ''),
          });
        }
      }
    } catch {
      // JSON parse failed — skip this block
    }
  }

  if (events.length > 0) return events;

  // Strategy 2: Scan for common HTML patterns in riksdagen.se
  // Event title typically in <a class="event-title"> or <h2 class="...">
  const titleRe = /<(?:a|h[23])[^>]*class="[^"]*(?:event-title|calendar-title|event-name)[^"]*"[^>]*>([\s\S]*?)<\/(?:a|h[23])>/gi;
  const dateRe = /(?:data-date|datetime)="(\d{4}-\d{2}-\d{2})"/gi;
  const timeRe = /(\d{2}:\d{2})/g;

  const dates = [...html.matchAll(dateRe)].map((m) => m[1] ?? '');
  const titles = [...html.matchAll(titleRe)].map((m) =>
    // Use [\s\S]*? to match newlines inside tags (prevents incomplete sanitization)
    (m[1] ?? '').replace(/<[\s\S]*?>/g, '').trim(),
  );

  const usedDates = new Set<number>();
  const usedTimes = new Set<number>();

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    if (!title) continue;

    // Find nearest unused date
    let datum = '';
    for (let d = i; d < dates.length; d++) {
      if (!usedDates.has(d) && dates[d]) {
        datum = dates[d]!;
        usedDates.add(d);
        break;
      }
    }

    // Find nearest time
    const allTimes = [...html.matchAll(timeRe)];
    let tid = '';
    for (let t = i; t < allTimes.length; t++) {
      if (!usedTimes.has(t) && allTimes[t]?.[1]) {
        tid = allTimes[t]![1]!;
        usedTimes.add(t);
        break;
      }
    }

    events.push({ datum, tid, org: '', titel: title, typ: '' });
  }

  return events;
}

async function fetchViaWeb(args: ParsedCalendarArgs): Promise<CalendarEvent[]> {
  const url = new URL(RIKSDAGEN_CALENDAR_URL);
  if (args.from) url.searchParams.set('from', args.from);
  if (args.tom) url.searchParams.set('tom', args.tom);
  if (args.org) url.searchParams.set('org', args.org);

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'riksdagsmonitor/1.0 (+https://hack23.com)' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`web_fallback: HTTP ${response.status} from ${url.toString()}`);
  }

  const html = await response.text();
  return parseCalendarHtml(html);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { args, error } = parseArgs(process.argv.slice(2));
  if (error) {
    process.stderr.write(`fetch-calendar: ${error}\n`);
    process.exit(2);
  }

  const { from, tom, persist } = args;

  const client = new MCPClient();
  const fetchedAt = new Date().toISOString();
  let events: CalendarEvent[] = [];
  let source: 'mcp' | 'web_fallback' = 'mcp';

  try {
    events = await fetchViaMcp(client, args);
    process.stderr.write(`fetch-calendar: MCP returned ${events.length} event(s)\n`);
  } catch (mcpErr) {
    process.stderr.write(
      `fetch-calendar: MCP failed (${String(mcpErr)}), trying web fallback\n`,
    );
  }

  if (events.length === 0) {
    source = 'web_fallback';
    try {
      events = await fetchViaWeb(args);
      process.stderr.write(`fetch-calendar: web_fallback returned ${events.length} event(s)\n`);
    } catch (webErr) {
      process.stderr.write(
        `fetch-calendar: web_fallback also failed (${String(webErr)}), returning empty\n`,
      );
      // Graceful degradation — emit empty result rather than crash
    }
  }

  const output: CalendarOutput = { from, tom, fetchedAt, source, events };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  if (persist) {
    const calendarDir = path.join(REPO_ROOT, 'analysis', 'data', 'calendar');
    fs.mkdirSync(calendarDir, { recursive: true });
    const outFile = path.join(calendarDir, `${from}_${tom}.json`);
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n', 'utf8');
    process.stderr.write(`fetch-calendar: persisted → ${path.relative(REPO_ROOT, outFile)}\n`);
  }
}

// Run if this is the entry point
const isMain =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('fetch-calendar.ts') ||
    process.argv[1].endsWith('fetch-calendar.js'));

if (isMain) {
  main().catch((err: unknown) => {
    process.stderr.write(`fetch-calendar: fatal error: ${String(err)}\n`);
    process.exit(1);
  });
}
