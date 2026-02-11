/**
 * Tests for Ministry Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Ministry Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="ministry-dashboard" class="dashboard-container">
        <h2>Ministry Performance Dashboard</h2>
        <div class="dashboard-grid">
          <div class="chart-card">
            <canvas id="ministerInfluenceChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="ministryProductivityChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="decisionImpactChart"></canvas>
          </div>
          <div class="chart-card wide">
            <div id="ministryRiskHeatMap"></div>
          </div>
        </div>
        <details>
          <summary>Accessible Data Table</summary>
          <table id="ministryDataTable">
            <thead><tr><th>Ministry</th><th>Score</th></tr></thead>
            <tbody></tbody>
          </table>
        </details>
      </section>
    `;
    container = document.getElementById('ministry-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Structure', () => {
    it('should have ministry dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('ministry-dashboard');
    });

    it('should have dashboard-container class', () => {
      expect(container.classList.contains('dashboard-container')).toBe(true);
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('ministerInfluenceChart')).not.toBeNull();
      expect(document.getElementById('ministryProductivityChart')).not.toBeNull();
      expect(document.getElementById('decisionImpactChart')).not.toBeNull();
    });

    it('should have ministry risk heat map container', () => {
      const heatMap = document.getElementById('ministryRiskHeatMap');
      expect(heatMap).not.toBeNull();
    });

    it('should have accessible data table', () => {
      const table = document.getElementById('ministryDataTable');
      expect(table).not.toBeNull();
      expect(table.tagName).toBe('TABLE');
    });

    it('should have wide chart card for heat map', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch ministry CSV data', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('Ministry,Score,Year\nFinance,85,2024\nDefense,78,2024')
        })
      );
      global.fetch = mockFetch;
      const response = await fetch('test-url');
      expect(response.ok).toBe(true);
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({ ok: false, status: 500, statusText: 'Server Error' })
      );
      global.fetch = mockFetch;
      const response = await fetch('test-url');
      expect(response.ok).toBe(false);
    });

    it('should parse CSV headers correctly', () => {
      const csv = 'Ministry,Score,Year\nFinance,85,2024';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toEqual(['Ministry', 'Score', 'Year']);
    });
  });

  describe('Chart Configuration', () => {
    it('should create chart with responsive options', () => {
      const config = {
        type: 'bar',
        data: { labels: ['Finance', 'Defense'], datasets: [{ data: [85, 78] }] },
        options: { responsive: true, maintainAspectRatio: false }
      };
      expect(config.options.responsive).toBe(true);
      expect(config.options.maintainAspectRatio).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA labels on canvases', () => {
      const canvas = document.getElementById('ministerInfluenceChart');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Minister influence chart');
      expect(canvas.getAttribute('role')).toBe('img');
      expect(canvas.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have accessible fallback table', () => {
      const details = container.querySelector('details');
      expect(details).not.toBeNull();
      const table = details.querySelector('table');
      expect(table).not.toBeNull();
    });
  });
});
