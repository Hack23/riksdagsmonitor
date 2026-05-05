#!/usr/bin/env tsx
/**
 * @module scripts/check-imf-connectivity
 * @description Pre-flight IMF connectivity & vintage gate for agentic news
 *  workflows.
 *
 * Goal
 * ----
 * Detect a missing or stale IMF context **before** Pass 1 of the analysis
 * pipeline starts, rather than discovering it mid-run when an article
 * already has half its economic claims authored as inference. This is the
 * upstream half of the AI-FIRST quality principle (`AGENTS.md`) and the
 * IMF-as-primary canon enforced by `.github/aw/ECONOMIC_DATA_CONTRACT.md`
 * v2.1 and `analysis/imf/agentic-integration.md` §3 "Pre-warm IMF endpoint".
 *
 * What it probes
 * --------------
 * Three light-weight calls that span the three IMF transports the news
 * pipeline depends on:
 *
 *   1. **WEO** (Datamapper) — `NGDP_RPCH` SWE, last 1 year
 *   2. **FM** (Datamapper)  — `GGXWDG_NGDP` SWE, last 1 year
 *   3. **IFS** (SDMX 3.0)    — CPI monthly index probe
 *
 * Each probe must return HTTP 200 and parse as JSON. The WEO probe
 * additionally must yield at least one data point so we know the JSON
 * envelope is the expected shape (defensive against silent IMF schema
 * drift).
 *
 * Vintage discipline
 * ------------------
 * `ImfClient.weoVintage` (default `WEO-2026-04`) is parsed into an age in
 * months. >6 months ⇒ the run continues but every workflow MUST annotate
 * its `economicProvenance` blocks per
 * `.github/aw/ECONOMIC_DATA_CONTRACT.md` §"Vintage discipline".
 *
 * Outputs
 * -------
 * On success this script writes `data/imf-context.json` containing:
 *
 *   - `status`: 'ok' | 'stale-vintage'
 *   - `vintage`: e.g. `WEO-2026-04`
 *   - `vintageAgeMonths`: integer
 *   - `probes`: per-probe latency / status
 *   - `checkedAt`: ISO-8601 UTC timestamp
 *
 * On failure (any of the three probes fails after the client's normal
 * retry budget) this script writes `data/imf-unavailable.flag` containing
 * a short human-readable reason plus a JSON-encoded structured payload.
 * The same payload is also printed to stdout so a CI step can capture it.
 *
 * Exit codes
 * ----------
 *   0 — connectivity OK (regardless of vintage age — vintage drift is
 *       handled by annotation, not by failing the pre-flight)
 *   1 — connectivity failed (the workflow MUST fall back to the
 *       cached-data degradation path documented in
 *       `analysis/imf/agentic-integration.md` §6.1 and inject the
 *       standard `⚠️ IMF context unavailable` block into
 *       `executive-brief.md`, `comparative-international.md` and
 *       `synthesis-summary.md`)
 *   2 — invalid CLI usage
 *
 * The default mode is **non-blocking** (exit 0 on connectivity failure
 * after writing the flag) so the pre-warm composite action does not abort
 * the entire workflow — workflow steps further down read the flag and
 * inject the warning block. Pass `--strict` to flip to fail-fast (exit 1
 * on connectivity failure) for ad-hoc operator debugging.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImfClient } from './imf-client.js';

// ---------------------------------------------------------------------------
// Public types (re-used by tests)
// ---------------------------------------------------------------------------

/** One probe result against a single IMF dataflow / transport. */
export interface ImfProbeResult {
  readonly dataflow: 'WEO' | 'FM' | 'IFS';
  readonly transport: 'datamapper' | 'sdmx';
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly error?: string;
}

/** Aggregate status emitted to `data/imf-context.json` or `imf-unavailable.flag`. */
export interface ImfConnectivityReport {
  readonly status: 'ok' | 'stale-vintage' | 'unavailable';
  readonly vintage: string;
  readonly vintageAgeMonths: number;
  readonly stale: boolean;
  readonly probes: readonly ImfProbeResult[];
  readonly checkedAt: string;
  readonly warningBlock: string;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testability)
