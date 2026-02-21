/**
 * @module Intelligence/Terminology
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Vocabulary Extraction - Political Terminology Pattern Analysis
 *
 * @description
 * Advanced terminology extraction system analyzing translated news articles across
 * all 14 supported languages to identify and catalog political terminology patterns.
 *
 * @author Hack23 AB (Linguistic Intelligence Team)
 * @license Apache-2.0
 * @version 2.5.0
 */

import { readFileSync, readdirSync } from 'fs';
import { basename, join } from 'path';

import type { Language } from './types/language.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Map of language codes to language names */
const LANGUAGES: Readonly<Record<Language, string>> = {
  en: 'English', sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish',
  de: 'German', fr: 'French', es: 'Spanish', nl: 'Dutch',
  ar: 'Arabic', he: 'Hebrew', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
};

interface ExtractedTerms {
  titles?: string[];
  watchLabel?: string;
  committeeLabel?: string;
  documentLabel?: string;
  mainTitle?: string;
}

interface ArticleSample {
  readonly file: string;
  readonly type: string;
  readonly terms: ExtractedTerms;
}

interface LanguageResult {
  readonly language: string;
  readonly code: Language;
  samples: ArticleSample[];
}

interface SkippedFile {
  readonly file: string;
  readonly reason: string;
}

type AnalysisResults = Record<Language, LanguageResult>;

// Track skipped files for warning summary
const skippedFiles: SkippedFile[] = [];

// ---------------------------------------------------------------------------
// Term extraction
// ---------------------------------------------------------------------------

/**
 * Extract political terms from HTML content using structure-based approach.
 */
function extractTerms(content: string, _lang: Language): ExtractedTerms {
  const terms: ExtractedTerms = {};

  // Extract titles (main political terminology)
  const h3Pattern = /<h3>(.*?)<\/h3>/g;
  const h3Matches: string[] = [];
  let h3Match: RegExpExecArray | null;
  while ((h3Match = h3Pattern.exec(content)) !== null) {
    const cleanText = h3Match[1]!.replace(/<[^>]+>/g, '').trim();
    if (cleanText) h3Matches.push(cleanText);
  }
  terms.titles = h3Matches.slice(0, 10);

  // Extract "What to Watch" heading (any language) - structure-based
  const h2Pattern = /<h2[^>]*>([^<]+)<\/h2>/g;
  const h2Matches: string[] = [];
  let h2Match: RegExpExecArray | null;
  while ((h2Match = h2Pattern.exec(content)) !== null) {
    const text = h2Match[1]!.trim();
    if (text.length > 5 && text.length < 100) {
      h2Matches.push(text);
    }
  }
  if (h2Matches.length > 0) {
    terms.watchLabel = h2Matches[0];
  }

  // Extract structured labels from <strong>…:</strong> (language-agnostic)
  const strongLabelPattern = /<strong>\s*([^:<]+?)\s*:\s*<\/strong>/g;
  const strongLabels: string[] = [];
  let strongMatch: RegExpExecArray | null;
  while ((strongMatch = strongLabelPattern.exec(content)) !== null) {
    const label = strongMatch[1]!.trim();
    if (label.length > 0 && label.length < 50) {
      strongLabels.push(label);
    }
  }

  if (strongLabels[0]) terms.committeeLabel = strongLabels[0];
  if (strongLabels[1]) terms.documentLabel = strongLabels[1];

  // Extract article type from title
  const titleMatch = content.match(/<h1>([^<]+)<\/h1>/);
  if (titleMatch) terms.mainTitle = titleMatch[1]!.trim();

  return terms;
}

// ---------------------------------------------------------------------------
// Article analysis
// ---------------------------------------------------------------------------

/**
 * Analyze all news articles.
 */
