/**
 * @module Translation Dictionary
 * @description Static translation dictionary for Swedish parliamentary terms.
 *
 * Used by the post-processing step in generate-news-enhanced.ts to translate
 * `data-translate="true"` spans containing Swedish text into the target language.
 * Covers ministry names, party groups, committee names, document type prefixes,
 * parliamentary procedure terms, budget/fiscal vocabulary, EU/international terms,
 * geographic/regional terms, government agencies, legal terms, and policy domains.
 *
 * Supported languages: en, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh
 * (Swedish 'sv' articles keep original text and only have the attribute removed.)
 *
 * Domain-specific sub-dictionaries (split for maintainability):
 * - translation-dictionary-committee-names.ts  — institution + committee names
 * - translation-dictionary-party-names.ts      — ministry + party group names
 * - translation-dictionary-political-terms.ts  — procedure, budget, EU, legal, policy terms
 */

import type { Language } from './types/language.js';
import { COMMITTEE_NAME_TERMS } from './translation-dictionary-committee-names.js';
import { PARTY_NAME_TERMS } from './translation-dictionary-party-names.js';
import { POLITICAL_TERMS } from './translation-dictionary-political-terms.js';

/**
 * Per-language dictionary of Swedish term → translated term.
 * Keys are lower-cased Swedish phrases for case-insensitive matching.
 */
export type TranslationMap = Record<string, string>;

/** Full dictionary keyed by target language code. */
export type LanguageDictionary = Partial<Record<Language, TranslationMap>>;

// ---------------------------------------------------------------------------
// Document-type prefix phrases
// ---------------------------------------------------------------------------

/** Translations for "med anledning av prop." (motion in response to a proposition) */
const motionResponsePropPrefix: Record<Language, string> = {
  sv: 'med anledning av prop.',
  en: 'in response to prop.',
  da: 'som svar på prop.',
  no: 'som svar på prop.',
  fi: 'vastauksena esitykseen',
  de: 'als Reaktion auf Prop.',
  fr: 'en réponse à la prop.',
  es: 'en respuesta a la prop.',
  nl: 'als reactie op prop.',
  ar: 'ردًا على مقترح',
  he: 'בתגובה להצעה',
  ja: '法案への対応として',
  ko: '의안에 대한 답변',
  zh: '回应法案',
};

/** Translations for "med anledning av skr." (motion in response to a government communication) */
const motionResponseSkrPrefix: Record<Language, string> = {
  sv: 'med anledning av skr.',
  en: 'in response to govt. comm.',
  da: 'som svar på regeringsmeddelelse',
  no: 'som svar på regj. meld.',
  fi: 'vastauksena hallituksen kirjeeseen',
  de: 'als Reaktion auf Regierungsschreiben',
  fr: 'en réponse à la communication gouvernementale',
  es: 'en respuesta a la comunicación gubernamental',
  nl: 'als reactie op gov. mededeling',
  ar: 'ردًا على مراسلة حكومية',
  he: 'בתגובה לתקשורת ממשלתית',
  ja: '政府通知への対応として',
  ko: '정부 서한에 대한 답변',
  zh: '回应政府通知',
};

// ---------------------------------------------------------------------------
// Common Swedish parliamentary terms
// ---------------------------------------------------------------------------

/**
 * Builds a flat translation map from Swedish → target language for one language.
 * Swedish source keys are stored lower-case to enable case-insensitive replacement.
 */
function buildMap(lang: Language, terms: ReadonlyArray<readonly [string, Record<Language, string>]>): TranslationMap {
  const map: TranslationMap = {};
  for (const [swedish, translations] of terms) {
    const translation = translations[lang];
    if (translation && translation !== swedish) {
      map[swedish.toLowerCase()] = translation;
    }
  }
  return map;
}

/**
 * Module-level term data — hoisted out of buildMap so it is allocated only once
 * instead of once per language (13×) during module initialisation.
 */
