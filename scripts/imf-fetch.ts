#!/usr/bin/env tsx
/**
 * @module scripts/imf-fetch
 * @description Thin CLI wrapper around {@link ImfClient} for agentic workflows.
 *
 * Agentic workflows (see `.github/workflows/news-*.md`) invoke this script
 * through the `bash` tool instead of going through an MCP server. This
 * keeps the IMF integration under pure-TypeScript / npm governance —
 * identical to `world-bank-client.ts` and `scb-client.ts` — with no Python
 * or `uvx` runtime on the firewall allowlist.
 *
 * ## Usage
 *
 *   # Fetch a WEO time series for one country (default: last 10 years):
 *   tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH [--years 15] [--persist]
 *
 *   # Fetch a WEO latest point across the Nordic + DE peer set:
 *   tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU
 *
 *   # Low-level SDMX 3.0 passthrough (for IFS / BOP / FM / GFS / DOTS):
 *   tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01" [--persist]
 *
 * `--persist` writes the raw response under `analysis/data/imf/{indicator}/{country}.json`
 * with sidecar provenance (mcpTool=`imf-ts-client`, `database`, `projectionVintage`)
 * via {@link persistIMFData}. Outputs JSON to stdout regardless.
 *
 * ## Exit codes
 *
 *   0 — success (JSON written to stdout, optionally persisted)
 *   1 — runtime / network / validation error (human-readable message to stderr)
 *   2 — bad CLI arguments
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ImfClient,
  type ImfDataPoint,
  IMF_WEO_INDICATORS,
  IMF_FM_INDICATORS,
  IMF_WEO_DATAMAPPER_AVAILABLE,
  IMF_WEO_SDMX_ONLY,
  ImfWeoSdmxOnlyError,
  calculateRetryDelay,
  parseDatamapperValues,
  weoSdmxPath,
} from './imf-client.js';
import { toDatamapperCode } from './imf-codes.js';
import { persistIMFData, sanitizeDokId } from './parliamentary-data/data-persistence.js';

// ---------------------------------------------------------------------------
// IMF cache fallback — when live fetch fails, try persisted data
// ---------------------------------------------------------------------------

const DATA_ROOT = resolve(process.cwd(), 'analysis', 'data');
const WEO_FETCH_MAX_ATTEMPTS = 3;
const EMPTY_DATAMAPPER_SERIES_CODE = 'datamapper-empty-series';

/**
 * Attempt to load previously-persisted IMF data for a given indicator/country.
 * Returns `{ data, meta }` if cache exists, or `null` otherwise.
 * Uses the same path sanitization as `persistIMFData` (sanitizeDokId):
 * lowercase + non-alphanumeric → hyphen, so NGDP_RPCH/SWE → ngdp-rpch/swe.json.
 */
function loadCachedIMFData(indicator: string, country: string): { data: unknown; meta: { fetchedAt: string; database?: string; projectionVintage?: string } } | null {
  const dataPath = join(DATA_ROOT, 'imf', sanitizeDokId(indicator), `${sanitizeDokId(country)}.json`);
  const metaPath = join(DATA_ROOT, 'imf', sanitizeDokId(indicator), `${sanitizeDokId(country)}.meta.json`);
  if (!existsSync(dataPath)) return null;
  try {
    const data = JSON.parse(readFileSync(dataPath, 'utf8'));
    const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : { fetchedAt: 'unknown' };
    return { data, meta };
  } catch {
    return null;
  }
}

/**
 * Check if cached data is stale (> 6 months old).
 * Returns true for invalid/unparseable dates (conservative: treat unknown age as stale).
 */
function isCacheStale(fetchedAt: string): boolean {
  const fetched = new Date(fetchedAt);
  if (Number.isNaN(fetched.getTime())) return true;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return fetched < sixMonthsAgo;
}

/**
 * Build a standardised fallback payload with metadata indicating cache usage.
 */
function buildFallbackPayload(
  cachedData: unknown,
  err: unknown,
  cachedAt: string,
  stale: boolean,
): Record<string, unknown> {
  return {
    ...cachedData as Record<string, unknown>,
    _fallback: true,
    _fallbackReason: err instanceof Error ? err.message : String(err),
    _cachedAt: cachedAt,
    _staleVintage: stale,
    _vintageAnnotation: stale
      ? `>6 month vintage (cached ${cachedAt}); live fetch failed`
      : `cached ${cachedAt}; live fetch failed`,
    transport: 'cache',
  };
}

