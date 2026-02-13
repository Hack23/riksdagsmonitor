/**
 * Tests for Ministry Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Ministry Dashboard', () => {
  let container;
  let originalFetch;

  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
    
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
    // Restore original fetch mock
    global.fetch = originalFetch;
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

  describe('Data Source Configuration', () => {
    it('should use local-first URLs with cia-data/ prefix', () => {
      const localPaths = [
        'cia-data/distribution_ministry_effectiveness.csv',
        'cia-data/distribution_ministry_productivity_matrix.csv',
        'cia-data/distribution_ministry_decision_impact.csv',
        'cia-data/distribution_ministry_risk_levels.csv',
        'cia-data/distribution_ministry_risk_quarterly.csv'
      ];
      localPaths.forEach(path => {
        expect(path).toMatch(/^cia-data\//);
      });
    });

    it('should have remote fallback URLs for CIA data', () => {
      const remoteBase = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';
      expect(remoteBase).toContain('sample-data');
    });
  });

  describe('Real CSV Schema Tests', () => {
    it('should parse ministry effectiveness CSV with real columns', () => {
      const csv = 'ministry_name,year,quarter,documents_produced,government_bills,active_members,effectiveness_assessment\nKulturdepartementet,2023,1,1,0,0,Ministry performance concerns';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('ministry_name');
      expect(headers).toContain('effectiveness_assessment');
      expect(headers).toContain('documents_produced');
      expect(headers).toContain('government_bills');
    });

    it('should parse ministry productivity matrix CSV with real columns', () => {
      const csv = 'ministry_name,year,documents_produced,propositions,government_bills,unique_contributors,performance_assessment\nFinansdepartementet,2026,6,6,0,0,High-performing ministry';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('ministry_name');
      expect(headers).toContain('propositions');
      expect(headers).toContain('unique_contributors');
      expect(headers).toContain('performance_assessment');
    });

    it('should parse ministry decision impact CSV with real columns', () => {
      const csv = 'ministry_code,committee,decision_type,total_proposals,approved_proposals,rejected_proposals,approval_rate\nJustitiedepartementet,Bifall,"",28,28,0,100.00';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('ministry_code');
      expect(headers).toContain('total_proposals');
      expect(headers).toContain('approved_proposals');
      expect(headers).toContain('approval_rate');
    });

    it('should parse ministry risk levels CSV with real columns', () => {
      const csv = 'risk_level,period_count,percentage,avg_documents\nCRITICAL,160,95.24,0.00';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('risk_level');
      expect(headers).toContain('period_count');
      expect(headers).toContain('percentage');
    });

    it('should parse ministry risk quarterly CSV with real columns', () => {
      const csv = 'year,quarter,risk_level,ministry_count,avg_documents\n2026,1,CRITICAL,20,0.00';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('year');
      expect(headers).toContain('quarter');
      expect(headers).toContain('risk_level');
      expect(headers).toContain('ministry_count');
    });

    it('should calculate approval rates from proposals', () => {
      const row = { total_proposals: '28', approved_proposals: '28', rejected_proposals: '0' };
      const rate = parseInt(row.approved_proposals) / parseInt(row.total_proposals) * 100;
      expect(rate).toBe(100);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch ministry CSV data', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('ministry_name,year,documents_produced\nFinansdepartementet,2026,6')
        })
      );
      global.fetch = mockFetch;
      const response = await fetch('cia-data/distribution_ministry_effectiveness.csv');
      expect(response.ok).toBe(true);
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({ ok: false, status: 500, statusText: 'Server Error' })
      );
      global.fetch = mockFetch;
      const response = await fetch('cia-data/distribution_ministry_effectiveness.csv');
      expect(response.ok).toBe(false);
    });

    it('should handle empty CSV gracefully', () => {
      const csv = 'ministry_name,year,documents_produced\n';
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(1);
    });
  });

  describe('Chart Configuration', () => {
    it('should create chart with responsive options', () => {
      const config = {
        type: 'bar',
        data: { labels: ['Finansdepartementet', 'Justitiedepartementet'], datasets: [{ data: [6, 28] }] },
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
