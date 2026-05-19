/**
 * @module scripts/validators/article/cli
 * @description CLI entry point for the article validator. Lives in the
 *              subtree so the top-level `scripts/validate-article.ts`
 *              shim stays ≤ 20 lines.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 789–828 (`main`).
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { join, resolve } from 'node:path';
import process from 'node:process';

import { REPO_ROOT, validateArticle, walk } from './index.js';

export async function runCli(argv: readonly string[]): Promise<void> {
  const argPaths = argv.filter((a) => !a.startsWith('--'));
  const files =
    argPaths.length > 0
      ? argPaths.map((p) => resolve(REPO_ROOT, p))
      : await walk(join(REPO_ROOT, 'analysis', 'daily'), 'article.md');

  if (files.length === 0) {
    console.log('ℹ️  validate-article: no aggregated article.md files found — nothing to check.');
    return;
  }

  let total = 0;
  const buckets = new Map<string, number>();
  for (const f of files) {
    const violations = await validateArticle(f);
    if (violations.length === 0) continue;
    total += violations.length;
    for (const v of violations) {
      buckets.set(v.code, (buckets.get(v.code) ?? 0) + 1);
      console.error(`❌ ${v.file}\n   [${v.code}] ${v.message}`);
    }
  }

  console.log('');
  console.log(`📊 validate-article: scanned ${files.length} article(s).`);
  if (total === 0) {
    console.log('✅ All aggregated articles pass the minimum-content contract.');
    return;
  }
  console.log(`❌ ${total} violation(s) across ${buckets.size} rule(s):`);
  for (const [code, count] of [...buckets.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   • ${code}: ${count}`);
  }
  console.error('');
  console.error('Article-quality minimums are documented in Article-Generation.md');
  console.error('and analysis/templates/README.md (Reader-Facing Output Contract).');
  process.exit(1);
}
