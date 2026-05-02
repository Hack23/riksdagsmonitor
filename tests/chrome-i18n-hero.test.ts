/**
 * Chrome i18n completeness — hero / header-tagline keys.
 *
 * Guards against the regression where hard-coded English strings leak
 * into translated chrome (the bug fixed in PR "UI/UX, multi-language &
 * dark/light theme overhaul"). For every supported language:
 *
 *   1. Every new ChromeStrings key has a defined, non-empty value.
 *   2. Non-English values must NOT equal the English value (translations
 *      must actually be translated). Brand names ("Riksdagsmonitor",
 *      "Apache-2.0", "ISO 27001") are exempt because they're proper
 *      nouns / standards we keep in English by editorial convention.
 *   3. `chrome.ts` renders the localized header tagline (no English
 *      leak in non-English variants).
 */

import { describe, expect, it } from 'vitest';

import { CHROME_I18N, chromeStrings } from '../scripts/render-lib/chrome-i18n.js';
import { buildChrome } from '../scripts/render-lib/chrome.js';
import type { Language } from '../scripts/types/language.js';

const LANGUAGES = Object.keys(CHROME_I18N) as Language[];

const NEW_HERO_KEYS = [
  'headerTagline',
  'heroSubtitle',
  'heroTagline',
  'electionCountdownLabel',
  'electionDateLong',
  'heroStatPoliticians',
  'heroStatBallots',
  'heroStatDocuments',
  'heroStatBills',
  'heroStatDecisions',
] as const;

describe('chrome-i18n — hero & header-tagline keys', () => {
  it('defines every new key for every supported language', () => {
    for (const lang of LANGUAGES) {
      const cs = chromeStrings(lang);
      for (const key of NEW_HERO_KEYS) {
        const value = cs[key];
        expect(value, `${lang}.${key} should be a non-empty string`).toBeTypeOf('string');
        expect(value.trim().length, `${lang}.${key} must not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it('translates non-English values (no copy-paste of English strings)', () => {
    const en = chromeStrings('en');
    for (const lang of LANGUAGES.filter((l) => l !== 'en')) {
      const cs = chromeStrings(lang);
      for (const key of NEW_HERO_KEYS) {
        // Editorial decision: brand+standard tokens stay in English.
        // Headline keys ("Riksdagsmonitor", "Apache-2.0") may legitimately
        // overlap. We only flag the *whole string* matching English.
        expect(
          cs[key],
          `${lang}.${key} should differ from English ("${en[key]}")`,
        ).not.toEqual(en[key]);
      }
    }
  });
});

describe('chrome.ts — header tagline reflects language', () => {
  it('renders Swedish tagline for sv chrome', () => {
    const chrome = buildChrome({
      lang: 'sv',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-sv.html',
    });
    expect(chrome.headerHtml).toContain('class="rm-logo-tagline"');
    // Swedish: "Svensk parlamentarisk underrättelse · Öppen källkod · Apache-2.0"
    expect(chrome.headerHtml).toMatch(/Svensk parlamentarisk underrättelse/);
    // English string must NOT appear in Swedish chrome.
    expect(chrome.headerHtml).not.toMatch(/Swedish parliamentary intelligence/);
  });

  it('renders Arabic tagline for ar chrome (RTL)', () => {
    const chrome = buildChrome({
      lang: 'ar',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-ar.html',
    });
    expect(chrome.headerHtml).toMatch(/استخبارات برلمانية سويدية/);
    expect(chrome.headerHtml).not.toMatch(/Swedish parliamentary intelligence/);
  });

  it('keeps the English tagline for en chrome', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(chrome.headerHtml).toMatch(/Swedish parliamentary intelligence/);
  });
});
