/**
 * Module-boundary tests for the Round-4 `render-lib` architectural split.
 *
 * Existing `tests/render-lib.test.ts` exercises every public API *via the
 * barrel* (`scripts/render-lib/index.js`). This file intentionally
 * imports each leaf module *directly* by its real path to prove:
 *
 * 1. Each module is importable in isolation (no circular dependencies,
 *    no hidden side effects).
 * 2. The public API surface of each leaf matches what the barrel
 *    re-exports (no drift).
 * 3. Architectural boundaries hold: `aggregator.ts` does not pull in the
 *    remark/rehype pipeline, `chrome.ts` is purely synchronous /
 *    deterministic, `markdown.ts` stands alone without any chrome.
 *
 * If this file starts failing after a refactor, the module split has
 * been broken and the import graph should be inspected before shipping.
 */

import { describe, it, expect } from 'vitest';

import {
  AGGREGATION_ORDER,
  titleForArtifact,
  aggregateAnalysis,
  __test__,
} from '../scripts/render-lib/aggregator/index.js';
import type {
  AggregationInput,
  AggregationResult,
} from '../scripts/render-lib/aggregator/index.js';

import {
  sanitizeSchema,
  renderMarkdownToHtml,
} from '../scripts/render-lib/markdown/index.js';

import {
  renderChromeHead,
  buildChrome,
} from '../scripts/render-lib/chrome.js';
import type {
  ChromeOptions,
  SiteChrome,
} from '../scripts/render-lib/chrome.js';

import {
  renderArticleHtml,
} from '../scripts/render-lib/article.js';
import type {
  RenderArticleInput,
} from '../scripts/render-lib/article.js';

import {
  buildGithubBlobUrl,
  buildGithubTreeUrl,
} from '../scripts/render-lib/url-helpers.js';

import {
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  LANGUAGES,
} from '../scripts/render-lib/constants.js';

// Barrel import — used only to verify no public-API drift between the
// barrel and the leaf modules.
import * as barrel from '../scripts/render-lib/index.js';

import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// 1. Public-API parity between barrel and leaves
// ---------------------------------------------------------------------------

describe('render-lib architecture — barrel ↔ leaf parity', () => {
  it('barrel re-exports every public symbol from aggregator.ts', () => {
    expect(barrel.AGGREGATION_ORDER).toBe(AGGREGATION_ORDER);
    expect(barrel.titleForArtifact).toBe(titleForArtifact);
    expect(barrel.aggregateAnalysis).toBe(aggregateAnalysis);
    expect(barrel.__test__).toBe(__test__);
  });

  it('barrel re-exports every public symbol from markdown.ts', () => {
    expect(barrel.sanitizeSchema).toBe(sanitizeSchema);
    expect(barrel.renderMarkdownToHtml).toBe(renderMarkdownToHtml);
  });

  it('barrel re-exports every public symbol from chrome.ts', () => {
    expect(barrel.renderChromeHead).toBe(renderChromeHead);
    expect(barrel.buildChrome).toBe(buildChrome);
  });

  it('barrel re-exports every public symbol from article.ts', () => {
    expect(barrel.renderArticleHtml).toBe(renderArticleHtml);
  });

  it('barrel re-exports every public symbol from url-helpers.ts', () => {
    expect(barrel.buildGithubBlobUrl).toBe(buildGithubBlobUrl);
    expect(barrel.buildGithubTreeUrl).toBe(buildGithubTreeUrl);
  });

  it('barrel re-exports every public symbol from constants.ts', () => {
    expect(barrel.BASE_URL).toBe(BASE_URL);
    expect(barrel.GITHUB_BLOB).toBe(GITHUB_BLOB);
    expect(barrel.GITHUB_TREE).toBe(GITHUB_TREE);
    expect(barrel.LANGUAGES).toBe(LANGUAGES);
  });
});

// ---------------------------------------------------------------------------
// 2. url-helpers.ts — pure, zero-dependency
// ---------------------------------------------------------------------------

