/**
 * @module Translation Dictionary — Party and Ministry Names
 * @description Swedish political party names and ministry names
 * for all 14 supported languages.
 *
 * Split from translation-dictionary.ts for maintainability.
 * Imported and combined in translation-dictionary.ts.
 */

import type { Language } from './types/language.js';

/**
 * Swedish ministry names and political party group names.
 * Each entry: [Swedish term, per-language translations].
 */
export const PARTY_NAME_TERMS: ReadonlyArray<readonly [string, Record<Language, string>]> = [
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
];
