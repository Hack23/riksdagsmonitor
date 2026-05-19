/**
 * @module analysis-reader/helpers/section-extractor
 * @description Markdown section + value extraction helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Extract the first heading level 2 section content from markdown.
 * Returns the text content between the heading and the next heading.
 */
export function extractSection(markdown: string, sectionName: string): string {
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `##\\s+${escapedName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i',
  );
  const match = regex.exec(markdown);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract the value of a key-value pair from markdown.
 * Supports formats: `**Key**: Value`, `- Key: Value`, `Key: Value`
 */
export function extractValue(markdown: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`\\*\\*${escapedKey}\\*\\*:\\s*(.+)`, 'i'),
    new RegExp(`-\\s+${escapedKey}:\\s*(.+)`, 'i'),
    new RegExp(`${escapedKey}:\\s*(.+)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(markdown);
    if (match?.[1]) {
      return match[1].trim().replace(/\*\*/g, '').replace(/`/g, '');
    }
  }
  return '';
}
