/**
 * @module imf/parsers/datamapper-envelope
 * @description Pure parsers for the IMF Datamapper JSON envelopes.
 *
 * No I/O, no transport — only the JSON → typed-record transform. The
 * `parseDatamapperValues` function is the only place `projection`
 * detection happens (year > current calendar year → projection).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ImfDataPoint } from '../types.js';

/** Shape of the IMF Datamapper JSON response (partial). */
export interface DatamapperResponse {
  values?: {
    [indicatorId: string]:
      | {
          [countryCode: string]:
            | {
                [year: string]: number | string | null | undefined;
              }
            | undefined;
        }
      | undefined;
  };
}

/** Defensive parser input: Datamapper can return empty or partial envelopes. */
export type DatamapperEnvelope = Partial<DatamapperResponse> | null | undefined;

/** One entry from `https://www.imf.org/external/datamapper/api/v1/indicators`. */
export interface ImfDatamapperIndicatorMeta {
  /** Canonical Datamapper indicator code (used as the primary key). */
  readonly code: string;
  /** Human-readable label (English). */
  readonly label: string;
  /** Long description (English). */
  readonly description: string;
  /** Source / publisher (typically "IMF"). */
  readonly source: string;
  /** Unit of measurement (e.g. `'Percent of GDP'`, `'Annual percent change'`). */
  readonly unit: string;
  /** IMF dataset family (`WEO`, `FM`, `FPP`, `IFS`, `BOP`, `DOTS`, `GFS_COFOG`, …). */
  readonly dataset: string;
  /** ISO 8601 last-updated timestamp emitted by the catalog (when present). */
  readonly lastUpdate?: string;
}

/** Raw shape of `/external/datamapper/api/v1/indicators`. */
export interface DatamapperIndicatorsResponse {
  indicators?: {
    [code: string]:
      | {
          label?: string;
          description?: string;
          source?: string;
          unit?: string;
          dataset?: string;
          lastUpdate?: string;
        }
      | undefined;
  };
}

/**
 * Parse a raw Datamapper JSON envelope into canonical {@link ImfDataPoint}
 * records for one `(indicator, country)` pair.
 *
 * Defensive posture:
 *  - Missing indicator node → `[]`
 *  - Missing country node → `[]`
 *  - `null` / `undefined` / non-finite / `'n/a'` values dropped (no silent zeros)
 *  - Non-numeric year keys dropped
 *  - Output is sorted descending by year (newest first)
 */
export function parseDatamapperValues(
  raw: DatamapperEnvelope,
  weoCode: string,
  iso3: string,
  weoVintage: string,
): ImfDataPoint[] {
  const indicatorNode = raw?.values?.[weoCode];
  if (!indicatorNode) return [];
  const countryNode = indicatorNode[iso3];
  if (!countryNode) return [];

  const currentYear = new Date().getUTCFullYear();
  const points: ImfDataPoint[] = [];
  for (const [year, rawValue] of Object.entries(countryNode)) {
    if (rawValue === null || rawValue === undefined) continue;
    const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (!Number.isFinite(numeric)) continue;
    const yearInt = Number.parseInt(year, 10);
    if (!Number.isFinite(yearInt)) continue;
    const isProjection = yearInt > currentYear;
    const dp: ImfDataPoint = {
      countryCode: iso3,
      // Datamapper does not return the display name; callers overlay this from COUNTRY_NAMES_EN
      countryName: iso3,
      indicatorId: weoCode,
      indicatorName: weoCode,
      date: year,
      value: numeric,
      projection: isProjection,
      provider: 'imf',
      ...(isProjection ? { projectionVintage: weoVintage } : {}),
    };
    points.push(dp);
  }

  points.sort((a, b) => Number.parseInt(b.date, 10) - Number.parseInt(a.date, 10));
  return points;
}

/**
 * Pure parser for the Datamapper indicator catalog. Skips entries
 * whose `dataset` is missing — defensive against IMF schema drift.
 */
export function parseDatamapperIndicators(
  raw: DatamapperIndicatorsResponse | null | undefined,
): Map<string, ImfDatamapperIndicatorMeta> {
  const out = new Map<string, ImfDatamapperIndicatorMeta>();
  const indicators = raw?.indicators;
  if (!indicators) return out;
  for (const [code, meta] of Object.entries(indicators)) {
    if (!meta || typeof meta !== 'object') continue;
    const dataset = typeof meta.dataset === 'string' ? meta.dataset : '';
    if (!dataset) continue;
    out.set(code, {
      code,
      label: typeof meta.label === 'string' ? meta.label : '',
      description: typeof meta.description === 'string' ? meta.description : '',
      source: typeof meta.source === 'string' ? meta.source : '',
      unit: typeof meta.unit === 'string' ? meta.unit : '',
      dataset,
      ...(typeof meta.lastUpdate === 'string' ? { lastUpdate: meta.lastUpdate } : {}),
    });
  }
  return out;
}
