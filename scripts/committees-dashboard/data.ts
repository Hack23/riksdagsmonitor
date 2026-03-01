/**
 * @module Analytics/CommitteeIntelligence/Data
 * @description Configuration constants and DataManager class for the Committee Intelligence Dashboard.
 * Handles data fetching from CIA data files with local fallback to remote URLs,
 * in-memory caching, and CSV parsing via PapaParse.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Papa: any;
import type {
  AppConfig,
  CommitteeData,
  ProductivityMatrixRow,
  AnnualDocumentRow,
  SeasonalPatternRow,
  CacheEntry,
} from './types.js';

// ==============================================
// CONFIGURATION
// ==============================================

export const CONFIG: AppConfig = {
  // CIA Data Sources - Local files with remote fallback
  dataUrls: {
    productivityMatrix: ['cia-data/distribution_committee_productivity_matrix.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_committee_productivity_matrix.csv'],
    committeeDecisions: ['cia-data/view_riksdagen_committee_decisions.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_committee_decisions_sample.csv'],
    annualDocuments: ['cia-data/distribution_annual_committee_documents.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_annual_committee_documents.csv'],
    ballotSummary: ['cia-data/view_riksdagen_committee_ballot_decision_party_summary.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_committee_ballot_decision_party_summary_sample.csv'],
    seasonalPatterns: ['cia-data/percentile_seasonal_activity_patterns.csv', 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/percentile_seasonal_activity_patterns.csv']
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    prefix: 'riksdag_committee_'
  },
  
  // Committee definitions with Swedish abbreviations
  committees: [
    { code: 'AU', name: 'Foreign Affairs Committee', nameLocalized: { sv: 'Utrikesutskottet', en: 'Foreign Affairs Committee' }, color: '#1e88e5', domain: 'Foreign Policy' },
    { code: 'CU', name: 'Civil Affairs Committee', nameLocalized: { sv: 'Civilutskottet', en: 'Civil Affairs Committee' }, color: '#43a047', domain: 'Civil Law' },
    { code: 'FiU', name: 'Finance Committee', nameLocalized: { sv: 'Finansutskottet', en: 'Finance Committee' }, color: '#fb8c00', domain: 'Economics' },
    { code: 'FöU', name: 'Defense Committee', nameLocalized: { sv: 'Försvarsutskottet', en: 'Defense Committee' }, color: '#e53935', domain: 'National Security' },
    { code: 'JuU', name: 'Justice Committee', nameLocalized: { sv: 'Justitieutskottet', en: 'Justice Committee' }, color: '#8e24aa', domain: 'Justice' },
    { code: 'KU', name: 'Constitutional Committee', nameLocalized: { sv: 'Konstitutionsutskottet', en: 'Constitutional Committee' }, color: '#3949ab', domain: 'Constitution' },
    { code: 'KrU', name: 'Cultural Affairs Committee', nameLocalized: { sv: 'Kulturutskottet', en: 'Cultural Affairs Committee' }, color: '#00acc1', domain: 'Culture' },
    { code: 'MjU', name: 'Environment Committee', nameLocalized: { sv: 'Miljö- och jordbruksutskottet', en: 'Environment Committee' }, color: '#7cb342', domain: 'Environment' },
    { code: 'NU', name: 'Business Committee', nameLocalized: { sv: 'Näringsutskottet', en: 'Business Committee' }, color: '#ff6f00', domain: 'Business' },
    { code: 'SkU', name: 'Taxation Committee', nameLocalized: { sv: 'Skatteutskottet', en: 'Taxation Committee' }, color: '#d32f2f', domain: 'Taxation' },
    { code: 'SoU', name: 'Social Insurance Committee', nameLocalized: { sv: 'Socialförsäkringsutskottet', en: 'Social Insurance Committee' }, color: '#c2185b', domain: 'Social Welfare' },
    { code: 'TU', name: 'Transport Committee', nameLocalized: { sv: 'Trafikutskottet', en: 'Transport Committee' }, color: '#0097a7', domain: 'Transportation' },
    { code: 'UbU', name: 'Education Committee', nameLocalized: { sv: 'Utbildningsutskottet', en: 'Education Committee' }, color: '#5e35b1', domain: 'Education' },
    { code: 'UFöU', name: 'Foreign Defense Committee', nameLocalized: { sv: 'Utrikes- och försvarsutskottet', en: 'Foreign Defense Committee' }, color: '#f57c00', domain: 'Security Policy' },
    { code: 'UU', name: 'Foreign Affairs Sub-Committee', nameLocalized: { sv: 'Utrikesutskottets underutskott', en: 'Foreign Affairs Sub-Committee' }, color: '#1565c0', domain: 'Foreign Policy' }
  ],
  
  // Visualization dimensions
  dimensions: {
    network: { width: 1200, height: 700 },
    heatmap: { width: 1200, height: 600 },
    chart: { aspectRatio: 2 }
  }
};

// ==============================================
// DATA FETCHING & CACHING
// ==============================================

export class DataManager {
  private cache: Map<string, Record<string, any>[]>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Fetch CSV data with caching support
   * @param {string} key - Cache key identifier
   * @param {string|string[]} url - URL(s) to fetch data from (tries in order if array)
   * @returns {Promise<Record<string, any>[]>} Parsed CSV data
   */
  async fetchData(key: string, url: string | string[]): Promise<Record<string, any>[]> {
    // Check cache first
    if (CONFIG.cache.enabled) {
      const cached = this.getCached(key);
      if (cached) {
        console.log(`[DataManager] Using cached data for ${key}`);
        return cached;
      }
    }

    // Convert single URL to array for consistent handling
    const urls: string[] = Array.isArray(url) ? url : [url];
    let lastError: Error | null = null;

    // Try each URL in order (local first, then remote fallback)
    for (let i = 0; i < urls.length; i++) {
      const currentUrl: string = urls[i];
      try {
        console.log(`[DataManager] Fetching ${key} from ${currentUrl}`);
        const response: Response = await fetch(currentUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText: string = await response.text();
        
        // Parse CSV using Papa Parse
        if (typeof Papa === 'undefined') {
          throw new Error('Papa Parse library not loaded');
        }

        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        if (parsed.errors.length > 0) {
          console.warn(`[DataManager] CSV parsing warnings for ${key}:`, parsed.errors);
        }

        const data: Record<string, any>[] = parsed.data;
        
        // Cache the result
        if (CONFIG.cache.enabled) {
          this.setCached(key, data);
        }

        console.log(`[DataManager] Successfully loaded ${key} from ${i === 0 ? 'local' : 'remote'} source`);
        return data;
      } catch (error: unknown) {
        console.warn(`[DataManager] Failed to fetch ${key} from ${currentUrl}:`, (error as Error).message);
        lastError = error as Error;
        // Continue to next URL if available
      }
    }

    // All URLs failed
    console.error(`[DataManager] All sources failed for ${key}`);
    throw lastError || new Error(`Failed to fetch ${key} from any source`);
  }

  /**
   * Get cached data if valid
   * @param {string} key - Cache key
   * @returns {Record<string, any>[] | null} Cached data or null
   */
  getCached(key: string): Record<string, any>[] | null {
    const cacheKey: string = CONFIG.cache.prefix + key;
    try {
      const cached: string | null = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const { data, timestamp }: CacheEntry = JSON.parse(cached);
      const age: number = Date.now() - timestamp;
      
      if (age < CONFIG.cache.ttl) {
        return data;
      } else {
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error: unknown) {
      // localStorage might be disabled, in privacy mode, or have quota issues
      // OR JSON parse error if data is corrupted
      console.warn('[DataManager] Cache read failed:', error);
      try {
        localStorage.removeItem(cacheKey);
      } catch (_e: unknown) {
        // Ignore if removal also fails
      }
      return null;
    }
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {Record<string, any>[]} data - Data to cache
   */
  setCached(key: string, data: Record<string, any>[]): void {
    const cacheKey: string = CONFIG.cache.prefix + key;
    const cacheData: CacheEntry = {
      data: data,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error: unknown) {
      console.warn(`[DataManager] Failed to cache ${key}:`, error);
    }
  }

  /**
   * Load all committee data
   * @returns {Promise<CommitteeData>} All committee data
   */
  async loadAllData(): Promise<CommitteeData> {
    try {
      const [
        productivityMatrix,
        committeeDecisions,
        annualDocuments,
        ballotSummary,
        seasonalPatterns
      ] = await Promise.all([
        this.fetchData('productivityMatrix', CONFIG.dataUrls.productivityMatrix),
        this.fetchData('committeeDecisions', CONFIG.dataUrls.committeeDecisions),
        this.fetchData('annualDocuments', CONFIG.dataUrls.annualDocuments),
        this.fetchData('ballotSummary', CONFIG.dataUrls.ballotSummary),
        this.fetchData('seasonalPatterns', CONFIG.dataUrls.seasonalPatterns)
      ]);

      return {
        productivityMatrix: productivityMatrix as ProductivityMatrixRow[],
        committeeDecisions,
        annualDocuments: annualDocuments as AnnualDocumentRow[],
        ballotSummary,
        seasonalPatterns: seasonalPatterns as SeasonalPatternRow[]
      };
    } catch (error: unknown) {
      console.error('[DataManager] Failed to load all data:', error);
      throw error;
    }
  }
}

