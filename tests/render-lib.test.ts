/**
 * Unit tests for scripts/render-lib/index.ts — the aggregate-then-render
 * article pipeline introduced in PR #1979.
 *
 * Focus: the boilerplate-stripping and ordering rules that keep published
 * articles free of AI-process metadata (Pass-2 self-audit sections, admin
 * bylines like **Author** / **Run ID** / **Classification** / **Confidence**).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  aggregateAnalysis,
  AGGREGATION_ORDER,
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  LANGUAGES,
  buildGithubBlobUrl,
  buildGithubTreeUrl,
  titleForArtifact,
  renderMarkdownToHtml,
  renderChromeHead,
  buildChrome,
  renderArticleHtml,
  __test__,
} from '../scripts/render-lib/index.js';

const {
  stripPassTwoSection,
  stripLeadingAdminBylines,
  cleanArtifactBody,
  rewriteRelativeLinks,
  prettifyFallbackTitle,
  readFirstHeading,
  readFirstParagraph,
  escapeYaml,
  escapeInlineMd,
} = __test__;

describe('render-lib — cleanArtifactBody', () => {
  it('strips a trailing "## Pass 2 refinements" section', () => {
    const raw = [
      '# Executive Brief',
      '',
      'Real BLUF prose.',
      '',
      '## Real section',
      '',
      'More real content.',
      '',
      '## Pass 2 refinements',
      '',
      'Re-read this artifact; no judgments were reversed.',
      'Pass-2 change log that must never reach readers.',
      '',
    ].join('\n');
    const out = cleanArtifactBody(raw);
    expect(out).toContain('Real BLUF prose.');
    expect(out).toContain('More real content.');
    expect(out).not.toMatch(/Pass 2 refinements/i);
    expect(out).not.toMatch(/must never reach readers/i);
  });

  it('strips variants: "Pass 2 addendum", "🔁 Pass 2", "### Pass 2 review note"', () => {
    const variants = [
      '## Pass 2 addendum — cross-references & tightening',
      '## 🔁 Pass 2 addendum',
      '### Pass 2 review note',
      '## Pass 2 Update (2026-04-24)',
      '#### Pass 2 improvements',
    ];
    for (const heading of variants) {
      const raw = `# Title\n\nReal prose here.\n\n${heading}\n\nself-audit note\n`;
      const out = cleanArtifactBody(raw);
      expect(out, `variant: ${heading}`).toContain('Real prose here.');
      expect(out, `variant: ${heading}`).not.toMatch(/self-audit note/);
    }
  });

  it('strips leading admin-byline paragraph (Author / Run ID / Classification / Confidence)', () => {
    const raw = [
      '# Executive Brief',
      '',
      '**Author**: James Pether Sörling   **Run ID**: 24866836753   **Classification**: PUBLIC   **Confidence**: HIGH (B2)',
      '',
      'Five committee reports tabled 2026-04-23 cluster along the coalition pillars.',
      '',
    ].join('\n');
    const out = cleanArtifactBody(raw);
    expect(out).not.toMatch(/Run ID/i);
    expect(out).not.toMatch(/James Pether Sörling/);
    expect(out).toContain('Five committee reports tabled');
  });

  it('strips admin byline with · separators', () => {
    const raw =
      '# X\n\n**Author**: J · **Date**: 2026-04-24 · **Classification**: Public · **Confidence**: MEDIUM\n\nThe actual lede.\n';
    const out = cleanArtifactBody(raw);
    expect(out).not.toContain('Classification');
    expect(out).toContain('The actual lede.');
  });

  it('keeps a paragraph that starts with a bold label but contains real prose', () => {
    // This guards against over-aggressive stripping of legitimate bold leads.
    const raw =
      '# X\n\n**Lead story**: The Kristersson government tabled four bills on 23 April 2026.\n';
    const out = cleanArtifactBody(raw);
    expect(out).toContain('Kristersson government tabled four bills');
  });

  it('still strips the first H1, YAML front-matter, Document control, and Run ID: single-line', () => {
    const raw = [
      '---',
      'title: foo',
      '---',
      '# Old H1',
      '',
      'Body para.',
      '',
      'Run ID: 12345',
      '',
      '## Document control',
      '',
      'change-log only',
      '',
    ].join('\n');
    const out = cleanArtifactBody(raw);
    expect(out).toContain('Body para.');
    expect(out).not.toContain('Old H1');
    expect(out).not.toContain('12345');
    expect(out).not.toContain('change-log only');
  });
});

describe('render-lib — helpers', () => {
  it('stripPassTwoSection preserves content before and removes content after', () => {
    const raw = 'Before.\n\n## Pass 2 refinements\n\nAfter.\n';
    expect(stripPassTwoSection(raw).trim()).toBe('Before.');
  });

  it('stripLeadingAdminBylines walks multiple admin paragraphs', () => {
    const body = [
      '**Author**: J',
      '',
      '**Classification**: Public',
      '',
      'Real prose begins here.',
    ].join('\n');
    expect(stripLeadingAdminBylines(body)).toContain('Real prose begins here.');
    expect(stripLeadingAdminBylines(body)).not.toContain('Classification');
  });
});

describe('render-lib — AGGREGATION_ORDER', () => {
  it('puts intelligence-assessment.md immediately after synthesis-summary.md (ICD-203 flow)', () => {
    const idxSynth = AGGREGATION_ORDER.indexOf('synthesis-summary.md');
    const idxKJ = AGGREGATION_ORDER.indexOf('intelligence-assessment.md');
    const idxDevils = AGGREGATION_ORDER.indexOf('devils-advocate.md');
    const idxScoring = AGGREGATION_ORDER.indexOf('significance-scoring.md');
    expect(idxSynth).toBeGreaterThanOrEqual(0);
    expect(idxKJ).toBe(idxSynth + 1);
    // And intelligence-assessment must come well before devils-advocate and
    // significance-scoring (the old order buried it at position 19).
    expect(idxKJ).toBeLessThan(idxScoring);
    expect(idxKJ).toBeLessThan(idxDevils);
  });

  it('still keeps the appendix group at the very end', () => {
    const tail = AGGREGATION_ORDER.slice(-4);
    expect(tail).toEqual([
      'classification-results.md',
      'cross-reference-map.md',
      'methodology-reflection.md',
      'data-download-manifest.md',
    ]);
  });
});

describe('render-lib — aggregateAnalysis (integration)', () => {
  it('aggregates a minimal subfolder, strips Pass-2 and admin bylines, and picks a real description', () => {
    // Build a temp subfolder that mimics analysis/daily/$DATE/$SUB/.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-test-'));
    const sub = path.join(tmp, '2099-01-01', 'widgets');
    fs.mkdirSync(sub, { recursive: true });

    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Executive Brief — Widgets 2099-01-01',
        '',
        '**Author**: Test Runner   **Run ID**: 42   **Classification**: PUBLIC   **Confidence**: HIGH',
        '',
        'Today the widget committee reported five actionable findings with direct implications for Q2.',
        '',
        '## Pass 2 refinements',
        '',
        'self-audit text that must not publish',
        '',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(sub, 'synthesis-summary.md'),
      '# Synthesis\n\nReal synthesis.\n\n## Pass 2 addendum\n\nhidden\n',
    );
    fs.writeFileSync(
      path.join(sub, 'intelligence-assessment.md'),
      '# KJ\n\nKJ-1 confidence HIGH.\n',
    );
    fs.writeFileSync(
      path.join(sub, 'data-download-manifest.md'),
      '# Manifest\n\nsources table\n',
    );

    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/widgets',
      date: '2099-01-01',
      subfolder: 'widgets',
    });

    // Title: the H1 `# Executive Brief — Widgets 2099-01-01` is scrubbed by
    // `cleanArticleTitle()` (strips `Executive Brief — ` prefix and the
    // trailing ISO date). The remainder `Widgets` is < 20 chars, so the
    // aggregator falls back to `titleFromBluf()` which synthesises a
    // headline from the first BLUF sentence — see
    // `.github/prompts/seo-metadata-contract.md` §2.
    expect(result.title).toContain('widget committee reported five');

    // Description must be the real BLUF, NOT the admin byline.
    expect(result.description).toContain('widget committee reported five actionable findings');
    expect(result.description).not.toMatch(/Classification|Run ID|Author/i);

    // Aggregated markdown must carry real content but no Pass-2 / no admin byline.
    expect(result.markdown).toContain('widget committee reported five actionable findings');
    expect(result.markdown).toContain('Real synthesis.');
    expect(result.markdown).toContain('KJ-1 confidence HIGH.');
    expect(result.markdown).not.toMatch(/Pass 2/i);
    expect(result.markdown).not.toMatch(/self-audit text/);
    expect(result.markdown).not.toMatch(/\*\*Run ID\*\*/);

    // Section order: synthesis → intelligence-assessment must appear in that order.
    const synthPos = result.markdown.indexOf('## Synthesis Summary');
    const kjPos = result.markdown.indexOf('## Intelligence Assessment');
    expect(synthPos).toBeGreaterThan(-1);
    expect(kjPos).toBeGreaterThan(synthPos);
  });

  it('does NOT re-embed article.md or article.<lang>.md when re-running aggregation', () => {
    // Reproduces a bug where running the aggregator a second time caused
    // the previously-written article.md to be picked up as a supplementary
    // *.md and embedded inside itself.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-test-'));
    const sub = path.join(tmp, '2099-01-01', 'widgets');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'executive-brief.md'), '# EB\n\nReal lede.\n');
    fs.writeFileSync(path.join(sub, 'article.md'), '# Leftover\n\nold content\n');
    fs.writeFileSync(path.join(sub, 'article.sv.md'), '# Gammal\n\nold swedish\n');

    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/widgets',
      date: '2099-01-01',
      subfolder: 'widgets',
    });
    expect(result.markdown).toContain('Real lede.');
    expect(result.markdown).not.toContain('old content');
    expect(result.markdown).not.toContain('old swedish');
    expect(result.artifactsUsed).not.toContain('article.md');
    expect(result.artifactsUsed).not.toContain('article.sv.md');
  });
});

