/**
 * @module generate-news-indexes/helpers/slug
 * @description Slug-derived classification and topic/tag extraction.
 * Recognises subfolder slugs against the article-types registry first and
 * falls back to multi-language keyword detection for legacy articles.
 *
 * The language-suffix regular expression is built from the canonical
 * `LANGUAGES` constant so this module is the single source of truth for
 * the 14 supported language codes used by the news-index renderer.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ArticleTypeValue } from '../types.js';
import { LANGUAGES } from '../constants.js';
import { getBySubfolder } from '../../render-lib/article-types.js';

/** Language codes derived from LANGUAGES constant — single source of truth. */
const LANG_CODES = Object.keys(LANGUAGES).join('|');

/** Language-suffix pattern shared with `article-merge.ts`. */
export const LANG_SUFFIX_RE: RegExp = new RegExp(`-(${LANG_CODES})\\.html$`);

const TOPIC_INFERENCE_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ['committees', /(committee|committeereports|utskott|betänkande|committee reports|rapport de commission|ausschuss|위원회|委员会|委員会)/i],
  ['legislation', /(proposition|motion|bill|legislative|lagstift|lovgiv|lainsäädäntö|gesetz|législation|legislación|立法|입법)/i],
  ['parliament', /(interpellation|riksdag|parliament|riksdagen|parlament|val\b|election|voting|vote|议会|의회|議会)/i],
  ['government', /(government|regering|regerings|minister|ministry|kristersson|gouvernement|gobierno|regierung|الحكومة|ממשלה|政府)/i],
  ['defense', /(defen[cs]e|försvar|forsvar|puolustus|verteidigung|défense|defensa|defensie|国防|防衛|국방)/i],
  ['environment', /(environment|climate|miljö|miljø|ympäristö|umwelt|environnement|medio ambiente|milieu|环境|環境|환경)/i],
  ['eu', /(eu|european union|europeiska unionen|union européenne|europäische union)/i],
] as const;

/**
 * Classify article type based on content and filename.
 * Uses the article-types registry first, then falls back to keyword detection
 * for legacy articles. Supports detection keywords in all 14 languages.
 * When `relativePath` is provided, also checks the parent directory name
 * against the registry (for subdirectory-based articles like election-cycle/).
 */
export function classifyArticleType(content: string, fileName: string, relativePath?: string): ArticleTypeValue {
  const slugMatch = fileName.match(new RegExp(`^\\d{4}-\\d{2}-\\d{2}-(.+?)-(${LANG_CODES})\\.html$`));
  if (slugMatch) {
    const slug = slugMatch[1]!;
    const entry = getBySubfolder(slug);
    if (entry) {
      if (entry.family === 'long-horizon-forecast') return 'prospective';
      if (entry.family === 'single-type') return 'analysis';
      if (entry.family === 'tier-c-aggregation') return 'retrospective';
    }
    const parts = slug.split('-');
    for (let i = parts.length - 1; i >= 1; i--) {
      const prefix = parts.slice(0, i).join('-');
      const prefixEntry = getBySubfolder(prefix);
      if (prefixEntry) {
        if (prefixEntry.family === 'long-horizon-forecast') return 'prospective';
        if (prefixEntry.family === 'single-type') return 'analysis';
        if (prefixEntry.family === 'tier-c-aggregation') return 'retrospective';
      }
    }
  }

  if (relativePath && relativePath.includes('/')) {
    const parentDir = relativePath.split('/')[0]!;
    const dirSlugMatch = parentDir.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
    if (dirSlugMatch) {
      const dirSlug = dirSlugMatch[1]!;
      const entry = getBySubfolder(dirSlug);
      if (entry) {
        if (entry.family === 'long-horizon-forecast') return 'prospective';
        if (entry.family === 'single-type') return 'analysis';
        if (entry.family === 'tier-c-aggregation') return 'retrospective';
      }
    }
  }

  const lowerContent: string = content.toLowerCase();

  const prospectiveKeywords: string[] = [
    'week ahead', 'week-ahead', 'upcoming', 'preview', 'look ahead',           // en
    'veckan som kommer', 'kommande vecka', 'framåtblick',                       // sv
    'ugen der kommer', 'kommende uge', 'fremadrettet',                          // da
    'uken som kommer', 'fremtidsrettet',                                        // no
    'tuleva viikko', 'ennakko',                                                 // fi
    'woche voraus', 'vorschau',                                                 // de
    'semaine à venir', 'aperçu',                                                // fr
    'semana por delante', 'adelanto',                                            // es
    'week vooruit', 'vooruitblik',                                               // nl
    'الأسبوع المقبل', 'القادم',                                                  // ar
    'השבוע הבא', 'הקרוב',                                                       // he
    '来週の展望', '今後',                                                          // ja
    '주간 전망', '다가오는',                                                       // ko
    '一周展望', '即将'
  ];

  if (fileName.includes('week-ahead') || fileName.includes('month-ahead') || prospectiveKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()))) {
    return 'prospective';
  }

  const analysisKeywords: string[] = [
    'committee reports', 'analysis', 'review', 'assessment',                     // en
    'utskottsbetänkanden', 'analys', 'granskning', 'betänkande',                // sv
    'udvalgsrapporter', 'analyse', 'gennemgang', 'udvalgsbetænkning',           // da
    'komitérapporter', 'gjennomgang', 'komitéinnstilling',                      // no
    'valiokuntaraportit', 'analyysi', 'katsaus', 'valiokunnan mietintö',        // fi
    'ausschussberichte', 'überprüfung', 'ausschussbericht',                     // de
    'rapports de commission', 'examen', 'rapport de commission',                 // fr
    'informes de comité', 'análisis', 'revisión', 'informe de comité',          // es
    'commissierapporten', 'beoordeling', 'commissieverslag',                     // nl
    'تقارير اللجان', 'تحليل', 'تقرير اللجنة',                                  // ar
    'דוחות ועדות', 'ניתוח', 'דוח ועדה',                                         // he
    '委員会報告', '分析',                                                          // ja
    '위원회 보고서', '분석',                                                       // ko
    '委员会报告', '分析'
  ];

  if (fileName.includes('committee-reports') || fileName.includes('propositions') || fileName.includes('motions') ||
      fileName.includes('deep-inspection') ||
      analysisKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()))) {
    return 'analysis';
  }

  const breakingKeywords: string[] = [
    'breaking', 'urgent', 'alert', 'flash',                                      // en
    'senaste nytt', 'akut', 'brådskande',                                        // sv
    'seneste nyt', 'hastesag',                                                   // da
    'siste nytt', 'haster',                                                      // no
    'viimeisimmät', 'kiireellinen', 'hälytys',                                   // fi
    'eilmeldungen', 'dringend', 'alarm',                                         // de
    'dernières nouvelles', 'alerte',                                              // fr
    'última hora', 'urgente', 'alerta',                                           // es
    'laatste nieuws', 'alert',                                                    // nl
    'أخبار عاجلة', 'عاجل',                                                       // ar
    'חדשות אחרונות', 'דחוף',                                                     // he
    '速報', '緊急',                                                               // ja
    '속보', '긴급',                                                               // ko
    '突发新闻', '紧急'
  ];

  if (fileName.includes('breaking') || breakingKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()))) {
    return 'breaking';
  }

  return 'retrospective';
}

