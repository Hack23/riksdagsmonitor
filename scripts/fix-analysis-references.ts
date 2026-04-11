#!/usr/bin/env -S npx tsx
/**
 * Fix Analysis References: Inject missing "📊 Analysis & Sources" section
 *
 * This script ensures ALL news articles contain the analysis-references section
 * linking to the analysis files that were created in the same workflow run.
 * It scans the analysis/ directory to discover exactly which files exist,
 * then injects properly localized links into any article missing the section.
 *
 * **Idempotent** — safe to run multiple times. Skips articles that already
 * have `class="analysis-references"`.
 *
 * Usage:
 *   npx tsx scripts/fix-analysis-references.ts
 *   npx tsx scripts/fix-analysis-references.ts --dry-run
 *   npx tsx scripts/fix-analysis-references.ts --date 2026-04-10
 *   npx tsx scripts/fix-analysis-references.ts --date 2026-04-10 --type committee-reports
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Language } from './types/language.js';
import { ALL_LANG_CODES } from './article-template/constants.js';
import {
  generateAnalysisReferencesHtml,
  AGGREGATION_ARTICLE_TYPES,
} from './analysis-references.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const NEWS_DIR = path.join(ROOT, 'news');

// ---------------------------------------------------------------------------
// Filename slug → article type mapping
// ---------------------------------------------------------------------------

/**
 * Maps filename slugs (as they appear in article filenames) to the canonical
 * article type keys used by ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER.
 *
 * Filenames like `2026-04-10-government-propositions-en.html` use
 * `government-propositions` as the slug, but the analysis subfolder key is
 * `propositions`.
 */
const FILENAME_SLUG_TO_ARTICLE_TYPE: Record<string, string> = {
  'committee-reports': 'committee-reports',
  'government-propositions': 'propositions',
  'opposition-motions': 'motions',
  'interpellation-debates': 'interpellations',
  'evening-analysis': 'evening-analysis',
  'week-ahead': 'week-ahead',
  'month-ahead': 'month-ahead',
  'weekly-review': 'weekly-review',
  'monthly-review': 'monthly-review',
  'deep-inspection': 'deep-inspection',
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

interface ArticleInfo {
  date: string;
  slug: string;
  articleType: string;
  lang: Language;
  filepath: string;
}

/**
 * Parse an article filename into its components.
 * Returns null for files that don't match the expected pattern.
 */
function parseArticleFilename(filename: string): ArticleInfo | null {
  // Pattern: YYYY-MM-DD-{slug}-{lang}.html
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)-([a-z]{2})\.html$/);
  if (!match) return null;

  const [, date, slug, langStr] = match;
  const lang = langStr as Language;
  if (!ALL_LANG_CODES.includes(lang)) return null;

  // Try direct slug match first
  let articleType = FILENAME_SLUG_TO_ARTICLE_TYPE[slug];

  // If no direct match, try prefix matching for breaking news and other dynamic slugs
  if (!articleType) {
    for (const [prefix, type] of Object.entries(FILENAME_SLUG_TO_ARTICLE_TYPE)) {
      if (slug.startsWith(prefix)) {
        articleType = type;
        break;
      }
    }
  }

  // Breaking news: slug starts with "breaking-"
  if (!articleType && slug.startsWith('breaking-')) {
    articleType = 'breaking';
  }

  // Realtime monitor articles have timestamps
  if (!articleType && slug.startsWith('realtime-')) {
    articleType = 'realtime';
  }

  if (!articleType) return null;

  return {
    date,
    slug,
    articleType,
    lang,
    filepath: path.join(NEWS_DIR, filename),
  };
}

// ---------------------------------------------------------------------------
// Injection logic
// ---------------------------------------------------------------------------

/**
 * Check if an article already has an analysis-references section.
 */
function hasAnalysisReferences(html: string): boolean {
  return html.includes('class="analysis-references"');
}

/**
 * Check if an existing analysis-references section has broken links.
 * Extracts analysis file paths from href attributes and verifies they exist
 * on the local filesystem. Returns true if ANY analysis file link is broken.
 */
