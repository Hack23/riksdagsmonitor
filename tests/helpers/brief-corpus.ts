/**
 * @module tests/helpers/brief-corpus
 *
 * @description
 * Deterministic walker + sampler over the real `analysis/daily/<DATE>/<SUB>/`
 * executive-brief corpus. The corpus is the canonical SEO source for every
 * article rendered to `news/*.html`; SEO tests need to **sample real briefs**
 * (not synthetic fixtures) so they catch regressions where the extractor
 * mis-reads patterns that only appear in production content.
 *
 * Design contracts:
 *
 * - **Reproducible randomness.** A mulberry32-seeded PRNG ensures CI picks
 *   the same N briefs every run for a given seed. Different seeds in
 *   different tests cover different corners without flakiness.
 * - **Subfolder normalisation.** The on-disk layout has variants
 *   (`committeeReports` ↔ `committee-reports`, `realtime-*` timestamps
 *    that all share the `realtime-pulse` article type). Sampling is keyed
 *   by article-type ID, not raw subfolder name.
 * - **Per-language sidecars.** Each sample includes the English brief
 *   path plus every `_<lang>.md` sibling that exists on disk. Missing
 *   localised siblings are intentionally `null` so tests can decide
 *   whether to skip or assert the EN-fallback path.
 *
 * Pure helper — only the filesystem walker performs I/O; sampling is
 * deterministic and side-effect-free.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Language } from '../../scripts/types/language';
import { LANGUAGES } from '../../scripts/render-lib/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');
const DAILY_DIR = join(REPO_ROOT, 'analysis', 'daily');

/**
 * Maps an on-disk subfolder name to its canonical article-type ID. The
 * left side is what `readdirSync(analysis/daily/<date>)` returns; the
 * right side is the article-type id used by the renderer pipeline.
 *
 * Most mapped IDs match `analysis/article-types.json#id`, but the set
 * intentionally **also includes legacy/published slugs that are not in
 * the registry** — currently `realtime-pulse` and `deep-inspection`.
 * Both ship rendered `news/<date>-<slug>-<lang>.html` pages and need
 * SEO-contract coverage even though they have not yet been promoted
 * into `article-types.json`. When such a slug is later added to the
 * registry, its entry here remains valid.
 *
 * `realtime-<HHMM>` timestamp variants and the bare `realtime-pulse` /
 * `realtime-monitor` folders all share the canonical `realtime-pulse`
 * article type — they're the same renderer pipeline with the same SEO
 * cascade contract. `realtime-monitor` is kept distinct only because
 * `article-types.json` exposes it as a separate id with a separate
 * label.
 */
const SUBFOLDER_TO_ARTICLE_TYPE: ReadonlyMap<string, string> = new Map([
  ['propositions', 'propositions'],
  ['motions', 'motions'],
  ['committee-reports', 'committee-reports'],
  ['committeeReports', 'committee-reports'],
  ['interpellations', 'interpellations'],
  ['evening-analysis', 'evening-analysis'],
  ['evening-analysis-2', 'evening-analysis'],
  ['realtime-monitor', 'realtime-monitor'],
  ['realtime-pulse', 'realtime-pulse'],
  ['deep-inspection', 'deep-inspection'],
  ['week-ahead', 'week-ahead'],
  ['month-ahead', 'month-ahead'],
  ['quarter-ahead', 'quarter-ahead'],
  ['year-ahead', 'year-ahead'],
  ['election-cycle', 'election-cycle'],
  ['weekly-review', 'weekly-review'],
  ['monthly-review', 'monthly-review'],
]);

/**
 * Folders that exist under `analysis/daily/<date>/` but are NOT
 * publishable article subfolders. The renderer never produces
 * `news/<date>-<this-folder>-<lang>.html`, so the SEO corpus tests must
 * skip them.
 */
const NON_ARTICLE_SUBFOLDERS: ReadonlySet<string> = new Set([
  'pass1', 'templates', 'full-text', 'documents',
  'metadata-backfill',
]);

/**
 * Map a raw on-disk subfolder name (incl. `realtime-1219` timestamp
 * variants) to its canonical article-type id, or `null` for non-article
 * folders the renderer skips.
 */
export function classifySubfolder(name: string): string | null {
  if (NON_ARTICLE_SUBFOLDERS.has(name)) return null;
  const mapped = SUBFOLDER_TO_ARTICLE_TYPE.get(name);
  if (mapped) return mapped;
  if (/^realtime-\d{2,4}$/.test(name)) return 'realtime-pulse';
  return null;
}

