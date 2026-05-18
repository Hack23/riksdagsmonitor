/**
 * @module Translation Dictionary — Political Terms (bucket s)
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Alphabet-bucket slice (Swedish lemma initial letter s) of
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

export const POLITICAL_TERMS_S: ReadonlyArray<PoliticalTerm> = [
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
      'skatteutgift',
      {
        sv: 'skatteutgift', en: 'tax expenditure', da: 'skatteudgift',
        no: 'skatteutgift', fi: 'verotuki', de: 'Steuerausgabe',
        fr: 'dépense fiscale', es: 'gasto fiscal', nl: 'belastinguitgave',
        ar: 'نفقات ضريبية', he: 'הוצאת מס', ja: '租税支出', ko: '조세지출', zh: '税收支出',
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
      'socialförsäkring',
      {
        sv: 'socialförsäkring', en: 'social insurance', da: 'socialforsikring',
        no: 'sosialforsikring', fi: 'sosiaalivakuutus', de: 'Sozialversicherung',
        fr: 'assurance sociale', es: 'seguro social', nl: 'sociale verzekering',
        ar: 'تأمين اجتماعي', he: 'ביטוח סוציאלי', ja: '社会保険', ko: '사회보험', zh: '社会保险',
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
      'svar',
      {
        sv: 'svar', en: 'answer', da: 'svar', no: 'svar',
        fi: 'vastaus', de: 'Antwort', fr: 'réponse', es: 'respuesta',
        nl: 'antwoord', ar: 'جواب', he: 'תשובה', ja: '回答', ko: '답변', zh: '答复',
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
];
