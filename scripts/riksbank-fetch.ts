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
/** Hard cap on HTML/text body size before truncation. Prevents pathological
 *  HTML pages from exhausting memory while still allowing a generous slice. */
const TEXT_RESPONSE_MAX_BYTES = 2 * 1024 * 1024;
/** Hard cap on PDF size accepted from Riksbank. Matches a generous monetary-policy
 *  report size (~5 MB) without allowing pathological responses to exhaust memory. */
const PDF_MAX_BYTES = 5 * 1024 * 1024;
/** Maximum number of redirects to follow manually while re-validating each host. */
const MAX_REDIRECTS = 3;

async function safeCancel(target: ReadableStreamDefaultReader<Uint8Array> | ReadableStream<Uint8Array> | null | undefined): Promise<void> {
  if (!target) return;
  try { await target.cancel(); } catch { /* ignore cancel errors */ }
}

async function safeReleaseLock(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  try { reader.releaseLock(); } catch { /* ignore release errors */ }
}

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

function parseContentLength(header: string | null): number | undefined {
  if (!header) return undefined;
  const value = Number.parseInt(header, 10);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Read a `ReadableStream<Uint8Array>` body with a hard byte cap. The returned
 *  `bytes` holds the data read so far; `exceeded === true` means the cap was
 *  hit and `bytes` should not be consumed. */
async function readBodyWithCap(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<{ exceeded: boolean; bytes: Uint8Array; bytesRead: number }> {
  if (!body) return { exceeded: false, bytes: new Uint8Array(0), bytesRead: 0 };
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let exceeded = false;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        exceeded = true;
        await safeCancel(reader);
        break;
      }
      chunks.push(value);
    }
  } finally {
    await safeReleaseLock(reader);
  }
  if (exceeded) {
    return { exceeded: true, bytes: new Uint8Array(0), bytesRead: total };
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { exceeded: false, bytes: out, bytesRead: total };
}

/** Perform a single fetch with manual-redirect handling against the Riksbank
 *  host allowlist. Returns the final 2xx Response or throws. */
