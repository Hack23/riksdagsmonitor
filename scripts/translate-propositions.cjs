#!/usr/bin/env node

/**
 * Government Propositions Translation Script
 * Translates enhanced proposition articles to 14 languages
 * 
 * IMPORTANT LIMITATION:
 * This script ONLY translates:
 * - Page metadata (title, description, OG tags, Twitter Card)
 * - Section headings (H2, H3)
 * - UI elements (navigation, data sources, methodology labels)
 * 
 * This script DOES NOT translate:
 * - Article body content (paragraphs, lists, analysis text)
 * - Embedded quotes or substantive policy descriptions
 * 
 * Full article body translation requires:
 * - Professional translation services (DeepL API, Google Cloud Translation)
 * - GPT-4 or similar AI with 14-language capability
 * - Estimated cost: ~$50-100K for complete 14-language coverage
 * 
 * Usage: node translate-propositions.js <source-file> [output-dir]
 */

const fs = require('fs');
const path = require('path');

// Translation dictionaries for all 14 languages
const translations = {
  sv: {
    title: "Vapenlag och momsbedrägerier: Tidö-prioriteringar denna vecka",
    description: "Tio propositioner signalerar koalitionens fokus på brottsbekämpning, förebyggande av ekonomisk brottslighet och tillsyn när våruppehållet närmar sig",
    readTime: "8 min läsning",
    analysis: "Analys",
    execSummary: "Sammanfattning",
    lawEnforcement: "Brottsbekämpning och säkerhetsåtgärder",
    financialCrime: "Förebyggande av ekonomisk brottslighet",
    financialStability: "Finansiell stabilitet",
    digitalId: "Digital identitet och administrativ modernisering",
    govAccountability: "Regeringens ansvarsskyldighet",
    regulatory: "Regelefterlevnad",
    crossCutting: "Övergripande analys: Regeringens strategiska prioriteringar",
    whatToWatch: "Vad man ska bevaka denna vecka",
    sources: "Källor och data",
    dataSources: "Datakällor",
    generatedBy: "Genererad av",
    methodology: "Analysmetodik",
    docRefs: "Dokumentreferenser",
    backToNews: "← Tillbaka till nyheter",
    document: "Dokument",
    ministry: "Departement",
    submitted: "Inlämnad",
    policyAnalysis: "Politisk analys",
    keyChanges: "Viktiga förändringar",
    whoAffected: "Vilka berörs",
    politicalContext: "Politiskt sammanhang",
    implementation: "Genomförandetidslinje",
    budgetImpact: "Budgetpåverkan",
    govResponse: "Regeringens svar",
    legislativePath: "Lagstiftningsväg"
  },
  da: {
    title: "Våbenlov og momssvindel: Tidö-prioriteter denne uge",
    description: "Ti forslag signalerer koalitionens fokus på retshåndhævelse, forebyggelse af økonomisk kriminalitet og regulering, mens forårspausen nærmer sig",
    readTime: "8 min læsning",
    analysis: "Analyse",
    execSummary: "Resumé",
    lawEnforcement: "Retshåndhævelse og sikkerhedsforanstaltninger",
    financialCrime: "Forebyggelse af økonomisk kriminalitet",
    financialStability: "Finansiel stabilitet",
    digitalId: "Digital identitet og administrativ modernisering",
    govAccountability: "Regeringens ansvarlighed",
    regulatory: "Overholdelse af regler",
    crossCutting: "Tværgående analyse: Regeringens strategiske prioriteringer",
    whatToWatch: "Hvad man skal holde øje med denne uge",
    sources: "Kilder og data",
    dataSources: "Datakilder",
    generatedBy: "Genereret af",
    methodology: "Analysemetodologi",
    docRefs: "Dokumentreferencer",
    backToNews: "← Tilbage til nyheder",
    document: "Dokument",
    ministry: "Ministerium",
    submitted: "Indsendt",
    policyAnalysis: "Politisk analyse",
    keyChanges: "Vigtige ændringer",
    whoAffected: "Hvem påvirkes",
    politicalContext: "Politisk kontekst",
    implementation: "Implementeringstidslinje",
    budgetImpact: "Budgetpåvirkning",
    govResponse: "Regeringens svar",
    legislativePath: "Lovgivningsproces"
  },
  no: {
    title: "Våpenlov og mva-svindel: Tidö-prioriteringer denne uken",
    description: "Ti proposisjoner signaliserer koalisjonens fokus på rettshåndhevelse, forebygging av økonomisk kriminalitet og regulatorisk tilsyn når vårpausen nærmer seg",
    readTime: "8 min lesing",
    analysis: "Analyse",
    execSummary: "Sammendrag",
    lawEnforcement: "Rettshåndhevelse og sikkerhetstiltak",
    financialCrime: "Forebygging av økonomisk kriminalitet",
    financialStability: "Finansiell stabilitet",
    digitalId: "Digital identitet og administrativ modernisering",
    govAccountability: "Regjeringens ansvarlighet",
    regulatory: "Overholdelse av regelverk",
    crossCutting: "Tverrgående analyse: Regjeringens strategiske prioriteringer",
    whatToWatch: "Hva du bør følge med på denne uken",
    sources: "Kilder og data",
    dataSources: "Datakilder",
    generatedBy: "Generert av",
    methodology: "Analysemetodikk",
    docRefs: "Dokumentreferanser",
    backToNews: "← Tilbake til nyheter",
    document: "Dokument",
    ministry: "Departement",
    submitted: "Innsendt",
    policyAnalysis: "Politisk analyse",
    keyChanges: "Viktige endringer",
    whoAffected: "Hvem påvirkes",
    politicalContext: "Politisk kontekst",
    implementation: "Implementeringstidslinje",
    budgetImpact: "Budsjettvirkning",
    govResponse: "Regjeringens svar",
    legislativePath: "Lovgivningsprosess"
  },
  fi: {
    title: "Aselaki ja arvonlisäveropetoset: Tidö-prioriteetit tällä viikolla",
    description: "Kymmenen esitystä osoittavat koalition keskittyvän lainvalvontaan, talousrikollisuuden ehkäisyyn ja valvontaan kevättauon lähestyessä",
    readTime: "8 min lukuaika",
    analysis: "Analyysi",
    execSummary: "Yhteenveto",
    lawEnforcement: "Lainvalvonta ja turvallisuustoimet",
    financialCrime: "Talousrikollisuuden ehkäisy",
    financialStability: "Rahoitusvakaus",
    digitalId: "Digitaalinen henkilöllisyys ja hallinnollinen modernisointi",
    govAccountability: "Hallituksen vastuuvelvollisuus",
    regulatory: "Säännösten noudattaminen",
    crossCutting: "Läpileikkaava analyysi: Hallituksen strategiset prioriteetit",
    whatToWatch: "Mitä seurata tällä viikolla",
    sources: "Lähteet ja tiedot",
    dataSources: "Tietolähteet",
    generatedBy: "Tuottaja",
    methodology: "Analyysimenetelmä",
    docRefs: "Asiakirjaviitteet",
    backToNews: "← Takaisin uutisiin",
    document: "Asiakirja",
    ministry: "Ministeriö",
    submitted: "Jätetty",
    policyAnalysis: "Poliittinen analyysi",
    keyChanges: "Tärkeimmät muutokset",
    whoAffected: "Keitä koskee",
    politicalContext: "Poliittinen konteksti",
    implementation: "Toteutusaikataulu",
    budgetImpact: "Budjettivaikutus",
    govResponse: "Hallituksen vastaus",
    legislativePath: "Lainsäädäntöpolku"
  },
  de: {
    title: "Waffengesetz und Mehrwertsteuerbetrug: Tidö-Prioritäten diese Woche",
    description: "Zehn Vorschläge signalisieren den Koalitionsfokus auf Strafverfolgung, Bekämpfung von Wirtschaftskriminalität und Regulierungsaufsicht vor der Frühjahrspause",
    readTime: "8 Min. Lesezeit",
    analysis: "Analyse",
    execSummary: "Zusammenfassung",
    lawEnforcement: "Strafverfolgung und Sicherheitsmaßnahmen",
    financialCrime: "Bekämpfung von Wirtschaftskriminalität",
    financialStability: "Finanzstabilität",
    digitalId: "Digitale Identität und administrative Modernisierung",
    govAccountability: "Regierungsverantwortung",
    regulatory: "Einhaltung von Vorschriften",
    crossCutting: "Übergreifende Analyse: Strategische Prioritäten der Regierung",
    whatToWatch: "Was diese Woche zu beachten ist",
    sources: "Quellen und Daten",
    dataSources: "Datenquellen",
    generatedBy: "Erstellt von",
    methodology: "Analysemethodik",
    docRefs: "Dokumentreferenzen",
    backToNews: "← Zurück zu Nachrichten",
    document: "Dokument",
    ministry: "Ministerium",
    submitted: "Eingereicht",
    policyAnalysis: "Politische Analyse",
    keyChanges: "Wichtige Änderungen",
    whoAffected: "Wer ist betroffen",
    politicalContext: "Politischer Kontext",
    implementation: "Umsetzungszeitplan",
    budgetImpact: "Budgetauswirkungen",
    govResponse: "Regierungsantwort",
    legislativePath: "Gesetzgebungsweg"
  },
  fr: {
    title: "Loi sur les armes et fraude à la TVA : priorités Tidö cette semaine",
    description: "Dix propositions signalent l'accent de la coalition sur l'application de la loi, la prévention de la criminalité financière et la surveillance réglementaire à l'approche de la pause printanière",
    readTime: "8 min de lecture",
    analysis: "Analyse",
    execSummary: "Résumé",
    lawEnforcement: "Application de la loi et mesures de sécurité",
    financialCrime: "Prévention de la criminalité financière",
    financialStability: "Stabilité financière",
    digitalId: "Identité numérique et modernisation administrative",
    govAccountability: "Responsabilité gouvernementale",
    regulatory: "Conformité réglementaire",
    crossCutting: "Analyse transversale : Priorités stratégiques du gouvernement",
    whatToWatch: "À surveiller cette semaine",
    sources: "Sources et données",
    dataSources: "Sources de données",
    generatedBy: "Généré par",
    methodology: "Méthodologie d'analyse",
    docRefs: "Références documentaires",
    backToNews: "← Retour aux actualités",
    document: "Document",
    ministry: "Ministère",
    submitted: "Soumis",
    policyAnalysis: "Analyse politique",
    keyChanges: "Changements clés",
    whoAffected: "Qui est affecté",
    politicalContext: "Contexte politique",
    implementation: "Calendrier de mise en œuvre",
    budgetImpact: "Impact budgétaire",
    govResponse: "Réponse gouvernementale",
    legislativePath: "Processus législatif"
  },
  es: {
    title: "Ley de armas y fraude del IVA: prioridades Tidö esta semana",
    description: "Diez proposiciones señalan el enfoque de la coalición en la aplicación de la ley, prevención del crimen financiero y supervisión regulatoria antes de la pausa primaveral",
    readTime: "8 min de lectura",
    analysis: "Análisis",
    execSummary: "Resumen ejecutivo",
    lawEnforcement: "Aplicación de la ley y medidas de seguridad",
    financialCrime: "Prevención del crimen financiero",
    financialStability: "Estabilidad financiera",
    digitalId: "Identidad digital y modernización administrativa",
    govAccountability: "Responsabilidad gubernamental",
    regulatory: "Cumplimiento regulatorio",
    crossCutting: "Análisis transversal: Prioridades estratégicas del gobierno",
    whatToWatch: "Qué observar esta semana",
    sources: "Fuentes y datos",
    dataSources: "Fuentes de datos",
    generatedBy: "Generado por",
    methodology: "Metodología de análisis",
    docRefs: "Referencias documentales",
    backToNews: "← Volver a noticias",
    document: "Documento",
    ministry: "Ministerio",
    submitted: "Presentado",
    policyAnalysis: "Análisis político",
    keyChanges: "Cambios clave",
    whoAffected: "Quién se ve afectado",
    politicalContext: "Contexto político",
    implementation: "Cronograma de implementación",
    budgetImpact: "Impacto presupuestario",
    govResponse: "Respuesta gubernamental",
    legislativePath: "Proceso legislativo"
  },
  nl: {
    title: "Wapenwet en btw-fraude: Tidö-prioriteiten deze week",
    description: "Tien voorstellen signaleren de focus van de coalitie op handhaving, preventie van financiële criminaliteit en regelgevend toezicht terwijl het voorjaarsreces nadert",
    readTime: "8 min leestijd",
    analysis: "Analyse",
    execSummary: "Samenvatting",
    lawEnforcement: "Handhaving en veiligheidsmaatregelen",
    financialCrime: "Preventie van financiële criminaliteit",
    financialStability: "Financiële stabiliteit",
    digitalId: "Digitale identiteit en administratieve modernisering",
    govAccountability: "Overheidsverantwoordelijkheid",
    regulatory: "Naleving van regelgeving",
    crossCutting: "Overkoepelende analyse: Strategische prioriteiten van de regering",
    whatToWatch: "Wat te volgen deze week",
    sources: "Bronnen en gegevens",
    dataSources: "Gegevensbronnen",
    generatedBy: "Gegenereerd door",
    methodology: "Analysemethodologie",
    docRefs: "Documentreferenties",
    backToNews: "← Terug naar nieuws",
    document: "Document",
    ministry: "Ministerie",
    submitted: "Ingediend",
    policyAnalysis: "Beleidsanalyse",
    keyChanges: "Belangrijkste wijzigingen",
    whoAffected: "Wie wordt getroffen",
    politicalContext: "Politieke context",
    implementation: "Implementatietijdlijn",
    budgetImpact: "Budgettaire impact",
    govResponse: "Reactie van de regering",
    legislativePath: "Wetgevingsproces"
  },
  ar: {
    title: "قانون الأسلحة والاحتيال في ضريبة القيمة المضافة: أولويات تيدو هذا الأسبوع",
    description: "عشرة مقترحات تشير إلى تركيز الائتلاف على إنفاذ القانون ومنع الجريمة المالية والرقابة التنظيمية مع اقتراب عطلة الربيع",
    readTime: "8 دقائق قراءة",
    analysis: "تحليل",
    execSummary: "ملخص تنفيذي",
    lawEnforcement: "إنفاذ القانون والتدابير الأمنية",
    financialCrime: "منع الجريمة المالية",
    financialStability: "الاستقرار المالي",
    digitalId: "الهوية الرقمية والتحديث الإداري",
    govAccountability: "المساءلة الحكومية",
    regulatory: "الامتثال التنظيمي",
    crossCutting: "تحليل شامل: الأولويات الاستراتيجية للحكومة",
    whatToWatch: "ما يجب مراقبته هذا الأسبوع",
    sources: "المصادر والبيانات",
    dataSources: "مصادر البيانات",
    generatedBy: "تم إنشاؤه بواسطة",
    methodology: "منهجية التحليل",
    docRefs: "مراجع الوثائق",
    backToNews: "→ العودة إلى الأخبار",
    document: "وثيقة",
    ministry: "الوزارة",
    submitted: "مقدم",
    policyAnalysis: "التحليل السياسي",
    keyChanges: "التغييرات الرئيسية",
    whoAffected: "المتأثرون",
    politicalContext: "السياق السياسي",
    implementation: "الجدول الزمني للتنفيذ",
    budgetImpact: "التأثير على الميزانية",
    govResponse: "رد الحكومة",
    legislativePath: "المسار التشريعي"
  },
  he: {
    title: "חוק נשק והונאה במע״מ: סדרי עדיפויות תידו השבוע",
    description: "עשר הצעות מסמנות את מיקוד הקואליציה באכיפת חוק, מניעת פשיעה כלכלית ופיקוח רגולטורי עם התקרבות חופשת האביב",
    readTime: "8 דקות קריאה",
    analysis: "ניתוח",
    execSummary: "תקציר מנהלים",
    lawEnforcement: "אכיפת חוק ואמצעי ביטחון",
    financialCrime: "מניעת פשיעה כלכלית",
    financialStability: "יציבות פיננסית",
    digitalId: "זהות דיגיטלית ומודרניזציה מנהלית",
    govAccountability: "אחריות ממשלתית",
    regulatory: "ציות רגולטורי",
    crossCutting: "ניתוח רוחבי: סדרי עדיפויות אסטרטגיים של הממשלה",
    whatToWatch: "מה לעקוב אחר השבוע",
    sources: "מקורות ונתונים",
    dataSources: "מקורות מידע",
    generatedBy: "נוצר על ידי",
    methodology: "מתודולוגיית ניתוח",
    docRefs: "הפניות למסמכים",
    backToNews: "→ חזרה לחדשות",
    document: "מסמך",
    ministry: "משרד",
    submitted: "הוגש",
    policyAnalysis: "ניתוח מדיניות",
    keyChanges: "שינויים מרכזיים",
    whoAffected: "מי מושפע",
    politicalContext: "הקשר פוליטי",
    implementation: "לוח זמנים ליישום",
    budgetImpact: "השפעה תקציבית",
    govResponse: "תגובת הממשלה",
    legislativePath: "מסלול חקיקתי"
  },
  ja: {
    title: "武器法と付加価値税詐欺：今週のTidö優先事項",
    description: "春季休会が近づく中、法執行、金融犯罪防止、規制監督に対する連立政権の焦点を示す10の提案",
    readTime: "読了時間8分",
    analysis: "分析",
    execSummary: "要約",
    lawEnforcement: "法執行と安全対策",
    financialCrime: "金融犯罪防止",
    financialStability: "金融安定性",
    digitalId: "デジタルアイデンティティと行政近代化",
    govAccountability: "政府の説明責任",
    regulatory: "規制遵守",
    crossCutting: "横断的分析：政府の戦略的優先事項",
    whatToWatch: "今週注目すべきこと",
    sources: "情報源とデータ",
    dataSources: "データソース",
    generatedBy: "生成元",
    methodology: "分析方法論",
    docRefs: "文書参照",
    backToNews: "← ニュースに戻る",
    document: "文書",
    ministry: "省庁",
    submitted: "提出日",
    policyAnalysis: "政策分析",
    keyChanges: "主要な変更",
    whoAffected: "影響を受ける対象",
    politicalContext: "政治的背景",
    implementation: "実施スケジュール",
    budgetImpact: "予算への影響",
    govResponse: "政府の回答",
    legislativePath: "立法プロセス"
  },
  ko: {
    title: "무기법과 부가가치세 사기: 이번 주 Tidö 우선순위",
    description: "봄 휴회가 다가오면서 법 집행, 금융 범죄 예방, 규제 감독에 대한 연립정부의 초점을 나타내는 10개 제안",
    readTime: "8분 읽기",
    analysis: "분석",
    execSummary: "요약",
    lawEnforcement: "법 집행 및 보안 조치",
    financialCrime: "금융 범죄 예방",
    financialStability: "금융 안정성",
    digitalId: "디지털 신원 및 행정 현대화",
    govAccountability: "정부 책임성",
    regulatory: "규제 준수",
    crossCutting: "교차 분석: 정부의 전략적 우선순위",
    whatToWatch: "이번 주 주목할 사항",
    sources: "출처 및 데이터",
    dataSources: "데이터 출처",
    generatedBy: "생성자",
    methodology: "분석 방법론",
    docRefs: "문서 참조",
    backToNews: "← 뉴스로 돌아가기",
    document: "문서",
    ministry: "부처",
    submitted: "제출일",
    policyAnalysis: "정책 분석",
    keyChanges: "주요 변경사항",
    whoAffected: "영향을 받는 대상",
    politicalContext: "정치적 맥락",
    implementation: "실행 일정",
    budgetImpact: "예산 영향",
    govResponse: "정부 응답",
    legislativePath: "입법 절차"
  },
  zh: {
    title: "武器法和增值税欺诈：本周Tidö优先事项",
    description: "随着春季休会临近，十项提案表明联盟政府关注执法、预防金融犯罪和监管监督",
    readTime: "8分钟阅读",
    analysis: "分析",
    execSummary: "执行摘要",
    lawEnforcement: "执法和安全措施",
    financialCrime: "金融犯罪预防",
    financialStability: "金融稳定性",
    digitalId: "数字身份和行政现代化",
    govAccountability: "政府问责制",
    regulatory: "监管合规",
    crossCutting: "横向分析：政府战略优先事项",
    whatToWatch: "本周关注要点",
    sources: "来源和数据",
    dataSources: "数据来源",
    generatedBy: "生成者",
    methodology: "分析方法论",
    docRefs: "文档参考",
    backToNews: "← 返回新闻",
    document: "文档",
    ministry: "部门",
    submitted: "提交日期",
    policyAnalysis: "政策分析",
    keyChanges: "关键变化",
    whoAffected: "受影响对象",
    politicalContext: "政治背景",
    implementation: "实施时间表",
    budgetImpact: "预算影响",
    govResponse: "政府回应",
    legislativePath: "立法路径"
  }
};

