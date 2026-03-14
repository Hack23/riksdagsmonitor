/**
 * @module generate-news-enhanced/ai-analysis-pipeline
 * @description Heuristic-based multi-iteration analysis pipeline for deep political
 * intelligence. Uses deterministic document classification, template-driven
 * per-document analysis, cross-document synthesis, and quality scoring to produce
 * context-aware political insights from every stakeholder perspective.
 *
 * NOTE: This module does NOT integrate with external LLM/MCP services. All analysis
 * is performed via rule-based heuristics and localised template interpolation. The
 * "iteration" depth controls how many passes run (see {@link AIAnalysisPipeline}).
 *
 * Architecture — four analysis passes (gated by iteration depth):
 *  1. Data Collection & Classification — classify by type/domain, detect policy areas
 *  2. Deep Analysis (iterations ≥ 2) — per-document legislative impact, cross-party
 *     implications, historical context, and EU/Nordic comparison
 *  3. Cross-Document Synthesis (iterations ≥ 2) — convergence/divergence patterns,
 *     coalition stress, emerging trends, stakeholder power dynamics
 *  4. Quality Assurance & Refinement (iterations ≥ 3) — score output, re-generate
 *     below threshold
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import type { RawDocument } from '../data-transformers.js';
import type { Language } from '../types/language.js';
import type { SwotEntry } from '../types/article.js';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/**
 * Represents a single iteration's input context for the AI analysis pipeline.
 * Each iteration builds on the accumulated context from previous passes.
 */
export interface AIAnalysisIteration {
  /** Which pass this is (1-indexed). */
  iteration: number;
  /** Accumulated context text from all previous iterations. */
  context: string;
  /** The documents being analysed in this iteration. */
  documents: RawDocument[];
  /** Optional focus topic constraining the analysis scope. */
  focusTopic: string | null;
  /** Raw output text from the immediately preceding iteration, if any. */
  previousAnalysis?: string;
  /** Stakeholder perspective driving this iteration's framing. */
  stakeholderPerspective:
    | 'government'
    | 'opposition'
    | 'civil-society'
    | 'media'
    | 'international';
}

/** Per-document deep analysis produced in Pass 2. */
export interface AIDocumentAnalysis {
  /** Riksdag document identifier. */
  dok_id: string;
  /** Document title. */
  title: string;
  /** Assessment of the document's legislative impact in the target language. */
  legislativeImpact: string;
  /** Cross-party implications of the document. */
  crossPartyImplications: string;
  /** Historical context or precedent relevant to the document. */
  historicalContext: string;
  /** EU and Nordic comparative dimension. */
  euNordicComparison: string;
  /** Quality score 0–100 for this document's analysis depth. */
  qualityScore: number;
}

/** Cross-document synthesis produced in Pass 3. */
export interface AISynthesis {
  /** Assessment of policy convergence or divergence across documents. */
  policyConvergence: string;
  /** Indicators of coalition stress visible in the document set. */
  coalitionStressIndicators: string;
  /**
   * Emerging legislative trends detected.
   * Format: comma-separated domain names optionally suffixed with a
   * bracketed confidence level, e.g. "fiscal policy, defence [HIGH], environment [MEDIUM]".
   */
  emergingTrends: string;
  /** Stakeholder power dynamics implied by the document distribution. */
  stakeholderPowerDynamics: string;
}

/** Dynamically generated SWOT entries replacing hardcoded SWOT_DEFAULTS. */
export interface DynamicSwotEntries {
  government: {
    strengths: SwotEntry[];
    weaknesses: SwotEntry[];
    opportunities: SwotEntry[];
    threats: SwotEntry[];
  };
  opposition: {
    strengths: SwotEntry[];
    weaknesses: SwotEntry[];
    opportunities: SwotEntry[];
    threats: SwotEntry[];
  };
  privateSector: {
    strengths: SwotEntry[];
    weaknesses: SwotEntry[];
    opportunities: SwotEntry[];
    threats: SwotEntry[];
  };
}

