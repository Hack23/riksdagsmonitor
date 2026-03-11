/**
 * @module data-transformers/metadata
 * @description SEO metadata generation, reading-time calculation,
 * source attribution, and content-title generation for articles.
 * Handles keyword localisation across 14 supported languages.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { ArticleMetadata, ArticleType } from '../types/article.js';
import type { ArticleContentData, RawDocument } from './types.js';
import { L } from './helpers.js';

/**
 * SEO keyword translations for all 14 supported languages.
 * Maps English keyword strings to their localized equivalents.
 * Used by generateMetadata() to produce language-specific keyword lists.
 */
const SEO_KEYWORD_TRANSLATIONS: Record<string, Partial<Record<Language, string>>> = {
  'parliament':      { sv: 'riksdag', da: 'parlament', no: 'parlament', fi: 'eduskunta', de: 'parlament', fr: 'parlement', es: 'parlamento', nl: 'parlement', ar: 'برلمان', he: 'פרלמנט', ja: '議会', ko: '의회', zh: '议会' },
  'Swedish Parliament': { sv: 'Riksdagen', da: 'Svensk Parlament', no: 'Svensk Parlament', fi: 'Ruotsin Eduskunta', de: 'Schwedisches Parlament', fr: 'Parlement Suédois', es: 'Parlamento Sueco', nl: 'Zweeds Parlement', ar: 'البرلمان السويدي', he: 'הפרלמנט השבדי', ja: 'スウェーデン議会', ko: '스웨덴 의회', zh: '瑞典议会' },
  'Sweden':          { sv: 'Sverige', da: 'Sverige', no: 'Sverige', fi: 'Ruotsi', de: 'Schweden', fr: 'Suède', es: 'Suecia', nl: 'Zweden', ar: 'السويد', he: 'שבדיה', ja: 'スウェーデン', ko: '스웨덴', zh: '瑞典' },
  'politics':        { sv: 'politik', da: 'politik', no: 'politikk', fi: 'politiikka', de: 'politik', fr: 'politique', es: 'política', nl: 'politiek', ar: 'سياسة', he: 'פוליטיקה', ja: '政治', ko: '정치', zh: '政治' },
  'week ahead':      { sv: 'veckan framåt', da: 'ugen forude', no: 'uken fremover', fi: 'tuleva viikko', de: 'kommende woche', fr: 'semaine à venir', es: 'semana próxima', nl: 'week vooruit', ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '来週の展望', ko: '다음 주', zh: '下周展望' },
  'month ahead':     { sv: 'månaden framåt', da: 'måneden forude', no: 'måneden fremover', fi: 'tuleva kuukausi', de: 'kommender monat', fr: 'mois à venir', es: 'mes próximo', nl: 'maand vooruit', ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '来月の展望', ko: '다음 달', zh: '下月展望' },
  'calendar':        { sv: 'kalender', da: 'kalender', no: 'kalender', fi: 'kalenteri', de: 'kalender', fr: 'calendrier', es: 'calendario', nl: 'kalender', ar: 'تقويم', he: 'לוח שנה', ja: 'カレンダー', ko: '일정', zh: '日历' },
  'events':          { sv: 'händelser', da: 'begivenheder', no: 'hendelser', fi: 'tapahtumat', de: 'ereignisse', fr: 'événements', es: 'eventos', nl: 'evenementen', ar: 'أحداث', he: 'אירועים', ja: '出来事', ko: '이벤트', zh: '事件' },
  'committee':       { sv: 'utskott', da: 'udvalg', no: 'komité', fi: 'valiokunta', de: 'ausschuss', fr: 'commission', es: 'comisión', nl: 'commissie', ar: 'لجنة', he: 'ועדה', ja: '委員会', ko: '위원회', zh: '委员会' },
  'committees':      { sv: 'utskott', da: 'udvalg', no: 'komiteer', fi: 'valiokunnat', de: 'ausschüsse', fr: 'commissions', es: 'comisiones', nl: 'commissies', ar: 'لجان', he: 'ועדות', ja: '委員会', ko: '위원회들', zh: '委员会' },
  'reports':         { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'berichte', fr: 'rapports', es: 'informes', nl: 'rapporten', ar: 'تقارير', he: 'דוחות', ja: '報告書', ko: '보고서', zh: '报告' },
  'betänkanden':     { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'parlamentsberichte', fr: 'rapports parlementaires', es: 'informes parlamentarios', nl: 'parlementaire rapporten', ar: 'تقارير برلمانية', he: 'דוחות פרלמנטריים', ja: '議会報告書', ko: '의회 보고서', zh: '议会报告' },
  'government':      { sv: 'regering', da: 'regering', no: 'regjering', fi: 'hallitus', de: 'regierung', fr: 'gouvernement', es: 'gobierno', nl: 'regering', ar: 'حكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府' },
  'propositions':    { sv: 'propositioner', da: 'lovforslag', no: 'proposisjoner', fi: 'esitykset', de: 'gesetzentwürfe', fr: 'propositions de loi', es: 'proposiciones', nl: 'wetsvoorstellen', ar: 'مقترحات', he: 'הצעות חוק', ja: '法律案', ko: '법률안', zh: '提案' },
  'legislation':     { sv: 'lagstiftning', da: 'lovgivning', no: 'lovgivning', fi: 'lainsäädäntö', de: 'gesetzgebung', fr: 'législation', es: 'legislación', nl: 'wetgeving', ar: 'تشريع', he: 'חקיקה', ja: '立法', ko: '법률', zh: '立法' },
  'motions':         { sv: 'motioner', da: 'forslag', no: 'forslag', fi: 'aloitteet', de: 'anträge', fr: 'motions', es: 'mociones', nl: 'moties', ar: 'اقتراحات', he: 'הצעות', ja: '動議', ko: '동의', zh: '动议' },
  'opposition':      { sv: 'opposition', da: 'opposition', no: 'opposisjon', fi: 'oppositio', de: 'opposition', fr: 'opposition', es: 'oposición', nl: 'oppositie', ar: 'معارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派' },
  'proposals':       { sv: 'förslag', da: 'forslag', no: 'forslag', fi: 'ehdotukset', de: 'vorschläge', fr: 'propositions', es: 'propuestas', nl: 'voorstellen', ar: 'مقترحات', he: 'הצעות', ja: '提案', ko: '제안', zh: '提案' },
  'outlook':         { sv: 'utsikter', da: 'udsigt', no: 'utsikter', fi: 'näkymät', de: 'ausblick', fr: 'perspectives', es: 'perspectivas', nl: 'vooruitzichten', ar: 'توقعات', he: 'תחזית', ja: '見通し', ko: '전망', zh: '展望' },
  'weekly review':   { sv: 'veckans sammanfattning', da: 'ugentlig gennemgang', no: 'ukentlig gjennomgang', fi: 'viikkokatsaus', de: 'wochenbericht', fr: 'bilan hebdomadaire', es: 'revisión semanal', nl: 'wekelijks overzicht', ar: 'مراجعة أسبوعية', he: 'סקירה שבועית', ja: '週間レビュー', ko: '주간 리뷰', zh: '每周回顾' },
  'monthly review':  { sv: 'månadens sammanfattning', da: 'månedlig gennemgang', no: 'månedlig gjennomgang', fi: 'kuukausikatsaus', de: 'monatsbericht', fr: 'bilan mensuel', es: 'revisión mensual', nl: 'maandelijks overzicht', ar: 'مراجعة شهرية', he: 'סקירה חודשית', ja: '月間レビュー', ko: '월간 리뷰', zh: '每月回顾' },
  'analysis':        { sv: 'analys', da: 'analyse', no: 'analyse', fi: 'analyysi', de: 'analyse', fr: 'analyse', es: 'análisis', nl: 'analyse', ar: 'تحليل', he: 'ניתוח', ja: '分析', ko: '분석', zh: '分析' },
  'recap':           { sv: 'sammanfattning', da: 'resumé', no: 'oppsummering', fi: 'yhteenveto', de: 'zusammenfassung', fr: 'récapitulatif', es: 'resumen', nl: 'samenvatting', ar: 'ملخص', he: 'סיכום', ja: 'まとめ', ko: '요약', zh: '总结' },
  'breaking news':   { sv: 'senaste nytt', da: 'seneste nyt', no: 'siste nytt', fi: 'viimeisimmät uutiset', de: 'Eilmeldung', fr: 'dernières nouvelles', es: 'noticias de última hora', nl: 'laatste nieuws', ar: 'أخبار عاجلة', he: 'חדשות אחרונות', ja: '速報', ko: '속보', zh: '突发新闻' },
  'urgent':          { sv: 'brådskande', da: 'presserende', no: 'haster', fi: 'kiireellinen', de: 'dringend', fr: 'urgent', es: 'urgente', nl: 'dringend', ar: 'عاجل', he: 'דחוף', ja: '緊急', ko: '긴급', zh: '紧急' },
  'alert':           { sv: 'varning', da: 'advarsel', no: 'varsel', fi: 'hälytys', de: 'warnung', fr: 'alerte', es: 'alerta', nl: 'waarschuwing', ar: 'تنبيه', he: 'התראה', ja: '警告', ko: '경보', zh: '警告' },
  'debates':         { sv: 'debatter', da: 'debatter', no: 'debatter', fi: 'keskustelut', de: 'debatten', fr: 'débats', es: 'debates', nl: 'debatten', ar: 'مناقشات', he: 'דיונים', ja: '討論', ko: '토론', zh: '辩论' },
  // Topic-specific keywords found in existing articles
  'artificial intelligence': { sv: 'artificiell intelligens', da: 'kunstig intelligens', no: 'kunstig intelligens', fi: 'tekoäly', de: 'künstliche intelligenz', fr: 'intelligence artificielle', es: 'inteligencia artificial', nl: 'kunstmatige intelligentie', ar: 'الذكاء الاصطناعي', he: 'בינה מלאכותית', ja: '人工知能', ko: '인공지능', zh: '人工智能' },
  'bidragsreform':   { sv: 'bidragsreform', da: 'bidragsreform', no: 'bidragsreform', fi: 'tukiuudistus', de: 'sozialleistungsreform', fr: 'réforme des prestations sociales', es: 'reforma de prestaciones sociales', nl: 'bijstandshervorming', ar: 'إصلاح الإعانات الاجتماعية', he: 'רפורמת הקצבאות', ja: '給付金制度改革', ko: '급여 제도 개혁', zh: '福利补贴改革' },
  'citizenship':     { sv: 'medborgarskap', da: 'statsborgerskab', no: 'statsborgerskap', fi: 'kansalaisuus', de: 'staatsbürgerschaft', fr: 'citoyenneté', es: 'ciudadanía', nl: 'burgerschap', ar: 'المواطنة', he: 'אזרחות', ja: '市民権', ko: '시민권', zh: '公民身份' },
  'civilian defence': { sv: 'civilförsvar', da: 'civilbeskyttelse', no: 'sivil beredskap', fi: 'siviilisuojelu', de: 'zivilschutz', fr: 'défense civile', es: 'defensa civil', nl: 'civiele bescherming', ar: 'الدفاع المدني', he: 'הגנה אזרחית', ja: '民間防衛', ko: '민방위', zh: '民防' },
  'coalition government': { sv: 'koalitionsregering', da: 'koalitionsregering', no: 'koalisjonsregjering', fi: 'koalitiohallitus', de: 'koalitionsregierung', fr: 'gouvernement de coalition', es: 'gobierno de coalición', nl: 'coalitieregering', ar: 'حكومة ائتلافية', he: 'ממשלת קואליציה', ja: '連立政権', ko: '연립정부', zh: '联合政府' },
  'competition':     { sv: 'konkurrens', da: 'konkurrence', no: 'konkurranse', fi: 'kilpailu', de: 'wettbewerb', fr: 'concurrence', es: 'competencia', nl: 'concurrentie', ar: 'المنافسة', he: 'תחרות', ja: '競争', ko: '경쟁', zh: '竞争' },
  'consumer protection': { sv: 'konsumentskydd', da: 'forbrugerbeskyttelse', no: 'forbrukervern', fi: 'kuluttajansuoja', de: 'verbraucherschutz', fr: 'protection des consommateurs', es: 'protección al consumidor', nl: 'consumentenbescherming', ar: 'حماية المستهلك', he: 'הגנת הצרכן', ja: '消費者保護', ko: '소비자 보호', zh: '消费者保护' },
  'criminal justice': { sv: 'rättsväsende', da: 'strafferet', no: 'strafferett', fi: 'rikosoikeus', de: 'strafjustiz', fr: 'justice pénale', es: 'justicia penal', nl: 'strafrechtpleging', ar: 'العدالة الجنائية', he: 'משפט פלילי', ja: '刑事司法', ko: '형사 사법', zh: '刑事司法' },
  'data protection':  { sv: 'dataskydd', da: 'databeskyttelse', no: 'personvern', fi: 'tietosuoja', de: 'datenschutz', fr: 'protection des données', es: 'protección de datos', nl: 'gegevensbescherming', ar: 'حماية البيانات', he: 'הגנת מידע', ja: 'データ保護', ko: '데이터 보호', zh: '数据保护' },
  'diplomacy':        { sv: 'diplomati', da: 'diplomati', no: 'diplomati', fi: 'diplomatia', de: 'diplomatie', fr: 'diplomatie', es: 'diplomacia', nl: 'diplomatie', ar: 'الدبلوماسية', he: 'דיפלומטיה', ja: '外交', ko: '외교', zh: '外交' },
  'discrimination':   { sv: 'diskriminering', da: 'diskrimination', no: 'diskriminering', fi: 'syrjintä', de: 'diskriminierung', fr: 'discrimination', es: 'discriminación', nl: 'discriminatie', ar: 'التمييز', he: 'אפליה', ja: '差別', ko: '차별', zh: '歧视' },
  'ecosystem collapse': { sv: 'ekosystemkollaps', da: 'økosystemkollaps', no: 'økosystemkollaps', fi: 'ekosysteemin romahtaminen', de: 'ökosystemzusammenbruch', fr: "effondrement de l'écosystème", es: 'colapso del ecosistema', nl: 'ecosysteeminstorting', ar: 'انهيار النظام البيئي', he: 'קריסת המערכת האקולוגית', ja: '生態系崩壊', ko: '생태계 붕괴', zh: '生态系统崩溃' },
  'employer contributions': { sv: 'arbetsgivaravgifter', da: 'arbejdsgiverbidrag', no: 'arbeidsgiveravgift', fi: 'työnantajamaksut', de: 'arbeitgeberbeiträge', fr: 'cotisations patronales', es: 'cotizaciones empresariales', nl: 'werkgeversbijdragen', ar: 'اشتراكات أصحاب العمل', he: 'דמי ביטוח לאומי מעסיק', ja: '雇用者負担', ko: '고용주 부담금', zh: '雇主缴款' },
  'explosives control': { sv: 'explosivkontroll', da: 'eksplosivkontrol', no: 'eksplosivkontroll', fi: 'räjähdysaineiden valvonta', de: 'sprengstoffkontrolle', fr: 'contrôle des explosifs', es: 'control de explosivos', nl: 'explosiefbeheersing', ar: 'التحكم في المتفجرات', he: 'פיקוח על חומרי נפץ', ja: '爆発物管理', ko: '폭발물 통제', zh: '爆炸物管控' },
  'food reserves':    { sv: 'livsmedelsreserver', da: 'fødevarereserver', no: 'matreserver', fi: 'elintarvikevarannot', de: 'nahrungsmittelreserven', fr: 'réserves alimentaires', es: 'reservas alimentarias', nl: 'voedselvoorraden', ar: 'احتياطيات الغذاء', he: 'מלאי מזון', ja: '食料備蓄', ko: '식량 비축', zh: '粮食储备' },
  'foreign affairs':  { sv: 'utrikesfrågor', da: 'udenrigsanliggender', no: 'utenrikssaker', fi: 'ulkoasiat', de: 'außenangelegenheiten', fr: 'affaires étrangères', es: 'asuntos exteriores', nl: 'buitenlandse zaken', ar: 'الشؤون الخارجية', he: 'ענייני חוץ', ja: '外交問題', ko: '외교 문제', zh: '外交事务' },
  'foreign policy debate': { sv: 'utrikespolitisk debatt', da: 'udenrigspolitisk debat', no: 'utenrikspolitisk debatt', fi: 'ulkopoliittinen debatti', de: 'außenpolitische debatte', fr: 'débat de politique étrangère', es: 'debate de política exterior', nl: 'debat buitenlands beleid', ar: 'نقاش السياسة الخارجية', he: 'דיון מדיניות חוץ', ja: '外交政策論争', ko: '외교정책 토론', zh: '外交政策辩论' },
  'gang criminalization': { sv: 'gängkriminalisering', da: 'bandekriminalitet', no: 'gjengkriminalisering', fi: 'jengirikollisuu', de: 'bandenkriminalität', fr: 'criminalité des gangs', es: 'criminalidad de bandas', nl: 'gangcriminaliteit', ar: 'تجريم العصابات', he: 'עבריינות כנופיות', ja: 'ギャング犯罪化', ko: '갱 범죄화', zh: '帮派犯罪' },
  'government policy': { sv: 'regeringspolitik', da: 'regeringspolitik', no: 'regjeringspolitikk', fi: 'hallituspolitiikka', de: 'regierungspolitik', fr: 'politique gouvernementale', es: 'política gubernamental', nl: 'regeringsbeleid', ar: 'السياسة الحكومية', he: 'מדיניות ממשלה', ja: '政府方針', ko: '정부 정책', zh: '政府政策' },
  'housing cooperatives': { sv: 'bostadsrättsföreningar', da: 'boligforeninger', no: 'borettslag', fi: 'asunto-osuuskunnat', de: 'wohnungsbaugenossenschaften', fr: 'coopératives de logement', es: 'cooperativas de vivienda', nl: 'woningcorporaties', ar: 'تعاونيات الإسكان', he: 'אגודות שיתופיות לדיור', ja: '住宅協同組合', ko: '주택 협동조합', zh: '住房合作社' },
  'immigration reform': { sv: 'migrationspolitisk reform', da: 'immigrationsreform', no: 'innvandringsreform', fi: 'maahanmuuttouudistus', de: 'einwanderungsreform', fr: "réforme de l'immigration", es: 'reforma migratoria', nl: 'immigratiereform', ar: 'إصلاح الهجرة', he: 'רפורמת ההגירה', ja: '移民改革', ko: '이민 개혁', zh: '移民改革' },
  'interpellation':   { sv: 'interpellation', da: 'interpellation', no: 'interpellasjon', fi: 'interpellaatio', de: 'interpellation', fr: 'interpellation', es: 'interpelación', nl: 'interpellatie', ar: 'استجواب', he: 'אינטרפלציה', ja: '質問主意書', ko: '대정부질문', zh: '质询' },
  'labour immigration': { sv: 'arbetskraftsinvandring', da: 'arbejdskraftsindvandring', no: 'arbeidskraftinnvandring', fi: 'työvoimamaahanmuutto', de: 'arbeitskräftemigration', fr: "immigration de main-d'œuvre", es: 'inmigración laboral', nl: 'arbeidsmigratie', ar: 'هجرة العمالة', he: 'הגירת עבודה', ja: '労働移民', ko: '노동 이민', zh: '劳动力移民' },
  'labour reform':    { sv: 'arbetsmarknadsreform', da: 'arbejdsmarkedsreform', no: 'arbeidsmarkedsreform', fi: 'työmarkkinauudistus', de: 'arbeitsmarktreform', fr: 'réforme du travail', es: 'reforma laboral', nl: 'arbeidsmarkthervorming', ar: 'إصلاح سوق العمل', he: 'רפורמת שוק העבודה', ja: '労働改革', ko: '노동 개혁', zh: '劳动改革' },
  'legislative session': { sv: 'riksmöte', da: 'parlamentssamling', no: 'stortingssesjon', fi: 'istuntokausi', de: 'legislaturperiode', fr: 'session législative', es: 'sesión legislativa', nl: 'wetgevingssessie', ar: 'دورة تشريعية', he: 'מושב חקיקה', ja: '立法会期', ko: '입법 회기', zh: '立法会期' },
  'military aid':     { sv: 'militärt bistånd', da: 'militær støtte', no: 'militær støtte', fi: 'sotilaallinen tuki', de: 'militärhilfe', fr: 'aide militaire', es: 'ayuda militar', nl: 'militaire steun', ar: 'المساعدات العسكرية', he: 'סיוע צבאי', ja: '軍事支援', ko: '군사 지원', zh: '军事援助' },
  'narcotics':        { sv: 'narkotika', da: 'narkotika', no: 'narkotika', fi: 'huumeet', de: 'betäubungsmittel', fr: 'stupéfiants', es: 'narcóticos', nl: 'verdovende middelen', ar: 'المخدرات', he: 'סמים', ja: '麻薬', ko: '마약', zh: '麻醉药品' },
  'national security': { sv: 'nationell säkerhet', da: 'national sikkerhed', no: 'nasjonal sikkerhet', fi: 'kansallinen turvallisuus', de: 'nationale sicherheit', fr: 'sécurité nationale', es: 'seguridad nacional', nl: 'nationale veiligheid', ar: 'الأمن الوطني', he: 'ביטחון לאומי', ja: '国家安全保障', ko: '국가 안보', zh: '国家安全' },
  'nuclear energy':   { sv: 'kärnkraft', da: 'kernekraft', no: 'kjernekraft', fi: 'ydinvoima', de: 'kernenergie', fr: 'énergie nucléaire', es: 'energía nuclear', nl: 'kernenergie', ar: 'الطاقة النووية', he: 'אנרגיה גרעינית', ja: '原子力エネルギー', ko: '핵에너지', zh: '核能' },
  'organised crime':  { sv: 'organiserad brottslighet', da: 'organiseret kriminalitet', no: 'organisert kriminalitet', fi: 'järjestäytynyt rikollisuus', de: 'organisierte kriminalität', fr: 'crime organisé', es: 'crimen organizado', nl: 'georganiseerde misdaad', ar: 'الجريمة المنظمة', he: 'פשע מאורגן', ja: '組織犯罪', ko: '조직 범죄', zh: '有组织犯罪' },
  'parental leave':   { sv: 'föräldraledighet', da: 'forældreorlov', no: 'foreldrepermisjon', fi: 'vanhempainvapaa', de: 'elternzeit', fr: 'congé parental', es: 'permiso parental', nl: 'ouderschapsverlof', ar: 'إجازة الوالدين', he: 'חופשת הורים', ja: '育児休暇', ko: '육아 휴직', zh: '育儿假' },
  'political risk':   { sv: 'politisk risk', da: 'politisk risiko', no: 'politisk risiko', fi: 'poliittinen riski', de: 'politisches risiko', fr: 'risque politique', es: 'riesgo político', nl: 'politiek risico', ar: 'المخاطر السياسية', he: 'סיכון פוליטי', ja: '政治リスク', ko: '정치적 위험', zh: '政治风险' },
  'preparedness':     { sv: 'beredskap', da: 'beredskab', no: 'beredskap', fi: 'varautuminen', de: 'krisenvorsorge', fr: 'préparation aux crises', es: 'preparación ante crisis', nl: 'crisisparaatheid', ar: 'الاستعداد', he: 'מוכנות', ja: '危機対応準備', ko: '대비 태세', zh: '应急准备' },
  'press freedom':    { sv: 'pressfrihet', da: 'pressefrihed', no: 'pressefrihet', fi: 'lehdistönvapaus', de: 'pressefreiheit', fr: 'liberté de la presse', es: 'libertad de prensa', nl: 'persvrijheid', ar: 'حرية الصحافة', he: 'חופש העיתונות', ja: '報道の自由', ko: '언론 자유', zh: '新闻自由' },
  'psychological violence': { sv: 'psykiskt våld', da: 'psykisk vold', no: 'psykisk vold', fi: 'psyykkinen väkivalta', de: 'psychische gewalt', fr: 'violence psychologique', es: 'violencia psicológica', nl: 'psychologisch geweld', ar: 'العنف النفسي', he: 'אלימות פסיכולוגית', ja: '精神的暴力', ko: '심리적 폭력', zh: '心理暴力' },
  'reform':           { sv: 'reform', da: 'reform', no: 'reform', fi: 'uudistus', de: 'reform', fr: 'réforme', es: 'reforma', nl: 'hervorming', ar: 'إصلاح', he: 'רפורמה', ja: '改革', ko: '개혁', zh: '改革' },
  'rural policy':     { sv: 'landsbygdspolitik', da: 'landdistriktspolitik', no: 'distriktspolitikk', fi: 'maaseutupolitiikka', de: 'ländliche entwicklungspolitik', fr: 'politique rurale', es: 'política rural', nl: 'plattelandsbeleid', ar: 'السياسة الريفية', he: 'מדיניות כפרית', ja: '農村政策', ko: '농촌 정책', zh: '农村政策' },
  'smuggling':        { sv: 'smuggling', da: 'smugling', no: 'smugling', fi: 'salakuljetus', de: 'schmuggel', fr: 'contrebande', es: 'contrabando', nl: 'smokkel', ar: 'التهريب', he: 'הברחה', ja: '密輸', ko: '밀수', zh: '走私' },
  'social dumping':   { sv: 'social dumpning', da: 'social dumping', no: 'sosial dumping', fi: 'sosiaalinen dumppaus', de: 'sozialdumping', fr: 'dumping social', es: 'dumping social', nl: 'sociale dumping', ar: 'الإغراق الاجتماعي', he: 'דאמפינג סוציאלי', ja: '社会的ダンピング', ko: '사회적 덤핑', zh: '社会倾销' },
  'social insurance': { sv: 'socialförsäkring', da: 'socialforsikring', no: 'sosialforsikring', fi: 'sosiaalivakuutus', de: 'sozialversicherung', fr: 'assurance sociale', es: 'seguro social', nl: 'sociale verzekering', ar: 'التأمين الاجتماعي', he: 'ביטוח סוציאלי', ja: '社会保険', ko: '사회 보험', zh: '社会保险' },
  'social welfare':   { sv: 'socialt välfärd', da: 'social velfærd', no: 'sosial velferd', fi: 'sosiaalinen hyvinvointi', de: 'soziale wohlfahrt', fr: 'aide sociale', es: 'bienestar social', nl: 'sociale welzijn', ar: 'الرعاية الاجتماعية', he: 'רווחה חברתית', ja: '社会福祉', ko: '사회 복지', zh: '社会福利' },
  'supplementary budget': { sv: 'tilläggsbudget', da: 'tillægsbudget', no: 'tilleggsbudsjett', fi: 'lisätalousarvio', de: 'nachtragshaushalt', fr: 'budget supplémentaire', es: 'presupuesto suplementario', nl: 'aanvullend budget', ar: 'ميزانية تكميلية', he: 'תקציב נוסף', ja: '補正予算', ko: '추가 예산', zh: '补充预算' },
  'surveillance':     { sv: 'övervakning', da: 'overvågning', no: 'overvåkning', fi: 'valvonta', de: 'überwachung', fr: 'surveillance', es: 'vigilancia', nl: 'bewaking', ar: 'المراقبة', he: 'מעקב', ja: '監視', ko: '감시', zh: '监控' },
  'technology':       { sv: 'teknik', da: 'teknologi', no: 'teknologi', fi: 'teknologia', de: 'technologie', fr: 'technologie', es: 'tecnología', nl: 'technologie', ar: 'التكنولوجيا', he: 'טכנולוגיה', ja: 'テクノロジー', ko: '기술', zh: '技术' },
  'utrikesdeklarationen': { sv: 'utrikesdeklarationen', da: 'udenrigserklæringen', no: 'utenrikspolitisk erklæring', fi: 'ulkopoliittinen julistus', de: 'außenpolitische erklärung', fr: 'déclaration de politique étrangère', es: 'declaración de política exterior', nl: 'verklaring buitenlands beleid', ar: 'إعلان السياسة الخارجية', he: 'הצהרת מדיניות החוץ', ja: '外交政策宣言', ko: '외교정책 선언', zh: '外交政策宣言' },
  'vaccine':          { sv: 'vaccin', da: 'vaccine', no: 'vaksine', fi: 'rokote', de: 'impfstoff', fr: 'vaccin', es: 'vacuna', nl: 'vaccin', ar: 'لقاح', he: 'חיסון', ja: 'ワクチン', ko: '백신', zh: '疫苗' },
  'weapons law':      { sv: 'vapenlag', da: 'våbenlov', no: 'våpenlov', fi: 'asevoimalaki', de: 'waffengesetz', fr: 'loi sur les armes', es: 'ley de armas', nl: 'wapenwet', ar: 'قانون الأسلحة', he: 'חוק הנשק', ja: '武器法', ko: '무기법', zh: '武器法' },
  'weekend analysis': { sv: 'helganalys', da: 'weekendanalyse', no: 'helganalyse', fi: 'viikonloppuanalyysi', de: 'wochenendanalyse', fr: "analyse du week-end", es: 'análisis del fin de semana', nl: 'weekendanalyse', ar: 'تحليل نهاية الأسبوع', he: 'ניתוח סוף שבוע', ja: '週末分析', ko: '주말 분석', zh: '周末分析' },
  'wind power':       { sv: 'vindkraft', da: 'vindkraft', no: 'vindkraft', fi: 'tuulivoima', de: 'windenergie', fr: 'énergie éolienne', es: 'energía eólica', nl: 'windenergie', ar: 'طاقة الرياح', he: 'אנרגיית רוח', ja: '風力発電', ko: '풍력 발전', zh: '风力发电' },
};

