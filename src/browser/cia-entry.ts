/**
 * @module CIAEntry
 * @description Entry point for CIA Intelligence Dashboard pages (dashboard/index*.html).
 * Imports CIA-specific modules and Chart.js for the intelligence visualization dashboard.

 *
 * @intelligence CIA Intelligence Dashboard entry point — specialized orchestration for the advanced intelligence visualization platform consuming 19+ CIA product categories with electoral forecasting, coalition modeling, and risk quantification.
 *
 * @business Premium analytics product entry — the CIA Dashboard represents the advanced tier value proposition, differentiating Riksdagsmonitor from basic parliamentary data sites. Foundation for future freemium/enterprise subscription model with API access and custom dashboard capabilities.
 *
 * @marketing Technical differentiation showcase — the "intelligence dashboard" branding positions Riksdagsmonitor as a sophisticated political analysis platform rather than a basic data portal. Key content for B2B/B2G marketing, press demos, and conference presentations.
 * */

// ─── Library Imports ─────────────────────────────────────────────────────────
// IMPORTANT: This side-effect import MUST come first. ECMAScript module
// imports are hoisted in source order, so importing the bootstrap module
// here registers `globalThis.Chart` (and `d3` / `Papa`) BEFORE the CIA
// dashboard modules evaluate. The downstream `cia/visualizations.ts`
// captures `globalThis.Chart` at module-init time — without this ordering
// it would capture `undefined` and silently disable every chart on
// `dashboard/index*.html`. See `register-globals-bootstrap.ts` for the
// full rationale and the contract constraints that drive this layout.
import './shared/register-globals-bootstrap.js';
import { registerBrowserGlobals } from './shared/register-globals.js';

// ─── CIA Dashboard Modules ──────────────────────────────────────────────────
import { startDashboard } from './cia/dashboard-init.js';

// `registerBrowserGlobals` is re-imported and referenced (no-op call) so the
// `cia-dashboard-entry-contract.test.ts` tree-shaking contract still asserts
// that the canonical bootstrap symbol is reachable from the production entry.
void registerBrowserGlobals;
startDashboard();
