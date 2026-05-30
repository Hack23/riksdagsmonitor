/**
 * @module Infrastructure/RenderLib/SectionTitleI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Localised article section titles — single source of truth
 *
 * @description
 * Maps a language-stable, canonical article **section slug** (the normalized
 * `<h2 id>` produced by the aggregator, e.g. `risk-assessment`,
 * `deep-dive-cross-reference-map`) to a localised, journalist-framed section
 * title across all 14 supported {@link Language}s.
 *
 * This is the single source of truth consumed by the in-article Table of
 * Contents ({@link ./article-scannability.js#generateArticleToc}) so that TOC
 * navigation chrome reads in the article's own language even though the
 * aggregated `article.md` body keeps English landmark headings (required by
 * `scripts/validators/article/rules/landmarks.ts`, and matching the
 * English-only analysis body content).
 *
 * Architecture / reuse:
 *   - Sections whose journalist label equals the backing artifact's own title
 *     delegate to the vetted {@link ARTIFACT_TITLE_I18N} constant (no string
 *     duplication) via {@link SLUG_TO_ARTIFACT_FILE}.
 *   - The `per-document-intelligence` section reuses the reader-guide
 *     `perDocLabel` chrome string so both pointers stay in lock-step.
 *   - Journalist-framed sections that intentionally differ from the backing
 *     artifact title (e.g. "Why It Matters" vs "Synthesis Summary") and the
 *     `Deep Dive: …` prefixed sections carry explicit 14-language entries in
 *     {@link JOURNALIST_SECTION_TITLE_I18N}.
 *
 * English values are byte-identical to the current body headings, so callers
 * may safely localise every language including `en`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';

import { ARTIFACT_TITLE_I18N } from '../political-intelligence/i18n/artifact-i18n.js';

import { READER_GUIDE_I18N } from './aggregator/reader-guide-i18n/index.js';

/** Per-language section title; `en` is always present as the fallback. */
type SectionLangMap = Record<Language, string> | (Partial<Record<Language, string>> & { en: string });

/**
 * Journalist-framed section titles that do not map 1:1 onto a backing
 * artifact title (or have no single backing artifact), plus the
 * `Deep Dive: …` prefixed deep-dive sections. Keyed by canonical slug.
 *
 * English values match the labels emitted by
 * `scripts/render-lib/aggregator/order.ts` (`SECTION_TITLES`) and the
 * sources/coverage appendices, so localising `en` is a no-op.
 */
