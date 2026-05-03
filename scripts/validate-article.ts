/**
 * @module scripts/validate-article
 * @description Hard, scripted minimum-content validator for aggregated
 *              `analysis/daily/$DATE/$SUBFOLDER/article.md` files.
 *
 *              Implements the script-enforcement layer described in the
 *              Phase 1 article-quality plan in `Article-Generation.md`:
 *              every quality minimum (placeholder strings, BLUF presence,
 *              Reader Intelligence Guide, heading-anchor health,
 *              per-document `dok_id` citation density) is a real TS
 *              check that fails CI — never advisory bash.
 *
 *              The validator is **content-only** — it does not re-render
 *              HTML. The renderer's structural projections (heading
 *              demotion, source-preamble stripping, slug normalisation)
 *              are unit-tested in `tests/render-lib.test.ts`; this script
 *              guards the *AI-authored* contribution: the artifact
 *              contents that the aggregator concatenates.
 *
 * @example
 *   # Validate every aggregated article in the repo:
 *   npx tsx scripts/validate-article.ts
 *
 *   # Validate a single article:
 *   npx tsx scripts/validate-article.ts analysis/daily/2026-04-24/interpellations/article.md
 *
 *   # Used in CI:
 *   - npm run validate-article
 *
 * @see scripts/render-lib/aggregator.ts — produces the article.md files
 * @see Article-Generation.md — Phase 1 article-quality contract
 * @see analysis/templates/README.md — template-side authoring contract
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, basename, dirname } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { getBySubfolder } from './render-lib/article-types.js';

const REPO_ROOT = resolve(process.cwd());

/**
 * A single rule failure on a single article. `code` is a stable
 * machine-readable identifier suitable for grep, dashboards, and
 * suppression workflows.
 */
interface ArticleViolation {
  readonly file: string;
  readonly code: string;
  readonly message: string;
}

/**
 * Placeholder strings that templates contain on disk and that the AI
 * agent is instructed to replace during Pass-1 / Pass-2. Any of these
 * surviving in the aggregated article means the agent skipped the
 * substitution and the article is not publishable.
 *
 * Keep this list in sync with the markers used in
 * `analysis/templates/*.md`.
 */
const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /\[REQUIRED:[^\]]*\]/,
  /AI[_-]MUST[_-]REPLACE/i,
  /\bTBD\b\s*:/,
  /<insert\b[^>]*>/i,
  /\bFILL[_\s]IN\b/i,
];

/**
 * Reader-Facing Output Contract — every aggregated article must contain
 * these reader-facing landmarks. The aggregator generates the Reader
 * Intelligence Guide and the Article Sources appendix automatically;
 * the BLUF and Executive Brief sections come from the
 * `executive-brief.md` artifact and are guarded here so a malformed
 * template can't ship a headless article.
 */
const REQUIRED_LANDMARKS: ReadonlyArray<{ pattern: RegExp; label: string; code: string }> = [
  {
    pattern: /^##\s+Reader Intelligence Guide\s*$/m,
    label: 'Reader Intelligence Guide',
    code: 'missing-reader-guide',
  },
  {
    pattern: /^##\s+Executive Brief\s*$/m,
    label: '## Executive Brief section',
    code: 'missing-executive-brief',
  },
  {
    pattern: /^#{2,6}\s+(?:[^\n]*?\s)?BLUF\b/im,
    label: 'BLUF heading inside the executive brief',
    code: 'missing-bluf',
  },
  {
    pattern: /^##\s+Article Sources\s*$/m,
    label: 'Article Sources appendix',
    code: 'missing-sources-appendix',
  },
];

const MIN_BLUF_PROSE_CHARS = 80;
const MAX_BLUF_PROSE_CHARS = 1200; // generous — long BLUFs are fine; we just guard against empty/stub or runaway dumps
const MIN_PER_DOC_DOK_ID_HITS = 1;

