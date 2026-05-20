/**
 * @module tests/generate-news-indexes/helpers/i18n
 * @description Split from `tests/generate-news-indexes.test.ts` (924 lines)
 * per Hack23/riksdagsmonitor#2624. Covers the localisation helpers exported
 * from `scripts/generate-news-indexes/template.ts`:
 * - generateHreflangTags (lines 788-812 in the original)
 * - generateRTLStyles    (lines 814-830)
 * - generateLanguageNotice (lines 832-880)
 *
 * Plus the dedicated `nb` / `no` BCP-47 contract assertion required by the
 * follow-up issue (see "14-language list" block at the bottom).
 */

import { describe, it, expect } from 'vitest';

import {
  generateHreflangTags,
  generateRTLStyles,
  generateLanguageNotice,
} from '../../../scripts/generate-news-indexes/template.js';
import { LANGUAGES } from '../../../scripts/generate-news-indexes/constants/languages.js';

describe('generate-news-indexes/template — generateHreflangTags', () => {
  it('emits one <link rel="alternate"> per language plus x-default', () => {
    const tags = generateHreflangTags();
    // 14 languages + x-default = at least 15 link tags
    const linkCount = (tags.match(/rel="alternate"/g) ?? []).length;
    expect(linkCount).toBeGreaterThanOrEqual(15);
  });

  it('includes x-default pointing to news/index.html', () => {
    const tags = generateHreflangTags();
    expect(tags).toContain('hreflang="x-default"');
    expect(tags).toContain('href="https://riksdagsmonitor.com/news/index.html"');
  });

  it('maps Norwegian hreflang to nb (BCP-47)', () => {
    const tags = generateHreflangTags();
    expect(tags).toContain('hreflang="nb"');
  });

  it('includes Swedish alternate link', () => {
    const tags = generateHreflangTags();
    expect(tags).toContain('hreflang="sv"');
    expect(tags).toContain('index_sv.html');
  });
});

describe('generate-news-indexes/template — generateRTLStyles', () => {
  it('returns empty string for non-RTL pages', () => {
    expect(generateRTLStyles(false)).toBe('');
    expect(generateRTLStyles(undefined)).toBe('');
  });

  it('returns RTL styles for RTL pages', () => {
    const styles = generateRTLStyles(true);
    expect(styles).toContain('<style>');
    expect(styles).toContain('RTL');
  });

  it('RTL styles include direction-aware transforms', () => {
    const styles = generateRTLStyles(true);
    expect(styles).toContain('translateX');
  });
});

describe('generate-news-indexes/template — generateLanguageNotice', () => {
  it('returns empty string for unsupported language key', () => {
    expect(generateLanguageNotice('xx')).toBe('');
    expect(generateLanguageNotice('en')).toBe(''); // EN has no notice
  });

  it('returns a notice for Danish', () => {
    const notice = generateLanguageNotice('da');
    expect(notice).toContain('class="language-notice"');
    expect(notice).toContain('dansk');
  });

  it('returns a notice for Norwegian', () => {
    const notice = generateLanguageNotice('no');
    expect(notice).toContain('class="language-notice"');
    expect(notice).toContain('norsk');
  });

  it('returns a notice for Arabic with dir="ltr" on the EN badge', () => {
    const notice = generateLanguageNotice('ar');
    expect(notice).toContain('class="language-notice"');
    expect(notice).toContain('dir="ltr"');
  });

  it('returns a notice for Hebrew with dir="ltr" on the EN badge', () => {
    const notice = generateLanguageNotice('he');
    expect(notice).toContain('dir="ltr"');
  });

  it('notices for non-RTL languages do not include dir="ltr" on the badge', () => {
    const notice = generateLanguageNotice('fi');
    expect(notice).not.toContain('dir="ltr"');
  });

  it.each(['da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'])(
    'returns a non-empty notice for every non-EN/SV language: %s',
    (lang) => {
      const notice = generateLanguageNotice(lang);
      expect(notice.length).toBeGreaterThan(0);
      expect(notice).toContain('language-notice');
    },
  );
});

// ---------------------------------------------------------------------------
// SEO uplift: news-index template generates FAQ + collapsible archive list
// ---------------------------------------------------------------------------

import { generateIndexHTML } from '../scripts/generate-news-indexes/template.js';

// ---------------------------------------------------------------------------
// Single-source 14-language list contract (per Hack23/riksdagsmonitor#2624)
// ---------------------------------------------------------------------------

describe('generate-news-indexes/constants — 14-language list', () => {
  it('exports exactly 14 languages (single source of truth)', () => {
    const codes = Object.keys(LANGUAGES);
    expect(codes).toHaveLength(14);
  });

  it('uses BCP-47 nb (not legacy no) for Norwegian hreflang', () => {
    // Norwegian internal key remains `no` (legacy URL surface, news/index_no.html)
    // but the `code` field (used for hreflang attributes) MUST be `nb` per
    // BCP-47. The site's instructions explicitly call out: Norwegian uses
    // BCP-47 `nb` (preferred) though some existing content still uses
    // legacy `no`; keep instructions and site output in sync.
    expect(LANGUAGES['no']).toBeDefined();
    expect(LANGUAGES['no']?.code).toBe('nb');
  });

  it('marks Arabic and Hebrew as RTL', () => {
    expect(LANGUAGES['ar']?.rtl).toBe(true);
    expect(LANGUAGES['he']?.rtl).toBe(true);
  });

  it('marks all other languages as LTR (rtl flag absent or false)', () => {
    const ltrCodes = Object.keys(LANGUAGES).filter(c => c !== 'ar' && c !== 'he');
    for (const code of ltrCodes) {
      expect(LANGUAGES[code as keyof typeof LANGUAGES]?.rtl ?? false).toBe(false);
    }
  });
});