const JOURNALIST_SECTION_TITLE_I18N: Record<string, SectionLangMap> = {
  'what-happened': {
    en: 'What Happened', sv: 'Vad som hände', da: 'Hvad skete der', no: 'Hva skjedde', fi: 'Mitä tapahtui',
    de: 'Was geschah', fr: "Ce qui s'est passé", es: 'Qué sucedió', nl: 'Wat er gebeurde',
    ar: 'ماذا حدث', he: 'מה קרה', ja: '何が起きたか', ko: '무슨 일이 있었나', zh: '发生了什么',
  },
  'why-it-matters': {
    en: 'Why It Matters', sv: 'Varför det spelar roll', da: 'Hvorfor det betyder noget', no: 'Hvorfor det betyr noe', fi: 'Miksi sillä on väliä',
    de: 'Warum es wichtig ist', fr: "Pourquoi c'est important", es: 'Por qué importa', nl: 'Waarom het ertoe doet',
    ar: 'لماذا يهم', he: 'למה זה חשוב', ja: 'なぜ重要か', ko: '왜 중요한가', zh: '为何重要',
  },
  'key-findings': {
    en: 'Key Findings', sv: 'Nyckelfynd', da: 'Nøglefund', no: 'Nøkkelfunn', fi: 'Keskeiset havainnot',
    de: 'Wichtigste Erkenntnisse', fr: 'Principaux constats', es: 'Hallazgos clave', nl: 'Belangrijkste bevindingen',
    ar: 'أبرز النتائج', he: 'ממצאים עיקריים', ja: '主要な調査結果', ko: '주요 결과', zh: '主要发现',
  },
  'analysis-artifact-coverage-report': {
    en: 'Analysis Artifact Coverage Report', sv: 'Täckningsrapport för analysartefakter', da: 'Dækningsrapport for analyseartefakter', no: 'Dekningsrapport for analyseartefakter', fi: 'Analyysiartefaktien kattavuusraportti',
    de: 'Abdeckungsbericht der Analyseartefakte', fr: "Rapport de couverture des artefacts d'analyse", es: 'Informe de cobertura de artefactos de análisis', nl: 'Dekkingsrapport van analyseartefacten',
    ar: 'تقرير تغطية مصنوعات التحليل', he: 'דוח כיסוי של תוצרי הניתוח', ja: '分析アーティファクト網羅レポート', ko: '분석 산출물 커버리지 보고서', zh: '分析工件覆盖报告',
  },
  'deep-dive-classification-results': {
    en: 'Deep Dive: Classification Results', sv: 'Fördjupning: Klassificeringsresultat', da: 'Dybdegående: Klassificeringsresultater', no: 'Fordypning: Klassifiseringsresultater', fi: 'Syväluotaus: Luokitustulokset',
    de: 'Vertiefung: Klassifikationsergebnisse', fr: 'Analyse approfondie : Résultats de classification', es: 'Análisis profundo: Resultados de clasificación', nl: 'Verdieping: Classificatieresultaten',
    ar: 'تحليل معمق: نتائج التصنيف', he: 'צלילה לעומק: תוצאות סיווג', ja: '詳細分析：分類結果', ko: '심층 분석: 분류 결과', zh: '深入分析：分类结果',
  },
  'deep-dive-cross-reference-map': {
    en: 'Deep Dive: Cross-Reference Map', sv: 'Fördjupning: Korsreferenskarta', da: 'Dybdegående: Krydsreferencekort', no: 'Fordypning: Kryssreferansekart', fi: 'Syväluotaus: Ristiviittauskartta',
    de: 'Vertiefung: Querverweiskarte', fr: 'Analyse approfondie : Carte de références croisées', es: 'Análisis profundo: Mapa de referencias cruzadas', nl: 'Verdieping: Kruisverwijzingskaart',
    ar: 'تحليل معمق: خريطة الإسناد الترافقي', he: 'צלילה לעומק: מפת הפניות צולבות', ja: '詳細分析：相互参照マップ', ko: '심층 분석: 교차 참조 맵', zh: '深入分析：交叉引用图',
  },
  'deep-dive-methodology--limitations': {
    en: 'Deep Dive: Methodology & Limitations', sv: 'Fördjupning: Metodik och begränsningar', da: 'Dybdegående: Metode og begrænsninger', no: 'Fordypning: Metode og begrensninger', fi: 'Syväluotaus: Menetelmä ja rajoitukset',
    de: 'Vertiefung: Methodik und Grenzen', fr: 'Analyse approfondie : Méthodologie et limites', es: 'Análisis profundo: Metodología y limitaciones', nl: 'Verdieping: Methodologie en beperkingen',
    ar: 'تحليل معمق: المنهجية والقيود', he: 'צלילה לעומק: מתודולוגיה ומגבלות', ja: '詳細分析：方法論と限界', ko: '심층 분석: 방법론 및 한계', zh: '深入分析：方法论与局限',
  },
  'deep-dive-data-download-manifest': {
    en: 'Deep Dive: Data Download Manifest', sv: 'Fördjupning: Datanedladdningsmanifest', da: 'Dybdegående: Datadownloadmanifest', no: 'Fordypning: Datanedlastingsmanifest', fi: 'Syväluotaus: Tietojen latausmanifesti',
    de: 'Vertiefung: Daten-Download-Manifest', fr: 'Analyse approfondie : Manifeste de téléchargement', es: 'Análisis profundo: Manifiesto de descarga de datos', nl: 'Verdieping: Data-downloadmanifest',
    ar: 'تحليل معمق: بيان تنزيل البيانات', he: 'צלילה לעומק: מניפסט הורדת נתונים', ja: '詳細分析：データ取得マニフェスト', ko: '심층 분석: 데이터 다운로드 매니페스트', zh: '深入分析：数据下载清单',
  },
  'deep-dive-political-classification': {
    en: 'Deep Dive: Political Classification', sv: 'Fördjupning: Politisk klassificering', da: 'Dybdegående: Politisk klassificering', no: 'Fordypning: Politisk klassifisering', fi: 'Syväluotaus: Poliittinen luokitus',
    de: 'Vertiefung: Politische Klassifikation', fr: 'Analyse approfondie : Classification politique', es: 'Análisis profundo: Clasificación política', nl: 'Verdieping: Politieke classificatie',
    ar: 'تحليل معمق: التصنيف السياسي', he: 'צלילה לעומק: סיווג פוליטי', ja: '詳細分析：政治的分類', ko: '심층 분석: 정치적 분류', zh: '深入分析：政治分类',
  },

  // ── Secondary analysis artifacts (stable section headings from order.ts) ──
  'pestle-analysis': {
    en: 'PESTLE Analysis', sv: 'PESTLE-analys', da: 'PESTLE-analyse', no: 'PESTLE-analyse', fi: 'PESTLE-analyysi',
    de: 'PESTLE-Analyse', fr: 'Analyse PESTLE', es: 'Análisis PESTLE', nl: 'PESTLE-analyse',
    ar: 'تحليل PESTLE', he: 'ניתוח PESTLE', ja: 'PESTLE 分析', ko: 'PESTLE 분석', zh: 'PESTLE 分析',
  },
  'quantitative-swot': {
    en: 'Quantitative SWOT', sv: 'Kvantitativ SWOT', da: 'Kvantitativ SWOT', no: 'Kvantitativ SWOT', fi: 'Kvantitatiivinen SWOT',
    de: 'Quantitative SWOT', fr: 'SWOT quantitatif', es: 'SWOT cuantitativo', nl: 'Kwantitatieve SWOT',
    ar: 'تحليل SWOT الكمي', he: 'SWOT כמותי', ja: '定量的 SWOT', ko: '정량적 SWOT', zh: '量化 SWOT',
  },
  'wildcards--black-swans': {
    en: 'Wildcards & Black Swans', sv: 'Jokrar och svarta svanar', da: 'Wildcards og sorte svaner', no: 'Jokere og svarte svaner', fi: 'Jokerit ja mustat joutsenet',
    de: 'Wildcards und Schwarze Schwäne', fr: 'Jokers et cygnes noirs', es: 'Comodines y cisnes negros', nl: 'Wildcards en zwarte zwanen',
    ar: 'العوامل غير المتوقعة والبجعات السوداء', he: 'גורמי פתע וברבורים שחורים', ja: 'ワイルドカードとブラックスワン', ko: '와일드카드와 블랙스완', zh: '意外因素与黑天鹅',
  },
  'political-stride-assessment': {
    en: 'Political STRIDE Assessment', sv: 'Politisk STRIDE-bedömning', da: 'Politisk STRIDE-vurdering', no: 'Politisk STRIDE-vurdering', fi: 'Poliittinen STRIDE-arvio',
    de: 'Politische STRIDE-Bewertung', fr: 'Évaluation STRIDE politique', es: 'Evaluación STRIDE política', nl: 'Politieke STRIDE-beoordeling',
    ar: 'تقييم STRIDE السياسي', he: 'הערכת STRIDE פוליטית', ja: '政治的 STRIDE 評価', ko: '정치적 STRIDE 평가', zh: '政治 STRIDE 评估',
  },
  'cycle-trajectory': {
    en: 'Cycle Trajectory', sv: 'Cykelbana', da: 'Cyklusbane', no: 'Syklusbane', fi: 'Syklin kulku',
    de: 'Zyklusverlauf', fr: 'Trajectoire du cycle', es: 'Trayectoria del ciclo', nl: 'Cyclustraject',
    ar: 'مسار الدورة', he: 'מסלול המחזור', ja: 'サイクルの軌道', ko: '주기 궤적', zh: '周期轨迹',
  },
  'election-cycle-analysis': {
    en: 'Election Cycle Analysis', sv: 'Valcykelanalys', da: 'Valgcyklusanalyse', no: 'Valgsyklusanalyse', fi: 'Vaalisyklin analyysi',
    de: 'Wahlzyklus-Analyse', fr: 'Analyse du cycle électoral', es: 'Análisis del ciclo electoral', nl: 'Verkiezingscyclusanalyse',
    ar: 'تحليل الدورة الانتخابية', he: 'ניתוח מחזור הבחירות', ja: '選挙サイクル分析', ko: '선거 주기 분석', zh: '选举周期分析',
  },
  'parliamentary-season-outlook': {
    en: 'Parliamentary Season Outlook', sv: 'Utsikter för riksdagssäsongen', da: 'Udsigter for parlamentssæsonen', no: 'Utsikter for stortingssesongen', fi: 'Istuntokauden näkymät',
    de: 'Ausblick auf die Parlamentssaison', fr: 'Perspectives de la session parlementaire', es: 'Perspectivas de la temporada parlamentaria', nl: 'Vooruitzichten parlementair seizoen',
    ar: 'توقعات الدورة البرلمانية', he: 'תחזית מושב הפרלמנט', ja: '議会会期の展望', ko: '의회 회기 전망', zh: '议会会期展望',
  },
  'horizon-pir-roll-forward': {
    en: 'Horizon PIR Roll-Forward', sv: 'Horisont PIR-framskrivning', da: 'Horisont PIR-fremskrivning', no: 'Horisont PIR-fremskriving', fi: 'Horisontti PIR -päivitys',
    de: 'Horizont-PIR-Fortschreibung', fr: 'Report PIR à l’horizon', es: 'Actualización PIR de horizonte', nl: 'Horizon PIR-doorrol',
    ar: 'تحديث PIR للأفق', he: 'גלגול PIR לאופק', ja: 'ホライズン PIR ロールフォワード', ko: '호라이즌 PIR 롤포워드', zh: '展望期 PIR 滚动更新',
  },

  // ── Recurring journalist topical sections ──
  'actor-analysis': {
    en: 'Actor Analysis', sv: 'Aktörsanalys', da: 'Aktøranalyse', no: 'Aktøranalyse', fi: 'Toimija-analyysi',
    de: 'Akteursanalyse', fr: 'Analyse des acteurs', es: 'Análisis de actores', nl: 'Actoranalyse',
    ar: 'تحليل الفاعلين', he: 'ניתוח שחקנים', ja: 'アクター分析', ko: '행위자 분석', zh: '行为者分析',
  },
  'actor-assessment': {
    en: 'Actor Assessment', sv: 'Aktörsbedömning', da: 'Aktørvurdering', no: 'Aktørvurdering', fi: 'Toimija-arvio',
    de: 'Akteursbewertung', fr: 'Évaluation des acteurs', es: 'Evaluación de actores', nl: 'Actorbeoordeling',
    ar: 'تقييم الفاعلين', he: 'הערכת שחקנים', ja: 'アクター評価', ko: '행위자 평가', zh: '行为者评估',
  },
  'actor-network': {
    en: 'Actor Network', sv: 'Aktörsnätverk', da: 'Aktørnetværk', no: 'Aktørnettverk', fi: 'Toimijaverkosto',
    de: 'Akteursnetzwerk', fr: 'Réseau d’acteurs', es: 'Red de actores', nl: 'Actornetwerk',
    ar: 'شبكة الفاعلين', he: 'רשת שחקנים', ja: 'アクター・ネットワーク', ko: '행위자 네트워크', zh: '行为者网络',
  },
  'civil-society-analysis': {
    en: 'Civil Society Analysis', sv: 'Civilsamhällesanalys', da: 'Civilsamfundsanalyse', no: 'Sivilsamfunnsanalyse', fi: 'Kansalaisyhteiskunnan analyysi',
    de: 'Zivilgesellschaftsanalyse', fr: 'Analyse de la société civile', es: 'Análisis de la sociedad civil', nl: 'Analyse maatschappelijk middenveld',
    ar: 'تحليل المجتمع المدني', he: 'ניתוח החברה האזרחית', ja: '市民社会分析', ko: '시민사회 분석', zh: '公民社会分析',
  },
  'coalition-stability': {
    en: 'Coalition Stability', sv: 'Koalitionsstabilitet', da: 'Koalitionsstabilitet', no: 'Koalisjonsstabilitet', fi: 'Koalition vakaus',
    de: 'Koalitionsstabilität', fr: 'Stabilité de la coalition', es: 'Estabilidad de la coalición', nl: 'Coalitiestabiliteit',
    ar: 'استقرار الائتلاف', he: 'יציבות הקואליציה', ja: '連立の安定性', ko: '연립 안정성', zh: '联盟稳定性',
  },
  'coalition-dynamics': {
    en: 'Coalition Dynamics', sv: 'Koalitionsdynamik', da: 'Koalitionsdynamik', no: 'Koalisjonsdynamikk', fi: 'Koalitiodynamiikka',
    de: 'Koalitionsdynamik', fr: 'Dynamique de la coalition', es: 'Dinámica de la coalición', nl: 'Coalitiedynamiek',
    ar: 'ديناميكيات الائتلاف', he: 'דינמיקת הקואליציה', ja: '連立の力学', ko: '연립 역학', zh: '联盟动态',
  },
  'coalition-implications': {
    en: 'Coalition Implications', sv: 'Koalitionsimplikationer', da: 'Koalitionsimplikationer', no: 'Koalisjonsimplikasjoner', fi: 'Koalition seuraukset',
    de: 'Koalitionsimplikationen', fr: 'Implications pour la coalition', es: 'Implicaciones para la coalición', nl: 'Coalitie-implicaties',
    ar: 'تداعيات الائتلاف', he: 'השלכות הקואליציה', ja: '連立への影響', ko: '연립에 대한 함의', zh: '联盟影响',
  },
  'defence-policy-analysis': {
    en: 'Defence Policy Analysis', sv: 'Försvarspolitisk analys', da: 'Forsvarspolitisk analyse', no: 'Forsvarspolitisk analyse', fi: 'Puolustuspolitiikan analyysi',
    de: 'Verteidigungspolitische Analyse', fr: 'Analyse de la politique de défense', es: 'Análisis de la política de defensa', nl: 'Analyse defensiebeleid',
    ar: 'تحليل سياسة الدفاع', he: 'ניתוח מדיניות הביטחון', ja: '防衛政策分析', ko: '국방 정책 분석', zh: '国防政策分析',
  },
  'defence-security': {
    en: 'Defence & Security', sv: 'Försvar och säkerhet', da: 'Forsvar og sikkerhed', no: 'Forsvar og sikkerhet', fi: 'Puolustus ja turvallisuus',
    de: 'Verteidigung und Sicherheit', fr: 'Défense et sécurité', es: 'Defensa y seguridad', nl: 'Defensie en veiligheid',
    ar: 'الدفاع والأمن', he: 'ביטחון והגנה', ja: '防衛と安全保障', ko: '국방과 안보', zh: '国防与安全',
  },
  'economic-policy-analysis': {
    en: 'Economic Policy Analysis', sv: 'Ekonomisk-politisk analys', da: 'Økonomisk-politisk analyse', no: 'Økonomisk-politisk analyse', fi: 'Talouspolitiikan analyysi',
    de: 'Wirtschaftspolitische Analyse', fr: 'Analyse de la politique économique', es: 'Análisis de la política económica', nl: 'Analyse economisch beleid',
    ar: 'تحليل السياسة الاقتصادية', he: 'ניתוח מדיניות כלכלית', ja: '経済政策分析', ko: '경제 정책 분석', zh: '经济政策分析',
  },
  'economic-context': {
    en: 'Economic Context', sv: 'Ekonomisk kontext', da: 'Økonomisk kontekst', no: 'Økonomisk kontekst', fi: 'Taloudellinen konteksti',
    de: 'Wirtschaftlicher Kontext', fr: 'Contexte économique', es: 'Contexto económico', nl: 'Economische context',
    ar: 'السياق الاقتصادي', he: 'הקשר כלכלי', ja: '経済的背景', ko: '경제적 맥락', zh: '经济背景',
  },
  'economic-impact': {
    en: 'Economic Impact', sv: 'Ekonomisk påverkan', da: 'Økonomisk virkning', no: 'Økonomisk virkning', fi: 'Taloudellinen vaikutus',
    de: 'Wirtschaftliche Auswirkungen', fr: 'Impact économique', es: 'Impacto económico', nl: 'Economische impact',
    ar: 'الأثر الاقتصادي', he: 'השפעה כלכלית', ja: '経済的影響', ko: '경제적 영향', zh: '经济影响',
  },
  'election-proximity-analysis': {
    en: 'Election Proximity Analysis', sv: 'Analys av valnärhet', da: 'Analyse af valgnærhed', no: 'Analyse av valgnærhet', fi: 'Vaalien läheisyyden analyysi',
    de: 'Analyse der Wahlnähe', fr: 'Analyse de la proximité électorale', es: 'Análisis de proximidad electoral', nl: 'Analyse verkiezingsnabijheid',
    ar: 'تحليل قرب الانتخابات', he: 'ניתוח קרבת הבחירות', ja: '選挙近接性分析', ko: '선거 임박성 분석', zh: '选举临近度分析',
  },
  'electoral-implications': {
    en: 'Electoral Implications', sv: 'Valmässiga implikationer', da: 'Valgmæssige implikationer', no: 'Valgmessige implikasjoner', fi: 'Vaaleihin liittyvät seuraukset',
    de: 'Wahlpolitische Implikationen', fr: 'Implications électorales', es: 'Implicaciones electorales', nl: 'Electorale implicaties',
    ar: 'التداعيات الانتخابية', he: 'השלכות אלקטורליות', ja: '選挙への影響', ko: '선거적 함의', zh: '选举影响',
  },
  'electoral-analysis': {
    en: 'Electoral Analysis', sv: 'Valanalys', da: 'Valganalyse', no: 'Valganalyse', fi: 'Vaalianalyysi',
    de: 'Wahlanalyse', fr: 'Analyse électorale', es: 'Análisis electoral', nl: 'Electorale analyse',
    ar: 'تحليل انتخابي', he: 'ניתוח אלקטורלי', ja: '選挙分析', ko: '선거 분석', zh: '选举分析',
  },
  'electoral-forecast': {
    en: 'Electoral Forecast', sv: 'Valprognos', da: 'Valgprognose', no: 'Valgprognose', fi: 'Vaaliennuste',
    de: 'Wahlprognose', fr: 'Prévision électorale', es: 'Pronóstico electoral', nl: 'Verkiezingsprognose',
    ar: 'التوقعات الانتخابية', he: 'תחזית בחירות', ja: '選挙予測', ko: '선거 예측', zh: '选举预测',
  },
  'infrastructure-analysis': {
    en: 'Infrastructure Analysis', sv: 'Infrastrukturanalys', da: 'Infrastrukturanalyse', no: 'Infrastrukturanalyse', fi: 'Infrastruktuurianalyysi',
    de: 'Infrastrukturanalyse', fr: 'Analyse des infrastructures', es: 'Análisis de infraestructura', nl: 'Infrastructuuranalyse',
    ar: 'تحليل البنية التحتية', he: 'ניתוח תשתיות', ja: 'インフラ分析', ko: '인프라 분석', zh: '基础设施分析',
  },
  'international-context': {
    en: 'International Context', sv: 'Internationell kontext', da: 'International kontekst', no: 'Internasjonal kontekst', fi: 'Kansainvälinen konteksti',
    de: 'Internationaler Kontext', fr: 'Contexte international', es: 'Contexto internacional', nl: 'Internationale context',
    ar: 'السياق الدولي', he: 'הקשר בינלאומי', ja: '国際的背景', ko: '국제적 맥락', zh: '国际背景',
  },
  'geopolitical-context': {
    en: 'Geopolitical Context', sv: 'Geopolitisk kontext', da: 'Geopolitisk kontekst', no: 'Geopolitisk kontekst', fi: 'Geopoliittinen konteksti',
    de: 'Geopolitischer Kontext', fr: 'Contexte géopolitique', es: 'Contexto geopolítico', nl: 'Geopolitieke context',
    ar: 'السياق الجيوسياسي', he: 'הקשר גאופוליטי', ja: '地政学的背景', ko: '지정학적 맥락', zh: '地缘政治背景',
  },
  'eu-context': {
    en: 'EU Context', sv: 'EU-kontext', da: 'EU-kontekst', no: 'EU-kontekst', fi: 'EU-konteksti',
    de: 'EU-Kontext', fr: 'Contexte européen', es: 'Contexto de la UE', nl: 'EU-context',
    ar: 'سياق الاتحاد الأوروبي', he: 'הקשר האיחוד האירופי', ja: 'EU の文脈', ko: 'EU 맥락', zh: '欧盟背景',
  },
  'comparative-context': {
    en: 'Comparative Context', sv: 'Jämförande kontext', da: 'Sammenlignende kontekst', no: 'Sammenlignende kontekst', fi: 'Vertaileva konteksti',
    de: 'Vergleichender Kontext', fr: 'Contexte comparatif', es: 'Contexto comparativo', nl: 'Vergelijkende context',
    ar: 'السياق المقارن', he: 'הקשר השוואתי', ja: '比較の文脈', ko: '비교 맥락', zh: '比较背景',
  },
  'comparative-analysis': {
    en: 'Comparative Analysis', sv: 'Jämförande analys', da: 'Sammenlignende analyse', no: 'Sammenlignende analyse', fi: 'Vertaileva analyysi',
    de: 'Vergleichende Analyse', fr: 'Analyse comparative', es: 'Análisis comparativo', nl: 'Vergelijkende analyse',
    ar: 'تحليل مقارن', he: 'ניתוח השוואתי', ja: '比較分析', ko: '비교 분석', zh: '比较分析',
  },
  'media-narrative-analysis': {
    en: 'Media Narrative Analysis', sv: 'Analys av medienarrativ', da: 'Analyse af medienarrativ', no: 'Analyse av medienarrativ', fi: 'Mediakerronnan analyysi',
    de: 'Analyse des Mediennarrativs', fr: 'Analyse du récit médiatique', es: 'Análisis de la narrativa mediática', nl: 'Analyse medianarratief',
    ar: 'تحليل السردية الإعلامية', he: 'ניתוח הנרטיב התקשורתי', ja: 'メディア・ナラティブ分析', ko: '미디어 내러티브 분석', zh: '媒体叙事分析',
  },
  'media-narrative': {
    en: 'Media Narrative', sv: 'Medienarrativ', da: 'Medienarrativ', no: 'Medienarrativ', fi: 'Mediakerronta',
    de: 'Mediennarrativ', fr: 'Récit médiatique', es: 'Narrativa mediática', nl: 'Medianarratief',
    ar: 'السردية الإعلامية', he: 'הנרטיב התקשורתי', ja: 'メディア・ナラティブ', ko: '미디어 내러티브', zh: '媒体叙事',
  },
  'media-framing': {
    en: 'Media Framing', sv: 'Medieram', da: 'Medierammesætning', no: 'Medierammeverk', fi: 'Mediakehystys',
    de: 'Medienrahmung', fr: 'Cadrage médiatique', es: 'Encuadre mediático', nl: 'Media-framing',
    ar: 'التأطير الإعلامي', he: 'מסגור תקשורתי', ja: 'メディア・フレーミング', ko: '미디어 프레이밍', zh: '媒体框架',
  },
  'opposition-mapping': {
    en: 'Opposition Mapping', sv: 'Kartläggning av opposition', da: 'Kortlægning af opposition', no: 'Kartlegging av opposisjon', fi: 'Opposition kartoitus',
    de: 'Kartierung der Opposition', fr: 'Cartographie de l’opposition', es: 'Mapeo de la oposición', nl: 'Oppositie in kaart',
    ar: 'رسم خريطة المعارضة', he: 'מיפוי האופוזיציה', ja: '野党マッピング', ko: '야당 매핑', zh: '反对派图谱',
  },
  'opposition-analysis': {
    en: 'Opposition Analysis', sv: 'Oppositionsanalys', da: 'Oppositionsanalyse', no: 'Opposisjonsanalyse', fi: 'Opposition analyysi',
    de: 'Oppositionsanalyse', fr: 'Analyse de l’opposition', es: 'Análisis de la oposición', nl: 'Oppositieanalyse',
    ar: 'تحليل المعارضة', he: 'ניתוח האופוזיציה', ja: '野党分析', ko: '야당 분석', zh: '反对派分析',
  },
  'opposition-response': {
    en: 'Opposition Response', sv: 'Oppositionens reaktion', da: 'Oppositionens reaktion', no: 'Opposisjonens reaksjon', fi: 'Opposition vastaus',
    de: 'Reaktion der Opposition', fr: 'Réponse de l’opposition', es: 'Respuesta de la oposición', nl: 'Reactie van de oppositie',
    ar: 'رد المعارضة', he: 'תגובת האופוזיציה', ja: '野党の反応', ko: '야당의 대응', zh: '反对派回应',
  },
  'policy-implications': {
    en: 'Policy Implications', sv: 'Policyimplikationer', da: 'Politiske implikationer', no: 'Politiske implikasjoner', fi: 'Politiikan seuraukset',
    de: 'Politische Implikationen', fr: 'Implications politiques', es: 'Implicaciones de política', nl: 'Beleidsimplicaties',
    ar: 'التداعيات على السياسات', he: 'השלכות מדיניות', ja: '政策への影響', ko: '정책적 함의', zh: '政策影响',
  },
  'policy-impact': {
    en: 'Policy Impact', sv: 'Policypåverkan', da: 'Politisk virkning', no: 'Politisk virkning', fi: 'Politiikan vaikutus',
    de: 'Politische Auswirkungen', fr: 'Impact des politiques', es: 'Impacto de las políticas', nl: 'Beleidsimpact',
    ar: 'أثر السياسات', he: 'השפעת המדיניות', ja: '政策の影響', ko: '정책 영향', zh: '政策影响',
  },
  'policy-domain-analysis': {
    en: 'Policy Domain Analysis', sv: 'Analys av politikområde', da: 'Analyse af politikområde', no: 'Analyse av politikkområde', fi: 'Politiikka-alueen analyysi',
    de: 'Analyse des Politikfelds', fr: 'Analyse du domaine politique', es: 'Análisis del ámbito de política', nl: 'Analyse beleidsdomein',
    ar: 'تحليل مجال السياسات', he: 'ניתוח תחום מדיניות', ja: '政策領域分析', ko: '정책 영역 분석', zh: '政策领域分析',
  },
  'social-welfare-analysis': {
    en: 'Social Welfare Analysis', sv: 'Välfärdsanalys', da: 'Velfærdsanalyse', no: 'Velferdsanalyse', fi: 'Hyvinvointianalyysi',
    de: 'Sozialstaatsanalyse', fr: 'Analyse de la protection sociale', es: 'Análisis del bienestar social', nl: 'Analyse sociale zekerheid',
    ar: 'تحليل الرعاية الاجتماعية', he: 'ניתוח רווחה חברתית', ja: '社会福祉分析', ko: '사회복지 분석', zh: '社会福利分析',
  },
  'strategic-intelligence-brief': {
    en: 'Strategic Intelligence Brief', sv: 'Strategisk underrättelsebriefing', da: 'Strategisk efterretningsbriefing', no: 'Strategisk etterretningsbrief', fi: 'Strateginen tiedustelukatsaus',
    de: 'Strategisches Geheimdienst-Briefing', fr: 'Note de renseignement stratégique', es: 'Informe de inteligencia estratégica', nl: 'Strategische inlichtingenbriefing',
    ar: 'موجز استخباراتي استراتيجي', he: 'תקצير מודיעין אסטרטגי', ja: '戦略インテリジェンス・ブリーフ', ko: '전략 정보 브리핑', zh: '战略情报简报',
  },
  'strategic-implications': {
    en: 'Strategic Implications', sv: 'Strategiska implikationer', da: 'Strategiske implikationer', no: 'Strategiske implikasjoner', fi: 'Strategiset seuraukset',
    de: 'Strategische Implikationen', fr: 'Implications stratégiques', es: 'Implicaciones estratégicas', nl: 'Strategische implicaties',
    ar: 'التداعيات الاستراتيجية', he: 'השלכות אסטרטגיות', ja: '戦略的影響', ko: '전략적 함의', zh: '战略影响',
  },
  'timeline-analysis': {
    en: 'Timeline Analysis', sv: 'Tidslinjeanalys', da: 'Tidslinjeanalyse', no: 'Tidslinjeanalyse', fi: 'Aikajana-analyysi',
    de: 'Zeitleisten-Analyse', fr: 'Analyse chronologique', es: 'Análisis cronológico', nl: 'Tijdlijnanalyse',
    ar: 'تحليل الجدول الزمني', he: 'ניתוח ציר זמן', ja: 'タイムライン分析', ko: '타임라인 분석', zh: '时间线分析',
  },
  'key-developments': {
    en: 'Key Developments', sv: 'Viktiga händelser', da: 'Vigtige begivenheder', no: 'Viktige hendelser', fi: 'Keskeiset tapahtumat',
    de: 'Wichtige Entwicklungen', fr: 'Développements clés', es: 'Desarrollos clave', nl: 'Belangrijkste ontwikkelingen',
    ar: 'التطورات الرئيسية', he: 'התפתחויות מרכזיות', ja: '主要な動向', ko: '주요 동향', zh: '主要进展',
  },
  'key-actors': {
    en: 'Key Actors', sv: 'Nyckelaktörer', da: 'Nøgleaktører', no: 'Nøkkelaktører', fi: 'Keskeiset toimijat',
    de: 'Schlüsselakteure', fr: 'Acteurs clés', es: 'Actores clave', nl: 'Sleutelactoren',
    ar: 'الفاعلون الرئيسيون', he: 'שחקנים מרכזיים', ja: '主要なアクター', ko: '주요 행위자', zh: '关键行为者',
  },
  'party-positions': {
    en: 'Party Positions', sv: 'Partiernas ståndpunkter', da: 'Partiernes holdninger', no: 'Partienes standpunkter', fi: 'Puolueiden kannat',
    de: 'Parteipositionen', fr: 'Positions des partis', es: 'Posiciones de los partidos', nl: 'Partijstandpunten',
    ar: 'مواقف الأحزاب', he: 'עמדות המפלגות', ja: '政党の立場', ko: '정당 입장', zh: '政党立场',
  },
  'political-landscape': {
    en: 'Political Landscape', sv: 'Politiskt landskap', da: 'Politisk landskab', no: 'Politisk landskap', fi: 'Poliittinen kenttä',
    de: 'Politische Landschaft', fr: 'Paysage politique', es: 'Panorama político', nl: 'Politiek landschap',
    ar: 'المشهد السياسي', he: 'הנוף הפוליטי', ja: '政治情勢', ko: '정치 지형', zh: '政治格局',
  },
  'public-opinion': {
    en: 'Public Opinion', sv: 'Opinionsläge', da: 'Den offentlige mening', no: 'Opinionen', fi: 'Yleinen mielipide',
    de: 'Öffentliche Meinung', fr: 'Opinion publique', es: 'Opinión pública', nl: 'Publieke opinie',
    ar: 'الرأي العام', he: 'דעת הקהל', ja: '世論', ko: '여론', zh: '民意',
  },
  'historical-baseline': {
    en: 'Historical Baseline', sv: 'Historisk referenslinje', da: 'Historisk basislinje', no: 'Historisk baselinje', fi: 'Historiallinen perustaso',
    de: 'Historische Basislinie', fr: 'Référence historique', es: 'Línea base histórica', nl: 'Historische basislijn',
    ar: 'خط الأساس التاريخي', he: 'קו בסיס היסטורי', ja: '歴史的ベースライン', ko: '역사적 기준선', zh: '历史基线',
  },
  'historical-context': {
    en: 'Historical Context', sv: 'Historisk kontext', da: 'Historisk kontekst', no: 'Historisk kontekst', fi: 'Historiallinen konteksti',
    de: 'Historischer Kontext', fr: 'Contexte historique', es: 'Contexto histórico', nl: 'Historische context',
    ar: 'السياق التاريخي', he: 'הקשר היסטורי', ja: '歴史的背景', ko: '역사적 맥락', zh: '历史背景',
  },
  'horizon-assessment': {
    en: 'Horizon Assessment', sv: 'Horisontbedömning', da: 'Horisontvurdering', no: 'Horisontvurdering', fi: 'Horisonttiarvio',
    de: 'Horizontbewertung', fr: 'Évaluation à l’horizon', es: 'Evaluación de horizonte', nl: 'Horizonbeoordeling',
    ar: 'تقييم الأفق', he: 'הערכת אופק', ja: 'ホライズン評価', ko: '호라이즌 평가', zh: '展望期评估',
  },
  'intelligence-gaps': {
    en: 'Intelligence Gaps', sv: 'Underrättelseluckor', da: 'Efterretningshuller', no: 'Etterretningshull', fi: 'Tiedustelupuutteet',
    de: 'Aufklärungslücken', fr: 'Lacunes du renseignement', es: 'Brechas de inteligencia', nl: 'Inlichtingenhiaten',
    ar: 'فجوات استخباراتية', he: 'פערי מודיעין', ja: 'インテリジェンスの欠落', ko: '정보 공백', zh: '情报缺口',
  },
  'information-gaps': {
    en: 'Information Gaps', sv: 'Informationsluckor', da: 'Informationshuller', no: 'Informasjonshull', fi: 'Tietopuutteet',
    de: 'Informationslücken', fr: 'Lacunes d’information', es: 'Brechas de información', nl: 'Informatiehiaten',
    ar: 'فجوات المعلومات', he: 'פערי מידע', ja: '情報のギャップ', ko: '정보 격차', zh: '信息缺口',
  },
  'institutional-constraints': {
    en: 'Institutional Constraints', sv: 'Institutionella begränsningar', da: 'Institutionelle begrænsninger', no: 'Institusjonelle begrensninger', fi: 'Institutionaaliset rajoitteet',
    de: 'Institutionelle Beschränkungen', fr: 'Contraintes institutionnelles', es: 'Restricciones institucionales', nl: 'Institutionele beperkingen',
    ar: 'القيود المؤسسية', he: 'אילוצים מוסדיים', ja: '制度的制約', ko: '제도적 제약', zh: '制度约束',
  },
  'confidence-calibration': {
    en: 'Confidence Calibration', sv: 'Konfidenskalibrering', da: 'Konfidenskalibrering', no: 'Konfidenskalibrering', fi: 'Luottamustason kalibrointi',
    de: 'Konfidenzkalibrierung', fr: 'Calibrage de la confiance', es: 'Calibración de confianza', nl: 'Vertrouwenskalibratie',
    ar: 'معايرة الثقة', he: 'כיול רמת ביטחון', ja: '確信度の較正', ko: '신뢰도 보정', zh: '置信度校准',
  },
  'confidence-assessment': {
    en: 'Confidence Assessment', sv: 'Konfidensbedömning', da: 'Konfidensvurdering', no: 'Konfidensvurdering', fi: 'Luottamustason arvio',
    de: 'Konfidenzbewertung', fr: 'Évaluation de la confiance', es: 'Evaluación de confianza', nl: 'Vertrouwensbeoordeling',
    ar: 'تقييم الثقة', he: 'הערכת רמת ביטחון', ja: '確信度評価', ko: '신뢰도 평가', zh: '置信度评估',
  },
  'risk-register': {
    en: 'Risk Register', sv: 'Riskregister', da: 'Risikoregister', no: 'Risikoregister', fi: 'Riskirekisteri',
    de: 'Risikoregister', fr: 'Registre des risques', es: 'Registro de riesgos', nl: 'Risicoregister',
    ar: 'سجل المخاطر', he: 'מרשם סיכונים', ja: 'リスク登録簿', ko: '위험 등록부', zh: '风险登记册',
  },
  'risk-indicators': {
    en: 'Risk Indicators', sv: 'Riskindikatorer', da: 'Risikoindikatorer', no: 'Risikoindikatorer', fi: 'Riski-indikaattorit',
    de: 'Risikoindikatoren', fr: 'Indicateurs de risque', es: 'Indicadores de riesgo', nl: 'Risico-indicatoren',
    ar: 'مؤشرات المخاطر', he: 'מדדי סיכון', ja: 'リスク指標', ko: '위험 지표', zh: '风险指标',
  },
  'scenario-tree': {
    en: 'Scenario Tree', sv: 'Scenarioträd', da: 'Scenarietræ', no: 'Scenariotre', fi: 'Skenaariopuu',
    de: 'Szenariobaum', fr: 'Arbre de scénarios', es: 'Árbol de escenarios', nl: 'Scenarioboom',
    ar: 'شجرة السيناريوهات', he: 'עץ תרחישים', ja: 'シナリオ・ツリー', ko: '시나리오 트리', zh: '情景树',
  },
  'forward-look': {
    en: 'Forward Look', sv: 'Framåtblick', da: 'Fremadrettet blik', no: 'Fremoverblikk', fi: 'Tulevaisuuskatsaus',
    de: 'Ausblick', fr: 'Perspectives', es: 'Mirada al futuro', nl: 'Vooruitblik',
    ar: 'نظرة مستقبلية', he: 'מבט קדימה', ja: '今後の見通し', ko: '향후 전망', zh: '前瞻展望',
  },
  'network-analysis': {
    en: 'Network Analysis', sv: 'Nätverksanalys', da: 'Netværksanalyse', no: 'Nettverksanalyse', fi: 'Verkostoanalyysi',
    de: 'Netzwerkanalyse', fr: 'Analyse de réseau', es: 'Análisis de redes', nl: 'Netwerkanalyse',
    ar: 'تحليل الشبكة', he: 'ניתוח רשת', ja: 'ネットワーク分析', ko: '네트워크 분석', zh: '网络分析',
  },
  'trend-analysis': {
    en: 'Trend Analysis', sv: 'Trendanalys', da: 'Trendanalyse', no: 'Trendanalyse', fi: 'Trendianalyysi',
    de: 'Trendanalyse', fr: 'Analyse des tendances', es: 'Análisis de tendencias', nl: 'Trendanalyse',
    ar: 'تحليل الاتجاهات', he: 'ניתוח מגמות', ja: 'トレンド分析', ko: '추세 분석', zh: '趋势分析',
  },
  'voting-analysis': {
    en: 'Voting Analysis', sv: 'Omröstningsanalys', da: 'Afstemningsanalyse', no: 'Avstemningsanalyse', fi: 'Äänestysanalyysi',
    de: 'Abstimmungsanalyse', fr: 'Analyse des votes', es: 'Análisis de votaciones', nl: 'Stemanalyse',
    ar: 'تحليل التصويت', he: 'ניתוח הצבעות', ja: '投票分析', ko: '투표 분석', zh: '投票分析',
  },
  'committee-analysis': {
    en: 'Committee Analysis', sv: 'Utskottsanalys', da: 'Udvalgsanalyse', no: 'Komiteanalyse', fi: 'Valiokunta-analyysi',
    de: 'Ausschussanalyse', fr: 'Analyse des commissions', es: 'Análisis de comisiones', nl: 'Commissieanalyse',
    ar: 'تحليل اللجان', he: 'ניתוח ועדות', ja: '委員会分析', ko: '위원회 분석', zh: '委员会分析',
  },
  'legislative-calendar': {
    en: 'Legislative Calendar', sv: 'Lagstiftningskalender', da: 'Lovgivningskalender', no: 'Lovgivningskalender', fi: 'Lainsäädäntökalenteri',
    de: 'Gesetzgebungskalender', fr: 'Calendrier législatif', es: 'Calendario legislativo', nl: 'Wetgevingskalender',
    ar: 'الجدول التشريعي', he: 'לוח החקיקה', ja: '立法カレンダー', ko: '입법 일정', zh: '立法日程',
  },
  'stakeholder-mapping': {
    en: 'Stakeholder Mapping', sv: 'Intressentkartläggning', da: 'Interessentkortlægning', no: 'Interessentkartlegging', fi: 'Sidosryhmien kartoitus',
    de: 'Stakeholder-Kartierung', fr: 'Cartographie des parties prenantes', es: 'Mapeo de partes interesadas', nl: 'Stakeholdermapping',
    ar: 'رسم خريطة الأطراف المعنية', he: 'מיפוי בעלי עניין', ja: 'ステークホルダー・マッピング', ko: '이해관계자 매핑', zh: '利益相关者图谱',
  },
  'methodology-notes': {
    en: 'Methodology Notes', sv: 'Metodanteckningar', da: 'Metodenoter', no: 'Metodenotater', fi: 'Menetelmämuistiinpanot',
    de: 'Methodenhinweise', fr: 'Notes méthodologiques', es: 'Notas metodológicas', nl: 'Methodologische notities',
    ar: 'ملاحظات منهجية', he: 'הערות מתודולוגיות', ja: '方法論ノート', ko: '방법론 노트', zh: '方法论说明',
  },

  // ── Source / registry & operational chrome (evening & weekly analyses) ──
  'source-registry': {
    en: 'Source Registry', sv: 'Källregister', da: 'Kilderegister', no: 'Kilderegister', fi: 'Lähderekisteri',
    de: 'Quellenregister', fr: 'Registre des sources', es: 'Registro de fuentes', nl: 'Bronregister',
    ar: 'سجل المصادر', he: 'מרשם מקורות', ja: '出典レジストリ', ko: '출처 등록부', zh: '来源登记册',
  },
  'source-inventory': {
    en: 'Source Inventory', sv: 'Källinventering', da: 'Kildeoversigt', no: 'Kildeoversikt', fi: 'Lähdeluettelo',
    de: 'Quelleninventar', fr: 'Inventaire des sources', es: 'Inventario de fuentes', nl: 'Broninventaris',
    ar: 'جرد المصادر', he: 'מצאי מקורות', ja: '出典インベントリ', ko: '출처 목록', zh: '来源清单',
  },
  'source-quality': {
    en: 'Source Quality', sv: 'Källkvalitet', da: 'Kildekvalitet', no: 'Kildekvalitet', fi: 'Lähteiden laatu',
    de: 'Quellenqualität', fr: 'Qualité des sources', es: 'Calidad de las fuentes', nl: 'Bronkwaliteit',
    ar: 'جودة المصادر', he: 'איכות המקורות', ja: '出典の品質', ko: '출처 품질', zh: '来源质量',
  },
  'document-registry': {
    en: 'Document Registry', sv: 'Dokumentregister', da: 'Dokumentregister', no: 'Dokumentregister', fi: 'Asiakirjarekisteri',
    de: 'Dokumentenregister', fr: 'Registre des documents', es: 'Registro de documentos', nl: 'Documentregister',
    ar: 'سجل الوثائق', he: 'מרשם מסמכים', ja: '文書レジストリ', ko: '문서 등록부', zh: '文档登记册',
  },
  'analysis-index': {
    en: 'Analysis Index', sv: 'Analysindex', da: 'Analyseindeks', no: 'Analyseindeks', fi: 'Analyysihakemisto',
    de: 'Analyseverzeichnis', fr: 'Index des analyses', es: 'Índice de análisis', nl: 'Analyse-index',
    ar: 'فهرس التحليل', he: 'מפתח הניתוח', ja: '分析インデックス', ko: '분석 색인', zh: '分析索引',
  },
  'reference-analysis-quality': {
    en: 'Reference Analysis Quality', sv: 'Kvalitet på referensanalys', da: 'Kvalitet af referenceanalyse', no: 'Kvalitet på referanseanalyse', fi: 'Viiteanalyysin laatu',
    de: 'Qualität der Referenzanalyse', fr: 'Qualité de l’analyse de référence', es: 'Calidad del análisis de referencia', nl: 'Kwaliteit referentieanalyse',
    ar: 'جودة التحليل المرجعي', he: 'איכות ניתוח הייחוס', ja: '参照分析の品質', ko: '참조 분석 품질', zh: '参考分析质量',
  },
  'workflow-audit': {
    en: 'Workflow Audit', sv: 'Granskning av arbetsflöde', da: 'Workflow-revision', no: 'Arbeidsflytrevisjon', fi: 'Työnkulun auditointi',
    de: 'Workflow-Audit', fr: 'Audit du flux de travail', es: 'Auditoría del flujo de trabajo', nl: 'Workflow-audit',
    ar: 'تدقيق سير العمل', he: 'ביקורת תהליך עבודה', ja: 'ワークフロー監査', ko: '워크플로 감사', zh: '工作流审计',
  },
  'mcp-reliability-audit': {
    en: 'MCP Reliability Audit', sv: 'Tillförlitlighetsgranskning av MCP', da: 'MCP-pålidelighedsrevision', no: 'MCP-pålitelighetsrevisjon', fi: 'MCP-luotettavuusauditointi',
    de: 'MCP-Zuverlässigkeitsaudit', fr: 'Audit de fiabilité MCP', es: 'Auditoría de fiabilidad de MCP', nl: 'MCP-betrouwbaarheidsaudit',
    ar: 'تدقيق موثوقية MCP', he: 'ביקורת אמינות MCP', ja: 'MCP 信頼性監査', ko: 'MCP 신뢰성 감사', zh: 'MCP 可靠性审计',
  },
  'cross-session-intelligence': {
    en: 'Cross-Session Intelligence', sv: 'Sessionsövergripande underrättelser', da: 'Sessionsovergribende efterretning', no: 'Sesjonsovergripende etterretning', fi: 'Istuntojen välinen tiedustelu',
    de: 'Sitzungsübergreifende Aufklärung', fr: 'Renseignement inter-sessions', es: 'Inteligencia entre sesiones', nl: 'Sessie-overstijgende inlichtingen',
    ar: 'استخبارات عبر الجلسات', he: 'מודיעין חוצה מושבים', ja: 'セッション横断インテリジェンス', ko: '세션 간 인텔리전스', zh: '跨会话情报',
  },
  'cross-run-diff': {
    en: 'Cross-Run Diff', sv: 'Skillnad mellan körningar', da: 'Forskel mellem kørsler', no: 'Forskjell mellom kjøringer', fi: 'Ajojen välinen ero',
    de: 'Lauf-zu-Lauf-Vergleich', fr: 'Comparaison entre exécutions', es: 'Diferencia entre ejecuciones', nl: 'Verschil tussen runs',
    ar: 'الفروقات بين عمليات التشغيل', he: 'הבדל בין הרצות', ja: '実行間の差分', ko: '실행 간 차이', zh: '运行间差异',
  },
  'session-baseline': {
    en: 'Session Baseline', sv: 'Sessionsbaslinje', da: 'Sessionsbasislinje', no: 'Sesjonsbaselinje', fi: 'Istunnon perustaso',
    de: 'Sitzungsbasislinie', fr: 'Référence de session', es: 'Línea base de sesión', nl: 'Sessiebasislijn',
    ar: 'خط أساس الجلسة', he: 'קו בסיס של המושב', ja: 'セッション・ベースライン', ko: '세션 기준선', zh: '会话基线',
  },
  'diw-scores': {
    en: 'DIW Scores', sv: 'DIW-poäng', da: 'DIW-score', no: 'DIW-score', fi: 'DIW-pisteet',
    de: 'DIW-Werte', fr: 'Scores DIW', es: 'Puntuaciones DIW', nl: 'DIW-scores',
    ar: 'درجات DIW', he: 'ציוני DIW', ja: 'DIW スコア', ko: 'DIW 점수', zh: 'DIW 评分',
  },
};