const TERMS: ReadonlyArray<readonly [string, Record<Language, string>]> = [
    // ---- Document type prefixes ----
    ['med anledning av prop.', motionResponsePropPrefix],
    ['med anledning av skr.', motionResponseSkrPrefix],
    // Institutional, committee and party names are defined in domain-specific files;
    // they are imported and spread here to keep this file maintainable.
    ...COMMITTEE_NAME_TERMS,
    // ---- Document types ----
    [
      'proposition',
      {
        sv: 'proposition', en: 'government bill', da: 'lovforslag',
        no: 'proposisjon', fi: 'hallituksen esitys', de: 'Gesetzentwurf',
        fr: 'projet de loi', es: 'proyecto de ley', nl: 'wetsvoorstel',
        ar: 'مشروع قانون', he: 'הצעת חוק', ja: '政府法案', ko: '정부 법안', zh: '政府法案',
      },
    ],
    [
      'motion',
      {
        sv: 'motion', en: 'motion', da: 'forslag', no: 'forslag',
        fi: 'aloite', de: 'Antrag', fr: 'motion', es: 'moción',
        nl: 'motie', ar: 'اقتراح', he: 'הצעה', ja: '動議', ko: '동의', zh: '动议',
      },
    ],
    [
      'betänkande',
      {
        sv: 'betänkande', en: 'committee report', da: 'udvalgsrapport',
        no: 'komitérapport', fi: 'valiokuntamietintö', de: 'Ausschussbericht',
        fr: 'rapport de comité', es: 'informe del comité', nl: 'commissierapport',
        ar: 'تقرير اللجنة', he: 'דוח ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
      },
    ],
    [
      'riksrevisionens rapport',
      {
        sv: 'riksrevisionens rapport', en: 'Swedish National Audit Office report',
        da: 'Riksrevisionens rapport', no: 'Riksrevisjonens rapport',
        fi: 'Riksrevisionin raportti', de: 'Bericht des Schwedischen Bundesrechnungshofs',
        fr: 'Rapport de la Cour des comptes suédoise',
        es: 'Informe del Tribunal de Cuentas sueco',
        nl: 'Rapport van de Zweedse Algemene Rekenkamer',
        ar: 'تقرير ديوان المراجعة السويدي',
        he: 'דוח מבקר המדינה הסוודי',
        ja: 'スウェーデン国家監査院報告', ko: '스웨덴 국가감사원 보고서', zh: '瑞典国家审计局报告',
      },
    ],
    [
      'regeringens skrivelse',
      {
        sv: 'regeringens skrivelse', en: 'government communication',
        da: 'regeringsmeddelelse', no: 'regjeringsmelding', fi: 'hallituksen kirjelmä',
        de: 'Regierungsschreiben', fr: 'communication gouvernementale',
        es: 'comunicación gubernamental', nl: 'regeringsmededeling',
        ar: 'مراسلة حكومية', he: 'מסמך ממשלתי', ja: '政府通知', ko: '정부 서한', zh: '政府通知',
      },
    ],
    [
      'regeringens proposition',
      {
        sv: 'regeringens proposition', en: 'government bill',
        da: 'regeringsforslag', no: 'regjeringens proposisjon', fi: 'hallituksen esitys',
        de: 'Regierungsgesetzentwurf', fr: 'projet de loi gouvernemental',
        es: 'proyecto de ley del gobierno', nl: 'regeringswetsvoorstel',
        ar: 'مشروع قانون حكومي', he: 'הצעת חוק ממשלתית',
        ja: '政府法案', ko: '정부 법안', zh: '政府法案',
      },
    ],
    // ---- Common Swedish parliamentary vocabulary ----
    [
      'riksdag',
      {
        sv: 'riksdag', en: 'parliament', da: 'parlament', no: 'parlament',
        fi: 'parlamentti', de: 'Parlament', fr: 'parlement', es: 'parlamento',
        nl: 'parlement', ar: 'البرلمان', he: 'פרלמנט', ja: '議会', ko: '의회', zh: '议会',
      },
    ],
    [
      'utskott',
      {
        sv: 'utskott', en: 'committee', da: 'udvalg', no: 'komité',
        fi: 'valiokunta', de: 'Ausschuss', fr: 'comité', es: 'comité',
        nl: 'commissie', ar: 'لجنة', he: 'ועדה', ja: '委員会', ko: '위원회', zh: '委员会',
      },
    ],
    [
      'debatt',
      {
        sv: 'debatt', en: 'debate', da: 'debat', no: 'debatt',
        fi: 'keskustelu', de: 'Debatte', fr: 'débat', es: 'debate',
        nl: 'debat', ar: 'نقاش', he: 'ויכוח', ja: '討論', ko: '토론', zh: '辩论',
      },
    ],
    [
      'omröstning',
      {
        sv: 'omröstning', en: 'vote', da: 'afstemning', no: 'avstemning',
        fi: 'äänestys', de: 'Abstimmung', fr: 'vote', es: 'votación',
        nl: 'stemming', ar: 'تصويت', he: 'הצבעה', ja: '採決', ko: '표결', zh: '投票',
      },
    ],
    [
      'votering',
      {
        sv: 'votering', en: 'vote', da: 'afstemning', no: 'votering',
        fi: 'äänestys', de: 'Abstimmung', fr: 'vote', es: 'votación',
        nl: 'stemming', ar: 'تصويت', he: 'הצבעה', ja: '採決', ko: '표결', zh: '投票',
      },
    ],
    [
      'ledamot',
      {
        sv: 'ledamot', en: 'member of parliament', da: 'parlamentsmedlem',
        no: 'stortingsrepresentant', fi: 'kansanedustaja',
        de: 'Parlamentsmitglied', fr: 'député', es: 'diputado',
        nl: 'parlementslid', ar: 'عضو البرلمان', he: 'חבר פרלמנט',
        ja: '議員', ko: '의원', zh: '议员',
      },
    ],
    [
      'statsminister',
      {
        sv: 'statsminister', en: 'Prime Minister', da: 'statsminister',
        no: 'statsminister', fi: 'pääministeri', de: 'Ministerpräsident',
        fr: 'Premier ministre', es: 'Primer Ministro', nl: 'Premier',
        ar: 'رئيس الوزراء', he: 'ראש הממשלה', ja: '首相', ko: '총리', zh: '首相',
      },
    ],
    [
      'minister',
      {
        sv: 'minister', en: 'minister', da: 'minister', no: 'minister',
        fi: 'ministeri', de: 'Minister', fr: 'ministre', es: 'ministro',
        nl: 'minister', ar: 'وزير', he: 'שר', ja: '大臣', ko: '장관', zh: '部长',
      },
    ],
    [
      'budget',
      {
        sv: 'budget', en: 'budget', da: 'budget', no: 'budsjett',
        fi: 'talousarvio', de: 'Haushalt', fr: 'budget', es: 'presupuesto',
        nl: 'begroting', ar: 'الميزانية', he: 'תקציב', ja: '予算', ko: '예산', zh: '预算',
      },
    ],
    [
      'skatt',
      {
        sv: 'skatt', en: 'tax', da: 'skat', no: 'skatt',
        fi: 'vero', de: 'Steuer', fr: 'impôt', es: 'impuesto',
        nl: 'belasting', ar: 'ضريبة', he: 'מס', ja: '税金', ko: '세금', zh: '税收',
      },
    ],
    [
      'lag',
      {
        sv: 'lag', en: 'law', da: 'lov', no: 'lov',
        fi: 'laki', de: 'Gesetz', fr: 'loi', es: 'ley',
        nl: 'wet', ar: 'قانون', he: 'חוק', ja: '法律', ko: '법률', zh: '法律',
      },
    ],
    [
      'förslag',
      {
        sv: 'förslag', en: 'proposal', da: 'forslag', no: 'forslag',
        fi: 'ehdotus', de: 'Vorschlag', fr: 'proposition', es: 'propuesta',
        nl: 'voorstel', ar: 'اقتراح', he: 'הצעה', ja: '提案', ko: '제안', zh: '提案',
      },
    ],
    [
      'åtgärd',
      {
        sv: 'åtgärd', en: 'measure', da: 'foranstaltning', no: 'tiltak',
        fi: 'toimenpide', de: 'Maßnahme', fr: 'mesure', es: 'medida',
        nl: 'maatregel', ar: 'إجراء', he: 'צעד', ja: '措置', ko: '조치', zh: '措施',
      },
    ],
    [
      'reform',
      {
        sv: 'reform', en: 'reform', da: 'reform', no: 'reform',
        fi: 'uudistus', de: 'Reform', fr: 'réforme', es: 'reforma',
        nl: 'hervorming', ar: 'إصلاح', he: 'רפורמה', ja: '改革', ko: '개혁', zh: '改革',
      },
    ],
    [
      'utredning',
      {
        sv: 'utredning', en: 'inquiry', da: 'undersøgelse', no: 'utredning',
        fi: 'tutkimus', de: 'Untersuchung', fr: 'enquête', es: 'investigación',
        nl: 'onderzoek', ar: 'تحقيق', he: 'חקירה', ja: '調査', ko: '조사', zh: '调查',
      },
    ],
    [
      'interpellation',
      {
        sv: 'interpellation', en: 'interpellation', da: 'interpellation',
        no: 'interpellasjon', fi: 'välikysymys', de: 'Interpellation',
        fr: 'interpellation', es: 'interpelación', nl: 'interpellatie',
        ar: 'استجواب', he: 'שאילתה', ja: '質問主意書', ko: '질의서', zh: '质询',
      },
    ],
    [
      'fråga',
      {
        sv: 'fråga', en: 'question', da: 'spørgsmål', no: 'spørsmål',
        fi: 'kysymys', de: 'Frage', fr: 'question', es: 'pregunta',
        nl: 'vraag', ar: 'سؤال', he: 'שאלה', ja: '質問', ko: '질문', zh: '问题',
      },
    ],
    [
      'remiss',
      {
        sv: 'remiss', en: 'referral', da: 'høring', no: 'høring',
        fi: 'lausuntopyyntö', de: 'Überweisung', fr: 'renvoi', es: 'remisión',
        nl: 'verwijzing', ar: 'إحالة', he: 'הפניה', ja: '審議付託', ko: '회부', zh: '移交',
      },
    ],
    [
      'beslut',
      {
        sv: 'beslut', en: 'decision', da: 'beslutning', no: 'beslutning',
        fi: 'päätös', de: 'Entscheidung', fr: 'décision', es: 'decisión',
        nl: 'besluit', ar: 'قرار', he: 'החלטה', ja: '決定', ko: '결정', zh: '决定',
      },
    ],
    [
      'val',
      {
        sv: 'val', en: 'election', da: 'valg', no: 'valg',
        fi: 'vaali', de: 'Wahl', fr: 'élection', es: 'elección',
        nl: 'verkiezing', ar: 'انتخاب', he: 'בחירות', ja: '選挙', ko: '선거', zh: '选举',
      },
    ],
    [
      'parti',
      {
        sv: 'parti', en: 'party', da: 'parti', no: 'parti',
        fi: 'puolue', de: 'Partei', fr: 'parti', es: 'partido',
        nl: 'partij', ar: 'حزب', he: 'מפלגה', ja: '党', ko: '정당', zh: '政党',
      },
    ],
    [
      'koalition',
      {
        sv: 'koalition', en: 'coalition', da: 'koalition', no: 'koalisjon',
        fi: 'koalitio', de: 'Koalition', fr: 'coalition', es: 'coalición',
        nl: 'coalitie', ar: 'ائتلاف', he: 'קואליציה', ja: '連立', ko: '연립', zh: '联盟',
      },
    ],
    [
      'opposition',
      {
        sv: 'opposition', en: 'opposition', da: 'opposition', no: 'opposisjon',
        fi: 'oppositio', de: 'Opposition', fr: 'opposition', es: 'oposición',
        nl: 'oppositie', ar: 'معارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对党',
      },
    ],
    [
      'migration',
      {
        sv: 'migration', en: 'migration', da: 'migration', no: 'migrasjon',
        fi: 'maahanmuutto', de: 'Migration', fr: 'migration', es: 'migración',
        nl: 'migratie', ar: 'هجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民',
      },
    ],
    [
      'klimat',
      {
        sv: 'klimat', en: 'climate', da: 'klima', no: 'klima',
        fi: 'ilmasto', de: 'Klima', fr: 'climat', es: 'clima',
        nl: 'klimaat', ar: 'مناخ', he: 'אקלים', ja: '気候', ko: '기후', zh: '气候',
      },
    ],
    [
      'miljö',
      {
        sv: 'miljö', en: 'environment', da: 'miljø', no: 'miljø',
        fi: 'ympäristö', de: 'Umwelt', fr: 'environnement', es: 'medio ambiente',
        nl: 'milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境',
      },
    ],
    [
      'energi',
      {
        sv: 'energi', en: 'energy', da: 'energi', no: 'energi',
        fi: 'energia', de: 'Energie', fr: 'énergie', es: 'energía',
        nl: 'energie', ar: 'طاقة', he: 'אנרגיה', ja: 'エネルギー', ko: '에너지', zh: '能源',
      },
    ],
    [
      'sjukvård',
      {
        sv: 'sjukvård', en: 'healthcare', da: 'sundhedsvæsen', no: 'helsevesen',
        fi: 'terveydenhuolto', de: 'Gesundheitsversorgung', fr: 'soins de santé',
        es: 'atención sanitaria', nl: 'gezondheidszorg', ar: 'الرعاية الصحية',
        he: 'בריאות', ja: '医療', ko: '의료', zh: '医疗',
      },
    ],
    [
      'utbildning',
      {
        sv: 'utbildning', en: 'education', da: 'uddannelse', no: 'utdanning',
        fi: 'koulutus', de: 'Bildung', fr: 'éducation', es: 'educación',
        nl: 'onderwijs', ar: 'تعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育',
      },
    ],
    [
      'rättssystem',
      {
        sv: 'rättssystem', en: 'justice system', da: 'retssystem', no: 'rettssystem',
        fi: 'oikeusjärjestelmä', de: 'Rechtssystem', fr: 'système judiciaire',
        es: 'sistema judicial', nl: 'rechtsstelsel',
        ar: 'النظام القضائي', he: 'מערכת משפט', ja: '司法制度', ko: '사법제도', zh: '司法制度',
      },
    ],
    [
      'bostäder',
      {
        sv: 'bostäder', en: 'housing', da: 'boliger', no: 'boliger',
        fi: 'asuminen', de: 'Wohnungswesen', fr: 'logement', es: 'vivienda',
        nl: 'huisvesting', ar: 'إسكان', he: 'דיור', ja: '住宅', ko: '주택', zh: '住房',
      },
    ],
    [
      'välfärd',
      {
        sv: 'välfärd', en: 'welfare', da: 'velfærd', no: 'velferd',
        fi: 'hyvinvointi', de: 'Wohlfahrt', fr: 'protection sociale',
        es: 'bienestar social', nl: 'welzijn', ar: 'رعاية اجتماعية',
        he: 'רווחה', ja: '福祉', ko: '복지', zh: '福利',
      },
    ],
    [
      'försvar',
      {
        sv: 'försvar', en: 'defence', da: 'forsvar', no: 'forsvar',
        fi: 'puolustus', de: 'Verteidigung', fr: 'défense', es: 'defensa',
        nl: 'defensie', ar: 'دفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防',
      },
    ],
    [
      'handel',
      {
        sv: 'handel', en: 'trade', da: 'handel', no: 'handel',
        fi: 'kauppa', de: 'Handel', fr: 'commerce', es: 'comercio',
        nl: 'handel', ar: 'تجارة', he: 'מסחר', ja: '貿易', ko: '무역', zh: '贸易',
      },
    ],
    ...PARTY_NAME_TERMS,
    ...POLITICAL_TERMS,
    // ---- Additional common parliamentary vocabulary ----
    [
      'riksdagsledamot',
      {
        sv: 'riksdagsledamot', en: 'member of the Riksdag', da: 'folketingsmedlem',
        no: 'stortingsrepresentant', fi: 'kansanedustaja', de: 'Reichstagsabgeordneter',
        fr: 'député du Riksdag', es: 'diputado del Riksdag', nl: 'Riksdaglid',
        ar: 'عضو البرلمان السويدي', he: 'חבר הריקסדאג',
        ja: '国会議員', ko: '국회의원', zh: '国会议员',
      },
    ],
    [
      'partigrupp',
      {
        sv: 'partigrupp', en: 'parliamentary group', da: 'partigruppe',
        no: 'partigruppe', fi: 'eduskuntaryhmä', de: 'Fraktion',
        fr: 'groupe parlementaire', es: 'grupo parlamentario', nl: 'fractie',
        ar: 'كتلة برلمانية', he: 'סיעה', ja: '会派', ko: '교섭단체', zh: '议会党团',
      },
    ],
    [
      'riksdagsgruppen',
      {
        sv: 'riksdagsgruppen', en: 'the parliamentary group', da: 'folketingsgruppen',
        no: 'stortingsgruppen', fi: 'eduskuntaryhmä', de: 'die Fraktion',
        fr: 'le groupe parlementaire', es: 'el grupo parlamentario', nl: 'de fractie',
        ar: 'الكتلة البرلمانية', he: 'הסיעה',
        ja: '会派', ko: '교섭단체', zh: '议会党团',
      },
    ],
    [
      'mandat',
      {
        sv: 'mandat', en: 'mandate', da: 'mandat', no: 'mandat',
        fi: 'mandaatti', de: 'Mandat', fr: 'mandat', es: 'mandato',
        nl: 'mandaat', ar: 'تفويض', he: 'מנדט', ja: '議席', ko: '의석', zh: '议席',
      },
    ],
    [
      'valkrets',
      {
        sv: 'valkrets', en: 'constituency', da: 'valgkreds', no: 'valgkrets',
        fi: 'vaalipiiri', de: 'Wahlkreis', fr: 'circonscription', es: 'circunscripción',
        nl: 'kiesdistrict', ar: 'دائرة انتخابية', he: 'מחוז בחירה',
        ja: '選挙区', ko: '선거구', zh: '选区',
      },
    ],
    [
      'utskottsinitiativ',
      {
        sv: 'utskottsinitiativ', en: 'committee initiative', da: 'udvalgsinitiativ',
        no: 'komitéinitiativ', fi: 'valiokunnan aloite', de: 'Ausschussinitiative',
        fr: 'initiative de comité', es: 'iniciativa del comité', nl: 'commissie-initiatief',
        ar: 'مبادرة لجنة', he: 'יוזמת ועדה',
        ja: '委員会発議', ko: '위원회 발의', zh: '委员会倡议',
      },
    ],
    [
      'lagrådet',
      {
        sv: 'lagrådet', en: 'Council on Legislation', da: 'lovrådet',
        no: 'lovrådet', fi: 'lakineuvosto', de: 'Gesetzgebungsrat',
        fr: 'Conseil législatif', es: 'Consejo Legislativo', nl: 'Raad van Wetgeving',
        ar: 'مجلس التشريع', he: 'המועצה לחקיקה',
        ja: '法律評議会', ko: '입법위원회', zh: '立法委员会',
      },
    ],
    [
      'propositionens huvudsakliga innehåll',
      {
        sv: 'propositionens huvudsakliga innehåll', en: 'main content of the bill',
        da: 'lovforslagets hovedindhold', no: 'proposisjonens hovedinnhold',
        fi: 'esityksen pääasiallinen sisältö', de: 'wesentlicher Inhalt des Gesetzentwurfs',
        fr: 'contenu principal du projet de loi', es: 'contenido principal del proyecto de ley',
        nl: 'hoofdinhoud van het wetsvoorstel', ar: 'المحتوى الرئيسي لمشروع القانون',
        he: 'התוכן העיקרי של הצעת החוק', ja: '法案の主な内容', ko: '법안의 주요 내용', zh: '法案主要内容',
      },
    ],
    [
      'skälen för regeringens bedömning',
      {
        sv: 'skälen för regeringens bedömning', en: 'reasons for the government\'s assessment',
        da: 'begrundelse for regeringens vurdering', no: 'begrunnelse for regjeringens vurdering',
        fi: 'hallituksen arvion perustelut', de: 'Gründe für die Bewertung der Regierung',
        fr: 'motifs de l\'évaluation du gouvernement', es: 'razones de la evaluación del gobierno',
        nl: 'redenen voor de beoordeling van de regering', ar: 'أسباب تقييم الحكومة',
        he: 'נימוקי הערכת הממשלה', ja: '政府の評価理由', ko: '정부 평가의 근거', zh: '政府评估理由',
      },
    ],
    [
      'ikraftträdande',
      {
        sv: 'ikraftträdande', en: 'entry into force', da: 'ikrafttræden',
        no: 'ikrafttredelse', fi: 'voimaantulo', de: 'Inkrafttreten',
        fr: 'entrée en vigueur', es: 'entrada en vigor', nl: 'inwerkingtreding',
        ar: 'دخول حيز التنفيذ', he: 'כניסה לתוקף',
        ja: '施行', ko: '시행', zh: '生效',
      },
    ],
    [
      'övergångsbestämmelser',
      {
        sv: 'övergångsbestämmelser', en: 'transitional provisions',
        da: 'overgangsbestemmelser', no: 'overgangsbestemmelser',
        fi: 'siirtymäsäännökset', de: 'Übergangsbestimmungen',
        fr: 'dispositions transitoires', es: 'disposiciones transitorias',
        nl: 'overgangsbepalingen', ar: 'أحكام انتقالية', he: 'הוראות מעבר',
        ja: '経過措置', ko: '경과조치', zh: '过渡条款',
      },
    ],
    [
      'riksdagsförvaltningen',
      {
        sv: 'riksdagsförvaltningen', en: 'Riksdag Administration', da: 'riksdagsforvaltningen',
        no: 'stortingsadministrasjonen', fi: 'eduskunnan hallinto',
        de: 'Riksdag-Verwaltung', fr: 'administration du Riksdag',
        es: 'administración del Riksdag', nl: 'Riksdag-administratie',
        ar: 'إدارة البرلمان', he: 'מנהלת הריקסדאג',
        ja: '国会事務局', ko: '국회사무처', zh: '国会管理局',
      },
    ],
    [
      'riksdagens protokoll',
      {
        sv: 'riksdagens protokoll', en: 'Riksdag minutes', da: 'Riksdags protokol',
        no: 'Stortingets protokoll', fi: 'eduskunnan pöytäkirja',
        de: 'Riksdag-Protokoll', fr: 'procès-verbal du Riksdag',
        es: 'acta del Riksdag', nl: 'Riksdag-notulen',
        ar: 'محضر البرلمان', he: 'פרוטוקול הריקסדאג',
        ja: '国会議事録', ko: '국회 의사록', zh: '国会记录',
      },
    ],
    [
      'författningssamling',
      {
        sv: 'författningssamling', en: 'statute book', da: 'lovsamling', no: 'lovsamling',
        fi: 'säädöskokoelma', de: 'Gesetzessammlung', fr: 'recueil des lois',
        es: 'colección de leyes', nl: 'wetboek',
        ar: 'مجموعة القوانين', he: 'קובץ חוקים', ja: '法令集', ko: '법령집', zh: '法规汇编',
      },
    ],
    [
      'offentlig utredning',
      {
        sv: 'offentlig utredning', en: 'government inquiry', da: 'offentlig udredning',
        no: 'offentlig utredning', fi: 'julkinen selvitys', de: 'öffentliche Untersuchung',
        fr: 'enquête publique', es: 'investigación pública', nl: 'openbaar onderzoek',
        ar: 'تحقيق حكومي', he: 'חקירה ממשלתית',
        ja: '政府調査', ko: '정부조사', zh: '政府调查',
      },
    ],
    [
      'lagutskottet',
      {
        sv: 'lagutskottet', en: 'Committee on Civil Law', da: 'Lovudvalget',
        no: 'Lovkomiteen', fi: 'Lakivaliokunta', de: 'Gesetzgebungsausschuss',
        fr: 'Comité législatif', es: 'Comité Legislativo', nl: 'Wetgevingscommissie',
        ar: 'لجنة التشريع', he: 'ועדת החקיקה',
        ja: '法律委員会', ko: '법률위원회', zh: '立法委员会',
      },
    ],
    [
      'talmannen',
      {
        sv: 'talmannen', en: 'the Speaker', da: 'formanden', no: 'presidenten',
        fi: 'puhemies', de: 'der Parlamentspräsident', fr: 'le Président du Parlement',
        es: 'el Presidente del Parlamento', nl: 'de Parlementsvoorzitter',
        ar: 'رئيس البرلمان', he: 'יושב ראש הפרלמנט',
        ja: '議長', ko: '의장', zh: '议长',
      },
    ],
    [
      'utskottsbetänkande',
      {
        sv: 'utskottsbetänkande', en: 'committee report', da: 'udvalgsbetænkning',
        no: 'komitéinnstilling', fi: 'valiokuntamietintö', de: 'Ausschussbericht',
        fr: 'rapport de commission', es: 'informe del comité', nl: 'commissierapport',
        ar: 'تقرير اللجنة', he: 'דוח ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告',
      },
    ],
    [
      'voteringsresultat',
      {
        sv: 'voteringsresultat', en: 'voting result', da: 'afstemningsresultat',
        no: 'voteringsresultat', fi: 'äänestystulos', de: 'Abstimmungsergebnis',
        fr: 'résultat du vote', es: 'resultado de la votación', nl: 'stemresultaat',
        ar: 'نتيجة التصويت', he: 'תוצאת הצבעה',
        ja: '投票結果', ko: '투표 결과', zh: '投票结果',
      },
    ],
    [
      'närvarolista',
      {
        sv: 'närvarolista', en: 'attendance list', da: 'tilstedeværelsesliste',
        no: 'nærværsliste', fi: 'läsnäololista', de: 'Anwesenheitsliste',
        fr: 'liste de présence', es: 'lista de asistencia', nl: 'presentielijst',
        ar: 'قائمة الحضور', he: 'רשימת נוכחות',
        ja: '出席者名簿', ko: '출석부', zh: '出席名单',
      },
    ],
    [
      'konstitutionell',
      {
        sv: 'konstitutionell', en: 'constitutional', da: 'forfatningsmæssig',
        no: 'konstitusjonell', fi: 'perustuslaillinen', de: 'verfassungsmäßig',
        fr: 'constitutionnel', es: 'constitucional', nl: 'grondwettelijk',
        ar: 'دستوري', he: 'חוקתי', ja: '憲法上の', ko: '헌법적', zh: '宪法的',
      },
    ],
    [
      'folkrätt',
      {
        sv: 'folkrätt', en: 'international law', da: 'folkeret', no: 'folkerett',
        fi: 'kansainvälinen oikeus', de: 'Völkerrecht', fr: 'droit international',
        es: 'derecho internacional', nl: 'internationaal recht',
        ar: 'القانون الدولي', he: 'משפט בינלאומי',
        ja: '国際法', ko: '국제법', zh: '国际法',
      },
    ],
    [
      'skattepolitik',
      {
        sv: 'skattepolitik', en: 'tax policy', da: 'skattepolitik',
        no: 'skattepolitikk', fi: 'veropolitiikka', de: 'Steuerpolitik',
        fr: 'politique fiscale', es: 'política fiscal', nl: 'belastingbeleid',
        ar: 'سياسة ضريبية', he: 'מדיניות מס',
        ja: '税制政策', ko: '조세정책', zh: '税收政策',
      },
    ],
    [
      'näringspolitik',
      {
        sv: 'näringspolitik', en: 'enterprise policy', da: 'erhvervspolitik',
        no: 'næringspolitikk', fi: 'elinkeinopolitiikka', de: 'Wirtschaftspolitik',
        fr: 'politique d\'entreprise', es: 'política empresarial', nl: 'ondernemingsbeleid',
        ar: 'سياسة الأعمال', he: 'מדיניות כלכלית',
        ja: '産業政策', ko: '산업정책', zh: '产业政策',
      },
    ],
    [
      'miljöpolitik',
      {
        sv: 'miljöpolitik', en: 'environmental policy', da: 'miljøpolitik',
        no: 'miljøpolitikk', fi: 'ympäristöpolitiikka', de: 'Umweltpolitik',
        fr: 'politique environnementale', es: 'política ambiental', nl: 'milieubeleid',
        ar: 'سياسة بيئية', he: 'מדיניות סביבתית',
        ja: '環境政策', ko: '환경정책', zh: '环境政策',
      },
    ],
    [
      'hälso- och sjukvård',
      {
        sv: 'hälso- och sjukvård', en: 'health and medical care', da: 'sundheds- og sygehusvæsen',
        no: 'helse- og omsorgstjenester', fi: 'terveydenhuolto', de: 'Gesundheits- und Krankenpflege',
        fr: 'soins de santé', es: 'atención sanitaria', nl: 'gezondheidszorg',
        ar: 'الرعاية الصحية', he: 'שירותי בריאות',
        ja: '保健医療', ko: '보건의료', zh: '卫生保健',
      },
    ],
    [
      'kriminalpolitik',
      {
        sv: 'kriminalpolitik', en: 'criminal policy', da: 'kriminalpolitik',
        no: 'kriminalpolitikk', fi: 'kriminaalipolitiikka', de: 'Kriminalpolitik',
        fr: 'politique pénale', es: 'política criminal', nl: 'strafbeleid',
        ar: 'سياسة جنائية', he: 'מדיניות פלילית',
        ja: '刑事政策', ko: '형사정책', zh: '刑事政策',
      },
    ],
    [
      'bostadspolitik',
      {
        sv: 'bostadspolitik', en: 'housing policy', da: 'boligpolitik',
        no: 'boligpolitikk', fi: 'asuntopolitiikka', de: 'Wohnungspolitik',
        fr: 'politique du logement', es: 'política de vivienda', nl: 'woonbeleid',
        ar: 'سياسة الإسكان', he: 'מדיניות דיור',
        ja: '住宅政策', ko: '주택정책', zh: '住房政策',
      },
    ],
    [
      'familjepolitik',
      {
        sv: 'familjepolitik', en: 'family policy', da: 'familiepolitik',
        no: 'familiepolitikk', fi: 'perhepolitiikka', de: 'Familienpolitik',
        fr: 'politique familiale', es: 'política familiar', nl: 'gezinsbeleid',
        ar: 'سياسة الأسرة', he: 'מדיניות משפחה',
        ja: '家族政策', ko: '가족정책', zh: '家庭政策',
      },
    ],
    [
      'utbildningspolitik',
      {
        sv: 'utbildningspolitik', en: 'education policy', da: 'uddannelsespolitik',
        no: 'utdanningspolitikk', fi: 'koulutuspolitiikka', de: 'Bildungspolitik',
        fr: 'politique éducative', es: 'política educativa', nl: 'onderwijsbeleid',
        ar: 'سياسة التعليم', he: 'מדיניות חינוך',
        ja: '教育政策', ko: '교육정책', zh: '教育政策',
      },
    ],
    [
      'energipolitik',
      {
        sv: 'energipolitik', en: 'energy policy', da: 'energipolitik',
        no: 'energipolitikk', fi: 'energiapolitiikka', de: 'Energiepolitik',
        fr: 'politique énergétique', es: 'política energética', nl: 'energiebeleid',
        ar: 'سياسة الطاقة', he: 'מדיניות אנרגיה',
        ja: 'エネルギー政策', ko: '에너지정책', zh: '能源政策',
      },
    ],
    [
      'försvarspolitik',
      {
        sv: 'försvarspolitik', en: 'defence policy', da: 'forsvarspolitik',
        no: 'forsvarspolitikk', fi: 'puolustuspolitiikka', de: 'Verteidigungspolitik',
        fr: 'politique de défense', es: 'política de defensa', nl: 'defensiebeleid',
        ar: 'سياسة الدفاع', he: 'מדיניות ביטחון',
        ja: '防衛政策', ko: '국방정책', zh: '国防政策',
      },
    ],
    [
      'migrationspolitik',
      {
        sv: 'migrationspolitik', en: 'migration policy', da: 'migrationspolitik',
        no: 'migrasjonspolitikk', fi: 'maahanmuuttopolitiikka', de: 'Migrationspolitik',
        fr: 'politique migratoire', es: 'política migratoria', nl: 'migratiebeleid',
        ar: 'سياسة الهجرة', he: 'מדיניות הגירה',
        ja: '移民政策', ko: '이민정책', zh: '移民政策',
      },
    ],
    [
      'klimatpolitik',
      {
        sv: 'klimatpolitik', en: 'climate policy', da: 'klimapolitik',
        no: 'klimapolitikk', fi: 'ilmastopolitiikka', de: 'Klimapolitik',
        fr: 'politique climatique', es: 'política climática', nl: 'klimaatbeleid',
        ar: 'سياسة مناخية', he: 'מדיניות אקלים',
        ja: '気候政策', ko: '기후정책', zh: '气候政策',
      },
    ],
    [
      'handelspolitik',
      {
        sv: 'handelspolitik', en: 'trade policy', da: 'handelspolitik',
        no: 'handelspolitikk', fi: 'kauppapolitiikka', de: 'Handelspolitik',
        fr: 'politique commerciale', es: 'política comercial', nl: 'handelsbeleid',
        ar: 'سياسة تجارية', he: 'מדיניות מסחר',
        ja: '通商政策', ko: '통상정책', zh: '贸易政策',
      },
    ],
    [
      'jordbrukspolitik',
      {
        sv: 'jordbrukspolitik', en: 'agricultural policy', da: 'landbrugspolitik',
        no: 'landbrukspolitikk', fi: 'maatalouspolitiikka', de: 'Agrarpolitik',
        fr: 'politique agricole', es: 'política agrícola', nl: 'landbouwbeleid',
        ar: 'سياسة زراعية', he: 'מדיניות חקלאית',
        ja: '農業政策', ko: '농업정책', zh: '农业政策',
      },
    ],
    [
      'transportpolitik',
      {
        sv: 'transportpolitik', en: 'transport policy', da: 'transportpolitik',
        no: 'transportpolitikk', fi: 'liikennepolitiikka', de: 'Verkehrspolitik',
        fr: 'politique des transports', es: 'política de transporte', nl: 'vervoerbeleid',
        ar: 'سياسة النقل', he: 'מדיניות תחבורה',
        ja: '交通政策', ko: '교통정책', zh: '交通政策',
      },
    ],
    [
      'digitalisering',
      {
        sv: 'digitalisering', en: 'digitalisation', da: 'digitalisering',
        no: 'digitalisering', fi: 'digitalisaatio', de: 'Digitalisierung',
        fr: 'numérisation', es: 'digitalización', nl: 'digitalisering',
        ar: 'رقمنة', he: 'דיגיטליזציה', ja: 'デジタル化', ko: '디지털화', zh: '数字化',
      },
    ],
    [
      'brottslighet',
      {
        sv: 'brottslighet', en: 'crime', da: 'kriminalitet', no: 'kriminalitet',
        fi: 'rikollisuus', de: 'Kriminalität', fr: 'criminalité', es: 'delincuencia',
        nl: 'criminaliteit', ar: 'جريمة', he: 'פשיעה', ja: '犯罪', ko: '범죄', zh: '犯罪',
      },
    ],
    [
      'samhälle',
      {
        sv: 'samhälle', en: 'society', da: 'samfund', no: 'samfunn',
        fi: 'yhteiskunta', de: 'Gesellschaft', fr: 'société', es: 'sociedad',
        nl: 'samenleving', ar: 'مجتمع', he: 'חברה', ja: '社会', ko: '사회', zh: '社会',
      },
    ],
    [
      'medborgare',
      {
        sv: 'medborgare', en: 'citizen', da: 'borger', no: 'borger',
        fi: 'kansalainen', de: 'Bürger', fr: 'citoyen', es: 'ciudadano',
        nl: 'burger', ar: 'مواطن', he: 'אזרח', ja: '市民', ko: '시민', zh: '公民',
      },
    ],
    [
      'demokrati',
      {
        sv: 'demokrati', en: 'democracy', da: 'demokrati', no: 'demokrati',
        fi: 'demokratia', de: 'Demokratie', fr: 'démocratie', es: 'democracia',
        nl: 'democratie', ar: 'ديمقراطية', he: 'דמוקרטיה', ja: '民主主義', ko: '민주주의', zh: '民主',
      },
    ],
    [
      'tillväxt',
      {
        sv: 'tillväxt', en: 'growth', da: 'vækst', no: 'vekst',
        fi: 'kasvu', de: 'Wachstum', fr: 'croissance', es: 'crecimiento',
        nl: 'groei', ar: 'نمو', he: 'צמיחה', ja: '成長', ko: '성장', zh: '增长',
      },
    ],
    [
      'sysselsättning',
      {
        sv: 'sysselsättning', en: 'employment', da: 'beskæftigelse', no: 'sysselsetting',
        fi: 'työllisyys', de: 'Beschäftigung', fr: 'emploi', es: 'empleo',
        nl: 'werkgelegenheid', ar: 'توظيف', he: 'תעסוקה', ja: '雇用', ko: '고용', zh: '就业',
      },
    ],
    [
      'arbetslöshet',
      {
        sv: 'arbetslöshet', en: 'unemployment', da: 'arbejdsløshed', no: 'arbeidsledighet',
        fi: 'työttömyys', de: 'Arbeitslosigkeit', fr: 'chômage', es: 'desempleo',
        nl: 'werkloosheid', ar: 'بطالة', he: 'אבטלה', ja: '失業', ko: '실업', zh: '失业',
      },
    ],
    [
      'inflation',
      {
        sv: 'inflation', en: 'inflation', da: 'inflation', no: 'inflasjon',
        fi: 'inflaatio', de: 'Inflation', fr: 'inflation', es: 'inflación',
        nl: 'inflatie', ar: 'تضخم', he: 'אינפלציה', ja: 'インフレ', ko: '인플레이션', zh: '通货膨胀',
      },
    ],
    [
      'ränta',
      {
        sv: 'ränta', en: 'interest rate', da: 'rente', no: 'rente',
        fi: 'korko', de: 'Zinssatz', fr: 'taux d\'intérêt', es: 'tipo de interés',
        nl: 'rentetarief', ar: 'سعر الفائدة', he: 'ריבית',
        ja: '金利', ko: '금리', zh: '利率',
      },
    ],
    [
      'statsskuld',
      {
        sv: 'statsskuld', en: 'national debt', da: 'statsgæld', no: 'statsgjeld',
        fi: 'valtionvelka', de: 'Staatsschuld', fr: 'dette publique', es: 'deuda pública',
        nl: 'staatsschuld', ar: 'دين عام', he: 'חוב לאומי',
        ja: '国債', ko: '국가부채', zh: '国债',
      },
    ],
    [
      'bruttonationalprodukt',
      {
        sv: 'bruttonationalprodukt', en: 'gross domestic product', da: 'bruttonationalprodukt',
        no: 'bruttonasjonalprodukt', fi: 'bruttokansantuote', de: 'Bruttoinlandsprodukt',
        fr: 'produit intérieur brut', es: 'producto interior bruto', nl: 'bruto binnenlands product',
        ar: 'الناتج المحلي الإجمالي', he: 'תוצר מקומי גולמי',
        ja: '国内総生産', ko: '국내총생산', zh: '国内生产总值',
      },
    ],
    [
      'offentliga finanser',
      {
        sv: 'offentliga finanser', en: 'public finances', da: 'offentlige finanser',
        no: 'offentlige finanser', fi: 'julkinen talous', de: 'öffentliche Finanzen',
        fr: 'finances publiques', es: 'finanzas públicas', nl: 'overheidsfinanciën',
        ar: 'المالية العامة', he: 'כספי ציבור',
        ja: '公共財政', ko: '공공재정', zh: '公共财政',
      },
    ],
    // ---- Swedish government document types ----
    [
      'statens offentliga utredningar',
      {
        sv: 'statens offentliga utredningar', en: 'Swedish Government Official Reports',
        da: 'statens offentlige udredninger', no: 'statens offentlige utredninger',
        fi: 'valtion viralliset selvitykset', de: 'Amtliche Untersuchungsberichte',
        fr: 'rapports officiels du gouvernement', es: 'informes oficiales del gobierno',
        nl: 'officiële overheidsrapporten', ar: 'تقارير حكومية رسمية', he: 'דוחות חקירה ממשלתיים',
        ja: '政府公式調査報告', ko: '정부 공식 조사보고서', zh: '政府官方调查报告',
      },
    ],
    [
      'departementsserien',
      {
        sv: 'departementsserien', en: 'Ministry Publications Series',
        da: 'departementserien', no: 'departementserien', fi: 'ministeriöjulkaisusarja',
        de: 'Ministeriumsschriftenreihe', fr: 'série ministérielle',
        es: 'serie ministerial', nl: 'ministeriële reeks',
        ar: 'سلسلة المنشورات الوزارية', he: 'סדרת פרסומי המשרד',
        ja: '省庁刊行物シリーズ', ko: '부처 간행물 시리즈', zh: '部委刊物系列',
      },
    ],
    [
      'kommittédirektiv',
      {
        sv: 'kommittédirektiv', en: 'committee directive', da: 'kommissionsdirektiv',
        no: 'komitédirektiv', fi: 'komiteadirektiivi', de: 'Ausschussrichtlinie',
        fr: 'directive de comité', es: 'directiva del comité', nl: 'commissie-instructie',
        ar: 'توجيه لجنة', he: 'הנחיית ועדה', ja: '委員会指令', ko: '위원회 지시', zh: '委员会指令',
      },
    ],
    [
      'svensk författningssamling',
      {
        sv: 'Svensk författningssamling', en: 'Swedish Code of Statutes',
        da: 'Svensk forfatningssamling', no: 'Svensk lovsamling', fi: 'Ruotsin säädöskokoelma',
        de: 'Schwedische Gesetzessammlung', fr: 'Code des lois suédois',
        es: 'Código de Leyes sueco', nl: 'Zweedse wetboek',
        ar: 'مجموعة القوانين السويدية', he: 'קובץ החוקים השבדי',
        ja: 'スウェーデン法令集', ko: '스웨덴 법령집', zh: '瑞典法规汇编',
      },
    ],
    // ---- Legislative process verbs/actions ----
    [
      'yrka',
      {
        sv: 'yrka', en: 'to move', da: 'at foreslå', no: 'å foreslå',
        fi: 'vaatia', de: 'beantragen', fr: 'proposer', es: 'proponer',
        nl: 'verzoeken', ar: 'يقترح', he: 'להציע', ja: '動議する', ko: '발의하다', zh: '提议',
      },
    ],
    [
      'avstyrka',
      {
        sv: 'avstyrka', en: 'to recommend rejection', da: 'at fraråde',
        no: 'å fraråde', fi: 'suositella hylkäämistä', de: 'ablehnen empfehlen',
        fr: 'recommander le rejet', es: 'recomendar el rechazo', nl: 'afwijzing aanbevelen',
        ar: 'يوصي بالرفض', he: 'להמליץ על דחייה',
        ja: '否決を勧告する', ko: '기각을 권고하다', zh: '建议否决',
      },
    ],
    [
      'tillstyrka',
      {
        sv: 'tillstyrka', en: 'to recommend approval', da: 'at anbefale',
        no: 'å tilråde', fi: 'suositella hyväksymistä', de: 'Zustimmung empfehlen',
        fr: 'recommander l\'approbation', es: 'recomendar la aprobación',
        nl: 'goedkeuring aanbevelen', ar: 'يوصي بالموافقة', he: 'להמליץ על אישור',
        ja: '承認を勧告する', ko: '승인을 권고하다', zh: '建议批准',
      },
    ],
    [
      'bifalla',
      {
        sv: 'bifalla', en: 'to approve', da: 'at bifalde', no: 'å bifalle',
        fi: 'hyväksyä', de: 'genehmigen', fr: 'approuver', es: 'aprobar',
        nl: 'goedkeuren', ar: 'يوافق', he: 'לאשר', ja: '承認する', ko: '승인하다', zh: '批准',
      },
    ],
    [
      'avslå',
      {
        sv: 'avslå', en: 'to reject', da: 'at afslå', no: 'å avslå',
        fi: 'hylätä', de: 'ablehnen', fr: 'rejeter', es: 'rechazar',
        nl: 'afwijzen', ar: 'يرفض', he: 'לדחות', ja: '否決する', ko: '기각하다', zh: '否决',
      },
    ],
    [
      'bordlägga',
      {
        sv: 'bordlägga', en: 'to table', da: 'at bordlægge', no: 'å utsette',
        fi: 'jättää pöydälle', de: 'vertagen', fr: 'ajourner', es: 'aplazar',
        nl: 'verdagen', ar: 'يؤجل', he: 'לדחות', ja: '延期する', ko: '보류하다', zh: '搁置',
      },
    ],
    [
      'hänvisa',
      {
        sv: 'hänvisa', en: 'to refer', da: 'at henvise', no: 'å vise til',
        fi: 'viitata', de: 'verweisen', fr: 'renvoyer', es: 'remitir',
        nl: 'verwijzen', ar: 'يحيل', he: 'להפנות', ja: '付託する', ko: '회부하다', zh: '移交',
      },
    ],
    [
      'utfärda',
      {
        sv: 'utfärda', en: 'to issue', da: 'at udstede', no: 'å utstede',
        fi: 'antaa', de: 'erlassen', fr: 'émettre', es: 'emitir',
        nl: 'uitvaardigen', ar: 'يصدر', he: 'להוציא', ja: '発布する', ko: '발행하다', zh: '颁布',
      },
    ],
    [
      'föreslå',
      {
        sv: 'föreslå', en: 'to propose', da: 'at foreslå', no: 'å foreslå',
        fi: 'ehdottaa', de: 'vorschlagen', fr: 'proposer', es: 'proponer',
        nl: 'voorstellen', ar: 'يقترح', he: 'להציע', ja: '提案する', ko: '제안하다', zh: '提议',
      },
    ],
    [
      'genomföra',
      {
        sv: 'genomföra', en: 'to implement', da: 'at gennemføre', no: 'å gjennomføre',
        fi: 'toteuttaa', de: 'umsetzen', fr: 'mettre en œuvre', es: 'implementar',
        nl: 'implementeren', ar: 'ينفذ', he: 'ליישם', ja: '実施する', ko: '시행하다', zh: '实施',
      },
    ],
    [
      'utreda',
      {
        sv: 'utreda', en: 'to investigate', da: 'at udrede', no: 'å utrede',
        fi: 'selvittää', de: 'untersuchen', fr: 'enquêter', es: 'investigar',
        nl: 'onderzoeken', ar: 'يحقق', he: 'לחקור', ja: '調査する', ko: '조사하다', zh: '调查',
      },
    ],
    [
      'granska',
      {
        sv: 'granska', en: 'to scrutinise', da: 'at granske', no: 'å granske',
        fi: 'tarkastaa', de: 'prüfen', fr: 'examiner', es: 'examinar',
        nl: 'toetsen', ar: 'يفحص', he: 'לבדוק', ja: '精査する', ko: '심사하다', zh: '审查',
      },
    ],
    [
      'verkställa',
      {
        sv: 'verkställa', en: 'to execute', da: 'at eksekvere', no: 'å iverksette',
        fi: 'panna täytäntöön', de: 'vollstrecken', fr: 'exécuter', es: 'ejecutar',
        nl: 'uitvoeren', ar: 'ينفذ', he: 'לבצע', ja: '執行する', ko: '집행하다', zh: '执行',
      },
    ],
    // ---- Key political/societal concepts ----
    [
      'rättsstat',
      {
        sv: 'rättsstat', en: 'rule of law', da: 'retsstat', no: 'rettsstat',
        fi: 'oikeusvaltio', de: 'Rechtsstaat', fr: 'état de droit', es: 'estado de derecho',
        nl: 'rechtsstaat', ar: 'دولة القانون', he: 'שלטון החוק',
        ja: '法の支配', ko: '법치국가', zh: '法治国家',
      },
    ],
    [
      'mänskliga rättigheter',
      {
        sv: 'mänskliga rättigheter', en: 'human rights', da: 'menneskerettigheder',
        no: 'menneskerettigheter', fi: 'ihmisoikeudet', de: 'Menschenrechte',
        fr: 'droits de l\'homme', es: 'derechos humanos', nl: 'mensenrechten',
        ar: 'حقوق الإنسان', he: 'זכויות אדם', ja: '人権', ko: '인권', zh: '人权',
      },
    ],
    [
      'diskriminering',
      {
        sv: 'diskriminering', en: 'discrimination', da: 'diskrimination',
        no: 'diskriminering', fi: 'syrjintä', de: 'Diskriminierung',
        fr: 'discrimination', es: 'discriminación', nl: 'discriminatie',
        ar: 'تمييز', he: 'אפליה', ja: '差別', ko: '차별', zh: '歧视',
      },
    ],
    [
      'korruption',
      {
        sv: 'korruption', en: 'corruption', da: 'korruption', no: 'korrupsjon',
        fi: 'korruptio', de: 'Korruption', fr: 'corruption', es: 'corrupción',
        nl: 'corruptie', ar: 'فساد', he: 'שחיתות', ja: '汚職', ko: '부패', zh: '腐败',
      },
    ],
    [
      'transparens',
      {
        sv: 'transparens', en: 'transparency', da: 'gennemsigtighed', no: 'transparens',
        fi: 'läpinäkyvyys', de: 'Transparenz', fr: 'transparence', es: 'transparencia',
        nl: 'transparantie', ar: 'شفافية', he: 'שקיפות', ja: '透明性', ko: '투명성', zh: '透明度',
      },
    ],
    [
      'ansvarsutkrävande',
      {
        sv: 'ansvarsutkrävande', en: 'accountability', da: 'ansvarlighed',
        no: 'ansvarliggjøring', fi: 'vastuuvelvollisuus', de: 'Rechenschaftspflicht',
        fr: 'responsabilité', es: 'rendición de cuentas', nl: 'verantwoording',
        ar: 'مساءلة', he: 'אחריותיות', ja: '説明責任', ko: '책임성', zh: '问责制',
      },
    ],
    [
      'subsidiaritet',
      {
        sv: 'subsidiaritet', en: 'subsidiarity', da: 'subsidiaritet',
        no: 'subsidiaritet', fi: 'toissijaisuus', de: 'Subsidiarität',
        fr: 'subsidiarité', es: 'subsidiariedad', nl: 'subsidiariteit',
        ar: 'تبعية', he: 'סובסידיאריות', ja: '補完性', ko: '보충성', zh: '辅助性',
      },
    ],
    [
      'proportionalitet',
      {
        sv: 'proportionalitet', en: 'proportionality', da: 'proportionalitet',
        no: 'proporsjonalitet', fi: 'suhteellisuus', de: 'Verhältnismäßigkeit',
        fr: 'proportionnalité', es: 'proporcionalidad', nl: 'evenredigheid',
        ar: 'تناسب', he: 'מידתיות', ja: '比例性', ko: '비례성', zh: '比例性',
      },
    ],
    [
      'konsekvensanalys',
      {
        sv: 'konsekvensanalys', en: 'impact assessment', da: 'konsekvensanalyse',
        no: 'konsekvensanalyse', fi: 'vaikutusarviointi', de: 'Folgenabschätzung',
        fr: 'analyse d\'impact', es: 'evaluación de impacto', nl: 'effectbeoordeling',
        ar: 'تقييم الأثر', he: 'הערכת השפעה', ja: '影響評価', ko: '영향 평가', zh: '影响评估',
      },
    ],
    [
      'samråd',
      {
        sv: 'samråd', en: 'consultation', da: 'høring', no: 'høring',
        fi: 'kuuleminen', de: 'Konsultation', fr: 'consultation', es: 'consulta',
        nl: 'raadpleging', ar: 'استشارة', he: 'התייעצות', ja: '協議', ko: '협의', zh: '协商',
      },
    ],
    [
      'remissvar',
      {
        sv: 'remissvar', en: 'consultation response', da: 'høringssvar',
        no: 'høringssvar', fi: 'lausunto', de: 'Stellungnahme',
        fr: 'réponse à la consultation', es: 'respuesta a la consulta',
        nl: 'reactie op raadpleging', ar: 'رد على الاستشارة', he: 'תגובה להתייעצות',
        ja: '諮問回答', ko: '자문 답변', zh: '咨询回复',
      },
    ],
    [
      'remissinstans',
      {
        sv: 'remissinstans', en: 'consultative body', da: 'høringsinstans',
        no: 'høringsinstans', fi: 'lausunnonantaja', de: 'Anhörungsstelle',
        fr: 'organisme consultatif', es: 'organismo consultivo', nl: 'adviesorgaan',
        ar: 'هيئة استشارية', he: 'גוף מייעץ',
        ja: '諮問機関', ko: '자문기관', zh: '咨询机构',
      },
    ],
    // ---- Welfare and social terms ----
    [
      'barnbidrag',
      {
        sv: 'barnbidrag', en: 'child allowance', da: 'børnebidrag', no: 'barnetrygd',
        fi: 'lapsilisä', de: 'Kindergeld', fr: 'allocation familiale',
        es: 'prestación por hijo', nl: 'kinderbijslag',
        ar: 'بدل أطفال', he: 'קצבת ילדים', ja: '児童手当', ko: '아동수당', zh: '儿童补贴',
      },
    ],
    [
      'föräldraförsäkring',
      {
        sv: 'föräldraförsäkring', en: 'parental insurance', da: 'forældreforsikring',
        no: 'foreldreforsikring', fi: 'vanhempainvakuutus', de: 'Elternversicherung',
        fr: 'assurance parentale', es: 'seguro parental', nl: 'ouderschapsverzekering',
        ar: 'تأمين الوالدين', he: 'ביטוח הורים',
        ja: '育児保険', ko: '육아보험', zh: '育儿保险',
      },
    ],
    [
      'sjukförsäkring',
      {
        sv: 'sjukförsäkring', en: 'sickness insurance', da: 'sygesikring',
        no: 'sykeforsikring', fi: 'sairausvakuutus', de: 'Krankenversicherung',
        fr: 'assurance maladie', es: 'seguro de enfermedad', nl: 'ziekteverzekering',
        ar: 'تأمين المرض', he: 'ביטוח מחלה',
        ja: '疾病保険', ko: '질병보험', zh: '疾病保险',
      },
    ],
    [
      'arbetsskadeförsäkring',
      {
        sv: 'arbetsskadeförsäkring', en: 'work injury insurance', da: 'arbejdsskadeforsikring',
        no: 'yrkesskadeforskring', fi: 'työtapaturmavakuutus', de: 'Arbeitsunfallversicherung',
        fr: 'assurance accident du travail', es: 'seguro de accidentes laborales',
        nl: 'arbeidsongevallenverzekering', ar: 'تأمين إصابات العمل', he: 'ביטוח תאונות עבודה',
        ja: '労災保険', ko: '산재보험', zh: '工伤保险',
      },
    ],
    [
      'äldreomsorgen',
      {
        sv: 'äldreomsorgen', en: 'elderly care', da: 'ældreplejen', no: 'eldreomsorgen',
        fi: 'vanhustenhoito', de: 'Altenpflege', fr: 'soins aux personnes âgées',
        es: 'atención a personas mayores', nl: 'ouderenzorg',
        ar: 'رعاية المسنين', he: 'טיפול בקשישים',
        ja: '高齢者介護', ko: '노인돌봄', zh: '养老护理',
      },
    ],
    [
      'funktionshinder',
      {
        sv: 'funktionshinder', en: 'disability', da: 'handicap', no: 'funksjonshemming',
        fi: 'vammaisuus', de: 'Behinderung', fr: 'handicap', es: 'discapacidad',
        nl: 'handicap', ar: 'إعاقة', he: 'מוגבלות', ja: '障害', ko: '장애', zh: '残疾',
      },
    ],
    // ---- Defence and security terms ----
    [
      'försvarsmakten',
      {
        sv: 'Försvarsmakten', en: 'Swedish Armed Forces', da: 'Forsvaret',
        no: 'Forsvaret', fi: 'Ruotsin puolustusvoimat', de: 'Schwedische Streitkräfte',
        fr: 'Forces armées suédoises', es: 'Fuerzas Armadas suecas',
        nl: 'Zweedse Strijdkrachten', ar: 'القوات المسلحة السويدية', he: 'צבא שבדיה',
        ja: 'スウェーデン国防軍', ko: '스웨덴 국방군', zh: '瑞典武装力量',
      },
    ],
    [
      'säkerhetspolisen',
      {
        sv: 'Säkerhetspolisen', en: 'Swedish Security Service', da: 'Säkerhetspolisen',
        no: 'Sikkerhetspolitiet', fi: 'Ruotsin turvallisuuspoliisi', de: 'Schwedischer Sicherheitsdienst',
        fr: 'Service de sécurité suédois', es: 'Servicio de Seguridad sueco',
        nl: 'Zweedse Veiligheidsdienst', ar: 'جهاز الأمن السويدي', he: 'שירות הביטחון השבדי',
        ja: 'スウェーデン安全保障警察', ko: '스웨덴 안보경찰', zh: '瑞典安全警察',
      },
    ],
    [
      'totalförsvar',
      {
        sv: 'totalförsvar', en: 'total defence', da: 'totalforsvar', no: 'totalforsvar',
        fi: 'kokonaismaanpuolustus', de: 'Gesamtverteidigung', fr: 'défense totale',
        es: 'defensa total', nl: 'totale verdediging',
        ar: 'الدفاع الشامل', he: 'הגנה כוללת', ja: '総合防衛', ko: '총력방위', zh: '全面防卫',
      },
    ],
    [
      'värnplikt',
      {
        sv: 'värnplikt', en: 'military service', da: 'værnepligt', no: 'verneplikt',
        fi: 'asevelvollisuus', de: 'Wehrpflicht', fr: 'service militaire',
        es: 'servicio militar', nl: 'dienstplicht',
        ar: 'خدمة عسكرية', he: 'שירות צבאי', ja: '兵役', ko: '병역', zh: '兵役',
      },
    ],
    [
      'civilförsvar',
      {
        sv: 'civilförsvar', en: 'civil defence', da: 'civilforsvar', no: 'sivilforsvar',
        fi: 'väestönsuojelu', de: 'Zivilschutz', fr: 'protection civile',
        es: 'defensa civil', nl: 'burgerbescherming',
        ar: 'الدفاع المدني', he: 'הגנה אזרחית', ja: '民間防衛', ko: '민방위', zh: '民防',
      },
    ],
    [
      'krisberedskap',
      {
        sv: 'krisberedskap', en: 'emergency preparedness', da: 'kriseberedskab',
        no: 'kriseberedskap', fi: 'kriisivalmius', de: 'Krisenvorsorge',
        fr: 'préparation aux crises', es: 'preparación ante crisis',
        nl: 'crisisvoorbereiding', ar: 'التأهب للأزمات', he: 'מוכנות לחירום',
        ja: '危機管理', ko: '위기대비', zh: '危机准备',
      },
    ],
    // ---- Justice and law enforcement ----
    [
      'polis',
      {
        sv: 'polis', en: 'police', da: 'politi', no: 'politi',
        fi: 'poliisi', de: 'Polizei', fr: 'police', es: 'policía',
        nl: 'politie', ar: 'شرطة', he: 'משטרה', ja: '警察', ko: '경찰', zh: '警察',
      },
    ],
    [
      'åklagare',
      {
        sv: 'åklagare', en: 'prosecutor', da: 'anklager', no: 'statsadvokat',
        fi: 'syyttäjä', de: 'Staatsanwalt', fr: 'procureur', es: 'fiscal',
        nl: 'aanklager', ar: 'مدعي عام', he: 'תובע', ja: '検察官', ko: '검사', zh: '检察官',
      },
    ],
    [
      'domstol',
      {
        sv: 'domstol', en: 'court', da: 'domstol', no: 'domstol',
        fi: 'tuomioistuin', de: 'Gericht', fr: 'tribunal', es: 'tribunal',
        nl: 'rechtbank', ar: 'محكمة', he: 'בית משפט', ja: '裁判所', ko: '법원', zh: '法院',
      },
    ],
    [
      'högsta domstolen',
      {
        sv: 'Högsta domstolen', en: 'Supreme Court', da: 'Højesteret',
        no: 'Høyesterett', fi: 'Korkein oikeus', de: 'Oberster Gerichtshof',
        fr: 'Cour suprême', es: 'Tribunal Supremo', nl: 'Hooggerechtshof',
        ar: 'المحكمة العليا', he: 'בית המשפט העליון',
        ja: '最高裁判所', ko: '대법원', zh: '最高法院',
      },
    ],
    [
      'kriminalvård',
      {
        sv: 'kriminalvård', en: 'correctional services', da: 'kriminalforsorg',
        no: 'kriminalomsorg', fi: 'rikosseuraamuslaitos', de: 'Strafvollzug',
        fr: 'services pénitentiaires', es: 'servicios penitenciarios',
        nl: 'gevangenisdienst', ar: 'خدمات إصلاحية', he: 'שירותי תיקון',
        ja: '矯正サービス', ko: '교정서비스', zh: '矫正服务',
      },
    ],
    [
      'straffrätt',
      {
        sv: 'straffrätt', en: 'criminal law', da: 'strafferet', no: 'strafferett',
        fi: 'rikosoikeus', de: 'Strafrecht', fr: 'droit pénal', es: 'derecho penal',
        nl: 'strafrecht', ar: 'قانون جنائي', he: 'משפט פלילי',
        ja: '刑法', ko: '형법', zh: '刑法',
      },
    ],
    [
      'civilrätt',
      {
        sv: 'civilrätt', en: 'civil law', da: 'civilret', no: 'sivilrett',
        fi: 'siviilioikeus', de: 'Zivilrecht', fr: 'droit civil', es: 'derecho civil',
        nl: 'civiel recht', ar: 'قانون مدني', he: 'משפט אזרחי',
        ja: '民法', ko: '민법', zh: '民法',
      },
    ],
    // ---- Education and research terms ----
    [
      'grundskola',
      {
        sv: 'grundskola', en: 'primary school', da: 'grundskole', no: 'grunnskole',
        fi: 'peruskoulu', de: 'Grundschule', fr: 'école primaire', es: 'escuela primaria',
        nl: 'basisschool', ar: 'مدرسة ابتدائية', he: 'בית ספר יסודי',
        ja: '小学校', ko: '초등학교', zh: '小学',
      },
    ],
    [
      'gymnasium',
      {
        sv: 'gymnasium', en: 'upper secondary school', da: 'gymnasium', no: 'videregående',
        fi: 'lukio', de: 'Gymnasium', fr: 'lycée', es: 'instituto',
        nl: 'middelbare school', ar: 'مدرسة ثانوية', he: 'תיכון',
        ja: '高等学校', ko: '고등학교', zh: '高中',
      },
    ],
    [
      'högskola',
      {
        sv: 'högskola', en: 'university college', da: 'højskole', no: 'høyskole',
        fi: 'ammattikorkeakoulu', de: 'Hochschule', fr: 'école supérieure',
        es: 'escuela superior', nl: 'hogeschool',
        ar: 'كلية جامعية', he: 'מכללה', ja: '大学', ko: '대학', zh: '大学',
      },
    ],
    [
      'universitet',
      {
        sv: 'universitet', en: 'university', da: 'universitet', no: 'universitet',
        fi: 'yliopisto', de: 'Universität', fr: 'université', es: 'universidad',
        nl: 'universiteit', ar: 'جامعة', he: 'אוניברסיטה', ja: '大学', ko: '대학교', zh: '大学',
      },
    ],
    // ---- Environment and energy terms ----
    [
      'kärnkraft',
      {
        sv: 'kärnkraft', en: 'nuclear power', da: 'atomkraft', no: 'kjernekraft',
        fi: 'ydinvoima', de: 'Kernkraft', fr: 'énergie nucléaire', es: 'energía nuclear',
        nl: 'kernenergie', ar: 'طاقة نووية', he: 'אנרגיה גרעינית',
        ja: '原子力', ko: '원자력', zh: '核能',
      },
    ],
    [
      'förnybar energi',
      {
        sv: 'förnybar energi', en: 'renewable energy', da: 'vedvarende energi',
        no: 'fornybar energi', fi: 'uusiutuva energia', de: 'erneuerbare Energie',
        fr: 'énergie renouvelable', es: 'energía renovable', nl: 'hernieuwbare energie',
        ar: 'طاقة متجددة', he: 'אנרגיה מתחדשת',
        ja: '再生可能エネルギー', ko: '재생에너지', zh: '可再生能源',
      },
    ],
    [
      'utsläpp',
      {
        sv: 'utsläpp', en: 'emissions', da: 'udledning', no: 'utslipp',
        fi: 'päästöt', de: 'Emissionen', fr: 'émissions', es: 'emisiones',
        nl: 'uitstoot', ar: 'انبعاثات', he: 'פליטות', ja: '排出量', ko: '배출', zh: '排放',
      },
    ],
    [
      'klimatmål',
      {
        sv: 'klimatmål', en: 'climate targets', da: 'klimamål', no: 'klimamål',
        fi: 'ilmastotavoitteet', de: 'Klimaziele', fr: 'objectifs climatiques',
        es: 'objetivos climáticos', nl: 'klimaatdoelen',
        ar: 'أهداف مناخية', he: 'יעדי אקלים', ja: '気候目標', ko: '기후목표', zh: '气候目标',
      },
    ],
    [
      'biologisk mångfald',
      {
        sv: 'biologisk mångfald', en: 'biodiversity', da: 'biodiversitet',
        no: 'biologisk mangfold', fi: 'luonnon monimuotoisuus', de: 'Biodiversität',
        fr: 'biodiversité', es: 'biodiversidad', nl: 'biodiversiteit',
        ar: 'تنوع بيولوجي', he: 'מגוון ביולוגי', ja: '生物多様性', ko: '생물다양성', zh: '生物多样性',
      },
    ],
    // ---- Migration and integration terms ----
    [
      'asyl',
      {
        sv: 'asyl', en: 'asylum', da: 'asyl', no: 'asyl',
        fi: 'turvapaikka', de: 'Asyl', fr: 'asile', es: 'asilo',
        nl: 'asiel', ar: 'لجوء', he: 'מקלט', ja: '亡命', ko: '망명', zh: '庇护',
      },
    ],
    [
      'uppehållstillstånd',
      {
        sv: 'uppehållstillstånd', en: 'residence permit', da: 'opholdstilladelse',
        no: 'oppholdstillatelse', fi: 'oleskelulupa', de: 'Aufenthaltsgenehmigung',
        fr: 'permis de séjour', es: 'permiso de residencia', nl: 'verblijfsvergunning',
        ar: 'تصريح إقامة', he: 'אישור שהייה',
        ja: '在留許可', ko: '체류허가', zh: '居留许可',
      },
    ],
    [
      'medborgarskap',
      {
        sv: 'medborgarskap', en: 'citizenship', da: 'statsborgerskab', no: 'statsborgerskap',
        fi: 'kansalaisuus', de: 'Staatsbürgerschaft', fr: 'citoyenneté', es: 'ciudadanía',
        nl: 'staatsburgerschap', ar: 'جنسية', he: 'אזרחות',
        ja: '市民権', ko: '시민권', zh: '公民身份',
      },
    ],
    [
      'migrationsverket',
      {
        sv: 'Migrationsverket', en: 'Swedish Migration Agency', da: 'Migrationsverket',
        no: 'Utlendingsdirektoratet', fi: 'Ruotsin maahanmuuttovirasto',
        de: 'Schwedische Migrationsbehörde', fr: 'Agence suédoise de migration',
        es: 'Agencia Sueca de Migración', nl: 'Zweedse Migratiedienst',
        ar: 'وكالة الهجرة السويدية', he: 'רשות ההגירה השבדית',
        ja: 'スウェーデン移民庁', ko: '스웨덴 이민청', zh: '瑞典移民局',
      },
    ],
    // ---- Additional economic terms ----
    [
      'konjunktur',
      {
        sv: 'konjunktur', en: 'economic cycle', da: 'konjunktur', no: 'konjunktur',
        fi: 'suhdanne', de: 'Konjunktur', fr: 'conjoncture', es: 'coyuntura',
        nl: 'conjunctuur', ar: 'دورة اقتصادية', he: 'מחזור עסקים',
        ja: '景気循環', ko: '경기순환', zh: '经济周期',
      },
    ],
    [
      'lågkonjunktur',
      {
        sv: 'lågkonjunktur', en: 'recession', da: 'lavkonjunktur', no: 'lavkonjunktur',
        fi: 'laskusuhdanne', de: 'Rezession', fr: 'récession', es: 'recesión',
        nl: 'recessie', ar: 'ركود', he: 'מיתון', ja: '不況', ko: '불경기', zh: '衰退',
      },
    ],
    [
      'högkonjunktur',
      {
        sv: 'högkonjunktur', en: 'economic boom', da: 'højkonjunktur', no: 'høykonjunktur',
        fi: 'noususuhdanne', de: 'Hochkonjunktur', fr: 'expansion économique',
        es: 'auge económico', nl: 'hoogconjunctuur',
        ar: 'ازدهار اقتصادي', he: 'גאות כלכלית', ja: '好況', ko: '호경기', zh: '繁荣',
      },
    ],
    [
      'skatteintäkter',
      {
        sv: 'skatteintäkter', en: 'tax revenue', da: 'skatteindtægter', no: 'skatteinntekter',
        fi: 'verotulot', de: 'Steuereinnahmen', fr: 'recettes fiscales',
        es: 'ingresos fiscales', nl: 'belastinginkomsten',
        ar: 'إيرادات ضريبية', he: 'הכנסות ממיסים', ja: '税収', ko: '세수입', zh: '税收收入',
      },
    ],
    [
      'subvention',
      {
        sv: 'subvention', en: 'subsidy', da: 'tilskud', no: 'tilskudd',
        fi: 'tuki', de: 'Subvention', fr: 'subvention', es: 'subvención',
        nl: 'subsidie', ar: 'دعم', he: 'סובסידיה', ja: '補助金', ko: '보조금', zh: '补贴',
      },
    ],
    [
      'statsbidrag',
      {
        sv: 'statsbidrag', en: 'government grant', da: 'statsstøtte', no: 'statstilskudd',
        fi: 'valtionavustus', de: 'Staatszuschuss', fr: 'subvention de l\'État',
        es: 'subvención estatal', nl: 'overheidssubsidie',
        ar: 'منحة حكومية', he: 'מענק ממשלתי', ja: '国庫補助金', ko: '국가보조금', zh: '国家拨款',
      },
    ],
    // ---- Additional political process terms ----
    [
      'förtroende',
      {
        sv: 'förtroende', en: 'confidence', da: 'tillid', no: 'tillit',
        fi: 'luottamus', de: 'Vertrauen', fr: 'confiance', es: 'confianza',
        nl: 'vertrouwen', ar: 'ثقة', he: 'אמון', ja: '信頼', ko: '신임', zh: '信任',
      },
    ],
    [
      'misstroendeförklaring',
      {
        sv: 'misstroendeförklaring', en: 'vote of no confidence', da: 'mistillidserklæring',
        no: 'mistillitserklæring', fi: 'epäluottamuslause', de: 'Misstrauensvotum',
        fr: 'motion de censure', es: 'moción de censura', nl: 'motie van wantrouwen',
        ar: 'حجب الثقة', he: 'הצבעת אי-אמון',
        ja: '不信任決議', ko: '불신임안', zh: '不信任案',
      },
    ],
    [
      'regeringsförklaring',
      {
        sv: 'regeringsförklaring', en: 'statement of government policy',
        da: 'regeringserklæring', no: 'regjeringserklæring', fi: 'hallitusohjelma',
        de: 'Regierungserklärung', fr: 'déclaration de politique générale',
        es: 'declaración de política del gobierno', nl: 'regeringsverklaring',
        ar: 'بيان السياسة الحكومية', he: 'הצהרת מדיניות ממשלתית',
        ja: '施政方針演説', ko: '정부정책선언', zh: '政府施政声明',
      },
    ],
    [
      'riksdagsval',
      {
        sv: 'riksdagsval', en: 'general election', da: 'folketingsvalg',
        no: 'stortingsvalg', fi: 'eduskuntavaalit', de: 'Parlamentswahl',
        fr: 'élections législatives', es: 'elecciones generales', nl: 'parlementsverkiezing',
        ar: 'انتخابات برلمانية', he: 'בחירות כלליות',
        ja: '総選挙', ko: '총선거', zh: '大选',
      },
    ],
    [
      'valrörelse',
      {
        sv: 'valrörelse', en: 'election campaign', da: 'valgkamp', no: 'valgkamp',
        fi: 'vaalikampanja', de: 'Wahlkampf', fr: 'campagne électorale',
        es: 'campaña electoral', nl: 'verkiezingscampagne',
        ar: 'حملة انتخابية', he: 'קמפיין בחירות',
        ja: '選挙運動', ko: '선거운동', zh: '竞选活动',
      },
    ],
    [
      'folkomröstning',
      {
        sv: 'folkomröstning', en: 'referendum', da: 'folkeafstemning', no: 'folkeavstemning',
        fi: 'kansanäänestys', de: 'Volksabstimmung', fr: 'référendum', es: 'referéndum',
        nl: 'referendum', ar: 'استفتاء', he: 'משאל עם',
        ja: '国民投票', ko: '국민투표', zh: '全民公投',
      },
    ],
    [
      'riksmöte',
      {
        sv: 'riksmöte', en: 'parliamentary session', da: 'folketingssamling',
        no: 'stortingssesjon', fi: 'valtiopäivät', de: 'Parlamentssitzungsperiode',
        fr: 'session parlementaire', es: 'período de sesiones parlamentarias',
        nl: 'parlementaire zitting', ar: 'دورة برلمانية', he: 'מושב פרלמנטרי',
        ja: '国会会期', ko: '국회회기', zh: '议会会期',
      },
    ],
    [
      'partiledare',
      {
        sv: 'partiledare', en: 'party leader', da: 'partileder', no: 'partileder',
        fi: 'puoluejohtaja', de: 'Parteivorsitzender', fr: 'chef de parti',
        es: 'líder del partido', nl: 'partijleider',
        ar: 'زعيم الحزب', he: 'מנהיג המפלגה', ja: '党首', ko: '당대표', zh: '党魁',
      },
    ],
    [
      'landshövding',
      {
        sv: 'landshövding', en: 'county governor', da: 'amtmand', no: 'fylkesmann',
        fi: 'maaherra', de: 'Gouverneur', fr: 'gouverneur de comté',
        es: 'gobernador provincial', nl: 'gouverneur',
        ar: 'حاكم المقاطعة', he: 'מושל המחוז', ja: '県知事', ko: '주지사', zh: '省长',
      },
    ],
    [
      'kommunfullmäktige',
      {
        sv: 'kommunfullmäktige', en: 'municipal council', da: 'kommunalbestyrelse',
        no: 'kommunestyre', fi: 'kunnanvaltuusto', de: 'Gemeinderat',
        fr: 'conseil municipal', es: 'consejo municipal', nl: 'gemeenteraad',
        ar: 'مجلس البلدية', he: 'מועצת העיר',
        ja: '市議会', ko: '시의회', zh: '市议会',
      },
    ],
    [
      'regionfullmäktige',
      {
        sv: 'regionfullmäktige', en: 'regional council', da: 'regionsråd',
        no: 'regionsting', fi: 'maakuntavaltuusto', de: 'Regionalrat',
        fr: 'conseil régional', es: 'consejo regional', nl: 'provinciale staten',
        ar: 'المجلس الإقليمي', he: 'מועצת האזור',
        ja: '地域議会', ko: '지역의회', zh: '区域议会',
      },
    ],
    // ---- NATO and defence alliance terms ----
    [
      'nato',
      {
        sv: 'Nato', en: 'NATO', da: 'NATO', no: 'NATO',
        fi: 'Nato', de: 'NATO', fr: 'OTAN', es: 'OTAN',
        nl: 'NAVO', ar: 'الناتو', he: 'נאט"ו', ja: 'NATO', ko: 'NATO', zh: '北约',
      },
    ],
    [
      'alliansfrihet',
      {
        sv: 'alliansfrihet', en: 'non-alignment', da: 'alliancefrihed',
        no: 'alliansefrihet', fi: 'liittoutumattomuus', de: 'Bündnisfreiheit',
        fr: 'non-alignement', es: 'no alineamiento', nl: 'bondgenootschapsvrijheid',
        ar: 'عدم الانحياز', he: 'אי-הזדהות', ja: '非同盟', ko: '비동맹', zh: '不结盟',
      },
    ],
    // ---- Miscellaneous frequently used terms ----
    [
      'lagändring',
      {
        sv: 'lagändring', en: 'amendment to the law', da: 'lovændring', no: 'lovendring',
        fi: 'lakimuutos', de: 'Gesetzesänderung', fr: 'modification de la loi',
        es: 'enmienda a la ley', nl: 'wetswijziging',
        ar: 'تعديل قانوني', he: 'תיקון חוק', ja: '法改正', ko: '법률개정', zh: '法律修正',
      },
    ],
    [
      'riksdagsbeslut',
      {
        sv: 'riksdagsbeslut', en: 'Riksdag decision', da: 'folketingsbeslutning',
        no: 'stortingsvedtak', fi: 'eduskunnan päätös', de: 'Reichstagsbeschluss',
        fr: 'décision du Riksdag', es: 'decisión del Riksdag', nl: 'Riksdag-besluit',
        ar: 'قرار البرلمان', he: 'החלטת הריקסדאג',
        ja: '国会決定', ko: '국회 의결', zh: '国会决定',
      },
    ],
    [
      'myndighetsbeslut',
      {
        sv: 'myndighetsbeslut', en: 'administrative decision', da: 'myndighedsafgørelse',
        no: 'forvaltningsvedtak', fi: 'viranomaispäätös', de: 'Verwaltungsentscheidung',
        fr: 'décision administrative', es: 'decisión administrativa', nl: 'bestuursbesluit',
        ar: 'قرار إداري', he: 'החלטה מנהלית',
        ja: '行政決定', ko: '행정결정', zh: '行政决定',
      },
    ],
    [
      'rättigheter',
      {
        sv: 'rättigheter', en: 'rights', da: 'rettigheder', no: 'rettigheter',
        fi: 'oikeudet', de: 'Rechte', fr: 'droits', es: 'derechos',
        nl: 'rechten', ar: 'حقوق', he: 'זכויות', ja: '権利', ko: '권리', zh: '权利',
      },
    ],
    [
      'skyldigheter',
      {
        sv: 'skyldigheter', en: 'obligations', da: 'forpligtelser', no: 'forpliktelser',
        fi: 'velvollisuudet', de: 'Pflichten', fr: 'obligations', es: 'obligaciones',
        nl: 'verplichtingen', ar: 'التزامات', he: 'חובות', ja: '義務', ko: '의무', zh: '义务',
      },
    ],
    [
      'tillsyn',
      {
        sv: 'tillsyn', en: 'supervision', da: 'tilsyn', no: 'tilsyn',
        fi: 'valvonta', de: 'Aufsicht', fr: 'supervision', es: 'supervisión',
        nl: 'toezicht', ar: 'إشراف', he: 'פיקוח', ja: '監督', ko: '감독', zh: '监管',
      },
    ],
    [
      'reglering',
      {
        sv: 'reglering', en: 'regulation', da: 'regulering', no: 'regulering',
        fi: 'sääntely', de: 'Regulierung', fr: 'réglementation', es: 'regulación',
        nl: 'regulering', ar: 'تنظيم', he: 'רגולציה', ja: '規制', ko: '규제', zh: '监管',
      },
    ],
    [
      'förvaltning',
      {
        sv: 'förvaltning', en: 'administration', da: 'forvaltning', no: 'forvaltning',
        fi: 'hallinto', de: 'Verwaltung', fr: 'administration', es: 'administración',
        nl: 'bestuur', ar: 'إدارة', he: 'מנהל', ja: '行政', ko: '행정', zh: '行政',
      },
    ],
    [
      'verksamhet',
      {
        sv: 'verksamhet', en: 'activity', da: 'virksomhed', no: 'virksomhet',
        fi: 'toiminta', de: 'Tätigkeit', fr: 'activité', es: 'actividad',
        nl: 'activiteit', ar: 'نشاط', he: 'פעילות', ja: '活動', ko: '활동', zh: '活动',
      },
    ],
    [
      'uppdrag',
      {
        sv: 'uppdrag', en: 'assignment', da: 'opgave', no: 'oppdrag',
        fi: 'tehtävä', de: 'Auftrag', fr: 'mission', es: 'encargo',
        nl: 'opdracht', ar: 'مهمة', he: 'משימה', ja: '任務', ko: '임무', zh: '任务',
      },
    ],
    [
      'riktlinjer',
      {
        sv: 'riktlinjer', en: 'guidelines', da: 'retningslinjer', no: 'retningslinjer',
        fi: 'ohjeet', de: 'Richtlinien', fr: 'lignes directrices', es: 'directrices',
        nl: 'richtlijnen', ar: 'إرشادات', he: 'הנחיות', ja: 'ガイドライン', ko: '지침', zh: '准则',
      },
    ],
    [
      'utjämning',
      {
        sv: 'utjämning', en: 'equalisation', da: 'udligning', no: 'utjevning',
        fi: 'tasaus', de: 'Ausgleich', fr: 'péréquation', es: 'compensación',
        nl: 'verevening', ar: 'معادلة', he: 'איזון', ja: '平準化', ko: '평준화', zh: '均等化',
      },
    ],
    [
      'utjämningsmandat',
      {
        sv: 'utjämningsmandat', en: 'levelling seat', da: 'udligningsmandat',
        no: 'utjevningsmandat', fi: 'tasauspaikka', de: 'Ausgleichsmandat',
        fr: 'siège compensatoire', es: 'escaño compensatorio', nl: 'vereffeningszetel',
        ar: 'مقعد تعويضي', he: 'מושב איזון',
        ja: '調整議席', ko: '보정의석', zh: '补偿席位',
      },
    ],
    [
      'spärr',
      {
        sv: 'spärr', en: 'threshold', da: 'spærregrænse', no: 'sperregrense',
        fi: 'äänikynnys', de: 'Sperrklausel', fr: 'seuil électoral', es: 'umbral electoral',
        nl: 'kiesdrempel', ar: 'عتبة انتخابية', he: 'אחוז חסימה',
        ja: '阻止条項', ko: '봉쇄조항', zh: '选举门槛',
      },
    ],
    [
      'prövning',
      {
        sv: 'prövning', en: 'examination', da: 'prøvelse', no: 'prøving',
        fi: 'tutkiminen', de: 'Prüfung', fr: 'examen', es: 'examen',
        nl: 'toetsing', ar: 'فحص', he: 'בחינה', ja: '審査', ko: '심사', zh: '审查',
      },
    ],
    [
      'förhandling',
      {
        sv: 'förhandling', en: 'negotiation', da: 'forhandling', no: 'forhandling',
        fi: 'neuvottelu', de: 'Verhandlung', fr: 'négociation', es: 'negociación',
        nl: 'onderhandeling', ar: 'مفاوضة', he: 'משא ומתן', ja: '交渉', ko: '협상', zh: '谈判',
      },
    ],
    [
      'överenskommelse',
      {
        sv: 'överenskommelse', en: 'agreement', da: 'overenskomst', no: 'overenskomst',
        fi: 'sopimus', de: 'Vereinbarung', fr: 'accord', es: 'acuerdo',
        nl: 'overeenkomst', ar: 'اتفاق', he: 'הסכם', ja: '合意', ko: '합의', zh: '协议',
      },
    ],
    [
      'avtal',
      {
        sv: 'avtal', en: 'agreement', da: 'aftale', no: 'avtale',
        fi: 'sopimus', de: 'Vertrag', fr: 'accord', es: 'acuerdo',
        nl: 'verdrag', ar: 'اتفاقية', he: 'הסכם', ja: '協定', ko: '협정', zh: '协议',
      },
    ],
    // ---- Additional common Swedish parliamentary and government terms ----
    [
      'investeringar',
      {
        sv: 'investeringar', en: 'investments', da: 'investeringer', no: 'investeringer',
        fi: 'investoinnit', de: 'Investitionen', fr: 'investissements', es: 'inversiones',
        nl: 'investeringen', ar: 'استثمارات', he: 'השקעות', ja: '投資', ko: '투자', zh: '投资',
      },
    ],
    [
      'privatisering',
      {
        sv: 'privatisering', en: 'privatisation', da: 'privatisering', no: 'privatisering',
        fi: 'yksityistäminen', de: 'Privatisierung', fr: 'privatisation', es: 'privatización',
        nl: 'privatisering', ar: 'خصخصة', he: 'הפרטה', ja: '民営化', ko: '민영화', zh: '私有化',
      },
    ],
    [
      'decentralisering',
      {
        sv: 'decentralisering', en: 'decentralisation', da: 'decentralisering', no: 'desentralisering',
        fi: 'hajauttaminen', de: 'Dezentralisierung', fr: 'décentralisation', es: 'descentralización',
        nl: 'decentralisatie', ar: 'لامركزية', he: 'ביזור', ja: '分権化', ko: '분권화', zh: '分权化',
      },
    ],
    [
      'skattelättnad',
      {
        sv: 'skattelättnad', en: 'tax relief', da: 'skattelettelse', no: 'skattelettelse',
        fi: 'veronkevennys', de: 'Steuererleichterung', fr: 'allègement fiscal', es: 'desgravación fiscal',
        nl: 'belastingverlichting', ar: 'إعفاء ضريبي', he: 'הקלת מס', ja: '減税', ko: '세금감면', zh: '税收减免',
      },
    ],
    [
      'arbetsgivaravgifter',
      {
        sv: 'arbetsgivaravgifter', en: 'employer contributions', da: 'arbejdsgiverbidrag',
        no: 'arbeidsgiveravgift', fi: 'työnantajamaksut', de: 'Arbeitgeberabgaben',
        fr: 'cotisations patronales', es: 'contribuciones patronales', nl: 'werkgeversbijdragen',
        ar: 'مساهمات صاحب العمل', he: 'דמי מעביד', ja: '雇用主負担金', ko: '고용주부담금', zh: '雇主缴费',
      },
    ],
    [
      'moms',
      {
        sv: 'moms', en: 'VAT', da: 'moms', no: 'moms',
        fi: 'arvonlisävero', de: 'Mehrwertsteuer', fr: 'TVA', es: 'IVA',
        nl: 'btw', ar: 'ضريبة القيمة المضافة', he: 'מע"מ', ja: '付加価値税', ko: '부가가치세', zh: '增值税',
      },
    ],
    [
      'tullavgift',
      {
        sv: 'tullavgift', en: 'customs duty', da: 'told', no: 'tollavgift',
        fi: 'tulli', de: 'Zollgebühr', fr: 'droit de douane', es: 'arancel',
        nl: 'douanerecht', ar: 'رسوم جمركية', he: 'מכס', ja: '関税', ko: '관세', zh: '关税',
      },
    ],
    [
      'upphandling',
      {
        sv: 'upphandling', en: 'procurement', da: 'indkøb', no: 'innkjøp',
        fi: 'julkiset hankinnat', de: 'Beschaffung', fr: 'marché public', es: 'contratación pública',
        nl: 'aanbesteding', ar: 'مشتريات', he: 'רכש', ja: '調達', ko: '조달', zh: '采购',
      },
    ],
    [
      'konkurrens',
      {
        sv: 'konkurrens', en: 'competition', da: 'konkurrence', no: 'konkurranse',
        fi: 'kilpailu', de: 'Wettbewerb', fr: 'concurrence', es: 'competencia',
        nl: 'concurrentie', ar: 'منافسة', he: 'תחרות', ja: '競争', ko: '경쟁', zh: '竞争',
      },
    ],
    [
      'monopol',
      {
        sv: 'monopol', en: 'monopoly', da: 'monopol', no: 'monopol',
        fi: 'monopoli', de: 'Monopol', fr: 'monopole', es: 'monopolio',
        nl: 'monopolie', ar: 'احتكار', he: 'מונופול', ja: '独占', ko: '독점', zh: '垄断',
      },
    ],
    [
      'folkhälsa',
      {
        sv: 'folkhälsa', en: 'public health', da: 'folkesundhed', no: 'folkehelse',
        fi: 'kansanterveys', de: 'Volksgesundheit', fr: 'santé publique', es: 'salud pública',
        nl: 'volksgezondheid', ar: 'صحة عامة', he: 'בריאות הציבור', ja: '公衆衛生', ko: '공중보건', zh: '公共卫生',
      },
    ],
    [
      'pandemi',
      {
        sv: 'pandemi', en: 'pandemic', da: 'pandemi', no: 'pandemi',
        fi: 'pandemia', de: 'Pandemie', fr: 'pandémie', es: 'pandemia',
        nl: 'pandemie', ar: 'وباء', he: 'מגפה', ja: 'パンデミック', ko: '팬데믹', zh: '大流行',
      },
    ],
    [
      'vaccinering',
      {
        sv: 'vaccinering', en: 'vaccination', da: 'vaccination', no: 'vaksinering',
        fi: 'rokotus', de: 'Impfung', fr: 'vaccination', es: 'vacunación',
        nl: 'vaccinatie', ar: 'تطعيم', he: 'חיסון', ja: 'ワクチン接種', ko: '예방접종', zh: '接种疫苗',
      },
    ],
    [
      'frihandel',
      {
        sv: 'frihandel', en: 'free trade', da: 'frihandel', no: 'frihandel',
        fi: 'vapaakauppa', de: 'Freihandel', fr: 'libre-échange', es: 'libre comercio',
        nl: 'vrijhandel', ar: 'تجارة حرة', he: 'סחר חופשי', ja: '自由貿易', ko: '자유무역', zh: '自由贸易',
      },
    ],
    [
      'sanktion',
      {
        sv: 'sanktion', en: 'sanction', da: 'sanktion', no: 'sanksjon',
        fi: 'pakote', de: 'Sanktion', fr: 'sanction', es: 'sanción',
        nl: 'sanctie', ar: 'عقوبة', he: 'סנקציה', ja: '制裁', ko: '제재', zh: '制裁',
      },
    ],
    [
      'fredsprocess',
      {
        sv: 'fredsprocess', en: 'peace process', da: 'fredsproces', no: 'fredsprosess',
        fi: 'rauhanprosessi', de: 'Friedensprozess', fr: 'processus de paix', es: 'proceso de paz',
        nl: 'vredesproces', ar: 'عملية السلام', he: 'תהליך שלום', ja: '和平プロセス', ko: '평화 과정', zh: '和平进程',
      },
    ],
    [
      'nedrustning',
      {
        sv: 'nedrustning', en: 'disarmament', da: 'nedrustning', no: 'nedrustning',
        fi: 'aseistariisunta', de: 'Abrüstung', fr: 'désarmement', es: 'desarme',
        nl: 'ontwapening', ar: 'نزع السلاح', he: 'פירוק נשק', ja: '軍縮', ko: '군축', zh: '裁军',
      },
    ],
    [
      'terrorism',
      {
        sv: 'terrorism', en: 'terrorism', da: 'terrorisme', no: 'terrorisme',
        fi: 'terrorismi', de: 'Terrorismus', fr: 'terrorisme', es: 'terrorismo',
        nl: 'terrorisme', ar: 'إرهاب', he: 'טרור', ja: 'テロリズム', ko: '테러리즘', zh: '恐怖主义',
      },
    ],
    [
      'cybersäkerhet',
      {
        sv: 'cybersäkerhet', en: 'cybersecurity', da: 'cybersikkerhed', no: 'cybersikkerhet',
        fi: 'kyberturvallisuus', de: 'Cybersicherheit', fr: 'cybersécurité', es: 'ciberseguridad',
        nl: 'cyberveiligheid', ar: 'أمن سيبراني', he: 'אבטחת סייבר', ja: 'サイバーセキュリティ', ko: '사이버보안', zh: '网络安全',
      },
    ],
    [
      'dataskydd',
      {
        sv: 'dataskydd', en: 'data protection', da: 'databeskyttelse', no: 'databeskyttelse',
        fi: 'tietosuoja', de: 'Datenschutz', fr: 'protection des données', es: 'protección de datos',
        nl: 'gegevensbescherming', ar: 'حماية البيانات', he: 'הגנת מידע', ja: 'データ保護', ko: '데이터보호', zh: '数据保护',
      },
    ],
    [
      'integritet',
      {
        sv: 'integritet', en: 'privacy', da: 'privathed', no: 'personvern',
        fi: 'yksityisyys', de: 'Privatsphäre', fr: 'vie privée', es: 'privacidad',
        nl: 'privacy', ar: 'خصوصية', he: 'פרטיות', ja: 'プライバシー', ko: '개인정보보호', zh: '隐私',
      },
    ],
    [
      'vapenexport',
      {
        sv: 'vapenexport', en: 'arms export', da: 'våbeneksport', no: 'våpeneksport',
        fi: 'asevienti', de: 'Waffenexport', fr: 'exportation d\'armes', es: 'exportación de armas',
        nl: 'wapenexport', ar: 'تصدير أسلحة', he: 'יצוא נשק', ja: '武器輸出', ko: '무기수출', zh: '武器出口',
      },
    ],
    [
      'utlänning',
      {
        sv: 'utlänning', en: 'foreign national', da: 'udlænding', no: 'utlending',
        fi: 'ulkomaalainen', de: 'Ausländer', fr: 'étranger', es: 'extranjero',
        nl: 'vreemdeling', ar: 'أجنبي', he: 'זר', ja: '外国人', ko: '외국인', zh: '外国人',
      },
    ],
    [
      'flykting',
      {
        sv: 'flykting', en: 'refugee', da: 'flygtning', no: 'flyktning',
        fi: 'pakolainen', de: 'Flüchtling', fr: 'réfugié', es: 'refugiado',
        nl: 'vluchteling', ar: 'لاجئ', he: 'פליט', ja: '難民', ko: '난민', zh: '难民',
      },
    ],
    [
      'gränskontroll',
      {
        sv: 'gränskontroll', en: 'border control', da: 'grænsekontrol', no: 'grensekontroll',
        fi: 'rajatarkastus', de: 'Grenzkontrolle', fr: 'contrôle aux frontières', es: 'control fronterizo',
        nl: 'grenscontrole', ar: 'مراقبة الحدود', he: 'בקרת גבולות', ja: '国境管理', ko: '국경통제', zh: '边境管控',
      },
    ],
    [
      'minoritet',
      {
        sv: 'minoritet', en: 'minority', da: 'minoritet', no: 'minoritet',
        fi: 'vähemmistö', de: 'Minderheit', fr: 'minorité', es: 'minoría',
        nl: 'minderheid', ar: 'أقلية', he: 'מיעוט', ja: '少数者', ko: '소수자', zh: '少数族群',
      },
    ],
    [
      'urfolk',
      {
        sv: 'urfolk', en: 'indigenous peoples', da: 'urfolk', no: 'urfolk',
        fi: 'alkuperäiskansat', de: 'Ureinwohner', fr: 'peuples autochtones', es: 'pueblos indígenas',
        nl: 'inheemse volkeren', ar: 'شعوب أصلية', he: 'עמים ילידים', ja: '先住民族', ko: '원주민', zh: '原住民',
      },
    ],
    [
      'offentlig sektor',
      {
        sv: 'offentlig sektor', en: 'public sector', da: 'offentlig sektor', no: 'offentlig sektor',
        fi: 'julkinen sektori', de: 'öffentlicher Sektor', fr: 'secteur public', es: 'sector público',
        nl: 'publieke sector', ar: 'القطاع العام', he: 'המגזר הציבורי', ja: '公共部門', ko: '공공부문', zh: '公共部门',
      },
    ],
    [
      'privat sektor',
      {
        sv: 'privat sektor', en: 'private sector', da: 'privat sektor', no: 'privat sektor',
        fi: 'yksityinen sektori', de: 'privater Sektor', fr: 'secteur privé', es: 'sector privado',
        nl: 'private sector', ar: 'القطاع الخاص', he: 'המגזר הפרטי', ja: '民間部門', ko: '민간부문', zh: '私营部门',
      },
    ],
    [
      'kommunikation',
      {
        sv: 'kommunikation', en: 'communication', da: 'kommunikation', no: 'kommunikasjon',
        fi: 'viestintä', de: 'Kommunikation', fr: 'communication', es: 'comunicación',
        nl: 'communicatie', ar: 'اتصال', he: 'תקשורת', ja: '通信', ko: '통신', zh: '通讯',
      },
    ],
    [
      'tillgänglighet',
      {
        sv: 'tillgänglighet', en: 'accessibility', da: 'tilgængelighed', no: 'tilgjengelighet',
        fi: 'saavutettavuus', de: 'Barrierefreiheit', fr: 'accessibilité', es: 'accesibilidad',
        nl: 'toegankelijkheid', ar: 'إمكانية الوصول', he: 'נגישות', ja: 'アクセシビリティ', ko: '접근성', zh: '无障碍',
      },
    ],
    [
      'innovation',
      {
        sv: 'innovation', en: 'innovation', da: 'innovation', no: 'innovasjon',
        fi: 'innovaatio', de: 'Innovation', fr: 'innovation', es: 'innovación',
        nl: 'innovatie', ar: 'ابتكار', he: 'חדשנות', ja: 'イノベーション', ko: '혁신', zh: '创新',
      },
    ],
    [
      'hållbar utveckling',
      {
        sv: 'hållbar utveckling', en: 'sustainable development', da: 'bæredygtig udvikling',
        no: 'bærekraftig utvikling', fi: 'kestävä kehitys', de: 'nachhaltige Entwicklung',
        fr: 'développement durable', es: 'desarrollo sostenible', nl: 'duurzame ontwikkeling',
        ar: 'تنمية مستدامة', he: 'פיתוח בר-קיימא', ja: '持続可能な開発', ko: '지속가능한 개발', zh: '可持续发展',
      },
    ],
    [
      'likabehandling',
      {
        sv: 'likabehandling', en: 'equal treatment', da: 'ligebehandling', no: 'likebehandling',
        fi: 'tasa-arvoinen kohtelu', de: 'Gleichbehandlung', fr: 'égalité de traitement',
        es: 'igualdad de trato', nl: 'gelijke behandeling',
        ar: 'معاملة متساوية', he: 'יחס שוויוני', ja: '平等待遇', ko: '동등 대우', zh: '平等待遇',
      },
    ],
    [
      'barnomsorg',
      {
        sv: 'barnomsorg', en: 'childcare', da: 'børnepasning', no: 'barnepass',
        fi: 'lastenhoito', de: 'Kinderbetreuung', fr: 'garde d\'enfants', es: 'cuidado infantil',
        nl: 'kinderopvang', ar: 'رعاية الأطفال', he: 'טיפול בילדים', ja: '保育', ko: '보육', zh: '儿童保育',
      },
    ],
    [
      'äldreomsorg',
      {
        sv: 'äldreomsorg', en: 'elderly care', da: 'ældrepleje', no: 'eldreomsorg',
        fi: 'vanhustenhoito', de: 'Altenpflege', fr: 'soins aux personnes âgées',
        es: 'atención a personas mayores', nl: 'ouderenzorg',
        ar: 'رعاية المسنين', he: 'טיפול בקשישים', ja: '高齢者介護', ko: '노인돌봄', zh: '养老护理',
      },
    ],
    [
      'löntagare',
      {
        sv: 'löntagare', en: 'employee', da: 'lønmodtager', no: 'lønnstaker',
        fi: 'palkansaaja', de: 'Arbeitnehmer', fr: 'salarié', es: 'asalariado',
        nl: 'werknemer', ar: 'عامل بأجر', he: 'שכיר', ja: '被雇用者', ko: '임금근로자', zh: '雇员',
      },
    ],
    [
      'arbetsgivare',
      {
        sv: 'arbetsgivare', en: 'employer', da: 'arbejdsgiver', no: 'arbeidsgiver',
        fi: 'työnantaja', de: 'Arbeitgeber', fr: 'employeur', es: 'empleador',
        nl: 'werkgever', ar: 'صاحب عمل', he: 'מעסיק', ja: '雇用主', ko: '고용주', zh: '雇主',
      },
    ],
    [
      'fackförening',
      {
        sv: 'fackförening', en: 'trade union', da: 'fagforening', no: 'fagforening',
        fi: 'ammattiliitto', de: 'Gewerkschaft', fr: 'syndicat', es: 'sindicato',
        nl: 'vakbond', ar: 'نقابة عمال', he: 'איגוד מקצועי', ja: '労働組合', ko: '노동조합', zh: '工会',
      },
    ],
    [
      'kollektivavtal',
      {
        sv: 'kollektivavtal', en: 'collective agreement', da: 'overenskomst', no: 'tariffavtale',
        fi: 'työehtosopimus', de: 'Tarifvertrag', fr: 'convention collective', es: 'convenio colectivo',
        nl: 'collectieve overeenkomst', ar: 'اتفاقية جماعية', he: 'הסכם קיבוצי',
        ja: '労働協約', ko: '단체협약', zh: '集体协议',
      },
    ],
    [
      'strejk',
      {
        sv: 'strejk', en: 'strike', da: 'strejke', no: 'streik',
        fi: 'lakko', de: 'Streik', fr: 'grève', es: 'huelga',
        nl: 'staking', ar: 'إضراب', he: 'שביתה', ja: 'ストライキ', ko: '파업', zh: '罢工',
      },
    ],
    [
      'medling',
      {
        sv: 'medling', en: 'mediation', da: 'mægling', no: 'megling',
        fi: 'sovittelu', de: 'Schlichtung', fr: 'médiation', es: 'mediación',
        nl: 'bemiddeling', ar: 'وساطة', he: 'גישור', ja: '調停', ko: '중재', zh: '调解',
      },
    ],
    [
      'marknad',
      {
        sv: 'marknad', en: 'market', da: 'marked', no: 'marked',
        fi: 'markkina', de: 'Markt', fr: 'marché', es: 'mercado',
        nl: 'markt', ar: 'سوق', he: 'שוק', ja: '市場', ko: '시장', zh: '市场',
      },
    ],
    [
      'ekonomi',
      {
        sv: 'ekonomi', en: 'economy', da: 'økonomi', no: 'økonomi',
        fi: 'talous', de: 'Wirtschaft', fr: 'économie', es: 'economía',
        nl: 'economie', ar: 'اقتصاد', he: 'כלכלה', ja: '経済', ko: '경제', zh: '经济',
      },
    ],
    [
      'konsument',
      {
        sv: 'konsument', en: 'consumer', da: 'forbruger', no: 'forbruker',
        fi: 'kuluttaja', de: 'Verbraucher', fr: 'consommateur', es: 'consumidor',
        nl: 'consument', ar: 'مستهلك', he: 'צרכן', ja: '消費者', ko: '소비자', zh: '消费者',
      },
    ],
    [
      'livsmedelssäkerhet',
      {
        sv: 'livsmedelssäkerhet', en: 'food safety', da: 'fødevaresikkerhed', no: 'matsikkerhet',
        fi: 'elintarviketurvallisuus', de: 'Lebensmittelsicherheit', fr: 'sécurité alimentaire',
        es: 'seguridad alimentaria', nl: 'voedselveiligheid',
        ar: 'سلامة الغذاء', he: 'בטיחות מזון', ja: '食品安全', ko: '식품안전', zh: '食品安全',
      },
    ],
    [
      'djurskydd',
      {
        sv: 'djurskydd', en: 'animal welfare', da: 'dyrevelfærd', no: 'dyrevelferd',
        fi: 'eläinsuojelu', de: 'Tierschutz', fr: 'protection animale', es: 'bienestar animal',
        nl: 'dierenwelzijn', ar: 'حماية الحيوان', he: 'רווחת בעלי חיים', ja: '動物愛護', ko: '동물복지', zh: '动物福利',
      },
    ],
    [
      'samhällsskydd',
      {
        sv: 'samhällsskydd', en: 'civil protection', da: 'samfundssikkerhed', no: 'samfunnssikkerhet',
        fi: 'yhteiskunnan suojelu', de: 'Zivilschutz', fr: 'protection civile', es: 'protección civil',
        nl: 'maatschappijbescherming', ar: 'حماية المجتمع', he: 'הגנת האזרחים',
        ja: '市民保護', ko: '시민보호', zh: '民事保护',
      },
    ],
    [
      'jämlikhet',
      {
        sv: 'jämlikhet', en: 'equality', da: 'lighed', no: 'likhet',
        fi: 'tasa-arvo', de: 'Gleichheit', fr: 'égalité', es: 'igualdad',
        nl: 'gelijkheid', ar: 'مساواة', he: 'שוויון', ja: '平等', ko: '평등', zh: '平等',
      },
    ],
    [
      'internationellt samarbete',
      {
        sv: 'internationellt samarbete', en: 'international cooperation',
        da: 'internationalt samarbejde', no: 'internasjonalt samarbeid',
        fi: 'kansainvälinen yhteistyö', de: 'internationale Zusammenarbeit',
        fr: 'coopération internationale', es: 'cooperación internacional',
        nl: 'internationale samenwerking', ar: 'تعاون دولي', he: 'שיתוף פעולה בינלאומי',
        ja: '国際協力', ko: '국제협력', zh: '国际合作',
      },
    ],
    [
      'rättssäkerhet',
      {
        sv: 'rättssäkerhet', en: 'legal certainty', da: 'retssikkerhed', no: 'rettssikkerhet',
        fi: 'oikeusturva', de: 'Rechtssicherheit', fr: 'sécurité juridique', es: 'seguridad jurídica',
        nl: 'rechtszekerheid', ar: 'يقين قانوني', he: 'ודאות משפטית', ja: '法的安定性', ko: '법적 안정성', zh: '法律确定性',
      },
    ],
    [
      'valfrihet',
      {
        sv: 'valfrihet', en: 'freedom of choice', da: 'valgfrihed', no: 'valgfrihet',
        fi: 'valinnanvapaus', de: 'Wahlfreiheit', fr: 'liberté de choix', es: 'libertad de elección',
        nl: 'keuzevrijheid', ar: 'حرية الاختيار', he: 'חופש בחירה', ja: '選択の自由', ko: '선택의 자유', zh: '选择自由',
      },
    ],
    [
      'opinionsundersökning',
      {
        sv: 'opinionsundersökning', en: 'opinion poll', da: 'meningsmåling', no: 'meningsmåling',
        fi: 'mielipidetutkimus', de: 'Meinungsumfrage', fr: 'sondage d\'opinion', es: 'encuesta de opinión',
        nl: 'opiniepeiling', ar: 'استطلاع رأي', he: 'סקר דעת קהל', ja: '世論調査', ko: '여론조사', zh: '民意调查',
      },
    ],
    [
      'väljarundersökning',
      {
        sv: 'väljarundersökning', en: 'voter survey', da: 'vælgerundersøgelse',
        no: 'velgerundersøkelse', fi: 'äänestäjätutkimus', de: 'Wählerumfrage',
        fr: 'enquête auprès des électeurs', es: 'encuesta de votantes', nl: 'kiezersonderzoek',
        ar: 'استطلاع ناخبين', he: 'סקר בוחרים', ja: '有権者調査', ko: '유권자 조사', zh: '选民调查',
      },
    ],
    [
      'regering',
      {
        sv: 'regering', en: 'government', da: 'regering', no: 'regjering',
        fi: 'hallitus', de: 'Regierung', fr: 'gouvernement', es: 'gobierno',
        nl: 'regering', ar: 'حكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府',
      },
    ],
    [
      'departement',
      {
        sv: 'departement', en: 'ministry', da: 'ministerium', no: 'departement',
        fi: 'ministeriö', de: 'Ministerium', fr: 'ministère', es: 'ministerio',
        nl: 'ministerie', ar: 'وزارة', he: 'משרד', ja: '省', ko: '부', zh: '部',
      },
    ],
    [
      'statssekreterare',
      {
        sv: 'statssekreterare', en: 'state secretary', da: 'statssekretær', no: 'statssekretær',
        fi: 'valtiosihteeri', de: 'Staatssekretär', fr: 'secrétaire d\'État', es: 'secretario de estado',
        nl: 'staatssecretaris', ar: 'أمين الدولة', he: 'מזכיר המדינה', ja: '国務長官', ko: '차관', zh: '国务秘书',
      },
    ],
    [
      'generaldirektör',
      {
        sv: 'generaldirektör', en: 'director-general', da: 'generaldirektør', no: 'generaldirektør',
        fi: 'pääjohtaja', de: 'Generaldirektor', fr: 'directeur général', es: 'director general',
        nl: 'directeur-generaal', ar: 'مدير عام', he: 'מנכ"ל', ja: '長官', ko: '국장', zh: '总干事',
      },
    ],
    [
      'landsbygdspolitik',
      {
        sv: 'landsbygdspolitik', en: 'rural policy', da: 'landdistriktspolitik',
        no: 'landbrukspolitikk', fi: 'maaseutupolitiikka', de: 'Ländliche Entwicklungspolitik',
        fr: 'politique rurale', es: 'política rural', nl: 'plattelandsbeleid',
        ar: 'سياسة ريفية', he: 'מדיניות כפרית', ja: '農村政策', ko: '농촌정책', zh: '乡村政策',
      },
    ],
    [
      'regionalpolitik',
      {
        sv: 'regionalpolitik', en: 'regional policy', da: 'regionalpolitik',
        no: 'regionalpolitikk', fi: 'aluepolitiikka', de: 'Regionalpolitik',
        fr: 'politique régionale', es: 'política regional', nl: 'regionaal beleid',
        ar: 'سياسة إقليمية', he: 'מדיניות אזורית', ja: '地域政策', ko: '지역정책', zh: '区域政策',
      },
    ],
    [
      'äganderätt',
      {
        sv: 'äganderätt', en: 'property rights', da: 'ejendomsret', no: 'eiendomsrett',
        fi: 'omistusoikeus', de: 'Eigentumsrecht', fr: 'droit de propriété', es: 'derecho de propiedad',
        nl: 'eigendomsrecht', ar: 'حق الملكية', he: 'זכות קניין', ja: '財産権', ko: '재산권', zh: '产权',
      },
    ],
    [
      'näringsfrihet',
      {
        sv: 'näringsfrihet', en: 'freedom of enterprise', da: 'næringsfrihed',
        no: 'næringsfrihet', fi: 'elinkeinovapaus', de: 'Gewerbefreiheit',
        fr: 'liberté d\'entreprise', es: 'libertad de empresa', nl: 'ondernemingsvrijheid',
        ar: 'حرية التجارة', he: 'חופש עיסוק', ja: '営業の自由', ko: '영업의 자유', zh: '营业自由',
      },
    ],
    [
      'avtalsrätt',
      {
        sv: 'avtalsrätt', en: 'contract law', da: 'aftaleret', no: 'avtalerett',
        fi: 'sopimusoikeus', de: 'Vertragsrecht', fr: 'droit des contrats', es: 'derecho contractual',
        nl: 'contractenrecht', ar: 'قانون العقود', he: 'דיני חוזים', ja: '契約法', ko: '계약법', zh: '合同法',
      },
    ],
    [
      'skadestånd',
      {
        sv: 'skadestånd', en: 'damages', da: 'erstatning', no: 'erstatning',
        fi: 'vahingonkorvaus', de: 'Schadenersatz', fr: 'dommages et intérêts', es: 'indemnización',
        nl: 'schadevergoeding', ar: 'تعويض', he: 'פיצויים', ja: '損害賠償', ko: '손해배상', zh: '损害赔偿',
      },
    ],
    [
      'upphovsrätt',
      {
        sv: 'upphovsrätt', en: 'copyright', da: 'ophavsret', no: 'opphavsrett',
        fi: 'tekijänoikeus', de: 'Urheberrecht', fr: 'droit d\'auteur', es: 'derechos de autor',
        nl: 'auteursrecht', ar: 'حقوق التأليف', he: 'זכויות יוצרים', ja: '著作権', ko: '저작권', zh: '版权',
      },
    ],
    [
      'patent',
      {
        sv: 'patent', en: 'patent', da: 'patent', no: 'patent',
        fi: 'patentti', de: 'Patent', fr: 'brevet', es: 'patente',
        nl: 'patent', ar: 'براءة اختراع', he: 'פטנט', ja: '特許', ko: '특허', zh: '专利',
      },
    ],
    // ---- Final batch: additional common terms ----
    [
      'samhällsekonomi',
      {
        sv: 'samhällsekonomi', en: 'national economy', da: 'samfundsøkonomi', no: 'samfunnsøkonomi',
        fi: 'kansantalous', de: 'Volkswirtschaft', fr: 'économie nationale', es: 'economía nacional',
        nl: 'volkshuishouding', ar: 'اقتصاد وطني', he: 'כלכלה לאומית', ja: '国民経済', ko: '국민경제', zh: '国民经济',
      },
    ],
    [
      'ungdomspolitik',
      {
        sv: 'ungdomspolitik', en: 'youth policy', da: 'ungdomspolitik', no: 'ungdomspolitikk',
        fi: 'nuorisopolitiikka', de: 'Jugendpolitik', fr: 'politique de la jeunesse',
        es: 'política de juventud', nl: 'jongerenbeleid',
        ar: 'سياسة الشباب', he: 'מדיניות נוער', ja: '青少年政策', ko: '청소년정책', zh: '青年政策',
      },
    ],
    [
      'konsumentskydd',
      {
        sv: 'konsumentskydd', en: 'consumer protection', da: 'forbrugerbeskyttelse',
        no: 'forbrukerbeskyttelse', fi: 'kuluttajansuoja', de: 'Verbraucherschutz',
        fr: 'protection des consommateurs', es: 'protección al consumidor', nl: 'consumentenbescherming',
        ar: 'حماية المستهلك', he: 'הגנת הצרכן', ja: '消費者保護', ko: '소비자보호', zh: '消费者保护',
      },
    ],
    [
      'järnväg',
      {
        sv: 'järnväg', en: 'railway', da: 'jernbane', no: 'jernbane',
        fi: 'rautatie', de: 'Eisenbahn', fr: 'chemin de fer', es: 'ferrocarril',
        nl: 'spoorwegen', ar: 'سكة حديدية', he: 'רכבת', ja: '鉄道', ko: '철도', zh: '铁路',
      },
    ],
    [
      'bredband',
      {
        sv: 'bredband', en: 'broadband', da: 'bredbånd', no: 'bredbånd',
        fi: 'laajakaista', de: 'Breitband', fr: 'haut débit', es: 'banda ancha',
        nl: 'breedband', ar: 'نطاق عريض', he: 'פס רחב', ja: 'ブロードバンド', ko: '광대역', zh: '宽带',
      },
    ],
    [
      'statsministern',
      {
        sv: 'statsministern', en: 'the Prime Minister', da: 'statsministeren', no: 'statsministeren',
        fi: 'pääministeri', de: 'der Ministerpräsident', fr: 'le Premier ministre', es: 'el Primer ministro',
        nl: 'de minister-president', ar: 'رئيس الوزراء', he: 'ראש הממשלה',
        ja: '首相', ko: '총리', zh: '首相',
      },
    ],
    [
      'majoritet',
      {
        sv: 'majoritet', en: 'majority', da: 'flertal', no: 'flertall',
        fi: 'enemmistö', de: 'Mehrheit', fr: 'majorité', es: 'mayoría',
        nl: 'meerderheid', ar: 'أغلبية', he: 'רוב', ja: '多数', ko: '다수', zh: '多数',
      },
    ],
    [
      'minoritetsregering',
      {
        sv: 'minoritetsregering', en: 'minority government', da: 'mindretalsregering',
        no: 'mindretallsregjering', fi: 'vähemmistöhallitus', de: 'Minderheitsregierung',
        fr: 'gouvernement minoritaire', es: 'gobierno en minoría', nl: 'minderheidsregering',
        ar: 'حكومة أقلية', he: 'ממשלת מיעוט', ja: '少数政府', ko: '소수정부', zh: '少数派政府',
      },
    ],
    [
      'rösträtt',
      {
        sv: 'rösträtt', en: 'right to vote', da: 'stemmeret', no: 'stemmerett',
        fi: 'äänioikeus', de: 'Wahlrecht', fr: 'droit de vote', es: 'derecho al voto',
        nl: 'stemrecht', ar: 'حق التصويت', he: 'זכות הצבעה', ja: '選挙権', ko: '선거권', zh: '投票权',
      },
    ],
    [
      'valdeltagande',
      {
        sv: 'valdeltagande', en: 'voter turnout', da: 'valgdeltagelse', no: 'valgdeltagelse',
        fi: 'äänestysaktiivisuus', de: 'Wahlbeteiligung', fr: 'participation électorale',
        es: 'participación electoral', nl: 'opkomst',
        ar: 'نسبة المشاركة', he: 'שיעור הצבעה', ja: '投票率', ko: '투표율', zh: '投票率',
      },
    ],
    [
      'valsedel',
      {
        sv: 'valsedel', en: 'ballot', da: 'stemmeseddel', no: 'stemmeseddel',
        fi: 'äänestyslippu', de: 'Stimmzettel', fr: 'bulletin de vote', es: 'papeleta',
        nl: 'stembiljet', ar: 'ورقة اقتراع', he: 'פתק הצבעה', ja: '投票用紙', ko: '투표용지', zh: '选票',
      },
    ],
    [
      'proportionellt valsystem',
      {
        sv: 'proportionellt valsystem', en: 'proportional representation',
        da: 'forholdstalsvalg', no: 'forholdstallsvalg',
        fi: 'suhteellinen vaalitapa', de: 'Verhältniswahlrecht',
        fr: 'représentation proportionnelle', es: 'representación proporcional',
        nl: 'evenredige vertegenwoordiging', ar: 'التمثيل النسبي', he: 'ייצוג יחסי',
        ja: '比例代表制', ko: '비례대표제', zh: '比例代表制',
      },
    ],
  ];

