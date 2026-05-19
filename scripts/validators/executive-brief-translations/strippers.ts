/**
 * @module scripts/validators/executive-brief-translations/strippers
 * @description Strip fenced code blocks and HTML comments so other
 *              regexes don't false-match inside them.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              129–140. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Strip fenced code blocks and HTML comments so other regexes don't false-match inside them. */
export function stripFencesAndComments(md: string): string {
  // Loop until stable to handle any nested/escaped occurrences.
  let result = md;
  let prev: string;
  do {
    prev = result;
    result = result
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
  } while (result !== prev);
  return result;
}
