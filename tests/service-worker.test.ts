/**
 * Service Worker tests.
 *
 * Loads `public/sw.js` into a Node `vm` sandbox with mocked `self`, `caches`,
 * `setTimeout`/`clearTimeout`, and `fetch` globals so we can exercise the
 * install/activate/fetch/message handlers and the network-first /
 * stale-while-revalidate helpers without a real ServiceWorker runtime.
 *
 * Important: `public/sw.js` ships with a `__BUILD_ID__` placeholder that
 * `scripts/vite-plugin-sw-build-id.js` substitutes during `vite build`.
 * The tests substitute their own deterministic BUILD_ID per load so we
 * can assert per-build cache rotation independently of the build pipeline.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SW_PATH = resolve(__dirname, '..', 'public', 'sw.js');
const SW_SOURCE_RAW = readFileSync(SW_PATH, 'utf8');

const DEFAULT_BUILD_ID = 'test-build-aaaaaa';

function withBuildId(buildId: string): string {
  if (!SW_SOURCE_RAW.includes('__BUILD_ID__')) {
    throw new Error(
      'public/sw.js is missing the __BUILD_ID__ placeholder. ' +
        'scripts/vite-plugin-sw-build-id.js depends on this literal.',
    );
  }
  return SW_SOURCE_RAW.split('__BUILD_ID__').join(buildId);
}

/* ------------------------------------------------------------------ */
/*  Minimal in-memory CacheStorage / Cache mock                       */
/* ------------------------------------------------------------------ */

interface CacheEntry {
  response: Response;
}

class FakeCache {
  private store = new Map<string, CacheEntry>();
  constructor(private fetchImpl: typeof fetch) {}

  async match(request: Request | string): Promise<Response | undefined> {
    const key = typeof request === 'string' ? request : request.url;
    const entry = this.store.get(key);
    return entry ? entry.response.clone() : undefined;
  }

  async put(request: Request | string, response: Response): Promise<void> {
    const key = typeof request === 'string' ? request : request.url;
    this.store.set(key, { response: response.clone() });
  }

