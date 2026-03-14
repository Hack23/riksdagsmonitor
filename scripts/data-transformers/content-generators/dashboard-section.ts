/**
 * @module data-transformers/content-generators/dashboard-section
 * @description Generates embeddable Chart.js dashboard sections and CSS-only
 * multi-panel dashboards that can be injected into any article type via the
 * `TemplateSection` extensibility pattern.
 *
 * Agentic workflows call `generateDashboardSection()` (single-chart) or
 * `generateMultiPanelDashboardSection()` (multi-panel AI-driven) with chart
 * configurations sourced from MCP servers or CIA-data and append the returned
 * `TemplateSection` to the article's `sections` array.
 *
 * The generated HTML includes:
 * - One `<canvas>` element per Chart.js chart (config in `data-chart-config`)
 * - CSS-only heat maps (no JS required) for stakeholder impact matrices
 * - CSS-only gauge dials for coalition stress / confidence indicators
 * - Optional data tables for accessibility (screen-reader fallback)
 * - ARIA labels and roles throughout for WCAG 2.1 AA compliance
 *
 * Client-side Chart.js chart initialisation is NOT performed automatically by
 * this module. Embedding pages MUST load Chart.js and run an initializer (for
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
  MultiPanelDashboard,
  DashboardPanel,
  HeatMapConfig,
  GaugeConfig,
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

  const rawTitle = typeof data.title === 'string' ? data.title.trim() : '';
  const titleText = rawTitle || lbl('dashboardTitle');
  const trimmedSummary = data.summary?.trim();
  const summaryBlock = trimmedSummary
    ? `    <p class="dashboard-summary">${escapeHtml(trimmedSummary)}</p>\n`
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

// ---------------------------------------------------------------------------
// CSS-only chart renderers (no Chart.js dependency)
// ---------------------------------------------------------------------------

/**
 * Render a CSS-only heat map as an accessible grid table.
 *
 * Intensity is driven by a `--intensity` CSS custom property (0–1) on each
 * data cell, allowing the stylesheet to map it to a colour scale without any
 * inline scripts.
 *
 * @param config - Heat map configuration
 * @param panelId - Parent panel id used to prefix the DOM id for uniqueness
 * @param usedIds - Shared Set tracking all emitted DOM ids to prevent duplicates
 */
function renderHeatMap(config: HeatMapConfig, panelId: string, usedIds: Set<string>): string {
  // Deduplicate heatmap IDs: prefix with panelId and track across the dashboard
  let baseId = config.id.replace(/[^a-zA-Z0-9_-]/g, '') || 'heatmap';
  baseId = `${panelId}-${baseId}`;
  let safeId = baseId;
  let counter = 1;
  while (usedIds.has(safeId)) {
    safeId = `${baseId}-${counter++}`;
  }
  usedIds.add(safeId);
  const { rowLabels, columnLabels, cells } = config;

  // Validate rectangular shape: every data row must match columnLabels length
  for (let rIdx = 0; rIdx < cells.length; rIdx++) {
    if (cells[rIdx].length !== columnLabels.length) {
      throw new Error(
        `HeatMapConfig "${config.id}": row ${rIdx} has ${cells[rIdx].length} cells but there are ` +
        `${columnLabels.length} column labels. Heat map cells must be rectangular.`,
      );
    }
  }
  if (cells.length !== rowLabels.length) {
    throw new Error(
      `HeatMapConfig "${config.id}": ${cells.length} data rows but ${rowLabels.length} row labels. ` +
      'Heat map rows must match rowLabels length.',
    );
  }

  // Compute global min/max for normalising intensity using reduce (safe for large datasets)
  const allValues = cells.flatMap(row => row.map(c => (typeof c.value === 'number' ? c.value : 0)));
  const minVal = allValues.length > 0 ? allValues.reduce((a, b) => Math.min(a, b), Infinity) : 0;
  const maxVal = allValues.length > 0 ? allValues.reduce((a, b) => Math.max(a, b), -Infinity) : 100;
  // When all values are equal, use 1 as range to avoid division by zero; all cells will render at 0 intensity.
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const minLabel = config.minLabel ?? String(minVal);
  const maxLabel = config.maxLabel ?? String(maxVal);

  // Header row — corner cell uses role="presentation" (empty spacer, no meaningful content)
  const cornerCell = `<div role="presentation" class="heatmap-cell heatmap-corner"></div>`;
  const headerCells = columnLabels
    .map(col => `<div role="columnheader" class="heatmap-cell heatmap-col-label">${escapeHtml(col)}</div>`)
    .join('');
  const headerRow = `  <div role="row" class="heatmap-row heatmap-header">${cornerCell}${headerCells}</div>`;

  // Data rows
  const dataRows = cells.map((row, rIdx) => {
    const rowLabel = rowLabels[rIdx] ?? String(rIdx + 1);
    const rowHeaderCell = `<div role="rowheader" class="heatmap-cell heatmap-row-label">${escapeHtml(rowLabel)}</div>`;
    const dataCells = row.map((cell, cIdx) => {
      const colLabel = columnLabels[cIdx] ?? String(cIdx + 1);
      const numVal = typeof cell.value === 'number' ? cell.value : 0;
      const intensity = ((numVal - minVal) / range).toFixed(3);
      const displayText = cell.label ?? String(numVal);
      const ariaText = `${escapeHtml(rowLabel)} / ${escapeHtml(colLabel)}: ${escapeHtml(displayText)}`;
      return `<div role="cell" class="heatmap-cell heatmap-data-cell" style="--intensity:${intensity}" aria-label="${ariaText}">${escapeHtml(displayText)}</div>`;
    }).join('');
    return `  <div role="row" class="heatmap-row">${rowHeaderCell}${dataCells}</div>`;
  }).join('\n');

  // Legend
  const legend = `  <div class="heatmap-legend" aria-hidden="true">
    <span class="heatmap-legend-label">${escapeHtml(minLabel)}</span>
    <div class="heatmap-legend-scale"></div>
    <span class="heatmap-legend-label">${escapeHtml(maxLabel)}</span>
  </div>`;

  return `<div id="${escapeHtml(safeId)}" class="dashboard-heatmap" role="table" aria-label="${escapeHtml(config.title)}">
${headerRow}
${dataRows}
${legend}
</div>`;
}

