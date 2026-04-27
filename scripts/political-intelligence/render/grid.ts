/**
 * @module Infrastructure/PoliticalIntelligence/Render/Grid
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Catalog grid (`.pi-grid` / `.pi-card`) renderer
 *
 * @description
 * Renders one `<article class="pi-card">…</article>` per CatalogEntry.
 * Pure string builder with no filesystem access — accepts the entries
 * array and the localised "Open on GitHub" button label.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { escapeHtml } from '../../sitemap-html/index.js';

import type { CatalogEntry } from '../catalog.js';
import { artifactTitle, localisedCatalogDescription } from '../i18n/artifact-i18n.js';

/**
 * Render the catalog grid as one `<article class="pi-card">` per entry.
 * The returned string is a fragment — no surrounding `<div class="pi-grid">`
 * wrapper.
 */
export function renderCatalogGrid(
  entries: readonly CatalogEntry[],
  openLabel: string,
  lang: Language,
): string {
  return entries.map((e) => {
    const desc = localisedCatalogDescription(e.file, lang, e.library, e.description);
    const title = artifactTitle(e.file, lang) || e.title;
    return `
        <article class="pi-card">
          <div class="pi-card-icon" aria-hidden="true">${e.icon}</div>
          <h3 class="pi-card-title"><a href="${e.githubUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
          <p class="pi-card-desc">${escapeHtml(desc)}</p>
          <p class="pi-card-meta"><code class="pi-card-file">${escapeHtml(e.file)}</code></p>
          <p class="pi-card-link"><a href="${e.githubUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(openLabel)} <span aria-hidden="true">↗</span></a></p>
        </article>`;
  }).join('\n');
}
