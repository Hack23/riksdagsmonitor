/**
 * @module Infrastructure/RenderLib/Markdown/RehypeSlugPrefixed
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Custom `rehype-slug` that pre-prefixes every heading ID
 *
 * @description
 * Mirrors the upstream `rehype-slug` plugin but pre-prefixes every
 * generated heading ID with {@link HEADING_ID_PREFIX}. Keeps the
 * `rehype-autolink-headings` `href="#…"` values matching the sanitiser's
 * clobber-prefixed IDs without a second post-pass.
 *
 * Round-5 split: extracted from `render-lib/markdown.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import GithubSlugger from 'github-slugger';
import type { Element, Root } from 'hast';
import { toString as hastToString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

import { HEADING_ID_PREFIX } from './sanitize-schema.js';

/**
 * Custom rehype plugin that mirrors `rehype-slug` but pre-prefixes every
 * generated heading ID with {@link HEADING_ID_PREFIX}.
 *
 * Uses the same `github-slugger` library that `rehype-slug` uses, so the
 * Reader Intelligence Guide anchors built by
 * `aggregator/reader-guide.ts#anchorForTitle` (also via `github-slugger`
 * + the same prefix) are guaranteed to match across punctuation,
 * Unicode and duplicate-heading suffixes.
 */
export function rehypeSlugWithPrefix() {
  return (tree: Root): void => {
    const slugger = new GithubSlugger();
    visit(tree, 'element', (node: Element) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      node.properties = node.properties ?? {};
      if (typeof node.properties.id === 'string' && node.properties.id.length > 0) {
        return;
      }
      const text = hastToString(node);
      // Pre-strip leading non-letter/non-number characters BEFORE slug
      // generation, so the slugger never sees an `🎯 BLUF` heading and
      // emits a leading-hyphen slug that we'd then trim away (which
      // would silently desynchronise its duplicate-suffix state and
      // produce two `rm-sources` IDs from `### 📜 Sources` and a
      // later `### Sources`). Cleaning before slug-time keeps the
      // slugger's state consistent so duplicates get `-1`, `-2` …
      // suffixes correctly. If cleaning would produce an empty
      // string (heading is pure emoji / punctuation), fall back to
      // the original text so we still emit *some* slug — the
      // article-validator's `empty-heading-slug` rule blocks those
      // upstream.
      const cleanedText = text.replace(/^[^\p{L}\p{N}]+/u, '').trim() || text;
      const slug = slugger.slug(cleanedText);
      node.properties.id = `${HEADING_ID_PREFIX}${slug}`;
    });
  };
}
