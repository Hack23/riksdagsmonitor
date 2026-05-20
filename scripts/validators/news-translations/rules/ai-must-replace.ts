/**
 * @module scripts/validators/news-translations/rules/ai-must-replace
 * @description Detect unresolved `AI_MUST_REPLACE` markers embedded as HTML
 *              comments by content generators. These markers MUST be
 *              replaced by the translation agent before publication —
 *              their presence in a translated article is a hard
 *              publication-gating failure.
 *
 *              Rule census: extracted from the pre-refactor
 *              `scripts/validate-news-translations.ts` (commit
 *              `52f9743f78~1`) lines 436–474 (`AI_MUST_REPLACE_COMMENT_RE`,
 *              `checkFileForAIMustReplaceMarkers`). Logic is byte-identical
 *              to the original; the refactor split in #2582 dropped this
 *              rule by accident — this module restores it.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { readFileSync } from 'fs';
import { basename } from 'path';

import { getLanguageCode } from '../language.js';
import type { AIMarkerFileRecord } from '../types.js';

/**
 * Regex to detect unresolved AI_MUST_REPLACE markers in HTML comments.
 * Pattern matches: <!-- AI_MUST_REPLACE: ... -->
 */
const AI_MUST_REPLACE_COMMENT_RE = /<!--[\s\S]*?AI_MUST_REPLACE[\s\S]*?-->/g;

/**
 * Check if a file contains unresolved AI_MUST_REPLACE markers in HTML
 * comments. Returns `null` if the file is clean, otherwise an
 * `AIMarkerFileRecord` describing the unresolved markers.
 */
export function checkFileForAIMustReplaceMarkers(filepath: string): AIMarkerFileRecord | null {
  try {
    const content = readFileSync(filepath, 'utf-8');
    AI_MUST_REPLACE_COMMENT_RE.lastIndex = 0;
    const allMatches = content.match(AI_MUST_REPLACE_COMMENT_RE);
    if (!allMatches || allMatches.length === 0) return null;

    const filename = basename(filepath);
    const lang = getLanguageCode(filename) ?? '';

    // Collect up to 3 distinct sample marker names for reporting
    const samples: string[] = [];
    const nameRe = /AI_MUST_REPLACE:\s*([\w_]+)/g;
    let m: RegExpExecArray | null;
    while ((m = nameRe.exec(content)) !== null && samples.length < 3) {
      const name = m[1] ?? '';
      if (name && !samples.includes(name)) {
        samples.push(name);
      }
    }

    return { filename, lang, markerCount: allMatches.length, samples };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to validate AI_MUST_REPLACE markers in ${filepath}: ${message}`,
      { cause: error },
    );
  }
}
