/**
 * @module generate-news-enhanced
 * @description Barrel re-export and orchestration for enhanced news generation.
 * Coordinates article type generation, metadata writing, and batch status.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { translateSwedishContent } from '../translation-dictionary.js';
import type { Language } from '../types/language.js';
import type { BatchStatus, LastGenerationMetadata } from './types.js';
import {
  NEWS_DIR,
  METADATA_DIR,
  articleTypes,
  languages,
  allRequestedLanguages,
  batchSize,
  skipExistingArg,
  stats,
  getSharedClient,
  toISODate,
  VALID_ARTICLE_TYPES,
  ALL_LANGUAGES,
  LANGUAGE_PRESETS,
  QUALITY_THRESHOLD,
  requireMcp,
} from './config.js';
import {
  formatDateForSlug,
  getWeekAheadDateRange,
  writeArticle,
  writeSingleArticle,
  writeArticlePair,
  validateArticleQuality,
} from './helpers.js';
import {
  generateWeekAhead,
  generateCommitteeReports,
  generatePropositions,
  generateMotions,
} from './generators.js';
import { generateMonthAhead } from '../news-types/month-ahead.js';
import { generateWeeklyReview } from '../news-types/weekly-review.js';
import { generateMonthlyReview } from '../news-types/monthly-review.js';
import { generateBreakingNews } from '../news-types/breaking-news.js';

// Re-export public API
export {
  VALID_ARTICLE_TYPES,
  ALL_LANGUAGES,
  LANGUAGE_PRESETS,
  languages,
  QUALITY_THRESHOLD,
  requireMcp,
  formatDateForSlug,
  getWeekAheadDateRange,
  writeSingleArticle,
  writeArticlePair,
  validateArticleQuality,
  generateWeekAhead,
  generateCommitteeReports,
  generatePropositions,
  generateMotions,
  translateSwedishContent,
};

// ---------------------------------------------------------------------------

/**
 * Main generation function
 */
