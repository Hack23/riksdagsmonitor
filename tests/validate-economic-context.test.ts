/**
 * Tests for scripts/validate-economic-context.ts — the economic data quality gate.
 *
 * The gate enforces that every news article ships with real World Bank
 * / SCB data, Chart.js canvases, and AI commentary, and never falls
 * back to the "economic-dashboard-placeholder" bullet list.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  countWords,
  countChartCanvases,
  hasAttribution,
  parseArticleFilename,
  validateArticle,
  COVERAGE_MATRIX,
} from '../scripts/validate-economic-context.js';
import { generateEconomicDashboardSection } from '../scripts/data-transformers/content-generators/economic-dashboard-section.js';

describe('validate-economic-context: utilities', () => {
  it('countWords returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('countWords ignores whitespace runs', () => {
    expect(countWords('Sweden GDP growth was 0.82%.   2024.')).toBe(6);
  });

  it('countChartCanvases counts data-chart-config occurrences', () => {
    const html = `
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
    `;
    expect(countChartCanvases(html)).toBe(2);
  });

  it('hasAttribution recognises English and Swedish wording', () => {
    expect(hasAttribution('Source: World Bank Open Data')).toBe(true);
    expect(hasAttribution('Källa: Statistiska centralbyrån')).toBe(true);
    expect(hasAttribution('Data levereras av okända källor')).toBe(false);
  });

  it('parseArticleFilename handles committee-reports', () => {
    const p = parseArticleFilename('news/2026-04-17-committee-reports-en.html');
    expect(p).toEqual({ date: '2026-04-17', articleType: 'committee-reports' });
  });

  it('parseArticleFilename normalises government-propositions → propositions', () => {
    const p = parseArticleFilename('news/2026-04-17-government-propositions-sv.html');
    expect(p).toEqual({ date: '2026-04-17', articleType: 'propositions' });
  });

  it('parseArticleFilename normalises opposition-motions → motions', () => {
    const p = parseArticleFilename('news/2026-04-17-opposition-motions-en.html');
    expect(p?.articleType).toBe('motions');
  });

  it('parseArticleFilename normalises interpellation-debates → interpellations', () => {
    const p = parseArticleFilename('news/2026-04-17-interpellation-debates-en.html');
    expect(p?.articleType).toBe('interpellations');
  });

  it('parseArticleFilename recognises deep-inspection variants', () => {
    const p = parseArticleFilename('news/2026-04-17-deep-inspection-housing-policy-en.html');
    expect(p?.articleType).toBe('deep-inspection');
  });

  it('parseArticleFilename returns null for index files', () => {
    expect(parseArticleFilename('news/index.html')).toBeNull();
  });
});

describe('validate-economic-context: coverage matrix is consistent with contract', () => {
  it('lists all 11 primary article types', () => {
    const required = [
      'committee-reports', 'propositions', 'motions', 'interpellations',
      'evening-analysis', 'realtime-monitor', 'week-ahead', 'month-ahead',
      'weekly-review', 'monthly-review', 'article-generator',
    ];
    for (const t of required) expect(COVERAGE_MATRIX[t]).toBeDefined();
  });

  it('high-level reviews require more charts than daily article types', () => {
    expect(COVERAGE_MATRIX['monthly-review'].minCharts).toBeGreaterThan(
      COVERAGE_MATRIX['interpellations'].minCharts,
    );
  });
});

describe('validate-economic-context: generator returns null for empty dataPoints', () => {
  // Plan Phase 7: the placeholder branch must never leak through when the
  // caller explicitly passes an empty dataPoints array.
  it('returns null when dataPoints is an empty array', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      dataPoints: [],
      lang: 'en',
    });
    expect(section).toBeNull();
  });

  it('still returns a placeholder when dataPoints key is omitted (legacy)', () => {
    const section = generateEconomicDashboardSection({
      policyDomains: ['fiscal policy'],
      lang: 'en',
    });
    expect(section).not.toBeNull();
    expect(section!.html).toContain('economic-dashboard-placeholder');
  });
});

describe('validate-economic-context: validateArticle against fixtures', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'econ-gate-'));
    fs.mkdirSync(path.join(tmp, 'news'));
    fs.mkdirSync(path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('fails when HTML contains economic-dashboard-placeholder and no JSON exists', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, '<html><body><section class="economic-dashboard-placeholder"></section></body></html>');
    const v = validateArticle(articlePath, tmp);
    expect(v.length).toBeGreaterThan(0);
    expect(v.map(x => x.reason).some(r => r.includes('economic-dashboard-placeholder'))).toBe(true);
    expect(v.map(x => x.reason).some(r => r.includes('Missing or malformed'))).toBe(true);
    expect(v.map(x => x.reason).some(r => r.includes('Data by World Bank'))).toBe(true);
  });

  it('passes when JSON, charts, commentary, and attribution are all present', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    const html = `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <footer>Data by World Bank Open Data API</footer>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
      <script src="../js/chart-init.js"></script>
    </body></html>`;
    fs.writeFileSync(articlePath, html);

    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      version: '1.0',
      articleType: 'committee-reports',
      date: '2026-04-17',
      policyDomains: ['fiscal policy'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden',  indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
        { countryCode: 'DNK', countryName: 'Denmark', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 1.75 },
      ],
      // 60+ words commentary to clear the committee-reports minimum
      commentary: 'Sweden posted 0.82% GDP growth in 2024 compared with Denmark at 1.75% and Norway at 1.1%, keeping Sweden at the bottom of the Nordic league for a second consecutive year. This sluggish performance frames the committee debate on fiscal consolidation because tax revenue projections were built against a 1.4% growth baseline, and the 0.6-point miss forces trade-offs between defence and welfare spending that dominate today propositions schedule.',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));

    const v = validateArticle(articlePath, tmp);
    expect(v).toEqual([]);
  });

  it('fails when dataPoints is empty', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <footer>Data by World Bank</footer>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
      <script src="../js/chart-init.js"></script>
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      dataPoints: [],
      // Long-enough realistic commentary so the empty-dataPoints check is
      // what trips the validator, not the word-count check.
      commentary: 'Sweden GDP growth decelerated to 0.82% in 2024 while Denmark posted 1.75% and Norway 1.1%, keeping Stockholm at the Nordic bottom for a second year running. The committee debate is framed by this slowdown because tax revenue projections had assumed a 1.4% baseline; the 0.6-point miss forces trade-offs between defence and welfare spending.',
      source: { worldBank: [], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.some(x => x.reason.includes('empty dataPoints'))).toBe(true);
  });

  it('fails when commentary is too short', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <footer>Data by World Bank</footer>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
      <script src="../js/chart-init.js"></script>
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
      ],
      commentary: 'Sweden GDP was 0.82% in 2024.', // way below the 60-word minimum
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.some(x => x.reason.includes('commentary too short'))).toBe(true);
  });

  it('fails when canvases exist but Chart.js runtime is not loaded (blank-canvas gap)', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <footer>Data by World Bank</footer>
      <!-- intentionally no chart.umd or chart-init scripts -->
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
      ],
      commentary: 'Sweden posted 0.82% GDP growth in 2024 compared with Denmark at 1.75% and Norway at 1.1%, keeping Stockholm at the bottom of the Nordic league for a second consecutive year. This underperformance frames the committee debate on fiscal consolidation because tax revenue projections had assumed a 1.4% baseline; the 0.6-point miss now forces trade-offs between defence and welfare spending.',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.some(x => x.reason.includes('chart.umd.*.js'))).toBe(true);
    expect(v.some(x => x.reason.includes('chart-init.js'))).toBe(true);
  });

  it('fails when canvases exist and chart.umd is loaded but chart-init is missing', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <footer>Data by World Bank</footer>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
      ],
      commentary: 'Sweden posted 0.82% GDP growth in 2024 compared with Denmark at 1.75% and Norway at 1.1%, keeping Stockholm at the bottom of the Nordic league for a second consecutive year. This underperformance frames the committee debate on fiscal consolidation because tax revenue projections had assumed a 1.4% baseline; the 0.6-point miss now forces trade-offs between defence and welfare spending.',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.some(x => x.reason.includes('chart-init.js'))).toBe(true);
    expect(v.some(x => x.reason.includes('chart.umd.*.js'))).toBe(false);
  });

  it('fails when skip=true is used on a non-exempt article type', () => {
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, '<html><body><p>minimal</p></body></html>');
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: [],
      dataPoints: [],
      commentary: 'n/a',
      source: { worldBank: [], scb: [] },
      skip: true,
      skipReason: 'process-only story',
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.some(x => x.reason.includes('not on the exempt allow-list'))).toBe(true);
  });

  it('accepts skip=true on the exempt allow-list', () => {
    fs.mkdirSync(path.join(tmp, 'analysis', 'daily', '2026-04-17', 'realtime-monitor'), { recursive: true });
    const articlePath = path.join(tmp, 'news', '2026-04-17-realtime-monitor-en.html');
    fs.writeFileSync(articlePath, '<html><body><p>breaking process story</p></body></html>');
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'realtime-monitor', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: [],
      dataPoints: [],
      commentary: 'n/a',
      source: { worldBank: [], scb: [] },
      skip: true,
      skipReason: 'pure-process story about voting schedule change',
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v).toEqual([]);
  });

  it('accepts structured attribution from economic-data.json.source when HTML footer string is absent', () => {
    // Article ships valid charts + data but the template has not been
    // migrated to render a literal "World Bank" footer string. The
    // validator must fall back to `economic-data.json.source` instead
    // of failing the article.
    const articlePath = path.join(tmp, 'news', '2026-04-17-committee-reports-en.html');
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
      <script src="../js/chart-init.js"></script>
      <footer>Källa: Riksdagen</footer>
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
      ],
      commentary: 'Sweden posted 0.82% GDP growth in 2024 compared with Denmark at 1.75% and Norway at 1.1%, keeping Stockholm at the bottom of the Nordic league for a second consecutive year. This underperformance frames the committee debate on fiscal consolidation because tax revenue projections had assumed a 1.4% baseline; the 0.6-point miss now forces trade-offs between defence and welfare spending.',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.filter((x) => x.reason.includes('footer attribution'))).toHaveLength(0);
  });

  it('fails weekly-review when D3 Sankey marker/script is missing', () => {
    fs.mkdirSync(path.join(tmp, 'analysis', 'daily', '2026-04-17', 'weekly-review'), { recursive: true });
    const articlePath = path.join(tmp, 'news', '2026-04-17-weekly-review-en.html');
    // Enough charts + attribution + chart runtime, but NO D3
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <canvas data-chart-config='{"type":"radar"}'></canvas>
      <footer>Data by World Bank</footer>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
      <script src="../js/chart-init.js"></script>
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'weekly-review', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy', 'defence'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden',  indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
        { countryCode: 'DNK', countryName: 'Denmark', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 1.75 },
      ],
      // 150+ words to clear the weekly-review minimum
      commentary: 'Sweden posted 0.82% GDP growth in 2024 compared with Denmark at 1.75%, Norway at 1.1%, Finland at 0.3%, and Germany at 0.1%, keeping Stockholm in the middle of the Nordic league. The weekly review frames the committee debate on fiscal consolidation because tax revenue projections for the coming budget cycle had assumed a 1.4% baseline, and the 0.6-point miss now forces uncomfortable trade-offs between defence and welfare spending. Opposition motions push back on exactly this framing, arguing that the comparison with Denmark and Germany is misleading because the two economies face different export structures and different inflation regimes. Inflation of 2.8% in Sweden, down from 8.5% in 2023, partially closes that gap but the weekly review concludes that the budget markup in FiU cannot avoid difficult prioritisation choices.',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v.some((x) => x.reason.includes('data-d3-sankey'))).toBe(true);
    expect(v.some((x) => x.reason.includes('d3.*.min.js'))).toBe(true);
  });

  it('passes weekly-review when D3 Sankey marker + script are present', () => {
    fs.mkdirSync(path.join(tmp, 'analysis', 'daily', '2026-04-17', 'weekly-review'), { recursive: true });
    const articlePath = path.join(tmp, 'news', '2026-04-17-weekly-review-en.html');
    fs.writeFileSync(articlePath, `<html><body>
      <canvas data-chart-config='{"type":"bar"}'></canvas>
      <canvas data-chart-config='{"type":"line"}'></canvas>
      <canvas data-chart-config='{"type":"radar"}'></canvas>
      <div data-d3-sankey='{"nodes":[],"flows":[]}'></div>
      <footer>Data by World Bank</footer>
      <script src="../js/lib/chart.umd.4.4.1.js"></script>
      <script src="../js/chart-init.js"></script>
      <script src="../js/lib/d3.7.9.0.min.js"></script>
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'weekly-review', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy', 'defence'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden',  indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 0.82 },
        { countryCode: 'DNK', countryName: 'Denmark', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: 1.75 },
      ],
      commentary: 'Sweden posted 0.82% GDP growth in 2024 compared with Denmark at 1.75%, Norway at 1.1%, Finland at 0.3%, and Germany at 0.1%, keeping Stockholm in the middle of the Nordic league. The weekly review frames the committee debate on fiscal consolidation because tax revenue projections for the coming budget cycle had assumed a 1.4% baseline, and the 0.6-point miss now forces uncomfortable trade-offs between defence and welfare spending. Opposition motions push back on exactly this framing, arguing that the comparison with Denmark and Germany is misleading because the two economies face different export structures and different inflation regimes. Inflation of 2.8% in Sweden, down from 8.5% in 2023, partially closes that gap but the weekly review concludes that the budget markup in FiU cannot avoid difficult prioritisation choices going into the autumn. Committee rapporteurs from both blocs have indicated that the defence envelope will be protected even if welfare transfers are trimmed at the margin, and the coalition government appears prepared to absorb the political cost of that trade-off ahead of the 2026 autumn budget round.',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const v = validateArticle(articlePath, tmp);
    expect(v).toEqual([]);
  });

  it('rejects economic-data.json where dataPoints entries are malformed', async () => {
    // Import the loader directly to cover the strengthened type guard.
    const { loadEconomicContext } = await import('../scripts/data-transformers/load-economic-context.js');
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      // `value` is a string instead of number — must be rejected.
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2024', value: '0.82' },
      ],
      commentary: 'malformed',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    }));
    const ctx = loadEconomicContext('2026-04-17', 'committee-reports', tmp);
    expect(ctx).toBeNull();
  });

  it('rejects economic-data.json with non-string element in policyDomains', async () => {
    const { loadEconomicContext } = await import('../scripts/data-transformers/load-economic-context.js');
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      // A number leaked into policyDomains — must be rejected.
      policyDomains: ['fiscal policy', 42],
      dataPoints: [],
      commentary: 'n/a',
      source: { worldBank: [], scb: [] },
    }));
    const ctx = loadEconomicContext('2026-04-17', 'committee-reports', tmp);
    expect(ctx).toBeNull();
  });
});