/** Return the localized form of an SEO keyword for the given language (falls back to English). */
function localizeKeyword(keyword: string, lang: Language): string {
  if (lang === 'en') return keyword;
  return SEO_KEYWORD_TRANSLATIONS[keyword]?.[lang] ?? keyword;
}

/**
 * Generate article metadata
 */
export function generateMetadata(data: ArticleContentData, type: ArticleType | string, lang: Language = 'en'): ArticleMetadata {
  const keywords: string[] = [];
  const topics: string[] = [];
  const tags: string[] = [];
  const kw = (k: string): string => localizeKeyword(k, lang);

  // Add type-specific keywords
  switch (type) {
    case 'week-ahead':
      keywords.push(kw('parliament'), kw('week ahead'), kw('calendar'), kw('events'));
      topics.push('parliament');
      {
        const tagVal = L(lang, 'weekAhead');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'committee-reports':
      keywords.push(kw('committee'), kw('reports'), kw('betänkanden'), kw('parliament'));
      topics.push('committees', 'reports');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'propositions':
      keywords.push(kw('government'), kw('propositions'), kw('parliament'), kw('legislation'));
      topics.push('government', 'legislation');
      {
        const tagVal = L(lang, 'govPropsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'motions':
      keywords.push(kw('motions'), kw('opposition'), kw('parliament'), kw('proposals'));
      topics.push('parliament', 'opposition');
      {
        const tagVal = L(lang, 'oppMotionsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'month-ahead':
      keywords.push(kw('parliament'), kw('month ahead'), kw('calendar'), kw('outlook'));
      topics.push('parliament', 'outlook');
      {
        const tagVal = L(lang, 'weekAhead');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'weekly-review':
      keywords.push(kw('parliament'), kw('weekly review'), kw('analysis'), kw('recap'));
      topics.push('parliament', 'review');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'monthly-review':
      keywords.push(kw('parliament'), kw('monthly review'), kw('analysis'), kw('recap'));
      topics.push('parliament', 'review');
      {
        const tagVal = L(lang, 'committeeReportsTag');
        tags.push(typeof tagVal === 'string' ? tagVal : '');
      }
      break;
    case 'breaking':
      keywords.push(kw('breaking news'), kw('parliament'), kw('urgent'), kw('alert'));
      topics.push('breaking', 'parliament');
      break;
  }

  // Extract additional keywords from data
  if (data.events) {
    keywords.push(kw('calendar'), kw('events'), kw('debates'));
  }
  if (data.reports) {
    keywords.push(kw('committees'), kw('reports'));
  }

  // Add common keywords
  keywords.push(kw('Swedish Parliament'), 'Riksdag', kw('politics'), kw('Sweden'));

  return {
    keywords: keywords.slice(0, 15),
    topics: topics.slice(0, 5),
    tags: tags.slice(0, 10)
  };
}

/**
 * Calculate estimated read time
 */
export function calculateReadTime(content: string): string {
  // Remove HTML tags for word count
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;

  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200);

  return `${minutes} min read`;
}

/**
 * Policy domain keywords (Swedish) for extracting themes from parliamentary documents.
 * Scans `titel`, `rubrik`, `summary`, and `notis` fields for these terms.
 */
const POLICY_DOMAIN_KEYWORDS: Record<string, string[]> = {
  energy:      ['energi', 'elproduktion', 'kärnkraft', 'förnybar', 'vindkraft', 'solenergi'],
  environment: ['miljö', 'klimat', 'utsläpp', 'naturvård', 'avfall', 'biologisk'],
  housing:     ['bostäder', 'hyra', 'fastighet', 'byggande', 'bostadsmark', 'bostadsbrist'],
  defense:     ['försvar', 'militär', 'nato', 'säkerhetspolitik', 'försvarsutgifter'],
  healthcare:  ['sjukvård', 'hälso', 'omsorg', 'läkemedel', 'primärvård'],
  education:   ['utbildning', 'skola', 'högskola', 'forskning', 'gymnasium'],
  economy:     ['skatt', 'budget', 'ekonomi', 'finans', 'moms', 'konjunktur'],
  migration:   ['migration', 'asyl', 'flyktingar', 'invandrare', 'uppehållstillstånd'],
  justice:     ['brott', 'rättsväsende', 'polis', 'straff', 'kriminalitet'],
  social:      ['sociala', 'välfärd', 'pension', 'trygghet', 'socialbidrag'],
  transport:   ['trafik', 'järnväg', 'vägar', 'infrastruktur', 'kollektivtrafik'],
  trade:       ['näringsliv', 'industri', 'export', 'konkurrens', 'utrikeshandel', 'handelspolitik'],
  eu:          ['europeisk', 'europaparlament', 'direktiv', 'eu-', 'europafrågor'],
};

/** Localized domain names for all 14 supported languages */
const DOMAIN_TRANSLATIONS: Record<string, Record<string, string>> = {
  energy:      { en: 'Energy', sv: 'Energi', da: 'Energi', no: 'Energi', fi: 'Energia', de: 'Energie', fr: 'Énergie', es: 'Energía', nl: 'Energie', ar: 'الطاقة', he: 'אנרגיה', ja: 'エネルギー', ko: '에너지', zh: '能源' },
  environment: { en: 'Environment', sv: 'Miljö', da: 'Miljø', no: 'Miljø', fi: 'Ympäristö', de: 'Umwelt', fr: 'Environnement', es: 'Medio Ambiente', nl: 'Milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境' },
  housing:     { en: 'Housing', sv: 'Bostäder', da: 'Boliger', no: 'Boliger', fi: 'Asuminen', de: 'Wohnungsbau', fr: 'Logement', es: 'Vivienda', nl: 'Huisvesting', ar: 'الإسكان', he: 'דיור', ja: '住宅', ko: '주택', zh: '住房' },
  defense:     { en: 'Defense', sv: 'Försvar', da: 'Forsvar', no: 'Forsvar', fi: 'Puolustus', de: 'Verteidigung', fr: 'Défense', es: 'Defensa', nl: 'Defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  healthcare:  { en: 'Healthcare', sv: 'Sjukvård', da: 'Sundhed', no: 'Helse', fi: 'Terveydenhuolto', de: 'Gesundheit', fr: 'Santé', es: 'Sanidad', nl: 'Gezondheidszorg', ar: 'الرعاية الصحية', he: 'בריאות', ja: '医療', ko: '의료', zh: '医疗' },
  education:   { en: 'Education', sv: 'Utbildning', da: 'Uddannelse', no: 'Utdanning', fi: 'Koulutus', de: 'Bildung', fr: 'Éducation', es: 'Educación', nl: 'Onderwijs', ar: 'التعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育' },
  economy:     { en: 'Economy', sv: 'Ekonomi', da: 'Økonomi', no: 'Økonomi', fi: 'Talous', de: 'Wirtschaft', fr: 'Économie', es: 'Economía', nl: 'Economie', ar: 'الاقتصاد', he: 'כלכלה', ja: '経済', ko: '경제', zh: '经济' },
  migration:   { en: 'Migration', sv: 'Migration', da: 'Migration', no: 'Migrasjon', fi: 'Maahanmuutto', de: 'Migration', fr: 'Migration', es: 'Migración', nl: 'Migratie', ar: 'الهجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民' },
  justice:     { en: 'Justice', sv: 'Rättsväsende', da: 'Retsvæsen', no: 'Rettsvesen', fi: 'Oikeus', de: 'Justiz', fr: 'Justice', es: 'Justicia', nl: 'Justitie', ar: 'العدالة', he: 'משפט', ja: '司法', ko: '사법', zh: '司法' },
  social:      { en: 'Welfare', sv: 'Välfärd', da: 'Velfærd', no: 'Velferd', fi: 'Sosiaaliturva', de: 'Sozialpolitik', fr: 'Protection sociale', es: 'Bienestar Social', nl: 'Sociale zekerheid', ar: 'الرعاية الاجتماعية', he: 'רווחה', ja: '社会保障', ko: '사회복지', zh: '社会保障' },
  transport:   { en: 'Transport', sv: 'Trafik', da: 'Transport', no: 'Transport', fi: 'Liikenne', de: 'Verkehr', fr: 'Transport', es: 'Transporte', nl: 'Transport', ar: 'النقل', he: 'תחבורה', ja: '交通', ko: '교통', zh: '交通' },
  trade:       { en: 'Industry', sv: 'Näringsliv', da: 'Erhvervsliv', no: 'Næringsliv', fi: 'Elinkeinoelämä', de: 'Wirtschaft', fr: 'Industrie', es: 'Industria', nl: 'Industrie', ar: 'الصناعة', he: 'תעשייה', ja: '産業', ko: '산업', zh: '产业' },
  eu:          { en: 'EU Affairs', sv: 'EU-frågor', da: 'EU-spørgsmål', no: 'EU-saker', fi: 'EU-asiat', de: 'EU-Angelegenheiten', fr: 'Affaires européennes', es: 'Asuntos Europeos', nl: 'EU-zaken', ar: 'الشؤون الأوروبية', he: 'ענייני אירופה', ja: 'EU問題', ko: 'EU사무', zh: '欧盟事务' },
};

/**
 * Title and subtitle templates keyed by article type then language.
 * Placeholders: {d1} first domain, {d2} second domain, {count} document count.
 */
const CONTENT_TITLE_TEMPLATES: Record<string, Record<string, { title: string; subtitle: string }>> = {
  motions: {
    en: { title: 'Opposition Challenges {d1} and {d2}', subtitle: 'Analysis of {count} opposition motions on {d1} & {d2}' },
    sv: { title: 'Oppositionen utmanar {d1} och {d2}', subtitle: 'Analys av {count} oppositionsmotioner om {d1} & {d2}' },
    da: { title: 'Opposition udfordrer {d1} og {d2}', subtitle: 'Analyse af {count} oppositionsforslag om {d1} & {d2}' },
    no: { title: 'Opposisjonen utfordrer {d1} og {d2}', subtitle: 'Analyse av {count} opposisjonsforslag om {d1} & {d2}' },
    fi: { title: 'Oppositio haastaa {d1} ja {d2}', subtitle: 'Analyysi {count} opposition aloitteesta: {d1} & {d2}' },
    de: { title: 'Opposition fordert {d1} und {d2} heraus', subtitle: 'Analyse von {count} Oppositionsanträgen zu {d1} & {d2}' },
    fr: { title: "L'opposition défie {d1} et {d2}", subtitle: "Analyse de {count} motions d'opposition sur {d1} & {d2}" },
    es: { title: 'La oposición desafía {d1} y {d2}', subtitle: 'Análisis de {count} mociones de oposición sobre {d1} & {d2}' },
    nl: { title: 'Oppositie daagt {d1} en {d2} uit', subtitle: 'Analyse van {count} oppositiemoties over {d1} & {d2}' },
    ar: { title: 'المعارضة تتحدى {d1} و{d2}', subtitle: 'تحليل {count} اقتراح معارضة حول {d1} و{d2}' },
    he: { title: 'האופוזיציה מאתגרת {d1} ו{d2}', subtitle: 'ניתוח {count} הצעות אופוזיציה: {d1} ו{d2}' },
    ja: { title: '野党が{d1}と{d2}に挑む', subtitle: '{d1}と{d2}に関する{count}件の野党動議の分析' },
    ko: { title: '야당이 {d1}과 {d2}에 도전', subtitle: '{d1}과 {d2}에 관한 {count}개 야당 동의 분析' },
    zh: { title: '反对党挑战{d1}和{d2}', subtitle: '关于{d1}和{d2}的{count}份反对党动议分析' },
  },
  propositions: {
    en: { title: 'Government Targets {d1} and {d2} Reform', subtitle: 'Analysis of {count} government propositions on {d1} & {d2}' },
    sv: { title: 'Regeringen satsar på {d1} och {d2}', subtitle: 'Analys av {count} propositioner om {d1} & {d2}' },
    da: { title: 'Regeringen fokuserer på {d1} og {d2}', subtitle: 'Analyse af {count} regeringsforslag om {d1} & {d2}' },
    no: { title: 'Regjeringen satser på {d1} og {d2}', subtitle: 'Analyse av {count} regjeringsproposisjoner om {d1} & {d2}' },
    fi: { title: 'Hallitus panostaa {d1} ja {d2}', subtitle: 'Analyysi {count} hallituksen esityksestä: {d1} & {d2}' },
    de: { title: 'Regierung adressiert {d1} und {d2}', subtitle: 'Analyse von {count} Regierungsvorlagen zu {d1} & {d2}' },
    fr: { title: 'Le gouvernement cible {d1} et {d2}', subtitle: 'Analyse de {count} propositions gouvernementales sur {d1} & {d2}' },
    es: { title: 'El gobierno apunta a {d1} y {d2}', subtitle: 'Análisis de {count} proposiciones gubernamentales sobre {d1} & {d2}' },
    nl: { title: 'Regering richt zich op {d1} en {d2}', subtitle: 'Analyse van {count} regeringsvoorstellen over {d1} & {d2}' },
    ar: { title: 'الحكومة تستهدف {d1} و{d2}', subtitle: 'تحليل {count} مقترح حكومي حول {d1} و{d2}' },
    he: { title: 'הממשלה מתמקדת ב{d1} וב{d2}', subtitle: 'ניתוח {count} הצעות ממשלה: {d1} ו{d2}' },
    ja: { title: '政府が{d1}と{d2}に着手', subtitle: '{d1}と{d2}に関する{count}件の政府提案の分析' },
    ko: { title: '정부가 {d1}과 {d2} 추진', subtitle: '{d1}과 {d2}에 관한 {count}개 정부 법안 분析' },
    zh: { title: '政府推进{d1}和{d2}改革', subtitle: '关于{d1}和{d2}的{count}份政府提案分析' },
  },
  'committee-reports': {
    en: { title: 'Committees Address {d1} and {d2}', subtitle: 'Analysis of {count} committee reports on {d1} & {d2}' },
    sv: { title: 'Utskotten behandlar {d1} och {d2}', subtitle: 'Analys av {count} utskottsbetänkanden om {d1} & {d2}' },
    da: { title: 'Udvalg behandler {d1} og {d2}', subtitle: 'Analyse af {count} udvalgsbetænkninger om {d1} & {d2}' },
    no: { title: 'Komiteer behandler {d1} og {d2}', subtitle: 'Analyse av {count} komitéinnstillinger om {d1} & {d2}' },
    fi: { title: 'Valiokunnat käsittelevät {d1} ja {d2}', subtitle: 'Analyysi {count} valiokunnan mietinnöstä: {d1} & {d2}' },
    de: { title: 'Ausschüsse beraten {d1} und {d2}', subtitle: 'Analyse von {count} Ausschussberichten zu {d1} & {d2}' },
    fr: { title: 'Les commissions examinent {d1} et {d2}', subtitle: 'Analyse de {count} rapports de commission sur {d1} & {d2}' },
    es: { title: 'Comisiones examinan {d1} y {d2}', subtitle: 'Análisis de {count} informes de comisión sobre {d1} & {d2}' },
    nl: { title: 'Commissies behandelen {d1} en {d2}', subtitle: 'Analyse van {count} commissierapporten over {d1} & {d2}' },
    ar: { title: 'اللجان تعالج {d1} و{d2}', subtitle: 'تحليل {count} تقرير لجنة حول {d1} و{d2}' },
    he: { title: 'הוועדות עוסקות ב{d1} וב{d2}', subtitle: 'ניתוח {count} דוחות ועדה: {d1} ו{d2}' },
    ja: { title: '委員会が{d1}と{d2}を審議', subtitle: '{d1}と{d2}に関する{count}件の委員会報告の分析' },
    ko: { title: '위원회가 {d1}과 {d2}을 심의', subtitle: '{d1}과 {d2}에 관한 {count}개 위원회 보고서 분析' },
    zh: { title: '委员会审议{d1}和{d2}', subtitle: '关于{d1}和{d2}的{count}份委员会报告分析' },
  },
};

/**
 * Extract the top policy domains from a set of parliamentary documents.
 * Scans `titel`, `rubrik`, `summary`, and `notis` fields for Swedish keywords.
 *
 * @internal Use {@link generateContentTitle} instead.
 */
function extractPolicyDomains(documents: RawDocument[]): string[] {
  const counts: Record<string, number> = {};
  for (const doc of documents) {
    const text = `${doc.titel ?? ''} ${doc.rubrik ?? ''} ${doc.summary ?? ''} ${doc.notis ?? ''}`.toLowerCase();
    for (const [domain, keywords] of Object.entries(POLICY_DOMAIN_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        counts[domain] = (counts[domain] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);
}

/**
 * Generate a content-aware article title derived from the policy domains found in documents.
 *
 * Extracts the top 2 policy themes from the provided documents and returns a
 * language-specific title that reflects the actual content. Returns `null` when
 * fewer than 2 distinct domains can be detected so callers can fall back to
 * their static titles.
 *
 * @param documents - Source documents to analyse for policy themes
 * @param lang - Target language code (e.g. `'en'`, `'sv'`, `'de'`)
 * @param articleType - Article type: `'motions'` | `'propositions'` | `'committee-reports'`
 * @returns Content-based `{ title, subtitle }`, or `null` when analysis is insufficient
 */
export function generateContentTitle(
  documents: RawDocument[],
  lang: Language | string,
  articleType: 'motions' | 'propositions' | 'committee-reports'
): { title: string; subtitle: string } | null {
  const domains = extractPolicyDomains(documents);
  if (domains.length < 2) return null;

  const langKey = lang as string;
  const trans0 = DOMAIN_TRANSLATIONS[domains[0] ?? ''];
  const trans1 = DOMAIN_TRANSLATIONS[domains[1] ?? ''];
  if (!trans0 || !trans1) return null;
  const d1 = trans0[langKey] ?? trans0['en'];
  const d2 = trans1[langKey] ?? trans1['en'];
  if (!d1 || !d2) return null;

  const typeTemplates = CONTENT_TITLE_TEMPLATES[articleType];
  const tmpl = typeTemplates?.[langKey] ?? typeTemplates?.['en'];
  if (!tmpl) return null;

  return {
    title:    tmpl.title.replace('{d1}', d1).replace('{d2}', d2),
    subtitle: tmpl.subtitle
      .replace('{count}', String(documents.length))
      .replace('{d1}', d1)
      .replace('{d2}', d2),
  };
}

/**
 * Generate article sources list
 */
export function generateSources(tools: string[] = []): string[] {
  const sources: string[] = ['riksdag-regering-mcp'];

  if (tools.includes('get_calendar_events')) {
    sources.push('Riksdagen Calendar');
  }
  if (tools.includes('get_betankanden')) {
    sources.push('Committee Reports');
  }
  if (tools.includes('get_propositioner')) {
    sources.push('Government Propositions');
  }
  if (tools.includes('get_motioner')) {
    sources.push('Parliamentary Motions');
  }
  if (tools.includes('search_dokument')) {
    sources.push('Riksdagen Documents');
  }
  if (tools.includes('get_dokument_innehall')) {
    sources.push('Riksdagen Document Content');
  }
  if (tools.includes('search_voteringar')) {
    sources.push('Riksdagen Voting Records');
  }
  if (tools.includes('search_anforanden')) {
    sources.push('Riksdagen Speeches');
  }

  return sources;
}
