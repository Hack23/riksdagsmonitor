/**
 * @module scripts/validators/article/rules/bluf
 * @description BLUF extraction + evidence-anchor counter + thresholds
 *              (min/max prose chars, min anchor count).
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 106–124
 *              (thresholds), 166–178 (`extractBluf`), 211–238
 *              (`countBlufEvidenceAnchors`). Logic is byte-identical
 *              to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export const MIN_BLUF_PROSE_CHARS = 80;
export const MAX_BLUF_PROSE_CHARS = 1200; // generous — long BLUFs are fine; we just guard against empty/stub or runaway dumps

/**
 * Minimum number of evidence anchors required inside the BLUF prose
 * paragraph. An anchor is any of:
 *   - a `dok_id`-shaped token (e.g. `HD12345`, `FiU17`, `Prop. 2025/26:259`)
 *   - a vote ID (`votering_id` or `Votering`)
 *   - a primary-source URL on `data.riksdagen.se` / `riksdagen.se` /
 *     `regeringen.se` / `scb.se` / `imf.org`
 *   - a markdown link to a per-document section (`#rm-`)
 *
 * One anchor is a soft floor — the issue calls for "every BLUF claim
 * carries an evidence anchor", but enforcing a per-claim count is
 * brittle without natural-language parsing. The floor here guarantees
 * that at least one verifiable anchor reaches the BLUF.
 */
export const MIN_BLUF_EVIDENCE_ANCHORS = 1;

/**
 * Extract the prose paragraph that immediately follows a `## … BLUF …`
 * heading. Mirrors the renderer's BLUF-extraction logic in spirit —
 * we don't re-import the aggregator here because the validator must
 * stay decoupled from the render pipeline so CI can run it
 * independently of any aggregation step.
 */
export function extractBluf(article: string): string | null {
  const m = article.match(/^#{2,6}\s+(?:[^\n]*?\s)?(?:BLUF|Lede)\b[^\n]*\n+([\s\S]*?)(?=\n#{1,6}\s|\n*$)/im);
  if (!m) return null;
  const paragraph = m[1]!.split(/\n\n+/).map((p) => p.trim()).find((p) => p.length > 0 && !/^[#|>*<]/.test(p));
  return paragraph ?? null;
}

/**
 * Count evidence anchors inside a BLUF prose paragraph. Anchors are the
 * traceable tokens that lift a claim from rhetoric to verifiable
 * intelligence:
 *
 *   - dok_id-shaped codes (`HD12345`, `FiU17`)
 *   - parliamentary doc references (`Prop. 2025/26:247`, `Skr. 2025/26:259`)
 *   - vote IDs (`votering_id=…`, `Votering(\s+\d|:\s+\w)`)
 *   - primary-source URLs on `data.riksdagen.se` / `riksdagen.se` /
 *     `regeringen.se` / `scb.se` / `imf.org`
 *   - markdown anchors to per-document sections (`#rm-`)
 */
export function countBlufEvidenceAnchors(bluf: string): number {
  const patterns: RegExp[] = [
    /\b(?:H(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]{6,10}|[A-ZÅÄÖ]{2}\d{1,8})\b/g,
    /\b(?:Prop|Skr|Mot|Bet|Ds|SOU|Dir)\.\s*\d{4}\/\d{2}:\d+/gi,
    /\bRiR\s+\d{4}:\d+/gi,
    /\bvotering(?:_id)?\b[^\n]*?\d/gi,
    /https?:\/\/(?:www\.)?(?:data\.riksdagen\.se|riksdagen\.se|regeringen\.se|scb\.se|imf\.org)[^\s)]*/gi,
    /#rm-[a-z0-9-]+/g,
  ];
  let total = 0;
  for (const p of patterns) {
    const matches = bluf.match(p);
    if (matches) total += matches.length;
  }
  return total;
}

import type { ArticleViolation } from '../types.js';

/** BLUF length + evidence-anchor rule. */
export function checkBluf(rel: string, text: string): ArticleViolation[] {
  const bluf = extractBluf(text);
  if (bluf === null) return [];
  const out: ArticleViolation[] = [];
  if (bluf.length < MIN_BLUF_PROSE_CHARS) {
    out.push({
      file: rel,
      code: 'bluf-too-short',
      message: `BLUF prose is only ${bluf.length} chars — minimum is ${MIN_BLUF_PROSE_CHARS}. A publishable BLUF needs actor + active verb + object + when + so-what.`,
    });
  }
  if (bluf.length > MAX_BLUF_PROSE_CHARS) {
    out.push({
      file: rel,
      code: 'bluf-too-long',
      message: `BLUF prose is ${bluf.length} chars — maximum is ${MAX_BLUF_PROSE_CHARS}. Move the long-form analysis to the Synthesis Summary or Intelligence Assessment section.`,
    });
  }
  const anchors = countBlufEvidenceAnchors(bluf);
  if (anchors < MIN_BLUF_EVIDENCE_ANCHORS) {
    out.push({
      file: rel,
      code: 'bluf-missing-evidence-anchor',
      message: `BLUF carries ${anchors} evidence anchor(s) — minimum is ${MIN_BLUF_EVIDENCE_ANCHORS}. Add a dok_id (e.g. HD12345), parliamentary reference (Prop. 2025/26:259), vote ID, or primary-source URL (data.riksdagen.se / regeringen.se / scb.se / imf.org).`,
    });
  }
  return out;
}
