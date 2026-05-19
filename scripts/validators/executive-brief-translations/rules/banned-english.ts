/**
 * @module scripts/validators/executive-brief-translations/rules/banned-english
 * @description Banned-English-phrase scanner for non-English translations
 *              (e.g. "Executive Brief", "BLUF", "Bottom-Line-Up-Front").
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              59–80, 206–226. Logic is byte-identical to the original;
 *              the banned-phrase list and allowlist contexts are
 *              re-exported unchanged.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Banned English phrases that must NOT appear in non-English translations. */
const BANNED_ENGLISH_PHRASES: ReadonlyArray<string> = [
  'Executive Brief',
  'BLUF',
  'Bottom-Line-Up-Front',
  'Top Forward Trigger',
  '60-Second Read',
  'Decision-Grade',
  'Decisions',
  'Confidence',
  'Key Takeaways',
  'What Happened',
  'What It Means',
];

/** Banned-phrase scan exemptions (phrases that are technical / canonical). */
const BANNED_PHRASE_ALLOWLIST_CONTEXTS: ReadonlyArray<RegExp> = [
  /`Executive Brief`/i, // inline code (canonical reference)
  /\bdok_id\b/i,
  /<!--\s*source-sha:/i,
  /<!--\s*dir:\s*rtl\s*-->/i,
];

/** Returns banned English phrases found in `md`, ignoring allowlist contexts. */
export function findBannedEnglishPhrases(md: string): string[] {
  const hits: string[] = [];
  for (const phrase of BANNED_ENGLISH_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (!re.test(md)) continue;
    // Check allowlist contexts on each occurrence.
    const allLines = md.split('\n');
    let stillFound = false;
    for (const line of allLines) {
      if (!re.test(line)) continue;
      const inAllowlist = BANNED_PHRASE_ALLOWLIST_CONTEXTS.some((ctx) => ctx.test(line));
      if (!inAllowlist) {
        stillFound = true;
        break;
      }
    }
    if (stillFound) hits.push(phrase);
  }
  return hits;
}