// ---------------------------------------------------------------------------

/**
 * Parse a vintage tag like `WEO-2026-04` into a calendar `{year, month}`.
 *
 * Returns `null` if the tag does not match the canonical pattern. The
 * pattern is permissive on the prefix (`WEO`, `FM`, etc.) but strict on
 * the YYYY-MM segment.
 */
export function parseVintage(vintage: string): { year: number; month: number } | null {
  const match = /^[A-Z]+-(\d{4})-(\d{2})$/.exec(vintage);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * Compute the age of a vintage tag in whole months relative to a reference
 * date (defaults to "now").
 *
 * Returns `Number.POSITIVE_INFINITY` when the vintage tag is malformed —
 * the caller treats unknown vintages as definitely-stale rather than
 * silently optimistic.
 */
export function vintageAgeMonths(vintage: string, now: Date = new Date()): number {
  const parsed = parseVintage(vintage);
  if (!parsed) return Number.POSITIVE_INFINITY;
  const refMonths = now.getUTCFullYear() * 12 + (now.getUTCMonth() + 1);
  const vintageMonths = parsed.year * 12 + parsed.month;
  // Future-dated vintages clamp to 0 (e.g. an October release viewed in
  // August counts as fresh, not negative).
  return Math.max(0, refMonths - vintageMonths);
}

/**
 * Render the standard `⚠️ IMF context unavailable` markdown block that
 * agentic workflows must inject into `executive-brief.md`,
 * `comparative-international.md`, and `synthesis-summary.md` when the
 * pre-flight detected an IMF outage. Mirrors the wording in
 * `analysis/imf/agentic-integration.md` §6.1.
 */
export function formatUnavailableWarning(report: Pick<ImfConnectivityReport, 'probes' | 'checkedAt'>): string {
  const failed = report.probes.filter((p) => !p.ok);
  const failedSummary = failed.length > 0
    ? failed.map((p) => `${p.dataflow} (${p.transport}): ${p.error ?? 'unknown'}`).join('; ')
    : 'no probe details available';
  return [
    '> ⚠️ **IMF context unavailable**',
    '>',
    '> The IMF pre-flight check at ' + report.checkedAt + ' could not reach the IMF',
    '> Datamapper or SDMX 3.0 endpoints. Economic claims in this article are',
    '> grounded in the most recent cached IMF release where available; figures',
    '> labelled "inferred" use SCB ground-truth or Riksbank minutes as the',
    '> fallback source per `analysis/imf/agentic-integration.md` §6.1.',
    '>',
    '> Failed probes: ' + failedSummary + '.',
    '>',
    '> This annotation is required by `.github/aw/ECONOMIC_DATA_CONTRACT.md`',
    '> v2.1 §"Vintage discipline" and the AI-FIRST quality principle in',
    '> `AGENTS.md`.',
  ].join('\n');
}

/**
 * Render the lighter "vintage stale" annotation used when connectivity is
 * fine but the WEO release is more than `STALE_VINTAGE_MAX_MONTHS` old.
 *
 * `vintageAgeMonths === -1` is the sentinel `buildReport()` uses for
 * malformed vintage tags — render it as "unknown age" rather than the
 * confusing literal "-1 months old".
 */
export function formatStaleVintageAnnotation(report: Pick<ImfConnectivityReport, 'vintage' | 'vintageAgeMonths'>): string {
  const ageDescription = report.vintageAgeMonths < 0
    ? 'of unknown age (invalid vintage tag)'
    : 'is ' + String(report.vintageAgeMonths) + ' months old';
  return [
    '> ℹ️ **IMF vintage older than ' + String(STALE_VINTAGE_MAX_MONTHS) + ' months**',
    '>',
    '> Active IMF WEO vintage `' + report.vintage + '` ' + ageDescription + '.',
    '> Per `.github/aw/ECONOMIC_DATA_CONTRACT.md` v2.1 every',
    '> `economicProvenance` block in this article MUST carry the explicit',
    '> vintage tag and an annotation noting the staleness.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Probes
// ---------------------------------------------------------------------------

/**
 * Hard upper bound for a single probe (independent of the client's own
 * timeout + retry budget). Enforced by {@link withTimeout} so a hung IMF
 * endpoint cannot push the composite action past its 60-second wall-clock
 * deadline before `imf-context.json` / `imf-unavailable.flag` are written.
 *
 * Three sequential probes × 20 s = 60 s worst case, matching the action's
 * `timeout 60` envelope.
 */
export const PROBE_TIMEOUT_MS = 20_000;

/** Maximum WEO vintage age (in months) before the article must annotate. */
export const STALE_VINTAGE_MAX_MONTHS = 6;

/** Successful probe outcome. */
type ProbeOk<T> = { readonly ok: true; readonly value: T };

/** Failed probe outcome (network error or hard timeout). */
type ProbeErr = { readonly ok: false; readonly error: Error };

/** Tagged union returned by {@link withTimeout}. */
type ProbeResult<T> = ProbeOk<T> | ProbeErr;

/** Type predicate: is the probe result a failure? */
function isProbeErr(result: ProbeResult<unknown>): result is ProbeErr {
  return result.ok === false;
}

/**
 * Race a promise against a hard timeout. Resolves to `{ ok: true, value }`
 * on success, `{ ok: false, error }` on rejection or timeout. Never throws.
 *
 * Note: this does NOT cancel the underlying work. `ImfClient.fetchWithRetry`
 * already enforces its own per-request `AbortController`, so the orphaned
 * promise can finish in the background without blocking the caller.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<ProbeResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutError = new Error('probe timeout after ' + String(timeoutMs) + 'ms');
  try {
    const value = await Promise.race<T>([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(timeoutError), timeoutMs);
      }),
    ]);
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Run the three IMF connectivity probes. Each probe is best-effort and its
 * own failure (network error, hard timeout, or empty/malformed response)
 * is captured into the returned array — callers decide whether "any
 * failure" or "all failed" is the trigger.
 *
 * Each probe is wrapped in {@link withTimeout} with `PROBE_TIMEOUT_MS` so
 * a single hung IMF endpoint cannot starve the composite action's 60-second
 * envelope. Tests inject a stub `ImfClient` so we never hit the real API.
 */
export async function runProbes(client: ImfClient): Promise<ImfProbeResult[]> {
  const probes: ImfProbeResult[] = [];

  // Probe 1: WEO via Datamapper
  {
    const start = Date.now();
    const result = await withTimeout(
      client.getWeoIndicator('SWE', 'NGDP_RPCH', 1),
      PROBE_TIMEOUT_MS,
    );
    if (isProbeErr(result)) {
      probes.push({
        dataflow: 'WEO',
        transport: 'datamapper',
        ok: false,
        latencyMs: Date.now() - start,
        error: result.error.message,
      });
    } else {
      const series = result.value;
      probes.push({
        dataflow: 'WEO',
        transport: 'datamapper',
        ok: series.length > 0,
        latencyMs: Date.now() - start,
        ...(series.length === 0 ? { error: 'empty-series' } : {}),
      });
    }
  }

  // Probe 2: FM via Datamapper (GGXWDG_NGDP = gross government debt % GDP)
  {
    const start = Date.now();
    const result = await withTimeout(
      client.getWeoIndicator('SWE', 'GGXWDG_NGDP', 1),
      PROBE_TIMEOUT_MS,
    );
    if (isProbeErr(result)) {
      probes.push({
        dataflow: 'FM',
        transport: 'datamapper',
        ok: false,
        latencyMs: Date.now() - start,
        error: result.error.message,
      });
    } else {
      const series = result.value;
      probes.push({
        dataflow: 'FM',
        transport: 'datamapper',
        ok: series.length > 0,
        latencyMs: Date.now() - start,
        ...(series.length === 0 ? { error: 'empty-series' } : {}),
      });
    }
  }

  // Probe 3: SDMX 3.0 connectivity check
  // Primary: attempt CPI data endpoint (IMF.STA,CPI,5.0.0).
  // Fallback: if data endpoint returns 404 (known IMF infrastructure issue
  // since ~2026-05), verify SDMX connectivity via structure/dataflow which
  // remains operational. This ensures we distinguish "SDMX is reachable but
  // data endpoint is broken" from "SDMX is fully unreachable".
  {
    const start = Date.now();
    const result = await withTimeout(
      client.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX?startPeriod=2024-01'),
      PROBE_TIMEOUT_MS,
    );
    if (isProbeErr(result)) {
      // Data endpoint failed — try structure/dataflow as connectivity fallback
      const structureResult = await withTimeout(
        client.sdmxFetch('/structure/dataflow?detail=allstubs'),
        PROBE_TIMEOUT_MS,
      );
      if (isProbeErr(structureResult)) {
        // Both failed — SDMX is truly unreachable
        probes.push({
          dataflow: 'IFS',
          transport: 'sdmx',
          ok: false,
          latencyMs: Date.now() - start,
          error: result.error.message,
        });
      } else {
        // Structure endpoint works but data doesn't — SDMX reachable, data broken
        const raw = structureResult.value;
        const ok = raw !== null && typeof raw === 'object';
        probes.push({
          dataflow: 'IFS',
          transport: 'sdmx',
          ok,
          latencyMs: Date.now() - start,
          ...(ok ? {} : { error: 'non-object-response' }),
        });
      }
    } else {
      const raw = result.value;
      const ok = raw !== null && typeof raw === 'object';
      probes.push({
        dataflow: 'IFS',
        transport: 'sdmx',
        ok,
        latencyMs: Date.now() - start,
        ...(ok ? {} : { error: 'non-object-response' }),
      });
    }
  }

  return probes;
}

/**
 * Build a connectivity report from a set of probe results + the active
 * WEO vintage tag. Pure function; safe to use in tests.
 */
export function buildReport(
  probes: readonly ImfProbeResult[],
  vintage: string,
  now: Date = new Date(),
): ImfConnectivityReport {
  const ageMonths = vintageAgeMonths(vintage, now);
  const stale = ageMonths > STALE_VINTAGE_MAX_MONTHS;
  // We require *all three* probes to succeed for the run to count as
  // "ok". Even one transport failure means the article's economic claims
  // are at risk of being inference-only — exactly the failure mode the
  // 2026-04-26 reflections called out.
  const allOk = probes.length > 0 && probes.every((p) => p.ok);
  const status: ImfConnectivityReport['status'] = !allOk
    ? 'unavailable'
    : stale
      ? 'stale-vintage'
      : 'ok';
  const checkedAt = now.toISOString();
  const baseReport = {
    status,
    vintage,
    vintageAgeMonths: Number.isFinite(ageMonths) ? ageMonths : -1,
    stale,
    probes,
    checkedAt,
  } as const;
  const warningBlock = !allOk
    ? formatUnavailableWarning({ probes, checkedAt })
    : stale
      ? formatStaleVintageAnnotation({ vintage, vintageAgeMonths: baseReport.vintageAgeMonths })
      : '';
  return { ...baseReport, warningBlock };
}

// ---------------------------------------------------------------------------
// Output writers
// ---------------------------------------------------------------------------

interface WriteOptions {
  readonly outputDir: string;
}

/** Persist the report. On `unavailable` writes the flag file too. */
export function writeReport(report: ImfConnectivityReport, opts: WriteOptions): void {
  mkdirSync(opts.outputDir, { recursive: true });
  const contextPath = join(opts.outputDir, 'imf-context.json');
  writeFileSync(contextPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const flagPath = join(opts.outputDir, 'imf-unavailable.flag');
  if (report.status === 'unavailable') {
    const failed = report.probes.filter((p) => !p.ok).map((p) => p.dataflow).join(',');
    const flagBody = [
      '# IMF connectivity pre-flight failed',
      '# checkedAt: ' + report.checkedAt,
      '# failed-probes: ' + (failed || 'unknown'),
      '#',
      '# Workflows reading this flag MUST inject the standard',
      '# "⚠️ IMF context unavailable" block into executive-brief.md,',
      '# comparative-international.md, and synthesis-summary.md per',
      '# analysis/imf/agentic-integration.md §6.1.',
      JSON.stringify(report),
      '',
    ].join('\n');
    writeFileSync(flagPath, flagBody, 'utf8');
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

interface CliOptions {
  readonly strict: boolean;
  readonly outputDir: string;
  readonly help: boolean;
}

const HELP = `tsx scripts/check-imf-connectivity.ts [flags]

Pre-flight IMF connectivity & vintage gate. Probes WEO, FM, and IFS and
writes data/imf-context.json (always) plus data/imf-unavailable.flag (on
failure) for downstream analysis steps to read.

Flags:
  --strict             Exit 1 on any probe failure (default: exit 0 and
                       rely on the flag file for graceful degradation).
  --output-dir <path>  Where to write imf-context.json /
                       imf-unavailable.flag. Default: ./data
  --help               Show this message.

Exit codes:
  0  connectivity ok (or non-strict mode with flag file written)
  1  connectivity failed in --strict mode
  2  invalid CLI arguments
`;

export function parseCliArgs(argv: readonly string[]): CliOptions {
  let strict = false;
  let outputDir = 'data';
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--strict') {
      strict = true;
    } else if (token === '--help' || token === '-h') {
      help = true;
    } else if (token === '--output-dir') {
      const next = argv[i + 1];
      if (!next) {
        process.stderr.write('check-imf-connectivity: --output-dir requires a value\n');
        process.exit(2);
      }
      outputDir = next;
      i++;
    } else if (token.startsWith('--output-dir=')) {
      outputDir = token.slice('--output-dir='.length);
    } else {
      process.stderr.write('check-imf-connectivity: unknown flag ' + token + '\n');
      process.exit(2);
    }
  }
  return { strict, outputDir, help };
}

async function mainCli(): Promise<void> {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }

  const client = new ImfClient();
  const probes = await runProbes(client);
  const report = buildReport(probes, client.weoVintage);

  writeReport(report, { outputDir: opts.outputDir });

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');

  if (report.status === 'unavailable') {
    process.stderr.write(
      '⚠️ IMF connectivity pre-flight failed — wrote ' +
        join(opts.outputDir, 'imf-unavailable.flag') +
        ' for downstream graceful degradation.\n',
    );
    if (opts.strict) {
      process.exit(1);
    }
    return;
  }

  if (report.status === 'stale-vintage') {
    process.stderr.write(
      'ℹ️ IMF vintage ' +
        report.vintage +
        ' is ' +
        String(report.vintageAgeMonths) +
        ' months old (>' +
        String(STALE_VINTAGE_MAX_MONTHS) +
        '). economicProvenance blocks must annotate per ECONOMIC_DATA_CONTRACT.md v2.1.\n',
    );
  }
}

// Only run the CLI when this file is executed directly (and not imported
// by the Vitest test runner).
const isDirectInvocation = (() => {
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  // tsx rewrites argv[1] to the .ts file path; compare by basename.
  const entry = process.argv[1];
  return entry.endsWith('check-imf-connectivity.ts') || entry.endsWith('check-imf-connectivity.js');
})();

if (isDirectInvocation) {
  mainCli().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write('check-imf-connectivity: ' + msg + '\n');
    process.exit(1);
  });
}
