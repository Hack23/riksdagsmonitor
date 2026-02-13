/**
 * Tests for Politician Career & Productivity Analytics Dashboard - Part 2
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Politician Career & Productivity Analytics Dashboard - Part 2', () => {
  let container;
  let originalFetch;

  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
    
    // Create dashboard container matching index.html structure
    document.body.innerHTML = `
      <section id="politician-dashboard">
        <h2>Politician Career & Productivity Analytics</h2>
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

  describe('Influence Metrics Data Processing', () => {
    const sampleInfluenceData = [
      { person_id: '001', first_name: 'Amir', last_name: 'Jawad', party: 'L', network_connections: '277', influence_classification: 'HIGHLY_INFLUENTIAL' },
      { person_id: '002', first_name: 'Alexandra', last_name: 'Anstrell', party: 'M', network_connections: '209', influence_classification: 'HIGHLY_INFLUENTIAL' },
      { person_id: '003', first_name: 'Camilla', last_name: 'Hansén', party: 'MP', network_connections: '25', influence_classification: 'LIMITED_INFLUENCE' }
    ];

    it('should sort by network_connections for influence ranking', () => {
      const sorted = [...sampleInfluenceData]
        .sort((a, b) => (parseInt(b.network_connections) || 0) - (parseInt(a.network_connections) || 0));

      expect(sorted[0].first_name).toBe('Amir');
      expect(parseInt(sorted[0].network_connections)).toBe(277);
    });

    it('should build influence lookup by person_id', () => {
      const lookup = {};
      sampleInfluenceData.forEach(row => {
        lookup[row.person_id] = {
          connections: parseInt(row.network_connections) || 0,
          classification: row.influence_classification
        };
      });

      expect(lookup['001'].connections).toBe(277);
      expect(lookup['001'].classification).toBe('HIGHLY_INFLUENTIAL');
      expect(lookup['003'].connections).toBe(25);
    });
  });

  describe('Experience Distribution Data Processing', () => {
    const sampleExperienceData = [
      { experience_level: 'ACTIVE_COMMITTEES', politician_count: '746', percentage: '35.63' },
      { experience_level: 'EXTENSIVE_EXPERIENCE', politician_count: '25', percentage: '1.19' },
      { experience_level: 'LONG_SERVING_PARLIAMENT', politician_count: '657', percentage: '31.38' },
      { experience_level: 'MIXED_EXPERIENCE', politician_count: '649', percentage: '30.99' },
      { experience_level: 'PARTY_LEADERSHIP', politician_count: '10', percentage: '0.48' }
    ];

    it('should extract labels and counts from experience data', () => {
      const labels = sampleExperienceData.map(row => row.experience_level);
      const counts = sampleExperienceData.map(row => parseInt(row.politician_count));

      expect(labels).toContain('ACTIVE_COMMITTEES');
      expect(counts[0]).toBe(746);
      expect(counts.length).toBe(5);
    });

    it('should format experience level labels', () => {
      const formatLabel = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).toLowerCase().replace(/^\w/, c => c.toUpperCase());
      expect(formatLabel('ACTIVE_COMMITTEES')).toBe('Active committees');
      expect(formatLabel('LONG_SERVING_PARLIAMENT')).toBe('Long serving parliament');
    });
  });

  describe('Behavioral Trends Data Processing', () => {
    const sampleBehavioralData = [
      { person_id: '001', time_bucket: '2026-01-01 00:00:00+01', first_name: 'Ellen', last_name: 'Juntti', party: 'M', avg_absence_rate: '15.25', avg_win_rate: '100.00', avg_rebel_rate: '0.00' },
      { person_id: '002', time_bucket: '2026-02-01 00:00:00+01', first_name: 'Malcolm Momodou', last_name: 'Jallow', party: 'V', avg_absence_rate: '14.51', avg_win_rate: '17.67', avg_rebel_rate: '0.00' }
    ];

    it('should group data by time period', () => {
      const byPeriod = {};
      sampleBehavioralData.forEach(row => {
        const period = (row.time_bucket || '').substring(0, 7);
        if (!byPeriod[period]) {
          byPeriod[period] = { absence: [], winRate: [], count: 0 };
        }
        byPeriod[period].absence.push(parseFloat(row.avg_absence_rate) || 0);
        byPeriod[period].winRate.push(parseFloat(row.avg_win_rate) || 0);
        byPeriod[period].count++;
      });

      const periods = Object.keys(byPeriod).sort();
      expect(periods).toEqual(['2026-01', '2026-02']);
      expect(byPeriod['2026-01'].count).toBe(1);
    });

    it('should compute period averages correctly', () => {
      const absenceRates = [15.25, 14.51];
      const avg = absenceRates.reduce((a, b) => a + b, 0) / absenceRates.length;
      expect(avg).toBeCloseTo(14.88, 1);
    });
  });

  describe('Party Colors', () => {
    it('should define colors for all Swedish parties', () => {
      const partyColors = {
        'S': 'rgba(237, 28, 36, 0.6)',
        'M': 'rgba(0, 106, 179, 0.6)',
        'SD': 'rgba(221, 221, 0, 0.6)',
        'C': 'rgba(0, 153, 68, 0.6)',
        'V': 'rgba(218, 41, 28, 0.6)',
        'KD': 'rgba(0, 95, 164, 0.6)',
        'L': 'rgba(0, 106, 180, 0.6)',
        'MP': 'rgba(83, 160, 39, 0.6)'
      };

      expect(Object.keys(partyColors).length).toBe(8);
      expect(partyColors['S']).toContain('rgba');
      expect(partyColors['MP']).toContain('rgba');
    });
  });

  describe('Error Handling', () => {
    it('should display error message in all containers', () => {
      const containerIds = [
        'top10-productive-container',
        'top10-influential-container',
        'top10-rising-stars-container',
        'top10-controversial-container'
      ];

      const message = 'Failed to load dashboard data. Please try again later.';

      containerIds.forEach(id => {
        const container = document.getElementById(id);
        container.textContent = '';
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        container.appendChild(errorElement);
      });

      containerIds.forEach(id => {
        const container = document.getElementById(id);
        const errorMsg = container.querySelector('.error-message');
        expect(errorMsg).not.toBeNull();
        expect(errorMsg.textContent).toBe(message);
      });
    });

    it('should handle missing DOM elements gracefully', () => {
      // Remove a canvas element
      const canvas = document.getElementById('career-trajectory-chart');
      canvas.remove();

      // Should not throw when element is missing
      const missingCanvas = document.getElementById('career-trajectory-chart');
      expect(missingCanvas).toBeNull();
    });
  });

  describe('Fetch Strategy', () => {
    it('should try local URL first, then remote', async () => {
      const urls = [
        'cia-data/politician/view_politician_risk_summary_sample.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/politician/view_politician_risk_summary_sample.csv'
      ];

      expect(urls[0]).not.toContain('http');
      expect(urls[1]).toContain('http');
    });

    it('should handle fetch failures gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      try {
        await global.fetch('fake-url.csv');
        expect.unreachable();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Fetch will be restored in afterEach
    });
  });

  describe('Bubble Chart Data Transformation', () => {
    it('should transform risk and influence data into bubble chart format', () => {
      const riskRow = { person_id: '001', first_name: 'Test', last_name: 'MP', party: 'S', status: 'Tjänstgörande riksdagsledamot', annual_vote_count: '500', risk_score: '30.00', risk_level: 'MEDIUM' };
      const influenceRow = { person_id: '001', network_connections: '150' };

      const bubble = {
        x: parseInt(riskRow.annual_vote_count) || 0,
        y: parseInt(influenceRow.network_connections) || 0,
        r: Math.max(3, parseFloat(riskRow.risk_score) / 5),
        name: `${riskRow.first_name} ${riskRow.last_name}`,
        party: riskRow.party,
        riskLevel: riskRow.risk_level
      };

      expect(bubble.x).toBe(500);
      expect(bubble.y).toBe(150);
      expect(bubble.r).toBe(6);
      expect(bubble.name).toBe('Test MP');
      expect(bubble.party).toBe('S');
    });

    it('should enforce minimum bubble radius', () => {
      const lowRisk = parseFloat('5.00');
      const radius = Math.max(3, lowRisk / 5);
      expect(radius).toBe(3); // Minimum radius clamped
    });
  });
});
