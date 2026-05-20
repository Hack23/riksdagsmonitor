/**
 * @module tests/generate-news-indexes/template/client-script-runtime
 * @description NEW per Hack23/riksdagsmonitor#2624 — smoke tests for the
 * inline client-side IIFE assembled by
 * `scripts/generate-news-indexes/template/client-script-runtime/`.
 *
 * The runtime is split across five fragments (helpers, rendering,
 * filtering, sorting, search) plus an entry assembler. These tests verify
 * the entry point glues them all together in the expected order and that
 * each fragment's expected function declarations and DOM bindings survive
 * the split. They also assert that the IIFE body stays ≤ 200 KB so it
 * remains auditable as a single CSP review unit per
 * `Secure_Development_Policy.md`.
 */

import { describe, it, expect } from 'vitest';

import { CLIENT_RUNTIME_BODY } from '../../../scripts/generate-news-indexes/template/client-script-runtime/index.js';
import { HELPER_FUNCTIONS } from '../../../scripts/generate-news-indexes/template/client-script-runtime/helpers.js';
import { RENDERING } from '../../../scripts/generate-news-indexes/template/client-script-runtime/rendering.js';
import { FILTERING } from '../../../scripts/generate-news-indexes/template/client-script-runtime/filtering.js';
import { SORTING } from '../../../scripts/generate-news-indexes/template/client-script-runtime/sorting.js';
import { SEARCH } from '../../../scripts/generate-news-indexes/template/client-script-runtime/search.js';

describe('client-script-runtime entry (CSP-relevant)', () => {
  it('assembles all five fragments in the expected order', () => {
    expect(CLIENT_RUNTIME_BODY).toBe(
      `${HELPER_FUNCTIONS}${RENDERING}${FILTERING}${SORTING}${SEARCH}`,
    );
  });

  it('produces a non-empty runtime body', () => {
    expect(CLIENT_RUNTIME_BODY.length).toBeGreaterThan(1_000);
  });

  it('stays under the 200 KB CSP audit budget (single review unit)', () => {
    // Per Secure_Development_Policy.md the inline IIFE shipped into every
    // news-index page must remain small enough to audit in one review.
    expect(CLIENT_RUNTIME_BODY.length).toBeLessThan(200_000);
  });
});

describe('client-script-runtime — helpers fragment', () => {
  it('exposes the esc() XSS-safe HTML escaper', () => {
    expect(HELPER_FUNCTIONS).toContain('function esc(');
  });
});

describe('client-script-runtime — rendering fragment', () => {
  it('defines buildArticleCard()', () => {
    expect(RENDERING).toContain('buildArticleCard');
  });

  it('escapes article fields through esc()', () => {
    // Every interpolation of article-controlled data must go through esc().
    expect(RENDERING).toContain('esc(');
  });
});

describe('client-script-runtime — filtering fragment', () => {
  it('wires the type and topic filter selects', () => {
    expect(FILTERING).toContain('filter-type');
    expect(FILTERING).toContain('filter-topic');
  });
});

describe('client-script-runtime — sorting fragment', () => {
  it('wires the sort filter select', () => {
    expect(SORTING).toContain('filter-sort');
  });
});

describe('client-script-runtime — search fragment', () => {
  it('wires the search input', () => {
    expect(SEARCH).toContain('search-input');
  });
});
