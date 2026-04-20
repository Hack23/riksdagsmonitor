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
 *   npx tsx scripts/detect-swedish-leakage.ts --dir news/ --threshold 5
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

/** Valid boundary after an HTML tag name. */
function isTagNameBoundary(ch: string | undefined): boolean {
  return ch === undefined || ch === '>' || ch === '/' || /\s/.test(ch);
}

/**
 * Strip specific HTML tag blocks using a single-pass index-based scan
 * (avoids regex tag filters and repeated toLowerCase).
 *
 * For preserveNewlines=true, removed content is replaced with spaces while keeping '\n'
 * positions intact so line numbering remains stable.
 */
function stripTagBlocks(html: string, tagNames: ReadonlyArray<string>, preserveNewlines: boolean): string {
  const lower = html.toLowerCase();
  const length = html.length;
  const resultParts: string[] = [];
  let copyFrom = 0;
  let i = 0;

  while (i < length) {
    if (lower[i] !== '<') {
      i++;
      continue;
    }

    let matchedBlock = false;
    for (const tagName of tagNames) {
      const openPrefix = `<${tagName}`;
      if (!lower.startsWith(openPrefix, i)) continue;

      const openNameBoundaryIndex = i + 1 + tagName.length;
      if (!isTagNameBoundary(lower[openNameBoundaryIndex])) continue;

      const openEnd = lower.indexOf('>', openNameBoundaryIndex);
      if (openEnd === -1) continue;

      const closePrefix = `</${tagName}`;
      const closeStart = lower.indexOf(closePrefix, openEnd + 1);
      if (closeStart === -1) continue;

      const closeNameBoundaryIndex = closeStart + 2 + tagName.length;
      if (!isTagNameBoundary(lower[closeNameBoundaryIndex])) continue;

      const closeEnd = lower.indexOf('>', closeNameBoundaryIndex);
      if (closeEnd === -1) continue;

      // Push text before this block
      if (i > copyFrom) {
        resultParts.push(html.slice(copyFrom, i));
      }

      // Push replacement for the matched block
      const block = html.slice(i, closeEnd + 1);
      const replacement = preserveNewlines
        ? block.replace(/[^\n]/g, ' ')
        : ' ';
      resultParts.push(replacement);

      i = closeEnd + 1;
      copyFrom = i;
      matchedBlock = true;
      break;
    }

    if (!matchedBlock) {
      i++;
    }
  }

  // Push remaining text after the last matched block
  if (copyFrom < length) {
    resultParts.push(html.slice(copyFrom));
  }

  return resultParts.join('');
}

/**
 * Locate the closing `>` of an HTML tag starting at `startIndex`, correctly skipping
 * quoted attribute values so that `>` inside `"..."` or `'...'` is not treated as the tag end.
 * Returns -1 when no closing `>` is found.
 */
function findTagEnd(html: string, startIndex: number): number {
  let quote: '"' | "'" | null = null;
  for (let i = startIndex + 1; i < html.length; i++) {
    const ch = html[i];
    if (quote !== null) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') return i;
  }
  return -1;
}

interface ParsedTag {
  tagEnd: number;
  tagName: string | null;
  isClosing: boolean;
  isSelfClosing: boolean;
  rawTag: string;
}

/** Parse the tag starting at `startIndex`; returns null if no `<` is at that position. */
function parseTagAt(html: string, startIndex: number): ParsedTag | null {
  if (html[startIndex] !== '<') return null;
  const tagEnd = findTagEnd(html, startIndex);
  if (tagEnd === -1) return null;

  const rawTag = html.slice(startIndex, tagEnd + 1);
  const inner = rawTag.slice(1, -1).trim();
  // Skip comments, DOCTYPE, and processing instructions.
  if (inner.length === 0 || inner.startsWith('!') || inner.startsWith('?')) {
    return { tagEnd, tagName: null, isClosing: false, isSelfClosing: false, rawTag };
  }

  const isClosing = inner.startsWith('/');
  const nameSource = isClosing ? inner.slice(1).trimStart() : inner;
  const nameMatch = /^([a-zA-Z][a-zA-Z0-9]*)/.exec(nameSource);
  const tagName = nameMatch ? nameMatch[1].toLowerCase() : null;
  const isSelfClosing = !isClosing && /\/\s*>$/.test(rawTag);

  return { tagEnd, tagName, isClosing, isSelfClosing, rawTag };
}

/** Extract the value of the `lang` attribute from a raw tag string, or null if absent. */
function getLangAttributeValue(rawTag: string): string | null {
  const m = /\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(rawTag);
  return m?.[1] ?? m?.[2] ?? m?.[3] ?? null;
}

