/**
 * @module article-template
 * @description Barrel re-export for backward compatibility.
 *
 * This file was previously a 666-line monolith. It has been decomposed
 * into focused modules under `./article-template/`:
 *
 * | Module       | Lines | Responsibility                                    |
 * |------------- |-------|---------------------------------------------------|
 * | constants.ts | ~190  | i18n lookup tables (breadcrumbs, footer, taglines) |
 * | helpers.ts   | ~145  | date formatting, sanitisation, HTML sections        |
 * | template.ts  | ~270  | main generateArticleHTML function                   |
 * | index.ts     |  ~28  | barrel re-export                                    |
 *
 * All public exports are preserved — existing consumers require no changes.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export { generateArticleHTML, generateEventCalendar, generateWatchSection, generateArticleLanguageSwitcher, generateSiteFooter, fixHtmlNesting, default } from './article-template/index.js';
