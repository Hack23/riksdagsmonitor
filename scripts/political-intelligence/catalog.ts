/**
 * @module Infrastructure/PoliticalIntelligence/Catalog
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Methodology + template catalog discovery
 *
 * @description
 * Walks `analysis/methodologies/` and `analysis/templates/` to discover
 * every reference document, attaches the curated metadata from
 * `i18n/methodology-i18n.ts` / `i18n/template-i18n.ts`, and produces an
 * ordered `CatalogEntry[]`. Pure with respect to the filesystem.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import { prettifyMarkdownTitle } from './i18n/artifact-i18n.js';

const GITHUB_BLOB = 'https://github.com/Hack23/riksdagsmonitor/blob/main';
const GITHUB_TREE = 'https://github.com/Hack23/riksdagsmonitor/tree/main';

export interface CatalogEntry {
  readonly file: string;
  readonly title: string;
  readonly icon: string;
  /** English description used as canonical fallback when a language lacks a translation. */
  readonly description: string;
  readonly githubUrl: string;
  /** Which library this entry belongs to (methodology vs template); drives i18n lookup. */
  readonly library: 'methodologies' | 'templates';
}

/** Curated icons and English high-level descriptions keyed by filename. */


/**
 * Build an absolute GitHub URL to a `blob` (single file) or `tree`
 * (directory) under the canonical `main` branch. Each path segment is
 * encoded individually so spaces and unicode work correctly.
 */
export function buildGithubUrl(type: 'blob' | 'tree', relative: string): string {
  const base = type === 'blob' ? GITHUB_BLOB : GITHUB_TREE;
  const encoded = relative.split('/').map(encodeURIComponent).join('/');
  return `${base}/${encoded}`;
}

/**
 * Walk a methodology / template directory and produce one `CatalogEntry`
 * per `.md` / `.json` file. Hidden files and subdirectories are skipped.
 * Sorted alphabetically by filename so output is stable across runs.
 */
export function collectCatalog(
  dir: string,
  relativePrefix: string,
  metaMap: Record<string, { icon: string; description: string }>,
  library: 'methodologies' | 'templates',
): CatalogEntry[] {
  if (!fs.existsSync(dir)) return [];
  const entries: CatalogEntry[] = [];
  for (const name of fs.readdirSync(dir).sort((a, b) => a.localeCompare(b))) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    if (!/\.(md|json)$/i.test(name)) continue;
    const meta = metaMap[name];
    entries.push({
      file: name,
      title: prettifyMarkdownTitle(name),
      icon: meta?.icon ?? (name.endsWith('.json') ? '📊' : '📄'),
      description: meta?.description ?? `${prettifyMarkdownTitle(name)} — reference document in the ${relativePrefix.split('/').pop()} library.`,
      githubUrl: buildGithubUrl('blob', `${relativePrefix}/${name}`),
      library,
    });
  }
  return entries;
}
