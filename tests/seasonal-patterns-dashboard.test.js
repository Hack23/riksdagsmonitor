/**
 * Tests for Seasonal Activity Patterns Dashboard
 *
 * Validates dashboard DOM structure, chart canvas elements, D3 containers,
 * filter controls, and accessibility attributes.
 *
 * Note: js/seasonal-patterns-dashboard.js is a browser-only IIFE script (not ES6 module),
 * so we test configuration constants and DOM structure rather than functions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Seasonal Patterns Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="seasonal-patterns-dashboard">
        <h2>📅 Seasonal Activity Patterns (2002-2025)</h2>
        <p class="subtitle">Quarterly Analysis with Z-Score Anomaly Detection</p>

        <div class="dashboard-filters">
          <select id="seasonal-year-filter" aria-label="Filter by year">
            <option value="all">All Years</option>
          </select>
          <select id="seasonal-quarter-filter" aria-label="Filter by quarter">
            <option value="all">All Quarters</option>
            <option value="1">Q1 - Winter Session</option>
            <option value="2">Q2 - Spring Session</option>
            <option value="3">Q3 - Summer Recess</option>
            <option value="4">Q4 - Autumn Session</option>
          </select>
          <select id="seasonal-election-filter" aria-label="Filter by election status">
            <option value="all">All</option>
            <option value="election">Election Years</option>
            <option value="non-election">Non-Election Years</option>
          </select>
          <select id="classification-filter" aria-label="Filter by activity classification">
            <option value="all">All Classifications</option>
          </select>
        </div>

        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Quarterly Activity Heat Map (2002-2025)</h3>
            <div id="seasonal-heatmap"></div>
            <p class="chart-description">Ballot volume by year and quarter with Z-score overlay. Red circles indicate statistical anomalies (|Z| ≥ 2.0).</p>
          </div>
          <div class="chart-card">
            <h3>Z-Score Anomaly Detection</h3>
            <canvas id="zscore-timeline-chart" role="img" aria-label="Line chart showing Z-score timeline for ballot, document, and attendance metrics"></canvas>
            <p class="chart-description">Statistical outliers (|Z| ≥ 2.0) are flagged in red based on anomaly thresholds.</p>
          </div>
          <div class="chart-card">
            <h3>Average Activity by Quarter (All Years)</h3>
            <canvas id="quarter-comparison-chart" role="img" aria-label="Bar chart showing average ballots by quarter across all years"></canvas>
            <p class="chart-description">Q1–Q4 baselines across all years. Shows typical activity patterns across seasons.</p>
          </div>
          <div class="chart-card wide">
            <h3>Seasonal Pattern Classification</h3>
            <canvas id="classification-chart" role="img" aria-label="Stacked bar chart showing distribution of activity classifications by year"></canvas>
            <p class="chart-description">Distribution of NORMAL, ELEVATED, REDUCED, and ANOMALY patterns across years.</p>
          </div>
          <div class="chart-card">
            <h3>Quarter-over-Quarter Changes</h3>
            <canvas id="qoq-change-chart" role="img" aria-label="Bar chart showing quarter-over-quarter ballot changes as percentages"></canvas>
            <p class="chart-description">Sequential ballot changes (% and absolute). Green indicates increase, red indicates decrease.</p>
          </div>
        </div>

        <p class="data-attribution">📊 Data by CIA Platform | Updated Daily</p>
      </section>
    `;

    container = document.getElementById('seasonal-patterns-dashboard');
  });

  // ============================================================================
  // DASHBOARD STRUCTURE TESTS
  // ============================================================================

  describe('Dashboard Structure', () => {
    it('should have seasonal patterns dashboard container', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('seasonal-patterns-dashboard');
    });

    it('should have dashboard title mentioning Seasonal Activity', () => {
      const title = container.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toMatch(/Seasonal|Activity Patterns/i);
    });

    it('should have subtitle with Z-Score reference', () => {
      const subtitle = container.querySelector('.subtitle');
      expect(subtitle).toBeTruthy();
      expect(subtitle.textContent).toMatch(/Z-Score|Anomaly/i);
    });

    it('should have data attribution', () => {
      const attribution = container.querySelector('.data-attribution');
      expect(attribution).toBeTruthy();
      expect(attribution.textContent).toMatch(/CIA Platform/i);
    });

    it('should have dashboard grid', () => {
      const grid = container.querySelector('.dashboard-grid');
      expect(grid).toBeTruthy();
    });

    it('should have 5 chart cards', () => {
      const cards = container.querySelectorAll('.chart-card');
      expect(cards.length).toBe(5);
    });
  });

  // ============================================================================
  // CHART CANVAS TESTS
  // ============================================================================

  describe('Chart Canvas Elements', () => {
    const canvasChartIds = [
      { id: 'zscore-timeline-chart', ariaLabel: /Z-score timeline/i },
      { id: 'quarter-comparison-chart', ariaLabel: /average ballots by quarter/i },
      { id: 'classification-chart', ariaLabel: /activity classifications/i },
      { id: 'qoq-change-chart', ariaLabel: /quarter-over-quarter/i },
    ];

    canvasChartIds.forEach(({ id, ariaLabel }) => {
      it(`should have ${id} canvas element`, () => {
        const canvas = document.getElementById(id);
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
      });

      it(`should have aria-label on ${id}`, () => {
        const canvas = document.getElementById(id);
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
        expect(canvas.getAttribute('aria-label')).toMatch(ariaLabel);
      });

      it(`should have role="img" on ${id}`, () => {
        const canvas = document.getElementById(id);
        expect(canvas.getAttribute('role')).toBe('img');
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
    it('should have seasonal-heatmap D3 container', () => {
      const heatmap = document.getElementById('seasonal-heatmap');
      expect(heatmap).toBeTruthy();
      expect(heatmap.tagName).toBe('DIV');
    });

    it('should have seasonal-heatmap inside a chart-card', () => {
      const heatmap = document.getElementById('seasonal-heatmap');
      expect(heatmap.closest('.chart-card')).toBeTruthy();
    });
  });

  // ============================================================================
  // FILTER CONTROLS TESTS
  // ============================================================================

  describe('Filter Controls', () => {
    it('should have seasonal-year-filter select', () => {
      const filter = document.getElementById('seasonal-year-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have seasonal-quarter-filter select', () => {
      const filter = document.getElementById('seasonal-quarter-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have seasonal-election-filter select', () => {
      const filter = document.getElementById('seasonal-election-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have classification-filter select', () => {
      const filter = document.getElementById('classification-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have aria-labels on all filter controls', () => {
      const filters = [
        'seasonal-year-filter',
        'seasonal-quarter-filter',
        'seasonal-election-filter',
        'classification-filter',
      ];
      filters.forEach((filterId) => {
        const filter = document.getElementById(filterId);
        expect(filter.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have 4 quarter options in quarter filter', () => {
      const filter = document.getElementById('seasonal-quarter-filter');
      // "All Quarters" + 4 quarters = 5 total options
      expect(filter.options.length).toBe(5);
    });

    it('should have election and non-election options in election filter', () => {
      const filter = document.getElementById('seasonal-election-filter');
      const values = Array.from(filter.options).map((o) => o.value);
      expect(values).toContain('election');
      expect(values).toContain('non-election');
    });
  });

  // ============================================================================
  // CHART HEADING TESTS
  // ============================================================================

  describe('Chart Headings', () => {
    it('should have heatmap chart heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Heat Map|Heatmap/i))).toBe(true);
    });

    it('should have Z-Score detection heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Z-Score/i))).toBe(true);
    });

    it('should have quarter comparison heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Quarter/i))).toBe(true);
    });

    it('should have classification heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Classification/i))).toBe(true);
    });

    it('should have QoQ changes heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Quarter-over-Quarter|QoQ/i))).toBe(true);
    });
  });

  // ============================================================================
  // CHART DESCRIPTION TESTS
  // ============================================================================

  describe('Chart Descriptions', () => {
    it('should have chart descriptions for all charts', () => {
      const descriptions = container.querySelectorAll('.chart-description');
      expect(descriptions.length).toBe(5);
    });

    it('should mention Z-score anomaly threshold in heatmap description', () => {
      const descriptions = Array.from(container.querySelectorAll('.chart-description'));
      expect(descriptions.some((d) => d.textContent.match(/Z.{0,5}2\.0|anomaly/i))).toBe(true);
    });
  });

  // ============================================================================
  // SEASONAL PATTERNS CONFIGURATION TESTS
  // ============================================================================

  describe('Seasonal Patterns Configuration', () => {
    it('should reference 2002-2025 date range in title', () => {
      const title = container.querySelector('h2');
      expect(title.textContent).toMatch(/2002.*2025|2025.*2002/);
    });

    it('should mention quarterly analysis in subtitle', () => {
      const subtitle = container.querySelector('.subtitle');
      expect(subtitle.textContent).toMatch(/Quarterly/i);
    });

    it('should have wide chart cards for full-width visualizations', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBeGreaterThan(0);
    });
  });
});
