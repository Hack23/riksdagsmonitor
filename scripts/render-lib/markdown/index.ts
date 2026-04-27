/**
 * @module Infrastructure/RenderLib/Markdown
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sanitised Markdown → HTML rendering pipeline (barrel)
 *
 * @description
 * Public barrel re-exporting the four leaf modules of the markdown
 * rendering pipeline plus the `renderMarkdownToHtml` orchestrator.
 *
 * This module is consumed via three paths:
 * 1. `scripts/render-lib/index.ts` (the global render-lib barrel)
 * 2. `scripts/render-lib/markdown.ts` (legacy compat shim — re-exports
 *    everything below verbatim)
 * 3. Direct leaf imports from tests / aggregator modules
 *
 * All three paths resolve to the same identity for every exported
 * symbol — see `tests/render-lib/architecture.test.ts` for the parity
 * contract.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export { preprocessMermaidFences } from './mermaid-preprocess.js';
export { rehypeSlugWithPrefix } from './rehype-slug-prefixed.js';
export { rehypeWrapTables } from './rehype-wrap-tables.js';
export { HEADING_ID_PREFIX, sanitizeSchema } from './sanitize-schema.js';
export { renderMarkdownToHtml } from './pipeline.js';
