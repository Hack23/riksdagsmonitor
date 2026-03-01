/**
 * Unit Tests for fix-article-navigation.ts transformContent()
 *
 * Tests the idempotency and insertion logic for:
 * - Language switcher insertion when missing
 * - Language switcher update when present
 * - article-top-nav insertion via Pattern A (after </nav>)
 * - article-top-nav insertion via Pattern B (before <article>)
 * - Fixing article-top-nav that lacks a back-to-news link
 * - Dry-run: transformContent is pure (no file I/O)
 */

import { describe, it, expect } from 'vitest';
import { transformContent } from '../scripts/fix-article-navigation.js';

// ---------------------------------------------------------------------------
// Minimal HTML fixtures
// ---------------------------------------------------------------------------

/** Article with no navigation at all */
const BARE_ARTICLE = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
<article class="news-article">
  <h1>Headline</h1>
  <p>Content here.</p>
</article>
</body>
</html>`;

/** Article that already has both language-switcher (with all 14 links for SLUG) and article-top-nav */
function buildCompleteArticle(slug: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
  <nav class="language-switcher" role="navigation" aria-label="Language versions">
    <a href="${slug}-en.html" class="lang-link active" hreflang="en" aria-current="page">🇬🇧 English</a>
    <a href="${slug}-sv.html" class="lang-link" hreflang="sv">🇸🇪 Svenska</a>
    <a href="${slug}-da.html" class="lang-link" hreflang="da">🇩🇰 Dansk</a>
    <a href="${slug}-no.html" class="lang-link" hreflang="no">🇳🇴 Norsk</a>
    <a href="${slug}-fi.html" class="lang-link" hreflang="fi">🇫🇮 Suomi</a>
    <a href="${slug}-de.html" class="lang-link" hreflang="de">🇩🇪 Deutsch</a>
    <a href="${slug}-fr.html" class="lang-link" hreflang="fr">🇫🇷 Français</a>
    <a href="${slug}-es.html" class="lang-link" hreflang="es">🇪🇸 Español</a>
    <a href="${slug}-nl.html" class="lang-link" hreflang="nl">🇳🇱 Nederlands</a>
    <a href="${slug}-ar.html" class="lang-link" hreflang="ar">🇸🇦 العربية</a>
    <a href="${slug}-he.html" class="lang-link" hreflang="he">🇮🇱 עברית</a>
    <a href="${slug}-ja.html" class="lang-link" hreflang="ja">🇯🇵 日本語</a>
    <a href="${slug}-ko.html" class="lang-link" hreflang="ko">🇰🇷 한국어</a>
    <a href="${slug}-zh.html" class="lang-link" hreflang="zh">🇨🇳 中文</a>
  </nav>
<div class="article-top-nav">
  <a href="index.html" class="back-to-news">
    ← Back to News
  </a>
</div>
<article class="news-article">
  <h1>Headline</h1>
  <p>Content here.</p>
</article>
</body>
</html>`;
}

/** Article with language-switcher (single link, slug-agnostic) but no article-top-nav */
const SWITCHER_NO_TOPNAV = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
  <nav class="language-switcher" role="navigation" aria-label="Language versions">
    <a href="2026-01-01-test-en.html" class="lang-link active">🇬🇧 English</a>
  </nav>
<article class="news-article">
  <h1>Headline</h1>
</article>
</body>
</html>`;

/** Article with article-top-nav but missing back-to-news link */
const TOPNAV_NO_BACKLINK = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
  <nav class="language-switcher" role="navigation" aria-label="Language versions">
    <a href="2026-01-01-test-en.html" class="lang-link active">🇬🇧 English</a>
  </nav>
<div class="article-top-nav">
  <!-- placeholder, no back-to-news link -->
</div>
<article class="news-article">
  <h1>Headline</h1>
</article>
</body>
</html>`;

/** Article with no </nav> before the article element (Pattern B path) */
const BARE_ARTICLE_NO_NAV = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
<div class="container">
  <h1>Headline</h1>
</div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const SLUG = '2026-01-01-test';

// ---------------------------------------------------------------------------
// Language switcher insertion
// ---------------------------------------------------------------------------

