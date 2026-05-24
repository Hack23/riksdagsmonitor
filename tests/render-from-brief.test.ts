/**
 * Unit tests verifying that `renderArticleHtml` derives SEO `<title>` and
 * `<meta description>` directly from `executive-brief.md` markdown,
 * bypassing any `title:` / `description:` lines in the `article.md`
 * frontmatter.
 *
 * Background: as of the SEO-from-brief refactor, `article.md` is a
 * body-only build artifact. The aggregator no longer emits SEO fields
 * to its YAML frontmatter, and the renderer reads the brief directly.
 * For the 278 pre-`2026-03-26` legacy `news/*-en.html` files whose
 * `analysis/daily/<date>/` source has been deleted, the renderer
 * gracefully falls back to whatever `article.md` frontmatter exists
 * (back-compat path).
 *
 * @see scripts/render-lib/article.ts → `deriveBriefSeoOverrides`
 * @see scripts/render-lib/article-head-metadata.ts → `computeArticleHeadMetadata`
 */

import { describe, it, expect } from 'vitest';
import { renderArticleHtml } from '../scripts/render-lib/article.js';

const ARTICLE_BODY = [
  '## Executive Brief',
  '',
  'Stale frontmatter lead — should be overridden by brief BLUF.',
  '',
  '## Detailed analysis',
  '',
  'Body content.',
  '',
].join('\n');

// Article.md with a *stale* frontmatter title/description that must
// be ignored when an executive-brief.md is present.
const ARTICLE_MD_WITH_STALE_FRONTMATTER = [
  '---',
  'title: "Stale article.md frontmatter title that the renderer must ignore"',
  'description: "Stale article.md frontmatter description that the renderer must ignore."',
  'date: 2026-04-23',
  'subfolder: propositions',
  'slug: 2026-04-23-propositions',
  'source_folder: analysis/daily/2026-04-23/propositions',
  'generated_at: 2026-04-23T18:00:00.000Z',
  'language: en',
  'layout: article',
  '---',
  '',
  ARTICLE_BODY,
].join('\n');

// Article.md without any title/description in the frontmatter — the
// post-refactor canonical shape emitted by `buildFrontMatter`.
const ARTICLE_MD_BODY_ONLY = [
  '---',
  'date: 2026-04-23',
  'subfolder: propositions',
  'slug: 2026-04-23-propositions',
  'source_folder: analysis/daily/2026-04-23/propositions',
  'generated_at: 2026-04-23T18:00:00.000Z',
  'language: en',
  'layout: article',
  '---',
  '',
  ARTICLE_BODY,
].join('\n');

const BRIEF_EN = [
  '# Sweden ratifies landmark policy reform in major vote',
  '',
  '**BLUF:** Parliament approved the long-debated reform package by a wide margin on Thursday, ending a two-year legislative deadlock.',
  '',
  'Additional context paragraph.',
  '',
].join('\n');

describe('renderArticleHtml — SEO derived from executive-brief.md', () => {
  it('derives <title> from brief H1 even when article.md frontmatter carries a different title', async () => {
    const html = await renderArticleHtml({
      markdown: ARTICLE_MD_WITH_STALE_FRONTMATTER,
      lang: 'en',
      canonicalPath: 'news/2026-04-23-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2026-04-23/propositions',
      artifactsUsed: ['executive-brief.md'],
      englishBriefMarkdown: BRIEF_EN,
      subfolderSlug: 'propositions',
    });

    // <title> reflects the brief H1, not the stale frontmatter title.
    expect(html).toMatch(
      /<title>[^<]*Sweden ratifies landmark policy reform[^<]*<\/title>/,
    );
    expect(html).not.toMatch(
      /<title>[^<]*Stale article\.md frontmatter title[^<]*<\/title>/,
    );

    // <meta description> reflects the brief BLUF, not the stale
    // frontmatter description.
    expect(html).toMatch(
      /<meta name="description" content="[^"]*Parliament approved the long-debated reform package/,
    );
    expect(html).not.toMatch(
      /<meta name="description" content="[^"]*Stale article\.md frontmatter description/,
    );

    // JSON-LD headline + description also reflect the brief.
    expect(html).toContain('"headline":');
    expect(html).toMatch(/"headline"\s*:\s*"[^"]*Sweden ratifies landmark policy reform/);
  });

  it('works on body-only article.md (post-refactor shape) — no title/description in frontmatter', async () => {
    const html = await renderArticleHtml({
      markdown: ARTICLE_MD_BODY_ONLY,
      lang: 'en',
      canonicalPath: 'news/2026-04-23-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2026-04-23/propositions',
      artifactsUsed: ['executive-brief.md'],
      englishBriefMarkdown: BRIEF_EN,
      subfolderSlug: 'propositions',
    });

    expect(html).toMatch(
      /<title>[^<]*Sweden ratifies landmark policy reform[^<]*<\/title>/,
    );
    expect(html).toMatch(
      /<meta name="description" content="[^"]*Parliament approved the long-debated reform package/,
    );
  });

  it('gracefully falls back to article.md frontmatter when no brief markdown is supplied (legacy regenerator path)', async () => {
    const html = await renderArticleHtml({
      markdown: ARTICLE_MD_WITH_STALE_FRONTMATTER,
      lang: 'en',
      canonicalPath: 'news/2026-04-23-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2026-04-23/propositions',
      artifactsUsed: ['executive-brief.md'],
      // No englishBriefMarkdown — simulates the 278 legacy articles
      // whose `analysis/daily/<date>/` source directories were deleted.
    });

    // Fallback uses the article.md frontmatter title/description.
    expect(html).toMatch(
      /<title>[^<]*Stale article\.md frontmatter title[^<]*<\/title>/,
    );
  });
});
