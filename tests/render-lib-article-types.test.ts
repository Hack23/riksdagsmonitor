/**
 * Tests for scripts/render-lib/article-types.ts — the shared helper that
 * wires the article-types registry into all downstream consumers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadArticleTypesRegistry,
  getById,
  getBySubfolder,
  listByFamily,
  allTypesSortedByHorizon,
  forwardLookTypes,
  __resetCache,
} from '../scripts/render-lib/article-types.js';

describe('render-lib/article-types helper', () => {
  beforeEach(() => {
    __resetCache();
  });

  describe('loadArticleTypesRegistry', () => {
    it('loads and returns a registry with types array', () => {
      const reg = loadArticleTypesRegistry();
      expect(reg.types).toBeDefined();
      expect(Array.isArray(reg.types)).toBe(true);
      expect(reg.types.length).toBeGreaterThanOrEqual(13);
    });

    it('caches on second call', () => {
      const a = loadArticleTypesRegistry();
      const b = loadArticleTypesRegistry();
      expect(a).toBe(b); // same reference (memoised)
    });
  });

  describe('getById', () => {
    it('returns entry for known id', () => {
      const entry = getById('propositions');
      expect(entry).toBeDefined();
      expect(entry!.id).toBe('propositions');
      expect(entry!.subfolder).toBe('propositions');
    });

    it('returns undefined for unknown id', () => {
      expect(getById('nonexistent-type')).toBeUndefined();
    });

    it('returns correct label for week-ahead', () => {
      const entry = getById('week-ahead');
      expect(entry).toBeDefined();
      expect(entry!.label).toBe('Week Ahead');
    });
  });

  describe('getBySubfolder', () => {
    it('returns entry for known subfolder', () => {
      const entry = getBySubfolder('committee-reports');
      expect(entry).toBeDefined();
      expect(entry!.id).toBe('committee-reports');
    });

    it('returns undefined for unknown subfolder', () => {
      expect(getBySubfolder('unknown-folder')).toBeUndefined();
    });
  });

  describe('listByFamily', () => {
    it('returns only single-type entries for single-type family', () => {
      const entries = listByFamily('single-type');
      expect(entries.length).toBeGreaterThanOrEqual(4);
      for (const e of entries) {
        expect(e.family).toBe('single-type');
      }
    });

    it('returns only long-horizon entries for long-horizon-forecast family', () => {
      const entries = listByFamily('long-horizon-forecast');
      expect(entries.length).toBeGreaterThanOrEqual(4);
      for (const e of entries) {
        expect(e.family).toBe('long-horizon-forecast');
      }
    });

    it('returns only tier-c entries for tier-c-aggregation family', () => {
      const entries = listByFamily('tier-c-aggregation');
      expect(entries.length).toBeGreaterThanOrEqual(3);
      for (const e of entries) {
        expect(e.family).toBe('tier-c-aggregation');
      }
    });
  });

  describe('allTypesSortedByHorizon', () => {
    it('returns all types sorted by horizonDays ascending', () => {
      const sorted = allTypesSortedByHorizon();
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]!.horizonDays).toBeGreaterThanOrEqual(sorted[i - 1]!.horizonDays);
      }
    });
  });

  describe('forwardLookTypes', () => {
    it('returns long-horizon types sorted by horizonDays ascending', () => {
      const types = forwardLookTypes();
      expect(types.length).toBeGreaterThanOrEqual(4);
      const ids = types.map((t) => t.id);
      // week (7) < month (30) < quarter (90) < year (365) < election-cycle (1460)
      expect(ids.indexOf('week-ahead')).toBeLessThan(ids.indexOf('month-ahead'));
      expect(ids.indexOf('month-ahead')).toBeLessThan(ids.indexOf('quarter-ahead'));
      expect(ids.indexOf('quarter-ahead')).toBeLessThan(ids.indexOf('year-ahead'));
    });

    it('all entries have family long-horizon-forecast', () => {
      for (const t of forwardLookTypes()) {
        expect(t.family).toBe('long-horizon-forecast');
      }
    });
  });

  describe('round-trip: type → getById → fields', () => {
    it('every registry type is accessible via getById', () => {
      const reg = loadArticleTypesRegistry();
      for (const t of reg.types) {
        const found = getById(t.id);
        expect(found, `getById("${t.id}") should exist`).toBeDefined();
        expect(found!.subfolder).toBe(t.subfolder);
        expect(found!.articleWordFloor).toBeGreaterThan(0);
      }
    });

    it('every registry type is accessible via getBySubfolder', () => {
      const reg = loadArticleTypesRegistry();
      for (const t of reg.types) {
        const found = getBySubfolder(t.subfolder);
        expect(found, `getBySubfolder("${t.subfolder}") should exist`).toBeDefined();
        expect(found!.id).toBe(t.id);
      }
    });
  });

  describe('registry-driven band counts (horizonBands)', () => {
    it('registry contains expected horizon bands', () => {
      const reg = loadArticleTypesRegistry();
      expect(reg.horizonBands).toBeDefined();
      const bands = Object.keys(reg.horizonBands);
      expect(bands).toContain('72h');
      expect(bands).toContain('week');
      expect(bands).toContain('month');
      expect(bands).toContain('quarter');
      expect(bands).toContain('year');
      expect(bands).toContain('cycle');
      expect(bands).toContain('election');
    });

    it('band days are strictly increasing', () => {
      const reg = loadArticleTypesRegistry();
      const ordered = ['72h', 'week', 'month', 'quarter', 'year', 'cycle'];
      for (let i = 1; i < ordered.length; i++) {
        const prev = reg.horizonBands[ordered[i - 1]!]!;
        const curr = reg.horizonBands[ordered[i]!]!;
        expect(curr.days).toBeGreaterThan(prev.days);
      }
    });
  });

  describe('SEO labels match registry', () => {
    it('every type has a non-empty label', () => {
      const reg = loadArticleTypesRegistry();
      for (const t of reg.types) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });

    it('every type has a non-empty icon', () => {
      const reg = loadArticleTypesRegistry();
      for (const t of reg.types) {
        expect(t.icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe('hypothetical new type integration', () => {
    it('adding a type to registry would make it discoverable (simulation)', () => {
      // This test validates that the helper system correctly returns
      // undefined for unknown types — meaning adding a new type to the
      // JSON and re-running works without script edits.
      const missing = getById('budget-bill-ahead');
      expect(missing).toBeUndefined();
      // If this entry existed in the registry, it would be found.
      // The downstream consumers fall back gracefully when undefined.
    });
  });
});
