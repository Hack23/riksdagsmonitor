/**
 * @file Safe localStorage wrapper with quota-aware eviction.
 *
 * Wraps `localStorage.setItem` so that `QuotaExceededError` (and the legacy
 * Firefox `NS_ERROR_DOM_QUOTA_REACHED`) does not leak as an unhandled
 * exception or noisy console error. On quota errors the helper evicts the
 * oldest entries that share the caller's key prefix and retries once. If the
 * payload still does not fit (e.g. a single oversized blob), the write is
 * silently skipped — the caller will simply re-fetch on the next page load.
 *
 * @intelligence Resilient browser-cache layer — keeps dashboards functional
 * when committee/election CSV blobs exceed the ~5 MB localStorage quota.
 */

import { logger } from './logger.js';

/**
 * Detect whether an error represents a quota-exceeded condition.
 * Covers DOMException name 'QuotaExceededError', legacy code 22, and the
 * historical Firefox name 'NS_ERROR_DOM_QUOTA_REACHED' (code 1014).
 */
function isQuotaError(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false;
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014
  );
}

/**
 * Attempt `localStorage.setItem`. On quota exceeded, evict half of the
 * entries sharing `evictionPrefix` (oldest-timestamp first when payloads are
 * JSON `{ timestamp }` objects) and retry once. Other errors are logged and
 * swallowed.
 *
 * @param key Full storage key to write.
 * @param payload Serialized payload to store.
 * @param evictionPrefix Prefix identifying related entries that may be
 *   evicted to make room. Typically the caller's namespace, e.g.
 *   `'committees-cache:'`.
 * @returns `true` if the write succeeded, `false` otherwise.
 */
export function safeSetItem(
  key: string,
  payload: string,
  evictionPrefix: string,
): boolean {
  try {
    localStorage.setItem(key, payload);
    return true;
  } catch (e: unknown) {
    if (!isQuotaError(e)) {
      // Non-quota error (e.g. SecurityError when storage is disabled) — warn and bail.
      logger.warn('safeSetItem: non-quota storage error', e);
      return false;
    }
  }

  // Quota exceeded — collect candidates with the same prefix.
  const candidates: { key: string; timestamp: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(evictionPrefix) || k === key) continue;
      let ts = 0;
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw) as { timestamp?: unknown };
          if (typeof parsed.timestamp === 'number') ts = parsed.timestamp;
        }
      } catch {
        // Non-JSON entry under this prefix — treat as oldest so it gets purged first.
      }
      candidates.push({ key: k, timestamp: ts });
    }
  } catch {
    // Iteration over localStorage failed (e.g. storage disabled mid-flight) — give up.
    return false;
  }

  // Evict oldest half (at minimum one).
  candidates.sort((a, b) => a.timestamp - b.timestamp);
  const removeCount = Math.max(1, Math.ceil(candidates.length / 2));
  for (const entry of candidates.slice(0, removeCount)) {
    try { localStorage.removeItem(entry.key); } catch { /* ignore */ }
  }

  try {
    localStorage.setItem(key, payload);
    return true;
  } catch (retryErr) {
    if (isQuotaError(retryErr)) {
      // Single payload still too large — skip silently. Caller will re-fetch on next load.
      return false;
    }
    logger.warn('safeSetItem: retry failed', retryErr);
    return false;
  }
}
