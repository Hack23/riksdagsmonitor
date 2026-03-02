/**
 * @module WorldBank/Client
 * @description TypeScript REST client for the World Bank Open Data API.
 * Provides direct HTTP access to World Bank economic indicators for Sweden
 * and Nordic comparison countries, used to enrich political intelligence
 * with economic context.
 *
 * Based on the World Bank MCP Server pattern (https://github.com/anshumax/world_bank_mcp_server)
 * but implemented as a native TypeScript HTTP client for build-time data fetching.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 * @see https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single World Bank indicator data point */
export interface WorldBankDataPoint {
  readonly countryId: string;
  readonly countryName: string;
  readonly indicatorId: string;
  readonly indicatorName: string;
  readonly date: string;
  readonly value: number;
}

/** Metadata about a World Bank indicator */
export interface WorldBankIndicator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
}

/** Response from the World Bank API (paginated JSON) */
interface WorldBankApiResponse {
  readonly page: number;
  readonly pages: number;
  readonly per_page: string;
  readonly total: number;
}

/** Raw indicator value from the API */
interface RawIndicatorValue {
  indicator?: { id?: string; value?: string };
  country?: { id?: string; value?: string };
  date?: string;
  value?: number | null;
}

/** Client configuration */
export interface WorldBankClientConfig {
  readonly baseURL?: string;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.worldbank.org/v2';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 2;

/** ISO 3166-1 alpha-3 codes for Sweden and comparison countries */
export const COUNTRY_CODES = {
  sweden: 'SWE',
  denmark: 'DNK',
  norway: 'NOR',
  finland: 'FIN',
  germany: 'DEU',
  eu: 'EUU',
} as const;

/**
 * Key World Bank indicator IDs relevant to Swedish political intelligence.
 * These indicators provide economic context for policy analysis.
 */
export const INDICATOR_IDS = {
  /** GDP growth (annual %) */
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  /** Unemployment, total (% of total labor force) */
  unemployment: 'SL.UEM.TOTL.ZS',
  /** Inflation, consumer prices (annual %) */
  inflation: 'FP.CPI.TOTL.ZG',
  /** Population, total */
  population: 'SP.POP.TOTL',
  /** Trade (% of GDP) */
  tradeGdpPct: 'NE.TRD.GNFS.ZS',
  /** Government expenditure (% of GDP) */
  govExpenditure: 'GC.XPN.TOTL.GD.ZS',
  /** GDP per capita, PPP (current international $) */
  gdpPerCapitaPpp: 'NY.GDP.PCAP.PP.CD',
  /** Current account balance (% of GDP) */
  currentAccountBalance: 'BN.CAB.XOKA.GD.ZS',
  /** Military expenditure (% of GDP) */
  militaryExpenditure: 'MS.MIL.XPND.GD.ZS',
  /** CO2 emissions (metric tons per capita) */
  co2Emissions: 'EN.ATM.CO2E.PC',
  /** GINI index */
  giniIndex: 'SI.POV.GINI',
  /** Research and development expenditure (% of GDP) */
  rdExpenditure: 'GB.XPD.RSDV.GD.ZS',
  /** Tax revenue (% of GDP) — relevant to SkU taxation committee */
  taxRevenue: 'GC.TAX.TOTL.GD.ZS',
  /** Rule of law estimate — relevant to KU constitution committee */
  ruleOfLaw: 'RL.EST',
  /** Voice and accountability estimate — relevant to KU constitution committee */
  voiceAccountability: 'VA.EST',
  /** Government effectiveness estimate — relevant to KU constitution committee */
  govEffectiveness: 'GE.EST',
} as const;

// ---------------------------------------------------------------------------
// WorldBankClient class
// ---------------------------------------------------------------------------

/**
 * HTTP client for the World Bank Open Data API.
 * Fetches economic indicator data for Sweden and comparison countries.
 */
export class WorldBankClient {
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;

  constructor(config: WorldBankClientConfig = {}) {
    this.baseURL = config.baseURL ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /**
   * Fetch indicator data for a specific country.
   *
   * @param countryCode - ISO 3166-1 alpha-3 country code (e.g., 'SWE')
   * @param indicatorId - World Bank indicator ID (e.g., 'NY.GDP.MKTP.KD.ZG')
   * @param perPage - Maximum number of records to fetch (default: 50)
   * @returns Array of data points sorted by date descending
   */
  async getIndicator(
    countryCode: string,
    indicatorId: string,
    perPage = 50,
  ): Promise<WorldBankDataPoint[]> {
    const url = `${this.baseURL}/country/${encodeURIComponent(countryCode)}/indicator/${encodeURIComponent(indicatorId)}?format=json&per_page=${perPage}`;

    const data = await this.fetchWithRetry(url);

    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      return [];
    }

    return (data[1] as RawIndicatorValue[])
      .filter((item): item is RawIndicatorValue & { value: number } => item.value !== null && item.value !== undefined)
      .map((item) => ({
        countryId: item.country?.id ?? countryCode,
        countryName: item.country?.value ?? countryCode,
        indicatorId: item.indicator?.id ?? indicatorId,
        indicatorName: item.indicator?.value ?? indicatorId,
        date: item.date ?? '',
        value: item.value,
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.date, 10);
        const yearB = parseInt(b.date, 10);
        if (isNaN(yearA) && isNaN(yearB)) return 0;
        if (isNaN(yearA)) return 1;
        if (isNaN(yearB)) return -1;
        return yearB - yearA;
      });
  }

  /**
   * Fetch the latest available value for an indicator.
   *
   * @param countryCode - ISO 3166-1 alpha-3 country code
   * @param indicatorId - World Bank indicator ID
   * @returns Most recent data point, or null if no data
   */
  async getLatestIndicator(
    countryCode: string,
    indicatorId: string,
  ): Promise<WorldBankDataPoint | null> {
    const results = await this.getIndicator(countryCode, indicatorId, 10);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Compare an indicator across multiple countries.
   *
   * @param countryCodes - Array of ISO 3166-1 alpha-3 codes
   * @param indicatorId - World Bank indicator ID
   * @returns Map of country code → latest data point
   */
  async compareCountries(
    countryCodes: readonly string[],
    indicatorId: string,
  ): Promise<Map<string, WorldBankDataPoint | null>> {
    const results = new Map<string, WorldBankDataPoint | null>();

    // Fetch sequentially to respect API rate limits
    for (const code of countryCodes) {
      try {
        const latest = await this.getLatestIndicator(code, indicatorId);
        results.set(code, latest);
      } catch {
        results.set(code, null);
      }
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async fetchWithRetry(url: string, attempt = 0): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = 1000 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, attempt + 1);
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

let defaultWorldBankClient: WorldBankClient | null = null;

/** Get or create the default singleton WorldBankClient */
export function getDefaultWorldBankClient(): WorldBankClient {
  if (!defaultWorldBankClient) {
    defaultWorldBankClient = new WorldBankClient();
  }
  return defaultWorldBankClient;
}
