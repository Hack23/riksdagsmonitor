/**
 * @module Translation Dictionary — Political and Procedural Terms
 * @description Parliamentary procedure terms, budget/fiscal terms, EU and
 * international terms, geographic terms, government agencies, legal terms,
 * and policy domain terms for all 14 supported languages.
 *
 * Split from translation-dictionary.ts for maintainability.
 * Imported and combined in translation-dictionary.ts.
 */

import type { Language } from './types/language.js';

/**
 * Parliamentary procedure, budget/fiscal, EU, geographic, legal and policy terms.
 * Each entry: [Swedish term, per-language translations].
 */
export const POLITICAL_TERMS: ReadonlyArray<readonly [string, Record<Language, string>]> = [
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
];
