/**
 * Tests for World Bank Client
 * Tests REST API client for World Bank Open Data
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WorldBankClient,
  getDefaultWorldBankClient,
  COUNTRY_CODES,
  INDICATOR_IDS,
  WB_SOURCES,
  WGI_INDICATOR_IDS,
} from '../scripts/world-bank-client.js';
import type { WorldBankDataPoint } from '../scripts/world-bank-client.js';

describe('WorldBankClient', () => {
  let client: WorldBankClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new WorldBankClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('https://api.worldbank.org/v2');
      expect(client.timeout).toBe(15000);
      expect(client.maxRetries).toBe(2);
    });

    it('should accept custom configuration', () => {
      const customClient = new WorldBankClient({
        baseURL: 'https://custom.example.com',
        timeout: 5000,
        maxRetries: 1,
      });
      expect(customClient.baseURL).toBe('https://custom.example.com');
      expect(customClient.timeout).toBe(5000);
      expect(customClient.maxRetries).toBe(1);
    });

    it('should use default values for partial config', () => {
      const partialClient = new WorldBankClient({ timeout: 10000 });
      expect(partialClient.baseURL).toBe('https://api.worldbank.org/v2');
      expect(partialClient.timeout).toBe(10000);
      expect(partialClient.maxRetries).toBe(2);
    });
  });

  describe('getIndicator', () => {
    it('should sort results by date descending', async () => {
      const mockResponse = [
        { page: 1, pages: 1, per_page: '50', total: 3 },
        [
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth (annual %)' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2021',
            value: 3.0,
          },
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth (annual %)' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2023',
            value: 1.5,
          },
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth (annual %)' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2022',
            value: 2.8,
          },
        ],
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results = await client.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG');

      expect(results).toHaveLength(3);
      expect(results[0].date).toBe('2023');
      expect(results[1].date).toBe('2022');
      expect(results[2].date).toBe('2021');
    });

    it('should return data points for valid API response', async () => {
      const mockResponse = [
        { page: 1, pages: 1, per_page: '50', total: 2 },
        [
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth (annual %)' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2023',
            value: 1.5,
          },
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth (annual %)' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2022',
            value: 2.8,
          },
        ],
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results: WorldBankDataPoint[] = await client.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG');

      expect(results).toHaveLength(2);
      expect(results[0].countryId).toBe('SWE');
      expect(results[0].countryName).toBe('Sweden');
      expect(results[0].indicatorId).toBe('NY.GDP.MKTP.KD.ZG');
      expect(results[0].value).toBe(1.5);
      expect(results[0].date).toBe('2023');
      expect(results[1].value).toBe(2.8);
    });

    it('should filter out null values', async () => {
      const mockResponse = [
        { page: 1, pages: 1, per_page: '50', total: 3 },
        [
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2024',
            value: null,
          },
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2023',
            value: 1.5,
          },
        ],
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results = await client.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG');
      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(1.5);
    });

    it('should return empty array for invalid API response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ page: 1, pages: 0, per_page: '50', total: 0 }]),
      });

      const results = await client.getIndicator('SWE', 'INVALID');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for non-array response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'invalid' }),
      });

      const results = await client.getIndicator('SWE', 'INVALID');
      expect(results).toHaveLength(0);
    });

    it('should construct correct URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{}, []]),
      });

      await client.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG', 25);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.worldbank.org/v2/country/SWE/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=25',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        }),
      );
    });

    it('should retry on failure', async () => {
      const mockResponse = [
        { page: 1, pages: 1, per_page: '10', total: 1 },
        [
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2023',
            value: 1.5,
          },
        ],
      ];

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });
      });

      const results = await client.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG', 10);
      expect(results).toHaveLength(1);
      expect(callCount).toBe(2);
    });

    it('should throw after max retries', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      const noRetryClient = new WorldBankClient({ maxRetries: 0 });
      await expect(noRetryClient.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG')).rejects.toThrow('Persistent failure');
    });

    it('should handle HTTP error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const noRetryClient = new WorldBankClient({ maxRetries: 0 });
      await expect(noRetryClient.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG')).rejects.toThrow('World Bank API error: 500');
    });
  });

  describe('getLatestIndicator', () => {
    it('should return the first data point', async () => {
      const mockResponse = [
        { page: 1, pages: 1, per_page: '10', total: 1 },
        [
          {
            indicator: { id: 'SL.UEM.TOTL.ZS', value: 'Unemployment' },
            country: { id: 'SWE', value: 'Sweden' },
            date: '2023',
            value: 7.5,
          },
        ],
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getLatestIndicator('SWE', 'SL.UEM.TOTL.ZS');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(7.5);
    });

    it('should return null when no data available', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{}, []]),
      });

      const result = await client.getLatestIndicator('SWE', 'INVALID');
      expect(result).toBeNull();
    });
  });

  describe('compareCountries', () => {
    it('should return comparison map for multiple countries', async () => {
      const makeResponse = (countryId: string, value: number) => [
        { page: 1, pages: 1, per_page: '10', total: 1 },
        [
          {
            indicator: { id: 'NY.GDP.MKTP.KD.ZG', value: 'GDP growth' },
            country: { id: countryId, value: countryId },
            date: '2023',
            value,
          },
        ],
      ];

      let callIdx = 0;
      const responses = [
        makeResponse('SWE', 1.5),
        makeResponse('DNK', 2.0),
      ];

      global.fetch = vi.fn().mockImplementation(() => {
        const resp = responses[callIdx++] ?? [{ page: 1 }, []];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(resp),
        });
      });

      const result = await client.compareCountries(
        ['SWE', 'DNK'],
        'NY.GDP.MKTP.KD.ZG',
      );

      expect(result.size).toBe(2);
      expect(result.get('SWE')?.value).toBe(1.5);
      expect(result.get('DNK')?.value).toBe(2.0);
    });

    it('should handle errors for individual countries gracefully', async () => {
      let callIdx = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { page: 1 },
              [{ indicator: { id: 'X' }, country: { id: 'SWE' }, date: '2023', value: 1.5 }],
            ]),
          });
        }
        return Promise.reject(new Error('Network error'));
      });

      const noRetryClient = new WorldBankClient({ maxRetries: 0 });
      const result = await noRetryClient.compareCountries(['SWE', 'DNK'], 'X');

      expect(result.size).toBe(2);
      expect(result.get('SWE')?.value).toBe(1.5);
      expect(result.get('DNK')).toBeNull();
    });
  });

  describe('COUNTRY_CODES', () => {
    it('should have Sweden', () => {
      expect(COUNTRY_CODES.sweden).toBe('SWE');
    });

    it('should have all Nordic countries', () => {
      expect(COUNTRY_CODES.denmark).toBe('DNK');
      expect(COUNTRY_CODES.norway).toBe('NOR');
      expect(COUNTRY_CODES.finland).toBe('FIN');
    });

    it('should have Germany for EU comparison', () => {
      expect(COUNTRY_CODES.germany).toBe('DEU');
    });

    it('should have EU aggregate', () => {
      expect(COUNTRY_CODES.eu).toBe('EUU');
    });
  });

  describe('INDICATOR_IDS', () => {
    it('should have GDP growth indicator', () => {
      expect(INDICATOR_IDS.gdpGrowth).toBe('NY.GDP.MKTP.KD.ZG');
    });

    it('should have unemployment indicator', () => {
      expect(INDICATOR_IDS.unemployment).toBe('SL.UEM.TOTL.ZS');
    });

    it('should have inflation indicator', () => {
      expect(INDICATOR_IDS.inflation).toBe('FP.CPI.TOTL.ZG');
    });

    it('should have all 144 defined indicators', () => {
      const indicatorCount = Object.keys(INDICATOR_IDS).length;
      expect(indicatorCount).toBe(144);
    });

    it('should have valid World Bank indicator ID format', () => {
      Object.values(INDICATOR_IDS).forEach((id) => {
        // World Bank IDs follow pattern: XX.XXX.XXXX... (dot-separated segments)
        // or governance indicators: XX.EST
        expect(id).toMatch(/^[A-Z]{2}\./);
      });
    });

    it('should cover all 17 Riksdag-relevant domains', () => {
      // Verify we have indicators from each major domain
      const domains = {
        nationalAccounts: (id: string) => id.startsWith('NY.GDP') || id.startsWith('NE.CON') || id.startsWith('NE.GDI') || id.startsWith('NY.GNS') || id.startsWith('NY.ADJ') || id.startsWith('NY.GNP'),
        taxation: (id: string) => id.startsWith('GC.'),
        trade: (id: string) => id.startsWith('NE.TRD') || id.startsWith('NE.EXP') || id.startsWith('NE.IMP') || id.startsWith('BN.') || id.startsWith('BX.') || id.startsWith('BM.') || id.startsWith('TX.') || id.startsWith('NE.RSB'),
        labor: (id: string) => id.startsWith('SL.'),
        inflation: (id: string) => id.startsWith('FP.'),
        financial: (id: string) => id.startsWith('FS.') || id.startsWith('FR.'),
        demographics: (id: string) => id.startsWith('SP.') || id.startsWith('SM.') || id.startsWith('SH.DYN'),
        health: (id: string) => id.startsWith('SH.') && !id.startsWith('SH.DYN'),
        education: (id: string) => id.startsWith('SE.'),
        environment: (id: string) => id.startsWith('EN.') || id.startsWith('AG.'),
        infrastructure: (id: string) => id.startsWith('IT.') || id.startsWith('IS.') || id.startsWith('IP.PAT'),
        innovation: (id: string) => id.startsWith('GB.') || id === 'BX.GSR.CCIS.ZS' || id.startsWith('IP.JRN'),
        military: (id: string) => id.startsWith('MS.'),
        governance: (id: string) => id.endsWith('.EST'),
        inequality: (id: string) => id.startsWith('SI.'),
        gender: (id: string) => id.startsWith('SG.'),
        energy: (id: string) => id.startsWith('EG.'),
      };

      const ids = Object.values(INDICATOR_IDS);
      for (const [domain, matcher] of Object.entries(domains)) {
        const count = ids.filter(matcher).length;
        expect(count, `Domain '${domain}' should have at least 1 indicator`).toBeGreaterThanOrEqual(1);
      }
    });

    it('should stay in sync with JSON inventory (single source of truth)', () => {
      // Drift detection: INDICATOR_IDS must match analysis/worldbank/indicators-inventory.json
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const inventoryPath = path.resolve(__dirname, '../analysis/worldbank/indicators-inventory.json');
      const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));

      // Collect all {key → id} pairs from the JSON inventory
      const inventoryMap = new Map<string, string>();
      for (const domainData of Object.values(inventory.domains) as Array<{ indicators: Array<{ key: string; id: string }> }>) {
        for (const ind of domainData.indicators) {
          inventoryMap.set(ind.key, ind.id);
        }
      }

      // Every TS key/value must exist in JSON inventory
      const tsEntries = Object.entries(INDICATOR_IDS) as [string, string][];
      for (const [key, id] of tsEntries) {
        expect(inventoryMap.has(key), `INDICATOR_IDS.${key} missing from JSON inventory`).toBe(true);
        expect(inventoryMap.get(key), `INDICATOR_IDS.${key} ID mismatch vs JSON inventory`).toBe(id);
      }

      // Every JSON inventory entry must exist in TS
      for (const [key, id] of inventoryMap.entries()) {
        expect((INDICATOR_IDS as Record<string, string>)[key], `JSON inventory key '${key}' (${id}) missing from INDICATOR_IDS`).toBe(id);
      }

      // Count must match
      expect(tsEntries.length).toBe(inventoryMap.size);
    });
  });

  describe('WGI_INDICATOR_IDS', () => {
    it('should contain 6 governance indicator IDs', () => {
      expect(WGI_INDICATOR_IDS.size).toBe(6);
    });

    it('should include all WGI estimate indicators', () => {
      expect(WGI_INDICATOR_IDS.has('RL.EST')).toBe(true);
      expect(WGI_INDICATOR_IDS.has('VA.EST')).toBe(true);
      expect(WGI_INDICATOR_IDS.has('GE.EST')).toBe(true);
      expect(WGI_INDICATOR_IDS.has('RQ.EST')).toBe(true);
      expect(WGI_INDICATOR_IDS.has('CC.EST')).toBe(true);
      expect(WGI_INDICATOR_IDS.has('PV.EST')).toBe(true);
    });

    it('should match governance indicators in INDICATOR_IDS', () => {
      expect(WGI_INDICATOR_IDS.has(INDICATOR_IDS.ruleOfLaw)).toBe(true);
      expect(WGI_INDICATOR_IDS.has(INDICATOR_IDS.voiceAccountability)).toBe(true);
      expect(WGI_INDICATOR_IDS.has(INDICATOR_IDS.govEffectiveness)).toBe(true);
      expect(WGI_INDICATOR_IDS.has(INDICATOR_IDS.regulatoryQuality)).toBe(true);
      expect(WGI_INDICATOR_IDS.has(INDICATOR_IDS.controlOfCorruption)).toBe(true);
      expect(WGI_INDICATOR_IDS.has(INDICATOR_IDS.politicalStability)).toBe(true);
    });
  });

  describe('WB_SOURCES', () => {
    it('should have WDI source as 2', () => {
      expect(WB_SOURCES.wdi).toBe(2);
    });

    it('should have WGI source as 75', () => {
      expect(WB_SOURCES.wgi).toBe(75);
    });
  });

  describe('WGI source parameter in URL', () => {
    it('should add source=75 for WGI indicators', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve([{}, []]) };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await client.getIndicator('SWE', 'CC.EST');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(fetchCall).toContain('source=75');
    });

    it('should NOT add source parameter for WDI indicators', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve([{}, []]) };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await client.getIndicator('SWE', 'NY.GDP.MKTP.KD.ZG');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(fetchCall).not.toContain('source=');
    });
  });

  describe('getDefaultWorldBankClient', () => {
    it('should return a singleton instance', () => {
      const client1 = getDefaultWorldBankClient();
      const client2 = getDefaultWorldBankClient();
      expect(client1).toBe(client2);
    });

    it('should have default configuration', () => {
      const defaultClient = getDefaultWorldBankClient();
      expect(defaultClient.baseURL).toBe('https://api.worldbank.org/v2');
    });
  });
});
