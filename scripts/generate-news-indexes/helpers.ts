/**
 * @module generate-news-indexes/helpers
 * @description Utility functions for article metadata parsing, topic/type
 * classification, news directory scanning, and cross-language discovery.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  LanguageConfig,
  NewsArticleMetadata,
  ArticleTypeValue,
} from './types.js';
import { LANGUAGES, LANGUAGE_FLAGS, AVAILABLE_IN_TRANSLATIONS } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root news directory */
export const NEWS_DIR: string = path.join(__dirname, '..', '..', 'news');

/**
 * Generate language badge HTML for an article.
 */
export function generateLanguageBadge(lang: string, isRTL: boolean = false): string {
  const flag: string = LANGUAGE_FLAGS[lang] || '🌐';
  const langUpper: string = lang.toUpperCase();
  const dirAttr: string = isRTL ? ' dir="ltr"' : '';
  return `<span class="language-badge"${dirAttr} aria-label="${(LANGUAGES as Record<string, LanguageConfig>)[lang]?.name || lang} language"><span aria-hidden="true">${flag}</span> ${langUpper}</span>`;
}

/**
 * Generate language switcher navigation for news index pages.
 */
export function generateLanguageSwitcherNav(currentLang: string): string {
  const langEntries: [string, LanguageConfig][] = Object.entries(LANGUAGES);
  const links: string = langEntries.map(([code, data]) => {
    const flag: string = LANGUAGE_FLAGS[code] || '🌐';
    const filename: string = code === 'en' ? 'index.html' : `index_${code}.html`;
    const activeClass: string = code === currentLang ? ' active' : '';
    return `  <a href="${filename}" class="lang-link${activeClass}" hreflang="${code}">${flag} ${data.name}</a>`;
  }).join('\n');
  return `<nav class="language-switcher" role="navigation" aria-label="Language selection">\n${links}\n</nav>`;
}

/**
 * Generate "Available in" text with language badges.
 */
export function generateAvailableLanguages(languages: string[], currentLang: string): string {
  if (!languages || languages.length <= 1) return '';

  const isRTL: boolean = ['ar', 'he'].includes(currentLang);
  const availableText: string = AVAILABLE_IN_TRANSLATIONS[currentLang] || 'Available in';
  const badges: string = languages.map((lang) => generateLanguageBadge(lang, isRTL)).join(' ');

  return `<p class="available-languages"><strong>${availableText}:</strong> ${badges}</p>`;
}


/**
 * Parse HTML file to extract article metadata.
 */
export function parseArticleMetadata(filePath: string): NewsArticleMetadata | null {
  try {
    const content: string = fs.readFileSync(filePath, 'utf-8');
    const fileName: string = path.basename(filePath);

    // Extract language from filename (e.g., article-en.html → en, article-da.html → da)
    const langMatch: RegExpMatchArray | null = fileName.match(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    if (!langMatch) {
      console.warn(`  ⚠️ Skipping ${fileName}: no language suffix`);
      return null;
    }

    const lang: string = langMatch[1]!;

    // Extract metadata from HTML meta tags
    const metadata: NewsArticleMetadata = {
      slug: fileName,
      lang,
      title: extractMetaContent(content, 'og:title') || extractTitle(content) || 'Untitled',
      description: extractMetaContent(content, 'og:description') || extractMetaContent(content, 'description') || '',
      date: normalizeDateString(
        extractMetaContent(content, 'article:published_time') ||
        extractMetaContent(content, 'date') ||
        extractDateFromJSONLD(content) ||
        extractFromFilename(fileName),
      ),
      type: classifyArticleType(content, fileName),
      topics: extractTopics(content),
      tags: extractTags(content),
    };

    return metadata;
  } catch (error: unknown) {
    console.error(`  ❌ Error parsing ${path.basename(filePath)}:`, (error as Error).message);
    return null;
  }
}

/**
 * Extract content from meta tags.
 *
 * Fixed: regex now properly handles apostrophes and special characters in content.
 */
export function extractMetaContent(html: string, property: string): string | null {
  // Match double-quoted attributes
  const doubleQuotePattern = new RegExp(`<meta\\s+(?:property|name)="${property}"\\s+content="([^"]+)"`, 'i');
  const doubleQuoteMatch: RegExpMatchArray | null = html.match(doubleQuotePattern);
  if (doubleQuoteMatch) return doubleQuoteMatch[1]!;

  // Match single-quoted attributes
  const singleQuotePattern = new RegExp(`<meta\\s+(?:property|name)='${property}'\\s+content='([^']+)'`, 'i');
  const singleQuoteMatch: RegExpMatchArray | null = html.match(singleQuotePattern);
  if (singleQuoteMatch) return singleQuoteMatch[1]!;

  // Try reversed order (content before property/name)
  const reversedDoublePattern = new RegExp(`<meta\\s+content="([^"]+)"\\s+(?:property|name)="${property}"`, 'i');
  const reversedDoubleMatch: RegExpMatchArray | null = html.match(reversedDoublePattern);
  if (reversedDoubleMatch) return reversedDoubleMatch[1]!;

  const reversedSinglePattern = new RegExp(`<meta\\s+content='([^']+)'\\s+(?:property|name)='${property}'`, 'i');
  const reversedSingleMatch: RegExpMatchArray | null = html.match(reversedSinglePattern);
  if (reversedSingleMatch) return reversedSingleMatch[1]!;

  return null;
}

/**
 * Extract title from <title> tag.
 */
export function extractTitle(html: string): string | null {
  const match: RegExpMatchArray | null = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1]!.replace(' - Riksdagsmonitor', '').trim() : null;
}

