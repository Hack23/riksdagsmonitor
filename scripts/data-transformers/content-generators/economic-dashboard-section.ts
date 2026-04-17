/**
 * @module data-transformers/content-generators/economic-dashboard-section
 * @description Generates an embeddable economic dashboard section powered by
 * World Bank data indicators. Automatically selects relevant indicators based
 * on detected policy domains in the article content, creating Chart.js
 * dashboards with Nordic country comparisons.
 *
 * Used by agentic workflows and deep inspection analysis to add economic
 * context dashboards to articles when policy areas match World Bank indicators.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type {
  TemplateSection,
  DashboardChartConfig,
  DashboardTableConfig,
} from '../../types/article.js';
import {
  type EconomicIndicatorContext,
  findRelevantIndicators,
  getEconomicHeading,
  NORDIC_COMPARISON,
} from '../../world-bank-context.js';
import { generateDashboardSection } from './dashboard-section.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A World Bank data point for dashboard rendering */
export interface EconomicDataPoint {
  /** Country code (e.g. 'SWE', 'DNK') */
  countryCode: string;
  /** Country name */
  countryName: string;
  /** Indicator ID */
  indicatorId: string;
  /** Year or date string */
  date: string;
  /** Numeric value */
  value: number;
}

/** Options for the economic dashboard section generator */
export interface EconomicDashboardOptions {
  /** Policy domains detected in the article (e.g. ['fiscal', 'defence']) */
  policyDomains: string[];
  /** Optional pre-fetched World Bank data points */
  dataPoints?: EconomicDataPoint[];
  /** Target language */
  lang: Language | string;
  /** Custom title override */
  title?: string;
  /** Optional narrative summary */
  summary?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitize an indicator ID into a safe HTML element id */
function sanitizeChartId(indicatorId: string): string {
  return indicatorId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

const COUNTRY_COLORS: Readonly<Record<string, string>> = {
  SWE: '#00d9ff',  // Cyan (primary)
  DNK: '#ff006e',  // Magenta
  NOR: '#ffbe0b',  // Yellow
  FIN: '#83cf39',  // Green
  DEU: '#9d4edd',  // Purple
};

const COUNTRY_BORDER_COLORS: Readonly<Record<string, string>> = {
  SWE: '#00b8d4',
  DNK: '#d4004e',
  NOR: '#d4a00b',
  FIN: '#6daf2d',
  DEU: '#7d3ebd',
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Sort data points into a stable order based on NORDIC_COMPARISON.countries,
 * falling back to alphabetical country name for any unknown codes.
 */
function sortByNordicOrder(pts: EconomicDataPoint[]): EconomicDataPoint[] {
  const order = NORDIC_COMPARISON.countries;
  return [...pts].sort((a, b) => {
    const idxA = order.indexOf(a.countryCode);
    const idxB = order.indexOf(b.countryCode);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.countryName.localeCompare(b.countryName);
  });
}

/**
 * Find relevant World Bank indicators for a set of policy domains.
 */
export function findIndicatorsForDomains(domains: string[]): EconomicIndicatorContext[] {
  const seen = new Set<string>();
  const result: EconomicIndicatorContext[] = [];
  for (const domain of domains) {
    for (const indicator of findRelevantIndicators(domain)) {
      if (!seen.has(indicator.indicatorId)) {
        seen.add(indicator.indicatorId);
        result.push(indicator);
      }
    }
  }
  return result;
}

/**
 * Build Chart.js chart configurations from economic data points.
 * Groups data by indicator and creates bar charts comparing Nordic countries,
 * radar charts for multi-indicator overviews, and line charts for trends.
 */
export function buildEconomicCharts(
  indicators: EconomicIndicatorContext[],
  dataPoints: EconomicDataPoint[],
): DashboardChartConfig[] {
  const charts: DashboardChartConfig[] = [];

  // Track indicators with latest-year bar data for potential radar chart
  const radarLabels: string[] = [];
  const radarDataByCountry = new Map<string, number[]>();

  for (const indicator of indicators) {
    const points = dataPoints.filter(p => p.indicatorId === indicator.indicatorId);
    if (points.length === 0) continue;

    // Group by country for comparison chart
    const byCountry = new Map<string, EconomicDataPoint[]>();
    for (const p of points) {
      if (!byCountry.has(p.countryCode)) byCountry.set(p.countryCode, []);
      byCountry.get(p.countryCode)!.push(p);
    }

    // Get latest year's data for comparison bar chart
    const latestYear = points.reduce((max, p) => p.date > max ? p.date : max, '');
    const latestPoints = points.filter(p => p.date === latestYear);

    if (latestPoints.length > 0) {
      const sorted = sortByNordicOrder(latestPoints);
      const labels = sorted.map(p =>
        NORDIC_COMPARISON.countryNames[p.countryCode] ?? p.countryName
      );
      const data = sorted.map(p => p.value);
      const bgColors = sorted.map(p => COUNTRY_COLORS[p.countryCode] ?? '#888');
      const borderColors = sorted.map(p => COUNTRY_BORDER_COLORS[p.countryCode] ?? '#666');

      const idBase = sanitizeChartId(indicator.indicatorId);

      // Compute average for annotation
      const avg = data.reduce((s, v) => s + v, 0) / data.length;

      charts.push({
        id: `econ-${idBase}`,
        type: 'bar',
        title: `${indicator.name} (${latestYear})`,
        labels,
        datasets: [{
          label: `${indicator.name} (${indicator.unit})`,
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
        }],
        annotations: [{
          type: 'line',
          value: Math.round(avg * 100) / 100,
          label: `Avg: ${avg.toFixed(1)}`,
          borderColor: 'rgba(255,190,11,0.6)',
        }],
      });

      // Collect data for radar chart
      radarLabels.push(indicator.name);
      for (const p of sorted) {
        if (!radarDataByCountry.has(p.countryCode)) {
          radarDataByCountry.set(p.countryCode, []);
        }
        radarDataByCountry.get(p.countryCode)!.push(p.value);
      }
    }

    // If we have multi-year data, add a trend line chart
    const swedenPoints = (byCountry.get('SWE') ?? []).sort((a, b) => a.date.localeCompare(b.date));
    if (swedenPoints.length >= 3) {
      const trendLabels = swedenPoints.map(p => p.date);
      const trendData = swedenPoints.map(p => p.value);
      const idBase = sanitizeChartId(indicator.indicatorId);
      charts.push({
        id: `econ-trend-${idBase}`,
        type: 'line',
        title: `Sweden: ${indicator.name} Trend`,
        labels: trendLabels,
        datasets: [{
          label: `Sweden ${indicator.name} (${indicator.unit})`,
          data: trendData,
          backgroundColor: 'rgba(0, 217, 255, 0.2)',
          borderColor: '#00d9ff',
          borderWidth: 2,
        }],
      });
    }
  }

  // Add radar overview chart when we have 3+ indicators with cross-country data
  if (radarLabels.length >= 3 && radarDataByCountry.size >= 2) {
    // Normalize values per indicator to 0–100 scale for radar comparability
    const normed = normalizeRadarData(radarLabels, radarDataByCountry);
    const radarDatasets: DashboardChartConfig['datasets'] = [];
    const countryOrder = NORDIC_COMPARISON.countries;

    for (const code of countryOrder) {
      if (!normed.has(code)) continue;
      const color = COUNTRY_COLORS[code] ?? '#888';
      radarDatasets.push({
        label: NORDIC_COMPARISON.countryNames[code] ?? code,
        data: normed.get(code)!,
        backgroundColor: `${color}33`, // 20% opacity
        borderColor: color,
        borderWidth: 2,
      });
    }

    if (radarDatasets.length >= 2) {
      charts.push({
        id: 'econ-radar-overview',
        type: 'radar',
        title: 'Nordic Economic Comparison',
        labels: radarLabels,
        datasets: radarDatasets,
      });
    }
  }

  return charts;
}

/**
 * Normalize radar data so each indicator is scaled to 0–100 for visual comparability.
 * Higher is "better" for all indicators after normalization.
 */
function normalizeRadarData(
  labels: string[],
  dataByCountry: Map<string, number[]>,
): Map<string, number[]> {
  const result = new Map<string, number[]>();

  // Compute min/max per indicator column
  const mins: number[] = [];
  const maxs: number[] = [];
  for (let i = 0; i < labels.length; i++) {
    let min = Infinity;
    let max = -Infinity;
    for (const values of dataByCountry.values()) {
      const v = values[i] ?? 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    mins.push(min);
    maxs.push(max);
  }

  for (const [code, values] of dataByCountry.entries()) {
    const normed: number[] = [];
    for (let i = 0; i < labels.length; i++) {
      const range = maxs[i] - mins[i];
      const v = values[i] ?? 0;
      normed.push(range > 0 ? Math.round(((v - mins[i]) / range) * 100) : 50);
    }
    result.set(code, normed);
  }

  return result;
}

/**
 * Build data tables from economic data points for accessibility fallback.
 * Table headers are localized based on the target language.
 */
export function buildEconomicTables(
  indicators: EconomicIndicatorContext[],
  dataPoints: EconomicDataPoint[],
  lang: Language | string = 'en',
): DashboardTableConfig[] {
  const tables: DashboardTableConfig[] = [];
  const countryHeader = getEconomicHeading(lang, 'country');
  const unitHeader = getEconomicHeading(lang, 'unit');

  for (const indicator of indicators) {
    const points = dataPoints.filter(p => p.indicatorId === indicator.indicatorId);
    if (points.length === 0) continue;

    const latestYear = points.reduce((max, p) => p.date > max ? p.date : max, '');
    const latestPoints = points.filter(p => p.date === latestYear);

    if (latestPoints.length > 0) {
      const sorted = sortByNordicOrder(latestPoints);
      tables.push({
        caption: `${indicator.name} (${latestYear}) — ${indicator.unit}`,
        headers: [countryHeader, indicator.name, unitHeader],
        rows: sorted.map(p => [
          NORDIC_COMPARISON.countryNames[p.countryCode] ?? p.countryName,
          p.value.toFixed(2),
          indicator.unit,
        ]),
      });
    }
  }

  return tables;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate an economic dashboard section based on detected policy domains.
 *
 * Automatically finds relevant World Bank indicators for the given policy
 * domains, builds Chart.js charts (comparison + trend), and generates
 * accessible data tables.
 *
 * If no data points are provided but indicators are found, returns a
 * placeholder section describing the relevant indicators (agentic workflows
 * should fetch the actual data from World Bank API).
 *
 * @example
 * ```ts
 * const section = generateEconomicDashboardSection({
 *   policyDomains: ['fiscal policy', 'defense'],
 *   dataPoints: worldBankData,
 *   lang: 'en',
 * });
 * if (section) {
 *   articleData.sections = [...(articleData.sections ?? []), section];
 * }
 * ```
 */
export function generateEconomicDashboardSection(opts: EconomicDashboardOptions): TemplateSection | null {
  const { policyDomains, dataPoints, lang } = opts;

  // Find relevant indicators
  const indicators = findIndicatorsForDomains(policyDomains);
  if (indicators.length === 0) return null;

  // Explicit empty dataPoints array signals "caller attempted to fetch
  // World Bank data and got nothing back" — never fall back to the
  // placeholder in that case, so the quality gate in
  // `scripts/validate-economic-context.ts` can surface a hard failure
  // instead of publishing a deceptive bullet list.
  //
  // A missing `dataPoints` key (undefined) still yields the placeholder
  // to preserve legacy callers that have not yet been migrated to the
  // load-economic-context loader.
  if (Array.isArray(dataPoints) && dataPoints.length === 0) return null;

  const headingText = opts.title?.trim() || getEconomicHeading(lang, 'economicContext');

  // If we have actual data points, build charts
  if (dataPoints && dataPoints.length > 0) {
    const charts = buildEconomicCharts(indicators, dataPoints);
    const tables = buildEconomicTables(indicators, dataPoints, lang);

    if (charts.length === 0 && tables.length === 0) return null;

    const section = generateDashboardSection({
      data: {
        title: headingText,
        summary: opts.summary?.trim() || undefined,
        charts,
        tables: tables.length > 0 ? tables : undefined,
      },
      lang,
    });

    // Normalize id/className so both placeholder and data paths return
    // consistent metadata (avoids DOM id collisions with generic dashboard).
    return {
      ...section,
      id: 'economic-dashboard',
      className: 'economic-dashboard-section',
    };
  }

  // No data points: generate a placeholder section describing relevant indicators
  const indicatorItems = indicators.map(ind =>
    `        <li><strong>${escapeHtml(ind.name)}</strong> (${escapeHtml(ind.unit)}): ${escapeHtml(ind.description)}</li>`
  ).join('\n');

  const policyLabel = getEconomicHeading(lang, 'policyImplications');
  const html = `<section class="economic-dashboard-placeholder" aria-label="${escapeHtml(headingText)}">
    <h2>${escapeHtml(headingText)}</h2>
    <h3>${escapeHtml(policyLabel)}</h3>
    <ul class="economic-indicators-list">
${indicatorItems}
    </ul>
  </section>`;

  return {
    id: 'economic-dashboard',
    html,
    className: 'economic-dashboard-section',
  };
}
