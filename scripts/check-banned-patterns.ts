/**
 * CLI helper for validate-news-generation.sh Check 15.
 *
 * Sources banned patterns from the canonical BANNED_PATTERNS list in shared.ts
 * so the bash script does not maintain a duplicate pattern set.
 * Also detects unresolved AI_MUST_REPLACE markers in HTML comments.
 *
 * Usage: npx tsx scripts/check-banned-patterns.ts news/*.html
 * Exit code: number of articles containing banned patterns (0 = clean)
 * Stdout: one JSON line per offending file: {"file":"…","labels":["…"]}
 */

import { readFileSync } from 'fs';
import { detectBannedPatterns } from './data-transformers/content-generators/shared.js';

/** Regex for unresolved AI_MUST_REPLACE placeholders in HTML comments. */
const AI_MUST_REPLACE_RE = /<!--[\s\S]*?AI_MUST_REPLACE[\s\S]*?-->/;

const files = process.argv.slice(2);
let count = 0;

for (const file of files) {
  try {
    const html = readFileSync(file, 'utf-8');
    const labels = detectBannedPatterns(html);

    // Detect AI_MUST_REPLACE markers inside HTML comments — these are
    // unresolved template placeholders that must never reach production.
    if (AI_MUST_REPLACE_RE.test(html)) {
      labels.push('aiMustReplaceComment: Unresolved AI_MUST_REPLACE placeholder in HTML comment');
    }

    if (labels.length > 0) {
      count++;
      // Machine-readable output for the bash wrapper
      console.log(JSON.stringify({ file, labels }));
    }
  } catch {
    // File not found / unreadable — skip silently (bash handles existence checks)
  }
}

process.exit(Math.min(count, 125)); // cap at 125 to keep the exit status in range and avoid common shell-reserved codes like 126/127
