/**
 * @module article-template
 * @description Public API barrel for the article template modules.
 *
 * Implementation split into focused modules under `./article-template/`:
 *
 * | Module       | Lines | Responsibility                                    |
 * |------------- |-------|---------------------------------------------------|
 * | constants.ts | ~190  | i18n lookup tables (breadcrumbs, footer, taglines) |
 * | helpers.ts   | ~145  | date formatting, sanitisation, HTML sections        |
 * | template.ts  | ~270  | main generateArticleHTML function                   |
 * | index.ts     |  ~28  | barrel re-export                                    |
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export { generateArticleHTML, generateEventCalendar, generateWatchSection, generateArticleLanguageSwitcher, generateSiteFooter, fixHtmlNesting, default } from './article-template/index.js';
