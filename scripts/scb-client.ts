/**
 * @module SCB/Client
 * @description TypeScript client for Statistics Sweden (SCB) data via MCP server.
 * Provides typed access to SCB statistical tables for enriching political
 * intelligence with official Swedish statistics.
 *
 * Works with the SCB MCP server (https://scb-mcp.onrender.com/mcp) which
 * exposes the PxWebAPI 2.0 for programmatic access to SCB's statistical database.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 * @see https://www.scb.se/en/services/open-data-api/api-for-the-statistical-database/
 */

import type { SCBIndicator } from './data-transformers/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for the SCB MCP client */
export interface SCBClientConfig {
  /** SCB MCP server URL (default: https://scb-mcp.onrender.com/mcp) */
  readonly serverUrl?: string;
  /** Request timeout in ms (default: 15000) */
  readonly timeout?: number;
  /** Max retry attempts (default: 2) */
  readonly maxRetries?: number;
}

/** A raw table search result from SCB */
export interface SCBTableInfo {
  readonly tableId: string;
  readonly label: string;
  readonly category: string;
  readonly updated: string;
}

/** Raw data point from an SCB table */
export interface SCBDataPoint {
  readonly tableId: string;
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly period: string;
}

/** SCB policy domain definition with query and table mappings */
export interface SCBDomainConfig {
  readonly domain: string;
  readonly query: string;
  readonly tables: readonly string[];
  readonly indicators: readonly string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SERVER_URL = 'https://scb-mcp.onrender.com/mcp';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * SCB domain table mappings connecting policy domains to SCB table IDs.
 * Each domain has search query terms, known table IDs, and key indicators.
 */
export const SCB_DOMAINS: readonly SCBDomainConfig[] = [
  {
    domain: 'fiscal',
    query: 'skatter statsbudget offentliga finanser',
    tables: ['TAB1291', 'TAB1292'],
    indicators: ['Government revenue', 'Government expenditure', 'Budget balance'],
  },
  {
    domain: 'defence',
    query: 'försvar militär offentliga utgifter',
    tables: [],
    indicators: ['Defence spending % GDP'],
  },
  {
    domain: 'environment',
    query: 'växthusgaser utsläpp miljö',
    tables: ['TAB5404', 'TAB5407'],
    indicators: ['GHG emissions', 'Renewable energy share'],
  },
  {
    domain: 'education',
    query: 'utbildning studenter skola',
    tables: ['TAB4787', 'TAB4790'],
    indicators: ['Student enrollment', 'Graduation rates'],
  },
  {
    domain: 'healthcare',
    query: 'hälsa sjukvård vård',
    tables: [],
    indicators: ['Healthcare spending', 'Hospital beds'],
  },
  {
    domain: 'migration',
    query: 'invandring utvandring migration befolkning',
    tables: ['TAB637', 'TAB4230'],
    indicators: ['Immigration', 'Emigration', 'Net migration'],
  },
  {
    domain: 'eu-foreign',
    query: 'utrikeshandel export import',
    tables: ['TAB2661'],
    indicators: ['Export value', 'Import value', 'Trade balance'],
  },
  {
    domain: 'justice',
    query: 'brott lagföringar kriminalstatistik',
    tables: ['TAB1172'],
    indicators: ['Reported crimes', 'Conviction rate'],
  },
  {
    domain: 'labour',
    query: 'sysselsättning arbetslöshet arbetsmarknad',
    tables: ['TAB5765', 'TAB5616'],
    indicators: ['Unemployment rate', 'Employment rate'],
  },
  {
    domain: 'housing',
    query: 'bostäder nybyggnation hyror',
    tables: ['TAB2052', 'TAB4709'],
    indicators: ['Housing starts', 'Price index'],
  },
  {
    domain: 'transport',
    query: 'trafik transport infrastruktur',
    tables: [],
    indicators: ['Road traffic', 'Transit ridership'],
  },
  {
    domain: 'trade',
    query: 'näringsliv företag BNP',
    tables: ['TAB5802', 'TAB5803'],
    indicators: ['GDP growth', 'Business starts', 'Industrial production'],
  },
  {
    domain: 'taxation',
    query: 'skatter inkomstskatt moms skatteintäkter',
    tables: ['TAB1291'],
    indicators: ['Tax revenue', 'Income tax', 'VAT revenue'],
  },
  {
    domain: 'culture',
    query: 'kultur fritid idrott bibliotek',
    tables: ['TAB5195'],
    indicators: ['Cultural expenditure', 'Library visits', 'Cultural participation'],
  },
  {
    domain: 'governance',
    query: 'demokrati valdeltagande riksdag',
    tables: [],
    indicators: ['Voter turnout', 'Parliamentary transparency'],
  },
] as const;

// ---------------------------------------------------------------------------
// SCBClient class
// ---------------------------------------------------------------------------

/**
 * Client for accessing Statistics Sweden (SCB) data via MCP server.
 * Provides domain-based queries and indicator lookups.
 */
export class SCBClient {
  readonly serverUrl: string;
  readonly timeout: number;
  readonly maxRetries: number;