describe('transformContent — language switcher', () => {
  it('inserts language-switcher immediately after <body>', () => {
    const { content } = transformContent(BARE_ARTICLE, SLUG, 'en');
    // The switcher nav must appear right after <body> (possibly with a newline)
    expect(content).toMatch(/<body>\s*<nav class="language-switcher"/);
  });

  it('adds language-switcher when missing', () => {
    const { content, addedSwitcher } = transformContent(BARE_ARTICLE, SLUG, 'en');
    expect(addedSwitcher).toBe(true);
    expect(content).toContain('language-switcher');
    expect(content).toContain(`href="${SLUG}-en.html"`);
    expect(content).toContain(`href="${SLUG}-sv.html"`);
  });

  it('does not set addedSwitcher when switcher is already present', () => {
    const { addedSwitcher } = transformContent(buildCompleteArticle(SLUG), SLUG, 'en');
    expect(addedSwitcher).toBe(false);
  });

  it('generates all 14 language links', () => {
    const { content } = transformContent(BARE_ARTICLE, SLUG, 'en');
    for (const lang of ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']) {
      expect(content).toContain(`hreflang="${lang}"`);
    }
  });

  it('marks current language as active with aria-current', () => {
    const { content } = transformContent(BARE_ARTICLE, SLUG, 'sv');
    expect(content).toContain('aria-current="page"');
    // sv link must have active class and aria-current (order-independent)
    const svLink = content.match(new RegExp(`<a[^>]*href="${SLUG}-sv\\.html"[^>]*>`))?.[0];
    expect(svLink).toBeDefined();
    expect(svLink).toMatch(/\blang-link\b/);
    expect(svLink).toMatch(/\bactive\b/);
    expect(svLink).toMatch(/aria-current="page"/);
    // en link must not be active
    const enLink = content.match(new RegExp(`<a[^>]*href="${SLUG}-en\\.html"[^>]*>`))?.[0];
    expect(enLink).toBeDefined();
    expect(enLink).not.toMatch(/\bactive\b/);
    expect(enLink).not.toMatch(/aria-current/);
  });
});

// ---------------------------------------------------------------------------
// article-top-nav insertion — Pattern A (after </nav>)
// ---------------------------------------------------------------------------

describe('transformContent — article-top-nav Pattern A (after </nav>)', () => {
  it('inserts article-top-nav after language-switcher nav', () => {
    const { content, addedTopnav } = transformContent(SWITCHER_NO_TOPNAV, SLUG, 'en');
    expect(addedTopnav).toBe(true);
    expect(content).toContain('article-top-nav');
    expect(content).toContain('back-to-news');
    // article-top-nav must come before news-article
    expect(content.indexOf('article-top-nav')).toBeLessThan(content.indexOf('news-article'));
  });

  it('inserts localized back-to-news text for Swedish', () => {
    const { content } = transformContent(SWITCHER_NO_TOPNAV, SLUG, 'sv');
    expect(content).toContain('Tillbaka till nyheter');
    expect(content).toContain('index_sv.html');
  });

  it('uses index.html (not index_en.html) for English back-to-news', () => {
    const { content } = transformContent(SWITCHER_NO_TOPNAV, SLUG, 'en');
    expect(content).toContain('href="index.html"');
    expect(content).not.toContain('href="index_en.html"');
  });
});

// ---------------------------------------------------------------------------
// article-top-nav insertion — Pattern B (no nav element present)
// ---------------------------------------------------------------------------

describe('transformContent — article-top-nav Pattern B (before container div)', () => {
  it('inserts article-top-nav before <div class="container"> when no nav present', () => {
    const { content, addedTopnav } = transformContent(BARE_ARTICLE_NO_NAV, SLUG, 'en');
    expect(addedTopnav).toBe(true);
    expect(content).toContain('article-top-nav');
    expect(content.indexOf('article-top-nav')).toBeLessThan(content.indexOf('class="container"'));
  });
});

// ---------------------------------------------------------------------------
// Fixing article-top-nav that lacks back-to-news
// ---------------------------------------------------------------------------

describe('transformContent — fix article-top-nav missing back-to-news', () => {
  it('replaces top-nav that has no back-to-news link', () => {
    const { content, addedTopnav, fixedTopnav } = transformContent(TOPNAV_NO_BACKLINK, SLUG, 'en');
    expect(fixedTopnav).toBe(true);
    expect(addedTopnav).toBe(false); // fixed, not newly added
    expect(content).toContain('back-to-news');
    expect(content).toContain('Back to News');
  });

  it('does not set fixedTopnav when back-to-news is already present', () => {
    const { fixedTopnav } = transformContent(buildCompleteArticle(SLUG), SLUG, 'en');
    expect(fixedTopnav).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe('transformContent — idempotency', () => {
  it('produces identical output on second call (bare article)', () => {
    const { content: pass1 } = transformContent(BARE_ARTICLE, SLUG, 'en');
    const { content: pass2 } = transformContent(pass1, SLUG, 'en');
    expect(pass2).toBe(pass1);
  });

  it('produces identical output on second call (switcher-only article)', () => {
    const { content: pass1 } = transformContent(SWITCHER_NO_TOPNAV, SLUG, 'en');
    const { content: pass2 } = transformContent(pass1, SLUG, 'en');
    expect(pass2).toBe(pass1);
  });

  it('produces identical output on second call (top-nav with missing back link)', () => {
    const { content: pass1 } = transformContent(TOPNAV_NO_BACKLINK, SLUG, 'en');
    const { content: pass2 } = transformContent(pass1, SLUG, 'en');
    expect(pass2).toBe(pass1);
  });

  it('returns unchanged content for already-complete article', () => {
    const complete = buildCompleteArticle(SLUG);
    const { content, addedSwitcher, addedTopnav, fixedTopnav } = transformContent(complete, SLUG, 'en');
    expect(content).toBe(complete);
    expect(addedSwitcher).toBe(false);
    expect(addedTopnav).toBe(false);
    expect(fixedTopnav).toBe(false);
  });
});
