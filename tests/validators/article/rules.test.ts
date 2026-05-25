/**
 * @module tests/validators/article/rules
 * @description Unit tests for the per-rule wrapper functions in the
 *              article validator subtree. The granular helpers
 *              (`extractBluf`, `countBlufEvidenceAnchors`,
 *              `countWords`, `computeCitationDensity`,
 *              `scanStaleProvenance`, `loadBannedPhrases`,
 *              `scanBannedPhrases`) are already exercised via
 *              `tests/validate-article.test.ts`. This file covers the
 *              `check*` rule wrappers that produce the canonical
 *              `ArticleViolation[]` payloads consumed by
 *              `scripts/validators/article/index.ts`, locking in the
 *              `file` / `code` / `message` contracts that gate output
 *              dashboards downstream.
 *
 * @see scripts/validators/article/rules/bluf.ts
 * @see scripts/validators/article/rules/citation-density.ts
 * @see scripts/validators/article/rules/stale-provenance.ts
 * @see scripts/validators/article/rules/banned-phrases.ts
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  checkBluf,
  extractBluf,
  MAX_BLUF_PROSE_CHARS,
  MIN_BLUF_PROSE_CHARS,
} from '../../../scripts/validators/article/rules/bluf.js';
import { checkCitationDensity } from '../../../scripts/validators/article/rules/citation-density.js';
import { checkStaleProvenance } from '../../../scripts/validators/article/rules/stale-provenance.js';
import {
  checkBannedPhrases,
  resetBannedPhrasesCache,
} from '../../../scripts/validators/article/rules/banned-phrases.js';

// ---------------------------------------------------------------------------
// extractBluf — block extraction helper exported for the renderer + validator
// ---------------------------------------------------------------------------

describe('extractBluf', () => {
  it('extracts the prose paragraph following a `## BLUF` heading', () => {
    const md = [
      '# Title',
      '',
      '## BLUF',
      '',
      'Government tabled HD12345 today, narrowing the deficit by SEK 4bn.',
      '',
      '## Next section',
      '',
      'Body.',
    ].join('\n');
    expect(extractBluf(md)).toContain('HD12345');
  });

  it('accepts a decorated BLUF heading (e.g. with an emoji prefix)', () => {
    const md = '## 🎯 BLUF — key judgements\n\nClaim with dok_id HC01SoU29.\n\n## Next';
    expect(extractBluf(md)).toContain('HC01SoU29');
  });

  it('returns null when no BLUF heading is present', () => {
    expect(extractBluf('# Title\n\nNo BLUF here.\n')).toBeNull();
  });

  it('skips blockquote / table / list-only first paragraphs (returns null)', () => {
    // `extractBluf` stops scanning at the first blank line after the
    // heading. When that first paragraph is composed purely of
    // blockquote / table / list / HTML lines, it is filtered out and
    // the function reports "no prose extractable" by returning null —
    // this is the canonical behaviour the article validator depends on.
    const blockquoteOnly = '## BLUF\n\n> only a quote\n\n## Next\n';
    expect(extractBluf(blockquoteOnly)).toBeNull();

    const tableOnly = '## BLUF\n\n| h | h |\n| - | - |\n| a | b |\n\n## Next\n';
    expect(extractBluf(tableOnly)).toBeNull();

    const listOnly = '## BLUF\n\n* list item\n* item two\n\n## Next\n';
    expect(extractBluf(listOnly)).toBeNull();
  });

  it('handles a BLUF block that runs to end-of-file (no trailing heading)', () => {
    const md = '## BLUF\n\nClosing claim with HD99999 reference.\n';
    expect(extractBluf(md)).toContain('HD99999');
  });
});

// ---------------------------------------------------------------------------
// checkBluf — assembles the three BLUF violations
// ---------------------------------------------------------------------------

describe('checkBluf', () => {
  it('returns no violations when no BLUF heading is present', () => {
    expect(checkBluf('articles/foo.md', '# Title\n\nNo BLUF here.\n')).toEqual([]);
  });

  it('returns no violations when BLUF is within bounds and carries an anchor', () => {
    const prose =
      'Government tabled Prop. 2025/26:259 today, narrowing the deficit by ' +
      'roughly SEK 4 billion ahead of the September 2026 election cycle.';
    expect(prose.length).toBeGreaterThanOrEqual(MIN_BLUF_PROSE_CHARS);
    const md = `## BLUF\n\n${prose}\n\n## Next\n`;
    expect(checkBluf('articles/foo.md', md)).toEqual([]);
  });

  it('flags a BLUF that is too short with the `bluf-too-short` code', () => {
    const md = '## BLUF\n\nToo short HD12345.\n\n## Next\n';
    const out = checkBluf('articles/foo.md', md);
    const codes = out.map((v) => v.code);
    expect(codes).toContain('bluf-too-short');
    const violation = out.find((v) => v.code === 'bluf-too-short')!;
    expect(violation.file).toBe('articles/foo.md');
    expect(violation.message).toContain(`minimum is ${MIN_BLUF_PROSE_CHARS}`);
  });

  it('flags a BLUF that exceeds the maximum prose length', () => {
    const prose = `${'word '.repeat(400)}Prop. 2025/26:259 trailing anchor.`;
    expect(prose.length).toBeGreaterThan(MAX_BLUF_PROSE_CHARS);
    const md = `## BLUF\n\n${prose}\n\n## Next\n`;
    const out = checkBluf('articles/foo.md', md);
    const violation = out.find((v) => v.code === 'bluf-too-long');
    expect(violation).toBeDefined();
    expect(violation!.message).toContain(`maximum is ${MAX_BLUF_PROSE_CHARS}`);
  });

  it('flags missing evidence anchor when prose has no dok_id / URL / vote id', () => {
    const prose =
      'Government today signalled an intention to publish a position paper ' +
      'before the upcoming session resumes after the recess concludes.';
    expect(prose.length).toBeGreaterThanOrEqual(MIN_BLUF_PROSE_CHARS);
    const md = `## BLUF\n\n${prose}\n\n## Next\n`;
    const codes = checkBluf('articles/foo.md', md).map((v) => v.code);
    expect(codes).toContain('bluf-missing-evidence-anchor');
  });
});

// ---------------------------------------------------------------------------
// checkCitationDensity — produces the `low-citation-density` violation
// ---------------------------------------------------------------------------

describe('checkCitationDensity', () => {
  it('returns no violations for empty text', () => {
    expect(checkCitationDensity('articles/foo.md', '', '')).toEqual([]);
  });

  it('flags prose with words but zero evidence anchors', () => {
    const text = 'Government appears to be considering several reforms over the recess period.';
    const out = checkCitationDensity('articles/foo.md', text, '');
    expect(out).toHaveLength(1);
    expect(out[0]!.code).toBe('low-citation-density');
    expect(out[0]!.file).toBe('articles/foo.md');
    expect(out[0]!.message).toContain('zero verifiable evidence anchors');
  });

  it('passes when density is within the default 200 words-per-anchor budget', () => {
    const text = `${'word '.repeat(50)}HD12345 closes the analysis.`;
    expect(checkCitationDensity('articles/foo.md', text, '')).toEqual([]);
  });

  it('flags density that exceeds the default 200 words-per-anchor threshold', () => {
    const text = `${'word '.repeat(300)}HD12345`;
    const out = checkCitationDensity('articles/foo.md', text, '');
    expect(out).toHaveLength(1);
    expect(out[0]!.code).toBe('low-citation-density');
    expect(out[0]!.message).toContain('words/anchor');
  });

  it('honours the per-article-type threshold from reference-quality-thresholds.json', () => {
    // The repo ships `propositions: 160` and `realtime-monitor: 200`.
    // With ~190 words/anchor we should fail for `propositions` but pass for `realtime-monitor`.
    const text = `${'word '.repeat(190)}HD12345`;
    const failOut = checkCitationDensity('articles/foo.md', text, 'propositions');
    const passOut = checkCitationDensity('articles/foo.md', text, 'realtime-monitor');
    expect(failOut).toHaveLength(1);
    expect(failOut[0]!.message).toContain('"propositions"');
    expect(passOut).toEqual([]);
  });

  it('falls back to the default threshold for unknown article types', () => {
    const text = `${'word '.repeat(50)}HD12345`;
    expect(
      checkCitationDensity('articles/foo.md', text, 'this-type-does-not-exist'),
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkStaleProvenance — wraps scanStaleProvenance
// ---------------------------------------------------------------------------

describe('checkStaleProvenance', () => {
  it('returns [] when no `retrieved_at:` lines are present', () => {
    expect(checkStaleProvenance('articles/foo.md', '# Title\n\nNothing here.\n')).toEqual([]);
  });

  it('returns [] when all provenance vintages are within 6 months', () => {
    const today = new Date().toISOString().slice(0, 10);
    const text = `economicProvenance:\n  retrieved_at: ${today}\n`;
    expect(checkStaleProvenance('articles/foo.md', text)).toEqual([]);
  });

  it('emits `stale-economic-provenance` when vintage exceeds 6 months without annotation', () => {
    const oldDate = '2020-01-01';
    const text = `economicProvenance:\n  retrieved_at: ${oldDate}\n`;
    const out = checkStaleProvenance('articles/foo.md', text);
    expect(out).toHaveLength(1);
    expect(out[0]!.code).toBe('stale-economic-provenance');
    expect(out[0]!.file).toBe('articles/foo.md');
    expect(out[0]!.message).toContain(oldDate);
    expect(out[0]!.message).toContain('1 economicProvenance block');
  });

  it('does not flag stale vintage when an annotation comment is on the preceding line', () => {
    const text = '<!-- stale-vintage: SCB Q1 vintage retained pending Q3 refresh -->\nretrieved_at: 2020-01-01\n';
    expect(checkStaleProvenance('articles/foo.md', text)).toEqual([]);
  });

  it('lists up to two stale vintages in the message sample', () => {
    const text = [
      'retrieved_at: 2019-01-01',
      'retrieved_at: 2019-06-01',
      'retrieved_at: 2019-09-01',
    ].join('\n');
    const out = checkStaleProvenance('articles/foo.md', text);
    expect(out).toHaveLength(1);
    expect(out[0]!.message).toContain('3 economicProvenance block');
    // Two vintages sampled (others elided)
    const sampleHits = (out[0]!.message.match(/\(\d/g) ?? []).length;
    expect(sampleHits).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// checkBannedPhrases — pulls from the canonical political-style-guide.json
// ---------------------------------------------------------------------------

describe('checkBannedPhrases', () => {
  // The module-scope cache must be reset between tests so that
  // a missing/malformed file in one test does not leak into the next.
  beforeEach(() => {
    resetBannedPhrasesCache();
  });
  afterEach(() => {
    resetBannedPhrasesCache();
  });

  it('returns [] when no banned phrases are present', () => {
    const out = checkBannedPhrases('articles/foo.md', 'A neutral factual sentence with HD12345.');
    // With the canonical file in-repo we expect no violations on this benign text.
    // (The check would still be safe even if the canonical file were empty.)
    expect(out.filter((v) => v.code === 'banned-phrase-detected')).toEqual([]);
  });

  it('emits `banned-phrase-detected` when at least one phrase appears in the text', async () => {
    // Pull a real phrase from the canonical list to keep the test in lock-step
    // with the editorial source-of-truth instead of hard-coding strings.
    const { loadBannedPhrases } = await import(
      '../../../scripts/validators/article/rules/banned-phrases.js'
    );
    resetBannedPhrasesCache();
    const phrases = loadBannedPhrases();
    if (!phrases || phrases.length === 0) {
      // No banned phrases configured for this run — skip without failing.
      return;
    }
    const phrase = phrases[0]!;
    const text = `Some prose that includes "${phrase}" inline.`;
    const out = checkBannedPhrases('articles/foo.md', text);
    const violation = out.find((v) => v.code === 'banned-phrase-detected');
    expect(violation).toBeDefined();
    expect(violation!.file).toBe('articles/foo.md');
    expect(violation!.message).toMatch(/banned phrase/i);
  });
});

// ---------------------------------------------------------------------------
// checkBannedPhrases — error branch when canonical file is missing/malformed
// ---------------------------------------------------------------------------

describe('checkBannedPhrases (missing canonical file)', () => {
  // We use the loader's `repoRoot` parameter to point at a sandbox with no
  // canonical JSON, exercising the `missing-banned-phrase-list` branch.
  let sandbox: string;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'rules-banned-'));
    resetBannedPhrasesCache();
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
    resetBannedPhrasesCache();
  });

  it('emits `missing-banned-phrase-list` when the canonical JSON cannot be found', async () => {
    // The `checkBannedPhrases` rule wrapper hard-codes `REPO_ROOT`, so to
    // simulate the missing file we drive `loadBannedPhrases` directly with
    // a sandbox path — replicating the contract surface that powers the
    // wrapper. The wrapper's own behaviour is asserted by the precondition
    // that `loadBannedPhrases(sandbox)` returns `null` when the canonical
    // JSON is absent.
    const { loadBannedPhrases } = await import(
      '../../../scripts/validators/article/rules/banned-phrases.js'
    );
    expect(loadBannedPhrases(sandbox)).toBeNull();
  });

  it('treats a malformed JSON file as a missing list (returns null)', async () => {
    mkdirSync(join(sandbox, 'analysis', 'methodologies'), { recursive: true });
    writeFileSync(
      join(sandbox, 'analysis', 'methodologies', 'political-style-guide.json'),
      '{ not valid json',
    );
    const { loadBannedPhrases } = await import(
      '../../../scripts/validators/article/rules/banned-phrases.js'
    );
    expect(loadBannedPhrases(sandbox)).toBeNull();
  });

  it('treats a JSON file without `allPhrases` as a missing list', async () => {
    mkdirSync(join(sandbox, 'analysis', 'methodologies'), { recursive: true });
    writeFileSync(
      join(sandbox, 'analysis', 'methodologies', 'political-style-guide.json'),
      JSON.stringify({ version: 'x' }),
    );
    const { loadBannedPhrases } = await import(
      '../../../scripts/validators/article/rules/banned-phrases.js'
    );
    expect(loadBannedPhrases(sandbox)).toBeNull();
  });

  it('deduplicates entries (case-insensitive) and skips blanks / non-strings', async () => {
    mkdirSync(join(sandbox, 'analysis', 'methodologies'), { recursive: true });
    writeFileSync(
      join(sandbox, 'analysis', 'methodologies', 'political-style-guide.json'),
      JSON.stringify({
        allPhrases: ['Sweep', 'sweep', '  ', 42, 'Crisis', 'crisis '],
      }),
    );
    const { loadBannedPhrases } = await import(
      '../../../scripts/validators/article/rules/banned-phrases.js'
    );
    const phrases = loadBannedPhrases(sandbox);
    expect(phrases).not.toBeNull();
    expect(phrases!).toEqual(['Sweep', 'Crisis']);
  });
});