/** Final output of the full multi-iteration analysis pipeline. */
export interface AIAnalysisResult {
  /** Total iterations executed. */
  iterations: number;
  /** Per-document deep analyses from Pass 2. */
  documentAnalyses: AIDocumentAnalysis[];
  /** Cross-document synthesis from Pass 3. */
  synthesis: AISynthesis;
  /** Context-aware SWOT entries replacing hardcoded defaults. */
  dynamicSwotEntries: DynamicSwotEntries;
  /** Strategic implications paragraph in the target language. */
  strategicImplications: string;
  /** Bullet-list key takeaways. */
  keyTakeaways: string[];
  /** Overall quality score 0–100. */
  qualityScore: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Minimum quality score below which Pass 4 triggers re-analysis. */
const QUALITY_THRESHOLD = 45;

/** Document type keywords used for legislative signal detection. */
const GOV_TYPES = new Set(['prop', 'pressm', 'skr', 'sfs', 'ds', 'sou']);
const OPP_TYPES = new Set(['bet', 'mot', 'ip', 'fr']);
const EU_TYPES = new Set(['fpm', 'eu']);
const EXT_TYPES = new Set(['ext', 'external']);

function docType(d: RawDocument): string {
  return (d.doktyp ?? d.documentType ?? '').toLowerCase();
}

function docTitle(d: RawDocument): string {
  return (d.titel ?? d.title ?? d.dokumentnamn ?? d.dok_id ?? '').slice(0, 120);
}

/** Classify a document into a stakeholder bucket. */
function classifyStakeholder(d: RawDocument): 'government' | 'opposition' | 'eu' | 'other' {
  const t = docType(d);
  if (GOV_TYPES.has(t)) return 'government';
  if (OPP_TYPES.has(t)) return 'opposition';
  if (EU_TYPES.has(t)) return 'eu';
  return 'other';
}

/** Identify whether a document signals cross-party coalition stress. */
function hasCoalitionStress(d: RawDocument): boolean {
  const title = docTitle(d).toLowerCase();
  // Require strong conflict markers — generic terms like "motion" or "opposition"
  // are too broad and would flag most document mixes, reducing signal quality.
  const stressKeywords = [
    'avslag', 'reject', 'tillägg', 'amendment',
    'reservation', 'minoritet', 'minority',
  ];
  return stressKeywords.some(kw => title.includes(kw));
}

/** Maximum score contribution from word count alone. */
const WORD_SCORE_CAP = 60;
/** Words required per quality point from word-count scoring. */
const WORDS_PER_POINT = 3;
/** Bonus score added when the analysis references specific numeric figures. */
const SPECIFICITY_BONUS = 20;
/** Bonus score added when the analysis contains cross-reference terms. */
const CROSS_REF_BONUS = 20;

/** Score analysis depth: 0–100 based on content length and richness. */
function scoreAnalysisDepth(text: string): number {
  if (!text || text.length === 0) return 0;
  const words = text.split(/\s+/).length;
  const hasSpecific = /\d{4}|\d+\s*(kr|miljarder|miljoner|percent|%)/.test(text);
  const hasCrossRef = /cross-party|coalition|EU|EU-|Nordic|parliamentary/.test(text);
  let score = Math.min(WORD_SCORE_CAP, Math.floor(words / WORDS_PER_POINT));
  if (hasSpecific) score += SPECIFICITY_BONUS;
  if (hasCrossRef) score += CROSS_REF_BONUS;
  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Per-language phrase maps
// ---------------------------------------------------------------------------

/** All 14 supported languages. */
type Lang14 = Record<Language, string>;

function L14(en: string, sv: string, da: string, no: string, fi: string,
              de: string, fr: string, es: string, nl: string,
              ar: string, he: string, ja: string, ko: string, zh: string): Lang14 {
  return { en, sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh };
}

function pickLang(map: Lang14, lang: Language): string {
  return map[lang] ?? map.en;
}

// ── Legislative impact labels ────────────────────────────────────────────────
const LEGISLATIVE_SIGNAL: Lang14 = L14(
  'Active legislative agenda:',
  'Aktiv lagstiftningsagenda:',
  'Aktiv lovgivningsdagsorden:',
  'Aktiv lovgivningsagenda:',
  'Aktiivinen lainsäädäntöohjelma:',
  'Aktive Gesetzgebungsagenda:',
  'Agenda législative active:',
  'Agenda legislativa activa:',
  'Actieve wetgevingsagenda:',
  'جدول أعمال تشريعية نشطة:',
  'סדר יום חקיקתי פעיל:',
  '活発な立法アジェンダ:',
  '활발한 입법 의제:',
  '积极的立法议程:',
);

const SCRUTINY_SIGNAL: Lang14 = L14(
  'Parliamentary scrutiny signal:',
  'Parlamentarisk granskningssignal:',
  'Parlamentarisk kontrolsignal:',
  'Parlamentarisk kontrollsignal:',
  'Parlamentaarinen valvontasignaali:',
  'Parlamentarisches Kontrollsignal:',
  'Signal de contrôle parlementaire:',
  'Señal de control parlamentario:',
  'Parlementair controlesignaal:',
  'إشارة الرقابة البرلمانية:',
  'אות פיקוח פרלמנטרי:',
  '議会審査シグナル:',
  '의회 심사 신호:',
  '议会审查信号:',
);

const EU_ALIGNMENT_SIGNAL: Lang14 = L14(
  'EU alignment dimension:',
  'EU-anpassningsdimension:',
  'EU-tilpasningsdimension:',
  'EU-tilpasningsdimensjon:',
  'EU-yhdenmukaistamisdimensio:',
  'EU-Ausrichtungsdimension:',
  'Dimension d\'alignement UE:',
  'Dimensión de alineación UE:',
  'EU-afstemmingsdimensie:',
  'بُعد التوافق مع الاتحاد الأوروبي:',
  'ממד ההתאמה לאיחוד האירופי:',
  'EU整合の側面:',
  'EU 정합성 차원:',
  'EU对齐维度:',
);

// ── SWOT quadrant labels ─────────────────────────────────────────────────────
const GOV_STRENGTH_LABELS: Record<string, Lang14> = {
  propositions: L14(
    'Active legislative pipeline: %n government proposal%s drive %t policy',
    'Aktiv lagstiftningspipeline: %n propositioner driver %t-politik',
    'Aktiv lovgivningspipeline: %n lovforslag driver %t-politik',
    'Aktiv lovgivningspipeline: %n stortingsproposisjoner driver %t-politikk',
    'Aktiivinen lainsäädäntöputki: %n hallituksen esitystä ohjaavat %t-politiikkaa',
    'Aktive Gesetzgebungs-Pipeline: %n Regierungsvorlagen treiben %t-Politik voran',
    'Pipeline législative active: %n propositions gouvernementales propulsent la politique %t',
    'Pipeline legislativa activa: %n propuestas de gobierno impulsan la política %t',
    'Actieve wetgevingspijplijn: %n overheidstvoorstellen sturen %t-beleid',
    'خط أنابيب تشريعي نشط: %n مقترح حكومي يدفع سياسة %t',
    'צינור חקיקה פעיל: %n הצעות ממשלה מניעות מדיניות %t',
    'アクティブな立法パイプライン: %n件の政府提案が%t政策を推進',
    '활발한 입법 파이프라인: %n 정부 제안이 %t 정책 추진',
    '积极的立法管道：%n 项政府提案推动%t政策',
  ),
  sfs: L14(
    'Regulatory authority: enacted legislation provides implementation framework for %t',
    'Regelverksauktoritet: stiftad lagstiftning ger implementeringsramverk för %t',
    'Regelværksautoritet: vedtaget lovgivning giver implementeringsramme for %t',
    'Regelverksautoritet: vedtatt lovgivning gir implementeringsrammeverk for %t',
    'Sääntelyauktoriteetti: annettu lainsäädäntö tarjoaa täytäntöönpanokehyksen %t:lle',
    'Regulierungsbehörde: erlassene Gesetzgebung bildet Umsetzungsrahmen für %t',
    'Autorité réglementaire: la législation adoptée fournit un cadre de mise en œuvre pour %t',
    'Autoridad regulatoria: la legislación promulgada proporciona un marco de implementación para %t',
    'Regelgevende autoriteit: uitgevaardigde wetgeving biedt implementatiekader voor %t',
    'سلطة تنظيمية: التشريع المسنّ يوفر إطار تنفيذ لـ %t',
    'סמכות רגולטורית: חקיקה שנחקקה מספקת מסגרת יישום ל-%t',
    '規制権限：制定された法令が%tの実施枠組みを提供',
    '규제 권한: 제정된 법률이 %t에 대한 이행 프레임워크 제공',
    '监管权力：已颁布的法律为%t提供实施框架',
  ),
  default: L14(
    'Government agenda-setting on %t',
    'Regeringens agendasättning för %t',
    'Regeringens dagsordenssætning for %t',
    'Regjeringens agendaoppsetting for %t',
    'Hallituksen agendaasetus %t:lle',
    'Regierung setzt Agenda für %t',
    'Le gouvernement fixe l\'agenda sur %t',
    'El gobierno establece la agenda en %t',
    'Agenda bepalen door de regering voor %t',
    'تحديد أجندة الحكومة على %t',
    'קביעת סדר יום ממשלתי על %t',
    '政府が%tに関するアジェンダを設定',
    '정부의 %t 의제 설정',
    '政府在%t问题上设定议程',
  ),
};

const OPP_STRENGTH_LABELS: Record<string, Lang14> = {
  committee: L14(
    'Parliamentary scrutiny: %n committee report%s examine %t',
    'Parlamentarisk granskning: %n betänkanden granskar %t',
    'Parlamentarisk kontrol: %n udvalgsrapporter undersøger %t',
    'Parlamentarisk kontroll: %n komitérapporter undersøker %t',
    'Parlamentaarinen valvonta: %n valiokuntamietintöä tutkii %t:tä',
    'Parlamentarische Kontrolle: %n Ausschussberichte prüfen %t',
    'Contrôle parlementaire: %n rapports de commission examinent %t',
    'Escrutinio parlamentario: %n informes de comité examinan %t',
    'Parlementaire controle: %n commissierapporten onderzoeken %t',
    'الرقابة البرلمانية: %n تقرير لجنة تفحص %t',
    'פיקוח פרלמנטרי: %n דוחות ועדה בוחנים %t',
    '議会審査：%n 件の委員会報告書が%tを検討',
    '의회 심사: %n 위원회 보고서가 %t 검토',
    '议会审查：%n 份委员会报告审查%t',
  ),
  motions: L14(
    'Opposition challenge: %n motion%s contest %t proposals',
    'Oppositionsutmaning: %n motioner utmanar %t-förslag',
    'Oppositionsudfordring: %n motioner udfordrer %t-forslag',
    'Opposisjonsutfordring: %n motioner utfordrer %t-forslag',
    'Oppositiohaaste: %n kirjelmää haastaa %t-esitykset',
    'Herausforderung der Opposition: %n Anträge fechten %t-Vorschläge an',
    'Défi de l\'opposition: %n motions contestent les propositions %t',
    'Desafío de la oposición: %n mociones impugnan las propuestas %t',
    'Oppositie-uitdaging: %n moties betwisten %t-voorstellen',
    'تحدي المعارضة: %n اقتراح يطعن في مقترحات %t',
    'אתגר אופוזיציה: %n הצעות מתמודדות עם הצעות %t',
    '野党の挑戦：%n 件の動議が%t提案に異議',
    '야당 도전: %n 동의가 %t 제안에 이의',
    '反对派挑战：%n 项动议对%t提案提出异议',
  ),
  default: L14(
    'Parliamentary oversight and accountability on %t',
    'Parlamentarisk tillsyn och ansvarsskyldighet för %t',
    'Parlamentarisk tilsyn og ansvarlighed for %t',
    'Parlamentarisk tilsyn og ansvarlighet for %t',
    'Parlamentaarinen valvonta ja vastuuvelvollisuus %t:lle',
    'Parlamentarische Aufsicht und Rechenschaftspflicht für %t',
    'Contrôle parlementaire et responsabilité sur %t',
    'Supervisión parlamentaria y responsabilidad sobre %t',
    'Parlementair toezicht en verantwoording voor %t',
    'الرقابة البرلمانية والمساءلة على %t',
    'פיקוח פרלמנטרי ואחריות על %t',
    '%tに関する議会の監視と説明責任',
    '%t에 대한 의회 감독 및 책임',
    '%t问题上的议会监督和责任',
  ),
};

// ── Opportunity & threat templates (all 14 languages) ──────────────────────

const EU_OPPORTUNITY: Lang14 = L14(
  'EU framework alignment and Nordic co-operation on %t',
  'EU-ramverksanpassning och nordiskt samarbete om %t',
  'EU-rammetilpasning og nordisk samarbejde om %t',
  'EU-rammeverktilpasning og nordisk samarbeid om %t',
  'EU-kehystoimenpiteiden yhdenmukaistaminen ja pohjoismainen yhteistyö %t:ssä',
  'EU-Rahmenausrichtung und nordische Zusammenarbeit bei %t',
  'Alignement avec le cadre européen et coopération nordique sur %t',
  'Alineación con el marco europeo y cooperación nórdica en %t',
  'EU-kaderafstemming en Noordse samenwerking op %t',
  'التوافق مع الإطار الأوروبي والتعاون الشمالي على %t',
  'התאמה למסגרת האיחוד האירופי ושיתוף פעולה נורדי על %t',
  'EUフレームワーク整合とノルディック協力（%t）',
  'EU 프레임워크 정합 및 북유럽 협력 (%t)',
  'EU框架对齐与北欧合作（%t）',
);

const GOV_WEAKNESS_IMPL: Lang14 = L14(
  'Implementation timeline and resource allocation for %t',
  'Genomförandetidsplan och resurstilldelning för %t',
  'Implementeringstidsplan og ressourceallokering for %t',
  'Implementeringstidsplan og ressursallokering for %t',
  'Toteutusaikataulu ja resurssien kohdentaminen %t:lle',
  'Umsetzungszeitplan und Ressourcenallokation für %t',
  'Calendrier de mise en œuvre et allocation des ressources pour %t',
  'Cronograma de implementación y asignación de recursos para %t',
  'Implementatietijdlijn en toewijzing van middelen voor %t',
  'الجدول الزمني للتنفيذ وتخصيص الموارد لـ %t',
  'לוח זמנים ליישום והקצאת משאבים עבור %t',
  '%tの実施スケジュールとリソース配分',
  '%t 이행 일정 및 자원 배분',
  '%t的实施时间表和资源分配',
);

const GOV_THREAT_EXEC: Lang14 = L14(
  'Execution risks and stakeholder resistance to %t reform',
  'Genomföranderisker och motstånd mot %t-reform',
  'Udførelsesrisici og interessentmodstand mod %t-reform',
  'Utføringsrisikoer og interessentmotstand mot %t-reform',
  'Toteutusriskit ja sidosryhmien vastustus %t-uudistukselle',
  'Ausführungsrisiken und Widerstand der Stakeholder gegen %t-Reform',
  'Risques d\'exécution et résistance des parties prenantes à la réforme %t',
  'Riesgos de ejecución y resistencia de las partes interesadas a la reforma %t',
  'Uitvoeringsrisico\'s en weerstand van belanghebbenden tegen %t-hervorming',
  'مخاطر التنفيذ ومقاومة أصحاب المصلحة لإصلاح %t',
  'סיכוני ביצוע והתנגדות בעלי עניין לרפורמת %t',
  '%t改革に対する実施リスクとステークホルダーの反発',
  '%t 개혁에 대한 실행 위험 및 이해관계자 저항',
  '%t改革的执行风险和利益相关者阻力',
);

const OPP_WEAKNESS_INFO: Lang14 = L14(
  'Limited access to implementation data and classified briefings on %t',
  'Begränsad tillgång till genomförandedata och sekretessbelagda underlag om %t',
  'Begrænset adgang til implementeringsdata og klassificerede briefinger om %t',
  'Begrenset tilgang til implementeringsdata og klassifiserte orienteringer om %t',
  'Rajoitettu pääsy täytäntöönpanotietoihin ja salaisiin tiedotteisiin %t:stä',
  'Begrenzter Zugang zu Umsetzungsdaten und klassifizierten Berichten über %t',
  'Accès limité aux données de mise en œuvre et aux briefings classifiés sur %t',
  'Acceso limitado a datos de implementación e informes clasificados sobre %t',
  'Beperkte toegang tot implementatiegegevens en geclassificeerde briefings over %t',
  'وصول محدود إلى بيانات التنفيذ والإحاطات السرية حول %t',
  'גישה מוגבלת לנתוני יישום ותדרוכים חסויים על %t',
  '%tに関する実施データおよび機密ブリーフィングへのアクセスが限定',
  '%t에 관한 이행 데이터 및 기밀 브리핑에 대한 제한적 접근',
  '对%t实施数据和机密简报的有限访问',
);

const OPP_OPPORTUNITY_CONSENSUS: Lang14 = L14(
  'Cross-party consensus building on %t reform agenda',
  'Konsensusbyggande över partigränser om %t-reformagenda',
  'Tværpartisanisk konsensusopbygning om %t-reformdagsorden',
  'Tverrpartisanisk konsensusbygging om %t-reformagenda',
  'Puolueiden välinen konsensuksen rakentaminen %t-uudistusohjelmasta',
  'Überparteilicher Konsensaufbau zur %t-Reformagenda',
  'Construction d\'un consensus interpartis sur l\'agenda de réforme %t',
  'Construcción de consenso multipartidista sobre la agenda de reforma %t',
  'Overpartijdig consensusopbouw over de %t-hervormingsagenda',
  'بناء توافق بين الأحزاب حول أجندة إصلاح %t',
  'בניית קונצנזוס בין-מפלגתי על אג\'נדת הרפורמות ב-%t',
  '%t改革課題に関する超党派コンセンサス形成',
  '%t 개혁 의제에 관한 초당파적 합의 구축',
  '在%t改革议程上的跨党派共识建立',
);

const OPP_THREAT_MAJORITY: Lang14 = L14(
  'Government majority limiting parliamentary amendment capacity on %t',
  'Regeringsmajoriteten begränsar riksdagens ändringskapacitet för %t',
  'Regeringsflertal begrænser parlamentets ændringskapacitet for %t',
  'Regjeringsflertall begrenser stortingets endringskapasitet for %t',
  'Hallitusenemmistö rajoittaa eduskunnan muutoskapasiteettia %t:ssä',
  'Regierungsmehrheit schränkt parlamentarische Änderungskapazität bei %t ein',
  'Majorité gouvernementale limitant la capacité d\'amendement parlementaire sur %t',
  'Mayoría de gobierno que limita la capacidad de enmienda parlamentaria sobre %t',
  'Regeringsmeerderheid beperkt parlementaire wijzigingscapaciteit voor %t',
  'أغلبية الحكومة تحد من قدرة البرلمان على التعديل في %t',
  'רוב הממשלה מגביל את יכולת תיקון הפרלמנט ב-%t',
  '与党多数が%tに関する議会の修正能力を制限',
  '정부 다수파가 %t에 관한 의회 수정 능력 제한',
  '政府多数派限制议会对%t的修改能力',
);

const PRIVATE_STRENGTH_DOMAIN: Lang14 = L14(
  'Domain expertise and operational capacity in %t',
  'Domänexpertis och operativ kapacitet inom %t',
  'Domæneekspertise og operationel kapacitet inden for %t',
  'Domenekompetanse og operativ kapasitet innen %t',
  'Toimialaasiantuntemus ja operatiivinen kapasiteetti %t:ssä',
  'Fachkompetenz und operative Kapazität in %t',
  'Expertise sectorielle et capacité opérationnelle dans %t',
  'Experiencia en el sector y capacidad operativa en %t',
  'Domeinexpertise en operationele capaciteit in %t',
  'الخبرة في المجال والقدرة التشغيلية في %t',
  'מומחיות בתחום וכושר תפעולי ב-%t',
  '%tにおけるドメイン専門知識と運用能力',
  '%t 분야 전문성 및 운영 역량',
  '%t领域专业知识和运营能力',
);

const PRIVATE_WEAKNESS_COMPLIANCE: Lang14 = L14(
  'Compliance costs and adaptation burden from %t regulation',
  'Efterlevnadskostnader och anpassningsbörda från %t-reglering',
  'Complianceomkostninger og tilpasningsbyrde fra %t-regulering',
  'Etterlevelseskostnader og tilpasningsbyrde fra %t-regulering',
  'Vaatimustenmukaisuuskustannukset ja sopeutumisrasite %t-sääntelystä',
  'Compliance-Kosten und Anpassungsbelastung durch %t-Regulierung',
  'Coûts de mise en conformité et charge d\'adaptation de la réglementation %t',
  'Costos de cumplimiento y carga de adaptación por la regulación %t',
  'Compliancekosten en aanpassingslast van %t-regelgeving',
  'تكاليف الامتثال وعبء التكيف مع لوائح %t',
  'עלויות ציות ועומס הסתגלות מרגולציית %t',
  '%t規制によるコンプライアンスコストと適応負担',
  '%t 규제로 인한 컴플라이언스 비용 및 적응 부담',
  '%t法规带来的合规成本和适应负担',
);

const PRIVATE_OPPORTUNITY_INVESTMENT: Lang14 = L14(
  'Investment and innovation opportunities from %t policy direction',
  'Investerings- och innovationsmöjligheter från %t-politikens inriktning',
  'Investerings- og innovationsmuligheder fra %t-politikkens retning',
  'Investerings- og innovasjonsmuligheter fra %t-politikkens retning',
  'Investointi- ja innovaatiomahdollisuudet %t-politiikan suunnasta',
  'Investitions- und Innovationschancen durch die %t-Politikrichtung',
  'Opportunités d\'investissement et d\'innovation issues de la politique %t',
  'Oportunidades de inversión e innovación derivadas de la política %t',
  'Investerings- en innovatiemogelijkheden door de %t-beleidsrichting',
  'فرص الاستثمار والابتكار من اتجاه سياسة %t',
  'הזדמנויות השקעה וחדשנות מכיוון המדיניות %t',
  '%t政策方向からの投資とイノベーションの機会',
  '%t 정책 방향으로부터의 투자 및 혁신 기회',
  '%t政策方向带来的投资和创新机会',
);

const PRIVATE_THREAT_UNCERTAINTY: Lang14 = L14(
  'Regulatory uncertainty and rapid policy evolution in %t creating stakeholder risk',
  'Regulatorisk osäkerhet och snabb policyutveckling inom %t skapar intressentrisk',
  'Regulatorisk usikkerhed og hurtig politikudvikling inden for %t skaber interessentrisiko',
  'Regulatorisk usikkerhet og rask policyutvikling innen %t skaper interessentrisiko',
  'Sääntelyllinen epävarmuus ja nopea politiikan kehitys %t:ssä luo sidosryhmäriskiä',
  'Regulatorische Unsicherheit und rasche Politikentwicklung in %t schaffen Stakeholder-Risiken',
  'Incertitude réglementaire et évolution rapide des politiques dans %t créant des risques pour les parties prenantes',
  'Incertidumbre regulatoria y evolución rápida de políticas en %t generando riesgo para las partes interesadas',
  'Regelgevende onzekerheid en snelle beleidsontwikkeling in %t creëren stakeholderrisico\'s',
  'الغموض التنظيمي والتطور السريع في السياسات في %t مما يخلق مخاطر لأصحاب المصلحة',
  'אי-ודאות רגולטורית ושינוי מדיניות מהיר ב-%t יוצרים סיכון לבעלי עניין',
  '%tにおける規制の不確実性と急速な政策変化がステークホルダーリスクを生む',
  '%t에서의 규제 불확실성과 빠른 정책 변화가 이해관계자 위험 초래',
  '%t中的监管不确定性和快速政策演变为利益相关者带来风险',
);

// ── Strategic implications (all 14 languages) ────────────────────────────────
// NOTE: Templates use count-only placeholders (%prop, %bet, %mot) and full
// language-correct word forms — no suffix-based plural placeholders (%ps/%bs/%ms).
// This avoids incorrect forms like "betänkandeer" in Swedish or
// "proposiciones" → "proposicioness" in Spanish.

const STRATEGIC_IMPL_TEMPLATES: Record<string, Lang14> = {
  legislative: L14(
    'Based on analysis of %total documents (%enriched enriched with full text)%topic: The legislative pipeline shows %prop government proposals, %bet committee reports, and %mot opposition motions. This distribution signals %signal%domain. Stakeholders should monitor committee deliberations and chamber voting patterns as the most reliable indicators of policy trajectory.',
    'Baserat på analys av %total dokument (%enriched berikade med fulltext)%topic: Det lagstiftande flödet visar %prop propositioner, %bet betänkanden och %mot motioner. Fördelningen signalerar %signal%domain. Intressenter bör följa utskottens överläggningar och kammarens voteringsmönster.',
    'Baseret på analyse af %total dokumenter (%enriched beriget med fuldtekst)%topic: Det lovgivningsmæssige flow viser %prop lovforslag, %bet udvalgsrapporter og %mot oppositionsforslag. Fordelingen signalerer %signal%domain.',
    'Basert på analyse av %total dokumenter (%enriched beriket med fulltekst)%topic: Det lovgivningsmessige forløpet viser %prop stortingsproposisjoner, %bet komitérapporter og %mot motionsforslag. Fordelingen signaliserer %signal%domain.',
    'Perustuen %total asiakirjan analyysiin (%enriched rikastetussa koko tekstissä)%topic: Lainsäädäntöputki näyttää %prop hallituksen esitystä, %bet valiokuntamietintöä ja %mot kirjelmää. Jakauma merkitsee %signal%domain.',
    'Basierend auf der Analyse von %total Dokumenten (%enriched mit vollständigem Text angereichert)%topic: Die Gesetzgebungs-Pipeline zeigt %prop Regierungsvorlagen, %bet Ausschussberichte und %mot Oppositionsanträge. Diese Verteilung signalisiert %signal%domain.',
    'Basé sur l\'analyse de %total documents (%enriched enrichis avec le texte complet)%topic: La pipeline législative montre %prop propositions gouvernementales, %bet rapports de commission et %mot motions d\'opposition. Cette distribution signale %signal%domain.',
    'Basado en el análisis de %total documentos (%enriched enriquecidos con texto completo)%topic: La actividad legislativa muestra %prop proposiciones gubernamentales, %bet informes de comité y %mot mociones de oposición. Esta distribución señala %signal%domain.',
    'Gebaseerd op analyse van %total documenten (%enriched verrijkt met volledige tekst)%topic: De wetgevingspijplijn toont %prop overheidsvoorstellen, %bet commissierapporten en %mot oppositiemoties. Deze verdeling geeft aan: %signal%domain.',
    'استناداً إلى تحليل %total وثيقة (%enriched مُعززة بالنص الكامل)%topic: يُظهر المسار التشريعي %prop مقترحات حكومية، %bet تقارير لجان و%mot اقتراحات معارضة. يُشير هذا التوزيع إلى %signal%domain.',
    'בהתבסס על ניתוח %total מסמכים (%enriched מועשרים בטקסט מלא)%topic: הצינור החקיקתי מראה %prop הצעות חוק ממשלתיות, %bet דוחות ועדה ו-%mot הצעות חוק אופוזיציה. ההתפלגות מסמנת %signal%domain.',
    '%total件の文書（%enriched件全文で充実）の分析に基づき%topic、立法パイプラインは%prop件の政府提案、%bet件の委員会報告、%mot件の野党動議を示しています。この分布は%domain%signalを示します。',
    '%total개 문서(%enriched개 전문 보강) 분석 기반%topic: 입법 파이프라인은 %prop개 정부 제안, %bet개 위원회 보고서, %mot개 야당 동의를 보여줍니다. 이 분포는 %domain%signal을 나타냅니다.',
    '基于对%total份文件（%enriched份全文丰富）的分析%topic：立法管道显示%prop项政府提案、%bet份委员会报告和%mot项反对派动议。这一分布表明%domain%signal。',
  ),
  nonLegislative: L14(
    'Based on analysis of %total documents (%enriched enriched with full text)%topic: This analysis examines %typeDesc%domain. %signalText Stakeholders should track whether formal propositions or committee referrals follow.',
    'Baserat på analys av %total dokument (%enriched berikade med fulltext)%topic: Denna analys granskar %typeDesc%domain. %signalText Intressenter bör bevaka om formella propositioner eller utskottsremisser följer.',
    'Baseret på analyse af %total dokumenter (%enriched beriget med fuldtekst)%topic: Denne analyse undersøger %typeDesc%domain. %signalText',
    'Basert på analyse av %total dokumenter (%enriched beriket med fulltekst)%topic: Denne analysen undersøker %typeDesc%domain. %signalText',
    'Perustuen %total asiakirjan analyysiin (%enriched rikastetussa koko tekstissä)%topic: Tämä analyysi tarkastelee %typeDesc%domain. %signalText',
    'Basierend auf der Analyse von %total Dokumenten (%enriched mit vollständigem Text angereichert)%topic: Diese Analyse untersucht %typeDesc%domain. %signalText',
    'Basé sur l\'analyse de %total documents (%enriched enrichis avec le texte complet)%topic: Cette analyse examine %typeDesc%domain. %signalText',
    'Basado en el análisis de %total documentos (%enriched enriquecidos con texto completo)%topic: Este análisis examina %typeDesc%domain. %signalText',
    'Gebaseerd op analyse van %total documenten (%enriched verrijkt met volledige tekst)%topic: Deze analyse onderzoekt %typeDesc%domain. %signalText',
    'استناداً إلى تحليل %total وثيقة (%enriched مُعززة بالنص الكامل)%topic: تحلل هذه الدراسة %typeDesc%domain. %signalText',
    'בהתבסס על ניתוח %total מסמכים (%enriched מועשרים בטקסט מלא)%topic: ניתוח זה בוחן %typeDesc%domain. %signalText',
    '%total件の文書（%enriched件全文で充実）の分析に基づき%topic、この分析は%domain%typeDescを検討します。%signalText',
    '%total개 문서(%enriched개 전문 보강) 분석 기반%topic: 이 분석은 %domain%typeDesc를 검토합니다. %signalText',
    '基于对%total份文件（%enriched份全文丰富）的分析%topic：本分析研究%domain%typeDesc。%signalText',
  ),
};

// ── Localised signal phrases for strategic implications ──────────────────────

const SIGNAL_GOVT_AGENDA: Lang14 = L14(
  'active government agenda-setting',
  'aktiv regeringsagendasättning',
  'aktiv regeringsdagsordenssætning',
  'aktiv regjeringsagendaoppsetting',
  'aktiivista hallituksen agendan asettamista',
  'aktive Regierungsagenda',
  'établissement actif de l\'agenda gouvernemental',
  'agenda gubernamental activa',
  'actieve regeringsagenda',
  'تحديد أجندة حكومية نشطة',
  'קביעת סדר יום ממשלתי פעיל',
  '積極的な政府アジェンダの設定',
  '적극적인 정부 의제 설정',
  '积极的政府议程设定',
);

const SIGNAL_PARL_SCRUTINY: Lang14 = L14(
  'strong parliamentary scrutiny',
  'stark parlamentarisk granskning',
  'stærk parlamentarisk kontrol',
  'sterk parlamentarisk kontroll',
  'vahvaa parlamentaarista valvontaa',
  'starke parlamentarische Kontrolle',
  'contrôle parlementaire fort',
  'fuerte escrutinio parlamentario',
  'sterk parlementair toezicht',
  'رقابة برلمانية قوية',
  'פיקוח פרלמנטרי חזק',
  '強力な議会審査',
  '강력한 의회 심사',
  '强有力的议会审查',
);

const SIGNAL_BALANCED: Lang14 = L14(
  'balanced legislative activity',
  'balanserad lagstiftningsverksamhet',
  'afbalanceret lovgivningsaktivitet',
  'balansert lovgivningsaktivitet',
  'tasapainoista lainsäädäntötoimintaa',
  'ausgewogene Gesetzgebungstätigkeit',
  'activité législative équilibrée',
  'actividad legislativa equilibrada',
  'evenwichtige wetgevingsactiviteit',
  'نشاط تشريعي متوازن',
  'פעילות חקיקה מאוזנת',
  '均衡な立法活動',
  '균형 잡힌 입법 활동',
  '平衡的立法活动',
);

const SIGNAL_PRESS: Lang14 = L14(
  'Government press communications signal policy priorities and upcoming legislative action.',
  'Regeringens presskommunikation signalerar policyprioriteter och kommande lagstiftningsåtgärder.',
  'Regeringens pressekommunikation signalerer politiske prioriteter og kommende lovgivningstiltag.',
  'Regjeringens pressekommunikasjon signaliserer politiske prioriteringer og kommende lovgivningstiltak.',
  'Hallituksen lehdistöviestintä viestii politiikan prioriteeteista ja tulevasta lainsäädännöstä.',
  'Regierungspressekommunikation signalisiert politische Prioritäten und bevorstehende Gesetzgebung.',
  'Les communications de presse du gouvernement signalent les priorités politiques et les actions législatives à venir.',
  'Las comunicaciones de prensa del gobierno señalan prioridades políticas y acciones legislativas próximas.',
  'Overheidspersberichten signaleren beleidsprioriteiten en aanstaande wetgevingsactie.',
  'بيانات الحكومة الصحفية تشير إلى أولويات السياسة والإجراءات التشريعية القادمة.',
  'תקשורת עיתונות ממשלתית מסמנת עדיפויות מדיניות ופעולות חקיקה קרובות.',
  '政府の広報は政策の優先事項と今後の法案活動を示唆しています。',
  '정부 언론 커뮤니케이션이 정책 우선순위와 향후 입법 활동을 알립니다.',
  '政府新闻通信表明政策优先事项和即将进行的立法行动。',
);

const SIGNAL_EXTERNAL: Lang14 = L14(
  'External references illuminate the policy landscape.',
  'Externa referenser belyser det politiska landskapet.',
  'Eksterne referencer belyser det politiske landskab.',
  'Eksterne referanser belyser det politiske landskapet.',
  'Ulkoiset viittaukset valaisevat politiikan maisemaa.',
  'Externe Referenzen erhellen die politische Landschaft.',
  'Les références externes éclairent le paysage politique.',
  'Las referencias externas iluminan el panorama político.',
  'Externe referenties werpen licht op het politieke landschap.',
  'المراجع الخارجية تسلط الضوء على المشهد السياسي.',
  'הפניות חיצוניות מאירות את הנוף הפוליטי.',
  '外部参照が政策環境を明らかにします。',
  '외부 참조가 정책 환경을 조명합니다.',
  '外部参考资料阐明了政策格局。',
);

// ── Localised non-legislative type descriptions ──────────────────────────────

const TYPE_DESC_PRESS: Lang14 = L14(
  'press releases', 'pressmeddelanden', 'pressemeddelelser', 'pressemeldinger',
  'lehdistötiedotteita', 'Pressemitteilungen', 'communiqués de presse', 'comunicados de prensa',
  'persberichten', 'بيانات صحفية', 'הודעות לעיתונות', 'プレスリリース', '보도자료', '新闻稿',
);

const TYPE_DESC_EXTERNAL: Lang14 = L14(
  'external references', 'externa referenser', 'eksterne referencer', 'eksterne referanser',
  'ulkoisia viittauksia', 'externe Referenzen', 'références externes', 'referencias externas',
  'externe referenties', 'مراجع خارجية', 'הפניות חיצוניות', '外部参照', '외부 참조', '外部参考',
);

// ── Key takeaway templates ────────────────────────────────────────────────────

const TAKEAWAY_PROP: Lang14 = L14(
  'Government has submitted %n legislative proposals on %t — active policy commitment',
  'Regeringen har lämnat %n lagstiftningsförslag om %t — aktivt politiskt engagemang',
  'Regeringen har fremsat %n lovforslag om %t — aktivt politisk engagement',
  'Regjeringen har fremmet %n lovforslag om %t — aktivt politisk engasjement',
  'Hallitus on antanut %n lakiesitystä %t:stä — aktiivinen poliittinen sitoutuminen',
  'Die Regierung hat %n Gesetzgebungsvorschläge zu %t eingebracht — aktives politisches Engagement',
  'Le gouvernement a soumis %n propositions législatives sur %t — engagement politique actif',
  'El gobierno ha presentado %n propuestas legislativas sobre %t — compromiso político activo',
  'De regering heeft %n wetsvoorstellen ingediend over %t — actief politiek engagement',
  'قدّمت الحكومة %n اقتراحات تشريعية بشأن %t — التزام سياسي نشط',
  'הממשלה הגישה %n הצעות חוק בנושא %t — מחויבות פוליטית פעילה',
  '政府は%t について%n件の法案を提出 — 積極的な政策コミットメント',
  '정부는 %t에 관한 %n건의 입법 제안서 제출 — 적극적 정책 공약',
  '政府已提交%n项关于%t的立法提案——积极的政策承诺',
);

const TAKEAWAY_BET: Lang14 = L14(
  '%n committee reports %verb %t — parliamentary oversight engaged',
  '%n betänkanden granskar %t — parlamentarisk tillsyn aktiverad',
  '%n udvalgsrapporter undersøger %t — parlamentarisk kontrol aktiveret',
  '%n komitérapporter undersøker %t — parlamentarisk kontroll engasjert',
  '%n valiokuntamietintöä tarkastelee %t:tä — parlamentaarinen valvonta aktivoitu',
  '%n Ausschussberichte prüfen %t — parlamentarische Kontrolle aktiv',
  '%n rapports de commission %verb %t — contrôle parlementaire engagé',
  '%n informes de comité %verb %t — supervisión parlamentaria activada',
  '%n commissierapporten %verb %t — parlementaire controle actief',
  '%n تقارير لجان تفحص %t — الرقابة البرلمانية مفعّلة',
  '%n דוחות ועדה בוחנים %t — פיקוח פרלמנטרי פעיל',
  '%n件の委員会報告書が%tを審査 — 議会監視が活性化',
  '%n건의 위원회 보고서가 %t 심사 — 의회 감독 활성화',
  '%n份委员会报告审查%t——议会监督已启动',
);

const TAKEAWAY_MOT: Lang14 = L14(
  '%n opposition motions %verb %t — cross-party debate active',
  '%n oppositionsmotioner utmanar %t — debatt över partigränser pågår',
  '%n oppositionsmotioner udfordrer %t — tværpartipolitisk debat aktiv',
  '%n opposisjonsmotioner utfordrer %t — tverr-partipolitisk debatt aktiv',
  '%n oppositiokirjelmää haastaa %t — puolueidenvälinen debatti aktiivinen',
  '%n Oppositionsanträge fechten %t an — parteiübergreifende Debatte aktiv',
  '%n motions d\'opposition %verb %t — débat interpartis actif',
  '%n mociones de oposición %verb %t — debate entre partidos activo',
  '%n oppositiemoties %verb %t — overpartijdebat actief',
  '%n اقتراحات معارضة تطعن في %t — النقاش عبر الأحزاب نشط',
  '%n הצעות אופוזיציה מתמודדות עם %t — דיון בין-מפלגתי פעיל',
  '%n件の野党動議が%tに異議申し立て — 超党派討論が活発',
  '%n건의 야당 동의가 %t에 이의 제기 — 초당파 논쟁 활성화',
  '%n项反对派动议对%t提出异议——跨党派辩论活跃',
);

const TAKEAWAY_EU: Lang14 = L14(
  '%n EU alignment documents — international context framing %t',
  '%n EU-anpassningsdokument — internationellt sammanhang ramas in kring %t',
  '%n EU-tilpasningsdokumenter — international kontekst rammer %t',
  '%n EU-tilpasningsdokumenter — internasjonalt kontekst rammer %t',
  '%n EU-yhdenmukaistamisasiakirjaa — kansainvälinen konteksti kehystää %t:n',
  '%n EU-Ausrichtungsdokumente — internationale Kontextrahmung für %t',
  '%n documents d\'alignement UE — contexte international encadrant %t',
  '%n documentos de alineación UE — contexto internacional enmarcando %t',
  '%n EU-afstemmingsdocumenten — internationale contextkaders %t',
  '%n وثائق توافق أوروبية — السياق الدولي يؤطر %t',
  '%n מסמכי התאמה לאיחוד האירופי — הקשר בינ\'ל מסגר %t',
  '%n件のEU整合文書 — 国際的文脈が%tをフレーミング',
  '%n건의 EU 정합 문서 — 국제 맥락이 %t를 틀 지어',
  '%n份EU对齐文件——国际背景框架%t',
);

const TAKEAWAY_ENRICHED: Lang14 = L14(
  '%n of %total documents enriched with full text — high analytical confidence',
  '%n av %total dokument berikade med fulltext — hög analytisk tillförlitlighet',
  '%n af %total dokumenter beriget med fuldtekst — høj analytisk tillid',
  '%n av %total dokumenter beriket med fulltekst — høy analytisk tillit',
  '%n / %total asiakirjasta rikastettu koko tekstillä — korkea analyyttinen luotettavuus',
  '%n von %total Dokumenten mit vollständigem Text angereichert — hohe analytische Zuverlässigkeit',
  '%n sur %total documents enrichis avec le texte complet — grande confiance analytique',
  '%n de %total documentos enriquecidos con texto completo — alta confianza analítica',
  '%n van %total documenten verrijkt met volledige tekst — hoge analytische betrouwbaarheid',
  '%n من %total وثيقة مُعززة بالنص الكامل — ثقة تحليلية عالية',
  '%n מתוך %total מסמכים מועשרים בטקסט מלא — אמון אנליטי גבוה',
  '%total件中%n件のドキュメントが全文で充実 — 高い分析信頼性',
  '%total개 중 %n개 문서 전문 보강 — 높은 분석 신뢰도',
  '%total份中%n份文件全文丰富——高分析可信度',
);

const TAKEAWAY_COALITION_STRESS: Lang14 = L14(
  'Coalition stress indicators present — opposition challenges to government proposals detected',
  'Koalitionsstressindikatorer påvisade — oppositionsutmaningar mot regeringsförslag detekterade',
  'Koalitionsstressindikatorer til stede — oppositionsudfordringer til regeringsforslag opdaget',
  'Koalisjonsstressindikatorer tilstede — opposisjonsutfordringer til regjeringsforslag oppdaget',
  'Koalition stressindikaattorit läsnä — opposition haasteet hallituksen esityksille havaittu',
  'Koalitionsstressindikatoren vorhanden — Oppositionsherausforderungen an Regierungsvorschläge erkannt',
  'Indicateurs de stress de coalition présents — défis de l\'opposition aux propositions gouvernementales détectés',
  'Indicadores de tensión de coalición presentes — desafíos de la oposición a las propuestas del gobierno detectados',
  'Coalitie-stress-indicatoren aanwezig — oppositie-uitdagingen aan overheidsvoorstellen gedetecteerd',
  'مؤشرات ضغط التحالف موجودة — تحديات المعارضة للمقترحات الحكومية مرصودة',
  'מחווני לחץ קואליציוני קיימים — אתגרי אופוזיציה להצעות הממשלה זוהו',
  '連立ストレス指標が存在 — 政府提案への野党の異議申し立てを検出',
  '연립 스트레스 지표 존재 — 정부 제안에 대한 야당 이의 제기 감지',
  '联盟压力指标存在——检测到反对派对政府提案的挑战',
);

// ---------------------------------------------------------------------------
// Interpolation helpers
// ---------------------------------------------------------------------------

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/%(\w+)/g, (_, key) => String(vars[key] ?? ''));
}

