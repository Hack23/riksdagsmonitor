/**
 * Tests for JSON-LD builders (`scripts/render-lib/jsonld.ts`) and the
 * markdown pipeline's independence from chrome.
 *
 * Validates:
 * 1. Schema.org NewsArticle JSON-LD correctness
 * 2. BreadcrumbList JSON-LD conformance
 * 3. SpeakableSpecification WebPage JSON-LD
 * 4. Markdown → HTML pipeline works without any chrome dependency
 * 5. Markdown pipeline security (sanitization)
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  buildBreadcrumbListLd,
  buildNewsArticleLd,
  buildSpeakableWebPageLd,
  BREADCRUMB_TITLE_MAX_LENGTH,
} from '../scripts/render-lib/jsonld.js';
import type {
  BreadcrumbListLd,
  NewsArticleLd,
  SpeakableWebPageLd,
} from '../scripts/render-lib/jsonld.js';

import { renderMarkdownToHtml } from '../scripts/render-lib/markdown/index.js';
import { sanitizeSchema } from '../scripts/render-lib/markdown/sanitize-schema.js';
import { preprocessMermaidFences } from '../scripts/render-lib/markdown/mermaid-preprocess.js';

// ---------------------------------------------------------------------------
// 1. NewsArticle JSON-LD Schema.org validation
// ---------------------------------------------------------------------------

describe('jsonld.ts — buildNewsArticleLd', () => {
  const input = {
    headline: 'Swedish Budget Proposal 2027',
    description: 'Analysis of the 2027 budget.',
    datePublished: '2026-05-01T10:00:00Z',
    dateModified: '2026-05-01T12:00:00Z',
    inLanguage: 'en',
    url: 'https://riksdagsmonitor.com/news/2026-05-01-budget-en.html',
  };

  it('produces a valid NewsArticle with required Schema.org fields', () => {
    const ld: NewsArticleLd = buildNewsArticleLd(input);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('NewsArticle');
    expect(ld.headline).toBe(input.headline);
    expect(ld.description).toBe(input.description);
    expect(ld.datePublished).toBe(input.datePublished);
    expect(ld.dateModified).toBe(input.dateModified);
    expect(ld.inLanguage).toBe('en');
    expect(ld.url).toBe(input.url);
    expect(ld.mainEntityOfPage).toBe(input.url);
  });

  it('includes author as Organization', () => {
    const ld = buildNewsArticleLd(input);
    expect(ld.author['@type']).toBe('Organization');
    expect(ld.author.name).toContain('Riksdagsmonitor');
    expect(ld.author.url).toBe('https://www.hack23.com');
  });

  it('includes publisher with logo', () => {
    const ld = buildNewsArticleLd(input);
    expect(ld.publisher['@type']).toBe('Organization');
    expect(ld.publisher.name).toBe('Hack23 AB');
    expect(ld.publisher.logo['@type']).toBe('ImageObject');
    expect(ld.publisher.logo.url).toContain('logo.png');
  });

  it('marks content as isAccessibleForFree', () => {
    const ld = buildNewsArticleLd(input);
    expect(ld.isAccessibleForFree).toBe(true);
  });

  it('includes isPartOf WebSite reference', () => {
    const ld = buildNewsArticleLd(input);
    expect(ld.isPartOf['@type']).toBe('WebSite');
    expect(ld.isPartOf['@id']).toContain('/#website');
  });

  it('includes isBasedOn when provenance is provided', () => {
    const ld = buildNewsArticleLd({
      ...input,
      isBasedOn: [
        { url: 'https://example.com/source1', name: 'Source One' },
        { url: 'https://example.com/source2', name: 'Source Two' },
      ],
    });
    expect(ld.isBasedOn).toHaveLength(2);
    expect(ld.isBasedOn![0]['@type']).toBe('CreativeWork');
    expect(ld.isBasedOn![0].url).toBe('https://example.com/source1');
  });

  it('omits isBasedOn when provenance is empty', () => {
    const ld = buildNewsArticleLd({ ...input, isBasedOn: [] });
    expect(ld.isBasedOn).toBeUndefined();
  });

  it('produces valid JSON when serialized', () => {
    const ld = buildNewsArticleLd(input);
    const json = JSON.stringify(ld);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed['@type']).toBe('NewsArticle');
  });

  // -------------------------------------------------------------------------
  // W6 polish — keywords[] + articleSection on NewsArticle JSON-LD
  // -------------------------------------------------------------------------

  it('emits NewsArticle.keywords as a deduped array when keywords are supplied', () => {
    const ld = buildNewsArticleLd({
      ...input,
      keywords: 'Riksdag, OSINT, riksdag, parliament, OSINT',
    });
    expect(Array.isArray(ld.keywords)).toBe(true);
    // Case-insensitive dedupe — "Riksdag" / "riksdag" collapse to first wins;
    // "OSINT" appears once. Final order preserves first-seen.
    expect(ld.keywords).toEqual(['Riksdag', 'OSINT', 'parliament']);
  });

  it('drops NewsArticle.keywords entirely when only blanks are supplied', () => {
    const ld = buildNewsArticleLd({ ...input, keywords: ' , , , ' });
    expect(ld.keywords).toBeUndefined();
  });

  it('drops NewsArticle.keywords entirely when no keywords field is supplied', () => {
    const ld = buildNewsArticleLd(input);
    expect(ld.keywords).toBeUndefined();
  });

  it('emits NewsArticle.articleSection when a non-empty value is supplied', () => {
    const ld = buildNewsArticleLd({ ...input, articleSection: 'Propositions' });
    expect(ld.articleSection).toBe('Propositions');
  });

  it('trims NewsArticle.articleSection and drops it when only whitespace', () => {
    const ld = buildNewsArticleLd({ ...input, articleSection: '   ' });
    expect(ld.articleSection).toBeUndefined();
  });

  it('survives JSON.stringify with keywords + articleSection both set', () => {
    const ld = buildNewsArticleLd({
      ...input,
      keywords: 'Riksdag, OSINT, parliament',
      articleSection: 'Committee Reports',
    });
    const json = JSON.stringify(ld);
    const parsed = JSON.parse(json);
    expect(parsed.keywords).toEqual(['Riksdag', 'OSINT', 'parliament']);
    expect(parsed.articleSection).toBe('Committee Reports');
  });
});

// ---------------------------------------------------------------------------
// 2. BreadcrumbList JSON-LD
// ---------------------------------------------------------------------------

describe('jsonld.ts — buildBreadcrumbListLd', () => {
  it('produces a valid BreadcrumbList with positions', () => {
    const ld: BreadcrumbListLd = buildBreadcrumbListLd([
      { name: 'Home', item: 'https://riksdagsmonitor.com/' },
      { name: 'News', item: 'https://riksdagsmonitor.com/news/' },
      { name: 'Current Article' },
    ]);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[2].position).toBe(3);
  });

  it('last entry omits item URL (current page)', () => {
    const ld = buildBreadcrumbListLd([
      { name: 'Home', item: 'https://riksdagsmonitor.com/' },
      { name: 'Current' },
    ]);
    expect(ld.itemListElement[1].item).toBeUndefined();
  });

  it('intermediate entries include item URL', () => {
    const ld = buildBreadcrumbListLd([
      { name: 'Home', item: 'https://riksdagsmonitor.com/' },
      { name: 'Current' },
    ]);
    expect(ld.itemListElement[0].item).toBe('https://riksdagsmonitor.com/');
  });

  it('throws when entries array is empty', () => {
    expect(() => buildBreadcrumbListLd([])).toThrow('at least one entry');
  });

  it('throws when intermediate entry is missing item', () => {
    expect(() => buildBreadcrumbListLd([
      { name: 'Home' }, // missing item!
      { name: 'Current' },
    ])).toThrow('must have an `item` URL');
  });

  it('exports BREADCRUMB_TITLE_MAX_LENGTH constant', () => {
    expect(BREADCRUMB_TITLE_MAX_LENGTH).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 3. SpeakableSpecification WebPage
// ---------------------------------------------------------------------------

describe('jsonld.ts — buildSpeakableWebPageLd', () => {
  it('produces a valid WebPage with speakable', () => {
    const ld: SpeakableWebPageLd = buildSpeakableWebPageLd(
      'https://riksdagsmonitor.com/news/test.html',
      'en',
      ['h1', '.rm-article-dek'],
    );
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('WebPage');
    expect(ld.url).toBe('https://riksdagsmonitor.com/news/test.html');
    expect(ld.inLanguage).toBe('en');
    expect(ld.speakable['@type']).toBe('SpeakableSpecification');
    expect(ld.speakable.cssSelector).toContain('h1');
    expect(ld.speakable.cssSelector).toContain('.rm-article-dek');
  });

  it('includes isPartOf WebSite reference', () => {
    const ld = buildSpeakableWebPageLd(
      'https://riksdagsmonitor.com/news/test.html',
      'en',
      ['.content'],
    );
    expect(ld.isPartOf['@type']).toBe('WebSite');
    expect(ld.isPartOf['@id']).toContain('/#website');
  });

  it('throws when no valid selectors provided', () => {
    expect(() => buildSpeakableWebPageLd('url', 'en', [])).toThrow('at least one');
    expect(() => buildSpeakableWebPageLd('url', 'en', ['  ', ''])).toThrow('at least one');
  });

  it('filters blank selectors', () => {
    const ld = buildSpeakableWebPageLd('url', 'en', ['h1', '', '  ', '.body']);
    expect(ld.speakable.cssSelector).toHaveLength(2);
    expect(ld.speakable.cssSelector).toContain('h1');
    expect(ld.speakable.cssSelector).toContain('.body');
  });
});

// ---------------------------------------------------------------------------
// 4. Markdown pipeline independence from chrome
// ---------------------------------------------------------------------------

describe('markdown pipeline — independent from chrome', () => {
  it('renderMarkdownToHtml works without importing chrome modules', async () => {
    const html = await renderMarkdownToHtml('# Hello World\n\nA paragraph.');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello World');
    expect(html).toContain('<p>A paragraph.</p>');
  });

  it('renders GFM tables', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('<table');
    expect(html).toContain('<td>1</td>');
  });

  it('renders GFM strikethrough', async () => {
    const html = await renderMarkdownToHtml('~~deleted~~');
    expect(html).toContain('<del>deleted</del>');
  });

  it('sanitizes script tags in markdown', async () => {
    const html = await renderMarkdownToHtml('<script>alert("xss")</script>\n\nSafe text.');
    expect(html).not.toContain('<script');
    expect(html).toContain('Safe text.');
  });

  it('sanitizes javascript: URLs', async () => {
    const html = await renderMarkdownToHtml('[click](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('sanitizes iframe tags', async () => {
    const html = await renderMarkdownToHtml('<iframe src="evil.com"></iframe>\n\nContent.');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('Content.');
  });

  it('preserves mermaid code blocks', async () => {
    const md = '```mermaid\ngraph LR\n  A-->B\n```';
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('class="mermaid"');
  });

  it('generates heading IDs (rehype-slug)', async () => {
    const html = await renderMarkdownToHtml('## My Section');
    expect(html).toMatch(/id="[^"]*my-section[^"]*"/i);
  });

  it('wraps tables in responsive container', async () => {
    const md = '| Col |\n|---|\n| Val |';
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('rm-table-wrap');
  });
});

// ---------------------------------------------------------------------------
// 5. Markdown sanitization schema specifics
// ---------------------------------------------------------------------------

describe('markdown sanitize-schema — security boundaries', () => {
  it('allows className on pre (for mermaid)', () => {
    const preAttrs = sanitizeSchema.attributes?.pre ?? [];
    const hasMermaid = preAttrs.some((a) =>
      Array.isArray(a) && a[0] === 'className' && a.includes('mermaid'),
    );
    expect(hasMermaid).toBe(true);
  });

  it('allows id on heading elements (for slug anchors)', () => {
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      const attrs = sanitizeSchema.attributes?.[h] ?? [];
      expect(attrs).toContain('id');
    }
  });

  it('does not allow onclick or event handlers', () => {
    const globalAttrs = sanitizeSchema.attributes?.['*'] ?? [];
    expect(globalAttrs).not.toContain('onclick');
    expect(globalAttrs).not.toContain('onerror');
  });
});

// ---------------------------------------------------------------------------
// 6. Mermaid preprocessor
// ---------------------------------------------------------------------------

describe('markdown — mermaid preprocessor', () => {
  it('converts mermaid code fences to <pre class="mermaid">', () => {
    const md = '```mermaid\ngraph TD\n  A-->B\n```';
    const result = preprocessMermaidFences(md);
    expect(result).toContain('<pre class="mermaid"');
    expect(result).not.toContain('```mermaid');
  });

  it('leaves non-mermaid code fences untouched', () => {
    const md = '```javascript\nconsole.log("hi");\n```';
    const result = preprocessMermaidFences(md);
    expect(result).toContain('```javascript');
  });

  it('handles multiple mermaid blocks', () => {
    const md = '```mermaid\ngraph LR\nA-->B\n```\n\nText\n\n```mermaid\nsequenceDiagram\nA->>B: hi\n```';
    const result = preprocessMermaidFences(md);
    const preCount = (result.match(/<pre class="mermaid"/g) || []).length;
    expect(preCount).toBe(2);
  });

  // ──────────────────────────────────────────────────────────────────
  // Edge-label typo repair — AI agents occasionally emit `-->|label]`
  // (closing `]` instead of `|`) which makes mermaid refuse to render
  // the entire diagram with `Parse error … Expecting 'PIPE'`. The
  // preprocessor rewrites this single typo class to the canonical
  // `-->|label|` form so readers see the diagram while the upstream
  // validator still surfaces the AI-source regression in CI.
  // ──────────────────────────────────────────────────────────────────
  it('auto-repairs `-->|label]` edge-label closing typo', () => {
    const md = '```mermaid\nflowchart LR\n  A -->|votes against] B\n```';
    const result = preprocessMermaidFences(md);
    // Body is HTML-escaped (`>` → `&gt;`) before the <pre> emission.
    expect(result).toContain('A --&gt;|votes against| B');
    expect(result).not.toMatch(/--&gt;\|votes against\]/);
  });

  it('repairs the typo across multiple arrow shapes', () => {
    const md = [
      '```mermaid',
      'flowchart LR',
      '  A -->|first] B',
      '  C ==>|second] D',
      '  E -.->|third] F',
      '```',
    ].join('\n');
    const result = preprocessMermaidFences(md);
    expect(result).toContain('A --&gt;|first| B');
    expect(result).toContain('C ==&gt;|second| D');
    expect(result).toContain('E -.-&gt;|third| F');
  });

  it('leaves correct `-->|label|` syntax untouched', () => {
    const md = '```mermaid\nflowchart LR\n  A -->|valid label| B\n```';
    const result = preprocessMermaidFences(md);
    expect(result).toContain('A --&gt;|valid label| B');
  });

  it('does not rewrite `]` inside flowchart node bodies', () => {
    // `A[node with ] text]` is plain (already-broken) node syntax —
    // the repair regex requires the arrow + `|` opener, so it must
    // not touch this content.
    const md = '```mermaid\nflowchart LR\n  A[harmless ] text]\n```';
    const result = preprocessMermaidFences(md);
    expect(result).toContain('A[harmless ] text]');
  });

  it('preserves `data-mermaid-source="true"` after sanitization', async () => {
    const md = '```mermaid\ngraph LR\n  A-->B\n```';
    const html = await renderMarkdownToHtml(md);
    // The HAST property name is `dataMermaidSource` (camel-cased); the
    // serialised attribute name is the kebab-cased form below. The
    // sanitize-schema entry must use the camel-cased property name or
    // `hast-util-sanitize` silently strips the attribute.
    expect(html).toContain('data-mermaid-source="true"');
  });
});
