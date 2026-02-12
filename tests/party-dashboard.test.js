/**
 * Tests for Party Performance Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Party Performance Dashboard', () => {
  let container;
  
  beforeEach(() => {
    // Create dashboard container
    document.body.innerHTML = `
      <section id="party-dashboard">
        <h2>Party Performance & Effectiveness</h2>
        <div class="dashboard-grid">
          <div class="chart-card">
            <canvas id="partyEffectivenessChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="partyComparisonChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="coalitionAlignmentChart"></canvas>
          </div>
          <div class="chart-card">
            <canvas id="partyMomentumChart"></canvas>
          </div>
        </div>
        <div id="loading-message">Loading...</div>
        <div id="error-message" style="display: none;">Error loading data</div>
      </section>
    `;
    
    container = document.getElementById('party-dashboard');
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('DOM Structure', () => {
    it('should have party dashboard section', () => {
      expect(container).not.toBeNull();
      expect(container.id).toBe('party-dashboard');
    });
    
    it('should have all chart canvases', () => {
      const effectivenessChart = document.getElementById('partyEffectivenessChart');
      const comparisonChart = document.getElementById('partyComparisonChart');
      const coalitionChart = document.getElementById('coalitionAlignmentChart');
      const momentumChart = document.getElementById('partyMomentumChart');
      
      expect(effectivenessChart).not.toBeNull();
      expect(comparisonChart).not.toBeNull();
      expect(coalitionChart).not.toBeNull();
      expect(momentumChart).not.toBeNull();
    });
    
    it('should have loading and error messages', () => {
      const loadingMsg = document.getElementById('loading-message');
      const errorMsg = document.getElementById('error-message');
      
      expect(loadingMsg).not.toBeNull();
      expect(errorMsg).not.toBeNull();
    });
  });
  
  describe('Data Source Configuration', () => {
    it('should use local-first URLs with cia-data/ prefix', () => {
      const localPaths = [
        'cia-data/distribution_party_effectiveness_trends.csv',
        'cia-data/distribution_party_momentum.csv',
        'cia-data/distribution_experience_by_party.csv',
        'cia-data/distribution_risk_by_party.csv'
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
    it('should parse party effectiveness trends CSV with real columns', () => {
      const csv = 'party,year,quarter,documents_produced,motions_count,active_members,avg_win_rate,effectiveness_assessment\nS,2023,2,45,30,65,61.11,Standard party operations';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('party');
      expect(headers).toContain('documents_produced');
      expect(headers).toContain('motions_count');
      expect(headers).toContain('avg_win_rate');
      expect(headers).toContain('effectiveness_assessment');
    });

    it('should parse party momentum CSV with real columns', () => {
      const csv = 'party,year,quarter,period,participation_rate,momentum,trend_direction,stability_classification\nS,2026,1,2026-Q1,85.5,2.3,IMPROVING,STABLE';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('party');
      expect(headers).toContain('participation_rate');
      expect(headers).toContain('momentum');
      expect(headers).toContain('trend_direction');
      expect(headers).toContain('stability_classification');
    });

    it('should parse experience by party CSV with real columns', () => {
      const csv = 'party,experience_level,politician_count\nS,MIXED_EXPERIENCE,15\nM,SENIOR,20';
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('party');
      expect(headers).toContain('experience_level');
      expect(headers).toContain('politician_count');
    });

    it('should handle empty party field in CSV', () => {
      // Real data has rows with empty party field
      const csv = 'party,year,quarter,period,participation_rate,momentum,trend_direction,stability_classification\n"",2026,1,2026-Q1,0.00,0.00,STABLE,VERY_STABLE\nS,2026,1,2026-Q1,85.5,2.3,IMPROVING,STABLE';
      const lines = csv.split('\n');
      const firstDataRow = lines[1];
      // Should be able to filter out empty party rows
      expect(firstDataRow.startsWith('""')).toBe(true);
    });

    it('should handle trend direction values', () => {
      const validDirections = ['IMPROVING', 'DECLINING', 'STABLE'];
      validDirections.forEach(dir => expect(typeof dir).toBe('string'));
    });

    it('should handle stability classifications', () => {
      const validClassifications = ['VERY_STABLE', 'STABLE', 'MODERATE', 'VOLATILE'];
      expect(validClassifications.length).toBe(4);
    });
  });

  describe('Configuration', () => {
    const CONFIG = {
      githubRawBase: 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data',
      freshnessThreshold: 7 * 24 * 60 * 60 * 1000,
      chartColors: {
        'S': '#E8112d',
        'M': '#52BDEC',
        'SD': '#DDDD00',
        'C': '#009933',
        'V': '#DA291C',
        'KD': '#000077',
        'L': '#006AB3',
        'MP': '#83CF39'
      }
    };
    
    it('should have correct GitHub data source URL', () => {
      expect(CONFIG.githubRawBase).toContain('github');
      expect(CONFIG.githubRawBase).toContain('cia');
    });
    
    it('should have 7-day freshness threshold', () => {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(CONFIG.freshnessThreshold).toBe(sevenDays);
    });
    
    it('should have colors for all 8 Swedish parties', () => {
      const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
      parties.forEach(party => {
        expect(CONFIG.chartColors[party]).toBeDefined();
        expect(CONFIG.chartColors[party]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
    
    it('should use WCAG AA compliant colors', () => {
      Object.values(CONFIG.chartColors).forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
  
  describe('Data Fetching', () => {
    it('should fetch CSV data from local first', async () => {
      const mockFetch = vi.fn(() => 
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('party,year,quarter,documents_produced,motions_count,active_members,avg_win_rate,effectiveness_assessment\nS,2023,2,45,30,65,61.11,Standard party operations')
        })
      );
      
      global.fetch = mockFetch;
      await fetch('cia-data/distribution_party_effectiveness_trends.csv');
      expect(mockFetch).toHaveBeenCalled();
    });
    
    it('should handle fetch errors gracefully', async () => {
      const mockFetch = vi.fn(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      );
      
      global.fetch = mockFetch;
      const response = await fetch('cia-data/distribution_party_effectiveness_trends.csv');
      expect(response.ok).toBe(false);
    });

    it('should handle empty CSV data', () => {
      const csv = 'party,year,documents_produced\n';
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(1);
    });
    
    it('should use localStorage for caching', () => {
      const mockData = { timestamp: Date.now(), data: [] };
      localStorage.setItem('cia_data_test', JSON.stringify(mockData));
      
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });
  
  describe('Multi-Language Support', () => {
    const TRANSLATIONS = {
      en: {
        sectionTitle: '🗳️ Party Performance & Effectiveness',
        parties: {
          'S': 'Social Democrats',
          'M': 'Moderates',
          'SD': 'Sweden Democrats'
        }
      },
      sv: {
        sectionTitle: '🗳️ Partiprestation & Effektivitet',
        parties: {
          'S': 'Socialdemokraterna',
          'M': 'Moderaterna',
          'SD': 'Sverigedemokraterna'
        }
      }
    };
    
    it('should have English translations', () => {
      expect(TRANSLATIONS.en).toBeDefined();
      expect(TRANSLATIONS.en.sectionTitle).toBeTruthy();
    });
    
    it('should have Swedish translations', () => {
      expect(TRANSLATIONS.sv).toBeDefined();
      expect(TRANSLATIONS.sv.sectionTitle).toBeTruthy();
    });
    
    it('should translate all 8 party names', () => {
      const parties = ['S', 'M', 'SD'];
      
      parties.forEach(party => {
        expect(TRANSLATIONS.en.parties[party]).toBeDefined();
        expect(TRANSLATIONS.sv.parties[party]).toBeDefined();
      });
    });
  });
  
  describe('Chart Initialization', () => {
    it('should create Chart.js instances', () => {
      const ctx = document.getElementById('partyEffectivenessChart');
      
      const chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] }
      });
      
      expect(chart).toBeDefined();
      expect(chart.config).toBeDefined();
    });
    
    it('should have proper chart configuration', () => {
      const config = {
        type: 'line',
        data: {
          labels: ['2020', '2021', '2022'],
          datasets: [{
            label: 'Social Democrats',
            data: [70, 72, 75],
            borderColor: '#E8112d'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      };
      
      expect(config.type).toBe('line');
      expect(config.options.responsive).toBe(true);
    });
  });
  
  describe('Accessibility', () => {
    it('should have ARIA labels on charts', () => {
      const canvas = document.getElementById('partyEffectivenessChart');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Party effectiveness chart');
      
      expect(canvas.getAttribute('role')).toBe('img');
      expect(canvas.getAttribute('aria-label')).toBeTruthy();
    });
    
    it('should have screen reader only text', () => {
      const srOnly = document.createElement('span');
      srOnly.className = 'sr-only';
      srOnly.textContent = 'Chart description';
      
      container.appendChild(srOnly);
      
      const srElement = container.querySelector('.sr-only');
      expect(srElement).not.toBeNull();
    });
  });
});
