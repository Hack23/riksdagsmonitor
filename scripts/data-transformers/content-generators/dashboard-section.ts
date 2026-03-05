/**
 * @module data-transformers/content-generators/dashboard-section
 * @description Generates an embeddable Chart.js / D3 dashboard section that can
 * be injected into any article type via the `TemplateSection` extensibility pattern.
 *
 * Agentic workflows call `generateDashboardSection()` with chart configurations
 * sourced from MCP servers or CIA-data and append the returned `TemplateSection`
 * to the article's `sections` array.
 *
 * The generated HTML includes:
 * - One `<canvas>` element per chart (for Chart.js rendering)
 * - Optional data tables for accessibility (screen-reader fallback)
 * - An inline `<script>` block that initialises Chart.js charts when the page loads
 *
 * **Dependencies** (loaded by the Vite build from `package.json`):
 * - chart.js ^4.5.1
 * - chartjs-plugin-annotation ^3.1.0
 * - d3 ^7.9.0  (available for network diagrams — not used in the default section)
 * - papaparse ^5.5.3  (available for CSV data ingestion)
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
// Chart.js configuration serialiser (inline JSON for the script block)
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

  const config = {
    type: chart.type,
    data: {
      labels: chart.labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: chart.title },
        ...(annotationPluginBlock ? { annotation: annotationPluginBlock } : {}),
      },
    },
  };

  // Escape </script> sequences to prevent breaking out of the inline <script> block
  return JSON.stringify(config).replace(/<\/(script)/gi, '<\\/$1');
}

function buildAnnotations(
  annotations?: DashboardAnnotation[],
): Record<string, unknown> | undefined {
  if (!annotations || annotations.length === 0) return undefined;
  const result: Record<string, unknown> = {};
  annotations.forEach((a, i) => {
    const key = `annotation${i}`;
    result[key] = {
      type: a.type,
      ...(a.value != null ? { yMin: a.value, yMax: a.value } : {}),
      ...(a.borderColor ? { borderColor: a.borderColor } : {}),
      ...(a.backgroundColor ? { backgroundColor: a.backgroundColor } : {}),
      ...(a.label ? { label: { display: true, content: a.label } } : {}),
    };
  });
  return { annotations: result };
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

  return `  <table class="dashboard-table" role="table">
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
 * Each chart is rendered as a `<canvas>` element and initialised via an inline
 * script that calls `new Chart(…)`.
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

  // Chart canvases
  const chartBlocks = data.charts.map(chart => {
    const safeId = escapeHtml(chart.id);
    return `    <div class="dashboard-chart-wrapper">
      <canvas id="${safeId}" role="img" aria-label="${escapeHtml(chart.title)}"></canvas>
    </div>`;
  }).join('\n');

  // Tables (optional)
  const tableBlocks = (data.tables ?? []).map(t => renderTable(t)).join('\n');

  // Inline Chart.js init script
  const chartInits = data.charts.map(chart => {
    const config = serialiseChartConfig(chart);
    const safeId = chart.id.replace(/[^a-zA-Z0-9_-]/g, '');
    return `      (function() {
        var canvas = document.getElementById('${safeId}');
        if (canvas && typeof Chart !== 'undefined') {
          new Chart(canvas.getContext('2d'), ${config});
        }
      })();`;
  }).join('\n');

  const scriptBlock = data.charts.length > 0
    ? `\n    <script>
    document.addEventListener('DOMContentLoaded', function() {
${chartInits}
    });
    </script>`
    : '';

  const html = `<section class="article-dashboard" aria-label="${escapeHtml(titleText)}">
    <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}${chartBlocks}
${tableBlocks}${scriptBlock}
  </section>`;

  return {
    id: 'article-dashboard',
    html,
    className: 'article-dashboard-section',
  };
}