function hasBrokenAnalysisLinks(html: string): boolean {
  // Extract all analysis/daily/... paths from href attributes within the analysis-references section
  const sectionStart = html.indexOf('class="analysis-references"');
  if (sectionStart === -1) return false;
  const sectionEnd = html.indexOf('</section>', sectionStart);
  if (sectionEnd === -1) return false;
  const section = html.slice(sectionStart, sectionEnd);

  // Match GitHub blob URL paths: href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/..."
  const githubBlobRegex = /href="https:\/\/github\.com\/Hack23\/riksdagsmonitor\/blob\/main\/(analysis\/daily\/[^"]+\.md)"/g;
  let match: RegExpExecArray | null;
  while ((match = githubBlobRegex.exec(section)) !== null) {
    const filePath = match[1];
    if (!fs.existsSync(filePath)) {
      return true; // At least one link is broken
    }
  }

  // Match GitHub tree URL paths: href="https://github.com/Hack23/riksdagsmonitor/tree/main/analysis/daily/..."
  const githubTreeRegex = /href="https:\/\/github\.com\/Hack23\/riksdagsmonitor\/tree\/main\/(analysis\/daily\/[^"]+)"/g;
  while ((match = githubTreeRegex.exec(section)) !== null) {
    const dirPath = match[1].replace(/\/$/, ''); // Remove trailing slash
    if (!fs.existsSync(dirPath)) {
      return true; // At least one directory link is broken
    }
  }

  // Match relative paths: href="../analysis/daily/..." or href="analysis/daily/..."
  const relativeBlobRegex = /href="(?:\.\.\/)*?(analysis\/daily\/[^"]+\.md)"/g;
  while ((match = relativeBlobRegex.exec(section)) !== null) {
    const filePath = match[1];
    if (!fs.existsSync(filePath)) {
      return true; // At least one relative link is broken
    }
  }

  // If the section exists but has no analysis links at all, it's likely a placeholder
  // Don't treat it as broken — it may be a legitimately empty section
  return false;
}

/**
 * Check if an aggregation-type article has cross-reference links.
 * Returns true if the article has the "Cross-Referenced Analysis" subsection.
 */
function hasCrossReferences(html: string): boolean {
  return html.includes('Cross-Referenced Analysis') || html.includes('Korsrefererad analys');
}

/**
 * Remove the existing analysis-references section from HTML.
 * Returns the HTML without the section, or the original if not found.
 */
function removeAnalysisReferences(html: string): string {
  const startTag = '<section class="analysis-references"';
  const endTag = '</section>';
  const startIdx = html.indexOf(startTag);
  if (startIdx === -1) return html;
  const endIdx = html.indexOf(endTag, startIdx);
  if (endIdx === -1) return html;
  // Remove from start of section to end of </section> plus trailing newline
  const afterEnd = endIdx + endTag.length;
  const trailing = html[afterEnd] === '\n' ? afterEnd + 1 : afterEnd;
  return html.slice(0, startIdx) + html.slice(trailing);
}

/**
 * Inject the analysis-references HTML section into an article.
 * Inserts before </body>, or before <footer if </body> not found.
 * Returns the modified HTML, or null if no injection point was found.
 */
