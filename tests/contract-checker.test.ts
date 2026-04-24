/**
 * Unit tests for the SEO metadata contract checker
 * (`scripts/backfill-lib/contract-checker.ts`).
 *
 * Covers every rule documented in
 * `.github/prompts/seo-metadata-contract.md`, in both a *passing* and
 * a *failing* configuration, per the PR 2 acceptance criteria
 * ("property-based coverage: every contract rule is exercised both in
 * a passing and a failing configuration").
 */

import { describe, it, expect } from 'vitest';

import {
  checkAgainstContract,
  windowFor,
  LANG_WINDOWS,
  BANNED_TITLE_PHRASES,
  BANNED_DESCRIPTION_PHRASES,
  ISO_DATE_RE,
  TRAILING_BRAND_RE,
  GENERIC_FILLER_RE,
  SENTENCE_TERMINATOR_RE,
  __test__,
} from '../scripts/backfill-lib/contract-checker.js';

const { visualLength } = __test__;

/** Build a filler string of the desired visual length made of ASCII
 *  letters plus spaces so the terminator/adminleak rules don't fire
 *  accidentally. Used to feed the length-window tests. */
function fillerOfLength(len: number): string {
  const words = ['Sweden', 'Riksdag', 'approves', 'coalition', 'budget', 'police'];
  let out = '';
  let i = 0;
  while (visualLength(out) < len) {
    const word = words[i % words.length] ?? 'x';
    out = out ? `${out} ${word}` : word;
    i += 1;
  }
  out = out.slice(0, len);
  // Pad with non-space so trim() doesn't shrink below `len`.
  while (out.endsWith(' ')) out = out.slice(0, -1) + 'x';
  return out;
}

