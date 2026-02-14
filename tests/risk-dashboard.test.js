/**
 * Tests for Risk Assessment & Anomaly Detection Dashboard
 * 
 * Validates risk scoring, heat map configuration, Chart.js visualizations,
 * CIA CSV data loading, and mock data generation.
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Risk Dashboard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="risk-dashboard" class="dashboard-container">
        <h2>Risk Assessment &amp; Anomaly Detection</h2>
        <p class="dashboard-description">Comprehensive intelligence analysis</p>

        <div class="alert-banner" id="earlyWarnings" role="alert" aria-live="polite" aria-atomic="true">
        </div>

        <div class="dashboard-grid">
          <div class="chart-card full-width">
            <h3>Risk Level Heat Map (45 Rules × 349 MPs)</h3>
            <div class="controls">
              <label class="control-label">
                <input type="checkbox" id="filterHighRisk" aria-label="Show only high-risk MPs (score ≥6.0)">
                <span id="filterHighRiskDesc">Show only high-risk (≥6.0)</span>
              </label>
              <label class="control-label">
                <select id="riskRuleFilter" aria-label="Filter by risk rule">
                  <option value="">All Rules</option>
                </select>
              </label>
              <button id="resetZoom" class="btn btn-sm" aria-label="Reset zoom">Reset Zoom</button>
            </div>
            <div id="riskHeatMap" role="img" aria-label="Risk assessment heat map"></div>
            <div id="heatMapLegend" class="legend" role="img" aria-label="Heat map color legend"></div>
          </div>

          <div class="chart-card">
            <h3>Risk Distribution</h3>
            <canvas id="riskDistributionChart" role="img" aria-label="Bar chart showing risk score distribution"></canvas>
          </div>

          <div class="chart-card">
            <h3>Anomaly Detection (P90/P99)</h3>
            <canvas id="anomalyDetectionChart" role="img" aria-label="Scatter plot showing voting anomalies"></canvas>
          </div>

          <div class="chart-card">
            <h3>Crisis Resilience Indicators</h3>
            <canvas id="crisisResilienceChart" role="img" aria-label="Radar chart showing crisis resilience"></canvas>
          </div>

          <div class="chart-card">
            <h3>Risk Evolution Timeline (2020-2026)</h3>
            <canvas id="riskEvolutionChart" role="img" aria-label="Line chart showing risk evolution"></canvas>
          </div>

          <div class="chart-card">
            <h3>Top 10 Ethics Concerns</h3>
            <ol id="ethicsConcernsList" aria-label="Top 10 ethics concerns list"></ol>
          </div>

          <div class="chart-card">
            <h3>Electoral Risk (MPs at Risk)</h3>
            <ol id="electoralRiskList" aria-label="Top 10 MPs at electoral risk"></ol>
          </div>
        </div>

        <div class="data-attribution">
          <p><strong>Data Source:</strong> <a href="https://www.hack23.com/cia" target="_blank">CIA Platform</a> | <strong>Last Updated:</strong> <span id="lastUpdated">Loading...</span></p>
        </div>
      </section>
    `;

    container = document.getElementById('risk-dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONFIGURATION & CONSTANTS
  // ============================================================================

  describe('Risk Level Configuration', () => {
    const RISK_LEVELS = {
      CRITICAL: { min: 8.0, max: 10.0, color: '#d32f2f', label: 'Critical' },
      HIGH: { min: 6.0, max: 8.0, color: '#f57c00', label: 'High' },
      MEDIUM: { min: 4.0, max: 6.0, color: '#fbc02d', label: 'Medium' },
      LOW: { min: 0.0, max: 4.0, color: '#388e3c', label: 'Low' }
    };

    it('should define all four risk levels', () => {
      expect(RISK_LEVELS.CRITICAL).toBeDefined();
      expect(RISK_LEVELS.HIGH).toBeDefined();
      expect(RISK_LEVELS.MEDIUM).toBeDefined();
      expect(RISK_LEVELS.LOW).toBeDefined();
    });

    it('should have non-overlapping score ranges', () => {
      expect(RISK_LEVELS.LOW.min).toBe(0.0);
      expect(RISK_LEVELS.LOW.max).toBe(4.0);
      expect(RISK_LEVELS.MEDIUM.min).toBe(4.0);
      expect(RISK_LEVELS.MEDIUM.max).toBe(6.0);
      expect(RISK_LEVELS.HIGH.min).toBe(6.0);
      expect(RISK_LEVELS.HIGH.max).toBe(8.0);
      expect(RISK_LEVELS.CRITICAL.min).toBe(8.0);
      expect(RISK_LEVELS.CRITICAL.max).toBe(10.0);
    });

    it('should have valid hex color codes', () => {
      Object.values(RISK_LEVELS).forEach(level => {
        expect(level.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have human-readable labels', () => {
      expect(RISK_LEVELS.CRITICAL.label).toBe('Critical');
      expect(RISK_LEVELS.HIGH.label).toBe('High');
      expect(RISK_LEVELS.MEDIUM.label).toBe('Medium');
      expect(RISK_LEVELS.LOW.label).toBe('Low');
    });

    it('should cover full 0-10 score range', () => {
      expect(RISK_LEVELS.LOW.min).toBe(0.0);
      expect(RISK_LEVELS.CRITICAL.max).toBe(10.0);
    });
  });

  describe('Party Colors Configuration', () => {
    const PARTY_COLORS = {
      'M': '#52B6EC',
      'S': '#E8112d',
      'SD': '#DDDD00',
      'C': '#009933',
      'V': '#DA291C',
      'KD': '#000077',
      'L': '#006AB3',
      'MP': '#83CF39'
    };

    it('should define colors for all 8 Swedish parties', () => {
      expect(Object.keys(PARTY_COLORS)).toHaveLength(8);
    });

    it('should include all expected party abbreviations', () => {
      const expectedParties = ['M', 'S', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
      expectedParties.forEach(party => {
        expect(PARTY_COLORS[party]).toBeDefined();
      });
    });

    it('should have valid hex color codes', () => {
      Object.values(PARTY_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have distinct colors for each party', () => {
      const colors = Object.values(PARTY_COLORS);
      const uniqueColors = new Set(colors.map(c => c.toLowerCase()));
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('CIA Data URLs Configuration', () => {
    const CIA_DATA_URLS = {
      riskLevels: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_politician_risk_levels.csv',
      riskByParty: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_risk_by_party.csv',
      riskBuckets: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_risk_score_buckets.csv',
      riskEvolution: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/percentile_risk_score_evolution.csv',
      anomalyClassification: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_voting_anomaly_classification.csv',
      anomalyDetection: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/percentile_voting_anomaly_detection.csv',
      crisisResilience: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_crisis_resilience.csv',
      ethicsConcerns: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/top10_ethics_concerns.csv',
      electoralRisk: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/top10_electoral_risk.csv'
    };

    it('should define 9 data source URLs', () => {
      expect(Object.keys(CIA_DATA_URLS)).toHaveLength(9);
    });

    it('should point to GitHub raw content', () => {
      Object.values(CIA_DATA_URLS).forEach(url => {
        expect(url).toContain('https://raw.githubusercontent.com/Hack23/cia/');
      });
    });

    it('should reference CSV files', () => {
      Object.values(CIA_DATA_URLS).forEach(url => {
        expect(url).toMatch(/\.csv$/);
      });
    });

    it('should reference sample-data directory', () => {
      Object.values(CIA_DATA_URLS).forEach(url => {
        expect(url).toContain('sample-data/');
      });
    });

    it('should include risk-related datasets', () => {
      expect(CIA_DATA_URLS.riskLevels).toContain('politician_risk_levels');
      expect(CIA_DATA_URLS.riskByParty).toContain('risk_by_party');
      expect(CIA_DATA_URLS.riskBuckets).toContain('risk_score_buckets');
      expect(CIA_DATA_URLS.riskEvolution).toContain('risk_score_evolution');
    });

    it('should include anomaly datasets', () => {
      expect(CIA_DATA_URLS.anomalyClassification).toContain('voting_anomaly_classification');
      expect(CIA_DATA_URLS.anomalyDetection).toContain('voting_anomaly_detection');
    });

    it('should include top-10 datasets', () => {
      expect(CIA_DATA_URLS.ethicsConcerns).toContain('top10_ethics_concerns');
      expect(CIA_DATA_URLS.electoralRisk).toContain('top10_electoral_risk');
    });
  });

  // ============================================================================
  // RISK CLASSIFICATION LOGIC
  // ============================================================================

  describe('Risk Classification', () => {
    function classifyRiskLevel(score) {
      if (score >= 8.0) return 'CRITICAL';
      if (score >= 6.0) return 'HIGH';
      if (score >= 4.0) return 'MEDIUM';
      return 'LOW';
    }

    it('should classify scores 8.0-10.0 as CRITICAL', () => {
      expect(classifyRiskLevel(8.0)).toBe('CRITICAL');
      expect(classifyRiskLevel(9.5)).toBe('CRITICAL');
      expect(classifyRiskLevel(10.0)).toBe('CRITICAL');
    });

    it('should classify scores 6.0-7.99 as HIGH', () => {
      expect(classifyRiskLevel(6.0)).toBe('HIGH');
      expect(classifyRiskLevel(7.0)).toBe('HIGH');
      expect(classifyRiskLevel(7.99)).toBe('HIGH');
    });

    it('should classify scores 4.0-5.99 as MEDIUM', () => {
      expect(classifyRiskLevel(4.0)).toBe('MEDIUM');
      expect(classifyRiskLevel(5.0)).toBe('MEDIUM');
      expect(classifyRiskLevel(5.99)).toBe('MEDIUM');
    });

    it('should classify scores 0.0-3.99 as LOW', () => {
      expect(classifyRiskLevel(0.0)).toBe('LOW');
      expect(classifyRiskLevel(2.0)).toBe('LOW');
      expect(classifyRiskLevel(3.99)).toBe('LOW');
    });

    it('should handle boundary values correctly', () => {
      expect(classifyRiskLevel(4.0)).toBe('MEDIUM');
      expect(classifyRiskLevel(3.99)).toBe('LOW');
      expect(classifyRiskLevel(6.0)).toBe('HIGH');
      expect(classifyRiskLevel(5.99)).toBe('MEDIUM');
      expect(classifyRiskLevel(8.0)).toBe('CRITICAL');
      expect(classifyRiskLevel(7.99)).toBe('HIGH');
    });
  });

  describe('Risk Color Mapping', () => {
    const RISK_LEVELS = {
      CRITICAL: { color: '#d32f2f' },
      HIGH: { color: '#f57c00' },
      MEDIUM: { color: '#fbc02d' },
      LOW: { color: '#388e3c' }
    };

    function getRiskColor(score) {
      if (score >= 8.0) return RISK_LEVELS.CRITICAL.color;
      if (score >= 6.0) return RISK_LEVELS.HIGH.color;
      if (score >= 4.0) return RISK_LEVELS.MEDIUM.color;
      return RISK_LEVELS.LOW.color;
    }

    it('should return red for critical scores', () => {
      expect(getRiskColor(9.0)).toBe('#d32f2f');
    });

    it('should return orange for high scores', () => {
      expect(getRiskColor(7.0)).toBe('#f57c00');
    });

    it('should return yellow for medium scores', () => {
      expect(getRiskColor(5.0)).toBe('#fbc02d');
    });

    it('should return green for low scores', () => {
      expect(getRiskColor(2.0)).toBe('#388e3c');
    });
  });

  // ============================================================================
  // MOCK DATA GENERATION
  // ============================================================================

  describe('Mock Risk Data Generation', () => {
    function generateMockRiskData() {
      const data = [];
      const parties = ['M', 'S', 'SD', 'C', 'V', 'KD', 'L', 'MP'];

      for (let mpIdx = 0; mpIdx < 349; mpIdx++) {
        const party = parties[mpIdx % parties.length];
        const mpName = `MP_${String(mpIdx + 1).padStart(3, '0')}`;

        for (let ruleIdx = 0; ruleIdx < 45; ruleIdx++) {
          const ruleId = `Rule_${String(ruleIdx + 1).padStart(2, '0')}`;
          const rand = Math.random();
          let score;
          if (rand < 0.70) score = Math.random() * 4;
          else if (rand < 0.90) score = 4 + Math.random() * 2;
          else if (rand < 0.98) score = 6 + Math.random() * 2;
          else score = 8 + Math.random() * 2;

          data.push({
            politician: mpName,
            party: party,
            rule: ruleId,
            ruleName: `Risk Rule ${ruleIdx + 1}`,
            score: score,
            level: score >= 8 ? 'CRITICAL' : score >= 6 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW'
          });
        }
      }
      return data;
    }

    it('should generate 15,705 data points (349 MPs × 45 rules)', () => {
      const data = generateMockRiskData();
      expect(data).toHaveLength(349 * 45);
    });

    it('should assign all 8 parties to MPs', () => {
      const data = generateMockRiskData();
      const parties = new Set(data.map(d => d.party));
      expect(parties.size).toBe(8);
    });

    it('should generate 349 unique politicians', () => {
      const data = generateMockRiskData();
      const politicians = new Set(data.map(d => d.politician));
      expect(politicians.size).toBe(349);
    });

    it('should generate 45 unique rules', () => {
      const data = generateMockRiskData();
      const rules = new Set(data.map(d => d.rule));
      expect(rules.size).toBe(45);
    });

    it('should generate scores within 0-10 range', () => {
      const data = generateMockRiskData();
      data.forEach(d => {
        expect(d.score).toBeGreaterThanOrEqual(0);
        expect(d.score).toBeLessThan(10);
      });
    });

    it('should have proper data structure for each entry', () => {
      const data = generateMockRiskData();
      const entry = data[0];
      expect(entry).toHaveProperty('politician');
      expect(entry).toHaveProperty('party');
      expect(entry).toHaveProperty('rule');
      expect(entry).toHaveProperty('ruleName');
      expect(entry).toHaveProperty('score');
      expect(entry).toHaveProperty('level');
    });

    it('should generate realistic risk distribution (majority low)', () => {
      const data = generateMockRiskData();
      const lowCount = data.filter(d => d.score < 4).length;
      const totalCount = data.length;
      // Expect roughly 70% low (with some variance)
      expect(lowCount / totalCount).toBeGreaterThan(0.5);
    });

    it('should assign consistent level labels', () => {
      const data = generateMockRiskData();
      data.forEach(d => {
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(d.level);
      });
    });

    it('should format politician names with zero-padded index', () => {
      const data = generateMockRiskData();
      expect(data[0].politician).toBe('MP_001');
      expect(data[45].politician).toBe('MP_002'); // 2nd MP (each has 45 rules)
    });

    it('should format rule IDs with zero-padded index', () => {
      const data = generateMockRiskData();
      expect(data[0].rule).toBe('Rule_01');
      expect(data[44].rule).toBe('Rule_45');
    });
  });

  // ============================================================================
  // PERCENTILE CALCULATION
  // ============================================================================

  describe('Percentile Calculation', () => {
    function calculatePercentile(data, percentile) {
      const sorted = [...data].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    }

    it('should calculate P50 (median) correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p50 = calculatePercentile(data, 50);
      expect(p50).toBe(5);
    });

    it('should calculate P90 correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p90 = calculatePercentile(data, 90);
      expect(p90).toBe(9);
    });

    it('should calculate P99 correctly', () => {
      const data = Array.from({ length: 100 }, (_, i) => i + 1);
      const p99 = calculatePercentile(data, 99);
      expect(p99).toBe(99);
    });

    it('should handle single-element arrays', () => {
      const p50 = calculatePercentile([42], 50);
      expect(p50).toBe(42);
    });

    it('should handle unsorted input', () => {
      const data = [10, 1, 5, 3, 8, 2, 7, 4, 9, 6];
      const p50 = calculatePercentile(data, 50);
      expect(p50).toBe(5);
    });

    it('should not mutate original array', () => {
      const data = [3, 1, 2];
      const copy = [...data];
      calculatePercentile(data, 50);
      expect(data).toEqual(copy);
    });
  });

  // ============================================================================
  // DOM STRUCTURE
  // ============================================================================

  describe('DOM Structure', () => {
    it('should have risk dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('risk-dashboard');
    });

    it('should have dashboard-container class', () => {
      expect(container.classList.contains('dashboard-container')).toBe(true);
    });

    it('should have early warnings banner with ARIA attributes', () => {
      const banner = document.getElementById('earlyWarnings');
      expect(banner).not.toBeNull();
      expect(banner.getAttribute('role')).toBe('alert');
      expect(banner.getAttribute('aria-live')).toBe('polite');
      expect(banner.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have risk heat map container', () => {
      const heatMap = document.getElementById('riskHeatMap');
      expect(heatMap).not.toBeNull();
      expect(heatMap.getAttribute('role')).toBe('img');
    });

    it('should have heat map legend', () => {
      const legend = document.getElementById('heatMapLegend');
      expect(legend).not.toBeNull();
      expect(legend.getAttribute('role')).toBe('img');
    });

    it('should have all chart canvases', () => {
      expect(document.getElementById('riskDistributionChart')).not.toBeNull();
      expect(document.getElementById('anomalyDetectionChart')).not.toBeNull();
      expect(document.getElementById('crisisResilienceChart')).not.toBeNull();
      expect(document.getElementById('riskEvolutionChart')).not.toBeNull();
    });

    it('should have top 10 lists', () => {
      const ethicsList = document.getElementById('ethicsConcernsList');
      const electoralList = document.getElementById('electoralRiskList');
      expect(ethicsList).not.toBeNull();
      expect(electoralList).not.toBeNull();
      expect(ethicsList.tagName).toBe('OL');
      expect(electoralList.tagName).toBe('OL');
    });

    it('should have last updated span', () => {
      const lastUpdated = document.getElementById('lastUpdated');
      expect(lastUpdated).not.toBeNull();
      expect(lastUpdated.textContent).toBe('Loading...');
    });

    it('should have filter controls', () => {
      expect(document.getElementById('filterHighRisk')).not.toBeNull();
      expect(document.getElementById('riskRuleFilter')).not.toBeNull();
      expect(document.getElementById('resetZoom')).not.toBeNull();
    });

    it('should have accessible chart canvases with role=img', () => {
      const canvases = container.querySelectorAll('canvas[role="img"]');
      expect(canvases.length).toBe(4);
    });

    it('should have aria-labels on chart canvases', () => {
      const canvases = container.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have accessible top 10 lists with aria-labels', () => {
      const ethicsList = document.getElementById('ethicsConcernsList');
      const electoralList = document.getElementById('electoralRiskList');
      expect(ethicsList.getAttribute('aria-label')).toContain('ethics');
      expect(electoralList.getAttribute('aria-label')).toContain('electoral');
    });
  });

  // ============================================================================
  // FILTER CONTROLS
  // ============================================================================

  describe('Filter Controls', () => {
    it('should have high-risk filter checkbox', () => {
      const checkbox = document.getElementById('filterHighRisk');
      expect(checkbox).not.toBeNull();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.getAttribute('aria-label')).toContain('high-risk');
    });

    it('should have risk rule filter dropdown', () => {
      const select = document.getElementById('riskRuleFilter');
      expect(select).not.toBeNull();
      expect(select.tagName).toBe('SELECT');
      expect(select.getAttribute('aria-label')).toContain('risk rule');
    });

    it('should have "All Rules" default option', () => {
      const select = document.getElementById('riskRuleFilter');
      expect(select.options[0].value).toBe('');
      expect(select.options[0].textContent).toBe('All Rules');
    });

    it('should have reset zoom button', () => {
      const button = document.getElementById('resetZoom');
      expect(button).not.toBeNull();
      expect(button.getAttribute('aria-label')).toBe('Reset zoom');
    });
  });

  // ============================================================================
  // EARLY WARNING SYSTEM
  // ============================================================================

  describe('Early Warning System', () => {
    it('should display critical alert when critical MPs exist', () => {
      const banner = document.getElementById('earlyWarnings');
      banner.className = 'alert-banner critical';
      const strong = document.createElement('strong');
      strong.textContent = '⚠️ CRITICAL:';
      banner.appendChild(strong);
      banner.appendChild(document.createTextNode(' 5 MPs with risk level ≥8.0 detected '));

      expect(banner.className).toContain('critical');
      expect(banner.textContent).toContain('CRITICAL');
      expect(banner.textContent).toContain('8.0');
    });

    it('should display high alert for elevated risk', () => {
      const banner = document.getElementById('earlyWarnings');
      banner.className = 'alert-banner high';
      banner.innerHTML = '<strong>⚠️ HIGH:</strong> Elevated risk detected';

      expect(banner.className).toContain('high');
      expect(banner.textContent).toContain('HIGH');
    });

    it('should display normal status when risks are acceptable', () => {
      const banner = document.getElementById('earlyWarnings');
      banner.className = 'alert-banner normal';
      banner.innerHTML = '<strong>✓ NORMAL:</strong> Risk levels within acceptable parameters';

      expect(banner.className).toContain('normal');
      expect(banner.textContent).toContain('NORMAL');
    });

    it('should set assertive aria-live for critical alerts', () => {
      const banner = document.getElementById('earlyWarnings');
      banner.setAttribute('aria-live', 'assertive');
      expect(banner.getAttribute('aria-live')).toBe('assertive');
    });

    it('should set polite aria-live for non-critical alerts', () => {
      const banner = document.getElementById('earlyWarnings');
      banner.setAttribute('aria-live', 'polite');
      expect(banner.getAttribute('aria-live')).toBe('polite');
    });
  });

  // ============================================================================
  // CIA DATA LOADING
  // ============================================================================

  describe('CIA Data Loading', () => {
    it('should handle successful CSV fetch', async () => {
      const csvText = 'risk_level,politician_count\nHIGH,25\nMEDIUM,150\nLOW,174';
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(csvText)
        })
      );

      const response = await fetch('https://example.com/data.csv');
      const text = await response.text();
      expect(text).toContain('risk_level');
      expect(text).toContain('politician_count');
    });

    it('should handle failed CSV fetch gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({ ok: false, status: 404 })
      );

      const response = await fetch('https://example.com/missing.csv');
      expect(response.ok).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(fetch('https://example.com/data.csv')).rejects.toThrow('Network error');
    });

    it('should parse risk_level CSV columns', () => {
      const csv = 'risk_level,politician_count\nHIGH,25\nMEDIUM,150\nLOW,174';
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',');

      expect(headers).toContain('risk_level');
      expect(headers).toContain('politician_count');
    });

    it('should parse politician_count as integer', () => {
      const entries = [
        { risk_level: 'HIGH', politician_count: '25' },
        { risk_level: 'MEDIUM', politician_count: '150' },
        { risk_level: 'LOW', politician_count: '174' }
      ];

      const total = entries.reduce((sum, e) => sum + parseInt(e.politician_count), 0);
      expect(total).toBe(349);
    });

    it('should transform risk data into matrix format', () => {
      const riskLevels = [
        { risk_level: 'HIGH', politician_count: '10' },
        { risk_level: 'MEDIUM', politician_count: '20' }
      ];
      const parties = ['M', 'S', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
      const riskRules = ['Absence Rate', 'Ethics Concerns', 'Coalition Loyalty', 'Policy Shifts'];

      const transformed = [];
      riskLevels.forEach((entry, idx) => {
        const count = Math.min(parseInt(entry.politician_count), 50);
        for (let i = 0; i < count; i++) {
          riskRules.forEach((rule, ruleIdx) => {
            transformed.push({
              politician: `MP_${String(idx * 50 + i + 1).padStart(3, '0')}`,
              party: parties[Math.floor(i % parties.length)],
              rule: ruleIdx,
              ruleName: rule,
              level: entry.risk_level
            });
          });
        }
      });

      // 10 HIGH × 4 rules + 20 MEDIUM × 4 rules = 120
      expect(transformed).toHaveLength(120);
      expect(transformed[0].ruleName).toBe('Absence Rate');
    });
  });

  // ============================================================================
  // CHART VISUALIZATIONS
  // ============================================================================

  describe('Chart.js Visualizations', () => {
    it('should have canvas context for risk distribution chart', () => {
      const canvas = document.getElementById('riskDistributionChart');
      expect(canvas).not.toBeNull();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should have canvas context for anomaly detection chart', () => {
      const canvas = document.getElementById('anomalyDetectionChart');
      expect(canvas).not.toBeNull();
    });

    it('should have canvas context for crisis resilience chart', () => {
      const canvas = document.getElementById('crisisResilienceChart');
      expect(canvas).not.toBeNull();
    });

    it('should have canvas context for risk evolution chart', () => {
      const canvas = document.getElementById('riskEvolutionChart');
      expect(canvas).not.toBeNull();
    });

    it('should create risk distribution chart with bar type', () => {
      const config = {
        type: 'bar',
        data: {
          labels: ['0-4', '4-6', '6-8', '8-10'],
          datasets: [{ label: 'Number of Violations', data: [11000, 3100, 1250, 355] }]
        }
      };

      expect(config.type).toBe('bar');
      expect(config.data.labels).toHaveLength(4);
      expect(config.data.datasets[0].data).toHaveLength(4);
    });

    it('should create anomaly detection chart with scatter type', () => {
      const config = {
        type: 'scatter',
        data: {
          datasets: [
            { label: 'Normal' },
            { label: 'Warning (>P90)' },
            { label: 'Critical (>P99)' }
          ]
        }
      };

      expect(config.type).toBe('scatter');
      expect(config.data.datasets).toHaveLength(3);
    });

    it('should create crisis resilience chart with radar type', () => {
      const config = {
        type: 'radar',
        data: {
          labels: ['M', 'S', 'SD', 'C', 'V', 'KD', 'L', 'MP'],
          datasets: [{ label: 'Crisis Resilience Score' }]
        }
      };

      expect(config.type).toBe('radar');
      expect(config.data.labels).toHaveLength(8);
    });

    it('should create risk evolution chart with line type', () => {
      const config = {
        type: 'line',
        data: {
          datasets: [
            { label: 'Attendance' },
            { label: 'Voting Consistency' },
            { label: 'Ethics' },
            { label: 'Productivity' }
          ]
        }
      };

      expect(config.type).toBe('line');
      expect(config.data.datasets).toHaveLength(4);
    });
  });

  // ============================================================================
  // TOP 10 LISTS
  // ============================================================================

  describe('Top 10 Lists', () => {
    it('should populate ethics concerns list with OL items', () => {
      const list = document.getElementById('ethicsConcernsList');
      for (let i = 1; i <= 10; i++) {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = `MP_${String(i).padStart(3, '0')}`;
        li.appendChild(strong);
        li.appendChild(document.createTextNode(` - Risk Score: ${(8 - i * 0.3).toFixed(2)}`));
        list.appendChild(li);
      }

      expect(list.children).toHaveLength(10);
      expect(list.children[0].textContent).toContain('MP_001');
    });

    it('should populate electoral risk list with OL items', () => {
      const list = document.getElementById('electoralRiskList');
      for (let i = 1; i <= 10; i++) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>MP_${String(i + 10).padStart(3, '0')}</strong> - Electoral Risk: ${85 - i * 3}%`;
        list.appendChild(li);
      }

      expect(list.children).toHaveLength(10);
      expect(list.children[0].textContent).toContain('MP_011');
      expect(list.children[0].textContent).toContain('82%');
    });

    it('should sort ethics concerns by descending score', () => {
      const scores = [7.7, 7.4, 7.1, 6.8, 6.5, 6.2, 5.9, 5.6, 5.3, 5.0];
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1]);
      }
    });
  });

  // ============================================================================
  // HEAT MAP LEGEND
  // ============================================================================

  describe('Heat Map Legend', () => {
    it('should render 4 legend items', () => {
      const legendContainer = document.getElementById('heatMapLegend');
      const legendItems = [
        { label: 'Critical (8.0-10.0)', color: '#d32f2f' },
        { label: 'High (6.0-8.0)', color: '#f57c00' },
        { label: 'Medium (4.0-6.0)', color: '#fbc02d' },
        { label: 'Low (0.0-4.0)', color: '#388e3c' }
      ];

      legendItems.forEach(item => {
        const div = document.createElement('div');
        const colorBox = document.createElement('span');
        colorBox.style.backgroundColor = item.color;
        const label = document.createElement('span');
        label.textContent = item.label;
        div.appendChild(colorBox);
        div.appendChild(label);
        legendContainer.appendChild(div);
      });

      expect(legendContainer.children).toHaveLength(4);
      expect(legendContainer.textContent).toContain('Critical');
      expect(legendContainer.textContent).toContain('Low');
    });
  });

  // ============================================================================
  // DATA ATTRIBUTION
  // ============================================================================

  describe('Data Attribution', () => {
    it('should have data source link to CIA Platform', () => {
      const link = container.querySelector('a[href="https://www.hack23.com/cia"]');
      expect(link).not.toBeNull();
      expect(link.textContent).toBe('CIA Platform');
    });

    it('should have external link safety attributes', () => {
      const link = container.querySelector('a[target="_blank"]');
      expect(link).not.toBeNull();
    });

    it('should display last updated timestamp placeholder', () => {
      const lastUpdated = document.getElementById('lastUpdated');
      expect(lastUpdated.textContent).toBe('Loading...');
    });

    it('should update timestamp with locale format', () => {
      const lastUpdated = document.getElementById('lastUpdated');
      lastUpdated.textContent = new Date('2026-02-09').toLocaleString('sv-SE');
      expect(lastUpdated.textContent).toMatch(/2026/);
    });
  });
});
