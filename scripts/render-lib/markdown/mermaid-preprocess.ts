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

import { escapeHtml } from '../../sitemap-html/index.js';
import { ensureMermaidTheme } from './mermaid-canonical-theme.js';

/**
 * Swap ``` ```mermaid ``` fences for `<pre class="mermaid">` blocks
 * **before** remark parses the content, so `rehype-sanitize` keeps them
 * intact. The `data-mermaid-source="true"` attribute is what the
 * client-side loader uses to find diagrams to render.
 *
 * Diagram bodies are HTML-escaped so any literal `<` / `>` inside the
 * diagram source survives the rendered HTML without being mistaken for
 * tags by the rehype-raw stage.
 *
 * **Defence-in-depth themed-Mermaid contract** — if the diagram body
 * does not already declare its own theme (no `%%{init …}%%`, no
 * `themeVariables`, no `style …` / `classDef …` / `linkStyle …`
 * directive), the renderer prepends the canonical Riksdagsmonitor
 * `%%{init …}%%` prologue (see `mermaid-canonical-theme.ts`). This
 * guarantees user-facing HTML never renders an unthemed diagram even
 * if the AI agent or a template regression ships one — the
 * complementary upstream gate (Check 5 of
 * `.github/prompts/05-analysis-gate.md`) still fails CI on the
 * artifact source so the regression surfaces, but readers never see
 * the broken visual.
 *
 * **Resilience to unclosed fences** — AI agents occasionally emit a
 * `\`\`\`mermaid` opening fence without a matching `\`\`\`` close. The
 * naive non-greedy regex `/\`\`\`mermaid\n[\s\S]*?\`\`\`/g` would then
 * pair the unclosed opening with the *next* `\`\`\`mermaid` opening
 * (because that line begins with `\`\`\``), silently merging two
 * diagrams into one and dropping every other block. To prevent that
 * data loss we walk the body line-by-line and treat the next
 * `\`\`\`mermaid`/`\`\`\`<lang>`/end-of-input as an implicit close —
 * each opening fence becomes exactly one `<pre class="mermaid">`.
 * The companion validator (`scripts/validate-article.ts` →
 * `unclosed-mermaid-fence`) still fails CI on the source artifact so
 * the regression surfaces, but the rendered HTML never silently loses
 * diagrams.
 */
export function preprocessMermaidFences(markdownBody: string): string {
  const lines = markdownBody.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (/^```mermaid[\t ]*$/.test(line)) {
      // Find the closing fence. A closing fence is a line whose only
      // content is `\`\`\`` (any trailing whitespace allowed). If the
      // next opening fence (`\`\`\`<anything>`) appears first, treat
      // *that* as the implicit close so we never swallow it into the
      // mermaid body and lose a downstream diagram.
      const bodyLines: string[] = [];
      let consumedClose = false;
      let j = i + 1;
      for (; j < lines.length; j += 1) {
        const cur = lines[j]!;
        if (/^```[\t ]*$/.test(cur)) {
          consumedClose = true;
          break;
        }
        if (/^```/.test(cur)) {
          // New fence opens before the current one closed — leave it
          // for the next iteration of the outer loop to handle.
          break;
        }
        bodyLines.push(cur);
      }
      const themed = ensureMermaidTheme(bodyLines.join('\n').trimEnd());
      const escaped = escapeHtml(themed);
      // Surrounding blank lines mirror the legacy regex output so
      // remark-parse sees a clean block-level boundary.
      out.push('', `<pre class="mermaid" data-mermaid-source="true" tabindex="0">${escaped}</pre>`, '');
      i = consumedClose ? j + 1 : j;
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
}