// Language metadata
const langMeta = {
  sv: { locale: "sv_SE", hreflang: "sv", flag: "🇸🇪", name: "Svenska", dir: "ltr" },
  da: { locale: "da_DK", hreflang: "da", flag: "🇩🇰", name: "Dansk", dir: "ltr" },
  no: { locale: "nb_NO", hreflang: "no", flag: "🇳🇴", name: "Norsk", dir: "ltr" },
  fi: { locale: "fi_FI", hreflang: "fi", flag: "🇫🇮", name: "Suomi", dir: "ltr" },
  de: { locale: "de_DE", hreflang: "de", flag: "🇩🇪", name: "Deutsch", dir: "ltr" },
  fr: { locale: "fr_FR", hreflang: "fr", flag: "🇫🇷", name: "Français", dir: "ltr" },
  es: { locale: "es_ES", hreflang: "es", flag: "🇪🇸", name: "Español", dir: "ltr" },
  nl: { locale: "nl_NL", hreflang: "nl", flag: "🇳🇱", name: "Nederlands", dir: "ltr" },
  ar: { locale: "ar_SA", hreflang: "ar", flag: "🇸🇦", name: "العربية", dir: "rtl" },
  he: { locale: "he_IL", hreflang: "he", flag: "🇮🇱", name: "עברית", dir: "rtl" },
  ja: { locale: "ja_JP", hreflang: "ja", flag: "🇯🇵", name: "日本語", dir: "ltr" },
  ko: { locale: "ko_KR", hreflang: "ko", flag: "🇰🇷", name: "한국어", dir: "ltr" },
  zh: { locale: "zh_CN", hreflang: "zh", flag: "🇨🇳", name: "中文", dir: "ltr" }
};

