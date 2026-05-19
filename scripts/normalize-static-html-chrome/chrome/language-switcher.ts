/**
 * @module normalize-static-html-chrome/chrome/language-switcher
 * @description Insert the primary nav + language switcher inside `<header>`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { PageFamily } from '../constants.js';
import { languageBar } from './language-bar.js';
import { primaryNav } from './primary-nav.js';

/** Replace existing primary-nav + language-switcher pair with fresh markup. */
export function ensureLanguageSwitcher(html: string, prefix: string, family: PageFamily, lang: Language): string {
  const cleaned = html
    .replace(/\s*<nav class="site-header-nav"[\s\S]*?data-rm-static-primary-nav="true"[\s\S]*?<\/nav>\s*/i, '\n')
    .replace(/\s*<nav class="language-switcher site-language-switcher"[\s\S]*?data-rm-static-language-switcher="true"[\s\S]*?<\/nav>\s*/i, '\n');
  const nav = primaryNav(prefix, lang);
  const bar = languageBar(prefix, family, lang);
  if (/<\/header>/i.test(cleaned)) {
    return cleaned.replace(/\s*<\/header>/i, `\n${nav}\n${bar}\n</header>`);
  }
  return cleaned.replace(/(<body[^>]*>)/i, `$1\n${nav}\n${bar}\n`);
}
