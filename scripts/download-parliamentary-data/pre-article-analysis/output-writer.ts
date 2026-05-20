/**
 * @module download-parliamentary-data/pre-article-analysis/output-writer
 * @description Markdown emit for the pre-article-analysis artefact — writes
 * `data-download-manifest.md` and per-document JSON files, and prints the
 * final pipeline summary to stdout.
 *
 * All filesystem side-effects of the pre-article pipeline live here; the
 * orchestrator (`./index.ts`) is responsible only for data shuffling.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RawDocument } from '../../data-transformers/types.js';
import { sanitizeDokId } from '../../parliamentary-data/data-persistence.js';
import type { FullTextFetchOutcome } from '../../parliamentary-data/data-downloader.js';
import type { DocumentTypeKey } from '../../parliamentary-data/data-downloader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Write `data-download-manifest.md` to `outputDir`. The serialized content
 * is built by the caller (via `serializeDataManifest`) — this helper only
 * performs the write + logs the relative path.
 */
export function writeManifest(
  outputDir: string,
  manifestContent: string,
): void {
  const manifestPath = path.join(outputDir, 'data-download-manifest.md');
  fs.writeFileSync(manifestPath, manifestContent, 'utf8');
  console.log(`  ✅ Written: ${path.relative(REPO_ROOT, manifestPath)}`);
}

/**
 * Store each entry of `allDocs` as a JSON file under `outputDir/documents/`,
 * collision-suffixing duplicate dok_ids and returning the written count.
 */
export function writeDocumentJsonFiles(
  outputDir: string,
  allDocs: RawDocument[],
): number {
  console.log('\n💾 Step 3: Storing downloaded documents as JSON...');
  const documentsDir = path.join(outputDir, 'documents');
  ensureDir(documentsDir);

  let storedCount = 0;
  for (let i = 0; i < allDocs.length; i++) {
    const doc = allDocs[i];
    const dokId = doc.dok_id || doc.titel || doc.title || `unknown-doc-${i + 1}`;
    const baseName = sanitizeDokId(dokId) || `unknown-doc-${i + 1}`;
    let fileName = baseName;
    let attempt = 0;
    while (fs.existsSync(path.join(documentsDir, `${fileName}.json`))) {
      attempt++;
      fileName = `${baseName}-${attempt}`;
    }
    const docJson = JSON.stringify(doc, null, 2);
    fs.writeFileSync(path.join(documentsDir, `${fileName}.json`), docJson, 'utf8');
    storedCount++;
  }
  console.log(
    `   💾 Stored ${storedCount} documents as JSON in ${path.relative(REPO_ROOT, documentsDir)}/`,
  );
  return storedCount;
}

/** Print the "Step 2b" header before a full-text fetch attempt. */
export function logFullTextStepHeader(opts: {
  effectiveAutoFullTextTopN: number;
  autoFullTextTopN: number | null;
  fullTextForAll: boolean;
}): void {
  const { effectiveAutoFullTextTopN, autoFullTextTopN, fullTextForAll } = opts;
  if (fullTextForAll) {
    console.log(
      `\n📄 Step 2b: Auto-fetching full text for ALL ${effectiveAutoFullTextTopN} selected documents (--full-text-for-all)...`,
    );
  } else if (autoFullTextTopN !== null && effectiveAutoFullTextTopN !== autoFullTextTopN) {
    console.log(
      `\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (long-horizon floor raised from ${autoFullTextTopN})...`,
    );
  } else if (autoFullTextTopN === null) {
    console.log(
      `\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (long-horizon default)...`,
    );
  } else {
    console.log(
      `\n📄 Step 2b: Auto-fetching full text for top-${effectiveAutoFullTextTopN} documents (--auto-full-text-top-n=${effectiveAutoFullTextTopN})...`,
    );
  }
  console.log(
    '   ⏱️  This may take 30–60 s — documented quality investment for deep-analysis tiers.',
  );
}

export interface FinalSummaryOptions {
  outputDir: string;
  storedCount: number;
  allDocsLength: number;
  effectiveAutoFullTextTopN: number | null;
  fullTextOutcomes?: FullTextFetchOutcome[];
  fullTextForAll: boolean;
  docType: DocumentTypeKey | null;
}

/**
 * Print the final "✅ Data download complete!" summary block (file count,
 * full-text status, next-step guidance).
 */
export function logFinalSummary(opts: FinalSummaryOptions): void {
  const {
    outputDir,
    storedCount,
    allDocsLength,
    effectiveAutoFullTextTopN,
    fullTextOutcomes,
    fullTextForAll,
    docType,
  } = opts;

  if (allDocsLength === 0) {
    console.warn('\n⚠️  No documents downloaded for this date.');
  }

  const totalFiles = 1 + storedCount;
  console.log(`\n✅ Data download complete! Results in: ${path.relative(REPO_ROOT, outputDir)}/`);
  console.log(`   📄 ${totalFiles} total files written (1 manifest + ${storedCount} documents)`);
  console.log(`   📊 ${allDocsLength} documents available for AI analysis`);
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0) {
    const successCount = fullTextOutcomes?.filter((o) => o.success).length ?? 0;
    const attempted = fullTextOutcomes?.length ?? 0;
    if (fullTextForAll) {
      console.log(
        `   📄 Full text: ${successCount}/${attempted} document(s) (full batch coverage; see full-text/ sub-folder)`,
      );
    } else {
      console.log(
        `   📄 Full text: ${successCount}/${attempted} top-${effectiveAutoFullTextTopN} documents from flattened batch (see full-text/ sub-folder)`,
      );
    }
  }
  if (docType) {
    console.log(`   📋 Scoped to: ${docType}`);
  }
  console.log('');
  console.log('   ℹ️  Next step: AI agent performs analysis using:');
  console.log('      - analysis/methodologies/ai-driven-analysis-guide.md');
  console.log('      - analysis/templates/ (per-file analysis templates)');
  console.log('      - npx tsx scripts/catalog-downloaded-data.ts --pending-only');
  if (effectiveAutoFullTextTopN !== null && effectiveAutoFullTextTopN > 0) {
    if (fullTextForAll) {
      console.log(
        `      ℹ️  Significance-scoring note: all ${effectiveAutoFullTextTopN} selected documents`,
      );
      console.log('         (across types) had full text fetched to sidecar files.');
    } else {
      console.log(
        `      ℹ️  Significance-scoring note: top-${effectiveAutoFullTextTopN} documents from the`,
      );
      console.log('         flattened batch had full text fetched to sidecar files — AI');
      console.log(
        '         significance-scoring step should prioritise those documents for deeper analysis.',
      );
    }
  }
}
