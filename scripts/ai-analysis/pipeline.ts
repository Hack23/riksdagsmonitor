/**
 * @module ai-analysis/pipeline
 * @description AI-first analysis pipeline for deep-inspection articles.
 *
 * Implements the `AnalysisPipeline` interface with a content-driven approach:
 *   - Iteration 1 (`analyzeDocuments`): document classification, policy domain
 *     detection, stakeholder mapping, and evidence-based SWOT skeleton.
 *   - Iteration 2 (`refineAnalysis`): enrich SWOT entries from full-text content
 *     when documents are enriched; replace generic placeholders with specific
 *     claims drawn from actual document passages.
 *   - Iteration 3 (`validateCompleteness`): assess stakeholder coverage, policy
 *     domain confidence, and watch-point quality. Reports gap scores.
 *
 * Primary analysis text is content-derived from document metadata, passages, and
 * policy domain analysis. Fallback placeholder sentences (`buildPlaceholderText`)
 * are used only when a stakeholder × quadrant combination has zero matching
 * documents; they are never on the critical path for document-rich analyses.
 *
 * The implementation is designed as a drop-in target for future LLM API
 * integration: replace the content-extraction helpers (and fallback placeholders)
 * with API calls.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { RawDocument } from '../data-transformers/types.js';
import {
  detectPolicyDomains,
  getDomainSpecificAnalysis,
  detectNarrativeFrames,
  assessConfidenceLevel,
} from '../data-transformers/policy-analysis.js';
import { extractKeyPassage, cleanMotionText, isPersonProfileText } from '../data-transformers/helpers.js';
import { localizeDocType } from '../data-transformers/content-generators/index.js';

import type {
  AnalysisPipeline,
  AnalysisPipelineOptions,
  AnalysisResult,
  AnalysisStakeholderSwot,
  AnalysisSwotEntry,
  AnalysisWatchPoint,
  AnalysisMindmapBranch,
  PolicyAssessment,
  DashboardData,
  ValidationResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Palette for dashboard type distribution charts
// ---------------------------------------------------------------------------

const TYPE_PALETTE: readonly string[] = [
  '#00d9ff', '#ff006e', '#ffbe0b', '#7b2fff', '#00c58e',
  '#ff6b35', '#4dd0e1', '#f48fb1', '#a5d6a7', '#ce93d8',
];

// ---------------------------------------------------------------------------
// Localised stakeholder names (14 languages)
// ---------------------------------------------------------------------------

type LangRecord = Partial<Record<Language, string>>;

const GOV_NAMES: LangRecord = {
  en: 'Government / Policy Administration', sv: 'Regering / Policyförvaltning',
  da: 'Regering / Politisk forvaltning', no: 'Regjering / Politisk forvaltning',
  fi: 'Hallitus / Poliittinen hallinto', de: 'Regierung / Politikverwaltung',
  fr: 'Gouvernement / Administration', es: 'Gobierno / Administración pública',
  nl: 'Regering / Beleidsadministratie', ar: 'الحكومة / الإدارة السياسية',
  he: 'ממשלה / מינהל מדיניות', ja: '政府 / 政策行政', ko: '정부 / 정책 행정', zh: '政府 / 政策管理',
};

const OPP_NAMES: LangRecord = {
  en: 'Parliament / Opposition', sv: 'Riksdag / Opposition',
  da: 'Folketing / Opposition', no: 'Storting / Opposisjon',
  fi: 'Eduskunta / Oppositio', de: 'Parlament / Opposition',
  fr: 'Parlement / Opposition', es: 'Parlamento / Oposición',
  nl: 'Parlement / Oppositie', ar: 'البرلمان / المعارضة',
  he: 'פרלמנט / אופוזיציה', ja: '議会 / 野党', ko: '의회 / 야당', zh: '议会 / 反对派',
};

const PRIVATE_NAMES: LangRecord = {
  en: 'Private Sector / Civil Society', sv: 'Privat sektor / Civilsamhälle',
  da: 'Privat sektor / Civilsamfund', no: 'Privat sektor / Sivilsamfunn',
  fi: 'Yksityissektori / Kansalaisyhteiskunta', de: 'Privatsektor / Zivilgesellschaft',
  fr: 'Secteur privé / Société civile', es: 'Sector privado / Sociedad civil',
  nl: 'Privésector / Maatschappelijk middenveld', ar: 'القطاع الخاص / المجتمع المدني',
  he: 'המגזר הפרטי / החברה האזרחית', ja: '民間セクター / 市民社会', ko: '민간 부문 / 시민 사회', zh: '私营部门 / 民间社会',
};

// ---------------------------------------------------------------------------
// Data source labels (14 languages)
// ---------------------------------------------------------------------------

const DATA_SOURCE_LABELS: LangRecord = {
  en: 'Data Sources', sv: 'Datakällor', da: 'Datakilder', no: 'Datakilder',
  fi: 'Tietolähteet', de: 'Datenquellen', fr: 'Sources de données', es: 'Fuentes de datos',
  nl: 'Gegevensbronnen', ar: 'مصادر البيانات', he: 'מקורות נתונים',
  ja: 'データソース', ko: '데이터 출처', zh: '数据来源',
};

const DATA_SOURCE_ITEMS: Partial<Record<Language, string[]>> = {
  en: ['Riksdag MCP (laws, motions, propositions)', 'World Bank (economic indicators)', 'SCB Statistics Sweden'],
  sv: ['Riksdagens MCP (lagar, motioner, propositioner)', 'Världsbanken (ekonomiska indikatorer)', 'SCB Statistikmyndigheten'],
  da: ['Riksdag MCP (love, motioner, forslag)', 'Verdensbanken (økonomiske indikatorer)', 'SCB Statistikmyndigheten'],
  no: ['Riksdag MCP (lover, motioner, proposisjoner)', 'Verdensbanken (økonomiske indikatorer)', 'SCB Statistikmyndigheten'],
  fi: ['Riksdagin MCP (lait, kirjelmät, esitykset)', 'Maailmanpankki (taloudelliset indikaattorit)', 'SCB Tilastoviranomainen'],
  de: ['Riksdag MCP (Gesetze, Anträge, Vorlagen)', 'Weltbank (Wirtschaftsindikatoren)', 'SCB Statistikmyndigheten'],
  fr: ['Riksdag MCP (lois, motions, propositions)', 'Banque mondiale (indicateurs économiques)', 'SCB Statistikmyndigheten'],
  es: ['Riksdag MCP (leyes, mociones, proposiciones)', 'Banco Mundial (indicadores económicos)', 'SCB Statistikmyndigheten'],
  nl: ['Riksdag MCP (wetten, moties, voorstellen)', 'Wereldbank (economische indicatoren)', 'SCB Statistikmyndigheten'],
  ar: ['ريكسداغ MCP (قوانين، اقتراحات)', 'البنك الدولي (مؤشرات اقتصادية)', 'SCB إحصاء السويد'],
  he: ['ריקסדאג MCP (חוקים, הצעות)', 'הבנק העולמי (אינדיקטורים כלכליים)', 'SCB הלשכה המרכזית לסטטיסטיקה'],
  ja: ['Riksdag MCP (法律・動議・提案)', '世界銀行（経済指標）', 'SCB スウェーデン統計局'],
  ko: ['Riksdag MCP (법률, 동의, 제안)', '세계은행 (경제 지표)', 'SCB 스웨덴 통계청'],
  zh: ['议会 MCP（法律、动议、提案）', '世界银行（经济指标）', 'SCB 瑞典统计局'],
};

// ---------------------------------------------------------------------------
// Watch point labels (14 languages)
// ---------------------------------------------------------------------------

/** "Active Government Propositions" */
const WP_ACTIVE_PROPS: LangRecord = {
  en: 'Active Government Propositions', sv: 'Aktiva propositioner',
  da: 'Aktive regeringsforslag', no: 'Aktive regjeringsproposisjoner',
  fi: 'Aktiiviset hallituksen esitykset', de: 'Aktive Regierungsvorschläge',
  fr: 'Propositions gouvernementales actives', es: 'Proposiciones gubernamentales activas',
  nl: 'Actieve regeringsvoorstellen', ar: 'مقترحات حكومية نشطة',
  he: 'הצעות ממשלה פעילות', ja: '活動中の政府提案', ko: '활성 정부 제안', zh: '活跃的政府提案',
};

/** "proposition(s) require parliamentary action" */
const WP_PROPS_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} proposition${n !== 1 ? 's' : ''} require parliamentary action`,
  sv: (n) => `${n} proposition${n !== 1 ? 'er' : ''} kräver parlamentarisk behandling`,
  da: (n) => `${n} forslag kræver parlamentarisk behandling`,
  no: (n) => `${n} proposisjon${n !== 1 ? 'er' : ''} krever parlamentarisk behandling`,
  fi: (n) => `${n} esitys${n !== 1 ? 'tä' : ''} vaatii parlamentaarista käsittelyä`,
  de: (n) => `${n} Regierungsvorlage${n !== 1 ? 'n' : ''} erfordern parlamentarische Bearbeitung`,
  fr: (n) => `${n} proposition${n !== 1 ? 's' : ''} nécessitent un examen parlementaire`,
  es: (n) => `${n} proposición${n !== 1 ? 'es' : ''} requiere${n !== 1 ? 'n' : ''} acción parlamentaria`,
  nl: (n) => `${n} voorstel${n !== 1 ? 'len' : ''} vereisen parlementaire behandeling`,
  ar: (n) => `${n} مقترح${n !== 1 ? 'ات' : ''} تتطلب إجراء برلمانيا`,
  he: (n) => `${n} הצעות דורשות טיפול פרלמנטרי`,
  ja: (n) => `${n}件の提案が国会審議を必要とする`,
  ko: (n) => `${n}건의 제안이 의회 심의를 필요로 함`,
  zh: (n) => `${n}项提案需要议会审议`,
};

/** "Committee Reports to Monitor" */
const WP_COMMITTEE: LangRecord = {
  en: 'Committee Reports to Monitor', sv: 'Utskottsbetänkanden att följa',
  da: 'Udvalgsrapporter at følge', no: 'Komitérapporter å følge',
  fi: 'Seurattavat valiokuntamietinnöt', de: 'Zu beobachtende Ausschussberichte',
  fr: 'Rapports de commission à suivre', es: 'Informes de comisión a seguir',
  nl: 'Commissierapporten om te volgen', ar: 'تقارير اللجان للمتابعة',
  he: 'דוחות ועדות למעקב', ja: '監視すべき委員会報告', ko: '모니터링할 위원회 보고서', zh: '需要关注的委员会报告',
};

/** "committee report(s) shaping the parliamentary position" */
const WP_COMMITTEE_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} committee report${n !== 1 ? 's' : ''} shaping the parliamentary position`,
  sv: (n) => `${n} betänkande${n !== 1 ? 'n' : ''} formar den parlamentariska ståndpunkten`,
  da: (n) => `${n} udvalgsrapport${n !== 1 ? 'er' : ''} former den parlamentariske holdning`,
  no: (n) => `${n} komitérapport${n !== 1 ? 'er' : ''} former den parlamentariske posisjonen`,
  fi: (n) => `${n} mietintö${n !== 1 ? 'ä' : ''} muokkaa parlamentaarista kantaa`,
  de: (n) => `${n} Ausschussbericht${n !== 1 ? 'e' : ''} prägen die parlamentarische Position`,
  fr: (n) => `${n} rapport${n !== 1 ? 's' : ''} de commission façonnent la position parlementaire`,
  es: (n) => `${n} informe${n !== 1 ? 's' : ''} de comisión moldean la posición parlamentaria`,
  nl: (n) => `${n} commissierapport${n !== 1 ? 'en' : ''} vormen de parlementaire positie`,
  ar: (n) => `${n} تقرير${n !== 1 ? 'ات' : ''} لجان تشكل الموقف البرلماني`,
  he: (n) => `${n} דוחות ועדות מעצבים את עמדת הפרלמנט`,
  ja: (n) => `${n}件の委員会報告が議会の立場を形成`,
  ko: (n) => `${n}건의 위원회 보고서가 의회 입장을 형성`,
  zh: (n) => `${n}份委员会报告正在塑造议会立场`,
};

