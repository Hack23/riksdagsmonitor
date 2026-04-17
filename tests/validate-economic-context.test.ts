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
    </body></html>`);
    const jsonPath = path.join(tmp, 'analysis', 'daily', '2026-04-17', 'committeeReports', 'economic-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      policyDomains: ['fiscal policy'],
      dataPoints: [],
      commentary: 'Sweden'.repeat(60),
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
});
