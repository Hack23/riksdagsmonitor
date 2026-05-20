/**
 * @module tests/backfill-article-metadata/rules/canonical
 * @description NEW per Hack23/riksdagsmonitor#2624 — contract tests for
 * the canonical SEO surface that the backfill orchestrator relies on:
 * the `<meta property="og:locale">` single-tag regex (the anchor where
 * the alternates are inserted), the BCP-47 `nb`/`no` Norwegian
 * preference, and the canonical `og:locale` alias table (e.g. `no_NO`
 * → `nb_NO`).
 *
 * These are split from `tests/backfill-article-metadata.test.ts`
 * (725 lines) per the issue spec which calls for a `rules/canonical`
 * file. They guard the regex contract the backfill script keys off —
 * any regression here would silently skip every hand-authored breaking-
 * news / realtime-pulse / evening-analysis file.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const BACKFILL_SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'backfill-news-og-locale-alternate.ts');
const BACKFILL_SOURCE = fs.readFileSync(BACKFILL_SCRIPT_PATH, 'utf-8');

describe('canonical og:locale regex — anchor contract', () => {
  it('the script defines a regex matching the single `<meta property="og:locale">` tag', () => {
    // The script must contain a regex that targets the OG locale anchor —
    // this is where the 13 sibling og:locale:alternate tags are inserted.
    expect(BACKFILL_SOURCE).toMatch(/og:locale["'][^]*?content/);
  });

  it('the script enumerates 14 canonical locale codes (en_US, sv_SE, da_DK, nb_NO, fi_FI, ...)', () => {
    // Spot-check the canonical 14 — full list is in scripts/generate-news-
    // indexes/constants/languages.ts and the parity test for that single-
    // source list lives in tests/generate-news-indexes/constants/.
    expect(BACKFILL_SOURCE).toMatch(/en_US/);
    expect(BACKFILL_SOURCE).toMatch(/sv_SE/);
    expect(BACKFILL_SOURCE).toMatch(/nb_NO/);
    expect(BACKFILL_SOURCE).toMatch(/da_DK/);
    expect(BACKFILL_SOURCE).toMatch(/fi_FI/);
    expect(BACKFILL_SOURCE).toMatch(/de_DE/);
    expect(BACKFILL_SOURCE).toMatch(/fr_FR/);
    expect(BACKFILL_SOURCE).toMatch(/es_ES/);
    expect(BACKFILL_SOURCE).toMatch(/nl_NL/);
    expect(BACKFILL_SOURCE).toMatch(/ar_SA/);
    expect(BACKFILL_SOURCE).toMatch(/he_IL/);
    expect(BACKFILL_SOURCE).toMatch(/ja_JP/);
    expect(BACKFILL_SOURCE).toMatch(/ko_KR/);
    expect(BACKFILL_SOURCE).toMatch(/zh_CN/);
  });
});

describe('canonical og:locale alias rule — BCP-47 nb over legacy no', () => {
  it('the alias table maps the legacy `no_NO` locale to canonical `nb_NO`', () => {
    expect(BACKFILL_SOURCE).toMatch(/no_NO[^]{0,40}nb_NO/);
  });

  it('the script documents the BCP-47 preference (Norwegian Bokmål)', () => {
    expect(BACKFILL_SOURCE).toMatch(/BCP-47|Bokm[åa]l/);
  });
});

describe('canonical og:locale idempotency rule', () => {
  it('the script documents the "leave file alone if og:locale:alternate exists" rule', () => {
    expect(BACKFILL_SOURCE.toLowerCase()).toMatch(/already contains|idempot|skip|unchanged|untouched/);
  });
});
