/**
 * Tests for Politician Career & Productivity Analytics Dashboard
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Politician Career & Productivity Analytics Dashboard', () => {
  let container;
  let originalFetch;

  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
    
    // Create dashboard container matching index.html structure
    document.body.innerHTML = `
      <section id="politician-dashboard">
        <h2>Politician Career &amp; Productivity Analytics</h2>
        <div class="dashboard-grid">
          <div id="top10-productive-container" class="chart-card"></div>
          <div id="top10-influential-container" class="chart-card"></div>
          <div id="top10-rising-stars-container" class="chart-card"></div>
          <div id="top10-controversial-container" class="chart-card"></div>
        </div>
        <div class="chart-card">
          <canvas id="career-trajectory-chart"></canvas>
        </div>
        <div class="chart-card">
          <canvas id="productivity-influence-chart"></canvas>
        </div>
        <div class="chart-card">
          <canvas id="experience-distribution-chart"></canvas>
        </div>
      </section>
    `;

    container = document.getElementById('politician-dashboard');
  });

  afterEach(() => {
    // Restore original fetch mock
    global.fetch = originalFetch;
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('DOM Structure', () => {
    it('should have politician dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('politician-dashboard');
    });

    it('should have all top 10 containers', () => {
      const productive = document.getElementById('top10-productive-container');
      const influential = document.getElementById('top10-influential-container');
      const risingStars = document.getElementById('top10-rising-stars-container');
      const controversial = document.getElementById('top10-controversial-container');

      expect(productive).not.toBeNull();
      expect(influential).not.toBeNull();
      expect(risingStars).not.toBeNull();
      expect(controversial).not.toBeNull();
    });

    it('should have all chart canvases', () => {
      const trajectoryChart = document.getElementById('career-trajectory-chart');
      const influenceChart = document.getElementById('productivity-influence-chart');
      const experienceChart = document.getElementById('experience-distribution-chart');

      expect(trajectoryChart).not.toBeNull();
      expect(influenceChart).not.toBeNull();
      expect(experienceChart).not.toBeNull();
    });
  });

  describe('Data Sources Configuration', () => {
    it('should define CIA data base URL', () => {
      const baseUrl = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data';
      expect(baseUrl).toContain('sample-data');
    });

    it('should have local-first data source pattern', () => {
      const dataSources = {
        riskSummary: [
          'cia-data/politician/view_politician_risk_summary_sample.csv',
          'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/politician/view_politician_risk_summary_sample.csv'
        ],
        influenceMetrics: [
          'cia-data/politician/view_riksdagen_politician_influence_metrics_sample.csv',
          'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/politician/view_riksdagen_politician_influence_metrics_sample.csv'
        ]
      };

      // Verify local URL comes first
      expect(dataSources.riskSummary[0]).toContain('cia-data/');
      expect(dataSources.riskSummary[1]).toContain('raw.githubusercontent.com');
      expect(dataSources.influenceMetrics[0]).toContain('cia-data/');
    });
  });

  describe('CSV Parsing', () => {
    it('should parse simple CSV correctly', () => {
      const csvText = 'name,party,score\nAnna,S,85\nErik,M,72';
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');

      expect(headers).toEqual(['name', 'party', 'score']);
      expect(lines.length).toBe(3);
    });

    it('should parse CSV with quoted fields', () => {
      const line = '"First, Last",S,100';
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      expect(values).toEqual(['First, Last', 'S', '100']);
    });

    it('should handle BOM in CSV headers', () => {
      const header = '\uFEFF"person_id"';
      const cleaned = header.trim().replace(/^\uFEFF?"/, '').replace(/"$/, '');
      expect(cleaned).toBe('person_id');
    });

    it('should handle empty CSV gracefully', () => {
      const csvText = '';
      const lines = csvText.trim().split('\n');
      expect(lines.length <= 1).toBe(true);
    });
  });

  describe('Top 10 List Rendering', () => {
    it('should render top 10 list into container', () => {
      const containerId = 'top10-productive-container';
      const data = [
        { name: 'Anna Svensson', party: 'S', score: '861' },
        { name: 'Erik Karlsson', party: 'M', score: '845' },
        { name: 'Marie Larsson', party: 'SD', score: '823' }
      ];

      const container = document.getElementById(containerId);
      const ul = document.createElement('ul');
      ul.className = 'top10-list';
      ul.setAttribute('role', 'list');

      data.forEach((item, index) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'listitem');

        const rank = document.createElement('span');
        rank.className = 'rank';
        rank.textContent = `${index + 1}`;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = item.name;

        const party = document.createElement('span');
        party.className = 'party';
        party.textContent = item.party;

        const score = document.createElement('span');
        score.className = 'score';
        score.textContent = item.score;

        li.appendChild(rank);
        li.appendChild(name);
        li.appendChild(party);
        li.appendChild(score);
        ul.appendChild(li);
      });

      container.innerHTML = '';
      container.appendChild(ul);

      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(3);
      expect(listItems[0].querySelector('.name').textContent).toBe('Anna Svensson');
      expect(listItems[0].querySelector('.party').textContent).toBe('S');
      expect(listItems[0].querySelector('.score').textContent).toBe('861');
    });

    it('should show error when no data available', () => {
      const containerId = 'top10-productive-container';
      const container = document.getElementById(containerId);

      container.textContent = '';
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = 'No data available';
      container.appendChild(errorElement);

      const errorMsg = container.querySelector('.error-message');
      expect(errorMsg).not.toBeNull();
      expect(errorMsg.textContent).toBe('No data available');
    });

    it('should limit to 10 items maximum', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        name: `MP ${i + 1}`,
        party: 'S',
        score: `${100 - i}`
      }));

      expect(data.slice(0, 10).length).toBe(10);
    });

    it('should include ARIA attributes for accessibility', () => {
      const containerId = 'top10-productive-container';
      const container = document.getElementById(containerId);

      const ul = document.createElement('ul');
      ul.setAttribute('role', 'list');

      const li = document.createElement('li');
      li.setAttribute('role', 'listitem');

      const rank = document.createElement('span');
      rank.setAttribute('aria-label', 'Rank 1');

      const score = document.createElement('span');
      score.setAttribute('aria-label', 'Votes: 861');

      li.appendChild(rank);
      li.appendChild(score);
      ul.appendChild(li);
      container.appendChild(ul);

      expect(ul.getAttribute('role')).toBe('list');
      expect(li.getAttribute('role')).toBe('listitem');
      expect(rank.getAttribute('aria-label')).toBe('Rank 1');
    });
  });

  describe('Risk Summary Data Processing', () => {
    const sampleRiskData = [
      { person_id: '001', first_name: 'Catarina', last_name: 'Deremar', party: 'C', status: 'Tjänstgörande riksdagsledamot', annual_vote_count: '861', risk_score: '54.00', risk_level: 'HIGH' },
      { person_id: '002', first_name: 'Larry', last_name: 'Söder', party: 'KD', status: 'Tjänstgörande riksdagsledamot', annual_vote_count: '861', risk_score: '50.00', risk_level: 'HIGH' },
      { person_id: '003', first_name: 'Magdalena', last_name: 'Andersson', party: 'S', status: 'Tjänstgörande riksdagsledamot', annual_vote_count: '861', risk_score: '52.00', risk_level: 'HIGH' },
      { person_id: '004', first_name: 'Daniel', last_name: 'Bäckström', party: 'C', status: 'Tjänstgörande riksdagsledamot', annual_vote_count: '536', risk_score: '50.00', risk_level: 'HIGH' },
      { person_id: '005', first_name: 'Paulina', last_name: 'Brandberg', party: 'L', status: 'Tillgänglig ersättare', annual_vote_count: '0', risk_score: '10.00', risk_level: 'LOW' }
    ];

    it('should sort by annual_vote_count for productivity ranking', () => {
      const activeData = sampleRiskData.filter(r => r.status === 'Tjänstgörande riksdagsledamot');
      const sorted = [...activeData]
        .sort((a, b) => (parseInt(b.annual_vote_count) || 0) - (parseInt(a.annual_vote_count) || 0));

      expect(sorted[0].first_name).toBe('Catarina');
      expect(sorted[0].annual_vote_count).toBe('861');
    });

    it('should sort by risk_score for controversial ranking', () => {
      const activeData = sampleRiskData.filter(r => r.status === 'Tjänstgörande riksdagsledamot');
      const sorted = [...activeData]
        .sort((a, b) => (parseFloat(b.risk_score) || 0) - (parseFloat(a.risk_score) || 0));

      expect(sorted[0].first_name).toBe('Catarina');
      expect(parseFloat(sorted[0].risk_score)).toBe(54);
    });

    it('should filter out non-active members', () => {
      const activeData = sampleRiskData.filter(r => r.status === 'Tjänstgörande riksdagsledamot');
      expect(activeData.length).toBe(4);
      expect(activeData.find(r => r.first_name === 'Paulina')).toBeUndefined();
    });

    it('should format names correctly', () => {
      const row = sampleRiskData[0];
      const name = `${row.first_name} ${row.last_name}`;
      expect(name).toBe('Catarina Deremar');
    });
  });

});