/** Path bundle for a single (date, article-type) brief. */
export interface BriefSample {
  /** ISO date — the `analysis/daily/<date>` folder name. */
  readonly date: string;
  /** Canonical article-type id (`analysis/article-types.json#id`). */
  readonly articleTypeId: string;
  /** Raw on-disk subfolder (may differ from articleTypeId; see classifier). */
  readonly subfolder: string;
  /** Absolute path to `executive-brief.md` (English canonical source). */
  readonly englishBriefPath: string;
  /** Absolute path to `executive-brief.md` parent folder. */
  readonly briefDir: string;
  /**
   * Absolute path to each `executive-brief_<lang>.md` sibling that
   * exists on disk. Missing languages map to `null` — the EN fallback
   * path of `deriveBriefSeoOverrides` will be exercised when the test
   * encounters a `null`.
   */
  readonly localizedBriefPaths: Readonly<Record<Language, string | null>>;
}

/**
 * Read raw markdown for a brief. Returns `null` if the file is missing
 * or empty after `.trim()`.
 */
export function readBriefMarkdown(path: string | null): string | null {
  if (!path) return null;
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  return raw.trim().length === 0 ? null : raw;
}

/**
 * mulberry32 — a 32-bit deterministic PRNG. Same seed → identical
 * sequence on every CI run, every developer machine, every OS. Tests
 * that need different samples set different seeds.
 */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle in place, driven by a seeded PRNG so the picked
 * sample is reproducible across test runs.
 */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let CACHED_CORPUS: ReadonlyMap<string, readonly BriefSample[]> | null = null;

/**
 * Walk `analysis/daily/*` once and index every `executive-brief.md`
 * under each `<date>/<subfolder>/` by canonical article-type id. The
 * walk is cached for the lifetime of the test process — corpus contents
 * don't change between tests.
 */
export function loadBriefCorpus(): ReadonlyMap<string, readonly BriefSample[]> {
  if (CACHED_CORPUS) return CACHED_CORPUS;
  const index = new Map<string, BriefSample[]>();
  if (!existsSync(DAILY_DIR)) {
    CACHED_CORPUS = index;
    return index;
  }
  const dates = readdirSync(DAILY_DIR).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name));
  for (const date of dates) {
    const dateDir = join(DAILY_DIR, date);
    let subfolders: string[];
    try {
      subfolders = readdirSync(dateDir);
    } catch {
      continue;
    }
    for (const subfolder of subfolders) {
      const articleTypeId = classifySubfolder(subfolder);
      if (!articleTypeId) continue;
      const briefDir = join(dateDir, subfolder);
      const briefPath = join(briefDir, 'executive-brief.md');
      let isFile: boolean;
      try { isFile = statSync(briefPath).isFile(); } catch { isFile = false; }
      if (!isFile) continue;
      const localizedBriefPaths: Record<Language, string | null> =
        Object.fromEntries(LANGUAGES.map((lang) => {
          if (lang === 'en') return [lang, briefPath];
          const localised = join(briefDir, `executive-brief_${lang}.md`);
          return [lang, existsSync(localised) ? localised : null];
        })) as Record<Language, string | null>;
      const sample: BriefSample = {
        date,
        articleTypeId,
        subfolder,
        englishBriefPath: briefPath,
        briefDir,
        localizedBriefPaths,
      };
      const bucket = index.get(articleTypeId) ?? [];
      bucket.push(sample);
      index.set(articleTypeId, bucket);
    }
  }
  // Stable sort by date inside each bucket — pre-shuffle order is
  // deterministic so seeded sampling is reproducible across machines
  // (filesystem order is not portable).
  for (const bucket of index.values()) {
    bucket.sort((a, b) => a.date.localeCompare(b.date) || a.subfolder.localeCompare(b.subfolder));
  }
  CACHED_CORPUS = index;
  return index;
}

/**
 * Deterministically sample up to `n` briefs for an article type, using
 * the given seed. If fewer than `n` exist, returns all available briefs
 * (no padding with synthetic data — the test must cope).
 */
export function sampleBriefsForType(
  articleTypeId: string,
  n: number,
  seed: number,
): readonly BriefSample[] {
  const all = loadBriefCorpus().get(articleTypeId) ?? [];
  if (all.length <= n) return all;
  const pool = [...all];
  shuffle(pool, seededRng(seed));
  return pool.slice(0, n);
}

/** Convenience — repo root path resolver for downstream tests. */
export function repoRoot(): string { return REPO_ROOT; }
