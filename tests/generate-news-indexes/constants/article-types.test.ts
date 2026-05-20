/**
 * @module tests/generate-news-indexes/constants/article-types
 * @description NEW per Hack23/riksdagsmonitor#2624 — registry parity
 * between the news-index constants module and the canonical
 * `analysis/article-types.json` registry that drives the
 * `scripts/horizon-context.ts` runtime.
 *
 * Scope is narrow: this file does NOT duplicate the deep schema
 * validation in `tests/article-types.test.ts`. It only asserts the
 * specific invariants that the news-index renderer relies on, namely:
 *
 * 1. The 14-language list at `scripts/generate-news-indexes/constants/
 *    languages.ts` is the single source of truth and exposes every
 *    `coreLanguages` value used by any tier-A/B/C article type.
 * 2. Every workflow referenced by a registry entry exists as a
 *    `news-*.md` source under `.github/workflows/`.
 *
 * If these invariants fail, the news-index renderer will silently fail
 * to localise a tier-A/B/C article type, or will render a card for a
 * workflow that no longer ships.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { LANGUAGES } from '../../../scripts/generate-news-indexes/constants/languages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'analysis', 'article-types.json');
const WORKFLOWS_DIR = path.join(REPO_ROOT, '.github', 'workflows');

interface ArticleTypeEntry {
  readonly id: string;
  readonly family: 'single-type' | 'tier-c-aggregation' | 'long-horizon-forecast';
  readonly workflow: string;
  readonly coreLanguages: readonly string[];
}

interface ArticleTypesRegistry {
  readonly version: string;
  readonly types: readonly ArticleTypeEntry[];
}

const REGISTRY: ArticleTypesRegistry = JSON.parse(
  fs.readFileSync(REGISTRY_PATH, 'utf-8'),
) as ArticleTypesRegistry;

describe('generate-news-indexes/constants — registry parity vs analysis/article-types.json', () => {
  it('exposes every coreLanguages value as a key in the 14-language list', () => {
    const usedCodes = new Set<string>();
    for (const entry of REGISTRY.types) {
      for (const code of entry.coreLanguages) {
        usedCodes.add(code);
      }
    }
    const knownCodes = new Set(Object.keys(LANGUAGES));
    for (const code of usedCodes) {
      expect(knownCodes.has(code), `coreLanguage "${code}" missing from LANGUAGES`).toBe(true);
    }
  });

  it('every registry workflow file exists in .github/workflows/', () => {
    for (const entry of REGISTRY.types) {
      const workflowPath = path.join(WORKFLOWS_DIR, entry.workflow);
      expect(
        fs.existsSync(workflowPath),
        `workflow "${entry.workflow}" referenced by article-type "${entry.id}" must exist`,
      ).toBe(true);
    }
  });

  it('every registry entry uses one of the known families (tier-A/B/C surface)', () => {
    const knownFamilies = new Set(['single-type', 'tier-c-aggregation', 'long-horizon-forecast']);
    for (const entry of REGISTRY.types) {
      expect(
        knownFamilies.has(entry.family),
        `article-type "${entry.id}" has unknown family "${entry.family}"`,
      ).toBe(true);
    }
  });

  it('has at least one tier-C aggregation entry (week-ahead / month-ahead)', () => {
    const aggregations = REGISTRY.types.filter(t => t.family === 'tier-c-aggregation');
    expect(aggregations.length).toBeGreaterThan(0);
  });
});
