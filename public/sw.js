/**
 * Service Worker for Riksdagsmonitor
 *
 * Caching strategy:
 *   - stale-while-revalidate for CIA data assets (CSV/JSON under /cia-data/
 *     served locally or fetched from raw.githubusercontent.com)
 *   - cache-first for HTML documents and CSS so the site loads when offline
 *   - all other requests pass through to the network untouched
 *
 * This complements the in-page localStorage TTL cache in
 * src/browser/shared/data-loader.ts with a network-layer cache that survives
 * tab/browser restarts and enables offline read-only access.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const CACHE_NAME = 'riksdagsmonitor-v1';
const CIA_DATA_CACHE = 'cia-data-v1';
const KNOWN_CACHES = [CACHE_NAME, CIA_DATA_CACHE];

// Minimal pre-cache: keep small to avoid install-time failure on missing assets.
// Per-language HTML and dashboards are cached on first visit by the runtime
// fetch handler below.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/site.webmanifest',
];

const CIA_DATA_PATTERNS = [
  /\/cia-data\/.*\.csv$/i,
  /\/cia-data\/.*\.json$/i,
  /raw\.githubusercontent\.com\/Hack23\/cia\//i,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll() rejects atomically if any entry 404s; use individual adds
      // so a missing optional asset doesn't fail the install.
      Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => { /* tolerate missing optional assets */ }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !KNOWN_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; let non-GET (POST/PUT/DELETE) pass through untouched.
  if (request.method !== 'GET') return;

  const url = request.url;
  const isCIAData = CIA_DATA_PATTERNS.some((pattern) => pattern.test(url));

  if (isCIAData) {
    event.respondWith(staleWhileRevalidate(CIA_DATA_CACHE, request));
    return;
  }

  if (request.destination === 'document' || request.destination === 'style') {
    event.respondWith(cacheFirst(CACHE_NAME, request));
  }
  // All other destinations (script, image, font, etc.) bypass the SW and use
  // the browser's native HTTP cache and the SRI-pinned hashed assets emitted
  // by Vite, which are already long-cacheable.
});

/**
 * Stale-while-revalidate: serve cached response immediately if present,
 * always trigger a background refresh to update the cache for next time.
 *
 * @param {string} cacheName
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      // Only cache successful, basic/cors responses; skip opaque/4xx/5xx.
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => { /* quota or aborted */ });
      }
      return response;
    })
    .catch((err) => {
      // Network failure — surface cached if we have it, otherwise rethrow so
      // the caller observes the original error.
      if (cached) return cached;
      throw err;
    });

  return cached ?? networkFetch;
}

/**
 * Cache-first: serve cached response if present, otherwise fetch and cache.
 *
 * @param {string} cacheName
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone()).catch(() => { /* quota or aborted */ });
  }
  return response;
}
