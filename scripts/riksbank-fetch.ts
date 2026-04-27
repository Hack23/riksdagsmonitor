#!/usr/bin/env tsx
/**
 * @module scripts/riksbank-fetch
 * @description Fetches public Riksbank web/JSON artifacts for Swedish
 * monetary-policy and fuel-price transmission context.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { persistRiksbankData } from './parliamentary-data/data-persistence.js';

export type RiksbankArtifactKind = 'repo-rate-path' | 'minutes' | 'fuel-price-context';

export interface RiksbankEconomicProvenance {
  readonly provider: 'riksbank';
  readonly dataflow: 'riksbank-web';
  readonly indicator: RiksbankArtifactKind;
  readonly url: string;
  readonly retrieved_at: string;
}

export interface RiksbankFetchPayload {
  readonly provider: 'riksbank';
  readonly kind: RiksbankArtifactKind;
  readonly url: string;
  readonly contentType: string;
  readonly retrievedAt: string;
  readonly status: 'ok' | 'no-data';
  readonly warning?: string;
  readonly title?: string;
  readonly json?: unknown;
  readonly text?: string;
  /** Base64-encoded payload for binary responses (e.g. PDF). Capped at PDF_MAX_BYTES. */
  readonly pdfBase64?: string;
  /** Byte length of the binary payload before base64 encoding. */
  readonly pdfBytes?: number;
  readonly economicProvenance: RiksbankEconomicProvenance;
}

