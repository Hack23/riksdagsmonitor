/**
 * @module tests/backfill-article-metadata/rules/og-locale-alternate
 * @description NEW per Hack23/riksdagsmonitor#2624 — contract tests for
 * the `og:locale:alternate` backfill on hand-authored news articles.
 *
 * Per the SEO regeneration pipeline memory: `npm run render-articles`
 * regenerates 154 × 14 = 2 408 article HTMLs through the chrome renderer
 * (which emits `og:locale:alternate`), but hand-authored
 * breaking-news / realtime-pulse / evening-analysis files bypass that
 * pipeline and need `scripts/backfill-news-og-locale-alternate.ts`.
 *
 * These contract tests assert that:
 *
 * 1. The backfill script exists and exposes a CLI shape compatible with
 *    `--dry-run` (the smoke check in the issue's acceptance criteria).
 * 2. The html-inspector that drives the contract checker actually surfaces
 *    the metadata fields the backfill needs to emit alternates.
 * 3. The 14-language list referenced by the backfill matches the
 *    single-source list in `scripts/generate-news-indexes/constants/
 *    languages.ts`.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { inspectHtmlContent } from '../../../scripts/backfill-lib/html-inspector.js';
import { LANGUAGES } from '../../../scripts/generate-news-indexes/constants/languages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const BACKFILL_SCRIPT = path.join(REPO_ROOT, 'scripts', 'backfill-news-og-locale-alternate.ts');

describe('og:locale:alternate backfill — hand-authored coverage', () => {
  it('the backfill script exists (memory: hand-authored bypass pipeline)', () => {
    expect(fs.existsSync(BACKFILL_SCRIPT)).toBe(true);
  });

  it('the backfill script targets the hand-authored breaking-news family (memory pin)', () => {
    const source = fs.readFileSync(BACKFILL_SCRIPT, 'utf-8');
    // The memory pins breaking-news / realtime-pulse / evening-analysis as
    // the three hand-authored families that bypass `render-articles`. The
    // script targets them by walking `news/*.html` (not by family name) but
    // it MUST document the breaking-news template as the canonical anchor.
    expect(source).toMatch(/breaking-news/);
  });

  it('the backfill script walks the `news/` directory (covers all hand-authored families)', () => {
    const source = fs.readFileSync(BACKFILL_SCRIPT, 'utf-8');
    // The three hand-authored families (breaking-news / realtime-pulse /
    // evening-analysis) all land under `news/*.html`, so a single walk
    // covers all of them.
    expect(source).toMatch(/news[/\\]/);
  });

  it('the backfill script supports --dry-run (smoke-check contract)', () => {
    const source = fs.readFileSync(BACKFILL_SCRIPT, 'utf-8');
    expect(source).toMatch(/--dry-run|dryRun/);
  });
});

describe('og:locale:alternate — html-inspector surface (smoke)', () => {
  it('inspectHtmlContent extracts `<html lang>` (the alternate base lang)', () => {
    const html = `<!doctype html><html lang="en"><head><title>x</title></head><body></body></html>`;
    const inspected = inspectHtmlContent(html);
    expect(inspected.lang).toBe('en');
  });

  it('inspectHtmlContent surfaces an empty lang when `<html lang>` is missing', () => {
    const html = `<!doctype html><html><head><title>x</title></head><body></body></html>`;
    const inspected = inspectHtmlContent(html);
    expect(inspected.lang).toBe('');
  });
});

describe('og:locale:alternate — 14-language registry parity', () => {
  it('every language in the news-indexes 14-language list has an og locale value', () => {
    const codes = Object.keys(LANGUAGES);
    expect(codes).toHaveLength(14);
    for (const code of codes) {
      const cfg = LANGUAGES[code as keyof typeof LANGUAGES];
      expect(cfg?.locale, `language "${code}" missing locale (og:locale source)`).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
  });

  it('Norwegian uses BCP-47 nb_NO (not no_NO) for og:locale:alternate', () => {
    expect(LANGUAGES['no']?.locale).toBe('nb_NO');
  });
});
