/**
 * @module imf/transport/datamapper
 * @description IMF Datamapper REST transport (unauthenticated).
 *
 * Datamapper is the simple JSON surface — `/external/datamapper/api/v1`
 * — best for headline WEO indicators and the indicator catalog. Never
 * receives the SDMX subscription key (defensive: any caller that
 * accidentally injects `Ocp-Apim-Subscription-Key` here is a bug; the
 * SDMX gateway uses a different host anyway).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { toDatamapperCode } from '../../imf-codes.js';
import { ImfWeoSdmxOnlyError } from '../errors/weo-sdmx-only.js';
import { IMF_WEO_SDMX_ONLY } from '../indicators/weo.js';
import {
  parseDatamapperIndicators,
  parseDatamapperValues,
  type DatamapperIndicatorsResponse,
  type DatamapperResponse,
  type ImfDatamapperIndicatorMeta,
} from '../parsers/datamapper-envelope.js';
import type { ImfDataPoint } from '../types.js';
import { fetchWithRetry } from './fetch-with-retry.js';

export interface DatamapperTransportOptions {
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly userAgent: string;
  readonly weoVintage: string;
}

/**
 * Fetch a WEO time series for one country via the Datamapper.
 *
 * Throws {@link ImfWeoSdmxOnlyError} when the requested code is in
 * `IMF_WEO_SDMX_ONLY` and Datamapper returns zero points — masking
 * silent zero-point returns that would otherwise look like an outage.
 */
export async function fetchDatamapperWeoIndicator(
  iso3: string,
  weoCode: string,
  years: number,
  options: DatamapperTransportOptions,
): Promise<ImfDataPoint[]> {
  if (years < 1 || !Number.isInteger(years)) {
    throw new Error(`getWeoIndicator: 'years' must be a positive integer, got ${years}`);
  }
  const code = toDatamapperCode(iso3);
  const url = `${options.baseURL}/${encodeURIComponent(weoCode)}/${encodeURIComponent(code)}`;
  const raw = (await fetchWithRetry(url, {
    timeout: options.timeout,
    maxRetries: options.maxRetries,
    userAgent: options.userAgent,
  })) as DatamapperResponse;

  const points = parseDatamapperValues(raw, weoCode, code, options.weoVintage);
  if (points.length === 0 && IMF_WEO_SDMX_ONLY.has(weoCode)) {
    throw new ImfWeoSdmxOnlyError(iso3, weoCode);
  }
  return points.slice(0, years);
}

/** Fetch the Datamapper indicator catalog (`/indicators`). */
export async function fetchDatamapperIndicators(
  options: DatamapperTransportOptions,
): Promise<Map<string, ImfDatamapperIndicatorMeta>> {
  const url = `${options.baseURL}/indicators`;
  const raw = (await fetchWithRetry(url, {
    timeout: options.timeout,
    maxRetries: options.maxRetries,
    userAgent: options.userAgent,
  })) as DatamapperIndicatorsResponse;
  return parseDatamapperIndicators(raw);
}
