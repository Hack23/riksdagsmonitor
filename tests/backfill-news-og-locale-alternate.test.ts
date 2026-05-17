/**
 * @module Tests/BackfillNewsOgLocaleAlternate
 * @description
 * Unit tests for the `og:locale:alternate` backfill script. Verifies:
 * 1. Idempotency — files that already have alternates are untouched.
 * 2. Safety — files with no `og:locale` are untouched (we never invent one).
 * 3. Correctness — every 14-language combination injects exactly 13
 *    sibling alternates, preserving leading whitespace.
 * 4. Locale mapping — every supported `og:locale` content value resolves
 *    to the matching primary BCP-47 subtag (covers `nb_NO`/`no`,
 *    `zh_CN`/`zh`, `ar_SA`/`ar` cases).
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_LANGS,
  OG_LOCALE,
  backfillHtml,
  type Language,
} from '../scripts/backfill-news-og-locale-alternate.ts';

const HEAD_BEFORE = `<!DOCTYPE html>
<html lang="LANG">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="Test">
`;
const HEAD_AFTER = `  <meta property="og:image" content="https://example/og.png">
</head>
<body>x</body>
</html>
`;

function buildFixture(localeValue: string, htmlLang = 'xx'): string {
  return (
    HEAD_BEFORE.replace('LANG', htmlLang) +
    `  <meta property="og:locale" content="${localeValue}">\n` +
    HEAD_AFTER
  );
}

describe('backfill-news-og-locale-alternate.ts', () => {
  describe('idempotency', () => {
    it('skips files that already contain og:locale:alternate', () => {
      const html =
        HEAD_BEFORE.replace('LANG', 'en') +
        `  <meta property="og:locale" content="en_US">\n` +
        `  <meta property="og:locale:alternate" content="sv_SE">\n` +
        HEAD_AFTER;
      const result = backfillHtml(html);
      expect(result.action).toBe('skipped-already-complete');
      expect(result.html).toBe(html);
    });
  });

  describe('safety: no og:locale tag', () => {
    it('does not invent an og:locale block when none exists', () => {
      const html = HEAD_BEFORE.replace('LANG', 'en') + HEAD_AFTER;
      const result = backfillHtml(html);
      expect(result.action).toBe('skipped-no-og-locale');
      expect(result.html).toBe(html);
      expect(result.html).not.toContain('og:locale:alternate');
    });
  });

  describe('safety: unknown locale', () => {
    it('skips files whose og:locale content is not in the lookup table', () => {
      const html = buildFixture('xx_YY');
      const result = backfillHtml(html);
      expect(result.action).toBe('skipped-unknown-locale');
      expect(result.html).toBe(html);
    });
  });

  describe('correctness — all 14 languages', () => {
    for (const lang of ALL_LANGS) {
      it(`injects exactly 13 alternates for lang=${lang} (${OG_LOCALE[lang]})`, () => {
        const html = buildFixture(OG_LOCALE[lang], lang);
        const result = backfillHtml(html);
        expect(result.action).toBe('updated');
        expect(result.lang).toBe(lang);
        const alternateCount = (result.html.match(/og:locale:alternate/g) || []).length;
        expect(alternateCount).toBe(13);
        // every OTHER language's locale must be present
        for (const other of ALL_LANGS) {
          if (other === lang) continue;
          expect(result.html).toContain(`og:locale:alternate" content="${OG_LOCALE[other]}"`);
        }
        // current language must NOT appear in the alternate list
        const ownAltRe = new RegExp(`og:locale:alternate"\\s+content="${OG_LOCALE[lang]}"`);
        expect(result.html).not.toMatch(ownAltRe);
      });
    }
  });

  describe('whitespace preservation', () => {
    it('preserves 2-space leading indentation', () => {
      const html = buildFixture('en_US', 'en'); // 2-space indent
      const result = backfillHtml(html);
      expect(result.action).toBe('updated');
      expect(result.html).toContain('  <meta property="og:locale:alternate" content="sv_SE">');
    });

    it('preserves 4-space leading indentation', () => {
      const html =
        HEAD_BEFORE.replace('LANG', 'en') +
        `    <meta property="og:locale" content="en_US">\n` +
        HEAD_AFTER;
      const result = backfillHtml(html);
      expect(result.action).toBe('updated');
      expect(result.html).toContain('    <meta property="og:locale:alternate" content="sv_SE">');
    });

    it('preserves zero leading indentation', () => {
      const html =
        HEAD_BEFORE.replace('LANG', 'en') +
        `<meta property="og:locale" content="en_US">\n` +
        HEAD_AFTER;
      const result = backfillHtml(html);
      expect(result.action).toBe('updated');
      expect(result.html).toContain('\n<meta property="og:locale:alternate" content="sv_SE">');
    });
  });

  describe('idempotency on second pass', () => {
    it('running the backfill twice produces the same result as running it once', () => {
      const html = buildFixture('ja_JP', 'ja');
      const first = backfillHtml(html);
      expect(first.action).toBe('updated');
      const second = backfillHtml(first.html);
      expect(second.action).toBe('skipped-already-complete');
      expect(second.html).toBe(first.html);
    });
  });

  describe('locale lookup table completeness', () => {
    it('every supported language has a unique og:locale value', () => {
      const values = ALL_LANGS.map((l) => OG_LOCALE[l]);
      expect(new Set(values).size).toBe(values.length);
    });

    it('Norwegian uses BCP-47 nb_NO (Norwegian Bokmål)', () => {
      // Per project memory: Norwegian uses BCP-47 `nb` not `no`.
      expect(OG_LOCALE['no' as Language]).toBe('nb_NO');
    });

    it('Chinese uses zh_CN', () => {
      expect(OG_LOCALE.zh).toBe('zh_CN');
    });

    it('Arabic uses ar_SA', () => {
      expect(OG_LOCALE.ar).toBe('ar_SA');
    });
  });
});
