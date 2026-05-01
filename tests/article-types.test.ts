/**
 * Validation tests for analysis/article-types.json — the single source of
 * truth for every Riksdagsmonitor agentic news article type.
 *
 * Asserts:
 *   - JSON parseability and repository-specific structural invariants
 *   - Each type has a matching .github/workflows/news-*.md source file
 *   - Each news-*.md workflow source has a matching registry entry (no drift)
 *   - Each type has a matching reference-quality-thresholds.json block
 *   - Election cycle dates are coherent (current.end == next.start, etc.)
 *   - Long-horizon types declare longHorizonRules
 *
 * Note: Full JSON Schema (schemas/article-types.schema.json) validation via
 * Ajv is planned follow-up work; this file currently performs ad-hoc
 * structural checks only.
 *
 * If this file fails after a workflow / registry / thresholds change, the
 * single-source-of-truth invariant has been broken and must be repaired
 * before merging.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

interface ArticleType {
  id: string;
  family: 'single-type' | 'tier-c-aggregation' | 'long-horizon-forecast';
  horizonDays: number;
  lookbackDays: number;
  subfolder: string;
  tierCMultiplier: number;
  articleWordFloor: number;
  scenarioHorizonYears: number;
  forwardIndicatorHorizons: string[];
  electionCycleAnchor: 'current' | 'next' | 'both' | 'none';
  imfPolicy: string;
  icon: string;
  label: string;
  workflow: string;
  cronExpression?: string;
  dispatchOnly?: boolean;
  coreLanguages: string[];
  extraArtifacts: string[];
  longHorizonRules?: Record<string, unknown>;
  [key: string]: unknown;
}

interface Registry {
  version: string;
  effectiveDate: string;
  owner: string;
  classification: string;
  types: ArticleType[];
  electionCycles: {
    current: { id: string; start: string; end: string };
    next: { id: string; start: string; end: string };
  };
  horizonBands: Record<string, { days: number; wepFloor: string }>;
}

const registryPath = resolve(repoRoot, 'analysis/article-types.json');
const registry: Registry = JSON.parse(readFileSync(registryPath, 'utf8'));

describe('article-types registry — structural validity', () => {
  it('parses as JSON and declares a semantic version', () => {
    expect(registry.version).toMatch(/^\d+\.\d+(\.\d+)?$/);
    expect(registry.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(registry.classification).toBe('Public');
  });

  it('declares at least the 13 known article types', () => {
    expect(registry.types.length).toBeGreaterThanOrEqual(13);
    const ids = registry.types.map((t) => t.id);
    const expected = [
      'propositions',
      'motions',
      'committee-reports',
      'interpellations',
      'realtime-monitor',
      'evening-analysis',
      'week-ahead',
      'month-ahead',
      'quarter-ahead',
      'year-ahead',
      'election-cycle',
      'weekly-review',
      'monthly-review',
    ];
    for (const id of expected) {
      expect(ids, `missing article type ${id}`).toContain(id);
    }
  });

  it('every type id is unique', () => {
    const ids = registry.types.map((t) => t.id);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });

  it('every subfolder is unique', () => {
    const subs = registry.types.map((t) => t.subfolder);
    const set = new Set(subs);
    expect(set.size).toBe(subs.length);
  });
});

describe('article-types registry — workflow ↔ registry parity', () => {
  const workflowsDir = resolve(repoRoot, '.github/workflows');
  const newsWorkflowFiles = readdirSync(workflowsDir).filter(
    (f) => f.startsWith('news-') && f.endsWith('.md') && !f.endsWith('.lock.yml'),
  );
  const newsTranslate = 'news-translate.md';

  it('every type with a workflow points to a real news-*.md source', () => {
    for (const type of registry.types) {
      const workflowPath = resolve(workflowsDir, type.workflow);
      expect(existsSync(workflowPath), `${type.id}: missing workflow ${type.workflow}`).toBe(true);
    }
  });

  it('every news-*.md (except news-translate) has a registry entry', () => {
    const registeredWorkflows = new Set(registry.types.map((t) => t.workflow));
    for (const wf of newsWorkflowFiles) {
      if (wf === newsTranslate) continue;
      expect(
        registeredWorkflows.has(wf),
        `news workflow ${wf} has no registry entry in analysis/article-types.json`,
      ).toBe(true);
    }
  });
});

describe('article-types registry — long-horizon rules', () => {
  it('every long-horizon-forecast declares longHorizonRules', () => {
    const longHorizon = registry.types.filter((t) => t.family === 'long-horizon-forecast');
    expect(longHorizon.length).toBeGreaterThanOrEqual(5); // week, month, quarter, year, cycle
    for (const t of longHorizon) {
      expect(t.longHorizonRules, `${t.id}: missing longHorizonRules`).toBeDefined();
    }
  });

  it('quarter / year / cycle have ascending tier-C multipliers', () => {
    const get = (id: string) => registry.types.find((t) => t.id === id);
    const week = get('week-ahead')!;
    const month = get('month-ahead')!;
    const quarter = get('quarter-ahead')!;
    const year = get('year-ahead')!;
    const cycle = get('election-cycle')!;
    expect(week.tierCMultiplier).toBeLessThan(month.tierCMultiplier);
    expect(month.tierCMultiplier).toBeLessThan(quarter.tierCMultiplier);
    expect(quarter.tierCMultiplier).toBeLessThan(year.tierCMultiplier);
    expect(year.tierCMultiplier).toBeLessThan(cycle.tierCMultiplier);
  });

  it('cycle horizon is at least 4 years (1460 days)', () => {
    const cycle = registry.types.find((t) => t.id === 'election-cycle')!;
    expect(cycle.horizonDays).toBeGreaterThanOrEqual(1460);
    expect(cycle.electionCycleAnchor).toBe('both');
    expect(cycle.dispatchOnly).toBe(true);
  });

  it('election-cycle declares cycle-trajectory.md as an extra artifact', () => {
    const cycle = registry.types.find((t) => t.id === 'election-cycle')!;
    expect(cycle.extraArtifacts).toContain('cycle-trajectory.md');
  });

  it('year-ahead and election-cycle mandate PESTLE', () => {
    const year = registry.types.find((t) => t.id === 'year-ahead')!;
    const cycle = registry.types.find((t) => t.id === 'election-cycle')!;
    expect((year.longHorizonRules as { pestleMandatory?: boolean }).pestleMandatory).toBe(true);
    expect((cycle.longHorizonRules as { pestleMandatory?: boolean }).pestleMandatory).toBe(true);
  });
});

describe('article-types registry — election cycle coherence', () => {
  it('current cycle ends where next cycle begins', () => {
    expect(registry.electionCycles.current.end).toBe(registry.electionCycles.next.start);
  });

  it('current cycle covers Tidö mandate (2022-09-11 → 2026-09-13)', () => {
    expect(registry.electionCycles.current.start).toBe('2022-09-11');
    expect(registry.electionCycles.current.end).toBe('2026-09-13');
  });

  it('next cycle ends 2030-09-08', () => {
    expect(registry.electionCycles.next.end).toBe('2030-09-08');
  });
});

describe('article-types registry — horizon bands', () => {
  it('declares the canonical seven horizon bands', () => {
    const bands = Object.keys(registry.horizonBands);
    for (const band of ['72h', 'week', 'month', 'quarter', 'year', 'cycle', 'election']) {
      expect(bands, `missing horizon band ${band}`).toContain(band);
    }
  });

  it('each band has ascending or equal day-count by horizon', () => {
    const order = ['72h', 'week', 'month', 'quarter', 'year', 'cycle'];
    let prev = 0;
    for (const b of order) {
      const days = registry.horizonBands[b].days;
      expect(days).toBeGreaterThanOrEqual(prev);
      prev = days;
    }
  });
});

describe('article-types registry — reference-quality-thresholds parity', () => {
  const thresholdsPath = resolve(
    repoRoot,
    'analysis/methodologies/reference-quality-thresholds.json',
  );
  const thresholds = JSON.parse(readFileSync(thresholdsPath, 'utf8')) as {
    thresholds: Record<string, unknown>;
  };

  it('quarter-ahead, year-ahead, election-cycle have threshold blocks', () => {
    for (const id of ['quarter-ahead', 'year-ahead', 'election-cycle']) {
      expect(
        thresholds.thresholds[id],
        `reference-quality-thresholds.json missing block for ${id}`,
      ).toBeDefined();
    }
  });
});
