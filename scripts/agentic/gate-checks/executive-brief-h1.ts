/**
 * @module scripts/agentic/gate-checks/executive-brief-h1
 * @description H1 quality helpers used by `checkExecutiveBrief`. Kept in a
 *              sibling module so the main `executive-brief.ts` stays within
 *              the 250-line per-file budget.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

import { cleanArticleTitle } from '../../render-lib/aggregator/seo/title.js';
import { stripHeadingMarkup } from '../gate-shared/markdown-helpers.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Extract the visible H1 text (Markdown `# …` first, then HTML `<h1>…</h1>`
 * template heading) from the executive-brief content. Returns `null` when
 * neither form is present.
 */
export function extractExecutiveBriefH1(content: string): string | null {
  const markdownH1 = content.match(/^#\s+(.+?)\s*$/m);
  if (markdownH1) return stripHeadingMarkup(markdownH1[1]!);

  const htmlH1 = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (htmlH1) return stripHeadingMarkup(htmlH1[1]!);

  return null;
}

/** Placeholder fragments that signal an unreplaced template H1. */
const PLACEHOLDER_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /replace\s*this\s*h1/i, label: "literal 'REPLACE THIS H1' placeholder" },
  { pattern: /executive\s+brief\s+template/i, label: "'Executive Brief Template' template heading" },
  { pattern: /ai[_\s-]*must[_\s-]*replace/i, label: "'AI_MUST_REPLACE' stub marker" },
  { pattern: /ai-generated\s+political\s+intelligence/i, label: "banned phrase 'AI-generated political intelligence'" },
];

const DATE_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/, label: 'ISO date (YYYY-MM-DD)' },
  {
    pattern:
      /\b\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i,
    label: 'English long-form date',
  },
  {
    pattern:
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,\s*\d{4})?\b/i,
    label: 'English long-form date (US order)',
  },
  {
    pattern:
      /\b\d{1,2}\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+\d{4}\b/i,
    label: 'Swedish long-form date',
  },
];

export function checkH1Placeholders(h1: string, results: GateCheckResult[]): void {
  for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
    if (pattern.test(h1)) {
      results.push({
        checkId: 'family-c-structure',
        passed: false,
        message: `executive-brief.md: H1 still contains ${label} — replace with a story-oriented publishable title (see methodology #executive-brief)`,
        artifact: 'executive-brief.md',
      });
    }
  }
}

export function checkH1Boilerplate(h1: string, results: GateCheckResult[]): void {
  const h1Plain = h1
    .toLowerCase()
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s—–-]+/u, '')
    .replace(/[\s—–-]+$/u, '')
    .trim();
  if (h1Plain === 'executive brief' || h1Plain === '') {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message:
        "executive-brief.md: H1 is bare boilerplate ('Executive Brief') — write a publishable story-oriented title (55–70 chars EN, actor + active verb + instrument or number)",
      artifact: 'executive-brief.md',
    });
  }
}

export function checkH1RendererCollapse(
  h1: string,
  subfolder: string,
  results: GateCheckResult[],
): void {
  const cleaned = cleanArticleTitle(h1, subfolder);
  if (cleaned === null) {
    const alreadyFlagged = results.some(
      (r) =>
        !r.passed &&
        r.artifact === 'executive-brief.md' &&
        r.message.includes('H1'),
    );
    if (!alreadyFlagged) {
      results.push({
        checkId: 'family-c-structure',
        passed: false,
        message:
          `executive-brief.md: H1 collapses to nothing after boilerplate strip — write a story-oriented headline (actor + active verb + instrument/number). The renderer's cleanArticleTitle(h1, '${subfolder}') returned null, so the SERP <title> would silently fall back to a BLUF-sentence fragment.`,
        artifact: 'executive-brief.md',
      });
    }
    return;
  }
  for (const { pattern, label } of DATE_PATTERNS) {
    if (pattern.test(h1)) {
      results.push({
        checkId: 'family-c-structure',
        passed: false,
        message: `executive-brief.md: H1 contains a literal date (${label}) — dates belong in 'article:published_time', not the SERP <title>`,
        artifact: 'executive-brief.md',
      });
      break;
    }
  }
  const h1Trimmed = h1.trim();
  if (/[,;:—–-]\s*$/u.test(h1Trimmed)) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message:
        "executive-brief.md: H1 ends with dangling punctuation (',' / ';' / ':' / '—' / '–' / '-') — complete the headline or remove the trailing marker",
      artifact: 'executive-brief.md',
    });
  } else if (
    /\s+(?:and|or|but|with|as|for|to|in|of|on|at|by|the|a|an|from|that)$/i.test(
      h1Trimmed,
    )
  ) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message:
        "executive-brief.md: H1 ends with a coordinating connector or article ('and', 'or', 'with', 'the', …) — complete the headline",
      artifact: 'executive-brief.md',
    });
  }
}

export function checkH1AcrossDaysUniqueness(
  h1: string,
  analysisDir: string,
  subfolder: string,
  results: GateCheckResult[],
): void {
  // Period-aggregation briefs routinely ship the same H1 every run. Compare
  // against same-subfolder briefs from the previous 7 days; flag exact
  // normalised-identical duplicates.
  const dailyDir = dirname(analysisDir); // analysis/daily/<date>
  const dailyRoot = dirname(dailyDir); // analysis/daily
  const currentDate = basename(dailyDir);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(currentDate) || !existsSync(dailyRoot)) return;
  try {
    const siblingDates = readdirSync(dailyRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n) && n < currentDate)
      .sort()
      .slice(-7);
    const normaliseH1 = (raw: string): string =>
      raw
        .toLowerCase()
        // Strip ISO dates BEFORE punctuation replacement (otherwise hyphens
        // in YYYY-MM-DD become spaces and the date regex fails).
        .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '')
        .replace(/[\p{P}\p{S}\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const currentNorm = normaliseH1(h1);
    if (currentNorm.length < 10) return;
    for (const siblingDate of siblingDates) {
      const siblingBrief = join(dailyRoot, siblingDate, subfolder, 'executive-brief.md');
      if (!existsSync(siblingBrief)) continue;
      let siblingH1: string | null = null;
      try {
        siblingH1 = extractExecutiveBriefH1(readFileSync(siblingBrief, 'utf-8'));
      } catch {
        continue;
      }
      if (!siblingH1) continue;
      if (normaliseH1(siblingH1) === currentNorm) {
        results.push({
          checkId: 'family-c-structure',
          passed: false,
          message:
            `executive-brief.md: H1 is normalised-identical (case/punctuation/date stripped) to analysis/daily/${siblingDate}/${subfolder}/executive-brief.md — reword to surface the day-specific angle (period-aggregation briefs must not ship duplicate cards on the news index)`,
          artifact: 'executive-brief.md',
        });
        break;
      }
    }
  } catch {
    // Reading sibling dirs is best-effort; never block the gate on I/O hiccups.
  }
}
