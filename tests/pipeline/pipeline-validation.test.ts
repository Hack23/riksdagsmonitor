/**
 * Unit Tests for Pipeline HTML Validation
 *
 * Tests the validateArticleHTML and validateArticleBatch functions.
 */

import { describe, it, expect } from 'vitest';
import {
  validateArticleHTML,
  validateArticleBatch,
} from '../../scripts/pipeline/validation.js';

// ---------------------------------------------------------------------------
// Helper: minimal valid article HTML
// ---------------------------------------------------------------------------

function makeValidHTML(lang = 'en', extraContent = ''): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><title>Test Article</title></head>
<body>
<article>
  <h1>Test Article Title</h1>
  <h2>Section One</h2>
  <p>This is the introduction paragraph of the article providing meaningful content about Swedish parliamentary affairs and important legislative developments that require careful analysis and scrutiny from citizens and journalists alike.</p>
  <p>Additional paragraph to reach word count threshold with enough words here to satisfy the minimum required word count of fifty words for a valid article that provides real journalistic value.</p>
  <div class="article-sources">
    <p>Data Sources: riksdag-regering-mcp</p>
  </div>
${extraContent}
</article>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// validateArticleHTML — passing cases
// ---------------------------------------------------------------------------

describe('validateArticleHTML — valid HTML', () => {
  it('passes for a well-formed article', () => {
    const result = validateArticleHTML(makeValidHTML());
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('records passed checks for each satisfied rule', () => {
    const result = validateArticleHTML(makeValidHTML());
    expect(result.passedChecks.length).toBeGreaterThan(0);
    expect(result.passedChecks.some(c => c.includes('DOCTYPE'))).toBe(true);
    expect(result.passedChecks.some(c => c.includes('H1'))).toBe(true);
    expect(result.passedChecks.some(c => c.includes('h2'))).toBe(true);
  });

  it('passes for a Swedish (sv) article', () => {
    const result = validateArticleHTML(makeValidHTML('sv'));
    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateArticleHTML — failing cases
// ---------------------------------------------------------------------------

describe('validateArticleHTML — missing DOCTYPE', () => {
  it('fails when DOCTYPE is absent', () => {
    const html = makeValidHTML().replace('<!DOCTYPE html>\n', '');
    const result = validateArticleHTML(html);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => /DOCTYPE/i.test(e))).toBe(true);
  });
});

describe('validateArticleHTML — missing lang attribute', () => {
  it('fails when lang attribute is absent', () => {
    const html = makeValidHTML().replace('<html lang="en">', '<html>');
    const result = validateArticleHTML(html);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => /lang/i.test(e))).toBe(true);
  });
});

describe('validateArticleHTML — missing H1', () => {
  it('fails when no <h1> is present', () => {
    const html = makeValidHTML().replace(/<h1>.*?<\/h1>/s, '');
    const result = validateArticleHTML(html);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => /h1/i.test(e))).toBe(true);
  });
});

describe('validateArticleHTML — missing sections', () => {
  it('fails when no <h2> sections are present', () => {
    const html = makeValidHTML().replace(/<h2>.*?<\/h2>/g, '');
    const result = validateArticleHTML(html);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => /h2/i.test(e))).toBe(true);
  });
});

describe('validateArticleHTML — word count', () => {
  it('fails when content word count is below minimum', () => {
    const thinHTML = `<!DOCTYPE html>
<html lang="en">
<head><title>T</title></head>
<body><h1>T</h1><h2>S</h2><p>Short.</p><div class="article-sources">Data Sources: riksdag-regering-mcp</div></body>
</html>`;
    const result = validateArticleHTML(thinHTML, { minWordCount: 50 });
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => /word count/i.test(e))).toBe(true);
  });
});

describe('validateArticleHTML — empty input', () => {
  it('fails gracefully for empty string', () => {
    const result = validateArticleHTML('');
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateArticleHTML — custom options', () => {
  it('skips H1 check when requireH1=false', () => {
    const html = makeValidHTML().replace(/<h1>.*?<\/h1>/s, '');
    const result = validateArticleHTML(html, { requireH1: false });
    expect(result.errors.some(e => /h1/i.test(e))).toBe(false);
  });

  it('allows lower minWordCount threshold', () => {
    const thinHTML = `<!DOCTYPE html>
<html lang="en">
<head><title>T</title></head>
<body><h1>Title here</h1><h2>Section</h2><p>Short but sufficient content for low threshold.</p><div class="article-sources">riksdag-regering-mcp</div></body>
</html>`;
    const result = validateArticleHTML(thinHTML, { minWordCount: 5 });
    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateArticleBatch
// ---------------------------------------------------------------------------

describe('validateArticleBatch', () => {
  it('returns one result per article', () => {
    const articles = [
      { filename: 'article-en.html', html: makeValidHTML('en') },
      { filename: 'article-sv.html', html: makeValidHTML('sv') },
    ];
    const results = validateArticleBatch(articles);
    expect(results).toHaveLength(2);
    expect(results[0]?.filename).toBe('article-en.html');
    expect(results[1]?.filename).toBe('article-sv.html');
  });

  it('reports each article pass/fail independently', () => {
    const badHTML = '<html><body><h1>x</h1></body></html>'; // missing DOCTYPE, lang, h2, word count
    const articles = [
      { filename: 'good.html', html: makeValidHTML('en') },
      { filename: 'bad.html', html: badHTML },
    ];
    const results = validateArticleBatch(articles);
    expect(results[0]?.passed).toBe(true);
    expect(results[1]?.passed).toBe(false);
  });

  it('handles empty batch', () => {
    const results = validateArticleBatch([]);
    expect(results).toHaveLength(0);
  });
});