/**
 * Minimum number of evidence anchors required inside the BLUF prose
 * paragraph. An anchor is any of:
 *   - a `dok_id`-shaped token (e.g. `HD12345`, `FiU17`, `Prop. 2025/26:259`)
 *   - a vote ID (`votering_id` or `Votering`)
 *   - a primary-source URL on `data.riksdagen.se` / `riksdagen.se` /
 *     `regeringen.se` / `scb.se` / `imf.org`
 *   - a markdown link to a per-document section (`#rm-`)
 *
 * One anchor is a soft floor — the issue calls for "every BLUF claim
 * carries an evidence anchor", but enforcing a per-claim count is
 * brittle without natural-language parsing. The floor here guarantees
 * that at least one verifiable anchor reaches the BLUF.
 */
const MIN_BLUF_EVIDENCE_ANCHORS = 1;

/**
 * Footer-style markers that must not appear more than once in the
 * aggregated article. Catches the same family of repeated blocks the
 * cleaning pipeline guards against in {@link
 * scripts/render-lib/aggregator/cleaning/structural.ts}.
 *
 * Each pattern anchors to the start of a line (`^`) and matches the
 * **full line** content so that two distinct footer lines like
 * `**ISMS classification**: PUBLIC, no PII.` and
 * `**ISMS classification**: INTERNAL, restricted.` produce different
 * match strings and are therefore NOT flagged as duplicates. Only
 * truly identical footer lines (same text) are counted.
 *
 * Patterns are case-insensitive to catch `**isms …**` emitted by
 * some AI templates.
 */
const FOOTER_MARKER_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /^[^\S\n]*\*\*ISMS\b[^\n]*/gim, label: '**ISMS …**' },
  { pattern: /^[^\S\n]*\*\*Classified under\b[^\n]*/gim, label: '**Classified under …**' },
  { pattern: /^[^\S\n]*\*\*Hack23 ISMS\b[^\n]*/gim, label: '**Hack23 ISMS …**' },
  { pattern: /^[^\S\n]*\*\*Article-Generation contract\b[^\n]*/gim, label: '**Article-Generation contract …**' },
  { pattern: /^[^\S\n]*\*\*Provenance\b[^\n]*/gim, label: '**Provenance …**' },
  { pattern: /^[^\S\n]*\*\*GDPR\b[^\n]*/gim, label: '**GDPR …**' },
];

