/**
 * @module Infrastructure/BackfillLib/Classifier
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Tier classifier for the SEO metadata backfill
 *
 * @description
 * Maps each `news/*.html` file to one or more backfill tiers per the
 * PR 2 issue:
 *
 * - **Tier A** — source `analysis/daily/$DATE/$SUBFOLDER/executive-brief.md`
 *   (or `article.$LANG.md`) exists on disk. PR 3 will re-run
 *   `renderArticleHtml` against the source.
 * - **Tier B** — legacy flat-structure article (pre-aggregator, e.g.
 *   `2026-02-10-*`, `2026-02-13-*`) where no source markdown exists.
 *   PR 4 will rewrite these in place from the article's own body.
 * - **Tier C** — non-EN article whose description is below the lower
 *   floor (or whose title is above the upper ceiling) for its language.
 *   PR 5 will re-translate from the EN sibling.
 *
 * A single file can qualify for multiple tiers — e.g. a Japanese
 * article that has both a source markdown on disk (Tier A) *and* a
 * below-floor description (Tier C) will carry both tags so the CSV
 * reviewer sees the full story.
 *
 * Classification is pure: it takes a filename, the result of
 * `checkAgainstContract`, and a filesystem probe for the corresponding
 * `analysis/daily/$DATE/$SUBFOLDER/`. No HTML writes.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import { LANG_WINDOWS, windowFor } from './contract-checker.js';
import type { ContractResult, LangCode } from './contract-checker.js';

/** Backfill tier — not mutually exclusive. */
export type Tier = 'A' | 'B' | 'C';

/** Lightweight description of an article on disk. */
export interface ArticleFingerprint {
  /** Path relative to repo root, e.g. `news/2026-02-13-evening-analysis-en.html`. */
  readonly relPath: string;
  /** ISO date extracted from the filename, or `null` if unparseable. */
  readonly date: string | null;
  /** Slug between the date and the trailing `-$LANG`, e.g. `evening-analysis`. */
  readonly subfolder: string | null;
  /** Detected language code. Falls back to `<html lang>` via the caller. */
  readonly lang: string;
}

/** Result of classifying a single file. */
export interface ClassificationResult {
  readonly tiers: readonly Tier[];
  /** Human-readable rationale per tier (for the CSV `reason` column). */
  readonly reasons: Record<Tier, string | null>;
  /** Resolved path to the analysis source (Tier A only), if any. */
  readonly analysisSource: string | null;
}

/** Parse `news/YYYY-MM-DD-<slug>-<lang>.html` into its three tokens. */
export function parseArticleFilename(relPath: string): ArticleFingerprint {
  const base = path.basename(relPath).replace(/\.html$/i, '');
  // Greedy date at the start, greedy lang at the end.
  const m = base.match(/^(\d{4}-\d{2}-\d{2})-(.+?)-([a-z]{2})$/i);
  if (!m) {
    return { relPath, date: null, subfolder: null, lang: 'en' };
  }
  return {
    relPath,
    date: m[1] ?? null,
    subfolder: m[2] ?? null,
    lang: (m[3] ?? 'en').toLowerCase(),
  };
}

/**
 * True iff `analysis/daily/$DATE/$SUBFOLDER/executive-brief.md` or
 * `article.$LANG.md` exists on disk. The existence of either qualifies
 * the article for Tier A (re-run `renderArticleHtml` from source).
 */
export function findAnalysisSource(
  analysisRootAbs: string,
  fp: ArticleFingerprint,
): string | null {
  if (!fp.date || !fp.subfolder) return null;
  const dir = path.join(analysisRootAbs, 'daily', fp.date, fp.subfolder);
  if (!fs.existsSync(dir)) return null;
  const candidates = [
    path.join(dir, 'executive-brief.md'),
    path.join(dir, `article.${fp.lang}.md`),
    path.join(dir, 'article.md'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Classify a single file into its applicable tiers. A file may carry
 * more than one tier — all matches are recorded.
 *
 * @param analysisRootAbs Absolute path to the repo's `analysis/` dir.
 * @param fp              Parsed filename fingerprint.
 * @param contract        Result from `checkAgainstContract` for the file.
 */
export function classify(
  analysisRootAbs: string,
  fp: ArticleFingerprint,
  contract: ContractResult,
): ClassificationResult {
  const tiers: Tier[] = [];
  const reasons: Record<Tier, string | null> = { A: null, B: null, C: null };

  const analysisSource = findAnalysisSource(analysisRootAbs, fp);

  // --- Tier A ------------------------------------------------------------
  if (analysisSource) {
    tiers.push('A');
    reasons.A = `analysis source exists at ${path.relative(
      analysisRootAbs,
      analysisSource,
    )}`;
  }

  // --- Tier B ------------------------------------------------------------
  // Legacy flat-structure article whose source markdown is gone. Includes
  // everything with no analysisSource. We still need *some* way to
  // identify it, so an article without source + without tier-C
  // translation-repair needs still ends up as tier B so every file gets
  // classified. That satisfies the issue's "every file in news/ must be
  // in at least one tier" acceptance criterion.
  if (!analysisSource) {
    tiers.push('B');
    reasons.B = 'no analysis source on disk — rewrite in place from HTML body';
  }

  // --- Tier C ------------------------------------------------------------
  // Non-EN article with a below-floor description OR above-ceiling title.
  // Use windowFor() so unknown langs fall back to the Latin window.
  if (fp.lang !== 'en') {
    const window = windowFor(fp.lang);
    const hasLowerFloorMiss = contract.violations.some(
      (v) => v.code === 'DESCRIPTION_TOO_SHORT' || v.code === 'DESCRIPTION_EMPTY',
    );
    const hasUpperCeilingMiss = contract.violations.some(
      (v) => v.code === 'TITLE_TOO_LONG',
    );
    if (hasLowerFloorMiss || hasUpperCeilingMiss) {
      tiers.push('C');
      reasons.C =
        `non-EN article (lang=${fp.lang}, window ` +
        `${window.descriptionMin}-${window.descriptionMax}) with ` +
        `${hasLowerFloorMiss ? 'short description' : ''}` +
        `${hasLowerFloorMiss && hasUpperCeilingMiss ? ' + ' : ''}` +
        `${hasUpperCeilingMiss ? 'long title' : ''} — translation repair`;
    }
  }

  return { tiers, reasons, analysisSource };
}

/** True iff `lang` is a code we understand. Useful for CLI filters. */
export function isKnownLang(lang: string): lang is LangCode {
  return Object.prototype.hasOwnProperty.call(LANG_WINDOWS, lang.toLowerCase());
}

export const __test__ = {
  parseArticleFilename,
  findAnalysisSource,
  isKnownLang,
};