/**
 * Check whether a `lang` attribute value matches the given language code,
 * supporting BCP-47 subtags (e.g. `sv-SE` matches `sv`, `sv-FI` matches `sv`).
 */
function langMatches(langValue: string | null, langCode: string): boolean {
  if (!langValue || !langCode) return false;
  const v = langValue.toLowerCase();
  const c = langCode.toLowerCase();
  return v === c || v.startsWith(`${c}-`);
}

/**
 * Find the index of the matching closing tag for the element opened at `openingTagStart`.
 * Uses depth tracking to correctly handle nested elements with the same tag name.
 * Returns the index of the final `>` of the closing tag, or -1 when not found.
 */
function findMatchingTaggedBlockEnd(html: string, openingTagStart: number, tagName: string): number {
  const opening = parseTagAt(html, openingTagStart);
  if (!opening) return -1;

  let depth = 1;
  let i = opening.tagEnd + 1;
  while (i < html.length) {
    if (html[i] !== '<') { i++; continue; }
    const parsed = parseTagAt(html, i);
    if (!parsed) break;

    if (parsed.tagName === tagName) {
      if (parsed.isClosing) {
        depth--;
        if (depth === 0) return parsed.tagEnd;
      } else if (!parsed.isSelfClosing) {
        depth++;
      }
    }
    i = parsed.tagEnd + 1;
  }
  return -1;
}

/**
 * Strip the inner contents of any HTML element whose `lang` attribute matches `langCode`
 * (including BCP-47 subtags — `lang="sv-SE"` matches `langCode="sv"`). Uses an index-based
 * tag scanner with depth tracking so nested elements of the same tag name are handled
 * correctly, and quoted attribute values containing `>` do not break parsing.
 *
 * The full matched block is replaced with whitespace while `\n` characters are preserved
 * so downstream line numbering stays stable.
 *
 * This enables `detectSwedishLeakage` to correctly ignore deliberately quoted Swedish source
 * material (e.g. verbatim summaries) embedded inside `<span lang="sv">...</span>` wrappers.
 */
function stripLangTaggedBlocks(html: string, langCode: string): string {
  const safeLang = langCode.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  if (safeLang.length === 0) return html;

  const chars = html.split('');

  let i = 0;
  while (i < html.length) {
    if (html[i] !== '<') { i++; continue; }

    const parsed = parseTagAt(html, i);
    if (!parsed) break;

    if (
      !parsed.isClosing &&
      !parsed.isSelfClosing &&
      parsed.tagName !== null &&
      langMatches(getLangAttributeValue(parsed.rawTag), safeLang)
    ) {
      const blockEnd = findMatchingTaggedBlockEnd(html, i, parsed.tagName);
      if (blockEnd !== -1) {
        for (let j = i; j <= blockEnd; j++) {
          if (chars[j] !== '\n') chars[j] = ' ';
        }
        i = blockEnd + 1;
        continue;
      }
    }

    i = parsed.tagEnd + 1;
  }

  return chars.join('');
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
    .replace(/&#0*39;|&#[xX]0*27;/g, "'")
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
  let cleaned = stripTagBlocks(html, ['script', 'style'], true);

  // Strip elements explicitly tagged as Swedish content (e.g. `<span lang="sv">...</span>`).
  // Text inside a `lang="sv"` element is deliberately quoted Swedish source material
  // (e.g. verbatim summaries from riksdagen.se) and MUST NOT count as translation leakage
  // in a non-Swedish article. This call is only reached for non-Swedish targets because
  // `targetLang === 'sv'` short-circuits with an empty report above, so legitimate Swedish
  // text in Swedish articles is never removed. Replacement preserves '\n' so reported line
  // numbers stay accurate.
  cleaned = stripLangTaggedBlocks(cleaned, 'sv');

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
  // German: do not treat "det" or "var" as shared, to avoid hiding Swedish leakage
  de: new Set([]),
  // Dutch: currently no Swedish stop words are treated as shared
  nl: new Set([]),
  fr: new Set([]),
  es: new Set([]),
  fi: new Set([]),
  // English shares a very small set of these short common forms with Swedish (e.g. "under"
  // can appear legitimately in technical or proper-noun contexts). Keep this set narrow
  // and limited to tokens that are genuinely ambiguous in English prose.
  en: new Set(['under']),
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
  // English political writing about Sweden uses "Riksdag" (and inflections) verbatim —
  // it has no common English equivalent. Other parliamentary terms (proposition, motion,
  // interpellation, anförande, statsråd, regering) should still be translated and are
  // intentionally NOT shared here, consistent with the translation quality gate tests.
  en: new Set([
    'riksdag', 'riksdagen', 'riksdagens',
  ]),
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
  let threshold = 5;

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