// ---------------------------------------------------------------------------
// URL helpers + constants
// ---------------------------------------------------------------------------

describe('render-lib — constants + URL helpers', () => {
  it('exports stable BASE_URL / GITHUB_BLOB / GITHUB_TREE', () => {
    expect(BASE_URL).toBe('https://riksdagsmonitor.com');
    expect(GITHUB_BLOB).toBe('https://github.com/Hack23/riksdagsmonitor/blob/main');
    expect(GITHUB_TREE).toBe('https://github.com/Hack23/riksdagsmonitor/tree/main');
  });

  it('LANGUAGES contains all 14 supported languages with en as x-default first', () => {
    expect(LANGUAGES).toHaveLength(14);
    expect(LANGUAGES[0]).toBe('en');
    expect(LANGUAGES).toContain('sv');
    expect(LANGUAGES).toContain('ar');
    expect(LANGUAGES).toContain('he');
    expect(LANGUAGES).toContain('zh');
  });

  it('buildGithubBlobUrl strips leading slashes and joins to GITHUB_BLOB', () => {
    expect(buildGithubBlobUrl('analysis/daily/x/y.md')).toBe(
      `${GITHUB_BLOB}/analysis/daily/x/y.md`,
    );
    expect(buildGithubBlobUrl('/leading/slash.md')).toBe(
      `${GITHUB_BLOB}/leading/slash.md`,
    );
    expect(buildGithubBlobUrl('///triple/slash.md')).toBe(
      `${GITHUB_BLOB}/triple/slash.md`,
    );
  });

  it('buildGithubTreeUrl strips leading slashes and joins to GITHUB_TREE', () => {
    expect(buildGithubTreeUrl('analysis/daily/2099-01-01/widgets')).toBe(
      `${GITHUB_TREE}/analysis/daily/2099-01-01/widgets`,
    );
    expect(buildGithubTreeUrl('/leading')).toBe(`${GITHUB_TREE}/leading`);
  });
});

