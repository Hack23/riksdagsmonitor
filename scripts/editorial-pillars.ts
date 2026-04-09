/**
 * @module Intelligence/EditorialPillars
 * @description Five-pillar editorial framework with localized headings for 14 languages.
 * Bounded context: Editorial Intelligence
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from './types/language.js';
import type { EditorialPillar, LocalizedPillarHeadings, PillarHeadings } from './types/editorial.js';

/**
 * Localized editorial pillar headings for all 14 supported languages.
 */
export const EDITORIAL_PILLAR_HEADINGS: LocalizedPillarHeadings = {
  en: {
    parliamentaryPulse: 'Parliamentary Pulse',
    governmentWatch: 'Government Watch',
    oppositionDynamics: 'Opposition Dynamics',
    lookingAhead: 'Looking Ahead',
  },
  sv: {
    parliamentaryPulse: 'Riksdagspulsen',
    governmentWatch: 'Regeringsbevakning',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Vad händer imorgon',
  },
  da: {
    parliamentaryPulse: 'Parlamentarisk Puls',
    governmentWatch: 'Regeringsovervågning',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Hvad sker i morgen',
  },
  no: {
    parliamentaryPulse: 'Parlamentarisk Puls',
    governmentWatch: 'Regjeringsovervåking',
    oppositionDynamics: 'Opposisjonsdynamikk',
    lookingAhead: 'Hva skjer i morgen',
  },
  fi: {
    parliamentaryPulse: 'Parlamentaarinen Pulssi',
    governmentWatch: 'Hallituksen Valvonta',
    oppositionDynamics: 'Opposition Dynamiikka',
    lookingAhead: 'Mitä tapahtuu huomenna',
  },
  de: {
    parliamentaryPulse: 'Parlamentarischer Puls',
    governmentWatch: 'Regierungsbeobachtung',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Was passiert morgen',
  },
  fr: {
    parliamentaryPulse: 'Pouls Parlementaire',
    governmentWatch: 'Surveillance Gouvernementale',
    oppositionDynamics: "Dynamique de l'Opposition",
    lookingAhead: 'Ce qui se passe demain',
  },
  es: {
    parliamentaryPulse: 'Pulso Parlamentario',
    governmentWatch: 'Vigilancia Gubernamental',
    oppositionDynamics: 'Dinámica de la Oposición',
    lookingAhead: 'Qué sucede mañana',
  },
  nl: {
    parliamentaryPulse: 'Parlementaire Pols',
    governmentWatch: 'Regeringstoezicht',
    oppositionDynamics: 'Oppositiedynamiek',
    lookingAhead: 'Wat gebeurt er morgen',
  },
  ar: {
    parliamentaryPulse: 'النبض البرلماني',
    governmentWatch: 'مراقبة الحكومة',
    oppositionDynamics: 'ديناميكية المعارضة',
    lookingAhead: 'ماذا يحدث غداً',
  },
  he: {
    parliamentaryPulse: 'הדופק הפרלמנטרי',
    governmentWatch: 'מעקב אחר הממשלה',
    oppositionDynamics: 'דינמיקת האופוזיציה',
    lookingAhead: 'מה קורה מחר',
  },
  ja: {
    parliamentaryPulse: '議会の脈動',
    governmentWatch: '政府監視',
    oppositionDynamics: '野党の動き',
    lookingAhead: '明日の予定',
  },
  ko: {
    parliamentaryPulse: '의회 동향',
    governmentWatch: '정부 감시',
    oppositionDynamics: '야당 역학',
    lookingAhead: '내일 일정',
  },
  zh: {
    parliamentaryPulse: '议会脉动',
    governmentWatch: '政府监督',
    oppositionDynamics: '反对派动态',
    lookingAhead: '明天会发生什么',
  },
} as const;

/**
 * Detect the language of an article from its HTML lang attribute.
 *
 * @param html - HTML content to inspect
 * @returns Language code (falls back to 'en')
 */
export function detectArticleLanguage(html: string | null | undefined): Language {
  if (!html) {
    return 'en';
  }
  const match = html.match(/<html[^>]*lang="([^"]+)"/i);
  if (match?.[1]) {
    const primaryLang = match[1].toLowerCase().split('-')[0] as Language;
    if (primaryLang in EDITORIAL_PILLAR_HEADINGS) {
      return primaryLang;
    }
  }
  return 'en';
}

/**
 * Get the localized heading text for a specific editorial pillar.
 *
 * @param lang - Language code
 * @param pillar - Pillar identifier
 * @returns Localized heading string
 */
export function getLocalizedHeading(lang: Language | string, pillar: EditorialPillar): string {
  const headings: PillarHeadings =
    EDITORIAL_PILLAR_HEADINGS[lang as Language] ?? EDITORIAL_PILLAR_HEADINGS.en;
  return headings[pillar];
}

/**
 * DEPRECATED: Generic inter-pillar transitions have been removed from this module.
 * All transition values are intentionally empty strings, so callers can either
 * provide article-specific connective prose or skip rendering the transition
 * element entirely when the value is falsy.
 */
export const INTER_PILLAR_TRANSITIONS: Readonly<Record<Language, Readonly<Record<string, string>>>> = {
  en: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  sv: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  da: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  no: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  fi: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  de: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  fr: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  es: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  nl: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  ar: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  he: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  ja: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  ko: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
  zh: {
    pulseToWatch: '',
    watchToOpposition: '',
    oppositionToAhead: '',
  },
} as const;

/**
 * Get a localized inter-pillar transition phrase.
 *
 * @param lang - Language code
 * @param transition - Transition key (e.g. 'pulseToWatch', 'watchToOpposition', 'oppositionToAhead')
 * @returns Localized transition string, falls back to English
 */
export function getPillarTransition(lang: Language | string, transition: string): string {
  const langTransitions =
    INTER_PILLAR_TRANSITIONS[lang as Language] ?? INTER_PILLAR_TRANSITIONS.en;
  return langTransitions[transition] ?? INTER_PILLAR_TRANSITIONS.en[transition] ?? '';
}
