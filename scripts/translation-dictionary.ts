/**
 * @module Translation Dictionary
 * @description Static translation dictionary for common Swedish parliamentary terms.
 *
 * Used by the post-processing step in generate-news-enhanced.ts to translate
 * `data-translate="true"` spans containing Swedish text into the target language.
 * Covers committee names, document type prefixes, and frequent legislative vocabulary.
 *
 * Supported languages: en, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh
 * (Swedish 'sv' articles keep original text and only have the attribute removed.)
 */

import type { Language } from './types/language.js';

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
  da: 'som svar på regjeringsmeddelelse',
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
function buildMap(lang: Language): TranslationMap {
  /* eslint-disable @typescript-eslint/naming-convention */
  const terms: Array<[string, Record<Language, string>]> = [
    // ---- Document type prefixes ----
    ['med anledning av prop.', motionResponsePropPrefix],
    ['med anledning av skr.', motionResponseSkrPrefix],
    // ---- Swedish parliamentary institution names ----
    [
      'riksdagen',
      {
        sv: 'riksdagen', en: 'the Riksdag', da: 'Riksdag', no: 'Riksdag',
        fi: 'Riksdag', de: 'Riksdag', fr: 'le Riksdag', es: 'el Riksdag',
        nl: 'de Riksdag', ar: 'البرلمان السويدي', he: 'הריקסדאג',
        ja: 'スウェーデン国会', ko: '스웨덴 의회', zh: '瑞典议会',
      },
    ],
    [
      'regeringen',
      {
        sv: 'regeringen', en: 'the Government', da: 'regeringen', no: 'regjeringen',
        fi: 'hallitus', de: 'die Regierung', fr: 'le gouvernement', es: 'el gobierno',
        nl: 'de regering', ar: 'الحكومة', he: 'הממשלה',
        ja: '政府', ko: '정부', zh: '政府',
      },
    ],
    // ---- Committee names ----
    [
      'arbetsmarknadsutskottet',
      {
        sv: 'arbetsmarknadsutskottet', en: 'Committee on Labour Market Affairs',
        da: 'Arbejdsmarkedsudvalget', no: 'Arbeidsmarkedskomiteen',
        fi: 'Työvaliokunta', de: 'Ausschuss für Arbeitsmarktangelegenheiten',
        fr: 'Comité du marché du travail', es: 'Comité de Mercado Laboral',
        nl: 'Commissie voor Arbeidsmarktzaken', ar: 'لجنة سوق العمل',
        he: 'ועדת שוק העבודה', ja: '労働市場委員会', ko: '노동시장위원회', zh: '劳动市场委员会',
      },
    ],
    [
      'civilutskottet',
      {
        sv: 'civilutskottet', en: 'Committee on Civil Affairs',
        da: 'Civiludvalget', no: 'Sivilkomiteen', fi: 'Siviiliasioiden valiokunta',
        de: 'Ausschuss für Zivilrecht', fr: 'Comité des affaires civiles',
        es: 'Comité de Asuntos Civiles', nl: 'Commissie voor Burgerlijke Zaken',
        ar: 'لجنة الشؤون المدنية', he: 'ועדת ענייני אזרחות',
        ja: '市民問題委員会', ko: '민사문제위원회', zh: '民事委员会',
      },
    ],
    [
      'finansutskottet',
      {
        sv: 'finansutskottet', en: 'Committee on Finance',
        da: 'Finansudvalget', no: 'Finanskomiteen', fi: 'Valtiovarainvaliokunta',
        de: 'Finanzausschuss', fr: 'Comité des finances',
        es: 'Comité de Finanzas', nl: 'Financiëncommissie',
        ar: 'لجنة المالية', he: 'ועדת האוצר',
        ja: '財政委員会', ko: '재정위원회', zh: '财政委员会',
      },
    ],
    [
      'försvarsutskottet',
      {
        sv: 'försvarsutskottet', en: 'Committee on Defence',
        da: 'Forsvarsudvalget', no: 'Forsvarskomiteen', fi: 'Puolustusvaliokunta',
        de: 'Verteidigungsausschuss', fr: 'Comité de la défense',
        es: 'Comité de Defensa', nl: 'Defensiecommissie',
        ar: 'لجنة الدفاع', he: 'ועדת הביטחון', ja: '防衛委員会', ko: '방위위원회', zh: '国防委员会',
      },
    ],
    [
      'justitieutskottet',
      {
        sv: 'justitieutskottet', en: 'Committee on Justice',
        da: 'Retsudvalget', no: 'Justiskomiteen', fi: 'Lakivaliokunta',
        de: 'Rechtsausschuss', fr: 'Comité de justice',
        es: 'Comité de Justicia', nl: 'Justitiecommissie',
        ar: 'لجنة العدل', he: 'ועדת המשפטים', ja: '司法委員会', ko: '법무위원회', zh: '司法委员会',
      },
    ],
    [
      'konstitutionsutskottet',
      {
        sv: 'konstitutionsutskottet', en: 'Committee on the Constitution',
        da: 'Forfatningsudvalget', no: 'Konstitusjonskommiteen', fi: 'Perustuslakivaliokunta',
        de: 'Verfassungsausschuss', fr: 'Comité de la Constitution',
        es: 'Comité Constitucional', nl: 'Grondwetcommissie',
        ar: 'لجنة الدستور', he: 'ועדת החוקה', ja: '憲法委員会', ko: '헌법위원회', zh: '宪法委员会',
      },
    ],
    [
      'kulturutskottet',
      {
        sv: 'kulturutskottet', en: 'Committee on Cultural Affairs',
        da: 'Kulturudvalget', no: 'Kulturkomiteen', fi: 'Kulttuurivaliokunta',
        de: 'Kulturausschuss', fr: 'Comité de la culture',
        es: 'Comité de Cultura', nl: 'Cultuurcommissie',
        ar: 'لجنة الثقافة', he: 'ועדת התרבות', ja: '文化委員会', ko: '문화위원회', zh: '文化委员会',
      },
    ],
    [
      'miljö- och jordbruksutskottet',
      {
        sv: 'miljö- och jordbruksutskottet', en: 'Committee on Environment and Agriculture',
        da: 'Miljø- og Landbrugsudvalget', no: 'Miljø- og Landbrukskomiteen',
        fi: 'Ympäristö- ja maatalousvaliokunta',
        de: 'Ausschuss für Umwelt und Landwirtschaft',
        fr: 'Comité de l\'environnement et de l\'agriculture',
        es: 'Comité de Medio Ambiente y Agricultura',
        nl: 'Commissie voor Milieu en Landbouw',
        ar: 'لجنة البيئة والزراعة', he: 'ועדת הסביבה והחקלאות',
        ja: '環境農業委員会', ko: '환경농업위원회', zh: '环境农业委员会',
      },
    ],
    [
      'näringsutskottet',
      {
        sv: 'näringsutskottet', en: 'Committee on Industry and Trade',
        da: 'Erhvervsudvalget', no: 'Næringskommiteen', fi: 'Talousvaliokunta',
        de: 'Ausschuss für Wirtschaft und Handel', fr: 'Comité de l\'industrie et du commerce',
        es: 'Comité de Industria y Comercio', nl: 'Commissie voor Industrie en Handel',
        ar: 'لجنة الصناعة والتجارة', he: 'ועדת התעשייה והמסחר',
        ja: '産業貿易委員会', ko: '산업통상위원회', zh: '工业贸易委员会',
      },
    ],
    [
      'skatteutskottet',
      {
        sv: 'skatteutskottet', en: 'Committee on Taxation',
        da: 'Skatteudvalget', no: 'Skattekommiteen', fi: 'Verovaliokunta',
        de: 'Steuerausschuss', fr: 'Comité de la fiscalité',
        es: 'Comité Fiscal', nl: 'Belastingcommissie',
        ar: 'لجنة الضرائب', he: 'ועדת המיסים', ja: '税制委員会', ko: '세금위원회', zh: '税务委员会',
      },
    ],
    [
      'socialförsäkringsutskottet',
      {
        sv: 'socialförsäkringsutskottet', en: 'Committee on Social Insurance',
        da: 'Socialforsikringsudvalget', no: 'Sosialforsikringskomiteen',
        fi: 'Sosiaalivakuutusvaliokunta',
        de: 'Ausschuss für Sozialversicherung', fr: 'Comité de l\'assurance sociale',
        es: 'Comité de Seguro Social', nl: 'Commissie voor Sociale Verzekering',
        ar: 'لجنة التأمين الاجتماعي', he: 'ועדת הביטוח הסוציאלי',
        ja: '社会保険委員会', ko: '사회보험위원회', zh: '社会保险委员会',
      },
    ],
    [
      'socialutskottet',
      {
        sv: 'socialutskottet', en: 'Committee on Social Affairs',
        da: 'Socialudvalget', no: 'Sosialkomiteen', fi: 'Sosiaaliasioiden valiokunta',
        de: 'Sozialausschuss', fr: 'Comité des affaires sociales',
        es: 'Comité de Asuntos Sociales', nl: 'Sociale Commissie',
        ar: 'لجنة الشؤون الاجتماعية', he: 'ועדת הרווחה',
        ja: '社会問題委員会', ko: '사회문제위원회', zh: '社会事务委员会',
      },
    ],
    [
      'trafikutskottet',
      {
        sv: 'trafikutskottet', en: 'Committee on Transport',
        da: 'Trafikudvalget', no: 'Transportkomiteen', fi: 'Liikennevaliokunta',
        de: 'Verkehrsausschuss', fr: 'Comité des transports',
        es: 'Comité de Transporte', nl: 'Transportcommissie',
        ar: 'لجنة المواصلات', he: 'ועדת התחבורה', ja: '交通委員会', ko: '교통위원회', zh: '交通委员会',
      },
    ],
    [
      'utbildningsutskottet',
      {
        sv: 'utbildningsutskottet', en: 'Committee on Education',
        da: 'Uddannelsesudvalget', no: 'Utdanningskomiteen', fi: 'Koulutusvaliokunta',
        de: 'Bildungsausschuss', fr: 'Comité de l\'éducation',
        es: 'Comité de Educación', nl: 'Onderwijscommissie',
        ar: 'لجنة التعليم', he: 'ועדת החינוך', ja: '教育委員会', ko: '교육위원회', zh: '教育委员会',
      },
    ],
    [
      'utrikesutskottet',
      {
        sv: 'utrikesutskottet', en: 'Committee on Foreign Affairs',
        da: 'Udenrigsudvalget', no: 'Utenrikskomiteen', fi: 'Ulkoasiainvaliokunta',
        de: 'Außenpolitischer Ausschuss', fr: 'Comité des affaires étrangères',
        es: 'Comité de Asuntos Exteriores', nl: 'Commissie voor Buitenlandse Zaken',
        ar: 'لجنة الشؤون الخارجية', he: 'ועדת החוץ',
        ja: '外務委員会', ko: '외무위원회', zh: '外交委员会',
      },
    ],
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
  ];
  /* eslint-enable @typescript-eslint/naming-convention */

  const map: TranslationMap = {};
  for (const [swedish, translations] of terms) {
    const translation = translations[lang];
    if (translation && translation !== swedish) {
      map[swedish.toLowerCase()] = translation;
    }
  }
  return map;
}

/** Pre-built dictionaries for all supported non-Swedish languages. */
const DICTIONARIES: LanguageDictionary = {};

const NON_SWEDISH_LANGUAGES: ReadonlyArray<Language> = [
  'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

for (const lang of NON_SWEDISH_LANGUAGES) {
  DICTIONARIES[lang] = buildMap(lang);
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
export function translateSwedishContent(html: string, targetLang: string): string {
  // Match both attribute orderings:
  // <span data-translate="true" lang="sv">...</span>
  // <span lang="sv" data-translate="true">...</span>
  const spanRe = /<span\s+(?=[^>]*data-translate="true")(?=[^>]*lang="sv")[^>]*>([\s\S]*?)<\/span>/g;

  return html.replace(spanRe, (_match: string, inner: string) => {
    if (targetLang === 'sv') {
      // Swedish articles: keep text in a bare lang="sv" span (accessibility), remove data-translate marker
      return `<span lang="sv">${inner}</span>`;
    }
    // Non-Swedish: try phrase translation (handles prefixes like "med anledning av prop.")
    const translated = translatePhrase(inner, targetLang as Language);
    // translatePhrase returns original text when no match, so always use its result
    return translated;
  });
}

export { DICTIONARIES };