/**
 * Normalize date string to YYYY-MM-DD format.
 */
export function normalizeDateString(dateStr: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]!;

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // If ISO timestamp (with time), extract just the date part
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]!;
  }

  // If has timezone offset like +01:00, remove it first
  const cleaned: string = dateStr.replace(/[+-]\d{2}:\d{2}$/, '');
  if (cleaned.includes('T')) {
    return cleaned.split('T')[0]!;
  }

  return dateStr;
}

/**
 * Extract date from JSON-LD structured data.
 */
export function extractDateFromJSONLD(html: string): string | null {
  try {
    // Extract JSON-LD script tag content
    const jsonLdMatch: RegExpMatchArray | null = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (!jsonLdMatch) return null;

    const jsonLdText: string = jsonLdMatch[1]!.trim();
    const jsonData: { datePublished?: string } = JSON.parse(jsonLdText) as { datePublished?: string };

    // Extract datePublished from NewsArticle schema
    if (jsonData.datePublished) {
      const dateStr: string = jsonData.datePublished.split('T')[0]!;
      return dateStr;
    }

    return null;
  } catch {
    // Silently fail - this is a fallback mechanism
    return null;
  }
}

/**
 * Extract date from filename (YYYY-MM-DD format).
 */
export function extractFromFilename(fileName: string): string {
  const match: RegExpMatchArray | null = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1]! : new Date().toISOString().split('T')[0]!;
}

/**
 * Classify article type based on content and filename.
 * Supports detection keywords in all 14 languages.
 */
export function classifyArticleType(content: string, fileName: string): ArticleTypeValue {
  const lowerContent: string = content.toLowerCase();

  // Prospective: week-ahead / upcoming previews
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
    '一周展望', '即将'                                                             // zh
  ];

  if (fileName.includes('week-ahead') || fileName.includes('month-ahead') || prospectiveKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()))) {
    return 'prospective';
  }

  // Analysis: committee reports, propositions, motions
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
    '委员会报告', '分析'                                                           // zh
  ];

  if (fileName.includes('committee-reports') || fileName.includes('propositions') || fileName.includes('motions') ||
      analysisKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()))) {
    return 'analysis';
  }

  // Breaking: urgent/alert news
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
    '突发新闻', '紧急'                                                             // zh
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
export function extractTopics(content: string): string[] {
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

  return [...new Set(topics)].slice(0, 5); // Unique, max 5
}

/**
 * Extract tags from article:tag meta tags.
 */
export function extractTags(content: string): string[] {
  const tags: string[] = [];
  const tagPattern = /<meta\s+property=["']article:tag["']\s+content=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(content)) !== null) {
    tags.push(match[1]!);
  }

  return tags.slice(0, 4); // Max 4 tags for display
}

/**
 * Collect all article HTML file paths recursively from a directory.
 * Supports date-based subdirectory structure: news/{year}/{month}/article.html
 */
