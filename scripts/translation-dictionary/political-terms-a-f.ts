/**
 * @module Translation Dictionary — Political Terms (bucket a-f)
 * @category Intelligence Operations / Translation Tooling
 *
 * @description
 * Alphabet-bucket slice (Swedish lemma initial letter a-f) of
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

export const POLITICAL_TERMS_A_F: ReadonlyArray<PoliticalTerm> = [
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
      'bordläggning',
      {
        sv: 'bordläggning', en: 'tabling', da: 'bordlæggelse', no: 'bordlegging',
        fi: 'pöydällepano', de: 'Vertagung', fr: 'ajournement', es: 'aplazamiento',
        nl: 'verdaging', ar: 'تأجيل', he: 'דחייה', ja: '延期', ko: '보류', zh: '搁置',
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
      'anförande',
      {
        sv: 'anförande', en: 'speech', da: 'tale', no: 'innlegg',
        fi: 'puheenvuoro', de: 'Rede', fr: 'discours', es: 'discurso',
        nl: 'toespraak', ar: 'خطاب', he: 'נאום', ja: '演説', ko: '연설', zh: '演讲',
      },
    ],
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
      'finansplan',
      {
        sv: 'finansplan', en: 'fiscal policy plan', da: 'finansplan', no: 'finansplan',
        fi: 'finanssisuunnitelma', de: 'Finanzplan', fr: 'plan financier',
        es: 'plan fiscal', nl: 'financieel plan',
        ar: 'خطة مالية', he: 'תוכנית פיסקלית', ja: '財政計画', ko: '재정계획', zh: '财政计划',
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
      'forskning',
      {
        sv: 'forskning', en: 'research', da: 'forskning', no: 'forskning',
        fi: 'tutkimus', de: 'Forschung', fr: 'recherche', es: 'investigación',
        nl: 'onderzoek', ar: 'بحث', he: 'מחקר', ja: '研究', ko: '연구', zh: '研究',
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
];
