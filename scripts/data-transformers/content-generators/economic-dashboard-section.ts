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
 * Groups data by indicator and creates bar charts comparing Nordic countries.
 */
export function buildEconomicCharts(
  indicators: EconomicIndicatorContext[],
  dataPoints: EconomicDataPoint[],
): DashboardChartConfig[] {
  const charts: DashboardChartConfig[] = [];

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
      });
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

  return charts;
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

  const headingText = opts.title?.trim() || getEconomicHeading(lang, 'economicContext');

  // If we have actual data points, build charts
  if (dataPoints && dataPoints.length > 0) {
    const charts = buildEconomicCharts(indicators, dataPoints);
    const tables = buildEconomicTables(indicators, dataPoints, lang);

    if (charts.length === 0 && tables.length === 0) return null;

    return generateDashboardSection({
      data: {
        title: headingText,
        summary: opts.summary?.trim() || undefined,
        charts,
        tables: tables.length > 0 ? tables : undefined,
      },
      lang,
    });
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
