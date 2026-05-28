/**
 * @module Infrastructure/RenderLib/ArticleAside
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reusable article-aside renderers (reader navigation, analysis-artifacts
 *       reference, methods reference)
 *
 * @description
 * Pure HTML-string builders for the three side-block sections that every
 * generated article shares:
 *
 *   1. **Reader navigation** — the localised Reader Intelligence Guide
 *      table that appears immediately after the executive brief so the
 *      reader knows where each value lens lives in the article.
 *   2. **Analysis-artifacts reference** — the card grid at the very end
 *      that links every consumed analysis artifact back to its
 *      auditable GitHub blob.
 *   3. **Methods reference** — the four methodology cards (OSINT /
 *      AI-FIRST / SWOT / Traceable) plus a CTA back to the
 *      `political-intelligence` catalogue. Rendered immediately after
 *      the analysis-artifacts reference so the reader sees the
 *      "evidence → methods" pair at the article's foot.
 *
 * All three functions are pure: same inputs → same HTML, no I/O. They
 * are extracted from `render-lib/article.ts` so the same building
 * blocks can be reused by every article-type renderer (current and
 * future) without duplicating the i18n / icon / accessibility wiring.
 *
 * Output ordering rule (single source of truth):
 *
 *   `header → lead → reader-navigation → rest → analysis-artifacts →
 *    methods → footer`
 *
 * The user-visible "reference of analysis artifacts at the end with
 * methods after" contract is enforced by tests in
 * `tests/article-aside.test.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import { LANGUAGE_META, escapeHtml } from '../sitemap-html/index.js';
import { buildGithubBlobUrl } from './url-helpers.js';
import { depth } from './chrome/helpers.js';
import { artifactTitle, artifactIcon } from '../political-intelligence/i18n/artifact-i18n.js';
import { readerGuideI18n } from './aggregator/reader-guide-i18n.js';
import { readerValueFor } from './aggregator/reader-guide-descriptions-i18n.js';
import { READER_GUIDE_ENTRIES, anchorForTitle, auditAnchorForArtifacts, hasPerDocumentAnalyses, selectReaderGuideArtifacts } from './aggregator/reader-guide.js';
import { titleForArtifact } from './aggregator/order.js';
import { buildPoliticalContextModel } from './political-context.js';

// ─────────────────────────────────────────────────────────────────────────
// Reader navigation (compact localised table)
// ─────────────────────────────────────────────────────────────────────────

export interface ReaderNavigationInput {
  readonly lang: Language;
  /** Ordered list of artifact filenames consumed by the article. */
  readonly artifactsUsed: readonly string[];
}

/**
 * Render the localised Reader Intelligence Guide navigation table that
 * appears between the executive brief (lead) and the rest of the
 * article body.
 *
 * Iterates over **all** analysis artifacts consumed by the article so
 * the guide acts as a complete, navigable index — not just the
 * curated {@link READER_GUIDE_ENTRIES} lenses. Each row carries an
 * artifact icon, the localised section label (anchor link) and a
 * reader-value description; the legacy "Source artifact" filename
 * column is dropped (audit-grade traceability now lives exclusively in
 * the Analysis Sources card grid at the article foot).
 *
 * Curated lenses use their bespoke `entries[*]` description; non-
 * curated artifacts fall back to the localised
 * {@link ReaderGuideChrome.defaultReaderValue} so every row carries
 * meaningful copy in all 14 languages.
 *
 * Always produces a non-empty table because the audit-appendix row is
 * unconditionally appended regardless of which artifacts matched.
 */
