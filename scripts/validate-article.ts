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
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve, basename, dirname } from 'node:path';
import process from 'node:process';

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
  if (typeEntry && typeEntry.extraArtifacts.length > 0) {
    const filesOnDisk = existsSync(parentDir)
      ? new Set(readdirSync(parentDir))
      : new Set<string>();
    for (const required of typeEntry.extraArtifacts) {
      if (!filesOnDisk.has(required)) {
        violations.push({
          file: rel,
          code: 'missing-required-artifact',
          message: `Article type "${typeEntry.id}" requires artifact "${required}" but it is missing from ${relative(REPO_ROOT, parentDir)}/. Add the artifact or update the registry.`,
        });
      }
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

main().catch((err: unknown) => {
  console.error('💥 validate-article: unhandled error');
  console.error(err);
  process.exit(2);
});
