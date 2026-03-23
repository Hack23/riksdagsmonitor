/**
 * @module Swedish Leakage Detector
 * @description Detects untranslated Swedish text in non-Swedish articles.
 *
 * Scans HTML content for Swedish-specific tokens that should have been
 * translated. Reports leaked terms with their positions and a leakage score.
 *
 * Used as a CI gate: if any non-SV article contains ≥ threshold untranslated
 * Swedish tokens the check fails.
 *
 * Usage:
 *   npx tsx scripts/detect-swedish-leakage.ts --dir news/ --threshold 3
 */

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
 */
export const SWEDISH_PARLIAMENTARY_TERMS: ReadonlySet<string> = new Set([
  'betänkande', 'proposition', 'utskottet', 'utskott', 'riksdagen',
  'regeringen', 'departementet', 'motionen', 'interpellation',
  'anförande', 'votering', 'omröstning', 'bordläggning',
  'remiss', 'yttrande', 'statsråd', 'ledamot', 'riksdagsledamot',
  'utgiftsområde', 'budgetpropositionen', 'vårpropositionen',
  'finansutskottet', 'justitieutskottet', 'försvarsutskottet',
  'socialutskottet', 'utbildningsutskottet', 'utrikesutskottet',
  'skatteutskottet', 'trafikutskottet', 'kulturutskottet',
  'tillkännagivande', 'lagförslag', 'lagstiftning',
  'sammanträde', 'anmälan', 'granskning', 'beredning',
  'anslag', 'utgiftstak', 'statsbudgeten',
]);

/** Result for a single detected leaked term. */
export interface LeakedTerm {
  /** The Swedish token detected. */
  readonly term: string;
  /** 1-based line number where the term was found. */
  readonly line: number;
}

/** Aggregated leakage report for a single article. */
export interface LeakageReport {
  /** Array of leaked Swedish terms found. */
  readonly leakedTerms: ReadonlyArray<LeakedTerm>;
  /** Number of leaked terms (convenience). */
  readonly score: number;
}

// ---------------------------------------------------------------------------
// HTML stripping helper
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags and decode common entities to get plain text.
 * This is used only for analysis/detection purposes, NOT for sanitisation.
 * @param html - Raw HTML string
 * @returns Plain text content
 */
export function stripHtml(html: string): string {
  // Remove script and style blocks iteratively until none remain
  let text = html;
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi, ' ');
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi, ' ');
  }
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common entities (order matters: &amp; last to avoid double-decode)
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Swedish characters (HTML named and numeric entities)
    .replace(/&auml;|&#228;|&#xE4;/g, 'ä')
    .replace(/&Auml;|&#196;|&#xC4;/g, 'Ä')
    .replace(/&ouml;|&#246;|&#xF6;/g, 'ö')
    .replace(/&Ouml;|&#214;|&#xD6;/g, 'Ö')
    .replace(/&aring;|&#229;|&#xE5;/g, 'å')
    .replace(/&Aring;|&#197;|&#xC5;/g, 'Å')
    // Common quote and dash entities
    .replace(/&ndash;|&#8211;|&#x2013;/g, '-')
    .replace(/&mdash;|&#8212;|&#x2014;/g, '-')
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;|&#x201C;|&#x201D;/g, '"')
    .replace(/&lsquo;|&rsquo;|&#8216;|&#8217;|&#x2018;|&#x2019;|&apos;/g, "'")
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

  const lines = html.split('\n');
  const leaked: LeakedTerm[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const plainLine = stripHtml(lines[i]);
    const words = plainLine.split(/[\s,.:;!?()[\]{}'"]+/).filter(Boolean);

    for (const word of words) {
      const lower = word.toLowerCase();

      // Check against Swedish stop words (require ≥2 chars to avoid false positives)
      if (lower.length >= 2 && SWEDISH_STOP_WORDS.has(lower) && !seen.has(lower)) {
        // Only flag Swedish stop words if they're clearly not shared with the target language
        if (!isSharedWord(lower, targetLang)) {
          seen.add(lower);
          leaked.push({ term: lower, line: i + 1 });
        }
      }

      // Check against Swedish parliamentary terms (always flag)
      if (SWEDISH_PARLIAMENTARY_TERMS.has(lower) && !seen.has(lower)) {
        seen.add(lower);
        leaked.push({ term: lower, line: i + 1 });
      }
    }
  }

  return { leakedTerms: leaked, score: leaked.length };
}

// ---------------------------------------------------------------------------
// Shared word filter – some Swedish words are valid in other languages
// ---------------------------------------------------------------------------

/** Words shared between Swedish and specific other languages. */
const SHARED_WORDS: Partial<Record<Language, ReadonlySet<string>>> = {
  // Danish shares some common words with Swedish but not 'och', 'att', 'från' etc.
  da: new Set(['det', 'den', 'var', 'kan', 'efter', 'eller', 'under', 'mot']),
  // Norwegian shares some common words with Swedish
  no: new Set(['det', 'den', 'var', 'kan', 'eller', 'under', 'mot']),
  de: new Set(['det', 'var']),
  nl: new Set(['det', 'met']),
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
      threshold = parseInt(args[i + 1], 10);
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
      const html = readFileSync(`${dir}/${file}`, 'utf-8');
      const report = detectSwedishLeakage(html, langCode);

      if (report.score >= threshold) {
        console.error(`❌ ${file}: ${report.score} Swedish tokens detected (threshold: ${threshold})`);
        for (const t of report.leakedTerms.slice(0, 5)) {
          console.error(`   Line ${t.line}: "${t.term}"`);
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
const isMainModule = typeof process !== 'undefined' && process.argv[1]?.match(/detect-swedish-leakage\.(ts|js)$/);
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