  constructor(config: SCBClientConfig = {}) {
    this.serverUrl = config.serverUrl ?? DEFAULT_SERVER_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /**
   * Search SCB tables by query string.
   *
   * @param query - Search terms (e.g., 'arbetslöshet sysselsättning')
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of matching table info
   */
  async searchTables(query: string, limit = 5): Promise<SCBTableInfo[]> {
    const params = { query, limit };
    const result = await this.callTool<SCBTableInfo[]>('search_tables', params);
    return result ?? [];
  }

  /**
   * Fetch data from a specific SCB table.
   *
   * @param tableId - SCB table identifier (e.g., 'TAB5765')
   * @param selection - Optional selection filters (e.g., { Tid: ['TOP(4)'] })
   * @returns Array of data points
   */
  async getTableData(
    tableId: string,
    selection?: Record<string, string[]>,
  ): Promise<SCBDataPoint[]> {
    const params: Record<string, unknown> = { tableId };
    if (selection) {
      params.selection = selection;
    }
    const result = await this.callTool<SCBDataPoint[]>('get_table_data', params);
    return result ?? [];
  }

  /**
   * Find SCB domain configuration for a policy area.
   *
   * @param domain - Policy domain key (e.g., 'labour', 'fiscal')
   * @returns Domain config or undefined
   */
  findDomain(domain: string): SCBDomainConfig | undefined {
    return SCB_DOMAINS.find(
      (d) => d.domain.toLowerCase() === domain.toLowerCase(),
    );
  }

  /**
   * Get all domains that have known table IDs for direct data access.
   *
   * @returns Domains with pre-configured table IDs
   */
  getDomainsWithTables(): readonly SCBDomainConfig[] {
    return SCB_DOMAINS.filter((d) => d.tables.length > 0);
  }

  /**
   * Build an SCBIndicator from raw data points.
   * Computes trend by comparing latest two values.
   *
   * @param label - Human-readable indicator label
   * @param dataPoints - Raw data points sorted by period descending
   * @param tableId - Source SCB table ID
   * @returns SCBIndicator or null if no data
   */
  buildIndicator(
    label: string,
    dataPoints: readonly SCBDataPoint[],
    tableId: string,
  ): SCBIndicator | null {
    if (dataPoints.length === 0) return null;

    const latest = dataPoints[0];
    const previous = dataPoints.length > 1 ? dataPoints[1] : undefined;

    let trend: 'up' | 'down' | 'stable' | undefined;
    if (previous) {
      const diff = latest.value - previous.value;
      if (Math.abs(diff) < 0.001) {
        trend = 'stable';
      } else {
        trend = diff > 0 ? 'up' : 'down';
      }
    }

    return {
      label,
      value: latest.value,
      unit: latest.unit || 'units',
      period: latest.period,
      tableId,
      trend,
      previousValue: previous?.value,
    };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async callTool<T>(toolName: string, params: Record<string, unknown>): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchWithRetry(toolName, params);
      return response as T;
    } catch (error) {
      // Log for debugging MCP connection issues; return null as graceful fallback
      console.warn(`SCB MCP call to ${toolName} failed:`, error instanceof Error ? error.message : error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchWithRetry(
    toolName: string,
    params: Record<string, unknown>,
    attempt = 0,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: toolName, arguments: params },
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`SCB MCP error: ${response.status} ${response.statusText}`);
      }

      const json = (await response.json()) as { result?: { content?: Array<{ text?: string }> }; error?: unknown };

      if (json.error) {
        throw new Error(`SCB MCP tool error: ${JSON.stringify(json.error)}`);
      }

      // MCP responses wrap content in result.content[].text
      const text = json.result?.content?.[0]?.text;
      if (text) {
        try {
          return JSON.parse(text);
        } catch {
          console.warn(`SCB MCP response for ${toolName} was not valid JSON; returning raw text`);
          return text;
        }
      }
      return json.result ?? null;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = 1000 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(toolName, params, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let defaultSCBClient: SCBClient | null = null;

/** Get or create the default singleton SCBClient */
export function getDefaultSCBClient(): SCBClient {
  if (!defaultSCBClient) {
    defaultSCBClient = new SCBClient();
  }
  return defaultSCBClient;
}
