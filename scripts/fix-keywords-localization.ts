/**
 * Script to localize meta keywords in non-English news articles.
 * Translates English keywords to the target language for all non-EN articles.
 *
 * Processes:
 * - <meta name="keywords" content="..."> in each non-English article
 * - "keywords": "..." in JSON-LD structured data
 *
 * Keywords that have no translation in the map (proper nouns, specific terms)
 * are left as-is (English fallback is acceptable for those).
 *
 * Usage: npx tsx scripts/fix-keywords-localization.ts [--dry-run]
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

// SEO keyword translations — kept in sync with scripts/data-transformers/metadata.ts
// Maps English keyword strings to their localized equivalents for all 13 non-EN languages.
const SEO_KEYWORD_TRANSLATIONS: Record<string, Record<string, string>> = {
  'parliament':         { sv: 'riksdag', da: 'parlament', no: 'parlament', fi: 'eduskunta', de: 'parlament', fr: 'parlement', es: 'parlamento', nl: 'parlement', ar: 'برلمان', he: 'פרלמנט', ja: '議会', ko: '의회', zh: '议会' },
  'Swedish Parliament': { sv: 'Riksdagen', da: 'Svensk Parlament', no: 'Svensk Parlament', fi: 'Ruotsin Eduskunta', de: 'Schwedisches Parlament', fr: 'Parlement Suédois', es: 'Parlamento Sueco', nl: 'Zweeds Parlement', ar: 'البرلمان السويدي', he: 'הפרלמנט השבדי', ja: 'スウェーデン議会', ko: '스웨덴 의회', zh: '瑞典议会' },
  'Sweden':             { sv: 'Sverige', da: 'Sverige', no: 'Sverige', fi: 'Ruotsi', de: 'Schweden', fr: 'Suède', es: 'Suecia', nl: 'Zweden', ar: 'السويد', he: 'שבדיה', ja: 'スウェーデン', ko: '스웨덴', zh: '瑞典' },
  'politics':           { sv: 'politik', da: 'politik', no: 'politikk', fi: 'politiikka', de: 'politik', fr: 'politique', es: 'política', nl: 'politiek', ar: 'سياسة', he: 'פוליטיקה', ja: '政治', ko: '정치', zh: '政治' },
  'week ahead':         { sv: 'veckan framåt', da: 'ugen forude', no: 'uken fremover', fi: 'tuleva viikko', de: 'kommende woche', fr: 'semaine à venir', es: 'semana próxima', nl: 'week vooruit', ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '来週の展望', ko: '다음 주', zh: '下周展望' },
  'month ahead':        { sv: 'månaden framåt', da: 'måneden forude', no: 'måneden fremover', fi: 'tuleva kuukausi', de: 'kommender monat', fr: 'mois à venir', es: 'mes próximo', nl: 'maand vooruit', ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '来月の展望', ko: '다음 달', zh: '下月展望' },
  'calendar':           { sv: 'kalender', da: 'kalender', no: 'kalender', fi: 'kalenteri', de: 'kalender', fr: 'calendrier', es: 'calendario', nl: 'kalender', ar: 'تقويم', he: 'לוח שנה', ja: 'カレンダー', ko: '일정', zh: '日历' },
  'events':             { sv: 'händelser', da: 'begivenheder', no: 'hendelser', fi: 'tapahtumat', de: 'ereignisse', fr: 'événements', es: 'eventos', nl: 'evenementen', ar: 'أحداث', he: 'אירועים', ja: '出来事', ko: '이벤트', zh: '事件' },
  'committee':          { sv: 'utskott', da: 'udvalg', no: 'komité', fi: 'valiokunta', de: 'ausschuss', fr: 'commission', es: 'comisión', nl: 'commissie', ar: 'لجنة', he: 'ועדה', ja: '委員会', ko: '위원회', zh: '委员会' },
  'committees':         { sv: 'utskott', da: 'udvalg', no: 'komiteer', fi: 'valiokunnat', de: 'ausschüsse', fr: 'commissions', es: 'comisiones', nl: 'commissies', ar: 'لجان', he: 'ועדות', ja: '委員会', ko: '위원회들', zh: '委员会' },
  'reports':            { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'berichte', fr: 'rapports', es: 'informes', nl: 'rapporten', ar: 'تقارير', he: 'דוחות', ja: '報告書', ko: '보고서', zh: '报告' },
  'betänkanden':        { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'parlamentsberichte', fr: 'rapports parlementaires', es: 'informes parlamentarios', nl: 'parlementaire rapporten', ar: 'تقارير برلمانية', he: 'דוחות פרלמנטריים', ja: '議会報告書', ko: '의회 보고서', zh: '议会报告' },
  'government':         { sv: 'regering', da: 'regering', no: 'regjering', fi: 'hallitus', de: 'regierung', fr: 'gouvernement', es: 'gobierno', nl: 'regering', ar: 'حكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府' },
  'propositions':       { sv: 'propositioner', da: 'lovforslag', no: 'proposisjoner', fi: 'esitykset', de: 'gesetzentwürfe', fr: 'propositions de loi', es: 'proposiciones', nl: 'wetsvoorstellen', ar: 'مقترحات', he: 'הצעות חוק', ja: '法律案', ko: '법률안', zh: '提案' },
  'legislation':        { sv: 'lagstiftning', da: 'lovgivning', no: 'lovgivning', fi: 'lainsäädäntö', de: 'gesetzgebung', fr: 'législation', es: 'legislación', nl: 'wetgeving', ar: 'تشريع', he: 'חקיקה', ja: '立法', ko: '법률', zh: '立法' },
  'motions':            { sv: 'motioner', da: 'forslag', no: 'forslag', fi: 'aloitteet', de: 'anträge', fr: 'motions', es: 'mociones', nl: 'moties', ar: 'اقتراحات', he: 'הצעות', ja: '動議', ko: '동의', zh: '动议' },
  'opposition':         { sv: 'opposition', da: 'opposition', no: 'opposisjon', fi: 'oppositio', de: 'opposition', fr: 'opposition', es: 'oposición', nl: 'oppositie', ar: 'معارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派' },
  'proposals':          { sv: 'förslag', da: 'forslag', no: 'forslag', fi: 'ehdotukset', de: 'vorschläge', fr: 'propositions', es: 'propuestas', nl: 'voorstellen', ar: 'مقترحات', he: 'הצעות', ja: '提案', ko: '제안', zh: '提案' },
  'outlook':            { sv: 'utsikter', da: 'udsigt', no: 'utsikter', fi: 'näkymät', de: 'ausblick', fr: 'perspectives', es: 'perspectivas', nl: 'vooruitzichten', ar: 'توقعات', he: 'תחזית', ja: '見通し', ko: '전망', zh: '展望' },
  'weekly review':      { sv: 'veckans sammanfattning', da: 'ugentlig gennemgang', no: 'ukentlig gjennomgang', fi: 'viikkokatsaus', de: 'wochenbericht', fr: 'bilan hebdomadaire', es: 'revisión semanal', nl: 'wekelijks overzicht', ar: 'مراجعة أسبوعية', he: 'סקירה שבועית', ja: '週間レビュー', ko: '주간 리뷰', zh: '每周回顾' },
  'monthly review':     { sv: 'månadens sammanfattning', da: 'månedlig gennemgang', no: 'månedlig gjennomgang', fi: 'kuukausikatsaus', de: 'monatsbericht', fr: 'bilan mensuel', es: 'revisión mensual', nl: 'maandelijks overzicht', ar: 'مراجعة شهرية', he: 'סקירה חודשית', ja: '月間レビュー', ko: '월간 리뷰', zh: '每月回顾' },
  'analysis':           { sv: 'analys', da: 'analyse', no: 'analyse', fi: 'analyysi', de: 'analyse', fr: 'analyse', es: 'análisis', nl: 'analyse', ar: 'تحليل', he: 'ניתוח', ja: '分析', ko: '분석', zh: '分析' },
  'recap':              { sv: 'sammanfattning', da: 'resumé', no: 'oppsummering', fi: 'yhteenveto', de: 'zusammenfassung', fr: 'récapitulatif', es: 'resumen', nl: 'samenvatting', ar: 'ملخص', he: 'סיכום', ja: 'まとめ', ko: '요약', zh: '总结' },
  'breaking news':      { sv: 'senaste nytt', da: 'seneste nyt', no: 'siste nytt', fi: 'viimeisimmät uutiset', de: 'Eilmeldung', fr: 'dernières nouvelles', es: 'noticias de última hora', nl: 'laatste nieuws', ar: 'أخبار عاجلة', he: 'חדשות אחרונות', ja: '速報', ko: '속보', zh: '突发新闻' },
  'urgent':             { sv: 'brådskande', da: 'presserende', no: 'haster', fi: 'kiireellinen', de: 'dringend', fr: 'urgent', es: 'urgente', nl: 'dringend', ar: 'عاجل', he: 'דחוף', ja: '緊急', ko: '긴급', zh: '紧急' },
  'alert':              { sv: 'varning', da: 'advarsel', no: 'varsel', fi: 'hälytys', de: 'warnung', fr: 'alerte', es: 'alerta', nl: 'waarschuwing', ar: 'تنبيه', he: 'התראה', ja: '警告', ko: '경보', zh: '警告' },
  'debates':            { sv: 'debatter', da: 'debatter', no: 'debatter', fi: 'keskustelut', de: 'debatten', fr: 'débats', es: 'debates', nl: 'debatten', ar: 'مناقشات', he: 'דיונים', ja: '討論', ko: '토론', zh: '辩论' },
  // Additional compound keywords that appear frequently in article metadata
  'evening analysis':   { sv: 'kvällsanalys', da: 'aftenanalyse', no: 'kveldsanalyse', fi: 'ilta-analyysi', de: 'abendanalyse', fr: 'analyse du soir', es: 'análisis vespertino', nl: 'avondanalyse', ar: 'تحليل مسائي', he: 'ניתוח ערב', ja: '夜の分析', ko: '저녁 분석', zh: '晚间分析' },
  'morning briefing':   { sv: 'morgonbriefing', da: 'morgenbriefing', no: 'morgenbriefing', fi: 'aamuinfo', de: 'morgenbriefing', fr: 'briefing matinal', es: 'informe matutino', nl: 'ochtendbriefing', ar: 'إحاطة صباحية', he: 'תדריך בוקר', ja: '朝のブリーフィング', ko: '아침 브리핑', zh: '早间简报' },
  'committee reports':  { sv: 'utskottsbetänkanden', da: 'udvalgsbetænkninger', no: 'komitéinnstillinger', fi: 'valiokuntamietinnöt', de: 'ausschussberichte', fr: 'rapports de commission', es: 'informes de comisión', nl: 'commissierapporten', ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告' },
  'Government Propositions': { sv: 'Regeringspropositioner', da: 'Lovforslag fra Regeringen', no: 'Regjeringens proposisjoner', fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Propositions gouvernementales', es: 'Proposiciones gubernamentales', nl: 'Regeringsvoorstellen', ar: 'مقترحات الحكومة', he: 'הצעות ממשלה', ja: '政府法律案', ko: '정부 법률안', zh: '政府提案' },
  'Opposition Motions': { sv: 'Oppositionsmotioner', da: 'Oppositionsforslag', no: 'Opposisjonsforslag', fi: 'Oppositioaloitteet', de: 'Oppositionsanträge', fr: "Motions de l'opposition", es: 'Mociones de la oposición', nl: 'Oppositiemoties', ar: 'اقتراحات المعارضة', he: 'הצעות האופוזיציה', ja: '野党動議', ko: '야당 동의', zh: '反对党动议' },
  'parliamentary questions': { sv: 'parlamentariska frågor', da: 'parlamentariske spørgsmål', no: 'parlamentariske spørsmål', fi: 'parlamenttikyselyt', de: 'parlamentarische anfragen', fr: 'questions parlementaires', es: 'preguntas parlamentarias', nl: 'parlementaire vragen', ar: 'أسئلة برلمانية', he: 'שאלות פרלמנטריות', ja: '国会質問', ko: '의회 질문', zh: '议会质询' },
  'interpellations':    { sv: 'interpellationer', da: 'interpellationer', no: 'interpellasjoner', fi: 'interpellaatiot', de: 'interpellationen', fr: 'interpellations', es: 'interpelaciones', nl: 'interpellaties', ar: 'استجوابات', he: 'אינטרפלציות', ja: '質問主意書', ko: '대정부질문', zh: '质询' },
  'defence':            { sv: 'försvar', da: 'forsvar', no: 'forsvar', fi: 'puolustus', de: 'verteidigung', fr: 'défense', es: 'defensa', nl: 'defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  'defense':            { sv: 'försvar', da: 'forsvar', no: 'forsvar', fi: 'puolustus', de: 'verteidigung', fr: 'défense', es: 'defensa', nl: 'defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  'security':           { sv: 'säkerhet', da: 'sikkerhed', no: 'sikkerhet', fi: 'turvallisuus', de: 'sicherheit', fr: 'sécurité', es: 'seguridad', nl: 'veiligheid', ar: 'الأمن', he: 'ביטחון', ja: 'セキュリティ', ko: '보안', zh: '安全' },
  'foreign policy':     { sv: 'utrikespolitik', da: 'udenrigspolitik', no: 'utenrikspolitikk', fi: 'ulkopolitiikka', de: 'außenpolitik', fr: 'politique étrangère', es: 'política exterior', nl: 'buitenlands beleid', ar: 'السياسة الخارجية', he: 'מדיניות חוץ', ja: '外交政策', ko: '외교 정책', zh: '外交政策' },
  'migration':          { sv: 'migration', da: 'migration', no: 'migrasjon', fi: 'maahanmuutto', de: 'migration', fr: 'migration', es: 'migración', nl: 'migratie', ar: 'الهجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民' },
  'energy':             { sv: 'energi', da: 'energi', no: 'energi', fi: 'energia', de: 'energie', fr: 'énergie', es: 'energía', nl: 'energie', ar: 'الطاقة', he: 'אנרגיה', ja: 'エネルギー', ko: '에너지', zh: '能源' },
  'healthcare':         { sv: 'sjukvård', da: 'sundhed', no: 'helse', fi: 'terveydenhuolto', de: 'gesundheit', fr: 'santé', es: 'sanidad', nl: 'gezondheidszorg', ar: 'الرعاية الصحية', he: 'בריאות', ja: '医療', ko: '의료', zh: '医疗' },
  'education':          { sv: 'utbildning', da: 'uddannelse', no: 'utdanning', fi: 'koulutus', de: 'bildung', fr: 'éducation', es: 'educación', nl: 'onderwijs', ar: 'التعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育' },
  'economy':            { sv: 'ekonomi', da: 'økonomi', no: 'økonomi', fi: 'talous', de: 'wirtschaft', fr: 'économie', es: 'economía', nl: 'economie', ar: 'الاقتصاد', he: 'כלכלה', ja: '経済', ko: '경제', zh: '经济' },
  'justice':            { sv: 'rättsväsende', da: 'retsvæsen', no: 'rettsvesen', fi: 'oikeus', de: 'justiz', fr: 'justice', es: 'justicia', nl: 'justitie', ar: 'العدالة', he: 'משפט', ja: '司法', ko: '사법', zh: '司法' },
  'welfare':            { sv: 'välfärd', da: 'velfærd', no: 'velferd', fi: 'sosiaaliturva', de: 'sozialpolitik', fr: 'protection sociale', es: 'bienestar social', nl: 'sociale zekerheid', ar: 'الرعاية الاجتماعية', he: 'רווחה', ja: '社会保障', ko: '사회복지', zh: '社会保障' },
  'environment':        { sv: 'miljö', da: 'miljø', no: 'miljø', fi: 'ympäristö', de: 'umwelt', fr: 'environnement', es: 'medio ambiente', nl: 'milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境' },
  'climate':            { sv: 'klimat', da: 'klima', no: 'klima', fi: 'ilmasto', de: 'klima', fr: 'climat', es: 'clima', nl: 'klimaat', ar: 'المناخ', he: 'אקלים', ja: '気候', ko: '기후', zh: '气候' },
  'housing':            { sv: 'bostäder', da: 'boliger', no: 'boliger', fi: 'asuminen', de: 'wohnungsbau', fr: 'logement', es: 'vivienda', nl: 'huisvesting', ar: 'الإسكان', he: 'דיור', ja: '住宅', ko: '주택', zh: '住房' },
  'taxation':           { sv: 'beskattning', da: 'beskatning', no: 'beskatning', fi: 'verotus', de: 'besteuerung', fr: 'fiscalité', es: 'tributación', nl: 'belasting', ar: 'الضرائب', he: 'מיסוי', ja: '課税', ko: '과세', zh: '税收' },
  'budget':             { sv: 'budget', da: 'budget', no: 'budsjett', fi: 'budjetti', de: 'haushalt', fr: 'budget', es: 'presupuesto', nl: 'begroting', ar: 'الميزانية', he: 'תקציב', ja: '予算', ko: '예산', zh: '预算' },
  // Topic-specific keywords found in existing articles
  'artificial intelligence': { sv: 'artificiell intelligens', da: 'kunstig intelligens', no: 'kunstig intelligens', fi: 'tekoäly', de: 'künstliche intelligenz', fr: 'intelligence artificielle', es: 'inteligencia artificial', nl: 'kunstmatige intelligentie', ar: 'الذكاء الاصطناعي', he: 'בינה מלאכותית', ja: '人工知能', ko: '인공지능', zh: '人工智能' },
  'bidragsreform':      { sv: 'bidragsreform', da: 'bidragsreform', no: 'bidragsreform', fi: 'tukiuudistus', de: 'sozialleistungsreform', fr: 'réforme des prestations sociales', es: 'reforma de prestaciones sociales', nl: 'bijstandshervorming', ar: 'إصلاح الإعانات الاجتماعية', he: 'רפורמת הקצבאות', ja: '給付金制度改革', ko: '급여 제도 개혁', zh: '福利补贴改革' },
  'citizenship':        { sv: 'medborgarskap', da: 'statsborgerskab', no: 'statsborgerskap', fi: 'kansalaisuus', de: 'staatsbürgerschaft', fr: 'citoyenneté', es: 'ciudadanía', nl: 'burgerschap', ar: 'المواطنة', he: 'אזרחות', ja: '市民権', ko: '시민권', zh: '公民身份' },
  'civilian defence':   { sv: 'civilförsvar', da: 'civilbeskyttelse', no: 'sivil beredskap', fi: 'siviilisuojelu', de: 'zivilschutz', fr: 'défense civile', es: 'defensa civil', nl: 'civiele bescherming', ar: 'الدفاع المدني', he: 'הגנה אזרחית', ja: '民間防衛', ko: '민방위', zh: '民防' },
  'coalition government': { sv: 'koalitionsregering', da: 'koalitionsregering', no: 'koalisjonsregjering', fi: 'koalitiohallitus', de: 'koalitionsregierung', fr: 'gouvernement de coalition', es: 'gobierno de coalición', nl: 'coalitieregering', ar: 'حكومة ائتلافية', he: 'ממשלת קואליציה', ja: '連立政権', ko: '연립정부', zh: '联合政府' },
  'competition':        { sv: 'konkurrens', da: 'konkurrence', no: 'konkurranse', fi: 'kilpailu', de: 'wettbewerb', fr: 'concurrence', es: 'competencia', nl: 'concurrentie', ar: 'المنافسة', he: 'תחרות', ja: '競争', ko: '경쟁', zh: '竞争' },
  'consumer protection': { sv: 'konsumentskydd', da: 'forbrugerbeskyttelse', no: 'forbrukervern', fi: 'kuluttajansuoja', de: 'verbraucherschutz', fr: 'protection des consommateurs', es: 'protección al consumidor', nl: 'consumentenbescherming', ar: 'حماية المستهلك', he: 'הגנת הצרכן', ja: '消費者保護', ko: '소비자 보호', zh: '消费者保护' },
  'criminal justice':   { sv: 'rättsväsende', da: 'strafferet', no: 'strafferett', fi: 'rikosoikeus', de: 'strafjustiz', fr: 'justice pénale', es: 'justicia penal', nl: 'strafrechtpleging', ar: 'العدالة الجنائية', he: 'משפט פלילי', ja: '刑事司法', ko: '형사 사법', zh: '刑事司法' },
  'data protection':    { sv: 'dataskydd', da: 'databeskyttelse', no: 'personvern', fi: 'tietosuoja', de: 'datenschutz', fr: 'protection des données', es: 'protección de datos', nl: 'gegevensbescherming', ar: 'حماية البيانات', he: 'הגנת מידע', ja: 'データ保護', ko: '데이터 보호', zh: '数据保护' },
  'diplomacy':          { sv: 'diplomati', da: 'diplomati', no: 'diplomati', fi: 'diplomatia', de: 'diplomatie', fr: 'diplomatie', es: 'diplomacia', nl: 'diplomatie', ar: 'الدبلوماسية', he: 'דיפלומטיה', ja: '外交', ko: '외교', zh: '外交' },
  'discrimination':     { sv: 'diskriminering', da: 'diskrimination', no: 'diskriminering', fi: 'syrjintä', de: 'diskriminierung', fr: 'discrimination', es: 'discriminación', nl: 'discriminatie', ar: 'التمييز', he: 'אפליה', ja: '差別', ko: '차별', zh: '歧视' },
  'ecosystem collapse': { sv: 'ekosystemkollaps', da: 'økosystemkollaps', no: 'økosystemkollaps', fi: 'ekosysteemin romahtaminen', de: 'ökosystemzusammenbruch', fr: "effondrement de l'écosystème", es: 'colapso del ecosistema', nl: 'ecosysteeminstorting', ar: 'انهيار النظام البيئي', he: 'קריסת המערכת האקולוגית', ja: '生態系崩壊', ko: '생태계 붕괴', zh: '生态系统崩溃' },
  'employer contributions': { sv: 'arbetsgivaravgifter', da: 'arbejdsgiverbidrag', no: 'arbeidsgiveravgift', fi: 'työnantajamaksut', de: 'arbeitgeberbeiträge', fr: "cotisations patronales", es: 'cotizaciones empresariales', nl: 'werkgeversbijdragen', ar: 'اشتراكات أصحاب العمل', he: 'דמי ביטוח לאומי מעסיק', ja: '雇用者負担', ko: '고용주 부담금', zh: '雇主缴款' },
  'explosives control': { sv: 'explosivkontroll', da: 'eksplosivkontrol', no: 'eksplosivkontroll', fi: 'räjähdysaineiden valvonta', de: 'sprengstoffkontrolle', fr: 'contrôle des explosifs', es: 'control de explosivos', nl: 'explosiefbeheersing', ar: 'التحكم في المتفجرات', he: 'פיקוח על חומרי נפץ', ja: '爆発物管理', ko: '폭발물 통제', zh: '爆炸物管控' },
  'food reserves':      { sv: 'livsmedelsreserver', da: 'fødevarereserver', no: 'matreserver', fi: 'elintarvikevarannot', de: 'nahrungsmittelreserven', fr: 'réserves alimentaires', es: 'reservas alimentarias', nl: 'voedselvoorraden', ar: 'احتياطيات الغذاء', he: 'מלאי מזון', ja: '食料備蓄', ko: '식량 비축', zh: '粮食储备' },
  'foreign affairs':    { sv: 'utrikesfrågor', da: 'udenrigsanliggender', no: 'utenrikssaker', fi: 'ulkoasiat', de: 'außenangelegenheiten', fr: 'affaires étrangères', es: 'asuntos exteriores', nl: 'buitenlandse zaken', ar: 'الشؤون الخارجية', he: 'ענייני חוץ', ja: '外交問題', ko: '외교 문제', zh: '外交事务' },
  'foreign policy debate': { sv: 'utrikespolitisk debatt', da: 'udenrigspolitisk debat', no: 'utenrikspolitisk debatt', fi: 'ulkopoliittinen debatti', de: 'außenpolitische debatte', fr: 'débat de politique étrangère', es: 'debate de política exterior', nl: 'debat buitenlands beleid', ar: 'نقاش السياسة الخارجية', he: 'דיון מדיניות חוץ', ja: '外交政策論争', ko: '외교정책 토론', zh: '外交政策辩论' },
  'gang criminalization': { sv: 'gängkriminalisering', da: 'bandekriminalitet', no: 'gjengkriminalisering', fi: 'jengirikollisuu', de: 'bandenkriminalität', fr: 'criminalité des gangs', es: 'criminalidad de bandas', nl: 'gangcriminaliteit', ar: 'تجريم العصابات', he: 'עבריינות כנופיות', ja: 'ギャング犯罪化', ko: '갱 범죄화', zh: '帮派犯罪' },
  'government policy':  { sv: 'regeringspolitik', da: 'regeringspolitik', no: 'regjeringspolitikk', fi: 'hallituspolitiikka', de: 'regierungspolitik', fr: 'politique gouvernementale', es: 'política gubernamental', nl: 'regeringsbeleid', ar: 'السياسة الحكومية', he: 'מדיניות ממשלה', ja: '政府方針', ko: '정부 정책', zh: '政府政策' },
  'housing cooperatives': { sv: 'bostadsrättsföreningar', da: 'boligforeninger', no: 'borettslag', fi: 'asunto-osuuskunnat', de: 'wohnungsbaugenossenschaften', fr: 'coopératives de logement', es: 'cooperativas de vivienda', nl: 'woningcorporaties', ar: 'تعاونيات الإسكان', he: 'אגודות שיתופיות לדיור', ja: '住宅協同組合', ko: '주택 협동조합', zh: '住房合作社' },
  'immigration reform':  { sv: 'migrationspolitisk reform', da: 'immigrationsreform', no: 'innvandringsreform', fi: 'maahanmuuttouudistus', de: 'einwanderungsreform', fr: "réforme de l'immigration", es: 'reforma migratoria', nl: 'immigratiereform', ar: 'إصلاح الهجرة', he: 'רפורמת ההגירה', ja: '移民改革', ko: '이민 개혁', zh: '移民改革' },
  'interpellation':     { sv: 'interpellation', da: 'interpellation', no: 'interpellasjon', fi: 'interpellaatio', de: 'interpellation', fr: 'interpellation', es: 'interpelación', nl: 'interpellatie', ar: 'استجواب', he: 'אינטרפלציה', ja: '質問主意書', ko: '대정부질문', zh: '质询' },
  'labour immigration':  { sv: 'arbetskraftsinvandring', da: 'arbejdskraftsindvandring', no: 'arbeidskraftinnvandring', fi: 'työvoimamaahanmuutto', de: 'arbeitskräftemigration', fr: "immigration de main-d'œuvre", es: 'inmigración laboral', nl: 'arbeidsmigratie', ar: 'هجرة العمالة', he: 'הגירת עבודה', ja: '労働移民', ko: '노동 이민', zh: '劳动力移民' },
  'labour reform':      { sv: 'arbetsmarknadsreform', da: 'arbejdsmarkedsreform', no: 'arbeidsmarkedsreform', fi: 'työmarkkinauudistus', de: 'arbeitsmarktreform', fr: 'réforme du travail', es: 'reforma laboral', nl: 'arbeidsmarkthervorming', ar: 'إصلاح سوق العمل', he: 'רפורמת שוק העבודה', ja: '労働改革', ko: '노동 개혁', zh: '劳动改革' },
  'legislative session': { sv: 'riksmöte', da: 'parlamentssamling', no: 'stortingssesjon', fi: 'istuntokausi', de: 'legislaturperiode', fr: 'session législative', es: 'sesión legislativa', nl: 'wetgevingssessie', ar: 'دورة تشريعية', he: 'מושב חקיקה', ja: '立法会期', ko: '입법 회기', zh: '立法会期' },
  'military aid':       { sv: 'militärt bistånd', da: 'militær støtte', no: 'militær støtte', fi: 'sotilaallinen tuki', de: 'militärhilfe', fr: 'aide militaire', es: 'ayuda militar', nl: 'militaire steun', ar: 'المساعدات العسكرية', he: 'סיוע צבאי', ja: '軍事支援', ko: '군사 지원', zh: '军事援助' },
  'narcotics':          { sv: 'narkotika', da: 'narkotika', no: 'narkotika', fi: 'huumeet', de: 'betäubungsmittel', fr: 'stupéfiants', es: 'narcóticos', nl: 'verdovende middelen', ar: 'المخدرات', he: 'סמים', ja: '麻薬', ko: '마약', zh: '麻醉药品' },
  'national security':  { sv: 'nationell säkerhet', da: 'national sikkerhed', no: 'nasjonal sikkerhet', fi: 'kansallinen turvallisuus', de: 'nationale sicherheit', fr: 'sécurité nationale', es: 'seguridad nacional', nl: 'nationale veiligheid', ar: 'الأمن الوطني', he: 'ביטחון לאומי', ja: '国家安全保障', ko: '국가 안보', zh: '国家安全' },
  'nuclear energy':     { sv: 'kärnkraft', da: 'kernekraft', no: 'kjernekraft', fi: 'ydinvoima', de: 'kernenergie', fr: 'énergie nucléaire', es: 'energía nuclear', nl: 'kernenergie', ar: 'الطاقة النووية', he: 'אנרגיה גרעינית', ja: '原子力エネルギー', ko: '핵에너지', zh: '核能' },
  'organised crime':    { sv: 'organiserad brottslighet', da: 'organiseret kriminalitet', no: 'organisert kriminalitet', fi: 'järjestäytynyt rikollisuus', de: 'organisierte kriminalität', fr: 'crime organisé', es: 'crimen organizado', nl: 'georganiseerde misdaad', ar: 'الجريمة المنظمة', he: 'פשע מאורגן', ja: '組織犯罪', ko: '조직 범죄', zh: '有组织犯罪' },
  'parental leave':     { sv: 'föräldraledighet', da: 'forældreorlov', no: 'foreldrepermisjon', fi: 'vanhempainvapaa', de: 'elternzeit', fr: 'congé parental', es: 'permiso parental', nl: 'ouderschapsverlof', ar: 'إجازة الوالدين', he: 'חופשת הורים', ja: '育児休暇', ko: '육아 휴직', zh: '育儿假' },
  'political risk':     { sv: 'politisk risk', da: 'politisk risiko', no: 'politisk risiko', fi: 'poliittinen riski', de: 'politisches risiko', fr: 'risque politique', es: 'riesgo político', nl: 'politiek risico', ar: 'المخاطر السياسية', he: 'סיכון פוליטי', ja: '政治リスク', ko: '정치적 위험', zh: '政治风险' },
  'preparedness':       { sv: 'beredskap', da: 'beredskab', no: 'beredskap', fi: 'varautuminen', de: 'krisenvorsorge', fr: 'préparation aux crises', es: 'preparación ante crisis', nl: 'crisisparaatheid', ar: 'الاستعداد', he: 'מוכנות', ja: '危機対応準備', ko: '대비 태세', zh: '应急准备' },
  'press freedom':      { sv: 'pressfrihet', da: 'pressefrihed', no: 'pressefrihet', fi: 'lehdistönvapaus', de: 'pressefreiheit', fr: 'liberté de la presse', es: 'libertad de prensa', nl: 'persvrijheid', ar: 'حرية الصحافة', he: 'חופש העיתונות', ja: '報道の自由', ko: '언론 자유', zh: '新闻自由' },
  'psychological violence': { sv: 'psykiskt våld', da: 'psykisk vold', no: 'psykisk vold', fi: 'psyykkinen väkivalta', de: 'psychische gewalt', fr: 'violence psychologique', es: 'violencia psicológica', nl: 'psychologisch geweld', ar: 'العنف النفسي', he: 'אלימות פסיכולוגית', ja: '精神的暴力', ko: '심리적 폭력', zh: '心理暴力' },
  'reform':             { sv: 'reform', da: 'reform', no: 'reform', fi: 'uudistus', de: 'reform', fr: 'réforme', es: 'reforma', nl: 'hervorming', ar: 'إصلاح', he: 'רפורמה', ja: '改革', ko: '개혁', zh: '改革' },
  'rural policy':       { sv: 'landsbygdspolitik', da: 'landdistriktspolitik', no: 'distriktspolitikk', fi: 'maaseutupolitiikka', de: 'ländliche entwicklungspolitik', fr: 'politique rurale', es: 'política rural', nl: 'plattelandsbeleid', ar: 'السياسة الريفية', he: 'מדיניות כפרית', ja: '農村政策', ko: '농촌 정책', zh: '农村政策' },
  'smuggling':          { sv: 'smuggling', da: 'smugling', no: 'smugling', fi: 'salakuljetus', de: 'schmuggel', fr: 'contrebande', es: 'contrabando', nl: 'smokkel', ar: 'التهريب', he: 'הברחה', ja: '密輸', ko: '밀수', zh: '走私' },
  'social dumping':     { sv: 'social dumpning', da: 'social dumping', no: 'sosial dumping', fi: 'sosiaalinen dumppaus', de: 'sozialdumping', fr: 'dumping social', es: 'dumping social', nl: 'sociale dumping', ar: 'الإغراق الاجتماعي', he: 'דאמפינג סוציאלי', ja: '社会的ダンピング', ko: '사회적 덤핑', zh: '社会倾销' },
  'social insurance':   { sv: 'socialförsäkring', da: 'socialforsikring', no: 'sosialforsikring', fi: 'sosiaalivakuutus', de: 'sozialversicherung', fr: 'assurance sociale', es: 'seguro social', nl: 'sociale verzekering', ar: 'التأمين الاجتماعي', he: 'ביטוח סוציאלי', ja: '社会保険', ko: '사회 보험', zh: '社会保险' },
  'social welfare':     { sv: 'socialt välfärd', da: 'social velfærd', no: 'sosial velferd', fi: 'sosiaalinen hyvinvointi', de: 'soziale wohlfahrt', fr: 'aide sociale', es: 'bienestar social', nl: 'sociale welzijn', ar: 'الرعاية الاجتماعية', he: 'רווחה חברתית', ja: '社会福祉', ko: '사회 복지', zh: '社会福利' },
  'supplementary budget': { sv: 'tilläggsbudget', da: 'tillægsbudget', no: 'tilleggsbudsjett', fi: 'lisätalousarvio', de: 'nachtragshaushalt', fr: 'budget supplémentaire', es: 'presupuesto suplementario', nl: 'aanvullend budget', ar: 'ميزانية تكميلية', he: 'תקציב נוסף', ja: '補正予算', ko: '추가 예산', zh: '补充预算' },
  'surveillance':       { sv: 'övervakning', da: 'overvågning', no: 'overvåkning', fi: 'valvonta', de: 'überwachung', fr: 'surveillance', es: 'vigilancia', nl: 'bewaking', ar: 'المراقبة', he: 'מעקב', ja: '監視', ko: '감시', zh: '监控' },
  'technology':         { sv: 'teknik', da: 'teknologi', no: 'teknologi', fi: 'teknologia', de: 'technologie', fr: 'technologie', es: 'tecnología', nl: 'technologie', ar: 'التكنولوجيا', he: 'טכנולוגיה', ja: 'テクノロジー', ko: '기술', zh: '技术' },
  'utrikesdeklarationen': { sv: 'utrikesdeklarationen', da: 'udenrigserklæringen', no: 'utenrikspolitisk erklæring', fi: 'ulkopoliittinen julistus', de: 'außenpolitische erklärung', fr: 'déclaration de politique étrangère', es: 'declaración de política exterior', nl: 'verklaring buitenlands beleid', ar: 'إعلان السياسة الخارجية', he: 'הצהרת מדיניות החוץ', ja: '外交政策宣言', ko: '외교정책 선언', zh: '外交政策宣言' },
  'vaccine':            { sv: 'vaccin', da: 'vaccine', no: 'vaksine', fi: 'rokote', de: 'impfstoff', fr: 'vaccin', es: 'vacuna', nl: 'vaccin', ar: 'لقاح', he: 'חיסון', ja: 'ワクチン', ko: '백신', zh: '疫苗' },
  'weapons law':        { sv: 'vapenlag', da: 'våbenlov', no: 'våpenlov', fi: 'asevoimalaki', de: 'waffengesetz', fr: 'loi sur les armes', es: 'ley de armas', nl: 'wapenwet', ar: 'قانون الأسلحة', he: 'חוק הנשק', ja: '武器法', ko: '무기법', zh: '武器法' },
  'weekend analysis':   { sv: 'helganalys', da: 'weekendanalyse', no: 'helganalyse', fi: 'viikonloppuanalyysi', de: 'wochenendanalyse', fr: "analyse du week-end", es: 'análisis del fin de semana', nl: 'weekendanalyse', ar: 'تحليل نهاية الأسبوع', he: 'ניתוח סוף שבוע', ja: '週末分析', ko: '주말 분석', zh: '周末分析' },
  'wind power':         { sv: 'vindkraft', da: 'vindkraft', no: 'vindkraft', fi: 'tuulivoima', de: 'windenergie', fr: 'énergie éolienne', es: 'energía eólica', nl: 'windenergie', ar: 'طاقة الرياح', he: 'אנרגיית רוח', ja: '風力発電', ko: '풍력 발전', zh: '风力发电' },
};

// Build a case-insensitive lookup map keyed by lowercase English term
const LOWER_MAP = new Map<string, { original: string; translations: Record<string, string> }>();
for (const [key, translations] of Object.entries(SEO_KEYWORD_TRANSLATIONS)) {
  LOWER_MAP.set(key.toLowerCase(), { original: key, translations });
}

/** Return the localized form of a single keyword for the given language. Falls back to English. */
function localizeKeyword(keyword: string, lang: string): string {
  if (lang === 'en') return keyword;
  const trimmed = keyword.trim();
  // Try exact match first
  const exact = SEO_KEYWORD_TRANSLATIONS[trimmed];
  if (exact?.[lang]) return exact[lang];
  // Try case-insensitive match
  const lower = trimmed.toLowerCase();
  const entry = LOWER_MAP.get(lower);
  if (entry?.translations[lang]) return entry.translations[lang];
  // No translation available — keep as English (acceptable for proper nouns / specific terms)
  return trimmed;
}

