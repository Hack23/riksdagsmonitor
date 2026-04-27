/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/PassTwo
 * @category Intelligence Operations / Supporting Infrastructure
 * @name AI-FIRST Pass-2 self-audit stripper
 *
 * @description
 * Strips the `## Pass 2 …` (or any heading level / emoji-prefixed variant)
 * self-audit section from analysis artifacts. These sections are added by
 * the AI-FIRST Pass-2 iteration (see `00-base-contract.md` §5) and document
 * *how* the analysis was refined, not *what* it says — so they must never
 * reach the published article.
 *
 * Pure string transform, zero dependencies.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Regex matching an "AI self-audit" trailing section heading. Matches,
 * from a heading like `## Pass 2 …` / `### Pass 2 …` / `## 🔁 Pass 2 …` /
 * `#### Pass 2 …`, all the way to either end-of-file or whatever follows.
 * The `g` flag is set so callers can iterate matches; consumers that need
 * a single match should use the local non-`g` regex inside
 * {@link stripPassTwoSection} instead of resetting `lastIndex`.
 */
export const PASS_TWO_HEADING_RE =
  /^#{2,6}\s+(?:[^\n#]*?\s)?Pass\s*2\b[^\n]*$/gim;

/**
 * Strip the Pass-2 self-audit section (and anything after it) from a single
 * artifact body. The section extends from the Pass-2 heading through end of
 * file because it is always the last thing the agent writes.
 */
export function stripPassTwoSection(body: string): string {
  // Use a fresh, non-`g` regex to avoid `lastIndex` state leaking between
  // calls. PASS_TWO_HEADING_RE is exported with `g` for tests/iteration.
  const re = /^#{1,6}\s+(?:[^\n#]*?\s)?Pass\s*2\b[^\n]*$/im;
  const match = body.match(re);
  if (!match || match.index === undefined) return body;
  return body.slice(0, match.index).replace(/\s+$/g, '') + '\n';
}