function analyzeArticles(directory: string = 'news', datePrefix: string | null = null): AnalysisResults {
  const results: AnalysisResults = {} as AnalysisResults;

  for (const lang of Object.keys(LANGUAGES) as Language[]) {
    results[lang] = {
      language: LANGUAGES[lang],
      code: lang,
      samples: [],
    };
  }

  try {
    const files = readdirSync(directory).filter((f) => {
      if (!f.endsWith('.html')) return false;
      if (datePrefix && !f.includes(datePrefix)) return false;
      return true;
    });

    console.log(`\nScanning ${files.length} HTML files in ${directory}/`);
    if (datePrefix) {
      console.log(`Filtering by date prefix: "${datePrefix}"\n`);
    }

    for (const file of files) {
      const match = file.match(/-([a-z]{2})\.html$/);
      if (!match) {
        skippedFiles.push({ file, reason: 'No language code in filename' });
        continue;
      }

      const lang = match[1] as string;
      if (!results[lang as Language]) {
        skippedFiles.push({ file, reason: `Unknown language code: ${lang}` });
        continue;
      }

      try {
        const content = readFileSync(join(directory, file), 'utf-8');
        const terms = extractTerms(content, lang as Language);

        // Determine article type
        let articleType = 'general';
        if (file.includes('committee')) articleType = 'committee-reports';
        else if (file.includes('proposition')) articleType = 'propositions';
        else if (file.includes('motion')) articleType = 'motions';
        else if (file.includes('evening')) articleType = 'evening-analysis';
        else if (file.includes('week-ahead')) articleType = 'week-ahead';

        results[lang as Language].samples.push({
          file: basename(file),
          type: articleType,
          terms,
        });
      } catch (error: unknown) {
        skippedFiles.push({ file, reason: `Read error: ${(error as Error).message}` });
      }
    }
  } catch (error: unknown) {
    console.error(`Error reading directory: ${(error as Error).message}`);
    process.exit(1);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/**
 * Generate vocabulary report.
 */
function generateReport(results: AnalysisResults): void {
  console.log('\n========================================');
  console.log('Political Vocabulary Analysis Report');
  console.log('========================================\n');

  for (const [code, data] of Object.entries(results) as Array<[Language, LanguageResult]>) {
    if (data.samples.length === 0) continue;

    console.log(`\n## ${data.language} (${code.toUpperCase()})`);
    console.log(`Samples analyzed: ${data.samples.length}`);

    // Collect unique labels
    const watchLabels = new Set<string>();
    const committeeLabels = new Set<string>();
    const documentLabels = new Set<string>();
    const _mainTitles = new Set<string>();

    for (const sample of data.samples) {
      if (sample.terms.watchLabel) watchLabels.add(sample.terms.watchLabel);
      if (sample.terms.committeeLabel) committeeLabels.add(sample.terms.committeeLabel);
      if (sample.terms.documentLabel) documentLabels.add(sample.terms.documentLabel);
      if (sample.terms.mainTitle) _mainTitles.add(sample.terms.mainTitle);
    }

    if (watchLabels.size > 0) console.log(`  "What to Watch": ${Array.from(watchLabels).join(', ')}`);
    if (committeeLabels.size > 0) console.log(`  "Committee": ${Array.from(committeeLabels).join(', ')}`);
    if (documentLabels.size > 0) console.log(`  "Document": ${Array.from(documentLabels).join(', ')}`);

    // Show sample titles from any articles (prioritize committee reports)
    const committeeReports = data.samples.filter((s) => s.type === 'committee-reports');
    const sampleWithTitles =
      committeeReports.find((s) => s.terms.titles && s.terms.titles.length > 0) ||
      data.samples.find((s) => s.terms.titles && s.terms.titles.length > 0);

    if (sampleWithTitles && sampleWithTitles.terms.titles && sampleWithTitles.terms.titles.length > 0) {
      console.log(`  Sample titles: ${sampleWithTitles.terms.titles.slice(0, 3).join(', ')}`);
    }
  }

  // Warning summary
  if (skippedFiles.length > 0) {
    console.log('\n\n⚠️  WARNING: Skipped Files Summary');
    console.log('=====================================');
    console.log(`Total skipped: ${skippedFiles.length}\n`);

    // Group by reason
    const byReason: Record<string, string[]> = {};
    for (const { file, reason } of skippedFiles) {
      if (!byReason[reason]) byReason[reason] = [];
      byReason[reason].push(file);
    }

    for (const [reason, files] of Object.entries(byReason)) {
      console.log(`${reason}: ${files.length} file(s)`);
      if (files.length <= 5) {
        files.forEach((f) => console.log(`  - ${f}`));
      } else {
        files.slice(0, 3).forEach((f) => console.log(`  - ${f}`));
        console.log(`  ... and ${files.length - 3} more`);
      }
      console.log();
    }
  }

  console.log('\n========================================');
  console.log('Analysis complete!');
  console.log('========================================\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let datePrefix: string | null = null;
let directory = 'news';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date-prefix' && args[i + 1]) {
    datePrefix = args[i + 1]!;
    i++;
  } else if (args[i] === '--directory' && args[i + 1]) {
    directory = args[i + 1]!;
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: node scripts/extract-vocabulary.js [options]

Options:
  --date-prefix <prefix>   Filter files by date prefix (e.g., "2026-02-")
  --directory <path>       Directory to scan (default: "news")
  --help, -h              Show this help message

Examples:
  node scripts/extract-vocabulary.js
  node scripts/extract-vocabulary.js --date-prefix 2026-02-
  node scripts/extract-vocabulary.js --directory news --date-prefix 2026-03-
`);
    process.exit(0);
  }
}

// Run analysis
const results = analyzeArticles(directory, datePrefix);
generateReport(results);
