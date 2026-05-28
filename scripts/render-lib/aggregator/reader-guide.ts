/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuide
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide table builder + anchor slug parity
 *
 * @description
 * Builds the deterministic "Reader Intelligence Guide" navigation table
 * injected immediately after the executive brief in every aggregated
 * article. Mirrors the slug algorithm used by the rendered heading IDs
 * so its `#anchor` links resolve.
 *
 * The slug-mirror function {@link anchorForTitle} is the single
 * cross-module consumer of {@link HEADING_ID_PREFIX} from the markdown
 * module — keeping the Reader Intelligence Guide and the rendered
 * heading IDs in lock-step is a hard contract (broken slugs = broken
 * navigation).
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import GithubSlugger from 'github-slugger';

import type { Language } from '../../types/language.js';
import { HEADING_ID_PREFIX } from '../markdown/sanitize-schema.js';
import { artifactIcon } from '../../political-intelligence/i18n/artifact-i18n.js';
import { AGGREGATION_ORDER, aliasGroupFor, titleForArtifact } from './order.js';
import { readerGuideI18n } from './reader-guide-i18n.js';
import { readerValueFor } from './reader-guide-descriptions-i18n.js';

/**
 * Reader Intelligence Guide row shape. Each entry maps an analysis
 * artifact filename to the journalist-value lens the row exposes
 * (column 2) and the human label rendered as the link text (column 1).
 */
export interface ReaderGuideEntry {
  readonly file: string;
  readonly label: string;
  readonly readerValue: string;
}

/**
 * Curated list of journalist-value lenses surfaced by the Reader
 * Intelligence Guide, in display order. Each entry corresponds to one
 * artifact in {@link ../order.js#AGGREGATION_ORDER}; entries whose
 * artifact is missing from a given subfolder are filtered out.
 *
 * Order mirrors the journalist-optimal narrative arc: BLUF → Key
 * Judgments → so-what ranking → forward indicators → scenarios → risk
 * register → narrative-environment / influence-operations LAST so
 * readers form their own view of substance before being shown how the
 * story is being framed.
 */
export const READER_GUIDE_ENTRIES: readonly ReaderGuideEntry[] = [
  {
    file: 'executive-brief.md',
    label: 'Lede and editorial decisions',
    readerValue: 'fast answer to what happened, why it matters, who is accountable, and the next dated trigger',
  },
  {
    file: 'intelligence-assessment.md',
    label: 'Key Judgments',
    readerValue: 'confidence-bearing political-intelligence conclusions and collection gaps',
  },
  {
    file: 'significance-scoring.md',
    label: 'Significance scoring',
    readerValue: 'why this story outranks or trails other same-day parliamentary signals',
  },
  {
    file: 'forward-indicators.md',
    label: 'Forward indicators',
    readerValue: 'dated watch items that let readers verify or falsify the assessment later',
  },
  {
    file: 'scenario-analysis.md',
    label: 'Scenarios',
    readerValue: 'alternative outcomes with probabilities, triggers, and warning signs',
  },
  {
    file: 'risk-assessment.md',
    label: 'Risk assessment',
    readerValue: 'policy, electoral, institutional, communications, and implementation risk register',
  },
  {
    file: 'media-framing-analysis.md',
    label: 'Media framing & influence operations',
    readerValue:
      'frame packages with Entman functions, cognitive-vulnerability map, DISARM manipulation indicators, narrative-laundering chain, comparative-international cognates, frame lifecycle and half-life, RRPA impact, an Outlet Bias Audit (no outlet is neutral — every outlet declared with ownership, funding, board-appointment authority and editorial lean), and the L1–L5 counter-resilience ladder',
  },
];