/**
 * Render a CSS-only semicircular gauge dial.
 *
 * The gauge angle is driven by a `--gauge-pct` CSS custom property (0–1),
 * which the stylesheet maps to a `conic-gradient` arc — no JS required.
 *
 * @param config - Gauge configuration
 * @param panelId - Parent panel id used to prefix the DOM id for uniqueness
 * @param usedIds - Shared Set tracking all emitted DOM ids to prevent duplicates
 */
function renderGauge(config: GaugeConfig, panelId: string, usedIds: Set<string>): string {
  // Deduplicate gauge IDs: prefix with panelId and track across the dashboard
  let baseId = config.id.replace(/[^a-zA-Z0-9_-]/g, '') || 'gauge';
  baseId = `${panelId}-${baseId}`;
  let safeId = baseId;
  let counter = 1;
  while (usedIds.has(safeId)) {
    safeId = `${baseId}-${counter++}`;
  }
  usedIds.add(safeId);
  const safeValue = Number.isFinite(config.value) ? config.value : 0;
  const clamped = Math.min(100, Math.max(0, safeValue));
  const pct = clamped / 100;
  const minLabel = config.minLabel ?? '0';
  const maxLabel = config.maxLabel ?? '100';
  const displayValue = `${clamped}%`;

  return `<div id="${escapeHtml(safeId)}" class="dashboard-gauge" role="figure" aria-label="${escapeHtml(config.title)}: ${escapeHtml(displayValue)}">
  <div class="gauge-track" aria-hidden="true">
    <div class="gauge-fill" style="--gauge-pct:${pct.toFixed(3)}"></div>
    <div class="gauge-center"></div>
  </div>
  <div class="gauge-value" aria-hidden="true">${escapeHtml(displayValue)}</div>
  <div class="gauge-label">${escapeHtml(config.label ?? config.title)}</div>
  <div class="gauge-range" aria-hidden="true">
    <span class="gauge-min">${escapeHtml(minLabel)}</span>
    <span class="gauge-max">${escapeHtml(maxLabel)}</span>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Multi-panel dashboard helpers
// ---------------------------------------------------------------------------

/**
 * Sanitise a panel id for safe use as a DOM element id, and ensure uniqueness
 * across panels by tracking used ids in a shared Set.
 */
function sanitisePanelId(rawId: string, index: number, usedPanelIds: Set<string>): string {
  let base = rawId.replace(/[^a-zA-Z0-9_-]/g, '') || `panel-${index}`;
  let safeId = base;
  let counter = 1;
  while (usedPanelIds.has(safeId)) {
    safeId = `${base}-${counter++}`;
  }
  usedPanelIds.add(safeId);
  return safeId;
}

/**
 * Render a single dashboard panel including optional chart, heat map, gauge,
 * AI interpretation, confidence indicator, and accessible table fallback.
 *
 * Only one visual type may be set per panel (chart, heatMap, or gauge).
 * If more than one is provided, an error is thrown to prevent ambiguous output.
 */
function renderPanel(
  panel: DashboardPanel,
  index: number,
  lbl: (key: string) => string,
  usedChartIds: Set<string>,
  usedPanelIds: Set<string>,
  usedVisualIds: Set<string>,
): string {
  // Runtime validation: enforce mutual exclusivity of visual types
  const visualCount = [panel.chart, panel.heatMap, panel.gauge].filter(Boolean).length;
  if (visualCount > 1) {
    throw new Error(
      `DashboardPanel "${panel.id}" defines ${visualCount} visual types (chart/heatMap/gauge). ` +
      'Only one visual type is allowed per panel.',
    );
  }

  const panelId = sanitisePanelId(panel.id, index, usedPanelIds);
  const headingId = `${panelId}-heading`;

  // Chart content (Chart.js canvas or CSS-only visual)
  let visualBlock = '';
  if (panel.chart) {
    const config = serialiseChartConfig(panel.chart);
    // Deduplicate chart IDs: prefix with panelId and track across the dashboard
    let baseChartId = panel.chart.id.replace(/[^a-zA-Z0-9_-]/g, '') || `${panelId}-chart`;
    baseChartId = `${panelId}-${baseChartId}`;
    let chartId = baseChartId;
    let counter = 1;
    while (usedChartIds.has(chartId)) {
      chartId = `${baseChartId}-${counter++}`;
    }
    usedChartIds.add(chartId);
    const ariaLabel = panel.chart.title?.trim() || chartId;
    visualBlock = `    <div class="panel-chart-wrapper">
      <canvas id="${escapeHtml(chartId)}" role="img" aria-label="${escapeHtml(ariaLabel)}" data-chart-config="${escapeHtml(config)}"></canvas>
    </div>`;
  } else if (panel.heatMap) {
    visualBlock = `    <div class="panel-heatmap-wrapper">\n${renderHeatMap(panel.heatMap, panelId, usedVisualIds)}\n    </div>`;
  } else if (panel.gauge) {
    visualBlock = `    <div class="panel-gauge-wrapper">\n${renderGauge(panel.gauge, panelId, usedVisualIds)}\n    </div>`;
  }

  // AI interpretation — use localised label as a visually-hidden semantic heading
  const interpretationBlock = panel.interpretation?.trim()
    ? `    <div class="panel-interpretation-wrapper">
      <h4 class="panel-interpretation-label sr-only">${escapeHtml(lbl('dashboardInterpretation'))}</h4>
      <p class="panel-interpretation">${escapeHtml(panel.interpretation.trim())}</p>
    </div>`
    : '';

  // Stakeholder view badge
  const stakeholderBlock = panel.stakeholderView?.trim()
    ? `    <p class="panel-stakeholder"><span class="panel-stakeholder-label">${escapeHtml(lbl('dashboardStakeholder'))}: </span>${escapeHtml(panel.stakeholderView.trim())}</p>`
    : '';

  // Confidence indicator — guard NaN/Infinity values
  let confidenceBlock = '';
  if (panel.confidenceLevel != null && Number.isFinite(panel.confidenceLevel)) {
    const pct = Math.min(100, Math.max(0, panel.confidenceLevel));
    confidenceBlock = `    <div class="panel-confidence" aria-label="${escapeHtml(lbl('dashboardConfidence'))}: ${pct}%">
      <span class="panel-confidence-label">${escapeHtml(lbl('dashboardConfidence'))}</span>
      <div class="panel-confidence-bar" role="meter" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" style="--confidence:${(pct / 100).toFixed(3)}">
        <div class="panel-confidence-fill"></div>
      </div>
      <span class="panel-confidence-value">${pct}%</span>
    </div>`;
  }

  // Accessible table fallback
  const tableBlock = panel.table ? renderTable(panel.table) : '';

  return `  <article class="dashboard-panel" id="${escapeHtml(panelId)}" aria-labelledby="${escapeHtml(headingId)}">
    <h3 id="${escapeHtml(headingId)}"><span class="panel-type-label sr-only">${escapeHtml(lbl('dashboardPanel'))}: </span>${escapeHtml(panel.title)}</h3>
${visualBlock}
${interpretationBlock}
${stakeholderBlock}
${confidenceBlock}
${tableBlock}
  </article>`;
}

// ---------------------------------------------------------------------------
// Multi-panel public API
// ---------------------------------------------------------------------------

/**
 * Options for the multi-panel dashboard section generator.
 */
export interface MultiPanelDashboardOptions {
  /** Multi-panel dashboard configuration */
  data: MultiPanelDashboard;
  /** Target language for labels */
  lang: Language | string;
}

/**
 * Generate an embeddable multi-panel AI-driven dashboard section.
 *
 * Returns a `TemplateSection` containing a responsive grid of panels, each
 * of which may contain a Chart.js chart, a CSS-only heat map, or a CSS-only
 * gauge dial, plus AI-generated interpretation text and confidence indicators.
 * Cross-panel AI insights are rendered at the bottom.
 *
 * Accessibility: every chart canvas carries `role="img"` + `aria-label`;
 * heat maps use `role="table"` with row/column headers; gauges use
 * `role="figure"` + `aria-label`; confidence bars use `role="meter"`.
 *
 * @example
 * ```ts
 * const section = generateMultiPanelDashboardSection({
 *   data: {
 *     title: 'Coalition Stability Monitor',
 *     summary: 'AI-driven analysis of current coalition dynamics.',
 *     layout: 'grid-2x2',
 *     panels: [
 *       {
 *         id: 'alignment',
 *         title: 'Political Alignment',
 *         chart: { id: 'alignment-chart', type: 'radar', title: 'Party Positions', labels: ['Economy', 'Security'], datasets: [{ label: 'SD', data: [80, 70] }] },
 *         interpretation: 'SD leads on security issues.',
 *         confidenceLevel: 78,
 *       },
 *     ],
 *     aiInsights: [{ id: 'ins-1', text: 'Coalition majority at risk.', relevance: 'high' }],
 *   },
 *   lang: 'en',
 * });
 * articleData.sections = [...(articleData.sections ?? []), section];
 * ```
 */
export function generateMultiPanelDashboardSection(
  opts: MultiPanelDashboardOptions,
): TemplateSection {
  const { data, lang } = opts;

  const lbl = (key: string): string => {
    const val = L(lang, key);
    return typeof val === 'string' ? val : key;
  };

  const rawTitle = data.title?.trim();
  const titleText = rawTitle || lbl('dashboardTitle');
  const layoutClass = data.layout ?? 'grid-2x2';

  // Summary
  const summaryBlock = data.summary?.trim()
    ? `  <p class="multi-panel-summary">${escapeHtml(data.summary.trim())}</p>\n`
    : '';

  // Panels — shared ID trackers ensure DOM id uniqueness across all panels
  const usedChartIds = new Set<string>();
  const usedPanelIds = new Set<string>();
  const usedVisualIds = new Set<string>();
  const panelBlocks = data.panels
    .map((panel, idx) => renderPanel(panel, idx, lbl, usedChartIds, usedPanelIds, usedVisualIds))
    .join('\n');

  const panelsGrid = `  <div class="multi-panel-grid ${escapeHtml(layoutClass)}">\n${panelBlocks}\n  </div>`;

  // AI Insights section
  let insightsBlock = '';
  if (data.aiInsights && data.aiInsights.length > 0) {
    const insightItems = data.aiInsights.map(ins => {
      const relevanceClass = ins.relevance ? ` insight-${escapeHtml(ins.relevance)}` : '';
      return `      <li class="ai-insight-item${relevanceClass}">${escapeHtml(ins.text)}</li>`;
    }).join('\n');
    insightsBlock = `  <aside class="multi-panel-insights" aria-label="${escapeHtml(lbl('dashboardAiInsights'))}">
    <h3>${escapeHtml(lbl('dashboardAiInsights'))}</h3>
    <ul class="ai-insights-list">
${insightItems}
    </ul>
  </aside>`;
  }

  const html = `<section class="multi-panel-dashboard" aria-label="${escapeHtml(titleText)}">
  <h2>${escapeHtml(titleText)}</h2>
${summaryBlock}${panelsGrid}
${insightsBlock}
</section>`;

  return {
    id: 'multi-panel-dashboard',
    html,
    className: 'multi-panel-dashboard-section',
  };
}
