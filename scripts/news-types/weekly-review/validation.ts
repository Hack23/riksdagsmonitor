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
  const content = article.content.toLowerCase();
  // English, Swedish, German, French, Spanish, Dutch, Finnish, Danish, Norwegian
  const keywords = [
    'week', 'summary', 'review',           // EN
    'vecka', 'sammanfattning', 'genomgång', // SV
    'woche', 'zusammenfassung',             // DE
    'semaine', 'résumé',                    // FR
    'semana', 'resumen',                    // ES
    'week', 'samenvatting',                 // NL
    'viikko', 'yhteenveto',                 // FI
    'uge', 'sammenfatning',                 // DA
    'uke', 'sammendrag',                    // NO
  ];
  return keywords.some(kw => content.includes(kw));
}

function countSources(article: ArticleInput): number {
  if (!article || !article.sources) return 0;
  return Array.isArray(article.sources) ? article.sources.length : 0;
}

function checkRetrospectiveTone(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const content = (article.content as string).toLowerCase();
  // English and Swedish retrospective keywords
  const retroKeywords = [
    'concluded', 'passed', 'voted', 'decided', 'approved', 'rejected', 'completed', // EN
    'beslutade', 'röstade', 'antog', 'avslogs', 'godkändes', 'avslutades',           // SV
    'beschlossen', 'abgestimmt', 'verabschiedet',                                    // DE
    'décidé', 'voté', 'adopté', 'rejeté',                                            // FR
    'decidió', 'aprobó', 'rechazó', 'concluyó',                                      // ES
    'besloten', 'gestemd', 'goedgekeurd', 'afgewezen',                               // NL
    'päätettiin', 'äänestettiin', 'hyväksyttiin', 'hylättiin',                       // FI
  ];
  return retroKeywords.some(keyword => content.includes(keyword));
}

function checkKeyOutcomes(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const content = (article.content as string).toLowerCase();
  // English and Swedish outcome keywords
  const outcomeKeywords = [
    'outcome', 'result', 'decision', 'passed', 'adopted',   // EN
    'resultat', 'beslut', 'antogs', 'godkändes', 'utfall',  // SV
    'ergebnis', 'entscheidung', 'beschluss',                 // DE
    'résultat', 'décision', 'adopté',                        // FR
    'resultado', 'decisión', 'aprobado',                     // ES
    'resultaat', 'beslissing', 'aangenomen',                 // NL
    'tulos', 'päätös', 'hyväksyttiin',                       // FI
  ];
  return outcomeKeywords.some(keyword => content.includes(keyword));
}