/**
 * Generate the same heading anchor that the renderer emits downstream.
 *
 * `rehype-slug` delegates to `github-slugger` (the GitHub heading slug
 * algorithm), and `rehype-sanitize` then prefixes every emitted ID with
 * {@link HEADING_ID_PREFIX} as a DOM-clobbering mitigation. We mirror
 * both steps here so the Reader Intelligence Guide's `#anchor` links
 * resolve to the rendered IDs across punctuation, Unicode and
 * duplicate-heading cases.
 *
 * A fresh `GithubSlugger` instance is used per call so the function is
 * stateless — duplicate-heading disambiguation is not relevant for the
 * Reader Intelligence Guide because each guide entry maps to a unique
 * canonical artifact section title.
 */
export function anchorForTitle(title: string): string {
  const cleaned = title.replace(/^[^\p{L}\p{N}]+/u, '').trim() || title;
  const slug = new GithubSlugger().slug(cleaned);
  return `${HEADING_ID_PREFIX}${slug}`;
}

/**
 * Filter a set of consumed artifact filenames down to the artifacts
 * that the aggregator actually emits as top-level `## <title>`
 * sections in the rendered article — the exact set the Reader
 * Intelligence Guide can hyperlink to.
 *
 * Mirrors the same selection / de-duplication rules used by
 * {@link ./aggregate.ts} (the article aggregator):
 *
 * 1. Only `*.md` artifacts are eligible (`*.json` artifacts are
 *    referenced by the audit-appendix row, not by their own section).
 * 2. `documents/*-analysis.md` entries are folded into the single
 *    "Per-document intelligence" row by the caller, so they're
 *    excluded here.
 * 3. `README.md`, `article.md`, `article.<lang>.md` are aggregator
 *    outputs / metadata, not analytical sections — excluded.
 * 4. Filename-variant alias groups are de-duplicated: when more than
 *    one alias is present (e.g. `election-2026-analysis.md` vs
 *    `election-cycle-analysis.md`), only the first member encountered
 *    in {@link AGGREGATION_ORDER} is kept — matching the aggregator's
 *    "first one wins" behaviour so the link's target heading exists.
 *
 * Returns artifacts ordered the same way the article body orders them:
 * `AGGREGATION_ORDER` precedence first, then any remaining `*.md`
 * artifacts alphabetically.
 */
export function selectReaderGuideArtifacts(available: ReadonlySet<string> | readonly string[]): string[] {
  const availableSet = available instanceof Set ? available : new Set(available);

  const isReaderGuideEligible = (file: string): boolean => {
    if (!/\.md$/i.test(file)) return false;
    if (file.startsWith('documents/')) return false;
    const base = file.includes('/') ? file.slice(file.lastIndexOf('/') + 1) : file;
    if (base === 'README.md') return false;
    if (/^article(?:\.[a-z-]+)?\.md$/i.test(base)) return false;
    return true;
  };

  const seenAliasMembers = new Set<string>();
  const result: string[] = [];

  for (const file of AGGREGATION_ORDER) {
    if (!availableSet.has(file)) continue;
    if (!isReaderGuideEligible(file)) continue;
    const aliases = aliasGroupFor(file);
    if (aliases) {
      if ([...aliases].some((a) => seenAliasMembers.has(a))) continue;
      seenAliasMembers.add(file);
    }
    result.push(file);
  }

  const remaining = [...availableSet]
    .filter(isReaderGuideEligible)
    .filter((f) => !result.includes(f))
    .filter((f) => !AGGREGATION_ORDER.includes(f))
    .sort();
  for (const file of remaining) {
    const aliases = aliasGroupFor(file);
    if (aliases) {
      if ([...aliases].some((a) => seenAliasMembers.has(a))) continue;
      seenAliasMembers.add(file);
    }
    result.push(file);
  }

  return result;
}

/**
 * Returns true when at least one entry in `artifactsUsed` is a
 * per-document analysis (`documents/<dok_id>-analysis.md`). Used by
 * both the markdown and HTML Reader Intelligence Guide renderers to
 * decide whether to emit the single "Per-document intelligence" row.
 */
export function hasPerDocumentAnalyses(artifactsUsed: ReadonlySet<string> | readonly string[]): boolean {
  const iter = artifactsUsed instanceof Set ? artifactsUsed : new Set(artifactsUsed);
  for (const file of iter) {
    if (file.startsWith('documents/') && file.endsWith('-analysis.md')) return true;
  }
  return false;
}

