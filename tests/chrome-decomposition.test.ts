/**
 * Comprehensive tests for the decomposed chrome bounded context
 * (`scripts/render-lib/chrome/`).
 *
 * Tests cover:
 * 1. Each sub-module is importable in isolation (no circular deps)
 * 2. HTML5 structural correctness (DOCTYPE, lang, dir, semantic elements)
 * 3. WCAG 2.1 AA accessibility (skip-link, ARIA, roles, landmarks)
 * 4. RTL language handling (Arabic, Hebrew)
 * 5. hreflang alternate links for all 14 languages
 * 6. JSON-LD Schema.org correctness
 * 7. SEO meta tags (OpenGraph, Twitter Cards)
 * 8. Language switcher (all 14 languages present)
 * 9. Helpers (depth calculation, fallback alternates)
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

// Direct imports from decomposed sub-modules (proves isolation)
import type { BreadcrumbItem, ChromeOptions } from '../scripts/render-lib/chrome/types.js';
import { depth, renderHreflangBlock, fallbackAlternateHref } from '../scripts/render-lib/chrome/helpers.js';
import { renderChromeHead } from '../scripts/render-lib/chrome/head.js';
import { buildHeaderHtml } from '../scripts/render-lib/chrome/header.js';
import { buildFooterHtml } from '../scripts/render-lib/chrome/footer.js';

// Also import from the façade to prove API parity
import { buildChrome, renderChromeHead as facadeRenderChromeHead } from '../scripts/render-lib/chrome.js';

import { LANGUAGES } from '../scripts/render-lib/constants.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function minimalOpts(lang: Language = 'en'): ChromeOptions {
  return {
    lang,
    title: 'Test Article Title',
    description: 'A test article description for validation.',
    canonicalPath: 'news/2026-05-01-test-en.html',
    publishedIso: '2026-05-01T10:00:00Z',
    modifiedIso: '2026-05-01T12:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// 1. Sub-module isolation (importable without side effects)
// ---------------------------------------------------------------------------

describe('chrome/ sub-module isolation', () => {
  it('types are importable (TypeScript compile check)', () => {
    const item: BreadcrumbItem = { label: 'Home', href: '/' };
    expect(item.label).toBe('Home');
  });

  it('helpers.ts exports depth, renderHreflangBlock, fallbackAlternateHref', () => {
    expect(typeof depth).toBe('function');
    expect(typeof renderHreflangBlock).toBe('function');
    expect(typeof fallbackAlternateHref).toBe('function');
  });

  it('head.ts exports renderChromeHead', () => {
    expect(typeof renderChromeHead).toBe('function');
  });

  it('header.ts exports buildHeaderHtml', () => {
    expect(typeof buildHeaderHtml).toBe('function');
  });

  it('footer.ts exports buildFooterHtml', () => {
    expect(typeof buildFooterHtml).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// 2. Helpers — depth() calculation
// ---------------------------------------------------------------------------

describe('chrome/helpers — depth()', () => {
  it('returns empty string for root-level files', () => {
    expect(depth('index.html')).toBe('');
    expect(depth('sitemap.html')).toBe('');
  });

  it('returns ../ for one level deep', () => {
    expect(depth('news/index.html')).toBe('../');
  });

  it('returns ../../ for two levels deep', () => {
    expect(depth('news/2026-05-01/article-en.html')).toBe('../../');
  });

  it('strips leading slashes before computing depth', () => {
    expect(depth('/news/index.html')).toBe('../');
    expect(depth('///news/index.html')).toBe('../');
  });
});

// ---------------------------------------------------------------------------
// 3. Helpers — fallbackAlternateHref()
// ---------------------------------------------------------------------------

describe('chrome/helpers — fallbackAlternateHref()', () => {
  it('returns base unchanged for English', () => {
    expect(fallbackAlternateHref('en', 'index.html')).toBe('index.html');
    expect(fallbackAlternateHref('en', 'sitemap.html')).toBe('sitemap.html');
  });

  it('appends _lang suffix for non-English', () => {
    expect(fallbackAlternateHref('sv', 'index.html')).toBe('index_sv.html');
    expect(fallbackAlternateHref('ar', 'sitemap.html')).toBe('sitemap_ar.html');
    expect(fallbackAlternateHref('ja', 'political-intelligence.html'))
      .toBe('political-intelligence_ja.html');
  });
});

// ---------------------------------------------------------------------------
// 4. Helpers — renderHreflangBlock()
// ---------------------------------------------------------------------------

describe('chrome/helpers — renderHreflangBlock()', () => {
  it('emits canonical + self alternate when no alternates provided', () => {
    const block = renderHreflangBlock('en', 'news/test.html', undefined);
    expect(block).toContain('hreflang="en"');
    expect(block).toContain('rel="canonical"');
    expect(block).toContain('https://riksdagsmonitor.com/news/test.html');
  });

  it('emits all provided alternates + x-default', () => {
    const alternates: Partial<Record<Language, string>> = {
      en: 'news/test-en.html',
      sv: 'news/test-sv.html',
      ar: 'news/test-ar.html',
    };
    const block = renderHreflangBlock('en', 'news/test-en.html', alternates);
    expect(block).toContain('hreflang="en"');
    expect(block).toContain('hreflang="sv"');
    expect(block).toContain('hreflang="ar"');
    expect(block).toContain('hreflang="x-default"');
    expect(block).toContain('rel="canonical"');
  });

  it('uses English alternate as x-default', () => {
    const alternates: Partial<Record<Language, string>> = {
      en: 'news/test-en.html',
      sv: 'news/test-sv.html',
    };
    const block = renderHreflangBlock('sv', 'news/test-sv.html', alternates);
    expect(block).toContain('hreflang="x-default" href="https://riksdagsmonitor.com/news/test-en.html"');
  });
});

// ---------------------------------------------------------------------------
// 5. HTML5 structural correctness
// ---------------------------------------------------------------------------

describe('chrome/head — HTML5 structure', () => {
  it('starts with <!DOCTYPE html>', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).toMatch(/^<!DOCTYPE html>/);
  });

  it('includes <html lang="…" dir="…">', () => {
    const head = renderChromeHead(minimalOpts('en'));
    expect(head).toContain('<html lang="en" dir="ltr">');
  });

  it('sets dir="rtl" for Arabic', () => {
    const head = renderChromeHead(minimalOpts('ar'));
    expect(head).toContain('dir="rtl"');
  });

  it('sets dir="rtl" for Hebrew', () => {
    const head = renderChromeHead(minimalOpts('he'));
    expect(head).toContain('dir="rtl"');
  });

  it('includes charset and viewport meta', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).toContain('<meta charset="UTF-8">');
    expect(head).toContain('name="viewport"');
  });

  it('closes with </head>', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head.trimEnd()).toMatch(/<\/head>$/);
  });
});

// ---------------------------------------------------------------------------
// 6. SEO meta tags
// ---------------------------------------------------------------------------

describe('chrome/head — SEO meta tags', () => {
  it('includes branded title with Riksdagsmonitor suffix', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).toContain('<title>Test Article Title — Riksdagsmonitor</title>');
  });

  it('does not double-brand when title contains Riksdagsmonitor', () => {
    const opts = { ...minimalOpts(), title: 'Riksdagsmonitor Weekly Report' };
    const head = renderChromeHead(opts);
    expect(head).toContain('<title>Riksdagsmonitor Weekly Report</title>');
    expect(head).not.toContain('Riksdagsmonitor — Riksdagsmonitor');
  });

  it('includes OpenGraph meta tags', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).toContain('property="og:type" content="article"');
    expect(head).toContain('property="og:site_name" content="Riksdagsmonitor"');
    expect(head).toContain('property="og:title"');
    expect(head).toContain('property="og:description"');
    expect(head).toContain('property="og:url"');
    expect(head).toContain('property="og:image"');
  });

  it('includes Twitter Card meta tags', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).toContain('name="twitter:card" content="summary_large_image"');
    expect(head).toContain('name="twitter:site" content="@riksdagsmonitor"');
    expect(head).toContain('name="twitter:title"');
  });

  it('suppresses article meta when ogType is website', () => {
    const opts = { ...minimalOpts(), ogType: 'website' as const };
    const head = renderChromeHead(opts);
    expect(head).not.toContain('article:published_time');
    expect(head).not.toContain('article:modified_time');
    expect(head).toContain('og:type" content="website"');
  });

  it('includes article:published_time for article type', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).toContain('article:published_time');
    expect(head).toContain('2026-05-01T10:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// 7. JSON-LD injection
// ---------------------------------------------------------------------------

describe('chrome/head — JSON-LD', () => {
  it('renders JSON-LD blocks in script tags', () => {
    const opts = {
      ...minimalOpts(),
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: 'Test',
      }],
    };
    const head = renderChromeHead(opts);
    expect(head).toContain('<script type="application/ld+json">');
    expect(head).toContain('"@type":"NewsArticle"');
  });

  it('escapes < in JSON-LD to prevent XSS', () => {
    const opts = {
      ...minimalOpts(),
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'Article', name: '<script>alert(1)</script>' }],
    };
    const head = renderChromeHead(opts);
    expect(head).not.toContain('</script>alert');
    expect(head).toContain('\\u003c');
  });
});

// ---------------------------------------------------------------------------
// 8. WCAG 2.1 AA accessibility — header
// ---------------------------------------------------------------------------

describe('chrome/header — accessibility', () => {
  it('includes skip-link targeting #main', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('class="skip-link"');
    expect(header).toContain('href="#main"');
  });

  it('header has role="banner"', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('role="banner"');
  });

  it('main content area has tabindex="-1" for programmatic focus', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('<main id="main" class="rm-article-main" tabindex="-1">');
  });

  it('breadcrumb nav has aria-label', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('class="rm-breadcrumb"');
    expect(header).toMatch(/aria-label="[^"]+"/);
  });

  it('last breadcrumb item has aria-current="page"', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('aria-current="page"');
  });

  it('language switcher dropdown items have role="menuitem"', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('role="menuitem"');
  });
});

// ---------------------------------------------------------------------------
// 9. RTL language handling
// ---------------------------------------------------------------------------

describe('chrome/ — RTL language handling', () => {
  const rtlLanguages: Language[] = ['ar', 'he'];

  for (const lang of rtlLanguages) {
    it(`renders dir="rtl" in <html> for ${lang}`, () => {
      const head = renderChromeHead(minimalOpts(lang));
      expect(head).toContain('dir="rtl"');
    });

    it(`header renders correctly for ${lang}`, () => {
      const header = buildHeaderHtml(minimalOpts(lang));
      expect(header).toContain('role="banner"');
      expect(header).toContain('skip-link');
    });

    it(`footer renders correctly for ${lang}`, () => {
      const footer = buildFooterHtml(minimalOpts(lang));
      expect(footer).toContain('role="contentinfo"');
    });
  }
});

// ---------------------------------------------------------------------------
// 10. Language switcher — all 14 languages
// ---------------------------------------------------------------------------

describe('chrome/header — language switcher', () => {
  it('header dropdown contains 13 language links (all except current)', () => {
    const header = buildHeaderHtml(minimalOpts('en'));
    const menuItems = header.match(/role="menuitem"/g);
    expect(menuItems).toHaveLength(13);
  });

  it('horizontal language bar contains all 14 languages (1 current + 13 links)', () => {
    const header = buildHeaderHtml(minimalOpts('en'));
    // Current language is a span with aria-current
    expect(header).toContain('aria-current="page"');
    // Other languages are links with hreflang
    for (const lang of LANGUAGES) {
      if (lang === 'en') continue;
      expect(header).toContain(`hreflang="${lang === 'no' ? 'nb' : lang}"`);
    }
  });

  it('uses explicit hreflangAlternates when provided', () => {
    const opts: ChromeOptions = {
      ...minimalOpts('en'),
      hreflangAlternates: {
        en: 'news/test-en.html',
        sv: 'news/test-sv.html',
      },
    };
    const header = buildHeaderHtml(opts);
    expect(header).toContain('news/test-sv.html');
  });
});

// ---------------------------------------------------------------------------
// 11. Footer structure
// ---------------------------------------------------------------------------

describe('chrome/footer — structure', () => {
  it('includes role="contentinfo"', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain('role="contentinfo"');
  });

  it('includes ISMS section with policies', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain('rm-footer-isms');
    expect(footer).toContain('ISMS-PUBLIC');
  });

  it('includes trust badges with external links', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain('rm-footer-trust-badges');
    expect(footer).toContain('OpenSSF');
  });

  it('includes secondary language row', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain('rm-footer-langs');
  });

  it('includes copyright with current year', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain(`© ${new Date().getFullYear()}`);
  });

  it('closes with </body></html>', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain('</body>');
    expect(footer).toContain('</html>');
  });

  it('includes Mermaid/theme bootstrap scripts', () => {
    const footer = buildFooterHtml(minimalOpts());
    expect(footer).toContain('mermaid-init.mjs');
    expect(footer).toContain('back-to-top.js');
    expect(footer).toContain('theme-toggle.js');
  });
});

// ---------------------------------------------------------------------------
// 12. Façade parity — buildChrome delegates correctly
// ---------------------------------------------------------------------------

describe('chrome.ts façade — buildChrome', () => {
  it('returns head/headerHtml/footerHtml matching sub-module outputs', () => {
    const opts = minimalOpts();
    const chrome = buildChrome(opts);
    expect(chrome.head).toBe(renderChromeHead(opts));
    expect(chrome.headerHtml).toBe(buildHeaderHtml(opts));
    expect(chrome.footerHtml).toBe(buildFooterHtml(opts));
  });

  it('façade renderChromeHead matches sub-module renderChromeHead', () => {
    const opts = minimalOpts('sv');
    expect(facadeRenderChromeHead(opts)).toBe(renderChromeHead(opts));
  });
});

// ---------------------------------------------------------------------------
// 13. hreflang — all 14 languages
// ---------------------------------------------------------------------------

describe('chrome/head — hreflang for all 14 languages', () => {
  it('emits hreflang link for each provided alternate', () => {
    const alternates: Partial<Record<Language, string>> = {};
    for (const lang of LANGUAGES) {
      alternates[lang] = `news/test-${lang}.html`;
    }
    const opts: ChromeOptions = {
      ...minimalOpts(),
      hreflangAlternates: alternates,
    };
    const head = renderChromeHead(opts);
    for (const lang of LANGUAGES) {
      const hreflang = lang === 'no' ? 'nb' : lang;
      expect(head).toContain(`hreflang="${hreflang}"`);
    }
    expect(head).toContain('hreflang="x-default"');
  });
});

// ---------------------------------------------------------------------------
// 14. Hero banner control
// ---------------------------------------------------------------------------

describe('chrome/header — hero banner', () => {
  it('includes hero banner by default', () => {
    const header = buildHeaderHtml(minimalOpts());
    expect(header).toContain('hero-banner');
    expect(header).toContain('hero-banner-picture');
    expect(header).toContain('riksdagsmonitor-banner-1536w.avif');
    expect(header).toContain('riksdagsmonitor-logo-96w.webp');
    expect(header).toContain('aria-hidden="true"');
  });

  it('excludes hero banner when heroBanner=false', () => {
    const opts = { ...minimalOpts(), heroBanner: false };
    const header = buildHeaderHtml(opts);
    expect(header).not.toContain('hero-banner');
  });

  it('uses custom banner image when provided', () => {
    const opts = { ...minimalOpts(), heroBannerImage: 'images/custom-banner.webp' };
    const header = buildHeaderHtml(opts);
    expect(header).toContain('images/custom-banner.webp');
  });
});

// ---------------------------------------------------------------------------
// 15. Pagination rel links
// ---------------------------------------------------------------------------

describe('chrome/head — rel prev/next', () => {
  it('includes rel=prev when relPrev provided', () => {
    const opts = { ...minimalOpts(), relPrev: 'https://riksdagsmonitor.com/news/?page=1' };
    const head = renderChromeHead(opts);
    expect(head).toContain('rel="prev"');
    expect(head).toContain('https://riksdagsmonitor.com/news/?page=1');
  });

  it('includes rel=next when relNext provided', () => {
    const opts = { ...minimalOpts(), relNext: 'https://riksdagsmonitor.com/news/?page=3' };
    const head = renderChromeHead(opts);
    expect(head).toContain('rel="next"');
  });

  it('omits pagination links when neither relPrev nor relNext provided', () => {
    const head = renderChromeHead(minimalOpts());
    expect(head).not.toContain('rel="prev"');
    expect(head).not.toContain('rel="next"');
  });
});
