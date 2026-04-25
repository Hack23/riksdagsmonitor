#!/usr/bin/env tsx
/**
 * @module scripts/statskontoret-fetch
 * @description CLI wrapper around StatskontoretClient for agentic workflows.
 *
 * Usage:
 *   tsx scripts/statskontoret-fetch.ts list-sources
 *   tsx scripts/statskontoret-fetch.ts discover --source myndighetsforteckning
 *   tsx scripts/statskontoret-fetch.ts headcount --url <xlsx-url> [--persist]
 */

import {
  buildHeadcountTimeSeries,
  getStatskontoretSource,
  STATSKONTORET_SOURCES,
  StatskontoretClient,
  type StatskontoretSourceKey,
} from './statskontoret-client.js';
import { persistStatskontoretData } from './parliamentary-data/data-persistence.js';

interface ParsedArgs {
  readonly command: 'list-sources' | 'discover' | 'headcount' | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

const HELP = `tsx scripts/statskontoret-fetch.ts <command> [flags]

Commands:
  list-sources    Print the built-in Statskontoret source catalogue
  discover        Extract downloadable Excel/CSV-ZIP links from a source page
  headcount       Fetch an authority-register workbook and aggregate headcount by department/year
  help            Show this message

Flags:
  --source <KEY>  Source key: myndighetsforteckning | budget-time-series | arsutfall | manadsutfall
  --url <URL>     Direct Excel workbook URL for headcount aggregation
  --persist       Write raw/derived output under analysis/data/statskontoret/
`;

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = (argv[0] ?? 'help') as ParsedArgs['command'];
  const validCommands: readonly ParsedArgs['command'][] = ['list-sources', 'discover', 'headcount', 'help'];
  if (!validCommands.includes(command)) {
    process.stderr.write(`statskontoret-fetch: unknown command ${command}\n`);
    process.exit(2);
  }
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      process.stderr.write(`statskontoret-fetch: unexpected positional argument ${token}\n`);
      process.exit(2);
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      booleans.add(key);
    }
  }
  return { command, flags, booleans };
}

function requireFlag(flags: ReadonlyMap<string, string>, key: string): string {
  const value = flags.get(key);
  if (!value) {
    process.stderr.write(`statskontoret-fetch: missing required flag --${key}\n`);
    process.exit(2);
  }
  return value;
}

function parseSource(value: string): StatskontoretSourceKey {
  if (STATSKONTORET_SOURCES.some((source) => source.key === value)) return value as StatskontoretSourceKey;
  process.stderr.write(`statskontoret-fetch: unknown source ${value}\n`);
  process.exit(2);
}

async function runDiscover(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const source = parseSource(requireFlag(flags, 'source'));
  const client = new StatskontoretClient();
  const links = await client.discoverDownloads(source);
  const payload = { source: getStatskontoretSource(source), links };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (booleans.has('persist')) {
    persistStatskontoretData(source, 'downloads', payload);
  }
}

async function runHeadcount(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const url = requireFlag(flags, 'url');
  const client = new StatskontoretClient();
  const workbook = await client.fetchWorkbook(url);
  const headcount = buildHeadcountTimeSeries(workbook, { sheetNamePattern: /förteckning|forteckning/i });
  const payload = { source: 'myndighetsforteckning', url, headcount };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (booleans.has('persist')) {
    persistStatskontoretData('myndighetsforteckning', 'headcount-by-department', payload);
  }
}

async function main(): Promise<void> {
  const { command, flags, booleans } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'list-sources':
      process.stdout.write(`${JSON.stringify({ sources: STATSKONTORET_SOURCES }, null, 2)}\n`);
      return;
    case 'discover':
      await runDiscover(flags, booleans);
      return;
    case 'headcount':
      await runHeadcount(flags, booleans);
      return;
    case 'help':
    default:
      process.stdout.write(HELP);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`statskontoret-fetch: ${message}\n`);
  process.exit(1);
});
