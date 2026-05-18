/**
 * @module Translation Dictionary — Political Terms (bucket g-m)
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Alphabet-bucket slice (Swedish lemma initial letter g-m) of
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

export const POLITICAL_TERMS_G_M: ReadonlyArray<PoliticalTerm> = [
    [
      'granskning',
      {
        sv: 'granskning', en: 'review', da: 'gennemgang', no: 'gjennomgang',
        fi: 'tarkastus', de: 'Überprüfung', fr: 'examen', es: 'revisión',
        nl: 'beoordeling', ar: 'مراجعة', he: 'ביקורת', ja: '審査', ko: '심사', zh: '审查',
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
      'kammaren',
      {
        sv: 'kammaren', en: 'the Chamber', da: 'kammeret', no: 'kammeret',
        fi: 'istuntosali', de: 'die Kammer', fr: 'la Chambre', es: 'la Cámara',
        nl: 'de Kamer', ar: 'الغرفة', he: 'האולם', ja: '議場', ko: '본회의장', zh: '议会厅',
      },
    ],
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
    [
      'grundlag',
      {
        sv: 'grundlag', en: 'constitution', da: 'grundlov', no: 'grunnlov',
        fi: 'perustuslaki', de: 'Verfassung', fr: 'constitution', es: 'constitución',
        nl: 'grondwet', ar: 'دستور', he: 'חוקה', ja: '憲法', ko: '헌법', zh: '宪法',
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
      'jordbruk',
      {
        sv: 'jordbruk', en: 'agriculture', da: 'landbrug', no: 'landbruk',
        fi: 'maatalous', de: 'Landwirtschaft', fr: 'agriculture', es: 'agricultura',
        nl: 'landbouw', ar: 'زراعة', he: 'חקלאות', ja: '農業', ko: '농업', zh: '农业',
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
];
