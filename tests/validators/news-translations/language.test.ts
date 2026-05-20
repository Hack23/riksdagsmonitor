/**
 * @module tests/validators/news-translations/language
 * @description Per-rule unit tests for the language helpers
 *              (`getLanguageCode`, `BCP47_TAG`, `OG_LOCALE_EXPECTED`,
 *              `NON_SWEDISH_LANGS`). Pinned from the deleted
 *              `tests/validate-news-translations.test.ts` (commit
 *              `52f9743f78~1`, "Language code detection" `describe` block)
 *              and extended to lock in BCP-47 `nb` parity for all 14
 *              languages required by the Riksdagsmonitor translation
 *              pipeline.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { describe, expect, it } from 'vitest';

import {
  BCP47_TAG,
  NON_SWEDISH_LANGS,
  OG_LOCALE_EXPECTED,
  getLanguageCode,
} from '../../../scripts/validators/news-translations/language.js';

describe('getLanguageCode', () => {
  it.each([
    ['2026-02-14-test-en.html', 'en'],
    ['2026-04-09-committee-de.html', 'de'],
    ['anything-fr.html', 'fr'],
    ['weekly-es.html', 'es'],
    ['rtl-ar.html', 'ar'],
    ['rtl-he.html', 'he'],
    ['cjk-ja.html', 'ja'],
    ['cjk-ko.html', 'ko'],
    ['cjk-zh.html', 'zh'],
    ['nordic-da.html', 'da'],
    ['nordic-no.html', 'no'],
    ['nordic-fi.html', 'fi'],
    ['euro-nl.html', 'nl'],
    ['svensk-sv.html', 'sv'],
  ])('parses %s → %s', (filename, expected) => {
    expect(getLanguageCode(filename)).toBe(expected);
  });

  it('returns null when filename has no trailing language suffix', () => {
    expect(getLanguageCode('invalid.html')).toBeNull();
    expect(getLanguageCode('2026-04-09-no-suffix.html')).toBeNull();
    expect(getLanguageCode('plain.html')).toBeNull();
  });

  it('rejects suffixes longer than two letters', () => {
    expect(getLanguageCode('test-eng.html')).toBeNull();
    expect(getLanguageCode('test-nbno.html')).toBeNull();
  });
});

describe('BCP47_TAG', () => {
  it('maps Norwegian filename suffix "no" to BCP-47 "nb" (preferred)', () => {
    // This pinning is the entire reason the BCP-47 rule exists: the
    // language-expertise convention requires `nb`, but Norwegian
    // article filenames continue to ship the legacy `-no.html` suffix
    // during the migration window.
    expect(BCP47_TAG['no']).toBe('nb');
  });

  it('maps every other language suffix to itself', () => {
    for (const lang of NON_SWEDISH_LANGS) {
      if (lang === 'no') continue;
      expect(BCP47_TAG[lang]).toBe(lang);
    }
    expect(BCP47_TAG['sv']).toBe('sv');
  });

  it('covers all 14 supported languages', () => {
    const expected = [
      'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
      'ar', 'he', 'ja', 'ko', 'zh',
    ];
    for (const lang of expected) {
      expect(BCP47_TAG[lang]).toBeDefined();
    }
  });
});

describe('OG_LOCALE_EXPECTED', () => {
  it('maps Norwegian to nb_NO (not no_NO)', () => {
    expect(OG_LOCALE_EXPECTED['no']).toBe('nb_NO');
  });

  it.each([
    ['en', 'en_US'],
    ['sv', 'sv_SE'],
    ['da', 'da_DK'],
    ['fi', 'fi_FI'],
    ['de', 'de_DE'],
    ['fr', 'fr_FR'],
    ['es', 'es_ES'],
    ['nl', 'nl_NL'],
    ['ar', 'ar_SA'],
    ['he', 'he_IL'],
    ['ja', 'ja_JP'],
    ['ko', 'ko_KR'],
    ['zh', 'zh_CN'],
  ])('maps %s to %s', (lang, locale) => {
    expect(OG_LOCALE_EXPECTED[lang]).toBe(locale);
  });
});

describe('NON_SWEDISH_LANGS', () => {
  it('does not include Swedish', () => {
    expect((NON_SWEDISH_LANGS as readonly string[]).includes('sv')).toBe(false);
  });

  it('includes the 13 non-Swedish supported languages', () => {
    expect(NON_SWEDISH_LANGS).toHaveLength(13);
  });
});
