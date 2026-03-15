/**
 * @module article-template
 * @description Barrel re-export preserving the original public API.
 * The monolithic article-template.ts has been decomposed into:
 *
 * | Module       | Responsibility                                       |
 * |------------- |------------------------------------------------------|
 * | constants.ts | i18n lookup tables (breadcrumbs, footer, taglines)   |
 * | helpers.ts   | date formatting, sanitisation, HTML sections         |
 * | template.ts  | main generateArticleHTML function                    |
 * | types.ts     | extended type system (ArticleTemplate, LayoutConfig) |
 * | registry.ts  | per-type template registry and AI style directives   |
 * | index.ts     | barrel re-export (this file)                         |
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { generateArticleHTML } from './template.js';
export { generateEventCalendar, generateWatchSection, generateArticleLanguageSwitcher, generateSiteFooter, fixHtmlNesting } from './helpers.js';
export { getTemplate, getStyleClass, getAIDirectives, getLayout, listRegisteredTypes } from './registry.js';
export type { ArticleTemplate, LayoutConfig, AIStyleDirective, ContentTone, ColumnCount, BreadcrumbStyle } from './types.js';
export { GLOBAL_STYLE_RUBRIC, ARTICLE_TYPE_NAMES } from './types.js';

import { generateArticleHTML } from './template.js';
import { generateEventCalendar, generateWatchSection, generateArticleLanguageSwitcher, generateSiteFooter } from './helpers.js';
import { getTemplate, getStyleClass, getAIDirectives, getLayout, listRegisteredTypes } from './registry.js';

export default {
  generateArticleHTML,
  generateEventCalendar,
  generateWatchSection,
  generateArticleLanguageSwitcher,
  generateSiteFooter,
  getTemplate,
  getStyleClass,
  getAIDirectives,
  getLayout,
  listRegisteredTypes,
};