/** "Enacted Laws in Force" */
const WP_SFS: LangRecord = {
  en: 'Enacted Laws in Force', sv: 'Antagna lagar i kraft',
  da: 'Vedtagne love i kraft', no: 'Vedtatte lover i kraft',
  fi: 'Voimassa olevat lait', de: 'Erlassene Gesetze in Kraft',
  fr: 'Lois promulguées en vigueur', es: 'Leyes promulgadas en vigor',
  nl: 'Uitgevaardigde wetten van kracht', ar: 'قوانين صادرة سارية المفعول',
  he: 'חוקים שנחקקו בתוקף', ja: '施行中の制定法', ko: '시행 중인 법률', zh: '已生效的法律',
};

/** "enacted law(s) establish the legal framework — stakeholders must conduct compliance review" */
const WP_SFS_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} enacted law${n !== 1 ? 's' : ''} establish the legal framework — stakeholders must conduct compliance review`,
  sv: (n) => `${n} lag/förordning${n !== 1 ? 'ar' : ''} etablerar rättslig ram — intressenter behöver genomföra efterlevnadsgranskning`,
  da: (n) => `${n} lov${n !== 1 ? 'e' : ''} etablerer den juridiske ramme — interessenter skal foretage overholdelsesvurdering`,
  no: (n) => `${n} lov${n !== 1 ? 'er' : ''} etablerer det juridiske rammeverket — interessenter må gjennomføre samsvarsvurdering`,
  fi: (n) => `${n} laki${n !== 1 ? 'a' : ''} muodostaa oikeudellisen kehyksen — sidosryhmien on suoritettava vaatimustenmukaisuustarkistus`,
  de: (n) => `${n} Gesetz${n !== 1 ? 'e' : ''} bilden den Rechtsrahmen — Stakeholder müssen Compliance-Prüfung durchführen`,
  fr: (n) => `${n} loi${n !== 1 ? 's' : ''} établissent le cadre juridique — les parties prenantes doivent procéder à un examen de conformité`,
  es: (n) => `${n} ley${n !== 1 ? 'es' : ''} establecen el marco legal — las partes interesadas deben realizar una revisión de cumplimiento`,
  nl: (n) => `${n} wet${n !== 1 ? 'ten' : ''} vormen het juridische kader — belanghebbenden moeten een nalevingsonderzoek uitvoeren`,
  ar: (n) => `${n} ${n === 1 ? 'قانون يؤسس' : 'قوانين تؤسس'} الإطار القانوني — يجب على أصحاب المصلحة إجراء مراجعة الامتثال`,
  he: (n) => `${n} חוקים מבססים את המסגרת המשפטית — בעלי עניין חייבים לבצע בדיקת ציות`,
  ja: (n) => `${n}件の制定法が法的枠組みを確立 — 利害関係者はコンプライアンスレビューを実施すべき`,
  ko: (n) => `${n}건의 법률이 법적 프레임워크를 수립 — 이해관계자는 컴플라이언스 검토를 수행해야 함`,
  zh: (n) => `${n}项法律确立了法律框架 — 利益相关者必须进行合规审查`,
};

/** "Opposition Motions to Track" */
const WP_MOTIONS: LangRecord = {
  en: 'Opposition Motions to Track', sv: 'Oppositionsmotioner att bevaka',
  da: 'Oppositionsforslag at følge', no: 'Opposisjonsmotioner å følge',
  fi: 'Seurattavat oppositioaloitteet', de: 'Oppositionsanträge zu verfolgen',
  fr: 'Motions de l\'opposition à suivre', es: 'Mociones de la oposición a seguir',
  nl: 'Oppositiemoties om te volgen', ar: 'مقترحات المعارضة للمتابعة',
  he: 'הצעות אופוזיציה למעקב', ja: '追跡すべき野党動議', ko: '추적할 야당 동의', zh: '需要跟踪的反对派动议',
};

/** "motion(s) signal alternative policy directions" */
const WP_MOTIONS_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} motion${n !== 1 ? 's' : ''} signal alternative policy directions`,
  sv: (n) => `${n} motion${n !== 1 ? 'er' : ''} signalerar alternativa politiska inriktningar`,
  da: (n) => `${n} forslag signalerer alternative politiske retninger`,
  no: (n) => `${n} motjon${n !== 1 ? 'er' : ''} signaliserer alternative politiske retninger`,
  fi: (n) => `${n} aloite${n !== 1 ? 'tta' : ''} viestii vaihtoehtoisista politiikan suunnista`,
  de: (n) => `${n} ${n !== 1 ? 'Anträge signalisieren' : 'Antrag signalisiert'} alternative Politikrichtungen`,
  fr: (n) => `${n} motion${n !== 1 ? 's' : ''} signalent des orientations politiques alternatives`,
  es: (n) => `${n} moción${n !== 1 ? 'es' : ''} señalan direcciones políticas alternativas`,
  nl: (n) => `${n} motie${n !== 1 ? 's' : ''} signaleren alternatieve beleidsrichtingen`,
  ar: (n) => `${n} مقترح${n !== 1 ? 'ات' : ''} تشير إلى اتجاهات سياسية بديلة`,
  he: (n) => `${n} הצעות מסמנות כיווני מדיניות חלופיים`,
  ja: (n) => `${n}件の動議が代替政策の方向性を示唆`,
  ko: (n) => `${n}건의 동의가 대안적 정책 방향을 시사`,
  zh: (n) => `${n}项动议显示替代政策方向`,
};

/** "EU Dimension" */
const WP_EU: LangRecord = {
  en: 'EU Dimension', sv: 'EU-dimension',
  da: 'EU-dimension', no: 'EU-dimensjon',
  fi: 'EU-ulottuvuus', de: 'EU-Dimension',
  fr: 'Dimension UE', es: 'Dimensión UE',
  nl: 'EU-dimensie', ar: 'البعد الأوروبي',
  he: 'ממד אירופי', ja: 'EU次元', ko: 'EU 차원', zh: 'EU维度',
};

/** "EU position paper(s) reveal European dimension — EU law may constrain national policy options" */
const WP_EU_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} EU position paper${n !== 1 ? 's' : ''} reveal European dimension — EU law may constrain national policy options`,
  sv: (n) => `${n} EU-faktapromemoria avslöjar Europaperspektiv — EU-regelverket kan begränsa nationell handlingsfrihet`,
  da: (n) => `${n} EU-positionspapir${n !== 1 ? 'er' : ''} afslører europæisk dimension — EU-lovgivning kan begrænse nationale politiske muligheder`,
  no: (n) => `${n} EU-posisjonspapir${n !== 1 ? 'er' : ''} avslører europeisk dimensjon — EU-lovgivning kan begrense nasjonale politiske alternativer`,
  fi: (n) => `${n} EU-asiakirja${n !== 1 ? 'a' : ''} paljastaa eurooppalaisen ulottuvuuden — EU-lainsäädäntö voi rajoittaa kansallisia vaihtoehtoja`,
  de: (n) => `${n} EU-Positionspapier${n !== 1 ? 'e' : ''} zeigen die europäische Dimension — EU-Recht kann nationale Politikoptionen einschränken`,
  fr: (n) => `${n} document${n !== 1 ? 's' : ''} de position UE révèlent la dimension européenne — le droit de l'UE peut limiter les options nationales`,
  es: (n) => `${n} documento${n !== 1 ? 's' : ''} de posición de la UE revelan la dimensión europea — la legislación de la UE puede limitar las opciones nacionales`,
  nl: (n) => `${n} EU-positiedocument${n !== 1 ? 'en' : ''} onthullen de Europese dimensie — EU-wetgeving kan nationale beleidsopties beperken`,
  ar: (n) => `${n} ${n === 1 ? 'وثيقة موقف أوروبي تكشف' : 'وثائق موقف أوروبي تكشف'} البعد الأوروبي — قد يقيد قانون الاتحاد الأوروبي خيارات السياسة الوطنية`,
  he: (n) => `${n} מסמכי עמדה של האיחוד האירופי חושפים את הממד האירופי — חוק האיחוד עשוי להגביל אפשרויות מדיניות לאומיות`,
  ja: (n) => `${n}件のEU意見書が欧州次元を明示 — EU法が国内政策の選択肢を制約する可能性`,
  ko: (n) => `${n}건의 EU 입장 문서가 유럽 차원을 드러냄 — EU법이 국내 정책 옵션을 제한할 수 있음`,
  zh: (n) => `${n}份EU立场文件揭示欧洲维度 — EU法律可能限制国内政策选择`,
};

/** "Narrative Frames to Monitor" */
const WP_NARRATIVE: LangRecord = {
  en: 'Narrative Frames to Monitor', sv: 'Narrativa ramar att övervaka',
  da: 'Narrative rammer at overvåge', no: 'Narrative rammer å overvåke',
  fi: 'Seurattavat narratiiviset kehykset', de: 'Zu beobachtende narrative Rahmen',
  fr: 'Cadres narratifs à surveiller', es: 'Marcos narrativos a supervisar',
  nl: 'Narratieve kaders om te monitoren', ar: 'الأطر السردية للمراقبة',
  he: 'מסגרות נרטיביות למעקב', ja: '監視すべきナラティブフレーム', ko: '모니터링할 서사 프레임', zh: '需要监控的叙事框架',
};

/** "Political rhetorical frames identified: " */
const WP_NARRATIVE_DESC: LangRecord = {
  en: 'Political rhetorical frames identified: ', sv: 'Politiska retoriska ramar identifierade: ',
  da: 'Politiske retoriske rammer identificeret: ', no: 'Politiske retoriske rammer identifisert: ',
  fi: 'Poliittisia retorisia kehyksiä tunnistettu: ', de: 'Politische rhetorische Rahmen identifiziert: ',
  fr: 'Cadres rhétoriques politiques identifiés : ', es: 'Marcos retóricos políticos identificados: ',
  nl: 'Politieke retorische kaders geïdentificeerd: ', ar: 'تم تحديد أطر بلاغية سياسية: ',
  he: 'מסגרות רטוריות פוליטיות שזוהו: ', ja: '政治的修辞フレーム特定: ', ko: '정치적 수사 프레임 확인: ', zh: '已识别的政治修辞框架: ',
};

