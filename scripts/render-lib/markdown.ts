/**
 * @module Infrastructure/RenderLib/Markdown
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sanitised Markdown → HTML rendering pipeline
 *
 * @description
 * Thin wrapper around the unified → remark → rehype stack that turns
 * aggregated article markdown into safe HTML. **This module is the
 * single trust boundary** between AI-generated analysis content and
 * user-facing HTML. Nothing outside the allow-listed
 * {@link sanitizeSchema} survives the pipeline.
 *
 * ## Pipeline stages
 * 1. `remark-parse` + `remark-gfm` — parse markdown (incl. GFM tables /
 *    task lists / strikethrough)
 * 2. `remark-rehype` with `allowDangerousHtml: true` — preserve the
 *    `<pre class="mermaid">` wrappers injected before the remark stage
 * 3. `rehype-raw` — re-parse the preserved raw HTML into the HAST tree
 * 4. `rehype-slug` — inject stable `id=` attributes on every heading
 * 5. `rehype-autolink-headings` — append an anchor `<a>` child to every
 *    heading for deep-linking (uses `behavior: 'append'`)
 * 6. `rehype-sanitize` — scrub anything not in {@link sanitizeSchema}
 * 7. `rehype-stringify` — serialise HAST → HTML with
 *    `allowDangerousHtml: false`
 *
 * ## Mermaid handling
 * A naive markdown render would pass ` ```mermaid ` fences through as
 * `<pre><code class="language-mermaid">`; the site's client-side mermaid
 * loader expects `<pre class="mermaid">`. We pre-process the markdown to
 * swap mermaid fences into `<pre class="mermaid">` *before* the remark
 * stage, and the sanitiser schema explicitly allows that class.
 *
 * Round-4 architecture split: extracted from `render-lib/index.ts` so
 * that the aggregator can stay free of the remark/rehype dependency
 * graph (saves ~40 ms import time when tests only need aggregator).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';
import { visit, SKIP } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string';
import GithubSlugger from 'github-slugger';
import type { Element, Root } from 'hast';

import { escapeHtml } from '../generate-sitemap-html.js';

/**
 * Wrap every `<table>` element in a `<div class="rm-table-wrap">` so wide
 * tables can scroll horizontally without forcing `display: block` on the
 * `<table>` itself. Keeping the native `display: table` preserves column
 * sizing and the table semantics that assistive technology relies on.
 */
function rehypeWrapTables() {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || typeof index !== 'number') {
        return;
      }
      // Skip if already wrapped (idempotent). HAST `className` can be either
      // a string or string[] depending on whether the wrapper was emitted by
      // markdown processing (array) or pre-existing raw HTML (string).
      if (
        parent.type === 'element' &&
        (parent as Element).tagName === 'div'
      ) {
        const cls = (parent as Element).properties?.className;
        const hasClass =
          (Array.isArray(cls) && (cls as string[]).includes('rm-table-wrap')) ||
          (typeof cls === 'string' && cls.split(/\s+/).includes('rm-table-wrap'));
        if (hasClass) {
          return;
        }
      }
      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['rm-table-wrap'] },
        children: [node],
      };
      // Replace the table in the parent's children with the wrapper.
      (parent.children as unknown as Element[])[index] = wrapper;
      return [SKIP, index + 1];
    });
  };
}

/**
 * Relax the default rehype-sanitize schema so the Mermaid `<pre class="mermaid">`
 * wrapper and the anchor-link icon injected by rehype-autolink-headings survive
 * sanitisation. Anything else continues to be scrubbed — no inline `<script>`,
 * no `javascript:` URLs, no `<iframe>`, no `<style>` tags.
 */
/**
 * Non-empty `clobberPrefix` for `rehype-sanitize`. We keep DOM-clobbering
 * mitigation enabled for `name` / aria attributes, and use a stable,
 * site-specific prefix (`rm-`) for heading element IDs.
 *
 * The IDs themselves are pre-prefixed by {@link rehypeSlugWithPrefix} so
 * that `rehype-autolink-headings` emits `href="#rm-..."` that matches the
 * final rendered ID. To avoid `rehype-sanitize` double-prefixing those
 * already-prefixed IDs, we drop `id` from the clobber list — the prefix
 * is still applied to all IDs (by us, at slug time), but the
 * mitigation against `name` / aria-attribute clobbering is preserved.
 */
export const HEADING_ID_PREFIX = 'rm-';

/**
 * Custom rehype plugin that mirrors `rehype-slug` but pre-prefixes every
 * generated heading ID with {@link HEADING_ID_PREFIX}. This is what makes
 * `rehype-autolink-headings`' `href="#…"` values come out matching the
 * sanitiser's clobber-prefixed IDs without needing a second post-pass to
 * rewrite hrefs.
 *
 * Uses the same `github-slugger` library that `rehype-slug` uses, so the
 * Reader Intelligence Guide anchors built by `aggregator.ts#anchorForTitle`
 * (also via `github-slugger` + the same prefix) are guaranteed to match
 * across punctuation, Unicode and duplicate-heading suffixes.
 */
function rehypeSlugWithPrefix() {
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

export const sanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  // Drop `id` from the clobber list — heading IDs are already prefixed by
  // {@link rehypeSlugWithPrefix} via {@link HEADING_ID_PREFIX}; allowing
  // sanitize to also prefix would produce `rm-rm-…` and break the
  // autolink-headings hrefs as well as the Reader Intelligence Guide.
  // `name` / aria-attribute clobbering protection is preserved.
  clobber: ['ariaDescribedBy', 'ariaLabelledBy', 'name'],
  clobberPrefix: HEADING_ID_PREFIX,
  attributes: {
    ...defaultSchema.attributes,
    pre: [...(defaultSchema.attributes?.pre ?? []), ['className', 'mermaid']],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-/], ['className', 'mermaid']],
    a: [...(defaultSchema.attributes?.a ?? []), ['className', 'anchor', 'heading-anchor'], 'ariaHidden', 'tabIndex'],
    span: [...(defaultSchema.attributes?.span ?? []), ['className', 'icon', 'icon-link']],
    div: [...(defaultSchema.attributes?.div ?? []), ['className', 'rm-table-wrap']],
    h1: [...(defaultSchema.attributes?.h1 ?? []), 'id'],
    h2: [...(defaultSchema.attributes?.h2 ?? []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 ?? []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 ?? []), 'id'],
    h5: [...(defaultSchema.attributes?.h5 ?? []), 'id'],
    h6: [...(defaultSchema.attributes?.h6 ?? []), 'id'],
  },
};

/**
 * Convert the Markdown body to sanitised HTML. Mermaid code fences are
 * translated to `<pre class="mermaid">` at the remark stage so the
 * site's client-side mermaid loader (in `js/lib/mermaid-init.js`) can
 * render them after page load. This avoids a build-time Puppeteer
 * dependency while still giving readers a rich diagram.
 */
export async function renderMarkdownToHtml(markdownBody: string): Promise<string> {
  // Swap ```mermaid fences for <pre class="mermaid"> blocks before remark
  // parses the content so that rehype-sanitize keeps them intact.
  const preProcessed = markdownBody.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_m, diagram: string) => {
      const escaped = escapeHtml(diagram.trimEnd());
      return `\n<pre class="mermaid" data-mermaid-source="true">${escaped}</pre>\n`;
    },
  );

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlugWithPrefix)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '' },
    })
    .use(rehypeWrapTables)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify, { allowDangerousHtml: false });

  const file = await processor.process(preProcessed);
  return String(file);
}
