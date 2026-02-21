/**
 * @module CIAEntry
 * @description Entry point for CIA Intelligence Dashboard pages (dashboard/index*.html).
 * Imports CIA-specific modules and Chart.js for the intelligence visualization dashboard.
 */

// ─── Library Imports ─────────────────────────────────────────────────────────
import 'chart.js/auto';
import 'chartjs-plugin-annotation';

// ─── CIA Dashboard Modules ──────────────────────────────────────────────────
// dashboard-init.ts handles all orchestration internally
import './cia/dashboard-init.js';
