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

// ---------------------------------------------------------------------------
// Context-aware inter-section transitions
// ---------------------------------------------------------------------------

/**
 * Named section pairs that benefit from contextual bridging sentences.
 * The key is `fromSection-toSection`; the value is a template function that
 * accepts optional context variables and returns a localized transition phrase.
 */
type TransitionContext = {
  topicKeyword?: string;
  actorName?: string;
};

type TransitionTemplates = Readonly<Record<Language, string>>;

/**
 * Canonical inter-section transition templates.
 *
 * Templates may contain the following interpolation tokens (replaced at call time):
 * - `{topic}` — topicKeyword from context (defaults to "this legislation")
 * - `{actor}` — actorName from context (defaults to "key stakeholders")
 */
const SECTION_TRANSITION_TEMPLATES: Readonly<Record<string, TransitionTemplates>> = {
  'key-takeaways-what-happens-next': {
    en: 'With {topic} now moving through committees, here is the full legislative timeline ahead:',
    sv: 'Med {topic} som nu behandlas i utskott, se hela den kommande lagstiftningsprocessen:',
    da: 'Med {topic} der nu behandles i udvalg, se hele den kommende lovgivningstidslinje:',
    no: 'Med {topic} som nå behandles i komiteer, se hele den kommende lovgivningstidslinjen:',
    fi: 'Kun {topic} etenee valiokunnissa, tässä on koko tuleva lainsäädäntöaikataulu:',
    de: 'Da {topic} nun durch die Ausschüsse geht, hier ist die vollständige Gesetzgebungszeitleiste:',
    fr: 'Avec {topic} maintenant en cours d\'examen en commission, voici la chronologie complète:',
    es: 'Con {topic} avanzando ahora por los comités, aquí está la cronología legislativa completa:',
    nl: 'Nu {topic} door commissies gaat, volgt hier de volledige wetgevingstijdlijn:',
    ar: 'مع تقدم {topic} عبر اللجان، إليك الجدول الزمني التشريعي الكامل:',
    he: 'כש-{topic} עובר כעת בוועדות, הנה ציר הזמן המלא של תהליך החקיקה:',
    ja: '{topic}が委員会を通過するにつれ、以下が今後の立法スケジュールです：',
    ko: '{topic}이(가) 위원회를 통과함에 따라, 다음은 전체 입법 일정입니다:',
    zh: '随着{topic}在委员会中推进，以下是完整的立法时间线：',
  },
  'swot-winners-losers': {
    en: 'The SWOT analysis above translates into clear gains and losses for {actor} and other actors:',
    sv: 'SWOT-analysen ovan resulterar i tydliga vinster och förluster för {actor} och andra aktörer:',
    da: 'SWOT-analysen ovenfor omsættes til klare gevinster og tab for {actor} og andre aktører:',
    no: 'SWOT-analysen ovenfor gir klare gevinster og tap for {actor} og andre aktører:',
    fi: 'Edellä esitetty SWOT-analyysi tarkoittaa selkeitä voittoja ja tappioita {actor}:lle ja muille toimijoille:',
    de: 'Die obige SWOT-Analyse zeigt klare Gewinne und Verluste für {actor} und andere Akteure:',
    fr: 'L\'analyse SWOT ci-dessus se traduit par des gains et pertes clairs pour {actor} et d\'autres acteurs:',
    es: 'El análisis SWOT anterior se traduce en ganancias y pérdidas claras para {actor} y otros actores:',
    nl: 'De bovenstaande SWOT-analyse vertaalt zich in duidelijke winsten en verliezen voor {actor} en andere actoren:',
    ar: 'تتحول تحليل SWOT أعلاه إلى مكاسب وخسائر واضحة لـ{actor} والفاعلين الآخرين:',
    he: 'ניתוח ה-SWOT לעיל מתורגם לרווחים והפסדים ברורים עבור {actor} ושחקנים אחרים:',
    ja: '上記のSWOT分析は、{actor}および他のアクターにとって明確な利益と損失に変換されます：',
    ko: '위의 SWOT 분석은 {actor} 및 다른 행위자들에게 명확한 이득과 손실로 이어집니다:',
    zh: '上述SWOT分析转化为{actor}和其他行动者的明确得失：',
  },
  'winners-losers-what-happens-next': {
    en: 'Given this outcome for {actor}, here is what the next legislative steps mean in practice:',
    sv: 'Med tanke på detta utfall för {actor}, är det här vad nästa lagstiftningssteg innebär i praktiken:',
    da: 'I betragtning af dette resultat for {actor}, er det her, hvad de næste lovgivningstrin betyder i praksis:',
    no: 'Gitt dette utfallet for {actor}, her er hva de neste lovgivningstrinnene betyr i praksis:',
    fi: 'Ottaen huomioon tämä tulos {actor}:lle, tässä on mitä seuraavat lainsäädäntövaiheet tarkoittavat käytännössä:',
    de: 'Angesichts dieses Ergebnisses für {actor} bedeuten die nächsten Gesetzgebungsschritte in der Praxis:',
    fr: 'Compte tenu de ce résultat pour {actor}, voici ce que signifient les prochaines étapes législatives en pratique:',
    es: 'Dado este resultado para {actor}, esto es lo que significan los próximos pasos legislativos en la práctica:',
    nl: 'Gezien dit resultaat voor {actor}, is dit wat de volgende wetgevingsstappen in de praktijk betekenen:',
    ar: 'بالنظر إلى هذه النتيجة لـ{actor}، إليك ما تعنيه الخطوات التشريعية التالية عملياً:',
    he: 'בהתחשב בתוצאה זו עבור {actor}, הנה מה שמשמעות שלבי החקיקה הבאים מעשית:',
    ja: '{actor}にとってのこの結果を踏まえ、次の立法ステップが実際に意味することは：',
    ko: '{actor}에 대한 이 결과를 감안할 때, 다음 입법 단계가 실제로 의미하는 바는:',
    zh: '鉴于{actor}的这一结果，以下是下一步立法步骤实际意味着什么：',
  },
} as const;