// ---------------------------------------------------------------------------
// titleForArtifact + prettifyFallbackTitle
// ---------------------------------------------------------------------------

describe('render-lib — titleForArtifact', () => {
  it('returns the curated title for every known canonical artifact', () => {
    const known = [
      ['executive-brief.md', 'Executive Brief'],
      ['synthesis-summary.md', 'Synthesis Summary'],
      ['intelligence-assessment.md', 'Intelligence Assessment — Key Judgments'],
      ['risk-assessment.md', 'Risk Assessment'],
      ['devils-advocate.md', "Devil's Advocate"],
      ['data-download-manifest.md', 'Data Download Manifest'],
      ['methodology-reflection.md', 'Methodology Reflection & Limitations'],
    ] as const;
    for (const [file, expected] of known) {
      expect(titleForArtifact(file)).toBe(expected);
    }
  });

  it('falls back to prettified title for unknown supplementary artifacts', () => {
    expect(titleForArtifact('pestle-analysis.md')).toBe('Pestle Analysis');
    expect(titleForArtifact('wildcards_blackswans.md')).toBe('Wildcards Blackswans');
    expect(titleForArtifact('ext/foo-bar.md')).toBe('Foo Bar');
    expect(prettifyFallbackTitle('a-b_c.md')).toBe('A B C');
  });

  it('handles a bare filename without path', () => {
    expect(titleForArtifact('scenario-analysis.md')).toBe('Scenario Analysis');
  });
});

// ---------------------------------------------------------------------------
// rewriteRelativeLinks
// ---------------------------------------------------------------------------

describe('render-lib — rewriteRelativeLinks', () => {
  const sub = 'analysis/daily/2099-01-01/widgets';

  it('rewrites `./foo.md` to an absolute GitHub blob URL', () => {
    const out = rewriteRelativeLinks('See [foo](./foo.md).', sub);
    expect(out).toBe(`See [foo](${GITHUB_BLOB}/${sub}/foo.md).`);
  });

  it('preserves anchor on a relative link', () => {
    const out = rewriteRelativeLinks('[x](risk-assessment.md#institutional)', sub);
    expect(out).toBe(`[x](${GITHUB_BLOB}/${sub}/risk-assessment.md#institutional)`);
  });

  it('normalises `../` path traversal', () => {
    const out = rewriteRelativeLinks('[up](../shared/notes.md)', sub);
    expect(out).toBe(
      `[up](${GITHUB_BLOB}/analysis/daily/2099-01-01/shared/notes.md)`,
    );
  });

  it('leaves absolute http/https URLs untouched', () => {
    expect(rewriteRelativeLinks('[x](https://example.com/a)', sub)).toBe(
      '[x](https://example.com/a)',
    );
    expect(rewriteRelativeLinks('[y](http://example.org)', sub)).toBe(
      '[y](http://example.org)',
    );
  });

  it('leaves pure anchor links untouched', () => {
    expect(rewriteRelativeLinks('[top](#heading)', sub)).toBe('[top](#heading)');
  });

  it('leaves mailto: links untouched', () => {
    expect(rewriteRelativeLinks('[c](mailto:x@y.z)', sub)).toBe('[c](mailto:x@y.z)');
  });
});

// ---------------------------------------------------------------------------
// readFirstHeading + readFirstParagraph
// ---------------------------------------------------------------------------

