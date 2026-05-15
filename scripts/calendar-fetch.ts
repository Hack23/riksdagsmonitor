#!/usr/bin/env tsx
/**
 * @module scripts/calendar-fetch
 * @description Emits a compact calendar-status JSON for forward indicators.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeMcpCalendarEvent } from './fetch-calendar.js';
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
  readonly events: readonly ReturnType<typeof normalizeMcpCalendarEvent>[];
  readonly notes?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const DEFAULT_CALENDAR_STATUS_OUTPUT = path.join(REPO_ROOT, 'data', 'calendar-status.json');

export async function fetchCalendarStatus(
  from: string,
  to: string,
  org: string | null = null,
  akt: string | null = null,
  client: Pick<MCPClient, 'fetchCalendarEvents'> = new MCPClient(),
): Promise<CalendarStatus> {
  const fetchedAt = new Date().toISOString();
  try {
    const raw = await client.fetchCalendarEvents(from, to, org, akt);
    const events = raw.map((event) => normalizeMcpCalendarEvent(event));
    return {
      schemaVersion: '1.0',
      fetchedAt,
      from,
      to,
      org,
      akt,
      eventCount: events.length,
      status: 'ok',
      events,
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
