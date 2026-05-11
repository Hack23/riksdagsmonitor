/**
 * @module Infrastructure/RenderLib/Markdown/MermaidCanonicalTheme
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Canonical Riksdagsmonitor Mermaid theme block (single source of truth)
 *
 * @description
 * The canonical `%%{init …}%%` prologue that every Mermaid diagram on
 * Riksdagsmonitor SHOULD declare and that the renderer injects as a
 * defence-in-depth fallback when an artifact ships an unthemed diagram.
 *
 * The colour tokens mirror the cyberpunk dark theme baked into the
 * client-side Mermaid loader (`js/lib/mermaid-init.mjs`) so a diagram
 * rendered with the injected prologue is visually indistinguishable from
 * one that inherits the global theme. This means:
 *
 * - **Light page → dark diagram card** (see `styles.css`
 *   `html[data-theme="light"] .rm-article-body pre.mermaid` rule) keeps
 *   ≥ 4.5:1 text contrast (WCAG 2.1 AA, normal text) for the diagram's
 *   `#e0e0e0` text against its `#0a0e27` background (12.63:1).
 * - **Dark page → dark diagram card** also satisfies WCAG 2.1 AA at the
 *   same 12.63:1 ratio.
 *
 * Documentation: `analysis/methodologies/political-style-guide.md`
 * §"📊 Mermaid Diagram Canon".
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Canonical Mermaid `%%{init …}%%` prologue. Single trailing newline so
 * it can be prepended to any diagram body without producing a stray
 * blank line that some Mermaid parsers reject.
 */
export const CANONICAL_MERMAID_INIT = `%%{init: {
  "theme": "dark",
  "themeVariables": {
    "primaryColor": "#00d9ff",
    "primaryTextColor": "#e0e0e0",
    "primaryBorderColor": "#00d9ff",
    "lineColor": "#ff006e",
    "secondaryColor": "#1a1e3d",
    "tertiaryColor": "#0a0e27",
    "background": "#0a0e27"
  },
  "flowchart": { "htmlLabels": false, "useMaxWidth": true },
  "sequence": { "useMaxWidth": true }
}}%%
`;

/**
 * Detect whether a Mermaid diagram body already declares its own theme.
 *
 * Matches the same heuristics used by Check 5 of
 * `.github/prompts/05-analysis-gate.md`:
 *   - a `%%{init …}%%` prologue, or
 *   - any `themeVariables` declaration anywhere in the body, or
 *   - any `style …` directive (per-node colours), or
 *   - any `classDef …` directive (per-class colours), or
 *   - any `linkStyle …` directive (per-link colours).
 *
 * If any of these are present, the renderer leaves the diagram alone.
 * Otherwise it prepends {@link CANONICAL_MERMAID_INIT}.
 */
export function hasMermaidTheme(diagramBody: string): boolean {
  return (
    /%%\{\s*init/m.test(diagramBody) ||
    /\bthemeVariables\b/m.test(diagramBody) ||
    /^[\t ]*style[\t ]+/m.test(diagramBody) ||
    /^[\t ]*classDef[\t ]+/m.test(diagramBody) ||
    /^[\t ]*linkStyle[\t ]+/m.test(diagramBody)
  );
}

/**
 * Prepend {@link CANONICAL_MERMAID_INIT} to `diagramBody` iff it does
 * not already carry a theme declaration. Pure function — never mutates
 * the input string.
 */
export function ensureMermaidTheme(diagramBody: string): string {
  if (hasMermaidTheme(diagramBody)) return diagramBody;
  return CANONICAL_MERMAID_INIT + diagramBody.replace(/^(\r?\n)+/, '');
}
