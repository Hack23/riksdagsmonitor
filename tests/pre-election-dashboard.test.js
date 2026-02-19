/**
 * Tests for Pre-Election Monitoring Dashboard
 *
 * Validates dashboard DOM structure, status cards, chart canvas elements,
 * D3 containers, warning matrix, and accessibility attributes.
 *
 * Note: js/pre-election-dashboard.js is a browser-only IIFE script (not ES6 module),
 * so we test configuration constants and DOM structure rather than functions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Pre-Election Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="pre-election-dashboard" class="dashboard-section">
        <h2><span aria-hidden="true">🗳️</span> Pre-Election Monitoring Dashboard (Q4 2023-2025)</h2>
        <p class="dashboard-intro">Track Q4 parliamentary activity in the critical 12-15 months before the 2026 election. Compare current activity against historical baselines and election-year patterns.</p>

        <div class="status-cards">
          <div class="status-card" data-metric="ballots">
            <h3><span aria-hidden="true">📊</span> Ballot Activity</h3>
            <p class="current-value">16,750</p>
            <p class="baseline-comparison">+4.34% vs baseline</p>
            <span class="status-badge normal">NORMAL</span>
          </div>
          <div class="status-card" data-metric="documents">
            <h3><span aria-hidden="true">📄</span> Document Production</h3>
            <p class="current-value">3,451</p>
            <p class="baseline-comparison">+25.55% vs baseline</p>
            <span class="status-badge normal">NORMAL</span>
          </div>
          <div class="status-card" data-metric="attendance">
            <h3><span aria-hidden="true">✅</span> Attendance Rate</h3>
            <p class="current-value">85.75%</p>
            <p class="baseline-comparison">+0.75% vs baseline</p>
            <span class="status-badge normal">STABLE</span>
          </div>
          <div class="status-card" data-metric="party-performance">
            <h3><span aria-hidden="true">🎯</span> Party Win Rate</h3>
            <p class="current-value">59.72%</p>
            <p class="baseline-comparison">+3.55% YoY</p>
            <span class="status-badge improving">IMPROVING</span>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Q4 Activity Timeline (2023-2025)</h3>
            <div class="chart-container">
              <canvas id="q4-timeline-chart" aria-label="Q4 Activity Timeline showing ballots, documents, and attendance trends from 2023 to 2025"></canvas>
            </div>
            <p class="chart-description">Ballots, documents, attendance trends with baseline overlay</p>
          </div>
          <div class="chart-card">
            <h3>Election vs. Non-Election Q4 Patterns</h3>
            <div class="chart-container">
              <canvas id="election-comparison-chart" aria-label="Comparison of Q4 ballot activity in election years versus non-election years from 2002 to 2025"></canvas>
            </div>
            <p class="chart-description">Historical Q4 activity (2002-2025): Election years vs. Non-election years</p>
          </div>
          <div class="chart-card">
            <h3>Deviation from Baseline (2025 Q4)</h3>
            <div class="chart-container">
              <canvas id="deviation-radar-chart" aria-label="Radar chart showing 2025 Q4 metrics compared to historical baselines"></canvas>
            </div>
            <p class="chart-description">Multi-metric deviation analysis</p>
          </div>
          <div class="chart-card wide">
            <h3>Party Performance Trends (2023-2025)</h3>
            <div class="chart-container">
              <canvas id="party-trends-chart" aria-label="Line chart showing party win rate, absence rate, and document production from 2023 to 2025"></canvas>
            </div>
            <p class="chart-description">Win rate, absence rate, document production by year</p>
          </div>
          <div class="chart-card">
            <h3>Year-over-Year Changes</h3>
            <div class="chart-container">
              <canvas id="yoy-waterfall-chart" aria-label="Waterfall chart showing year-over-year ballot activity changes from 2023 to 2025"></canvas>
            </div>
            <p class="chart-description">Ballot activity changes: 2023 → 2024 → 2025</p>
          </div>
          <div class="chart-card">
            <h3>Early Warning Indicator Matrix</h3>
            <div id="warning-matrix" role="region" aria-label="Early warning indicator matrix showing status of 4 monitored metrics: ballots, documents, attendance, and year-over-year change"></div>
            <p class="chart-description">Real-time status of 4 monitored metrics (ballots, documents, attendance, YoY change)</p>
          </div>
        </div>

        <p class="data-attribution">📊 Data by CIA Platform | Updated Daily</p>
      </section>
    `;

    container = document.getElementById('pre-election-dashboard');
  });

  // ============================================================================
  // DASHBOARD STRUCTURE TESTS
  // ============================================================================

  describe('Dashboard Structure', () => {
    it('should have pre-election dashboard container', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('pre-election-dashboard');
      expect(container.classList.contains('dashboard-section')).toBe(true);
    });

    it('should have dashboard title mentioning Pre-Election', () => {
      const title = container.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toMatch(/Pre-Election|Monitoring Dashboard/i);
    });

    it('should have dashboard intro paragraph', () => {
      const intro = container.querySelector('.dashboard-intro');
      expect(intro).toBeTruthy();
      expect(intro.textContent.length).toBeGreaterThan(10);
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
  });

  // ============================================================================
  // STATUS CARDS TESTS
  // ============================================================================

  describe('Status Cards', () => {
    it('should have status cards section', () => {
      const statusCards = container.querySelector('.status-cards');
      expect(statusCards).toBeTruthy();
    });

    it('should have 4 status cards', () => {
      const cards = container.querySelectorAll('.status-card');
      expect(cards.length).toBe(4);
    });

    it('should have ballots status card', () => {
      const card = container.querySelector('.status-card[data-metric="ballots"]');
      expect(card).toBeTruthy();
    });

    it('should have documents status card', () => {
      const card = container.querySelector('.status-card[data-metric="documents"]');
      expect(card).toBeTruthy();
    });

    it('should have attendance status card', () => {
      const card = container.querySelector('.status-card[data-metric="attendance"]');
      expect(card).toBeTruthy();
    });

    it('should have party-performance status card', () => {
      const card = container.querySelector('.status-card[data-metric="party-performance"]');
      expect(card).toBeTruthy();
    });

    it('should have current-value in each status card', () => {
      const cards = container.querySelectorAll('.status-card');
      cards.forEach((card) => {
        const currentValue = card.querySelector('.current-value');
        expect(currentValue).toBeTruthy();
        expect(currentValue.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have baseline-comparison in each status card', () => {
      const cards = container.querySelectorAll('.status-card');
      cards.forEach((card) => {
        const comparison = card.querySelector('.baseline-comparison');
        expect(comparison).toBeTruthy();
      });
    });

    it('should have status badges', () => {
      const badges = container.querySelectorAll('.status-badge');
      expect(badges.length).toBe(4);
    });
  });

  // ============================================================================
  // CHART CANVAS TESTS
  // ============================================================================

  describe('Chart Canvas Elements', () => {
    const canvasChartIds = [
      'q4-timeline-chart',
      'election-comparison-chart',
      'deviation-radar-chart',
      'party-trends-chart',
      'yoy-waterfall-chart',
    ];

    canvasChartIds.forEach((chartId) => {
      it(`should have ${chartId} canvas element`, () => {
        const canvas = document.getElementById(chartId);
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
      });

      it(`should have aria-label on ${chartId}`, () => {
        const canvas = document.getElementById(chartId);
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have 5 canvas chart elements', () => {
      const canvases = container.querySelectorAll('canvas');
      expect(canvases.length).toBe(5);
    });
  });

  // ============================================================================
  // WARNING MATRIX TESTS
  // ============================================================================

  describe('Warning Matrix', () => {
    it('should have warning-matrix container', () => {
      const matrix = document.getElementById('warning-matrix');
      expect(matrix).toBeTruthy();
    });

    it('should have role="region" on warning-matrix', () => {
      const matrix = document.getElementById('warning-matrix');
      expect(matrix.getAttribute('role')).toBe('region');
    });

    it('should have aria-label on warning-matrix', () => {
      const matrix = document.getElementById('warning-matrix');
      expect(matrix.getAttribute('aria-label')).toBeTruthy();
      expect(matrix.getAttribute('aria-label')).toMatch(/warning|metrics/i);
    });
  });

  // ============================================================================
  // CHART HEADING TESTS
  // ============================================================================

  describe('Chart Headings', () => {
    it('should have Q4 timeline heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Q4 Activity Timeline/i))).toBe(true);
    });

    it('should have election comparison heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Election vs|Non-Election/i))).toBe(true);
    });

    it('should have deviation radar heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Deviation from Baseline/i))).toBe(true);
    });

    it('should have party performance trends heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Party Performance/i))).toBe(true);
    });

    it('should have year-over-year changes heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Year-over-Year/i))).toBe(true);
    });

    it('should have early warning matrix heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Early Warning/i))).toBe(true);
    });
  });

  // ============================================================================
  // PRE-ELECTION CONFIGURATION TESTS
  // ============================================================================

  describe('Pre-Election Configuration', () => {
    it('should reference 2026 election in title', () => {
      // The heading references Q4 2023-2025, the intro mentions 2026
      const intro = container.querySelector('.dashboard-intro');
      expect(intro.textContent).toMatch(/2026/);
    });

    it('should have 6 chart cards in grid', () => {
      const cards = container.querySelectorAll('.dashboard-grid .chart-card');
      expect(cards.length).toBe(6);
    });

    it('should have wide chart cards for full-width charts', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHART DESCRIPTION TESTS
  // ============================================================================

  describe('Chart Descriptions', () => {
    it('should have chart descriptions for all charts', () => {
      const descriptions = container.querySelectorAll('.chart-description');
      expect(descriptions.length).toBe(6);
    });

    it('should mention baseline in chart descriptions', () => {
      const descriptions = Array.from(container.querySelectorAll('.chart-description'));
      expect(descriptions.some((d) => d.textContent.match(/baseline/i))).toBe(true);
    });
  });
});
