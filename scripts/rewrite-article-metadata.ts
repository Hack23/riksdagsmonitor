#!/usr/bin/env -S npx tsx
/**
 * @module Infrastructure/ArticleMetadataRewriter
 * @name In-place rewriter for `news/*.html` title / description metadata
 *
 * Usage:
 *   npx tsx scripts/rewrite-article-metadata.ts --dry-run
 *   npx tsx scripts/rewrite-article-metadata.ts --apply
 *   npx tsx scripts/rewrite-article-metadata.ts --apply --file news/2026-04-23-committeeReports-en.html
 *
 * This is the **Tier B** backfill tool (see `.github/prompts/seo-metadata-contract.md`
 * and the 5-PR plan): for every `news/*.html` already on disk, re-derive
 * a publication-quality `<title>` and `<meta description>` from the
 * article body, then rewrite the downstream OG / Twitter / JSON-LD
 * copies in a single deterministic pass.
 *
 * Unlike the from-source Tier A regenerator (`scripts/render-articles.ts`)
 * this script does **not** need `analysis/daily/$DATE/$SUB/article.md`
 * to exist — it sources the new description from the rendered article's
 * own `<article>` prose, skipping any leading admin-byline paragraphs
 * (`Classification:`, `Brief ID:`, `Prepared by:`, …) via the same
 * {@link ADMIN_FIELD_RE} / {@link ADMIN_FRAGMENT_SPLITTER} helpers that
 * the forward-fix aggregator uses for freshly-generated articles.
 *
 * Design decisions:
 * - **Idempotent by design.** A file whose existing metadata already
 *   passes the contract is untouched (we compare new vs old and skip
 *   writes when equal).
 * - **No external dependencies.** Pure regex + the already-exported
 *   `__test__` helpers from `scripts/render-lib/aggregator.ts`. No
 *   `jsdom` / `cheerio` needed; HTML is touched at byte granularity
 *   so line-endings, whitespace, and every non-targeted tag survive
 *   verbatim.
 * - **Per-language charset budgets** per contract §4: CJK 30-45 title
 *   / 70-120 description; RTL 40-70 title / 120-180 description;
 *   Latin 55-70 title / 140-200 description.
 * - **Safe JSON-LD handling.** The block is parsed with `JSON.parse`,
 *   mutated in-memory, and re-stringified with `JSON.stringify` (no
 *   pretty-printing, matching the original single-line format).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { __test__ } from './render-lib/aggregator/index.js';

const {
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
  truncateToSentenceBoundary,
  cleanArticleTitle,
  titleFromBluf,
} = __test__;

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), '..');
const NEWS_DIR = path.join(ROOT_DIR, 'news');

// ---------------------------------------------------------------------------
// Per-language metadata budgets (per `seo-metadata-contract.md` §4).
// ---------------------------------------------------------------------------

interface LangBudget {
  readonly titleMin: number;
  readonly titleMax: number;
  readonly descSoftMin: number; // truncator soft minimum
  readonly descHardMax: number; // truncator hard maximum
  /** Minimum acceptable description length after rewrite (contract §4). */
  readonly descMin: number;
}

const LATIN_BUDGET: LangBudget = {
  titleMin: 30,
  titleMax: 75,
  descSoftMin: 140,
  descHardMax: 200,
  descMin: 70,
};

const CJK_BUDGET: LangBudget = {
  titleMin: 20,
  titleMax: 55,
  descSoftMin: 70,
  descHardMax: 120,
  descMin: 40,
};

const RTL_BUDGET: LangBudget = {
  titleMin: 30,
  titleMax: 85,
  descSoftMin: 120,
  descHardMax: 180,
  descMin: 60,
};

const LANG_BUDGETS: Record<string, LangBudget> = {
  en: LATIN_BUDGET,
  sv: LATIN_BUDGET,
  da: LATIN_BUDGET,
  no: LATIN_BUDGET,
  nb: LATIN_BUDGET,
  fi: LATIN_BUDGET,
  de: LATIN_BUDGET,
  fr: LATIN_BUDGET,
  es: LATIN_BUDGET,
  nl: LATIN_BUDGET,
  ar: RTL_BUDGET,
  he: RTL_BUDGET,
  ja: CJK_BUDGET,
  ko: CJK_BUDGET,
  zh: CJK_BUDGET,
};

