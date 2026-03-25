#!/usr/bin/env node

/**
 * @module Infrastructure/ReferenceManagement
 * @category Intelligence Operations / Supporting Infrastructure
 * @name ISMS Reference Download — Methodology Reference Caching System
 *
 * @description
 * Downloads ISMS methodology documents from Hack23 GitHub repositories and saves
 * them to `analysis/reference/` as the foundational reference framework for
 * political intelligence analysis. These documents provide systematic
 * methodologies (classification, threat modeling, risk assessment, SWOT, style
 * guide) that are adapted and applied to political analysis workflows.
 *
 * Reference Documents:
 *   1. ISMS-PUBLIC/CLASSIFICATION.md       → isms-classification.md
 *   2. ISMS-PUBLIC/Threat_Modeling.md      → isms-threat-modeling.md
 *   3. ISMS-PUBLIC/Risk_Assessment_Methodology.md → isms-risk-assessment.md
 *   4. ISMS-PUBLIC/STYLE_GUIDE.md          → isms-style-guide.md
 *   5. cia/SWOT.md                         → cia-swot.md
 *   6. riksdagsmonitor/THREAT_MODEL.md     → riksdagsmonitor-threat-model.md (local copy)
 *
 * Usage:
 *   npx tsx scripts/download-isms-references.ts
 *
 * @author Hack23 AB (Data Infrastructure Team)
 * @license Apache-2.0
 * @version 1.0.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

/** Root directory of the project. */
const PROJECT_ROOT: string = path.resolve(__dirname, '..');

/** Output directory for reference documents. */
const REFERENCE_DIR: string = path.join(PROJECT_ROOT, 'analysis', 'reference');

/** Base URL for raw GitHub content. */
const GITHUB_RAW_BASE: string = 'https://raw.githubusercontent.com/Hack23';

/**
 * Describes a remote ISMS reference document to download.
 */
interface ReferenceDocument {
  /** Human-readable name for logging. */
  readonly name: string;
  /** GitHub repository path: `repo/branch/filepath`. */
  readonly repoPath: string;
  /** Local filename in analysis/reference/. */
  readonly localName: string;
  /** Whether this is a local file copy instead of a remote download. */
  readonly isLocal?: boolean;
  /** Local source path (relative to PROJECT_ROOT), used when isLocal is true. */
  readonly localSource?: string;
}

/**
 * All ISMS reference documents to download.
 */
const REFERENCE_DOCUMENTS: readonly ReferenceDocument[] = [
  {
    name: 'ISMS Classification Framework',
    repoPath: 'ISMS-PUBLIC/main/CLASSIFICATION.md',
    localName: 'isms-classification.md',
  },
  {
    name: 'ISMS Threat Modeling Policy',
    repoPath: 'ISMS-PUBLIC/main/Threat_Modeling.md',
    localName: 'isms-threat-modeling.md',
  },
  {
    name: 'ISMS Risk Assessment Methodology',
    repoPath: 'ISMS-PUBLIC/main/Risk_Assessment_Methodology.md',
    localName: 'isms-risk-assessment.md',
  },
  {
    name: 'ISMS Style Guide',
    repoPath: 'ISMS-PUBLIC/main/STYLE_GUIDE.md',
    localName: 'isms-style-guide.md',
  },
  {
    name: 'CIA SWOT Analysis',
    repoPath: 'cia/master/SWOT.md',
    localName: 'cia-swot.md',
  },
  {
    name: 'Riksdagsmonitor Threat Model',
    repoPath: '',
    localName: 'riksdagsmonitor-threat-model.md',
    isLocal: true,
    localSource: 'THREAT_MODEL.md',
  },
] as const;

/** Result for a successfully downloaded document. */
interface DownloadedDocument {
  name: string;
  url: string;
  localPath: string;
  size: number;
  timestamp: string;
}

/** Result for a failed download. */
interface FailedDocument {
  name: string;
  url: string;
  error: string;
  timestamp: string;
}

/** Aggregate results of the download operation. */
interface DownloadResults {
  downloaded: DownloadedDocument[];
  failed: FailedDocument[];
  startedAt: string;
  completedAt: string;
}

/**
 * ISMS Reference Downloader.
 *
 * Downloads methodology documents from Hack23 GitHub repositories
 * and copies the local threat model into the analysis reference directory.
 */
class ISMSReferenceDownloader {
  private readonly referenceDir: string;
  private readonly results: DownloadResults;

  constructor() {
    this.referenceDir = REFERENCE_DIR;
    this.results = {
      downloaded: [],
      failed: [],
      startedAt: new Date().toISOString(),
      completedAt: '',
    };
  }

