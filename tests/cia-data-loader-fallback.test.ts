/**
 * Tests for CIADataLoader election analysis fallback behavior.
 *
 * Validates that loadElectionAnalysis() gracefully returns fallback data
 * when the election-analysis.json file is unavailable (e.g., on deployed
 * sites where data/cia-exports/ is gitignored).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CIADataLoader } from '../src/browser/cia/data-loader.js';

describe('CIADataLoader', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadElectionAnalysis', () => {
    it('should return fallback data when JSON fetch returns 404', async () => {
      // Arrange: mock fetch to return a 404 HTML response (simulates deployed site)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const loader = new CIADataLoader();

      // Act
      const result = await loader.loadElectionAnalysis();

      // Assert: should return fallback data, not throw
      expect(result).toBeDefined();
      expect(result.forecast).toBeDefined();
      expect(result.forecast.parties).toHaveLength(8);
      expect(result.coalitionScenarios).toBeDefined();
      expect(result.coalitionScenarios.length).toBeGreaterThan(0);
      expect(result.keyFactors).toBeDefined();
      expect(result.keyFactors.length).toBeGreaterThan(0);
    });

    it('should return fallback data when JSON parsing fails (HTML response)', async () => {
      // Arrange: mock fetch to return an HTML page (404 page that returns 200)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Unexpected token '<'"))
      });

      const loader = new CIADataLoader();

      // Act
      const result = await loader.loadElectionAnalysis();

      // Assert: should return fallback data, not throw
      expect(result).toBeDefined();
      expect(result.forecast.parties).toHaveLength(8);
      expect(result.coalitionScenarios.length).toBeGreaterThan(0);
    });

    it('should return fallback data when network error occurs', async () => {
      // Arrange: mock fetch to throw a network error
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const loader = new CIADataLoader();

      // Act
      const result = await loader.loadElectionAnalysis();

      // Assert: should return fallback data, not throw
      expect(result).toBeDefined();
      expect(result.forecast.parties).toHaveLength(8);
    });

    it('should return real data when JSON file is available', async () => {
      // Arrange: mock fetch to return valid election data
      const mockElectionData = {
        forecast: {
          parties: [
            { name: 'Test Party', currentSeats: 100, predictedSeats: 110, change: 10, voteShare: 30.0 }
          ]
        },
        coalitionScenarios: [
          { name: 'Test Coalition', composition: ['T'], totalSeats: 200, probability: 50, majority: true, riskLevel: 'low' }
        ],
        keyFactors: ['Test factor'],
        electionDate: '2026-09-13'
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElectionData)
      });

      const loader = new CIADataLoader();

      // Act
      const result = await loader.loadElectionAnalysis();

      // Assert: should return the fetched data
      expect(result).toEqual(mockElectionData);
      expect(result.forecast.parties).toHaveLength(1);
      expect(result.forecast.parties[0].name).toBe('Test Party');
    });
  });

  describe('FALLBACK_ELECTION_ANALYSIS', () => {
    it('should have valid structure with 8 Swedish parties', () => {
      const fallback = CIADataLoader.FALLBACK_ELECTION_ANALYSIS;

      expect(fallback.forecast.parties).toHaveLength(8);
      expect(fallback.coalitionScenarios.length).toBeGreaterThanOrEqual(4);
      expect(fallback.keyFactors.length).toBeGreaterThanOrEqual(3);
      expect(fallback.electionDate).toBe('2026-09-13');
    });

    it('should have party seats that sum to 349', () => {
      const totalSeats = CIADataLoader.FALLBACK_ELECTION_ANALYSIS.forecast.parties
        .reduce((sum, p) => sum + p.currentSeats, 0);

      expect(totalSeats).toBe(349);
    });

    it('should have coalition scenario probabilities that sum to 100', () => {
      const totalProbability = CIADataLoader.FALLBACK_ELECTION_ANALYSIS.coalitionScenarios
        .reduce((sum, s) => sum + s.probability, 0);

      expect(totalProbability).toBe(100);
    });
  });
});
