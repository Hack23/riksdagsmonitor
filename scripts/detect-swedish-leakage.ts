/**
 * @module Swedish Leakage Detector
 * @description Detects untranslated Swedish text in non-Swedish articles.
 *
 * Scans HTML content for Swedish-specific tokens that should have been
 * translated. Reports leaked terms with their positions and a leakage score.
 *
 * Typically used as an advisory CI check: the script exits non-zero if any
 * non-SV article contains ≥ threshold untranslated Swedish tokens, but CI
 * workflows may choose to run it with `continue-on-error`.
 *
 * Usage:
 *   npx tsx scripts/detect-swedish-leakage.ts --dir news/ --threshold 3
 */

import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Language } from './types/language.js';

// ---------------------------------------------------------------------------
// Swedish-only vocabulary – high-confidence tokens that are exclusively Swedish
// and should never appear in correctly translated content.
// ---------------------------------------------------------------------------

/**
 * Common Swedish function words that are almost never valid in other languages.
 * Each word is a lower-case Swedish term.
 */
export const SWEDISH_STOP_WORDS: ReadonlySet<string> = new Set([
  'och', 'att', 'det', 'som', 'är', 'för', 'med', 'har', 'den',
  'inte', 'ska', 'kan', 'till', 'ett', 'var', 'blir', 'också',
  'efter', 'vid', 'eller', 'från', 'dessa', 'samt', 'enligt',
  'genom', 'inom', 'redan', 'dels', 'bland', 'dock', 'även',
  'mellan', 'under', 'utan', 'sedan', 'bör', 'hos', 'mot',
]);

/**
 * Swedish parliamentary terms that should always be translated.
 * These are domain-specific Swedish words that should never appear in e.g. English articles.
 * Includes common inflected forms (definite, plural, genitive) to catch actual leaked tokens.
 */
export const SWEDISH_PARLIAMENTARY_TERMS: ReadonlySet<string> = new Set([
  // Betänkande (committee report) – base + common inflections
  'betänkande', 'betänkanden', 'betänkandet', 'betänkandena',
  // Proposition (government bill)
  'proposition', 'propositionen', 'propositioner', 'propositionerna',
  // Utskott (committee)
  'utskott', 'utskottet', 'utskotten', 'utskottets', 'utskottens',
  // Riksdag (parliament)
  'riksdag', 'riksdagen', 'riksdagens',
  // Regering (government)
  'regering', 'regeringen', 'regeringens',
  // Motion (member's bill)
  'motion', 'motionen', 'motioner', 'motionerna', 'motionens',
  // Interpellation (formal question)
  'interpellation', 'interpellationen', 'interpellationer', 'interpellationerna',
  // Anförande (speech)
  'anförande', 'anförandet', 'anföranden', 'anförandena',
  // Votering / omröstning (vote)
  'votering', 'voteringen', 'voteringar', 'voteringarna',
  'omröstning', 'omröstningen', 'omröstningar', 'omröstningarna',
  // Bordläggning (tabling)
  'bordläggning', 'bordläggningen',
  // Remiss / yttrande (referral / opinion)
  'remiss', 'remissen', 'remisser', 'remisserna',
  'yttrande', 'yttrandet', 'yttranden', 'yttrandena',
  // Statsråd / ledamot / riksdagsledamot (minister / member of parliament)
  'statsråd', 'statsrådet', 'statsråden',
  'ledamot', 'ledamoten', 'ledamöter', 'ledamöterna',
  'riksdagsledamot', 'riksdagsledamoten', 'riksdagsledamöter', 'riksdagsledamöterna',
  // Budget terms
  'utgiftsområde', 'utgiftsområdet', 'utgiftsområden',
  'budgetpropositionen', 'vårpropositionen',
  // Committee names (already definite form)
  'finansutskottet', 'justitieutskottet', 'försvarsutskottet',
  'socialutskottet', 'utbildningsutskottet', 'utrikesutskottet',
  'skatteutskottet', 'trafikutskottet', 'kulturutskottet',
  // Other procedure terms
  'tillkännagivande', 'tillkännagivanden', 'tillkännagivandet',
  'lagförslag', 'lagförslaget', 'lagförslagen',
  'lagstiftning', 'lagstiftningen',
  'sammanträde', 'sammanträdet', 'sammanträden',
  'anmälan', 'anmälningar', 'anmälningarna',
  'granskning', 'granskningen', 'granskningar',
  'beredning', 'beredningen', 'beredningar',
  'anslag', 'anslaget', 'anslagen',
  'utgiftstak', 'utgiftstaket',
  'statsbudgeten',
  // Swedish government ministries (departement) – should always be translated
  'finansdepartementet',
  'utrikesdepartementet',
  'justitiedepartementet',
  'försvarsdepartementet',
  'utbildningsdepartementet',
  'socialdepartementet',
  'kulturdepartementet',
  'miljödepartementet',
  'infrastrukturdepartementet',
  'arbetsmarknadsdepartementet',
  'näringsdepartementet',
]);

