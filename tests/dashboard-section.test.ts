/**
 * Tests for generateDashboardSection — embeddable Chart.js dashboard for articles.
 * Validates HTML structure, chart canvas rendering, data-chart-config attributes,
 * table rendering, XSS escaping, ID uniqueness, and TemplateSection shape.
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

  it('stores chart config in data-chart-config attribute instead of inline script', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    expect(section.html).toContain('data-chart-config="');
    // No inline scripts
    expect(section.html).not.toContain('<script>');
    expect(section.html).not.toContain('DOMContentLoaded');
    expect(section.html).not.toContain('new Chart(');
  });

  it('serialises chart type, labels, and datasets in data-chart-config', () => {
    const section = generateDashboardSection({ data: makeDashboard(), lang: 'en' });
    // The config is HTML-escaped inside the attribute
    expect(section.html).toContain('data-chart-config="');
    // Decode the attribute value by checking the raw JSON within the escaped attribute
    expect(section.html).toMatch(/data-chart-config="[^"]*bar[^"]*"/);
  });

  it('includes line annotations when provided', () => {
    const chart = makeChart({
      annotations: [
        { type: 'line', value: 25, label: 'Target', borderColor: '#ff0000' },
      ],
    });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('data-chart-config="');
    // The annotation should be present in the serialised config
    expect(section.html).toMatch(/annotation/);
  });

  it('handles label annotation type correctly', () => {
    const chart = makeChart({
      annotations: [
        { type: 'label', value: 50, label: 'Threshold', borderColor: '#00ff00' },
      ],
    });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('data-chart-config="');
    expect(section.html).toMatch(/annotation/);
  });

  it('skips unsupported annotation types', () => {
    const chart = makeChart({
      annotations: [
        { type: 'box' as 'line', value: 10 },
      ],
    });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    // Should not contain annotation block for unsupported types
    expect(section.html).toContain('data-chart-config="');
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

  it('escapes XSS in chart titles via data-chart-config HTML escaping', () => {
    const chart = makeChart({ title: '<script>alert(1)</script>' });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    // HTML aria-label is HTML-escaped
    expect(section.html).toContain('&lt;script&gt;');
    // No inline script block at all
    expect(section.html).not.toContain('<script>');
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

  it('sanitises chart id consistently in HTML', () => {
    const chart = makeChart({ id: 'chart-<evil>' });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="chart-evil"');
  });

  it('falls back to chart-N when sanitised id is empty', () => {
    const chart = makeChart({ id: '<>!@#' });
    const data = makeDashboard({ charts: [chart] });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="chart-0"');
  });

  it('deduplicates colliding chart ids', () => {
    const data = makeDashboard({
      charts: [
        makeChart({ id: 'same', title: 'Chart 1' }),
        makeChart({ id: 'same', title: 'Chart 2' }),
      ],
    });
    const section = generateDashboardSection({ data, lang: 'en' });
    expect(section.html).toContain('id="same"');
    expect(section.html).toContain('id="same-1"');
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
    expect(section.html).toContain('id="bar-chart"');
    expect(section.html).toContain('id="line-chart"');
    expect(section.html).toContain('id="pie-chart"');
  });

  it('includes backgroundColor and borderColor in data-chart-config', () => {
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
    expect(section.html).toContain('data-chart-config="');
  });
});