describe('contract-checker: windows', () => {
  it('maps all 14 contract languages', () => {
    for (const lang of ['en', 'sv', 'da', 'no', 'nb', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']) {
      expect(LANG_WINDOWS[lang as keyof typeof LANG_WINDOWS]).toBeDefined();
    }
  });

  it('applies Latin window for unknown language', () => {
    expect(windowFor('xx')).toEqual(LANG_WINDOWS.en);
  });

  it('uses tighter CJK windows', () => {
    const cjk = windowFor('ja');
    expect(cjk.titleMax).toBeLessThan(windowFor('en').titleMax);
    expect(cjk.descriptionMax).toBeLessThan(windowFor('en').descriptionMax);
  });

  it('uses tighter RTL windows', () => {
    const rtl = windowFor('ar');
    expect(rtl.titleMax).toBeLessThan(windowFor('en').titleMax);
    expect(rtl.descriptionMax).toBeLessThan(windowFor('en').descriptionMax);
  });
});

describe('contract-checker: title length', () => {
  it('PASS — title exactly at lower bound', () => {
    const title = fillerOfLength(windowFor('en').titleMin);
    const description = fillerOfLength(160) + '.';
    const { violations } = checkAgainstContract({ title, description }, 'en');
    expect(violations.find((v) => v.code === 'TITLE_TOO_SHORT')).toBeUndefined();
    expect(violations.find((v) => v.code === 'TITLE_TOO_LONG')).toBeUndefined();
  });

  it('FAIL — title below lower bound', () => {
    const title = fillerOfLength(40);
    const { violations } = checkAgainstContract(
      { title, description: fillerOfLength(160) + '.' },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_TOO_SHORT')).toBe(true);
  });

  it('FAIL — title above upper bound', () => {
    const title = fillerOfLength(120);
    const { violations } = checkAgainstContract(
      { title, description: fillerOfLength(160) + '.' },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_TOO_LONG')).toBe(true);
  });

  it('FAIL — empty title', () => {
    const { violations } = checkAgainstContract(
      { title: '', description: fillerOfLength(160) + '.' },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_EMPTY')).toBe(true);
  });
});

describe('contract-checker: title banned phrases', () => {
  const goodTitle = 'Sweden approves defence package with cross-party backing';
  const goodDesc = fillerOfLength(170) + '.';

  it('FAIL — literal YYYY-MM-DD in title', () => {
    const { violations } = checkAgainstContract(
      { title: `Sweden approves spring budget 2026-04-15 after coalition talks`, description: goodDesc },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_HAS_ISO_DATE')).toBe(true);
  });

  it('FAIL — trailing brand suffix in title', () => {
    const { violations } = checkAgainstContract(
      { title: `${goodTitle} — Riksdagsmonitor`, description: goodDesc },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_ENDS_WITH_BRAND')).toBe(true);
  });

  it('FAIL — Executive Brief boilerplate prefix', () => {
    const { violations } = checkAgainstContract(
      { title: 'Executive Brief — Propositions 2026-04-23', description: goodDesc },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_HAS_BANNED_PHRASE')).toBe(true);
  });

  it('FAIL — AI-generated filler phrase in title', () => {
    const { violations } = checkAgainstContract(
      { title: 'Riksdag Committee Reports — AI-generated political intelligence', description: goodDesc },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_HAS_BANNED_PHRASE')).toBe(true);
  });

  it('FAIL — Brief ID leak in title', () => {
    const { violations } = checkAgainstContract(
      { title: 'Brief ID: EB-2026-04-22-EVE001 Prepared by: Analyst', description: goodDesc },
      'en',
    );
    expect(violations.some((v) => v.code === 'TITLE_HAS_BANNED_PHRASE')).toBe(true);
  });

  it('PASS — clean title', () => {
    const { violations } = checkAgainstContract(
      { title: goodTitle, description: goodDesc },
      'en',
    );
    expect(violations.find((v) => v.code === 'TITLE_HAS_BANNED_PHRASE')).toBeUndefined();
    expect(violations.find((v) => v.code === 'TITLE_HAS_ISO_DATE')).toBeUndefined();
    expect(violations.find((v) => v.code === 'TITLE_ENDS_WITH_BRAND')).toBeUndefined();
  });
});

describe('contract-checker: description rules', () => {
  const goodTitle = 'Sweden approves defence package with cross-party backing';

  it('PASS — description at lower bound, terminated', () => {
    const description = fillerOfLength(140 - 1) + '.';
    const { violations } = checkAgainstContract(
      { title: goodTitle, description },
      'en',
    );
    expect(violations.find((v) => v.code === 'DESCRIPTION_TOO_SHORT')).toBeUndefined();
    expect(violations.find((v) => v.code === 'DESCRIPTION_NOT_TERMINATED')).toBeUndefined();
  });

  it('FAIL — description below lower bound', () => {
    const { violations } = checkAgainstContract(
      { title: goodTitle, description: 'Short desc.' },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_TOO_SHORT')).toBe(true);
  });

  it('FAIL — description above upper bound', () => {
    const description = fillerOfLength(250) + '.';
    const { violations } = checkAgainstContract(
      { title: goodTitle, description },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_TOO_LONG')).toBe(true);
  });

  it('FAIL — description empty', () => {
    const { violations } = checkAgainstContract(
      { title: goodTitle, description: '' },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_EMPTY')).toBe(true);
  });

  it('FAIL — description ends mid-word', () => {
    const midword = fillerOfLength(198) + 'x'; // letter, no terminator
    const { violations } = checkAgainstContract(
      { title: goodTitle, description: midword },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_NOT_TERMINATED')).toBe(true);
    expect(violations.some((v) => v.code === 'DESCRIPTION_TRUNCATED_MIDWORD')).toBe(true);
  });

  it('PASS — ellipsis is an accepted terminator', () => {
    const description = fillerOfLength(170) + '…';
    const { violations } = checkAgainstContract(
      { title: goodTitle, description },
      'en',
    );
    expect(violations.find((v) => v.code === 'DESCRIPTION_NOT_TERMINATED')).toBeUndefined();
  });

  it('PASS — CJK full stop 。 is an accepted terminator', () => {
    const description = '瑞典议会批准了新的国防预算案本周末。'.repeat(5) + '。';
    const { violations } = checkAgainstContract(
      { title: fillerOfLength(40), description },
      'zh',
    );
    expect(violations.find((v) => v.code === 'DESCRIPTION_NOT_TERMINATED')).toBeUndefined();
  });

  it('FAIL — admin leak (Brief ID)', () => {
    const description = 'Brief ID: EB-2026-04-22-EVE001 Classification: Public coalition government arithmetic in legislative momentum.';
    const { violations } = checkAgainstContract(
      { title: fillerOfLength(60), description },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_HAS_ADMIN_LEAK')).toBe(true);
  });

  it('FAIL — admin leak (Prepared by)', () => {
    const description = `Prepared by: James Sörling at 2026-04-22. ${fillerOfLength(140)}.`;
    const { violations } = checkAgainstContract(
      { title: fillerOfLength(60), description },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_HAS_ADMIN_LEAK')).toBe(true);
  });

  it('FAIL — admin leak (60-second read)', () => {
    const description = `60-second read: ✅ ${fillerOfLength(140)}.`;
    const { violations } = checkAgainstContract(
      { title: fillerOfLength(60), description },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_HAS_ADMIN_LEAK')).toBe(true);
  });

  it('FAIL — generic filler', () => {
    const description = 'AI-generated political intelligence from Sweden\'s Riksdag covering the weekly cycle.';
    const { violations } = checkAgainstContract(
      { title: fillerOfLength(60), description: description + fillerOfLength(100) + '.' },
      'en',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_GENERIC_FILLER')).toBe(true);
  });
});

describe('contract-checker: per-language windows', () => {
  it('FAIL — 35-char German description is below floor', () => {
    // From the contract §3.2 real-world failure example.
    const { violations } = checkAgainstContract(
      {
        title: 'Analyse zum Sonderausschuss über den Finanzhaushalt 2025',
        description: 'Analyse von 10 Ausschussberichten.',
      },
      'de',
    );
    expect(violations.some((v) => v.code === 'DESCRIPTION_TOO_SHORT')).toBe(true);
  });

  it('FAIL — CJK tighter window catches 80-char Japanese title', () => {
    const title = Array.from({ length: 80 }).map(() => '議').join('');
    const { violations } = checkAgainstContract(
      {
        title,
        description: Array.from({ length: 90 }).map(() => '議').join('') + '。',
      },
      'ja',
    );
    expect(violations.some((v) => v.code === 'TITLE_TOO_LONG')).toBe(true);
  });

  it('PASS — 40-char Japanese title fits CJK window', () => {
    const title = Array.from({ length: 40 }).map(() => '議').join('');
    const { violations } = checkAgainstContract(
      {
        title,
        description: Array.from({ length: 90 }).map(() => '議').join('') + '。',
      },
      'ja',
    );
    expect(violations.find((v) => v.code === 'TITLE_TOO_LONG')).toBeUndefined();
    expect(violations.find((v) => v.code === 'TITLE_TOO_SHORT')).toBeUndefined();
  });

  it('FAIL — RTL tighter window catches 100-char Arabic title', () => {
    const title = 'الريكسداغ '.repeat(20);
    const { violations } = checkAgainstContract(
      {
        title,
        description: 'الريكسداغ '.repeat(15) + '.',
      },
      'ar',
    );
    expect(violations.some((v) => v.code === 'TITLE_TOO_LONG')).toBe(true);
  });
});

describe('contract-checker: regex corpus', () => {
  it('BANNED_TITLE_PHRASES covers §2.2 list', () => {
    expect(BANNED_TITLE_PHRASES.length).toBeGreaterThanOrEqual(6);
  });
  it('BANNED_DESCRIPTION_PHRASES covers §3.1 list', () => {
    expect(BANNED_DESCRIPTION_PHRASES.length).toBeGreaterThanOrEqual(8);
  });
  it('ISO_DATE_RE matches canonical forms', () => {
    expect(ISO_DATE_RE.test('2026-04-15')).toBe(true);
    expect(ISO_DATE_RE.test('2026/04/15')).toBe(true);
    expect(ISO_DATE_RE.test('15 April 2026')).toBe(false);
  });
  it('TRAILING_BRAND_RE matches trailing " — Riksdagsmonitor"', () => {
    expect(TRAILING_BRAND_RE.test('Sweden approves budget — Riksdagsmonitor')).toBe(true);
    expect(TRAILING_BRAND_RE.test('Riksdagsmonitor reports on the Riksdag')).toBe(false);
  });
  it('GENERIC_FILLER_RE matches contract-listed filler', () => {
    expect(GENERIC_FILLER_RE.test('AI-generated political intelligence from Sweden')).toBe(true);
    expect(GENERIC_FILLER_RE.test('Evidence-based political intelligence analysis for evening-analysis on 2026-02-13')).toBe(true);
  });
  it('SENTENCE_TERMINATOR_RE accepts each multi-script terminator', () => {
    expect(SENTENCE_TERMINATOR_RE.test('ok.')).toBe(true);
    expect(SENTENCE_TERMINATOR_RE.test('ok!')).toBe(true);
    expect(SENTENCE_TERMINATOR_RE.test('ok?')).toBe(true);
    expect(SENTENCE_TERMINATOR_RE.test('ok…')).toBe(true);
    expect(SENTENCE_TERMINATOR_RE.test('ok。')).toBe(true);
    expect(SENTENCE_TERMINATOR_RE.test('ok')).toBe(false);
  });
});

describe('contract-checker: result shape', () => {
  it('ok=true when no violations', () => {
    const result = checkAgainstContract(
      {
        title: 'Sweden approves defence package with broad cross-party backing',
        description:
          'Sweden approves defence package with broad cross-party backing after three months of negotiation and a SEK 4.1bn supplementary request from the Ministry of Finance.',
      },
      'en',
    );
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('ok=false iff violations.length > 0', () => {
    const result = checkAgainstContract({ title: '', description: '' }, 'en');
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('every violation has {code, field, message, value}', () => {
    const result = checkAgainstContract({ title: '', description: '' }, 'en');
    for (const v of result.violations) {
      expect(typeof v.code).toBe('string');
      expect(['title', 'description']).toContain(v.field);
      expect(typeof v.message).toBe('string');
      expect(typeof v.value).toBe('string');
    }
  });
});