/**
 * Translate a comma-separated keyword string to the target language.
 * Keywords that have no translation entry are left as-is.
 */
function localizeKeywords(keywordsStr: string, lang: string): string {
  return keywordsStr
    .split(', ')
    .map(kw => localizeKeyword(kw, lang))
    .join(', ');
}

/** Replace the meta keywords tag and JSON-LD keywords string in HTML content. */
function replaceKeywords(html: string, lang: string): string {
  let result = html;

  // 1. Replace <meta name="keywords" content="...">
  result = result.replace(
    /(<meta name="keywords" content=")([^"]+)(")/g,
    (_match, prefix, keywords, suffix) => {
      const localized = localizeKeywords(keywords, lang);
      return `${prefix}${localized}${suffix}`;
    }
  );

  // 2. Replace "keywords": "..." in JSON-LD structured data (string format)
  result = result.replace(
    /("keywords": ")([^"]+)(")/g,
    (_match, prefix, keywords, suffix) => {
      const localized = localizeKeywords(keywords, lang);
      return `${prefix}${localized}${suffix}`;
    }
  );

  // 3. Replace "keywords": [...] in JSON-LD structured data (array format)
  result = result.replace(
    /("keywords": \[)([^\]]+)(\])/g,
    (_match, prefix, keywordsJson, suffix) => {
      // Parse the JSON array of strings
      const localized = keywordsJson.replace(/"([^"]+)"/g, (_m: string, kw: string) => {
        return `"${localizeKeyword(kw, lang)}"`;
      });
      return `${prefix}${localized}${suffix}`;
    }
  );

  return result;
}

