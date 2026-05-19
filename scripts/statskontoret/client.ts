/**
 * @module scripts/statskontoret/client
 * @description Thin HTTP transport for Statskontoret open-data pages.
 *
 * Discovers downloadable Excel/CSV-ZIP links and fetches workbooks/archives
 * through an allowlisted fetch guard.  Parsing belongs in the `parsers/`
 * and `domain/` modules — this class is purely transport.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { StatskontoretError } from './errors.js';
import { extractStatskontoretDownloadLinks } from './extractors/download-links.js';
import { parseStatskontoretCsvZip } from './parsers/csv-zip.js';
import { parseStatskontoretXlsx } from './parsers/xlsx.js';
import {
  STATSKONTORET_BASE_URL,
  getStatskontoretSource,
} from './source-registry.js';
import { trimTrailingSlash } from './internal/text.js';
import {
  assertStatskontoretFetchTarget,
  resolveStatskontoretUrl,
} from './internal/url-guard.js';
import type {
  StatskontoretClientConfig,
  StatskontoretDownloadLink,
  StatskontoretSourceKey,
  StatskontoretWorkbook,
} from './types.js';

const DEFAULT_TIMEOUT = 15_000;

export class StatskontoretClient {
  readonly baseURL: string;
  readonly timeout: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: StatskontoretClientConfig = {}) {
    this.baseURL = trimTrailingSlash(config.baseURL ?? STATSKONTORET_BASE_URL);
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  async discoverDownloads(sourceKey: StatskontoretSourceKey): Promise<StatskontoretDownloadLink[]> {
    const source = getStatskontoretSource(sourceKey);
    const pageUrl = resolveStatskontoretUrl(source.url, this.baseURL);
    const html = await this.fetchText(pageUrl);
    return extractStatskontoretDownloadLinks(html, sourceKey, pageUrl, this.baseURL);
  }

  async fetchWorkbook(url: string): Promise<StatskontoretWorkbook> {
    const buffer = await this.fetchArrayBuffer(url);
    return parseStatskontoretXlsx(buffer);
  }

  async fetchCsvZip(url: string): Promise<Record<string, string>> {
    const buffer = await this.fetchArrayBuffer(url);
    return parseStatskontoretCsvZip(buffer);
  }

  async fetchText(url: string): Promise<string> {
    const response = await this.fetchWithTimeout(url);
    return response.text();
  }

  async fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    const response = await this.fetchWithTimeout(url);
    return response.arrayBuffer();
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const resolved = resolveStatskontoretUrl(url, this.baseURL);
    assertStatskontoretFetchTarget(resolved, this.baseURL);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    let response: Response;
    try {
      response = await this.fetchFn(resolved, {
        signal: controller.signal,
        headers: {
          Accept:
            'text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/csv,*/*',
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new StatskontoretError(
        `Statskontoret fetch failed for ${resolved}: ${detail}`,
        'http',
        { cause: error },
      );
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      throw new StatskontoretError(
        `Statskontoret API error: ${response.status} ${response.statusText} for ${response.url}`,
        'http',
      );
    }
    return response;
  }
}
