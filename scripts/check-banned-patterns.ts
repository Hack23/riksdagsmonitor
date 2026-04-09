/**
 * CLI helper for validate-news-generation.sh Check 15.
 *
 * Sources banned patterns from the canonical BANNED_PATTERNS list in shared.ts
 * so the bash script does not maintain a duplicate pattern set.
 *
 * Usage: npx tsx scripts/check-banned-patterns.ts news/*.html
 * Exit code: number of articles containing banned patterns (0 = clean)
 * Stdout: one JSON line per offending file: {"file":"…","labels":["…"]}
 */

import { readFileSync } from 'fs';
import { detectBannedPatterns } from './data-transformers/content-generators/shared.js';

const files = process.argv.slice(2);
let count = 0;

for (const file of files) {
  try {
    const html = readFileSync(file, 'utf-8');
    const labels = detectBannedPatterns(html);
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
