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

import { describe, it, expect, vi } from 'vitest';

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
  splitBodyAtSecondH2,
  parseFrontMatterDate,
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

  it('AGGREGATION_ORDER reflects the journalist-optimal narrative arc', () => {
    // Phase A — Lead & headline judgments
    expect(AGGREGATION_ORDER[0]).toBe('executive-brief.md');
    expect(AGGREGATION_ORDER[1]).toBe('synthesis-summary.md');
    expect(AGGREGATION_ORDER[2]).toBe('intelligence-assessment.md');
    expect(AGGREGATION_ORDER[3]).toBe('significance-scoring.md');
    // Phase C — Actors & political arithmetic open with stakeholders
    // (per-document evidence is injected between Phase A and Phase C
    // by aggregate.ts, not via AGGREGATION_ORDER).
    expect(AGGREGATION_ORDER[4]).toBe('stakeholder-perspectives.md');
    // Phase D — Forward trajectory begins with dated watch items. The
    // exact index slides as alias filenames are added/removed within
    // Phase C; assert by filename position relative to its phase
    // anchors instead of pinning a numeric index.
    const idxForward = AGGREGATION_ORDER.indexOf('forward-indicators.md');
    const idxScenario = AGGREGATION_ORDER.indexOf('scenario-analysis.md');
    const idxStakeholders = AGGREGATION_ORDER.indexOf('stakeholder-perspectives.md');
    expect(idxForward).toBeGreaterThan(idxStakeholders);
    expect(idxScenario).toBe(idxForward + 1);
    // Phase F — narrative-environment cluster ends with media framing
    // immediately before the devil's-advocate critique.
    const idxMedia = AGGREGATION_ORDER.indexOf('media-framing-analysis.md');
    const idxDevils = AGGREGATION_ORDER.indexOf('devils-advocate.md');
    expect(idxMedia).toBeGreaterThan(0);
    expect(idxMedia).toBe(idxDevils - 1);
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
      // SEO fields are derived from executive-brief.md at render time, not emitted to article.md frontmatter
      expect(result.markdown).toMatch(/^---\ndate: 2026-04-24\n/);
      expect(result.markdown).not.toMatch(/^---[\s\S]*?\ntitle:/);
      expect(result.markdown).not.toMatch(/^---[\s\S]*?\ndescription:/);
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

  it('renderArticleHtml uses the dedicated News banner image and news-article body class', async () => {
    const html = await renderArticleHtml(input);
    expect(html).toContain('riksdagsmonitornews-banner.webp');
    // body class added by chrome.header
    expect(html).toMatch(/<body class="rm-article-body[^"]*\bnews-article\b/);
    // Default banner image must NOT be referenced for news articles
    expect(html).not.toMatch(/riksdagsmonitor-banner\.webp/);
  });

  it('renderArticleHtml emits reader guide BETWEEN executive brief and the rest of the body', async () => {
    const longInput: RenderArticleInput = {
      ...input,
      markdown: [
        '---',
        'title: "Reading Order Test"',
        'description: "Asserts the executive-brief → reader-guide → rest order."',
        'date: 2026-05-07',
        '---',
        '',
        '## Executive Brief',
        '',
        'Lead paragraph that must come first.',
        '',
        '## Synthesis Summary',
        '',
        'Detail paragraph that must come AFTER the reader guide.',
        '',
      ].join('\n'),
    };
    const html = await renderArticleHtml(longInput);
    const briefIdx = html.indexOf('Lead paragraph that must come first');
    const guideIdx = html.indexOf('rm-reader-guide-heading');
    const restIdx = html.indexOf('Detail paragraph that must come AFTER');
    const sourcesIdx = html.indexOf('rm-article-sources-heading');
    expect(briefIdx).toBeGreaterThan(0);
    expect(guideIdx).toBeGreaterThan(briefIdx);
    expect(restIdx).toBeGreaterThan(guideIdx);
    expect(sourcesIdx).toBeGreaterThan(restIdx);
  });
});

// ---------------------------------------------------------------------------
// 6b. splitBodyAtSecondH2 — pure splitter
// ---------------------------------------------------------------------------

