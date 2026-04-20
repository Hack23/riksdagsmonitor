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
 *   tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2024-01" [--persist]
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

import { ImfClient, IMF_WEO_INDICATORS, IMF_FM_INDICATORS } from './imf-client.ts';
import { persistIMFData } from './parliamentary-data/data-persistence.ts';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
  readonly command: 'weo' | 'compare' | 'sdmx' | 'list-indicators' | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

const HELP = `tsx scripts/imf-fetch.ts <command> [flags]

Commands:
  weo              Fetch a WEO time series for one country
  compare          Fetch the latest WEO value across several countries
  sdmx             Low-level SDMX 3.0 passthrough (IFS / BOP / FM / GFS / DOTS)
  list-indicators  Print the built-in WEO + FM indicator catalog
  help             Show this message

Common flags:
  --country <ISO3>         ISO-3 country code (e.g. SWE)
  --countries <ISO3,...>   Comma-separated ISO-3 country codes
  --indicator <CODE>       IMF indicator code (e.g. NGDP_RPCH, PCPIPCH, LUR)
  --years <N>              Number of years (weo, default 10)
  --path <PATH>            SDMX URL path (sdmx)
  --persist                Write the response under analysis/data/imf/
  --database <NAME>        Provenance override (default WEO for weo/compare)
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

function require_(flags: ReadonlyMap<string, string>, key: string): string {
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
  const country = require_(flags, 'country').toUpperCase();
  const indicator = require_(flags, 'indicator');
  const years = Number.parseInt(flags.get('years') ?? '10', 10);
  if (!Number.isInteger(years) || years < 1) {
    process.stderr.write(`imf-fetch: --years must be a positive integer, got ${flags.get('years')}\n`);
    process.exit(2);
  }

  const client = new ImfClient();
  const series = await client.getWeoIndicator(country, indicator, years);
  const payload = { indicator, country, years, dataPoints: series };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    const vintage = series.find((p) => p.projectionVintage)?.projectionVintage;
    persistIMFData(indicator, country, payload, {
      database: flags.get('database') ?? 'WEO',
      ...(vintage ? { projectionVintage: vintage } : {}),
    });
  }
}

async function runCompare(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const countriesRaw = require_(flags, 'countries');
  const indicator = require_(flags, 'indicator');
  const countries = countriesRaw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (countries.length === 0) {
    process.stderr.write('imf-fetch: --countries is empty\n');
    process.exit(2);
  }

  const client = new ImfClient();
  const results = await client.compareCountriesWeo(countries, indicator);
  const byCountry: Record<string, unknown> = {};
  results.forEach((point, code) => {
    byCountry[code] = point;
  });
  const payload = { indicator, countries, results: byCountry };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);

  if (booleans.has('persist')) {
    for (const [code, point] of results) {
      persistIMFData(indicator, code, { indicator, country: code, dataPoint: point }, {
        database: flags.get('database') ?? 'WEO',
        ...(point?.projectionVintage ? { projectionVintage: point.projectionVintage } : {}),
      });
    }
  }
}

async function runSdmx(flags: ReadonlyMap<string, string>, booleans: ReadonlySet<string>): Promise<void> {
  const pathWithQuery = require_(flags, 'path');
  const client = new ImfClient();
  const raw = await client.sdmxFetch(pathWithQuery);
  process.stdout.write(`${JSON.stringify(raw, null, 2)}\n`);

  if (booleans.has('persist')) {
    // Derive a reasonable cache key from --indicator / --country when given;
    // otherwise fall back to hashing the SDMX path so caches collide cleanly
    // on re-runs with identical queries.
    const indicator = flags.get('indicator') ?? pathWithQuery.split('/').slice(-2)[0] ?? 'sdmx';
    const country = flags.get('country') ?? 'all';
    persistIMFData(indicator, country, raw, {
      database: flags.get('database') ?? 'SDMX',
    });
  }
}

function runListIndicators(): void {
  process.stdout.write(`${JSON.stringify({ weo: IMF_WEO_INDICATORS, fm: IMF_FM_INDICATORS }, null, 2)}\n`);
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
    case 'help':
    default:
      process.stdout.write(HELP);
      return;
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`imf-fetch: ${msg}\n`);
  process.exit(1);
});
