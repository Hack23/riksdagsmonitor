/**
 * @module scripts/validators/article/rules/banned-phrases
 * @description Banned-phrase scanner — load + cache the canonical
 *              `political-style-guide.json` list and scan article text
 *              for case-insensitive literal substring matches.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 315–386 (cache,
 *              `loadBannedPhrases`, `resetBannedPhrasesCache`,
 *              `scanBannedPhrases`). Logic is byte-identical to the
 *              original; the module-scope cache + reset API are
 *              preserved exactly because tests in
 *              `tests/validate-article.test.ts` depend on the behaviour.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../types.js';

let _bannedPhrasesCache: string[] | null = null;
let _bannedPhrasesCacheLoaded = false;

/**
 * Load banned phrases from the canonical JSON file. Returns the flat
 * array of literal substrings. Caches after first load.
 * Returns `null` when the canonical file is missing or malformed so
 * callers can emit an explicit violation rather than silently skipping.
 */
export function loadBannedPhrases(repoRoot: string = REPO_ROOT): string[] | null {
  if (_bannedPhrasesCacheLoaded) return _bannedPhrasesCache;
  const jsonPath = join(repoRoot, 'analysis', 'methodologies', 'political-style-guide.json');
  if (!existsSync(jsonPath)) {
    _bannedPhrasesCacheLoaded = true;
    _bannedPhrasesCache = null;
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as { allPhrases?: unknown };
    if (!Array.isArray(data.allPhrases) || data.allPhrases.length === 0) {
      _bannedPhrasesCache = null;
    } else {
      const seen = new Set<string>();
      const phrases: string[] = [];
      for (const item of data.allPhrases) {
        if (typeof item !== 'string') continue;
        const trimmed = item.trim();
        if (trimmed.length === 0) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        phrases.push(trimmed);
      }
      _bannedPhrasesCache = phrases.length > 0 ? phrases : null;
    }
  } catch {
    _bannedPhrasesCache = null;
  }
  _bannedPhrasesCacheLoaded = true;
  return _bannedPhrasesCache;
}

/** Reset cache (for testing). */
export function resetBannedPhrasesCache(): void {
  _bannedPhrasesCache = null;
  _bannedPhrasesCacheLoaded = false;
}

/**
 * Scan text for banned phrases (case-insensitive literal substring match).
 * Returns the list of hits with the matched phrase and a short context snippet.
 */
export function scanBannedPhrases(
  text: string,
  bannedPhrases: string[],
): Array<{ phrase: string; context: string }> {
  const hits: Array<{ phrase: string; context: string }> = [];
  const lower = text.toLowerCase();
  for (const phrase of bannedPhrases) {
    const trimmed = phrase.trim();
    if (trimmed.length === 0) continue;
    const needle = trimmed.toLowerCase();
    let idx = lower.indexOf(needle);
    while (idx !== -1) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + trimmed.length + 20);
      const context = text.slice(start, end).replace(/\n/g, ' ');
      hits.push({ phrase: trimmed, context });
      idx = lower.indexOf(needle, idx + needle.length);
    }
  }
  return hits;
}

import type { ArticleViolation } from '../types.js';

/** Banned-phrase rule. Emits `missing-banned-phrase-list` when the canonical file is unloadable. */
export function checkBannedPhrases(rel: string, text: string): ArticleViolation[] {
  const out: ArticleViolation[] = [];
  const bannedPhrases = loadBannedPhrases();
  if (bannedPhrases === null) {
    out.push({
      file: rel,
      code: 'missing-banned-phrase-list',
      message: `Canonical banned-phrase file (analysis/methodologies/political-style-guide.json) is missing or malformed — editorial QA check cannot run. Ensure the file exists and contains a valid "allPhrases" array.`,
    });
    return out;
  }
  if (bannedPhrases.length === 0) return out;
  const hits = scanBannedPhrases(text, bannedPhrases);
  if (hits.length > 0) {
    const sample = hits.slice(0, 3).map((h) => `"${h.phrase}"`).join(', ');
    out.push({
      file: rel,
      code: 'banned-phrase-detected',
      message: `Article contains ${hits.length} banned phrase(s) (${sample}${hits.length > 3 ? ', …' : ''}). Rewrite using evidence-anchored alternatives per political-style-guide.json (human-readable companion: political-style-guide.md).`,
    });
  }
  return out;
}
