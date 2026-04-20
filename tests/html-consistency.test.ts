/**
 * @file tests/html-consistency.test.ts
 * @description Regression tests that scan ALL committed news/*.html files
 * to guard against re-introduction of known HTML consistency issues.
 *
 * These tests are intentionally file-system based (not template-level mocks)
 * so they catch problems with hand-written agent articles as well as
 * template-generated ones.
 *
 * Tests run fast because they only read text — no browser required.
 *
 * Author : Hack23 AB
 * License: Apache-2.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

// ─── helpers ────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(__dirname, '..');
const NEWS_DIR  = join(REPO_ROOT, 'news');

/** Read all committed news article files (exclude generated news/index*.html) */
function getNewsFiles(): string[] {
  return readdirSync(NEWS_DIR)
    .filter(f => f.endsWith('.html') && !f.startsWith('index'))
    .map(f => join(NEWS_DIR, f));
}

let newsFiles: string[] = [];
let articles: Array<{ file: string; html: string }> = [];

beforeAll(() => {
  newsFiles = getNewsFiles();
  articles = newsFiles.map(f => ({ file: f, html: readFileSync(f, 'utf-8') }));
});

// ─── Test suites ─────────────────────────────────────────────────────────────

describe('HTML corpus — no raw TypeScript script references', () => {
  it('no article references ../scripts/back-to-top.ts', () => {
    const bad = articles.filter(a => a.html.includes('scripts/back-to-top.ts'));
    expect(bad.map(a => a.file)).toHaveLength(0);
  });

  it('no article references non-existent ../scripts/back-to-top.js', () => {
    const bad = articles.filter(a => /scripts\/back-to-top\.js/.test(a.html));
    expect(bad.map(a => a.file)).toHaveLength(0);
  });

  it('no article references non-existent news-article.js', () => {
    const bad = articles.filter(a => a.html.includes('news-article.js'));
    expect(bad.map(a => a.file)).toHaveLength(0);
  });

  it('no article uses absolute /js/lib/ path (should be relative ../js/lib/)', () => {
    const bad = articles.filter(a => /src="\/js\/lib\//.test(a.html));
    expect(bad.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — every news article includes back-to-top.js', () => {
  it('all articles include ../js/back-to-top.js', () => {
    const missing = articles.filter(a => !a.html.includes('back-to-top.js'));
    expect(missing.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — every news article has a top language switcher', () => {
  it('all articles contain <nav class="language-switcher">', () => {
    const missing = articles.filter(
      a => !a.html.includes('language-switcher')
    );
    expect(missing.map(a => a.file)).toHaveLength(0);
  });

  it('language switcher appears before the main <article> tag', () => {
    const bad = articles.filter(a => {
      const switcherIdx = a.html.indexOf('language-switcher');
      const articleIdx  = a.html.indexOf('<article');
      return switcherIdx === -1 || articleIdx === -1 || switcherIdx > articleIdx;
    });
    expect(bad.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — every news article has a site header', () => {
  it('all articles contain <header role="banner">', () => {
    const missing = articles.filter(
      a => !a.html.includes('role="banner"')
    );
    expect(missing.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — every news article has a full site footer', () => {
  it('all articles contain <footer role="contentinfo">', () => {
    const missing = articles.filter(
      a => !a.html.includes('role="contentinfo"')
    );
    expect(missing.map(a => a.file)).toHaveLength(0);
  });

  it('site footer appears after </article>', () => {
    const bad = articles.filter(a => {
      const articleClose = a.html.lastIndexOf('</article>');
      const footerIdx    = a.html.indexOf('role="contentinfo"');
      return footerIdx === -1 || footerIdx < articleClose;
    });
    expect(bad.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — no embedded <style> in article body', () => {
  it('no article has a <style> block after </head>', () => {
    const bad = articles.filter(a => {
      const headEnd = a.html.toLowerCase().indexOf('</head>');
      if (headEnd === -1) return false;
      const bodyPart = a.html.slice(headEnd);
      return /<style[\s>]/i.test(bodyPart);
    });
    expect(bad.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — no broken PNG logo references', () => {
  const BROKEN_PNG_PATTERNS = [
    /href=['"](?:\.\.\/)?riksdagsmonitor-logo\.png['"]/i,
    /src=['"](?:\.\.\/)?riksdagsmonitor-logo\.png['"]/i,
    /src=['"](?:\.\.\/)?riksdagsmonitornews-logo\.png['"]/i,
    /riksdagsmonitor\.com\/riksdagsmonitor(?:news)?(?:-logo)?\.png/i,
  ];

  it('no article references removed root-level PNG files', () => {
    const bad = articles.filter(a =>
      BROKEN_PNG_PATTERNS.some(re => re.test(a.html))
    );
    expect(bad.map(a => a.file)).toHaveLength(0);
  });
});

describe('HTML corpus — all articles have normalization marker', () => {
  it('all articles have data-rm-normalized attribute on <body>', () => {
    const missing = articles.filter(
      a => !a.html.includes('data-rm-normalized=')
    );
    expect(missing.map(a => a.file)).toHaveLength(0);
  });
});
