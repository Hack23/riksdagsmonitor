/**
 * @module scripts/generate-article-types-doc
 * @description Reads `analysis/article-types.json` and replaces the content
 *              between `<!-- ARTICLE-TYPES:BEGIN -->` / `<!-- ARTICLE-TYPES:END -->`
 *              sentinels in `Article-Generation.md` with an auto-generated
 *              Markdown table.
 *
 *              Invoked as part of `prebuild` in `package.json`.
 *              Idempotent — running twice produces the same file.
 *              Exits non-zero if the registry fails structural validation.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ArticleTypesRegistry, ArticleTypeEntry } from './horizon-context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const SENTINEL_BEGIN = '<!-- ARTICLE-TYPES:BEGIN -->';
const SENTINEL_END = '<!-- ARTICLE-TYPES:END -->';

/**
 * Load and validate the article-types registry.
 */
export function loadAndValidateRegistry(registryPath: string): ArticleTypesRegistry {
  const raw = readFileSync(registryPath, 'utf8');
  const registry: ArticleTypesRegistry = JSON.parse(raw);

  if (!registry.version || !registry.types || !Array.isArray(registry.types)) {
    throw new Error('Invalid registry: missing version or types array');
  }
  if (registry.types.length === 0) {
    throw new Error('Invalid registry: types array is empty');
  }
  for (const t of registry.types) {
    if (!t.id || !t.family || t.horizonDays == null || t.tierCMultiplier == null) {
      throw new Error(`Invalid registry entry: missing required fields in type "${t.id ?? '(unknown)'}"`);
    }
  }
  return registry;
}

/**
 * Render the article-types Markdown table from the registry.
 */
export function renderTable(types: readonly ArticleTypeEntry[]): string {
  const header = '| id | family | horizonDays | tierCMultiplier | articleWordFloor | electionCycleAnchor | cronExpression |';
  const separator = '|---|---|---|---|---|---|---|';

  const rows = types.map((t) => {
    const cron = t.dispatchOnly ? '_dispatch-only_' : `\`${t.cronExpression ?? '—'}\``;
    return `| ${t.id} | ${t.family} | ${t.horizonDays} | ${t.tierCMultiplier} | ${t.articleWordFloor} | ${t.electionCycleAnchor} | ${cron} |`;
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * Replace content between sentinels in the target document.
 * Returns the updated document content.
 */
export function replaceBetweenSentinels(doc: string, table: string): string {
  const beginIdx = doc.indexOf(SENTINEL_BEGIN);
  const endIdx = doc.indexOf(SENTINEL_END);

  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(
      `Sentinels not found in document. Expected "${SENTINEL_BEGIN}" and "${SENTINEL_END}"`,
    );
  }
  if (endIdx <= beginIdx) {
    throw new Error('ARTICLE-TYPES:END sentinel appears before ARTICLE-TYPES:BEGIN');
  }

  const before = doc.slice(0, beginIdx + SENTINEL_BEGIN.length);
  const after = doc.slice(endIdx);

  const warning = '<!-- ⚠️ AUTO-GENERATED from analysis/article-types.json — do NOT edit manually -->';

  return `${before}\n${warning}\n\n${table}\n\n${after}`;
}

/**
 * Main entry point — generates the table and writes the doc.
 */
export function generate(
  registryPath: string = resolve(repoRoot, 'analysis/article-types.json'),
  docPath: string = resolve(repoRoot, 'Article-Generation.md'),
): void {
  const registry = loadAndValidateRegistry(registryPath);
  const table = renderTable(registry.types);
  const doc = readFileSync(docPath, 'utf8');
  const updated = replaceBetweenSentinels(doc, table);
  writeFileSync(docPath, updated, 'utf8');
}

// Run when executed directly
const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  try {
    generate();
    console.log('✅ Article-Generation.md article-types table regenerated.');
  } catch (err: unknown) {
    console.error('❌', (err as Error).message);
    process.exit(1);
  }
}
