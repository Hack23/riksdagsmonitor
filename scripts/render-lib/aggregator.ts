/**
 * @module Infrastructure/RenderLib/Aggregator
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Analysis artifacts → aggregated article.md
 *
 * @description
 * Deterministic concatenator that turns a per-day per-subfolder set of
 * analysis artifacts under `analysis/daily/$DATE/$SUBFOLDER/` into one
 * publish-ready `article.md` with YAML front-matter. The aggregator is
 * **pure with respect to the filesystem** — given the same set of
 * artifact files on disk, it always produces byte-identical output.
 *
 * ## Narrative order (reader-intelligence-first projection)
 * See {@link AGGREGATION_ORDER}. The order is intentionally fixed to surface
 * high-value political-intelligence lenses before technical audit appendices:
 *
 * **Round 0 — generated navigation layer**
 * 0. `Reader Intelligence Guide` — deterministic navigation table injected
 *    before any artifact sections
 *
 * **Round 1 — BLUF and thesis**
 * 1. `executive-brief.md` (mandatory — supplies title + description)
 * 2. `synthesis-summary.md`
 * 3. `intelligence-assessment.md` — ICD-203 Key Judgments centrepiece
 * 4. `significance-scoring.md`
 *
 * **Round 2 — reader-facing intelligence lenses (most valuable first)**
 * 5. `media-framing-analysis.md` — narrative contestation, amplifiers, manipulation risk
 * 6. `stakeholder-perspectives.md`
 * 7. `forward-indicators.md` — dated watch items for readers to verify/falsify
 * 8. `scenario-analysis.md`
 * 9. `risk-assessment.md`
 * 10. `swot-analysis.md`
 * 11. `threat-analysis.md`
 *
 * **Round 3 — per-document evidence**
 * 12. `documents/*-analysis.md` — inlined as "Per-document intelligence"
 *
 * **Round 4 — electoral and domain lenses**
 * 13. `election-2026-analysis.md` … `implementation-feasibility.md`
 *
 * **Round 5 — challenge and audit appendix**
 * 15. `devils-advocate.md` … `data-download-manifest.md`
 * 16. any remaining supplementary `*.md` — appended alphabetically
 *
 * ## Cleaning rules (see {@link cleanArtifactBody})
 * - strip YAML front-matter
 * - strip the first H1 (replaced by an injected `## <section-title>`)
 * - strip `## Pass 2 …` AI self-audit trailing sections
 * - strip leading admin-byline paragraphs (`**Author**: … · **Run ID**: …`)
 * - strip `Document control` / `Audit trail` / `End of template` footers
 * - rewrite every relative `](path.md)` link to an absolute GitHub blob URL
 *
 * Round-4 architecture split: extracted from the monolithic
 * `render-lib/index.ts` (960 LOC → 4 leaf modules). No public API
 * change — `render-lib/index.ts` still re-exports everything below.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

import { buildGithubBlobUrl } from './url-helpers.js';
import { GITHUB_BLOB } from './constants.js';
import { HEADING_ID_PREFIX } from './markdown.js';

// ---------------------------------------------------------------------------
// Canonical narrative order + section titles
// ---------------------------------------------------------------------------

/**
 * Canonical narrative order. Each file is emitted as an `<h2>`-prefixed
 * section in the aggregated article. Unknown artifacts (e.g. supplementary
 * PESTLE / black-swan studies) are appended after the core sections in the
 * order they appear on disk.
 *
 * `documents/` is expanded separately — each per-document analysis becomes
 * its own subsection under the "Per-document intelligence" section.
 */
export const AGGREGATION_ORDER: readonly string[] = [
  'executive-brief.md',
  'synthesis-summary.md',
  'intelligence-assessment.md',
  'significance-scoring.md',
  'media-framing-analysis.md',
  'stakeholder-perspectives.md',
  'forward-indicators.md',
  'scenario-analysis.md',
  'risk-assessment.md',
  'swot-analysis.md',
  'threat-analysis.md',
  // documents/* expanded inline here
  'election-2026-analysis.md',
  'coalition-mathematics.md',
  'voter-segmentation.md',
  'comparative-international.md',
  'historical-parallels.md',
  'implementation-feasibility.md',
  'devils-advocate.md',
  'classification-results.md',
  'cross-reference-map.md',
  'methodology-reflection.md',
  'data-download-manifest.md',
];

/**
 * Human-readable English section titles for each artifact. The aggregator
 * emits these as `## <title>` headings so the rendered article has a
 * consistent outline independent of what the AI wrote inside the file.
 * Unknown files fall back to a title derived from the filename.
 */
const SECTION_TITLES: Record<string, string> = {
  'executive-brief.md': 'Executive Brief',
  'synthesis-summary.md': 'Synthesis Summary',
  'significance-scoring.md': 'Significance Scoring',
  'stakeholder-perspectives.md': 'Stakeholder Perspectives',
  'swot-analysis.md': 'SWOT Analysis',
  'risk-assessment.md': 'Risk Assessment',
  'threat-analysis.md': 'Threat Analysis',
  'election-2026-analysis.md': 'Election 2026 Analysis',
  'coalition-mathematics.md': 'Coalition Mathematics',
  'voter-segmentation.md': 'Voter Segmentation',
  'scenario-analysis.md': 'Scenario Analysis',
  'forward-indicators.md': 'Forward Indicators',
  'comparative-international.md': 'Comparative International',
  'historical-parallels.md': 'Historical Parallels',
  'media-framing-analysis.md': 'Media Framing Analysis',
  'implementation-feasibility.md': 'Implementation Feasibility',
  'devils-advocate.md': "Devil's Advocate",
  'intelligence-assessment.md': 'Intelligence Assessment — Key Judgments',
  'classification-results.md': 'Classification Results',
  'cross-reference-map.md': 'Cross-Reference Map',
  'methodology-reflection.md': 'Methodology Reflection & Limitations',
  'data-download-manifest.md': 'Data Download Manifest',
};

