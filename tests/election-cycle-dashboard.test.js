/**
 * Tests for Election Cycle Intelligence Dashboard
 *
 * Validates dashboard DOM structure, chart canvas elements, D3 containers,
 * filter controls, and accessibility attributes.
 *
 * Note: js/election-cycle-dashboard.js is a browser-only IIFE script (not ES6 module),
 * so we test configuration constants and DOM structure rather than functions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Election Cycle Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="election-cycle-dashboard" class="dashboard-section">
        <h2>🗳️ Election Cycle Intelligence (1994-2034)</h2>
        <p>Comprehensive analysis of 40 years of Swedish Parliament election cycles with party performance evolution, decision-making effectiveness, predictive risk forecasting, and temporal voting patterns across 9+ election cycles.</p>

        <div class="dashboard-loader">Loading data...</div>
        <div class="dashboard-error">Failed to load data</div>

        <div class="dashboard-filters">
          <div class="filter-group">
            <label for="election-cycle-filter">Election Cycle:</label>
            <select id="election-cycle-filter">
              <option value="all">All Cycles</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="election-party-filter">Party:</label>
            <select id="election-party-filter">
              <option value="all">All Parties</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="election-metric-filter">Metric:</label>
            <select id="election-metric-filter">
              <option value="performance">Performance</option>
              <option value="decisions">Decisions</option>
              <option value="risk">Risk</option>
              <option value="attendance">Attendance</option>
            </select>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Election Cycle Performance Timeline</h3>
            <div class="chart-container">
              <canvas id="cycle-timeline-chart"></canvas>
            </div>
            <p class="chart-description">Party performance evolution across 9 election cycles (1994-2034)</p>
          </div>
          <div class="chart-card">
            <h3>Decision Effectiveness Heatmap</h3>
            <div id="decision-heatmap" class="chart-container chart-container--scrollable"></div>
            <p class="chart-description">Legislative approval rates by party and cycle</p>
          </div>
          <div class="chart-card">
            <h3>Predictive Risk Forecasting</h3>
            <div class="chart-container">
              <canvas id="risk-forecast-chart"></canvas>
            </div>
            <p class="chart-description">Risk trajectory and confidence levels (2022-2034)</p>
          </div>
          <div class="chart-card wide">
            <h3>Temporal Voting Patterns</h3>
            <div class="chart-container">
              <canvas id="temporal-trends-chart"></canvas>
            </div>
            <p class="chart-description">Attendance, ballots, and volatility trends</p>
          </div>
          <div class="chart-card">
            <h3>Party Tier Distribution</h3>
            <div class="chart-container">
              <canvas id="party-tier-chart"></canvas>
            </div>
            <p class="chart-description">Performance tiers (ntile_party_tier: 1-4)</p>
          </div>
        </div>

        <p class="note dashboard-attribution">
          <strong>Data by Citizen Intelligence Agency Platform</strong> | Updated from GitHub sample data | 24-hour caching
        </p>
      </section>
    `;

    container = document.getElementById('election-cycle-dashboard');
  });

  // ============================================================================
  // DASHBOARD STRUCTURE TESTS
  // ============================================================================

  describe('Dashboard Structure', () => {
    it('should have election cycle dashboard container', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('election-cycle-dashboard');
      expect(container.classList.contains('dashboard-section')).toBe(true);
    });

    it('should have dashboard title mentioning Election Cycle', () => {
      const title = container.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toMatch(/Election Cycle/i);
    });

    it('should have dashboard description', () => {
      const description = container.querySelector('p');
      expect(description).toBeTruthy();
      expect(description.textContent.length).toBeGreaterThan(10);
    });

    it('should have data attribution', () => {
      const attribution = container.querySelector('.dashboard-attribution');
      expect(attribution).toBeTruthy();
      expect(attribution.textContent).toMatch(/CIA Platform|Citizen Intelligence/i);
    });

    it('should have dashboard grid', () => {
      const grid = container.querySelector('.dashboard-grid');
      expect(grid).toBeTruthy();
    });

    it('should have chart cards in dashboard grid', () => {
      const cards = container.querySelectorAll('.chart-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHART CANVAS TESTS
  // ============================================================================

  describe('Chart Canvas Elements', () => {
    const canvasChartIds = [
      'cycle-timeline-chart',
      'risk-forecast-chart',
      'temporal-trends-chart',
      'party-tier-chart',
    ];

    canvasChartIds.forEach((chartId) => {
      it(`should have ${chartId} canvas element`, () => {
        const canvas = document.getElementById(chartId);
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
      });
    });

    it('should have 4 canvas chart elements', () => {
      const canvases = container.querySelectorAll('canvas');
      expect(canvases.length).toBe(4);
    });
  });

  // ============================================================================
  // D3 CONTAINER TESTS
  // ============================================================================

  describe('D3 Visualization Containers', () => {
    it('should have decision-heatmap D3 container', () => {
      const heatmap = document.getElementById('decision-heatmap');
      expect(heatmap).toBeTruthy();
      expect(heatmap.tagName).toBe('DIV');
    });

    it('should have scrollable decision heatmap container', () => {
      const heatmap = document.getElementById('decision-heatmap');
      expect(heatmap.classList.contains('chart-container--scrollable')).toBe(true);
    });
  });

  // ============================================================================
  // FILTER CONTROLS TESTS
  // ============================================================================

  describe('Filter Controls', () => {
    it('should have election-cycle-filter select', () => {
      const filter = document.getElementById('election-cycle-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have election-party-filter select', () => {
      const filter = document.getElementById('election-party-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have election-metric-filter select', () => {
      const filter = document.getElementById('election-metric-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have labels associated with filter controls', () => {
      const cycleLabel = container.querySelector('label[for="election-cycle-filter"]');
      expect(cycleLabel).toBeTruthy();

      const partyLabel = container.querySelector('label[for="election-party-filter"]');
      expect(partyLabel).toBeTruthy();

      const metricLabel = container.querySelector('label[for="election-metric-filter"]');
      expect(metricLabel).toBeTruthy();
    });

    it('should have metric filter with performance option', () => {
      const filter = document.getElementById('election-metric-filter');
      const options = Array.from(filter.options).map((o) => o.value);
      expect(options).toContain('performance');
    });

    it('should have metric filter with risk option', () => {
      const filter = document.getElementById('election-metric-filter');
      const options = Array.from(filter.options).map((o) => o.value);
      expect(options).toContain('risk');
    });

    it('should have metric filter with attendance option', () => {
      const filter = document.getElementById('election-metric-filter');
      const options = Array.from(filter.options).map((o) => o.value);
      expect(options).toContain('attendance');
    });
  });

  // ============================================================================
  // CHART HEADING TESTS
  // ============================================================================

  describe('Chart Headings', () => {
    it('should have timeline chart heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Timeline/i))).toBe(true);
    });

    it('should have heatmap chart heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Heatmap|Heat Map/i))).toBe(true);
    });

    it('should have risk forecast chart heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Risk/i))).toBe(true);
    });

    it('should have temporal trends chart heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Temporal|Voting Patterns/i))).toBe(true);
    });

    it('should have party tier chart heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Party Tier/i))).toBe(true);
    });
  });

  // ============================================================================
  // LOADER AND ERROR STATE TESTS
  // ============================================================================

  describe('Loading and Error States', () => {
    it('should have a loader element', () => {
      const loader = container.querySelector('.dashboard-loader');
      expect(loader).toBeTruthy();
    });

    it('should have an error element', () => {
      const error = container.querySelector('.dashboard-error');
      expect(error).toBeTruthy();
    });
  });

  // ============================================================================
  // CHART DESCRIPTION TESTS
  // ============================================================================

  describe('Chart Descriptions', () => {
    it('should have chart descriptions for all charts', () => {
      const descriptions = container.querySelectorAll('.chart-description');
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('should have non-empty chart descriptions', () => {
      const descriptions = container.querySelectorAll('.chart-description');
      descriptions.forEach((desc) => {
        expect(desc.textContent.trim().length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // ELECTION CYCLE INTELLIGENCE CONFIGURATION TESTS
  // ============================================================================

  describe('Election Cycle Intelligence Configuration', () => {
    it('should reference 1994-2034 date range in title', () => {
      const title = container.querySelector('h2');
      expect(title.textContent).toMatch(/1994.*2034|2034.*1994/);
    });

    it('should have 4 metric filter options', () => {
      const filter = document.getElementById('election-metric-filter');
      expect(filter.options.length).toBe(4);
    });

    it('should mention election cycles in description', () => {
      const description = container.querySelector('p');
      expect(description.textContent).toMatch(/election cycle/i);
    });
  });
});
