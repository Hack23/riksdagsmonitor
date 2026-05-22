/**
 * @module Infrastructure/RenderLib/Markdown/SanitizeSchema
 * @category Intelligence Operations / Supporting Infrastructure
 * @name `rehype-sanitize` allow-list schema for the article pipeline
 *
 * @description
 * Single source of truth for which HTML tags / attributes survive the
 * sanitiser. **This is the trust boundary** between AI-generated markdown
 * and rendered HTML — every relaxation must be reviewed against
 * `THREAT_MODEL.md`.
 *
 * Round-5 split: extracted from `render-lib/markdown.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { defaultSchema } from 'rehype-sanitize';

/**
 * Stable, site-specific prefix applied to every emitted heading ID.
 *
 * Heading IDs are pre-prefixed by
 * {@link ./rehype-slug-prefixed.js | rehypeSlugWithPrefix} so that
 * `rehype-autolink-headings` emits `href="#rm-..."` matching the final
 * rendered ID. To avoid `rehype-sanitize` double-prefixing those
 * already-prefixed IDs, `id` is intentionally **not** in the
 * {@link sanitizeSchema} clobber list — `name` / aria-attribute
 * clobbering protection is preserved, but heading IDs flow through
 * un-rewritten.
 */
export const HEADING_ID_PREFIX = 'rm-';

/**
 * Article-pipeline sanitiser schema. Extends `rehype-sanitize`'s default
 * schema with a curated set of allow-listed classNames / IDs:
 *
 * - `<pre class="mermaid">` for client-side Mermaid diagrams.
 * - `<code class="language-…">` and `<code class="mermaid">`.
 * - `<a class="anchor heading-anchor">` for the autolink-heading icons.
 * - `<span class="icon icon-link">` for the autolink visual marker.
 * - `<div class="rm-table-wrap">` for horizontally-scrollable tables.
 * - `id` on `h1`..`h6` for stable deep-linking.
 *
 * Anything else continues to be scrubbed — no inline `<script>`,
 * no `javascript:` URLs, no `<iframe>`, no `<style>` tags. See
 * `THREAT_MODEL.md` §6 for the full XSS-mitigation contract.
 */
export const sanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  // Drop `id` from the clobber list — heading IDs are already prefixed
  // by `rehypeSlugWithPrefix` via `HEADING_ID_PREFIX`; allowing sanitize
  // to also prefix would produce `rm-rm-…` and break autolink-headings
  // hrefs as well as the Reader Intelligence Guide. `name` / aria-
  // attribute clobbering protection is preserved.
  clobber: ['ariaDescribedBy', 'ariaLabelledBy', 'name'],
  clobberPrefix: HEADING_ID_PREFIX,
  attributes: {
    ...defaultSchema.attributes,
    // `data-mermaid-source` is preserved on `<pre class="mermaid">`
    // blocks so the client-side loader (`js/lib/mermaid-init.mjs`) and
    // downstream auditors can distinguish mermaid containers from any
    // other `<pre>` carrying a `mermaid` class. The attribute must be
    // declared with its HAST property name (`dataMermaidSource`,
    // camel-cased) — `hast-util-sanitize` matches the property key, not
    // the serialised attribute name, so the previous kebab-case form
    // `['data-mermaid-source', 'true']` was silently stripping the
    // attribute from every rendered article.
    pre: [...(defaultSchema.attributes?.pre ?? []), ['className', 'mermaid'], 'tabIndex', ['dataMermaidSource', 'true']],
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
