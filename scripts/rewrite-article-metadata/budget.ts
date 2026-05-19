/**
 * @module rewrite-article-metadata/budget
 * @description Per-language metadata budgets (per
 * `.github/prompts/seo-metadata-contract.md` §4): CJK 30-45 title /
 * 70-120 description; RTL 40-70 title / 120-180 description; Latin 55-70
 * title / 140-200 description.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface LangBudget {
  readonly titleMin: number;
  readonly titleMax: number;
  readonly descSoftMin: number;
  readonly descHardMax: number;
  readonly descMin: number;
}

export const LATIN_BUDGET: LangBudget = {
  titleMin: 30,
  titleMax: 75,
  descSoftMin: 140,
  descHardMax: 200,
  descMin: 70,
};

export const CJK_BUDGET: LangBudget = {
  titleMin: 20,
  titleMax: 55,
  descSoftMin: 70,
  descHardMax: 120,
  descMin: 40,
};

export const RTL_BUDGET: LangBudget = {
  titleMin: 30,
  titleMax: 85,
  descSoftMin: 120,
  descHardMax: 180,
  descMin: 60,
};

export const LANG_BUDGETS: Record<string, LangBudget> = {
  en: LATIN_BUDGET,
  sv: LATIN_BUDGET,
  da: LATIN_BUDGET,
  no: LATIN_BUDGET,
  nb: LATIN_BUDGET,
  fi: LATIN_BUDGET,
  de: LATIN_BUDGET,
  fr: LATIN_BUDGET,
  es: LATIN_BUDGET,
  nl: LATIN_BUDGET,
  ar: RTL_BUDGET,
  he: RTL_BUDGET,
  ja: CJK_BUDGET,
  ko: CJK_BUDGET,
  zh: CJK_BUDGET,
};

export const META_REGEXES = {
  title: /<title>([\s\S]*?)<\/title>/i,
  metaDescription: /(<meta\s+name="description"\s+content=")([^"]*)(")/i,
  ogTitle: /(<meta\s+property="og:title"\s+content=")([^"]*)(")/i,
  ogDescription: /(<meta\s+property="og:description"\s+content=")([^"]*)(")/i,
  twitterTitle: /(<meta\s+name="twitter:title"\s+content=")([^"]*)(")/i,
  twitterDescription: /(<meta\s+name="twitter:description"\s+content=")([^"]*)(")/i,
  ogImageAlt: /(<meta\s+property="og:image:alt"\s+content=")([^"]*)(")/i,
  twitterImageAlt: /(<meta\s+name="twitter:image:alt"\s+content=")([^"]*)(")/i,
  jsonLd: /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  article: /<article\b[^>]*>([\s\S]*?)<\/article>/i,
  htmlLang: /<html[^>]*\blang="([^"]+)"/i,
} as const;

/**
 * Parse the article's `lang` attribute to pick the right budget.
 * Falls back to Latin when the lang is unknown (safe default).
 */
export function resolveBudget(html: string, filename: string): LangBudget {
  const m = html.match(META_REGEXES.htmlLang);
  let lang = (m?.[1] ?? '').split('-')[0]!.toLowerCase();
  if (!lang) {
    const fm = filename.match(/-(en|sv|da|no|nb|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    lang = fm?.[1] ?? 'en';
  }
  return LANG_BUDGETS[lang] ?? LATIN_BUDGET;
}

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const NEWS_DIR = path.join(ROOT_DIR, 'news');