// ---------------------------------------------------------------------------
// HTML parse / rewrite helpers (regex-based, byte-safe)
// ---------------------------------------------------------------------------

const META_REGEXES = {
  title: /<title>([\s\S]*?)<\/title>/i,
  metaDescription: /(<meta\s+name="description"\s+content=")([^"]*)(")/i,
  ogTitle: /(<meta\s+property="og:title"\s+content=")([^"]*)(")/i,
  ogDescription: /(<meta\s+property="og:description"\s+content=")([^"]*)(")/i,
  twitterTitle: /(<meta\s+name="twitter:title"\s+content=")([^"]*)(")/i,
  twitterDescription: /(<meta\s+name="twitter:description"\s+content=")([^"]*)(")/i,
  ogImageAlt: /(<meta\s+property="og:image:alt"\s+content=")([^"]*)(")/i,
  twitterImageAlt: /(<meta\s+name="twitter:image:alt"\s+content=")([^"]*)(")/i,
  jsonLd: /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  article: /<article\b[^>]*>([\s\S]*?)<\/article>/i,
  htmlLang: /<html[^>]*\blang="([^"]+)"/i,
} as const;

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function htmlUnescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Strip inline HTML tags and collapse whitespace to produce plain prose. */
function stripTagsToText(fragment: string): string {
  return fragment
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decode common HTML entities used in our articles (numeric + named). */
function decodeEntities(s: string): string {
  let out = htmlUnescape(s);
  out = out.replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

/**
 * Extract the first prose paragraph from the article body, skipping
 * admin-byline blocks (detected via {@link ADMIN_FIELD_RE} /
 * {@link ADMIN_FRAGMENT_SPLITTER}), generic filler copy, tables,
 * figures, code blocks, and Mermaid diagrams. Returns `null` when no
 * usable prose is found.
 */
function extractBestDescription(articleHtml: string): string | null {
  const scrubbed = articleHtml
    .replace(/<pre class="mermaid"[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '')
    .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');

  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(scrubbed)) !== null) {
    const raw = m[1] ?? '';
    const text = decodeEntities(stripTagsToText(raw));
    if (text.length < 40) continue;

    const cleaned = text.replace(/^\s*(?:🎯|BLUF[:：]?)\s*/i, '').trim();

    if (BANNED_PHRASES.some((rx) => rx.test(cleaned))) continue;

    const fragments = cleaned.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    const allAdmin = fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()));
    if (allAdmin) continue;

    return cleaned;
  }
  return null;
}

/**
 * Strip admin-byline fragments from an existing description string.
 * Returns the remaining prose, or `null` when every fragment is admin.
 */
function stripAdminFromDescription(description: string): string | null {
  const fragments = description.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
  const prose = fragments.filter((f) => !ADMIN_FIELD_RE.test(f.trim())).map((f) => f.trim());
  if (prose.length === 0) return null;
  const joined = prose.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length > 0 ? joined : null;
}

/**
 * Parse the article's `lang` attribute to pick the right budget.
 * Falls back to Latin when the lang is unknown (safe default).
 */
