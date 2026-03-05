/**
 * @module data-transformers/content-generators/dashboard-section
 * @description Generates an embeddable Chart.js dashboard section that can
 * be injected into any article type via the `TemplateSection` extensibility pattern.
 *
 * Agentic workflows call `generateDashboardSection()` with chart configurations
 * sourced from MCP servers or CIA-data and append the returned `TemplateSection`
 * to the article's `sections` array.
 *
 * The generated HTML includes:
 * - One `<canvas>` element per chart (for Chart.js rendering)
 * - Chart config embedded as `data-chart-config` attributes (no inline scripts)
 * - Optional data tables for accessibility (screen-reader fallback)
 *
 * Client-side chart initialisation is NOT performed automatically by this
 * module. Embedding pages MUST load Chart.js and run an initializer (for
 * example, a shared `chart-factory.ts` or any loader that scans canvases for
 * `data-chart-config` and calls `createChart()` or equivalent).
 *
 * **Dependencies** (loaded by the Vite build from `package.json`):
 * - chart.js ^4.5.1
 * - chartjs-plugin-annotation ^3.1.0
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type {
  TemplateSection,
  DashboardData,
  DashboardChartConfig,
  DashboardTableConfig,
  DashboardAnnotation,
} from '../../types/article.js';
import { L } from '../helpers.js';

// ---------------------------------------------------------------------------
// Chart.js configuration serialiser (JSON for data-chart-config attribute)
// ---------------------------------------------------------------------------

/**
 * Produce a JSON-safe Chart.js `config` object string for a single chart.
 * We emit only the data & options that Chart.js actually needs.
 */
function serialiseChartConfig(chart: DashboardChartConfig): string {
  const datasets = chart.datasets.map(ds => ({
    label: ds.label,
    data: ds.data,
    ...(ds.backgroundColor ? { backgroundColor: ds.backgroundColor } : {}),
    ...(ds.borderColor ? { borderColor: ds.borderColor } : {}),
    ...(ds.borderWidth != null ? { borderWidth: ds.borderWidth } : {}),
  }));

  const annotationPluginBlock = buildAnnotations(chart.annotations);

  const hasTitle = chart.title != null && chart.title.trim() !== '';

  const config = {
    type: chart.type,
    data: {
      ...(chart.labels ? { labels: chart.labels } : {}),
      datasets,
    },
    options: {
      plugins: {
        title: { display: hasTitle, text: chart.title },
        ...(annotationPluginBlock ? { annotation: annotationPluginBlock } : {}),
      },
    },
  };

  return JSON.stringify(config);
}

function buildAnnotations(
  annotations?: DashboardAnnotation[],
): Record<string, unknown> | undefined {
  if (!annotations || annotations.length === 0) return undefined;
  const result: Record<string, unknown> = {};
  annotations.forEach((a, i) => {
    const key = `annotation${i}`;

    let config: Record<string, unknown> | undefined;

    switch (a.type) {
      case 'line': {
        config = {
          type: 'line',
          yMin: a.value,
          yMax: a.value,
          ...(a.borderColor ? { borderColor: a.borderColor } : {}),
          ...(a.backgroundColor ? { backgroundColor: a.backgroundColor } : {}),
          ...(a.label ? { label: { display: true, content: a.label } } : {}),
        };
        break;
      }
      case 'label': {
        const content = a.label != null ? a.label : String(a.value);
        config = {
          type: 'label',
          content,
          yValue: a.value,
          ...(a.borderColor ? { borderColor: a.borderColor } : {}),
          ...(a.backgroundColor ? { backgroundColor: a.backgroundColor } : {}),
        };
        break;
      }
      default:
        break;
    }

    if (config) {
      result[key] = config;
    }
  });
  return Object.keys(result).length > 0 ? { annotations: result } : undefined;
}

// ---------------------------------------------------------------------------
// Table renderer
// ---------------------------------------------------------------------------

function renderTable(table: DashboardTableConfig): string {
  const caption = table.caption
    ? `    <caption>${escapeHtml(table.caption)}</caption>\n`
    : '';
  const headerCells = table.headers
    .map(h => `<th scope="col">${escapeHtml(h)}</th>`)
    .join('');
  const bodyRows = table.rows
    .map(
      row =>
        `      <tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('\n');

  return `  <table class="dashboard-table">
${caption}    <thead><tr>${headerCells}</tr></thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Options for the dashboard section generator.
 */
export interface DashboardSectionOptions {
  /** Chart and table configurations */
  data: DashboardData;
  /** Target language for labels */
  lang: Language | string;
}

/**
 * Generate an embeddable dashboard section with Chart.js charts.
 *
 * Returns a `TemplateSection` that can be appended to `ArticleData.sections`.
 * Each chart is rendered as a `<canvas>` element with its Chart.js config
 * stored in a `data-chart-config` attribute, consistent with the codebase's
 * "no inline scripts" pattern. Client-side initialisation is NOT automatic —
 * embedding pages must load Chart.js and run an initializer that reads
 * `data-chart-config` (e.g. the shared chart-factory module).
 *
 * @example
 * ```ts
 * import { generateDashboardSection } from './content-generators/dashboard-section.js';
 *
 * const section = generateDashboardSection({
 *   data: {
 *     title: 'Party Seat Distribution',
 *     summary: 'Current Riksdag seat allocation after 2022 election.',
 *     charts: [{
 *       id: 'seat-chart',
 *       type: 'bar',
 *       title: 'Seats by Party',
 *       labels: ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'],
 *       datasets: [{
 *         label: 'Seats',
 *         data: [107, 68, 73, 24, 24, 19, 16, 18],
 *         backgroundColor: ['#e8112d','#1b49dd','#dddd00','#009933','#da291c','#000077','#006ab3','#83cf39'],
 *       }],
 *     }],
 *   },
 *   lang: 'en',
 * });
 *
 * articleData.sections = [...(articleData.sections ?? []), section];
 * ```
 */
export function generateDashboardSection(opts: DashboardSectionOptions): TemplateSection {
  const { data, lang } = opts;

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const titleText = data.title || lbl('dashboardTitle');
  const summaryBlock = data.summary
    ? `    <p class="dashboard-summary">${escapeHtml(data.summary)}</p>\n`
    : '';

  // Sanitise chart IDs once — ensure non-empty and unique for valid DOM ids
  const usedIds = new Set<string>();
  const sanitisedCharts = data.charts.map((chart, index) => {
    let baseId = chart.id.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!baseId) {
      baseId = `chart-${index}`;
    }
    let safeId = baseId;
    let counter = 1;
    while (usedIds.has(safeId)) {
      safeId = `${baseId}-${counter++}`;
    }
    usedIds.add(safeId);
    return { ...chart, safeId };
  });

  // Chart canvases with config in data attribute (no inline scripts)
  const chartBlocks = sanitisedCharts.map(chart => {
    const config = serialiseChartConfig(chart);
    const ariaLabel = chart.title && chart.title.trim() ? chart.title : chart.safeId;
    return `    <div class="dashboard-chart-wrapper">
      <canvas id="${escapeHtml(chart.safeId)}" role="img" aria-label="${escapeHtml(ariaLabel)}" data-chart-config="${escapeHtml(config)}"></canvas>
    </div>`;
  }).join('\n');

  // Tables (optional)
  const tableBlocks = (data.tables ?? []).map(t => renderTable(t)).join('\n');

  const html = `<section class="article-dashboard" aria-label="${escapeHtml(titleText)}">
    <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}${chartBlocks}
${tableBlocks}
  </section>`;

  return {
    id: 'article-dashboard',
    html,
    className: 'article-dashboard-section',
  };
}