type ImfCliLogLevel = 'info' | 'warn' | 'error';
type ImfCliFailureClassification = 'transient' | 'permanent';

export interface ImfCliLogEvent {
  readonly timestamp: string;
  readonly level: ImfCliLogLevel;
  readonly command: 'weo';
  readonly event: string;
  readonly country: string;
  readonly indicator: string;
  readonly message: string;
  readonly attempt?: number;
  readonly maxAttempts?: number;
  readonly transport?: 'datamapper' | 'sdmx' | 'direct-datamapper' | 'cache';
  readonly classification?: ImfCliFailureClassification;
}

interface WeoCommandClient {
  readonly datamapperBaseURL: string;
  readonly userAgent: string;
  readonly timeout: number;
  readonly weoVintage: string;
  readonly sdmxSubscriptionKey?: string;
  getWeoIndicator(country: string, indicator: string, years: number): Promise<ImfDataPoint[]>;
  sdmxFetch(pathWithQuery: string): Promise<unknown>;
}

interface FetchWeoPayloadOptions {
  readonly country: string;
  readonly indicator: string;
  readonly years: number;
}

interface FetchWeoPayloadDeps {
  readonly client?: WeoCommandClient;
  readonly fetchFn?: typeof fetch;
  readonly sleepFn?: (ms: number) => Promise<void>;
  readonly logger?: (event: ImfCliLogEvent) => void;
}

function defaultCliLogger(event: ImfCliLogEvent): void {
  process.stderr.write(`${JSON.stringify(event)}\n`);
}

function createCliLogEvent(
  options: FetchWeoPayloadOptions,
  level: ImfCliLogLevel,
  event: string,
  message: string,
  extra: Partial<Omit<ImfCliLogEvent, 'timestamp' | 'level' | 'command' | 'event' | 'message' | 'country' | 'indicator'>> = {},
): ImfCliLogEvent {
  return {
    timestamp: new Date().toISOString(),
    level,
    command: 'weo',
    event,
    country: options.country,
    indicator: options.indicator,
    message,
    ...extra,
  };
}