// ---------------------------------------------------------------------------
// Dashboard labels (14 languages)
// ---------------------------------------------------------------------------

const DASHBOARD_TITLE: LangRecord = {
  en: 'Document Intelligence', sv: 'Dokumentintelligens',
  da: 'Dokumentefterretning', no: 'Dokumentetterretning',
  fi: 'Asiakirjatiedustelu', de: 'Dokumentenintelligenz',
  fr: 'Renseignement documentaire', es: 'Inteligencia documental',
  nl: 'Documentintelligentie', ar: 'استخبارات الوثائق',
  he: 'מודיעין מסמכים', ja: '文書インテリジェンス', ko: '문서 인텔리전스', zh: '文件情报',
};

const DASHBOARD_DOCS_ANALYSED: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} parliamentary document${n !== 1 ? 's' : ''} analysed`,
  sv: (n) => `${n} riksdagsdokument ${n !== 1 ? 'analyserade' : 'analyserat'}`,
  da: (n) => `${n} parlamentsdokument${n !== 1 ? 'er' : ''} analyseret`,
  no: (n) => `${n} parlamentsdokument${n !== 1 ? 'er' : ''} analysert`,
  fi: (n) => `${n} asiakirja${n !== 1 ? 'a' : ''} analysoitu`,
  de: (n) => `${n} parlamentarische${n === 1 ? 's' : ''} Dokument${n !== 1 ? 'e' : ''} analysiert`,
  fr: (n) => `${n} document${n !== 1 ? 's' : ''} parlementaire${n !== 1 ? 's' : ''} analysé${n !== 1 ? 's' : ''}`,
  es: (n) => `${n} documento${n !== 1 ? 's' : ''} parlamentario${n !== 1 ? 's' : ''} analizado${n !== 1 ? 's' : ''}`,
  nl: (n) => `${n} parlementair${n !== 1 ? 'e' : ''} document${n !== 1 ? 'en' : ''} geanalyseerd`,
  ar: (n) => `${n} وثيقة برلمانية تم تحليلها`,
  he: (n) => `${n} מסמכים פרלמנטריים נותחו`,
  ja: (n) => `${n}件の議会文書を分析`,
  ko: (n) => `${n}건의 의회 문서 분석됨`,
  zh: (n) => `${n}份议会文件已分析`,
};

// ---------------------------------------------------------------------------
// Policy narrative labels (14 languages)
// ---------------------------------------------------------------------------

const NARRATIVE_ANALYSIS_OF: LangRecord = {
  en: 'Analysis of', sv: 'Analys av',
  da: 'Analyse af', no: 'Analyse av',
  fi: 'Analyysi', de: 'Analyse von',
  fr: 'Analyse de', es: 'Análisis de',
  nl: 'Analyse van', ar: 'تحليل',
  he: 'ניתוח', ja: '分析:', ko: '분석:', zh: '分析',
};

const NARRATIVE_REVEALS: LangRecord = {
  en: 'reveals', sv: 'visar',
  da: 'afslører', no: 'avslører',
  fi: 'paljastaa', de: 'zeigt',
  fr: 'révèle', es: 'revela',
  nl: 'onthult', ar: 'يكشف',
  he: 'חושף', ja: 'が示す', ko: '이(가) 드러남', zh: '揭示',
};

const NARRATIVE_POLICY_ACTIVITY: LangRecord = {
  en: 'policy activity in', sv: 'politikaktivitet inom',
  da: 'politisk aktivitet i', no: 'politisk aktivitet innen',
  fi: 'poliittista toimintaa alueella', de: 'politische Aktivität in',
  fr: 'activité politique dans', es: 'actividad política en',
  nl: 'beleidsactiviteit in', ar: 'نشاط سياسي في',
  he: 'פעילות מדיניותית ב', ja: 'の政策活動', ko: '의 정책 활동', zh: '中的政策活动',
};

const NARRATIVE_PARLIAMENTARY_ACTIVITY: LangRecord = {
  en: 'parliamentary activity', sv: 'parlamentarisk aktivitet',
  da: 'parlamentarisk aktivitet', no: 'parlamentarisk aktivitet',
  fi: 'parlamentaarista toimintaa', de: 'parlamentarische Aktivität',
  fr: 'activité parlementaire', es: 'actividad parlamentaria',
  nl: 'parlementaire activiteit', ar: 'نشاط برلماني',
  he: 'פעילות פרלמנטרית', ja: '議会活動', ko: '의회 활동', zh: '议会活动',
};

const NARRATIVE_WITH_ENRICHED: Partial<Record<Language, (total: number, enriched: number) => string>> = {
  en: (t, e) => `${t} documents (${e} with enriched full text)`,
  sv: (t, e) => `${t} dokument (${e} med berikad fulltext)`,
  da: (t, e) => `${t} dokumenter (${e} med beriget fuldtekst)`,
  no: (t, e) => `${t} dokumenter (${e} med beriket fulltekst)`,
  fi: (t, e) => `${t} asiakirjaa (${e} rikastetulla kokotekstillä)`,
  de: (t, e) => `${t} Dokumente (${e} mit angereichertem Volltext)`,
  fr: (t, e) => `${t} documents (${e} avec texte intégral enrichi)`,
  es: (t, e) => `${t} documentos (${e} con texto completo enriquecido)`,
  nl: (t, e) => `${t} documenten (${e} met verrijkte volledige tekst)`,
  ar: (t, e) => `${t} وثيقة (${e} بنص كامل مُثرى)`,
  he: (t, e) => `${t} מסמכים (${e} עם טקסט מלא מועשר)`,
  ja: (t, e) => `${t}件の文書 (${e}件はフルテキスト充実)`,
  ko: (t, e) => `${t}건의 문서 (${e}건 전문 보강)`,
  zh: (t, e) => `${t}份文件 (${e}份含完整文本)`,
};

const NARRATIVE_FOCUS: LangRecord = {
  en: 'with focus on', sv: 'med fokus på',
  da: 'med fokus på', no: 'med fokus på',
  fi: 'painopisteenä', de: 'mit Fokus auf',
  fr: 'avec un accent sur', es: 'con enfoque en',
  nl: 'met focus op', ar: 'مع التركيز على',
  he: 'עם דגש על', ja: 'に焦点を当てて', ko: '에 초점을 맞추어', zh: '重点关注',
};

function docType(doc: RawDocument): string {
  return (doc.doktyp || doc.documentType || '').toLowerCase();
}

function docTitle(doc: RawDocument): string {
  return (doc.titel || doc.title || doc.dokumentnamn || doc.dok_id || '').trim();
}

function docId(doc: RawDocument): string {
  return doc.dok_id || '';
}

/** Test whether a document is an SFS (enacted law/statute) — matches both `doktyp === 'sfs'` and `dokumentnamn` starting with 'SFS'. */
function isSfsDoc(doc: RawDocument): boolean {
  return docType(doc) === 'sfs' || (doc.dokumentnamn || '').startsWith('SFS');
}

/**
 * Normalize document type key, treating SFS-by-name documents (missing `doktyp`
 * but with `dokumentnamn` starting with 'SFS') as `'sfs'` and empty types as `'other'`.
 * Reuse this everywhere a doc-type key is needed (mindmap, dashboard, confidence).
 */
function normalizedDocType(doc: RawDocument): string {
  const raw = docType(doc);
  if (raw) return raw;
  if (isSfsDoc(doc)) return 'sfs';
  return 'other';
}

/**
 * Unified predicate for "document has enriched full content available".
 * `contentFetched` alone only means metadata was retrieved; actual full-text
 * or full-HTML content may still be absent (e.g., `include_full_text=false`).
 * Use this consistently for enrichedCount, confidence scoring, and validation.
 */
function hasEnrichedContent(doc: RawDocument): boolean {
  return Boolean(doc.contentFetched && (doc.fullText || doc.fullContent));
}

/** Extract a meaningful text passage from an enriched document. */
function extractPassage(doc: RawDocument, maxChars = 400): string | null {
  const raw = doc.fullText || doc.fullContent || '';
  if (!raw || isPersonProfileText(raw)) return null;
  const cleaned = docType(doc) === 'mot' && raw.includes('Motion till riksdagen')
    ? cleanMotionText(raw)
    : raw;
  return extractKeyPassage(cleaned, maxChars) || null;
}

/**
 * Return a SwotEntry text built from a document title — concise but explicit.
 * Returns plain text; HTML-escaping happens at the render site (section generators).
 */
function entryFromDoc(doc: RawDocument, topic: string | null, lang: Language): string {
  const title = docTitle(doc);
  const type = docType(doc);
  const typeLabel = type ? localizeDocType(type, lang, 1) : '';

  if (topic) {
    // Explicit relevance framing when a focus topic is present
    const relevance = relevantLabel(lang);
    return typeLabel
      ? `${typeLabel}: ${title} — ${relevance} ${topic}`
      : `${title} — ${relevance} ${topic}`;
  }
  return typeLabel ? `${typeLabel}: ${title}` : title;
}

/** Small localised phrase: "relevant to" / "relevant för" … */
function relevantLabel(lang: Language): string {
  const map: LangRecord = {
    en: 'relevant to', sv: 'relevant för', da: 'relevant for', no: 'relevant for',
    fi: 'liittyy', de: 'relevant für', fr: 'pertinent pour', es: 'relevante para',
    nl: 'relevant voor', ar: 'ذو صلة بـ', he: 'רלוונטי ל', ja: 'に関連:', ko: '관련:', zh: '相关:',
  };
  return map[lang] ?? 'relevant to';
}

/** Derive impact from document type: propositions/laws/committee reports/EU positions are high, motions/government comms/press medium, rest low. */
function impactFromDocType(dt: string): 'high' | 'medium' | 'low' {
  if (['prop', 'sfs', 'bet', 'fpm'].includes(dt)) return 'high';
  if (['mot', 'skr', 'pressm'].includes(dt)) return 'medium';
  return 'low';
}

/** Build a content-derived SWOT entry from full-text passage when available. */
function buildEnrichedEntry(
  doc: RawDocument,
  topic: string | null,
  lang: Language,
  passageMaxChars: number,
): AnalysisSwotEntry {
  const passage = extractPassage(doc, passageMaxChars);
  const type = docType(doc);
  const domainAnalysis = detectPolicyDomains(doc, lang);
  const domainText = domainAnalysis.length > 0
    ? getDomainSpecificAnalysis(domainAnalysis[0]!, type, lang)
    : '';

  let text: string;
  if (passage) {
    // Content-derived: lead with passage excerpt, append domain context
    text = domainText ? `${passage} — ${domainText}` : passage;
  } else {
    // Metadata-derived: title + domain context
    text = entryFromDoc(doc, topic, lang);
    if (domainText) text = `${text}. ${domainText}`;
  }

  return {
    text,
    impact: impactFromDocType(type),
    sourceDocIds: [docId(doc)].filter(Boolean),
    confidence: passage ? 'HIGH' : 'MEDIUM',
  };
}

/** Build a structural placeholder entry when no documents exist for a quadrant. */
function placeholderEntry(
  role: string,
  quadrant: string,
  topic: string | null,
  lang: Language,
  domains: string[],
): AnalysisSwotEntry {
  const primaryDomain = domains[0] ?? null;
  const text = buildPlaceholderText(role, quadrant, topic, primaryDomain, lang);
  return {
    text,
    impact: quadrant === 'strengths' || quadrant === 'opportunities' ? 'medium' : 'low',
    sourceDocIds: [],
    confidence: 'LOW',
  };
}

// ---------------------------------------------------------------------------
// Placeholder text builders — structural fallbacks for when no document evidence
// is available for a SWOT quadrant. These are NOT the primary analysis text;
// they are only used when a stakeholder × quadrant combination has no matching
// documents. In document-rich analyses, every SWOT entry is content-derived.
// Future LLM integration point: replace this function with an API call.
// ---------------------------------------------------------------------------

/**
 * Build a structural fallback SWOT text from role × quadrant × topic × domain.
 * Used only when no document evidence exists for a particular quadrant;
 * content-derived entries always take precedence over these placeholders.
 * Each placeholder is contextualised with the focus topic and primary domain
 * to keep entries relevant even without direct document backing.
 */
function buildPlaceholderText(
  role: string,
  quadrant: string,
  topic: string | null,
  domain: string | null,
  lang: Language,
): string {
  const topicFrag = topic ? ` (${topic})` : '';
  const domainFrag = domain ? ` in ${domain}` : '';

  // English composition — other languages use the same structure for consistency
  // Future AI integration point: replace this function with an LLM prompt.
  const compositions: Record<string, Record<string, string>> = {
    government: {
      strengths: `Legislative authority and executive agenda-setting capacity${topicFrag}${domainFrag} through government propositions and statutory instruments`,
      weaknesses: `Implementation timeline risks and resource allocation challenges${topicFrag}${domainFrag} requiring interagency coordination`,
      opportunities: `EU regulatory alignment and international cooperation frameworks${topicFrag}${domainFrag} for policy advancement`,
      threats: `Parliamentary opposition scrutiny and committee amendment risks${topicFrag}${domainFrag} that may delay or modify legislative outcomes`,
    },
    parliament: {
      strengths: `Oversight mandate and cross-committee scrutiny capacity${topicFrag}${domainFrag} through committee reports and chamber debates`,
      weaknesses: `Information asymmetry relative to executive branch${topicFrag}${domainFrag} on implementation details and classified material`,
      opportunities: `Cross-party consensus-building and coalition amendment capacity${topicFrag}${domainFrag} to strengthen legislation`,
      threats: `Government majority limiting effective amendment capacity${topicFrag}${domainFrag} in committee and chamber votes`,
    },
    'private-sector': {
      strengths: `Domain expertise, operational capacity, and sector-specific knowledge${topicFrag}${domainFrag} influencing policy design`,
      weaknesses: `Compliance adaptation burden and regulatory uncertainty${topicFrag}${domainFrag} creating planning challenges`,
      opportunities: `Policy-driven investment, innovation potential, and market development${topicFrag}${domainFrag}`,
      threats: `Rapid policy evolution and short implementation timelines${topicFrag}${domainFrag} creating competitive uncertainty`,
    },
  };

  const roleCompositions = compositions[role] ?? compositions['government']!;
  const text = roleCompositions[quadrant] ?? `Policy analysis${topicFrag}${domainFrag}`;

  // Apply language-specific framing for non-English outputs
  return applyLanguageFraming(text, lang, role, quadrant, topic, domain);
}

// ---------------------------------------------------------------------------
// SWOT composition builders (module-level constant — hoisted from applyLanguageFraming)
// ---------------------------------------------------------------------------

type SwotRoleCompositions = Record<string, Record<string, string>>;
type SwotCompositionBuilder = (topicFrag: string, domainFrag: string) => SwotRoleCompositions;

/**
 * Per-language SWOT placeholder composition builders.
 * Covers sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh (13 non-English languages).
 * English is handled by the caller (applyLanguageFraming returns enText directly).
 * Languages not present fall back to English via the caller's default path.
 */
const SWOT_LANGUAGE_BUILDERS: Partial<Record<Language, { domainPrep: string; builder: SwotCompositionBuilder }>> = {
  sv: {
    domainPrep: 'inom',
    builder: (tf, df) => ({
      government: {
        strengths: `Lagstiftningsbehörighet och exekutiv agendasättningskapacitet${tf}${df} genom propositioner och förordningar`,
        weaknesses: `Genomföranderisker och resursallokeringsutmaningar${tf}${df} som kräver myndighetssamordning`,
        opportunities: `EU-reglering och internationella samarbetsramverk${tf}${df} för politikutveckling`,
        threats: `Parlamentarisk oppositionsgranskning och utskottsändringsrisker${tf}${df} som kan fördröja eller modifiera lagstiftningsresultat`,
      },
      parliament: {
        strengths: `Tillsynsmandat och utskottsgranskning${tf}${df} genom betänkanden och kammardebatten`,
        weaknesses: `Informationsasymmetri gentemot den exekutiva grenen${tf}${df} i genomförandedetaljer`,
        opportunities: `Konsensusbyggande över partigränser${tf}${df} för att stärka lagstiftning`,
        threats: `Regeringsmajoriteten begränsar effektiv ändringskapacitet${tf}${df} i utskott och kammare`,
      },
      'private-sector': {
        strengths: `Domänexpertis, operativ kapacitet och sektorsspecifik kunskap${tf}${df} som påverkar policyutformning`,
        weaknesses: `Efterlevnadsanpassningsbörda och regulatorisk osäkerhet${tf}${df} som skapar planeringsutmaningar`,
        opportunities: `Policydriven investering, innovationspotential och marknadsutveckling${tf}${df}`,
        threats: `Snabb policyutveckling och korta genomförandetidsplaner${tf}${df} skapar konkurrensmässig osäkerhet`,
      },
    }),
  },
    da: {
      domainPrep: 'inden for',
      builder: (tf, df) => ({
        government: {
          strengths: `Lovgivningsmyndighed og dagsordensættende kapacitet${tf}${df} gennem regeringsforslag og lovgivningsinstrumenter`,
          weaknesses: `Implementeringsrisici og ressourceallokeringsudfordringer${tf}${df} der kræver tværministeriel koordinering`,
          opportunities: `EU-reguleringstilpasning og internationale samarbejdsrammer${tf}${df} for politikudvikling`,
          threats: `Parlamentarisk oppositionsgranskning og udvalgsændringsrisici${tf}${df} der kan forsinke eller ændre lovgivningsresultater`,
        },
        parliament: {
          strengths: `Tilsynsmandat og tværudvalgs-granskning${tf}${df} gennem betænkninger og kammerdebatter`,
          weaknesses: `Informationsasymmetri i forhold til den udøvende magt${tf}${df} om implementeringsdetaljer`,
          opportunities: `Konsensusopbygning på tværs af partier${tf}${df} for at styrke lovgivningen`,
          threats: `Regeringsflertal begrænser effektiv ændringskapacitet${tf}${df} i udvalg og kamre`,
        },
        'private-sector': {
          strengths: `Domæneekspertise, operationel kapacitet og sektorspecifik viden${tf}${df} der påvirker politikudformning`,
          weaknesses: `Compliance-tilpasningsbyrde og regulatorisk usikkerhed${tf}${df} der skaber planlægningsudfordringer`,
          opportunities: `Politikdrevet investering, innovationspotentiale og markedsudvikling${tf}${df}`,
          threats: `Hurtig politikudvikling og korte implementeringstidslinjer${tf}${df} der skaber konkurrencemæssig usikkerhed`,
        },
      }),
    },
    no: {
      domainPrep: 'innen',
      builder: (tf, df) => ({
        government: {
          strengths: `Lovgivningsmyndighet og dagsordensettende kapasitet${tf}${df} gjennom regjeringsforslag og lovgivningsinstrumenter`,
          weaknesses: `Implementeringsrisikoer og ressursallokeringsutfordringer${tf}${df} som krever tverretatlig koordinering`,
          opportunities: `EU-reguleringstilpasning og internasjonale samarbeidsrammer${tf}${df} for politikkutvikling`,
          threats: `Parlamentarisk opposisjonsgranskning og komitéendringsrisikoer${tf}${df} som kan forsinke eller endre lovgivningsresultater`,
        },
        parliament: {
          strengths: `Tilsynsmandat og tverrkomitégranskning${tf}${df} gjennom komitéinnstillinger og kammerdebatter`,
          weaknesses: `Informasjonsasymmetri overfor den utøvende makt${tf}${df} om implementeringsdetaljer`,
          opportunities: `Konsensusbygging på tvers av partier${tf}${df} for å styrke lovgivningen`,
          threats: `Regjeringsflertall begrenser effektiv endringskapasitet${tf}${df} i komiteer og kamre`,
        },
        'private-sector': {
          strengths: `Domeneekspertise, operasjonell kapasitet og sektorspesifikk kunnskap${tf}${df} som påvirker politikkutforming`,
          weaknesses: `Etterlevelsestilpasningsbyrde og regulatorisk usikkerhet${tf}${df} som skaper planleggingsutfordringer`,
          opportunities: `Politikkdrevet investering, innovasjonspotensial og markedsutvikling${tf}${df}`,
          threats: `Rask politikkutvikling og korte implementeringstidslinjer${tf}${df} som skaper konkurransemessig usikkerhet`,
        },
      }),
    },
    fi: {
      domainPrep: 'alueella',
      builder: (tf, df) => ({
        government: {
          strengths: `Lainsäädäntövalta ja toimeenpanovallan agendanasettamiskyky${tf}${df} hallituksen esitysten ja asetusten kautta`,
          weaknesses: `Täytäntöönpanoriskit ja resurssien kohdentamishaasteet${tf}${df} edellyttävät hallinnonalojen välistä koordinointia`,
          opportunities: `EU-sääntelyn yhdenmukaistaminen ja kansainväliset yhteistyökehykset${tf}${df} politiikan edistämiseksi`,
          threats: `Eduskuntaopposition valvonta ja valiokunnan muutosriskit${tf}${df} voivat viivästyttää tai muuttaa lainsäädäntötuloksia`,
        },
        parliament: {
          strengths: `Valvontamandaatti ja valiokuntien välinen tarkastelu${tf}${df} mietintöjen ja täysistuntokeskustelujen kautta`,
          weaknesses: `Tietoepäsymmetria toimeenpanovallan suhteen${tf}${df} täytäntöönpanon yksityiskohdissa`,
          opportunities: `Puoluerajat ylittävä konsensuksen rakentaminen${tf}${df} lainsäädännön vahvistamiseksi`,
          threats: `Hallituksen enemmistö rajoittaa tehokasta muutoskykyä${tf}${df} valiokunnissa ja täysistunnoissa`,
        },
        'private-sector': {
          strengths: `Alan asiantuntemus, operatiivinen kapasiteetti ja sektorikohtainen tieto${tf}${df} vaikuttavat politiikan suunnitteluun`,
          weaknesses: `Säädösten noudattamisen sopeutumisrasite ja sääntely-epävarmuus${tf}${df} luovat suunnitteluhaasteita`,
          opportunities: `Politiikkalähtöinen investointi, innovaatiopotentiaali ja markkinakehitys${tf}${df}`,
          threats: `Nopea politiikkakehitys ja lyhyet täytäntöönpanoaikataulut${tf}${df} luovat kilpailullista epävarmuutta`,
        },
      }),
    },
    de: {
      domainPrep: 'im Bereich',
      builder: (tf, df) => ({
        government: {
          strengths: `Gesetzgebungskompetenz und exekutive Agenda-Setting-Kapazität${tf}${df} durch Regierungsvorlagen und Verordnungen`,
          weaknesses: `Umsetzungsrisiken und Ressourcenallokationsherausforderungen${tf}${df} die behördenübergreifende Koordinierung erfordern`,
          opportunities: `EU-Regulierungsanpassung und internationale Kooperationsrahmen${tf}${df} für Politikentwicklung`,
          threats: `Parlamentarische Oppositionsprüfung und Ausschussänderungsrisiken${tf}${df} die Gesetzgebungsergebnisse verzögern oder ändern können`,
        },
        parliament: {
          strengths: `Aufsichtsmandat und ausschussübergreifende Prüfung${tf}${df} durch Berichte und Kammerdebatten`,
          weaknesses: `Informationsasymmetrie gegenüber der Exekutive${tf}${df} bei Umsetzungsdetails`,
          opportunities: `Parteiübergreifender Konsensaufbau${tf}${df} zur Stärkung der Gesetzgebung`,
          threats: `Regierungsmehrheit beschränkt effektive Änderungskapazität${tf}${df} in Ausschüssen und Kammern`,
        },
        'private-sector': {
          strengths: `Fachkompetenz, operative Kapazität und branchenspezifisches Wissen${tf}${df} mit Einfluss auf Politikgestaltung`,
          weaknesses: `Compliance-Anpassungslast und regulatorische Unsicherheit${tf}${df} die Planungsherausforderungen schaffen`,
          opportunities: `Politikgetriebene Investitionen, Innovationspotenzial und Marktentwicklung${tf}${df}`,
          threats: `Schnelle Politikentwicklung und kurze Umsetzungsfristen${tf}${df} schaffen wettbewerbliche Unsicherheit`,
        },
      }),
    },
    fr: {
      domainPrep: 'dans le domaine',
      builder: (tf, df) => ({
        government: {
          strengths: `Autorité législative et capacité d'établissement de l'agenda exécutif${tf}${df} à travers propositions et instruments réglementaires`,
          weaknesses: `Risques de mise en œuvre et défis d'allocation des ressources${tf}${df} nécessitant une coordination interministérielle`,
          opportunities: `Alignement réglementaire UE et cadres de coopération internationale${tf}${df} pour le développement politique`,
          threats: `Contrôle de l'opposition parlementaire et risques d'amendement en commission${tf}${df} pouvant retarder ou modifier les résultats législatifs`,
        },
        parliament: {
          strengths: `Mandat de surveillance et examen transversal en commission${tf}${df} à travers rapports et débats en séance`,
          weaknesses: `Asymétrie d'information face au pouvoir exécutif${tf}${df} sur les détails de mise en œuvre`,
          opportunities: `Construction de consensus transpartisan${tf}${df} pour renforcer la législation`,
          threats: `La majorité gouvernementale limite la capacité effective d'amendement${tf}${df} en commission et en séance`,
        },
        'private-sector': {
          strengths: `Expertise sectorielle, capacité opérationnelle et connaissances spécifiques${tf}${df} influençant l'élaboration des politiques`,
          weaknesses: `Charge d'adaptation à la conformité et incertitude réglementaire${tf}${df} créant des défis de planification`,
          opportunities: `Investissement guidé par les politiques, potentiel d'innovation et développement de marché${tf}${df}`,
          threats: `Évolution rapide des politiques et délais de mise en œuvre courts${tf}${df} créant une incertitude concurrentielle`,
        },
      }),
    },
    es: {
      domainPrep: 'en el ámbito de',
      builder: (tf, df) => ({
        government: {
          strengths: `Autoridad legislativa y capacidad ejecutiva de establecimiento de agenda${tf}${df} mediante proposiciones y instrumentos normativos`,
          weaknesses: `Riesgos de implementación y desafíos de asignación de recursos${tf}${df} que requieren coordinación interinstitucional`,
          opportunities: `Alineación regulatoria de la UE y marcos de cooperación internacional${tf}${df} para el avance político`,
          threats: `Escrutinio de la oposición parlamentaria y riesgos de enmienda en comisión${tf}${df} que pueden retrasar o modificar resultados legislativos`,
        },
        parliament: {
          strengths: `Mandato de supervisión y escrutinio transversal en comisión${tf}${df} mediante informes y debates en pleno`,
          weaknesses: `Asimetría de información frente al poder ejecutivo${tf}${df} en detalles de implementación`,
          opportunities: `Construcción de consenso entre partidos${tf}${df} para fortalecer la legislación`,
          threats: `La mayoría gubernamental limita la capacidad efectiva de enmienda${tf}${df} en comisión y pleno`,
        },
        'private-sector': {
          strengths: `Experiencia sectorial, capacidad operativa y conocimiento específico${tf}${df} que influye en el diseño de políticas`,
          weaknesses: `Carga de adaptación al cumplimiento e incertidumbre regulatoria${tf}${df} que genera desafíos de planificación`,
          opportunities: `Inversión impulsada por políticas, potencial de innovación y desarrollo de mercado${tf}${df}`,
          threats: `Evolución rápida de políticas y plazos de implementación cortos${tf}${df} que generan incertidumbre competitiva`,
        },
      }),
    },
    nl: {
      domainPrep: 'op het gebied van',
      builder: (tf, df) => ({
        government: {
          strengths: `Wetgevende bevoegdheid en uitvoerende agendabepalende capaciteit${tf}${df} via wetsvoorstellen en regelgevende instrumenten`,
          weaknesses: `Implementatierisico's en uitdagingen bij toewijzing van middelen${tf}${df} die interdepartementale coördinatie vereisen`,
          opportunities: `EU-regelgevingsafstemming en internationale samenwerkingskaders${tf}${df} voor beleidsontwikkeling`,
          threats: `Parlementaire oppositiecontrole en commissieamenderingsrisico's${tf}${df} die wetgevingsresultaten kunnen vertragen of wijzigen`,
        },
        parliament: {
          strengths: `Toezichtsmandaat en commissie-overstijgend onderzoek${tf}${df} via rapporten en Kamerdebatten`,
          weaknesses: `Informatieasymmetrie ten opzichte van de uitvoerende macht${tf}${df} over implementatiedetails`,
          opportunities: `Partijoverstijgende consensusvorming${tf}${df} om wetgeving te versterken`,
          threats: `Regeringsmeerderheid beperkt effectieve wijzigingscapaciteit${tf}${df} in commissies en Kamer`,
        },
        'private-sector': {
          strengths: `Domeinexpertise, operationele capaciteit en sectorspecifieke kennis${tf}${df} die beleidsontwerp beïnvloeden`,
          weaknesses: `Nalevingsaanpassingslast en regelgevende onzekerheid${tf}${df} die planningsuitdagingen creëren`,
          opportunities: `Beleidsgedreven investeringen, innovatiepotentieel en marktontwikkeling${tf}${df}`,
          threats: `Snelle beleidsontwikkeling en korte implementatietijdlijnen${tf}${df} die concurrentieonzekerheid creëren`,
        },
      }),
    },
    ar: {
      domainPrep: 'في مجال',
      builder: (tf, df) => ({
        government: {
          strengths: `السلطة التشريعية وقدرة وضع الأجندة التنفيذية${tf}${df} من خلال مقترحات الحكومة والأدوات القانونية`,
          weaknesses: `مخاطر التنفيذ وتحديات تخصيص الموارد${tf}${df} التي تتطلب التنسيق بين الوكالات`,
          opportunities: `التوافق التنظيمي مع الاتحاد الأوروبي وأطر التعاون الدولي${tf}${df} لتطوير السياسات`,
          threats: `رقابة المعارضة البرلمانية ومخاطر التعديل في اللجان${tf}${df} التي قد تؤخر أو تعدل النتائج التشريعية`,
        },
        parliament: {
          strengths: `تفويض الرقابة والتدقيق عبر اللجان${tf}${df} من خلال التقارير والمناقشات البرلمانية`,
          weaknesses: `عدم تماثل المعلومات مقارنة بالسلطة التنفيذية${tf}${df} في تفاصيل التنفيذ`,
          opportunities: `بناء التوافق عبر الأحزاب${tf}${df} لتعزيز التشريعات`,
          threats: `الأغلبية الحكومية تحد من قدرة التعديل الفعالة${tf}${df} في اللجان والجلسات العامة`,
        },
        'private-sector': {
          strengths: `الخبرة القطاعية والقدرة التشغيلية والمعرفة المتخصصة${tf}${df} التي تؤثر على تصميم السياسات`,
          weaknesses: `عبء التكيف مع الامتثال وعدم اليقين التنظيمي${tf}${df} مما يخلق تحديات في التخطيط`,
          opportunities: `استثمار مدفوع بالسياسات وإمكانات الابتكار وتطوير السوق${tf}${df}`,
          threats: `تطور سريع للسياسات وجداول زمنية قصيرة للتنفيذ${tf}${df} تخلق عدم يقين تنافسي`,
        },
      }),
    },
    he: {
      domainPrep: 'בתחום',
      builder: (tf, df) => ({
        government: {
          strengths: `סמכות חקיקה ויכולת קביעת סדר יום ביצועי${tf}${df} באמצעות הצעות ממשלה ומכשירים חוקיים`,
          weaknesses: `סיכוני יישום ואתגרי הקצאת משאבים${tf}${df} הדורשים תיאום בין-משרדי`,
          opportunities: `התאמה לרגולציה של האיחוד האירופי ומסגרות שיתוף פעולה בינלאומי${tf}${df} לקידום מדיניות`,
          threats: `ביקורת אופוזיציה פרלמנטרית וסיכוני תיקון בוועדות${tf}${df} העלולים לעכב או לשנות תוצאות חקיקה`,
        },
        parliament: {
          strengths: `מנדט פיקוח ובחינה חוצת-ועדות${tf}${df} באמצעות דוחות ודיונים במליאה`,
          weaknesses: `אי-סימטריית מידע מול הרשות המבצעת${tf}${df} בפרטי יישום`,
          opportunities: `בניית קונצנזוס חוצה-מפלגות${tf}${df} לחיזוק החקיקה`,
          threats: `רוב ממשלתי מגביל יכולת תיקון אפקטיבית${tf}${df} בוועדות ובמליאה`,
        },
        'private-sector': {
          strengths: `מומחיות תחומית, יכולת תפעולית וידע ענפי-ספציפי${tf}${df} המשפיעים על עיצוב מדיניות`,
          weaknesses: `נטל התאמה לציות ואי-ודאות רגולטורית${tf}${df} היוצרים אתגרי תכנון`,
          opportunities: `השקעה מונעת-מדיניות, פוטנציאל חדשנות ופיתוח שוק${tf}${df}`,
          threats: `התפתחות מהירה של מדיניות ולוחות זמנים קצרים ליישום${tf}${df} יוצרים אי-ודאות תחרותית`,
        },
      }),
    },
    ja: {
      domainPrep: 'の分野における',
      builder: (tf, df) => ({
        government: {
          strengths: `立法権限と行政アジェンダ設定能力${tf}${df}（政府提案と法的手段を通じて）`,
          weaknesses: `実施リスクとリソース配分の課題${tf}${df}（省庁間の調整が必要）`,
          opportunities: `EU規制の整合性と国際協力の枠組み${tf}${df}（政策推進のため）`,
          threats: `議会野党の監視と委員会修正リスク${tf}${df}（立法成果を遅延・修正する可能性）`,
        },
        parliament: {
          strengths: `監視権限と委員会横断的審査${tf}${df}（報告書と本会議討論を通じて）`,
          weaknesses: `行政府に対する情報の非対称性${tf}${df}（実施詳細について）`,
          opportunities: `党派を超えた合意形成${tf}${df}（立法を強化するため）`,
          threats: `政府多数派が有効な修正能力を制限${tf}${df}（委員会と本会議で）`,
        },
        'private-sector': {
          strengths: `専門知識、運営能力、業界固有の知識${tf}${df}（政策設計に影響）`,
          weaknesses: `コンプライアンス適応負担と規制の不確実性${tf}${df}（計画上の課題を生成）`,
          opportunities: `政策主導の投資、イノベーション可能性、市場開発${tf}${df}`,
          threats: `急速な政策展開と短い実施期限${tf}${df}（競争上の不確実性を生成）`,
        },
      }),
    },
    ko: {
      domainPrep: '분야에서',
      builder: (tf, df) => ({
        government: {
          strengths: `입법 권한과 행정부 의제 설정 역량${tf}${df} (정부 제안과 법적 수단을 통해)`,
          weaknesses: `시행 리스크와 자원 배분 과제${tf}${df} (부처 간 조정 필요)`,
          opportunities: `EU 규제 조화와 국제 협력 체계${tf}${df} (정책 발전을 위해)`,
          threats: `의회 야당 감시와 위원회 수정 리스크${tf}${df} (입법 결과를 지연 또는 변경 가능)`,
        },
        parliament: {
          strengths: `감독 권한과 위원회 간 심사${tf}${df} (보고서와 본회의 토론을 통해)`,
          weaknesses: `행정부에 대한 정보 비대칭${tf}${df} (시행 세부사항에 대해)`,
          opportunities: `초당적 합의 형성${tf}${df} (입법 강화를 위해)`,
          threats: `정부 다수당이 효과적 수정 역량을 제한${tf}${df} (위원회와 본회의에서)`,
        },
        'private-sector': {
          strengths: `전문 지식, 운영 역량, 업종별 지식${tf}${df} (정책 설계에 영향)`,
          weaknesses: `컴플라이언스 적응 부담과 규제 불확실성${tf}${df} (계획 수립 과제 야기)`,
          opportunities: `정책 주도 투자, 혁신 잠재력, 시장 개발${tf}${df}`,
          threats: `빠른 정책 변화와 짧은 시행 기한${tf}${df} (경쟁 불확실성 야기)`,
        },
      }),
    },
    zh: {
      domainPrep: '领域',
      builder: (tf, df) => ({
        government: {
          strengths: `立法权力和行政议程设定能力${tf}${df}（通过政府提案和法律文书）`,
          weaknesses: `实施风险和资源分配挑战${tf}${df}（需要跨部门协调）`,
          opportunities: `欧盟监管协调和国际合作框架${tf}${df}（推动政策发展）`,
          threats: `议会反对派审查和委员会修改风险${tf}${df}（可能延迟或修改立法成果）`,
        },
        parliament: {
          strengths: `监督权限和跨委员会审查${tf}${df}（通过报告和全体会议辩论）`,
          weaknesses: `相对行政部门的信息不对称${tf}${df}（在实施细节方面）`,
          opportunities: `跨党派共识构建${tf}${df}（加强立法）`,
          threats: `政府多数限制有效修改能力${tf}${df}（在委员会和全体会议中）`,
        },
        'private-sector': {
          strengths: `领域专长、运营能力和行业专业知识${tf}${df}（影响政策设计）`,
          weaknesses: `合规适应负担和监管不确定性${tf}${df}（造成规划挑战）`,
          opportunities: `政策驱动投资、创新潜力和市场发展${tf}${df}`,
          threats: `快速政策演变和紧迫的实施时间表${tf}${df}（造成竞争不确定性）`,
        },
      }),
    },
};