describe('splitBodyAtSecondH2', () => {
  it('splits at the second <h2 boundary', () => {
    const body = '<h2 id="a">A</h2><p>one</p><h2 id="b">B</h2><p>two</p>';
    const { lead, rest } = splitBodyAtSecondH2(body);
    expect(lead).toBe('<h2 id="a">A</h2><p>one</p>');
    expect(rest).toBe('<h2 id="b">B</h2><p>two</p>');
  });

  it('returns the entire body as lead when only one <h2 exists', () => {
    const body = '<h2 id="only">Only</h2><p>just one</p>';
    const { lead, rest } = splitBodyAtSecondH2(body);
    expect(lead).toBe(body);
    expect(rest).toBe('');
  });

  it('returns the entire body as lead when no <h2 exists', () => {
    const body = '<p>plain</p>';
    const { lead, rest } = splitBodyAtSecondH2(body);
    expect(lead).toBe(body);
    expect(rest).toBe('');
  });
});

/**
 * Regression guard: library code under `scripts/render-lib/` must not
 * import from `scripts/generate-sitemap-html.ts`. That file is a CLI
 * entry point with a top-level `console.log('🗺️ Sitemap HTML
 * Generation Script')` banner and a `main()` guard, so importing it
 * from a library module triggers the banner on every consumer (tests,
 * other scripts, the dashboard build, …). The same `escapeHtml` and
 * `LANGUAGE_META` symbols are exported from the side-effect-free
 * `scripts/sitemap-html/index.ts`, which is the canonical import site.
 */
describe('render-lib boundary (no CLI side-effect imports)', () => {
  it('no file under scripts/render-lib/ imports from scripts/generate-sitemap-html', async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const { join, resolve } = await import('node:path');

    const root = resolve(process.cwd(), 'scripts/render-lib');

    async function* walk(dir: string): AsyncGenerator<string> {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else if (entry.isFile() && entry.name.endsWith('.ts')) yield full;
      }
    }

    const offenders: string[] = [];
    for await (const file of walk(root)) {
      const src = await readFile(file, 'utf8');
      if (/from\s+['"][^'"]*generate-sitemap-html(?:\.js)?['"]/.test(src)) {
        offenders.push(file);
      }
    }

    expect(offenders, `library code should import from sitemap-html/index.ts, not generate-sitemap-html.ts:\n  ${offenders.join('\n  ')}`)
      .toEqual([]);
  });
});

describe('parseFrontMatterDate', () => {
  const FROZEN_NOW = new Date('2026-05-07T12:00:00.000Z');

  it('returns YYYY-MM-DD for a Date instance', () => {
    expect(parseFrontMatterDate(new Date('2026-04-23T18:30:00.000Z'), FROZEN_NOW)).toBe('2026-04-23');
  });

  it('returns YYYY-MM-DD for an ISO-8601 string', () => {
    expect(parseFrontMatterDate('2026-04-23T18:30:00.000Z', FROZEN_NOW)).toBe('2026-04-23');
  });

  it('returns YYYY-MM-DD for a bare YYYY-MM-DD string', () => {
    expect(parseFrontMatterDate('2026-04-23', FROZEN_NOW)).toBe('2026-04-23');
  });

  it('falls back to "now" when the value is undefined / null / wrong shape', () => {
    expect(parseFrontMatterDate(undefined, FROZEN_NOW)).toBe('2026-05-07');
    expect(parseFrontMatterDate(null, FROZEN_NOW)).toBe('2026-05-07');
    expect(parseFrontMatterDate(42, FROZEN_NOW)).toBe('2026-05-07');
    expect(parseFrontMatterDate({}, FROZEN_NOW)).toBe('2026-05-07');
  });

  it('falls back to "now" when the string does not start with YYYY-MM-DD', () => {
    expect(parseFrontMatterDate('April 23, 2026', FROZEN_NOW)).toBe('2026-05-07');
    expect(parseFrontMatterDate('', FROZEN_NOW)).toBe('2026-05-07');
  });

  it('falls back to "now" when given an Invalid Date instance', () => {
    expect(parseFrontMatterDate(new Date('not-a-date'), FROZEN_NOW)).toBe('2026-05-07');
  });

  it('uses the live clock when no `now` is supplied', () => {
    // Use fake timers so the call inside parseFrontMatterDate sees the
    // exact same wall-clock instant as the assertion below — otherwise
    // a midnight-UTC tick between the two `new Date()` calls would flake.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-05-07T23:59:59.999Z'));
      const result = parseFrontMatterDate(undefined);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2026-05-07');
    } finally {
      vi.useRealTimers();
    }
  });
});