const AUDIT_ANCHOR_CANDIDATES = [
  'classification-results.md',
  'political-classification.md',
  'cross-reference-map.md',
  'methodology-reflection.md',
  'data-download-manifest.md',
] as const;

/**
 * Resolve the audit-row link to an emitted section that actually exists.
 *
 * Some recent workflows use `political-classification.md` instead of the
 * older `classification-results.md`. A hard-coded
 * `#rm-classification-results` link then becomes a broken Reader Guide
 * anchor even though the article still contains audit material. Prefer the
 * strongest audit section available, falling back to the Article Sources
 * appendix when no audit artifact is present.
 */
export function auditAnchorForArtifacts(
  artifactsUsed: ReadonlySet<string> | readonly string[],
  fallbackAnchor = `${HEADING_ID_PREFIX}article-sources`,
): string {
  const availableSet = artifactsUsed instanceof Set ? artifactsUsed : new Set(artifactsUsed);
  const emittedRootArtifacts = new Set(selectReaderGuideArtifacts(availableSet));
  for (const file of AUDIT_ANCHOR_CANDIDATES) {
    if (emittedRootArtifacts.has(file)) {
      return anchorForTitle(titleForArtifact(file));
    }
  }
  return fallbackAnchor;
}

/**
 * Build the Reader Intelligence Guide markdown table for a single
 * aggregated article. Iterates over **all** analysis artifacts that
 * the aggregator emits as top-level sections (curated lenses + any
 * remaining `*.md` artifacts) so the guide acts as a complete,
 * navigable index — not just the curated
 * {@link READER_GUIDE_ENTRIES} lenses. Each row carries an icon, the
 * localised section label and a reader-value description; the legacy
 * "Source artifact" filename column is dropped.
 *
 * Curated lenses use their bespoke {@link READER_GUIDE_ENTRIES} /
 * `entries[*]` description; non-curated artifacts fall back to the
 * generic localised `defaultReaderValue` so every artifact gets a
 * meaningful row in all 14 languages.
 *
 * Always closes with the "Audit appendix" pointer row, and inserts a
 * single "Per-document intelligence" row when document-level analyses
 * exist (regardless of how many `documents/*-analysis.md` files are
 * present).
 *
 * Filtering / de-duplication mirrors the aggregator's behaviour via
 * {@link selectReaderGuideArtifacts} so every link in the guide
 * resolves to a heading that actually exists in the rendered article.
 */
export function buildReaderGuide(available: ReadonlySet<string>, hasDocuments: boolean, lang?: Language): string {
  const i18n = readerGuideI18n(lang ?? 'en');
  const { chrome } = i18n;

  const allFiles = selectReaderGuideArtifacts(available);

  const entries = allFiles.map((file) => {
    const title = titleForArtifact(file);
    const localised = i18n.entries[file];
    const curated = READER_GUIDE_ENTRIES.find((e) => e.file === file);
    const label = localised?.label ?? curated?.label ?? title;
    const readerValue =
      localised?.readerValue
      ?? readerValueFor(file, lang ?? 'en')
      ?? curated?.readerValue
      ?? chrome.defaultReaderValue;
    const icon = artifactIcon(file);
    return `| ${icon} | [${label}](#${anchorForTitle(title)}) | ${readerValue} |`;
  });

  if (hasDocuments) {
    entries.push(
      `| 📑 | [${chrome.perDocLabel}](#${HEADING_ID_PREFIX}per-document-intelligence) | ${chrome.perDocValue} |`,
    );
  }

  entries.push(
    `| 🏷️ | [${chrome.auditLabel}](#${auditAnchorForArtifacts(available)}) | ${chrome.auditValue} |`,
  );

  return [
    `## ${chrome.heading}`,
    '',
    chrome.preamble,
    '',
    `| ${chrome.colIcon} | ${chrome.colReaderNeed} | ${chrome.colWhatYouGet} |`,
    '|---|---|---|',
    ...entries,
  ].join('\n');
}
