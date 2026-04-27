/**
 * @module Infrastructure/RenderLib/Markdown/Pipeline
 * @category Intelligence Operations / Supporting Infrastructure
 * @name unified → remark → rehype article-rendering pipeline
 *
 * @description
 * Top-level orchestrator that wires the four leaf modules
 * ({@link ./mermaid-preprocess.js}, {@link ./rehype-slug-prefixed.js},
 * {@link ./rehype-wrap-tables.js}, {@link ./sanitize-schema.js}) into
 * one `Promise<string>`-returning function: {@link renderMarkdownToHtml}.
 *
 * **This module is the single trust boundary** between AI-generated
 * analysis content and user-facing HTML — every relaxation must be
 * reviewed against `THREAT_MODEL.md`.
 *
 * Round-5 split: extracted from `render-lib/markdown.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { preprocessMermaidFences } from './mermaid-preprocess.js';
import { rehypeSlugWithPrefix } from './rehype-slug-prefixed.js';
import { rehypeWrapTables } from './rehype-wrap-tables.js';
import { sanitizeSchema } from './sanitize-schema.js';

/**
 * Convert the Markdown body to sanitised HTML.
 *
 * ## Pipeline stages
 * 1. {@link preprocessMermaidFences} — `\`\`\`mermaid` → `<pre class="mermaid">`
 * 2. `remark-parse` + `remark-gfm` — parse markdown (incl. GFM tables /
 *    task lists / strikethrough)
 * 3. `remark-rehype` with `allowDangerousHtml: true` — preserve the
 *    `<pre class="mermaid">` wrappers
 * 4. `rehype-raw` — re-parse the preserved raw HTML into the HAST tree
 * 5. {@link rehypeSlugWithPrefix} — inject stable, `rm-`-prefixed `id=`
 *    attributes on every heading
 * 6. `rehype-autolink-headings` — append an anchor `<a>` child to every
 *    heading for deep-linking (`behavior: 'append'`)
 * 7. {@link rehypeWrapTables} — wrap `<table>` in `<div class="rm-table-wrap">`
 * 8. `rehype-sanitize` with {@link sanitizeSchema} — scrub anything not
 *    in the allow-list
 * 9. `rehype-stringify` — serialise HAST → HTML with
 *    `allowDangerousHtml: false`
 *
 * @returns sanitised HTML string
 */
export async function renderMarkdownToHtml(markdownBody: string): Promise<string> {
  const preProcessed = preprocessMermaidFences(markdownBody);

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