export function renderReaderNavigation(input: ReaderNavigationInput): string {
  const guideI18n = readerGuideI18n(input.lang);
  const guideChrome = guideI18n.chrome;

  const rootArtifacts = selectReaderGuideArtifacts(input.artifactsUsed);
  const hasDocAnalyses = hasPerDocumentAnalyses(input.artifactsUsed);

  const guideRows = rootArtifacts.map((file) => {
    const sectionTitle = titleForArtifact(file);
    const anchor = anchorForTitle(sectionTitle);
    const localised = guideI18n.entries[file];
    const curated = READER_GUIDE_ENTRIES.find((e) => e.file === file);
    const label =
      localised?.label
      ?? curated?.label
      ?? (artifactTitle(file, input.lang) || sectionTitle);
    const readerValue =
      localised?.readerValue
      ?? readerValueFor(file, input.lang)
      ?? curated?.readerValue
      ?? guideChrome.defaultReaderValue;
    const icon = artifactIcon(file);
    return `            <tr>
              <td class="rm-reader-guide-icon"><span aria-hidden="true">${icon}</span></td>
              <td><a href="#${anchor}">${escapeHtml(label)}</a></td>
              <td>${escapeHtml(readerValue)}</td>
            </tr>`;
  });

  if (hasDocAnalyses) {
    guideRows.push(`            <tr>
              <td class="rm-reader-guide-icon"><span aria-hidden="true">📑</span></td>
              <td><a href="#rm-per-document-intelligence">${escapeHtml(guideChrome.perDocLabel)}</a></td>
              <td>${escapeHtml(guideChrome.perDocValue)}</td>
            </tr>`);
  }

  guideRows.push(`            <tr>
              <td class="rm-reader-guide-icon"><span aria-hidden="true">🏷️</span></td>
              <td><a href="#${auditAnchorForArtifacts(input.artifactsUsed)}">${escapeHtml(guideChrome.auditLabel)}</a></td>
              <td>${escapeHtml(guideChrome.auditValue)}</td>
            </tr>`);

  return `
      <section class="rm-reader-guide" aria-labelledby="rm-reader-guide-heading">
        <h2 id="rm-reader-guide-heading"><span class="rm-icon" aria-hidden="true">🧭</span> ${escapeHtml(guideChrome.heading)}</h2>
        <p class="rm-reader-guide-desc">${escapeHtml(guideChrome.preamble)}</p>
        <div class="rm-table-wrap">
          <table class="rm-reader-guide-table">
            <thead>
              <tr>
                <th scope="col" class="rm-reader-guide-icon-col"><span class="sr-only">${escapeHtml(guideChrome.colIcon)}</span></th>
                <th scope="col">${escapeHtml(guideChrome.colReaderNeed)}</th>
                <th scope="col">${escapeHtml(guideChrome.colWhatYouGet)}</th>
              </tr>
            </thead>
            <tbody>
${guideRows.join('\n')}
            </tbody>
          </table>
        </div>
      </section>`;
}

// ─────────────────────────────────────────────────────────────────────────
// Analysis-artifacts reference (sources cards at the article's foot)
// ─────────────────────────────────────────────────────────────────────────

export interface AnalysisArtifactsReferenceInput {
  readonly lang: Language;
  readonly artifactsUsed: readonly string[];
  /** Repo-relative path that hosts the artifacts (e.g. `analysis/daily/2026-04-23/propositions`). */
  readonly subfolderRepoRelPath?: string;
}

/**
 * Render the analysis-artifacts reference card grid. Used as the
 * end-of-article provenance block. Returns the empty string when there
 * are no artifacts so callers can concatenate without conditionals.
 */
