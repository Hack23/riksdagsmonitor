/**
 * Tests for generateMultiPanelDashboardSection —
 * multi-panel AI-driven dashboard with heat maps, gauges, and Chart.js panels.
 */

import { describe, it, expect } from 'vitest';
import { generateMultiPanelDashboardSection } from '../scripts/data-transformers/content-generators/dashboard-section.js';
import type {
  MultiPanelDashboard,
  DashboardPanel,
  HeatMapConfig,
  GaugeConfig,
  AIInsight,
} from '../scripts/types/article.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeChartPanel(overrides: Partial<DashboardPanel> = {}): DashboardPanel {
  return {
    id: 'test-panel',
    title: 'Test Panel',
    chart: {
      id: 'test-chart',
      type: 'bar',
      title: 'Test Chart',
      labels: ['A', 'B'],
      datasets: [{ label: 'S1', data: [10, 20] }],
    },
    ...overrides,
  };
}

function makeHeatMapConfig(overrides: Partial<HeatMapConfig> = {}): HeatMapConfig {
  return {
    id: 'heatmap-1',
    title: 'Stakeholder Impact',
    rowLabels: ['Citizens', 'Business'],
    columnLabels: ['Health', 'Economy'],
    cells: [
      [{ value: 80 }, { value: 60 }],
      [{ value: 40 }, { value: 90 }],
    ],
    ...overrides,
  };
}

function makeGaugeConfig(overrides: Partial<GaugeConfig> = {}): GaugeConfig {
  return {
    id: 'gauge-1',
    title: 'Coalition Stability',
    value: 72,
    label: 'Stable',
    ...overrides,
  };
}