describe('render-lib — readFirstHeading / readFirstParagraph', () => {
  it('reads the first H1 verbatim from markdown', () => {
    expect(readFirstHeading('# Title\n\nbody\n')).toBe('Title');
    expect(readFirstHeading('## Not H1\n\n# Real\n')).toBe('Real');
    expect(readFirstHeading('no heading here')).toBeNull();
  });

  it('readFirstParagraph skips H1, admin bylines, tables, code fences, blockquotes', () => {
    const md = [
      '# Title',
      '',
      '**Author**: J · **Classification**: Public',
      '',
      '> block quote',
      '',
      '| a | b |',
      '| - | - |',
      '',
      '```',
      'code',
      '```',
      '',
      'The real lede paragraph.',
    ].join('\n');
    expect(readFirstParagraph(md)).toContain('real lede paragraph');
  });

  it('readFirstParagraph returns prose without truncation (truncation is delegated to truncateToSentenceBoundary)', () => {
    // Long single-paragraph bodies pass through untouched; the aggregator
    // calls `truncateToSentenceBoundary()` separately per
    // `seo-metadata-contract.md` §3.1.
    const long = '# T\n\n' + 'a'.repeat(500);
    expect(readFirstParagraph(long)!.length).toBe(500);
  });

  it('returns null when markdown has no suitable paragraph', () => {
    expect(readFirstParagraph('# T\n\n## Only headings\n')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// escape helpers
// ---------------------------------------------------------------------------

describe('render-lib — escape helpers', () => {
  it('escapeYaml escapes quotes, backslashes, and newlines', () => {
    expect(escapeYaml('a "quoted" b')).toBe('a \\"quoted\\" b');
    expect(escapeYaml('c\\d')).toBe('c\\\\d');
    expect(escapeYaml('line1\nline2')).toBe('line1 line2');
  });

  it('escapeInlineMd escapes every markdown metachar', () => {
    const out = escapeInlineMd('HD01CU25.ext');
    // Period must be escaped, alphanumerics preserved.
    expect(out).toBe('HD01CU25\\.ext');
    expect(escapeInlineMd('[x](y)')).toBe('\\[x\\]\\(y\\)');
    expect(escapeInlineMd('a*b_c')).toBe('a\\*b\\_c');
  });
});

// ---------------------------------------------------------------------------
// renderMarkdownToHtml
// ---------------------------------------------------------------------------

describe('render-lib — renderMarkdownToHtml', () => {
  it('renders GFM tables to <table>', async () => {
    const html = await renderMarkdownToHtml('| a | b |\n| - | - |\n| 1 | 2 |\n');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('preserves ```mermaid fences as <pre class="mermaid"> blocks verbatim', async () => {
    const md = '```mermaid\nflowchart LR\nA --> B\n```\n';
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('<pre class="mermaid"');
    expect(html).toContain('flowchart LR');
    // Mermaid body must be preserved with an intact arrow so the
    // client-side mermaid loader (`js/lib/mermaid-init.mjs`) can parse
    // it; HTML-escaping would break the diagram.
    expect(html).toMatch(/A --&gt; B|A --&#x3E; B|A --> B/);
  });

  it('adds id + anchor link to every heading (rehype-slug + autolink-headings)', async () => {
    const html = await renderMarkdownToHtml('## Hello World\n');
    // rehype-sanitize prefixes heading ids with `user-content-` to avoid
    // ID collisions across embedded content.
    expect(html).toMatch(/<h2 id="(?:user-content-)?hello-world">/);
    // Autolink-headings appends an <a> pointing at the slugged anchor.
    expect(html).toContain('href="#hello-world"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('sanitises <script> tags out of the rendered HTML', async () => {
    const html = await renderMarkdownToHtml(
      'safe <script>alert(1)</script> end\n',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
    expect(html).toContain('safe');
    expect(html).toContain('end');
  });

  it('sanitises javascript: URLs out of links', async () => {
    const html = await renderMarkdownToHtml('[click](javascript:alert(1))\n');
    expect(html).not.toContain('javascript:');
  });

  it('sanitises <iframe> injections', async () => {
    const html = await renderMarkdownToHtml(
      'before\n\n<iframe src="evil"></iframe>\n\nafter\n',
    );
    expect(html).not.toContain('<iframe');
  });
});

// ---------------------------------------------------------------------------
// renderChromeHead + buildChrome
// ---------------------------------------------------------------------------

describe('render-lib — renderChromeHead', () => {
  it('emits <title>, description, canonical, and hreflang × every supplied locale', () => {
    const alternates: Record<string, string> = {};
    for (const l of LANGUAGES) alternates[l] = `news/x-${l}.html`;
    const head = renderChromeHead({
      lang: 'en',
      title: 'Propositions',
      description: 'Real BLUF.',
      canonicalPath: 'news/x-en.html',
      hreflangAlternates: alternates as unknown as Record<(typeof LANGUAGES)[number], string>,
    });
    expect(head).toContain('<!DOCTYPE html>');
    expect(head).toContain('<title>Propositions — Riksdagsmonitor</title>');
    expect(head).toContain('name="description" content="Real BLUF."');
    expect(head).toContain(`rel="canonical" href="${BASE_URL}/news/x-en.html"`);
    expect(head).toContain('rel="alternate" hreflang="en"');
    expect(head).toContain('rel="alternate" hreflang="sv"');
    expect(head).toContain('rel="alternate" hreflang="x-default"');
  });

  it('sets dir="rtl" for Arabic', () => {
    const head = renderChromeHead({
      lang: 'ar',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-ar.html',
    });
    expect(head).toMatch(/<html lang="ar" dir="rtl">/);
  });

  it('sets dir="ltr" for English', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(head).toMatch(/<html lang="en" dir="ltr">/);
  });

  it('embeds provided JSON-LD blobs into <head>', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x.html',
      jsonLd: [{ '@type': 'NewsArticle', headline: 'Hi' }],
    });
    expect(head).toContain('<script type="application/ld+json">');
    expect(head).toContain('"@type":"NewsArticle"');
    expect(head).toContain('"headline":"Hi"');
  });

  it('HTML-escapes title and description', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'A <bad> "title"',
      description: 'with <evil> &ampersand',
      canonicalPath: 'news/x.html',
    });
    expect(head).not.toContain('<bad>');
    expect(head).toContain('&lt;bad&gt;');
    expect(head).toContain('&quot;title&quot;');
  });
});

describe('render-lib — buildChrome', () => {
  it('emits skip-link, site header, nav, and footer', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x.html',
    });
    expect(chrome.headerHtml).toContain('class="skip-link"');
    expect(chrome.headerHtml).toContain('class="rm-site-header"');
    expect(chrome.headerHtml).toContain('class="rm-site-nav"');
    expect(chrome.headerHtml).toContain('class="rm-lang-switcher"');
    expect(chrome.footerHtml).toContain('class="rm-site-footer"');
    expect(chrome.footerHtml).toContain('Apache-2.0');
    expect(chrome.footerHtml).toContain('GDPR');
  });

  it('language switcher lists every language EXCEPT the current one', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // Should include sv, da, no, …  (13 others)
    expect(chrome.headerHtml).toMatch(/lang="sv"/);
    expect(chrome.headerHtml).toMatch(/lang="ar"/);
    // Current language link should NOT be in the dropdown (it is in the summary)
    const dropdown = chrome.headerHtml.split('rm-lang-switcher-dropdown')[1] ?? '';
    expect(dropdown).not.toMatch(/>\s*English\s*</);
  });

  it('computes the depth-prefix ../ correctly for nested canonical paths', () => {
    const shallow = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'index.html',
    });
    const nested = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'a/b/c/deep.html',
    });
    // Shallow path has no `../` prefix on internal asset references.
    expect(shallow.headerHtml).toContain('href="index.html"');
    // Nested path should prefix its homepage links with `../../../`.
    expect(nested.headerHtml).toMatch(/href="\.\.\/\.\.\/\.\.\/index\.html"/);
  });

  it('renders a tagline under the logo on wider viewports', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(chrome.headerHtml).toContain('class="rm-logo-brand"');
    expect(chrome.headerHtml).toContain('class="rm-logo-tagline"');
    expect(chrome.headerHtml).toMatch(/Swedish parliamentary intelligence/);
  });

  it('renders a breadcrumb row in the sub-navigation and a published-date indicator', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Executive Brief — Propositions 2026-04-24',
      description: 'd',
      canonicalPath: 'news/2026-04-24-propositions-en.html',
      publishedIso: '2026-04-24T00:00:00Z',
    });
    expect(chrome.headerHtml).toContain('class="rm-site-subnav"');
    expect(chrome.headerHtml).toContain('class="rm-breadcrumb"');
    expect(chrome.headerHtml).toMatch(/aria-current="page">Executive Brief — Propositions 2026-04-24</);
    expect(chrome.headerHtml).toContain('class="rm-article-published"');
    expect(chrome.headerHtml).toContain('datetime="2026-04-24T00:00:00Z"');
  });

  it('renders a 3-column footer with brand, navigate and trust sections plus RSS link', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // 3 columns
    expect(chrome.footerHtml).toContain('class="rm-footer-col rm-footer-brand"');
    expect(chrome.footerHtml).toContain('class="rm-footer-col rm-footer-navigate"');
    expect(chrome.footerHtml).toContain('class="rm-footer-col rm-footer-trust"');
    // Trust links
    expect(chrome.footerHtml).toMatch(/SECURITY\.md/);
    expect(chrome.footerHtml).toMatch(/CRA-ASSESSMENT\.md/);
    expect(chrome.footerHtml).toMatch(/THREAT_MODEL\.md/);
    expect(chrome.footerHtml).toMatch(/TRANSLATION_GUIDE\.md/);
    expect(chrome.footerHtml).toMatch(/CONTRIBUTING\.md/);
    expect(chrome.footerHtml).toMatch(/ISMS-PUBLIC/);
    // RSS feed
    expect(chrome.footerHtml).toContain('rss.xml');
    expect(chrome.footerHtml).toContain('type="application/rss+xml"');
    // Last-updated indicator
    expect(chrome.footerHtml).toContain('class="rm-footer-updated"');
    expect(chrome.footerHtml).toMatch(/<time datetime="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
  });

  it('uses a language-specific RSS feed for non-English articles', () => {
    const sv = buildChrome({
      lang: 'sv', title: 'T', description: 'd',
      canonicalPath: 'news/x-sv.html',
    });
    expect(sv.footerHtml).toContain('rss_sv.xml');
  });

  it('renders a secondary always-visible language row in the footer', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(chrome.footerHtml).toContain('class="rm-footer-langs"');
    expect(chrome.footerHtml).toContain('aria-label="Switch language"');
    // 13 other languages in the footer switcher (all except current)
    const langAttrs = (chrome.footerHtml.match(/class="rm-footer-langs"[\s\S]*?<\/nav>/)?.[0] ?? '')
      .match(/lang="[a-zA-Z-]+"/g) ?? [];
    expect(langAttrs).toHaveLength(13);
  });
});

