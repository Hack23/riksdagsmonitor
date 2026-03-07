/**
 * Tests for economic dashboard section — World Bank data dashboard generation.
 * Validates indicator matching, chart building, table generation, and
 * TemplateSection integration with the existing dashboard generator.
 */

import { describe, it, expect } from 'vitest';
import {
  generateEconomicDashboardSection,
  findIndicatorsForDomains,
  buildEconomicCharts,
  buildEconomicTables,
} from '../scripts/data-transformers/content-generators/economic-dashboard-section.js';
import type { EconomicDataPoint } from '../scripts/data-transformers/content-generators/economic-dashboard-section.js';
import { INDICATOR_IDS, COUNTRY_CODES } from '../scripts/world-bank-client.js';

/** Create mock World Bank data points for Nordic comparison */
function makeDataPoints(): EconomicDataPoint[] {
  return [
    { countryCode: 'SWE', countryName: 'Sweden', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2023', value: 1.2 },
    { countryCode: 'DNK', countryName: 'Denmark', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2023', value: 1.8 },
    { countryCode: 'NOR', countryName: 'Norway', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2023', value: 0.5 },
    { countryCode: 'FIN', countryName: 'Finland', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2023', value: -0.5 },
    { countryCode: 'DEU', countryName: 'Germany', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2023', value: -0.3 },
    // Trend data for Sweden
    { countryCode: 'SWE', countryName: 'Sweden', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2021', value: 5.1 },
    { countryCode: 'SWE', countryName: 'Sweden', indicatorId: INDICATOR_IDS.gdpGrowth, date: '2022', value: 2.6 },
  ];
}

describe('findIndicatorsForDomains', () => {
  it('finds GDP Growth for fiscal policy domains', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    expect(indicators.length).toBeGreaterThan(0);
    expect(indicators.some(i => i.indicatorId === INDICATOR_IDS.gdpGrowth)).toBe(true);
  });

  it('finds unemployment for labor market domains', () => {
    const indicators = findIndicatorsForDomains(['labor market']);
    expect(indicators.length).toBeGreaterThan(0);
    expect(indicators.some(i => i.indicatorId === INDICATOR_IDS.unemployment)).toBe(true);
  });

  it('finds military expenditure for defense domains', () => {
    const indicators = findIndicatorsForDomains(['defense']);
    expect(indicators.length).toBeGreaterThan(0);
    expect(indicators.some(i => i.indicatorId === INDICATOR_IDS.militaryExpenditure)).toBe(true);
  });

  it('deduplicates indicators across domains', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy', 'budget']);
    const ids = indicators.map(i => i.indicatorId);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('returns empty array for unknown domains', () => {
    const indicators = findIndicatorsForDomains(['quantum computing']);
    expect(indicators).toEqual([]);
  });
});

describe('buildEconomicCharts', () => {
  it('builds bar chart for Nordic comparison', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const charts = buildEconomicCharts(indicators, makeDataPoints());
    const barCharts = charts.filter(c => c.type === 'bar');
    expect(barCharts.length).toBeGreaterThan(0);
    expect(barCharts[0].labels?.length).toBeGreaterThan(0);
    expect(barCharts[0].datasets.length).toBeGreaterThan(0);
  });

  it('builds line chart for Sweden trend when 3+ data points', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const charts = buildEconomicCharts(indicators, makeDataPoints());
    const lineCharts = charts.filter(c => c.type === 'line');
    expect(lineCharts.length).toBeGreaterThan(0);
    expect(lineCharts[0].title).toContain('Sweden');
    expect(lineCharts[0].title).toContain('Trend');
  });

  it('uses cyberpunk color palette', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const charts = buildEconomicCharts(indicators, makeDataPoints());
    const barChart = charts.find(c => c.type === 'bar');
    expect(barChart).toBeDefined();
    const bgColors = barChart!.datasets[0].backgroundColor;
    expect(bgColors).toBeDefined();
    // Sweden should get cyan (#00d9ff)
    if (Array.isArray(bgColors)) {
      expect(bgColors).toContain('#00d9ff');
    }
  });

  it('sanitizes chart IDs', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const charts = buildEconomicCharts(indicators, makeDataPoints());
    for (const chart of charts) {
      expect(chart.id).toMatch(/^econ-/);
      expect(chart.id).not.toContain('.');
    }
  });

  it('returns empty array when no data points match', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const charts = buildEconomicCharts(indicators, []);
    expect(charts).toEqual([]);
  });
});

describe('buildEconomicTables', () => {
  it('builds tables with country data', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const tables = buildEconomicTables(indicators, makeDataPoints());
    expect(tables.length).toBeGreaterThan(0);
    expect(tables[0].headers.length).toBe(3);
    expect(tables[0].rows.length).toBeGreaterThan(0);
  });

  it('includes caption with indicator name and year', () => {
    const indicators = findIndicatorsForDomains(['fiscal policy']);
    const tables = buildEconomicTables(indicators, makeDataPoints());
    expect(tables[0].caption).toContain('2023');
    expect(tables[0].caption).toContain('GDP');
  });
});

describe('generateEconomicDashboardSection', () => {
  it('returns null when no indicators match domains', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['quantum computing'],
      lang: 'en',
    });
    expect(section).toBeNull();
  });

  it('returns a placeholder section when indicators match but no data points', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      lang: 'en',
    });
    expect(section).not.toBeNull();
    expect(section!.id).toBe('economic-dashboard');
    expect(section!.html).toContain('GDP Growth');
    expect(section!.html).toContain('Economic Context');
  });

  it('returns a dashboard section with charts when data points provided', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      dataPoints: makeDataPoints(),
      lang: 'en',
    });
    expect(section).not.toBeNull();
    // When data is provided, it delegates to generateDashboardSection
    expect(section!.id).toBe('article-dashboard');
    expect(section!.html).toContain('data-chart-config');
  });

  it('uses localized heading for Swedish', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      lang: 'sv',
    });
    expect(section).not.toBeNull();
    expect(section!.html).toContain('Ekonomisk kontext');
  });

  it('includes custom summary when provided', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      dataPoints: makeDataPoints(),
      lang: 'en',
      summary: 'Swedish GDP growth has slowed in 2023.',
    });
    expect(section).not.toBeNull();
    expect(section!.html).toContain('Swedish GDP growth has slowed');
  });

  it('supports all 14 languages', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    for (const lang of langs) {
      const section = generateEconomicDashboardSection({
        policyDomains: ['fiscal policy'],
        lang,
      });
      expect(section).not.toBeNull();
      expect(section!.html).toContain('<section');
    }
  });

  it('renders accessible indicator list in placeholder mode', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      lang: 'en',
    });
    expect(section).not.toBeNull();
    expect(section!.html).toContain('economic-indicators-list');
    expect(section!.html).toContain('<li>');
  });
});
