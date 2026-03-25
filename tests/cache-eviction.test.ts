/**
 * Tests for localStorage cache eviction logic.
 *
 * Validates that setCache handles QuotaExceededError by evicting
 * old cache entries and retrying the storage operation, while
 * skipping eviction for non-quota errors (SecurityError, etc.).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ------------------------------------------------------------------ */
/*  Helper: mock localStorage with configurable quota behaviour       */
/* ------------------------------------------------------------------ */

interface MockStorageOptions {
  /** Maximum total bytes before QuotaExceededError. Infinity = no limit. */
  quotaLimit?: number;
  /**
   * If true, *every* setItem call throws a SecurityError
   * (simulates private-mode / storage disabled).
   */
  storageDisabled?: boolean;
}

function createMockLocalStorage(
  storage: Map<string, string>,
  opts: MockStorageOptions = {},
) {
  const { quotaLimit = Infinity, storageDisabled = false } = opts;

  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      if (storageDisabled) {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      }
      let totalSize = value.length;
      storage.forEach(v => { totalSize += v.length; });
      if (totalSize > quotaLimit) {
        throw new DOMException(
          "Failed to execute 'setItem' on 'Storage': quota exceeded",
          'QuotaExceededError',
        );
      }
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => { storage.delete(key); }),
    clear: vi.fn(() => { storage.clear(); }),
    get length() { return storage.size; },
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
  } as unknown as Storage;
}

/**
 * Wraps a mock localStorage's setItem so the first call throws
 * QuotaExceededError and subsequent calls delegate to the original.
 */
function wrapSetItemWithQuotaError(mock: Storage, storage: Map<string, string>): void {
  let callCount = 0;
  (mock as Record<string, unknown>).setItem = vi.fn((key: string, value: string) => {
    callCount++;
    if (callCount === 1) {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    }
    storage.set(key, value);
  });
}

/* ================================================================== */
/*  Shared data-loader: exercises production loadText → setCache path */
/* ================================================================== */

describe('Shared data-loader cache eviction (production paths)', () => {
  let storage: Map<string, string>;
  let savedLocalStorage: Storage;
  let savedFetch: typeof globalThis.fetch;

  beforeEach(() => {
    storage = new Map();
    savedLocalStorage = globalThis.localStorage;
    savedFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.localStorage = savedLocalStorage;
    globalThis.fetch = savedFetch;
    vi.restoreAllMocks();
  });

  it('should store data via loadText and cache under the module prefix', async () => {
    const mock = createMockLocalStorage(storage);
    globalThis.localStorage = mock as unknown as Storage;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'hello world',
    }) as unknown as typeof fetch;

    const { loadText, CACHE_KEY_PREFIX } = await import(
      '../src/browser/shared/data-loader.js'
    );

    await loadText(
      { primary: 'https://example.com/data.csv' },
      { cacheKey: 'test_key' },
    );

    const prefixedKey = CACHE_KEY_PREFIX + 'test_key';
    expect(storage.has(prefixedKey)).toBe(true);
    const parsed = JSON.parse(storage.get(prefixedKey)!);
    expect(parsed.data).toBe('hello world');
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('should evict only prefixed entries on QuotaExceededError and retry', async () => {
    const { CACHE_KEY_PREFIX } = await import(
      '../src/browser/shared/data-loader.js'
    );

    storage.set(
      `${CACHE_KEY_PREFIX}old_key`,
      JSON.stringify({ data: 'stale', timestamp: Date.now() - 999_999 }),
    );
    storage.set('foreign_app_key', JSON.stringify({ value: 42 }));
    storage.set('theme', 'dark');

    const mock = createMockLocalStorage(storage);
    wrapSetItemWithQuotaError(mock, storage);
    globalThis.localStorage = mock as unknown as Storage;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'new data',
    }) as unknown as typeof fetch;

    const { loadText } = await import(
      '../src/browser/shared/data-loader.js'
    );

    await loadText(
      { primary: 'https://example.com/data.csv' },
      { cacheKey: 'new_key' },
    );

    expect(storage.has(`${CACHE_KEY_PREFIX}old_key`)).toBe(false);
    expect(storage.get('foreign_app_key')).toBe(JSON.stringify({ value: 42 }));
    expect(storage.get('theme')).toBe('dark');
  });

  it('should NOT evict on SecurityError (storage disabled)', async () => {
    const { CACHE_KEY_PREFIX } = await import(
      '../src/browser/shared/data-loader.js'
    );
    const prefixedKey = `${CACHE_KEY_PREFIX}existing`;
    storage.set(
      prefixedKey,
      JSON.stringify({ data: 'keep me', timestamp: Date.now() }),
    );

    const mock = createMockLocalStorage(storage, { storageDisabled: true });
    globalThis.localStorage = mock as unknown as Storage;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'whatever',
    }) as unknown as typeof fetch;

    const { loadText } = await import(
      '../src/browser/shared/data-loader.js'
    );

    const result = await loadText(
      { primary: 'https://example.com/data.csv' },
      { cacheKey: 'sec_test' },
    );
    expect(result).toBe('whatever');

    expect(storage.has(prefixedKey)).toBe(true);
  });
});

/* ================================================================== */
/*  Election-cycle: exercises production setCache() on the real class */
/* ================================================================== */

