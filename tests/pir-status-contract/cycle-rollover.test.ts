/**
 * @module tests/pir-status-contract/cycle-rollover
 * @description NEW per Hack23/riksdagsmonitor#2624 — election cycle-
 * rollover invariants per `.github/prompts/ext/cycle-rollover.md`.
 *
 * The rollover module is active **only** when `$ARTICLE_DATE` is within
 * **± 30 days** of a Swedish election anchor. These contract tests:
 *
 * 1. Verify the `electionCycles` block exists in `analysis/article-types.json`.
 * 2. Verify the activation predicate documented in §1 of the prompt uses
 *    the canonical 30-day delta.
 * 3. Verify the bridge-period semantics table (§2) covers T-30 → T+45.
 *
 * A regression in any of these invariants would silently break the
 * cycle-rollover module's activation window or freeze semantics.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PROMPT_PATH = path.join(REPO_ROOT, '.github', 'prompts', 'ext', 'cycle-rollover.md');
const REGISTRY_PATH = path.join(REPO_ROOT, 'analysis', 'article-types.json');

const PROMPT = fs.readFileSync(PROMPT_PATH, 'utf-8');

interface Registry {
  readonly electionCycles?: {
    readonly current?: { readonly start?: string };
    readonly next?: { readonly start?: string };
  };
}
const REGISTRY: Registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8')) as Registry;

// ---------------------------------------------------------------------------
// ±30-day activation window
// ---------------------------------------------------------------------------

describe('cycle-rollover module — ±30-day activation window', () => {
  it('prompt explicitly documents the ±30-day trigger window', () => {
    // The prompt's title and §1 both mention the ±30-day window. Either
    // wording style (± 30 or 30) is acceptable; one MUST appear.
    expect(PROMPT).toMatch(/(±\s*30|gt 30|-gt 30)/);
  });

  it('activation predicate uses 30 as the day-delta threshold', () => {
    // The bash predicate in §1 uses `[ "${DAYS_DELTA#-}" -gt 30 ]`.
    expect(PROMPT).toMatch(/DAYS_DELTA[^\n]*-gt\s+30/);
  });

  it('prompt links the ±30-day window to the election anchor', () => {
    expect(PROMPT.toLowerCase()).toContain('election');
    expect(PROMPT.toLowerCase()).toContain('anchor');
  });
});

// ---------------------------------------------------------------------------
// Bridge-period semantics (T-30 → T+45)
// ---------------------------------------------------------------------------

describe('cycle-rollover module — bridge-period semantics', () => {
  it('prompt documents the T-30 → T-1 pre-election bridge', () => {
    expect(PROMPT).toMatch(/T-30\s*→\s*T-1/);
  });

  it('prompt documents the T+1 → T+30 post-election bridge', () => {
    expect(PROMPT).toMatch(/T\+1\s*→\s*T\+30/);
  });

  it('prompt documents the T+31 → T+45 freeze period', () => {
    expect(PROMPT).toMatch(/T\+31\s*→\s*T\+45/);
  });

  it('prompt explicitly forbids time-budget anchor-skip reasons', () => {
    expect(PROMPT).toMatch(/time-budget[^\n]*never a valid anchor-skip reason/i);
  });
});

// ---------------------------------------------------------------------------
// Election-anchor registry parity
// ---------------------------------------------------------------------------

describe('analysis/article-types.json — electionCycles registry', () => {
  it('exposes the electionCycles block', () => {
    expect(REGISTRY.electionCycles).toBeDefined();
  });

  it('exposes a `next` cycle with an ISO date start', () => {
    const next = REGISTRY.electionCycles?.next?.start;
    expect(next).toBeDefined();
    expect(next).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('Swedish elections are quadrennial — current.start and next.start differ by ~4 years', () => {
    const current = REGISTRY.electionCycles?.current?.start;
    const next = REGISTRY.electionCycles?.next?.start;
    if (!current || !next) return; // covered by the previous test
    const yearsDelta = new Date(next).getFullYear() - new Date(current).getFullYear();
    expect(yearsDelta).toBe(4);
  });
});
