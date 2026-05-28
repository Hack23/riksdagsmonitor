import { describe, expect, it } from 'vitest';

import { buildPoliticalContextModel, enrichArticleMarkdownWithPoliticalContext } from '../scripts/render-lib/political-context.js';
import { renderArticleHtml } from '../scripts/render-lib/article.js';

describe('political-context enrichment', () => {
  it('expands first party abbreviation and wraps glossary first occurrence in abbr tooltip', () => {
    const markdown = 'SD supports a proposition in this riksmöte. SD appears again.';
    const out = enrichArticleMarkdownWithPoliticalContext(markdown, 'en');
    expect(out).toContain('SD (Sweden Democrats — Right-wing populist party, government support partner.');
    expect(out).toContain('<abbr class="rm-glossary-term"');
    expect(out).toContain('title="Parliamentary session year in Sweden');
    expect(out).toContain('title="Government bill submitted to the Riksdag');
    expect(out).toContain('SD appears again.');
  });

  it('uses language-aware context depth', () => {
    const sv = buildPoliticalContextModel('M SD KD L', 'sv');
    const ja = buildPoliticalContextModel('M SD KD L', 'ja');
    expect(sv.depth).toBe('minimal');
    expect(ja.depth).toBe('maximum');
    expect(ja.comparativeAnchors.length).toBeGreaterThanOrEqual(3);
    expect(sv.comparativeAnchors.length).toBe(0);
  });
});

describe('renderArticleHtml political context block', () => {
  const md = [
    '---',
    'title: "Propositions"',
    'description: "desc"',
    'date: 2099-01-01',
    '---',
    '',
    '## Executive Brief',
    '',
    'SD supports a proposition in this riksmöte with a betänkande from a utskott.',
    '',
    '## Risk Assessment',
    '',
    'A2 and B3 are also present.',
  ].join('\n');

  it('renders collapsible political context on non-Swedish pages with comparative anchors', async () => {
    const html = await renderArticleHtml({
      markdown: md,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      artifactsUsed: ['executive-brief.md'],
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
    });

    expect(html).toContain('class="rm-political-context"');
    expect(html).toContain('Understanding Swedish Politics');
    expect((html.match(/International comparison anchors/g) ?? []).length).toBe(1);
    expect(html).toContain('similar to Germany');
    expect(html).toContain('class="rm-glossary-term"');
  });

  it('renders political context with reduced depth for Swedish pages', async () => {
    const html = await renderArticleHtml({
      markdown: md,
      lang: 'sv',
      canonicalPath: 'news/2099-01-01-propositions-sv.html',
      artifactsUsed: ['executive-brief.md'],
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
    });

    expect(html).toContain('class="rm-political-context"');
    expect(html).toContain('Så fungerar svensk politik');
    expect(html).not.toContain('Internationella jämförelser');
  });
});
