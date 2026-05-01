/**
 * @module Infrastructure/RenderLib/ArticleTypes
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Shared article-types registry helper
 *
 * @description
 * Loads `analysis/article-types.json` once and memoises lookup helpers
 * used by six downstream consumers:
 *   - aggregate-analysis.ts
 *   - render-articles.ts
 *   - validate-article.ts
 *   - generate-news-indexes (helpers.ts)
 *   - generate-rss (render/feed.ts)
 *   - generate-sitemap (scanners/news.ts)
 *
 * Re-uses the types already defined in `scripts/horizon-context.ts` to
 * avoid duplication.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ArticleTypeEntry, ArticleTypesRegistry } from '../horizon-context.js';

export type { ArticleTypeEntry, ArticleTypesRegistry };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..', '..');

let cached: ArticleTypesRegistry | null = null;

/**
 * Load the article-types registry. Cached after first read.
 */
export function loadArticleTypesRegistry(): ArticleTypesRegistry {
  if (cached) return cached;
  const registryPath = resolve(repoRoot, 'analysis/article-types.json');
  const raw = readFileSync(registryPath, 'utf8');
  cached = JSON.parse(raw) as ArticleTypesRegistry;
  return cached;
}

/**
 * Look up a single article-type entry by its `id` field.
 * Returns `undefined` when no match is found (caller decides whether to throw).
 */
export function getById(id: string): ArticleTypeEntry | undefined {
  const reg = loadArticleTypesRegistry();
  return reg.types.find((t) => t.id === id);
}

/**
 * Look up a single article-type entry by its `subfolder` field.
 * Returns `undefined` when no match is found.
 */
export function getBySubfolder(subfolder: string): ArticleTypeEntry | undefined {
  const reg = loadArticleTypesRegistry();
  return reg.types.find((t) => t.subfolder === subfolder);
}

/**
 * Return all entries belonging to a given `family`.
 */
export function listByFamily(
  family: 'single-type' | 'tier-c-aggregation' | 'long-horizon-forecast',
): readonly ArticleTypeEntry[] {
  const reg = loadArticleTypesRegistry();
  return reg.types.filter((t) => t.family === family);
}

/**
 * Return all registered types, sorted by horizonDays ascending.
 */
export function allTypesSortedByHorizon(): readonly ArticleTypeEntry[] {
  const reg = loadArticleTypesRegistry();
  return [...reg.types].sort((a, b) => a.horizonDays - b.horizonDays);
}

/**
 * Return the "Forward look" types (long-horizon-forecast family),
 * sorted by horizonDays ascending for display ordering:
 * week → month → quarter → year → election cycle.
 */
export function forwardLookTypes(): readonly ArticleTypeEntry[] {
  return listByFamily('long-horizon-forecast')
    .slice()
    .sort((a, b) => a.horizonDays - b.horizonDays);
}

/**
 * Reset the memoised cache — for testing only.
 */
export function __resetCache(): void {
  cached = null;
}
