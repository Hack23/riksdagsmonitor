/**
 * @module Translation Dictionary — Political Terms (bucket n-s)
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Alphabet-bucket slice (Swedish lemma initial letter n-s) of
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

export const POLITICAL_TERMS_N_S: ReadonlyArray<PoliticalTerm> = [
    [
      'reservation',
      {
        sv: 'reservation', en: 'reservation', da: 'reservation', no: 'reservasjon',
        fi: 'varaus', de: 'Vorbehalt', fr: 'réserve', es: 'reserva',
        nl: 'voorbehoud', ar: 'تحفظ', he: 'הסתייגות', ja: '留保', ko: '유보', zh: '保留意见',
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
      'skatteutgift',
      {
        sv: 'skatteutgift', en: 'tax expenditure', da: 'skatteudgift',
        no: 'skatteutgift', fi: 'verotuki', de: 'Steuerausgabe',
        fr: 'dépense fiscale', es: 'gasto fiscal', nl: 'belastinguitgave',
        ar: 'نفقات ضريبية', he: 'הוצאת מס', ja: '租税支出', ko: '조세지출', zh: '税收支出',
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
      'replik',
      {
        sv: 'replik', en: 'reply', da: 'replik', no: 'replikk',
        fi: 'vastapuheenvuoro', de: 'Erwiderung', fr: 'réplique', es: 'réplica',
        nl: 'repliek', ar: 'رد', he: 'תשובה', ja: '反論', ko: '반론', zh: '回应',
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
      'region',
      {
        sv: 'region', en: 'region', da: 'region', no: 'region',
        fi: 'alue', de: 'Region', fr: 'région', es: 'región',
        nl: 'regio', ar: 'منطقة', he: 'אזור', ja: '地域', ko: '지역', zh: '地区',
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
      'näringsliv',
      {
        sv: 'näringsliv', en: 'business', da: 'erhvervsliv', no: 'næringsliv',
        fi: 'elinkeinoelämä', de: 'Wirtschaft', fr: 'secteur privé', es: 'sector empresarial',
        nl: 'bedrijfsleven', ar: 'قطاع الأعمال', he: 'מגזר עסקי',
        ja: '産業界', ko: '산업계', zh: '商业',
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
      'pension',
      {
        sv: 'pension', en: 'pension', da: 'pension', no: 'pensjon',
        fi: 'eläke', de: 'Rente', fr: 'pension', es: 'pensión',
        nl: 'pensioen', ar: 'معاش', he: 'פנסיה', ja: '年金', ko: '연금', zh: '养老金',
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
      'socialpolitik',
      {
        sv: 'socialpolitik', en: 'social policy', da: 'socialpolitik',
        no: 'sosialpolitikk', fi: 'sosiaalipolitiikka', de: 'Sozialpolitik',
        fr: 'politique sociale', es: 'política social', nl: 'sociaal beleid',
        ar: 'سياسة اجتماعية', he: 'מדיניות חברתית',
        ja: '社会政策', ko: '사회정책', zh: '社会政策',
      },
    ],
];
