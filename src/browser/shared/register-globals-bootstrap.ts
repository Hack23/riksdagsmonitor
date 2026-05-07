/**
 * @module Shared/RegisterGlobalsBootstrap
 * @description Side-effect-only module that registers Chart.js, D3.js, and
 * Papa Parse on `globalThis` at module evaluation time.
 *
 * The CIA dashboard modules (`src/browser/cia/visualizations.ts` etc.)
 * capture `globalThis.Chart` at module-init time via
 * `const Chart = (globalThis as ...).Chart`. Because ECMAScript module
 * imports are hoisted, importing this bootstrap module FIRST in
 * `cia-entry.ts` guarantees the globals exist before downstream modules
 * evaluate. Without this, `Chart` would be captured as `undefined` and
 * every chart on `dashboard/index*.html` would silently fail.
 *
 * The dedicated bootstrap module exists (rather than calling
 * `registerBrowserGlobals()` from `register-globals.ts` itself or from
 * the `cia-entry.ts` body) so that:
 *   1. `register-globals.ts` remains a pure exports-only module — the
 *      `cia-dashboard-entry-contract.test.ts` contract forbids top-level
 *      side effects there for tree-shaking integrity.
 *   2. The static (non-dynamic) import graph is preserved so Vite emits
 *      the canonical `styles-*.css` asset chunk that the
 *      `static-pages-emit` plugin expects.
 *
 * @security No inline scripts — programmatic global registration only.
 */

import { registerBrowserGlobals } from './register-globals.js';

registerBrowserGlobals();