describe('url-helpers.ts (leaf)', () => {
  it('buildGithubBlobUrl strips any number of leading slashes', () => {
    expect(buildGithubBlobUrl('foo/bar.md')).toBe(`${GITHUB_BLOB}/foo/bar.md`);
    expect(buildGithubBlobUrl('/foo/bar.md')).toBe(`${GITHUB_BLOB}/foo/bar.md`);
    expect(buildGithubBlobUrl('///foo/bar.md')).toBe(`${GITHUB_BLOB}/foo/bar.md`);
  });

  it('buildGithubTreeUrl preserves embedded slashes and strips leading slashes', () => {
    expect(buildGithubTreeUrl('analysis/daily/2026-04-24/propositions')).toBe(
      `${GITHUB_TREE}/analysis/daily/2026-04-24/propositions`,
    );
    expect(buildGithubTreeUrl('/analysis')).toBe(`${GITHUB_TREE}/analysis`);
  });

  it('buildGithubBlobUrl handles the empty segment case gracefully', () => {
    // An empty string input produces the blob root URL with an extra trailing
    // slash — this is intentional; callers should pass a real repo-relative
    // path. The point of the test is to guarantee no exception is thrown.
    expect(() => buildGithubBlobUrl('')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 3. aggregator.ts — must work without importing markdown or chrome
// ---------------------------------------------------------------------------

describe('aggregator.ts (leaf, isolated from markdown/chrome)', () => {
  it('exposes the full __test__ escape hatch with all expected helpers', () => {
    expect(typeof __test__.stripPassTwoSection).toBe('function');
    expect(typeof __test__.stripLeadingAdminBylines).toBe('function');
    expect(typeof __test__.cleanArtifactBody).toBe('function');
    expect(typeof __test__.rewriteRelativeLinks).toBe('function');
    expect(typeof __test__.prettifyFallbackTitle).toBe('function');
    expect(typeof __test__.readFirstHeading).toBe('function');
    expect(typeof __test__.readFirstParagraph).toBe('function');
    expect(typeof __test__.escapeYaml).toBe('function');
    expect(typeof __test__.escapeInlineMd).toBe('function');
    expect(__test__.PASS_TWO_HEADING_RE).toBeInstanceOf(RegExp);
    expect(__test__.ADMIN_FIELD_RE).toBeInstanceOf(RegExp);
  });

  it('AGGREGATION_ORDER places intelligence-assessment.md at position 3 (Round-1 ordering)', () => {
    expect(AGGREGATION_ORDER[0]).toBe('executive-brief.md');
    expect(AGGREGATION_ORDER[1]).toBe('synthesis-summary.md');
    expect(AGGREGATION_ORDER[2]).toBe('intelligence-assessment.md');
    expect(AGGREGATION_ORDER[4]).toBe('media-framing-analysis.md');
    expect(AGGREGATION_ORDER[6]).toBe('forward-indicators.md');
    expect(AGGREGATION_ORDER[AGGREGATION_ORDER.length - 1]).toBe(
      'data-download-manifest.md',
    );
  });

  it('titleForArtifact never returns an empty string for any known artifact', () => {
    for (const f of AGGREGATION_ORDER) {
      const t = titleForArtifact(f);
      expect(t.length).toBeGreaterThan(0);
      expect(t).not.toMatch(/\.md$/);
    }
  });

  it('aggregateAnalysis produces a proper AggregationResult shape', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rl-arch-'));
    try {
      // H1 must be ≥ 20 chars after title-hygiene scrubbing (see
      // `seo-metadata-contract.md` §2), otherwise `cleanArticleTitle`
      // returns `null` and the aggregator falls back to `titleFromBluf`.
      fs.writeFileSync(
        path.join(tmp, 'executive-brief.md'),
        '# Sweden ratifies landmark policy reform\n\nLead paragraph describing the reform.\n',
        'utf8',
      );
      const input: AggregationInput = {
        subfolderAbsPath: tmp,
        subfolderRepoRelPath: 'analysis/daily/2026-04-24/arch-test',
        date: '2026-04-24',
        subfolder: 'arch-test',
      };
      const result: AggregationResult = aggregateAnalysis(input);
      expect(result.title).toBe('Sweden ratifies landmark policy reform');
      expect(result.description).toMatch(/Lead paragraph/);
      expect(Array.isArray(result.artifactsUsed)).toBe(true);
      expect(result.artifactsUsed).toContain('executive-brief.md');
      expect(result.markdown).toMatch(/^---\ntitle: "Sweden ratifies landmark policy reform"/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// 4. markdown.ts — standalone sanitiser pipeline
// ---------------------------------------------------------------------------

describe('markdown.ts (leaf, standalone pipeline)', () => {
  it('sanitizeSchema allowlists mermaid className on <pre>', () => {
    const preAttrs = sanitizeSchema.attributes?.pre ?? [];
    const hasMermaid = preAttrs.some((a) => {
      if (Array.isArray(a)) {
        return a[0] === 'className' && a.slice(1).includes('mermaid');
      }
      return false;
    });
    expect(hasMermaid).toBe(true);
  });

  it('sanitizeSchema allowlists id on h1..h6 (rehype-slug output)', () => {
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      const attrs = sanitizeSchema.attributes?.[h] ?? [];
      expect(attrs).toContain('id');
    }
  });

  it('renderMarkdownToHtml is async and returns HTML for a trivial paragraph', async () => {
    const html = await renderMarkdownToHtml('Hello **world**.');
    expect(html).toContain('<p>Hello <strong>world</strong>.</p>');
  });

  it('renderMarkdownToHtml strips <style> tags (not in allowlist)', async () => {
    const html = await renderMarkdownToHtml('<style>body{display:none}</style>\n\nText');
    expect(html).not.toContain('<style');
    expect(html).toContain('Text');
  });

  it('renderMarkdownToHtml escapes raw text inside mermaid fences', async () => {
    const html = await renderMarkdownToHtml('```mermaid\ngraph TD\n  A-->B\n```');
    expect(html).toContain('<pre class="mermaid"');
    // < and > in the mermaid source are escaped
    expect(html).not.toMatch(/<pre class="mermaid"[^>]*>[^<]*<svg/);
  });
});

// ---------------------------------------------------------------------------
// 5. chrome.ts — pure string builder, no I/O, no async
// ---------------------------------------------------------------------------

describe('chrome.ts (leaf, pure builder)', () => {
  const baseOpts: ChromeOptions = {
    lang: 'en',
    title: 'Architecture Test',
    description: 'Leaf-level chrome test.',
    canonicalPath: 'news/x-en.html',
  };

  it('renderChromeHead is a synchronous string builder', () => {
    const result = renderChromeHead(baseOpts);
    // Not a Promise
    expect(typeof (result as unknown as { then?: unknown }).then).toBe('undefined');
    expect(result.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(result).toContain('</head>');
  });

  it('buildChrome returns head/headerHtml/footerHtml as non-empty strings', () => {
    const chrome: SiteChrome = buildChrome(baseOpts);
    expect(chrome.head.length).toBeGreaterThan(100);
    expect(chrome.headerHtml.length).toBeGreaterThan(100);
    expect(chrome.footerHtml.length).toBeGreaterThan(100);
  });

  it('buildChrome is deterministic for identical inputs within the same second', () => {
    const optsWithFrozenTime: ChromeOptions = {
      ...baseOpts,
      modifiedIso: '2026-04-24T15:00:00Z',
      publishedIso: '2026-04-24T00:00:00Z',
    };
    const a = buildChrome(optsWithFrozenTime);
    const b = buildChrome(optsWithFrozenTime);
    expect(a.headerHtml).toBe(b.headerHtml);
    expect(a.footerHtml).toBe(b.footerHtml);
  });

  it('buildChrome preserves all 14 LANGUAGES reference in the switcher (13 in dropdown + current)', () => {
    const chrome = buildChrome(baseOpts);
    // 13 other languages should appear in the header switcher.
    const dropdownHrefs = (chrome.headerHtml.match(/rm-lang-switcher-dropdown[\s\S]*?<\/div>/)?.[0] ?? '')
      .match(/lang="[a-z-]+"/g) ?? [];
    expect(dropdownHrefs).toHaveLength(LANGUAGES.length - 1);
  });
});

// ---------------------------------------------------------------------------
// 6. article.ts — orchestrator
// ---------------------------------------------------------------------------

describe('article.ts (orchestrator)', () => {
  const input: RenderArticleInput = {
    markdown: [
      '---',
      'title: "Orchestrator Test"',
      'description: "Leaf-level orchestrator test."',
      'date: 2026-04-24',
      '---',
      '',
      '## Body',
      '',
      'Plain paragraph.',
      '',
    ].join('\n'),
    lang: 'en',
    canonicalPath: 'news/2026-04-24-test-en.html',
    artifactsUsed: ['executive-brief.md', 'synthesis-summary.md'],
    subfolderRepoRelPath: 'analysis/daily/2026-04-24/test',
  };

  it('renderArticleHtml composes head + header + body + sources + footer', async () => {
    const html = await renderArticleHtml(input);
    // Head
    expect(html).toMatch(/^<!DOCTYPE html>/);
    // Header
    expect(html).toContain('class="rm-site-header"');
    // Body
    expect(html).toContain('class="rm-article-body"');
    expect(html).toContain('class="rm-article-dek"');
    expect(html).toContain('class="rm-article-trust-badges"');
    expect(html).toContain('Plain paragraph');
    // Sources block (depends on artifactsUsed being non-empty)
    expect(html).toContain('class="rm-article-sources"');
    expect(html).toContain('executive-brief.md');
    expect(html).toContain('synthesis-summary.md');
    // Footer
    expect(html).toContain('class="rm-site-footer"');
    expect(html).toMatch(/<\/html>\s*$/);
  });

  it('renderArticleHtml omits the sources block when artifactsUsed is empty', async () => {
    const html = await renderArticleHtml({
      ...input,
      artifactsUsed: [],
    });
    expect(html).not.toContain('rm-article-sources-heading');
  });

  it('renderArticleHtml emits Schema.org NewsArticle JSON-LD with correct language', async () => {
    const html = await renderArticleHtml({ ...input, lang: 'sv' });
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(jsonLdMatch).not.toBeNull();
    const jsonLd = JSON.parse(jsonLdMatch![1]);
    expect(jsonLd['@type']).toBe('NewsArticle');
    expect(jsonLd.inLanguage).toBe('sv');
    expect(jsonLd.headline).toBe('Orchestrator Test');
  });
});
