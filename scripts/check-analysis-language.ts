/**
 * Analysis Language Checker — English-only enforcement for analysis artifacts
 *
 * Enforces English-only prose in all analysis artifacts under analysis/daily by scanning
 * for Swedish function words and political-vocabulary tokens. Exempts translation outputs
 * (executive-brief_<lang>.md), Pass-1 snapshots, and data-download-manifest.md.
 *
 * @module scripts/check-analysis-language
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Swedish-marker tokens — unambiguous Swedish function words and political vocabulary
 * that essentially never appear in English prose. Used for density-based language detection.
 */
const SWEDISH_MARKERS = new Set([
  // Function words (unambiguous Swedish)
  'och', 'att', 'för', 'men', 'inte', 'är', 'som', 'den', 'det',
  'har', 'hade', 'kommer', 'skall', 'måste', 'enligt', 'samt',
  'därför', 'därmed', 'genom', 'vidare', 'följande', 'sina',
  'sitt', 'vilket', 'vilken', 'något', 'några', 'denna', 'dessa',
  'varje', 'övriga', 'övrig', 'tillika', 'därutöver', 'härmed', 'härav',
  
  // Swedish political vocabulary (proper nouns handled separately)
  'riksdagen', 'regeringen', 'propositionen', 'utskottet',
  'föreslår', 'föreslagit', 'införande', 'införa', 'införs', 'införts',
  'säkerhetshot', 'utvisning', 'utvisa', 'beslut', 'beslutet',
]);

/** Minimum threshold for Swedish density (5%) */
const SWEDISH_DENSITY_THRESHOLD = 0.05;

/** Minimum absolute Swedish-marker count to trigger a violation (avoid false positives on short snippets) */
const MIN_SWEDISH_MARKERS = 5;

/**
 * Strip YAML frontmatter, code fences, and inline code from Markdown content.
 * Returns the raw prose body for language detection.
 */
export function stripMarkdownCodeAndFrontmatter(content: string): string {
  let body = content;
  
  // Remove YAML frontmatter (---\n...\n---)
  body = body.replace(/^---\n[\s\S]*?\n---\n/m, '');
  
  // Remove code fences (```...```)
  body = body.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code (`...`)
  body = body.replace(/`[^`]+`/g, '');
  
  return body;
}

/**
 * Tokenize Markdown prose into lowercase words (A-Z, À-ž, Swedish å ä ö).
 * Returns an array of lowercase word tokens.
 */
export function tokenizeWords(text: string): string[] {
  const matches = text.match(/[A-Za-zÀ-žÅÄÖåäö]+/g);
  return matches ? matches.map(w => w.toLowerCase()) : [];
}

/**
 * Calculate Swedish-marker density and count for a Markdown file.
 * Returns { totalWords, swedishMarkerCount, density }.
 */
export function calculateSwedishDensity(filepath: string): {
  totalWords: number;
  swedishMarkerCount: number;
  density: number;
} {
  const content = readFileSync(filepath, 'utf-8');
  const prose = stripMarkdownCodeAndFrontmatter(content);
  const words = tokenizeWords(prose);
  
  const totalWords = words.length;
  const swedishMarkerCount = words.filter(w => SWEDISH_MARKERS.has(w)).length;
  const density = totalWords > 0 ? swedishMarkerCount / totalWords : 0;
  
  return { totalWords, swedishMarkerCount, density };
}

/**
 * Recursively find all .md files in a directory, excluding:
 * - executive-brief_<lang>.md (translation outputs)
 * - article.<lang>.md (forbidden — caught by validate-file-ownership)
 * - pass1/ subdirectories (Pass-1 snapshots)
 * - data-download-manifest.md (exempt — heavy Swedish source titles)
 * - README.md (per-folder index, not aggregated into article.md)
 */
export function findAnalysisMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip pass1/ subdirectories
        if (entry.name === 'pass1') continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Skip executive-brief_<lang>.md (translation outputs)
        if (/^executive-brief_[a-z]{2}\.md$/.test(entry.name)) continue;

        // Skip article.<lang>.md (now forbidden — caught by ownership validator)
        if (/^article\.[a-z]{2}\.md$/.test(entry.name)) continue;

        // Skip data-download-manifest.md (exempt — heavy Swedish source titles)
        if (entry.name === 'data-download-manifest.md') continue;

        // Skip per-folder README.md (index file, not aggregated into article.md)
        if (entry.name === 'README.md') continue;

        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Validate that all analysis artifacts in the given directory are English-only.
 * Returns an array of violation objects { filepath, totalWords, swedishMarkerCount, density }.
 */
export interface LanguageViolation {
  filepath: string;
  relpath: string;
  totalWords: number;
  swedishMarkerCount: number;
  density: number;
}

export function validateAnalysisLanguage(analysisDir: string): LanguageViolation[] {
  const violations: LanguageViolation[] = [];
  const files = findAnalysisMarkdownFiles(analysisDir);
  
  for (const filepath of files) {
    const { totalWords, swedishMarkerCount, density } = calculateSwedishDensity(filepath);
    
    // Violation: density > threshold AND absolute count > minimum
    if (density > SWEDISH_DENSITY_THRESHOLD && swedishMarkerCount > MIN_SWEDISH_MARKERS) {
      violations.push({
        filepath,
        relpath: relative(process.cwd(), filepath),
        totalWords,
        swedishMarkerCount,
        density,
      });
    }
  }
  
  return violations;
}

/**
 * Format a violation table for console output.
 */
export function formatViolationTable(violations: LanguageViolation[]): string {
  if (violations.length === 0) return '';
  
  const header = '| File | Words | Swedish | Density |';
  const separator = '|------|------:|--------:|--------:|';
  const rows = violations.map(v =>
    `| ${v.relpath} | ${v.totalWords} | ${v.swedishMarkerCount} | ${v.density.toFixed(3)} |`
  );
  
  return [header, separator, ...rows].join('\n');
}

/**
 * CLI entry point: check analysis language for a given directory.
 * Usage: npx tsx scripts/check-analysis-language.ts <analysis-dir>
 */
export async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/check-analysis-language.ts <analysis-dir>');
    process.exit(1);
  }
  
  const analysisDir = args[0]!;
  
  // Check that the directory exists
  try {
    const stats = statSync(analysisDir);
    if (!stats.isDirectory()) {
      console.error(`❌ analysis-language: ${analysisDir} is not a directory`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ analysis-language: ${analysisDir} does not exist`);
    process.exit(1);
  }
  
  const violations = validateAnalysisLanguage(analysisDir);
  
  if (violations.length > 0) {
    console.error(`❌ analysis-language: ${violations.length} violation(s) detected (Swedish density > ${SWEDISH_DENSITY_THRESHOLD})\n`);
    console.error(formatViolationTable(violations));
    process.exit(1);
  }
  
  // Count total files checked
  const totalFiles = findAnalysisMarkdownFiles(analysisDir).length;
  console.log(`✅ analysis-language: 0 violations across ${totalFiles} files (English-only)`);
  process.exit(0);
}

// Run CLI if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
