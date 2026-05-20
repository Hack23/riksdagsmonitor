/**
 * @module tests/backfill-article-metadata/walker
 * @description File discovery: filename parsing + tier classification +
 * hand-authored bypass list. Split per Hack23/riksdagsmonitor#2624 from
 * `tests/backfill-article-metadata.test.ts` (725 lines).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  parseArticleFilename,
  classify,
  findAnalysisSource,
  isKnownLang,
  __test__ as classifierTest,
} from '../../scripts/backfill-lib/classifier.js';
import type {
  ClassificationResult,
} from '../../scripts/backfill-lib/classifier.js';
import { checkAgainstContract } from '../../scripts/backfill-lib/contract-checker.js';
import type { ContractResult } from '../../scripts/backfill-lib/contract-checker.js';

describe('classifier: parseArticleFilename', () => {
  it('parses a canonical date-slug-lang filename', () => {
    const fp = parseArticleFilename('news/2026-02-13-evening-analysis-en.html');
    expect(fp.date).toBe('2026-02-13');
    expect(fp.subfolder).toBe('evening-analysis');
    expect(fp.lang).toBe('en');
  });

  it('parses a legacy multi-segment slug', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-fiscal-welfare-sv.html');
    expect(fp.date).toBe('2026-02-14');
    expect(fp.subfolder).toBe('committee-reports-fiscal-welfare');
    expect(fp.lang).toBe('sv');
  });

  it('handles absolute and relative paths equivalently', () => {
    const a = parseArticleFilename('/abs/path/news/2026-03-12-week-ahead-zh.html');
    const b = parseArticleFilename('news/2026-03-12-week-ahead-zh.html');
    expect(a.date).toBe(b.date);
    expect(a.subfolder).toBe(b.subfolder);
    expect(a.lang).toBe(b.lang);
  });

  it('returns nulls for unparseable filenames', () => {
    const fp = parseArticleFilename('news/index.html');
    expect(fp.date).toBeNull();
    expect(fp.subfolder).toBeNull();
  });

  it('lower-cases the language tag', () => {
    const fp = parseArticleFilename('news/2026-02-13-evening-analysis-JA.html');
    expect(fp.lang).toBe('ja');
  });
});

// ---------------------------------------------------------------------------
// findAnalysisSource / classify (tier assignment)
// ---------------------------------------------------------------------------

describe('classifier: tier assignment', () => {
  let tmpRoot: string;
  let analysisRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-classifier-'));
    analysisRoot = path.join(tmpRoot, 'analysis');
    fs.mkdirSync(path.join(analysisRoot, 'daily', '2026-04-15', 'propositions'), { recursive: true });
    fs.writeFileSync(
      path.join(analysisRoot, 'daily', '2026-04-15', 'propositions', 'executive-brief.md'),
      '# Sample brief\n\n## BLUF\n\nSweden approves the spring budget with cross-party support.',
    );
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  function cleanContract(): ContractResult {
    return {
      ok: true,
      violations: [],
      window: {
        titleMin: 55,
        titleMax: 70,
        descriptionMin: 140,
        descriptionMax: 200,
      },
    };
  }

  it('findAnalysisSource finds an executive-brief on disk', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-en.html');
    const src = findAnalysisSource(analysisRoot, fp);
    expect(src).toBeTruthy();
    expect(src!.endsWith('executive-brief.md')).toBe(true);
  });

  it('findAnalysisSource returns null for unknown date/slug', () => {
    const fp = parseArticleFilename('news/2099-12-31-nothing-here-en.html');
    expect(findAnalysisSource(analysisRoot, fp)).toBeNull();
  });

  it('Tier A — article with an analysis source', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-en.html');
    const result = classify(analysisRoot, fp, cleanContract());
    expect(result.tiers).toContain('A');
    expect(result.tiers).not.toContain('B');
    expect(result.analysisSource).toBeTruthy();
  });

  it('Tier B — article without an analysis source', () => {
    const fp = parseArticleFilename('news/2026-02-10-biodiversity-citizenship-en.html');
    const result = classify(analysisRoot, fp, cleanContract());
    expect(result.tiers).toContain('B');
    expect(result.tiers).not.toContain('A');
  });

  it('Tier C — non-EN article with a below-floor description', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-de.html');
    const contract = checkAgainstContract(
      {
        title: 'Analyse zum Sonderausschuss über den Finanzhaushalt der Regierung',
        description: 'Analyse von 10 Ausschussberichten.',
      },
      'de',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).toContain('C');
  });

  it('Tier C — RTL article with above-ceiling title', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-ar.html');
    const contract = checkAgainstContract(
      {
        title: 'الريكسداغ '.repeat(20),
        description: 'الريكسداغ '.repeat(15) + '.',
      },
      'ar',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).toContain('C');
  });

  it('Tier C is not assigned to EN articles even with below-floor description', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-en.html');
    const contract = checkAgainstContract(
      { title: 'Short', description: 'too short.' },
      'en',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).not.toContain('C');
  });

  it('multi-tier — Tier A + Tier C for a non-EN article with source + short description', () => {
    // Source exists for 2026-04-15/propositions, so the Japanese article
    // qualifies for Tier A; its too-short description qualifies it for
    // Tier C as well.
    const fp = parseArticleFilename('news/2026-04-15-propositions-ja.html');
    const contract = checkAgainstContract(
      { title: '議'.repeat(35), description: '議会。' },
      'ja',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).toContain('A');
    expect(result.tiers).toContain('C');
  });

  it('every reason is set when its tier is assigned', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-sv.html');
    const contract = checkAgainstContract(
      { title: 'Short', description: 'too short.' },
      'sv',
    );
    const result: ClassificationResult = classify(analysisRoot, fp, contract);
    for (const t of result.tiers) {
      expect(result.reasons[t]).toBeTruthy();
    }
  });

  it('isKnownLang accepts all 14 contract languages and the BCP-47 `nb` alias', () => {
    for (const lang of ['en', 'sv', 'da', 'no', 'nb', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']) {
      expect(isKnownLang(lang)).toBe(true);
    }
  });

  it('isKnownLang rejects an unknown language', () => {
    expect(isKnownLang('xx')).toBe(false);
  });

  it('classifier test exports parseArticleFilename / findAnalysisSource / isKnownLang', () => {
    expect(classifierTest.parseArticleFilename).toBe(parseArticleFilename);
    expect(classifierTest.findAnalysisSource).toBe(findAnalysisSource);
    expect(classifierTest.isKnownLang).toBe(isKnownLang);
  });
});

// ---------------------------------------------------------------------------
// (html-inspector tests live in tests/backfill-article-metadata/rules/hreflang.test.ts;
// no orphan fixture is kept here.)
// ---------------------------------------------------------------------------

