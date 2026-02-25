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
 * Analytical transition phrases bridging adjacent editorial pillars.
 * Separated from EDITORIAL_PILLAR_HEADINGS to maintain pillar structure integrity.
 */
export const INTER_PILLAR_TRANSITIONS: Readonly<Record<Language, Readonly<Record<string, string>>>> = {
  en: {
    pulseToWatch: 'While parliament deliberates these legislative matters, the executive branch has been equally active.',
    watchToOpposition: 'While the government advances its agenda, opposition parties have mounted coordinated responses.',
    oppositionToAhead: 'These competing dynamics set the stage for tomorrow\'s parliamentary business.',
  },
  sv: {
    pulseToWatch: 'Medan riksdagen behandlar dessa lagstiftningsfrågor har regeringen också varit aktiv.',
    watchToOpposition: 'Medan regeringen driver sin agenda har oppositionspartierna samordnat sina svar.',
    oppositionToAhead: 'Dessa konkurrerande dynamiker sätter scenen för morgondagens riksdagsarbete.',
  },
  da: {
    pulseToWatch: 'Mens parlamentet behandler disse lovgivningsspørgsmål, har den udøvende magt også været aktiv.',
    watchToOpposition: 'Mens regeringen fremmer sin dagsorden, har oppositionspartierne koordineret svar.',
    oppositionToAhead: 'Disse konkurrerende dynamikker danner baggrund for morgendagens parlamentariske forretning.',
  },
  no: {
    pulseToWatch: 'Mens Stortinget behandler disse lovgivningsspørsmålene, har regjeringen også vært aktiv.',
    watchToOpposition: 'Mens regjeringen fremmer sin agenda, har opposisjonspartiene koordinert svar.',
    oppositionToAhead: 'Disse konkurrerende dynamikkene danner bakteppet for morgendagens stortingsvirksomhet.',
  },
  fi: {
    pulseToWatch: 'Samalla kun eduskunta käsittelee näitä lainsäädäntöasioita, toimeenpanovalta on ollut yhtä aktiivinen.',
    watchToOpposition: 'Samalla kun hallitus edistää ohjelmaansa, oppositiopuolueet ovat koordinoineet vastauksensa.',
    oppositionToAhead: 'Nämä kilpailevat dynamiikat asettavat näyttämön huomiselle eduskuntatyölle.',
  },
  de: {
    pulseToWatch: 'Während das Parlament diese Gesetzgebungsfragen berät, war auch die Exekutive aktiv.',
    watchToOpposition: 'Während die Regierung ihre Agenda vorantreibt, haben die Oppositionsparteien koordinierte Antworten entwickelt.',
    oppositionToAhead: 'Diese konkurrierenden Dynamiken bereiten die Bühne für die parlamentarischen Geschäfte von morgen.',
  },
  fr: {
    pulseToWatch: 'Alors que le parlement délibère sur ces questions législatives, le pouvoir exécutif a été tout aussi actif.',
    watchToOpposition: "Tandis que le gouvernement fait avancer son programme, les partis d'opposition ont coordonné leurs réponses.",
    oppositionToAhead: 'Ces dynamiques concurrentes préparent le terrain pour les travaux parlementaires de demain.',
  },
  es: {
    pulseToWatch: 'Mientras el parlamento delibera sobre estos asuntos legislativos, el poder ejecutivo también ha estado activo.',
    watchToOpposition: 'Mientras el gobierno avanza en su agenda, los partidos de la oposición han coordinado respuestas.',
    oppositionToAhead: 'Estas dinámicas competidoras preparan el escenario para los asuntos parlamentarios de mañana.',
  },
  nl: {
    pulseToWatch: 'Terwijl het parlement over deze wetgevende kwesties beraadslaagt, is ook de uitvoerende macht actief geweest.',
    watchToOpposition: 'Terwijl de regering haar agenda voortzet, hebben de oppositiepartijen gecoördineerde reacties gemount.',
    oppositionToAhead: 'Deze concurrerende dynamieken bereiden het toneel voor de parlementaire werkzaamheden van morgen.',
  },
  ar: {
    pulseToWatch: 'بينما يتداول البرلمان في هذه المسائل التشريعية، كانت السلطة التنفيذية نشطة بالقدر ذاته.',
    watchToOpposition: 'بينما تُقدِّم الحكومة أجندتها، نسّقت أحزاب المعارضة ردودها.',
    oppositionToAhead: 'تُهيئ هذه الديناميكيات المتنافسة المسرح لأعمال البرلمان في الغد.',
  },
  he: {
    pulseToWatch: 'בעוד הפרלמנט דן בעניינים מחוקקים אלה, הרשות המבצעת הייתה פעילה לא פחות.',
    watchToOpposition: 'בעוד הממשלה מקדמת את סדר יומה, תיאמו מפלגות האופוזיציה תגובות מתואמות.',
    oppositionToAhead: 'הדינמיקות המתחרות הללו מכינות את הקרקע לעסקי הפרלמנט של מחר.',
  },
  ja: {
    pulseToWatch: '議会がこれらの立法事項を審議する一方、行政府も同様に活発に活動しています。',
    watchToOpposition: '政府がその政策を推し進める一方、野党は協調した対応を行っています。',
    oppositionToAhead: 'これらの競合するダイナミクスが明日の議会業務の舞台を整えています。',
  },
  ko: {
    pulseToWatch: '의회가 이러한 입법 사안을 심의하는 동안 행정부도 마찬가지로 활발히 활동했습니다.',
    watchToOpposition: '정부가 의제를 추진하는 동안 야당은 협력된 대응을 구성했습니다.',
    oppositionToAhead: '이러한 경쟁하는 역학들이 내일의 의회 업무를 위한 무대를 설정합니다.',
  },
  zh: {
    pulseToWatch: '当议会审议这些立法事务时，行政部门同样积极活跃。',
    watchToOpposition: '在政府推进其议程的同时，反对党已协调一致地作出回应。',
    oppositionToAhead: '这些相互竞争的动态为明天的议会事务奠定了基础。',
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
