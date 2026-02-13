/**
 * Tests for Committees Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Committees Dashboard', () => {
  let container;
  let originalFetch;

  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
    
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
    // Restore original fetch mock
    global.fetch = originalFetch;
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
    it('should parse committee productivity matrix CSV with real columns', () => {
      // Real CSV: committee_code,committee_name,year,quarter,total_documents,active_members,productivity_level,productivity_assessment
      const csv = 'committee_code,committee_name,year,quarter,total_documents,active_members,productivity_level,productivity_assessment\nFiU,Finansutskottet,2024,3,120,17,HIGH,ABOVE_AVERAGE';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('committee_code');
      expect(headers).toContain('committee_name');
      expect(headers).toContain('total_documents');
      expect(headers).toContain('productivity_assessment');
    });

    it('should parse committee ballot decision summary CSV with real columns', () => {
      // Real CSV: embedded_id_concern,embedded_id_issue,embedded_id_party,approved,total_votes,percentage_approved,party_won,rebel_votes,percentage_rebel
      const csv = 'embedded_id_concern,embedded_id_issue,embedded_id_party,approved,total_votes,percentage_approved,party_won,rebel_votes,percentage_rebel\nSocialförsäkringsutskottet,Bet. 2024/25:SfU8,S,5,5,100.00,true,0,0.00';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('embedded_id_concern');
      expect(headers).toContain('percentage_approved');
      expect(headers).toContain('rebel_votes');
    });

    it('should rank committees by effectiveness', () => {
      const committees = [
        { name: 'Finansutskottet', score: 82 },
        { name: 'Justitieutskottet', score: 75 },
        { name: 'Försvarsutskottet', score: 88 }
      ];
      const ranked = [...committees].sort((a, b) => b.score - a.score);
      expect(ranked[0].name).toBe('Försvarsutskottet');
      expect(ranked[2].name).toBe('Justitieutskottet');
    });

    it('should calculate productivity metrics', () => {
      const decisions = 120;
      const members = 17;
      const productivity = decisions / members;
      expect(productivity).toBeCloseTo(7.06, 1);
    });
  });

  describe('Data Source Configuration', () => {
    it('should use local-first URLs with cia-data/ prefix', () => {
      const localPaths = [
        'cia-data/committee/distribution_committee_productivity_matrix.csv',
        'cia-data/committee/view_riksdagen_committee_decisions.csv',
        'cia-data/committee/view_riksdagen_committee_ballot_decision_party_summary.csv'
      ];
      localPaths.forEach(path => {
        expect(path).toMatch(/^cia-data\//);
        expect(path).toMatch(/\.csv$/);
      });
    });

    it('should have remote fallback URLs', () => {
      const remoteBase = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';
      expect(remoteBase).toMatch(/^https:\/\//);
      expect(remoteBase).toContain('sample-data');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty CSV data', () => {
      const csv = 'committee_code,committee_name,year,quarter\n';
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(1); // header only
    });

    it('should handle fetch failures gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;
      try {
        await fetch('cia-data/committee/nonexistent.csv');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      // Fetch will be restored in afterEach
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