export async function generateNews(): Promise<typeof stats> {
  console.log('🚀 Starting enhanced news generation...\n');

  for (const type of articleTypes) {
    switch (type.trim()) {
      case 'week-ahead':
        await generateWeekAhead();
        break;
      case 'committee-reports':
        await generateCommitteeReports();
        break;
      case 'propositions':
        await generatePropositions();
        break;
      case 'motions':
        await generateMotions();
        break;
      case 'breaking': {
        // Auto-detect most significant recent development: fetch today's votes and documents
        console.log('⚡ Breaking news — detecting most significant parliamentary development...');
        try {
          const sharedClient = await getSharedClient();
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0] ?? '';

          // Fetch recent votes (no date filter — search_voteringar uses rm/bet/punkt)
          const recentVotes = await Promise.resolve()
            .then(() => sharedClient.fetchVotingRecords({ limit: 20 }))
            .catch(() => [] as unknown[]);

          // Fetch today's most significant documents
          const todayDocs = await Promise.resolve()
            .then(() => sharedClient.searchDocuments({ from_date: todayStr, to_date: todayStr, limit: 20 }))
            .catch(() => [] as unknown[]);

          if (recentVotes.length === 0 && todayDocs.length === 0) {
            console.log('  ℹ️ No significant votes or documents found today — skipping breaking news');
            break;
          }

          // Pick the most significant document: prefer propositions and committee reports
          type DocRecord = Record<string, string>;
          const allItems = [...todayDocs, ...recentVotes] as DocRecord[];
          const topDoc = allItems.find(d => d['doktyp'] === 'prop' || d['doktyp'] === 'proposition')
            ?? allItems.find(d => d['doktyp'] === 'bet' || d['doktyp'] === 'betankande')
            ?? allItems[0];

          const topTitle = topDoc
            ? (topDoc['titel'] || topDoc['title'] || topDoc['avser'] || 'Parliamentary Development')
            : 'Riksdag parliamentary activity today';
          const topSlug = topDoc
            ? (() => {
                const cleaned = (topDoc['titel'] || topDoc['title'] || 'news')
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .slice(0, 40);
                return cleaned || 'news';
              })()
            : 'news';
          const voteId = recentVotes.length > 0 ? ((recentVotes[0] as DocRecord)['punkt'] ?? '') : '';

          console.log(`  📰 Lead story: "${topTitle}"`);

          await generateBreakingNews({
            languages,
            eventContext: topTitle,
            eventData: {
              slug: topSlug,
              topic: topTitle.slice(0, 80),
              voteId: voteId || undefined,
            },
            writeArticle,
          });
        } catch (err: unknown) {
          console.error('❌ Error generating breaking news:', (err as Error).message);
        }
        break;
      }
      case 'month-ahead':
        await generateMonthAhead({ languages, writeArticle });
        break;
      case 'weekly-review':
        await generateWeeklyReview({ languages, writeArticle });
        break;
      case 'monthly-review':
        await generateMonthlyReview({ languages, writeArticle });
        break;
      default:
        console.warn(`⚠️ Unknown article type: ${type}`);
    }
  }

  // Save generation metadata
  const metadataFile: string = path.join(METADATA_DIR, 'last-generation.json');
  const lastGeneration: LastGenerationMetadata = {
    timestamp: stats.timestamp,
    types: articleTypes,
    languagesGenerated: languages,
    allRequestedLanguages: allRequestedLanguages,
    batchSize: batchSize || 'all',
    skipExisting: skipExistingArg,
    generated: stats.generated,
    errors: stats.errors,
    articles: stats.articles,
    status: 'enhanced',
    note: 'Enhanced script with MCP integration, multi-language support, and batch mode'
  };
  fs.writeFileSync(metadataFile, JSON.stringify(lastGeneration, null, 2));

  // Save detailed results
  const resultFile: string = path.join(METADATA_DIR, 'generation-result.json');
  fs.writeFileSync(resultFile, JSON.stringify(stats, null, 2));

  // Write batch status for workflow orchestration
  const today: string = toISODate(new Date());
  const existingFiles: string[] = fs.existsSync(NEWS_DIR)
    ? fs.readdirSync(NEWS_DIR).filter(f => f.startsWith(today) && f.endsWith('.html'))
    : [];
  const completedLangs: Language[] = allRequestedLanguages.filter(lang =>
    existingFiles.some(f => f.endsWith(`-${lang}.html`))
  );
  const remainingLangs: Language[] = allRequestedLanguages.filter(l => !completedLangs.includes(l));

  const batchStatus: BatchStatus = {
    complete: remainingLangs.length === 0,
    completedLanguages: completedLangs,
    remainingLanguages: remainingLangs,
    allRequestedLanguages: allRequestedLanguages,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(METADATA_DIR, 'batch-status.json'),
    JSON.stringify(batchStatus, null, 2)
  );

  console.log('\n✅ Enhanced news generation complete');
  console.log(`Generated: ${stats.generated} articles`);
  console.log(`Errors: ${stats.errors}`);

  if (stats.articles.length > 0) {
    console.log('\nArticles generated:');
    stats.articles.forEach(article => console.log(`  - ${article}`));
  }

  // Quality summary
  if (stats.qualityScores.length > 0) {
    const passed: number = stats.qualityScores.filter(q => q.passed).length;
    const total: number = stats.qualityScores.length;
    console.log(`\n📊 Quality summary: ${passed}/${total} articles passed (threshold: ${QUALITY_THRESHOLD})`);
    const allBelowThreshold: boolean = total > 0 && passed === 0;
    if (allBelowThreshold) {
      console.warn(`⚠️  All ${total} articles scored below quality threshold ${QUALITY_THRESHOLD}`);
    }
  }

  if (remainingLangs.length > 0) {
    console.log(`\n📦 Batch progress: ${completedLangs.length}/${allRequestedLanguages.length} languages done`);
    console.log(`   Remaining: ${remainingLangs.join(', ')}`);
    console.log('   Re-run with --skip-existing to continue with next batch');
  } else {
    console.log(`\n🎉 All ${allRequestedLanguages.length} languages generated!`);
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Auto-execution
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  generateNews()
    .then(result => {
      if (result.errors > 0) {
        process.exit(1);
      }
      // Soft failure: exit 2 when ALL generated articles are below quality threshold
      const qualityScores = result.qualityScores;
      if (qualityScores.length > 0 && qualityScores.every(q => !q.passed)) {
        console.warn(`⚠️  Exiting with code 2: all ${qualityScores.length} articles scored below quality threshold ${QUALITY_THRESHOLD}`);
        process.exit(2);
      }
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}