function plural(n: number, lang: Language): string {
  // Most supported languages use 's' as plural marker in EN-derived templates.
  // For the handful that don't, handle individually.
  if (lang === 'sv') return n !== 1 ? 'er' : '';
  if (lang === 'de') return n !== 1 ? 'e' : '';
  if (lang === 'fr') return n !== 1 ? 's' : '';
  if (lang === 'nl') return n !== 1 ? 'en' : '';
  // ja, ko, zh, ar, he — no plural suffix needed
  if (['ja', 'ko', 'zh', 'ar', 'he'].includes(lang)) return '';
  // da, no, fi — use 'er' / 'r' style, but templates already handle this in
  // most cases; default to 's' for EN-like languages.
  return n !== 1 ? 's' : '';
}

/** Full verb form for TAKEAWAY_BET templates (committee reports "scrutinise"/"examine"). */
function betVerbForm(n: number, lang: Language): string {
  if (lang === 'en') return n === 1 ? 'scrutinises' : 'scrutinise';
  if (lang === 'fr') return n === 1 ? 'examine' : 'examinent';
  if (lang === 'es') return n === 1 ? 'examina' : 'examinan';
  if (lang === 'nl') return n === 1 ? 'onderzoekt' : 'onderzoeken';
  return ''; // Other languages use fixed verb forms in templates
}

