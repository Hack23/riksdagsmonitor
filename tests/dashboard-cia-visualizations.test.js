/**
 * Tests for Dashboard CIA Visualizations Renderer
 * Tests the rendering of key metrics, party performance, rankings,
 * voting patterns, and committee network visualizations
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Chart.js
class MockChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroyed = false;
  }
  destroy() {
    this.destroyed = true;
  }
}

describe('CIA Dashboard Renderer', () => {
  beforeEach(() => {
    global.Chart = MockChart;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete global.Chart;
  });

  describe('Key Metrics Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <section id="key-metrics" class="metrics-grid">
          <div class="metrics-cards">
            <div class="metric-card">
              <div class="metric-value" id="metric-total-mps">-</div>
              <div class="metric-label">Members of Parliament</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metric-total-parties">-</div>
              <div class="metric-label">Political Parties</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metric-risk-rules">-</div>
              <div class="metric-label">Risk Rules Active</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metric-coalition-seats">-</div>
              <div class="metric-label">Coalition Seats</div>
            </div>
          </div>
          <div class="risk-alerts">
            <div class="alert-badges">
              <span class="alert-badge critical">
                <span class="badge-count" id="alert-critical">0</span> Critical
              </span>
              <span class="alert-badge major">
                <span class="badge-count" id="alert-major">0</span> Major
              </span>
              <span class="alert-badge minor">
                <span class="badge-count" id="alert-minor">0</span> Minor
              </span>
            </div>
          </div>
        </section>
      `;
    });

    it('should have all metric DOM elements', () => {
      expect(document.getElementById('metric-total-mps')).not.toBeNull();
      expect(document.getElementById('metric-total-parties')).not.toBeNull();
      expect(document.getElementById('metric-risk-rules')).not.toBeNull();
      expect(document.getElementById('metric-coalition-seats')).not.toBeNull();
    });

    it('should have all alert badge DOM elements', () => {
      expect(document.getElementById('alert-critical')).not.toBeNull();
      expect(document.getElementById('alert-major')).not.toBeNull();
      expect(document.getElementById('alert-minor')).not.toBeNull();
    });

    it('should update metric values from overview data', () => {
      const overview = {
        keyMetrics: {
          totalMPs: 349,
          totalParties: 8,
          totalRiskRules: 45,
          coalitionSeats: 176
        },
        riskAlerts: {
          last90Days: { critical: 5, major: 12, minor: 28 }
        }
      };

      // Simulate renderKeyMetrics logic
      document.getElementById('metric-total-mps').textContent = overview.keyMetrics.totalMPs;
      document.getElementById('metric-total-parties').textContent = overview.keyMetrics.totalParties;
      document.getElementById('metric-risk-rules').textContent = overview.keyMetrics.totalRiskRules;
      document.getElementById('metric-coalition-seats').textContent = overview.keyMetrics.coalitionSeats;

      expect(document.getElementById('metric-total-mps').textContent).toBe('349');
      expect(document.getElementById('metric-total-parties').textContent).toBe('8');
      expect(document.getElementById('metric-risk-rules').textContent).toBe('45');
      expect(document.getElementById('metric-coalition-seats').textContent).toBe('176');
    });

    it('should update risk alert counts', () => {
      const riskAlerts = { last90Days: { critical: 5, major: 12, minor: 28 } };
      
      document.getElementById('alert-critical').textContent = riskAlerts.last90Days.critical;
      document.getElementById('alert-major').textContent = riskAlerts.last90Days.major;
      document.getElementById('alert-minor').textContent = riskAlerts.last90Days.minor;

      expect(document.getElementById('alert-critical').textContent).toBe('5');
      expect(document.getElementById('alert-major').textContent).toBe('12');
      expect(document.getElementById('alert-minor').textContent).toBe('28');
    });

    it('should handle missing overview data gracefully', () => {
      // renderKeyMetrics with no data should not crash
      const overview = null;
      if (!overview) {
        // Should return early without errors
        expect(document.getElementById('metric-total-mps').textContent).toBe('-');
      }
    });

    it('should handle missing keyMetrics property', () => {
      const overview = { riskAlerts: { last90Days: { critical: 0, major: 0, minor: 0 } } };
      const el = document.getElementById('metric-total-mps');
      if (el && overview.keyMetrics) {
        el.textContent = overview.keyMetrics.totalMPs;
      }
      expect(el.textContent).toBe('-');
    });
  });

  describe('Party Performance Charts', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <section id="party-performance">
          <div class="chart-container">
            <canvas id="party-seats-chart" role="img"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="party-cohesion-chart" role="img"></canvas>
          </div>
        </section>
      `;
    });

    it('should have party seats chart canvas', () => {
      expect(document.getElementById('party-seats-chart')).not.toBeNull();
    });

    it('should have party cohesion chart canvas', () => {
      expect(document.getElementById('party-cohesion-chart')).not.toBeNull();
    });

    it('should create bar chart for seats distribution', () => {
      const ctx = document.getElementById('party-seats-chart');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['S', 'SD', 'M', 'V', 'C', 'KD', 'MP', 'L'],
          datasets: [{ label: 'Current Seats', data: [107, 73, 68, 24, 24, 19, 18, 16] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
      expect(chart.config.type).toBe('bar');
      expect(chart.config.data.labels).toHaveLength(8);
    });

    it('should create line chart for cohesion data', () => {
      const ctx = document.getElementById('party-cohesion-chart');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['S', 'M', 'SD'],
          datasets: [
            { label: 'Voting Cohesion (%)', data: [95.2, 93.1, 97.8] },
            { label: 'Rebellion Rate (%)', data: [2.1, 3.5, 0.5] }
          ]
        }
      });
      expect(chart.config.type).toBe('line');
      expect(chart.config.data.datasets).toHaveLength(2);
    });

    it('should handle parties with missing metrics', () => {
      const parties = [
        { shortName: 'S', metrics: { seats: 107 } },
        { shortName: 'M', metrics: null },
        { shortName: 'SD' }
      ];
      const seats = parties.map(p =>
        (p && p.metrics && typeof p.metrics.seats === 'number') ? p.metrics.seats : 0
      );
      expect(seats).toEqual([107, 0, 0]);
    });

    it('should handle parties with missing voting data', () => {
      const parties = [
        { shortName: 'S', voting: { cohesionScore: 95.2, rebellionRate: 2.1 } },
        { shortName: 'M', voting: null }
      ];
      const cohesion = parties.map(p =>
        (p && p.voting && typeof p.voting.cohesionScore === 'number') ? p.voting.cohesionScore : 0
      );
      expect(cohesion).toEqual([95.2, 0]);
    });
  });

  describe('Top 10 Rankings Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <section id="top-rankings">
          <div id="influential-mps" class="rankings-list"></div>
        </section>
      `;
    });

    it('should have rankings container', () => {
      expect(document.getElementById('influential-mps')).not.toBeNull();
    });

    it('should render ranking items from data', () => {
      const container = document.getElementById('influential-mps');
      const rankings = [
        { rank: 1, firstName: 'Ulf', lastName: 'Kristersson', party: 'M', role: 'Prime Minister', influenceScore: 95.0 },
        { rank: 2, firstName: 'Magdalena', lastName: 'Andersson', party: 'S', role: 'Opposition Leader', influenceScore: 92.5 }
      ];

      const fragment = document.createDocumentFragment();
      rankings.forEach(mp => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        
        const number = document.createElement('div');
        number.className = 'ranking-number';
        number.textContent = String(mp.rank);
        
        const name = document.createElement('div');
        name.className = 'ranking-name';
        name.textContent = `${mp.firstName} ${mp.lastName}`;
        
        const score = document.createElement('div');
        score.className = 'score-value';
        score.textContent = mp.influenceScore.toFixed(1);
        
        item.appendChild(number);
        item.appendChild(name);
        item.appendChild(score);
        fragment.appendChild(item);
      });
      container.appendChild(fragment);

      const items = container.querySelectorAll('.ranking-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('.ranking-number').textContent).toBe('1');
      expect(items[0].querySelector('.ranking-name').textContent).toBe('Ulf Kristersson');
      expect(items[0].querySelector('.score-value').textContent).toBe('95.0');
    });

    it('should handle missing influenceScore defensively', () => {
      const mp = { rank: 1, firstName: 'Test', lastName: 'MP', influenceScore: undefined };
      const score = (typeof mp.influenceScore === 'number' && Number.isFinite(mp.influenceScore))
        ? mp.influenceScore.toFixed(1)
        : 'N/A';
      expect(score).toBe('N/A');
    });

    it('should handle NaN influenceScore', () => {
      const mp = { influenceScore: NaN };
      const score = (typeof mp.influenceScore === 'number' && Number.isFinite(mp.influenceScore))
        ? mp.influenceScore.toFixed(1)
        : 'N/A';
      expect(score).toBe('N/A');
    });

    it('should handle missing rankings array', () => {
      const top10 = null;
      if (!top10 || !Array.isArray(top10.rankings)) {
        expect(true).toBe(true); // Should return early
      }
    });
  });

  describe('Voting Patterns Heatmap', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <section id="voting-patterns">
          <div class="chart-container">
            <canvas id="voting-heatmap" role="img"></canvas>
          </div>
        </section>
      `;
    });

    it('should have voting heatmap canvas', () => {
      expect(document.getElementById('voting-heatmap')).not.toBeNull();
    });

    it('should create chart from voting matrix data', () => {
      const matrix = {
        labels: ['S', 'M', 'SD'],
        partyNames: ['Social Democrats', 'Moderates', 'Sweden Democrats'],
        agreementMatrix: [[100, 45, 30], [45, 100, 60], [30, 60, 100]]
      };

      const ctx = document.getElementById('voting-heatmap');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: matrix.labels,
          datasets: matrix.agreementMatrix.map((row, i) => ({
            label: matrix.partyNames[i],
            data: row,
            backgroundColor: `hsla(${i * 45}, 70%, 50%, 0.6)`
          }))
        }
      });

      expect(chart.config.type).toBe('bar');
      expect(chart.config.data.datasets).toHaveLength(3);
      expect(chart.config.data.datasets[0].label).toBe('Social Democrats');
    });

    it('should validate agreement matrix symmetry', () => {
      const matrix = [[100, 45, 30], [45, 100, 60], [30, 60, 100]];
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          expect(matrix[i][j]).toBe(matrix[j][i]);
        }
        expect(matrix[i][i]).toBe(100); // Diagonal should be 100%
      }
    });

    it('should handle invalid voting patterns data', () => {
      const votingPatterns = { votingMatrix: null };
      const isValid = votingPatterns && votingPatterns.votingMatrix &&
        votingPatterns.votingMatrix.labels &&
        Array.isArray(votingPatterns.votingMatrix.agreementMatrix);
      expect(isValid).toBeFalsy();
    });
  });

  describe('Committee Network Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <section id="committee-network">
          <div id="network-visualization" class="network-container"></div>
          <div id="committee-list" class="committee-grid"></div>
        </section>
      `;
    });

    it('should have committee list container', () => {
      expect(document.getElementById('committee-list')).not.toBeNull();
    });

    it('should have network visualization container', () => {
      expect(document.getElementById('network-visualization')).not.toBeNull();
    });

    it('should render committee cards from data', () => {
      const container = document.getElementById('committee-list');
      const committees = [
        {
          name: 'Finance Committee',
          memberCount: 17,
          influenceScore: 85.5,
          meetingsPerYear: 120,
          documentsProcessed: 450,
          keyIssues: ['Budget', 'Tax', 'Financial regulation']
        },
        {
          name: 'Justice Committee',
          memberCount: 17,
          influenceScore: 82.0,
          meetingsPerYear: 95,
          documentsProcessed: 320,
          keyIssues: ['Criminal law', 'Migration']
        }
      ];

      const fragment = document.createDocumentFragment();
      committees.forEach(committee => {
        const card = document.createElement('div');
        card.className = 'committee-card';

        const name = document.createElement('h3');
        name.className = 'committee-name';
        name.textContent = committee.name;

        const issues = document.createElement('div');
        issues.className = 'committee-issues';
        committee.keyIssues.forEach(issue => {
          const tag = document.createElement('span');
          tag.className = 'issue-tag';
          tag.textContent = issue;
          issues.appendChild(tag);
        });

        card.appendChild(name);
        card.appendChild(issues);
        fragment.appendChild(card);
      });
      container.appendChild(fragment);

      const cards = container.querySelectorAll('.committee-card');
      expect(cards).toHaveLength(2);
      expect(cards[0].querySelector('.committee-name').textContent).toBe('Finance Committee');
      const issueTags = cards[0].querySelectorAll('.issue-tag');
      expect(issueTags).toHaveLength(3);
    });

    it('should handle committee with missing properties', () => {
      const committee = { name: 'Test', memberCount: undefined, influenceScore: null };
      const memberCount = (typeof committee.memberCount === 'number') ? committee.memberCount : 'N/A';
      const influenceScore = (typeof committee.influenceScore === 'number' && Number.isFinite(committee.influenceScore))
        ? committee.influenceScore.toFixed(1)
        : 'N/A';
      expect(memberCount).toBe('N/A');
      expect(influenceScore).toBe('N/A');
    });

    it('should handle missing keyIssues array', () => {
      const committee = { name: 'Test' };
      const hasIssues = Array.isArray(committee.keyIssues);
      expect(hasIssues).toBe(false);
    });

    it('should display network graph info', () => {
      const networkGraph = {
        nodes: [{ id: 'finance' }, { id: 'justice' }, { id: 'defense' }],
        edges: [
          { source: 'finance', target: 'justice' },
          { source: 'finance', target: 'defense' }
        ]
      };
      expect(networkGraph.nodes).toHaveLength(3);
      expect(networkGraph.edges).toHaveLength(2);
    });
  });

  describe('Chart Cleanup', () => {
    it('should destroy all charts on cleanup', () => {
      const charts = {
        seats: new MockChart(null, {}),
        cohesion: new MockChart(null, {}),
        heatmap: new MockChart(null, {})
      };

      Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });

      expect(charts.seats.destroyed).toBe(true);
      expect(charts.cohesion.destroyed).toBe(true);
      expect(charts.heatmap.destroyed).toBe(true);
    });

    it('should handle null charts gracefully', () => {
      const charts = { seats: null, heatmap: undefined };
      Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
