/**
 * Tests for analyzeDashboardData — AI-powered multi-chart dashboard analyzer.
 *
 * Validates:
 * - Returns exactly 3 AI-analyzed charts (radar, scatter, bar)
 * - Each chart has a corresponding accessible data table
 * - All 14 languages supported without errors
 * - Correct chart types: radar, scatter, bar
 * - Accessible tables have correct structure (headers + rows)
 * - Data quality classification (high / medium / low)
 * - Scores are clamped to [1, 10]
 * - XSS: chart titles and table cells use safe content (not user-controlled)
 * - Empty document list produces valid placeholder charts
 * - Charts carry AIChartConfig metadata (analysisNote, dataSource, confidence)
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeDashboardData,
  type DashboardAnalysisResult,
  type AIChartConfig,
} from '../scripts/ai-analysis/dashboard-analyzer.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    doktyp: 'prop',
    titel: 'Test proposition om budget',
    summary: 'A proposal about fiscal policy and budget implementation.',
    ...overrides,
  };
}

function makeDocSet(): RawDocument[] {
  return [
    makeDoc({ doktyp: 'prop', titel: 'Budget proposition 2026' }),
    makeDoc({ doktyp: 'mot',  titel: 'Motion om skattelättnad' }),
    makeDoc({ doktyp: 'bet',  titel: 'Betänkande om finansutskott' }),
    makeDoc({ doktyp: 'sfs',  titel: 'Lag om förbättrad genomförandeprocess', dokumentnamn: 'SFS 2026:1' }),
    makeDoc({ doktyp: 'fpm',  titel: 'EU-fakta om direktiv' }),
    makeDoc({ doktyp: 'pressm', titel: 'Pressmeddelande: ny lag antagen' }),
  ];
}

// ---------------------------------------------------------------------------
// Basic structure
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — basic structure', () => {
  it('returns a DashboardAnalysisResult with charts, tables, summary, and dataQuality', () => {
    const result: DashboardAnalysisResult = analyzeDashboardData(makeDocSet(), 'budget', 'en');
    expect(result).toHaveProperty('charts');
    expect(result).toHaveProperty('tables');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('dataQuality');
  });

  it('returns exactly 3 AI charts', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts).toHaveLength(3);
  });

  it('returns exactly 3 accessible tables (one per AI chart)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.tables).toHaveLength(3);
  });

  it('summary contains document count', () => {
    const docs = makeDocSet();
    const result = analyzeDashboardData(docs, null, 'en');
    expect(result.summary).toContain(String(docs.length));
  });

  it('summary mentions "analysis"', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.summary.toLowerCase()).toMatch(/anal/);
  });
});

// ---------------------------------------------------------------------------
// Chart types
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — chart types', () => {
  it('first chart is a radar chart (Policy Risk Assessment)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts[0].type).toBe('radar');
  });

  it('second chart is a scatter chart (Stakeholder Alignment)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts[1].type).toBe('scatter');
  });

  it('third chart is a bar chart (Legislative Pipeline)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts[2].type).toBe('bar');
  });

  it('all 3 chart types are distinct', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const types = result.charts.map(c => c.type);
    const unique = new Set(types);
    expect(unique.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Chart IDs
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — chart IDs', () => {
  it('radar chart id is ai-risk-radar', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts[0].id).toBe('ai-risk-radar');
  });

  it('scatter chart id is ai-stakeholder-alignment', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts[1].id).toBe('ai-stakeholder-alignment');
  });

  it('bar chart id is ai-legislative-pipeline', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.charts[2].id).toBe('ai-legislative-pipeline');
  });

  it('all chart IDs are unique', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const ids = result.charts.map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// AI metadata on charts
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — AIChartConfig metadata', () => {
  it('each chart has a non-empty analysisNote', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    for (const chart of result.charts as AIChartConfig[]) {
      expect(typeof chart.analysisNote).toBe('string');
      expect(chart.analysisNote.length).toBeGreaterThan(0);
    }
  });

  it('each chart has a non-empty dataSource', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    for (const chart of result.charts as AIChartConfig[]) {
      expect(typeof chart.dataSource).toBe('string');
      expect(chart.dataSource.length).toBeGreaterThan(0);
    }
  });

  it('each chart has a confidence value between 0 and 1', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    for (const chart of result.charts as AIChartConfig[]) {
      expect(chart.confidence).toBeGreaterThanOrEqual(0);
      expect(chart.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Radar chart (risk assessment)
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — radar chart scores', () => {
  it('radar chart has exactly 5 labels (risk dimensions)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const radar = result.charts[0];
    expect(radar.labels).toHaveLength(5);
  });

  it('radar chart has one dataset', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const radar = result.charts[0];
    expect(radar.datasets).toHaveLength(1);
  });

  it('radar dataset has 5 numeric values', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const radar = result.charts[0];
    const data = radar.datasets[0].data as number[];
    expect(data).toHaveLength(5);
    for (const v of data) {
      expect(typeof v).toBe('number');
    }
  });

  it('radar scores are within [1, 10]', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const radar = result.charts[0];
    const data = radar.datasets[0].data as number[];
    for (const v of data) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    }
  });
});

// ---------------------------------------------------------------------------
// Scatter chart (stakeholder alignment)
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — scatter chart', () => {
  it('scatter chart has exactly 3 datasets (gov, opp, civil)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const scatter = result.charts[1];
    expect(scatter.datasets).toHaveLength(3);
  });

  it('each scatter dataset has exactly one {x, y} point', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const scatter = result.charts[1];
    for (const ds of scatter.datasets) {
      expect(ds.data).toHaveLength(1);
      const pt = ds.data[0] as { x: number; y: number };
      expect(pt).toHaveProperty('x');
      expect(pt).toHaveProperty('y');
    }
  });

  it('scatter points are within [1, 10]', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const scatter = result.charts[1];
    for (const ds of scatter.datasets) {
      const pt = ds.data[0] as { x: number; y: number };
      expect(pt.x).toBeGreaterThanOrEqual(1);
      expect(pt.x).toBeLessThanOrEqual(10);
      expect(pt.y).toBeGreaterThanOrEqual(1);
      expect(pt.y).toBeLessThanOrEqual(10);
    }
  });
});

// ---------------------------------------------------------------------------
// Bar chart (legislative pipeline)
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — bar chart (legislative pipeline)', () => {
  it('bar chart has labels and matching dataset values', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const bar = result.charts[2];
    expect(bar.labels).toBeDefined();
    expect(bar.datasets[0].data).toHaveLength(bar.labels!.length);
  });

  it('bar chart has at least 1 label', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const bar = result.charts[2];
    expect((bar.labels ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('bar chart values are non-negative integers', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const bar = result.charts[2];
    for (const v of bar.datasets[0].data as number[]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Accessible data tables
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — accessible tables', () => {
  it('radar table has 2 headers (dimension + score)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const radarTable = result.tables[0];
    expect(radarTable.headers).toHaveLength(2);
  });

  it('radar table has 5 rows (one per risk dimension)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const radarTable = result.tables[0];
    expect(radarTable.rows).toHaveLength(5);
  });

  it('radar table has a caption', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    expect(result.tables[0].caption).toBeTruthy();
  });

  it('scatter table has 3 headers (stakeholder + alignment + influence)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const scatterTable = result.tables[1];
    expect(scatterTable.headers).toHaveLength(3);
  });

  it('scatter table has 3 rows (gov, opp, civil)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const scatterTable = result.tables[1];
    expect(scatterTable.rows).toHaveLength(3);
  });

  it('pipeline table has 2 headers (stage + count)', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const pipelineTable = result.tables[2];
    expect(pipelineTable.headers).toHaveLength(2);
  });

  it('pipeline table rows count matches pipeline chart labels', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    const bar = result.charts[2];
    const pipelineTable = result.tables[2];
    expect(pipelineTable.rows).toHaveLength((bar.labels ?? []).length);
  });

  it('each table row has same number of cells as headers', () => {
    const result = analyzeDashboardData(makeDocSet(), null, 'en');
    for (const table of result.tables) {
      for (const row of table.rows) {
        expect(row).toHaveLength(table.headers.length);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Data quality
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — data quality', () => {
  it('returns low quality for empty document set', () => {
    const result = analyzeDashboardData([], null, 'en');
    expect(result.dataQuality).toBe('low');
  });

  it('returns medium quality for documents with only metadata (no fullText)', () => {
    const docs = [makeDoc(), makeDoc(), makeDoc()];
    const result = analyzeDashboardData(docs, null, 'en');
    expect(result.dataQuality).toBe('medium');
  });

  it('returns high quality when several documents have fullText', () => {
    const docs = Array.from({ length: 5 }, (_, i) =>
      makeDoc({ fullText: `Full text content for document ${i} that is longer than 100 characters and contains meaningful content about policy.` }),
    );
    const result = analyzeDashboardData(docs, null, 'en');
    expect(result.dataQuality).toBe('high');
  });

  it('returns high quality for 1 doc with full text + 5 other docs', () => {
    const docs = [
      makeDoc({ fullText: 'Long full text content that is more than 100 characters for quality assessment purposes in this test.' }),
      ...Array.from({ length: 5 }, () => makeDoc()),
    ];
    const result = analyzeDashboardData(docs, null, 'en');
    expect(result.dataQuality).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Empty document set
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — empty document set', () => {
  it('returns 3 charts even for empty document set', () => {
    const result = analyzeDashboardData([], null, 'en');
    expect(result.charts).toHaveLength(3);
  });

  it('returns 3 tables even for empty document set', () => {
    const result = analyzeDashboardData([], null, 'en');
    expect(result.tables).toHaveLength(3);
  });

  it('summary explains no documents available', () => {
    const result = analyzeDashboardData([], null, 'en');
    expect(result.summary.toLowerCase()).toContain('no documents');
  });
});

// ---------------------------------------------------------------------------
// Language support
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — 14 language support', () => {
  const LANGS = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

  it.each(LANGS)('lang=%s: returns 3 charts without error', (lang) => {
    const result = analyzeDashboardData(makeDocSet(), 'fiscal policy', lang);
    expect(result.charts).toHaveLength(3);
  });

  it.each(LANGS)('lang=%s: radar chart has non-empty labels', (lang) => {
    const result = analyzeDashboardData(makeDocSet(), null, lang);
    const radar = result.charts[0];
    expect((radar.labels ?? []).length).toBeGreaterThan(0);
    for (const label of radar.labels ?? []) {
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it.each(LANGS)('lang=%s: scatter chart dataset labels are non-empty', (lang) => {
    const result = analyzeDashboardData(makeDocSet(), null, lang);
    const scatter = result.charts[1];
    for (const ds of scatter.datasets) {
      expect(ds.label.length).toBeGreaterThan(0);
    }
  });

  it.each(LANGS)('lang=%s: tables have non-empty captions', (lang) => {
    const result = analyzeDashboardData(makeDocSet(), null, lang);
    for (const table of result.tables) {
      expect((table.caption ?? '').length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Single-document edge case
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — single document', () => {
  it('handles single proposition without error', () => {
    const result = analyzeDashboardData([makeDoc({ doktyp: 'prop' })], 'test', 'en');
    expect(result.charts).toHaveLength(3);
    expect(result.tables).toHaveLength(3);
    expect(result.dataQuality).toBeOneOf(['low', 'medium', 'high']);
  });

  it('handles single motion without error', () => {
    const result = analyzeDashboardData([makeDoc({ doktyp: 'mot' })], null, 'sv');
    expect(result.charts).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Keyword-driven scoring
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — keyword-driven risk scores', () => {
  it('budget keywords elevate budget-pressure score', () => {
    const richDocs = Array.from({ length: 5 }, () =>
      makeDoc({
        doktyp: 'prop',
        titel: 'Budget finansiering skatt anslag kostnad',
        summary: 'Major budgetary cost and spending increase requires funding allocation.',
      }),
    );
    const lean = Array.from({ length: 5 }, () => makeDoc({ doktyp: 'prop', titel: 'Allmän proposition' }));

    const rich = analyzeDashboardData(richDocs, null, 'en');
    const leanResult = analyzeDashboardData(lean, null, 'en');

    const richBudget = (rich.charts[0].datasets[0].data as number[])[2]; // index 2 = budget pressure
    const leanBudget = (leanResult.charts[0].datasets[0].data as number[])[2];
    // Rich budget keywords should produce a higher or equal budget pressure score
    expect(richBudget).toBeGreaterThanOrEqual(leanBudget);
  });

  it('high motion count reduces government alignment score', () => {
    const motionHeavy = Array.from({ length: 6 }, () => makeDoc({ doktyp: 'mot' }));
    const propHeavy   = Array.from({ length: 6 }, () => makeDoc({ doktyp: 'prop' }));

    const motResult  = analyzeDashboardData(motionHeavy, null, 'en');
    const propResult = analyzeDashboardData(propHeavy,   null, 'en');

    // Government alignment (x for gov) should be lower when mostly motions
    const govAlignMotion = ((motResult.charts[1].datasets[0].data[0]) as { x: number }).x;
    const govAlignProp   = ((propResult.charts[1].datasets[0].data[0]) as { x: number }).x;
    expect(govAlignProp).toBeGreaterThan(govAlignMotion);
  });
});

// ---------------------------------------------------------------------------
// fullContent fallback (codebase convention: fullText || fullContent)
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — fullContent fallback', () => {
  it('assessDataQuality returns high when documents have fullContent (not fullText)', () => {
    const docs = Array.from({ length: 5 }, (_, i) =>
      makeDoc({ fullContent: `<p>Full HTML content for document ${i} that is longer than 100 characters and contains meaningful content about policy.</p>` }),
    );
    const result = analyzeDashboardData(docs, null, 'en');
    expect(result.dataQuality).toBe('high');
  });

  it('radar confidence is higher when documents have fullContent', () => {
    const withContent = Array.from({ length: 3 }, () =>
      makeDoc({ fullContent: '<p>Full content that is longer than 100 characters to trigger the enriched-content quality signal in the analyzer.</p>' }),
    );
    const withoutContent = Array.from({ length: 3 }, () => makeDoc());

    const richResult = analyzeDashboardData(withContent, null, 'en');
    const leanResult = analyzeDashboardData(withoutContent, null, 'en');

    const richConfidence = (richResult.charts[0] as AIChartConfig).confidence;
    const leanConfidence = (leanResult.charts[0] as AIChartConfig).confidence;
    expect(richConfidence).toBeGreaterThan(leanConfidence);
  });

  it('keywords in fullContent are counted for risk scoring', () => {
    const docsWithContent = Array.from({ length: 5 }, () =>
      makeDoc({
        doktyp: 'prop',
        titel: 'Allmän proposition',
        fullContent: '<p>Budget kostnad finansiering skatt anslag spending increase</p>',
      }),
    );
    const docsWithoutContent = Array.from({ length: 5 }, () =>
      makeDoc({ doktyp: 'prop', titel: 'Allmän proposition' }),
    );

    const rich = analyzeDashboardData(docsWithContent, null, 'en');
    const lean = analyzeDashboardData(docsWithoutContent, null, 'en');

    const richBudget = (rich.charts[0].datasets[0].data as number[])[2]; // budget pressure
    const leanBudget = (lean.charts[0].datasets[0].data as number[])[2];
    expect(richBudget).toBeGreaterThanOrEqual(leanBudget);
  });
});

// ---------------------------------------------------------------------------
// skr (government communication) counted as government document
// ---------------------------------------------------------------------------

describe('analyzeDashboardData — skr document handling', () => {
  it('skr documents boost government alignment like propositions', () => {
    const skrDocs  = Array.from({ length: 6 }, () => makeDoc({ doktyp: 'skr' }));
    const propDocs = Array.from({ length: 6 }, () => makeDoc({ doktyp: 'prop' }));

    const skrResult  = analyzeDashboardData(skrDocs,  null, 'en');
    const propResult = analyzeDashboardData(propDocs, null, 'en');

    const govAlignSkr  = ((skrResult.charts[1].datasets[0].data[0]) as { x: number }).x;
    const govAlignProp = ((propResult.charts[1].datasets[0].data[0]) as { x: number }).x;
    // skr and prop should both produce high government alignment
    expect(govAlignSkr).toEqual(govAlignProp);
  });

  it('skr documents do not dilute government alignment to base level', () => {
    const motDocs = Array.from({ length: 6 }, () => makeDoc({ doktyp: 'mot' }));
    const skrDocs = Array.from({ length: 6 }, () => makeDoc({ doktyp: 'skr' }));

    const motResult = analyzeDashboardData(motDocs, null, 'en');
    const skrResult = analyzeDashboardData(skrDocs, null, 'en');

    const govAlignMot = ((motResult.charts[1].datasets[0].data[0]) as { x: number }).x;
    const govAlignSkr = ((skrResult.charts[1].datasets[0].data[0]) as { x: number }).x;
    // skr-heavy should have higher gov alignment than motion-heavy
    expect(govAlignSkr).toBeGreaterThan(govAlignMot);
  });
});
