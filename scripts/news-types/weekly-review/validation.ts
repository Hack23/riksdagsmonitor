/**
 * @module news-types/weekly-review/validation
 * @description Validation logic for weekly-review article quality checks.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ArticleInput, WeeklyReviewValidationResult } from './types.js';

export function validateWeeklyReview(article: ArticleInput): WeeklyReviewValidationResult {
  const hasWeeklySummary = checkWeeklySummary(article);
  const hasMinimumSources = countSources(article) >= 3;
  const hasRetrospectiveTone = checkRetrospectiveTone(article);
  const hasKeyOutcomes = checkKeyOutcomes(article);

  return {
    hasWeeklySummary,
    hasMinimumSources,
    hasRetrospectiveTone,
    hasKeyOutcomes,
    passed: hasWeeklySummary && hasMinimumSources && hasRetrospectiveTone && hasKeyOutcomes
  };
}

function checkWeeklySummary(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  return article.content.toLowerCase().includes('week') ||
         article.content.toLowerCase().includes('summary') ||
         article.content.toLowerCase().includes('review');
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkRetrospectiveTone(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const retroKeywords = ['concluded', 'passed', 'voted', 'decided', 'approved', 'rejected', 'completed'];
  return retroKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}

function checkKeyOutcomes(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const outcomeKeywords = ['outcome', 'result', 'decision', 'passed', 'adopted'];
  return outcomeKeywords.some(keyword =>
    (article.content as string).toLowerCase().includes(keyword)
  );
}
