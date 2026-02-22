/**
 * @module Shared/RegisterGlobals
 * @description Imports Chart.js, D3.js, and Papa Parse as ES modules and registers them on globalThis.
 *
 * Dashboard modules access these libraries via `(globalThis as any).Chart`,
 * `(globalThis as any).d3`, and `(globalThis as any).Papa`. ES module side-effect
 * imports (`import 'chart.js/auto'`) do NOT set globals, so this module must be
 * imported before any dashboard module to ensure the globals are available at
 * module-evaluation time.
 *
 * @security No inline scripts — all library loading is programmatic via Vite bundling
 */

import { Chart } from 'chart.js/auto';
import 'chartjs-plugin-annotation';
import * as d3 from 'd3';
import Papa from 'papaparse';

// Expose on globalThis so dashboard modules can access via (globalThis as any).Chart / .d3 / .Papa
(globalThis as Record<string, unknown>).Chart = Chart;
(globalThis as Record<string, unknown>).d3 = d3;
(globalThis as Record<string, unknown>).Papa = Papa;