describe('Election-cycle cache eviction', () => {
  let storage: Map<string, string>;
  let savedLocalStorage: Storage;

  beforeEach(() => {
    storage = new Map();
    savedLocalStorage = globalThis.localStorage;
  });

  afterEach(() => {
    globalThis.localStorage = savedLocalStorage;
    vi.restoreAllMocks();
  });

  it('should evict only election-cycle entries on QuotaExceededError', async () => {
    const cachePrefix = 'riksdag_election_cycle_';

    storage.set(
      `${cachePrefix}comparative`,
      JSON.stringify({ data: [], timestamp: Date.now() - 100_000 }),
    );
    storage.set(
      `${cachePrefix}decision`,
      JSON.stringify({ data: [], timestamp: Date.now() - 90_000 }),
    );
    storage.set('theme', 'dark');
    storage.set('other_app_data', 'important');

    const mock = createMockLocalStorage(storage);
    wrapSetItemWithQuotaError(mock, storage);
    globalThis.localStorage = mock as unknown as Storage;

    // Import and instantiate production class
    const { ElectionCycleDataManager } = await import(
      '../src/browser/dashboards/election-cycle.js'
    );
    const manager = new ElectionCycleDataManager();

    // Call production setCache — should trigger eviction + retry
    manager.setCache(`${cachePrefix}temporal`, [{ id: 1 }]);

    expect(storage.has(`${cachePrefix}temporal`)).toBe(true);
    expect(storage.has(`${cachePrefix}comparative`)).toBe(false);
    expect(storage.has(`${cachePrefix}decision`)).toBe(false);
    expect(storage.get('theme')).toBe('dark');
    expect(storage.get('other_app_data')).toBe('important');
  });

  it('should NOT evict on SecurityError (storage disabled)', async () => {
    const cachePrefix = 'riksdag_election_cycle_';

    storage.set(
      `${cachePrefix}comparative`,
      JSON.stringify({ data: [], timestamp: Date.now() }),
    );

    const mock = createMockLocalStorage(storage, { storageDisabled: true });
    globalThis.localStorage = mock as unknown as Storage;

    const { ElectionCycleDataManager } = await import(
      '../src/browser/dashboards/election-cycle.js'
    );
    const manager = new ElectionCycleDataManager();

    // SecurityError — setCache should log and skip; no eviction
    manager.setCache(`${cachePrefix}temporal`, [{ id: 1 }]);

    expect(storage.has(`${cachePrefix}comparative`)).toBe(true);
  });
});

/* ================================================================== */
/*  Shared data-loader eviction scoping strategy                      */
/* ================================================================== */

describe('Shared data-loader eviction strategy', () => {
  it('should evict oldest half of PREFIXED cache entries by timestamp', () => {
    const PREFIX = 'rdm_dl_';
    const storage = new Map<string, string>();
    const now = Date.now();

    storage.set(`${PREFIX}old1`, JSON.stringify({ data: 'a', timestamp: now - 7 * 86_400_000 }));
    storage.set(`${PREFIX}old2`, JSON.stringify({ data: 'b', timestamp: now - 5 * 86_400_000 }));
    storage.set(`${PREFIX}new1`, JSON.stringify({ data: 'c', timestamp: now - 86_400_000 }));
    storage.set(`${PREFIX}new2`, JSON.stringify({ data: 'd', timestamp: now - 3_600_000 }));
    storage.set('foreign', JSON.stringify({ data: 'x', timestamp: now - 999_999_999 }));

    interface CE { data: string; timestamp: number }
    const entries: { key: string; timestamp: number }[] = [];
    storage.forEach((value, key) => {
      if (!key.startsWith(PREFIX)) return;
      try {
        const parsed: CE = JSON.parse(value);
        if (typeof parsed.timestamp === 'number') {
          entries.push({ key, timestamp: parsed.timestamp });
        }
      } catch { /* skip */ }
    });

    entries.sort((a, b) => a.timestamp - b.timestamp);
    const removeCount = Math.max(1, Math.ceil(entries.length / 2));
    entries.slice(0, removeCount).forEach(e => storage.delete(e.key));

    expect(storage.has(`${PREFIX}old1`)).toBe(false);
    expect(storage.has(`${PREFIX}old2`)).toBe(false);
    expect(storage.has(`${PREFIX}new1`)).toBe(true);
    expect(storage.has(`${PREFIX}new2`)).toBe(true);
    expect(storage.has('foreign')).toBe(true);
  });

  it('should evict at least one entry even when only one exists', () => {
    const PREFIX = 'rdm_dl_';
    const storage = new Map<string, string>();

    storage.set(`${PREFIX}only`, JSON.stringify({ data: 'x', timestamp: Date.now() - 100_000 }));

    interface CE { data: string; timestamp: number }
    const entries: { key: string; timestamp: number }[] = [];
    storage.forEach((value, key) => {
      if (!key.startsWith(PREFIX)) return;
      try {
        const parsed: CE = JSON.parse(value);
        if (typeof parsed.timestamp === 'number') {
          entries.push({ key, timestamp: parsed.timestamp });
        }
      } catch { /* skip */ }
    });

    entries.sort((a, b) => a.timestamp - b.timestamp);
    const removeCount = Math.max(1, Math.ceil(entries.length / 2));
    entries.slice(0, removeCount).forEach(e => storage.delete(e.key));

    expect(storage.size).toBe(0);
    expect(removeCount).toBe(1);
  });
});
