/**
 * @module data-transformers/load-economic-context
 * @description Loader for the per-article `economic-data.json` artefact
 * produced by agentic workflows during the pre-article analysis phase.
 *
 * The loader bridges the data produced by workflow agents (which call
 * the World Bank / SCB MCP tools and the in-repo IMF TypeScript client
 * via `tsx scripts/imf-fetch.ts`) and the HTML renderer in
 * `content-generators/economic-dashboard-section.ts`. When the JSON file
 * exists and contains `dataPoints` with at least one entry, the renderer
 * emits real `data-chart-config` Chart.js canvases; when it is missing or
 * empty the caller should fail the build (see
 * `scripts/validate-economic-context.ts`) so the placeholder bullet list
 * can never ship to production.
 *
 * Expected file path:
 *   analysis/daily/YYYY-MM-DD/{slug}/economic-data.json
 * where `{slug}` is mapped via `ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER`
 * (e.g. committee-reports → committeeReports).
 *
 * Schema:
 *   analysis/schemas/economic-data.schema.json
 *
 * Schema v2.0 (2026-04-20) — additive:
 *   - `source.imf[]` accepted alongside `source.worldBank[]` / `source.scb[]`
 *   - `dataPoints[].provider` ('worldBank' | 'imf' | 'scb') — defaults to 'worldBank' when omitted
 *   - `dataPoints[].projection` boolean — marks forecast values (IMF WEO/FM)
 *   - `dataPoints[].projectionVintage` string — vintage tag (e.g. 'WEO-2026-04')
 * v1 artefacts are still accepted unchanged; the loader fills defaults.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EconomicDataPoint } from './content-generators/economic-dashboard-section.js';
import { ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER } from '../analysis-references.js';

/**
 * Attribution source list as it appears in the on-disk
 * `economic-data.json` artefact. `imf` is optional for schema v1
 * back-compat; schema v2+ writers should emit it (the loader always
 * normalises it to an array in {@link EconomicContextSource}).
 */
export interface EconomicContextSourceFile {
  /** World Bank indicator IDs actually queried (e.g. `NY.GDP.MKTP.KD.ZG`). */
  worldBank: string[];
  /** SCB table IDs actually queried (e.g. `TAB1291`). */
  scb: string[];
  /**
   * IMF citation strings actually queried (e.g. `WEO:NGDP_RPCH`,
   * `FM:GGXWDG_NGDP`). Absent in schema v1 artefacts.
   */
  imf?: string[];
}

/**
 * Attribution source list as surfaced by {@link loadEconomicContext}.
 * The loader always populates `imf` (empty array for v1 artefacts) so
 * downstream consumers never need to null-check.
 */
export interface EconomicContextSource {
  /** World Bank indicator IDs actually queried (e.g. `NY.GDP.MKTP.KD.ZG`). */
  worldBank: string[];
  /** SCB table IDs actually queried (e.g. `TAB1291`). */
  scb: string[];
  /**
   * IMF citation strings actually queried (e.g. `WEO:NGDP_RPCH`,
   * `FM:GGXWDG_NGDP`). Always populated as an array by the loader —
   * may be empty on v1 files.
   */
  imf: string[];
}

/** Schema v2+ provider tag on each data point. */
export type EconomicDataProvider = 'worldBank' | 'imf' | 'scb';

/** Schema v2+ enriched data point adding provider + projection metadata. */
export interface EnrichedEconomicDataPoint extends EconomicDataPoint {
  /** Provider that supplied the value. Defaults to 'worldBank' for v1 artefacts. */
  provider: EconomicDataProvider;
  /** True when the value is a forecast (IMF WEO/FM). */
  projection: boolean;
  /** Vintage tag of the projection release (e.g. 'WEO-2026-04'). Present only when projection=true. */
  projectionVintage?: string;
}

/**
 * Parsed shape of `economic-data.json`. The agent writes this file during
 * the pre-article analysis phase and the renderer reads it to decide
 * whether to emit real charts or fail the quality gate.
 */
