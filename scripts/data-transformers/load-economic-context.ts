/**
 * @module data-transformers/load-economic-context
 * @description Loader for the per-article `economic-data.json` artefact
 * produced by agentic workflows during the pre-article analysis phase.
 *
 * The loader bridges the data produced by workflow agents (which call
 * World Bank / SCB MCP tools) and the HTML renderer in
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
 * @author Hack23 AB
 * @license Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EconomicDataPoint } from './content-generators/economic-dashboard-section.js';
import { ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER } from '../analysis-references.js';

/**
 * Attribution source list written by the agentic workflow when fetching
 * economic context. Both sub-fields MAY be empty arrays but the keys
 * MUST be present for schema stability.
 */
export interface EconomicContextSource {
  /** World Bank indicator IDs actually queried (e.g. `NY.GDP.MKTP.KD.ZG`). */
  worldBank: string[];
  /** SCB table IDs actually queried (e.g. `TAB1291`). */
  scb: string[];
}

/**
 * Parsed shape of `economic-data.json`. The agent writes this file during
 * the pre-article analysis phase and the renderer reads it to decide
 * whether to emit real charts or fail the quality gate.
 */
export interface EconomicContextFile {
  /** Version of the contract this file was produced against. */
  version?: string;
  /** Article type slug (e.g. `committee-reports`). */
  articleType?: string;
  /** ISO date (YYYY-MM-DD) the file was produced for. */
  date?: string;
  /** Policy domains detected from the source documents. */
  policyDomains: string[];
  /** World Bank data points (see `EconomicDataPoint`). */
  dataPoints: EconomicDataPoint[];
  /**
   * AI-authored commentary paragraph. MUST reference 2–3 concrete
   * values from `dataPoints`. 2–4 sentences.
   */
  commentary: string;
  /** Attribution sources for the footer / compliance gate. */
  source: EconomicContextSource;
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
  /** Policy domains to feed into `findIndicatorsForDomains`. */
  policyDomains: string[];
  /** World Bank data points that drive real Chart.js canvases. */
  dataPoints: EconomicDataPoint[];
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
 */
function isEconomicDataPoint(value: unknown): value is EconomicDataPoint {
  if (!isRecord(value)) return false;
  return (
    typeof value['countryCode'] === 'string' &&
    typeof value['countryName'] === 'string' &&
    typeof value['indicatorId'] === 'string' &&
    typeof value['date'] === 'string' &&
    typeof value['value'] === 'number' &&
    Number.isFinite(value['value'])
  );
}

/**
 * Type guard for the raw parsed JSON.
 * Validates both the top-level shape AND the element shapes for
 * `dataPoints`, `policyDomains`, and `source.*`, plus optional-field
 * types (`version`, `articleType`, `date`, `skip`, `skipReason`).
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
  // Optional fields: present only when typed correctly.
  if ('version' in v && v['version'] !== undefined && typeof v['version'] !== 'string') return false;
  if ('articleType' in v && v['articleType'] !== undefined && typeof v['articleType'] !== 'string') return false;
  if ('date' in v && v['date'] !== undefined && typeof v['date'] !== 'string') return false;
  if ('skip' in v && v['skip'] !== undefined && typeof v['skip'] !== 'boolean') return false;
  if ('skipReason' in v && v['skipReason'] !== undefined && typeof v['skipReason'] !== 'string') return false;
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

  return {
    policyDomains: [...file.policyDomains],
    dataPoints: [...file.dataPoints],
    commentary: file.commentary,
    source: {
      worldBank: [...file.source.worldBank],
      scb: [...file.source.scb],
    },
    sourcePath: path.relative(rootDir, filePath) || filePath,
    skip: file.skip === true,
    skipReason: typeof file.skipReason === 'string' ? file.skipReason : undefined,
  };
}
