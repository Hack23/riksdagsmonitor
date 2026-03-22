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
function buildMap(lang: Language): TranslationMap {
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
        da: 'Forfatningsudvalget', no: 'Konstitusjonskomiteen', fi: 'Perustuslakivaliokunta',
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
        da: 'Erhvervsudvalget', no: 'Næringskomiteen', fi: 'Talousvaliokunta',
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
        da: 'Skatteudvalget', no: 'Skattekomiteen', fi: 'Verovaliokunta',
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
    // ---- Swedish Ministry names (11 ministries) ----
    [
      'finansdepartementet',
      {
        sv: 'finansdepartementet', en: 'Ministry of Finance', da: 'Finansministeriet',
        no: 'Finansdepartementet', fi: 'Valtiovarainministeriö', de: 'Finanzministerium',
        fr: 'Ministère des Finances', es: 'Ministerio de Hacienda',
        nl: 'Ministerie van Financiën', ar: 'وزارة المالية', he: 'משרד האוצר',
        ja: '財務省', ko: '재무부', zh: '财政部',
      },
    ],
    [
      'justitiedepartementet',
      {
        sv: 'justitiedepartementet', en: 'Ministry of Justice', da: 'Justitsministeriet',
        no: 'Justisdepartementet', fi: 'Oikeusministeriö', de: 'Justizministerium',
        fr: 'Ministère de la Justice', es: 'Ministerio de Justicia',
        nl: 'Ministerie van Justitie', ar: 'وزارة العدل', he: 'משרד המשפטים',
        ja: '法務省', ko: '법무부', zh: '司法部',
      },
    ],
    [
      'utrikesdepartementet',
      {
        sv: 'utrikesdepartementet', en: 'Ministry for Foreign Affairs', da: 'Udenrigsministeriet',
        no: 'Utenriksdepartementet', fi: 'Ulkoministeriö', de: 'Außenministerium',
        fr: 'Ministère des Affaires étrangères', es: 'Ministerio de Asuntos Exteriores',
        nl: 'Ministerie van Buitenlandse Zaken', ar: 'وزارة الخارجية', he: 'משרד החוץ',
        ja: '外務省', ko: '외교부', zh: '外交部',
      },
    ],
    [
      'försvarsdepartementet',
      {
        sv: 'försvarsdepartementet', en: 'Ministry of Defence', da: 'Forsvarsministeriet',
        no: 'Forsvarsdepartementet', fi: 'Puolustusministeriö', de: 'Verteidigungsministerium',
        fr: 'Ministère de la Défense', es: 'Ministerio de Defensa',
        nl: 'Ministerie van Defensie', ar: 'وزارة الدفاع', he: 'משרד הביטחון',
        ja: '防衛省', ko: '국방부', zh: '国防部',
      },
    ],
    [
      'socialdepartementet',
      {
        sv: 'socialdepartementet', en: 'Ministry of Health and Social Affairs',
        da: 'Socialministeriet', no: 'Sosialdepartementet', fi: 'Sosiaali- ja terveysministeriö',
        de: 'Ministerium für Gesundheit und Soziales', fr: 'Ministère de la Santé et des Affaires sociales',
        es: 'Ministerio de Salud y Asuntos Sociales', nl: 'Ministerie van Volksgezondheid en Sociale Zaken',
        ar: 'وزارة الصحة والشؤون الاجتماعية', he: 'משרד הבריאות והרווחה',
        ja: '保健社会省', ko: '보건사회부', zh: '卫生和社会事务部',
      },
    ],
    [
      'utbildningsdepartementet',
      {
        sv: 'utbildningsdepartementet', en: 'Ministry of Education and Research',
        da: 'Uddannelsesministeriet', no: 'Utdanningsdepartementet',
        fi: 'Opetus- ja kulttuuriministeriö', de: 'Ministerium für Bildung und Forschung',
        fr: 'Ministère de l\'Éducation et de la Recherche', es: 'Ministerio de Educación e Investigación',
        nl: 'Ministerie van Onderwijs en Onderzoek', ar: 'وزارة التعليم والبحث العلمي',
        he: 'משרד החינוך והמחקר', ja: '教育研究省', ko: '교육연구부', zh: '教育研究部',
      },
    ],
    [
      'miljödepartementet',
      {
        sv: 'miljödepartementet', en: 'Ministry of Climate and Enterprise',
        da: 'Miljøministeriet', no: 'Miljødepartementet', fi: 'Ympäristöministeriö',
        de: 'Ministerium für Klima und Wirtschaft', fr: 'Ministère du Climat et de l\'Entreprise',
        es: 'Ministerio de Clima y Empresa', nl: 'Ministerie van Klimaat en Onderneming',
        ar: 'وزارة المناخ والأعمال', he: 'משרד האקלים והיזמות',
        ja: '気候企業省', ko: '기후기업부', zh: '气候和企业部',
      },
    ],
    [
      'näringsdepartementet',
      {
        sv: 'näringsdepartementet', en: 'Ministry of Enterprise and Innovation',
        da: 'Erhvervsministeriet', no: 'Næringsdepartementet', fi: 'Työ- ja elinkeinoministeriö',
        de: 'Ministerium für Wirtschaft und Innovation', fr: 'Ministère de l\'Entreprise et de l\'Innovation',
        es: 'Ministerio de Empresa e Innovación', nl: 'Ministerie van Economische Zaken',
        ar: 'وزارة المؤسسات والابتكار', he: 'משרד הכלכלה והחדשנות',
        ja: '企業革新省', ko: '기업혁신부', zh: '企业创新部',
      },
    ],
    [
      'kulturdepartementet',
      {
        sv: 'kulturdepartementet', en: 'Ministry of Culture', da: 'Kulturministeriet',
        no: 'Kulturdepartementet', fi: 'Kulttuuriministeriö', de: 'Kulturministerium',
        fr: 'Ministère de la Culture', es: 'Ministerio de Cultura',
        nl: 'Ministerie van Cultuur', ar: 'وزارة الثقافة', he: 'משרד התרבות',
        ja: '文化省', ko: '문화부', zh: '文化部',
      },
    ],
    [
      'infrastrukturdepartementet',
      {
        sv: 'infrastrukturdepartementet', en: 'Ministry of Infrastructure',
        da: 'Infrastrukturministeriet', no: 'Infrastrukturdepartementet',
        fi: 'Infrastruktuuriministeriö', de: 'Infrastrukturministerium',
        fr: 'Ministère de l\'Infrastructure', es: 'Ministerio de Infraestructura',
        nl: 'Ministerie van Infrastructuur', ar: 'وزارة البنية التحتية',
        he: 'משרד התשתיות', ja: 'インフラ省', ko: '인프라부', zh: '基础设施部',
      },
    ],
    [
      'arbetsmarknadsdepartementet',
      {
        sv: 'arbetsmarknadsdepartementet', en: 'Ministry of Employment',
        da: 'Beskæftigelsesministeriet', no: 'Arbeids- og inkluderingsdepartementet',
        fi: 'Työministeriö', de: 'Arbeitsministerium', fr: 'Ministère de l\'Emploi',
        es: 'Ministerio de Empleo', nl: 'Ministerie van Werkgelegenheid',
        ar: 'وزارة العمل', he: 'משרד העבודה', ja: '雇用省', ko: '고용부', zh: '就业部',
      },
    ],
    // ---- Swedish political party group names (8 parliamentary parties) ----
    [
      'socialdemokraterna',
      {
        sv: 'Socialdemokraterna', en: 'Social Democrats', da: 'Socialdemokraterne',
        no: 'Sosialdemokratene', fi: 'Sosiaalidemokraatit', de: 'Sozialdemokraten',
        fr: 'Sociaux-démocrates', es: 'Socialdemócratas', nl: 'Sociaaldemocraten',
        ar: 'الاشتراكيون الديمقراطيون', he: 'סוציאל-דמוקרטים',
        ja: '社会民主党', ko: '사회민주당', zh: '社会民主党',
      },
    ],
    [
      'moderaterna',
      {
        sv: 'Moderaterna', en: 'Moderate Party', da: 'Moderaterne',
        no: 'Moderatene', fi: 'Maltillinen kokoomus', de: 'Moderate Sammlungspartei',
        fr: 'Parti modéré', es: 'Partido Moderado', nl: 'Gematigde Partij',
        ar: 'حزب المحافظين', he: 'המפלגה המתונה',
        ja: '穏健党', ko: '온건당', zh: '温和党',
      },
    ],
    [
      'sverigedemokraterna',
      {
        sv: 'Sverigedemokraterna', en: 'Sweden Democrats', da: 'Sverigedemokraterne',
        no: 'Sverigedemokratene', fi: 'Ruotsidemokraatit', de: 'Schwedendemokraten',
        fr: 'Démocrates de Suède', es: 'Demócratas de Suecia', nl: 'Zweden-Democraten',
        ar: 'ديمقراطيو السويد', he: 'דמוקרטים שבדים',
        ja: 'スウェーデン民主党', ko: '스웨덴민주당', zh: '瑞典民主党',
      },
    ],
    [
      'centerpartiet',
      {
        sv: 'Centerpartiet', en: 'Centre Party', da: 'Centerpartiet',
        no: 'Senterpartiet', fi: 'Keskustapuolue', de: 'Zentrumspartei',
        fr: 'Parti du Centre', es: 'Partido de Centro', nl: 'Centrumpartij',
        ar: 'حزب الوسط', he: 'מפלגת המרכז',
        ja: '中央党', ko: '중앙당', zh: '中间党',
      },
    ],
    [
      'vänsterpartiet',
      {
        sv: 'Vänsterpartiet', en: 'Left Party', da: 'Venstrepartiet',
        no: 'Venstrepartiet', fi: 'Vasemmistopuolue', de: 'Linkspartei',
        fr: 'Parti de gauche', es: 'Partido de Izquierda', nl: 'Linkse Partij',
        ar: 'حزب اليسار', he: 'מפלגת השמאל',
        ja: '左翼党', ko: '좌파당', zh: '左翼党',
      },
    ],
    [
      'kristdemokraterna',
      {
        sv: 'Kristdemokraterna', en: 'Christian Democrats', da: 'Kristendemokraterne',
        no: 'Kristeligdemokratene', fi: 'Kristillisdemokraatit', de: 'Christdemokraten',
        fr: 'Chrétiens-démocrates', es: 'Demócratas Cristianos', nl: 'Christendemocraten',
        ar: 'الديمقراطيون المسيحيون', he: 'דמוקרטים נוצרים',
        ja: 'キリスト教民主党', ko: '기독민주당', zh: '基督教民主党',
      },
    ],
    [
      'liberalerna',
      {
        sv: 'Liberalerna', en: 'Liberals', da: 'Liberalerne',
        no: 'Liberalerne', fi: 'Liberaalit', de: 'Liberale',
        fr: 'Libéraux', es: 'Liberales', nl: 'Liberalen',
        ar: 'الليبراليون', he: 'ליברלים',
        ja: '自由党', ko: '자유당', zh: '自由党',
      },
    ],
    [
      'miljöpartiet',
      {
        sv: 'Miljöpartiet', en: 'Green Party', da: 'Miljøpartiet',
        no: 'Miljøpartiet', fi: 'Ympäristöpuolue', de: 'Grüne Partei',
        fr: 'Parti Vert', es: 'Partido Verde', nl: 'Groene Partij',
        ar: 'حزب البيئة', he: 'המפלגה הירוקה',
        ja: '緑の党', ko: '녹색당', zh: '绿党',
      },
    ],
    // ---- Parliamentary procedure terms ----
    [
      'anmälan',
      {
        sv: 'anmälan', en: 'notification', da: 'anmeldelse', no: 'anmeldelse',
        fi: 'ilmoitus', de: 'Anmeldung', fr: 'notification', es: 'notificación',
        nl: 'melding', ar: 'إخطار', he: 'הודעה', ja: '届出', ko: '신고', zh: '通知',
      },
    ],
    [
      'besvarat',
      {
        sv: 'besvarat', en: 'answered', da: 'besvaret', no: 'besvart',
        fi: 'vastattu', de: 'beantwortet', fr: 'répondu', es: 'respondido',
        nl: 'beantwoord', ar: 'تمت الإجابة', he: 'הושב', ja: '回答済み', ko: '답변됨', zh: '已答复',
      },
    ],
    [
      'granskning',
      {
        sv: 'granskning', en: 'review', da: 'gennemgang', no: 'gjennomgang',
        fi: 'tarkastus', de: 'Überprüfung', fr: 'examen', es: 'revisión',
        nl: 'beoordeling', ar: 'مراجعة', he: 'ביקורת', ja: '審査', ko: '심사', zh: '审查',
      },
    ],
    [
      'yttrande',
      {
        sv: 'yttrande', en: 'opinion', da: 'udtalelse', no: 'uttalelse',
        fi: 'lausunto', de: 'Stellungnahme', fr: 'avis', es: 'dictamen',
        nl: 'advies', ar: 'رأي', he: 'חוות דעת', ja: '意見書', ko: '의견서', zh: '意见',
      },
    ],
    [
      'bordläggning',
      {
        sv: 'bordläggning', en: 'tabling', da: 'bordlæggelse', no: 'bordlegging',
        fi: 'pöydällepano', de: 'Vertagung', fr: 'ajournement', es: 'aplazamiento',
        nl: 'verdaging', ar: 'تأجيل', he: 'דחייה', ja: '延期', ko: '보류', zh: '搁置',
      },
    ],
    [
      'tillkännagivande',
      {
        sv: 'tillkännagivande', en: 'announcement', da: 'meddelelse', no: 'kunngjøring',
        fi: 'tiedonanto', de: 'Bekanntmachung', fr: 'communication', es: 'comunicado',
        nl: 'mededeling', ar: 'إعلان', he: 'הודעה', ja: '告示', ko: '공고', zh: '公告',
      },
    ],
    [
      'reservation',
      {
        sv: 'reservation', en: 'reservation', da: 'reservation', no: 'reservasjon',
        fi: 'varaus', de: 'Vorbehalt', fr: 'réserve', es: 'reserva',
        nl: 'voorbehoud', ar: 'تحفظ', he: 'הסתייגות', ja: '留保', ko: '유보', zh: '保留意见',
      },
    ],
    [
      'avslag',
      {
        sv: 'avslag', en: 'rejection', da: 'afslag', no: 'avslag',
        fi: 'hylkäys', de: 'Ablehnung', fr: 'rejet', es: 'rechazo',
        nl: 'afwijzing', ar: 'رفض', he: 'דחייה', ja: '否決', ko: '기각', zh: '否决',
      },
    ],
    [
      'bifall',
      {
        sv: 'bifall', en: 'approval', da: 'bifald', no: 'bifall',
        fi: 'hyväksyminen', de: 'Zustimmung', fr: 'approbation', es: 'aprobación',
        nl: 'goedkeuring', ar: 'موافقة', he: 'אישור', ja: '承認', ko: '승인', zh: '批准',
      },
    ],
    [
      'sakfråga',
      {
        sv: 'sakfråga', en: 'subject matter', da: 'sagsspørgsmål', no: 'saksspørsmål',
        fi: 'asiakysymys', de: 'Sachfrage', fr: 'question de fond', es: 'cuestión de fondo',
        nl: 'zaaksvraag', ar: 'مسألة موضوعية', he: 'שאלת עניין',
        ja: '実質的事項', ko: '실질적 사항', zh: '实质问题',
      },
    ],
    [
      'ärende',
      {
        sv: 'ärende', en: 'matter', da: 'sag', no: 'sak',
        fi: 'asia', de: 'Angelegenheit', fr: 'affaire', es: 'asunto',
        nl: 'zaak', ar: 'شأن', he: 'עניין', ja: '案件', ko: '안건', zh: '事项',
      },
    ],
    [
      'beredning',
      {
        sv: 'beredning', en: 'preparation', da: 'forberedelse', no: 'forberedelse',
        fi: 'valmistelu', de: 'Vorbereitung', fr: 'préparation', es: 'preparación',
        nl: 'voorbereiding', ar: 'إعداد', he: 'הכנה', ja: '準備', ko: '준비', zh: '准备',
      },
    ],
    [
      'utlåtande',
      {
        sv: 'utlåtande', en: 'statement', da: 'udtalelse', no: 'uttalelse',
        fi: 'lausunto', de: 'Erklärung', fr: 'déclaration', es: 'declaración',
        nl: 'verklaring', ar: 'بيان', he: 'הצהרה', ja: '声明', ko: '성명', zh: '声明',
      },
    ],
    [
      'lagförslag',
      {
        sv: 'lagförslag', en: 'legislative proposal', da: 'lovforslag', no: 'lovforslag',
        fi: 'lakiehdotus', de: 'Gesetzesvorschlag', fr: 'proposition de loi',
        es: 'propuesta legislativa', nl: 'wetsvoorstel',
        ar: 'مقترح تشريعي', he: 'הצעת חוק', ja: '法案', ko: '법률안', zh: '立法提案',
      },
    ],
    [
      'lagstiftning',
      {
        sv: 'lagstiftning', en: 'legislation', da: 'lovgivning', no: 'lovgivning',
        fi: 'lainsäädäntö', de: 'Gesetzgebung', fr: 'législation', es: 'legislación',
        nl: 'wetgeving', ar: 'تشريع', he: 'חקיקה', ja: '立法', ko: '입법', zh: '立法',
      },
    ],
    [
      'sammanträde',
      {
        sv: 'sammanträde', en: 'meeting', da: 'møde', no: 'møte',
        fi: 'kokous', de: 'Sitzung', fr: 'réunion', es: 'reunión',
        nl: 'vergadering', ar: 'اجتماع', he: 'ישיבה', ja: '会議', ko: '회의', zh: '会议',
      },
    ],
    [
      'protokoll',
      {
        sv: 'protokoll', en: 'minutes', da: 'protokol', no: 'protokoll',
        fi: 'pöytäkirja', de: 'Protokoll', fr: 'procès-verbal', es: 'acta',
        nl: 'notulen', ar: 'محضر', he: 'פרוטוקול', ja: '議事録', ko: '의사록', zh: '会议记录',
      },
    ],
    [
      'anförande',
      {
        sv: 'anförande', en: 'speech', da: 'tale', no: 'innlegg',
        fi: 'puheenvuoro', de: 'Rede', fr: 'discours', es: 'discurso',
        nl: 'toespraak', ar: 'خطاب', he: 'נאום', ja: '演説', ko: '연설', zh: '演讲',
      },
    ],
    [
      'kammaren',
      {
        sv: 'kammaren', en: 'the Chamber', da: 'kammeret', no: 'kammeret',
        fi: 'istuntosali', de: 'die Kammer', fr: 'la Chambre', es: 'la Cámara',
        nl: 'de Kamer', ar: 'الغرفة', he: 'האולם', ja: '議場', ko: '본회의장', zh: '议会厅',
      },
    ],
    [
      'talman',
      {
        sv: 'talman', en: 'Speaker', da: 'formand', no: 'stortingspresident',
        fi: 'puhemies', de: 'Parlamentspräsident', fr: 'Président du Parlement',
        es: 'Presidente del Parlamento', nl: 'Parlementsvoorzitter',
        ar: 'رئيس البرلمان', he: 'יושב ראש הפרלמנט', ja: '議長', ko: '의장', zh: '议长',
      },
    ],
    [
      'vice talman',
      {
        sv: 'vice talman', en: 'Deputy Speaker', da: 'næstformand',
        no: 'visepresident', fi: 'varapuhemies', de: 'Vizepräsident',
        fr: 'Vice-président du Parlement', es: 'Vicepresidente del Parlamento',
        nl: 'Vicevoorzitter', ar: 'نائب رئيس البرلمان', he: 'סגן יושב ראש',
        ja: '副議長', ko: '부의장', zh: '副议长',
      },
    ],
    // ---- Budget and fiscal terms ----
    [
      'anslag',
      {
        sv: 'anslag', en: 'appropriation', da: 'bevilling', no: 'bevilgning',
        fi: 'määräraha', de: 'Bewilligung', fr: 'crédit budgétaire', es: 'asignación',
        nl: 'begrotingspost', ar: 'اعتماد مالي', he: 'הקצבה',
        ja: '歳出', ko: '세출', zh: '拨款',
      },
    ],
    [
      'utgiftsområde',
      {
        sv: 'utgiftsområde', en: 'expenditure area', da: 'udgiftsområde',
        no: 'utgiftsområde', fi: 'menolaji', de: 'Ausgabenbereich',
        fr: 'domaine de dépenses', es: 'área de gasto', nl: 'uitgavengebied',
        ar: 'مجال الإنفاق', he: 'תחום הוצאה', ja: '歳出分野', ko: '지출분야', zh: '支出领域',
      },
    ],
    [
      'rambeslutet',
      {
        sv: 'rambeslutet', en: 'the framework decision', da: 'rammebeslutningen',
        no: 'rammevedtaket', fi: 'kehyspäätös', de: 'der Rahmenbeschluss',
        fr: 'la décision-cadre', es: 'la decisión marco', nl: 'het kaderbesluit',
        ar: 'القرار الإطاري', he: 'ההחלטה המסגרתית',
        ja: '枠組み決定', ko: '기본결정', zh: '框架决定',
      },
    ],
    [
      'utgiftstak',
      {
        sv: 'utgiftstak', en: 'expenditure ceiling', da: 'udgiftsloft',
        no: 'utgiftstak', fi: 'menokatto', de: 'Ausgabenobergrenze',
        fr: 'plafond de dépenses', es: 'techo de gasto', nl: 'uitgavenplafond',
        ar: 'سقف الإنفاق', he: 'תקרת הוצאה', ja: '歳出上限', ko: '지출한도', zh: '支出上限',
      },
    ],
    [
      'skatteutgift',
      {
        sv: 'skatteutgift', en: 'tax expenditure', da: 'skatteudgift',
        no: 'skatteutgift', fi: 'verotuki', de: 'Steuerausgabe',
        fr: 'dépense fiscale', es: 'gasto fiscal', nl: 'belastinguitgave',
        ar: 'نفقات ضريبية', he: 'הוצאת מס', ja: '租税支出', ko: '조세지출', zh: '税收支出',
      },
    ],
    [
      'budgetpropositionen',
      {
        sv: 'budgetpropositionen', en: 'the Budget Bill', da: 'finanslovsforslaget',
        no: 'budsjettproposisjonen', fi: 'talousarvioesitys', de: 'der Haushaltsentwurf',
        fr: 'le projet de loi de finances', es: 'el proyecto de presupuesto',
        nl: 'de begrotingswet', ar: 'مشروع الميزانية', he: 'הצעת התקציב',
        ja: '予算案', ko: '예산안', zh: '预算法案',
      },
    ],
    [
      'vårpropositionen',
      {
        sv: 'vårpropositionen', en: 'the Spring Fiscal Policy Bill',
        da: 'forårsforslaget', no: 'vårproposisjonen', fi: 'kevätesitys',
        de: 'der Frühjahrshaushaltsentwurf', fr: 'le projet de loi de finances de printemps',
        es: 'el proyecto de presupuesto de primavera', nl: 'de voorjaarsbegroting',
        ar: 'مشروع ميزانية الربيع', he: 'הצעת תקציב האביב',
        ja: '春季財政法案', ko: '봄 예산안', zh: '春季财政法案',
      },
    ],
    [
      'statsbudgeten',
      {
        sv: 'statsbudgeten', en: 'the central government budget', da: 'statsbudgettet',
        no: 'statsbudsjettet', fi: 'valtion talousarvio', de: 'der Staatshaushalt',
        fr: 'le budget de l\'État', es: 'el presupuesto estatal', nl: 'de rijksbegroting',
        ar: 'ميزانية الدولة', he: 'תקציב המדינה',
        ja: '国家予算', ko: '국가예산', zh: '国家预算',
      },
    ],
    [
      'finansplan',
      {
        sv: 'finansplan', en: 'fiscal policy plan', da: 'finansplan', no: 'finansplan',
        fi: 'finanssisuunnitelma', de: 'Finanzplan', fr: 'plan financier',
        es: 'plan fiscal', nl: 'financieel plan',
        ar: 'خطة مالية', he: 'תוכנית פיסקלית', ja: '財政計画', ko: '재정계획', zh: '财政计划',
      },
    ],
    [
      'riksgälden',
      {
        sv: 'riksgälden', en: 'Swedish National Debt Office', da: 'Riksgælden',
        no: 'Riksgjelden', fi: 'Valtiokonttori', de: 'Schwedische Reichsschuldenverwaltung',
        fr: 'Office de la dette publique suédoise', es: 'Oficina de Deuda Nacional sueca',
        nl: 'Zweedse Rijksschuld', ar: 'مكتب الدين العام السويدي',
        he: 'משרד החוב הלאומי השבדי', ja: 'スウェーデン国債局', ko: '스웨덴 국가부채국', zh: '瑞典国债局',
      },
    ],
    // ---- Interpellation and response terms ----
    [
      'statsråd',
      {
        sv: 'statsråd', en: 'cabinet minister', da: 'minister', no: 'statsråd',
        fi: 'ministeri', de: 'Kabinettsmitglied', fr: 'ministre du gouvernement',
        es: 'ministro del gobierno', nl: 'minister',
        ar: 'وزير في الحكومة', he: 'שר ממשלה', ja: '閣僚', ko: '각료', zh: '内阁部长',
      },
    ],
    [
      'statsrådet',
      {
        sv: 'statsrådet', en: 'the cabinet minister', da: 'ministeren', no: 'statsrådet',
        fi: 'ministeri', de: 'der Kabinettsmitglied', fr: 'le ministre',
        es: 'el ministro', nl: 'de minister',
        ar: 'الوزير', he: 'השר', ja: '閣僚', ko: '각료', zh: '部长',
      },
    ],
    [
      'skriftlig fråga',
      {
        sv: 'skriftlig fråga', en: 'written question', da: 'skriftligt spørgsmål',
        no: 'skriftlig spørsmål', fi: 'kirjallinen kysymys', de: 'schriftliche Anfrage',
        fr: 'question écrite', es: 'pregunta escrita', nl: 'schriftelijke vraag',
        ar: 'سؤال كتابي', he: 'שאלה בכתב', ja: '書面質問', ko: '서면질문', zh: '书面提问',
      },
    ],
    [
      'svar',
      {
        sv: 'svar', en: 'answer', da: 'svar', no: 'svar',
        fi: 'vastaus', de: 'Antwort', fr: 'réponse', es: 'respuesta',
        nl: 'antwoord', ar: 'جواب', he: 'תשובה', ja: '回答', ko: '답변', zh: '答复',
      },
    ],
    [
      'debattinlägg',
      {
        sv: 'debattinlägg', en: 'debate contribution', da: 'debatindlæg',
        no: 'debattinnlegg', fi: 'keskustelupuheenvuoro', de: 'Debattenbeitrag',
        fr: 'intervention dans le débat', es: 'intervención en el debate',
        nl: 'debatbijdrage', ar: 'مداخلة في النقاش', he: 'תרומה לדיון',
        ja: '討論への寄与', ko: '토론 기여', zh: '辩论发言',
      },
    ],
    [
      'replik',
      {
        sv: 'replik', en: 'reply', da: 'replik', no: 'replikk',
        fi: 'vastapuheenvuoro', de: 'Erwiderung', fr: 'réplique', es: 'réplica',
        nl: 'repliek', ar: 'رد', he: 'תשובה', ja: '反論', ko: '반론', zh: '回应',
      },
    ],
    // ---- EU and international terms ----
    [
      'ordförandeskap',
      {
        sv: 'ordförandeskap', en: 'presidency', da: 'formandskab', no: 'formannskap',
        fi: 'puheenjohtajuus', de: 'Vorsitz', fr: 'présidence', es: 'presidencia',
        nl: 'voorzitterschap', ar: 'رئاسة', he: 'נשיאות', ja: '議長国', ko: '의장국', zh: '轮值主席国',
      },
    ],
    [
      'subsidiaritetsgranskning',
      {
        sv: 'subsidiaritetsgranskning', en: 'subsidiarity review',
        da: 'subsidiaritetskontrol', no: 'subsidiaritetskontroll',
        fi: 'toissijaisuustarkastus', de: 'Subsidiaritätsprüfung',
        fr: 'contrôle de subsidiarité', es: 'control de subsidiariedad',
        nl: 'subsidiariteitstoets', ar: 'مراجعة التبعية', he: 'בדיקת סובסידיאריות',
        ja: '補完性審査', ko: '보충성 심사', zh: '辅助性审查',
      },
    ],
    [
      'europeiska unionen',
      {
        sv: 'Europeiska unionen', en: 'European Union', da: 'Den Europæiske Union',
        no: 'Den europeiske union', fi: 'Euroopan unioni', de: 'Europäische Union',
        fr: 'Union européenne', es: 'Unión Europea', nl: 'Europese Unie',
        ar: 'الاتحاد الأوروبي', he: 'האיחוד האירופי',
        ja: '欧州連合', ko: '유럽연합', zh: '欧盟',
      },
    ],
    [
      'eu-nämnden',
      {
        sv: 'EU-nämnden', en: 'Committee on EU Affairs', da: 'EU-udvalget',
        no: 'EU-komiteen', fi: 'EU-valiokunta', de: 'EU-Ausschuss',
        fr: 'Comité des affaires européennes', es: 'Comité de Asuntos de la UE',
        nl: 'EU-commissie', ar: 'لجنة شؤون الاتحاد الأوروبي',
        he: 'ועדת ענייני האיחוד האירופי', ja: 'EU委員会', ko: 'EU위원회', zh: '欧盟事务委员会',
      },
    ],
    [
      'europaparlamentet',
      {
        sv: 'Europaparlamentet', en: 'European Parliament', da: 'Europa-Parlamentet',
        no: 'Europaparlamentet', fi: 'Euroopan parlamentti', de: 'Europäisches Parlament',
        fr: 'Parlement européen', es: 'Parlamento Europeo', nl: 'Europees Parlement',
        ar: 'البرلمان الأوروبي', he: 'הפרלמנט האירופי',
        ja: '欧州議会', ko: '유럽의회', zh: '欧洲议会',
      },
    ],
    [
      'europarådet',
      {
        sv: 'Europarådet', en: 'Council of Europe', da: 'Europarådet',
        no: 'Europarådet', fi: 'Euroopan neuvosto', de: 'Europarat',
        fr: 'Conseil de l\'Europe', es: 'Consejo de Europa', nl: 'Raad van Europa',
        ar: 'مجلس أوروبا', he: 'מועצת אירופה',
        ja: '欧州評議会', ko: '유럽평의회', zh: '欧洲委员会',
      },
    ],
    [
      'nordiska rådet',
      {
        sv: 'Nordiska rådet', en: 'Nordic Council', da: 'Nordisk Råd',
        no: 'Nordisk råd', fi: 'Pohjoismaiden neuvosto', de: 'Nordischer Rat',
        fr: 'Conseil nordique', es: 'Consejo Nórdico', nl: 'Noordse Raad',
        ar: 'المجلس الشمالي', he: 'המועצה הנורדית',
        ja: '北欧理事会', ko: '북유럽이사회', zh: '北欧理事会',
      },
    ],
    // ---- Geographic and regional terms ----
    [
      'landsting',
      {
        sv: 'landsting', en: 'county council', da: 'amt', no: 'fylkesting',
        fi: 'maakäräjät', de: 'Provinzialrat', fr: 'conseil départemental',
        es: 'consejo provincial', nl: 'provinciale raad',
        ar: 'مجلس المقاطعة', he: 'מועצת המחוז', ja: '県議会', ko: '주의회', zh: '省议会',
      },
    ],
    [
      'region',
      {
        sv: 'region', en: 'region', da: 'region', no: 'region',
        fi: 'alue', de: 'Region', fr: 'région', es: 'región',
        nl: 'regio', ar: 'منطقة', he: 'אזור', ja: '地域', ko: '지역', zh: '地区',
      },
    ],
    [
      'kommunalförbund',
      {
        sv: 'kommunalförbund', en: 'municipal federation', da: 'kommuneforbund',
        no: 'kommuneforbund', fi: 'kuntayhtymä', de: 'Kommunalverband',
        fr: 'fédération de communes', es: 'federación municipal',
        nl: 'gemeentefederatie', ar: 'اتحاد بلديات', he: 'איגוד רשויות',
        ja: '市町村連合', ko: '지방자치단체연합', zh: '市政联盟',
      },
    ],
    [
      'kommun',
      {
        sv: 'kommun', en: 'municipality', da: 'kommune', no: 'kommune',
        fi: 'kunta', de: 'Gemeinde', fr: 'commune', es: 'municipio',
        nl: 'gemeente', ar: 'بلدية', he: 'עירייה', ja: '自治体', ko: '지방자치단체', zh: '市镇',
      },
    ],
    [
      'län',
      {
        sv: 'län', en: 'county', da: 'len', no: 'fylke',
        fi: 'lääni', de: 'Provinz', fr: 'comté', es: 'condado',
        nl: 'provincie', ar: 'مقاطعة', he: 'מחוז', ja: '県', ko: '주', zh: '省',
      },
    ],
    [
      'landsbygd',
      {
        sv: 'landsbygd', en: 'rural area', da: 'landdistrikt', no: 'landsbygd',
        fi: 'maaseutu', de: 'ländliches Gebiet', fr: 'zone rurale', es: 'zona rural',
        nl: 'platteland', ar: 'منطقة ريفية', he: 'אזור כפרי',
        ja: '農村地域', ko: '농촌 지역', zh: '农村地区',
      },
    ],
    // ---- Government agencies and institutions ----
    [
      'riksbanken',
      {
        sv: 'Riksbanken', en: 'Swedish Central Bank', da: 'Riksbanken',
        no: 'Riksbanken', fi: 'Ruotsin keskuspankki', de: 'Schwedische Reichsbank',
        fr: 'Banque centrale de Suède', es: 'Banco Central de Suecia',
        nl: 'Zweedse Rijksbank', ar: 'البنك المركزي السويدي', he: 'הבנק המרכזי השבדי',
        ja: 'スウェーデン国立銀行', ko: '스웨덴 중앙은행', zh: '瑞典央行',
      },
    ],
    [
      'riksrevisionen',
      {
        sv: 'Riksrevisionen', en: 'Swedish National Audit Office', da: 'Rigsrevisionen',
        no: 'Riksrevisjonen', fi: 'Ruotsin tarkastusvirasto', de: 'Schwedischer Rechnungshof',
        fr: 'Cour des comptes suédoise', es: 'Tribunal de Cuentas sueco',
        nl: 'Zweedse Rekenkamer', ar: 'ديوان المراجعة السويدي', he: 'מבקר המדינה השבדי',
        ja: 'スウェーデン会計検査院', ko: '스웨덴 감사원', zh: '瑞典审计署',
      },
    ],
    [
      'justitieombudsmannen',
      {
        sv: 'Justitieombudsmannen', en: 'Parliamentary Ombudsman', da: 'Ombudsmanden',
        no: 'Sivilombudet', fi: 'Eduskunnan oikeusasiamies', de: 'Parlamentarischer Ombudsmann',
        fr: 'Médiateur parlementaire', es: 'Defensor del Pueblo parlamentario',
        nl: 'Parlementaire Ombudsman', ar: 'أمين المظالم البرلماني', he: 'נציב הביקורת',
        ja: '議会オンブズマン', ko: '의회 옴부즈만', zh: '议会监察专员',
      },
    ],
    [
      'valmyndigheten',
      {
        sv: 'Valmyndigheten', en: 'Swedish Election Authority', da: 'Valgmyndigheden',
        no: 'Valgmyndigheten', fi: 'Ruotsin vaaliviranomainen', de: 'Schwedische Wahlbehörde',
        fr: 'Autorité électorale suédoise', es: 'Autoridad Electoral sueca',
        nl: 'Zweedse Kiesraad', ar: 'هيئة الانتخابات السويدية', he: 'רשות הבחירות השבדית',
        ja: 'スウェーデン選挙管理委員会', ko: '스웨덴 선거관리위원회', zh: '瑞典选举管理局',
      },
    ],
    [
      'myndigheten',
      {
        sv: 'myndigheten', en: 'the authority', da: 'myndigheden', no: 'myndigheten',
        fi: 'viranomainen', de: 'die Behörde', fr: 'l\'autorité', es: 'la autoridad',
        nl: 'de autoriteit', ar: 'السلطة', he: 'הרשות', ja: '当局', ko: '당국', zh: '当局',
      },
    ],
    [
      'myndighet',
      {
        sv: 'myndighet', en: 'authority', da: 'myndighed', no: 'myndighet',
        fi: 'viranomainen', de: 'Behörde', fr: 'autorité', es: 'autoridad',
        nl: 'autoriteit', ar: 'سلطة', he: 'רשות', ja: '機関', ko: '기관', zh: '机构',
      },
    ],
    // ---- Legal and constitutional terms ----
    [
      'grundlag',
      {
        sv: 'grundlag', en: 'constitution', da: 'grundlov', no: 'grunnlov',
        fi: 'perustuslaki', de: 'Verfassung', fr: 'constitution', es: 'constitución',
        nl: 'grondwet', ar: 'دستور', he: 'חוקה', ja: '憲法', ko: '헌법', zh: '宪法',
      },
    ],
    [
      'riksdagsordningen',
      {
        sv: 'riksdagsordningen', en: 'the Riksdag Act', da: 'riksdagsordningen',
        no: 'stortingsordningen', fi: 'valtiopäiväjärjestys', de: 'die Reichstagsordnung',
        fr: 'le règlement du Riksdag', es: 'el reglamento del Riksdag',
        nl: 'het Riksdag-reglement', ar: 'نظام البرلمان', he: 'חוק הריקסדאג',
        ja: '国会法', ko: '국회법', zh: '国会法',
      },
    ],
    [
      'tryckfrihet',
      {
        sv: 'tryckfrihet', en: 'freedom of the press', da: 'pressefrihed',
        no: 'pressefrihet', fi: 'painovapaus', de: 'Pressefreiheit',
        fr: 'liberté de la presse', es: 'libertad de prensa', nl: 'persvrijheid',
        ar: 'حرية الصحافة', he: 'חופש העיתונות', ja: '報道の自由', ko: '언론의 자유', zh: '新闻自由',
      },
    ],
    [
      'yttrandefrihet',
      {
        sv: 'yttrandefrihet', en: 'freedom of expression', da: 'ytringsfrihed',
        no: 'ytringsfrihet', fi: 'sananvapaus', de: 'Meinungsfreiheit',
        fr: 'liberté d\'expression', es: 'libertad de expresión', nl: 'vrijheid van meningsuiting',
        ar: 'حرية التعبير', he: 'חופש הביטוי', ja: '表現の自由', ko: '표현의 자유', zh: '言论自由',
      },
    ],
    [
      'offentlighetsprincipen',
      {
        sv: 'offentlighetsprincipen', en: 'principle of public access',
        da: 'offentlighedsprincippet', no: 'offentlighetsprinsippet',
        fi: 'julkisuusperiaate', de: 'Öffentlichkeitsprinzip',
        fr: 'principe de transparence', es: 'principio de publicidad',
        nl: 'openbaarheidsbeginsel', ar: 'مبدأ الشفافية', he: 'עקרון הגישה הציבורית',
        ja: '情報公開原則', ko: '공개원칙', zh: '信息公开原则',
      },
    ],
    [
      'förordning',
      {
        sv: 'förordning', en: 'ordinance', da: 'forordning', no: 'forskrift',
        fi: 'asetus', de: 'Verordnung', fr: 'ordonnance', es: 'ordenanza',
        nl: 'verordening', ar: 'مرسوم', he: 'תקנה', ja: '政令', ko: '시행령', zh: '法令',
      },
    ],
    [
      'direktiv',
      {
        sv: 'direktiv', en: 'directive', da: 'direktiv', no: 'direktiv',
        fi: 'direktiivi', de: 'Richtlinie', fr: 'directive', es: 'directiva',
        nl: 'richtlijn', ar: 'توجيه', he: 'הנחיה', ja: '指令', ko: '지침', zh: '指令',
      },
    ],
    // ---- Policy domain terms ----
    [
      'arbetsmarknad',
      {
        sv: 'arbetsmarknad', en: 'labour market', da: 'arbejdsmarked', no: 'arbeidsmarked',
        fi: 'työmarkkinat', de: 'Arbeitsmarkt', fr: 'marché du travail',
        es: 'mercado laboral', nl: 'arbeidsmarkt', ar: 'سوق العمل', he: 'שוק העבודה',
        ja: '労働市場', ko: '노동시장', zh: '劳动市场',
      },
    ],
    [
      'infrastruktur',
      {
        sv: 'infrastruktur', en: 'infrastructure', da: 'infrastruktur',
        no: 'infrastruktur', fi: 'infrastruktuuri', de: 'Infrastruktur',
        fr: 'infrastructure', es: 'infraestructura', nl: 'infrastructuur',
        ar: 'بنية تحتية', he: 'תשתית', ja: 'インフラ', ko: '인프라', zh: '基础设施',
      },
    ],
    [
      'näringsliv',
      {
        sv: 'näringsliv', en: 'business', da: 'erhvervsliv', no: 'næringsliv',
        fi: 'elinkeinoelämä', de: 'Wirtschaft', fr: 'secteur privé', es: 'sector empresarial',
        nl: 'bedrijfsleven', ar: 'قطاع الأعمال', he: 'מגזר עסקי',
        ja: '産業界', ko: '산업계', zh: '商业',
      },
    ],
    [
      'jordbruk',
      {
        sv: 'jordbruk', en: 'agriculture', da: 'landbrug', no: 'landbruk',
        fi: 'maatalous', de: 'Landwirtschaft', fr: 'agriculture', es: 'agricultura',
        nl: 'landbouw', ar: 'زراعة', he: 'חקלאות', ja: '農業', ko: '농업', zh: '农业',
      },
    ],
    [
      'transport',
      {
        sv: 'transport', en: 'transport', da: 'transport', no: 'transport',
        fi: 'liikenne', de: 'Verkehr', fr: 'transport', es: 'transporte',
        nl: 'vervoer', ar: 'نقل', he: 'תחבורה', ja: '交通', ko: '교통', zh: '交通',
      },
    ],
    [
      'socialförsäkring',
      {
        sv: 'socialförsäkring', en: 'social insurance', da: 'socialforsikring',
        no: 'sosialforsikring', fi: 'sosiaalivakuutus', de: 'Sozialversicherung',
        fr: 'assurance sociale', es: 'seguro social', nl: 'sociale verzekering',
        ar: 'تأمين اجتماعي', he: 'ביטוח סוציאלי', ja: '社会保険', ko: '사회보험', zh: '社会保险',
      },
    ],
    [
      'rättsväsende',
      {
        sv: 'rättsväsende', en: 'judiciary', da: 'retsvæsen', no: 'rettsvesen',
        fi: 'oikeuslaitos', de: 'Justizwesen', fr: 'système judiciaire',
        es: 'sistema judicial', nl: 'rechterlijke macht',
        ar: 'الجهاز القضائي', he: 'מערכת המשפט', ja: '司法制度', ko: '사법부', zh: '司法机构',
      },
    ],
    [
      'forskning',
      {
        sv: 'forskning', en: 'research', da: 'forskning', no: 'forskning',
        fi: 'tutkimus', de: 'Forschung', fr: 'recherche', es: 'investigación',
        nl: 'onderzoek', ar: 'بحث', he: 'מחקר', ja: '研究', ko: '연구', zh: '研究',
      },
    ],
    [
      'kultur',
      {
        sv: 'kultur', en: 'culture', da: 'kultur', no: 'kultur',
        fi: 'kulttuuri', de: 'Kultur', fr: 'culture', es: 'cultura',
        nl: 'cultuur', ar: 'ثقافة', he: 'תרבות', ja: '文化', ko: '문화', zh: '文化',
      },
    ],
    [
      'bistånd',
      {
        sv: 'bistånd', en: 'development aid', da: 'bistand', no: 'bistand',
        fi: 'kehitysapu', de: 'Entwicklungshilfe', fr: 'aide au développement',
        es: 'ayuda al desarrollo', nl: 'ontwikkelingshulp',
        ar: 'مساعدات تنمية', he: 'סיוע לפיתוח', ja: '開発援助', ko: '개발원조', zh: '发展援助',
      },
    ],
    [
      'pension',
      {
        sv: 'pension', en: 'pension', da: 'pension', no: 'pensjon',
        fi: 'eläke', de: 'Rente', fr: 'pension', es: 'pensión',
        nl: 'pensioen', ar: 'معاش', he: 'פנסיה', ja: '年金', ko: '연금', zh: '养老金',
      },
    ],
    [
      'invandring',
      {
        sv: 'invandring', en: 'immigration', da: 'indvandring', no: 'innvandring',
        fi: 'maahanmuutto', de: 'Einwanderung', fr: 'immigration', es: 'inmigración',
        nl: 'immigratie', ar: 'هجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民',
      },
    ],
    [
      'integration',
      {
        sv: 'integration', en: 'integration', da: 'integration', no: 'integrasjon',
        fi: 'integraatio', de: 'Integration', fr: 'intégration', es: 'integración',
        nl: 'integratie', ar: 'اندماج', he: 'שילוב', ja: '統合', ko: '통합', zh: '融合',
      },
    ],
    [
      'jämställdhet',
      {
        sv: 'jämställdhet', en: 'gender equality', da: 'ligestilling', no: 'likestilling',
        fi: 'tasa-arvo', de: 'Gleichstellung', fr: 'égalité des genres',
        es: 'igualdad de género', nl: 'gendergelijkheid',
        ar: 'المساواة بين الجنسين', he: 'שוויון מגדרי',
        ja: 'ジェンダー平等', ko: '성평등', zh: '性别平等',
      },
    ],
    [
      'säkerhetspolitik',
      {
        sv: 'säkerhetspolitik', en: 'security policy', da: 'sikkerhedspolitik',
        no: 'sikkerhetspolitikk', fi: 'turvallisuuspolitiikka', de: 'Sicherheitspolitik',
        fr: 'politique de sécurité', es: 'política de seguridad',
        nl: 'veiligheidsbeleid', ar: 'سياسة أمنية', he: 'מדיניות ביטחון',
        ja: '安全保障政策', ko: '안보정책', zh: '安全政策',
      },
    ],
    [
      'utrikespolitik',
      {
        sv: 'utrikespolitik', en: 'foreign policy', da: 'udenrigspolitik',
        no: 'utenrikspolitikk', fi: 'ulkopolitiikka', de: 'Außenpolitik',
        fr: 'politique étrangère', es: 'política exterior', nl: 'buitenlands beleid',
        ar: 'سياسة خارجية', he: 'מדיניות חוץ', ja: '外交政策', ko: '외교정책', zh: '外交政策',
      },
    ],
    [
      'socialpolitik',
      {
        sv: 'socialpolitik', en: 'social policy', da: 'socialpolitik',
        no: 'sosialpolitikk', fi: 'sosiaalipolitiikka', de: 'Sozialpolitik',
        fr: 'politique sociale', es: 'política social', nl: 'sociaal beleid',
        ar: 'سياسة اجتماعية', he: 'מדיניות חברתית',
        ja: '社会政策', ko: '사회정책', zh: '社会政策',
      },
    ],
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
  ];

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