  /**
   * Download all reference documents.
   * @returns Exit code: 0 = success, 1 = partial/total failure.
   */
  async downloadAll(): Promise<number> {
    console.log('📚 ISMS Reference Download');
    console.log('━'.repeat(60));
    console.log(`📂 Output: ${this.referenceDir}`);
    console.log(`📄 Documents: ${REFERENCE_DOCUMENTS.length}`);
    console.log('');

    // Ensure the output directory exists
    await fs.mkdir(this.referenceDir, { recursive: true });

    for (const doc of REFERENCE_DOCUMENTS) {
      if (doc.isLocal && doc.localSource) {
        await this.copyLocalDocument(doc);
      } else {
        await this.downloadRemoteDocument(doc);
      }

      // Small delay to avoid rate limiting
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }

    this.results.completedAt = new Date().toISOString();
    this.printSummary();

    return this.results.failed.length === 0 ? 0 : 1;
  }

  /**
   * Download a remote document from GitHub.
   */
  private async downloadRemoteDocument(doc: ReferenceDocument): Promise<void> {
    const url: string = `${GITHUB_RAW_BASE}/${doc.repoPath}`;
    console.log(`📥 Fetching: ${doc.name}...`);
    console.log(`   URL: ${url}`);

    try {
      const response: Response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content: string = await response.text();

      if (content.length === 0) {
        throw new Error('Empty response received');
      }

      const localPath: string = path.join(this.referenceDir, doc.localName);
      await fs.writeFile(localPath, content, 'utf8');

      const stats = await fs.stat(localPath);

      this.results.downloaded.push({
        name: doc.name,
        url,
        localPath: doc.localName,
        size: stats.size,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `   ✅ Saved: ${doc.localName} (${this.formatSize(stats.size)})`,
      );
    } catch (error: unknown) {
      const errorMessage: string = (error as Error).message;
      this.results.failed.push({
        name: doc.name,
        url,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      console.error(`   ❌ Failed: ${doc.name} — ${errorMessage}`);
    }
  }

  /**
   * Copy a local document to the reference directory.
   */
  private async copyLocalDocument(doc: ReferenceDocument): Promise<void> {
    const sourcePath: string = path.join(PROJECT_ROOT, doc.localSource!);
    const destPath: string = path.join(this.referenceDir, doc.localName);

    console.log(`📋 Copying: ${doc.name}...`);
    console.log(`   Source: ${doc.localSource}`);

    try {
      await fs.access(sourcePath);
      await fs.copyFile(sourcePath, destPath);

      const stats = await fs.stat(destPath);

      this.results.downloaded.push({
        name: doc.name,
        url: `local://${doc.localSource}`,
        localPath: doc.localName,
        size: stats.size,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `   ✅ Copied: ${doc.localName} (${this.formatSize(stats.size)})`,
      );
    } catch (error: unknown) {
      const errorMessage: string = (error as Error).message;
      this.results.failed.push({
        name: doc.name,
        url: `local://${doc.localSource}`,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      console.error(`   ❌ Failed: ${doc.name} — ${errorMessage}`);
    }
  }

  /**
   * Print a summary of the download results.
   */
  private printSummary(): void {
    console.log('');
    console.log('━'.repeat(60));
    console.log('📊 Download Summary');
    console.log('━'.repeat(60));
    console.log(`   ✅ Downloaded: ${this.results.downloaded.length}`);
    console.log(`   ❌ Failed:     ${this.results.failed.length}`);
    console.log(
      `   📦 Total size: ${this.formatSize(this.results.downloaded.reduce((sum, d) => sum + d.size, 0))}`,
    );
    console.log('');

    if (this.results.downloaded.length > 0) {
      console.log('📄 Reference Documents:');
      for (const doc of this.results.downloaded) {
        console.log(`   • ${doc.localPath} (${this.formatSize(doc.size)})`);
      }
    }

    if (this.results.failed.length > 0) {
      console.log('');
      console.log('⚠️  Failed Downloads:');
      for (const doc of this.results.failed) {
        console.log(`   • ${doc.name}: ${doc.error}`);
      }
    }

    console.log('');
  }

  /**
   * Format a byte size as a human-readable string.
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  try {
    const downloader = new ISMSReferenceDownloader();
    const exitCode: number = await downloader.downloadAll();
    process.exit(exitCode);
  } catch (error: unknown) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ISMSReferenceDownloader, REFERENCE_DOCUMENTS };
export type {
  ReferenceDocument,
  DownloadedDocument,
  FailedDocument,
  DownloadResults,
};
