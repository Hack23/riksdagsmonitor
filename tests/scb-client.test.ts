/**
 * Unit tests for SCB Client (scripts/scb-client.ts)
 *
 * Tests the SCBClient class for accessing Statistics Sweden data via MCP:
 * - Client configuration (defaults, custom, partial)
 * - Domain lookups and table mappings
 * - Indicator building with trend detection
 * - SCB_DOMAINS constant validation
 * - Singleton pattern
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SCBClient,
  SCB_DOMAINS,
  getDefaultSCBClient,
} from '../scripts/scb-client.js';
import type {
  SCBClientConfig,
  SCBDataPoint,
  SCBDomainConfig,
} from '../scripts/scb-client.js';

// ---------------------------------------------------------------------------
// SCBClient constructor & config
// ---------------------------------------------------------------------------

describe('SCBClient', () => {
  describe('constructor', () => {
    it('should use default config when no options provided', () => {
      const client = new SCBClient();
      expect(client.serverUrl).toBe('https://scb-mcp.onrender.com/mcp');
      expect(client.timeout).toBe(15_000);
      expect(client.maxRetries).toBe(2);
    });

    it('should accept custom config', () => {
      const config: SCBClientConfig = {
        serverUrl: 'https://custom.example.com/mcp',
        timeout: 30_000,
        maxRetries: 5,
      };
      const client = new SCBClient(config);
      expect(client.serverUrl).toBe('https://custom.example.com/mcp');
      expect(client.timeout).toBe(30_000);
      expect(client.maxRetries).toBe(5);
    });

    it('should use defaults for missing config fields', () => {
      const client = new SCBClient({ timeout: 5000 });
      expect(client.serverUrl).toBe('https://scb-mcp.onrender.com/mcp');
      expect(client.timeout).toBe(5000);
      expect(client.maxRetries).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Domain lookups
  // -------------------------------------------------------------------------

  describe('findDomain', () => {
    const client = new SCBClient();

    it('should find domain by exact key', () => {
      const domain = client.findDomain('labour');
      expect(domain).toBeDefined();
      expect(domain!.domain).toBe('labour');
      expect(domain!.tables).toContain('TAB5765');
    });

    it('should find domain case-insensitively', () => {
      const domain = client.findDomain('FISCAL');
      expect(domain).toBeDefined();
      expect(domain!.domain).toBe('fiscal');
    });

    it('should return undefined for unknown domain', () => {
      expect(client.findDomain('nonexistent')).toBeUndefined();
    });
  });

  describe('getDomainsWithTables', () => {
    const client = new SCBClient();

    it('should return only domains with non-empty tables arrays', () => {
      const domains = client.getDomainsWithTables();
      expect(domains.length).toBeGreaterThan(0);
      domains.forEach((d) => {
        expect(d.tables.length).toBeGreaterThan(0);
      });
    });

    it('should not include domains without tables', () => {
      const domains = client.getDomainsWithTables();
      const domainNames = domains.map((d) => d.domain);
      // defence, healthcare, transport, governance have empty tables
      expect(domainNames).not.toContain('defence');
      expect(domainNames).not.toContain('healthcare');
      expect(domainNames).not.toContain('transport');
      expect(domainNames).not.toContain('governance');
    });
  });

  // -------------------------------------------------------------------------
  // Indicator building
  // -------------------------------------------------------------------------

  describe('buildIndicator', () => {
    const client = new SCBClient();

    it('should return null for empty data points', () => {
      expect(client.buildIndicator('Test', [], 'TAB1234')).toBeNull();
    });

    it('should build indicator from single data point', () => {
      const points: SCBDataPoint[] = [
        { tableId: 'TAB5765', label: 'Unemployment', value: 7.2, unit: 'percent', period: '2025Q3' },
      ];
      const indicator = client.buildIndicator('Unemployment rate', points, 'TAB5765');
      expect(indicator).not.toBeNull();
      expect(indicator!.label).toBe('Unemployment rate');
      expect(indicator!.value).toBe(7.2);
      expect(indicator!.unit).toBe('percent');
      expect(indicator!.period).toBe('2025Q3');
      expect(indicator!.tableId).toBe('TAB5765');
      expect(indicator!.trend).toBeUndefined();
      expect(indicator!.previousValue).toBeUndefined();
    });

    it('should compute "up" trend when latest > previous', () => {
      const points: SCBDataPoint[] = [
        { tableId: 'TAB5765', label: 'Unemployment', value: 7.5, unit: 'percent', period: '2025Q4' },
        { tableId: 'TAB5765', label: 'Unemployment', value: 7.2, unit: 'percent', period: '2025Q3' },
      ];
      const indicator = client.buildIndicator('Unemployment rate', points, 'TAB5765');
      expect(indicator!.trend).toBe('up');
      expect(indicator!.previousValue).toBe(7.2);
    });

    it('should compute "down" trend when latest < previous', () => {
      const points: SCBDataPoint[] = [
        { tableId: 'TAB5765', label: 'Unemployment', value: 6.8, unit: 'percent', period: '2025Q4' },
        { tableId: 'TAB5765', label: 'Unemployment', value: 7.2, unit: 'percent', period: '2025Q3' },
      ];
      const indicator = client.buildIndicator('Unemployment rate', points, 'TAB5765');
      expect(indicator!.trend).toBe('down');
    });

    it('should compute "stable" trend when values are essentially equal', () => {
      const points: SCBDataPoint[] = [
        { tableId: 'TAB5765', label: 'Unemployment', value: 7.2, unit: 'percent', period: '2025Q4' },
        { tableId: 'TAB5765', label: 'Unemployment', value: 7.2, unit: 'percent', period: '2025Q3' },
      ];
      const indicator = client.buildIndicator('Unemployment rate', points, 'TAB5765');
      expect(indicator!.trend).toBe('stable');
    });

    it('should use fallback unit when data point has empty unit', () => {
      const points: SCBDataPoint[] = [
        { tableId: 'TAB5765', label: 'Test', value: 100, unit: '', period: '2025' },
      ];
      const indicator = client.buildIndicator('Test', points, 'TAB5765');
      expect(indicator!.unit).toBe('units');
    });
  });

  // -------------------------------------------------------------------------
  // Network methods (mocked)
  // -------------------------------------------------------------------------

  describe('searchTables', () => {
    it('should return empty array on network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
      const client = new SCBClient({ maxRetries: 0 });
      const result = await client.searchTables('arbetslöshet');
      expect(result).toEqual([]);
      vi.restoreAllMocks();
    });
  });

  describe('getTableData', () => {
    it('should return empty array on network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
      const client = new SCBClient({ maxRetries: 0 });
      const result = await client.getTableData('TAB5765');
      expect(result).toEqual([]);
      vi.restoreAllMocks();
    });
  });
});

// ---------------------------------------------------------------------------
// SCB_DOMAINS constant
// ---------------------------------------------------------------------------

describe('SCB_DOMAINS', () => {
  it('should contain 15 policy domains', () => {
    expect(SCB_DOMAINS).toHaveLength(15);
  });

  it('should have unique domain names', () => {
    const names = SCB_DOMAINS.map((d) => d.domain);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should cover all expected domains', () => {
    const expected = [
      'fiscal', 'defence', 'environment', 'education', 'healthcare',
      'migration', 'eu-foreign', 'justice', 'labour', 'housing',
      'transport', 'trade', 'taxation', 'culture', 'governance',
    ];
    const actual = SCB_DOMAINS.map((d) => d.domain);
    expected.forEach((domain) => {
      expect(actual).toContain(domain);
    });
  });

  it('should have non-empty query for every domain', () => {
    SCB_DOMAINS.forEach((d) => {
      expect(d.query.length).toBeGreaterThan(0);
    });
  });

  it('should have at least one indicator per domain', () => {
    SCB_DOMAINS.forEach((d) => {
      expect(d.indicators.length).toBeGreaterThan(0);
    });
  });

  it('labour domain should have TAB5765 and TAB5616', () => {
    const labour = SCB_DOMAINS.find((d) => d.domain === 'labour');
    expect(labour).toBeDefined();
    expect(labour!.tables).toContain('TAB5765');
    expect(labour!.tables).toContain('TAB5616');
  });

  it('migration domain should have TAB637', () => {
    const migration = SCB_DOMAINS.find((d) => d.domain === 'migration');
    expect(migration).toBeDefined();
    expect(migration!.tables).toContain('TAB637');
  });
});

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe('getDefaultSCBClient', () => {
  it('should return an SCBClient instance', () => {
    const client = getDefaultSCBClient();
    expect(client).toBeInstanceOf(SCBClient);
  });

  it('should return the same instance on repeated calls', () => {
    const a = getDefaultSCBClient();
    const b = getDefaultSCBClient();
    expect(a).toBe(b);
  });
});
