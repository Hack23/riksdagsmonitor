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
  // All 14 supported languages: EN, SV, DE, FR, ES, NL, FI, DA, NO, AR, HE, JA, KO, ZH
  const keywords = [
    'week', 'summary', 'review',           // EN
    'vecka', 'sammanfattning', 'genomgång', // SV
    'woche', 'zusammenfassung',             // DE
    'semaine', 'résumé',                    // FR
    'semana', 'resumen',                    // ES
    'samenvatting', 'week',                 // NL
    'viikko', 'yhteenveto',                 // FI
    'uge', 'sammenfatning',                 // DA
    'uke', 'sammendrag',                    // NO
    'أسبوع', 'ملخص',                        // AR
    'שבוע', 'סיכום',                        // HE
    '週', '要約',                             // JA
    '주', '요약',                             // KO
    '周', '摘要',                             // ZH
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
  // All 14 supported languages: EN, SV, DE, FR, ES, NL, FI, DA, NO, AR, HE, JA, KO, ZH
  const retroKeywords = [
    'concluded', 'passed', 'voted', 'decided', 'approved', 'rejected', 'completed', // EN
    'beslutade', 'röstade', 'antog', 'avslogs', 'godkändes', 'avslutades',           // SV
    'beschlossen', 'abgestimmt', 'verabschiedet',                                    // DE
    'décidé', 'voté', 'adopté', 'rejeté',                                            // FR
    'decidió', 'aprobó', 'rechazó', 'concluyó',                                      // ES
    'besloten', 'gestemd', 'goedgekeurd', 'afgewezen',                               // NL
    'päätettiin', 'äänestettiin', 'hyväksyttiin', 'hylättiin',                       // FI
    'vedtaget', 'afvist', 'godkendt',                                                // DA
    'vedtatt', 'avvist', 'godkjent',                                                 // NO
    'قرر', 'صوّت', 'وافق', 'رفض',                                                    // AR
    'הוחלט', 'הצביע', 'אושר', 'נדחה',                                               // HE
    '決定', '投票', '承認', '否決',                                                    // JA
    '결정', '투표', '승인', '거부',                                                    // KO
    '决定', '投票', '通过', '否决',                                                    // ZH
  ];
  return retroKeywords.some(keyword => content.includes(keyword));
}

function checkKeyOutcomes(article: ArticleInput): boolean {
  if (!article || !article.content) return false;
  const content = (article.content as string).toLowerCase();
  // All 14 supported languages: EN, SV, DE, FR, ES, NL, FI, DA, NO, AR, HE, JA, KO, ZH
  const outcomeKeywords = [
    'outcome', 'result', 'decision', 'passed', 'adopted',   // EN
    'resultat', 'beslut', 'antogs', 'godkändes', 'utfall',  // SV
    'ergebnis', 'entscheidung', 'beschluss',                 // DE
    'résultat', 'décision', 'adopté',                        // FR
    'resultado', 'decisión', 'aprobado',                     // ES
    'resultaat', 'beslissing', 'aangenomen',                 // NL
    'tulos', 'päätös', 'hyväksyttiin',                       // FI
    'resultat', 'beslutning', 'vedtaget',                    // DA
    'resultat', 'beslutning', 'vedtatt',                     // NO
    'نتيجة', 'قرار', 'اعتمد',                               // AR
    'תוצאה', 'החלטה', 'אומץ',                               // HE
    '結果', '決定', '採択',                                    // JA
    '결과', '결정', '채택',                                    // KO
    '结果', '决定', '通过',                                    // ZH
  ];
  return outcomeKeywords.some(keyword => content.includes(keyword));
}