export interface EconomicContextFile {
  /** Version of the contract this file was produced against ('1.0' or '2.0'). */
  version?: string;
  /** Article type slug (e.g. `committee-reports`). */
  articleType?: string;
  /** ISO date (YYYY-MM-DD) the file was produced for. */
  date?: string;
  /** Policy domains detected from the source documents. */
  policyDomains: string[];
  /**
   * Data points driving Chart.js canvases. In schema v2 each point MAY
   * carry a `provider` / `projection` / `projectionVintage` triple; the
   * loader preserves them when present and defaults missing values for
   * back-compat with v1 artefacts.
   */
  dataPoints: EconomicDataPoint[];
  /**
   * AI-authored commentary paragraph. MUST reference 2–3 concrete
   * values from `dataPoints`. 2–4 sentences.
   */
  commentary: string;
  /** Attribution sources for the footer / compliance gate. */
  source: EconomicContextSourceFile;
  /**
   * Explicit opt-out for pure-process article types (e.g. realtime
   * monitor stories about parliamentary procedure). When `true`,
   * the renderer omits the economic dashboard section entirely and
   * the validator treats the slug as exempt.
   *
   * The validator enforces an allow-list so `skip: true` is only
   * honoured for specific article types.
   */
  skip?: boolean;
  /** Free-form note explaining a `skip: true` decision. */
  skipReason?: string;
}

/**
 * Extra data passed to the economic dashboard renderer, filled in from
 * the `economic-data.json` artefact when it exists.
 */
export interface LoadedEconomicContext {
  /** Contract version the artefact was produced against ('1.0' | '2.0'). */
  version: string;
  /** Policy domains to feed into `findIndicatorsForDomains`. */
  policyDomains: string[];
  /**
   * Data points driving real Chart.js canvases. Keeps the v1 shape for
   * existing consumers; call `enrichedDataPoints` to see provider /
   * projection metadata.
   */
  dataPoints: EconomicDataPoint[];
  /**
   * Data points with v2 provider / projection metadata expanded. Always
   * available — for v1 artefacts every point is `{provider: 'worldBank',
   * projection: false}`.
   */
  enrichedDataPoints: EnrichedEconomicDataPoint[];
  /** AI commentary used as the dashboard section `summary`. */
  commentary: string;
  /** Attribution sources. */
  source: EconomicContextSource;
  /** Relative filesystem path the context was loaded from (for logging). */
  sourcePath: string;
  /** Whether the workflow explicitly opted out of economic context. */
  skip: boolean;
  /** Free-form skip reason, when `skip` is `true`. */
  skipReason?: string;
}

/**
 * Compute the filesystem path for an article's `economic-data.json`.
 *
 * @param date - Article date in `YYYY-MM-DD` format
 * @param articleType - Article type slug (kebab-case), e.g. `committee-reports`
 * @param rootDir - Repository root (defaults to CWD). Injectable for tests.
 * @returns Absolute or CWD-relative path. The file may or may not exist.
 */
export function economicDataPath(
  date: string,
  articleType: string,
  rootDir: string = process.cwd(),
): string {
  const subfolder = ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER[articleType] ?? articleType;
  return path.join(rootDir, 'analysis', 'daily', date, subfolder, 'economic-data.json');
}

/**
 * Helpers for the type guard below.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

/**
 * Type guard for a single `EconomicDataPoint`. Each point drives Chart.js
 * rendering so a malformed shape here surfaces as a blank/broken chart
 * downstream — validate aggressively.
 *
 * Schema v2 additions (`provider`, `projection`, `projectionVintage`) are
 * accepted but optional — when present their types are validated.
 */
function isEconomicDataPoint(value: unknown): value is EconomicDataPoint {
  if (!isRecord(value)) return false;
  if (
    typeof value['countryCode'] !== 'string' ||
    typeof value['countryName'] !== 'string' ||
    typeof value['indicatorId'] !== 'string' ||
    typeof value['date'] !== 'string' ||
    typeof value['value'] !== 'number' ||
    !Number.isFinite(value['value'])
  ) {
    return false;
  }
  // Schema v2 optional fields: only reject when present with the wrong type.
  if ('provider' in value && value['provider'] !== undefined) {
    const p = value['provider'];
    if (p !== 'worldBank' && p !== 'imf' && p !== 'scb') return false;
  }
  if ('projection' in value && value['projection'] !== undefined && typeof value['projection'] !== 'boolean') {
    return false;
  }
  if ('projectionVintage' in value && value['projectionVintage'] !== undefined && typeof value['projectionVintage'] !== 'string') {
    return false;
  }
  return true;
}