/** Full verb form for TAKEAWAY_MOT templates (opposition motions "challenge"/"contest"). */
function motVerbForm(n: number, lang: Language): string {
  if (lang === 'en') return n === 1 ? 'challenges' : 'challenge';
  if (lang === 'fr') return n === 1 ? 'conteste' : 'contestent';
  if (lang === 'es') return n === 1 ? 'impugna' : 'impugnan';
  if (lang === 'nl') return n === 1 ? 'betwist' : 'betwisten';
  return ''; // Other languages use fixed verb forms in templates
}

// ---------------------------------------------------------------------------
// Document classification result (Pass 1 output)
// ---------------------------------------------------------------------------

interface ClassifiedDocuments {
  propDocs: RawDocument[];
  betDocs: RawDocument[];
  motDocs: RawDocument[];
  skrDocs: RawDocument[];
  sfsDocs: RawDocument[];
  euDocs: RawDocument[];
  pressmDocs: RawDocument[];
  extDocs: RawDocument[];
  otherDocs: RawDocument[];
  allDomains: string[];
  hasCoalitionStress: boolean;
  enrichedCount: number;
}

// ---------------------------------------------------------------------------
// AIAnalysisPipeline
// ---------------------------------------------------------------------------

/**
 * Heuristic-based multi-iteration analysis pipeline for deep political intelligence.
 *
 * Instantiate once per deep-inspection run; call analyze() to execute all passes.
 * The number of iterations gates which passes run:
 *  - 1 iteration: Pass 1 only (classification + templated SWOT/implications/takeaways)
 *  - 2 iterations: Passes 1–3 (adds per-document analysis + cross-document synthesis)
 *  - 3+ iterations (default): Passes 1–4 (adds QA scoring with refinement on failure)
 */
