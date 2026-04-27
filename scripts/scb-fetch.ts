#!/usr/bin/env tsx
/**
 * @module scripts/scb-fetch
 * @description CLI wrapper around {@link SCBClient} for agentic workflows.
 *
 * Agentic workflows invoke this script through the `bash` tool to query
 * Statistics Sweden (SCB) data via the PXWeb MCP server. Every response
 * includes an `economicProvenance` block with `provider: "scb"` as required
 * by `.github/aw/ECONOMIC_DATA_CONTRACT.md` v2.1.
 *
 * **SCB is NEVER aliased as IMF.** SCB provides Sweden-specific ground-truth
 * data (regional, monthly, granular) that IMF does not publish. IMF remains
 * the primary provider for macro, fiscal, and monetary indicators.
 *
 * ## Usage
 *
 *   tsx scripts/scb-fetch.ts search --query "arbetslöshet" [--limit 5]
 *   tsx scripts/scb-fetch.ts query --table TAB5765 [--persist]
 *   tsx scripts/scb-fetch.ts list-domains
 *   tsx scripts/scb-fetch.ts help
 *
 * `--persist` writes the raw response under `analysis/data/scb/` via
 * {@link persistSCBData}. Outputs JSON (with `economicProvenance`) to
 * stdout regardless.
 *
 * ## Exit codes
 *
 *   0 — success
 *   1 — runtime / network / validation error
 *   2 — bad CLI arguments
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';

import { SCBClient, SCB_DOMAINS } from './scb-client.js';
import { persistSCBData } from './parliamentary-data/data-persistence.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed command-line arguments */
export interface ParsedScbArgs {
  readonly command: 'search' | 'query' | 'list-domains' | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

/** economicProvenance block emitted with every response */
export interface ScbEconomicProvenance {
  readonly provider: 'scb';
  readonly dataflow: 'pxweb';
  readonly indicator: string;
  readonly vintage: string;
  readonly retrieved_at: string;
}

/** Wrapped response with provenance */
export interface ScbProvenanceResponse<T = unknown> {
  readonly data: T;
  readonly economicProvenance: ScbEconomicProvenance;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/** Typed error for SCB fetch CLI failures */
export class ScbFetchError extends Error {
  readonly kind: 'cli' | 'network' | 'validation';

  constructor(message: string, kind: ScbFetchError['kind']) {
    super(message);
    this.name = 'ScbFetchError';
    this.kind = kind;
  }
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

const HELP = `tsx scripts/scb-fetch.ts <command> [flags]

Commands:
  search        Search SCB tables by query string
  query         Fetch data from a specific SCB table (by tableId)
  list-domains  Print the built-in SCB domain catalogue
  help          Show this message

Flags:
  --query <TEXT>       Search query for 'search' command (e.g. "arbetslöshet")
  --limit <N>          Max results for 'search' (default: 5)
  --table <TABLE_ID>   SCB table ID for 'query' command (e.g. TAB5765)
  --persist            Write raw output under analysis/data/scb/

Provider note:
  All output carries economicProvenance.provider = "scb".
  SCB is NEVER aliased as IMF — they are distinct providers.
  Use scripts/imf-fetch.ts for macro/fiscal/monetary indicators.
`;

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse CLI arguments into a structured form.
 *
 * @param argv - Process arguments (excluding node and script path)
 * @returns Parsed command, flags, and boolean options
 * @throws {ScbFetchError} for unknown commands or malformed arguments
 */
export function parseScbArgs(argv: readonly string[]): ParsedScbArgs {
  const command = (argv[0] ?? 'help') as ParsedScbArgs['command'];
  const validCommands: readonly ParsedScbArgs['command'][] = [
    'search', 'query', 'list-domains', 'help',
  ];
  if (!validCommands.includes(command)) {
    throw new ScbFetchError(`unknown command "${command}"`, 'cli');
  }

  const flags = new Map<string, string>();
  const booleans = new Set<string>();

  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      throw new ScbFetchError(`unexpected positional argument "${token}"`, 'cli');
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

/**
 * Require a CLI flag, throwing a typed error if absent.
 *
 * @param flags - Parsed flags map
 * @param key   - Flag name (without `--`)
 * @returns Flag value
 * @throws {ScbFetchError} if the flag is missing
 */
export function requireScbFlag(
  flags: ReadonlyMap<string, string>,
  key: string,
): string {
  const value = flags.get(key);
  if (!value) {
    throw new ScbFetchError(`missing required flag --${key}`, 'cli');
  }
  return value;
}

// ---------------------------------------------------------------------------
// Provenance builder
// ---------------------------------------------------------------------------

/**
 * Build an `economicProvenance` block for SCB data.
 *
 * @param indicator - SCB table ID or query string
 * @returns Provenance block with provider "scb"
 */
export function buildScbProvenance(indicator: string): ScbEconomicProvenance {
  const now = new Date();
  return {
    provider: 'scb',
    dataflow: 'pxweb',
    indicator,
    vintage: now.toISOString().slice(0, 10),
    retrieved_at: now.toISOString(),
  };
}

/**
 * Wrap a payload with an SCB economicProvenance block.
 *
 * @param data - The fetched data
 * @param indicator - Indicator / table ID to include in provenance
 * @returns Wrapped response with provenance
 */
export function wrapWithScbProvenance<T>(
  data: T,
  indicator: string,
): ScbProvenanceResponse<T> {
  return {
    data,
    economicProvenance: buildScbProvenance(indicator),
  };
}

// ---------------------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------------------

async function runSearch(
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const query = requireScbFlag(flags, 'query');
  const limit = Number.parseInt(flags.get('limit') ?? '5', 10);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new ScbFetchError(`--limit must be a positive integer, got "${flags.get('limit')}"`, 'cli');
  }

  const client = new SCBClient();
  const tables = await client.searchTables(query, limit);
  const payload = wrapWithScbProvenance({ query, limit, tables }, `search:${query}`);

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    persistSCBData(`search-${query.replace(/\s+/g, '-')}`, payload, { query, limit });
  }
}

async function runQuery(
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const tableId = requireScbFlag(flags, 'table');

  const client = new SCBClient();
  const dataPoints = await client.getTableData(tableId);
  const payload = wrapWithScbProvenance({ tableId, dataPoints }, tableId);

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    persistSCBData(tableId, payload, { tableId });
  }
}

function runListDomains(): void {
  const payload = wrapWithScbProvenance({ domains: SCB_DOMAINS }, 'domain-catalogue');
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, flags, booleans } = parseScbArgs(process.argv.slice(2));

  switch (command) {
    case 'search':
      await runSearch(flags, booleans);
      return;
    case 'query':
      await runQuery(flags, booleans);
      return;
    case 'list-domains':
      runListDomains();
      return;
    case 'help':
    default:
      process.stdout.write(HELP);
  }
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`scb-fetch: ${message}\n`);
    process.exit(error instanceof ScbFetchError && error.kind === 'cli' ? 2 : 1);
  });
}
