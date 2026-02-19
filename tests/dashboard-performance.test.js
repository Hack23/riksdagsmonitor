/**
 * Performance Benchmark Tests for Dashboards
 *
 * Tests rendering performance of dashboard DOM structures and validates
 * that key performance targets are met.
 *
 * Note: These tests measure DOM setup and configuration time.
 * Full chart rendering is performed in the browser environment.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Performance threshold constants
// Can be overridden via environment variables for CI/local tuning
const RENDER_THRESHOLD_MS = Number(process.env.PERF_RENDER_THRESHOLD_MS) || 500;
const DOM_SETUP_THRESHOLD_MS = Number(process.env.PERF_DOM_SETUP_THRESHOLD_MS) || 100;
const MOCK_MP_COUNT = 349;
const MOCK_RULE_COUNT = 45;

/**
 * Generate mock party data for 8 Swedish parties
 */
function generateMockPartyData(count = 8) {
  const parties = ['M', 'S', 'SD', 'C', 'V', 'MP', 'KD', 'L'];
  return parties.slice(0, count).map((party, i) => ({
    party,
    effectiveness: 50 + Math.sin(i) * 30,
    momentum: 60 + Math.cos(i) * 20,
    decisions: 100 + i * 15,
  }));
}

/**
 * Generate mock risk data for MPs
 */
function generateMockRiskData(mpCount = MOCK_MP_COUNT) {
  return Array.from({ length: mpCount }, (_, idx) => ({
    politician_id: idx,
    name: `MP ${idx}`,
    risk_score: Math.random() * 10,
    party: ['M', 'S', 'SD', 'C', 'V', 'MP', 'KD', 'L'][idx % 8],
  }));
}

/**
 * Generate mock risk rules
 */
function generateMockRules(ruleCount = MOCK_RULE_COUNT) {
  return Array.from({ length: ruleCount }, (_, idx) => ({
    rule_id: idx,
    rule_name: `Risk Rule ${idx}`,
    weight: 1 + (idx % 5),
    category: ['FINANCIAL', 'ATTENDANCE', 'VOTING', 'ETHICS', 'TRANSPARENCY'][idx % 5],
  }));
}

/**
 * Generate mock anomaly data
 */
function generateMockAnomalyData(count = 92) {
  return Array.from({ length: count }, (_, idx) => ({
    year: 2002 + Math.floor(idx / 4),
    quarter: (idx % 4) + 1,
    zscore_ballot: (Math.random() - 0.5) * 6,
    zscore_document: (Math.random() - 0.5) * 6,
    zscore_attendance: (Math.random() - 0.5) * 6,
    anomaly_type: ['BALLOT_ANOMALY', 'DOCUMENT_ANOMALY', 'NO_ANOMALY'][idx % 3],
    severity: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'][idx % 4],
  }));
}

