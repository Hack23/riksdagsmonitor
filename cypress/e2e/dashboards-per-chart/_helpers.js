/**
 * Shared fixtures for per-chart dashboard Cypress specs.
 *
 * Defines the canonical inventory of every chart / D3 visualization
 * across the 10 dashboard pages listed in the task tracker:
 *
 *   1. /dashboard/index.html          (CIA intelligence hub)
 *   2. /dashboards/parties.html
 *   3. /dashboards/committees.html
 *   4. /dashboards/coalitions.html
 *   5. /dashboards/election-cycle.html
 *   6. /dashboards/seasonal-patterns.html
 *   7. /dashboards/pre-election.html
 *   8. /dashboards/anomaly-detection.html
 *   9. /dashboards/ministers.html
 *  10. /dashboards/risk.html
 *
 * Each chart entry drives a strict per-chart Cypress test asserting:
 *   - canvas / svg container exists
 *   - the chart bundle initialised window.Chart / window.d3
 *   - Chart.js attached an instance with non-empty datasets
 *   - D3 SVG contains rendered shapes
 *
 * Keep this file flat: every spec under
 * `cypress/e2e/dashboards-per-chart/` imports DASHBOARDS and uses the
 * `runDashboardSuite()` helper. New charts only need a one-line entry
 * here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export const DASHBOARDS = Object.freeze([
  {
    name: 'CIA Intelligence Hub',
    slug: 'cia-hub',
    path: '/dashboard/index.html',
    containerId: 'dashboard-content',
    isHub: true,
    loadingId: 'loading-state',
    errorId: 'error-state',
    statCards: [
      { id: 'metric-total-mps', pattern: /\d/ },
      { id: 'metric-total-parties', pattern: /\d/ },
      { id: 'metric-risk-rules', pattern: /\d/ },
      { id: 'metric-coalition-seats', pattern: /\d/ },
    ],
    charts: [
      { id: 'party-seats-chart', minDatasets: 1, minDataPoints: 8 },
      { id: 'party-cohesion-chart', minDatasets: 1, minDataPoints: 8 },
      { id: 'gender-chart', minDatasets: 1, minDataPoints: 2 },
      { id: 'experience-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'document-trends-chart', minDatasets: 1, minDataPoints: 1 },
      // `voting-heatmap` is actually a Chart.js bar/heatmap canvas, not
      // a D3 SVG (despite the legacy "heatmap" naming).
      { id: 'voting-heatmap', minDatasets: 1, minDataPoints: 1 },
    ],
    // `network-visualization` is currently a placeholder <div> rendered
    // textually by visualizations.ts (no D3 SVG yet) — track it as a
    // populated-region assertion instead of an SVG check.
    populatedRegions: [
      { id: 'network-visualization', minTextLength: 20 },
    ],
    d3Containers: [],
  },
  {
    name: 'Party Dashboard',
    slug: 'parties',
    path: '/dashboards/parties.html',
    containerId: 'party-dashboard',
    charts: [
      { id: 'partyEffectivenessChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'partyComparisonChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'partyMomentumChart', minDatasets: 1, minDataPoints: 1 },
    ],
    // `coalitionAlignmentChart` is a <div role="region"> placeholder
    // populated with HTML text by party-dashboard.ts (no D3 SVG yet) —
    // assert it has rendered content from CSV instead of an SVG.
    d3Containers: [],
    populatedRegions: [
      { id: 'coalitionAlignmentChart', minTextLength: 1 },
    ],
  },
  {
    name: 'Committee Dashboard',
    slug: 'committees',
    path: '/dashboards/committees.html',
    containerId: 'committee-dashboard',
    charts: [
      { id: 'committeeComparisonChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'decisionEffectivenessChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'seasonalPatternsChart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'committeeNetwork', minChildren: 1 },
    ],
  },
  {
    name: 'Coalition Dashboard',
    slug: 'coalitions',
    path: '/dashboards/coalitions.html',
    containerId: 'coalition-dashboard',
    charts: [
      { id: 'votingAnomalyChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'behavioralPatternsChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'decisionTrendsChart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'coalitionNetwork', minChildren: 1 },
    ],
  },
  {
    name: 'Election Cycle Dashboard',
    slug: 'election-cycle',
    path: '/dashboards/election-cycle.html',
    containerId: 'election-cycle-dashboard',
    charts: [
      { id: 'cycle-timeline-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'risk-forecast-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'temporal-trends-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'party-tier-chart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'decision-heatmap', minChildren: 1 },
    ],
  },
  {
    name: 'Seasonal Patterns Dashboard',
    slug: 'seasonal-patterns',
    path: '/dashboards/seasonal-patterns.html',
    containerId: 'seasonal-patterns-dashboard',
    charts: [
      { id: 'zscore-timeline-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'quarter-comparison-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'classification-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'qoq-change-chart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'seasonal-heatmap', minChildren: 1 },
    ],
  },
  {
    name: 'Pre-Election Dashboard',
    slug: 'pre-election',
    path: '/dashboards/pre-election.html',
    containerId: 'pre-election-dashboard',
    charts: [
      { id: 'q4-timeline-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'election-comparison-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'deviation-radar-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'party-trends-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'yoy-waterfall-chart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [],
  },
  {
    name: 'Anomaly Detection Dashboard',
    slug: 'anomaly-detection',
    path: '/dashboards/anomaly-detection.html',
    containerId: 'anomaly-detection-dashboard',
    charts: [
      { id: 'anomaly-timeline-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'zscore-distribution-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'anomaly-type-chart', minDatasets: 1, minDataPoints: 1 },
      { id: 'quarterly-frequency-chart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'severity-heatmap', minChildren: 1 },
    ],
    filters: [
      { id: 'anomaly-severity-filter', minOptions: 2 },
      { id: 'anomaly-type-filter', minOptions: 2 },
    ],
  },
  {
    name: 'Ministry Dashboard',
    slug: 'ministers',
    path: '/dashboards/ministers.html',
    containerId: 'ministry-dashboard',
    charts: [
      { id: 'ministerInfluenceChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'ministryProductivityChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'decisionImpactChart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'ministryRiskHeatMap', minChildren: 1 },
    ],
  },
  {
    name: 'Risk Dashboard',
    slug: 'risk',
    path: '/dashboards/risk.html',
    containerId: 'risk-dashboard',
    charts: [
      { id: 'riskDistributionChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'anomalyDetectionChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'crisisResilienceChart', minDatasets: 1, minDataPoints: 1 },
      { id: 'riskEvolutionChart', minDatasets: 1, minDataPoints: 1 },
    ],
    d3Containers: [
      { id: 'riskHeatMap', minChildren: 1 },
    ],
  },
]);

/**
 * Run a standard per-chart suite for a dashboard. Each spec file under
 * `cypress/e2e/dashboards-per-chart/` calls this once with its config.
 *
 * The suite asserts, in this order, for EACH chart on the page:
 *   1. The page loaded with status 200 (request).
 *   2. The dashboard container is in the DOM.
 *   3. Scrolling brings the container into view (triggers lazy loader
 *      on `/dashboards/*.html`; no-op on `/dashboard/index.html`).
 *   4. `window.Chart` and `window.d3` are registered by the bundle —
 *      this is the canary for the tree-shaking regression fixed in
 *      this PR (cia-entry shipping without Chart.js).
 *   5. For each Chart.js chart: canvas exists, Chart.getChart() returns
 *      an instance with >= minDataPoints data points spread across
 *      >= minDatasets datasets.
 *   6. For each D3 container: SVG rendered with >= minChildren child
 *      nodes (proves data was fetched, parsed, and bound).
 *
 * @param {object} cfg one entry from DASHBOARDS
 */
