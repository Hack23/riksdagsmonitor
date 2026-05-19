/**
 * @module normalize-static-html-chrome/targets
 * @description Legacy and modern page target enumerators.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import {
  DASHBOARD_SLUGS,
  LANGUAGES,
  type ModernTarget,
  type PageTarget,
} from './constants.js';
import { fileFor, languageSuffix } from './paths.js';

/** Enumerate (file, lang, family) tuples for the legacy chrome pass. */
export function targets(): PageTarget[] {
  return LANGUAGES.flatMap((lang) => [
    { file: fileFor('home', lang), lang, family: 'home' as const },
    { file: fileFor('dashboard', lang), lang, family: 'dashboard' as const },
    { file: fileFor('politician', lang), lang, family: 'politician' as const },
  ]);
}

/** Enumerate all targets for the modern `rm-site-header` migration. */
export function modernTargets(): ModernTarget[] {
  const out: ModernTarget[] = [];
  for (const lang of LANGUAGES) {
    const sfx = languageSuffix(lang);
    out.push({ file: `index${sfx}.html`, lang, family: 'home' });
    out.push({ file: `dashboard/index${sfx}.html`, lang, family: 'dashboard-hub' });
    out.push({ file: `politician-dashboard${sfx}.html`, lang, family: 'politician' });
    for (const slug of DASHBOARD_SLUGS) {
      out.push({ file: `dashboards/${slug}${sfx}.html`, lang, family: 'dashboard-slug', slug });
    }
  }
  return out;
}

/** Canonical-path resolver for a modern target. */
export function modernCanonicalFor(
  family: ModernTarget['family'],
  slug: string | undefined,
  lang: Language,
): string {
  const sfx = languageSuffix(lang);
  if (family === 'home') return `index${sfx}.html`;
  if (family === 'dashboard-hub') return `dashboard/index${sfx}.html`;
  if (family === 'politician') return `politician-dashboard${sfx}.html`;
  return `dashboards/${slug}${sfx}.html`;
}

/** Build the hreflang alternate map for every supported language. */
export function modernAlternatesFor(
  family: ModernTarget['family'],
  slug: string | undefined,
): Partial<Record<Language, string>> {
  const out: Partial<Record<Language, string>> = {};
  for (const lang of LANGUAGES) {
    out[lang] = modernCanonicalFor(family, slug, lang);
  }
  return out;
}
