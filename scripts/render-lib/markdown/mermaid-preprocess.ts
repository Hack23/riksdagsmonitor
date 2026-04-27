/**
 * @module Infrastructure/RenderLib/Markdown/MermaidPreprocess
 * @category Intelligence Operations / Supporting Infrastructure
 * @name `\`\`\`mermaid` fence → `<pre class="mermaid">` swap
 *
 * @description
 * Pre-remark text transform: rewrites mermaid-fenced code blocks into a
 * `<pre class="mermaid">` HTML wrapper so the site's client-side mermaid
 * loader (in `js/lib/mermaid-init.mjs`) renders them after page load.
 *
 * Pure string transform, zero dependencies on the unified pipeline.
 *
 * Round-5 split: extracted from `render-lib/markdown.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { escapeHtml } from '../../generate-sitemap-html.js';

/**
 * Swap ``` ```mermaid ``` fences for `<pre class="mermaid">` blocks
 * **before** remark parses the content, so `rehype-sanitize` keeps them
 * intact. The `data-mermaid-source="true"` attribute is what the
 * client-side loader uses to find diagrams to render.
 *
 * Diagram bodies are HTML-escaped so any literal `<` / `>` inside the
 * diagram source survives the rendered HTML without being mistaken for
 * tags by the rehype-raw stage.
 */
export function preprocessMermaidFences(markdownBody: string): string {
  return markdownBody.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_m, diagram: string) => {
      const escaped = escapeHtml(diagram.trimEnd());
      return `\n<pre class="mermaid" data-mermaid-source="true">${escaped}</pre>\n`;
    },
  );
}