export function runDashboardSuite(cfg) {
  describe(`${cfg.name} — per-chart data integrity`, () => {
    beforeEach(() => {
      // No `cy.stubCIAData()`: the stub returns generic CSV that doesn't
      // match any real schema, so dashboards render empty. Use the
      // built-in `dist/cia-data/**/*.csv` fixtures (served by vite
      // preview) for true data-mapping validation.
      cy.visitDashboard(cfg.path, cfg.containerId);
    });

    it('serves the page with HTTP 200 and a hashed entry script', () => {
      cy.request(cfg.path).then((res) => {
        expect(res.status, `GET ${cfg.path}`).to.equal(200);
        expect(res.headers['content-type']).to.match(/text\/html/);
        if (cfg.isHub) {
          // CIA hub: cia-entry-*.js
          expect(res.body, 'cia-entry bundle reference').to.match(
            /<script\b[^>]*src="[^"]*\/assets\/js\/cia-entry-[A-Za-z0-9_-]+\.js"/,
          );
        } else {
          // /dashboards/*.html: hashed main-*.js bundle
          expect(res.body, 'main-*.js bundle reference').to.match(
            /<script\b[^>]*type="module"[^>]*src="\/assets\/js\/main-[A-Za-z0-9_-]+\.js"/,
          );
          expect(res.body, 'no dev-only /src/browser/main.ts path').not.to.include(
            '/src/browser/main.ts',
          );
        }
      });
    });

    it('registers Chart.js and D3 on window (bundle bootstrap fires)', () => {
      cy.waitForGlobals({ d3: (cfg.d3Containers || []).length > 0 });
    });

    if (cfg.statCards && cfg.statCards.length > 0) {
      describe('Stat cards', () => {
        cfg.statCards.forEach((stat) => {
          it(`#${stat.id} is populated with real data`, () => {
            cy.expectStatPopulated(stat.id, stat.pattern);
          });
        });
      });
    }

    if (cfg.charts && cfg.charts.length > 0) {
      describe('Chart.js charts (per-chart data validation)', () => {
        cfg.charts.forEach((chart) => {
          it(`#${chart.id} canvas exists in dashboard container`, () => {
            cy.get(`#${cfg.containerId} #${chart.id}`).should('exist');
          });

          it(`#${chart.id} renders a Chart.js instance with mapped data`, () => {
            cy.get(`#${chart.id}`).scrollIntoView();
            cy.expectChartHasData(chart.id, {
              minDatasets: chart.minDatasets,
              minDataPoints: chart.minDataPoints,
              chartType: chart.chartType,
            });
          });

          it(`#${chart.id} canvas has correct ARIA / role markup`, () => {
            cy.get(`#${chart.id}`).then(($c) => {
              const role = $c.attr('role');
              const aria = $c.attr('aria-label');
              // When role is present, it must be "img" (chart pattern).
              if (role) expect(role).to.equal('img');
              // When aria-label is present, it must be descriptive.
              if (aria) expect(aria.length).to.be.gte(3);
            });
          });
        });
      });
    }

    if (cfg.d3Containers && cfg.d3Containers.length > 0) {
      describe('D3 visualizations (per-container shape validation)', () => {
        cfg.d3Containers.forEach((d3) => {
          it(`#${d3.id} container exists`, () => {
            cy.get(`#${cfg.containerId} #${d3.id}`).should('exist');
          });

          it(`#${d3.id} renders D3 SVG with bound data`, () => {
            cy.expectD3Rendered(d3.id, {
              minChildren: d3.minChildren,
              minShapes: d3.minShapes,
            });
          });
        });
      });
    }

    if (cfg.filters && cfg.filters.length > 0) {
      describe('Dashboard filters (mapped from CSV)', () => {
        cfg.filters.forEach((filter) => {
          it(`#${filter.id} has at least ${filter.minOptions} options populated from data`, () => {
            cy.get(`#${filter.id} option`).should('have.length.gte', filter.minOptions);
          });
        });
      });
    }

    if (cfg.populatedRegions && cfg.populatedRegions.length > 0) {
      describe('Data-populated regions', () => {
        cfg.populatedRegions.forEach((region) => {
          it(`#${region.id} renders with text content from CSV data`, () => {
            cy.get(`#${region.id}`, { timeout: 15000 }).scrollIntoView();
            cy.get(`#${region.id}`, { timeout: 15000 }).should(($el) => {
              const text = ($el.text() || '').replace(/\s+/g, ' ').trim();
              expect(text.length, `#${region.id} text length`).to.be.gte(region.minTextLength ?? 1);
            });
          });
        });
      });
    }
  });
}
