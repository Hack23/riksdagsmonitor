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
import 'chart.js/auto';
import 'chartjs-plugin-annotation';

// ─── CIA Dashboard Modules ──────────────────────────────────────────────────
// dashboard-init.ts handles all orchestration internally
import './cia/dashboard-init.js';