/**
 * Apply language-specific framing to a placeholder text.
 * Provides localised SWOT placeholder compositions for all 14 supported languages
 * so non-English articles render in their target language.
 */
function applyLanguageFraming(
  enText: string,
  lang: Language,
  role: string,
  quadrant: string,
  topic: string | null,
  domain: string | null,
): string {
  if (lang === 'en') return enText;

  const entry = SWOT_LANGUAGE_BUILDERS[lang];
  if (entry) {
    const topicFrag = topic ? ` (${topic})` : '';
    const domainFrag = domain ? ` ${entry.domainPrep} ${domain}` : '';
    const compositions = entry.builder(topicFrag, domainFrag);
    const roleComposition = compositions[role] ?? compositions['government']!;
    const text = roleComposition[quadrant];
    if (text) return text;
  }

  // Fallback to English for any unlisted language
  return enText;
}

// ---------------------------------------------------------------------------
// Policy assessment builder
// ---------------------------------------------------------------------------

function buildPolicyAssessment(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): PolicyAssessment {
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domains = [...allDomains].slice(0, 8);
  const primaryDomain = domains[0] ?? null;

  const enrichedCount = docs.filter(hasEnrichedContent).length;
  const confidence = assessConfidenceLevel(docs.length, enrichedCount > 0 ? 80 : 40);

  // Build a narrative from available evidence — topic + primary domain + document count
  const withEnrichedFn = NARRATIVE_WITH_ENRICHED[lang] ?? NARRATIVE_WITH_ENRICHED.en!;
  const docsLabelFn = DASHBOARD_DOCS_ANALYSED[lang] ?? DASHBOARD_DOCS_ANALYSED.en!;
  const evidenceDesc = enrichedCount > 0
    ? withEnrichedFn(docs.length, enrichedCount)
    : docsLabelFn(docs.length);

  const analysisOf = NARRATIVE_ANALYSIS_OF[lang] ?? NARRATIVE_ANALYSIS_OF.en!;
  const reveals = NARRATIVE_REVEALS[lang] ?? NARRATIVE_REVEALS.en!;
  const policyActivity = NARRATIVE_POLICY_ACTIVITY[lang] ?? NARRATIVE_POLICY_ACTIVITY.en!;
  const parlActivity = NARRATIVE_PARLIAMENTARY_ACTIVITY[lang] ?? NARRATIVE_PARLIAMENTARY_ACTIVITY.en!;
  const focusLabel = NARRATIVE_FOCUS[lang] ?? NARRATIVE_FOCUS.en!;

  const domainList = domains.slice(0, 3).join(', ');
  const activityPhrase = domains.length > 0
    ? `${policyActivity} ${domainList}`
    : parlActivity;
  const topicPhrase = topic ? ` ${focusLabel} ${topic}` : '';
  const narrative = `${analysisOf} ${evidenceDesc} ${reveals} ${activityPhrase}${topicPhrase}.`;

  return { domains, primaryDomain, narrative, confidence };
}