function resolveBudget(html: string, filename: string): LangBudget {
  const m = html.match(META_REGEXES.htmlLang);
  let lang = (m?.[1] ?? '').split('-')[0]!.toLowerCase();
  if (!lang) {
    const fm = filename.match(/-(en|sv|da|no|nb|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    lang = fm?.[1] ?? 'en';
  }
  return LANG_BUDGETS[lang] ?? LATIN_BUDGET;
}

// ---------------------------------------------------------------------------
// Contract checker (subset sufficient for rewrite decisions)
// ---------------------------------------------------------------------------

interface ViolationSet {
  adminInDescription: boolean;
  brandInDocTitle: boolean;
  doubleBrandOgOrTwitter: boolean;
  executiveBriefPrefix: boolean;
  isoDateInTitle: boolean;
  descriptionTooShort: boolean;
  descriptionTooLong: boolean;
  titleTooLong: boolean;
  midWordDescriptionCut: boolean;
  genericFiller: boolean;
  bannedPhraseInDescription: boolean;
}

const BANNED_PHRASES: readonly RegExp[] = [
  /AI[- ]generated\s+political\s+intelligence/i,
  /Executive\s+Brief\s*[—-]/i,
  /\bAdmiralty\b/i,
];

function detectViolations(
  titleText: string,
  description: string,
  ogTitleText: string,
  twitterTitleText: string,
  budget: LangBudget,
): ViolationSet {
  const adminInDescription = (() => {
    const fragments = description.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    return fragments.some((f) => ADMIN_FIELD_RE.test(f.trim()));
  })();

  const isoDateInTitle = /\b\d{4}-\d{2}-\d{2}\b/.test(titleText);
  const executiveBriefPrefix = /^\s*Executive Brief\s*[—-]/i.test(titleText) ||
    /^\s*Realtime Monitor\s*[—-]/i.test(titleText);
  const brandInDocTitle = /\bRiksdagsmonitor\b/i.test(titleText);
  const doubleBrandOgOrTwitter =
    /Riksdagsmonitor.*Riksdagsmonitor/i.test(ogTitleText) ||
    /Riksdagsmonitor.*Riksdagsmonitor/i.test(twitterTitleText);

  const descriptionTooShort = description.trim().length < budget.descMin;
  const descriptionTooLong = description.trim().length > budget.descHardMax + 30;
  const titleTooLong = titleText.trim().length > budget.titleMax + 50;

  const midWordDescriptionCut = /[a-zåäöøæéèüñç]$/i.test(description.trim()) &&
    description.length >= 120;

  const genericFiller = /AI[- ]generated\s+political\s+intelligence/i.test(description);
  const bannedPhraseInDescription = BANNED_PHRASES.some((re) => re.test(description));

  return {
    adminInDescription,
    brandInDocTitle,
    doubleBrandOgOrTwitter,
    executiveBriefPrefix,
    isoDateInTitle,
    descriptionTooShort,
    descriptionTooLong,
    titleTooLong,
    midWordDescriptionCut,
    genericFiller,
    bannedPhraseInDescription,
  };
}

function needsRewrite(v: ViolationSet): boolean {
  return (
    v.adminInDescription ||
    v.doubleBrandOgOrTwitter ||
    v.executiveBriefPrefix ||
    v.isoDateInTitle ||
    v.descriptionTooLong ||
    v.titleTooLong ||
    v.midWordDescriptionCut ||
    v.genericFiller ||
    v.bannedPhraseInDescription
  );
}

// ---------------------------------------------------------------------------
// Single-file rewrite pipeline
// ---------------------------------------------------------------------------

interface RewriteOutcome {
  readonly file: string;
  readonly changed: boolean;
  readonly reasons: readonly string[];
  readonly beforeTitle: string;
  readonly afterTitle: string;
  readonly beforeDescription: string;
  readonly afterDescription: string;
}

function rewriteOne(filePath: string): { outcome: RewriteOutcome; nextHtml: string | null } {
  const html = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);

  const budget = resolveBudget(html, filename);

  const docTitleRaw = html.match(META_REGEXES.title)?.[1]?.trim() ?? '';
  const docTitleText = decodeEntities(docTitleRaw);

  const descRaw = html.match(META_REGEXES.metaDescription)?.[2] ?? '';
  const descText = decodeEntities(descRaw);

  const ogDescRaw = html.match(META_REGEXES.ogDescription)?.[2] ?? '';
  const ogDescText = decodeEntities(ogDescRaw);

  const ogTitleRaw = html.match(META_REGEXES.ogTitle)?.[2] ?? '';
  const ogTitleText = decodeEntities(ogTitleRaw);

  const twTitleRaw = html.match(META_REGEXES.twitterTitle)?.[2] ?? '';
  const twTitleText = decodeEntities(twTitleRaw);

  const richestCurrentDescription =
    [descText, ogDescText].sort((a, b) => b.length - a.length)[0] ?? '';

  const violations = detectViolations(
    docTitleText,
    richestCurrentDescription,
    ogTitleText,
    twTitleText,
    budget,
  );

  if (!needsRewrite(violations) && !violations.descriptionTooShort) {
    return {
      outcome: {
        file: filePath,
        changed: false,
        reasons: [],
        beforeTitle: docTitleText,
        afterTitle: docTitleText,
        beforeDescription: richestCurrentDescription,
        afterDescription: richestCurrentDescription,
      },
      nextHtml: null,
    };
  }

  const reasons: string[] = [];
  for (const [k, v] of Object.entries(violations)) if (v) reasons.push(k);

  let newDescription = richestCurrentDescription;

  if (violations.adminInDescription || violations.bannedPhraseInDescription || violations.genericFiller) {
    const stripped = stripAdminFromDescription(richestCurrentDescription);
    if (stripped && stripped.length >= 40) newDescription = stripped;
    else newDescription = '';   }

  const needsNewFromBody =
    newDescription.length < budget.descMin ||
    newDescription.length > budget.descHardMax ||
    violations.midWordDescriptionCut ||
    violations.genericFiller;

  if (needsNewFromBody) {
    const articleBlock = html.match(META_REGEXES.article)?.[1] ?? '';
    const fromBody = extractBestDescription(articleBlock);
    if (fromBody && fromBody.length >= budget.descMin) {
      newDescription = fromBody;
    } else if (fromBody && fromBody.length >= 40) {
      newDescription = fromBody;
    }
  }

  newDescription = truncateToSentenceBoundary(
    newDescription,
    budget.descSoftMin,
    budget.descHardMax,
  ).trim();

  if (newDescription.length === 0) {
    return {
      outcome: {
        file: filePath,
        changed: false,
        reasons: [...reasons, 'no-usable-prose'],
        beforeTitle: docTitleText,
        afterTitle: docTitleText,
        beforeDescription: richestCurrentDescription,
        afterDescription: richestCurrentDescription,
      },
      nextHtml: null,
    };
  }

  const titleWithoutBrand = docTitleText.replace(/\s*[—\-|]\s*Riksdagsmonitor\s*$/i, '').trim();

  let newTitle = titleWithoutBrand;
  const titleHasStructuralIssue =
    violations.isoDateInTitle ||
    violations.executiveBriefPrefix ||
    violations.titleTooLong ||
    violations.doubleBrandOgOrTwitter;

  if (titleHasStructuralIssue) {
    const cleaned = cleanArticleTitle(titleWithoutBrand);
    if (cleaned) {
      newTitle = cleaned;
    } else {
      const fromBluf = titleFromBluf(newDescription, budget.titleMax);
      if (fromBluf) newTitle = fromBluf;
    }

    newTitle = newTitle.replace(/\s*\d{4}-\d{2}-\d{2}(?:\s+\d{1,2}:\d{2})?\s*/g, ' ').replace(/\s+/g, ' ').trim();
    newTitle = newTitle.replace(/[\s,;:]*(?:to|till|bis|à|a|إلى|から|til|–|—|-|:)\s*$/iu, '').trim();

    if (newTitle.length > budget.titleMax + 50) {
      const slice = newTitle.slice(0, budget.titleMax);
      const lastSpace = slice.lastIndexOf(' ');
      newTitle = (lastSpace > budget.titleMin ? slice.slice(0, lastSpace) : slice).trim();
    }

    if (!newTitle || newTitle.length < 5) {
      newTitle = titleWithoutBrand || docTitleText;
    }
  }

  const brandedTitle = /riksdagsmonitor/i.test(newTitle)
    ? newTitle
    : `${newTitle} — Riksdagsmonitor`;

  let next = html;
  const escTitle = htmlEscape(newTitle);
  const escBranded = htmlEscape(brandedTitle);
  const escDesc = htmlEscape(newDescription);

  next = next.replace(META_REGEXES.title, `<title>${escBranded}</title>`);
  next = next.replace(META_REGEXES.metaDescription, (_m, pre: string, _old: string, post: string) => `${pre}${escDesc}${post}`);
  next = next.replace(META_REGEXES.ogTitle, (_m, pre: string, _old: string, post: string) => `${pre}${escBranded}${post}`);
  next = next.replace(META_REGEXES.ogDescription, (_m, pre: string, _old: string, post: string) => `${pre}${escDesc}${post}`);
  next = next.replace(META_REGEXES.twitterTitle, (_m, pre: string, _old: string, post: string) => `${pre}${escBranded}${post}`);
  next = next.replace(META_REGEXES.twitterDescription, (_m, pre: string, _old: string, post: string) => `${pre}${escDesc}${post}`);
  next = next.replace(META_REGEXES.ogImageAlt, (_m, pre: string, _old: string, post: string) => `${pre}Riksdagsmonitor ${escTitle}${post}`);
  next = next.replace(META_REGEXES.twitterImageAlt, (_m, pre: string, _old: string, post: string) => `${pre}Riksdagsmonitor ${escTitle}${post}`);

  next = next.replace(META_REGEXES.jsonLd, (whole: string, body: string) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body.trim()) as Record<string, unknown>;
    } catch {
      return whole;     }
    if (typeof parsed['@type'] === 'string' && /NewsArticle/i.test(parsed['@type'] as string)) {
      parsed.headline = newTitle;
      parsed.description = newDescription;
      if (Object.prototype.hasOwnProperty.call(parsed, 'alternativeHeadline')) {
        parsed.alternativeHeadline = newTitle;
      }
    }
    return `<script type="application/ld+json">${JSON.stringify(parsed)}</script>`;
  });

  if (next === html) {
    return {
      outcome: {
        file: filePath,
        changed: false,
        reasons: [...reasons, 'no-change-after-rewrite'],
        beforeTitle: docTitleText,
        afterTitle: docTitleText,
        beforeDescription: richestCurrentDescription,
        afterDescription: richestCurrentDescription,
      },
      nextHtml: null,
    };
  }

  return {
    outcome: {
      file: filePath,
      changed: true,
      reasons,
      beforeTitle: docTitleText,
      afterTitle: newTitle,
      beforeDescription: richestCurrentDescription,
      afterDescription: newDescription,
    },
    nextHtml: next,
  };
}