/** Pre-built dictionaries for all supported non-Swedish languages. */
const DICTIONARIES: LanguageDictionary = {};

const NON_SWEDISH_LANGUAGES: ReadonlyArray<Language> = [
  'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

// Build per-language maps by reusing the shared TERMS data for each language.
for (const lang of NON_SWEDISH_LANGUAGES) {
  DICTIONARIES[lang] = buildMap(lang, TERMS);
}

/**
 * Translate a single Swedish term to the target language using the static dictionary.
 * Matching is case-insensitive; the original case is preserved when no match is found.
 *
 * @param text - Swedish text to translate
 * @param targetLang - ISO 639-1 language code of the desired output language
 * @returns Translated text, or the original Swedish text if no translation exists
 */
export function translateTerm(text: string, targetLang: Language): string {
  if (targetLang === 'sv') return text;

  const dict = DICTIONARIES[targetLang];
  if (!dict) return text;

  const lower = text.toLowerCase();
  return dict[lower] ?? text;
}

/**
 * Attempt to translate a Swedish phrase by:
 * 1. Exact whole-string match in the dictionary
 * 2. Longest-prefix match (for phrases like "med anledning av prop. YYYY/YY:NNN ...")
 *
 * @param text - Swedish phrase
 * @param targetLang - target language
 * @returns Best available translation or original text
 */
export function translatePhrase(text: string, targetLang: Language): string {
  if (targetLang === 'sv') return text;

  const dict = DICTIONARIES[targetLang];
  if (!dict) return text;

  const lower = text.toLowerCase().trim();

  // 1. Exact match
  if (dict[lower] !== undefined) return dict[lower];

  // 2. Prefix match – find the longest dictionary key that the phrase starts with
  let bestKey = '';
  let bestTranslation = '';
  for (const [key, value] of Object.entries(dict)) {
    if (lower.startsWith(key) && key.length > bestKey.length) {
      bestKey = key;
      bestTranslation = value;
    }
  }

  if (bestKey) {
    // Append the remainder of the phrase (e.g. " 2025/26:118 Tillståndsprövning...")
    const remainder = text.slice(bestKey.length);
    return bestTranslation + remainder;
  }

  // 3. No match – return original (still Swedish, but without data-translate marker)
  return text;
}

/**
 * Process all `<span data-translate="true" lang="sv">…</span>` spans
 * remaining in an article BEFORE writing it to disk.
 *
 * - For `sv` articles: retains the original Swedish text, removes marker.
 * - For other languages: attempts dictionary lookup via translatePhrase();
 *   if no match, keeps the Swedish text unchanged but still removes the marker.
 *
 * Upstream invariant: span content has already been HTML-escaped via
 * escapeHtml(). The spans therefore never contain nested tags.
 *
 * @param html       - Full article HTML
 * @param targetLang - Target language (e.g. 'de', 'sv')
 * @returns HTML with all data-translate spans processed
 */
/**
 * Matches `<span>` elements that have both `data-translate="true"` and `lang="sv"` attributes
 * in any order.
 *
 * Capture groups:
 * 1. The full attribute string inside `<span …>` (used to strip `data-translate` while
 *    preserving `lang="sv"` and any other attributes).
 * 2. The inner HTML-safe content between the opening and closing `<span>` tags.
 *
 * Note: `escapeHtml()` is applied upstream, so the inner content may contain HTML entities
 * but no nested tags, making the non-greedy `[\s\S]*?` match safe.
 */
const TRANSLATABLE_SV_SPAN_REGEX =
  /<span\s+((?=[^>]*data-translate="true")(?=[^>]*lang="sv")[^>]*)>([\s\S]*?)<\/span>/g;

export function translateSwedishContent(html: string, targetLang: Language): string {
  // String.prototype.replace resets lastIndex on a global regex before each call,
  // so TRANSLATABLE_SV_SPAN_REGEX can be used directly without cloning.
  return html.replace(TRANSLATABLE_SV_SPAN_REGEX, (_match: string, attrs: string, inner: string): string => {
    // Remove data-translate marker but preserve all other attributes (e.g. lang="sv" for accessibility)
    const cleanedAttrs = attrs.replace(/\s*data-translate=(?:"true"|'true')/, '').trim();

    const translatedInner =
      targetLang === 'sv'
        ? inner
        : translatePhrase(inner, targetLang);

    if (cleanedAttrs.length > 0) {
      return `<span ${cleanedAttrs}>${translatedInner}</span>`;
    }
    return `<span>${translatedInner}</span>`;
  });
}

export { DICTIONARIES };
