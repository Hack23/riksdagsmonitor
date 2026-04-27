/**
 * @module Infrastructure/PoliticalIntelligence/Render/DailyDay
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Daily-day card renderer
 *
 * @description
 * Renders one `<article class="pi-day">…</article>` per DailyDay,
 * including the `<details>`-collapsed artifact list per stream. Pure
 * string builder.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { escapeHtml } from '../../sitemap-html/index.js';

import type { DailyDay } from '../daily-streams.js';
import { artifactTitle } from '../i18n/artifact-i18n.js';
import { METHODOLOGY_META } from '../i18n/methodology-i18n.js';
import { TEMPLATE_META } from '../i18n/template-i18n.js';
import {
  streamDescription,
  streamDisplayName,
  streamIcon,
} from '../i18n/stream-i18n.js';
import type { PiTranslations } from '../i18n/page-translations.js';

/**
 * Strip nested directory prefix from an artifact relative path so the
 * i18n title lookup sees just the filename
 * (e.g. `sub/executive-brief.md` → `executive-brief.md`).
 */
export function artifactBaseName(file: string): string {
  const idx = file.lastIndexOf('/');
  return idx >= 0 ? file.slice(idx + 1) : file;
}

/**
 * Pick the icon for an individual artifact filename. Looks at the curated
 * template + methodology metadata first, then falls back to filetype-based
 * heuristics (`.json` → 📊, `readme` → 📘, default → 📄).
 */
export function artifactIcon(file: string): string {
  const base = artifactBaseName(file);
  if (TEMPLATE_META[base]?.icon) return TEMPLATE_META[base].icon;
  if (METHODOLOGY_META[base]?.icon) return METHODOLOGY_META[base].icon;
  if (/\.json$/i.test(base)) return '📊';
  if (/readme/i.test(base)) return '📘';
  return '📄';
}

/**
 * Render one `<article class="pi-day">…</article>` for a single date,
 * including all its workflow streams and (optionally) the `<details>`-
 * collapsed artifact list per stream.
 */
export function renderDailyDay(day: DailyDay, t: PiTranslations, lang: Language): string {
  const streamsHtml = day.streams.map((s) => {
    const displayName = streamDisplayName(s.name, lang);
    const desc = streamDescription(s.name, lang);
    const artifactsHtml = s.artifacts.length > 0
      ? `
              <details class="pi-stream-artifacts">
                <summary class="pi-stream-artifacts-summary">
                  <span class="pi-stream-artifacts-toggle" aria-hidden="true">▸</span>
                  <span class="pi-stream-artifacts-label">${escapeHtml(t.expandArtifacts)}</span>
                  <span class="pi-stream-artifacts-count">(${s.artifacts.length})</span>
                </summary>
                <ol class="pi-artifact-list" aria-label="${s.artifacts.length} ${escapeHtml(t.artifactsLabel)} — ${escapeHtml(displayName)}">
${s.artifacts.map((a) => `                  <li class="pi-artifact"><a href="${a.githubUrl}" target="_blank" rel="noopener noreferrer"><span class="pi-artifact-icon" aria-hidden="true">${artifactIcon(a.file)}</span> <span class="pi-artifact-title">${escapeHtml(artifactTitle(artifactBaseName(a.file), lang))}</span> <code class="pi-artifact-file">${escapeHtml(a.file)}</code></a></li>`).join('\n')}
                </ol>
              </details>`
      : '';
    return `
            <li class="pi-stream">
              <a class="pi-stream-link" href="${s.githubUrl}" target="_blank" rel="noopener noreferrer">
                <span class="pi-stream-icon" aria-hidden="true">${streamIcon(s.name)}</span>
                <span class="pi-stream-name">${escapeHtml(displayName)}</span>
                <span class="pi-stream-count" aria-label="${s.artifactCount} ${escapeHtml(t.artifacts)}">${s.artifactCount}</span>
              </a>
              <p class="pi-stream-desc">${escapeHtml(desc)}</p>${artifactsHtml}
            </li>`;
  }).join('\n');

  return `
      <article class="pi-day">
        <header class="pi-day-header">
          <h3><time datetime="${day.date}">${day.date}</time></h3>
          <span class="pi-day-total" aria-label="${day.totalArtifacts} ${escapeHtml(t.artifacts)}">${day.totalArtifacts} ${escapeHtml(t.artifacts)}</span>
          <a class="pi-day-github" href="${day.githubUrl}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t.openOnGithub)} (${day.date})">
            <span aria-hidden="true">🔗</span> ${escapeHtml(t.openOnGithub)}
          </a>
        </header>
        <ul class="pi-streams">
${streamsHtml}
        </ul>
      </article>`;
}
