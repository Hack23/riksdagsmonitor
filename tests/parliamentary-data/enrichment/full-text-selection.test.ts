/**
 * @file full-text-selection.test.ts
 * @module tests/parliamentary-data/enrichment/full-text-selection
 * @description Verbatim assertions for the two enrichment-budget constants:
 *
 *   - `MAX_ENRICHMENT_PER_TYPE = 5`
 *   - `LONG_HORIZON_FULL_TEXT_FLOOR = 10`
 *
 * These numbers are referenced by issue #2620 acceptance criteria and by the
 * cost / time budget of every long-horizon news workflow — changing them
 * silently would either explode MCP throughput (raising the cap) or starve
 * year-ahead briefs of evidence (lowering the floor).
 *
 * The two constants live in
 * `scripts/parliamentary-data/enrichment/full-text/top-n-selection.ts` and
 * are re-exported by `enrichment/full-text/index.ts` and `data-downloader.ts`.
 * The test pins all three export sites so the constant cannot drift between
 * the source module and its convenience re-exports.
 */

import { describe, it, expect } from 'vitest';

import {
  MAX_ENRICHMENT_PER_TYPE as MAX_FROM_TOP_N,
  LONG_HORIZON_FULL_TEXT_FLOOR as FLOOR_FROM_TOP_N,
} from '../../../scripts/parliamentary-data/enrichment/full-text/top-n-selection.js';
import {
  MAX_ENRICHMENT_PER_TYPE as MAX_FROM_INDEX,
  LONG_HORIZON_FULL_TEXT_FLOOR as FLOOR_FROM_INDEX,
} from '../../../scripts/parliamentary-data/enrichment/full-text/index.js';
import {
  MAX_ENRICHMENT_PER_TYPE as MAX_FROM_DOWNLOADER,
  LONG_HORIZON_FULL_TEXT_FLOOR as FLOOR_FROM_DOWNLOADER,
} from '../../../scripts/parliamentary-data/data-downloader.js';

describe('full-text enrichment budgets', () => {
  it('MAX_ENRICHMENT_PER_TYPE === 5 (verbatim)', () => {
    expect(MAX_FROM_TOP_N).toBe(5);
  });

  it('LONG_HORIZON_FULL_TEXT_FLOOR === 10 (verbatim)', () => {
    expect(FLOOR_FROM_TOP_N).toBe(10);
  });

  it('floor is strictly greater than per-type cap (so long-horizon raises the budget)', () => {
    expect(FLOOR_FROM_TOP_N).toBeGreaterThan(MAX_FROM_TOP_N);
  });

  it('every re-export site exposes the same constant value', () => {
    expect(MAX_FROM_INDEX).toBe(MAX_FROM_TOP_N);
    expect(MAX_FROM_DOWNLOADER).toBe(MAX_FROM_TOP_N);
    expect(FLOOR_FROM_INDEX).toBe(FLOOR_FROM_TOP_N);
    expect(FLOOR_FROM_DOWNLOADER).toBe(FLOOR_FROM_TOP_N);
  });
});