/**
 * Helper for validating optional fields on `EconomicContextFile`.
 * Accepts when the key is absent or undefined; only rejects when it is
 * present with the wrong runtime type.
 */
function isOptionalFieldOfType(
  obj: Record<string, unknown>,
  key: string,
  expected: 'string' | 'boolean',
): boolean {
  if (!(key in obj)) return true;
  const value = obj[key];
  if (value === undefined) return true;
  return typeof value === expected;
}

/**
 * Type guard for the raw parsed JSON.
 * Validates both the top-level shape AND the element shapes for
 * `dataPoints`, `policyDomains`, and `source.*`, plus optional-field
 * types (`version`, `articleType`, `date`, `skip`, `skipReason`).
 *
 * Schema v2 addition: `source.imf[]` is accepted but optional for v1
 * back-compat. When present it must be a string array.
 */
function isEconomicContextFile(value: unknown): value is EconomicContextFile {
  if (!isRecord(value)) return false;
  const v = value;
  if (!isStringArray(v['policyDomains'])) return false;
  if (!Array.isArray(v['dataPoints']) || !v['dataPoints'].every(isEconomicDataPoint)) return false;
  if (typeof v['commentary'] !== 'string') return false;
  if (!isRecord(v['source'])) return false;
  const s = v['source'];
  if (!isStringArray(s['worldBank']) || !isStringArray(s['scb'])) return false;
  // Schema v2 optional: imf[] string array if present.
  if ('imf' in s && s['imf'] !== undefined && !isStringArray(s['imf'])) return false;
  // Optional fields: present only when typed correctly.
  if (!isOptionalFieldOfType(v, 'version', 'string')) return false;
  if (!isOptionalFieldOfType(v, 'articleType', 'string')) return false;
  if (!isOptionalFieldOfType(v, 'date', 'string')) return false;
  if (!isOptionalFieldOfType(v, 'skip', 'boolean')) return false;
  if (!isOptionalFieldOfType(v, 'skipReason', 'string')) return false;
  return true;
}

/**
 * Load `economic-data.json` for the given article, if it exists and is
 * well-formed. Returns `null` when the file is absent, malformed, or
 * parses to an empty structure — callers interpret a null return as
 * "workflow did not supply economic context" and should fail the
 * quality gate when the article type requires it.
 *
 * This function is intentionally synchronous so it can be called inside
 * the existing synchronous visualization builder without propagating
 * async signatures through 5+ callers.
 *
 * @param date - Article date (`YYYY-MM-DD`)
 * @param articleType - Article type slug (`committee-reports` etc.)
 * @param rootDir - Optional repo root (defaults to `process.cwd()`)
 */
export function loadEconomicContext(
  date: string,
  articleType: string,
  rootDir: string = process.cwd(),
): LoadedEconomicContext | null {
  const filePath = economicDataPath(date, articleType, rootDir);
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isEconomicContextFile(parsed)) return null;
  const file = parsed;

  // Source object — always populate `imf` as an array (empty on v1 back-compat).
  const imfSources = file.source.imf ? [...file.source.imf] : [];

  // Enriched data points — default missing provider/projection for v1.
  const enrichedDataPoints: EnrichedEconomicDataPoint[] = file.dataPoints.map((dp) => {
    const raw = dp as EconomicDataPoint & {
      provider?: EconomicDataProvider;
      projection?: boolean;
      projectionVintage?: string;
    };
    const enriched: EnrichedEconomicDataPoint = {
      ...dp,
      provider: raw.provider ?? 'worldBank',
      projection: raw.projection === true,
    };
    if (typeof raw.projectionVintage === 'string' && raw.projectionVintage.length > 0) {
      enriched.projectionVintage = raw.projectionVintage;
    }
    return enriched;
  });

  return {
    version: typeof file.version === 'string' ? file.version : '1.0',
    policyDomains: [...file.policyDomains],
    dataPoints: [...file.dataPoints],
    enrichedDataPoints,
    commentary: file.commentary,
    source: {
      worldBank: [...file.source.worldBank],
      scb: [...file.source.scb],
      imf: imfSources,
    },
    sourcePath: path.relative(rootDir, filePath) || filePath,
    skip: file.skip === true,
    skipReason: typeof file.skipReason === 'string' ? file.skipReason : undefined,
  };
}