interface ParsedArgs {
  readonly command: 'repo-rate-path' | 'minutes' | 'fuel-price-context' | 'fetch' | 'help';
  readonly flags: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

const DEFAULT_URLS: Readonly<Record<RiksbankArtifactKind, string>> = Object.freeze({
  'repo-rate-path': 'https://www.riksbank.se/en-gb/monetary-policy/the-policy-rate/',
  minutes: 'https://www.riksbank.se/en-gb/monetary-policy/monetary-policy-minutes/',
  'fuel-price-context': 'https://www.riksbank.se/en-gb/monetary-policy/monetary-policy-reports/',
});

const HELP = `tsx scripts/riksbank-fetch.ts <command> [flags]

Commands:
  repo-rate-path      Fetch the policy-rate path source page unless --url overrides it
  minutes             Fetch monetary-policy minutes source page/PDF/JSON
  fuel-price-context  Fetch monetary-policy report context for fuel/energy assumptions
  fetch               Fetch a custom --kind and --url pair from www.riksbank.se
  help                Show this message

Flags:
  --url <URL>      Riksbank HTTPS URL (host must be www.riksbank.se or riksbank.se)
  --kind <KIND>    repo-rate-path | minutes | fuel-price-context (fetch command)
  --persist        Write output under analysis/data/riksbank/
`;

export function parseRiksbankArgs(argv: readonly string[]): ParsedArgs {
  const command = (argv[0] ?? 'help') as ParsedArgs['command'];
  const validCommands: readonly ParsedArgs['command'][] = [
    'repo-rate-path', 'minutes', 'fuel-price-context', 'fetch', 'help',
  ];
  if (!validCommands.includes(command)) throw new Error(`unknown command ${command}`);
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) throw new Error(`unexpected positional argument ${token}`);
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

export function parseRiksbankKind(value: string): RiksbankArtifactKind {
  if (value === 'repo-rate-path' || value === 'minutes' || value === 'fuel-price-context') return value;
  throw new Error(`unknown Riksbank artifact kind ${value}`);
}

export function assertRiksbankFetchTarget(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`invalid Riksbank URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error('Riksbank fetch URL must use HTTPS');
  if (parsed.hostname !== 'www.riksbank.se' && parsed.hostname !== 'riksbank.se') {
    throw new Error(`Riksbank host ${parsed.hostname} is not in allowlist`);
  }
  return parsed;
}

function extractTitle(text: string): string | undefined {
  const title = /<title[^>]*>(.*?)<\/title>/is.exec(text)?.[1]
    ?.replace(/\s+/g, ' ')
    .trim();
  return title && title.length > 0 ? title : undefined;
}

const DEFAULT_RIKSBANK_TIMEOUT_MS = 15_000;
const TEXT_MAX_BYTES = 20_000;
/** Hard cap on PDF size accepted from Riksbank. Matches a generous monetary-policy
 *  report size (~5 MB) without allowing pathological responses to exhaust memory. */
const PDF_MAX_BYTES = 5 * 1024 * 1024;

function buildProvenance(kind: RiksbankArtifactKind, url: string, retrievedAt: string): RiksbankEconomicProvenance {
  return {
    provider: 'riksbank',
    dataflow: 'riksbank-web',
    indicator: kind,
    url,
    retrieved_at: retrievedAt,
  };
}

function buildOutagePayload(
  kind: RiksbankArtifactKind,
  url: string,
  contentType: string,
  warning: string,
): RiksbankFetchPayload {
  const retrievedAt = new Date().toISOString();
  return {
    provider: 'riksbank',
    kind,
    url,
    contentType,
    retrievedAt,
    status: 'no-data',
    warning,
    economicProvenance: buildProvenance(kind, url, retrievedAt),
  };
}

export async function fetchRiksbankPayload(
  kind: RiksbankArtifactKind,
  url: string,
  options: { timeoutMs?: number } = {},
): Promise<RiksbankFetchPayload> {
  const target = assertRiksbankFetchTarget(url);
  const timeoutMs = options.timeoutMs ?? DEFAULT_RIKSBANK_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(target, {
      headers: { Accept: 'application/json, text/html, application/pdf;q=0.8, text/plain;q=0.7' },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const detail = error instanceof Error ? error.message : String(error);
    return buildOutagePayload(
      kind,
      target.toString(),
      'application/octet-stream',
      `Riksbank fetch failed (${detail}); callers should fall back to cached analysis/data/riksbank/ artifacts.`,
    );
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    return buildOutagePayload(
      kind,
      target.toString(),
      response.headers.get('content-type') ?? 'application/octet-stream',
      `Riksbank fetch returned HTTP ${response.status} ${response.statusText}; callers should fall back to cached analysis/data/riksbank/ artifacts.`,
    );
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const retrievedAt = new Date().toISOString();

  if (contentType.includes('json')) {
    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return buildOutagePayload(kind, target.toString(), contentType, `Riksbank JSON parse failed (${detail}).`);
    }
    return {
      provider: 'riksbank',
      kind,
      url: target.toString(),
      contentType,
      retrievedAt,
      status: 'ok',
      json,
      economicProvenance: buildProvenance(kind, target.toString(), retrievedAt),
    };
  }

  if (contentType.includes('pdf')) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > PDF_MAX_BYTES) {
      return buildOutagePayload(
        kind,
        target.toString(),
        contentType,
        `Riksbank PDF response exceeded ${PDF_MAX_BYTES} bytes (received ${buffer.byteLength}); persisted as no-data.`,
      );
    }
    const pdfBase64 = Buffer.from(buffer).toString('base64');
    return {
      provider: 'riksbank',
      kind,
      url: target.toString(),
      contentType,
      retrievedAt,
      status: 'ok',
      pdfBase64,
      pdfBytes: buffer.byteLength,
      economicProvenance: buildProvenance(kind, target.toString(), retrievedAt),
    };
  }

  const text = await response.text();
  const title = extractTitle(text);
  return {
    provider: 'riksbank',
    kind,
    url: target.toString(),
    contentType,
    retrievedAt,
    status: 'ok',
    ...(title ? { title } : {}),
    text: text.slice(0, TEXT_MAX_BYTES),
    economicProvenance: buildProvenance(kind, target.toString(), retrievedAt),
  };
}

async function runKind(
  kind: RiksbankArtifactKind,
  url: string,
  booleans: ReadonlySet<string>,
): Promise<void> {
  const payload = await fetchRiksbankPayload(kind, url);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (booleans.has('persist')) persistRiksbankData(kind, payload);
}

async function main(): Promise<void> {
  const { command, flags, booleans } = parseRiksbankArgs(process.argv.slice(2));
  if (command === 'help') {
    process.stdout.write(HELP);
    return;
  }
  const kind = command === 'fetch' ? parseRiksbankKind(flags.get('kind') ?? '') : command;
  const url = flags.get('url') ?? DEFAULT_URLS[kind];
  await runKind(kind, url, booleans);
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectExecution()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`riksbank-fetch: ${message}\n`);
    process.exit(/^(missing|unknown|unexpected|invalid|Riksbank fetch URL)/i.test(message) ? 2 : 1);
  });
}
