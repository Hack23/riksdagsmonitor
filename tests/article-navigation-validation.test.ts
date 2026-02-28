/**
 * Unit Tests for Article Navigation Validation
 *
 * Tests the navigation structure validation functions in article-quality-enhancer.ts:
 * - hasLanguageSwitcher: Detects <nav class="language-switcher"> element
 * - hasArticleTopNav: Detects <div class="article-top-nav"> element
 * - hasBackToNews: Detects class="back-to-news" link
 * - Integration with enhanceArticleQuality: Navigation warnings in quality results
 *
 * These validations ensure the article template generates all required navigation
 * elements. The fix-article-navigation.py script is a fallback only.
 */

import { describe, it, expect } from 'vitest';
import {
  hasLanguageSwitcher,
  hasArticleTopNav,
  hasBackToNews,
} from '../scripts/article-quality-enhancer.js';

// ---------------------------------------------------------------------------
// Test HTML fixtures
// ---------------------------------------------------------------------------

const COMPLETE_ARTICLE = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
  <nav class="language-switcher" role="navigation" aria-label="Language">
    <a href="test-en.html" class="lang-link active" hreflang="en">🇬🇧 English</a>
    <a href="test-sv.html" class="lang-link" hreflang="sv">🇸🇪 Svenska</a>
  </nav>
  <div class="article-top-nav">
    <a href="index.html" class="back-to-news">← Back to News</a>
  </div>
  <article class="news-article">
    <h1>Test Article</h1>
    <p>Content here.</p>
  </article>
  <footer class="article-footer">
    <a href="index.html" class="back-to-news">Back to News</a>
  </footer>
</body>
</html>`;

const MISSING_SWITCHER = `<!DOCTYPE html>
<html lang="en">
<body>
  <div class="article-top-nav">
    <a href="index.html" class="back-to-news">← Back to News</a>
  </div>
  <article class="news-article"><p>Content</p></article>
</body>
</html>`;

const MISSING_TOP_NAV = `<!DOCTYPE html>
<html lang="en">
<body>
  <nav class="language-switcher" role="navigation">
    <a href="test-en.html" class="lang-link active">English</a>
  </nav>
  <article class="news-article"><p>Content</p></article>
  <footer><a href="index.html" class="back-to-news">Back</a></footer>
</body>
</html>`;

const MISSING_BACK_TO_NEWS = `<!DOCTYPE html>
<html lang="en">
<body>
  <nav class="language-switcher" role="navigation">
    <a href="test-en.html" class="lang-link active">English</a>
  </nav>
  <article class="news-article"><p>Content</p></article>
</body>
</html>`;

const EMPTY_HTML = `<!DOCTYPE html><html><body></body></html>`;

// ---------------------------------------------------------------------------
// hasLanguageSwitcher
// ---------------------------------------------------------------------------

describe('hasLanguageSwitcher', () => {
  it('should detect language-switcher nav in complete article', () => {
    expect(hasLanguageSwitcher(COMPLETE_ARTICLE)).toBe(true);
  });

  it('should return false when language-switcher is missing', () => {
    expect(hasLanguageSwitcher(MISSING_SWITCHER)).toBe(false);
  });

  it('should return false for empty HTML', () => {
    expect(hasLanguageSwitcher(EMPTY_HTML)).toBe(false);
  });

  it('should detect switcher regardless of extra attributes', () => {
    const html = '<nav id="lang" class="language-switcher" role="navigation"><a>EN</a></nav>';
    expect(hasLanguageSwitcher(html)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasArticleTopNav
// ---------------------------------------------------------------------------

describe('hasArticleTopNav', () => {
  it('should detect article-top-nav in complete article', () => {
    expect(hasArticleTopNav(COMPLETE_ARTICLE)).toBe(true);
  });

  it('should return false when article-top-nav is missing', () => {
    expect(hasArticleTopNav(MISSING_TOP_NAV)).toBe(false);
  });

  it('should return false for empty HTML', () => {
    expect(hasArticleTopNav(EMPTY_HTML)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasBackToNews
// ---------------------------------------------------------------------------

describe('hasBackToNews', () => {
  it('should detect back-to-news link in complete article', () => {
    expect(hasBackToNews(COMPLETE_ARTICLE)).toBe(true);
  });

  it('should return false when back-to-news is missing', () => {
    expect(hasBackToNews(MISSING_BACK_TO_NEWS)).toBe(false);
  });

  it('should return false for empty HTML', () => {
    expect(hasBackToNews(EMPTY_HTML)).toBe(false);
  });

  it('should detect back-to-news in footer only', () => {
    const html = '<footer><a class="back-to-news" href="index.html">Back</a></footer>';
    expect(hasBackToNews(html)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Template generates all required elements
// ---------------------------------------------------------------------------

describe('Article template integration', () => {
  it('should detect all navigation elements in a well-formed article', () => {
    expect(hasLanguageSwitcher(COMPLETE_ARTICLE)).toBe(true);
    expect(hasArticleTopNav(COMPLETE_ARTICLE)).toBe(true);
    expect(hasBackToNews(COMPLETE_ARTICLE)).toBe(true);
  });

  it('should detect all missing elements in empty HTML', () => {
    expect(hasLanguageSwitcher(EMPTY_HTML)).toBe(false);
    expect(hasArticleTopNav(EMPTY_HTML)).toBe(false);
    expect(hasBackToNews(EMPTY_HTML)).toBe(false);
  });
});
