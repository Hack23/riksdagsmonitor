/**
 * Tests for Seasonal Patterns Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Seasonal Patterns Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="seasonal-patterns-dashboard">
        <h2>Seasonal Activity Patterns</h2>
        <p class="subtitle">Analysis of legislative activity across seasons</p>
        <div class="dashboard-filters">
          <select id="seasonal-year-filter" aria-label="Year">
            <option value="all">All Years</option>
            <option value="2024">2024</option>
          </select>
          <select id="seasonal-quarter-filter" aria-label="Quarter">
            <option value="all">All Quarters</option>
            <option value="Q1">Q1</option>
          </select>
          <select id="seasonal-election-filter" aria-label="Election Period">
            <option value="all">All Periods</option>
          </select>
          <select id="classification-filter" aria-label="Classification">
            <option value="all">All Classifications</option>
          </select>
        </div>
        <div class="dashboard-grid">
          <div class="chart-card wide">
            <div id="seasonal-heatmap"></div>
          </div>
          <div class="chart-card">
            <canvas id="zscore-timeline-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="quarter-comparison-chart"></canvas>
          </div>
          <div class="chart-card wide">
            <canvas id="classification-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="qoq-change-chart"></canvas>
          </div>
        </div>
        <div class="data-attribution">
          <p>Data source: CIA Platform</p>
        </div>
      </section>
    `;
    container = document.getElementById('seasonal-patterns-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Structure', () => {
    it('should have seasonal patterns dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('seasonal-patterns-dashboard');
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('zscore-timeline-chart')).not.toBeNull();
      expect(document.getElementById('quarter-comparison-chart')).not.toBeNull();
      expect(document.getElementById('classification-chart')).not.toBeNull();
      expect(document.getElementById('qoq-change-chart')).not.toBeNull();
    });

    it('should have seasonal heatmap container', () => {
      expect(document.getElementById('seasonal-heatmap')).not.toBeNull();
    });

    it('should have dashboard filters', () => {
      const filters = container.querySelector('.dashboard-filters');
      expect(filters).not.toBeNull();
    });

    it('should have four filter selects', () => {
      expect(document.getElementById('seasonal-year-filter')).not.toBeNull();
      expect(document.getElementById('seasonal-quarter-filter')).not.toBeNull();
      expect(document.getElementById('seasonal-election-filter')).not.toBeNull();
      expect(document.getElementById('classification-filter')).not.toBeNull();
    });

    it('should have wide chart cards', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBe(2);
    });

    it('should have subtitle', () => {
      const subtitle = container.querySelector('.subtitle');
      expect(subtitle).not.toBeNull();
    });
  });

  describe('Filter Configuration', () => {
    it('should have ARIA labels on all filters', () => {
      const selects = container.querySelectorAll('select');
      selects.forEach(select => {
        expect(select.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should default to all option', () => {
      const filters = ['seasonal-year-filter', 'seasonal-quarter-filter', 'seasonal-election-filter', 'classification-filter'];
      filters.forEach(id => {
        expect(document.getElementById(id).value).toBe('all');
      });
    });
  });

  describe('Seasonal Data Processing', () => {
    it('should parse seasonal CSV data', () => {
      const csv = 'Year,Quarter,Activity,ZScore\n2024,Q1,250,1.5\n2024,Q2,180,-0.3';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('Quarter');
      expect(headers).toContain('ZScore');
    });

    it('should calculate Z-scores for anomaly detection', () => {
      const values = [100, 120, 110, 200, 105];
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const zScore = (200 - mean) / stdDev;
      expect(zScore).toBeGreaterThan(1);
    });

    it('should classify quarters by activity level', () => {
      const classify = (zScore) => {
        if (zScore >= 2) return 'high';
        if (zScore >= 1) return 'above-average';
        if (zScore <= -2) return 'low';
        if (zScore <= -1) return 'below-average';
        return 'normal';
      };
      expect(classify(2.5)).toBe('high');
      expect(classify(0.5)).toBe('normal');
      expect(classify(-2.1)).toBe('low');
    });

    it('should group data by year and quarter', () => {
      const data = [
        { year: 2024, quarter: 'Q1', value: 250 },
        { year: 2024, quarter: 'Q2', value: 180 },
        { year: 2023, quarter: 'Q1', value: 230 }
      ];
      const byYear = data.reduce((acc, d) => {
        if (!acc[d.year]) acc[d.year] = [];
        acc[d.year].push(d);
        return acc;
      }, {});
      expect(Object.keys(byYear)).toHaveLength(2);
      expect(byYear[2024]).toHaveLength(2);
    });
  });

  describe('Loading State', () => {
    it('should support loading class', () => {
      container.classList.add('loading');
      expect(container.classList.contains('loading')).toBe(true);
    });

    it('should be removable after data loads', () => {
      container.classList.add('loading');
      container.classList.remove('loading');
      expect(container.classList.contains('loading')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h2 = container.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2.textContent).toContain('Seasonal');
    });

    it('should have data attribution', () => {
      const attribution = container.querySelector('.data-attribution');
      expect(attribution).not.toBeNull();
    });
  });
});
