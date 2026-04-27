#!/usr/bin/env tsx
/**
 * @module scripts/riksbank-fetch
 * @description CLI wrapper for Sveriges Riksbank (SWEA) interest rate data.
 *
 * Fetches monetary policy data directly from the Riksbank SWEA REST API
 * (`https://api.riksbank.se/swea/v1/`) using native `fetch`. Every response
 * includes an `economicProvenance` block with `provider: "riksbank"` as
 * required by `.github/aw/ECONOMIC_DATA_CONTRACT.md` v2.1.
 *
 * **Provider hierarchy reminder** (per ECONOMIC_DATA_CONTRACT.md v2.1):
 *   1. IMF — macro (GDP, inflation, unemployment, fiscal, monetary projections)
 *   2. SCB — Sweden-specific ground truth (regional, monthly, granular)
 *   3. Riksbank — Swedish central bank policy rates and monetary statistics
 *   4. World Bank — governance/environment residue
 *
 * Riksbank data is used **when direct official rate data is needed** (e.g.
 * exact styrränta for the current date) rather than IMF MFS_IR monthly
 * aggregates. It is NEVER aliased as IMF in provenance metadata.
 *
 * ## Usage
 *
 *   tsx scripts/riksbank-fetch.ts policy-rate [--persist]
 *   tsx scripts/riksbank-fetch.ts rates --series SEKREPULD [--from 2024-01-01] [--to 2025-12-31] [--persist]
 *   tsx scripts/riksbank-fetch.ts list-series
 *   tsx scripts/riksbank-fetch.ts help
 *
 * `--persist` writes the raw response under `analysis/data/riksbank/` via
 * {@link persistRiksbankData}. Outputs JSON (with `economicProvenance`) to
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
 * @see https://api.riksbank.se/swea/v1/
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RIKSBANK_SWEA_BASE_URL = 'https://api.riksbank.se/swea/v1';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 15_000;

/** Known Riksbank SWEA series IDs relevant to Swedish political analysis */
export const RIKSBANK_SERIES = [
  {
    id: 'SEKREPULD',
    name: 'Swedish policy rate (styrränta / reporänta)',
    description: 'Sveriges Riksbank main policy rate. Key monetary-policy indicator for FiU committee analysis.',
    policyAreas: ['monetary policy', 'interest rates'],
    committees: ['FiU'],
    unit: '% per annum',
  },
  {
    id: 'SEKSEKSTIBOR3MD',
    name: 'STIBOR 3-month rate',
    description: 'Stockholm Interbank Offered Rate, 3-month. Reference rate for short-term lending.',
    policyAreas: ['monetary policy', 'financial markets'],
    committees: ['FiU'],
    unit: '% per annum',
  },
  {
    id: 'SEKBONDLNY10',
    name: 'Swedish government bond 10-year yield',
    description: 'Yield on Swedish 10-year government bonds. Indicator for long-term borrowing costs.',
    policyAreas: ['fiscal policy', 'monetary policy'],
    committees: ['FiU'],
    unit: '% per annum',
  },
] as const;

/** Series IDs for the policy-rate command (primary styrränta) */
const POLICY_RATE_SERIES_ID = 'SEKREPULD';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed command-line arguments */
export interface ParsedRiksbankArgs {
  readonly command: 'policy-rate' | 'rates' | 'list-series' | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

/** economicProvenance block emitted with every response */
export interface RiksbankEconomicProvenance {
  readonly provider: 'riksbank';
  readonly dataflow: 'swea';
  readonly indicator: string;
  readonly vintage: string;
  readonly retrieved_at: string;
}

/** A single Riksbank data observation */
export interface RiksbankObservation {
  readonly date: string;
  readonly value: number | null;
  readonly seriesId: string;
}

/** Wrapped response with provenance */
export interface RiksbankProvenanceResponse<T = unknown> {
  readonly data: T;
  readonly economicProvenance: RiksbankEconomicProvenance;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/** Typed error for Riksbank fetch CLI failures */
export class RiksbankFetchError extends Error {
  readonly kind: 'cli' | 'network' | 'validation';