async function fetchWithManualRedirects(
  target: URL,
  signal: AbortSignal,
): Promise<{ response: Response; finalUrl: URL }> {
  let current = target;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, {
      headers: { Accept: 'application/json, text/html, application/pdf;q=0.8, text/plain;q=0.7' },
      signal,
      redirect: 'manual',
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`Riksbank redirect ${response.status} without Location header`);
      }
      await safeCancel(response.body);
      const next = new URL(location, current);
      assertRiksbankFetchTarget(next.toString());
      current = next;
      continue;
    }
    return { response, finalUrl: current };
  }
  throw new Error(`Riksbank fetch exceeded ${MAX_REDIRECTS} redirects`);
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

  try {
    let response: Response;
    let finalUrl: URL;
    try {
      ({ response, finalUrl } = await fetchWithManualRedirects(target, controller.signal));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return buildOutagePayload(
        kind,
        target.toString(),
        'application/octet-stream',
        `Riksbank fetch failed (${detail}); callers should fall back to cached analysis/data/riksbank/ artifacts.`,
      );
    }

    const finalUrlStr = finalUrl.toString();

    if (!response.ok) {
      await safeCancel(response.body);
      return buildOutagePayload(
        kind,
        finalUrlStr,
        response.headers.get('content-type') ?? 'application/octet-stream',
        `Riksbank fetch returned HTTP ${response.status} ${response.statusText}; callers should fall back to cached analysis/data/riksbank/ artifacts.`,
      );
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
    const contentLength = parseContentLength(response.headers.get('content-length'));
    const retrievedAt = new Date().toISOString();

    if (contentType.includes('json')) {
      if (contentLength !== undefined && contentLength > TEXT_RESPONSE_MAX_BYTES) {
        await safeCancel(response.body);
        return buildOutagePayload(
          kind,
          finalUrlStr,
          contentType,
          `Riksbank JSON Content-Length ${contentLength} exceeds cap ${TEXT_RESPONSE_MAX_BYTES}; persisted as no-data.`,
        );
      }
      const capped = await readBodyWithCap(response.body, TEXT_RESPONSE_MAX_BYTES);
      if (capped.exceeded) {
        return buildOutagePayload(
          kind,
          finalUrlStr,
          contentType,
          `Riksbank JSON body exceeded ${TEXT_RESPONSE_MAX_BYTES} bytes (read ${capped.bytesRead}); persisted as no-data.`,
        );
      }
      const jsonBytes = capped.bytes;
      let json: unknown;
      try {
        json = JSON.parse(new TextDecoder('utf-8').decode(jsonBytes));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return buildOutagePayload(kind, finalUrlStr, contentType, `Riksbank JSON parse failed (${detail}).`);
      }
      return {
        provider: 'riksbank',
        kind,
        url: finalUrlStr,
        contentType,
        retrievedAt,
        status: 'ok',
        json,
        economicProvenance: buildProvenance(kind, finalUrlStr, retrievedAt),
      };
    }

    if (contentType.includes('pdf')) {
      if (contentLength !== undefined && contentLength > PDF_MAX_BYTES) {
        await safeCancel(response.body);
        return buildOutagePayload(
          kind,
          finalUrlStr,
          contentType,
          `Riksbank PDF Content-Length ${contentLength} exceeds cap ${PDF_MAX_BYTES}; persisted as no-data.`,
        );
      }
      const capped = await readBodyWithCap(response.body, PDF_MAX_BYTES);
      if (capped.exceeded) {
        return buildOutagePayload(
          kind,
          finalUrlStr,
          contentType,
          `Riksbank PDF body exceeded ${PDF_MAX_BYTES} bytes (read ${capped.bytesRead}); persisted as no-data.`,
        );
      }
      const pdfBytesRaw = capped.bytes;
      const pdfBase64 = Buffer.from(pdfBytesRaw).toString('base64');
      return {
        provider: 'riksbank',
        kind,
        url: finalUrlStr,
        contentType,
        retrievedAt,
        status: 'ok',
        pdfBase64,
        pdfBytes: pdfBytesRaw.byteLength,
        economicProvenance: buildProvenance(kind, finalUrlStr, retrievedAt),
      };
    }

    if (contentLength !== undefined && contentLength > TEXT_RESPONSE_MAX_BYTES) {
      await safeCancel(response.body);
      return buildOutagePayload(
        kind,
        finalUrlStr,
        contentType,
        `Riksbank text Content-Length ${contentLength} exceeds cap ${TEXT_RESPONSE_MAX_BYTES}; persisted as no-data.`,
      );
    }
    const capped = await readBodyWithCap(response.body, TEXT_RESPONSE_MAX_BYTES);
    if (capped.exceeded) {
      return buildOutagePayload(
        kind,
        finalUrlStr,
        contentType,
        `Riksbank text body exceeded ${TEXT_RESPONSE_MAX_BYTES} bytes (read ${capped.bytesRead}); persisted as no-data.`,
      );
    }
    const textBytes = capped.bytes;
    const text = new TextDecoder('utf-8').decode(textBytes);
    const title = extractTitle(text);
    return {
      provider: 'riksbank',
      kind,
      url: finalUrlStr,
      contentType,
      retrievedAt,
      status: 'ok',
      ...(title ? { title } : {}),
      text: text.slice(0, TEXT_MAX_BYTES),
      economicProvenance: buildProvenance(kind, finalUrlStr, retrievedAt),
    };
  } finally {
    clearTimeout(timeoutId);
  }
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

function requireRiksbankFlag(
  flags: ReadonlyMap<string, string>,
  name: string,
): string {
  const value = flags.get(name)?.trim();
  if (!value) throw new Error(`missing required flag --${name}`);
  return value;
}

async function main(): Promise<void> {
  const { command, flags, booleans } = parseRiksbankArgs(process.argv.slice(2));
  if (command === 'help') {
    process.stdout.write(HELP);
    return;
  }
  const kind =
    command === 'fetch' ? parseRiksbankKind(requireRiksbankFlag(flags, 'kind')) : command;
  const urlFlag = flags.get('url')?.trim();
  const url = urlFlag && urlFlag.length > 0 ? urlFlag : DEFAULT_URLS[kind];
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