function injectAnalysisReferences(html: string, referencesHtml: string): string | null {
  if (!referencesHtml) return null;

  // Try insertion points in priority order:
  // 1. Before <footer class="article-footer"> (standard template pattern)
  const footerMatch = html.match(/<footer\s+class="article-footer"/);
  if (footerMatch && footerMatch.index !== undefined) {
    return (
      html.slice(0, footerMatch.index) +
      referencesHtml +
      '\n  ' +
      html.slice(footerMatch.index)
    );
  }

  // 2. Before any <footer> tag
  const anyFooterIdx = html.indexOf('<footer');
  if (anyFooterIdx !== -1) {
    return (
      html.slice(0, anyFooterIdx) +
      referencesHtml +
      '\n  ' +
      html.slice(anyFooterIdx)
    );
  }

  // 3. Before </body>
  const bodyCloseIdx = html.indexOf('</body>');
  if (bodyCloseIdx !== -1) {
    return (
      html.slice(0, bodyCloseIdx) +
      referencesHtml +
      '\n' +
      html.slice(bodyCloseIdx)
    );
  }

  // 4. Append before end of file as last resort
  return html + '\n' + referencesHtml + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const upgrade = args.includes('--upgrade');
  const rewrite = args.includes('--rewrite');
  const dateIdx = args.indexOf('--date');
  const filterDate = dateIdx !== -1 ? args[dateIdx + 1] : undefined;
  const typeIdx = args.indexOf('--type');
  const filterType = typeIdx !== -1 ? args[typeIdx + 1] : undefined;

  console.log('📊 Fix Analysis References — Ensuring all articles link to their analysis files');
  if (dryRun) console.log('  (dry run — no files will be modified)\n');
  if (upgrade) console.log('  (upgrade mode — will replace existing sections for aggregation types missing cross-references)\n');
  if (rewrite) console.log('  (rewrite mode — will replace existing sections that have broken links to non-existent analysis files)\n');
  if (filterDate) console.log(`  Filtering to date: ${filterDate}`);
  if (filterType) console.log(`  Filtering to type: ${filterType}`);
  console.log('');

  if (!fs.existsSync(NEWS_DIR)) {
    console.log('No news/ directory found. Nothing to do.');
    return;
  }

  const files = fs.readdirSync(NEWS_DIR).filter(f => f.endsWith('.html') && !f.startsWith('index'));
  console.log(`Found ${files.length} article files in news/\n`);

  let checked = 0;
  let alreadyHas = 0;
  let injected = 0;
  let upgraded = 0;
  let rewritten = 0;
  let brokenDetected = 0;
  let noAnalysis = 0;
  let skipped = 0;

  for (const filename of files.sort()) {
    const info = parseArticleFilename(filename);
    if (!info) {
      skipped++;
      continue;
    }

    // Apply filters
    if (filterDate && info.date !== filterDate) continue;
    if (filterType && info.articleType !== filterType && info.slug !== filterType) continue;

    checked++;

    let html = fs.readFileSync(info.filepath, 'utf-8');

    const alreadyExists = hasAnalysisReferences(html);

    // --rewrite mode: detect and replace sections with broken links
    if (alreadyExists && rewrite) {
      const broken = hasBrokenAnalysisLinks(html);
      if (broken) {
        brokenDetected++;
        // Remove broken section and regenerate from filesystem scan
        html = removeAnalysisReferences(html);
        const referencesHtml = generateAnalysisReferencesHtml({
          date: info.date,
          articleType: info.articleType,
          lang: info.lang,
        });
        if (referencesHtml) {
          const modified = injectAnalysisReferences(html, referencesHtml);
          if (modified) {
            if (!dryRun) {
              fs.writeFileSync(info.filepath, modified, 'utf-8');
            }
            rewritten++;
            console.log(`  🔧 ${dryRun ? 'Would rewrite' : 'Rewrote'} broken analysis references: ${filename}`);
            continue;
          }
        }
        // If no analysis files exist to link to, remove the broken section entirely
        if (!dryRun) {
          fs.writeFileSync(info.filepath, html, 'utf-8');
        }
        console.log(`  ⚠️  Removed broken analysis-references (no analysis files found): ${filename}`);
        continue;
      }
    }

    // Check if this aggregation-type article needs cross-reference upgrade
    if (alreadyExists && upgrade && AGGREGATION_ARTICLE_TYPES.has(info.articleType) && !hasCrossReferences(html)) {
      // Remove old section and re-inject with cross-references
      html = removeAnalysisReferences(html);
      const referencesHtml = generateAnalysisReferencesHtml({
        date: info.date,
        articleType: info.articleType,
        lang: info.lang,
      });
      if (referencesHtml) {
        const modified = injectAnalysisReferences(html, referencesHtml);
        if (modified) {
          if (!dryRun) {
            fs.writeFileSync(info.filepath, modified, 'utf-8');
          }
          upgraded++;
          console.log(`  🔄 ${dryRun ? 'Would upgrade' : 'Upgraded'} with cross-references: ${filename}`);
          continue;
        }
      }
    }

    if (alreadyExists) {
      alreadyHas++;
      continue;
    }

    // Generate analysis references for this article
    const referencesHtml = generateAnalysisReferencesHtml({
      date: info.date,
      articleType: info.articleType,
      lang: info.lang,
    });

    if (!referencesHtml) {
      noAnalysis++;
      console.log(`  ⚠️  No analysis files found for: ${filename} (type=${info.articleType}, date=${info.date})`);
      continue;
    }

    const modified = injectAnalysisReferences(html, referencesHtml);
    if (!modified) {
      console.log(`  ❌ Could not find injection point in: ${filename}`);
      continue;
    }

    if (!dryRun) {
      fs.writeFileSync(info.filepath, modified, 'utf-8');
    }
    injected++;
    console.log(`  ✅ ${dryRun ? 'Would inject' : 'Injected'} analysis references into: ${filename}`);
  }

  console.log('\n=== Summary ===');
  console.log(`Articles checked: ${checked}`);
  console.log(`Already have analysis references: ${alreadyHas}`);
  console.log(`Injected analysis references: ${injected}`);
  console.log(`Upgraded with cross-references: ${upgraded}`);
  console.log(`Broken links detected: ${brokenDetected}`);
  console.log(`Rewritten (broken → fixed): ${rewritten}`);
  console.log(`No analysis files available: ${noAnalysis}`);
  console.log(`Skipped (unrecognized pattern): ${skipped}`);
  if (dryRun) console.log('\n(Dry run — no files were modified)');
  console.log('\n✓ Done!');
}

import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export {
  parseArticleFilename,
  hasAnalysisReferences,
  hasBrokenAnalysisLinks,
  hasCrossReferences,
  removeAnalysisReferences,
  injectAnalysisReferences,
  FILENAME_SLUG_TO_ARTICLE_TYPE,
};
export type { ArticleInfo };
