/**
 * Service Worker for Riksdagsmonitor
 *
 * Caching strategy:
 *   - network-first (3 s timeout) for HTML documents so every navigation
 *     receives the latest content shipped by the most recent push to S3,
 *     with offline fallback to the previous build's cached HTML and a
 *     tiny inline offline page when both fail. This is the freshness
 *     guarantee for content that ships on every PR merge — `package.json`
 *     `version` is not a useful signal because it only changes on
 *     occasional releases (release notes / API docs / test results),
 *     while news, sitemap, RSS and dashboards are pushed continuously.
 *   - stale-while-revalidate for CIA data assets (CSV/JSON under
 *     /cia-data/ served locally or fetched from raw.githubusercontent.com).
 *   - no interception at all for CSS, JS, images, fonts, manifests:
 *     the browser's HTTP cache + the per-extension Cache-Control headers
 *     set by `scripts/deploy-s3.sh` are correct (Vite-hashed files are
 *     content-addressed and `immutable, 1y`; root `styles.css` and
 *     manifests are short-cache + `must-revalidate`).
 *
 * BUILD_ID strategy:
 *   `__BUILD_ID__` is substituted at build time by
 *   `scripts/vite-plugin-sw-build-id.js`. The substituted SW file body
 *   therefore differs on every push (commit SHA → git short SHA →
 *   timestamp fallback), so:
 *     1. The browser detects a byte-diff during its automatic 24 h SW
 *        update check (or sooner via `registration.update()` from
 *        `src/browser/main.ts`) and runs `install` for the new worker.
 *     2. `activate` evicts every cache whose name is not in the strict
 *        current allow-list, so the previous build's HTML cache is
 *        purged on every push, not just on releases.
 *
 * This complements the in-page localStorage TTL cache in
 * src/browser/shared/data-loader.ts with a network-layer cache that
 * survives tab/browser restarts and enables offline read-only access.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// Replaced at build time by `scripts/vite-plugin-sw-build-id.js` with a
// short string derived from GITHUB_SHA / `git rev-parse` / Date.now so that
// every deployed `dist/sw.js` differs byte-wise from the previous one. A
// regression test asserts the placeholder is present in this source file.
const BUILD_ID = '__BUILD_ID__';

const HTML_CACHE = `riksdagsmonitor-html-${BUILD_ID}`;
const CIA_DATA_CACHE = 'cia-data-v1';
const CURRENT_CACHES = [HTML_CACHE, CIA_DATA_CACHE];

// Network-first timeout for HTML navigations. Long enough to avoid
// false fallbacks on slow connections, short enough to keep TTI sane.
const NETWORK_TIMEOUT_MS = 3000;

const CIA_DATA_PATTERNS = [
  /\/cia-data\/.*\.csv$/i,
  /\/cia-data\/.*\.json$/i,
  /raw\.githubusercontent\.com\/Hack23\/cia\//i,
];

// Inline minimal offline page returned when the network is unreachable
// AND the cache has no entry for this navigation. Kept tiny and
// self-contained (no external CSS/JS) so it works in every browser
// state. The visual language matches the cyberpunk theme.
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Offline · Riksdagsmonitor</title>
<style>
  :root { color-scheme: dark light; }
  html, body { margin: 0; padding: 0; min-height: 100vh; }
  body {
    background: #0a0e27; color: #e0e0e0;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 2rem;
  }
  main { max-width: 32rem; }
  h1 { font-size: 1.75rem; color: #00d9ff; margin: 0 0 1rem; letter-spacing: 0.02em; }
  p { color: #b0b8c8; line-height: 1.6; }
  button {
    margin-top: 1.5rem; padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #00d9ff, #ff006e);
    color: #0a0e27; border: 0; border-radius: 4px;
    font-weight: 600; cursor: pointer; font-size: 1rem;
  }
  button:focus-visible { outline: 2px solid #ffbe0b; outline-offset: 2px; }
</style>
</head>
<body>
<main>
  <h1>You appear to be offline</h1>
  <p>Riksdagsmonitor needs the network to fetch the latest political intelligence. Reconnect and retry, or browse pages you've already visited from your cache.</p>
  <button type="button" onclick="location.reload()">Retry</button>
</main>
</body>
</html>`;

self.addEventListener('install', (event) => {
  // Take over as the active worker as soon as the new build's install
  // completes — paired with `clients.claim()` in `activate` and the
  // `SKIP_WAITING` postMessage handler so an explicit user-driven
  // "Reload" from the in-page toast applies the new build instantly.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  // Allow the page to promote a waiting worker to active without a
  // hard reload. Triggered by `src/browser/main.ts` from the
  // "New content available — Reload" toast.
  if (event && event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; let non-GET (POST/PUT/DELETE) pass through.
  if (request.method !== 'GET') return;

  const url = request.url;
  const isCIAData = CIA_DATA_PATTERNS.some((pattern) => pattern.test(url));

  if (isCIAData) {
    event.respondWith(staleWhileRevalidate(CIA_DATA_CACHE, request));
    return;
  }

  // Network-first for HTML navigations so every visit shows the
  // freshest content from the most recent push. Cache fills as a
  // side effect for offline support.
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(networkFirst(HTML_CACHE, request));
    return;
  }

  // All other destinations (style, script, image, font, manifest, …)
  // bypass the SW. The browser's HTTP cache plus the per-extension
  // Cache-Control headers from `scripts/deploy-s3.sh` are the correct
  // freshness layer there: Vite-hashed assets are immutable, root
  // `styles.css` and manifests are short-cache + `must-revalidate`.
});

/**
 * Network-first with timeout: race the network against a timer and fall
 * back to the cache (then to a tiny inline offline page) so HTML
 * navigations always see the latest content when online and remain
 * usable offline.
 *
 * Cache-fill is a side-effect of the network branch; we only cache 2xx
 * basic/cors responses. Opaque, 4xx and 5xx responses are passed through
 * to the caller without polluting the cache.
 *
 * @param {string} cacheName
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(cacheName, request) {
  const cache = await caches.open(cacheName);

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('network-timeout')),
      NETWORK_TIMEOUT_MS,
    );
  });

  try {
    const response = await Promise.race([fetch(request), timeoutPromise]);
    clearTimeout(timeoutId);
    if (response && response.ok && response.type !== 'opaque') {
      // Clone before the body is consumed by the caller.
      cache
        .put(request, response.clone())
        .catch(() => { /* quota or aborted */ });
    }
    return response;
  } catch (_err) {
    clearTimeout(timeoutId);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

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