export function renderAnalysisArtifactsReference(
  input: AnalysisArtifactsReferenceInput,
): string {
  const artifacts = input.artifactsUsed;
  if (artifacts.length === 0) return '';

  const langMeta = LANGUAGE_META[input.lang];
  const sourcesHeading = langMeta.translations.articleSourcesHeading;
  const sourcesDesc = langMeta.translations.articleSourcesDesc;
  const methodologyLabel = langMeta.translations.articleMethodologyLabel;

  const guideI18n = readerGuideI18n(input.lang);
  const sourceCards = artifacts
    .map((a) => {
      const href = input.subfolderRepoRelPath
        ? buildGithubBlobUrl(`${input.subfolderRepoRelPath}/${a}`)
        : a;
      const icon = artifactIcon(a);
      const title = artifactTitle(a, input.lang);
      const baseName = a.replace(/^documents\//, '');
      const localisedEntry = guideI18n.entries[baseName] ?? guideI18n.entries[a];
      const curatedEntry = READER_GUIDE_ENTRIES.find((e) => e.file === baseName || e.file === a);
      const isPerDocAnalysis = a.startsWith('documents/') && a.endsWith('-analysis.md');
      const description =
        localisedEntry?.readerValue
        ?? readerValueFor(a, input.lang)
        ?? curatedEntry?.readerValue
        ?? (isPerDocAnalysis ? guideI18n.chrome.perDocValue : guideI18n.chrome.defaultReaderValue);
      return `          <a class="rm-source-card" href="${href}" target="_blank" rel="noopener noreferrer">
            <span class="rm-source-card-icon" aria-hidden="true">${icon}</span>
            <span class="rm-source-card-info">
              <span class="rm-source-card-title">${escapeHtml(title)}</span>
              <span class="rm-source-card-desc">${escapeHtml(description)}</span>
              <code class="rm-source-card-file">${escapeHtml(a)}</code>
            </span>
            <span class="rm-source-card-arrow" aria-hidden="true">↗</span>
          </a>`;
    })
    .join('\n');

  return `
      <section id="rm-article-sources" class="rm-article-sources" aria-labelledby="rm-article-sources-heading">
        <h2 id="rm-article-sources-heading"><span class="rm-icon" aria-hidden="true">📋</span> ${escapeHtml(sourcesHeading)}</h2>
        <p>${escapeHtml(sourcesDesc)}</p>
        <details class="rm-article-methodology" open>
          <summary><span class="rm-icon" aria-hidden="true">🔬</span> ${escapeHtml(methodologyLabel)} <span class="rm-source-count">(${artifacts.length})</span></summary>
          <div class="rm-article-sources-grid">
${sourceCards}
          </div>
        </details>
      </section>`;
}

// ─────────────────────────────────────────────────────────────────────────
// Methods reference (4 methodology cards + catalogue CTA)
// ─────────────────────────────────────────────────────────────────────────

export interface MethodsReferenceInput {
  readonly lang: Language;
  /** Canonical path of the article — used to compute the relative depth back to the catalogue. */
  readonly canonicalPath: string;
}

/**
 * Render the four methodology cards (OSINT / AI-FIRST / SWOT /
 * Traceable) plus a CTA back to `political-intelligence_$lang.html`.
 * This block intentionally renders **after** the analysis-artifacts
 * reference so readers see the "evidence → methods" pair at the foot
 * of every article — the user-visible "reference of analysis artifacts
 * at the end with methods after" contract.
 */
export function renderMethodsReference(input: MethodsReferenceInput): string {
  const t = LANGUAGE_META[input.lang].translations;
  const prefix = depth(input.canonicalPath);
  const piFile = input.lang === 'en'
    ? 'political-intelligence.html'
    : `political-intelligence_${input.lang}.html`;

  return `
      <section class="rm-methods-reference" aria-labelledby="rm-methods-reference-heading">
        <h2 id="rm-methods-reference-heading"><span class="rm-icon" aria-hidden="true">🔬</span> ${escapeHtml(t.articleReaderGuideHeading)}</h2>
        <p class="rm-methods-reference-desc">${escapeHtml(t.articleReaderGuideDesc)}</p>
        <div class="rm-reader-guide-grid">
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🕵️</div>
            <h3>${escapeHtml(t.articleReaderGuideOsint)}</h3>
            <p>${escapeHtml(t.articleReaderGuideOsintDesc)}</p>
          </div>
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🤖</div>
            <h3>${escapeHtml(t.articleReaderGuideAiFirst)}</h3>
            <p>${escapeHtml(t.articleReaderGuideAiFirstDesc)}</p>
          </div>
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🧮</div>
            <h3>${escapeHtml(t.articleReaderGuideSwot)}</h3>
            <p>${escapeHtml(t.articleReaderGuideSwotDesc)}</p>
          </div>
          <div class="rm-reader-guide-card">
            <div class="rm-reader-guide-card-icon" aria-hidden="true">🔗</div>
            <h3>${escapeHtml(t.articleReaderGuideTraceable)}</h3>
            <p>${escapeHtml(t.articleReaderGuideTraceableDesc)}</p>
          </div>
        </div>
        <p class="rm-reader-guide-cta"><a href="${prefix}${piFile}"><span class="rm-icon" aria-hidden="true">📚</span> ${escapeHtml(t.articleReaderGuideMoreMethodologies)}</a></p>
      </section>`;
}

// ─────────────────────────────────────────────────────────────────────────
// Political context (collapsible onboarding block)
// ─────────────────────────────────────────────────────────────────────────

export interface PoliticalContextInput {
  readonly lang: Language;
  readonly markdown: string;
}

export function renderPoliticalContext(input: PoliticalContextInput): string {
  const model = buildPoliticalContextModel(input.markdown, input.lang);

  const partyCards = model.partyCards
    .map((p) => `          <li><strong>${escapeHtml(p.abbreviation)}</strong> ${escapeHtml(p.name)} — ${escapeHtml(p.description)} <span class="rm-political-context-meta">Seats: ${p.seats}/349 | Position: ${escapeHtml(p.position)} | Government role: ${escapeHtml(p.governmentRole)}</span></li>`)
    .join('\n');

  const comparisons = model.comparativeAnchors
    .slice(0, 3)
    .map((item) => `          <li>${escapeHtml(item)}</li>`)
    .join('\n');

  return `
      <details class="rm-political-context" open>
        <summary aria-label="${escapeHtml(model.labels.summary)}">${escapeHtml(model.labels.summary)}</summary>
        <div class="rm-political-context-body">
          <h2>${escapeHtml(model.labels.heading)}</h2>
          <h3>${escapeHtml(model.labels.govHeading)}</h3>
          <p>${escapeHtml(model.governmentComposition)}</p>
          <h3>${escapeHtml(model.labels.spectrumHeading)}</h3>
          <ul>
${model.spectrum.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
          <h3>${escapeHtml(model.labels.institutionsHeading)}</h3>
          <ul>
${model.institutions.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
${comparisons.length > 0 ? `          <h3>${escapeHtml(model.labels.comparisonsHeading)}</h3>
          <ul>
${comparisons}
          </ul>` : ''}
${partyCards.length > 0 ? `          <h3>${escapeHtml(model.labels.actorsHeading)}</h3>
          <ul class="rm-political-context-actors">
${partyCards}
          </ul>` : ''}
        </div>
      </details>`;
}
