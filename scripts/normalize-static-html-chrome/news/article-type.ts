/**
 * @module normalize-static-html-chrome/news/article-type
 * @description Infer legacy article-type slug from filename + apply class.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Map common URL fragments to article-type slugs. Order matters: the first
 * matching token wins, so longer / more specific tokens are listed first.
 */
const ARTICLE_TYPE_MAPPINGS: readonly [string, string][] = [
  ['committee-reports', 'committee-reports'],
  ['committeereports', 'committee-reports'],
  ['propositions', 'propositions'],
  ['government-propositions', 'propositions'],
  ['opposition-motions', 'motions'],
  ['motions', 'motions'],
  ['interpellations', 'interpellations'],
  ['evening-analysis', 'evening-analysis'],
  ['week-ahead', 'week-ahead'],
  ['month-ahead', 'month-ahead'],
  ['weekly-review', 'weekly-review'],
  ['monthly-review', 'monthly-review'],
  ['deep-inspection', 'deep-inspection'],
  ['realtime-pulse', 'realtime-pulse'],
  ['realtime', 'realtime'],
  ['breaking', 'breaking'],
  ['parliament-agenda', 'parliament-agenda'],
];

/** Derive the legacy article-type slug from a news file path. */
export function inferLegacyArticleType(file: string): string {
  const lower = file.toLowerCase();
  return ARTICLE_TYPE_MAPPINGS.find(([needle]) => lower.includes(needle))?.[1] ?? 'political-intelligence';
}

/**
 * Ensure `<article class="news-article …">` carries the matching
 * `article-type-…` class for the file's content type.
 */
export function ensureLegacyArticleTypeClass(html: string, file: string): string {
  const type = inferLegacyArticleType(file);
  return html.replace(/<article\b([^>]*class=")([^"]*\bnews-article\b[^"]*)(")/i, (_match, before, classes, after) => {
    const classSet = new Set(String(classes).split(/\s+/).filter(Boolean));
    classSet.add(`article-type-${type}`);
    return `<article${before}${Array.from(classSet).join(' ')}${after}`;
  });
}
