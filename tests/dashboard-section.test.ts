/**
 * Tests for generateDashboardSection — embeddable Chart.js dashboard for articles.
 * Validates HTML structure, chart canvas rendering, table rendering,
 * Chart.js config serialisation, XSS escaping, and TemplateSection shape.
 */

import { describe, it, expect } from 'vitest';
import { generateDashboardSection } from '../scripts/data-transformers/content-generators/dashboard-section.js';
import type { DashboardData, DashboardChartConfig } from '../scripts/types/article.js';

/** Minimal chart config for tests */
function makeChart(overrides: Partial<DashboardChartConfig> = {}): DashboardChartConfig {
  return {
    id: 'test-chart',
    type: 'bar',
    title: 'Test Chart',
    labels: ['A', 'B', 'C'],
    datasets: [{ label: 'Series 1', data: [10, 20, 30] }],
    ...overrides,
  };
}

/** Minimal dashboard data for tests */
function makeDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    title: 'Test Dashboard',
    charts: [makeChart()],
    ...overrides,
  };
}

describe('generateDashboardSection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.id).toBe('article-dashboard');
    expect(section.className).toBe('article-dashboard-section');
    expect(typeof section.html).toBe('string');
    expect(section.html.length).toBeGreaterThan(0);
  });

  it('renders a <section> with the article-dashboard class', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('<section class="article-dashboard"');
    expect(section.html).toContain('</section>');
  });

  it('renders the dashboard title', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('>Test Dashboard</h2>');
  });

  it('renders summary when provided', () => {
    const data = makeDashboard({ summary: 'Summary of findings.' });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Summary of findings.');
    expect(section.html).toContain('class="dashboard-summary"');
  });

  it('omits summary when not provided', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).not.toContain('class="dashboard-summary"');
  });

  it('renders a <canvas> element for each chart', () => {
    const data = makeDashboard({
      charts: [
        makeChart({ id: 'chart-a', title: 'Chart A' }),
        makeChart({ id: 'chart-b', title: 'Chart B' }),
      ],
    });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="chart-a"');
    expect(section.html).toContain('id="chart-b"');
    expect(section.html).toContain('aria-label="Chart A"');
    expect(section.html).toContain('aria-label="Chart B"');
  });

  it('generates inline Chart.js init script', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('<script>');
    expect(section.html).toContain('DOMContentLoaded');
    expect(section.html).toContain('new Chart(');
    expect(section.html).toContain('test-chart');
  });

  it('serialises chart type, labels, and datasets', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('"type":"bar"');
    expect(section.html).toContain('"labels":["A","B","C"]');
    expect(section.html).toContain('"data":[10,20,30]');
    expect(section.html).toContain('"label":"Series 1"');
  });

  it('includes annotations when provided', () => {
    const chart = makeChart({
      annotations: [
        { type: 'line', value: 25, label: 'Target', borderColor: '#ff0000' },
      ],
    });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('"annotation"');
    expect(section.html).toContain('"annotation0"');
    expect(section.html).toContain('"yMin":25');
    expect(section.html).toContain('Target');
  });

  it('renders data tables when provided', () => {
    const data = makeDashboard({
      tables: [{
        caption: 'Party Statistics',
        headers: ['Party', 'Seats', 'Change'],
        rows: [
          ['S', '107', '+2'],
          ['M', '68', '-2'],
        ],
      }],
    });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('Party Statistics');
    expect(section.html).toContain('<table class="dashboard-table"');
    expect(section.html).toContain('<th scope="col">Party</th>');
    expect(section.html).toContain('<td>107</td>');
    expect(section.html).toContain('<td>+2</td>');
  });

  it('escapes XSS in chart titles', () => {
    const chart = makeChart({ title: '<script>alert(1)</script>' });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    // The </script> inside the JSON config must not break the outer <script> block
    expect(section.html).not.toContain('</script>alert');
    // HTML aria-label is HTML-escaped
    expect(section.html).toContain('&lt;script&gt;');
    // JSON serialisation escapes the closing script tag
    expect(section.html).toContain('<\\/script>');
  });

  it('escapes XSS in summary', () => {
    const data = makeDashboard({ summary: '<img onerror=alert(1)>' });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<img onerror');
    expect(section.html).toContain('&lt;img onerror');
  });

  it('escapes XSS in table cells', () => {
    const data = makeDashboard({
      tables: [{
        headers: ['Name'],
        rows: [['<script>bad</script>']],
      }],
    });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).not.toContain('<script>bad');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('sanitises chart id consistently in both HTML and script', () => {
    const chart = makeChart({ id: 'chart-<evil>' });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    // Both canvas id and script getElementById use the same sanitised id
    expect(section.html).toContain('id="chart-evil"');
    expect(section.html).toContain("getElementById('chart-evil')");
  });

  it('renders Swedish labels when lang=sv and no title provided', () => {
    const data: DashboardData = {
      title: '',
      charts: [makeChart()],
    };
    const section = generateDashboardSection({ data, lang: 'sv' });
    expect(section.html).toContain('Instrumentpanel');
  });

  it('supports all 14 languages without errors', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    for (const lang of langs) {
      const section = generateDashboardSection({ data: makeDashboard(), lang });
      expect(section.html).toContain('<section class="article-dashboard"');
      expect(section.html).toContain('</section>');
    }
  });

  it('includes aria-label for accessibility', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('aria-label="Test Dashboard"');
  });

  it('handles empty charts array gracefully', () => {
    const data = makeDashboard({ charts: [] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('<section class="article-dashboard"');
    // No script block when no charts
    expect(section.html).not.toContain('<script>');
  });

  it('renders multiple chart types', () => {
    const data = makeDashboard({
      charts: [
        makeChart({ id: 'bar-chart', type: 'bar', title: 'Bar' }),
        makeChart({ id: 'line-chart', type: 'line', title: 'Line' }),
        makeChart({ id: 'pie-chart', type: 'pie', title: 'Pie' }),
      ],
    });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('"type":"bar"');
    expect(section.html).toContain('"type":"line"');
    expect(section.html).toContain('"type":"pie"');
  });

  it('includes backgroundColor and borderColor when provided', () => {
    const chart = makeChart({
      datasets: [{
        label: 'Colored',
        data: [1, 2, 3],
        backgroundColor: ['#ff0000', '#00ff00', '#0000ff'],
        borderColor: '#333333',
        borderWidth: 2,
      }],
    });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('"backgroundColor":["#ff0000","#00ff00","#0000ff"]');
    expect(section.html).toContain('"borderColor":"#333333"');
    expect(section.html).toContain('"borderWidth":2');
  });
});