// ---------------------------------------------------------------------------
// CLI driver
// ---------------------------------------------------------------------------

function parseArgs(argv: readonly string[]): {
  dryRun: boolean;
  apply: boolean;
  singleFile: string | null;
  quiet: boolean;
} {
  let dryRun = false;
  let apply = false;
  let singleFile: string | null = null;
  let quiet = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--apply') apply = true;
    else if (a === '--file') singleFile = argv[++i] ?? null;
    else if (a === '--quiet') quiet = true;
  }
  if (!dryRun && !apply) dryRun = true;
  return { dryRun, apply, singleFile, quiet };
}

function listNewsFiles(singleFile: string | null): string[] {
  if (singleFile) {
    const abs = path.isAbsolute(singleFile) ? singleFile : path.join(ROOT_DIR, singleFile);
    if (!fs.existsSync(abs)) {
      throw new Error(`File not found: ${abs}`);
    }
    return [abs];
  }
  if (!fs.existsSync(NEWS_DIR)) return [];
  return fs
    .readdirSync(NEWS_DIR)
    .filter((n) => n.endsWith('.html') && !n.startsWith('index') && !n.startsWith('sitemap'))
    .map((n) => path.join(NEWS_DIR, n));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const files = listNewsFiles(args.singleFile);

  const started = Date.now();
  let changed = 0;
  let skipped = 0;
  let errors = 0;
  const changeLog: RewriteOutcome[] = [];

  for (const f of files) {
    try {
      const { outcome, nextHtml } = rewriteOne(f);
      if (!outcome.changed) {
        skipped += 1;
        continue;
      }
      changed += 1;
      changeLog.push(outcome);
      if (args.apply && nextHtml !== null) fs.writeFileSync(f, nextHtml, 'utf8');
      if (!args.quiet) {
        const suffix = args.apply ? '✏️  ' : '🔎 ';
        console.log(`${suffix}${path.basename(f)}  [${outcome.reasons.join(', ')}]`);
      }
    } catch (e) {
      errors += 1;
      console.error(`❌ ${path.basename(f)}: ${(e as Error).message}`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const mode = args.apply ? 'APPLIED' : 'DRY-RUN';
  console.log(`\n📊 ${mode}: ${files.length} files scanned, ${changed} changed, ${skipped} unchanged, ${errors} errors in ${elapsed}s`);

  const reportDir = path.join(ROOT_DIR, 'analysis', 'metadata-backfill');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `rewrite-report-${new Date().toISOString().slice(0, 10)}.csv`);
  const csvEscape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = ['file,reasons,before_title,after_title,before_description,after_description'];
  for (const o of changeLog) {
    rows.push(
      [
        csvEscape(path.relative(ROOT_DIR, o.file)),
        csvEscape(o.reasons.join('|')),
        csvEscape(o.beforeTitle),
        csvEscape(o.afterTitle),
        csvEscape(o.beforeDescription),
        csvEscape(o.afterDescription),
      ].join(','),
    );
  }
  fs.writeFileSync(reportPath, rows.join('\n') + '\n', 'utf8');
  console.log(`📝 Report: ${path.relative(ROOT_DIR, reportPath)}`);

  if (errors > 0) process.exitCode = 1;
}

main();
