/**
 * Tests for World Bank Client
 * Tests REST API client for World Bank Open Data
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WorldBankClient,
  getDefaultWorldBankClient,
  COUNTRY_CODES,
  INDICATOR_IDS,
} from '../scripts/world-bank-client.js';
import type { WorldBankDataPoint, WorldBankClientConfig } from '../scripts/world-bank-client.js';

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

    it('should have all 12 defined indicators', () => {
      const indicatorCount = Object.keys(INDICATOR_IDS).length;
      expect(indicatorCount).toBe(12);
    });

    it('should have valid World Bank indicator ID format', () => {
      Object.values(INDICATOR_IDS).forEach((id) => {
        // World Bank IDs follow pattern: XX.XXX.XXXX... (dot-separated segments)
        expect(id).toMatch(/^[A-Z]{2}\./);
      });
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