  async add(request: Request | string): Promise<void> {
    const url = typeof request === 'string' ? request : request.url;
    const response = await this.fetchImpl(url);
    if (!response.ok) throw new Error(`add() failed for ${url}`);
    await this.put(url, response);
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

class FakeCacheStorage {
  caches = new Map<string, FakeCache>();
  constructor(private fetchImpl: typeof fetch) {}

  async open(name: string): Promise<FakeCache> {
    let cache = this.caches.get(name);
    if (!cache) {
      cache = new FakeCache(this.fetchImpl);
      this.caches.set(name, cache);
    }
    return cache;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.caches.keys());
  }

  async delete(name: string): Promise<boolean> {
    return this.caches.delete(name);
  }

  async match(request: Request | string): Promise<Response | undefined> {
    for (const cache of this.caches.values()) {
      const hit = await cache.match(request);
      if (hit) return hit;
    }
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

interface SWHandlers {
  install?: (event: { waitUntil: (p: Promise<unknown>) => void }) => void;
  activate?: (event: { waitUntil: (p: Promise<unknown>) => void }) => void;
  fetch?: (event: {
    request: Request;
    respondWith: (p: Response | Promise<Response>) => void;
  }) => void;
  message?: (event: { data: unknown }) => void;
}

interface SWSandbox {
  handlers: SWHandlers;
  self: {
    skipWaiting: ReturnType<typeof vi.fn>;
    clients: { claim: ReturnType<typeof vi.fn> };
  };
  caches: FakeCacheStorage;
  fetch: ReturnType<typeof vi.fn>;
  buildId: string;
  htmlCacheName: string;
}

function loadServiceWorker(
  fetchImpl: typeof fetch,
  buildId: string = DEFAULT_BUILD_ID,
): SWSandbox {
  const handlers: SWHandlers = {};
  const fetchMock = vi.fn(fetchImpl);
  const cacheStorage = new FakeCacheStorage(fetchMock as unknown as typeof fetch);

  const selfMock = {
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    addEventListener: (type: keyof SWHandlers, handler: SWHandlers[keyof SWHandlers]) => {
      handlers[type] = handler as never;
    },
  };

  const sandbox: Record<string, unknown> = {
    self: selfMock,
    caches: cacheStorage,
    fetch: fetchMock,
    Response,
    Request,
    Headers,
    URL,
    Promise,
    Error,
    TypeError,
    setTimeout,
    clearTimeout,
    console,
  };

  vm.createContext(sandbox);
  vm.runInContext(withBuildId(buildId), sandbox, { filename: 'sw.js' });

  return {
    handlers,
    self: selfMock,
    caches: cacheStorage,
    fetch: fetchMock,
    buildId,
    htmlCacheName: `riksdagsmonitor-html-${buildId}`,
  };
}

function makeResponse(body: string, init: ResponseInit = { status: 200 }): Response {
  return new Response(body, init);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('service worker (public/sw.js)', () => {
  let sw: SWSandbox;

  beforeEach(() => {
    sw = loadServiceWorker(
      vi.fn(async () => makeResponse('network', { status: 200 })) as unknown as typeof fetch,
    );
  });

  describe('source integrity', () => {
    it('public/sw.js retains the __BUILD_ID__ placeholder for the build plugin', () => {
      expect(SW_SOURCE_RAW).toContain('__BUILD_ID__');
    });
  });

  describe('handler registration', () => {
    it('registers install, activate, fetch, and message handlers', () => {
      expect(typeof sw.handlers.install).toBe('function');
      expect(typeof sw.handlers.activate).toBe('function');
      expect(typeof sw.handlers.fetch).toBe('function');
      expect(typeof sw.handlers.message).toBe('function');
    });

    it('install handler calls skipWaiting (no synchronous pre-cache work)', async () => {
      let installPromise: Promise<unknown> = Promise.resolve();
      sw.handlers.install?.({ waitUntil: (p) => { installPromise = p; } });
      await installPromise;
      expect(sw.self.skipWaiting).toHaveBeenCalledTimes(1);
    });

    it('message handler calls skipWaiting on { type: "SKIP_WAITING" }', () => {
      sw.self.skipWaiting.mockClear();
      sw.handlers.message?.({ data: { type: 'SKIP_WAITING' } });
      expect(sw.self.skipWaiting).toHaveBeenCalledTimes(1);
    });

    it('message handler ignores unrelated messages', () => {
      sw.self.skipWaiting.mockClear();
      sw.handlers.message?.({ data: { type: 'OTHER' } });
      sw.handlers.message?.({ data: 'random' });
      sw.handlers.message?.({ data: null });
      expect(sw.self.skipWaiting).not.toHaveBeenCalled();
    });
  });

  describe('activate: per-build HTML cache rotation', () => {
    it('keeps current build HTML cache and cia-data; evicts every other cache', async () => {
      // Seed previous-build HTML cache + a totally unrelated cache.
      await sw.caches.open('riksdagsmonitor-html-old-build');
      await sw.caches.open('riksdagsmonitor-html-older-build');
      await sw.caches.open('cia-data-v1');         // current — must survive
      await sw.caches.open(sw.htmlCacheName);      // current — must survive
      await sw.caches.open('legacy-foo-cache');    // must evict

      let activatePromise: Promise<unknown> = Promise.resolve();
      sw.handlers.activate?.({ waitUntil: (p) => { activatePromise = p; } });
      await activatePromise;

      const remaining = await sw.caches.keys();
      expect(remaining).toContain(sw.htmlCacheName);
      expect(remaining).toContain('cia-data-v1');
      expect(remaining).not.toContain('riksdagsmonitor-html-old-build');
      expect(remaining).not.toContain('riksdagsmonitor-html-older-build');
      expect(remaining).not.toContain('legacy-foo-cache');
      expect(sw.self.clients.claim).toHaveBeenCalledTimes(1);
    });

    it('different BUILD_ID yields different HTML cache name', () => {
      const swA = loadServiceWorker(
        vi.fn(async () => makeResponse('x')) as unknown as typeof fetch,
        'build-AAA',
      );
      const swB = loadServiceWorker(
        vi.fn(async () => makeResponse('x')) as unknown as typeof fetch,
        'build-BBB',
      );
      expect(swA.htmlCacheName).not.toBe(swB.htmlCacheName);
      expect(swA.htmlCacheName).toContain('build-AAA');
      expect(swB.htmlCacheName).toContain('build-BBB');
    });

    it('build N activate evicts build N-1 HTML cache', async () => {
      const oldSw = loadServiceWorker(
        vi.fn(async () => makeResponse('x')) as unknown as typeof fetch,
        'build-N-minus-1',
      );

      // Seed both old and new HTML caches in the SAME storage by simulating
      // the new build taking over: the new SW sees the storage that already
      // contains the old cache name.
      const newSw = loadServiceWorker(
        vi.fn(async () => makeResponse('x')) as unknown as typeof fetch,
        'build-N',
      );
      await newSw.caches.open(oldSw.htmlCacheName);
      await newSw.caches.open(newSw.htmlCacheName);
      await newSw.caches.open('cia-data-v1');

      let activatePromise: Promise<unknown> = Promise.resolve();
      newSw.handlers.activate?.({ waitUntil: (p) => { activatePromise = p; } });
      await activatePromise;

      const remaining = await newSw.caches.keys();
      expect(remaining).not.toContain(oldSw.htmlCacheName);
      expect(remaining).toContain(newSw.htmlCacheName);
      expect(remaining).toContain('cia-data-v1');
    });
  });

  describe('fetch routing', () => {
    it('non-GET requests are not intercepted', () => {
      let respondCalled = false;
      sw.handlers.fetch?.({
        request: new Request('https://riksdagsmonitor.com/cia-data/x.csv', { method: 'POST' }),
        respondWith: () => { respondCalled = true; },
      });
      expect(respondCalled).toBe(false);
    });

    it('CSS requests are NOT intercepted (HTTP cache + must-revalidate handle them)', () => {
      let respondCalled = false;
      const req = new Request('https://riksdagsmonitor.com/styles.css');
      Object.defineProperty(req, 'destination', { value: 'style', configurable: true });
      sw.handlers.fetch?.({
        request: req,
        respondWith: () => { respondCalled = true; },
      });
      expect(respondCalled).toBe(false);
    });

    it('script/image/font requests bypass the SW', () => {
      let respondCalled = false;
      for (const dest of ['script', 'image', 'font'] as const) {
        const req = new Request(`https://riksdagsmonitor.com/assets/${dest}-abc.bin`);
        Object.defineProperty(req, 'destination', { value: dest, configurable: true });
        sw.handlers.fetch?.({
          request: req,
          respondWith: () => { respondCalled = true; },
        });
      }
      expect(respondCalled).toBe(false);
    });

    it('navigation requests with mode="navigate" are handled even without destination=document', () => {
      let respondCalled = false;
      const req = new Request('https://riksdagsmonitor.com/news/index.html');
      Object.defineProperty(req, 'mode', { value: 'navigate', configurable: true });
      Object.defineProperty(req, 'destination', { value: '', configurable: true });
      sw.handlers.fetch?.({
        request: req,
        respondWith: () => { respondCalled = true; },
      });
      expect(respondCalled).toBe(true);
    });
  });

  describe('CIA data: stale-while-revalidate', () => {
    it('populates the cache on first fetch', async () => {
      const fetchMock = vi.fn(async () =>
        makeResponse('Year,Value\n2024,42', { status: 200 }),
      ) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/cia-data/example.csv';
      let response: Response | undefined;
      sw.handlers.fetch?.({
        request: new Request(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { response = r; }); },
      });

      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));

      expect(response?.status).toBe(200);
      expect(sw.fetch).toHaveBeenCalledTimes(1);

      const cache = await sw.caches.open('cia-data-v1');
      const cached = await cache.match(url);
      expect(cached).toBeDefined();
      expect(await cached!.text()).toContain('2024,42');
    });

    it('returns cached response immediately on second fetch', async () => {
      const fetchMock = vi.fn(async () =>
        makeResponse('fresh', { status: 200 }),
      ) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/cia-data/example.json';
      const cache = await sw.caches.open('cia-data-v1');
      await cache.put(url, makeResponse('cached', { status: 200 }));

      let resolved: Response | undefined;
      sw.handlers.fetch?.({
        request: new Request(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(await resolved!.text()).toBe('cached');
    });

    it('falls back to cache when network fails', async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/cia-data/example.csv';
      const cache = await sw.caches.open('cia-data-v1');
      await cache.put(url, makeResponse('offline-data', { status: 200 }));

      let resolved: Response | undefined;
      sw.handlers.fetch?.({
        request: new Request(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(await resolved!.text()).toBe('offline-data');
    });
  });

  describe('HTML: network-first with offline fallback', () => {
    function makeDocumentRequest(url: string): Request {
      const req = new Request(url);
      Object.defineProperty(req, 'destination', { value: 'document', configurable: true });
      return req;
    }

    it('serves the network response when available and populates the cache', async () => {
      const fetchMock = vi.fn(async () =>
        makeResponse('<!DOCTYPE html><title>FRESH</title>', { status: 200 }),
      ) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/news/index.html';
      let resolved: Response | undefined;
      sw.handlers.fetch?.({
        request: makeDocumentRequest(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
      });

      // Allow the network promise + cache.put to flush.
      for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));

      expect(resolved?.status).toBe(200);
      expect(await resolved!.text()).toContain('FRESH');

      const cache = await sw.caches.open(sw.htmlCacheName);
      const cached = await cache.match(url);
      expect(cached).toBeDefined();
      expect(await cached!.text()).toContain('FRESH');
    });

    it('returns latest network response even when a cached copy exists (network-first)', async () => {
      const fetchMock = vi.fn(async () =>
        makeResponse('<!DOCTYPE html><title>LATEST</title>', { status: 200 }),
      ) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/news/index.html';
      const cache = await sw.caches.open(sw.htmlCacheName);
      await cache.put(url, makeResponse('<!DOCTYPE html><title>STALE</title>', { status: 200 }));

      let resolved: Response | undefined;
      sw.handlers.fetch?.({
        request: makeDocumentRequest(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
      });

      for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));

      expect(await resolved!.text()).toContain('LATEST');
      expect(sw.fetch).toHaveBeenCalledTimes(1);
    });

    it('falls back to the cached response when the network throws (offline)', async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/index.html';
      const cache = await sw.caches.open(sw.htmlCacheName);
      await cache.put(url, makeResponse('<!DOCTYPE html><title>OFFLINE-CACHE</title>', { status: 200 }));

      let resolved: Response | undefined;
      sw.handlers.fetch?.({
        request: makeDocumentRequest(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
      });

      for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));

      expect(await resolved!.text()).toContain('OFFLINE-CACHE');
    });

    it('returns an inline 503 offline page when both network and cache fail', async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch;
      sw = loadServiceWorker(fetchMock);

      const url = 'https://riksdagsmonitor.com/never-visited.html';
      let resolved: Response | undefined;
      sw.handlers.fetch?.({
        request: makeDocumentRequest(url),
        respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
      });

      for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));

      expect(resolved).toBeDefined();
      expect(resolved!.status).toBe(503);
      const body = await resolved!.text();
      expect(body).toContain('You appear to be offline');
      expect(resolved!.headers.get('content-type')).toMatch(/text\/html/);
    });

    it('falls back to cache when the network hangs longer than the timeout', async () => {
      vi.useFakeTimers();
      try {
        // fetch never resolves — must trip the timeout path.
        const fetchMock = vi.fn(
          () => new Promise<Response>(() => { /* hangs forever */ }),
        ) as unknown as typeof fetch;
        sw = loadServiceWorker(fetchMock);

        const url = 'https://riksdagsmonitor.com/index.html';
        const cache = await sw.caches.open(sw.htmlCacheName);
        await cache.put(
          url,
          makeResponse('<!DOCTYPE html><title>FROM-CACHE-TIMEOUT</title>', { status: 200 }),
        );

        let resolved: Response | undefined;
        sw.handlers.fetch?.({
          request: makeDocumentRequest(url),
          respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
        });

        // Advance past the SW's NETWORK_TIMEOUT_MS (3000).
        await vi.advanceTimersByTimeAsync(3500);
        // Flush microtasks that resolve from the cache lookup.
        for (let i = 0; i < 4; i++) {
          await Promise.resolve();
        }

        expect(resolved).toBeDefined();
        expect(await resolved!.text()).toContain('FROM-CACHE-TIMEOUT');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
