/**
 * @module scripts/validators/executive-brief-translations/extractors/urls
 * @description Extract bare URLs (`https?://...`) plus markdown link
 *              targets for parity comparison between source and
 *              translation.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              178–187. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Extract bare URLs (https?://...). */
export function extractUrls(md: string): Set<string> {
  // Capture URL inside Markdown link target `(...)` and bare URLs in text.
  const urls = new Set<string>();
  const linkTargets = md.match(/\((https?:\/\/[^\s)]+)\)/g) ?? [];
  for (const t of linkTargets) urls.add(t.slice(1, -1));
  const bare = md.match(/(?<![("])https?:\/\/[^\s)<]+/g) ?? [];
  for (const u of bare) urls.add(u);
  return urls;
}
