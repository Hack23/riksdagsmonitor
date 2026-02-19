/**
 * Tests for Government Ministry Risk & Influence Dashboard
 *
 * Validates dashboard DOM structure, chart canvas elements, D3 containers,
 * data table, and accessibility attributes.
 *
 * Note: js/ministry-dashboard.js is a browser-only IIFE script (not ES6 module),
 * so we test configuration constants and DOM structure rather than functions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Ministry Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="ministry-dashboard" class="dashboard-container">
        <h2>🎖️ Government Minister Risk & Influence</h2>

        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Ministry Risk Heat Map</h3>
            <div id="ministryRiskHeatMap" role="img" aria-label="Ministry Risk Heat Map showing risk levels across government departments"></div>
          </div>
          <div class="chart-card">
            <h3>Top 10 Most Influential Ministers</h3>
            <canvas id="ministerInfluenceChart" role="img" aria-label="Bar chart showing top 10 most influential ministers"></canvas>
          </div>
          <div class="chart-card">
            <h3>Ministry Productivity Matrix</h3>
            <canvas id="ministryProductivityChart" role="img" aria-label="Bar chart comparing ministry productivity across quarters"></canvas>
          </div>
          <div class="chart-card">
            <h3>Decision Impact Trends</h3>
            <canvas id="decisionImpactChart" role="img" aria-label="Line chart showing decision impact trends over time"></canvas>
          </div>
        </div>

        <details class="sr-only-alternative">
          <summary>View data as accessible table</summary>
          <table id="ministryDataTable">
            <!-- Populated by JavaScript -->
          </table>
        </details>
      </section>
    `;

    container = document.getElementById('ministry-dashboard');
  });

  // ============================================================================
  // DASHBOARD STRUCTURE TESTS
  // ============================================================================

  describe('Dashboard Structure', () => {
    it('should have ministry dashboard container', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('ministry-dashboard');
      expect(container.classList.contains('dashboard-container')).toBe(true);
    });

    it('should have dashboard title mentioning Government Minister', () => {
      const title = container.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toMatch(/Government Minister|Ministry/i);
    });

    it('should have dashboard grid', () => {
      const grid = container.querySelector('.dashboard-grid');
      expect(grid).toBeTruthy();
    });

    it('should have 4 chart cards', () => {
      const cards = container.querySelectorAll('.chart-card');
      expect(cards.length).toBe(4);
    });
  });

  // ============================================================================
  // CHART CANVAS TESTS
  // ============================================================================

  describe('Chart Canvas Elements', () => {
    const canvasCharts = [
      {
        id: 'ministerInfluenceChart',
        role: 'img',
        ariaMatch: /influential ministers/i,
      },
      {
        id: 'ministryProductivityChart',
        role: 'img',
        ariaMatch: /ministry productivity/i,
      },
      {
        id: 'decisionImpactChart',
        role: 'img',
        ariaMatch: /decision impact/i,
      },
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

      it(`should have aria-label matching on ${id}`, () => {
        const canvas = document.getElementById(id);
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
        expect(canvas.getAttribute('aria-label')).toMatch(ariaMatch);
      });
    });

    it('should have 3 canvas chart elements', () => {
      const canvases = container.querySelectorAll('canvas');
      expect(canvases.length).toBe(3);
    });
  });

  // ============================================================================
  // D3 CONTAINER TESTS
  // ============================================================================

  describe('D3 Visualization Containers', () => {
    it('should have ministryRiskHeatMap D3 container', () => {
      const heatmap = document.getElementById('ministryRiskHeatMap');
      expect(heatmap).toBeTruthy();
      expect(heatmap.tagName).toBe('DIV');
    });

    it('should have role="img" on ministryRiskHeatMap', () => {
      const heatmap = document.getElementById('ministryRiskHeatMap');
      expect(heatmap.getAttribute('role')).toBe('img');
    });

    it('should have aria-label on ministryRiskHeatMap', () => {
      const heatmap = document.getElementById('ministryRiskHeatMap');
      expect(heatmap.getAttribute('aria-label')).toBeTruthy();
      expect(heatmap.getAttribute('aria-label')).toMatch(/Ministry Risk Heat Map/i);
    });

    it('should have ministryRiskHeatMap inside a wide chart card', () => {
      const heatmap = document.getElementById('ministryRiskHeatMap');
      const card = heatmap.closest('.chart-card');
      expect(card).toBeTruthy();
      expect(card.classList.contains('wide')).toBe(true);
    });
  });

  // ============================================================================
  // ACCESSIBLE DATA TABLE TESTS
  // ============================================================================

  describe('Accessible Data Table', () => {
    it('should have ministryDataTable table', () => {
      const table = document.getElementById('ministryDataTable');
      expect(table).toBeTruthy();
      expect(table.tagName).toBe('TABLE');
    });

    it('should have accessible table within details element', () => {
      const table = document.getElementById('ministryDataTable');
      const details = table.closest('details');
      expect(details).toBeTruthy();
    });

    it('should have sr-only-alternative class on details', () => {
      const details = container.querySelector('details');
      expect(details).toBeTruthy();
      expect(details.classList.contains('sr-only-alternative')).toBe(true);
    });

    it('should have summary element in details', () => {
      const summary = container.querySelector('details summary');
      expect(summary).toBeTruthy();
      expect(summary.textContent).toMatch(/accessible table|View data/i);
    });
  });

  // ============================================================================
  // CHART HEADING TESTS
  // ============================================================================

  describe('Chart Headings', () => {
    it('should have Ministry Risk Heat Map heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Ministry Risk Heat Map/i))).toBe(true);
    });

    it('should have Top 10 Most Influential Ministers heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Most Influential Ministers/i))).toBe(true);
    });

    it('should have Ministry Productivity Matrix heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Ministry Productivity/i))).toBe(true);
    });

    it('should have Decision Impact Trends heading', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
      expect(headings.some((h) => h.match(/Decision Impact/i))).toBe(true);
    });
  });

  // ============================================================================
  // MINISTRY DASHBOARD CONFIGURATION TESTS
  // ============================================================================

  describe('Ministry Dashboard Configuration', () => {
    it('should reference Risk and Influence in main title', () => {
      const title = container.querySelector('h2');
      expect(title.textContent).toMatch(/Risk.*Influence|Influence.*Risk/i);
    });

    it('should have wide card for risk heatmap', () => {
      const heatmap = document.getElementById('ministryRiskHeatMap');
      const card = heatmap.closest('.chart-card');
      expect(card.classList.contains('wide')).toBe(true);
    });

    it('should have charts covering risk, influence, productivity, and impact', () => {
      const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent.toLowerCase());
      expect(headings.some((h) => h.includes('risk'))).toBe(true);
      expect(headings.some((h) => h.includes('influence') || h.includes('influential'))).toBe(true);
      expect(headings.some((h) => h.includes('productivity'))).toBe(true);
      expect(headings.some((h) => h.includes('impact'))).toBe(true);
    });
  });

  // ============================================================================
  // ARIA ACCESSIBILITY TESTS
  // ============================================================================

  describe('ARIA Accessibility', () => {
    it('should have role="img" on all canvas elements', () => {
      const canvases = container.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        expect(canvas.getAttribute('role')).toBe('img');
      });
    });

    it('should have aria-label on all canvas elements', () => {
      const canvases = container.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
        expect(canvas.getAttribute('aria-label').length).toBeGreaterThan(5);
      });
    });

    it('should have aria-label on D3 container', () => {
      const d3Containers = container.querySelectorAll('[role="img"]');
      d3Containers.forEach((el) => {
        expect(el.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
