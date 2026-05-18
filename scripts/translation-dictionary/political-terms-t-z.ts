/**
 * @module Translation Dictionary — Political Terms (bucket t-z)
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Alphabet-bucket slice (Swedish lemma initial letter t-z) of
 * `POLITICAL_TERMS`. Split from the legacy single-file
 * `scripts/translation-dictionary-political-terms.ts` (737 lines) so a
 * single-term edit conflicts with only the small bucket file, not the
 * whole dictionary. Each entry is the same shape as before:
 * `[swedish_lemma, Record<Language, string>]`.
 *
 * Translation guides:
 *   - https://github.com/Hack23/homepage/blob/main/Swedish-Translation-Guide.md
 *   - https://github.com/Hack23/homepage/blob/main/Finnish-Translation-Guide.md
 *   - https://github.com/Hack23/homepage/blob/main/Korean-Translation-Guide.md
 *   - https://github.com/Hack23/homepage/blob/main/Spanish-Translation-Guide.md
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { PoliticalTerm } from './types.js';

export const POLITICAL_TERMS_T_Z: ReadonlyArray<PoliticalTerm> = [
    [
      'yttrande',
      {
        sv: 'yttrande', en: 'opinion', da: 'udtalelse', no: 'uttalelse',
        fi: 'lausunto', de: 'Stellungnahme', fr: 'avis', es: 'dictamen',
        nl: 'advies', ar: 'رأي', he: 'חוות דעת', ja: '意見書', ko: '의견서', zh: '意见',
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
      'utlåtande',
      {
        sv: 'utlåtande', en: 'statement', da: 'udtalelse', no: 'uttalelse',
        fi: 'lausunto', de: 'Erklärung', fr: 'déclaration', es: 'declaración',
        nl: 'verklaring', ar: 'بيان', he: 'הצהרה', ja: '声明', ko: '성명', zh: '声明',
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
      'utgiftstak',
      {
        sv: 'utgiftstak', en: 'expenditure ceiling', da: 'udgiftsloft',
        no: 'utgiftstak', fi: 'menokatto', de: 'Ausgabenobergrenze',
        fr: 'plafond de dépenses', es: 'techo de gasto', nl: 'uitgavenplafond',
        ar: 'سقف الإنفاق', he: 'תקרת הוצאה', ja: '歳出上限', ko: '지출한도', zh: '支出上限',
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
      'transport',
      {
        sv: 'transport', en: 'transport', da: 'transport', no: 'transport',
        fi: 'liikenne', de: 'Verkehr', fr: 'transport', es: 'transporte',
        nl: 'vervoer', ar: 'نقل', he: 'תחבורה', ja: '交通', ko: '교통', zh: '交通',
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
];
