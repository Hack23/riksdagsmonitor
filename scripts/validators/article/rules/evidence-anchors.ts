/**
 * @module scripts/validators/article/rules/evidence-anchors
 * @description Article-wide evidence-anchor counter. Mirrors the
 *              BLUF counter but EXCLUDES internal `#rm-` section links
 *              because those are navigation aids, not primary-source
 *              citations.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 388–408
 *              (`countArticleEvidenceAnchors`). Logic is byte-identical
 *              to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Count verifiable evidence anchors in text, EXCLUDING internal `#rm-`
 * section links (which are navigation aids, not primary-source citations).
 * Used for citation-density enforcement.
 */
export function countArticleEvidenceAnchors(text: string): number {
  const patterns: RegExp[] = [
    /\b(?:H(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]{6,10}|[A-ZÅÄÖ]{2}\d{1,8})\b/g,
    /\b(?:Prop|Skr|Mot|Bet|Ds|SOU|Dir)\.\s*\d{4}\/\d{2}:\d+/gi,
    /\bRiR\s+\d{4}:\d+/gi,
    /\bvotering(?:_id)?\b[^\n]*?\d/gi,
    /https?:\/\/(?:www\.)?(?:data\.riksdagen\.se|riksdagen\.se|regeringen\.se|scb\.se|imf\.org)[^\s)]*/gi,
    // NOTE: #rm- internal links are intentionally excluded for density checks.
  ];
  let total = 0;
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) total += matches.length;
  }
  return total;
}