function translateFile(sourceFile, outputDir, targetLang) {
  const content = fs.readFileSync(sourceFile, 'utf-8');
  const trans = translations[targetLang];
  const meta = langMeta[targetLang];
  
  // Extract date from filename (e.g. "2026-02-18-government-propositions-en.html")
  // to differentiate titles/descriptions across dates.
  const dateMatch = path.basename(sourceFile).match(/(\d{4}-\d{2}-\d{2})/);
  const articleDate = dateMatch ? dateMatch[1] : '';
  const dateStampedTitle = articleDate ? `${trans.title} — ${articleDate}` : trans.title;
  const dateStampedDescription = articleDate
    ? `${trans.description} (${articleDate})`
    : trans.description;
  
  let translated = content;
  
  translated = translated.replace('<html lang="en">', `<html lang="${targetLang}"${meta.dir === 'rtl' ? ' dir="rtl"' : ''}>`);
  
  translated = translated.replace(/<title>.*?<\/title>/, `<title>${dateStampedTitle}</title>`);
  
  translated = translated.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${dateStampedDescription}">`
  );
  
  translated = translated.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${trans.title}">`
  );
  translated = translated.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${trans.description}">`
  );
  translated = translated.replace(
    /<meta property="og:locale" content=".*?">/,
    `<meta property="og:locale" content="${meta.locale}">`
  );
  
  translated = translated.replace(
    /<meta name="twitter:title" content=".*?">/,
    `<meta name="twitter:title" content="${trans.title}">`
  );
  translated = translated.replace(
    /<meta name="twitter:description" content=".*?">/,
    `<meta name="twitter:description" content="${trans.description}">`
  );
  translated = translated.replace(
    /<meta name="twitter:data1" content=".*?">/,
    `<meta name="twitter:data1" content="${trans.readTime}">`
  );
  translated = translated.replace(
    /<meta name="twitter:data2" content=".*?">/,
    `<meta name="twitter:data2" content="${trans.analysis}">`
  );
  
  translated = translated.replace(
    /"headline": ".*?"/,
    `"headline": "${trans.title}"`
  );
  translated = translated.replace(
    /"alternativeHeadline": ".*?"/,
    `"alternativeHeadline": "${trans.description}"`
  );
  
  const newsArticleTypeIndex = translated.indexOf('"@type": "NewsArticle"');
  if (newsArticleTypeIndex !== -1) {
    const newsArticleObjectStart = translated.lastIndexOf('{', newsArticleTypeIndex);
    if (newsArticleObjectStart !== -1) {
      let depth = 0;
      let newsArticleObjectEnd = -1;
      for (let i = newsArticleObjectStart; i < translated.length; i++) {
        const ch = translated[i];
        if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0) {
            newsArticleObjectEnd = i;
            break;
          }
        }
      }

      if (newsArticleObjectEnd !== -1) {
        const descStart = translated.indexOf('"description":', newsArticleTypeIndex);
        if (descStart !== -1 && descStart < newsArticleObjectEnd) {
          const descriptionKey = '"description":';
          const firstQuoteIndex = translated.indexOf('"', descStart + descriptionKey.length);
          if (firstQuoteIndex !== -1 && firstQuoteIndex < newsArticleObjectEnd) {
            const descValueStart = firstQuoteIndex + 1;
            const descValueEnd = translated.indexOf('"', descValueStart);
            if (descValueEnd !== -1 && descValueEnd <= newsArticleObjectEnd) {
              translated =
                translated.substring(0, descValueStart) +
                trans.description +
                translated.substring(descValueEnd);
            }
          }
        }
      }
    }
  }
  
  translated = translated.replace(
    /"inLanguage": ".*?"/,
    `"inLanguage": "${targetLang}"`
  );
  
  translated = translated.replace(
    /"name": "Government Propositions: Policy Priorities This Week"/g,
    `"name": "${trans.title}"`
  );
  
  translated = translated.replace(
    /<h1>.*?<\/h1>/,
    `<h1>${trans.title}</h1>`
  );
  
  translated = translated.replace(
    /<span>Analysis<\/span>/,
    `<span>${trans.analysis}</span>`
  );
  translated = translated.replace(
    /<span>8 min read<\/span>/,
    `<span>${trans.readTime}</span>`
  );
  
  translated = translated.replace(
    /<p class="lede">[\s\S]*?<\/p>/,
    `<p class="lede">\n      ${trans.description}\n    </p>`
  );
  
  translated = translated.replace(/<h2>Executive Summary<\/h2>/, `<h2>${trans.execSummary}</h2>`);
  translated = translated.replace(/<h2>Law Enforcement and Security Measures<\/h2>/, `<h2>${trans.lawEnforcement}</h2>`);
  translated = translated.replace(/<h2>Financial Crime Prevention<\/h2>/, `<h2>${trans.financialCrime}</h2>`);
  translated = translated.replace(/<h2>Financial Sector Resilience<\/h2>/, `<h2>${trans.financialStability}</h2>`);
  translated = translated.replace(/<h2>Digital Identity and Administrative Modernization<\/h2>/, `<h2>${trans.digitalId}</h2>`);
  translated = translated.replace(/<h2>Government Accountability Responses<\/h2>/, `<h2>${trans.govAccountability}</h2>`);
  translated = translated.replace(/<h2>Regulatory Compliance<\/h2>/, `<h2>${trans.regulatory}</h2>`);
  translated = translated.replace(/<h2>Cross-Cutting Analysis: Government Strategic Priorities<\/h2>/, `<h2>${trans.crossCutting}</h2>`);
  translated = translated.replace(/<h2>What to Watch This Week<\/h2>/, `<h2>${trans.whatToWatch}</h2>`);
  
  translated = translated.replace(/<h3>Sources and Data<\/h3>/, `<h3>${trans.sources}</h3>`);
  translated = translated.replace(/<strong>Data Sources:<\/strong>/, `<strong>${trans.dataSources}:</strong>`);
  translated = translated.replace(/<strong>Generated by:<\/strong>/, `<strong>${trans.generatedBy}:</strong>`);
  translated = translated.replace(/<strong>Analysis Methodology:<\/strong>/, `<strong>${trans.methodology}:</strong>`);
  translated = translated.replace(/<strong>Document References:<\/strong>/, `<strong>${trans.docRefs}:</strong>`);
  translated = translated.replace(/← Back to News/, trans.backToNews);
  
  const datePattern = articleDate || '2026-02-18';
  
  const removeEnActivePattern = new RegExp(`(<a href="${datePattern}-government-propositions-en\\.html" class="lang-link) active"`, 'g');
  translated = translated.replace(
    removeEnActivePattern,
    `$1"`
  );
  const addTargetActivePattern = new RegExp(`(<a href="${datePattern}-government-propositions-${targetLang}\\.html" class="lang-link)(?! active")`, 'g');
  translated = translated.replace(
    addTargetActivePattern,
    `$1 active"`
  );
  
  translated = translated.replace(
    /(<link rel="canonical" href=".*?-propositions-)en(\.html">)/,
    `$1${targetLang}$2`
  );
  
  const urlPattern = new RegExp(`(${datePattern}-government-propositions-)en(\\.html)`, 'g');
  translated = translated.replace(urlPattern, `$1${targetLang}$2`);
  
  const basename = path.basename(sourceFile).replace('-en.html', `-${targetLang}.html`);
  const outputPath = path.join(outputDir, basename);
  fs.writeFileSync(outputPath, translated, 'utf-8');
  
  console.log(`✓ Translated to ${targetLang}: ${outputPath}`);
  return outputPath;
}

// Main execution
const sourceFile = process.argv[2];
const outputDir = process.argv[3];

if (!sourceFile) {
  console.error('Usage: node translate-propositions.js <source-file> [output-dir]');
  console.error('');
  console.error('Example: node translate-propositions.js news/2026-02-18-government-propositions-en.html');
  console.error('');
  console.error('NOTE: This script only translates metadata (titles, descriptions, section headings).');
  console.error('      Full article body translation requires professional translation services.');
  process.exit(1);
}

const outputDirectory = outputDir || path.dirname(sourceFile);
const targetLanguages = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

console.log(`Translating ${sourceFile} to ${targetLanguages.length} languages...\n`);
console.log('⚠️  WARNING: This script only translates metadata and section headings.');
console.log('   Article body content remains in the source language.\n');

targetLanguages.forEach(lang => {
  try {
    translateFile(sourceFile, outputDirectory, lang);
  } catch (error) {
    console.error(`✗ Error translating to ${lang}:`, error.message);
  }
});

console.log(`\n✓ Translation complete! Generated ${targetLanguages.length} files.`);
