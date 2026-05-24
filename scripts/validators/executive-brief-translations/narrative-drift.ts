/**
 * @module scripts/validators/executive-brief-translations/narrative-drift
 * @description Classify whether a diff between two revisions of an
 *              executive-brief markdown source touches narrative content
 *              (anything outside ```` ```mermaid ```` fenced code blocks)
 *              or is confined entirely to mermaid syntax.
 *
 *              Used by the `exec-brief-translation-checks.yml` workflow
 *              to pre-filter the per-source structural-parity validator
 *              list: when a brief's diff vs the PR base is mermaid-only
 *              (e.g. a `fix-mermaid-diagrams` autofix pass), translations
 *              cannot have drifted in any way the parity validator can
 *              detect, so re-running the validator on stale
 *              `<!-- source-sha: -->` trailers would surface only noise.
 *
 *              When the diff contains any change outside ```` ```mermaid ````
 *              fences (including changes to other fenced code blocks),
 *              parity enforcement runs as before.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Strip all ```` ```mermaid ... ``` ```` fenced code blocks from a markdown
 * string. Other fenced code blocks (```` ```bash ````, ```` ```ts ````, …) are
 * preserved so that changes to them count as narrative drift.
 *
 * Uses a line-scanner rather than a global regex to be robust against
 * nested or malformed fences (the mermaid autofix in this repo can leave
 * temporarily unbalanced fences mid-edit, which a regex `.*?` would
 * mis-pair across files).
 */
export function stripMermaidBlocks(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inMermaid = false;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!inMermaid) {
      if (/^```mermaid\b/i.test(trimmed)) {
        inMermaid = true;
        continue;
      }
      out.push(line);
    } else {
      // Closing fence: a line whose first non-whitespace token is exactly ``` (any length ≥3).
      if (/^`{3,}\s*$/.test(trimmed)) {
        inMermaid = false;
      }
      // Drop every line inside the mermaid block (including the fence lines themselves).
    }
  }
  return out.join('\n');
}

/**
 * Return `true` iff the textual diff between `before` and `after`
 * disappears once every ```` ```mermaid ```` block is stripped from both
 * sides. Trailing whitespace on each line is normalised so an autofix that
 * only rewrites trailing whitespace inside narrative is still treated as
 * drift (line count matters), but cross-platform line endings are not.
 */
export function isDiffMermaidOnly(before: string, after: string): boolean {
  if (before === after) return true;
  const beforeNorm = normalise(stripMermaidBlocks(before));
  const afterNorm = normalise(stripMermaidBlocks(after));
  return beforeNorm === afterNorm;
}

function normalise(s: string): string {
  return s.replace(/\r\n/g, '\n');
}