/** Result for a single detected leaked term. */
export interface LeakedTerm {
  /** The Swedish token detected. */
  readonly term: string;
  /** 1-based line number where the term was first found. */
  readonly line: number;
  /** Number of occurrences of this term in the article. */
  readonly count: number;
}

/** Aggregated leakage report for a single article. */
export interface LeakageReport {
  /** Array of leaked Swedish terms found (deduplicated, with per-term counts). */
  readonly leakedTerms: ReadonlyArray<LeakedTerm>;
  /** Total number of Swedish token occurrences detected across all leaked terms. */
  readonly score: number;
}

// ---------------------------------------------------------------------------
// HTML stripping helper
// ---------------------------------------------------------------------------

/**
 * Options for stripHtml processing.
 *
 * skipBlockStripping: Set to true when script/style blocks have already been
 * removed by a prior pass (e.g. line-preserving preprocessing in detectSwedishLeakage)
 * to avoid redundant block stripping work.
 */
interface StripHtmlOptions {
  readonly skipBlockStripping?: boolean;
}

const OPEN_TAG_PREFIX_LENGTH = 1; // "<"
const CLOSE_TAG_PREFIX_LENGTH = 2; // "</"
// Safety ceiling for malformed/adversarial HTML that could otherwise keep toggling "changed".
const MAX_TAG_STRIP_ITERATIONS = 10000;

/** Valid boundary after an HTML tag name. */
function isTagNameBoundary(ch: string | undefined): boolean {
  return ch === undefined || ch === '>' || ch === '/' || /\s/.test(ch);
}

/**
 * Strip specific HTML tag blocks using index-based parsing (avoids regex tag filters).
 *
 * For preserveNewlines=true, removed content is replaced with spaces while keeping '\n'
 * positions intact so line numbering remains stable.
 */
function stripTagBlocks(html: string, tagNames: ReadonlyArray<string>, preserveNewlines: boolean): string {
  let text = html;
  let changed = true;
  // Safety bound to avoid pathological loops on malformed/adversarial input.
  const maxIterations = Math.max(1, Math.min(MAX_TAG_STRIP_ITERATIONS, text.length));
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    iterations++;
    changed = false;
    const lower = text.toLowerCase();

    for (const tagName of tagNames) {
      let searchFrom = 0;
      while (searchFrom < lower.length) {
        const openStart = lower.indexOf(`<${tagName}`, searchFrom);
        if (openStart === -1) {
          break;
        }
        const openNameBoundaryIndex = openStart + OPEN_TAG_PREFIX_LENGTH + tagName.length;
        if (!isTagNameBoundary(lower[openNameBoundaryIndex])) {
          searchFrom = openStart + 1;
          continue;
        }

        const openEnd = lower.indexOf('>', openStart + OPEN_TAG_PREFIX_LENGTH);
        if (openEnd === -1) {
          break;
        }

        const closeStart = lower.indexOf(`</${tagName}`, openEnd + 1);
        if (closeStart === -1) {
          break;
        }
        const closeNameBoundaryIndex = closeStart + CLOSE_TAG_PREFIX_LENGTH + tagName.length;
        if (!isTagNameBoundary(lower[closeNameBoundaryIndex])) {
          searchFrom = closeStart + 1;
          continue;
        }

        const closeEnd = lower.indexOf('>', closeStart + CLOSE_TAG_PREFIX_LENGTH);
        if (closeEnd === -1) {
          break;
        }

        const replacement = preserveNewlines
          ? text.slice(openStart, closeEnd + 1).replace(/[^\n]/g, ' ')
          : ' ';
        text = text.slice(0, openStart) + replacement + text.slice(closeEnd + 1);
        changed = true;
        break;
      }

      if (changed) {
        break;
      }
    }
  }

  return text;
}

/** Remove all remaining HTML tags using an index-based state machine. */
function stripAllTags(html: string): string {
  const chunks: string[] = [];
  let inTag = false;

  for (let i = 0; i < html.length; i++) {
    const ch = html[i];
    if (ch === '<') {
      if (!inTag) {
        chunks.push(' ');
      }
      inTag = true;
      continue;
    }
    if (ch === '>' && inTag) {
      inTag = false;
      continue;
    }
    if (!inTag) {
      chunks.push(ch);
    }
  }

  return chunks.join('');
}

/**
 * Strip HTML tags and decode common entities to get plain text.
 * This is used only for analysis/detection purposes, NOT for sanitisation.
 * @param html - Raw HTML string
 * @returns Plain text content
 */