function getLanguageFromFilename(filename: string): string | null {
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? (match[1] ?? null) : null;
}

function processFile(filepath: string, dryRun: boolean): boolean {
  const filename = path.basename(filepath);
  const lang = getLanguageFromFilename(filename);

  // Skip English articles — they are already in the correct language
  if (!lang || lang === 'en') return false;

  const original = fs.readFileSync(filepath, 'utf-8');

  // Quick check: does this file have any keywords meta tag with translatable English terms?
  const keywordsMatch = original.match(/<meta name="keywords" content="([^"]+)"/);
  if (!keywordsMatch) return false;

  const modified = replaceKeywords(original, lang);

  if (modified === original) return false;

  if (!dryRun) {
    fs.writeFileSync(filepath, modified, 'utf-8');
  }
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const NEWS_DIR = path.join(process.cwd(), 'news');
const dryRun = process.argv.includes('--dry-run');

console.log(`🔄 Localizing meta keywords in non-English news articles (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

const files = fs.readdirSync(NEWS_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

let modifiedCount = 0;
let skippedCount = 0;
const langStats: Record<string, number> = {};

for (const file of files) {
  const filepath = path.join(NEWS_DIR, file);
  const lang = getLanguageFromFilename(file);

  if (processFile(filepath, dryRun)) {
    modifiedCount++;
    if (lang) langStats[lang] = (langStats[lang] ?? 0) + 1;
    if (dryRun) console.log(`  📝 Would modify: ${file}`);
  } else {
    skippedCount++;
  }
}

console.log(`\n✅ Done!`);
console.log(`  Modified: ${modifiedCount} files`);
console.log(`  Skipped:  ${skippedCount} files (no changes needed)`);

if (Object.keys(langStats).length > 0) {
  console.log(`\n📊 Changes by language:`);
  for (const [lang, count] of Object.entries(langStats).sort()) {
    console.log(`  ${lang}: ${count} files`);
  }
}

// ── Verification pass ─────────────────────────────────────────────────────────
console.log(`\n🔍 Verifying: checking for remaining English-only standard keywords in non-EN articles...`);

// Patterns that indicate untranslated standard template keywords
const ENGLISH_ONLY_PATTERNS = [
  /name="keywords"[^>]*content="government, propositions/,
  /name="keywords"[^>]*content="committee, reports, bet/,
  /name="keywords"[^>]*content="motions, opposition, parliament, proposals/,
  /name="keywords"[^>]*content="parliament, week ahead/,
  /name="keywords"[^>]*content="parliament, month ahead/,
  /name="keywords"[^>]*content="parliament, weekly review/,
  /name="keywords"[^>]*content="parliament, monthly review/,
];

let remaining = 0;
for (const file of files) {
  const lang = getLanguageFromFilename(file);
  if (!lang || lang === 'en') continue;

  const content = fs.readFileSync(path.join(NEWS_DIR, file), 'utf-8');
  for (const pattern of ENGLISH_ONLY_PATTERNS) {
    if (pattern.test(content)) {
      remaining++;
      if (remaining <= 10) {
        console.log(`  ⚠️  ${file}: still has English-only template keywords`);
      }
      break;
    }
  }
}

if (remaining === 0) {
  console.log(`  ✅ No remaining English-only standard keywords found.`);
} else {
  console.log(`  ⚠️  ${remaining} file(s) still have English-only standard keywords.`);
  process.exitCode = 1;
}