export class AIAnalysisPipeline {
  private readonly iterations: number;
  private readonly qualityThreshold: number;

  constructor(options: { iterations?: number; qualityThreshold?: number } = {}) {
    this.iterations = Math.min(10, Math.max(1, options.iterations ?? 3));
    this.qualityThreshold = options.qualityThreshold ?? QUALITY_THRESHOLD;
  }

  // ── Public entry point ────────────────────────────────────────────────────

  /**
   * Execute the full multi-iteration analysis pipeline and return results.
   *
   * @param documents - Raw documents to analyse
   * @param focusTopic - Optional focus topic constraining the analysis
   * @param lang - Target language for all generated text
   * @returns Complete analysis result including dynamic SWOT entries
   */
  analyze(
    documents: RawDocument[],
    focusTopic: string | null,
    lang: Language,
  ): AIAnalysisResult {
    // Pass 1 (always): classify documents
    const classified = this.classifyDocuments(documents, lang);

    // Pass 2 (iterations >= 2): per-document deep analysis
    const documentAnalyses = this.iterations >= 2
      ? this.analyzeDocumentsDeep(classified, focusTopic, lang)
      : documents.map(d => this.createMinimalDocumentAnalysis(d));

    // Pass 3 (iterations >= 2): cross-document synthesis
    let synthesis = this.iterations >= 2
      ? this.synthesizeAcrossDocuments(classified, documentAnalyses, focusTopic, lang)
      : this.createEmptySynthesis();

    // Build dynamic SWOT (always — uses classification data from Pass 1)
    const dynamicSwotEntries = this.buildDynamicSwot(classified, focusTopic, lang);

    // Build strategic implications (always)
    const strategicImplications = this.buildStrategicImplications(
      classified, focusTopic, lang,
    );

    // Build key takeaways (always)
    const keyTakeaways = this.buildKeyTakeaways(classified, focusTopic, lang);

    // Pass 4 (iterations >= 3): QA + refinement
    // When quality is below threshold, re-run synthesis and replace the original.
    // The score is blended at 50% weight so minor improvements are credited.
    const REFINEMENT_WEIGHT = 0.5;
    let qualityScore = this.scoreAnalysis(documentAnalyses, synthesis, dynamicSwotEntries);
    if (this.iterations >= 3 && qualityScore < this.qualityThreshold) {
      // Re-run synthesis and replace original when below quality threshold
      const refinedSynthesis = this.synthesizeAcrossDocuments(
        classified, documentAnalyses, focusTopic, lang,
      );
      const refinedScore = this.scoreAnalysis(documentAnalyses, refinedSynthesis, dynamicSwotEntries);
      qualityScore = Math.min(100, qualityScore + refinedScore * REFINEMENT_WEIGHT);
      synthesis = refinedSynthesis;
    }

    return {
      iterations: this.iterations,
      documentAnalyses,
      synthesis,
      dynamicSwotEntries,
      strategicImplications,
      keyTakeaways,
      qualityScore,
    };
  }

