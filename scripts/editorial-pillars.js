/**
 * Evening Analysis Editorial Pillars
 * 
 * Localized heading mappings for the 5 Editorial Pillars structure
 * in evening analysis articles across all 14 supported languages.
 * 
 * Used by:
 * - tests/news-evening-analysis.test.js (extractSections)
 * - scripts/validate-evening-analysis.js (extractSections)
 * 
 * The 5 Editorial Pillars:
 * 1. Lead Story / Parliamentary Pulse (most significant development)
 * 2. Parliamentary Pulse (legislative activity)
 * 3. Government Watch (executive activity)
 * 4. Opposition Dynamics (cross-party analysis)
 * 5. Looking Ahead (tomorrow's preview)
 */

export const EDITORIAL_PILLAR_HEADINGS = {
  en: {
    parliamentaryPulse: 'Parliamentary Pulse',
    governmentWatch: 'Government Watch',
    oppositionDynamics: 'Opposition Dynamics',
    lookingAhead: 'Looking Ahead'
  },
  sv: {
    parliamentaryPulse: 'Riksdagspulsen',
    governmentWatch: 'Regeringsbevakning',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Vad händer imorgon'
  },
  da: {
    parliamentaryPulse: 'Parlamentarisk Puls',
    governmentWatch: 'Regeringsovervågning',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Hvad sker i morgen'
  },
  no: {
    parliamentaryPulse: 'Parlamentarisk Puls',
    governmentWatch: 'Regjeringsovervåking',
    oppositionDynamics: 'Opposisjonsdynamikk',
    lookingAhead: 'Hva skjer i morgen'
  },
  fi: {
    parliamentaryPulse: 'Parlamentaarinen Pulssi',
    governmentWatch: 'Hallituksen Valvonta',
    oppositionDynamics: 'Opposition Dynamiikka',
    lookingAhead: 'Mitä tapahtuu huomenna'
  },
  de: {
    parliamentaryPulse: 'Parlamentarischer Puls',
    governmentWatch: 'Regierungsbeobachtung',
    oppositionDynamics: 'Oppositionsdynamik',
    lookingAhead: 'Was passiert morgen'
  },
  fr: {
    parliamentaryPulse: 'Pouls Parlementaire',
    governmentWatch: 'Surveillance Gouvernementale',
    oppositionDynamics: 'Dynamique de l\'Opposition',
    lookingAhead: 'Ce qui se passe demain'
  },
  es: {
    parliamentaryPulse: 'Pulso Parlamentario',
    governmentWatch: 'Vigilancia Gubernamental',
    oppositionDynamics: 'Dinámica de la Oposición',
    lookingAhead: 'Qué sucede mañana'
  },
  nl: {
    parliamentaryPulse: 'Parlementaire Pols',
    governmentWatch: 'Regeringstoezicht',
    oppositionDynamics: 'Oppositiedynamiek',
    lookingAhead: 'Wat gebeurt er morgen'
  },
  ar: {
    parliamentaryPulse: 'النبض البرلماني',
    governmentWatch: 'مراقبة الحكومة',
    oppositionDynamics: 'ديناميكية المعارضة',
    lookingAhead: 'ماذا يحدث غداً'
  },
  he: {
    parliamentaryPulse: 'הדופק הפרלמנטרי',
    governmentWatch: 'מעקב אחר הממשלה',
    oppositionDynamics: 'דינמיקת האופוזיציה',
    lookingAhead: 'מה קורה מחר'
  },
  ja: {
    parliamentaryPulse: '議会の脈動',
    governmentWatch: '政府監視',
    oppositionDynamics: '野党の動き',
    lookingAhead: '明日の予定'
  },
  ko: {
    parliamentaryPulse: '의회 동향',
    governmentWatch: '정부 감시',
    oppositionDynamics: '야당 역학',
    lookingAhead: '내일 일정'
  },
  zh: {
    parliamentaryPulse: '议会脉动',
    governmentWatch: '政府监督',
    oppositionDynamics: '反对派动态',
    lookingAhead: '明天会发生什么'
  }
};

/**
 * Detect article language from HTML content
 * @param {string} html - HTML content
 * @returns {string} - Language code (fallback to 'en')
 */
export function detectArticleLanguage(html) {
  if (!html) {
    return 'en';
  }
  const match = html.match(/<html[^>]*lang="([^"]+)"/i);
  if (match && match[1]) {
    // Normalize language code: lowercase and strip region (e.g., "EN" or "no-NO" -> "en", "no")
    const primaryLang = match[1].toLowerCase().split('-')[0];
    if (EDITORIAL_PILLAR_HEADINGS[primaryLang]) {
      return primaryLang;
    }
  }
  // Fallback to English
  return 'en';
}

/**
 * Get localized heading for a pillar
 * @param {string} lang - Language code
 * @param {string} pillar - Pillar name
 * @returns {string} - Localized heading
 */
export function getLocalizedHeading(lang, pillar) {
  const headings = EDITORIAL_PILLAR_HEADINGS[lang] || EDITORIAL_PILLAR_HEADINGS.en;
  return headings[pillar];
}
