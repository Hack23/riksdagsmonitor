/**
 * Chrome SEO features — FAQPage emission, WebPage speakable merge,
 * rel=prev/next pagination links.
 *
 * Guards the auto-emit logic added in the round-7 SEO uplift:
 *   • FAQPage JSON-LD only emits when ≥2 FAQ items supplied
 *   • WebPage speakable is merged into existing caller node (no mutation)
 *   • rel=prev/next links are HTML-escaped
 */

import { describe, expect, it } from 'vitest';
import { buildChrome } from '../scripts/render-lib/chrome.js';

describe('chrome.ts — FAQPage auto-emission', () => {
  it('emits FAQPage JSON-LD when ≥2 faqItems are supplied', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      faqItems: [
        { question: 'Q1?', answer: 'A1.' },
        { question: 'Q2?', answer: 'A2.' },
      ],
    });
    expect(chrome.head).toContain('"@type":"FAQPage"');
    expect(chrome.head).toContain('"@type":"Question"');
  });

  it('does NOT emit FAQPage JSON-LD when only 1 faqItem is supplied', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      faqItems: [{ question: 'Q1?', answer: 'A1.' }],
    });
    expect(chrome.head).not.toContain('"@type":"FAQPage"');
  });

  it('does NOT emit FAQPage JSON-LD when faqItems is empty', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      faqItems: [],
    });
    expect(chrome.head).not.toContain('"@type":"FAQPage"');
  });
});

describe('chrome.ts — meta description never empty (SEO guard)', () => {
  it('falls back to the page title when description is an empty string', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Riksdag Advances Counter-Drone Defence Package',
      description: '',
      canonicalPath: 'news/breaking.html',
    });
    expect(chrome.head).toContain(
      '<meta name="description" content="Riksdag Advances Counter-Drone Defence Package">',
    );
    expect(chrome.head).not.toContain('<meta name="description" content="">');
  });

  it('falls back to the page title when description is whitespace only', () => {
    const chrome = buildChrome({
      lang: 'sv',
      title: 'Riksdagen samlas',
      description: '   ',
      canonicalPath: 'news/index_sv.html',
      ogType: 'website',
    });
    expect(chrome.head).toContain(
      '<meta name="description" content="Riksdagen samlas">',
    );
    expect(chrome.head).toContain(
      '<meta property="og:description" content="Riksdagen samlas">',
    );
    expect(chrome.head).toContain(
      '<meta name="twitter:description" content="Riksdagen samlas">',
    );
  });

  it('keeps a supplied non-empty description unchanged', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'A real, descriptive SERP summary.',
      canonicalPath: 'test.html',
    });
    expect(chrome.head).toContain(
      '<meta name="description" content="A real, descriptive SERP summary.">',
    );
  });
});

describe('chrome.ts — WebPage speakable merge', () => {
  it('merges speakable into an existing WebPage node without duplication', () => {
    const existingWebPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://riksdagsmonitor.com/test.html#webpage',
      name: 'Test',
    };
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      jsonLd: [existingWebPage],
      speakableSelectors: ['h1', '.subtitle'],
    });
    // Should have exactly one WebPage node (merged)
    const webPageCount = (chrome.head.match(/"@type":"WebPage"/g) || []).length;
    expect(webPageCount).toBe(1);
    // Should contain speakable
    expect(chrome.head).toContain('"@type":"SpeakableSpecification"');
    expect(chrome.head).toContain('"cssSelector"');
  });

  it('does NOT mutate the caller-provided jsonLd objects', () => {
    const existingWebPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://riksdagsmonitor.com/test.html#webpage',
      name: 'Test',
    };
    const jsonLd = [existingWebPage];
    buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      jsonLd,
      speakableSelectors: ['h1'],
    });
    // Original object should NOT have speakable added
    expect(existingWebPage).not.toHaveProperty('speakable');
  });

  it('emits a standalone WebPage node when no existing one is present', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      speakableSelectors: ['h1'],
    });
    expect(chrome.head).toContain('"@type":"WebPage"');
    expect(chrome.head).toContain('"@type":"SpeakableSpecification"');
  });
});

describe('chrome.ts — rel=prev/next pagination links', () => {
  it('emits <link rel="next"> when relNext is provided', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'news/index.html',
      relNext: 'https://riksdagsmonitor.com/news/index.html?page=2',
    });
    expect(chrome.head).toContain('<link rel="next"');
    expect(chrome.head).toContain('href="https://riksdagsmonitor.com/news/index.html?page=2"');
  });

  it('emits <link rel="prev"> when relPrev is provided', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'news/index.html',
      relPrev: 'https://riksdagsmonitor.com/news/index.html?page=1',
    });
    expect(chrome.head).toContain('<link rel="prev"');
  });

  it('HTML-escapes relNext/relPrev hrefs', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
      relNext: 'https://example.com/?a=1&b=2',
    });
    // The & should be escaped to &amp; in HTML attributes
    expect(chrome.head).toContain('&amp;b=2');
    expect(chrome.head).not.toMatch(/href="[^"]*&b=2"/);
  });

  it('does not emit pagination links when neither relPrev nor relNext is provided', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Test',
      description: 'desc',
      canonicalPath: 'test.html',
    });
    expect(chrome.head).not.toContain('<link rel="prev"');
    expect(chrome.head).not.toContain('<link rel="next"');
  });
});