async function walk(dir: string, name: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const st = await stat(full);
    if (st.isDirectory()) {
      out.push(...(await walk(full, name)));
    } else if (entry === name) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Extract the prose paragraph that immediately follows a `## … BLUF …`
 * heading. Mirrors the renderer's BLUF-extraction logic in spirit —
 * we don't re-import the aggregator here because the validator must
 * stay decoupled from the render pipeline so CI can run it
 * independently of any aggregation step.
 */
function extractBluf(article: string): string | null {
  const m = article.match(/^#{2,6}\s+(?:[^\n]*?\s)?BLUF\b[^\n]*\n+([\s\S]*?)(?=\n#{1,6}\s|\n*$)/im);
  if (!m) return null;
  const paragraph = m[1]!.split(/\n\n+/).map((p) => p.trim()).find((p) => p.length > 0 && !/^[#|>*<]/.test(p));
  return paragraph ?? null;
}

/**
 * Find every per-document subsection (`### HD12345` produced by the
 * aggregator beneath the `## Per-document intelligence` header) and
 * return each one's body. The body must contain at least one
 * `dok_id` reference so the article remains traceable to a primary
 * source — orphan per-document sections are blocked.
 */
function extractPerDocumentSections(article: string): Array<{ id: string; body: string }> {
  const start = article.match(/^##\s+Per-document intelligence\s*$/m);
  if (!start || start.index === undefined) return [];
  const tail = article.slice(start.index + start[0].length);
  // Stop at the next `## ` heading (next top-level section in the article).
  const stop = tail.search(/^##\s+\S/m);
  const region = stop === -1 ? tail : tail.slice(0, stop);
  const sections: Array<{ id: string; body: string }> = [];

  // The aggregator emits one `### <dok_id>` per per-document analysis,
  // where `<dok_id>` is a riksdagen identifier such as `HD12345` or
  // `FiU17`. After in-body heading demotion (`### Document summary`,
  // `### Classification`, …) every other `### …` heading inside the
  // section body is *content*, not a new per-document boundary.
  // We therefore split only on H3 headings whose text matches a
  // dok_id-shaped token — everything between two such headings (or
  // from the last one to end-of-region) is one section's body.
  const DOK_ID_HEADING = /^###\s+(H[A-Z0-9]{6,10}|[A-ZÅÄÖ]{1,4}\d{4,8})\s*$/m;
  let cursor = region;
  // First pass — anchor to the first dok_id heading.
  let m = cursor.match(DOK_ID_HEADING);
  while (m && m.index !== undefined) {
    const id = m[1]!;
    const after = cursor.slice(m.index + m[0].length);
    const next = after.match(DOK_ID_HEADING);
    const body = next && next.index !== undefined ? after.slice(0, next.index) : after;
    sections.push({ id, body });
    if (!next || next.index === undefined) break;
    cursor = after.slice(next.index);
    m = cursor.match(DOK_ID_HEADING);
  }
  return sections;
}

/**
 * Count evidence anchors inside a BLUF prose paragraph. Anchors are the
 * traceable tokens that lift a claim from rhetoric to verifiable
 * intelligence:
 *
 *   - dok_id-shaped codes (`HD12345`, `FiU17`)
 *   - parliamentary doc references (`Prop. 2025/26:247`, `Skr. 2025/26:259`)
 *   - vote IDs (`votering_id=…`, `Votering(\s+\d|:\s+\w)`)
 *   - primary-source URLs on `data.riksdagen.se` / `riksdagen.se` /
 *     `regeringen.se` / `scb.se` / `imf.org`
 *   - markdown anchors to per-document sections (`#rm-`)
 */
export function countBlufEvidenceAnchors(bluf: string): number {
  const patterns: RegExp[] = [
    // Riksdag dok_ids and committee betänkande codes — merged into one
    // alternation so the engine counts each token exactly once:
    //
    //   Branch 1 (H-series): `H` + lookahead requiring ≥1 digit + 6–10
    //   alphanumeric chars. Matches `HD03259`, `HC01SoU29`, `HD024100`.
    //   The lookahead prevents ordinary words like "Hardened" (no digits)
    //   or "Helsinki" (no digits) from matching.
    //
    //   Branch 2 (committee codes): two uppercase Riksdag-alphabet letters
    //   + 1–8 digits. Matches `KU23`, `AU10`, `TU5`. Does NOT re-match
    //   H-series tokens — the regex engine tries branch 1 first at any H;
    //   if branch 1 succeeds (e.g. `HD03259`) it consumes the whole token
    //   before the `g` flag advances, so branch 2 is never attempted there.
    /\b(?:H(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]{6,10}|[A-ZÅÄÖ]{2}\d{1,8})\b/g,
    // Parliamentary doc references.
    /\b(?:Prop|Skr|Mot|Bet|Ds|SOU|Dir)\.\s*\d{4}\/\d{2}:\d+/gi,
    // Riksrevisionen audit references — "RiR 2025:30".
    /\bRiR\s+\d{4}:\d+/gi,
    // Vote IDs.
    /\bvotering(?:_id)?\b[^\n]*?\d/gi,
    // Primary-source URLs (matches the full URL token so that each URL
    // contributes exactly one anchor regardless of any embedded dok_id in
    // the path segment — dok_id double-counting is acceptable because the
    // URL is independently verifiable).
    /https?:\/\/(?:www\.)?(?:data\.riksdagen\.se|riksdagen\.se|regeringen\.se|scb\.se|imf\.org)[^\s)]*/gi,
    // Markdown anchors to per-document / aggregator sections.
    /#rm-[a-z0-9-]+/g,
  ];
  let total = 0;
  for (const p of patterns) {
    const matches = bluf.match(p);
    if (matches) total += matches.length;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Editorial QA scanners (issue #245 — provenance / citation-density / banned-phrase)
// ---------------------------------------------------------------------------

/**
 * Load banned phrases from the canonical JSON file. Returns the flat
 * array of literal substrings. Caches after first load.
 */
let _bannedPhrasesCache: string[] | null = null;
export function loadBannedPhrases(repoRoot: string = REPO_ROOT): string[] {
  if (_bannedPhrasesCache) return _bannedPhrasesCache;
  const jsonPath = join(repoRoot, 'analysis', 'methodologies', 'political-style-guide.json');
  if (!existsSync(jsonPath)) return [];
  const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as { allPhrases?: string[] };
  _bannedPhrasesCache = data.allPhrases ?? [];
  return _bannedPhrasesCache;
}

/** Reset cache (for testing). */
export function resetBannedPhrasesCache(): void {
  _bannedPhrasesCache = null;
}

/**
 * Scan text for banned phrases (case-insensitive literal substring match).
 * Returns the list of hits with the matched phrase and a short context snippet.
 */
export function scanBannedPhrases(
  text: string,
  bannedPhrases: string[],
): Array<{ phrase: string; context: string }> {
  const hits: Array<{ phrase: string; context: string }> = [];
  const lower = text.toLowerCase();
  for (const phrase of bannedPhrases) {
    const needle = phrase.toLowerCase();
    let idx = lower.indexOf(needle);
    while (idx !== -1) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + phrase.length + 20);
      const context = text.slice(start, end).replace(/\n/g, ' ');
      hits.push({ phrase, context });
      idx = lower.indexOf(needle, idx + 1);
    }
  }
  return hits;
}

/**
 * Count evidence anchors in the entire article body (same patterns as
 * `countBlufEvidenceAnchors` but applied to the full text).
 */
export function countArticleEvidenceAnchors(text: string): number {
  return countBlufEvidenceAnchors(text);
}

/**
 * Count words in text (splits on whitespace, excludes markdown syntax tokens).
 */
export function countWords(text: string): number {
  // Strip markdown links, images, HTML tags, and fenced code blocks
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '') // fenced code
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/<[^>]+>/g, '') // HTML tags
    .replace(/^\s*[-|>#+*]\s*/gm, '') // list/table/quote markers
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // links → text only
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Compute citation density: words per evidence anchor. Lower = denser.
 * Returns Infinity if zero anchors found.
 */
export function computeCitationDensity(text: string): number {
  const anchors = countArticleEvidenceAnchors(text);
  if (anchors === 0) return Infinity;
  const words = countWords(text);
  return words / anchors;
}

/**
 * Scan `economicProvenance` blocks for stale vintage (>6 months without
 * annotation). Returns stale entries.
 *
 * Provenance blocks look like:
 * ```
 * economicProvenance:
 *   provider: imf
 *   ...
 *   retrieved_at: 2026-01-15
 * ```
 * or inline: `retrieved_at: 2026-01-15`
 */
export function scanStaleProvenance(
  text: string,
  referenceDate: Date = new Date(),
): Array<{ retrievedAt: string; ageMonths: number }> {
  const stale: Array<{ retrievedAt: string; ageMonths: number }> = [];
  // Match retrieved_at dates in YAML-like blocks
  const dateRe = /retrieved_at:\s*(\d{4}-\d{2}-\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(text)) !== null) {
    const dateStr = m[1]!;
    const retrieved = new Date(dateStr);
    const diffMs = referenceDate.getTime() - retrieved.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMonths > 6) {
      // Check if it's wrapped in an annotation block (<!-- stale-vintage … -->)
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const contextBefore = text.slice(Math.max(0, lineStart - 200), lineStart);
      if (!contextBefore.includes('stale-vintage') && !contextBefore.includes('vintage-annotation')) {
        stale.push({ retrievedAt: dateStr, ageMonths: Math.round(diffMonths * 10) / 10 });
      }
    }
  }
  return stale;
}

/**
 * Slug a heading the way the renderer (and the aggregator's Reader
 * Intelligence Guide) does: lowercase, replace non-word with `-`,
 * strip leading/trailing dashes. We don't pull github-slugger into
 * the validator because we only need to catch the double-dash case;
 * the renderer is the source of truth for production slugs.
 */
function permissiveSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate a single aggregated `article.md`. Returns the list of
 * violations (empty array means the article passes).
 */
async function validateArticle(absPath: string): Promise<ArticleViolation[]> {
  const rel = relative(REPO_ROOT, absPath);
  const text = await readFile(absPath, 'utf8');
  const violations: ArticleViolation[] = [];

  // 1. Placeholder strings must not survive Pass-2.
  for (const pat of PLACEHOLDER_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      violations.push({
        file: rel,
        code: 'unresolved-placeholder',
        message: `Template placeholder ${JSON.stringify(m[0])} was not replaced during AI-FIRST Pass-2 — see analysis/templates/README.md "Reader-Facing Output Contract".`,
      });
    }
  }

  // 2. Required reader-facing landmarks.
  for (const landmark of REQUIRED_LANDMARKS) {
    if (!landmark.pattern.test(text)) {
      violations.push({
        file: rel,
        code: landmark.code,
        message: `Aggregated article is missing the required "${landmark.label}". The aggregator generates Reader Intelligence Guide and Article Sources automatically; missing Executive Brief / BLUF means the source artifact is malformed.`,
      });
    }
  }

  // 2b. Reader Intelligence Guide single-occurrence invariant.
  const guideMatches = text.match(/^##\s+Reader Intelligence Guide\s*$/gm);
  if (guideMatches && guideMatches.length > 1) {
    violations.push({
      file: rel,
      code: 'duplicate-reader-guide',
      message: `Reader Intelligence Guide heading appears ${guideMatches.length} times — must be exactly once. The cleaning pipeline should strip inline duplicates before the aggregator emits the canonical instance.`,
    });
  }

  // 3. BLUF must be a real prose paragraph, not a stub.
  const bluf = extractBluf(text);
  if (bluf !== null) {
    if (bluf.length < MIN_BLUF_PROSE_CHARS) {
      violations.push({
        file: rel,
        code: 'bluf-too-short',
        message: `BLUF prose is only ${bluf.length} chars — minimum is ${MIN_BLUF_PROSE_CHARS}. A publishable BLUF needs actor + active verb + object + when + so-what.`,
      });
    }
    if (bluf.length > MAX_BLUF_PROSE_CHARS) {
      violations.push({
        file: rel,
        code: 'bluf-too-long',
        message: `BLUF prose is ${bluf.length} chars — maximum is ${MAX_BLUF_PROSE_CHARS}. Move the long-form analysis to the Synthesis Summary or Intelligence Assessment section.`,
      });
    }
    // 3b. BLUF must carry at least one evidence anchor — every claim
    //     should be reachable from a primary source.
    const anchors = countBlufEvidenceAnchors(bluf);
    if (anchors < MIN_BLUF_EVIDENCE_ANCHORS) {
      violations.push({
        file: rel,
        code: 'bluf-missing-evidence-anchor',
        message: `BLUF carries ${anchors} evidence anchor(s) — minimum is ${MIN_BLUF_EVIDENCE_ANCHORS}. Add a dok_id (e.g. HD12345), parliamentary reference (Prop. 2025/26:259), vote ID, or primary-source URL (data.riksdagen.se / regeringen.se / scb.se / imf.org).`,
      });
    }
  }

  // 3c. Reader Intelligence Guide must contain at least one data row,
  //     not just the heading. The aggregator emits the table; missing
  //     rows means the artifact set is empty or the renderer regressed.
  const guideHeadingMatch = text.match(/^##\s+Reader Intelligence Guide\s*$/m);
  if (guideHeadingMatch && guideHeadingMatch.index !== undefined) {
    const after = text.slice(guideHeadingMatch.index + guideHeadingMatch[0].length);
    const stop = after.search(/^##\s+\S/m);
    const region = stop === -1 ? after : after.slice(0, stop);
    // A data row in the RIG table starts with `| [` (the markdown link
    // wrapping the reader-need cell). Heuristic, but exactly matches
    // {@link buildReaderGuide}'s output.
    const dataRows = region.match(/^\|\s*\[/gm) ?? [];
    if (dataRows.length === 0) {
      violations.push({
        file: rel,
        code: 'reader-guide-empty-table',
        message: `Reader Intelligence Guide table has zero data rows — the aggregator should emit at least one row per available artifact lens. Verify the artifact set is non-empty and re-aggregate.`,
      });
    }
  }

  // 3d. Footer-style markers must not appear more than once in the
  //     aggregated article. The cleaning pipeline collapses duplicates
  //     before aggregation; a duplicate here means cleaning regressed
  //     or the AI agent emitted the same footer in two artifact bodies.
  for (const marker of FOOTER_MARKER_PATTERNS) {
    const matches = text.match(marker.pattern) ?? [];
    if (matches.length > 1) {
      // Count *unique* occurrences — a footer that legitimately recurs
      // (e.g. distinct ISMS classifications per per-document section)
      // produces different strings; only true duplicates are flagged.
      const unique = new Set(matches);
      if (unique.size < matches.length) {
        violations.push({
          file: rel,
          code: 'duplicate-footer-marker',
          message: `Footer marker ${marker.label} appears ${matches.length} times with ${matches.length - unique.size} duplicate(s) — collapse via the cleaning pipeline (scripts/render-lib/aggregator/cleaning/structural.ts → collapseRepeatedFooterBlocks).`,
        });
      }
    }
  }

  // 4. Heading-anchor health: no `--` doubles after `rm-` prefix is applied.
  //    We test the equivalent at the markdown level: no heading whose
  //    permissive slug is empty or starts with `-`.
  const headingLines = text.match(/^#{2,6}\s+\S[^\n]*$/gm) ?? [];
  for (const h of headingLines) {
    const text = h.replace(/^#+\s+/, '').trim();
    const slug = permissiveSlug(text);
    if (!slug) {
      violations.push({
        file: rel,
        code: 'empty-heading-slug',
        message: `Heading ${JSON.stringify(text)} produces an empty slug — pick a heading that contains at least one word/digit so the rendered #anchor is non-empty.`,
      });
    }
  }

  // 5. Per-document sections must cite at least one dok_id-style code.
  const docSections = extractPerDocumentSections(text);
  const dokIdRe = /\b(?:H[A-Z0-9]{6,10}|[A-ZÅÄÖ]{1,4}\d{4,8})\b/;
  for (const section of docSections) {
    const hits = section.body.match(new RegExp(dokIdRe.source, 'g')) ?? [];
    if (hits.length < MIN_PER_DOC_DOK_ID_HITS) {
      violations.push({
        file: rel,
        code: 'per-doc-missing-dok_id',
        message: `Per-document section "${section.id}" cites zero dok_id-style codes — minimum is ${MIN_PER_DOC_DOK_ID_HITS}. Every per-document subsection must trace back to at least one primary-source identifier (e.g. HD12345, FiU17).`,
      });
    }
  }

  // 6. Registry-driven required artifacts check: ensure per-type
  //    `extraArtifacts` are present in the analysis subfolder.
  const parentDir = dirname(absPath);
  const subfolderName = basename(parentDir);
  const typeEntry = getBySubfolder(subfolderName);
  const extraArtifacts = typeEntry?.extraArtifacts ?? [];
  if (extraArtifacts.length > 0) {
    let filesOnDisk: Set<string>;
    try {
      const entries = await readdir(parentDir);
      filesOnDisk = new Set(entries);
    } catch {
      filesOnDisk = new Set<string>();
    }
    for (const required of extraArtifacts) {
      if (!filesOnDisk.has(required)) {
        violations.push({
          file: rel,
          code: 'missing-required-artifact',
          message: `Article type "${typeEntry!.id}" requires artifact "${required}" but it is missing from ${relative(REPO_ROOT, parentDir)}/. Add the artifact or update the registry.`,
        });
      }
    }
  }

  // 7. Editorial QA: banned-phrase scan.
  const bannedPhrases = loadBannedPhrases();
  if (bannedPhrases.length > 0) {
    const hits = scanBannedPhrases(text, bannedPhrases);
    if (hits.length > 0) {
      const sample = hits.slice(0, 3).map((h) => `"${h.phrase}"`).join(', ');
      violations.push({
        file: rel,
        code: 'banned-phrase-detected',
        message: `Article contains ${hits.length} banned phrase(s) (${sample}${hits.length > 3 ? ', …' : ''}). Rewrite using evidence-anchored alternatives per political-style-guide.md.`,
      });
    }
  }

  // 8. Editorial QA: citation density.
  const wordCount = countWords(text);
  if (wordCount > 200) {
    const density = computeCitationDensity(text);
    const threshold = 200; // words-per-anchor — generous default for full articles
    if (density > threshold) {
      violations.push({
        file: rel,
        code: 'low-citation-density',
        message: `Citation density is ${Math.round(density)} words/anchor — maximum allowed is ${threshold}. Add more evidence anchors (dok_id, vote IDs, primary-source URLs) to meet the editorial floor.`,
      });
    }
  }

  // 9. Editorial QA: economicProvenance vintage check.
  if (text.includes('retrieved_at:')) {
    const staleEntries = scanStaleProvenance(text);
    if (staleEntries.length > 0) {
      const sample = staleEntries.slice(0, 2).map((e) => `${e.retrievedAt} (${e.ageMonths}mo)`).join(', ');
      violations.push({
        file: rel,
        code: 'stale-economic-provenance',
        message: `${staleEntries.length} economicProvenance block(s) have vintage >6 months without annotation: ${sample}. Wrap in <!-- stale-vintage: reason --> or refresh data per ECONOMIC_DATA_CONTRACT.md.`,
      });
    }
  }

  return violations;
}

async function main(): Promise<void> {
  const argPaths = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  let files: string[];
  if (argPaths.length > 0) {
    files = argPaths.map((p) => resolve(REPO_ROOT, p));
  } else {
    files = await walk(join(REPO_ROOT, 'analysis', 'daily'), 'article.md');
  }

  if (files.length === 0) {
    console.log('ℹ️  validate-article: no aggregated article.md files found — nothing to check.');
    return;
  }

  let total = 0;
  const buckets = new Map<string, number>();
  for (const f of files) {
    const violations = await validateArticle(f);
    if (violations.length === 0) continue;
    total += violations.length;
    for (const v of violations) {
      buckets.set(v.code, (buckets.get(v.code) ?? 0) + 1);
      console.error(`❌ ${v.file}\n   [${v.code}] ${v.message}`);
    }
  }

  console.log('');
  console.log(`📊 validate-article: scanned ${files.length} article(s).`);
  if (total === 0) {
    console.log('✅ All aggregated articles pass the minimum-content contract.');
    return;
  }
  console.log(`❌ ${total} violation(s) across ${buckets.size} rule(s):`);
  for (const [code, count] of [...buckets.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   • ${code}: ${count}`);
  }
  console.error('');
  console.error('Article-quality minimums are documented in Article-Generation.md');
  console.error('and analysis/templates/README.md (Reader-Facing Output Contract).');
  process.exit(1);
}

// Only execute the CLI entry point when this module is invoked
// directly (e.g. `npx tsx scripts/validate-article.ts`); importing the
// module from unit tests must not trigger an analysis-tree walk.
const isCliEntry =
  process.argv[1] !== undefined &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isCliEntry) {
  main().catch((err: unknown) => {
    console.error('💥 validate-article: unhandled error');
    console.error(err);
    process.exit(2);
  });
}
