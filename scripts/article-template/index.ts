/**
 * @module article-template
 * @description Barrel re-export preserving the original public API.
 * The monolithic article-template.ts has been decomposed into:
 *
 * | Module       | Responsibility                                   |
 * |------------- |--------------------------------------------------|
 * | constants.ts | i18n lookup tables (breadcrumbs, footer, taglines)|
 * | helpers.ts   | date formatting, sanitisation, HTML sections      |
 * | template.ts  | main generateArticleHTML function                 |
 * | index.ts     | barrel re-export (this file)                      |
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { generateArticleHTML } from './template.js';
export { generateEventCalendar, generateWatchSection, generateArticleLanguageSwitcher, generateSiteFooter } from './helpers.js';

import { generateArticleHTML } from './template.js';
import { generateEventCalendar, generateWatchSection, generateArticleLanguageSwitcher, generateSiteFooter } from './helpers.js';

export default {
  generateArticleHTML,
  generateEventCalendar,
  generateWatchSection,
  generateArticleLanguageSwitcher,
  generateSiteFooter
};
