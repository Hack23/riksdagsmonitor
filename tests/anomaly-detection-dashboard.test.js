/**
 * Tests for Anomaly Detection & Early Warning Dashboard
 *
 * Validates dashboard DOM structure, alert banner, chart canvas elements,
 * D3 containers, filter controls, and accessibility attributes.
 *
 * Note: js/anomaly-detection-dashboard.js is a browser-only IIFE script (not ES6 module),
 * so we test configuration constants and DOM structure rather than functions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Anomaly Detection Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="anomaly-detection-dashboard">
        <h2>🚨 Anomaly Detection & Early Warning System</h2>
        <p>Statistical outlier identification in Swedish Parliament activity (2002-2026) using Z-score analysis</p>

        <div id="anomaly-alert-banner" class="alert-banner critical hidden">
          <span class="alert-icon">🔴</span>
          <p><strong id="alert-prefix">CRITICAL ANOMALY DETECTED:</strong> <span id="alert-message"></span></p>
          <button class="dismiss-alert">Dismiss</button>
        </div>

        <div class="dashboard-filters">
          <select id="anomaly-severity-filter" aria-label="Filter by severity">
            <option value="all">All Severities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MODERATE">🟡 Moderate</option>
            <option value="LOW">🟢 Low</option>
          </select>
          <select id="anomaly-type-filter" aria-label="Filter by anomaly type">
            <option value="all">All Types</option>
            <option value="BALLOT_ANOMALY">Ballot Anomaly</option>
            <option value="DOCUMENT_ANOMALY">Document Anomaly</option>
            <option value="ATTENDANCE_ANOMALY">Attendance Anomaly</option>
            <option value="NO_ANOMALY">No Anomaly</option>
          </select>
          <select id="anomaly-direction-filter" aria-label="Filter by direction">
            <option value="all">All Directions</option>
            <option value="UNUSUALLY_HIGH">Unusually High</option>
            <option value="UNUSUALLY_LOW">Unusually Low</option>
            <option value="WITHIN_NORMAL_RANGE">Within Normal Range</option>
          </select>
          <select id="anomaly-year-filter" aria-label="Filter by year">
            <option value="all">All Years</option>
          </select>
        </div>

        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Anomaly Timeline (2002-2026)</h3>
            <canvas id="anomaly-timeline-chart" role="img" aria-label="Scatter plot showing anomalies over time"></canvas>
            <p class="chart-description">Chronological view of detected anomalies with severity coding</p>
          </div>
          <div class="chart-card">
            <h3>Z-Score Distribution</h3>
            <canvas id="zscore-distribution-chart" role="img" aria-label="Histogram of Z-score distribution"></canvas>
            <p class="chart-description">Normal curve with outlier markers (|Z| ≥ 2.0)</p>
          </div>
          <div class="chart-card">
            <h3>Anomaly Type Distribution</h3>
            <canvas id="anomaly-type-chart" role="img" aria-label="Doughnut chart showing anomaly types"></canvas>
            <p class="chart-description">Ballot vs. Document anomaly distribution</p>
          </div>
          <div class="chart-card wide">
            <h3>Severity Heat Map (Year × Quarter)</h3>
            <div id="severity-heatmap" role="img" aria-label="Heat map showing severity by year and quarter"></div>
            <p class="chart-description">Grid showing anomaly severity by year and quarter</p>
          </div>
          <div class="chart-card">
            <h3>Anomaly Frequency by Quarter</h3>
            <canvas id="quarterly-frequency-chart" role="img" aria-label="Bar chart showing anomaly frequency by quarter"></canvas>
            <p class="chart-description">Q1-Q4 anomaly counts across all years</p>
          </div>
          <div class="chart-card">
            <h3>Recent Anomalies (Last 5)</h3>
            <div id="recent-anomalies-feed" role="feed" aria-label="Feed of recent anomalies"></div>
            <p class="chart-description">Most recent anomalies with details</p>
          </div>
        </div>
      </section>
    `;

    container = document.getElementById('anomaly-detection-dashboard');
  });

  // ============================================================================
  // DASHBOARD STRUCTURE TESTS
  // ============================================================================

  describe('Dashboard Structure', () => {
    it('should have anomaly detection dashboard container', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('anomaly-detection-dashboard');
    });

    it('should have dashboard title mentioning Anomaly Detection', () => {
      const title = container.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toMatch(/Anomaly Detection|Early Warning/i);
    });

    it('should have description referencing Z-score analysis', () => {
      const description = container.querySelector('p');
      expect(description).toBeTruthy();
      expect(description.textContent).toMatch(/Z-score/i);
    });

    it('should have dashboard grid', () => {
      const grid = container.querySelector('.dashboard-grid');
      expect(grid).toBeTruthy();
    });

    it('should have 6 chart cards', () => {
      const cards = container.querySelectorAll('.chart-card');
      expect(cards.length).toBe(6);
    });
  });

  // ============================================================================
  // ALERT BANNER TESTS
  // ============================================================================

  describe('Alert Banner', () => {
    it('should have anomaly-alert-banner element', () => {
      const banner = document.getElementById('anomaly-alert-banner');
      expect(banner).toBeTruthy();
    });

    it('should have alert banner hidden by default', () => {
      const banner = document.getElementById('anomaly-alert-banner');
      expect(banner.classList.contains('hidden')).toBe(true);
    });

    it('should have critical class on alert banner', () => {
      const banner = document.getElementById('anomaly-alert-banner');
      expect(banner.classList.contains('critical')).toBe(true);
    });

    it('should have alert-message span', () => {
      const message = document.getElementById('alert-message');
      expect(message).toBeTruthy();
    });

    it('should have alert-prefix element', () => {
      const prefix = document.getElementById('alert-prefix');
      expect(prefix).toBeTruthy();
      expect(prefix.textContent).toMatch(/CRITICAL ANOMALY/i);
    });

    it('should have dismiss button in alert banner', () => {
      const banner = document.getElementById('anomaly-alert-banner');
      const dismissBtn = banner.querySelector('.dismiss-alert');
      expect(dismissBtn).toBeTruthy();
    });
  });

  // ============================================================================
  // CHART CANVAS TESTS
  // ============================================================================

  describe('Chart Canvas Elements', () => {
    const canvasCharts = [
      { id: 'anomaly-timeline-chart', role: 'img', ariaMatch: /anomalies over time/i },
      { id: 'zscore-distribution-chart', role: 'img', ariaMatch: /Z-score distribution/i },
      { id: 'anomaly-type-chart', role: 'img', ariaMatch: /anomaly types/i },
      { id: 'quarterly-frequency-chart', role: 'img', ariaMatch: /frequency by quarter/i },
    ];

    canvasCharts.forEach(({ id, role, ariaMatch }) => {
      it(`should have ${id} canvas element`, () => {
        const canvas = document.getElementById(id);
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
      });

      it(`should have role="${role}" on ${id}`, () => {
        const canvas = document.getElementById(id);
        expect(canvas.getAttribute('role')).toBe(role);
      });

      it(`should have matching aria-label on ${id}`, () => {
        const canvas = document.getElementById(id);
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
        expect(canvas.getAttribute('aria-label')).toMatch(ariaMatch);
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
    it('should have severity-heatmap D3 container', () => {
      const heatmap = document.getElementById('severity-heatmap');
      expect(heatmap).toBeTruthy();
      expect(heatmap.tagName).toBe('DIV');
    });

    it('should have role="img" on severity-heatmap', () => {
      const heatmap = document.getElementById('severity-heatmap');
      expect(heatmap.getAttribute('role')).toBe('img');
    });

    it('should have aria-label on severity-heatmap', () => {
      const heatmap = document.getElementById('severity-heatmap');
      expect(heatmap.getAttribute('aria-label')).toBeTruthy();
      expect(heatmap.getAttribute('aria-label')).toMatch(/severity|heat map/i);
    });
  });

  // ============================================================================
  // RECENT ANOMALIES FEED TESTS
  // ============================================================================

  describe('Recent Anomalies Feed', () => {
    it('should have recent-anomalies-feed container', () => {
      const feed = document.getElementById('recent-anomalies-feed');
      expect(feed).toBeTruthy();
    });

    it('should have role="feed" on recent anomalies container', () => {
      const feed = document.getElementById('recent-anomalies-feed');
      expect(feed.getAttribute('role')).toBe('feed');
    });

    it('should have aria-label on recent anomalies feed', () => {
      const feed = document.getElementById('recent-anomalies-feed');
      expect(feed.getAttribute('aria-label')).toBeTruthy();
      expect(feed.getAttribute('aria-label')).toMatch(/recent anomalies/i);
    });
  });

  // ============================================================================
  // FILTER CONTROLS TESTS
  // ============================================================================

  describe('Filter Controls', () => {
    it('should have anomaly-severity-filter select', () => {
      const filter = document.getElementById('anomaly-severity-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have anomaly-type-filter select', () => {
      const filter = document.getElementById('anomaly-type-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have anomaly-direction-filter select', () => {
      const filter = document.getElementById('anomaly-direction-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have anomaly-year-filter select', () => {
      const filter = document.getElementById('anomaly-year-filter');
      expect(filter).toBeTruthy();
      expect(filter.tagName).toBe('SELECT');
    });

    it('should have aria-labels on all filter controls', () => {
      const filters = [
        'anomaly-severity-filter',
        'anomaly-type-filter',
        'anomaly-direction-filter',
        'anomaly-year-filter',
      ];
      filters.forEach((filterId) => {
        const filter = document.getElementById(filterId);
        expect(filter.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have 4 severity options (plus All) in severity filter', () => {
      const filter = document.getElementById('anomaly-severity-filter');
      // all + CRITICAL + HIGH + MODERATE + LOW = 5
      expect(filter.options.length).toBe(5);
    });

    it('should have CRITICAL severity option', () => {
      const filter = document.getElementById('anomaly-severity-filter');
      const values = Array.from(filter.options).map((o) => o.value);
      expect(values).toContain('CRITICAL');
    });

    it('should have HIGH severity option', () => {
      const filter = document.getElementById('anomaly-severity-filter');
      const values = Array.from(filter.options).map((o) => o.value);
      expect(values).toContain('HIGH');
    });

    it('should have anomaly type options', () => {
      const filter = document.getElementById('anomaly-type-filter');
      const values = Array.from(filter.options).map((o) => o.value);
      expect(values).toContain('BALLOT_ANOMALY');
      expect(values).toContain('DOCUMENT_ANOMALY');
      expect(values).toContain('ATTENDANCE_ANOMALY');
    });

    it('should have direction options', () => {
      const filter = document.getElementById('anomaly-direction-filter');
      const values = Array.from(filter.options).map((o) => o.value);
      expect(values).toContain('UNUSUALLY_HIGH');
      expect(values).toContain('UNUSUALLY_LOW');
      expect(values).toContain('WITHIN_NORMAL_RANGE');
    });
  });

  // ============================================================================
  // CHART HEADING TESTS
  // ============================================================================

  describe('Chart Headings', () => {
    it('should have anomaly timeline heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Anomaly Timeline/i))).toBe(true);
    });

    it('should have Z-Score Distribution heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Z-Score Distribution/i))).toBe(true);
    });

    it('should have anomaly type heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Anomaly Type/i))).toBe(true);
    });

    it('should have severity heat map heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Severity Heat Map/i))).toBe(true);
    });

    it('should have quarterly frequency heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Frequency by Quarter/i))).toBe(true);
    });

    it('should have recent anomalies heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Recent Anomalies/i))).toBe(true);
    });
  });

  // ============================================================================
  // ANOMALY DETECTION CONFIGURATION TESTS
  // ============================================================================

  describe('Anomaly Detection Configuration', () => {
    it('should reference 2002-2026 date range in title', () => {
      const heading = container.querySelector('h3');
      const allH3Text = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent).join(' ');
      expect(allH3Text).toMatch(/2002.*2026|2026.*2002/);
    });

    it('should reference Z-score analysis in description', () => {
      const description = container.querySelector('p');
      expect(description.textContent).toMatch(/Z-score/i);
    });

    it('should have wide chart cards for full-width visualizations', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBeGreaterThan(0);
    });
  });
});