// ---------------------------------------------------------------------------
// renderArticleHtml — end-to-end
// ---------------------------------------------------------------------------

describe('render-lib — renderArticleHtml (end-to-end)', () => {
  const articleMd = [
    '---',
    'title: "Propositions 2099-01-01"',
    'description: "Real BLUF for propositions."',
    'date: 2099-01-01',
    'slug: 2099-01-01-propositions',
    '---',
    '',
    '## Executive Brief',
    '',
    'The lede paragraph with [a link](https://example.com).',
    '',
    '## Risk Assessment',
    '',
    'Risk body.',
    '',
  ].join('\n');

  it('produces a complete chrome-wrapped article with rm-article wrapper + sources block', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
    });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<article class="rm-article"');
    expect(html).toContain('<h1>Propositions 2099-01-01</h1>');
    expect(html).toContain('class="rm-article-sources"');
    expect(html).toContain('executive-brief.md');
    expect(html).toContain('risk-assessment.md');
    // Sources link must resolve to GitHub blob.
    expect(html).toContain(
      `${GITHUB_BLOB}/analysis/daily/2099-01-01/propositions/executive-brief.md`,
    );
    // JSON-LD NewsArticle with isBasedOn entries.
    expect(html).toContain('"@type":"NewsArticle"');
    expect(html).toContain('"isBasedOn"');
    // Body preserves real content.
    expect(html).toContain('The lede paragraph');
  });

  it('strips <script> injected via aggregated markdown source', async () => {
    const evil = [
      '---',
      'title: "Evil"',
      'description: "x"',
      'date: 2099-01-01',
      '---',
      '',
      '## EB',
      '',
      '<script>alert("xss")</script>',
      '',
      'visible text',
    ].join('\n');
    const html = await renderArticleHtml({
      markdown: evil,
      lang: 'en',
      canonicalPath: 'news/x.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/evil',
      artifactsUsed: [],
    });
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain('visible text');
  });

  it('respects hreflang alternates when provided', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      hreflangAlternates: {
        en: 'news/2099-01-01-propositions-en.html',
        sv: 'news/2099-01-01-propositions-sv.html',
      },
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md'],
    });
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="sv"');
    expect(html).toContain('hreflang="x-default"');
  });
});

// ---------------------------------------------------------------------------
// aggregateAnalysis — edge cases
// ---------------------------------------------------------------------------

