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

import { existsSync, readFileSync } from 'fs';
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

/** Default AWF MCP gateway port. The `ghcr.io/github/gh-aw-mcpg` container
 * exports `MCP_GATEWAY_PORT` in the compiled workflow lock file. Was `80`
 * in gh-aw <0.69 and is `8080` in gh-aw >=0.69. Always resolve dynamically
 * from `mcp-config.json`/env when possible. Mirrors `scripts/mcp-client/client.ts`. */
const DEFAULT_SCB_GATEWAY_PORT = 8080;
const DEFAULT_SCB_GATEWAY_DOMAIN = 'host.docker.internal';
const DIRECT_SCB_SERVER_URL = 'https://scb-mcp.onrender.com/mcp';

/** Resolve the AWF gateway port (env > config > default 8080). */
function resolveScbGatewayPort(): number {
  const envPort = process.env['MCP_GATEWAY_PORT'];
  if (envPort) {
    const parsed = Number.parseInt(envPort, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const port = gateway?.['port'];
      if (typeof port === 'number' && port > 0) return port;
      if (typeof port === 'string') {
        const parsed = Number.parseInt(port, 10);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    }
  } catch {
    // Best-effort — fall through to default
  }
  return DEFAULT_SCB_GATEWAY_PORT;
}

/** Resolve the AWF gateway domain (env > config > default host.docker.internal). */
function resolveScbGatewayDomain(): string {
  const envDomain = process.env['MCP_GATEWAY_DOMAIN'];
  if (envDomain) return envDomain;
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const domain = gateway?.['domain'];
      if (typeof domain === 'string' && domain.length > 0) return domain;
    }
  } catch {
    // Best-effort — fall through to default
  }
  return DEFAULT_SCB_GATEWAY_DOMAIN;
}

/** Build the AWF gateway URL for the SCB MCP server (port-agnostic). */
function buildScbGatewayUrl(): string {
  return `http://${resolveScbGatewayDomain()}:${resolveScbGatewayPort()}/mcp/scb`;
}

/**
 * Resolve the SCB MCP server URL.
 * Priority:
 *   1. `SCB_MCP_SERVER_URL` env var (explicit override — e.g. from `mcp-setup.sh`).
 *   2. AWF sandbox auto-detection (GH_AW_MCP_CONFIG or MCP_GATEWAY_API_KEY) → gateway route.
 *   3. Direct onrender HTTPS endpoint (local dev fallback).
 *
 * Gateway routing is mandatory inside the AWF sandbox because the api-proxy
 * TLS MITM produces `EPROTO SSL wrong version number` on direct HTTPS.
 */
function getDefaultScbServerUrl(): string {
  const explicit = process.env['SCB_MCP_SERVER_URL'];
  if (explicit) return explicit;
  if (process.env['MCP_GATEWAY_API_KEY']) return buildScbGatewayUrl();
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      if (gateway?.['apiKey']) return buildScbGatewayUrl();
      const mcpServers = raw['mcpServers'] as Record<string, unknown> | undefined;
      const scb = mcpServers?.['scb'] as Record<string, unknown> | undefined;
      const headers = scb?.['headers'] as Record<string, unknown> | undefined;
      if (headers?.['Authorization']) return buildScbGatewayUrl();
    }
  } catch {
    // Best-effort — fall through to direct URL.
  }
  return DIRECT_SCB_SERVER_URL;
}

const DEFAULT_SERVER_URL = getDefaultScbServerUrl();
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
   * Fetch data from a specific SCB table via the `query_table` MCP tool.
   *
   * The pxweb-mcp server expects `table_id` and `value_codes` parameters
   * (not the legacy `tableId`/`selection` names).
   *
   * @param tableId - SCB table identifier (e.g., 'TAB5765')
   * @param valueCodes - Optional value_codes filters passed directly to pxweb-mcp
   *   (e.g., `{ Tid: 'top(4)', Region: '00', Kon: '1+2' }`)
   * @returns Array of data points
   */
  async getTableData(
    tableId: string,
    valueCodes?: Record<string, string>,
  ): Promise<SCBDataPoint[]> {
    const params: Record<string, unknown> = { table_id: tableId };
    if (valueCodes) {
      params.value_codes = valueCodes;
    }
    const result = await this.callTool<SCBDataPoint[]>('query_table', params);
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
    try {
      const response = await this.fetchWithRetry(toolName, params);
      return response as T;
    } catch (error) {
      console.warn(`SCB MCP call to ${toolName} failed:`, error instanceof Error ? error.message : error);
      return null;
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

      const text = json.result?.content?.[0]?.text;
      if (text) {
        try {
          return JSON.parse(text);
        } catch {
          console.warn(`SCB MCP response for ${toolName} was not valid JSON; treating as error`);
          throw new Error(`SCB MCP response for ${toolName} was not valid JSON`);
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