export function stripHtml(html: string, options: StripHtmlOptions = {}): string {
  let text = html;

  if (!options.skipBlockStripping) {
    // Remove script/style blocks first to avoid matching inner tag-like content.
    text = stripTagBlocks(text, ['script', 'style'], false);
  }

  // Remove remaining tags
  text = stripAllTags(text);
  // Decode common entities.
  // First, decode doubly-encoded entity references (&amp;#xE4; → &#xE4;) so that
  // the subsequent hex/numeric patterns can match them in a single pass.
  text = text.replace(/&amp;(#\w+;)/g, '&$1');
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Swedish characters (HTML named and numeric entities, case-insensitive hex)
    .replace(/&auml;|&#228;|&#[xX]0*[eE]4;/g, 'ä')
    .replace(/&Auml;|&#196;|&#[xX]0*[cC]4;/g, 'Ä')
    .replace(/&ouml;|&#246;|&#[xX]0*[fF]6;/g, 'ö')
    .replace(/&Ouml;|&#214;|&#[xX]0*[dD]6;/g, 'Ö')
    .replace(/&aring;|&#229;|&#[xX]0*[eE]5;/g, 'å')
    .replace(/&Aring;|&#197;|&#[xX]0*[cC]5;/g, 'Å')
    // Common quote and dash entities (case-insensitive hex, optional leading zeros)
    .replace(/&ndash;|&#8211;|&#[xX]0*2013;/g, '-')
    .replace(/&mdash;|&#8212;|&#[xX]0*2014;/g, '-')
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;|&#[xX]0*201[Cc];|&#[xX]0*201[Dd];/g, '"')
    .replace(/&lsquo;|&rsquo;|&#8216;|&#8217;|&#[xX]0*2018;|&#[xX]0*2019;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
  // Normalise whitespace
  return text.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Core detection logic
// ---------------------------------------------------------------------------

/**
 * Detect Swedish leakage in HTML content intended for a non-Swedish audience.
 *
 * @param html       - Full article HTML
 * @param targetLang - The article's target language (e.g. 'en', 'de')
 * @returns LeakageReport with leaked terms and score
 */
export function detectSwedishLeakage(html: string, targetLang: Language): LeakageReport {
  // Swedish articles are expected to contain Swedish text.
  if (targetLang === 'sv') {
    return { leakedTerms: [], score: 0 };
  }

  // Strip script/style blocks on the full HTML first so multi-line blocks are
  // removed correctly. Preserve newline count so reported line numbers remain accurate.
  const cleaned = stripTagBlocks(html, ['script', 'style'], true);

  const lines = cleaned.split('\n');
  const leaked: LeakedTerm[] = [];
  /** First-seen line for each term. */
  const firstLine = new Map<string, number>();
  /** Per-term occurrence count. */
  const counts = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const plainLine = stripHtml(lines[i], { skipBlockStripping: true });
    const words = plainLine.split(/[-\s,.:;!?()[\]{}'"]+/).filter(Boolean);

    for (const word of words) {
      const lower = word.toLowerCase();

      // Check against Swedish stop words (require ≥2 chars to avoid false positives)
      if (lower.length >= 2 && SWEDISH_STOP_WORDS.has(lower)) {
        if (!isSharedWord(lower, targetLang)) {
          counts.set(lower, (counts.get(lower) ?? 0) + 1);
          if (!firstLine.has(lower)) {
            firstLine.set(lower, i + 1);
          }
        }
      }

      // Check against Swedish parliamentary terms, also applying shared-word filter
      // to avoid false positives in Scandinavian languages (e.g. "proposition" shared across languages)
      if (SWEDISH_PARLIAMENTARY_TERMS.has(lower)) {
        if (!isSharedParliamentaryTerm(lower, targetLang)) {
          counts.set(lower, (counts.get(lower) ?? 0) + 1);
          if (!firstLine.has(lower)) {
            firstLine.set(lower, i + 1);
          }
        }
      }
    }
  }

  // Build deduplicated results with counts
  for (const [term, line] of firstLine) {
    leaked.push({ term, line, count: counts.get(term) ?? 1 });
  }

  // Score: total number of Swedish token occurrences detected across all leaked terms
  const totalOccurrences = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

  return { leakedTerms: leaked, score: totalOccurrences };
}

// ---------------------------------------------------------------------------
// Shared word filter – some Swedish words are valid in other languages
// ---------------------------------------------------------------------------

/** Words shared between Swedish and specific other languages. */
const SHARED_WORDS: Partial<Record<Language, ReadonlySet<string>>> = {
  // Danish shares some common words with Swedish but not 'och', 'att', 'från' etc.
  da: new Set(['det', 'den', 'var', 'kan', 'efter', 'eller', 'under', 'mot', 'med', 'som', 'har']),
  // Norwegian shares some common words with Swedish
  no: new Set(['det', 'den', 'var', 'kan', 'eller', 'under', 'mot', 'med', 'som', 'har']),
  // German: do not treat "det" as shared, to avoid hiding Swedish leakage
  de: new Set(['var']),
  // Dutch: do not treat "det" as shared, only include actually shared words
  nl: new Set(['met']),
  fr: new Set([]),
  es: new Set([]),
  fi: new Set([]),
  en: new Set([]),
  ar: new Set([]),
  he: new Set([]),
  ja: new Set([]),
  ko: new Set([]),
  zh: new Set([]),
};

/**
 * Check if a Swedish word is also a valid word in the target language,
 * to avoid false positives (e.g. "det" in Danish).
 */
function isSharedWord(word: string, targetLang: Language): boolean {
  const shared = SHARED_WORDS[targetLang];
  return shared ? shared.has(word) : false;
}

/**
 * Parliamentary terms that are valid/identical in specific Scandinavian target
 * languages and should not be flagged as Swedish leakage for those languages.
 * Includes inflected forms to match the expanded SWEDISH_PARLIAMENTARY_TERMS set.
 */
const SHARED_PARLIAMENTARY_TERMS: Partial<Record<Language, ReadonlySet<string>>> = {
  // Norwegian uses many of the same parliamentary terms as Swedish
  no: new Set([
    'proposition', 'propositionen', 'propositioner', 'propositionerna',
    'interpellation', 'interpellationen', 'interpellationer', 'interpellationerna',
    'regeringen', 'regeringens',
    'statsråd', 'statsrådet', 'statsråden',
    // Only keep ministry names whose spelling is truly identical in Swedish and Norwegian.
    // Swedish-only spellings (försvarsdepartementet, miljödepartementet,
    // arbetsmarknadsdepartementet, näringsdepartementet) are NOT shared —
    // Norwegian uses distinct forms, so Swedish spellings should be flagged.
    'finansdepartementet',
    'kulturdepartementet',
    'infrastrukturdepartementet',
  ]),
  // Danish shares some parliamentary vocabulary
  da: new Set([
    'proposition', 'propositionen', 'propositioner', 'propositionerna',
    'interpellation', 'interpellationen', 'interpellationer', 'interpellationerna',
    'regeringen', 'regeringens',
  ]),
};

/**
 * Check if a Swedish parliamentary term is also valid in the target language.
 */
function isSharedParliamentaryTerm(term: string, targetLang: Language): boolean {
  const shared = SHARED_PARLIAMENTARY_TERMS[targetLang];
  return shared ? shared.has(term) : false;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let dir = 'news/';
  let threshold = 3;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      dir = args[i + 1];
      i++;
    }
    if (args[i] === '--threshold' && args[i + 1]) {
      const rawThreshold = args[i + 1];
      // Validate: must be a positive integer (optional leading zeros allowed, e.g. "03")
      if (!/^0*[1-9]\d*$/.test(rawThreshold)) {
        console.error(`Invalid --threshold value "${rawThreshold}". Threshold must be a positive integer.`);
        process.exit(1);
      }
      const parsed = Number(rawThreshold);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        console.error(`Invalid --threshold value "${rawThreshold}". Threshold must be a positive integer.`);
        process.exit(1);
      }
      threshold = parsed;
      i++;
    }
  }

  const { readdirSync, readFileSync } = await import('fs');
  const files = readdirSync(dir).filter((f: string) => f.endsWith('.html'));

  const langCodes: ReadonlyArray<Language> = [
    'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
  ];

  let totalFailures = 0;

  for (const langCode of langCodes) {
    const langFiles = files.filter((f: string) => f.endsWith(`-${langCode}.html`));

    for (const file of langFiles) {
      const html = readFileSync(join(dir, file), 'utf-8');
      const report = detectSwedishLeakage(html, langCode);

      if (report.score >= threshold) {
        console.error(`❌ ${file}: ${report.score} Swedish tokens detected (threshold: ${threshold})`);
        for (const t of report.leakedTerms.slice(0, 5)) {
          console.error(`   Line ${t.line}: "${t.term}" (×${t.count})`);
        }
        totalFailures++;
      }
    }
  }

  if (totalFailures > 0) {
    console.error(`\n${totalFailures} file(s) exceeded the Swedish leakage threshold.`);
    process.exit(1);
  } else {
    console.log('✅ All non-Swedish articles passed Swedish leakage check.');
  }
}

// Run CLI when invoked directly
const isMainModule =
  typeof process !== 'undefined' &&
  typeof process.argv?.[1] === 'string' &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