/**
 * Extract topics from article tags.
 * Supports topic detection keywords in all 14 languages.
 */
export function extractTopics(content: string, fileName: string = ''): string[] {
  const topics: string[] = [];
  const tagPattern = /<meta\s+property=["']article:tag["']\s+content=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(content)) !== null) {
    const tag: string = match[1]!.toLowerCase();
    if (tag.includes('eu')) topics.push('eu');
    if (tag.includes('parliament') || tag.includes('riksdag') || tag.includes('parlamentet') || tag.includes('議会') || tag.includes('의회') || tag.includes('议会') || tag.includes('البرلمان') || tag.includes('פרלמנט')) topics.push('parliament');
    if (tag.includes('government') || tag.includes('regering') || tag.includes('regjeringen') || tag.includes('hallitus') || tag.includes('regierung') || tag.includes('gouvernement') || tag.includes('gobierno') || tag.includes('政府') || tag.includes('정부') || tag.includes('الحكومة') || tag.includes('ממשלה')) topics.push('government');
    if (tag.includes('defense') || tag.includes('defence') || tag.includes('försvar') || tag.includes('forsvar') || tag.includes('puolustus') || tag.includes('verteidigung') || tag.includes('défense') || tag.includes('defensa') || tag.includes('defensie') || tag.includes('الدفاع') || tag.includes('הגנה') || tag.includes('防衛') || tag.includes('국방') || tag.includes('国防')) topics.push('defense');
    if (tag.includes('environment') || tag.includes('miljö') || tag.includes('miljø') || tag.includes('ympäristö') || tag.includes('umwelt') || tag.includes('environnement') || tag.includes('medio ambiente') || tag.includes('milieu') || tag.includes('البيئة') || tag.includes('סביבה') || tag.includes('環境') || tag.includes('환경') || tag.includes('环境')) topics.push('environment');
    if (tag.includes('committee') || tag.includes('utskott') || tag.includes('udvalg') || tag.includes('utvalg') || tag.includes('valiokunt') || tag.includes('ausschuss') || tag.includes('commission') || tag.includes('comité') || tag.includes('commissie') || tag.includes('لجنة') || tag.includes('ועדה') || tag.includes('委員会') || tag.includes('위원회') || tag.includes('委员会')) topics.push('committees');
    if (tag.includes('legislation') || tag.includes('lagstiftning') || tag.includes('lovgivning') || tag.includes('lainsäädäntö') || tag.includes('gesetzgebung') || tag.includes('législation') || tag.includes('legislación') || tag.includes('wetgeving') || tag.includes('التشريعات') || tag.includes('חקיקה') || tag.includes('立法') || tag.includes('입법')) topics.push('legislation');
  }

  const sourceSample = `${fileName} ${content.slice(0, 2500)}`;
  for (const [topic, pattern] of TOPIC_INFERENCE_PATTERNS) {
    if (pattern.test(sourceSample)) topics.push(topic);
  }

  return [...new Set(topics)].slice(0, 5);
}

/**
 * Extract tags from article:tag meta tags.
 */
export function extractTags(content: string, fileName: string = '', inferredTopics?: string[]): string[] {
  const tags: string[] = [];
  const tagPattern = /<meta\s+property=["']article:tag["']\s+content=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(content)) !== null) {
    tags.push(match[1]!);
  }

  if (tags.length === 0) {
    inferredTopics ??= extractTopics(content, fileName);
    const inferredType = classifyArticleType(content, fileName);
    tags.push(inferredType, ...inferredTopics);
  }

  return [...new Set(tags.filter((tag) => tag.trim().length > 0))].slice(0, 4);
}
