/**
 * @module scripts/validators/article/source-mermaid
 * @description Cross-folder mermaid coverage check — sum every
 *              ```mermaid opening fence across the analysis-folder
 *              source artifacts (excluding article.md / README.md /
 *              translation siblings) so the orchestrator can detect
 *              when the aggregator dropped a diagram.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 759–787
 *              (`countSourceArtifactMermaidOpenings`). Logic is
 *              byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { countMermaidOpenings } from './rules/mermaid-fences.js';

/**
 * Sum the `\`\`\`mermaid` opening-fence count across every source
 * artifact (.md) in `subfolderAbsPath`, excluding `article.md`,
 * `README.md`, and any `article.<lang>.md` translation. Each
 * `documents/*.md` per-document analysis is also counted because the
 * aggregator expands those into the article.
 *
 * Pure with respect to filesystem reads — never mutates state.
 */
export async function countSourceArtifactMermaidOpenings(subfolderAbsPath: string): Promise<number> {
  let total = 0;
  const entries = await readdir(subfolderAbsPath);
  for (const entry of entries) {
    const full = join(subfolderAbsPath, entry);
    const st = await stat(full);
    if (st.isDirectory()) {
      if (entry === 'documents') {
        const docEntries = await readdir(full);
        for (const docEntry of docEntries) {
          if (!/\.md$/i.test(docEntry)) continue;
          const docFull = join(full, docEntry);
          const docStat = await stat(docFull);
          if (!docStat.isFile()) continue;
          const body = await readFile(docFull, 'utf8');
          total += countMermaidOpenings(body);
        }
      }
      continue;
    }
    if (!st.isFile()) continue;
    if (!/\.md$/i.test(entry)) continue;
    if (entry === 'README.md') continue;
    if (/^article(?:\.[a-z-]+)?\.md$/i.test(entry)) continue;
    const body = await readFile(full, 'utf8');
    total += countMermaidOpenings(body);
  }
  return total;
}

import { relative } from 'node:path';
import { REPO_ROOT, type ArticleViolation } from './types.js';

/**
 * Cross-folder mermaid coverage check. Emits `mermaid-coverage-regression`
 * when the aggregated article omits diagrams authored in the source
 * artifacts, or `mermaid-coverage-check-failed` when the FS read fails
 * for a non-ENOENT/ENOTDIR reason.
 */
export async function checkMermaidCoverage(
  rel: string,
  text: string,
  parentDir: string,
): Promise<ArticleViolation[]> {
  try {
    const sourceMermaidCount = await countSourceArtifactMermaidOpenings(parentDir);
    const articleMermaidCount = countMermaidOpenings(text);
    if (sourceMermaidCount > 0 && articleMermaidCount < sourceMermaidCount) {
      return [
        {
          file: rel,
          code: 'mermaid-coverage-regression',
          message: `article.md contains ${articleMermaidCount} \`\`\`mermaid opening(s) but the source artifacts in ${relative(REPO_ROOT, parentDir)}/ contain ${sourceMermaidCount}. The aggregator must include every diagram authored in the analysis artifacts — see scripts/render-lib/aggregator/aggregate.ts.`,
        },
      ];
    }
    return [];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      // Folder genuinely missing or not a directory — checks 1/2/6 already surface that.
      return [];
    }
    const detail = err instanceof Error ? err.message : String(err);
    return [
      {
        file: rel,
        code: 'mermaid-coverage-check-failed',
        message: `Mermaid coverage cross-check could not be executed against ${relative(REPO_ROOT, parentDir)}/: ${detail}. Investigate before merging — the regression guard is currently inactive for this article.`,
      },
    ];
  }
}