  // ── Stub helpers for iterations=1 (skip Passes 2–3) ───────────────────────

  /** Return a minimal document analysis when Pass 2 is skipped (iterations=1). */
  private createMinimalDocumentAnalysis(d: RawDocument): AIDocumentAnalysis {
    return {
      dok_id: d.dok_id ?? '',
      title: docTitle(d),
      legislativeImpact: '',
      crossPartyImplications: '',
      historicalContext: '',
      euNordicComparison: '',
      qualityScore: 0,
    };
  }

  /** Return an empty synthesis when Pass 3 is skipped (iterations=1). */
  private createEmptySynthesis(): AISynthesis {
    return {
      policyConvergence: '',
      coalitionStressIndicators: '',
      emergingTrends: '',
      stakeholderPowerDynamics: '',
    };
  }

  // ── Pass 1: Data Collection & Classification ─────────────────────────────

  private classifyDocuments(docs: RawDocument[], lang: Language): ClassifiedDocuments {
    const propDocs   = docs.filter(d => docType(d) === 'prop');
    const betDocs    = docs.filter(d => docType(d) === 'bet');
    const motDocs    = docs.filter(d => docType(d) === 'mot');
    const skrDocs    = docs.filter(d => docType(d) === 'skr');
    const sfsDocs    = docs.filter(d =>
      docType(d) === 'sfs' || (d.dokumentnamn ?? '').startsWith('SFS'));
    const euDocs     = docs.filter(d => docType(d) === 'fpm');
    const pressmDocs = docs.filter(d => docType(d) === 'pressm');
    const extDocs    = docs.filter(d => EXT_TYPES.has(docType(d)));
    const otherDocs  = docs.filter(d =>
      !['prop','bet','mot','skr','sfs','fpm','pressm','ext','external'].includes(docType(d))
      && !(d.dokumentnamn ?? '').startsWith('SFS'));

    const domainSet = new Set<string>();
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => domainSet.add(dom)));

    const hasStress = docs.some(d => hasCoalitionStress(d));
    const enrichedCount = docs.filter(d => d.contentFetched).length;

    return {
      propDocs, betDocs, motDocs, skrDocs, sfsDocs, euDocs,
      pressmDocs, extDocs, otherDocs,
      allDomains: [...domainSet],
      hasCoalitionStress: hasStress,
      enrichedCount,
    };
  }

  // ── Pass 2: AI Deep Analysis per document ─────────────────────────────────

  private analyzeDocumentsDeep(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): AIDocumentAnalysis[] {
    const allDocs = [
      ...classified.propDocs,
      ...classified.betDocs,
      ...classified.motDocs,
      ...classified.sfsDocs,
      ...classified.skrDocs,
      ...classified.euDocs,
      ...classified.pressmDocs,
      ...classified.extDocs,
      ...classified.otherDocs,
    ];

    return allDocs.map(doc => this.analyzeDocument(doc, focusTopic, classified, lang));
  }

  private analyzeDocument(
    doc: RawDocument,
    focusTopic: string | null,
    classified: ClassifiedDocuments,
    lang: Language,
  ): AIDocumentAnalysis {
    const title = docTitle(doc);
    const stake = classifyStakeholder(doc);
    const domains = detectPolicyDomains(doc, lang);
    const topDomain = domains[0] ?? classified.allDomains[0] ?? (focusTopic ?? 'policy');
    const topicStr = focusTopic ?? topDomain;

    // Legislative impact — based on document type
    const legislativeImpact = this.buildLegislativeImpact(doc, stake, topicStr, lang);

    // Cross-party implications
    const crossPartyImplications = this.buildCrossPartyImplications(doc, classified, topicStr, lang);

    // Historical context — thin since we have no historical corpus; use enriched text if available
    const historicalContext = this.buildHistoricalContext(doc, topicStr, lang);

    // EU/Nordic comparison
    const euNordicComparison = this.buildEuNordicComparison(doc, classified, topicStr, lang);

    const analysisText = [legislativeImpact, crossPartyImplications, historicalContext, euNordicComparison].join(' ');
    const qualityScore = scoreAnalysisDepth(analysisText);

    return {
      dok_id: doc.dok_id ?? title.slice(0, 20),
      title,
      legislativeImpact,
      crossPartyImplications,
      historicalContext,
      euNordicComparison,
      qualityScore,
    };
  }

  private buildLegislativeImpact(
    doc: RawDocument,
    stake: 'government' | 'opposition' | 'eu' | 'other',
    topicStr: string,
    lang: Language,
  ): string {
    if (stake === 'government') {
      return `${pickLang(LEGISLATIVE_SIGNAL, lang)} ${docTitle(doc).slice(0, 80)} — ${topicStr}`;
    }
    if (stake === 'opposition') {
      return `${pickLang(SCRUTINY_SIGNAL, lang)} ${docTitle(doc).slice(0, 80)} — ${topicStr}`;
    }
    if (stake === 'eu') {
      return `${pickLang(EU_ALIGNMENT_SIGNAL, lang)} ${docTitle(doc).slice(0, 80)} — ${topicStr}`;
    }
    return `${docTitle(doc).slice(0, 80)} — ${topicStr}`;
  }

  private buildCrossPartyImplications(
    doc: RawDocument,
    classified: ClassifiedDocuments,
    topicStr: string,
    lang: Language,
  ): string {
    const stake = classifyStakeholder(doc);
    if (classified.hasCoalitionStress && stake === 'opposition') {
      return pickLang(TAKEAWAY_COALITION_STRESS, lang);
    }
    if (classified.propDocs.length > 0 && classified.motDocs.length > 0) {
      return pickLang(OPP_OPPORTUNITY_CONSENSUS, lang).replace('%t', topicStr);
    }
    return '';
  }

  private buildHistoricalContext(
    doc: RawDocument,
    topicStr: string,
    _lang: Language,
  ): string {
    // Use enriched content snippet when available (fullText ?? fullContent per codebase convention)
    const contentSnippet = (doc.fullText ?? doc.fullContent ?? doc.summary ?? doc.notis ?? '');
    if (contentSnippet && contentSnippet.length > 50) {
      return contentSnippet.slice(0, 200).replace(/\s+/g, ' ');
    }
    // Fallback: synthesise from document fields
    const year = (doc.datum ?? '').slice(0, 4);
    if (year && year.length === 4) {
      return `${topicStr} — ${year}`;
    }
    return '';
  }

  private buildEuNordicComparison(
    doc: RawDocument,
    classified: ClassifiedDocuments,
    topicStr: string,
    lang: Language,
  ): string {
    if (classified.euDocs.length > 0 || docType(doc) === 'fpm') {
      return pickLang(EU_OPPORTUNITY, lang).replace('%t', topicStr);
    }
    return '';
  }

  // ── Pass 3: Cross-Document Synthesis ──────────────────────────────────────

  private synthesizeAcrossDocuments(
    classified: ClassifiedDocuments,
    docAnalyses: AIDocumentAnalysis[],
    focusTopic: string | null,
    lang: Language,
  ): AISynthesis {
    const topicStr = focusTopic ?? classified.allDomains[0] ?? 'policy';
    const n = classified.propDocs.length + classified.betDocs.length + classified.motDocs.length;

    // Policy convergence/divergence
    const converging = classified.propDocs.length > 0 && classified.betDocs.length > 0;
    const diverging = classified.motDocs.length > classified.propDocs.length;
    const policyConvergence = converging
      ? interp(pickLang(GOV_STRENGTH_LABELS.propositions, lang), {
          n: classified.propDocs.length,
          s: plural(classified.propDocs.length, lang),
          t: topicStr,
        })
      : diverging
        ? interp(pickLang(OPP_STRENGTH_LABELS.motions, lang), {
            n: classified.motDocs.length,
            s: plural(classified.motDocs.length, lang),
            t: topicStr,
          })
        : `${topicStr} — ${n}`;

    // Coalition stress indicators
    const coalitionStressIndicators = classified.hasCoalitionStress
      ? pickLang(TAKEAWAY_COALITION_STRESS, lang)
      : '';

    // Emerging trends
    const avgQuality = docAnalyses.length > 0
      ? docAnalyses.reduce((sum, a) => sum + a.qualityScore, 0) / docAnalyses.length
      : 0;
    const trendConfidence = avgQuality >= 60 ? 'HIGH' : avgQuality >= 35 ? 'MEDIUM' : 'LOW';
    const emergingTrends = classified.allDomains.slice(0, 3).join(', ')
      + (trendConfidence ? ` [${trendConfidence}]` : '');

    // Stakeholder power dynamics
    const govDocs = classified.propDocs.length + classified.sfsDocs.length + classified.pressmDocs.length;
    const oppDocs = classified.betDocs.length + classified.motDocs.length;
    const stakeholderPowerDynamics = govDocs > oppDocs
      ? interp(pickLang(GOV_STRENGTH_LABELS.default, lang), { t: topicStr })
      : oppDocs > 0
        ? interp(pickLang(OPP_STRENGTH_LABELS.default, lang), { t: topicStr })
        : topicStr;

    return { policyConvergence, coalitionStressIndicators, emergingTrends, stakeholderPowerDynamics };
  }

  // ── Dynamic SWOT generation ────────────────────────────────────────────────

  private buildDynamicSwot(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): DynamicSwotEntries {
    const topic = focusTopic ?? classified.allDomains[0] ?? 'policy';
    const {
      propDocs, betDocs, motDocs, sfsDocs, skrDocs, euDocs, pressmDocs, extDocs,
    } = classified;

    const titleEntry = (d: RawDocument, impact: SwotEntry['impact'] = 'medium'): SwotEntry => ({
      text: docTitle(d),
      impact,
    });

    // ── Government SWOT ──────────────────────────────────────────────────────
    const govStrengths: SwotEntry[] = [
      ...propDocs.slice(0, 3).map(d => titleEntry(d, 'high')),
      ...sfsDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
      ...skrDocs.slice(0, 1).map(d => titleEntry(d, 'medium')),
      ...pressmDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
    ];
    if (govStrengths.length === 0) {
      govStrengths.push({
        text: interp(pickLang(
          propDocs.length > 0 ? GOV_STRENGTH_LABELS.propositions : GOV_STRENGTH_LABELS.default,
          lang,
        ), { n: propDocs.length, s: plural(propDocs.length, lang), t: topic }),
        impact: 'medium',
      });
    }

    const govWeaknesses: SwotEntry[] = [
      ...betDocs.slice(0, 2).map(d => titleEntry(d, 'medium')),
    ];
    if (govWeaknesses.length === 0) {
      govWeaknesses.push({
        text: interp(pickLang(GOV_WEAKNESS_IMPL, lang), { t: topic }),
        impact: 'medium',
      });
    }

    const govOpportunities: SwotEntry[] = [
      ...euDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
      ...skrDocs.slice(1, 2).map(d => titleEntry(d, 'medium')),
    ];
    if (govOpportunities.length === 0) {
      govOpportunities.push({
        text: interp(pickLang(EU_OPPORTUNITY, lang), { t: topic }),
        impact: 'high',
      });
    }

    const govThreats: SwotEntry[] = [
      ...motDocs.slice(0, 2).map(d => titleEntry(d, 'medium')),
    ];
    if (govThreats.length === 0) {
      govThreats.push({
        text: interp(pickLang(GOV_THREAT_EXEC, lang), { t: topic }),
        impact: 'medium',
      });
    }

    // ── Opposition SWOT ──────────────────────────────────────────────────────
    const oppStrengths: SwotEntry[] = [
      ...betDocs.slice(0, 3).map(d => titleEntry(d, 'high')),
      ...motDocs.slice(0, 2).map(d => titleEntry(d, 'medium')),
    ];
    if (oppStrengths.length === 0) {
      oppStrengths.push({
        text: interp(pickLang(
          betDocs.length > 0 ? OPP_STRENGTH_LABELS.committee : OPP_STRENGTH_LABELS.default,
          lang,
        ), { n: betDocs.length, s: plural(betDocs.length, lang), t: topic }),
        impact: 'high',
      });
    }

    const oppWeaknesses: SwotEntry[] = [];
    oppWeaknesses.push({
      text: interp(pickLang(OPP_WEAKNESS_INFO, lang), { t: topic }),
      impact: 'medium',
    });

    const oppOpportunities: SwotEntry[] = [];
    oppOpportunities.push({
      text: interp(pickLang(OPP_OPPORTUNITY_CONSENSUS, lang), { t: topic }),
      impact: 'high',
    });

    const oppThreats: SwotEntry[] = [
      ...propDocs.slice(0, 1).map(d => titleEntry(d, 'medium')),
    ];
    if (oppThreats.length === 0) {
      oppThreats.push({
        text: interp(pickLang(OPP_THREAT_MAJORITY, lang), { t: topic }),
        impact: 'medium',
      });
    }

    // ── Private Sector / Civil Society SWOT ─────────────────────────────────
    const privateStrengths: SwotEntry[] = [
      {
        text: interp(pickLang(PRIVATE_STRENGTH_DOMAIN, lang), { t: topic }),
        impact: 'high',
      },
      ...sfsDocs.slice(0, 1).map(d => titleEntry(d, 'medium')),
      ...extDocs.slice(0, 2).map(d => titleEntry(d, 'high')),
    ];

    const privateWeaknesses: SwotEntry[] = [
      {
        text: interp(pickLang(PRIVATE_WEAKNESS_COMPLIANCE, lang), { t: topic }),
        impact: 'medium',
      },
    ];

    const privateOpportunities: SwotEntry[] = [
      {
        text: interp(pickLang(PRIVATE_OPPORTUNITY_INVESTMENT, lang), { t: topic }),
        impact: 'high',
      },
      ...euDocs.slice(0, 1).map(d => titleEntry(d, 'high')),
    ];

    const privateThreats: SwotEntry[] = [
      {
        text: interp(pickLang(PRIVATE_THREAT_UNCERTAINTY, lang), { t: topic }),
        impact: 'high',
      },
    ];

    return {
      government: {
        strengths: govStrengths,
        weaknesses: govWeaknesses,
        opportunities: govOpportunities,
        threats: govThreats,
      },
      opposition: {
        strengths: oppStrengths,
        weaknesses: oppWeaknesses,
        opportunities: oppOpportunities,
        threats: oppThreats,
      },
      privateSector: {
        strengths: privateStrengths,
        weaknesses: privateWeaknesses,
        opportunities: privateOpportunities,
        threats: privateThreats,
      },
    };
  }

  // ── Strategic implications ────────────────────────────────────────────────

  private buildStrategicImplications(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): string {
    const esc = escapeHtml;
    const topic = focusTopic ?? classified.allDomains[0] ?? '';
    const { propDocs, betDocs, motDocs, pressmDocs, extDocs, enrichedCount, allDomains } = classified;
    const total = propDocs.length + betDocs.length + motDocs.length
      + pressmDocs.length + extDocs.length + classified.sfsDocs.length
      + classified.skrDocs.length + classified.euDocs.length + classified.otherDocs.length;
    const legislativeCount = propDocs.length + betDocs.length + motDocs.length;
    const isLegislative = legislativeCount > 0;
    const domainPhrase = allDomains.slice(0, 3).map(d => esc(d)).join(', ');
    const topicInsert = topic ? ` (${esc(topic)})` : '';
    const domainInsert = domainPhrase ? ` — ${domainPhrase}` : '';

    if (isLegislative) {
      // Use fully localized signal phrase
      const signalPhrase = propDocs.length > betDocs.length
        ? pickLang(SIGNAL_GOVT_AGENDA, lang)
        : betDocs.length > propDocs.length
          ? pickLang(SIGNAL_PARL_SCRUTINY, lang)
          : pickLang(SIGNAL_BALANCED, lang);
      const template = pickLang(STRATEGIC_IMPL_TEMPLATES.legislative, lang);
      return `<p>${interp(template, {
        total,
        enriched: enrichedCount,
        topic: topicInsert,
        prop: propDocs.length,
        bet: betDocs.length,
        mot: motDocs.length,
        signal: esc(signalPhrase),
        domain: domainInsert,
      })}</p>`;
    }

    // Non-legislative documents — use localized description and signal text
    const typeDesc = esc(pressmDocs.length > 0
      ? `${pressmDocs.length} ${pickLang(TYPE_DESC_PRESS, lang)}`
      : `${extDocs.length} ${pickLang(TYPE_DESC_EXTERNAL, lang)}`);
    const signalText = pressmDocs.length > 0
      ? pickLang(SIGNAL_PRESS, lang)
      : pickLang(SIGNAL_EXTERNAL, lang);
    const template = pickLang(STRATEGIC_IMPL_TEMPLATES.nonLegislative, lang);
    return `<p>${interp(template, {
      total,
      enriched: enrichedCount,
      topic: topicInsert,
      typeDesc,
      domain: domainInsert,
      signalText: esc(signalText),
    })}</p>`;
  }

  // ── Key takeaways ─────────────────────────────────────────────────────────

  private buildKeyTakeaways(
    classified: ClassifiedDocuments,
    focusTopic: string | null,
    lang: Language,
  ): string[] {
    const topic = focusTopic ?? classified.allDomains[0] ?? 'policy';
    const { propDocs, betDocs, motDocs, euDocs, enrichedCount } = classified;
    const total = propDocs.length + betDocs.length + motDocs.length
      + classified.sfsDocs.length + classified.skrDocs.length
      + classified.pressmDocs.length + classified.extDocs.length
      + classified.euDocs.length + classified.otherDocs.length;

    const items: string[] = [];

    if (propDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_PROP, lang), {
        n: propDocs.length, t: topic,
      }));
    }
    if (betDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_BET, lang), {
        n: betDocs.length, t: topic,
        verb: betVerbForm(betDocs.length, lang),
      }));
    }
    if (motDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_MOT, lang), {
        n: motDocs.length, t: topic,
        verb: motVerbForm(motDocs.length, lang),
      }));
    }
    if (euDocs.length > 0) {
      items.push(interp(pickLang(TAKEAWAY_EU, lang), {
        n: euDocs.length, t: topic,
      }));
    }
    if (enrichedCount > 0 && enrichedCount >= Math.ceil(total / 2)) {
      items.push(interp(pickLang(TAKEAWAY_ENRICHED, lang), {
        n: enrichedCount, total,
      }));
    }
    if (classified.hasCoalitionStress) {
      items.push(pickLang(TAKEAWAY_COALITION_STRESS, lang));
    }

    return items;
  }

  // ── Pass 4: Quality Scoring ───────────────────────────────────────────────

  private scoreAnalysis(
    docAnalyses: AIDocumentAnalysis[],
    synthesis: AISynthesis,
    swot: DynamicSwotEntries,
  ): number {
    let score = 0;

    // Document analysis quality (up to 40 points)
    if (docAnalyses.length > 0) {
      const avgDoc = docAnalyses.reduce((sum, a) => sum + a.qualityScore, 0) / docAnalyses.length;
      score += Math.floor(avgDoc * 0.4);
    }

    // Synthesis quality (up to 30 points)
    const synthText = [
      synthesis.policyConvergence,
      synthesis.coalitionStressIndicators,
      synthesis.emergingTrends,
      synthesis.stakeholderPowerDynamics,
    ].join(' ');
    score += Math.min(30, Math.floor(scoreAnalysisDepth(synthText) * 0.3));

    // SWOT richness (up to 30 points)
    const swotCount =
      swot.government.strengths.length + swot.government.weaknesses.length
      + swot.opposition.strengths.length + swot.opposition.weaknesses.length
      + swot.privateSector.strengths.length;
    score += Math.min(30, swotCount * 3);

    return Math.min(100, score);
  }
}
