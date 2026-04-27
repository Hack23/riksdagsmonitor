/**
 * Service Worker tests.
 *
 * Loads `public/sw.js` into a Node `vm` sandbox with mocked `self`, `caches`,
 * and `fetch` globals so we can exercise the install/activate/fetch handlers
 * and the stale-while-revalidate / cache-first helpers without a real
 * ServiceWorker runtime.
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
const SW_SOURCE = readFileSync(SW_PATH, 'utf8');

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
}

interface SWSandbox {
  handlers: SWHandlers;
  self: {
    skipWaiting: ReturnType<typeof vi.fn>;
    clients: { claim: ReturnType<typeof vi.fn> };
  };
  caches: FakeCacheStorage;
  fetch: ReturnType<typeof vi.fn>;
}

function loadServiceWorker(fetchImpl: typeof fetch): SWSandbox {
  const handlers: SWHandlers = {};
  const fetchMock = vi.fn(fetchImpl);
  const cacheStorage = new FakeCacheStorage(fetchMock as unknown as typeof fetch);

  const selfMock = {
    skipWaiting: vi.fn(),
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
    console,
  };

  vm.createContext(sandbox);
  vm.runInContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

  return {
    handlers,
    self: selfMock,
    caches: cacheStorage,
    fetch: fetchMock,
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

  it('registers install, activate, and fetch handlers', () => {
    expect(typeof sw.handlers.install).toBe('function');
    expect(typeof sw.handlers.activate).toBe('function');
    expect(typeof sw.handlers.fetch).toBe('function');
  });

  it('install handler calls skipWaiting and pre-caches static assets', async () => {
    let installPromise: Promise<unknown> = Promise.resolve();
    sw.handlers.install?.({ waitUntil: (p) => { installPromise = p; } });
    await installPromise;

    expect(sw.self.skipWaiting).toHaveBeenCalledTimes(1);
    // pre-cache should have run for at least the entry HTML
    const cache = await sw.caches.open('riksdagsmonitor-v1');
    expect(cache.keys().length).toBeGreaterThan(0);
  });

  it('install tolerates 404s on optional pre-cache entries', async () => {
    const fetchMock = vi.fn(async () =>
      makeResponse('not found', { status: 404 }),
    ) as unknown as typeof fetch;
    sw = loadServiceWorker(fetchMock);

    let installPromise: Promise<unknown> = Promise.resolve();
    sw.handlers.install?.({ waitUntil: (p) => { installPromise = p; } });

    // Must resolve without throwing even if every asset 404s.
    await expect(installPromise).resolves.toBeDefined();
  });

  it('activate handler deletes outdated caches and claims clients', async () => {
    // Seed an old cache version that should be deleted.
    await sw.caches.open('riksdagsmonitor-v0');
    await sw.caches.open('riksdagsmonitor-v1'); // current — must survive
    await sw.caches.open('cia-data-v1');        // current — must survive

    let activatePromise: Promise<unknown> = Promise.resolve();
    sw.handlers.activate?.({ waitUntil: (p) => { activatePromise = p; } });
    await activatePromise;

    const remaining = await sw.caches.keys();
    expect(remaining).toContain('riksdagsmonitor-v1');
    expect(remaining).toContain('cia-data-v1');
    expect(remaining).not.toContain('riksdagsmonitor-v0');
    expect(sw.self.clients.claim).toHaveBeenCalledTimes(1);
  });

  it('stale-while-revalidate populates the cache on first CIA-data fetch', async () => {
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

    // Allow any pending microtasks to flush the network promise.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(response?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Cache should now contain the fetched CSV.
    const cache = await sw.caches.open('cia-data-v1');
    const cached = await cache.match(url);
    expect(cached).toBeDefined();
    expect(await cached!.text()).toContain('2024,42');
  });

  it('stale-while-revalidate returns cached response immediately on second fetch', async () => {
    const fetchMock = vi.fn(async () =>
      makeResponse('fresh', { status: 200 }),
    ) as unknown as typeof fetch;
    sw = loadServiceWorker(fetchMock);

    const url = 'https://riksdagsmonitor.com/cia-data/example.json';

    // Pre-populate the cache to simulate a previous visit.
    const cache = await sw.caches.open('cia-data-v1');
    await cache.put(url, makeResponse('cached', { status: 200 }));

    let resolved: Response | undefined;
    sw.handlers.fetch?.({
      request: new Request(url),
      respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(resolved).toBeDefined();
    expect(await resolved!.text()).toBe('cached');
  });

  it('stale-while-revalidate falls back to cache when network fails (offline)', async () => {
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

  it('non-GET requests are not intercepted', () => {
    let respondCalled = false;
    sw.handlers.fetch?.({
      request: new Request('https://riksdagsmonitor.com/cia-data/x.csv', { method: 'POST' }),
      respondWith: () => { respondCalled = true; },
    });
    expect(respondCalled).toBe(false);
  });

  it('non-CIA, non-document, non-style requests bypass the SW', () => {
    let respondCalled = false;
    const req = new Request('https://riksdagsmonitor.com/assets/js/main-abc.js');
    // Force destination since Request in jsdom may not infer it.
    Object.defineProperty(req, 'destination', { value: 'script', configurable: true });
    sw.handlers.fetch?.({
      request: req,
      respondWith: () => { respondCalled = true; },
    });
    expect(respondCalled).toBe(false);
  });

  it('cache-first reads only from the named cache (not other caches)', async () => {
    const url = 'https://riksdagsmonitor.com/index.html';

    // Plant a response in the *wrong* cache (cia-data-v1) — cacheFirst
    // for an HTML document should NOT find it; it should miss and fall
    // through to the network instead, since HTML belongs in
    // riksdagsmonitor-v1.
    const wrongCache = await sw.caches.open('cia-data-v1');
    await wrongCache.put(url, makeResponse('WRONG-CACHE', { status: 200 }));

    sw.fetch.mockImplementationOnce(async () =>
      makeResponse('FROM-NETWORK', { status: 200 }),
    );

    const req = new Request(url);
    Object.defineProperty(req, 'destination', { value: 'document', configurable: true });

    let resolved: Response | undefined;
    sw.handlers.fetch?.({
      request: req,
      respondWith: (p) => { void Promise.resolve(p).then((r) => { resolved = r; }); },
    });

    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(resolved).toBeDefined();
    expect(await resolved!.text()).toBe('FROM-NETWORK');
    expect(sw.fetch).toHaveBeenCalledTimes(1);

    // After the network fetch, the response should be stored in the
    // correct named cache (riksdagsmonitor-v1), not cia-data-v1.
    const correctCache = await sw.caches.open('riksdagsmonitor-v1');
    const stored = await correctCache.match(url);
    expect(stored).toBeDefined();
    expect(await stored!.text()).toBe('FROM-NETWORK');
  });
});
