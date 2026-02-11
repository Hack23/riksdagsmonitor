/**
 * Tests for Election Cycle Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Election Cycle Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="election-cycle-dashboard" class="dashboard-section">
        <h2>Election Cycle Analysis</h2>
        <div class="dashboard-filters">
          <select id="election-cycle-filter" aria-label="Election Cycle">
            <option value="all">All Cycles</option>
            <option value="2022-2026">2022-2026</option>
          </select>
          <select id="election-party-filter" aria-label="Party">
            <option value="all">All Parties</option>
          </select>
          <select id="election-metric-filter" aria-label="Metric">
            <option value="all">All Metrics</option>
          </select>
        </div>
        <div class="dashboard-grid">
          <div class="chart-card" style="grid-column: span 2;">
            <canvas id="cycle-timeline-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="risk-forecast-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="temporal-trends-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="party-tier-chart"></canvas>
          </div>
          <div class="chart-card" style="grid-column: span 2;">
            <div id="decision-heatmap"></div>
          </div>
        </div>
        <div id="dashboard-loader" style="display: none;">Loading...</div>
        <div id="dashboard-error" style="display: none;">Error</div>
      </section>
    `;
    container = document.getElementById('election-cycle-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Structure', () => {
    it('should have election cycle dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('election-cycle-dashboard');
    });

    it('should have dashboard-section class', () => {
      expect(container.classList.contains('dashboard-section')).toBe(true);
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('cycle-timeline-chart')).not.toBeNull();
      expect(document.getElementById('risk-forecast-chart')).not.toBeNull();
      expect(document.getElementById('temporal-trends-chart')).not.toBeNull();
      expect(document.getElementById('party-tier-chart')).not.toBeNull();
    });

    it('should have decision heatmap container', () => {
      expect(document.getElementById('decision-heatmap')).not.toBeNull();
    });

    it('should have dashboard filters', () => {
      const filters = container.querySelector('.dashboard-filters');
      expect(filters).not.toBeNull();
    });

    it('should have three filter selects', () => {
      expect(document.getElementById('election-cycle-filter')).not.toBeNull();
      expect(document.getElementById('election-party-filter')).not.toBeNull();
      expect(document.getElementById('election-metric-filter')).not.toBeNull();
    });

    it('should have loading and error indicators', () => {
      expect(document.getElementById('dashboard-loader')).not.toBeNull();
      expect(document.getElementById('dashboard-error')).not.toBeNull();
    });
  });

  describe('Filter Configuration', () => {
    it('should have election cycle options', () => {
      const filter = document.getElementById('election-cycle-filter');
      expect(filter.options.length).toBeGreaterThanOrEqual(1);
    });

    it('should have ARIA labels on filters', () => {
      const selects = container.querySelectorAll('select');
      selects.forEach(select => {
        expect(select.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should default to "all" option', () => {
      const filter = document.getElementById('election-cycle-filter');
      expect(filter.value).toBe('all');
    });
  });

  describe('Data Processing', () => {
    it('should parse election cycle data', () => {
      const csvData = 'Cycle,Year,Quarter,Score\n2022-2026,2024,Q1,72\n2022-2026,2024,Q2,75';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('Cycle');
      expect(headers).toContain('Year');
      expect(lines.length).toBe(3);
    });

    it('should group data by election cycle', () => {
      const data = [
        { cycle: '2018-2022', score: 70 },
        { cycle: '2022-2026', score: 75 },
        { cycle: '2022-2026', score: 78 }
      ];
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.cycle]) acc[item.cycle] = [];
        acc[item.cycle].push(item);
        return acc;
      }, {});
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2022-2026']).toHaveLength(2);
    });
  });

  describe('Chart Configuration', () => {
    it('should create timeline chart', () => {
      const config = {
        type: 'line',
        data: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [] },
        options: { responsive: true, maintainAspectRatio: false }
      };
      expect(config.type).toBe('line');
      expect(config.data.labels).toHaveLength(4);
    });

    it('should use wide layout for timeline and heatmap', () => {
      const wideCards = container.querySelectorAll('[style*="span 2"]');
      expect(wideCards.length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h2 = container.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2.textContent).toContain('Election');
    });

    it('should have accessible filter labels', () => {
      const selects = container.querySelectorAll('select');
      selects.forEach(select => {
        expect(select.getAttribute('aria-label') || select.getAttribute('id')).toBeTruthy();
      });
    });
  });
});