// ---------------------------------------------------------------------------
// Watch point builder
// ---------------------------------------------------------------------------

function buildWatchPoints(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): AnalysisWatchPoint[] {
  const points: AnalysisWatchPoint[] = [];

  const propDocs = docs.filter(d => docType(d) === 'prop');
  const betDocs  = docs.filter(d => docType(d) === 'bet');
  const motDocs  = docs.filter(d => docType(d) === 'mot');
  const sfsDocs  = docs.filter(isSfsDoc);
  const euDocs   = docs.filter(d => docType(d) === 'fpm');

  const topicSuffix = topic ? ` (${topic})` : '';

  if (propDocs.length > 0) {
    const titles = propDocs.slice(0, 2).map(d => docTitle(d)).join('; ');
    const descFn = WP_PROPS_DESC[lang] ?? WP_PROPS_DESC.en!;
    points.push({
      title: `${WP_ACTIVE_PROPS[lang] ?? WP_ACTIVE_PROPS.en!}${topicSuffix}`,
      description: `${descFn(propDocs.length)}: ${titles}`,
      urgency: 'high',
      sourceDocIds: propDocs.map(docId).filter(Boolean),
    });
  }

  if (betDocs.length > 0) {
    const descFn = WP_COMMITTEE_DESC[lang] ?? WP_COMMITTEE_DESC.en!;
    points.push({
      title: `${WP_COMMITTEE[lang] ?? WP_COMMITTEE.en!}${topicSuffix}`,
      description: `${descFn(betDocs.length)}${topicSuffix}`,
      urgency: 'high',
      sourceDocIds: betDocs.map(docId).filter(Boolean),
    });
  }

  if (sfsDocs.length > 0) {
    const descFn = WP_SFS_DESC[lang] ?? WP_SFS_DESC.en!;
    points.push({
      title: `${WP_SFS[lang] ?? WP_SFS.en!}${topicSuffix}`,
      description: descFn(sfsDocs.length),
      urgency: 'critical',
      sourceDocIds: sfsDocs.map(docId).filter(Boolean),
    });
  }

  if (motDocs.length > 0) {
    const descFn = WP_MOTIONS_DESC[lang] ?? WP_MOTIONS_DESC.en!;
    points.push({
      title: `${WP_MOTIONS[lang] ?? WP_MOTIONS.en!}${topicSuffix}`,
      description: `${descFn(motDocs.length)}${topicSuffix}`,
      urgency: 'medium',
      sourceDocIds: motDocs.map(docId).filter(Boolean),
    });
  }

  if (euDocs.length > 0) {
    const descFn = WP_EU_DESC[lang] ?? WP_EU_DESC.en!;
    points.push({
      title: `${WP_EU[lang] ?? WP_EU.en!}${topicSuffix}`,
      description: descFn(euDocs.length),
      urgency: 'medium',
      sourceDocIds: euDocs.map(docId).filter(Boolean),
    });
  }

  // Detect narrative frames for additional watch points
  const allFrames = new Set<string>();
  docs.slice(0, 10).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));
  if (allFrames.size > 0) {
    const frameList = [...allFrames].slice(0, 3).join(', ');
    points.push({
      title: WP_NARRATIVE[lang] ?? WP_NARRATIVE.en!,
      description: `${WP_NARRATIVE_DESC[lang] ?? WP_NARRATIVE_DESC.en!}${frameList}`,
      urgency: 'low',
      sourceDocIds: [],
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Mindmap branch builder
// ---------------------------------------------------------------------------

function buildMindmapBranches(
  docs: RawDocument[],
  topic: string | null,
  domains: string[],
  lang: Language,
): AnalysisMindmapBranch[] {
  const branches: AnalysisMindmapBranch[] = [];

  // Document type branch
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = normalizedDocType(d);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeKeys = Object.keys(typeCounts);
  if (typeKeys.length > 0) {
    branches.push({
      label: docTypesLabel(lang),
      color: 'cyan',
      icon: '📄',
      items: typeKeys.map(t => `${localizeDocType(t, lang, typeCounts[t] ?? 0)} (${typeCounts[t] ?? 0})`),
    });
  }

  // Policy domains branch
  if (domains.length > 0) {
    branches.push({
      label: policyDomainsLabel(lang),
      color: 'green',
      icon: '🏛️',
      items: domains,
    });
  }

  // Stakeholder branch
  branches.push({
    label: stakeholdersLabel(lang),
    color: 'yellow',
    icon: '👥',
    items: [
      GOV_NAMES[lang] ?? GOV_NAMES.en!,
      OPP_NAMES[lang] ?? OPP_NAMES.en!,
      PRIVATE_NAMES[lang] ?? PRIVATE_NAMES.en!,
    ],
  });

  // Data sources branch
  branches.push({
    label: DATA_SOURCE_LABELS[lang] ?? DATA_SOURCE_LABELS.en!,
    color: 'purple',
    icon: '📊',
    items: DATA_SOURCE_ITEMS[lang] ?? DATA_SOURCE_ITEMS.en!,
  });

  // Topic-derived focus branch (only when topic is provided)
  if (topic) {
    const allFrames = new Set<string>();
    docs.slice(0, 15).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));
    if (allFrames.size > 0) {
      branches.push({
        label: narrativeFramesLabel(lang),
        color: 'orange',
        icon: '🎯',
        items: [...allFrames].slice(0, 6),
      });
    }
  }

  return branches;
}

// Localised section labels
function docTypesLabel(lang: Language): string {
  const m: LangRecord = { en: 'Document Types', sv: 'Dokumenttyper', da: 'Dokumenttyper', no: 'Dokumenttyper', fi: 'Asiakirjatyypit', de: 'Dokumenttypen', fr: 'Types de documents', es: 'Tipos de documentos', nl: 'Documenttypen', ar: 'أنواع الوثائق', he: 'סוגי מסמכים', ja: '文書種類', ko: '문서 유형', zh: '文件类型' };
  return m[lang] ?? m.en!;
}
function policyDomainsLabel(lang: Language): string {
  const m: LangRecord = { en: 'Policy Domains', sv: 'Politikområden', da: 'Politikområder', no: 'Politikkområder', fi: 'Politiikka-alueet', de: 'Politikbereiche', fr: 'Domaines politiques', es: 'Áreas de política', nl: 'Beleidsdomeinen', ar: 'مجالات السياسة', he: 'תחומי מדיניות', ja: '政策分野', ko: '정책 영역', zh: '政策领域' };
  return m[lang] ?? m.en!;
}
function stakeholdersLabel(lang: Language): string {
  const m: LangRecord = { en: 'Stakeholders', sv: 'Intressenter', da: 'Interessenter', no: 'Interessenter', fi: 'Sidosryhmät', de: 'Stakeholder', fr: 'Parties prenantes', es: 'Partes interesadas', nl: 'Belanghebbenden', ar: 'أصحاب المصلحة', he: 'בעלי עניין', ja: 'ステークホルダー', ko: '이해관계자', zh: '利益相关者' };
  return m[lang] ?? m.en!;
}
function narrativeFramesLabel(lang: Language): string {
  const m: LangRecord = { en: 'Narrative Frames', sv: 'Narrativa ramar', da: 'Narrative rammer', no: 'Narrative rammer', fi: 'Narratiiviset kehykset', de: 'Narrative Rahmen', fr: 'Cadres narratifs', es: 'Marcos narrativos', nl: 'Narratieve frames', ar: 'الإطارات السردية', he: 'מסגרות נרטיביות', ja: '物語フレーム', ko: '서사 프레임', zh: '叙事框架' };
  return m[lang] ?? m.en!;
}

// ---------------------------------------------------------------------------
// Dashboard data builder
// ---------------------------------------------------------------------------

function buildDashboardData(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): DashboardData {
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = normalizedDocType(d);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const typeKeys = Object.keys(typeCounts);
  const typeDistribution = typeKeys.map((t, i) => ({
    label: localizeDocType(t, lang, typeCounts[t] ?? 0),
    value: typeCounts[t] ?? 0,
    color: TYPE_PALETTE[i % TYPE_PALETTE.length] ?? '#00d9ff',
  }));

  const docIntelLabel = DASHBOARD_TITLE[lang] ?? DASHBOARD_TITLE.en!;
  const title = topic ? `${docIntelLabel} — ${topic}` : docIntelLabel;
  const docsAnalysedFn = DASHBOARD_DOCS_ANALYSED[lang] ?? DASHBOARD_DOCS_ANALYSED.en!;
  const summary = docsAnalysedFn(docs.length);

  return { title, summary, typeDistribution };
}

// ---------------------------------------------------------------------------
// Confidence score calculator
// ---------------------------------------------------------------------------

function calculateConfidenceScore(docs: RawDocument[]): number {
  if (docs.length === 0) return 0;
  const enriched = docs.filter(hasEnrichedContent).length;
  const enrichmentRatio = enriched / docs.length;
  const typeVariety = new Set(docs.map(normalizedDocType)).size;
  // Score: 0-100
  // - enrichment ratio contributes 50%  (based on actual full content)
  // - doc count (up to 10) contributes 30%
  // - type variety (up to 5) contributes 20%
  const enrichmentScore = enrichmentRatio * 50;
  const countScore = Math.min(docs.length / 10, 1) * 30;
  const varietyScore = Math.min(typeVariety / 5, 1) * 20;
  return Math.round(enrichmentScore + countScore + varietyScore);
}

// ---------------------------------------------------------------------------
// Iteration 1: analyzeDocuments
// ---------------------------------------------------------------------------

async function analyzeDocuments(
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<AnalysisResult> {
  const { lang, focusTopic: topic } = options;

  const domains = (() => {
    const all = new Set<string>();
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => all.add(dom)));
    return [...all].slice(0, 8);
  })();

  // Classify documents by type
  const propDocs    = docs.filter(d => docType(d) === 'prop');
  const betDocs     = docs.filter(d => docType(d) === 'bet');
  const motDocs     = docs.filter(d => docType(d) === 'mot');
  const skrDocs     = docs.filter(d => docType(d) === 'skr');
  const sfsDocs     = docs.filter(isSfsDoc);
  const euDocs      = docs.filter(d => docType(d) === 'fpm');
  const pressmDocs  = docs.filter(d => docType(d) === 'pressm');
  const extDocs     = docs.filter(d => docType(d) === 'ext');

  // ── Government stakeholder SWOT ─────────────────────────────────────────────
  const govStrengths: AnalysisSwotEntry[] = [
    ...propDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...sfsDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...skrDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...pressmDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govWeaknesses: AnalysisSwotEntry[] = [
    ...betDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govOpportunities: AnalysisSwotEntry[] = [
    ...euDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...skrDocs.slice(1, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const govThreats: AnalysisSwotEntry[] = [
    ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];

  if (govStrengths.length === 0)    govStrengths.push(placeholderEntry('government', 'strengths', topic, lang, domains));
  if (govWeaknesses.length === 0)   govWeaknesses.push(placeholderEntry('government', 'weaknesses', topic, lang, domains));
  if (govOpportunities.length === 0) govOpportunities.push(placeholderEntry('government', 'opportunities', topic, lang, domains));
  if (govThreats.length === 0)      govThreats.push(placeholderEntry('government', 'threats', topic, lang, domains));

  // ── Parliament / Opposition SWOT ─────────────────────────────────────────
  const oppStrengths: AnalysisSwotEntry[] = [
    ...betDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const oppWeaknesses: AnalysisSwotEntry[] = [];
  const oppOpportunities: AnalysisSwotEntry[] = [];
  const oppThreats: AnalysisSwotEntry[] = [
    ...propDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];

  if (oppStrengths.length === 0)    oppStrengths.push(placeholderEntry('parliament', 'strengths', topic, lang, domains));
  if (oppWeaknesses.length === 0)   oppWeaknesses.push(placeholderEntry('parliament', 'weaknesses', topic, lang, domains));
  if (oppOpportunities.length === 0) oppOpportunities.push(placeholderEntry('parliament', 'opportunities', topic, lang, domains));
  if (oppThreats.length === 0)      oppThreats.push(placeholderEntry('parliament', 'threats', topic, lang, domains));

  // ── Private Sector / Civil Society SWOT ──────────────────────────────────
  const privateStrengths: AnalysisSwotEntry[] = [
    ...sfsDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
    ...extDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const privateWeaknesses: AnalysisSwotEntry[] = [];
  const privateOpportunities: AnalysisSwotEntry[] = [
    ...euDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, 200)),
  ];
  const privateThreats: AnalysisSwotEntry[] = [];

  if (privateStrengths.length === 0)    privateStrengths.push(placeholderEntry('private-sector', 'strengths', topic, lang, domains));
  if (privateWeaknesses.length === 0)   privateWeaknesses.push(placeholderEntry('private-sector', 'weaknesses', topic, lang, domains));
  if (privateOpportunities.length === 0) privateOpportunities.push(placeholderEntry('private-sector', 'opportunities', topic, lang, domains));
  if (privateThreats.length === 0)      privateThreats.push(placeholderEntry('private-sector', 'threats', topic, lang, domains));

  // Assemble stakeholder SWOT list
  const stakeholderSwot: AnalysisStakeholderSwot[] = [
    {
      name: GOV_NAMES[lang] ?? GOV_NAMES.en!,
      role: 'government',
      swot: { strengths: govStrengths, weaknesses: govWeaknesses, opportunities: govOpportunities, threats: govThreats },
    },
    {
      name: OPP_NAMES[lang] ?? OPP_NAMES.en!,
      role: 'parliament',
      swot: { strengths: oppStrengths, weaknesses: oppWeaknesses, opportunities: oppOpportunities, threats: oppThreats },
    },
    {
      name: PRIVATE_NAMES[lang] ?? PRIVATE_NAMES.en!,
      role: 'private-sector',
      swot: { strengths: privateStrengths, weaknesses: privateWeaknesses, opportunities: privateOpportunities, threats: privateThreats },
    },
  ];

  const policyAssessment = buildPolicyAssessment(docs, topic, lang);
  const watchPoints = buildWatchPoints(docs, topic, lang);
  const mindmapBranches = buildMindmapBranches(docs, topic, policyAssessment.domains, lang);
  const dashboardData = buildDashboardData(docs, topic, lang);
  const confidenceScore = calculateConfidenceScore(docs);

  return {
    stakeholderSwot,
    policyAssessment,
    mindmapBranches,
    dashboardData,
    watchPoints,
    confidenceScore,
    iterationsCompleted: 1,
    completedAt: new Date().toISOString(),
    lang,
    documentCount: docs.length,
    enrichedCount: docs.filter(hasEnrichedContent).length,
    focusTopic: topic,
  };
}

// ---------------------------------------------------------------------------
// Iteration 2: refineAnalysis
// ---------------------------------------------------------------------------

async function refineAnalysis(
  initial: AnalysisResult,
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<AnalysisResult> {
  const { lang, focusTopic: topic } = options;
  const enrichedDocs = docs.filter(hasEnrichedContent);

  if (enrichedDocs.length === 0) {
    // No documents with full text/content available — refinement is a no-op.
    // This is expected when enrichDocumentsWithContent() fetches metadata only
    // (include_full_text=false). We still bump iterationsCompleted to 2 so the
    // pipeline contract is honoured, but enrichedCount remains 0 to signal
    // that no actual text-based enrichment occurred.
    return { ...initial, iterationsCompleted: 2, completedAt: new Date().toISOString() };
  }

  // Re-derive SWOT entries with longer passages for enriched documents
  const passageMax = 400;
  const refined = { ...initial, iterationsCompleted: 2, completedAt: new Date().toISOString() };

  // Rebuild stakeholder SWOT with richer content from enriched documents
  const propDocs   = enrichedDocs.filter(d => docType(d) === 'prop');
  const betDocs    = enrichedDocs.filter(d => docType(d) === 'bet');
  const motDocs    = enrichedDocs.filter(d => docType(d) === 'mot');
  const sfsDocs    = enrichedDocs.filter(isSfsDoc);
  const euDocs     = enrichedDocs.filter(d => docType(d) === 'fpm');
  const pressmDocs = enrichedDocs.filter(d => docType(d) === 'pressm');
  const extDocs    = enrichedDocs.filter(d => docType(d) === 'ext');
  const skrDocs    = enrichedDocs.filter(d => docType(d) === 'skr');

  // Upgrade government SWOT entries where we now have full text
  refined.stakeholderSwot = refined.stakeholderSwot.map(sh => {
    if (sh.role === 'government') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...propDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...sfsDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...skrDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...pressmDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedWeaknesses: AnalysisSwotEntry[] = betDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      const enrichedOpportunities: AnalysisSwotEntry[] = [
        ...euDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...skrDocs.slice(1, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedThreats: AnalysisSwotEntry[] = motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax));

      // Merge: prefer enriched entries, fall back to initial placeholders
      return {
        ...sh,
        swot: {
          strengths:     enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          weaknesses:    enrichedWeaknesses.length > 0 ? enrichedWeaknesses : sh.swot.weaknesses,
          opportunities: enrichedOpportunities.length > 0 ? enrichedOpportunities : sh.swot.opportunities,
          threats:       enrichedThreats.length > 0 ? enrichedThreats : sh.swot.threats,
        },
      };
    }
    if (sh.role === 'parliament') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...betDocs.slice(0, 3).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...motDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedThreats: AnalysisSwotEntry[] = propDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      return {
        ...sh,
        swot: {
          ...sh.swot,
          strengths: enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          threats:   enrichedThreats.length > 0 ? enrichedThreats : sh.swot.threats,
        },
      };
    }
    if (sh.role === 'private-sector') {
      const enrichedStrengths: AnalysisSwotEntry[] = [
        ...sfsDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
        ...extDocs.slice(0, 2).map(d => buildEnrichedEntry(d, topic, lang, passageMax)),
      ];
      const enrichedOpportunities: AnalysisSwotEntry[] = euDocs.slice(0, 1).map(d => buildEnrichedEntry(d, topic, lang, passageMax));
      return {
        ...sh,
        swot: {
          ...sh.swot,
          strengths:     enrichedStrengths.length > 0 ? enrichedStrengths : sh.swot.strengths,
          opportunities: enrichedOpportunities.length > 0 ? enrichedOpportunities : sh.swot.opportunities,
        },
      };
    }
    return sh;
  });

  // Rebuild watch points with enriched context
  refined.watchPoints = buildWatchPoints(docs, topic, lang);

  // Recalculate confidence score with enriched data
  refined.confidenceScore = calculateConfidenceScore(docs);
  refined.enrichedCount = enrichedDocs.length;

  // Refresh policy assessment narrative with enriched evidence
  refined.policyAssessment = buildPolicyAssessment(docs, topic, lang);

  // Add additional stakeholder perspectives from narrative frame analysis
  const allFrames = new Set<string>();
  enrichedDocs.slice(0, 20).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));

  // Enrich mindmap with additional data from full text analysis
  refined.mindmapBranches = buildMindmapBranches(docs, topic, refined.policyAssessment.domains, lang);

  // Add civil society branch if we have external docs
  const civilSocietyDocs = enrichedDocs.filter(d => ['ext', 'fpm'].includes(docType(d)));
  if (civilSocietyDocs.length > 0 && allFrames.size > 0) {
    // Add a narrative analysis branch to mindmap
    const hasBranch = refined.mindmapBranches.some(b => b.label === narrativeFramesLabel(lang));
    if (!hasBranch) {
      refined.mindmapBranches.push({
        label: narrativeFramesLabel(lang),
        color: 'orange',
        icon: '🎯',
        items: [...allFrames].slice(0, 6),
      });
    }
  }

  return refined;
}

// ---------------------------------------------------------------------------
// Iteration 3: validateCompleteness
// ---------------------------------------------------------------------------

async function validateCompleteness(
  analysis: AnalysisResult,
  _docs: RawDocument[],
): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check stakeholder coverage
  for (const sh of analysis.stakeholderSwot) {
    const { strengths, weaknesses, opportunities, threats } = sh.swot;
    if (strengths.length === 0) {
      issues.push(`${sh.name}: no strengths entries`);
      score -= 5;
    }
    if (weaknesses.length === 0) {
      suggestions.push(`${sh.name}: consider adding weakness analysis`);
      score -= 2;
    }
    if (opportunities.length === 0) {
      suggestions.push(`${sh.name}: consider adding opportunity analysis`);
      score -= 2;
    }
    if (threats.length === 0) {
      suggestions.push(`${sh.name}: consider adding threat analysis`);
      score -= 2;
    }
    // Check for low-confidence placeholder-only entries
    const allEntries = [...strengths, ...weaknesses, ...opportunities, ...threats];
    const allLowConfidence = allEntries.length > 0 && allEntries.every(e => e.confidence === 'LOW');
    if (allLowConfidence) {
      issues.push(`${sh.name}: all SWOT entries are low-confidence placeholders — enrich with document content`);
      score -= 10;
    }
  }

  // Check policy domain detection
  if (analysis.policyAssessment.domains.length === 0) {
    issues.push('No policy domains detected — document titles may need more descriptive text');
    score -= 5;
  }

  // Check watch points
  if (analysis.watchPoints.length === 0) {
    suggestions.push('No watch points generated — check for actionable document types (prop, bet, sfs)');
    score -= 3;
  }

  // Check enrichment ratio
  if (analysis.documentCount > 0 && analysis.enrichedCount === 0) {
    issues.push('No documents have enriched full text — analysis quality is limited to metadata');
    score -= 15;
  }

  // Check confidence score
  if (analysis.confidenceScore < 30) {
    issues.push(`Low confidence score (${analysis.confidenceScore}/100) — fetch more documents or enrich with full text`);
    score -= 5;
  }

  // Bonus: rich analysis with many enriched documents
  if (analysis.enrichedCount >= 3) {
    score = Math.min(100, score + 5);
  }

  const finalScore = Math.max(0, score);
  return {
    passed: finalScore >= 60,
    score: finalScore,
    issues,
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// Exported pipeline singleton
// ---------------------------------------------------------------------------

/**
 * The default AI analysis pipeline implementation.
 *
 * Usage in generators:
 * ```ts
 * import { aiAnalysisPipeline } from '../ai-analysis/pipeline.js';
 * const result = await aiAnalysisPipeline.analyzeDocuments(docs, { depth, lang, focusTopic });
 * if (depth !== 'quick') {
 *   const refined = await aiAnalysisPipeline.refineAnalysis(result, docs, { depth, lang, focusTopic });
 *   if (depth === 'deep') {
 *     await aiAnalysisPipeline.validateCompleteness(refined, docs);
 *   }
 * }
 * ```
 */
export const aiAnalysisPipeline: AnalysisPipeline = {
  analyzeDocuments,
  refineAnalysis,
  validateCompleteness,
};

/**
 * Run the full analysis pipeline according to the specified depth.
 * Returns the final AnalysisResult, optional ValidationResult, and
 * per-iteration timing data for audit metadata.
 *
 * @param docs - Raw documents to analyse
 * @param options - Pipeline options (depth, lang, focusTopic)
 * @returns `{ analysis, validation, iterationDurationsMs }` where
 *   validation is null for depth < 'deep' and iterationDurationsMs
 *   contains one entry per completed iteration/validation pass.
 */
export async function runAnalysisPipeline(
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<{ analysis: AnalysisResult; validation: ValidationResult | null; iterationDurationsMs: number[] }> {
  const iterationDurationsMs: number[] = [];

  // Iteration 1
  const t1 = Date.now();
  let analysis = await aiAnalysisPipeline.analyzeDocuments(docs, options);
  iterationDurationsMs.push(Date.now() - t1);

  // Iteration 2 (standard + deep)
  if (options.depth !== 'quick') {
    const t2 = Date.now();
    analysis = await aiAnalysisPipeline.refineAnalysis(analysis, docs, options);
    iterationDurationsMs.push(Date.now() - t2);
  }

  // Iteration 3 — validation (deep only)
  let validation: ValidationResult | null = null;
  if (options.depth === 'deep') {
    const t3 = Date.now();
    validation = await aiAnalysisPipeline.validateCompleteness(analysis, docs);
    iterationDurationsMs.push(Date.now() - t3);
    // Bump iterationsCompleted to reflect the validation pass
    analysis = { ...analysis, iterationsCompleted: 3, completedAt: new Date().toISOString() };
  }

  return { analysis, validation, iterationDurationsMs };
}