function prettifyFallbackTitle(file: string): string {
  const base = path.basename(file).replace(/\.md$/i, '');
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function titleForArtifact(file: string): string {
  const base = path.basename(file);
  return SECTION_TITLES[base] ?? prettifyFallbackTitle(base);
}

const READER_GUIDE_ENTRIES: readonly {
  readonly file: string;
  readonly label: string;
  readonly readerValue: string;
}[] = [
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
function anchorForTitle(title: string): string {
  // Mirror the pre-clean performed by markdown.ts#rehypeSlugWithPrefix:
  // strip leading non-letter/non-number characters before slugging so
  // an emoji-prefixed section title (e.g. `🎯 BLUF`) doesn't produce a
  // leading-dash slug that would render as `rm--bluf` once the prefix
  // is applied. The Reader Intelligence Guide must produce the
  // identical slug as the rendered heading ID so its #anchor links
  // resolve. Note: `anchorForTitle` is only called for distinct
  // top-level section titles (no dedup state needed here).
  const cleaned = title.replace(/^[^\p{L}\p{N}]+/u, '').trim() || title;
  const slug = new GithubSlugger().slug(cleaned);
  return `${HEADING_ID_PREFIX}${slug}`;
}

function buildReaderGuide(available: ReadonlySet<string>, hasDocuments: boolean): string {
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

// ---------------------------------------------------------------------------
// Artifact body cleaning
// ---------------------------------------------------------------------------

/**
 * Regex matching an "AI self-audit" trailing section that must never reach
 * the published article. These are added by analysis agents during the
 * AI-FIRST Pass-2 iteration (see `00-base-contract.md` §5) and document
 * *how* the analysis was refined, not *what* it says. Matches, from a
 * heading like `## Pass 2 …` / `### Pass 2 …` / `## 🔁 Pass 2 …` /
 * `#### Pass 2 …`, all the way to either the next same-or-higher-level
 * `##`-or-`#` heading or end-of-file.
 */
const PASS_TWO_HEADING_RE =
  /^#{2,6}\s+(?:[^\n#]*?\s)?Pass\s*2\b[^\n]*$/gim;

/**
 * Admin-byline field names recognised in analysis artifacts. A paragraph
 * whose fragments are **entirely** composed of these labelled fields is
 * template preamble, not prose — strip it. Fields are grouped by origin
 * for maintainability:
 *
 * - **Legacy** — fields emitted by the original analysis templates.
 * - **Extended 2026-04-24** — fields from executive-brief / realtime
 *   templates that previously leaked into `<meta description>`; added
 *   per `seo-metadata-contract.md` §5.
 *
 * To add a new field, append it to this list and add a test in
 * `tests/render-lib.test.ts > ADMIN_FIELD_RE`.
 */
const ADMIN_FIELD_NAMES: readonly string[] = [
  // Legacy
  'Author',
  'Run\\s*ID',
  'Date',
  'Classification',
  'Confidence',
  'Scope',
  'Admiralty(?:\\s*(?:range|baseline))?',
  'Read[-\\s]?time',
  'Version',
  'Status',
  'Owner',
  'Last\\s*Updated',
  'Generated',
  // Extended 2026-04-24 — see seo-metadata-contract.md §5.
  'Brief\\s*ID',
  'Prepared\\s*by',
  'Prepared\\s*at',
  'Analyst',
  'Distribution',
  'Methodology',
  'Cycle',
  '60[-\\s]?second\\s*read',
  'Reviewed\\s*by',
  'Reviewer',
  'Disseminated',
  'Source',
  'Dissemination',
  // Extended 2026-04-27 — preamble fields observed leaking into Executive
  // Brief / synthesis / per-document headers across 28 of 41 articles. See
  // analysis/daily/2026-04-27/propositions/executive-brief.md for the
  // canonical leak shape (`**Author** \n **Date** \n **Analysis period** \n
  // **Confidence** \n **Classification** \n **Pass 2**`). Without these
  // entries the entire admin paragraph fails the `allAdmin` test in
  // `stripLeadingAdminBylines` because two fragments are unrecognised, so
  // the whole template preamble survives into the published article body.
  // Round 2: scenario-analysis / comparative-international /
  // methodology-reflection / coalition-mathematics / etc. preambles add
  // Horizon / Method / Focus / Workflow / Purpose / Analysis date as
  // structured `**Label**: value` admin fragments before any prose.
  'Analysis\\s*period',
  'Analysis\\s*date',
  'Horizon',
  'Method',
  'Focus',
  'Workflow',
  'Purpose',
  'Pass\\s*2',
  'AI[-\\s]?FIRST\\s*iterations?',
  'ARTICLE_TYPE',
  'Article\\s*type',
  'Article\\s*period',
  'Period',
  'Window',
  'Coverage\\s*window',
  'Run\\s*started',
  'Run\\s*completed',
  'Run\\s*at',
  // Round 3 (2026-04-27) — per-document and per-artifact preamble fields
  // observed leaking 393 times across 36 of 41 articles. These appear as
  // structured `**Label**: value` fragments in the leading paragraph of
  // exec briefs, per-document analyses (`documents/{dok_id}-analysis.md`)
  // and Family C artifacts. Examples:
  //   - **F3EAD Stage**: Exploit
  //   - **Framework**: Political SWOT v3.4
  //   - **Dok ID** / **Dok-ID** / **Dok_ID** / **Document ID**: HD03253
  //   - **SCN-ID**, **SIG-ID**, **STA-ID**, **RSK-ID**, **THR-ID**,
  //     **CMP-ID**, **CLS-ID**, **XRF-ID**, **MTH-ID** (artifact-row IDs)
  //   - **Organ**: FiU | **Subject**: ... | **Type**: Proposition
  //   - **Comparator set**: Sweden vs DE/FR | **Election date**: 2026-09
  // Body-text mentions like *"the Party (S) filed..."* are not bold +
  // colon-anchored, so they pass `ADMIN_FIELD_RE` correctly.
  'F3EAD\\s*Stage',
  'Framework',
  'Party',
  'Dok[-_\\s]?ID',
  'Document(?:\\s*ID)?',
  'Organ',
  'Subject',
  'Type',
  'Committee',
  'Comparator(?:\\s*set)?',
  'Election\\s*date',
  '[A-Z]{3}[-_]ID',
  // Round 4 (2026-04-27) — additional preamble fields observed in
  // per-document, family C and family D artifacts. Riksmöte = Swedish
  // parliamentary year (e.g. `2025/26`); DIW Score = significance ranking
  // header (Diplomatic / Informational / Wider impact); Confidence
  // distribution / Confidence floor = artifact-level trust roll-ups.
  'Riksm(?:ö|o)te',
  'DIW\\s*Score',
  'Confidence\\s*(?:distribution|floor|baseline)',
  'Frame',
  'Question',
  'Overall\\s*Threat\\s*Level',
  'Overall\\s*Risk\\s*Level',
  'Overall\\s*Score',
  'Tradecraft(?:\\s*context)?',
  'PIRs?(?:\\s*served)?',
  'Source\\s*Diversity(?:\\s*floor)?',
  'WEP\\+ODNI',
  'SATs?\\s*applied',
  'ICD\\s*203(?:\\s*standards)?',
  'Hash',
  'Signature',
  'Provenance',
  // Round 5 (2026-04-27) — manifest / synthesis preamble fields. The
  // `data-download-manifest.md` and `synthesis-summary.md` artifacts emit
  // structured run-metadata that is never article content.
  'Article\\s*Type',
  'Article\\s*Date',
  'Analysis\\s*Type',
  'Analysis\\s*Depth',
  'Data\\s*Sources?',
  'Documents?\\s*Downloaded',
  'Documents?\\s*Selected(?:\\s*\\([^)]+\\))?',
  'Produced\\s*By',
  'Scope\\s*of\\s*this\\s*file',
  // Round 6 (2026-04-27) — per-document and per-artifact preamble fields
  // used in motion / interpellation / proposition / committee templates.
  // Includes Swedish-language labels and audit timestamp variants.
  'Session',
  'Datum',
  'Tier',
  'DIW\\s*Tier',
  'Admiralty\\s*Source\\s*Code',
  'Inl(?:ä|a)mnare',
  'Mottagare',
  'Talman',
  'Ministry',
  'SISVA(?:\\s*\\([^)]+\\))?',
  'Filed(?:\\s*by)?',
  'Effective\\s*[Dd]ate',
  'Tabling\\s*date',
  'Requested\\s*date',
  'Source\\s*authority',
  'UTC\\s*Timestamp',
  'Analysis\\s*Timestamp',
  'Analysis\\s*run',
  'Updated',
  'Level',
  'Relates\\s*to',
  'frs',
];

/**
 * Bold-label admin-byline pattern. Matches a fragment that begins with
 * one of the field names in {@link ADMIN_FIELD_NAMES}, followed by a
 * colon. `**` wrapping is optional so unbolded admin lines (e.g. read
 * back from rendered HTML where emphasis has been stripped) are also
 * caught. Case-insensitive.
 */
const ADMIN_FIELD_RE = new RegExp(
  `^\\*{0,2}(?:${ADMIN_FIELD_NAMES.join('|')})\\*{0,2}\\s*:`,
  'i',
);

/**
 * Fragment splitter for admin-byline paragraphs. Splits only on
 * **structural** delimiters that genuinely separate distinct fields —
 * newlines, pipes (`|` / fullwidth `｜`), Japanese enumeration comma (`、`),
 * and long runs of whitespace. Deliberately does **not** split on `—` /
 * `·` / `–`, because those commonly appear *inside* admin-field values
 * (e.g. `**Classification**: Public — GDPR Art. 9(2)(e)`) and previously
 * let whole admin paragraphs escape the stripper.
 */
const ADMIN_FRAGMENT_SPLITTER = /\s*(?:\||｜|、|\n|\s{2,})\s*/;

/**
 * Strip the Pass-2 self-audit section (and anything after it) from a single
 * artifact body. The section extends from the Pass-2 heading through the
 * end of file, because it is always the last thing the agent writes.
 */
function stripPassTwoSection(body: string): string {
  // Use a fresh regex since PASS_TWO_HEADING_RE is /g-flagged.
  const re = /^#{1,6}\s+(?:[^\n#]*?\s)?Pass\s*2\b[^\n]*$/im;
  const match = body.match(re);
  if (!match || match.index === undefined) return body;
  return body.slice(0, match.index).replace(/\s+$/g, '') + '\n';
}

/**
 * Remove admin-byline paragraphs anywhere in the artifact body. Walks
 * paragraph-by-paragraph; any paragraph whose fragments are 100% bold-
 * label admin metadata (per {@link ADMIN_FIELD_RE}) is dropped. Any
 * paragraph with at least one non-admin fragment is preserved verbatim.
 *
 * Originally this stripper only ran on **leading** paragraphs and stopped
 * at the first prose paragraph (hence the name). Per-document analyses
 * and Family C/D artifacts emit *additional* admin blocks immediately
 * under their internal `### {dok_id}` / `## Section` headings, so the
 * leading-only sweep let ~393 admin-byline lines leak into the published
 * Article body across 36 of 41 articles (audit 2026-04-27). Walking the
 * whole body — but still requiring a paragraph to be **fully** admin —
 * keeps body prose intact while removing the duplicate metadata blocks.
 *
 * The function name and signature are preserved so callers and tests
 * that imported it through `__test__` continue to work; the behaviour is
 * a strict superset of the previous version.
 */
function stripLeadingAdminBylines(body: string): string {
  const paragraphs = body.split(/\n\n+/);
  const kept: string[] = [];
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) {
      // Preserve blank paragraph spacing — collapsed downstream by the
      // `\n{3,}` rule in cleanArtifactBody.
      kept.push(p);
      continue;
    }
    const fragments = trimmed.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    const allAdmin = fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()));
    if (allAdmin && fragments.length > 0) continue;
    kept.push(p);
  }
  return kept.join('\n\n');
}

