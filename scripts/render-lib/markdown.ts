/**
 * @module Infrastructure/RenderLib/Markdown (compat shim)
 * @category Intelligence Operations / Supporting Infrastructure
 *
 * @description
 * Backwards-compatibility re-export shim. The real implementation lives
 * in `markdown/` (Round-5 split). Existing consumers that
 * `import { … } from './markdown.js'` continue to work without change.
 *
 * **Do not add new code here** — extend the matching leaf module under
 * `markdown/` instead. This shim exists only so that:
 * - `tests/render-lib-architecture.test.ts` imports keep resolving;
 * - Round-1 consumers that imported `HEADING_ID_PREFIX` / `sanitizeSchema`
 *   / `renderMarkdownToHtml` from this path keep compiling.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export {
  HEADING_ID_PREFIX,
  preprocessMermaidFences,
  rehypeSlugWithPrefix,
  rehypeWrapTables,
  renderMarkdownToHtml,
  sanitizeSchema,
} from './markdown/index.js';
