/**
 * @module generate-news-indexes/types
 * @description Type definitions for the news index generation system.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export interface FilterLabels {
  type: string;
  allTypes: string;
  prospective: string;
  retrospective: string;
  analysis: string;
  breaking: string;
  topic: string;
  allTopics: string;
  parliament: string;
  government: string;
  defense: string;
  environment: string;
  committees: string;
  legislation: string;
  sort: string;
  newest: string;
  oldest: string;
  titleSort: string;
}

export interface I18nStrings {
  noArticles: string;
  search: string;
  searchPlaceholder: string;
  loadMore: string;
  showing: string | { one: string; other: string };
}

export interface BreadcrumbLabels {
  home: string;
  news: string;
}

export interface LanguageConfig {
  name: string;
  code: string;
  locale: string;
  rtl?: boolean;
  title: string;
  subtitle: string;
  keywords: string;
  breadcrumbs: BreadcrumbLabels;
  backLink: string;
  filters: FilterLabels;
  noResults: string;
  i18n: I18nStrings;
  schemaDescription: string;
  aiNewsroomTitle: string;
  aiNewsroomText: string;
  disclaimer: string;
  disclaimerLink: string;
}

export type LanguageCode =
  | 'en' | 'sv' | 'da' | 'no' | 'fi'
  | 'de' | 'fr' | 'es' | 'nl'
  | 'ar' | 'he' | 'ja' | 'ko' | 'zh';

export type ArticleTypeValue = 'prospective' | 'retrospective' | 'analysis' | 'breaking';

export interface NewsArticleMetadata {
  slug: string;
  lang: string;
  title: string;
  description: string;
  date: string;
  type: ArticleTypeValue;
  topics: string[];
  tags: string[];
  /**
   * SEO `<meta name="keywords">` content (comma-separated) from the rendered
   * article HTML, when present. Emitted as the per-card JSON-LD `keywords`
   * field so SERP crawlers see the same story-specific entity stream
   * (bill IDs, committee codes, agency acronyms) that the article page
   * itself exposes. Empty/undefined when the article HTML has no
   * `<meta name="keywords">` tag.
   */
  keywords?: string;
  availableLanguages?: string[];
  baseSlug?: string;
}

export interface ArticleDisplayData {
  title: string;
  date: string;
  type: ArticleTypeValue;
  slug: string;
  lang: string;
  availableLanguages: string[];
  excerpt: string;
  topics: string[];
  tags: string[];
}

export interface GenerationResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  articles: Record<string, NewsArticleMetadata[]>;
}

export interface LanguageNoticeMessage {
  title: string;
  text: string;
}