describe('render-lib — aggregateAnalysis edge cases', () => {
  it('throws a helpful error when executive-brief.md is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-edge-'));
    const sub = path.join(tmp, '2099-01-01', 'empty');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'risk-assessment.md'), '# R\n\nbody\n');
    expect(() =>
      aggregateAnalysis({
        subfolderAbsPath: sub,
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/empty',
        date: '2099-01-01',
        subfolder: 'empty',
      }),
    ).toThrow(/executive-brief\.md/i);
  });

  it('throws when subfolder does not exist at all', () => {
    expect(() =>
      aggregateAnalysis({
        subfolderAbsPath: '/nonexistent/path/xyz-123',
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/ghost',
        date: '2099-01-01',
        subfolder: 'ghost',
      }),
    ).toThrow(/not found/i);
  });

  it('expands documents/*.md inline as "Per-document intelligence" subsections', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-edge-'));
    const sub = path.join(tmp, '2099-01-01', 'with-docs');
    const docs = path.join(sub, 'documents');
    fs.mkdirSync(docs, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      '# EB\n\nLede.\n',
    );
    fs.writeFileSync(path.join(docs, 'HD01FOO-analysis.md'), '# Foo\n\nFoo body.\n');
    fs.writeFileSync(path.join(docs, 'HD01BAR-analysis.md'), '# Bar\n\nBar body.\n');
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/with-docs',
      date: '2099-01-01',
      subfolder: 'with-docs',
    });
    expect(result.markdown).toContain('## Per-document intelligence');
    // dok_id is emitted as an H3 with escaped markdown metacharacters; since
    // HD01FOO has no metachars the heading appears verbatim.
    expect(result.markdown).toContain('### HD01BAR');
    expect(result.markdown).toContain('### HD01FOO');
    expect(result.markdown).toContain('Foo body.');
    expect(result.markdown).toContain('Bar body.');
    expect(result.artifactsUsed).toContain('documents/HD01FOO-analysis.md');
    expect(result.artifactsUsed).toContain('documents/HD01BAR-analysis.md');
  });

  it('appends unknown supplementary *.md after the core order alphabetically', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-edge-'));
    const sub = path.join(tmp, '2099-01-01', 'supp');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'executive-brief.md'), '# EB\n\nLede.\n');
    fs.writeFileSync(path.join(sub, 'zebra-appendix.md'), '# Z\n\nzebra content.\n');
    fs.writeFileSync(path.join(sub, 'pestle-analysis.md'), '# P\n\npestle content.\n');
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/supp',
      date: '2099-01-01',
      subfolder: 'supp',
    });
    // Both unknown artifacts appear.
    expect(result.markdown).toContain('pestle content');
    expect(result.markdown).toContain('zebra content');
    // Pestle before Zebra (alphabetical).
    expect(result.markdown.indexOf('pestle content')).toBeLessThan(
      result.markdown.indexOf('zebra content'),
    );
  });
});

// ---------------------------------------------------------------------------
// SEO metadata contract forward-fix — see
// `.github/prompts/seo-metadata-contract.md` and the plan in PR #1981.
// ---------------------------------------------------------------------------

const {
  readBlufParagraph,
  truncateToSentenceBoundary,
  cleanArticleTitle,
  titleFromBluf,
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
} = __test__;

describe('render-lib — ADMIN_FIELD_RE (SEO contract §3a)', () => {
  it('matches the legacy admin fields', () => {
    for (const f of [
      '**Author**: X',
      '**Run ID**: 42',
      '**Date**: 2026-04-24',
      '**Classification**: PUBLIC',
      '**Confidence**: HIGH',
      '**Scope**: all',
      '**Admiralty range**: A1-F6',
      '**Read time**: 5m',
      '**Version**: 1',
      '**Status**: draft',
      '**Owner**: CEO',
      '**Last Updated**: 2026-04-24',
      '**Generated**: today',
    ]) {
      expect(ADMIN_FIELD_RE.test(f)).toBe(true);
    }
  });

  it('matches the new contract fields that previously leaked into descriptions', () => {
    for (const f of [
      '**Brief ID**: EB-2026-04-22-EVE001',
      '**Prepared by**: James Pether Sörling',
      '**Prepared at**: 2026-04-22 23:50 UTC',
      '**Analyst**: James Pether Sörling',
      '**Distribution**: Open',
      '**Methodology**: ai-driven-analysis-guide.md',
      '**Cycle**: Realtime-2338',
      '**Admiralty baseline**: [A2]',
      '**60-second read**: ✅',
      '**60 second read**: ✅',
      '**Reviewed by**: Editorial',
      '**Reviewer**: Editorial',
      '**Disseminated**: 2026-04-23',
      '**Source**: Riksdagen',
      '**Dissemination**: TLP:WHITE',
    ]) {
      expect(ADMIN_FIELD_RE.test(f)).toBe(true);
    }
  });

  it('matches unbolded admin fields (leak case — description read back from rendered HTML)', () => {
    expect(ADMIN_FIELD_RE.test('Brief ID: EB-2026-04-22-EVE001')).toBe(true);
    expect(ADMIN_FIELD_RE.test('Prepared by: James Pether Sörling')).toBe(true);
    expect(ADMIN_FIELD_RE.test('Classification: Public')).toBe(true);
  });

  it('does not match real prose that happens to start with similar words', () => {
    expect(ADMIN_FIELD_RE.test('Sweden approves SEK 4.1bn emergency budget')).toBe(false);
    expect(ADMIN_FIELD_RE.test('The government presented three propositions')).toBe(false);
  });
});

describe('render-lib — ADMIN_FRAGMENT_SPLITTER (SEO contract §3b)', () => {
  it('splits on structural delimiters (pipe, fullwidth pipe, newline, double-space)', () => {
    const input = '**Classification**: Public | **Analyst**: JPS';
    const parts = input.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    expect(parts).toHaveLength(2);
    expect(parts[0]!.trim()).toMatch(/^\*\*Classification\*\*:/);
    expect(parts[1]!.trim()).toMatch(/^\*\*Analyst\*\*:/);
  });

  it('does NOT split on em-dash / middle-dot (value-internal punctuation)', () => {
    // `**Classification**: Public — GDPR Art. 9(2)(e)` is ONE admin field
    // whose value happens to contain an em-dash — splitting on — would
    // incorrectly yield a non-admin fragment and let the byline escape.
    const input = '**Classification**: Public — GDPR Art. 9(2)(e)';
    const parts = input.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toBe(input);
  });

  it('handles |-separated admin blocks — whole block is admin, every fragment matches', () => {
    const block = '**Classification**: Public | **Analyst**: JPS | **Cycle**: Realtime-2338';
    const parts = block.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    expect(parts.length).toBe(3);
    for (const p of parts) {
      expect(ADMIN_FIELD_RE.test(p.trim())).toBe(true);
    }
  });
});