function makeDashboard(overrides: Partial<MultiPanelDashboard> = {}): MultiPanelDashboard {
  return {
    title: 'Multi-Panel Dashboard',
    panels: [makeChartPanel()],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TemplateSection shape
// ---------------------------------------------------------------------------

describe('generateMultiPanelDashboardSection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.id).toBe('multi-panel-dashboard');
    expect(section.className).toBe('multi-panel-dashboard-section');
    expect(typeof section.html).toBe('string');
    expect(section.html.length).toBeGreaterThan(0);
  });

  it('wraps output in <section class="multi-panel-dashboard">', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('<section class="multi-panel-dashboard"');
    expect(section.html).toContain('</section>');
  });

  it('renders dashboard title', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('>Multi-Panel Dashboard</h2>');
  });

  it('falls back to translated label when title is empty', () => {
    const data = makeDashboard({ title: '' });
    const section = generateMultiPanelDashboardSection({ data, lang: 'sv' });
    expect(section.html).toContain('Instrumentpanel');
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  it('renders summary paragraph when provided', () => {
    const data = makeDashboard({ summary: 'AI-generated summary.' });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('AI-generated summary.');
    expect(section.html).toContain('class="multi-panel-summary"');
  });

  it('omits summary block when not provided', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).not.toContain('class="multi-panel-summary"');
  });

  // ---------------------------------------------------------------------------
  // Layout class
  // ---------------------------------------------------------------------------

  it('applies grid-2x2 layout class by default', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('class="multi-panel-grid grid-2x2"');
  });

  it('applies grid-3x2 layout when specified', () => {
    const data = makeDashboard({ layout: 'grid-3x2' });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('class="multi-panel-grid grid-3x2"');
  });

  it('applies full-width layout when specified', () => {
    const data = makeDashboard({ layout: 'full-width' });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('class="multi-panel-grid full-width"');
  });

  // ---------------------------------------------------------------------------
  // Panel rendering
  // ---------------------------------------------------------------------------

  it('renders a panel as <article> with correct heading', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('<article class="dashboard-panel"');
    expect(section.html).toContain('>Test Panel</h3>');
  });

  it('renders Chart.js canvas inside a panel', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('<canvas');
    expect(section.html).toContain('data-chart-config="');
    expect(section.html).not.toContain('<script>');
  });

  it('renders panel interpretation paragraph with localised label as <h4>', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ interpretation: 'Coalition under stress.' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Coalition under stress.');
    expect(section.html).toContain('class="panel-interpretation"');
    expect(section.html).toContain('<h4 class="panel-interpretation-label sr-only">');
    expect(section.html).toContain('Analysis');
  });

  it('renders stakeholder view with label', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ stakeholderView: 'Opposition Parties' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Opposition Parties');
    expect(section.html).toContain('class="panel-stakeholder"');
  });

  it('renders confidence bar with aria-valuenow', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ confidenceLevel: 85 })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('aria-valuenow="85"');
    expect(section.html).toContain('role="meter"');
    expect(section.html).toContain('--confidence:0.850');
  });

  it('clamps confidence level to 0–100', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ confidenceLevel: 150 })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('aria-valuenow="100"');
  });

  it('renders accessible table fallback in panel', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({
        table: { caption: 'Panel Data', headers: ['A'], rows: [['1']] },
      })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Panel Data');
    expect(section.html).toContain('<table class="dashboard-table"');
  });

  // ---------------------------------------------------------------------------
  // Heat map panels
  // ---------------------------------------------------------------------------

  it('renders a heat map panel with role="table"', () => {
    const data = makeDashboard({
      panels: [{
        id: 'heatmap-panel',
        title: 'Stakeholder Impact',
        heatMap: makeHeatMapConfig(),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('role="table"');
    expect(section.html).toContain('class="dashboard-heatmap"');
    expect(section.html).toContain('heatmap-data-cell');
  });

  it('heat map encodes row and column labels', () => {
    const data = makeDashboard({
      panels: [{
        id: 'heatmap-panel',
        title: 'Impact Matrix',
        heatMap: makeHeatMapConfig(),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Citizens');
    expect(section.html).toContain('Business');
    expect(section.html).toContain('Health');
    expect(section.html).toContain('Economy');
  });

  it('heat map normalises intensity to 0–1 range', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm',
        title: 'HM',
        heatMap: makeHeatMapConfig({
          cells: [[{ value: 0 }, { value: 100 }], [{ value: 50 }, { value: 75 }]],
        }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('--intensity:0.000');
    expect(section.html).toContain('--intensity:1.000');
    expect(section.html).toContain('--intensity:0.500');
    expect(section.html).toContain('--intensity:0.750');
  });

  it('heat map renders legend with min/max labels', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm',
        title: 'HM',
        heatMap: makeHeatMapConfig({ minLabel: 'Low Impact', maxLabel: 'High Impact' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Low Impact');
    expect(section.html).toContain('High Impact');
    expect(section.html).toContain('class="heatmap-legend"');
  });

  it('heat map escapes XSS in row labels', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm',
        title: 'HM',
        heatMap: makeHeatMapConfig({ rowLabels: ['<script>xss</script>', 'Safe'] }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<script>xss');
    expect(section.html).toContain('&lt;script&gt;');
  });

  // ---------------------------------------------------------------------------
  // Gauge panels
  // ---------------------------------------------------------------------------

  it('renders a gauge panel with role="figure"', () => {
    const data = makeDashboard({
      panels: [{
        id: 'gauge-panel',
        title: 'Coalition Stress',
        gauge: makeGaugeConfig(),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('role="figure"');
    expect(section.html).toContain('class="dashboard-gauge"');
    expect(section.html).toContain('class="gauge-value"');
  });

  it('gauge sets --gauge-pct CSS property correctly', () => {
    const data = makeDashboard({
      panels: [{
        id: 'g',
        title: 'G',
        gauge: makeGaugeConfig({ value: 50 }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('--gauge-pct:0.500');
  });

  it('gauge clamps value to 0–100', () => {
    const data = makeDashboard({
      panels: [{ id: 'g', title: 'G', gauge: makeGaugeConfig({ value: 120 }) }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('--gauge-pct:1.000');
    expect(section.html).toContain('100%');
  });

  it('gauge includes min and max range labels', () => {
    const data = makeDashboard({
      panels: [{
        id: 'g', title: 'G',
        gauge: makeGaugeConfig({ minLabel: 'Unstable', maxLabel: 'Very Stable' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Unstable');
    expect(section.html).toContain('Very Stable');
  });

  it('gauge escapes XSS in label', () => {
    const data = makeDashboard({
      panels: [{
        id: 'g', title: 'G',
        gauge: makeGaugeConfig({ label: '<img onerror=alert(1)>' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<img onerror');
  });

  // ---------------------------------------------------------------------------
  // AI Insights
  // ---------------------------------------------------------------------------

  it('renders AI insights section when provided', () => {
    const insights: AIInsight[] = [
      { id: 'ins-1', text: 'Coalition majority at risk.', relevance: 'high' },
      { id: 'ins-2', text: 'Opposition gaining ground.', relevance: 'medium' },
    ];
    const data = makeDashboard({ aiInsights: insights });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('class="multi-panel-insights"');
    expect(section.html).toContain('Coalition majority at risk.');
    expect(section.html).toContain('Opposition gaining ground.');
    expect(section.html).toContain('insight-high');
    expect(section.html).toContain('insight-medium');
  });

  it('omits AI insights section when not provided', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).not.toContain('class="multi-panel-insights"');
  });

  it('escapes XSS in AI insight text', () => {
    const data = makeDashboard({
      aiInsights: [{ id: 'ins', text: '<script>evil()</script>', relevance: 'low' }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<script>evil');
    expect(section.html).toContain('&lt;script&gt;');
  });

  // ---------------------------------------------------------------------------
  // Multiple panels
  // ---------------------------------------------------------------------------

  it('renders multiple panels of different types', () => {
    const data = makeDashboard({
      panels: [
        makeChartPanel({ id: 'p1', title: 'Chart Panel' }),
        { id: 'p2', title: 'Heat Map Panel', heatMap: makeHeatMapConfig() },
        { id: 'p3', title: 'Gauge Panel', gauge: makeGaugeConfig() },
      ],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('>Chart Panel</h3>');
    expect(section.html).toContain('>Heat Map Panel</h3>');
    expect(section.html).toContain('>Gauge Panel</h3>');
    expect(section.html).toContain('<canvas');
    expect(section.html).toContain('class="dashboard-heatmap"');
    expect(section.html).toContain('class="dashboard-gauge"');
  });

  it('handles empty panels array gracefully', () => {
    const data = makeDashboard({ panels: [] });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('<section class="multi-panel-dashboard"');
    expect(section.html).not.toContain('<script>');
  });

  // ---------------------------------------------------------------------------
  // XSS / Sanitisation
  // ---------------------------------------------------------------------------

  it('escapes XSS in dashboard title', () => {
    const data = makeDashboard({ title: '<script>alert(1)</script>' });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<script>alert');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('escapes XSS in panel title', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ title: '<img src=x onerror=alert(1)>' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<img src=x');
  });

  it('sanitises panel id for valid DOM id', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ id: 'panel-<evil>&"' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="panel-evil"');
  });

  // ---------------------------------------------------------------------------
  // Localisation
  // ---------------------------------------------------------------------------

  it('supports all 14 languages without errors', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    for (const lang of langs) {
      const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang });
      expect(section.html).toContain('<section class="multi-panel-dashboard"');
    }
  });

  it('renders Stakeholder label in Swedish', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ stakeholderView: 'Regeringen' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'sv' });
    expect(section.html).toContain('Intressent');
  });

  it('renders Key Insights label in French', () => {
    const data = makeDashboard({
      aiInsights: [{ id: 'i', text: 'Analyse clé.', relevance: 'high' }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'fr' });
    expect(section.html).toContain('Points clés');
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  it('dashboard section has aria-label', () => {
    const data = makeDashboard({ title: 'Coalition Monitor' });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('aria-label="Coalition Monitor"');
  });

  it('panel article uses aria-labelledby pointing to its heading id', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ id: 'my-panel' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="my-panel"');
    expect(section.html).toContain('aria-labelledby="my-panel-heading"');
    expect(section.html).toContain('id="my-panel-heading"');
  });

  it('does not contain inline scripts', () => {
    const data = makeDashboard({
      panels: [
        makeChartPanel(),
        { id: 'hm', title: 'HM', heatMap: makeHeatMapConfig() },
        { id: 'g', title: 'G', gauge: makeGaugeConfig() },
      ],
      aiInsights: [{ id: 'i', text: 'Insight.', relevance: 'medium' }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<script>');
    expect(section.html).not.toContain('DOMContentLoaded');
    expect(section.html).not.toContain('new Chart(');
  });

  // ---------------------------------------------------------------------------
  // Review feedback: NaN / Infinity guards
  // ---------------------------------------------------------------------------

  it('gauge treats NaN value as 0', () => {
    const data = makeDashboard({
      panels: [{ id: 'g', title: 'G', gauge: makeGaugeConfig({ value: NaN }) }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('--gauge-pct:0.000');
    expect(section.html).toContain('0%');
    expect(section.html).not.toContain('NaN');
  });

  it('gauge treats Infinity value as 0 (clamped)', () => {
    const data = makeDashboard({
      panels: [{ id: 'g', title: 'G', gauge: makeGaugeConfig({ value: Infinity }) }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('NaN');
    expect(section.html).not.toContain('Infinity');
    expect(section.html).toContain('--gauge-pct:0.000');
  });

  it('skips confidence block when confidenceLevel is NaN', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ confidenceLevel: NaN })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('role="meter"');
    expect(section.html).not.toContain('NaN');
  });

  it('skips confidence block when confidenceLevel is Infinity', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ confidenceLevel: Infinity })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('role="meter"');
    expect(section.html).not.toContain('Infinity');
  });

  // ---------------------------------------------------------------------------
  // Review feedback: chart ID uniqueness across panels
  // ---------------------------------------------------------------------------

  it('deduplicates chart IDs across panels by prefixing with panelId', () => {
    const data = makeDashboard({
      panels: [
        makeChartPanel({ id: 'panel-a', chart: { id: 'my-chart', type: 'bar', title: 'A', labels: ['X'], datasets: [{ label: 'D', data: [1] }] } }),
        makeChartPanel({ id: 'panel-b', chart: { id: 'my-chart', type: 'bar', title: 'B', labels: ['Y'], datasets: [{ label: 'D', data: [2] }] } }),
      ],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    // Both charts should have unique IDs (prefixed with panel id)
    expect(section.html).toContain('id="panel-a-my-chart"');
    expect(section.html).toContain('id="panel-b-my-chart"');
  });

  // ---------------------------------------------------------------------------
  // Review feedback: mutually exclusive visual types
  // ---------------------------------------------------------------------------

  it('throws when a panel defines both chart and heatMap', () => {
    const data = makeDashboard({
      panels: [{
        id: 'bad',
        title: 'Bad Panel',
        chart: { id: 'c', type: 'bar', title: 'C', labels: ['X'], datasets: [{ label: 'D', data: [1] }] },
        heatMap: makeHeatMapConfig(),
      }],
    });
    expect(() => generateMultiPanelDashboardSection({ data, lang: 'en' })).toThrow(/Only one visual type/);
  });

  it('throws when a panel defines both chart and gauge', () => {
    const data = makeDashboard({
      panels: [{
        id: 'bad',
        title: 'Bad Panel',
        chart: { id: 'c', type: 'bar', title: 'C', labels: ['X'], datasets: [{ label: 'D', data: [1] }] },
        gauge: makeGaugeConfig(),
      }],
    });
    expect(() => generateMultiPanelDashboardSection({ data, lang: 'en' })).toThrow(/Only one visual type/);
  });

  it('throws when a panel defines all three visual types', () => {
    const data = makeDashboard({
      panels: [{
        id: 'bad',
        title: 'Bad Panel',
        chart: { id: 'c', type: 'bar', title: 'C', labels: ['X'], datasets: [{ label: 'D', data: [1] }] },
        heatMap: makeHeatMapConfig(),
        gauge: makeGaugeConfig(),
      }],
    });
    expect(() => generateMultiPanelDashboardSection({ data, lang: 'en' })).toThrow(/Only one visual type/);
  });

  // ---------------------------------------------------------------------------
  // Review feedback: dashboardInterpretation label used in markup
  // ---------------------------------------------------------------------------

  it('uses dashboardInterpretation label in Swedish as <h4>', () => {
    const data = makeDashboard({
      panels: [makeChartPanel({ interpretation: 'Test.' })],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'sv' });
    expect(section.html).toContain('Analys');
    expect(section.html).toContain('<h4 class="panel-interpretation-label sr-only">');
  });

  // ---------------------------------------------------------------------------
  // Review feedback round 2: heatmap shape validation
  // ---------------------------------------------------------------------------

  it('throws when heat map row count mismatches rowLabels', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm', title: 'HM',
        heatMap: {
          id: 'hm1', title: 'Bad', rowLabels: ['R1'],
          columnLabels: ['C1'], cells: [[{ value: 1 }], [{ value: 2 }]],
        },
      }],
    });
    expect(() => generateMultiPanelDashboardSection({ data, lang: 'en' })).toThrow(/row labels/i);
  });

  it('throws when heat map column count mismatches columnLabels', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm', title: 'HM',
        heatMap: {
          id: 'hm1', title: 'Bad', rowLabels: ['R1', 'R2'],
          columnLabels: ['C1', 'C2'], cells: [[{ value: 1 }, { value: 2 }], [{ value: 3 }]],
        },
      }],
    });
    expect(() => generateMultiPanelDashboardSection({ data, lang: 'en' })).toThrow(/rectangular/i);
  });

  // ---------------------------------------------------------------------------
  // Review feedback round 2: heatmap & gauge ID deduplication
  // ---------------------------------------------------------------------------

  it('prefixes heatmap IDs with panelId', () => {
    const data = makeDashboard({
      panels: [{
        id: 'panel-a', title: 'HM', heatMap: makeHeatMapConfig({ id: 'mymap' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="panel-a-mymap"');
  });

  it('prefixes gauge IDs with panelId', () => {
    const data = makeDashboard({
      panels: [{
        id: 'panel-b', title: 'G', gauge: makeGaugeConfig({ id: 'mygauge' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="panel-b-mygauge"');
  });

  it('deduplicates heatmap IDs across panels', () => {
    const data = makeDashboard({
      panels: [
        { id: 'p1', title: 'HM1', heatMap: makeHeatMapConfig({ id: 'dup' }) },
        { id: 'p2', title: 'HM2', heatMap: makeHeatMapConfig({ id: 'dup' }) },
      ],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="p1-dup"');
    expect(section.html).toContain('id="p2-dup"');
  });

  it('deduplicates gauge IDs across panels', () => {
    const data = makeDashboard({
      panels: [
        { id: 'p1', title: 'G1', gauge: makeGaugeConfig({ id: 'dup' }) },
        { id: 'p2', title: 'G2', gauge: makeGaugeConfig({ id: 'dup' }) },
      ],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="p1-dup"');
    expect(section.html).toContain('id="p2-dup"');
  });

  // ---------------------------------------------------------------------------
  // Review feedback round 2: panel ID deduplication
  // ---------------------------------------------------------------------------

  it('deduplicates panel IDs when two panels share the same id', () => {
    const data = makeDashboard({
      panels: [
        makeChartPanel({ id: 'dup', title: 'Panel 1' }),
        makeChartPanel({ id: 'dup', title: 'Panel 2', chart: { id: 'c2', type: 'bar', title: 'C', labels: ['X'], datasets: [{ label: 'D', data: [1] }] } }),
      ],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="dup"');
    expect(section.html).toContain('id="dup-1"');
  });

  // ---------------------------------------------------------------------------
  // Review feedback round 2: dashboardPanel label used in markup
  // ---------------------------------------------------------------------------

  it('uses dashboardPanel label as sr-only prefix in panel heading', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('class="panel-type-label sr-only"');
    expect(section.html).toContain('Panel');
  });

  it('uses localised dashboardPanel label in Swedish', () => {
    const section = generateMultiPanelDashboardSection({ data: makeDashboard(), lang: 'sv' });
    expect(section.html).toContain('class="panel-type-label sr-only"');
    expect(section.html).toContain('>Panel: </span>');
  });

  // ---------------------------------------------------------------------------
  // Review feedback round 3: heatmap NaN/Infinity guards & ID prefix fixes
  // ---------------------------------------------------------------------------

  it('heatmap treats NaN cell values as 0', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm', title: 'HM',
        heatMap: makeHeatMapConfig({
          cells: [[{ value: NaN }, { value: 50 }], [{ value: 30 }, { value: NaN }]],
        }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('NaN');
    expect(section.html).toContain('--intensity:');
  });

  it('heatmap treats Infinity cell values as 0', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm', title: 'HM',
        heatMap: makeHeatMapConfig({
          cells: [[{ value: Infinity }, { value: 50 }], [{ value: 30 }, { value: -Infinity }]],
        }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('Infinity');
    expect(section.html).not.toContain('NaN');
  });

  it('heatmap with all-NaN cells renders without NaN in legend', () => {
    const data = makeDashboard({
      panels: [{
        id: 'hm', title: 'HM',
        heatMap: makeHeatMapConfig({
          cells: [[{ value: NaN }, { value: NaN }], [{ value: NaN }, { value: NaN }]],
        }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('NaN');
  });

  it('heatmap ID with empty config.id does not double-prefix panelId', () => {
    const data = makeDashboard({
      panels: [{
        id: 'myPanel', title: 'HM',
        heatMap: makeHeatMapConfig({ id: '' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    // Should be "myPanel-heatmap", not "myPanel-myPanel-heatmap"
    expect(section.html).toContain('id="myPanel-heatmap"');
    expect(section.html).not.toContain('id="myPanel-myPanel-heatmap"');
  });

  it('gauge ID with empty config.id does not double-prefix panelId', () => {
    const data = makeDashboard({
      panels: [{
        id: 'myPanel', title: 'G',
        gauge: makeGaugeConfig({ id: '' }),
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    // Should be "myPanel-gauge", not "myPanel-myPanel-gauge"
    expect(section.html).toContain('id="myPanel-gauge"');
    expect(section.html).not.toContain('id="myPanel-myPanel-gauge"');
  });

  it('chart canvas ID with empty chart.id does not double-prefix panelId', () => {
    const data = makeDashboard({
      panels: [{
        id: 'myPanel', title: 'C',
        chart: { id: '', type: 'bar', title: 'Chart', labels: ['A'], datasets: [{ label: 'D', data: [1] }] },
      }],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    // Should be "myPanel-chart", not "myPanel-myPanel-chart"
    expect(section.html).toContain('id="myPanel-chart"');
    expect(section.html).not.toContain('id="myPanel-myPanel-chart"');
  });

  it('cross-namespace dedup: heading ID is deduplicated if it collides with another panel ID', () => {
    // Panel 1 id = "p1" → headingId = "p1-heading"
    // Panel 2 id = "p1-heading" → would collide with panel 1's headingId
    // Single shared Set ensures the second panel gets a suffixed ID
    const data = makeDashboard({
      panels: [
        { id: 'p1', title: 'First', gauge: { id: 'g1', title: 'G1', value: 50 } },
        { id: 'p1-heading', title: 'Second', gauge: { id: 'g2', title: 'G2', value: 60 } },
      ],
    });
    const section = generateMultiPanelDashboardSection({ data, lang: 'en' });
    // Panel 1 gets id="p1", heading id="p1-heading"
    // Panel 2 tries id="p1-heading" but that's taken, so it gets "p1-heading-1"
    expect(section.html).toContain('id="p1"');
    expect(section.html).toContain('id="p1-heading"');
    expect(section.html).toContain('id="p1-heading-1"');
  });
});
