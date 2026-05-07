/**
 * Unit tests for safeSetItem helper (src/browser/shared/safe-storage.ts).
 *
 * Ensures that QuotaExceededError is handled gracefully — oldest same-prefix
 * entries are evicted, the write is retried, and unrelated entries are never
 * touched. Other errors (e.g. SecurityError) must not trigger eviction.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeSetItem } from '../src/browser/shared/safe-storage.js';

function makeMockStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  let throwOnce = false;
  let alwaysThrow = false;
  let securityThrow = false;

  const mock = {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => {
      if (securityThrow) {
        throw new DOMException('insecure', 'SecurityError');
      }
      if (alwaysThrow) {
        throw new DOMException('quota', 'QuotaExceededError');
      }
      if (throwOnce) {
        throwOnce = false;
        throw new DOMException('quota', 'QuotaExceededError');
      }
      store.set(k, v);
    }),
    removeItem: vi.fn((k: string) => { store.delete(k); }),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
  };
  return {
    mock: mock as unknown as Storage,
    store,
    triggerQuotaOnce: () => { throwOnce = true; },
    triggerQuotaAlways: () => { alwaysThrow = true; },
    triggerSecurityError: () => { securityThrow = true; },
  };
}

describe('safeSetItem', () => {
  let saved: Storage;
  beforeEach(() => { saved = globalThis.localStorage; });
  afterEach(() => {
    globalThis.localStorage = saved;
    vi.restoreAllMocks();
  });

  it('returns true on a successful write', () => {
    const { mock, store } = makeMockStorage();
    globalThis.localStorage = mock;
    expect(safeSetItem('foo:a', 'value', 'foo:')).toBe(true);
    expect(store.get('foo:a')).toBe('value');
  });

  it('evicts oldest same-prefix entries on quota and retries', () => {
    const env = makeMockStorage({
      'foo:old':    JSON.stringify({ data: 1, timestamp: 1000 }),
      'foo:newer':  JSON.stringify({ data: 2, timestamp: 5000 }),
      'foo:newest': JSON.stringify({ data: 3, timestamp: 9000 }),
      'unrelated':  'keep-me',
    });
    globalThis.localStorage = env.mock;
    env.triggerQuotaOnce();

    expect(safeSetItem('foo:added', 'payload', 'foo:')).toBe(true);
    expect(env.store.get('foo:added')).toBe('payload');
    // Oldest evicted; newer/newest preserved (eviction is half = ceil(3/2) = 2)
    expect(env.store.has('foo:old')).toBe(false);
    expect(env.store.has('foo:newer')).toBe(false);
    expect(env.store.has('foo:newest')).toBe(true);
    // Unrelated keys must NEVER be touched
    expect(env.store.get('unrelated')).toBe('keep-me');
  });

  it('returns false (silently) when payload still exceeds quota after eviction', () => {
    const env = makeMockStorage({
      'foo:a': JSON.stringify({ data: 1, timestamp: 1000 }),
    });
    globalThis.localStorage = env.mock;
    env.triggerQuotaAlways();

    expect(safeSetItem('foo:huge', 'oversized', 'foo:')).toBe(false);
    // Eviction attempted (other entry removed) but write still failed
    expect(env.store.has('foo:huge')).toBe(false);
  });

  it('does NOT evict on SecurityError (storage disabled)', () => {
    const env = makeMockStorage({
      'foo:keep': 'value',
    });
    globalThis.localStorage = env.mock;
    env.triggerSecurityError();

    expect(safeSetItem('foo:new', 'payload', 'foo:')).toBe(false);
    // No eviction occurred
    expect(env.store.get('foo:keep')).toBe('value');
  });
});
