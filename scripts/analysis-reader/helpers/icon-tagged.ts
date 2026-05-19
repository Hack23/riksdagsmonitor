/**
 * @module analysis-reader/helpers/icon-tagged
 * @description Extract markdown lines that contain a specific emoji icon.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Extract items tagged with a specific emoji icon from text.
 */
export function extractIconTagged(text: string, icon: string): string[] {
  const results: string[] = [];
  for (const line of text.split('\n')) {
    if (line.includes(icon)) {
      const cleaned = line.replace(/^[\s\-*]+/, '').trim();
      if (cleaned) results.push(cleaned);
    }
  }
  return results;
}