/**
 * Strip a leading YAML front-matter block, the first top-level H1 (it is
 * replaced by the injected `##` section heading), trailing template
 * boilerplate footers (`— End of template —`, `<!-- End of artifact -->`,
 * `Document control`, `Generated by …`), AI self-audit `## Pass 2 …`
 * sections (which carry process metadata, not article content), and
 * leading admin-byline paragraphs (`**Author**: … · **Run ID**: …`).
 *
 * Also performs three reader-facing HTML-quality projections, applied
 * after the structural strips so they never remove signal:
 *
 * 1. **Heading demotion** — every artifact body is wrapped under an
 *    aggregator-injected `## <Section title>`, so the *inner* `##`,
 *    `###`, … headings are demoted by one level (`##` → `###`,
 *    `###` → `####`, …, capped at `######`). Without this the rendered
 *    article ends up with ~170 H2s and a flat outline that violates
 *    WCAG 2.4.6 ("Headings and Labels") and the SEO heading-hierarchy
 *    contract documented in `Article-Generation.md`.
 * 2. **`_Source: file.md_` preamble removal** — the legacy aggregator
 *    used to inject this italic line under every section heading, but
 *    it now lives in the Reader Intelligence Guide and the
 *    `## Article Sources` appendix; on top of an artifact body it reads
 *    like a folder listing, not journalism. Some artifact templates
 *    still author one (`_Source: foo.md_`) on their own — strip those
 *    too.
 * 3. **Empty-paragraph collapse** — admin-byline removal can leave 3+
 *    consecutive blank lines and rendered HTML emits a stray `<p></p>`
 *    for each pair. We already collapse 3+ blank lines to 2; this also
 *    drops paragraphs that are empty after `_Source:_` italics removal.
 */
