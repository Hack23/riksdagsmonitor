/**
 * @module mcp-client/transport
 * @description HTTP transport layer for JSON-RPC 2.0 communication.
 * Tries `globalThis.fetch` first (allows test mocking), then falls
 * back to Node.js `http`/`https` request when Cloudflare blocks undici/fetch.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { URL } from 'url';

/** Minimal fetch-like response interface for transport abstraction */
export interface FetchLike {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<unknown>;
}

/**
 * Low-level HTTP/HTTPS POST using Node.js built-in `http`/`https` modules.
 * Used as fallback when `globalThis.fetch` is unavailable or blocked.
 * Automatically selects `http.request` or `https.request` based on the URL protocol.
 */
export function nodeHttpsPost(
  url: string,
  headers: Record<string, string>,
  body: string,
  signal: AbortSignal,
): Promise<FetchLike> {
  return new Promise<FetchLike>((resolve, reject) => {
    const parsed = new URL(url);
    const isHttp = parsed.protocol === 'http:';
    const requestFn = isHttp ? httpRequest : httpsRequest;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttp ? 80 : 443),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = requestFn(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          headers: {
            get(name: string): string | null {
              const val = res.headers[name.toLowerCase()];
              return typeof val === 'string' ? val : val?.[0] ?? null;
            },
          },
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data) as unknown),
        });
      });
    });

    req.on('error', reject);
    signal.addEventListener('abort', () => {
      req.destroy();
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Perform an HTTP POST, preferring globalThis.fetch with nodeHttpsPost fallback.
 * This abstraction enables test mocking via globalThis.fetch override.
 */
export async function performPost(
  url: string,
  headers: Record<string, string>,
  body: string,
  signal: AbortSignal,
): Promise<FetchLike> {
  if (typeof globalThis.fetch === 'function') {
    try {
      const resp = await globalThis.fetch(url, {
        method: 'POST',
        headers,
        body,
        signal,
      });
      return {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        headers: {
          get(name: string): string | null {
            return resp.headers?.get?.(name) ?? null;
          },
        },
        text: () => resp.text(),
        json: () => resp.json() as Promise<unknown>,
      };
    } catch (fetchErr: unknown) {
      const msg = ((fetchErr as Error).message ?? '').toLowerCase();
      if (
        msg.includes('typeerror') ||
        msg.includes('not implemented') ||
        msg.includes('bad request') ||
        msg.includes('400')
      ) {
        return nodeHttpsPost(url, headers, body, signal);
      }
      throw fetchErr;
    }
  }

  return nodeHttpsPost(url, headers, body, signal);
}