/**
 * Per-language default context values for section transition interpolation.
 * Prevents mixed-language output when callers omit context for non-English articles.
 */
const DEFAULT_TRANSITION_CONTEXT: Readonly<Record<Language, { topic: string; actor: string }>> = {
  en: { topic: 'this legislation', actor: 'key stakeholders' },
  sv: { topic: 'denna lagstiftning', actor: 'centrala aktörer' },
  da: { topic: 'denne lovgivning', actor: 'centrale aktører' },
  no: { topic: 'denne lovgivningen', actor: 'sentrale aktører' },
  fi: { topic: 'tämä lainsäädäntö', actor: 'keskeiset toimijat' },
  de: { topic: 'diese Gesetzgebung', actor: 'zentrale Akteure' },
  fr: { topic: 'cette législation', actor: 'les acteurs clés' },
  es: { topic: 'esta legislación', actor: 'los actores clave' },
  nl: { topic: 'deze wetgeving', actor: 'belangrijke actoren' },
  ar: { topic: 'هذا التشريع', actor: 'الأطراف الرئيسية' },
  he: { topic: 'חקיקה זו', actor: 'בעלי העניין המרכזיים' },
  ja: { topic: 'この法案', actor: '主要関係者' },
  ko: { topic: '이 법안', actor: '주요 이해관계자' },
  zh: { topic: '该立法', actor: '关键利益相关者' },
} as const;

/**
 * Generate a context-aware inter-section transition sentence.
 *
 * Returns an empty string when no template is registered for the given
 * `fromSection → toSection` pair (allowing callers to skip rendering).
 * The returned string is **plain text** (not HTML) — wrap it in a `<p>` tag
 * with appropriate CSS class at the call site.
 *
 * Callers may omit `context`, in which case localized defaults are used for the
 * requested language (falling back to English defaults as a last resort).
 * However, for best results callers should supply specific `context.topicKeyword`
 * and `context.actorName` values that match the article's actual subject matter,
 * especially for non-English articles.
 *
 * @param lang         - Article language code
 * @param fromSection  - CSS class / identifier of the preceding section
 * @param toSection    - CSS class / identifier of the following section
 * @param context      - Optional topic and actor to interpolate into the template.
 *                       When omitted, localized defaults are used.
 * @returns Localized transition sentence or empty string
 *
 * @example
 * ```typescript
 * const trans = generateSectionTransition('en', 'swot', 'winners-losers', {
 *   actorName: 'Socialdemokraterna',
 * });
 * // → "The SWOT analysis above translates into clear gains and losses for Socialdemokraterna and other actors:"
 *
 * // Swedish article — supply Swedish context values:
 * const transSv = generateSectionTransition('sv', 'swot', 'winners-losers', {
 *   actorName: 'Socialdemokraterna',
 * });
 * ```
 */
export function generateSectionTransition(
  lang: Language | string,
  fromSection: string,
  toSection: string,
  context: TransitionContext = {},
): string {
  const key = `${fromSection}-${toSection}`;
  const templates = SECTION_TRANSITION_TEMPLATES[key];
  if (!templates) return '';

  const template: string =
    templates[lang as Language] ?? templates.en ?? '';
  if (!template) return '';

  const defaults = DEFAULT_TRANSITION_CONTEXT[lang as Language] ?? DEFAULT_TRANSITION_CONTEXT.en;
  const topic = context.topicKeyword ?? defaults.topic;
  const actor = context.actorName ?? defaults.actor;

  return template
    .replace(/\{topic\}/g, () => topic)
    .replace(/\{actor\}/g, () => actor);
}
