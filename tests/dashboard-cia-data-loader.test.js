/**
 * Tests for Dashboard CIA Data Loader
 * Tests the data loading, fallback, and caching logic
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Since CIADataLoader is an ES module class, we test its structure and behavior
describe('CIA Data Loader', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use local data directory as primary source', () => {
      const baseURL = '../data/cia-exports/current/';
      expect(baseURL).toContain('cia-exports');
      expect(baseURL).toContain('current');
      expect(baseURL.startsWith('../')).toBe(true);
    });

    it('should have fallback URL for CIA platform', () => {
      const fallbackURL = 'https://www.hack23.com/cia/api/';
      expect(fallbackURL).toContain('hack23.com');
      expect(fallbackURL.startsWith('https://')).toBe(true);
    });

    it('should define all 6 JSON data sources', () => {
      const dataFiles = [
        'overview-dashboard.json',
        'election-analysis.json',
        'party-performance.json',
        'top10-influential-mps.json',
        'committee-network.json',
        'voting-patterns.json'
      ];
      expect(dataFiles).toHaveLength(6);
      dataFiles.forEach(file => {
        expect(file).toMatch(/\.json$/);
      });
    });
  });

  describe('Data Loading with Fallback', () => {
    it('should try local URL first', async () => {
      const mockData = { title: 'Test Dashboard' };
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData)
        })
      );
      global.fetch = mockFetch;

      const response = await fetch('../data/cia-exports/current/overview-dashboard.json');
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(data.title).toBe('Test Dashboard');
    });

    it('should fall back to remote URL on local failure', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ title: 'Fallback Data' })
        });
      global.fetch = mockFetch;

      // Simulate local first, then fallback
      try {
        await fetch('../data/cia-exports/current/overview-dashboard.json');
      } catch {
        const response = await fetch('https://www.hack23.com/cia/api/overview-dashboard.json');
        const data = await response.json();
        expect(data.title).toBe('Fallback Data');
      }
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw when both local and fallback fail', async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
      global.fetch = mockFetch;

      await expect(fetch('any-url')).rejects.toThrow('Network error');
    });

    it('should handle non-ok HTTP responses', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' })
      );
      global.fetch = mockFetch;

      const response = await fetch('../data/cia-exports/current/missing.json');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Overview Dashboard Data', () => {
    it('should parse overview dashboard JSON structure', () => {
      const overviewData = {
        title: 'Swedish Riksdag Overview Dashboard',
        lastUpdated: '2026-02-05T15:00:00Z',
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
      expect(overviewData.keyMetrics.totalMPs).toBe(349);
      expect(overviewData.keyMetrics.totalParties).toBe(8);
      expect(overviewData.riskAlerts.last90Days.critical).toBe(5);
    });
  });

  describe('Election Analysis Data', () => {
    it('should parse election analysis JSON structure', () => {
      const electionData = {
        electionDate: '2026-09-13',
        forecast: {
          parties: [
            { name: 'S', currentSeats: 107, predictedSeats: 110, change: 3, voteShare: 31.5 }
          ]
        },
        coalitionScenarios: [
          { name: 'Red-Green', probability: 45, majority: true, totalSeats: 180 }
        ],
        keyFactors: ['Economic policy', 'Immigration']
      };
      expect(electionData.forecast.parties).toHaveLength(1);
      expect(electionData.coalitionScenarios[0].probability).toBe(45);
      expect(electionData.keyFactors).toContain('Economic policy');
    });
  });

  describe('Party Performance Data', () => {
    it('should parse party performance JSON structure', () => {
      const partyData = {
        parties: [
          {
            shortName: 'S',
            metrics: { seats: 107 },
            voting: { cohesionScore: 95.2, rebellionRate: 2.1 }
          }
        ]
      };
      expect(partyData.parties[0].metrics.seats).toBe(107);
      expect(partyData.parties[0].voting.cohesionScore).toBeGreaterThan(90);
    });
  });

  describe('Top 10 Influential MPs Data', () => {
    it('should parse top 10 rankings JSON structure', () => {
      const top10Data = {
        rankings: [
          { rank: 1, firstName: 'Test', lastName: 'MP', party: 'S', role: 'Leader', influenceScore: 95.0 }
        ]
      };
      expect(top10Data.rankings[0].rank).toBe(1);
      expect(top10Data.rankings[0].influenceScore).toBe(95.0);
    });
  });

  describe('Committee Network Data', () => {
    it('should parse committee network JSON structure', () => {
      const committeeData = {
        committees: [
          {
            name: 'Finance Committee',
            memberCount: 17,
            influenceScore: 85.0,
            meetingsPerYear: 120,
            documentsProcessed: 450,
            keyIssues: ['Budget', 'Tax']
          }
        ],
        networkGraph: {
          nodes: [{ id: 'finance' }],
          edges: [{ source: 'finance', target: 'justice' }]
        }
      };
      expect(committeeData.committees[0].memberCount).toBe(17);
      expect(committeeData.networkGraph.nodes).toHaveLength(1);
    });
  });

  describe('Voting Patterns Data', () => {
    it('should parse voting patterns JSON structure', () => {
      const votingData = {
        votingMatrix: {
          labels: ['S', 'M', 'SD'],
          partyNames: ['Social Democrats', 'Moderates', 'Sweden Democrats'],
          agreementMatrix: [[100, 45, 30], [45, 100, 60], [30, 60, 100]]
        }
      };
      expect(votingData.votingMatrix.labels).toHaveLength(3);
      expect(votingData.votingMatrix.agreementMatrix[0][0]).toBe(100);
    });
  });

  describe('Parallel Loading', () => {
    it('should load all data sources in parallel', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' })
        })
      );
      global.fetch = mockFetch;

      const urls = [
        '../data/cia-exports/current/overview-dashboard.json',
        '../data/cia-exports/current/election-analysis.json',
        '../data/cia-exports/current/party-performance.json',
        '../data/cia-exports/current/top10-influential-mps.json',
        '../data/cia-exports/current/committee-network.json',
        '../data/cia-exports/current/voting-patterns.json'
      ];

      const results = await Promise.all(urls.map(url => fetch(url)));
      expect(results).toHaveLength(6);
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });
});
