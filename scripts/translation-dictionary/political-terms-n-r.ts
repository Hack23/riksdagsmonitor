/**
 * @module Translation Dictionary — Political Terms (bucket n-r)
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Alphabet-bucket slice (Swedish lemma initial letter n-r) of
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

export const POLITICAL_TERMS_N_R: ReadonlyArray<PoliticalTerm> = [
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
      'ordförandeskap',
      {
        sv: 'ordförandeskap', en: 'presidency', da: 'formandskab', no: 'formannskap',
        fi: 'puheenjohtajuus', de: 'Vorsitz', fr: 'présidence', es: 'presidencia',
        nl: 'voorzitterschap', ar: 'رئاسة', he: 'נשיאות', ja: '議長国', ko: '의장국', zh: '轮值主席国',
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
      'protokoll',
      {
        sv: 'protokoll', en: 'minutes', da: 'protokol', no: 'protokoll',
        fi: 'pöytäkirja', de: 'Protokoll', fr: 'procès-verbal', es: 'acta',
        nl: 'notulen', ar: 'محضر', he: 'פרוטוקול', ja: '議事録', ko: '의사록', zh: '会议记录',
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
      'region',
      {
        sv: 'region', en: 'region', da: 'region', no: 'region',
        fi: 'alue', de: 'Region', fr: 'région', es: 'región',
        nl: 'regio', ar: 'منطقة', he: 'אזור', ja: '地域', ko: '지역', zh: '地区',
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
    [
      'reservation',
      {
        sv: 'reservation', en: 'reservation', da: 'reservation', no: 'reservasjon',
        fi: 'varaus', de: 'Vorbehalt', fr: 'réserve', es: 'reserva',
        nl: 'voorbehoud', ar: 'تحفظ', he: 'הסתייגות', ja: '留保', ko: '유보', zh: '保留意见',
      },
    ],
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
      'riksgälden',
      {
        sv: 'riksgälden', en: 'Swedish National Debt Office', da: 'Riksgælden',
        no: 'Riksgjelden', fi: 'Valtiokonttori', de: 'Schwedische Reichsschuldenverwaltung',
        fr: 'Office de la dette publique suédoise', es: 'Oficina de Deuda Nacional sueca',
        nl: 'Zweedse Rijksschuld', ar: 'مكتب الدين العام السويدي',
        he: 'משרד החוב הלאומי השבדי', ja: 'スウェーデン国債局', ko: '스웨덴 국가부채국', zh: '瑞典国债局',
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
      'rättsväsende',
      {
        sv: 'rättsväsende', en: 'judiciary', da: 'retsvæsen', no: 'rettsvesen',
        fi: 'oikeuslaitos', de: 'Justizwesen', fr: 'système judiciaire',
        es: 'sistema judicial', nl: 'rechterlijke macht',
        ar: 'الجهاز القضائي', he: 'מערכת המשפט', ja: '司法制度', ko: '사법부', zh: '司法机构',
      },
    ],
];