/**
 * Sections whose journalist heading equals the backing artifact's own title.
 * The localised string is reused verbatim from {@link ARTIFACT_TITLE_I18N}
 * (keyed by artifact filename) to avoid duplicating vetted translations.
 */
const SLUG_TO_ARTIFACT_FILE: Record<string, string> = {
  'significance-scoring': 'significance-scoring.md',
  'stakeholder-perspectives': 'stakeholder-perspectives.md',
  'coalition-mathematics': 'coalition-mathematics.md',
  'voter-segmentation': 'voter-segmentation.md',
  'forward-indicators': 'forward-indicators.md',
  'scenario-analysis': 'scenario-analysis.md',
  'election-2026-analysis': 'election-2026-analysis.md',
  'risk-assessment': 'risk-assessment.md',
  'swot-analysis': 'swot-analysis.md',
  'threat-analysis': 'threat-analysis.md',
  'historical-parallels': 'historical-parallels.md',
  'comparative-international': 'comparative-international.md',
  'implementation-feasibility': 'implementation-feasibility.md',
  'media-framing-analysis': 'media-framing-analysis.md',
  'devils-advocate': 'devils-advocate.md',
  'stakeholder-map': 'stakeholder-map.md',
};

/**
 * Resolve the localised journalist title for a canonical section `slug`.
 *
 * Resolution order:
 *   1. Explicit journalist / deep-dive override map.
 *   2. `per-document-intelligence` → reader-guide `perDocLabel` (reused).
 *   3. Backing-artifact title via {@link ARTIFACT_TITLE_I18N}.
 *
 * Returns `undefined` when the slug has no curated localisation, letting the
 * caller fall back gracefully to the (English) heading text.
 */
export function localizedSectionTitle(slug: string, lang: Language): string | undefined {
  const override = JOURNALIST_SECTION_TITLE_I18N[slug];
  if (override) return override[lang] ?? override.en;

  if (slug === 'per-document-intelligence') {
    const guide = READER_GUIDE_I18N[lang] ?? READER_GUIDE_I18N.en;
    return guide.chrome.perDocLabel;
  }

  const artifactFile = SLUG_TO_ARTIFACT_FILE[slug];
  if (artifactFile) {
    const map = ARTIFACT_TITLE_I18N[artifactFile];
    if (map) return map[lang] ?? map.en;
  }

  return undefined;
}
