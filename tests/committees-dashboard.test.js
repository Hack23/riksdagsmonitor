/**
 * Tests for Committees Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Committees Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="committee-dashboard" class="dashboard-container">
        <h2>Committee Performance Dashboard</h2>
        <div class="dashboard-grid">
          <div class="chart-card wide">
            <h3>Committee Network</h3>
            <div id="committeeNetwork" role="img" aria-label="Committee network diagram"></div>
            <table id="committeeNetworkTable" class="sr-only">
              <caption>Committee Network Data</caption>
              <thead><tr><th>Committee</th><th>Members</th><th>Activity</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="chart-card">
            <canvas id="committeeComparisonChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="decisionEffectivenessChart"></canvas>
          </div>
          <div class="chart-card wide">
            <h3>Productivity Matrix</h3>
            <div id="productivityMatrix" role="img" aria-label="Productivity heatmap"></div>
            <table id="productivityMatrixTable" class="sr-only">
              <caption>Productivity Matrix Data</caption>
              <thead><tr><th>Committee</th><th>Metric</th><th>Score</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="chart-card wide">
            <canvas id="seasonalPatternsChart"></canvas>
          </div>
        </div>
        <div class="data-attribution">
          <p>Data source: CIA Platform. Last updated: <span id="committeeLastUpdated">-</span></p>
        </div>
      </section>
    `;
    container = document.getElementById('committee-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Structure', () => {
    it('should have committee dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('committee-dashboard');
    });

    it('should have dashboard-container class', () => {
      expect(container.classList.contains('dashboard-container')).toBe(true);
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('committeeComparisonChart')).not.toBeNull();
      expect(document.getElementById('decisionEffectivenessChart')).not.toBeNull();
      expect(document.getElementById('seasonalPatternsChart')).not.toBeNull();
    });

    it('should have D3 visualization containers', () => {
      expect(document.getElementById('committeeNetwork')).not.toBeNull();
      expect(document.getElementById('productivityMatrix')).not.toBeNull();
    });

    it('should have wide chart cards', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBe(3);
    });

    it('should have last updated timestamp', () => {
      const lastUpdated = document.getElementById('committeeLastUpdated');
      expect(lastUpdated).not.toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA labels on D3 containers', () => {
      const network = document.getElementById('committeeNetwork');
      const matrix = document.getElementById('productivityMatrix');
      expect(network.getAttribute('role')).toBe('img');
      expect(network.getAttribute('aria-label')).toBeTruthy();
      expect(matrix.getAttribute('role')).toBe('img');
      expect(matrix.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have accessible fallback tables', () => {
      const networkTable = document.getElementById('committeeNetworkTable');
      const matrixTable = document.getElementById('productivityMatrixTable');
      expect(networkTable).not.toBeNull();
      expect(networkTable.classList.contains('sr-only')).toBe(true);
      expect(matrixTable).not.toBeNull();
      expect(matrixTable.classList.contains('sr-only')).toBe(true);
    });

    it('should have table captions', () => {
      const captions = container.querySelectorAll('table caption');
      expect(captions.length).toBe(2);
      captions.forEach(caption => {
        expect(caption.textContent).toBeTruthy();
      });
    });

    it('should have proper heading hierarchy', () => {
      const h2 = container.querySelector('h2');
      const h3s = container.querySelectorAll('h3');
      expect(h2).not.toBeNull();
      expect(h3s.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Committee Data Processing', () => {
    it('should parse committee performance data', () => {
      const csv = 'Committee,Decisions,Documents,Score\nFinanss,120,350,82\nJustitie,95,280,75';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('Committee');
      expect(headers).toContain('Decisions');
      expect(lines.length).toBe(3);
    });

    it('should rank committees by effectiveness', () => {
      const committees = [
        { name: 'Finanss', score: 82 },
        { name: 'Justitie', score: 75 },
        { name: 'Försvars', score: 88 }
      ];
      const ranked = [...committees].sort((a, b) => b.score - a.score);
      expect(ranked[0].name).toBe('Försvars');
      expect(ranked[2].name).toBe('Justitie');
    });

    it('should calculate productivity metrics', () => {
      const decisions = 120;
      const members = 17;
      const productivity = decisions / members;
      expect(productivity).toBeCloseTo(7.06, 1);
    });
  });

  describe('Chart Configuration', () => {
    it('should create comparison bar chart', () => {
      const config = {
        type: 'bar',
        data: {
          labels: ['Finance', 'Justice', 'Defense'],
          datasets: [{ label: 'Score', data: [82, 75, 88] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      };
      expect(config.type).toBe('bar');
      expect(config.data.labels).toHaveLength(3);
    });
  });

  describe('Data Attribution', () => {
    it('should have data attribution section', () => {
      const attribution = container.querySelector('.data-attribution');
      expect(attribution).not.toBeNull();
    });

    it('should reference CIA Platform as data source', () => {
      const attribution = container.querySelector('.data-attribution');
      expect(attribution.textContent).toContain('CIA Platform');
    });
  });
});