describe('render-lib — readFirstParagraph skips |-separated admin blocks (SEO contract §3b)', () => {
  it('skips a paragraph whose fragments are all admin fields, even when joined by `|`', () => {
    const md = [
      '# Executive Brief — Realtime 2026-04-22',
      '',
      '**Classification**: Public | **Analyst**: JPS | **Cycle**: Realtime-2338',
      '',
      'The real lede paragraph of the brief.',
    ].join('\n');
    const p = readFirstParagraph(md);
    expect(p).toContain('real lede paragraph');
    expect(p).not.toMatch(/Classification|Analyst|Cycle/);
  });

  it('skips a multi-line admin block led by an unbolded `Brief ID`', () => {
    // Reproduces the 2026-04-22-evening-analysis regression in which the
    // description leaked "Brief ID: EB-… Prepared by: … Prepared at: …
    // Classification: Public — GDPR Art. 9(2)(e) Confidence: HIGH [A1]".
    const md = [
      '# Executive Brief — Evening Analysis',
      '',
      'Brief ID: EB-2026-04-22-EVE001',
      'Prepared by: James Pether Sörling',
      'Prepared at: 2026-04-22 23:50 UTC',
      'Classification: Public — GDPR Art. 9(2)(e)',
      'Confidence: HIGH [A1]',
      '60-second read: ✅',
      '',
      'The real BLUF lead sentence that should become the description.',
    ].join('\n');
    const p = readFirstParagraph(md);
    expect(p).toContain('real BLUF lead sentence');
    expect(p).not.toMatch(/Brief ID|Prepared by|Classification|Confidence|60-second/);
  });
});

describe('render-lib — truncateToSentenceBoundary (SEO contract §3c)', () => {
  it('returns the input unchanged when it is already within the window', () => {
    const s = 'Sweden approves emergency budget five months before the September 2026 general election.';
    expect(truncateToSentenceBoundary(s)).toBe(s);
  });

  it('truncates at the last sentence boundary within hardMax, not mid-word', () => {
    const s =
      'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election. ' +
      'The Social Democrats abandoned their climate counter-motion to avoid blame for high fuel costs. ' +
      'Trailing sentence that will not fit.';
    const out = truncateToSentenceBoundary(s);
    expect(out.length).toBeLessThanOrEqual(200);
    // Should end on a sentence terminator, not mid-word.
    expect(out).toMatch(/[.!?]$/);
    // Should include the first sentence in full.
    expect(out).toContain('Sweden approves SEK 4.1bn emergency budget');
  });

  it('never cuts mid-word when no sentence boundary is reachable', () => {
    // 30 repetitions of "longword " → 270 chars, no sentence end.
    const s = 'longword '.repeat(30).trim();
    const out = truncateToSentenceBoundary(s);
    expect(out.length).toBeLessThanOrEqual(201); // +1 for ellipsis
    // Ends with an intentional ellipsis (no optional match — the ellipsis
    // must actually be present), preceded by a complete `longword` token.
    expect(out).toMatch(/longword…$/);
  });

  it('respects custom windows (e.g. CJK 70-120)', () => {
    const s =
      'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election. Additional context follows here.';
    const out = truncateToSentenceBoundary(s, 70, 120);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out).toMatch(/[.!?]$/);
  });

  it('supports CJK full stop `。` as a sentence terminator', () => {
    const s =
      '瑞典批准紧急预算。这是在九月大选前五个月通过的。更多文本可能会跟随。后续的一些段落继续内容。' +
      '更多内容。更多内容。更多内容。更多内容。更多内容。更多内容。';
    const out = truncateToSentenceBoundary(s, 20, 60);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out).toMatch(/。$/);
  });
});

describe('render-lib — readBlufParagraph (SEO contract §3d)', () => {
  it('returns the first prose paragraph after a `## 🎯 BLUF` heading', () => {
    const md = [
      '# Executive Brief — Something',
      '',
      '**Classification**: Public',
      '',
      '## 🎯 BLUF',
      '',
      'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election.',
      '',
      '## Next section',
      '',
      'body text',
    ].join('\n');
    const bluf = readBlufParagraph(md);
    expect(bluf).toContain('Sweden approves SEK 4.1bn emergency budget');
  });

  it('returns null when the brief has no BLUF heading', () => {
    const md = '# No BLUF\n\nJust a regular paragraph.\n';
    expect(readBlufParagraph(md)).toBeNull();
  });

  it('skips admin paragraphs between the BLUF heading and the first prose', () => {
    const md = [
      '# EB',
      '',
      '## 🎯 BLUF',
      '',
      '**Classification**: Public | **Analyst**: JPS',
      '',
      'Real BLUF sentence.',
    ].join('\n');
    expect(readBlufParagraph(md)).toBe('Real BLUF sentence.');
  });
});