  constructor(message: string, kind: RiksbankFetchError['kind']) {
    super(message);
    this.name = 'RiksbankFetchError';
    this.kind = kind;
  }
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

const HELP = `tsx scripts/riksbank-fetch.ts <command> [flags]

Commands:
  policy-rate   Fetch the Swedish policy rate (styrränta) time series
  rates         Fetch an arbitrary SWEA series
  list-series   Print the built-in Riksbank series catalogue
  help          Show this message

Flags:
  --series <ID>        SWEA series ID (e.g. SEKREPULD) for 'rates' command
  --from <YYYY-MM-DD>  Start date for series fetch (optional)
  --to <YYYY-MM-DD>    End date for series fetch (optional)
  --persist            Write raw output under analysis/data/riksbank/

Provider note:
  All output carries economicProvenance.provider = "riksbank".
  Riksbank is NEVER aliased as IMF — they are distinct providers.
  Use scripts/imf-fetch.ts sdmx --path ".../MFS_IR/..." for IMF monetary data.
`;

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse CLI arguments into a structured form.
 *
 * @param argv - Process arguments (excluding node and script path)
 * @returns Parsed command, flags, and boolean options
 * @throws {RiksbankFetchError} for unknown commands
 */
export function parseRiksbankArgs(argv: readonly string[]): ParsedRiksbankArgs {
  const command = (argv[0] ?? 'help') as ParsedRiksbankArgs['command'];
  const validCommands: readonly ParsedRiksbankArgs['command'][] = [
    'policy-rate', 'rates', 'list-series', 'help',
  ];
  if (!validCommands.includes(command)) {
    throw new RiksbankFetchError(`unknown command "${command}"`, 'cli');
  }

  const flags = new Map<string, string>();
  const booleans = new Set<string>();

  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      throw new RiksbankFetchError(`unexpected positional argument "${token}"`, 'cli');
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
 * @throws {RiksbankFetchError} if the flag is missing
 */
export function requireRiksbankFlag(
  flags: ReadonlyMap<string, string>,
  key: string,
): string {
  const value = flags.get(key);
  if (!value) {
    throw new RiksbankFetchError(`missing required flag --${key}`, 'cli');
  }
  return value;
}

// ---------------------------------------------------------------------------
// Provenance builder
// ---------------------------------------------------------------------------

/**
 * Build an `economicProvenance` block for Riksbank data.
 *
 * @param indicator - SWEA series ID
 * @returns Provenance block with provider "riksbank"
 */
export function buildRiksbankProvenance(indicator: string): RiksbankEconomicProvenance {
  const now = new Date();
  return {
    provider: 'riksbank',
    dataflow: 'swea',
    indicator,
    vintage: now.toISOString().slice(0, 10),
    retrieved_at: now.toISOString(),
  };
}

/**
 * Wrap a payload with a Riksbank economicProvenance block.
 *
 * @param data      - The fetched data
 * @param indicator - SWEA series ID
 * @returns Wrapped response with provenance
 */
export function wrapWithRiksbankProvenance<T>(
  data: T,
  indicator: string,
): RiksbankProvenanceResponse<T> {
  return {
    data,
    economicProvenance: buildRiksbankProvenance(indicator),
  };
}

// ---------------------------------------------------------------------------
// SWEA API client
// ---------------------------------------------------------------------------

/** Raw SWEA API observation from the `/observations` endpoint */
interface SweaObservationRaw {
  date?: string;
  value?: number | string | null;
  seriesId?: string;
}

/** Raw SWEA API envelope */
interface SweaResponse {
  observations?: SweaObservationRaw[];
  seriesId?: string;
  [key: string]: unknown;
}

/**
 * Fetch observations for a single SWEA series.
 *
 * @param seriesId - Riksbank SWEA series identifier (e.g. "SEKREPULD")
 * @param from     - Optional ISO date (YYYY-MM-DD) start filter
 * @param to       - Optional ISO date (YYYY-MM-DD) end filter
 * @param timeout  - Request timeout in ms (default 15 000)
 * @returns Array of observations
 * @throws {RiksbankFetchError} on network / validation failure
 */
export async function fetchRiksbankSeries(
  seriesId: string,
  from?: string,
  to?: string,
  timeout = DEFAULT_TIMEOUT,
): Promise<RiksbankObservation[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const qs = params.toString();
  const url = `${RIKSBANK_SWEA_BASE_URL}/observations/${encodeURIComponent(seriesId)}${qs ? `?${qs}` : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new RiksbankFetchError(
        `Riksbank SWEA API error ${response.status} ${response.statusText} for series ${seriesId}`,
        'network',
      );
    }

    const json = await response.json() as SweaResponse | SweaObservationRaw[];

    // The SWEA v1 API returns either a plain array or a wrapped envelope
    const rawObs: SweaObservationRaw[] = Array.isArray(json)
      ? json
      : (json.observations ?? []);

    return rawObs.map((obs): RiksbankObservation => ({
      date: String(obs.date ?? ''),
      value: obs.value !== undefined && obs.value !== null
        ? (typeof obs.value === 'string' ? Number.parseFloat(obs.value) : obs.value)
        : null,
      seriesId,
    }));
  } catch (error) {
    if (error instanceof RiksbankFetchError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new RiksbankFetchError(`Riksbank SWEA fetch failed for ${seriesId}: ${msg}`, 'network');
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Persistence helper
// ---------------------------------------------------------------------------

function resolveDataRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  return path.join(repoRoot, 'analysis', 'data');
}

/**
 * Persist Riksbank series data under `analysis/data/riksbank/`.
 *
 * @param seriesId  - SWEA series identifier
 * @param payload   - Full response payload with provenance
 * @returns Absolute path of the written data file
 */
export function persistRiksbankData(
  seriesId: string,
  payload: unknown,
): string {
  const dataRoot = resolveDataRoot();
  const dir = path.join(dataRoot, 'riksbank');
  fs.mkdirSync(dir, { recursive: true });

  const safe = seriesId.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  const filename = `${safe}.json`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');

  const metaFilename = `${safe}.meta.json`;
  fs.writeFileSync(
    path.join(dir, metaFilename),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      mcpTool: 'riksbank-swea',
      seriesId,
      provider: 'riksbank',
    }, null, 2),
    'utf8',
  );

  return filepath;
}

// ---------------------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------------------

async function runPolicyRate(booleans: ReadonlySet<string>): Promise<void> {
  const seriesId = POLICY_RATE_SERIES_ID;
  const observations = await fetchRiksbankSeries(seriesId);
  const payload = wrapWithRiksbankProvenance(
    { seriesId, observations },
    seriesId,
  );

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    persistRiksbankData(seriesId, payload);
  }
}

async function runRates(
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const seriesId = requireRiksbankFlag(flags, 'series');
  const from = flags.get('from');
  const to = flags.get('to');

  const observations = await fetchRiksbankSeries(seriesId, from, to);
  const payload = wrapWithRiksbankProvenance(
    { seriesId, from: from ?? null, to: to ?? null, observations },
    seriesId,
  );

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    persistRiksbankData(seriesId, payload);
  }
}

function runListSeries(): void {
  const payload = wrapWithRiksbankProvenance(
    { series: RIKSBANK_SERIES },
    'series-catalogue',
  );
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, flags, booleans } = parseRiksbankArgs(process.argv.slice(2));

  switch (command) {
    case 'policy-rate':
      await runPolicyRate(booleans);
      return;
    case 'rates':
      await runRates(flags, booleans);
      return;
    case 'list-series':
      runListSeries();
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
    process.stderr.write(`riksbank-fetch: ${message}\n`);
    process.exit(error instanceof RiksbankFetchError && error.kind === 'cli' ? 2 : 1);
  });
}