function collectArticleFiles(dir: string): string[] {
  const result: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      result.push(...collectArticleFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('index')) {
      result.push(path.join(dir, entry.name));
    }
  }
  return result;
}

/**
 * Scan news directory and group articles by language.
 * Supports date-based subdirectory structure: news/{year}/{month}/article.html
 */
export function scanNewsArticles(): Record<string, NewsArticleMetadata[]> {
  console.log('\n📰 Scanning for articles...');

  const filePaths: string[] = collectArticleFiles(NEWS_DIR);

  console.log(`  Found ${filePaths.length} article files`);

  // Initialize buckets for all 14 supported languages
  const articlesByLang: Record<string, NewsArticleMetadata[]> = Object.fromEntries(
    Object.keys(LANGUAGES).map((lang) => [lang, []]),
  );

  filePaths.forEach((filePath) => {
    const metadata: NewsArticleMetadata | null = parseArticleMetadata(filePath);

    if (metadata) {
      // Set slug to relative path from NEWS_DIR (e.g., "2026/02/2026-02-13-article-en.html")
      metadata.slug = path.relative(NEWS_DIR, filePath).split(path.sep).join('/');

      if (articlesByLang[metadata.lang]) {
        articlesByLang[metadata.lang]!.push(metadata);
      }
    }
  });

  // Sort by date descending (newest first)
  Object.keys(articlesByLang).forEach((lang) => {
    articlesByLang[lang]?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  const langCounts: string[] = Object.entries(articlesByLang)
    .filter(([, arr]) => arr.length > 0)
    .map(([lang, arr]) => `${lang.toUpperCase()} ${arr.length}`);
  console.log(`  📊 Articles by language: ${langCounts.length > 0 ? langCounts.join(', ') : 'none found'}`);

  return articlesByLang;
}

/**
 * Build map of base slugs to available languages for cross-language discovery.
 */
export function buildSlugToLanguagesMap(articlesByLang: Record<string, NewsArticleMetadata[]>): Record<string, string[]> {
  const slugToLanguages: Record<string, string[]> = {};

  // Iterate through all articles in all languages
  Object.entries(articlesByLang).forEach(([_lang, articles]) => {
    articles.forEach((article) => {
      // Strip language suffix from slug to get base slug
      const baseSlug: string = article.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '.html');

      if (!slugToLanguages[article.slug]) {
        slugToLanguages[article.slug] = [];
      }

      // Find all articles with the same base slug across languages
      Object.entries(articlesByLang).forEach(([otherLang, otherArticles]) => {
        otherArticles.forEach((otherArticle) => {
          const otherBaseSlug: string = otherArticle.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '.html');

          if (baseSlug === otherBaseSlug && !slugToLanguages[article.slug]!.includes(otherLang)) {
            slugToLanguages[article.slug]!.push(otherLang);
          }
        });
      });
    });
  });

  return slugToLanguages;
}

/**
 * Get all articles with language information for cross-language discovery.
 *
 * NOTE: This function is currently UNUSED in production but preserved for potential
 * future use. It was implemented for Issue #155's cross-language discovery feature
 * but the requirement changed to language-specific filtering.
 *
 * @deprecated Currently unused - kept for potential future cross-language discovery
 */
export function getAllArticlesWithLanguageInfo(articlesByLang: Record<string, NewsArticleMetadata[]>): NewsArticleMetadata[] {
  // Build a map of slugs to available languages
  const slugToLanguages = new Map<string, string[]>();

  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach((article) => {
      // Extract base slug (remove language suffix)
      const baseSlug: string = article.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '');

      if (!slugToLanguages.has(baseSlug)) {
        slugToLanguages.set(baseSlug, []);
      }
      slugToLanguages.get(baseSlug)!.push(lang);
    });
  });

  // Collect all articles and enrich with language info
  const allArticles: NewsArticleMetadata[] = [];

  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach((article) => {
      const baseSlug: string = article.slug.replace(/-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/, '');
      const availableLanguages: string[] = slugToLanguages.get(baseSlug) || [lang];

      allArticles.push({
        ...article,
        availableLanguages: availableLanguages.sort(),
        baseSlug,
      });
    });
  });

  // Sort by date descending (newest first)
  allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return allArticles;
}