export function classifyImfFetchError(err: unknown): ImfCliFailureClassification {
  if (err instanceof ImfWeoSdmxOnlyError) return 'permanent';
  if (err instanceof Error && 'code' in err && (err as { code?: unknown }).code === EMPTY_DATAMAPPER_SERIES_CODE) {
    return 'transient';
  }
  if (err instanceof Error && 'retryable' in err && typeof (err as { retryable?: unknown }).retryable === 'boolean') {
    return (err as { retryable: boolean }).retryable ? 'transient' : 'permanent';
  }
  if (err instanceof Error && 'name' in err && err.name === 'AbortError') {
    return 'transient';
  }
  if (err instanceof Error && 'status' in err && typeof (err as { status?: unknown }).status === 'number') {
    const status = (err as { status: number }).status;
    return status === 429 || status >= 500 ? 'transient' : 'permanent';
  }
  const message = err instanceof Error ? err.message : String(err);
  if (
    /timeout|timed out|fetch failed|failed to fetch|network|ecconn|eai_again|empty series/i.test(message)
  ) {
    return 'transient';
  }
  return 'permanent';
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWeoViaDirectDatamapper(
  client: WeoCommandClient,
  country: string,
  indicator: string,
  years: number,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<ImfDataPoint[]> {
  const code = toDatamapperCode(country);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), client.timeout);
  try {
    const response = await fetchFn(`${client.datamapperBaseURL}/${encodeURIComponent(indicator)}/${encodeURIComponent(code)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': client.userAgent,
      },
    });
    if (!response.ok) {
      throw new Error(`Direct IMF Datamapper fallback failed: ${response.status} ${response.statusText}`);
    }
    const raw = await response.json();
    return parseDatamapperValues(raw, indicator, code, client.weoVintage).slice(0, years);
  } finally {
    clearTimeout(timeoutId);
  }
}

function maybePersistWeoPayload(
  payload: Record<string, unknown>,
  flags: ReadonlyMap<string, string>,
  booleans: ReadonlySet<string>,
): void {
  if (!booleans.has('persist')) {
    return;
  }
  const dataPoints = Array.isArray(payload['dataPoints']) ? payload['dataPoints'] as ImfDataPoint[] : [];
  const vintage = dataPoints.find((p) => p.projectionVintage)?.projectionVintage;
  persistIMFData(String(payload['indicator']), String(payload['country']), payload, {
    database: flags.get('database') ?? 'WEO',
    ...(vintage ? { projectionVintage: vintage } : {}),
  });
}

export async function fetchWeoPayload(
  options: FetchWeoPayloadOptions,
  deps: FetchWeoPayloadDeps = {},
): Promise<Record<string, unknown>> {
  const client = deps.client ?? new ImfClient();
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  const sleepFn = deps.sleepFn ?? sleep;
  const logger = deps.logger ?? defaultCliLogger;
  const { country, indicator, years } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= WEO_FETCH_MAX_ATTEMPTS; attempt++) {
    logger(
      createCliLogEvent(
        options,
        'info',
        'weo-fetch-attempt',
        `Fetching IMF WEO indicator via Datamapper (attempt ${attempt}/${WEO_FETCH_MAX_ATTEMPTS})`,
        { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'datamapper' },
      ),
    );
    try {
      const series = await client.getWeoIndicator(country, indicator, years);
      if (IMF_WEO_DATAMAPPER_AVAILABLE.has(indicator) && series.length === 0) {
        const emptyError = new Error(
          `IMF Datamapper returned an empty series for Datamapper-available WEO indicator '${indicator}' (${country})`,
        ) as Error & { code?: string };
        emptyError.code = EMPTY_DATAMAPPER_SERIES_CODE;
        throw emptyError;
      }
      logger(
        createCliLogEvent(
          options,
          'info',
          'weo-fetch-succeeded',
          `Fetched ${series.length} IMF data points via Datamapper`,
          { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'datamapper' },
        ),
      );
      return { indicator, country, years, transport: 'datamapper', dataPoints: series };
    } catch (err: unknown) {
      if (err instanceof ImfWeoSdmxOnlyError && client.sdmxSubscriptionKey) {
        logger(
          createCliLogEvent(
            options,
            'info',
            'weo-routed-to-sdmx',
            `Routing '${indicator}' via SDMX (${err.sdmxPath})`,
            { attempt, maxAttempts: WEO_FETCH_MAX_ATTEMPTS, transport: 'sdmx' },
          ),
        );
        const raw = await client.sdmxFetch(err.sdmxPath);
        return {
          indicator,
          country,
          years,
          transport: 'sdmx',
          sdmxPath: err.sdmxPath,
          sdmxResponse: raw,
        };
      }

      const classification = classifyImfFetchError(err);
      lastError = err;
      logger(
        createCliLogEvent(
          options,
          classification === 'transient' ? 'warn' : 'error',
          'weo-fetch-failed',
          err instanceof Error ? err.message : String(err),
          {
            attempt,
            maxAttempts: WEO_FETCH_MAX_ATTEMPTS,
            transport: 'datamapper',
            classification,
          },
        ),
      );

      if (classification === 'transient' && attempt < WEO_FETCH_MAX_ATTEMPTS) {
        const delay = calculateRetryDelay(attempt - 1);
        logger(
          createCliLogEvent(
            options,
            'info',
            'weo-fetch-retrying',
            `Retrying after ${delay} ms backoff`,
            {
              attempt,
              maxAttempts: WEO_FETCH_MAX_ATTEMPTS,
              transport: 'datamapper',
              classification,
            },
          ),
        );
        await sleepFn(delay);
        continue;
      }

      break;
    }
  }

  if (IMF_WEO_DATAMAPPER_AVAILABLE.has(indicator)) {
    try {
      logger(
        createCliLogEvent(
          options,
          'warn',
          'direct-datamapper-fallback',
          'Retry budget exhausted — attempting direct Datamapper REST fallback',
          { transport: 'direct-datamapper', classification: 'transient' },
        ),
      );
      const series = await fetchWeoViaDirectDatamapper(client, country, indicator, years, fetchFn);
      if (series.length > 0) {
        logger(
          createCliLogEvent(
            options,
            'warn',
            'direct-datamapper-fallback-succeeded',
            `Recovered ${series.length} IMF data points via direct Datamapper REST fallback`,
            { transport: 'direct-datamapper' },
          ),
        );
        return { indicator, country, years, transport: 'direct-datamapper', dataPoints: series };
      }
      throw new Error(
        `Direct IMF Datamapper fallback also returned an empty series for '${indicator}' (${country})`,
      );
    } catch (directErr: unknown) {
      lastError = directErr;
      logger(
        createCliLogEvent(
          options,
          'warn',
          'direct-datamapper-fallback-failed',
          directErr instanceof Error ? directErr.message : String(directErr),
          {
            transport: 'direct-datamapper',
            classification: classifyImfFetchError(directErr),
          },
        ),
      );
    }
  }

  const cached = loadCachedIMFData(indicator, country);
  if (cached) {
    const stale = isCacheStale(cached.meta.fetchedAt);
    logger(
      createCliLogEvent(
        options,
        'warn',
        'weo-cache-fallback',
        `Live fetch failed; falling back to cached IMF data from ${cached.meta.fetchedAt}${stale ? ' (stale >6 months)' : ''}`,
        { transport: 'cache', classification: 'transient' },
      ),
    );
    return buildFallbackPayload(cached.data, lastError, cached.meta.fetchedAt, stale);
  }

  throw lastError ?? new Error(`IMF WEO fetch failed for ${indicator}/${country}`);
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
  readonly command:
    | 'weo'
    | 'compare'
    | 'sdmx'
    | 'list-indicators'
    | 'list-datamapper-indicators'
    | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

const HELP = `tsx scripts/imf-fetch.ts <command> [flags]

Commands:
  weo                          Fetch a WEO time series for one country
                               (auto-routes to SDMX when the requested code is
                               in IMF_WEO_SDMX_ONLY and IMF_SDMX_SUBSCRIPTION_KEY
                               is set)
  compare                      Fetch the latest WEO value across several countries
  sdmx                         Low-level SDMX 3.0 passthrough (IFS / BOP / FM /
                               GFS / DOTS / full WEO 9.0.0)
  list-indicators              Print the built-in WEO + FM indicator catalog
  list-datamapper-indicators   Fetch the live IMF Datamapper indicator catalog
                               (~132 entries, grouped by dataset). Use to discover
                               any indicator addressable without an SDMX
                               subscription key.
  help                         Show this message

Common flags:
  --country <ISO3>         ISO-3 country code (e.g. SWE)
  --countries <ISO3,...>   Comma-separated ISO-3 country codes
  --indicator <CODE>       IMF indicator code (e.g. NGDP_RPCH, PCPIPCH, LUR)
  --years <N>              Number of years (weo, default 10)
  --path <PATH>            SDMX URL path (sdmx)
  --persist                Write the response under analysis/data/imf/
  --database <NAME>        Provenance override (default WEO for weo/compare)
  --dataset <NAME>         Filter list-datamapper-indicators by dataset
                           (e.g. WEO, FM, FPP, IFS, BOP, DOTS, GFS_COFOG)
`;

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = (argv[0] ?? 'help') as ParsedArgs['command'];
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 1; i < argv.length; i++) {
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
  return { command, flags, booleans };
}

function requireFlag(flags: ReadonlyMap<string, string>, key: string): string {
  const v = flags.get(key);
  if (!v) {
    process.stderr.write(`imf-fetch: missing required flag --${key}\n`);
    process.exit(2);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function runWeo(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const country = requireFlag(flags, 'country').toUpperCase();
  const indicator = requireFlag(flags, 'indicator');
  const years = Number.parseInt(flags.get('years') ?? '10', 10);
  if (!Number.isInteger(years) || years < 1) {
    process.stderr.write(`imf-fetch: --years must be a positive integer, got ${flags.get('years')}\n`);
    process.exit(2);
  }

  const payload = await fetchWeoPayload({ country, indicator, years });
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  maybePersistWeoPayload(payload, flags, booleans);
}

async function runCompare(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const countriesRaw = requireFlag(flags, 'countries');
  const indicator = requireFlag(flags, 'indicator');
  const countries = countriesRaw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (countries.length === 0) {
    process.stderr.write('imf-fetch: --countries is empty\n');
    process.exit(2);
  }

  const client = new ImfClient();
  const results = await client.compareCountriesWeo(countries, indicator);

  const byCountry: Record<string, unknown> = {};
  const cacheFilledCountries: string[] = [];
  let staleAny = false;

  for (const code of countries) {
    const livePoint = results.get(code) ?? null;
    if (livePoint !== null) {
      byCountry[code] = livePoint;
    } else {
      const cached = loadCachedIMFData(indicator, code);
      if (cached) {
        const cachedObj = cached.data as Record<string, unknown>;
        const dataPoint = 'dataPoint' in cachedObj ? cachedObj['dataPoint'] : cachedObj;
        const stale = isCacheStale(cached.meta.fetchedAt);
        if (stale) staleAny = true;
        cacheFilledCountries.push(code);
        byCountry[code] = dataPoint;
      } else {
        byCountry[code] = null;
      }
    }
  }

  const payload: Record<string, unknown> = { indicator, countries, results: byCountry };
  if (cacheFilledCountries.length > 0) {
    payload['_cacheFilledCountries'] = cacheFilledCountries;
    payload['_staleVintage'] = staleAny;
    payload['_vintageAnnotation'] = staleAny
      ? `Cache fill used for ${cacheFilledCountries.join(', ')}; some cached data >6 months old`
      : `Cache fill used for ${cacheFilledCountries.join(', ')}; live fetch returned null`;
    process.stderr.write(
      `imf-fetch: cache fill for ${cacheFilledCountries.join(', ')}${staleAny ? ' (some STALE >6mo)' : ''}\n`,
    );
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    for (const [code, point] of results) {
      if (point !== null) {
        persistIMFData(indicator, code, { indicator, country: code, dataPoint: point }, {
          database: flags.get('database') ?? 'WEO',
          ...(point?.projectionVintage ? { projectionVintage: point.projectionVintage } : {}),
        });
      }
    }
  }
}

async function runSdmx(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const pathWithQuery = requireFlag(flags, 'path');
  const client = new ImfClient();
  const raw = await client.sdmxFetch(pathWithQuery);
  process.stdout.write(`${JSON.stringify(raw, null, 2)}\n`);

  if (booleans.has('persist')) {
    const indicator = flags.get('indicator') ?? pathWithQuery.split('/').slice(-2)[0] ?? 'sdmx';
    const country = flags.get('country') ?? 'all';
    persistIMFData(indicator, country, raw, {
      database: flags.get('database') ?? 'SDMX',
    });
  }
}

function runListIndicators(): void {
  process.stdout.write(
    `${JSON.stringify(
      {
        weo: IMF_WEO_INDICATORS,
        fm: IMF_FM_INDICATORS,
        weoDatamapperAvailable: [...IMF_WEO_DATAMAPPER_AVAILABLE].sort(),
        weoSdmxOnly: [...IMF_WEO_SDMX_ONLY].sort(),
        weoSdmxPathExample: weoSdmxPath('SWE', 'GGR_NGDP'),
      },
      null,
      2,
    )}\n`,
  );
}

async function runListDatamapperIndicators(flags: ReadonlyMap<string, string>): Promise<void> {
  const datasetFilter = flags.get('dataset')?.toUpperCase();
  const client = new ImfClient();
  const catalog = await client.listDatamapperIndicators();
  const filtered = datasetFilter
    ? new Map([...catalog].filter(([, meta]) => meta.dataset.toUpperCase() === datasetFilter))
    : catalog;
  const grouped: Record<string, unknown[]> = {};
  for (const meta of filtered.values()) {
    (grouped[meta.dataset] ??= []).push({
      code: meta.code,
      label: meta.label,
      unit: meta.unit,
      ...(meta.lastUpdate ? { lastUpdate: meta.lastUpdate } : {}),
    });
  }
  process.stdout.write(
    `${JSON.stringify(
      { totalIndicators: filtered.size, datasets: Object.keys(grouped).sort(), byDataset: grouped },
      null,
      2,
    )}\n`,
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, flags, booleans } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'weo':
      await runWeo(flags, booleans);
      return;
    case 'compare':
      await runCompare(flags, booleans);
      return;
    case 'sdmx':
      await runSdmx(flags, booleans);
      return;
    case 'list-indicators':
      runListIndicators();
      return;
    case 'list-datamapper-indicators':
      await runListDatamapperIndicators(flags);
      return;
    case 'help':
    default:
      process.stdout.write(HELP);
      return;
  }
}

if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`imf-fetch: ${msg}\n`);
    process.exit(1);
  });
}
