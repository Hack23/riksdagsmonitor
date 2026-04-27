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

import { HEADING_ID_PREFIX } from '../markdown/sanitize-schema.js';
import { titleForArtifact } from './order.js';

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
 */
export const READER_GUIDE_ENTRIES: readonly ReaderGuideEntry[] = [
  {
    file: 'executive-brief.md',
    label: 'BLUF and editorial decisions',
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
    file: 'media-framing-analysis.md',
    label: 'Media framing',
    readerValue: 'likely narrative frames, amplifiers, counter-frames, and manipulation risks',
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
  // Mirror the pre-clean performed by markdown/rehype-slug-prefixed.ts:
  // strip leading non-letter/non-number characters before slugging so
  // an emoji-prefixed section title (e.g. `🎯 BLUF`) doesn't produce a
  // leading-dash slug that would render as `rm--bluf` once the prefix
  // is applied.
  const cleaned = title.replace(/^[^\p{L}\p{N}]+/u, '').trim() || title;
  const slug = new GithubSlugger().slug(cleaned);
  return `${HEADING_ID_PREFIX}${slug}`;
}

/**
 * Build the Reader Intelligence Guide markdown table for a single
 * aggregated article. Filters {@link READER_GUIDE_ENTRIES} to only the
 * artifacts that exist in `available`, appends a "Per-document
 * intelligence" row when document-level analyses exist, and always
 * closes with the "Audit appendix" pointer row.
 */
export function buildReaderGuide(available: ReadonlySet<string>, hasDocuments: boolean): string {
  const entries = READER_GUIDE_ENTRIES
    .filter((entry) => available.has(entry.file))
    .map((entry) => {
      const title = titleForArtifact(entry.file);
      return `| [${entry.label}](#${anchorForTitle(title)}) | ${entry.readerValue} | \`${entry.file}\` |`;
    });

  if (hasDocuments) {
    entries.push(
      `| [Per-document intelligence](#${HEADING_ID_PREFIX}per-document-intelligence) | dok_id-level evidence, named actors, dates, and primary-source traceability | \`documents/*-analysis.md\` |`,
    );
  }

  entries.push(
    `| [Audit appendix](#${HEADING_ID_PREFIX}classification-results) | classification, cross-reference, methodology and manifest evidence for reviewers | appendix artifacts |`,
  );

  return [
    '## Reader Intelligence Guide',
    '',
    'Use this guide to read the article as a political-intelligence product rather than a raw artifact dump. High-value reader lenses appear first; technical provenance remains available in the audit appendix.',
    '',
    '| Reader need | What you\'ll get | Source artifact |',
    '|---|---|---|',
    ...entries,
  ].join('\n');
}