function cleanArtifactBody(raw: string): string {
  const parsed = matter(raw);
  let body = parsed.content;
  // Strip first H1
  body = body.replace(/^\s*#\s+[^\n]*\n+/, '');
  // Strip repeated admin/footer blocks
  body = body.replace(/^#+\s*Document control[\s\S]*$/im, '');
  body = body.replace(/^#+\s*Audit trail[\s\S]*$/im, '');
  body = body.replace(/^—\s*End of (template|artifact)\s*—[\s\S]*$/im, '');
  body = body.replace(/<!--\s*End of (template|artifact)[\s\S]*?-->/gi, '');
  body = body.replace(/^Generated by .*$/gim, '');
  body = body.replace(/^Run ID: .*$/gim, '');
  // Strip AI self-audit "Pass 2 …" trailing section (any H1-H6, with or
  // without leading emoji), from the heading through end-of-artifact.
  body = stripPassTwoSection(body);
  // Strip leading admin-byline paragraphs (template preamble).
  body = stripLeadingAdminBylines(body.trimStart());
  // Strip in-body `_Source: file.md_` italic preambles (legacy template
  // preamble — sources are now surfaced in the Reader Intelligence
  // Guide and the `## Article Sources` appendix instead).
  body = stripSourcePreamble(body);
  // Demote inner headings by one level — the aggregator wraps each body
  // in its own `## <Section title>` so the artifact's own `##` becomes a
  // sibling, not a child. Cap at H6.
  body = demoteHeadings(body);
  // Collapse 3+ blank lines to 2 (post-strip cleanup).
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.trim();
}

/**
 * Remove `_Source: \`file.md\`_` (and `_Source: [\`file.md\`](url)_`)
 * italic preamble lines. Only strips lines that **start** with the
 * source marker — never inline mentions. Bracket-link variant is
 * matched explicitly to allow for the markdown link payload.
 */
function stripSourcePreamble(body: string): string {
  return body
    .replace(/^_\s*Source:\s*\[?`[^\n]*?\n+/gim, '')
    .replace(/^_\s*Source:\s*[^\n]*_\s*$\n?/gim, '');
}

/**
 * Demote ATX headings by one level inside an artifact body — `##` → `###`,
 * `###` → `####`, …, capped at `######`. The aggregator wraps each
 * artifact under its own injected `## <title>`, so without this the
 * rendered article outline ends up flat (every artifact's internal H2s
 * become siblings of the wrapper H2). Indentation, fenced code blocks
 * and table contents are not affected — only line-anchored ATX headings
 * are matched.
 *
 * Headings inside fenced code blocks are explicitly excluded by
 * tracking fence state line-by-line.
 */
function demoteHeadings(body: string): string {
  const lines = body.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    // Track entry/exit of triple-backtick or triple-tilde fenced code.
    if (/^\s{0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})(\s+\S)/);
    if (!m) continue;
    const current = m[1]!.length;
    if (current >= 6) continue;          // already at H6, can't demote further
    if (current === 1) continue;         // H1 already stripped by upstream regex; defensive
    lines[i] = '#'.repeat(current + 1) + line.slice(current);
  }
  return lines.join('\n');
}

/**
 * Rewrite relative `[label](path.md)` links in the aggregated markdown to
 * absolute GitHub blob URLs — the rendered HTML lives at a different path
 * than the source artifacts, so every link must be auditable back to
 * GitHub. Leaves absolute `http(s)://…` links untouched.
 */
function rewriteRelativeLinks(body: string, subfolderRepoRelPath: string): string {
  return body.replace(
    /\]\((?!https?:\/\/|#|mailto:)([^)]+)\)/g,
    (_match, target: string) => {
      const [pathPart, anchor] = target.split('#', 2) as [string, string | undefined];
      if (!pathPart) return `](${target})`;
      const resolved = path.posix.normalize(
        path.posix.join(subfolderRepoRelPath, pathPart),
      );
      const href = `${GITHUB_BLOB}/${resolved}` + (anchor ? `#${anchor}` : '');
      return `](${href})`;
    },
  );
}

// Expose admin-byline and pass-2 regex constants and internal helpers for
// tests. These are NOT part of the stable public API — they exist only to
// let `tests/render-lib.test.ts` exercise every branch without re-implementing
// the transforms. Downstream scripts must import the *public* exports
// (`aggregateAnalysis`, `renderArticleHtml`, …) instead.
//
// NB: the `__test__` barrel lives *after* every helper it references so
// block-scoped `const`s declared later in the file (e.g.
// {@link SENTENCE_END_RE}, {@link truncateToSentenceBoundary}) are
// already initialised.

// ---------------------------------------------------------------------------
// Public aggregator API
// ---------------------------------------------------------------------------

export interface AggregationInput {
  /** Absolute path to `analysis/daily/$DATE/$SUBFOLDER`. */
  readonly subfolderAbsPath: string;
  /** Repo-relative path (e.g. `analysis/daily/2026-04-23/propositions`). */
  readonly subfolderRepoRelPath: string;
  /** `$DATE` (YYYY-MM-DD). */
  readonly date: string;
  /** `$SUBFOLDER` (e.g. `propositions`). */
  readonly subfolder: string;
}

export interface AggregationResult {
  /** Generated aggregated markdown (with YAML front-matter). */
  readonly markdown: string;
  /** Ordered list of artifact files consumed (relative to subfolder). */
  readonly artifactsUsed: readonly string[];
  /** First H1 from `executive-brief.md`, used as the article title. */
  readonly title: string;
  /** First non-empty paragraph from `executive-brief.md`, used as description. */
  readonly description: string;
}

function readFirstHeading(markdown: string): string | null {
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Sentence-terminator set used by {@link truncateToSentenceBoundary}.
 * Covers Latin (`.`, `!`, `?`), Chinese/Japanese full stop (`。`),
 * Devanagari danda (`।`), and the Unicode horizontal ellipsis (`…`).
 */
const SENTENCE_END_RE = /(?:[.!?…](?=\s|$))|[。।]/g;

/**
 * Truncate a string to the longest sentence-terminated prefix whose
 * length is ≤ `hardMax`, preferring a break ≥ `softMin`. Never cuts
 * mid-word. Used for `<meta description>` so Google never renders a
 * truncated last token with a trailing ellipsis.
 *
 * Supports sentence terminators across multiple scripts:
 * - Latin: `.`, `!`, `?`, `…`
 * - CJK (Chinese/Japanese): `。`
 * - Devanagari (Hindi and related Indic scripts): `।`
 *
 * Implements `seo-metadata-contract.md` §3.1: EN target window
 * 140-200 chars; shorter languages use their own windows but go
 * through the same sentence-preserving logic.
 *
 * If the input contains no usable sentence boundary **and** no word
 * boundary within the window (e.g. a single run of non-space chars),
 * the result is guaranteed to be non-empty: it is at least `hardMax`
 * chars plus a trailing `…`, so the caller never receives a bare `…`.
 *
 * @param text    Input prose (markdown emphasis already stripped).
 * @param softMin Soft minimum — prefer truncating at or after this
 *                length (default 140).
 * @param hardMax Hard maximum — never return more than this many chars
 *                (default 200).
 */
function truncateToSentenceBoundary(
  text: string,
  softMin: number = 140,
  hardMax: number = 200,
): string {
  const normalised = text.replace(/\s+/g, ' ').trim();
  if (normalised.length === 0) return '';
  if (normalised.length <= hardMax) return normalised;

  // Find every sentence-end position in the prefix within hardMax.
  const window = normalised.slice(0, hardMax + 1);
  SENTENCE_END_RE.lastIndex = 0;
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = SENTENCE_END_RE.exec(window)) !== null) {
    ends.push(m.index + m[0].length);
  }

  // Prefer the last sentence end that is ≥ softMin and ≤ hardMax.
  for (let i = ends.length - 1; i >= 0; i -= 1) {
    const end = ends[i]!;
    if (end >= softMin && end <= hardMax) return normalised.slice(0, end).trim();
  }

  // No sentence end in window — fall back to last word boundary
  // before hardMax, appending a true Unicode ellipsis so the cut is
  // intentional rather than mid-word. The `trim()` on the sliced prefix
  // followed by the explicit `'…'` guarantees a non-empty result even
  // when the input is a pathological single-token string.
  const sliced = normalised.slice(0, hardMax);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace >= softMin) return sliced.slice(0, lastSpace).trim() + '…';
  return sliced.trim() + '…';
}

function markdownInlineToText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Return the first prose paragraph that immediately follows a `## 🎯 BLUF`
 * (or `## BLUF`, case-insensitive) heading in an executive-brief. This is
 * the paragraph editors already wrote as the article's lede, so it is
 * preferred over the first paragraph of the document (which is often the
 * admin-metadata block).
 *
 * Returns `null` if the brief has no BLUF heading.
 */
function readBlufParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  // Match `## BLUF`, `## 🎯 BLUF`, `### BLUF` — any heading containing
  // the token `BLUF` as a standalone word. Case-insensitive. Consume
  // the heading line and any immediately-following blank line.
  const blufMatch = body.match(/^#{2,6}\s+(?:[^\n]*?\s)?BLUF\b[^\n]*\n+/im);
  if (!blufMatch || blufMatch.index === undefined) return null;
  const after = body.slice(blufMatch.index + blufMatch[0].length);
  // Take paragraph-by-paragraph, skip non-prose, stop at first match.
  const paragraphs = after.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (/^#+\s/.test(p)) break;                   // hit next heading — give up
    if (/^<!--/.test(p)) continue;
    if (/^\|/.test(p)) continue;
    if (/^```/.test(p)) continue;
    if (/^[>*]\s/.test(p)) continue;
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return markdownInlineToText(p);
  }
  return null;
}

function readFirstParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  const lines = body.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of lines) {
    if (/^#+\s/.test(p)) continue;               // skip headings
    if (/^<!--/.test(p)) continue;               // skip HTML comments
    if (/^\|/.test(p)) continue;                 // skip tables
    if (/^```/.test(p)) continue;                // skip code fences
    if (/^[>*]\s/.test(p)) continue;             // skip blockquotes / bullet-only lines
    // Structural-only delimiter (see ADMIN_FRAGMENT_SPLITTER JSDoc).
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return markdownInlineToText(p);
  }
  return null;
}

/**
 * Scrub boilerplate from the raw H1 of an executive-brief so it can be
 * used as the article `<title>`. Per `seo-metadata-contract.md` §2:
 *
 * - strip a leading `Executive Brief — ` / `Executive Brief - ` prefix
 *   (the template boilerplate that masks the story)
 * - strip a trailing ` — YYYY-MM-DD` / ` - YYYY-MM-DD` / ` YYYY-MM-DD`
 *   (dates belong in `article:published_time`, not the SERP title)
 * - if the cleaned title is < 20 chars — too short to be a real story
 *   headline — return `null` so the caller can fall back to a BLUF
 *   sentence or to the fallback subfolder-based title.
 */
function cleanArticleTitle(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.trim();
  // Strip leading pictograph / emoji / punctuation that sometimes
  // prefixes boilerplate H1s (e.g. `📋 Executive Brief — …`). Match
  // any run of non-letter/number/Arabic/CJK characters at the start.
  t = t.replace(/^[\s\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}\p{P}\p{S}]+/u, '').trim();
  // Strip boilerplate prefixes (en-dash, em-dash, hyphen) — keep the story.
  t = t.replace(/^(?:Executive\s+Brief|Intelligence\s+Brief|Intelligence\s+Assessment|Realtime\s+Monitor|Riksdag\s+Realtime\s+Monitor|Daily\s+Brief)\s*[—–\-:]\s*/i, '');
  // Strip trailing ISO date (with or without a separator).
  t = t.replace(/\s*[—–\-:]?\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*$/i, '');
  // Strip any ISO date that remains embedded mid-title (e.g. "Week
  // Ahead: 2026-02-23 to" → "Week Ahead: to"). We normalise
  // collapsing whitespace after the strip. This is important for
  // translated titles where the date is often inlined between two
  // non-Latin fragments that the trailing-strip can't reach.
  t = t.replace(/\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*/g, ' ');
  // Strip trailing connector words left behind when a date was mid-title,
  // like "… to" / "… – " / "… —" / "… :" / Swedish "… till" / German
  // "… bis" / French "… à" / Spanish "… a" / Arabic "… إلى" / Japanese
  // "… から" / Norwegian-Danish "… til" / Finnish "… –". This is a
  // best-effort clean-up — if the trailing token is not in the list we
  // leave it alone.
  t = t.replace(/[\s,;:]*(?:to|till|bis|à|a|إلى|から|til|–|—|-|:)\s*$/iu, '').trim();
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length < 20) return null;
  return t;
}

/**
 * Synthesise a title from a BLUF sentence when the H1 is too boilerplate
 * to use directly. Takes the first sentence of `bluf` (or up to `maxLen`
 * chars at a word boundary), strips markdown emphasis, trims to a clean
 * ≤ `maxLen`-char fragment. Returns `null` if no usable sentence exists.
 */
function titleFromBluf(bluf: string | null, maxLen: number = 70): string | null {
  if (!bluf) return null;
  const clean = markdownInlineToText(bluf);
  if (!clean) return null;
  // Take the first sentence (bounded by . ! ? 。) — but never exceed maxLen.
  SENTENCE_END_RE.lastIndex = 0;
  const m = SENTENCE_END_RE.exec(clean);
  const firstSentence = m ? clean.slice(0, m.index + m[0].length) : clean;
  if (firstSentence.length <= maxLen) return firstSentence.replace(/\s*[.!?…。।]+\s*$/, '').trim();
  // First sentence too long — take word-boundary prefix ≤ maxLen.
  const sliced = firstSentence.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim();
}

export function aggregateAnalysis(input: AggregationInput): AggregationResult {
  const { subfolderAbsPath, subfolderRepoRelPath, date, subfolder } = input;
  if (!fs.existsSync(subfolderAbsPath)) {
    throw new Error(`Analysis subfolder not found: ${subfolderAbsPath}`);
  }

  const sections: string[] = [];
  const used: string[] = [];

  const readSection = (fileName: string, skipIfMissing: boolean): void => {
    const abs = path.join(subfolderAbsPath, fileName);
    if (!fs.existsSync(abs)) {
      if (!skipIfMissing) {
        throw new Error(`Required artifact missing: ${subfolderRepoRelPath}/${fileName}`);
      }
      return;
    }
    const raw = fs.readFileSync(abs, 'utf8');
    const clean = rewriteRelativeLinks(cleanArtifactBody(raw), subfolderRepoRelPath);
    if (!clean) return;
    const title = titleForArtifact(fileName);
    // Source attribution previously rendered as an italic preamble
    // under every section (`_Source: file.md_`), which read like a
    // folder listing. It now appears once in the Reader Intelligence
    // Guide and once in the `## Article Sources` appendix; the per-
    // section heading is annotated with an HTML comment for auditors
    // that does not surface in rendered HTML.
    const sourceUrl = buildGithubBlobUrl(`${subfolderRepoRelPath}/${fileName}`);
    sections.push(
      `## ${title}\n` +
      `<!-- source: ${fileName} :: ${sourceUrl} -->\n\n` +
      clean,
    );
    used.push(fileName);
  };

  // 1. Executive brief is mandatory — both title and description derive from it.
  const briefPath = path.join(subfolderAbsPath, 'executive-brief.md');
  if (!fs.existsSync(briefPath)) {
    throw new Error(`Aggregation requires executive-brief.md in ${subfolderRepoRelPath}`);
  }
  const briefRaw = fs.readFileSync(briefPath, 'utf8');

  // Description: prefer the `## 🎯 BLUF` paragraph (editors write this as the
  // publishable lede), fall back to the first prose paragraph. Always run
  // through the sentence-aware truncator so SERP snippets never end mid-word.
  // See `seo-metadata-contract.md` §3.
  const rawBlufParagraph = readBlufParagraph(briefRaw);
  const rawFirstParagraph = readFirstParagraph(briefRaw);
  const rawDescriptionSource =
    rawBlufParagraph ||
    rawFirstParagraph ||
    `Evidence-based political intelligence analysis for ${subfolder} on ${date}.`;
  const description = truncateToSentenceBoundary(rawDescriptionSource);

  // Title: strip boilerplate prefix (`Executive Brief — `) and trailing
  // ISO date from the H1. If the cleaned title is too short to be a real
  // story headline, synthesise one from the first BLUF sentence. If that
  // also fails, fall back to the legacy `<subfolder> — <date>` string.
  // See `seo-metadata-contract.md` §2.
  const title =
    cleanArticleTitle(readFirstHeading(briefRaw)) ||
    titleFromBluf(rawBlufParagraph ?? rawFirstParagraph) ||
    `${prettifyFallbackTitle(subfolder)} — ${date}`;

  const rootArtifactSet = new Set(
    fs.readdirSync(subfolderAbsPath)
      .filter((f) => /\.md$/i.test(f))
      .filter((f) => f !== 'README.md')
      .filter((f) => !/^article(?:\.[a-z-]+)?\.md$/i.test(f)),
  );
  const docsDirForGuide = path.join(subfolderAbsPath, 'documents');
  const hasDocumentAnalyses = fs.existsSync(docsDirForGuide) &&
    fs.readdirSync(docsDirForGuide).some((f) => /\.md$/i.test(f));
  sections.push(buildReaderGuide(rootArtifactSet, hasDocumentAnalyses));

  // 2. Emit the canonical narrative order, expanding documents/ between
  //    threat-analysis and election-2026-analysis.
  for (const fileName of AGGREGATION_ORDER) {
    readSection(fileName, fileName !== 'executive-brief.md');
    if (fileName === 'threat-analysis.md') {
      // Inject per-document analyses as one merged section.
      const docsDir = path.join(subfolderAbsPath, 'documents');
      if (fs.existsSync(docsDir)) {
        const docFiles = fs.readdirSync(docsDir)
          .filter((f) => /\.md$/i.test(f))
          .sort();
        if (docFiles.length > 0) {
          const perDocSections: string[] = [];
          for (const df of docFiles) {
            const abs = path.join(docsDir, df);
            const raw = fs.readFileSync(abs, 'utf8');
            const clean = rewriteRelativeLinks(
              cleanArtifactBody(raw),
              `${subfolderRepoRelPath}/documents`,
            );
            if (!clean) continue;
            const dokId = df.replace(/-analysis\.md$/i, '').replace(/\.md$/i, '');
            const sourceUrl = buildGithubBlobUrl(
              `${subfolderRepoRelPath}/documents/${df}`,
            );
            perDocSections.push(
              `### ${escapeInlineMd(dokId)}\n` +
              `<!-- source: documents/${df} :: ${sourceUrl} -->\n\n` +
              clean,
            );
            used.push(`documents/${df}`);
          }
          if (perDocSections.length > 0) {
            sections.push(
              `## Per-document intelligence\n\n` +
              perDocSections.join('\n\n'),
            );
          }
        }
      }
    }
  }

  // 3. Any remaining *.md in the subfolder (supplementary artifacts such as
  //    pestle-analysis.md, wildcards-blackswans.md, ext/*.md …) that are not
  //    yet listed — append after the core set, in alphabetical order.
  //    Exclude README.md, article.md (aggregator output), and any language-
  //    specific article.<lang>.md written by news-translate; otherwise the
  //    aggregator embeds its own output on the next run.
  const allMd = fs.readdirSync(subfolderAbsPath)
    .filter((f) => /\.md$/i.test(f))
    .filter((f) => f !== 'README.md')
    .filter((f) => !/^article(?:\.[a-z-]+)?\.md$/i.test(f))
    .sort();
  for (const f of allMd) {
    if (used.includes(f)) continue;
    if (AGGREGATION_ORDER.includes(f)) continue;
    readSection(f, true);
  }

  // 4. Article Sources appendix — single canonical list at the end of
  //    the article. Replaces the per-section `_Source: …_` italics that
  //    used to read like a folder listing under every heading. Each
  //    entry links to the artifact on GitHub for full audit traceability.
  if (used.length > 0) {
    const sourceLines = used.map((file) => {
      const url = buildGithubBlobUrl(`${subfolderRepoRelPath}/${file}`);
      return `- [\`${file}\`](${url})`;
    });
    sections.push(
      [
        '## Article Sources',
        '',
        'Each section above projects one analysis artifact. The full audited markdown is available on GitHub:',
        '',
        ...sourceLines,
      ].join('\n'),
    );
  }

  // 5. Compose final markdown with YAML front-matter.
  const now = new Date();
  const slug = `${date}-${subfolder}`;
  const frontMatter = [
    '---',
    `title: "${escapeYaml(title)}"`,
    `description: "${escapeYaml(description)}"`,
    `date: ${date}`,
    `subfolder: ${subfolder}`,
    `slug: ${slug}`,
    `source_folder: ${subfolderRepoRelPath}`,
    `generated_at: ${now.toISOString()}`,
    'language: en',
    'layout: article',
    '---',
    '',
  ].join('\n');

  const body = sections.join('\n\n');

  return {
    markdown: frontMatter + body + '\n',
    artifactsUsed: used,
    title,
    description,
  };
}

function escapeInlineMd(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

function escapeYaml(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

// ---------------------------------------------------------------------------
// Test-only exports — see note above the placeholder at the top of the
// "Public aggregator API" section.
// ---------------------------------------------------------------------------
export const __test__ = {
  PASS_TWO_HEADING_RE,
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
  SENTENCE_END_RE,
  stripPassTwoSection,
  stripLeadingAdminBylines,
  stripSourcePreamble,
  demoteHeadings,
  cleanArtifactBody,
  rewriteRelativeLinks,
  prettifyFallbackTitle,
  readFirstHeading,
  readFirstParagraph,
  readBlufParagraph,
  truncateToSentenceBoundary,
  markdownInlineToText,
  cleanArticleTitle,
  titleFromBluf,
  escapeYaml,
  escapeInlineMd,
  anchorForTitle,
};
