#!/usr/bin/env tsx
/**
 * @module scripts/calendar-fetch
 * @description Emits a compact calendar-status JSON for forward indicators.
 *
 * Routes through `fetchCalendarWithFallback()` from `./fetch-calendar.js` so a
 * transient MCP outage transparently falls back to the public
 * `riksdagen.se/sv/kalendarium/` scrape. When `org` (or `akt`) is supplied we
 * filter the resulting events to that scope so the downstream artifact still
 * matches the caller's intent.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CalendarEvent } from './fetch-calendar.js';
import { fetchCalendarWithFallback } from './fetch-calendar.js';
import { MCPClient } from './mcp-client/client.js';

export interface CalendarStatus {
  readonly schemaVersion: '1.0';
  readonly fetchedAt: string;
  readonly from: string;
  readonly to: string;
  readonly org: string | null;
  readonly akt: string | null;
  readonly eventCount: number;
  readonly status: 'ok' | 'error';
  readonly path: 'mcp-primary' | 'web-fallback' | 'none';
  readonly events: readonly CalendarEvent[];
  readonly notes?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const DEFAULT_CALENDAR_STATUS_OUTPUT = path.join(REPO_ROOT, 'data', 'calendar-status.json');

type CalendarResilientFetcher = (
  from: string,
  to: string,
) => Promise<{ events: readonly CalendarEvent[]; path: 'mcp-primary' | 'web-fallback' | 'none'; primaryError?: string; fallbackError?: string }>;

const defaultResilientFetcher: CalendarResilientFetcher = async (from, to) => {
  const result = await fetchCalendarWithFallback(from, to);
  const ret: { events: readonly CalendarEvent[]; path: 'mcp-primary' | 'web-fallback' | 'none'; primaryError?: string; fallbackError?: string } = {
    events: result.events,
    path: result.manifest.path,
  };
  if (result.manifest.primaryError !== undefined) {
    ret.primaryError = result.manifest.primaryError;
  }
  if (result.manifest.fallbackError !== undefined) {
    ret.fallbackError = result.manifest.fallbackError;
  }
  return ret;
};

function matchesScope(event: CalendarEvent, org: string | null, akt: string | null): boolean {
  // When a scope is requested, treat events with an empty/missing field as
  // non-matches — otherwise unclassified events leak into a scoped artifact.
  if (org) {
    if (!event.org || event.org.toLowerCase() !== org.toLowerCase()) return false;
  }
  if (akt) {
    if (!event.akt || event.akt.toLowerCase() !== akt.toLowerCase()) return false;
  }
  return true;
}

export async function fetchCalendarStatus(
  from: string,
  to: string,
  org: string | null = null,
  akt: string | null = null,
  // Back-compat: tests pass a stub MCP client. When provided we route through it
  // directly so tests can simulate MCP failure paths deterministically.
  client?: Pick<MCPClient, 'fetchCalendarEvents'> | CalendarResilientFetcher,
): Promise<CalendarStatus> {
  const fetchedAt = new Date().toISOString();
  try {
    // Resilient default: use the MCP→web fallback chain so a transient MCP
    // outage does not block the artifact.
    if (!client) {
      const result = await defaultResilientFetcher(from, to);
      const scoped = (org || akt)
        ? result.events.filter((event) => matchesScope(event, org, akt))
        : result.events;
      const okPath = result.path !== 'none';
      const baseStatus: CalendarStatus = {
        schemaVersion: '1.0',
        fetchedAt,
        from,
        to,
        org,
        akt,
        eventCount: scoped.length,
        status: okPath ? 'ok' : 'error',
        path: result.path,
        events: scoped,
        ...(result.primaryError || result.fallbackError
          ? { notes: [
              result.primaryError ? `primary: ${result.primaryError}` : '',
              result.fallbackError ? `fallback: ${result.fallbackError}` : '',
            ].filter(Boolean).join(' | ') }
          : {}),
      };
      return baseStatus;
    }
    // Legacy path: caller injected an MCP-style client. Keep the original
    // behaviour so the test surface remains stable.
    if (typeof (client as { fetchCalendarEvents?: unknown }).fetchCalendarEvents === 'function') {
      const mcp = client as Pick<MCPClient, 'fetchCalendarEvents'>;
      const raw = await mcp.fetchCalendarEvents(from, to, org, akt);
      const { normalizeMcpCalendarEvent } = await import('./fetch-calendar.js');
      const events = raw.map((event) => normalizeMcpCalendarEvent(event));
      const scoped = (org || akt)
        ? events.filter((event) => matchesScope(event, org, akt))
        : events;
      return {
        schemaVersion: '1.0',
        fetchedAt,
        from,
        to,
        org,
        akt,
        eventCount: scoped.length,
        status: 'ok',
        path: 'mcp-primary',
        events: scoped,
      };
    }
    const customFetcher = client as CalendarResilientFetcher;
    const result = await customFetcher(from, to);
    const scoped = (org || akt)
      ? result.events.filter((event) => matchesScope(event, org, akt))
      : result.events;
    return {
      schemaVersion: '1.0',
      fetchedAt,
      from,
      to,
      org,
      akt,
      eventCount: scoped.length,
      status: result.path !== 'none' ? 'ok' : 'error',
      path: result.path,
      events: scoped,
    };
  } catch (error) {
    return {
      schemaVersion: '1.0',
      fetchedAt,
      from,
      to,
      org,
      akt,
      eventCount: 0,
      status: 'error',
      path: 'none',
      events: [],
      notes: error instanceof Error ? error.message : String(error),
    };
  }
}

export function persistCalendarStatus(status: CalendarStatus, outputPath = DEFAULT_CALENDAR_STATUS_OUTPUT): string {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  return outputPath;
}

function parseArgs(argv: readonly string[]): { from: string; to: string; org: string | null; akt: string | null; output: string; persist: boolean } {
  let from = new Date().toISOString().slice(0, 10);
  let to = from;
  let org: string | null = null;
  let akt: string | null = null;
  let output = DEFAULT_CALENDAR_STATUS_OUTPUT;
  let persist = true;
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--from' && next) {
      from = next;
      i++;
      continue;
    }
    if (token === '--to' && next) {
      to = next;
      i++;
      continue;
    }
    if (token === '--org' && next) {
      org = next;
      i++;
      continue;
    }
    if (token === '--akt' && next) {
      akt = next;
      i++;
      continue;
    }
    if (token === '--output' && next) {
      output = next;
      i++;
      continue;
    }
    if (token === '--no-persist') {
      persist = false;
    }
  }
  return { from, to, org, akt, output, persist };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const status = await fetchCalendarStatus(args.from, args.to, args.org, args.akt);
  if (args.persist) {
    persistCalendarStatus(status, args.output);
  }
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
}

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((error: unknown) => {
    console.error(`calendar-fetch: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
