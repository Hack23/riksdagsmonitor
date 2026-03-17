/**
 * Tests for CIADataLoader CSV-based election analysis loading.
 *
 * Validates that loadElectionAnalysis() builds election data from CSV
 * sources (election_forecast.csv and coalition_scenarios.csv) the same
 * way all other dashboard data is loaded — no JSON dependency.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CIADataLoader } from '../src/browser/cia/data-loader.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const FORECAST_CSV = `id,name,currentSeats,predictedSeats,change,voteShare,confidenceMin,confidenceMax
S,Social Democrats,107,95,-12,26.8,88,102
SD,Sweden Democrats,73,82,9,23.1,76,88
M,Moderates,68,72,4,20.3,67,77
V,Left Party,24,28,4,7.9,24,32
C,Centre Party,24,22,-2,6.2,18,26
KD,Christian Democrats,19,21,2,5.9,17,25
MP,Green Party,18,19,1,5.4,15,23
L,Liberals,16,10,-6,4.4,0,15`;

const COALITION_CSV = `name,probability,composition,totalSeats,majority,riskLevel
Tidö Coalition (Renewed),35,"M,KD,SD,L",185,true,moderate
Left-Green Coalition,28,"S,V,MP,C",164,false,high
Grand Coalition,22,"S,M,C",189,true,low
SD-Led Coalition,15,"SD,M,KD",175,true,high`;

function mockFetchForCSV(csvMap: Record<string, string>) {
  return vi.fn().mockImplementation(async (url: string) => {
    for (const [pattern, csv] of Object.entries(csvMap)) {
      if (url.includes(pattern)) {
        return { ok: true, text: async () => csv };
      }
    }
    return { ok: false, status: 404 };
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('CIADataLoader', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadElectionAnalysis (CSV-based)', () => {
    it('should build election analysis from CSV sources', async () => {
      // Arrange: mock fetch to return CSV data
      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': FORECAST_CSV,
        'coalition_scenarios.csv': COALITION_CSV
      });

      const loader = new CIADataLoader();

      // Act
      const result = await loader.loadElectionAnalysis();

      // Assert: structure
      expect(result).toBeDefined();
      expect(result.forecast).toBeDefined();
      expect(result.forecast.parties).toHaveLength(8);
      expect(result.coalitionScenarios).toHaveLength(4);
      expect(result.keyFactors.length).toBeGreaterThan(0);
      expect(result.electionDate).toBe('2026-09-13');
    });

    it('should parse party forecast data correctly', async () => {
      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': FORECAST_CSV,
        'coalition_scenarios.csv': COALITION_CSV
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      // Check first party (Social Democrats)
      const s = result.forecast.parties[0];
      expect(s.name).toBe('Social Democrats');
      expect(s.currentSeats).toBe(107);
      expect(s.predictedSeats).toBe(95);
      expect(s.change).toBe(-12);
      expect(s.voteShare).toBe(26.8);
      expect(s.confidenceInterval).toEqual({ min: 88, max: 102 });
    });

    it('should drop confidenceInterval when CSV cells are empty strings', async () => {
      const csvWithBlanks = `id,name,currentSeats,predictedSeats,change,voteShare,confidenceMin,confidenceMax
S,Social Democrats,107,95,-12,26.8,,`;

      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': csvWithBlanks,
        'coalition_scenarios.csv': COALITION_CSV
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      // Empty CSV cells should NOT produce { min: '', max: '' }
      expect(result.forecast.parties[0].confidenceInterval).toBeUndefined();
    });

    it('should drop forecast rows with non-numeric required fields', async () => {
      const csvWithInvalidRequiredNumeric = `id,name,currentSeats,predictedSeats,change,voteShare,confidenceMin,confidenceMax
S,Social Democrats,107,95,-12,26.8,88,102
M,Moderates,,72,4,20.3,67,77`;

      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': csvWithInvalidRequiredNumeric,
        'coalition_scenarios.csv': COALITION_CSV
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      expect(result.forecast.parties).toHaveLength(1);
      expect(result.forecast.parties[0].name).toBe('Social Democrats');
    });

    it('should parse coalition scenarios correctly', async () => {
      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': FORECAST_CSV,
        'coalition_scenarios.csv': COALITION_CSV
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      // Check first coalition
      const tido = result.coalitionScenarios[0];
      expect(tido.name).toBe('Tidö Coalition (Renewed)');
      expect(tido.probability).toBe(35);
      expect(tido.composition).toContain('M');
      expect(tido.composition).toContain('SD');
      expect(tido.totalSeats).toBe(185);
      expect(tido.majority).toBe(true);
      expect(tido.riskLevel).toBe('moderate');
    });

    it('should drop coalition rows with non-numeric required fields', async () => {
      const coalitionWithInvalidNumeric = `name,probability,composition,totalSeats,majority,riskLevel
Valid Coalition,35,"M,KD,SD,L",185,true,moderate
Invalid Coalition,,"S,V,MP,C",164,false,high`;

      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': FORECAST_CSV,
        'coalition_scenarios.csv': coalitionWithInvalidNumeric
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      expect(result.coalitionScenarios).toHaveLength(1);
      expect(result.coalitionScenarios[0].name).toBe('Valid Coalition');
    });

    it('should drop coalition rows with invalid majority and empty risk level', async () => {
      const coalitionWithInvalidFlags = `name,probability,composition,totalSeats,majority,riskLevel
Valid Coalition,35,"M,KD,SD,L",185,true,moderate
Unknown Majority,28,"S,V,MP,C",164,maybe,high
Missing Risk,22,"S,M,C",189,false,`;

      globalThis.fetch = mockFetchForCSV({
        'election_forecast.csv': FORECAST_CSV,
        'coalition_scenarios.csv': coalitionWithInvalidFlags
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      expect(result.coalitionScenarios).toHaveLength(1);
      expect(result.coalitionScenarios[0]).toEqual(
        expect.objectContaining({
          name: 'Valid Coalition',
          majority: true,
          riskLevel: 'moderate'
        })
      );
    });

    it('should return empty parties when CSV fetch fails', async () => {
      // Arrange: all fetches return 404
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const loader = new CIADataLoader();
      const result = await loader.loadElectionAnalysis();

      // With no CSV data, parties should be empty array
      expect(result.forecast.parties).toHaveLength(0);
      expect(result.coalitionScenarios).toHaveLength(0);
      expect(result.keyFactors.length).toBeGreaterThan(0);
    });
  });

  describe('CSV_SOURCES', () => {
    it('should include election forecast and coalition scenarios', () => {
      expect(CIADataLoader.CSV_SOURCES.electionForecast).toBeDefined();
      expect(CIADataLoader.CSV_SOURCES.electionForecast.local).toBe(
        'election/election_forecast.csv'
      );
      expect(CIADataLoader.CSV_SOURCES.coalitionScenarios).toBeDefined();
      expect(CIADataLoader.CSV_SOURCES.coalitionScenarios.local).toBe(
        'election/coalition_scenarios.csv'
      );
    });
  });

  describe('election analysis source behavior', () => {
    it('should request election CSV files and never request election-analysis.json', async () => {
      const fetchSpy = mockFetchForCSV({
        'election_forecast.csv': FORECAST_CSV,
        'coalition_scenarios.csv': COALITION_CSV
      });
      globalThis.fetch = fetchSpy;

      const loader = new CIADataLoader();
      await loader.loadElectionAnalysis();

      const requestedURLs = fetchSpy.mock.calls.map(([url]) => String(url));
      expect(requestedURLs.some(url => url.includes('election_forecast.csv'))).toBe(true);
      expect(requestedURLs.some(url => url.includes('coalition_scenarios.csv'))).toBe(true);
      expect(requestedURLs.some(url => url.includes('election-analysis.json'))).toBe(false);
    });
  });
});