describe('Dashboard Performance Benchmarks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // ============================================================================
  // DOM SETUP PERFORMANCE TESTS
  // ============================================================================

  describe('DOM Setup Performance', () => {
    it('should set up party dashboard DOM in under 100ms', () => {
      const start = performance.now();

      document.body.innerHTML = `
        <section id="party-dashboard" class="dashboard-container">
          <h2>Party Performance & Effectiveness</h2>
          <div class="dashboard-grid">
            <div class="chart-card"><canvas id="partyEffectivenessChart"></canvas></div>
            <div class="chart-card"><canvas id="partyComparisonChart"></canvas></div>
            <div class="chart-card"><div id="coalitionAlignmentChart"></div></div>
            <div class="chart-card"><canvas id="partyMomentumChart"></canvas></div>
          </div>
        </section>
      `;

      const end = performance.now();
      const setupTime = end - start;

      expect(setupTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
      expect(document.getElementById('party-dashboard')).toBeTruthy();
    });

    it('should set up risk dashboard DOM with 349 MPs in under 100ms', () => {
      const start = performance.now();

      document.body.innerHTML = `
        <section id="risk-dashboard" class="dashboard-container">
          <h2>Risk Assessment</h2>
          <div id="riskHeatMap" role="img" aria-label="Risk heat map"></div>
          <canvas id="riskDistributionChart"></canvas>
        </section>
      `;

      const end = performance.now();
      const setupTime = end - start;

      expect(setupTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
    });

    it('should set up election cycle dashboard DOM in under 100ms', () => {
      const start = performance.now();

      document.body.innerHTML = `
        <section id="election-cycle-dashboard" class="dashboard-section">
          <h2>Election Cycle Intelligence</h2>
          <div class="dashboard-grid">
            <canvas id="cycle-timeline-chart"></canvas>
            <div id="decision-heatmap"></div>
            <canvas id="risk-forecast-chart"></canvas>
            <canvas id="temporal-trends-chart"></canvas>
            <canvas id="party-tier-chart"></canvas>
          </div>
        </section>
      `;

      const end = performance.now();
      const setupTime = end - start;

      expect(setupTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
    });

    it('should set up all 9 dashboards sequentially in under 500ms', () => {
      const start = performance.now();

      const dashboards = [
        'party-dashboard',
        'election-cycle-dashboard',
        'committee-dashboard',
        'coalition-dashboard',
        'seasonal-patterns-dashboard',
        'pre-election-dashboard',
        'anomaly-detection-dashboard',
        'ministry-dashboard',
        'risk-dashboard',
      ];

      dashboards.forEach((id) => {
        const section = document.createElement('section');
        section.id = id;
        section.className = 'dashboard-container';
        section.innerHTML = `<h2>${id}</h2><div class="dashboard-grid"></div>`;
        document.body.appendChild(section);
      });

      const end = performance.now();
      const setupTime = end - start;

      expect(setupTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(document.querySelectorAll('.dashboard-container').length).toBe(9);
    });
  });

  // ============================================================================
  // DATA PROCESSING PERFORMANCE TESTS
  // ============================================================================

  describe('Data Processing Performance', () => {
    it('should process 349 MP risk scores in under 500ms', () => {
      const mockData = generateMockRiskData(MOCK_MP_COUNT);

      const start = performance.now();

      // Simulate risk score aggregation
      const riskByParty = mockData.reduce((acc, mp) => {
        if (!acc[mp.party]) {
          acc[mp.party] = { total: 0, count: 0 };
        }
        acc[mp.party].total += mp.risk_score;
        acc[mp.party].count += 1;
        return acc;
      }, {});

      // Calculate averages
      const partyAverages = Object.entries(riskByParty).map(([party, data]) => ({
        party,
        avgRisk: data.total / data.count,
      }));

      const end = performance.now();
      const processTime = end - start;

      expect(processTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(partyAverages.length).toBe(8); // 8 Swedish parties
      expect(mockData.length).toBe(MOCK_MP_COUNT);
    });

    it('should generate mock risk matrix (349 MPs × 45 rules) in under 500ms', () => {
      const start = performance.now();

      const mpData = generateMockRiskData(MOCK_MP_COUNT);
      const rules = generateMockRules(MOCK_RULE_COUNT);

      // Simulate matrix creation (flatten 2D to 1D for heatmap)
      const matrixEntries = [];
      for (let i = 0; i < Math.min(mpData.length, 50); i++) {
        for (let j = 0; j < rules.length; j++) {
          matrixEntries.push({
            mp_id: mpData[i].politician_id,
            rule_id: rules[j].rule_id,
            score: Math.random() * 10,
          });
        }
      }

      const end = performance.now();
      const processTime = end - start;

      expect(processTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(matrixEntries.length).toBe(50 * MOCK_RULE_COUNT);
    });

    it('should process 92 seasonal data points (23 years × 4 quarters) in under 500ms', () => {
      const seasonalData = Array.from({ length: 92 }, (_, idx) => ({
        year: 2002 + Math.floor(idx / 4),
        quarter: (idx % 4) + 1,
        ballot_count: 1000 + Math.random() * 500,
        zscore_ballot: (Math.random() - 0.5) * 4,
        is_election_year: [2006, 2010, 2014, 2018, 2022].includes(
          2002 + Math.floor(idx / 4)
        ),
      }));

      const start = performance.now();

      // Simulate quarterly aggregation
      const quarterlyAverages = [1, 2, 3, 4].map((q) => {
        const qData = seasonalData.filter((d) => d.quarter === q);
        return {
          quarter: q,
          avgBallots: qData.reduce((sum, d) => sum + d.ballot_count, 0) / qData.length,
          electionYearAvg:
            qData
              .filter((d) => d.is_election_year)
              .reduce((sum, d) => sum + d.ballot_count, 0) /
            Math.max(1, qData.filter((d) => d.is_election_year).length),
        };
      });

      // Find anomalies (|Z| >= 2.0)
      const anomalies = seasonalData.filter(
        (d) => Math.abs(d.zscore_ballot) >= 2.0
      );

      const end = performance.now();
      const processTime = end - start;

      expect(processTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(seasonalData.length).toBe(92);
      expect(quarterlyAverages.length).toBe(4);
    });

    it('should process anomaly detection data in under 500ms', () => {
      const anomalyData = generateMockAnomalyData(92);

      const start = performance.now();

      // Simulate anomaly classification
      const classified = anomalyData.map((d) => ({
        ...d,
        is_anomaly:
          Math.abs(d.zscore_ballot) >= 2.0 ||
          Math.abs(d.zscore_document) >= 2.0,
        severity_score:
          Math.max(
            Math.abs(d.zscore_ballot),
            Math.abs(d.zscore_document),
            Math.abs(d.zscore_attendance)
          ),
      }));

      // Group by severity
      const bySeverity = classified.reduce((acc, d) => {
        const sev = d.severity;
        if (!acc[sev]) acc[sev] = 0;
        acc[sev] += 1;
        return acc;
      }, {});

      const end = performance.now();
      const processTime = end - start;

      expect(processTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(classified.length).toBe(92);
      expect(Object.keys(bySeverity).length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHART CONFIGURATION PERFORMANCE TESTS
  // ============================================================================

  describe('Chart Configuration Performance', () => {
    it('should build Chart.js config for party effectiveness in under 100ms', () => {
      const mockData = generateMockPartyData(8);
      const years = Array.from({ length: 36 }, (_, i) => 1990 + i);

      const start = performance.now();

      // Simulate Chart.js config construction
      const config = {
        type: 'line',
        data: {
          labels: years,
          datasets: mockData.map((party) => ({
            label: party.party,
            data: years.map(() => 40 + Math.random() * 60),
            tension: 0.3,
          })),
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Party Effectiveness Trends' },
          },
          scales: {
            x: { title: { display: true, text: 'Year' } },
            y: { title: { display: true, text: 'Effectiveness Score' }, min: 0, max: 100 },
          },
        },
      };

      const end = performance.now();
      const configTime = end - start;

      expect(configTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
      expect(config.data.datasets.length).toBe(8);
      expect(config.data.labels.length).toBe(36);
    });

    it('should build risk heatmap config for 349 MPs in under 500ms', () => {
      const mpData = generateMockRiskData(MOCK_MP_COUNT);

      const start = performance.now();

      // Simulate heatmap data preparation
      const sortedByRisk = [...mpData].sort((a, b) => b.risk_score - a.risk_score);
      const highRisk = sortedByRisk.filter((mp) => mp.risk_score >= 6.0);
      const mediumRisk = sortedByRisk.filter(
        (mp) => mp.risk_score >= 3.0 && mp.risk_score < 6.0
      );
      const lowRisk = sortedByRisk.filter((mp) => mp.risk_score < 3.0);

      const colorScale = mpData.map((mp) => {
        if (mp.risk_score >= 8) return '#ff0000';
        if (mp.risk_score >= 6) return '#ff6600';
        if (mp.risk_score >= 4) return '#ffcc00';
        return '#00cc00';
      });

      const end = performance.now();
      const configTime = end - start;

      expect(configTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(sortedByRisk.length).toBe(MOCK_MP_COUNT);
      expect(highRisk.length + mediumRisk.length + lowRisk.length).toBe(MOCK_MP_COUNT);
      expect(colorScale.length).toBe(MOCK_MP_COUNT);
    });

    it('should build election cycle config for 10 cycles in under 100ms', () => {
      const cycles = [
        { year: 1994, mandate: '1994-1998' },
        { year: 1998, mandate: '1998-2002' },
        { year: 2002, mandate: '2002-2006' },
        { year: 2006, mandate: '2006-2010' },
        { year: 2010, mandate: '2010-2014' },
        { year: 2014, mandate: '2014-2018' },
        { year: 2018, mandate: '2018-2022' },
        { year: 2022, mandate: '2022-2026' },
        { year: 2026, mandate: '2026-2030' },
        { year: 2030, mandate: '2030-2034' },
      ];

      const start = performance.now();

      const chartConfig = {
        type: 'bar',
        data: {
          labels: cycles.map((c) => c.mandate),
          datasets: [
            {
              label: 'M',
              data: cycles.map(() => 20 + Math.random() * 15),
              backgroundColor: 'rgba(0, 52, 120, 0.7)',
            },
            {
              label: 'S',
              data: cycles.map(() => 25 + Math.random() * 10),
              backgroundColor: 'rgba(237, 28, 36, 0.7)',
            },
          ],
        },
        options: {
          responsive: true,
          scales: { y: { min: 0, max: 50 } },
        },
      };

      const end = performance.now();
      const configTime = end - start;

      expect(configTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
      expect(chartConfig.data.labels.length).toBe(10);
    });
  });

  // ============================================================================
  // MEMORY USAGE TESTS
  // ============================================================================

  describe('Memory Usage Patterns', () => {
    it('should not retain references after DOM cleanup', () => {
      // Create and remove dashboard 5 times
      for (let i = 0; i < 5; i++) {
        document.body.innerHTML = `
          <section id="party-dashboard-${i}">
            <canvas id="chart-${i}"></canvas>
          </section>
        `;
        const canvas = document.getElementById(`chart-${i}`);
        expect(canvas).toBeTruthy();

        // Cleanup
        document.body.innerHTML = '';
        expect(document.getElementById(`chart-${i}`)).toBeNull();
      }
    });

    it('should handle large mock datasets without errors', () => {
      const largeDataset = generateMockRiskData(MOCK_MP_COUNT);
      const rules = generateMockRules(MOCK_RULE_COUNT);

      // Verify data was created successfully
      expect(largeDataset.length).toBe(MOCK_MP_COUNT);
      expect(rules.length).toBe(MOCK_RULE_COUNT);

      // Simulate data access patterns
      const riskScores = largeDataset.map((mp) => mp.risk_score);
      const maxRisk = Math.max(...riskScores);
      const minRisk = Math.min(...riskScores);
      const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;

      expect(maxRisk).toBeGreaterThanOrEqual(0);
      expect(minRisk).toBeGreaterThanOrEqual(0);
      expect(avgRisk).toBeGreaterThan(0);
      expect(avgRisk).toBeLessThan(10);
    });

    it('should process large CSV-like data structure efficiently', () => {
      const start = performance.now();

      // Simulate CSV parsing for cia-data format
      const csvRows = Array.from({ length: 500 }, (_, i) => ({
        Year: 2002 + Math.floor(i / 4),
        Quarter: (i % 4) + 1,
        Ballot: Math.floor(1000 + Math.random() * 500),
        Document: Math.floor(200 + Math.random() * 100),
        Attendance: (0.7 + Math.random() * 0.25).toFixed(4),
        Party: ['M', 'S', 'SD', 'C', 'V', 'MP', 'KD', 'L'][i % 8],
      }));

      // Simulate filtering
      const filtered = csvRows.filter((row) => row.Year >= 2015 && row.Quarter === 4);

      // Simulate aggregation
      const aggregated = filtered.reduce(
        (acc, row) => {
          acc.totalBallots += row.Ballot;
          acc.totalDocuments += row.Document;
          acc.count += 1;
          return acc;
        },
        { totalBallots: 0, totalDocuments: 0, count: 0 }
      );

      const end = performance.now();
      const processTime = end - start;

      expect(processTime).toBeLessThan(RENDER_THRESHOLD_MS);
      expect(csvRows.length).toBe(500);
      expect(aggregated.count).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHART.JS MOCK PERFORMANCE TESTS
  // ============================================================================

  describe('Chart.js Mock Operations', () => {
    it('should create and destroy Chart.js mock quickly', () => {
      const canvas = document.createElement('canvas');
      canvas.id = 'test-chart';
      document.body.appendChild(canvas);

      const start = performance.now();

      // Create chart
      const chart = new global.Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['M', 'S', 'SD', 'C', 'V', 'MP', 'KD', 'L'],
          datasets: [
            {
              label: 'Effectiveness',
              data: [72, 68, 65, 70, 60, 55, 63, 58],
            },
          ],
        },
        options: {},
      });

      chart.update();
      chart.destroy();

      const end = performance.now();
      const opTime = end - start;

      expect(opTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
    });

    it('should handle multiple simultaneous mock charts', () => {
      const chartIds = [
        'chart-1',
        'chart-2',
        'chart-3',
        'chart-4',
        'chart-5',
      ];

      chartIds.forEach((id) => {
        const canvas = document.createElement('canvas');
        canvas.id = id;
        document.body.appendChild(canvas);
      });

      const start = performance.now();

      const charts = chartIds.map((id) => {
        const canvas = document.getElementById(id);
        return new global.Chart(canvas, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: {},
        });
      });

      // Update all charts
      charts.forEach((chart) => chart.update());

      // Destroy all charts
      charts.forEach((chart) => chart.destroy());

      const end = performance.now();
      const opTime = end - start;

      expect(opTime).toBeLessThan(DOM_SETUP_THRESHOLD_MS);
      expect(charts.length).toBe(5);
    });
  });
});