describe('render-lib — cleanArticleTitle (SEO contract §3e)', () => {
  it('strips `Executive Brief — ` prefix and trailing ISO date', () => {
    expect(cleanArticleTitle('Executive Brief — Government Committee Reports 2026-04-23'))
      .toBe('Government Committee Reports');
    expect(cleanArticleTitle('Executive Brief - Opposition Propositions 2026/04/15'))
      .toBe('Opposition Propositions');
  });

  it('returns null when the cleaned title is too short to be a real headline', () => {
    expect(cleanArticleTitle('Executive Brief — EB 2026-04-22')).toBeNull();
    // "Committee Reports" is 17 chars — below the 20-char floor for a real story.
    expect(cleanArticleTitle('Executive Brief — Committee Reports 2026-04-23')).toBeNull();
    expect(cleanArticleTitle('# Hi')).toBeNull();
    expect(cleanArticleTitle('')).toBeNull();
    expect(cleanArticleTitle(null)).toBeNull();
  });

  it('preserves a real editorial headline that already has no boilerplate', () => {
    const t = 'Sweden approves emergency budget five months before the 2026 election';
    expect(cleanArticleTitle(t)).toBe(t);
  });

  it('strips trailing realtime-cycle timestamps like ` 2026-04-22 23:38`', () => {
    expect(cleanArticleTitle('Executive Brief — Riksdag Realtime Monitor 2026-04-22 23:38'))
      .toBe('Riksdag Realtime Monitor');
    // Note: "Riksdag Realtime Monitor" is the subject, `Executive Brief —`
    // prefix is stripped and the trailing timestamp is removed.
  });

  it('handles the `Realtime Monitor — ` boilerplate prefix too', () => {
    expect(cleanArticleTitle('Realtime Monitor — Swedish defense spending debate 2026-04-22'))
      .toBe('Swedish defense spending debate');
  });

  it('strips leading pictographs / emoji prefixes like `📋 Executive Brief — …`', () => {
    // Regression: translated Tier-A articles sometimes render the H1
    // with a `📋` emoji prefix — the old regex anchored strictly on
    // `^Executive Brief` and failed to fire.
    expect(cleanArticleTitle('📋 Executive Brief — Riksdag Realtime Monitor 2026-04-17 14:34'))
      .toBe('Riksdag Realtime Monitor');
    expect(cleanArticleTitle('🚨 Intelligence Brief — Coalition Mathematics 2026-04-20'))
      .toBe('Coalition Mathematics');
  });

  it('strips mid-title ISO date ranges and dangling connectors', () => {
    // Regression: week-ahead articles emit titles like `Week Ahead: 2026-02-23 to`
    // in every language variant — the old regex only stripped trailing
    // dates so the mid-title date + dangling connector survived in
    // Arabic / German / Japanese etc. Real bad titles end with the
    // connector word after the date (no trailing prose), which
    // collapses to under the 20-char floor → `null`, so the rewriter
    // falls back to `titleFromBluf`.
    expect(cleanArticleTitle('Week Ahead: 2026-02-23 to')).toBeNull();
    expect(cleanArticleTitle('Woche Voraus: 2026-02-23 bis')).toBeNull();
    expect(cleanArticleTitle('الأسبوع القادم: 2026-02-23 إلى')).toBeNull();
    // But a real follow-on phrase survives with the embedded date gone:
    expect(cleanArticleTitle('Budget outlook 2026-02-23 through 2026-03-02 in Riksdagen'))
      .toBe('Budget outlook through in Riksdagen');
  });
});

describe('render-lib — titleFromBluf (SEO contract §3e fallback)', () => {
  it('synthesises a title from the first BLUF sentence', () => {
    const bluf = 'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election. More context follows.';
    const title = titleFromBluf(bluf);
    expect(title).not.toBeNull();
    expect(title!.length).toBeLessThanOrEqual(70);
    expect(title).toContain('Sweden approves');
  });

  it('returns null when there is no usable BLUF', () => {
    expect(titleFromBluf(null)).toBeNull();
    expect(titleFromBluf('')).toBeNull();
    expect(titleFromBluf('   ')).toBeNull();
  });

  it('truncates at word boundary when the first sentence exceeds maxLen', () => {
    const bluf = 'The Swedish Riksdag approved a comprehensive emergency energy relief package worth SEK four point one billion with a cross-bloc majority including unexpected Social Democratic support despite their counter-motion filed the same week.';
    const title = titleFromBluf(bluf, 70);
    expect(title).not.toBeNull();
    expect(title!.length).toBeLessThanOrEqual(70);
    // Must end on a complete word — i.e. the char immediately after the
    // title in the source BLUF is a whitespace (word boundary) or EOL.
    const nextCharIdx = bluf.indexOf(title!) + title!.length;
    const nextChar = bluf[nextCharIdx];
    expect(nextChar === undefined || /\s/.test(nextChar)).toBe(true);
  });
});

describe('render-lib — aggregateAnalysis end-to-end contract', () => {
  it('produces a clean title + description for a realistic executive-brief with boilerplate H1', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-seo-e2e-'));
    const sub = path.join(tmp, '2026-04-23', 'committeeReports');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Executive Brief — Committee Reports 2026-04-23',
        '',
        '**Classification**: Public | **Distribution**: Open',
        '**Analyst**: James Pether Sörling | **Date**: 2026-04-23',
        '',
        '## 🎯 BLUF',
        '',
        "Sweden's Riksdag approved an emergency SEK 4.1 billion fiscal package on 23 April 2026, cutting fuel taxes five months before the September general election while simultaneously ratifying two dormant constitutional amendments.",
        '',
        '## More context',
        '',
        'Body.',
      ].join('\n'),
    );
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2026-04-23/committeeReports',
      date: '2026-04-23',
      subfolder: 'committeeReports',
    });

    // Title: `Executive Brief — ` stripped, `2026-04-23` stripped. Since
    // `Committee Reports` (17 chars) is < 20, fall back to BLUF synthesis.
    expect(result.title).not.toMatch(/Executive Brief/);
    expect(result.title).not.toMatch(/2026-04-23/);
    expect(result.title.length).toBeGreaterThan(15);

    // Description: BLUF paragraph, sentence-terminated OR intentionally
    // ellipsis-truncated, ≤ 200 chars, no admin leakage. Per
    // `truncateToSentenceBoundary()`: when no sentence end fits in the
    // window, fall back to a clean word-boundary cut with Unicode `…`.
    expect(result.description.length).toBeLessThanOrEqual(200);
    expect(result.description).toMatch(/[.!?…]$/);
    expect(result.description).not.toMatch(/Classification|Analyst|Distribution/);
    expect(result.description).toContain("Sweden");
  });

  it('synthesises a BLUF-based title when the H1 collapses to nothing useful', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-seo-short-'));
    const sub = path.join(tmp, '2026-04-22', 'evening-analysis');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Executive Brief — Evening 2026-04-22',
        '',
        '## 🎯 BLUF',
        '',
        'Finance Minister Svantesson faces a coordinated three-interpellation accountability offensive from the Social Democrats ahead of the September 2026 election.',
      ].join('\n'),
    );
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2026-04-22/evening-analysis',
      date: '2026-04-22',
      subfolder: 'evening-analysis',
    });

    expect(result.title).toContain('Finance Minister Svantesson');
    expect(result.title.length).toBeLessThanOrEqual(70);
    expect(result.title).not.toMatch(/Executive Brief|2026-04-22/);
  });
});
