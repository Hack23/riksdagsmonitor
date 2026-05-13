/**
 * Per-chart Cypress spec for the coalitions dashboard.
 *
 * Thin driver: chart inventory and assertion logic live in
 * `./_helpers.js` so adding a chart is a one-line change. Strict
 * assertions catch the empty-dashboard regression by verifying that
 * each Chart.js instance carries non-empty datasets (i.e. the CSV
 * data flowed through the loader → renderer → chart pipeline).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { DASHBOARDS, runDashboardSuite } from './_helpers.js';

const CFG = DASHBOARDS.find((d) => d.slug === 'coalitions');
if (!CFG) throw new Error('Missing DASHBOARDS entry for slug "coalitions"');

runDashboardSuite(CFG);
