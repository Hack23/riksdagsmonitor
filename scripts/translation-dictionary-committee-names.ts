/**
 * @module Translation Dictionary — Committee Names
 * @description Committee names and Swedish parliamentary institution names
 * for all 14 supported languages.
 *
 * Split from translation-dictionary.ts for maintainability.
 * Imported and combined in translation-dictionary.ts.
 */

import type { Language } from './types/language.js';

/**
 * Swedish parliamentary institution names and committee names.
 * Each entry: [Swedish term, per-language translations].
 */
export const COMMITTEE_NAME_TERMS: ReadonlyArray<readonly [string, Record<Language, string>]> = [
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
];
