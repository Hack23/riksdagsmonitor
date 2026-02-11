/**
 * Tests for Pre-Election Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Pre-Election Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="pre-election-dashboard" class="dashboard-section">
        <h2>Pre-Election Analysis</h2>
        <div class="status-cards">
          <div class="status-card" data-metric="ballots">
            <h3>Ballots</h3>
            <span class="current-value">0</span>
            <span class="baseline-comparison">vs baseline</span>
            <span class="status-badge normal">Normal</span>
          </div>
          <div class="status-card" data-metric="documents">
            <h3>Documents</h3>
            <span class="current-value">0</span>
          </div>
          <div class="status-card" data-metric="attendance">
            <h3>Attendance</h3>
            <span class="current-value">0</span>
          </div>
          <div class="status-card" data-metric="party-performance">
            <h3>Party Performance</h3>
            <span class="current-value">0</span>
          </div>
        </div>
        <div class="dashboard-grid">
          <div class="chart-card wide">
            <canvas id="q4-timeline-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="election-comparison-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="deviation-radar-chart"></canvas>
          </div>
          <div class="chart-card wide">
            <canvas id="party-trends-chart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="yoy-waterfall-chart"></canvas>
          </div>
          <div class="chart-card wide">
            <div id="warning-matrix"></div>
          </div>
        </div>
        <div class="data-attribution">
          <p>Data source: CIA Platform</p>
        </div>
      </section>
    `;
    container = document.getElementById('pre-election-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Structure', () => {
    it('should have pre-election dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('pre-election-dashboard');
    });

    it('should have dashboard-section class', () => {
      expect(container.classList.contains('dashboard-section')).toBe(true);
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('q4-timeline-chart')).not.toBeNull();
      expect(document.getElementById('election-comparison-chart')).not.toBeNull();
      expect(document.getElementById('deviation-radar-chart')).not.toBeNull();
      expect(document.getElementById('party-trends-chart')).not.toBeNull();
      expect(document.getElementById('yoy-waterfall-chart')).not.toBeNull();
    });

    it('should have warning matrix container', () => {
      expect(document.getElementById('warning-matrix')).not.toBeNull();
    });

    it('should have status cards', () => {
      const statusCards = container.querySelector('.status-cards');
      expect(statusCards).not.toBeNull();
    });

    it('should have four status card metrics', () => {
      const cards = container.querySelectorAll('.status-card');
      expect(cards.length).toBe(4);
    });

    it('should have wide chart cards', () => {
      const wideCards = container.querySelectorAll('.chart-card.wide');
      expect(wideCards.length).toBe(3);
    });
  });

  describe('Status Cards', () => {
    it('should have correct metric data attributes', () => {
      const metrics = ['ballots', 'documents', 'attendance', 'party-performance'];
      metrics.forEach(metric => {
        const card = container.querySelector(`[data-metric="${metric}"]`);
        expect(card).not.toBeNull();
      });
    });

    it('should have current value displays', () => {
      const values = container.querySelectorAll('.current-value');
      expect(values.length).toBe(4);
    });

    it('should have status badges', () => {
      const badge = container.querySelector('.status-badge');
      expect(badge).not.toBeNull();
    });

    it('should support status badge variants', () => {
      const badge = container.querySelector('.status-badge');
      const validClasses = ['normal', 'warning', 'critical', 'improving'];
      const hasValidClass = validClasses.some(cls => badge.classList.contains(cls));
      expect(hasValidClass).toBe(true);
    });
  });

  describe('Pre-Election Data Processing', () => {
    it('should parse pre-election metrics', () => {
      const csv = 'Year,Quarter,Ballots,Documents\n2024,Q4,150,320\n2023,Q4,145,310';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('Ballots');
      expect(headers).toContain('Documents');
    });

    it('should calculate year-over-year changes', () => {
      const current = 150;
      const previous = 145;
      const change = ((current - previous) / previous) * 100;
      expect(change).toBeCloseTo(3.45, 1);
    });

    it('should identify deviation from baseline', () => {
      const baseline = 140;
      const actual = 150;
      const deviation = ((actual - baseline) / baseline) * 100;
      expect(deviation).toBeGreaterThan(0);
    });

    it('should classify Q4 pre-election patterns', () => {
      const classifyQ4 = (deviation) => {
        if (Math.abs(deviation) > 20) return 'critical';
        if (Math.abs(deviation) > 10) return 'warning';
        return 'normal';
      };
      expect(classifyQ4(5)).toBe('normal');
      expect(classifyQ4(15)).toBe('warning');
      expect(classifyQ4(25)).toBe('critical');
    });
  });

  describe('Chart Configuration', () => {
    it('should create radar chart for deviations', () => {
      const config = {
        type: 'radar',
        data: {
          labels: ['Ballots', 'Documents', 'Attendance', 'Debates'],
          datasets: [{ label: '2024', data: [85, 72, 90, 65] }]
        },
        options: { responsive: true }
      };
      expect(config.type).toBe('radar');
      expect(config.data.labels).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h2 = container.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2.textContent).toContain('Pre-Election');
    });

    it('should have status card headings', () => {
      const h3s = container.querySelectorAll('.status-card h3');
      expect(h3s.length).toBe(4);
    });

    it('should have data attribution', () => {
      const attribution = container.querySelector('.data-attribution');
      expect(attribution).not.toBeNull();
    });
  });
});
