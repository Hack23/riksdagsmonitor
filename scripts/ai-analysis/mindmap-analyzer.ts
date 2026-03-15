/**
 * @module ai-analysis/mindmap-analyzer
 * @description AI-driven mindmap branch generator.
 *
 * Analyses parliamentary document collections across three refinement passes to
 * produce semantically rich `MindmapBranch` arrays — replacing static, count-based
 * branch construction with content-aware policy relationship discovery.
 *
 * **Three-pass analysis**
 * 1. **Iteration 1 — Content decomposition**: Classify documents into legislative
 *    categories; extract actors, organs, and policy signals from titles.
 * 2. **Iteration 2 — Relationship discovery**: Detect cross-committee dependencies,
 *    stakeholder conflicts/alignment, and EU/international linkages.
 * 3. **Iteration 3 — Validation & completeness**: Ensure minimum branch count (5),
 *    assign importance levels, and generate a cohesive analytical summary.
 *
 * All output is pure data — HTML rendering is delegated to `mindmap-section.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers.js';
import type { MindmapBranch, BranchConnection } from '../data-transformers/content-generators/mindmap-section.js';
import { localizeDocType } from '../data-transformers/content-generators/shared.js';
import { detectPolicyDomains, detectNarrativeFrames } from '../data-transformers/policy-analysis.js';
import { getCurrentRiksmote } from '../shared/riksmote.js';
import type { Language } from '../types/language.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Full analysis result returned by buildAIMindmapBranches */
export interface MindmapAnalysisResult {
  /** Branches for the mindmap (≥5 branches after three-pass analysis) */
  branches: MindmapBranch[];
  /** Cross-branch relationship descriptors */
  connections: BranchConnection[];
  /** AI-generated analytical summary paragraph */
  summary: string;
}

// ---------------------------------------------------------------------------
// Localised label tables
// ---------------------------------------------------------------------------

const L = (table: Partial<Record<Language, string>>, lang: Language | string, fallback: string): string =>
  (table as Record<string, string>)[lang] ?? (table as Record<string, string>).en ?? fallback;

const LABELS = {
  legislativePipeline: {
    en: 'Legislative Pipeline', sv: 'Lagstiftningsprocess', da: 'Lovgivningsproces',
    no: 'Lovgivningsprosess', fi: 'Lainsäädäntöprosessi', de: 'Gesetzgebungsprozess',
    fr: 'Pipeline législatif', es: 'Proceso legislativo', nl: 'Wetgevingsproces',
    ar: 'مسار التشريع', he: 'מסלול החקיקה', ja: '立法プロセス', ko: '입법 파이프라인', zh: '立法流程',
  } as Partial<Record<Language, string>>,
  policyImpactChains: {
    en: 'Policy Impact Chains', sv: 'Policykonsekvenskedjor', da: 'Politikkonsekvensskæde',
    no: 'Politikkonsekvensar', fi: 'Politiikkavaikutusketjut', de: 'Folgewirkungsketten',
    fr: "Chaînes d'impact", es: 'Cadenas de impacto', nl: 'Beleidsimpactketens',
    ar: 'سلاسل تأثير السياسات', he: 'שרשרות השפעת מדיניות', ja: '政策影響連鎖', ko: '정책 영향 체계', zh: '政策影响链',
  } as Partial<Record<Language, string>>,
  crossCommitteeDeps: {
    en: 'Cross-Committee Dependencies', sv: 'Tvärkommittéberoenden', da: 'Tværudvalgsberoende',
    no: 'Krysskomitéavhengigheter', fi: 'Komiteoiden välinen riippuvuus', de: 'Ausschussübergreifende Abhängigkeiten',
    fr: 'Dépendances inter-commissions', es: 'Dependencias entre comisiones', nl: 'Commissie-overschrijdende afhankelijkheden',
    ar: 'تبعيات بين اللجان', he: 'תלויות בין-ועדות', ja: '委員会間の依存関係', ko: '위원회 간 의존성', zh: '跨委员会依赖',
  } as Partial<Record<Language, string>>,
  stakeholderNetwork: {
    en: 'Stakeholder Network', sv: 'Intressentnätverk', da: 'Interessentnetværk',
    no: 'Interessentnettverk', fi: 'Sidosryhmäverkosto', de: 'Stakeholder-Netzwerk',
    fr: 'Réseau de parties prenantes', es: 'Red de partes interesadas', nl: 'Stakeholdernetwerk',
    ar: 'شبكة أصحاب المصلحة', he: 'רשת בעלי עניין', ja: 'ステークホルダーネットワーク', ko: '이해관계자 네트워크', zh: '利益相关者网络',
  } as Partial<Record<Language, string>>,
  riskBlockers: {
    en: 'Risks & Blockers', sv: 'Risker & hinder', da: 'Risici & blokeringer',
    no: 'Risikoer & blokkering', fi: 'Riskit & esteet', de: 'Risiken & Blockaden',
    fr: 'Risques & blocages', es: 'Riesgos & bloqueos', nl: "Risico's & blokkers",
    ar: 'المخاطر والعوائق', he: "סיכונים ומונעים", ja: 'リスクと阻害要因', ko: '위험 및 차단 요소', zh: '风险与障碍',
  } as Partial<Record<Language, string>>,
  euInternationalContext: {
    en: 'EU & International Context', sv: 'EU & internationellt sammanhang', da: 'EU & international kontekst',
    no: 'EU & internasjonal kontekst', fi: 'EU & kansainvälinen konteksti', de: 'EU & internationaler Kontext',
    fr: 'Contexte EU & international', es: 'Contexto EU & internacional', nl: 'EU & internationale context',
    ar: 'السياق الأوروبي والدولي', he: 'הקשר האירופי והבינלאומי', ja: 'EU・国際的文脈', ko: 'EU 및 국제 맥락', zh: 'EU与国际背景',
  } as Partial<Record<Language, string>>,
  legislativeTimeline: {
    en: 'Legislative Timeline', sv: 'Lagstiftningstidslinje', da: 'Lovgivningstidslinje',
    no: 'Lovgivningstidslinje', fi: 'Lainsäädäntöaikataulu', de: 'Gesetzgebungszeitplan',
    fr: 'Calendrier législatif', es: 'Cronograma legislativo', nl: 'Wetgevingstijdlijn',
    ar: 'الجدول الزمني التشريعي', he: 'ציר הזמן החקיקתי', ja: '立法タイムライン', ko: '입법 타임라인', zh: '立法时间线',
  } as Partial<Record<Language, string>>,
  policyDomains: {
    en: 'Policy Domains', sv: 'Politikområden', da: 'Politikområder',
    no: 'Politikkområder', fi: 'Politiikka-alueet', de: 'Politikbereiche',
    fr: 'Domaines de politique', es: 'Dominios de política', nl: 'Beleidsdomeinen',
    ar: 'مجالات السياسة', he: 'תחומי מדיניות', ja: '政策分野', ko: '정책 분야', zh: '政策领域',
  } as Partial<Record<Language, string>>,
  dataContext: {
    en: 'Data & Evidence Sources', sv: 'Data & evidenskällor', da: 'Data & evidenskilder',
    no: 'Data & evidenskilder', fi: 'Data & todistuslähteet', de: 'Daten- & Beweisquellen',
    fr: 'Sources de données & preuves', es: 'Fuentes de datos y evidencia', nl: 'Data- & bewijsbronnen',
    ar: 'مصادر البيانات والأدلة', he: 'מקורות נתונים וראיות', ja: 'データ・根拠資料', ko: '데이터 및 증거 출처', zh: '数据与证据来源',
  } as Partial<Record<Language, string>>,
};

// Localised strings for stakeholder item templates
const STAKEHOLDER_LABELS = {
  government: {
    en: 'Government', sv: 'Regering', da: 'Regering', no: 'Regjering',
    fi: 'Hallitus', de: 'Regierung', fr: 'Gouvernement', es: 'Gobierno',
    nl: 'Regering', ar: 'الحكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府',
  } as Partial<Record<Language, string>>,
  opposition: {
    en: 'Opposition', sv: 'Opposition', da: 'Opposition', no: 'Opposisjon',
    fi: 'Oppositio', de: 'Opposition', fr: 'Opposition', es: 'Oposición',
    nl: 'Oppositie', ar: 'المعارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派',
  } as Partial<Record<Language, string>>,
  civilSociety: {
    en: 'Civil Society', sv: 'Civilsamhälle', da: 'Civilsamfund', no: 'Sivilsamfunn',
    fi: 'Kansalaisyhteiskunta', de: 'Zivilgesellschaft', fr: 'Société civile', es: 'Sociedad civil',
    nl: 'Maatschappelijk middenveld', ar: 'المجتمع المدني', he: 'החברה האזרחית', ja: '市民社会', ko: '시민 사회', zh: '民间社会',
  } as Partial<Record<Language, string>>,
  parliament: {
    en: 'Parliament', sv: 'Riksdag', da: 'Folketing', no: 'Storting',
    fi: 'Eduskunta', de: 'Parlament', fr: 'Parlement', es: 'Parlamento',
    nl: 'Parlement', ar: 'البرلمان', he: 'פרלמנט', ja: '議会', ko: '의회', zh: '议会',
  } as Partial<Record<Language, string>>,
};

// Localised connection label templates
const CONNECTION_LABELS = {
  committeesInvolved: {
    en: '{n} committees involved', sv: '{n} utskott involverade', da: '{n} udvalg involveret',
    no: '{n} komiteer involvert', fi: '{n} valiokuntaa mukana', de: '{n} Ausschüsse beteiligt',
    fr: '{n} commissions impliquées', es: '{n} comisiones involucradas', nl: '{n} commissies betrokken',
    ar: '{n} لجان مشاركة', he: '{n} ועדות מעורבות', ja: '{n}委員会が関与', ko: '{n}개 위원회 관련', zh: '{n}个委员会参与',
  } as Partial<Record<Language, string>>,
  euTransposition: {
    en: 'EU transposition obligations', sv: 'EU-implementeringskrav', da: 'EU-gennemførelseskrav',
    no: 'EU-implementeringskrav', fi: 'EU-täytäntöönpanovelvoitteet', de: 'EU-Umsetzungsverpflichtungen',
    fr: "Obligations de transposition de l'UE", es: 'Obligaciones de transposición de la UE', nl: 'EU-omzettingsverplichtingen',
    ar: 'التزامات تنفيذ الاتحاد الأوروبي', he: 'חובות יישום האיחוד האירופי', ja: 'EU法の国内法化義務', ko: 'EU 전환 의무', zh: 'EU转化义务',
  } as Partial<Record<Language, string>>,
  oppositionMotions: {
    en: '{n} opposition motions', sv: '{n} oppositionsmotioner', da: '{n} oppositionsforslag',
    no: '{n} opposisjonsforslag', fi: '{n} opposition aloitetta', de: '{n} Oppositionsanträge',
    fr: '{n} motions d\'opposition', es: '{n} mociones de oposición', nl: '{n} oppositiemoties',
    ar: '{n} مقترحات المعارضة', he: '{n} הצעות אופוזיציה', ja: '野党動議{n}件', ko: '야당 동의안 {n}건', zh: '{n}项反对党动议',
  } as Partial<Record<Language, string>>,
};

// Localised data source items (per language)
const DATA_SOURCE_ITEMS: Partial<Record<Language | string, string[]>> = {
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

// Localised display strings for NarrativeFrame IDs
// Maps internal kebab-case IDs to human-readable, per-language strings.
const NARRATIVE_FRAME_LABELS: Record<string, Partial<Record<Language, string>>> = {
  'law-and-order': {
    en: 'Law & Order', sv: 'Lag & ordning', da: 'Lov & orden',
    no: 'Lov & orden', fi: 'Laki & järjestys', de: 'Recht & Ordnung',
    fr: 'Loi & ordre', es: 'Ley & orden', nl: 'Recht & orde',
    ar: 'القانون والنظام', he: 'חוק וסדר', ja: '法と秩序', ko: '법과 질서', zh: '法律与秩序',
  },
  'welfare-state-defence': {
    en: 'Welfare State Defence', sv: 'Välfärdsförsvar', da: 'Velfærdsforsvar',
    no: 'Velferdsforsvar', fi: 'Hyvinvointivaltion puolustus', de: 'Sozialstaatsverteidigung',
    fr: "Défense de l'État-providence", es: 'Defensa del estado de bienestar', nl: 'Verdediging verzorgingsstaat',
    ar: 'الدفاع عن دولة الرفاه', he: 'הגנה על מדינת הרווחה', ja: '福祉国家の擁護', ko: '복지국가 방어', zh: '福利国家防御',
  },
  'fiscal-responsibility': {
    en: 'Fiscal Responsibility', sv: 'Finanspolitiskt ansvar', da: 'Finansielt ansvar',
    no: 'Finanspolitisk ansvarlighet', fi: 'Finanssivastuu', de: 'Haushaltsdisziplin',
    fr: 'Responsabilité budgétaire', es: 'Responsabilidad fiscal', nl: 'Begrotingsverantwoordelijkheid',
    ar: 'المسؤولية المالية', he: 'אחריות פיסקלית', ja: '財政責任', ko: '재정 책임', zh: '财政责任',
  },
  'green-transition': {
    en: 'Green Transition', sv: 'Grön omställning', da: 'Grøn omstilling',
    no: 'Grønn omstilling', fi: 'Vihreä siirtymä', de: 'Grüne Wende',
    fr: 'Transition verte', es: 'Transición verde', nl: 'Groene transitie',
    ar: 'التحول الأخضر', he: 'מעבר ירוק', ja: 'グリーン・トランジション', ko: '녹색 전환', zh: '绿色转型',
  },
  'national-security': {
    en: 'National Security', sv: 'Nationell säkerhet', da: 'National sikkerhed',
    no: 'Nasjonal sikkerhet', fi: 'Kansallinen turvallisuus', de: 'Nationale Sicherheit',
    fr: 'Sécurité nationale', es: 'Seguridad nacional', nl: 'Nationale veiligheid',
    ar: 'الأمن القومي', he: 'ביטחון לאומי', ja: '国家安全保障', ko: '국가 안보', zh: '国家安全',
  },
  'integration-challenge': {
    en: 'Integration Challenge', sv: 'Integrationsfrågor', da: 'Integrationsproblematik',
    no: 'Integreringsutfordringer', fi: 'Kotouttamishaasteet', de: 'Integrationsfragen',
    fr: "Défis d'intégration", es: 'Desafíos de integración', nl: 'Integratievraagstukken',
    ar: 'تحديات الاندماج', he: 'אתגרי השילוב', ja: '統合の課題', ko: '통합 과제', zh: '融合挑战',
  },
  'eu-sovereignty': {
    en: 'EU & Sovereignty', sv: 'EU & suveränitet', da: 'EU & suverænitet',
    no: 'EU & suverenitet', fi: 'EU & suvereniteetti', de: 'EU & Souveränität',
    fr: "UE & souveraineté", es: 'UE & soberanía', nl: 'EU & soevereiniteit',
    ar: 'الاتحاد الأوروبي والسيادة', he: 'האיחוד האירופי וריבונות', ja: 'EU・主権', ko: 'EU 및 주권', zh: 'EU与主权',
  },
  'workers-rights': {
    en: "Workers' Rights", sv: 'Arbetstagarrättigheter', da: 'Arbejdstagerrettigheder',
    no: 'Arbeidstakerrettigheter', fi: 'Työntekijöiden oikeudet', de: 'Arbeitnehmerrechte',
    fr: 'Droits des travailleurs', es: 'Derechos laborales', nl: 'Werknemersrechten',
    ar: 'حقوق العمال', he: 'זכויות עובדים', ja: '労働者の権利', ko: '노동자 권리', zh: '工人权利',
  },
};

/** Look up the localized display string for a NarrativeFrame ID */
function localizeNarrativeFrame(frameId: string, lang: Language | string): string {
  const table = NARRATIVE_FRAME_LABELS[frameId];
  if (!table) return frameId;
  return (table as Record<string, string>)[lang] ?? table.en ?? frameId;
}

// Localised text enrichment labels
const ENRICHMENT_LABELS: Partial<Record<Language | string, string>> = {
  en: 'Full document text enrichment', sv: 'Fullständig dokumenttextberikning',
  da: 'Fuld dokumenttekstberigelse', no: 'Full dokumenttekstberikelse',
  fi: 'Täysi asiakirjatekstin rikastus', de: 'Volltext-Dokumentenanreicherung',
  fr: 'Enrichissement du texte complet', es: 'Enriquecimiento de texto completo',
  nl: 'Volledige documenttekstverrijking', ar: 'إثراء النص الكامل للمستند',
  he: 'העשרת טקסט מסמך מלא', ja: 'ドキュメント全文エンリッチメント', ko: '전체 문서 텍스트 보강', zh: '完整文档文本丰富',
};

const SUMMARY_TEMPLATES: Partial<Record<Language, string>> = {
  en: 'Analysis of {count} parliamentary documents reveals {domains} as the central policy domains. '
    + 'The legislative pipeline spans {docTypes} document types, with {committees} committees involved. '
    + '{euNote}',
  sv: 'Analys av {count} parlamentariska dokument visar {domains} som centrala politikområden. '
    + 'Lagstiftningsprocessen omfattar {docTypes} dokumenttyper med {committees} utskott involverade. '
    + '{euNote}',
  da: 'Analyse af {count} parlamentariske dokumenter afslører {domains} som de centrale politikområder. '
    + 'Den lovgivningsmæssige pipeline omfatter {docTypes} dokumenttyper med {committees} udvalg involveret. '
    + '{euNote}',
  no: 'Analyse av {count} parlamentariske dokumenter avdekker {domains} som de sentrale politikkområdene. '
    + 'Lovgivningsprosessen spenner over {docTypes} dokumenttyper med {committees} komiteer involvert. '
    + '{euNote}',
  fi: '{count} parlamentaarisen asiakirjan analyysi paljastaa {domains} keskeisiksi politiikka-alueiksi. '
    + 'Lainsäädäntöprosessi kattaa {docTypes} asiakirjatyyppiä, joissa on mukana {committees} valiokuntaa. '
    + '{euNote}',
  de: 'Die Analyse von {count} parlamentarischen Dokumenten zeigt {domains} als zentrale Politikbereiche. '
    + 'Der Gesetzgebungsprozess umfasst {docTypes} Dokumenttypen mit {committees} beteiligten Ausschüssen. '
    + '{euNote}',
  fr: "L'analyse de {count} documents parlementaires révèle {domains} comme domaines politiques centraux. "
    + 'Le pipeline législatif couvre {docTypes} types de documents avec {committees} commissions impliquées. '
    + '{euNote}',
  es: 'El análisis de {count} documentos parlamentarios revela {domains} como los dominios políticos centrales. '
    + 'El proceso legislativo abarca {docTypes} tipos de documentos con {committees} comisiones involucradas. '
    + '{euNote}',
  nl: 'Analyse van {count} parlementaire documenten onthult {domains} als de centrale beleidsdomeinen. '
    + 'Het wetgevingsproces omvat {docTypes} documenttypen met {committees} commissies betrokken. '
    + '{euNote}',
  ar: 'يكشف تحليل {count} وثيقة برلمانية عن {domains} كمجالات سياسية مركزية. '
    + 'يمتد المسار التشريعي عبر {docTypes} أنواع من الوثائق مع مشاركة {committees} لجان. '
    + '{euNote}',
  he: 'ניתוח של {count} מסמכים פרלמנטריים חושף את {domains} כתחומי המדיניות המרכזיים. '
    + 'תהליך החקיקה משתרע על פני {docTypes} סוגי מסמכים עם מעורבות של {committees} ועדות. '
    + '{euNote}',
  ja: '{count}件の議会文書の分析により、{domains}が中心的な政策分野として明らかになりました。'
    + '立法プロセスは{docTypes}種類の文書にわたり、{committees}の委員会が関与しています。'
    + '{euNote}',
  ko: '{count}개 의회 문서 분석 결과 {domains}이(가) 핵심 정책 분야로 나타났습니다. '
    + '입법 파이프라인은 {docTypes}개 문서 유형에 걸쳐 있으며 {committees}개 위원회가 관련되어 있습니다. '
    + '{euNote}',
  zh: '对{count}份议会文件的分析表明，{domains}是核心政策领域。'
    + '立法流程涵盖{docTypes}种文件类型，涉及{committees}个委员会。'
    + '{euNote}',
};

const EU_NOTES: Partial<Record<Language, string>> = {
  en: 'EU obligations and directives form an important external driver.',
  sv: 'EU-skyldigheter och direktiv utgör en viktig extern drivkraft.',
  da: 'EU-forpligtelser og direktiver udgør en vigtig ekstern drivkraft.',
  no: 'EU-forpliktelser og direktiver utgjør en viktig ekstern drivkraft.',
  fi: 'EU-velvoitteet ja direktiivit muodostavat tärkeän ulkoisen tekijän.',
  de: 'EU-Verpflichtungen und Richtlinien bilden einen wichtigen externen Treiber.',
  fr: 'Les obligations et directives de l\'UE constituent un facteur externe important.',
  es: 'Las obligaciones y directivas de la UE constituyen un importante impulsor externo.',
  nl: 'EU-verplichtingen en richtlijnen vormen een belangrijke externe drijfveer.',
  ar: 'تشكل التزامات وتوجيهات الاتحاد الأوروبي محركًا خارجيًا مهمًا.',
  he: 'חובות והנחיות האיחוד האירופי מהוות גורם חיצוני חשוב.',
  ja: 'EUの義務と指令は重要な外的要因を形成しています。',
  ko: 'EU 의무 및 지침은 중요한 외부 동인을 형성합니다.',
  zh: '欧盟义务和指令构成了重要的外部驱动因素。',
};

// Localised empty-docs fallback labels
const EMPTY_DOCS_LABELS = {
  conceptualMapFor: {
    en: 'Conceptual map for: {topic}', sv: 'Konceptkarta för: {topic}', da: 'Konceptkort for: {topic}',
    no: 'Konseptkart for: {topic}', fi: 'Käsitekartta: {topic}', de: 'Konzeptkarte für: {topic}',
    fr: 'Carte conceptuelle pour : {topic}', es: 'Mapa conceptual para: {topic}', nl: 'Conceptkaart voor: {topic}',
    ar: 'خريطة مفاهيم لـ: {topic}', he: 'מפת מושגים עבור: {topic}', ja: 'コンセプトマップ: {topic}', ko: '개념 지도: {topic}', zh: '概念图: {topic}',
  } as Partial<Record<Language, string>>,
  noDocuments: {
    en: 'No parliamentary documents available for analysis.',
    sv: 'Inga parlamentariska dokument tillgängliga för analys.',
    da: 'Ingen parlamentariske dokumenter tilgængelige til analyse.',
    no: 'Ingen parlamentariske dokumenter tilgjengelige for analyse.',
    fi: 'Ei analysoitavia parlamentaarisia asiakirjoja saatavilla.',
    de: 'Keine parlamentarischen Dokumente für die Analyse verfügbar.',
    fr: "Aucun document parlementaire disponible pour l'analyse.",
    es: 'No hay documentos parlamentarios disponibles para el análisis.',
    nl: 'Geen parlementaire documenten beschikbaar voor analyse.',
    ar: 'لا توجد وثائق برلمانية متاحة للتحليل.',
    he: 'אין מסמכים פרלמנטריים זמינים לניתוח.',
    ja: '分析可能な議会文書がありません。',
    ko: '분석할 수 있는 의회 문서가 없습니다.',
    zh: '没有可供分析的议会文件。',
  } as Partial<Record<Language, string>>,
  noDocumentsItem: {
    en: 'No documents available', sv: 'Inga dokument tillgängliga', da: 'Ingen dokumenter tilgængelige',
    no: 'Ingen dokumenter tilgjengelige', fi: 'Ei asiakirjoja saatavilla', de: 'Keine Dokumente verfügbar',
    fr: 'Aucun document disponible', es: 'No hay documentos disponibles', nl: 'Geen documenten beschikbaar',
    ar: 'لا توجد وثائق متاحة', he: 'אין מסמכים זמינים', ja: '利用可能な文書がありません', ko: '사용 가능한 문서 없음', zh: '没有可用文件',
  } as Partial<Record<Language, string>>,
};

// Localised fallback for domain list in summary when no domains detected
const MULTIPLE_POLICY_AREAS: Partial<Record<Language, string>> = {
  en: 'multiple policy areas', sv: 'flera politikområden', da: 'flere politikområder',
  no: 'flere politikkområder', fi: 'useita politiikka-alueita', de: 'mehrere Politikbereiche',
  fr: 'plusieurs domaines politiques', es: 'múltiples áreas de política', nl: 'meerdere beleidsdomeinen',
  ar: 'مجالات سياسية متعددة', he: 'תחומי מדיניות מרובים', ja: '複数の政策分野', ko: '다수의 정책 분야', zh: '多个政策领域',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Extract plain text title from a document */
function titleOf(d: RawDocument): string {
  return (d.titel || d.title || d.dokumentnamn || d.dok_id || '').slice(0, 80);
}

/** Collect unique committee/organ codes from the document set */
function extractOrgans(docs: RawDocument[]): string[] {
  const organs = new Set<string>();
  docs.forEach(d => { if (d.organ || d.committee) organs.add((d.organ || d.committee)!); });
  return [...organs].filter(Boolean);
}

/** Derive riksmöte (parliamentary session) string from a date string.
 *  Parses year/month directly from the `YYYY-MM-DD` string to avoid
 *  timezone-sensitive `new Date()` parsing that can shift the month at
 *  midnight UTC (e.g. "2025-09-01" → Aug 31 in UTC-1 runtimes).
 *  Falls back to `getCurrentRiksmote(new Date())` if the string is
 *  not a valid ISO date.
 */
function datumToRiksmote(datum: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(datum);
  if (!m) return getCurrentRiksmote(new Date()); // invalid format: fall back to current session
  const year = Number(m[1]);
  const month = Number(m[2]) - 1; // 0-based (Jan=0, Sep=8)
  const startYear = month >= 8 ? year : year - 1;
  const endYY = String(startYear + 1).slice(-2);
  return `${startYear}/${endYY}`;
}

/** Detect whether a single document has EU connection signals */
function hasEuSignals(doc: RawDocument): boolean {
  const t = (doc.titel || doc.title || '').toLowerCase();
  return /\beu\b/.test(t) || t.includes('europa') || t.includes('direktiv') ||
    (doc.doktyp || doc.documentType) === 'fpm';
}

/** Detect whether any document has EU connection signals */
function hasEuConnection(docs: RawDocument[]): boolean {
  return docs.some(hasEuSignals);
}

/** Detect whether a document is an SFS (law) document.
 *  Matches the codebase convention: doktyp/documentType === 'sfs' OR dokumentnamn starts with 'SFS'.
 *  Dual detection is needed because some SFS documents arrive without a doktyp field but
 *  carry an 'SFS'-prefixed dokumentnamn (e.g. "SFS 2025:123").
 */
function isSfsDoc(d: RawDocument): boolean {
  return (d.doktyp || d.documentType) === 'sfs' ||
    (d.dokumentnamn || '').startsWith('SFS');
}

/** Classify documents by broad legislative role */
function classifyDocs(docs: RawDocument[]) {
  return {
    propositions: docs.filter(d => (d.doktyp || d.documentType) === 'prop'),
    committeeReports: docs.filter(d => (d.doktyp || d.documentType) === 'bet'),
    motions: docs.filter(d => (d.doktyp || d.documentType) === 'mot'),
    laws: docs.filter(d => isSfsDoc(d)),
    euPositions: docs.filter(d => (d.doktyp || d.documentType) === 'fpm'),
    pressReleases: docs.filter(d => (d.doktyp || d.documentType) === 'pressm'),
    other: docs.filter(d =>
      !['prop','bet','mot','sfs','fpm','pressm'].includes((d.doktyp || d.documentType) || '') &&
      !isSfsDoc(d)),
  };
}

// ---------------------------------------------------------------------------
// Pass 1 — Content decomposition
// ---------------------------------------------------------------------------

function pass1ContentDecomposition(
  docs: RawDocument[],
  classified: ReturnType<typeof classifyDocs>,
  lang: Language | string,
): MindmapBranch[] {
  const branches: MindmapBranch[] = [];

  // Legislative pipeline branch
  const pipelineDocs = [...classified.propositions, ...classified.committeeReports, ...classified.laws];
  if (pipelineDocs.length > 0) {
    const subBranches: MindmapBranch[] = [];

    if (classified.propositions.length > 0) {
      subBranches.push({
        label: classified.propositions.length > 1
          ? `${localizeDocType('prop', lang, classified.propositions.length)} (${classified.propositions.length})`
          : localizeDocType('prop', lang, 1),
        color: 'orange',
        items: classified.propositions.slice(0, 4).map(d => titleOf(d)).filter(Boolean),
      });
    }
    if (classified.committeeReports.length > 0) {
      subBranches.push({
        label: classified.committeeReports.length > 1
          ? `${localizeDocType('bet', lang, classified.committeeReports.length)} (${classified.committeeReports.length})`
          : localizeDocType('bet', lang, 1),
        color: 'blue',
        items: classified.committeeReports.slice(0, 4).map(d => titleOf(d)).filter(Boolean),
      });
    }
    if (classified.laws.length > 0) {
      subBranches.push({
        label: `${localizeDocType('sfs', lang, classified.laws.length)} (${classified.laws.length})`,
        color: 'green',
        items: classified.laws.slice(0, 3).map(d => titleOf(d)).filter(Boolean),
      });
    }

    branches.push({
      label: L(LABELS.legislativePipeline, lang, 'Legislative Pipeline'),
      color: 'orange',
      icon: '⚖️',
      importance: 'critical',
      items: pipelineDocs.slice(0, 3).map(d => titleOf(d)).filter(Boolean),
      subBranches: subBranches.length > 0 ? subBranches : undefined,
    });
  }

  // Policy domains from content analysis
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 6);
  if (domainList.length > 0) {
    branches.push({
      label: L(LABELS.policyDomains, lang, 'Policy Domains'),
      color: 'green',
      icon: '🏛️',
      importance: 'high',
      items: domainList,
    });
  }

  // Narrative frames as policy impact signals
  const allFrames = new Set<string>();
  docs.forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));
  const frameList = [...allFrames];
  if (frameList.length > 0) {
    branches.push({
      label: L(LABELS.policyImpactChains, lang, 'Policy Impact Chains'),
      color: 'yellow',
      icon: '🔗',
      importance: 'high',
      items: frameList.slice(0, 5).map(f => localizeNarrativeFrame(f, lang)),
    });
  }

  return branches;
}

// ---------------------------------------------------------------------------
// Pass 2 — Relationship discovery
// ---------------------------------------------------------------------------

function pass2RelationshipDiscovery(
  docs: RawDocument[],
  classified: ReturnType<typeof classifyDocs>,
  lang: Language | string,
): { branches: MindmapBranch[]; connections: BranchConnection[] } {
  const branches: MindmapBranch[] = [];
  const connections: BranchConnection[] = [];

  const organs = extractOrgans(docs);
  const hasPipelineBranch = classified.propositions.length + classified.committeeReports.length + classified.laws.length > 0;

  // Cross-committee dependencies
  if (organs.length > 1) {
    branches.push({
      label: L(LABELS.crossCommitteeDeps, lang, 'Cross-Committee Dependencies'),
      color: 'purple',
      icon: '🔄',
      importance: organs.length >= 3 ? 'high' : 'medium',
      items: organs.slice(0, 6),
    });
    // Mark dependency from legislative pipeline to cross-committee — only when pipeline branch exists
    if (hasPipelineBranch) {
      connections.push({
        from: L(LABELS.legislativePipeline, lang, 'Legislative Pipeline'),
        to: L(LABELS.crossCommitteeDeps, lang, 'Cross-Committee Dependencies'),
        type: 'dependency',
        label: L(CONNECTION_LABELS.committeesInvolved, lang, '{n} committees involved').replace('{n}', String(organs.length)),
      });
    }
  }

  // Stakeholder network — built from document actors (names, authors, political parties)
  const actorSet = new Set<string>();
  docs.forEach(d => {
    if (d.intressent_namn) actorSet.add(d.intressent_namn);
    if (d.author) actorSet.add(d.author);
    if (d.parti) actorSet.add(d.parti);
  });
  const actors = [...actorSet].slice(0, 4);

  const stakeholderItems: string[] = [...actors];
  if (classified.propositions.length > 0) {
    stakeholderItems.push(`${L(STAKEHOLDER_LABELS.government, lang, 'Government')} (${classified.propositions.length} ${localizeDocType('prop', lang, classified.propositions.length)})`);
  }
  if (classified.motions.length > 0) {
    stakeholderItems.push(`${L(STAKEHOLDER_LABELS.opposition, lang, 'Opposition')} (${classified.motions.length} ${localizeDocType('mot', lang, classified.motions.length)})`);
  }
  if (classified.pressReleases.length > 0) {
    stakeholderItems.push(`${L(STAKEHOLDER_LABELS.civilSociety, lang, 'Civil Society')} (${classified.pressReleases.length} ${localizeDocType('pressm', lang, classified.pressReleases.length)})`);
  }

  if (stakeholderItems.length > 0) {
    branches.push({
      label: L(LABELS.stakeholderNetwork, lang, 'Stakeholder Network'),
      color: 'cyan',
      icon: '👥',
      importance: 'high',
      items: stakeholderItems.slice(0, 6),
    });
  }

  // Risks & blockers — opposition motions as conflict signals
  if (classified.motions.length > 0) {
    const riskItems = classified.motions.slice(0, 4).map(d => titleOf(d)).filter(Boolean);
    branches.push({
      label: L(LABELS.riskBlockers, lang, 'Risks & Blockers'),
      color: 'magenta',
      icon: '⚠️',
      importance: classified.motions.length >= 3 ? 'critical' : 'high',
      items: riskItems,
    });
    // Opposition motions conflict with government propositions
    if (classified.propositions.length > 0) {
      connections.push({
        from: L(LABELS.stakeholderNetwork, lang, 'Stakeholder Network'),
        to: L(LABELS.riskBlockers, lang, 'Risks & Blockers'),
        type: 'conflict',
        label: L(CONNECTION_LABELS.oppositionMotions, lang, '{n} opposition motions').replace('{n}', String(classified.motions.length)),
      });
    }
  }

  // EU / international context — use set deduplication by dok_id
  const euDocMap = new Map<string, RawDocument>();
  classified.euPositions.forEach(d => euDocMap.set(d.dok_id ?? titleOf(d), d));
  docs.filter(hasEuSignals).forEach(d => euDocMap.set(d.dok_id ?? titleOf(d), d));
  const uniqueEuDocs = [...euDocMap.values()];
  if (uniqueEuDocs.length > 0) {
    branches.push({
      label: L(LABELS.euInternationalContext, lang, 'EU & International Context'),
      color: 'blue',
      icon: '🇪🇺',
      importance: 'high',
      items: uniqueEuDocs.slice(0, 4).map(d => titleOf(d)).filter(Boolean),
    });
    // Only emit pipeline → EU connection when the pipeline branch actually exists
    if (hasPipelineBranch) {
      connections.push({
        from: L(LABELS.legislativePipeline, lang, 'Legislative Pipeline'),
        to: L(LABELS.euInternationalContext, lang, 'EU & International Context'),
        type: 'alignment',
        label: L(CONNECTION_LABELS.euTransposition, lang, 'EU transposition obligations'),
      });
    }
  }

  return { branches, connections };
}

// ---------------------------------------------------------------------------
// Pass 3 — Validation & completeness
// ---------------------------------------------------------------------------

function pass3ValidationAndCompleteness(
  docs: RawDocument[],
  existing: MindmapBranch[],
  lang: Language | string,
): MindmapBranch[] {
  const branches = [...existing];

  // Ensure data context branch always present
  const hasDataBranch = branches.some(b => b.icon === '📊');
  if (!hasDataBranch) {
    const localisedSources = DATA_SOURCE_ITEMS[lang] ?? DATA_SOURCE_ITEMS.en!;
    const sourceItems: string[] = [];
    if (docs.some(d => d.dok_id)) sourceItems.push(localisedSources[0]);
    if (docs.some(d => d.fullText || d.fullContent)) sourceItems.push(ENRICHMENT_LABELS[lang] ?? ENRICHMENT_LABELS.en!);
    sourceItems.push(localisedSources[1], localisedSources[2]);

    branches.push({
      label: L(LABELS.dataContext, lang, 'Data & Evidence Sources'),
      color: 'purple',
      icon: '📊',
      importance: 'medium',
      items: sourceItems.slice(0, 4),
    });
  }

  // Legislative timeline — add dates from documents (oldest-first, stable on ties)
  const datedDocs = docs.filter(d => d.datum).sort((a, b) => a.datum!.localeCompare(b.datum!));
  if (datedDocs.length >= 2) {
    const timelineItems = datedDocs.slice(0, 5)
      .filter(d => titleOf(d))
      .map(d => `${d.datum} — ${titleOf(d)}`);
    branches.push({
      label: L(LABELS.legislativeTimeline, lang, 'Legislative Timeline'),
      color: 'yellow',
      icon: '📅',
      importance: 'medium',
      items: timelineItems,
    });
  }

  // Guarantee minimum 5 branches for analytical richness — use varied fallback labels
  // Derive session identifier from document metadata (rm or datum) for reproducibility
  const datumDoc = docs.find(d => d.datum);
  const sessionLabel = docs.find(d => d.rm)?.rm ?? (datumDoc ? datumToRiksmote(datumDoc.datum!) : '');

  const FALLBACK_LABELS = {
    documentsAnalysed: {
      en: '{n} parliamentary documents analysed', sv: '{n} parlamentariska dokument analyserade',
      da: '{n} parlamentariske dokumenter analyseret', no: '{n} parlamentariske dokumenter analysert',
      fi: '{n} parlamentaarista asiakirjaa analysoitu', de: '{n} parlamentarische Dokumente analysiert',
      fr: '{n} documents parlementaires analysés', es: '{n} documentos parlamentarios analizados',
      nl: '{n} parlementaire documenten geanalyseerd', ar: 'تم تحليل {n} وثيقة برلمانية',
      he: '{n} מסמכים פרלמנטריים נותחו', ja: '{n}件の議会文書を分析', ko: '{n}개 의회 문서 분석', zh: '分析了{n}份议会文件',
    } as Partial<Record<Language | string, string>>,
    euItems: {
      en: ['European Union', 'International obligations'], sv: ['Europeiska unionen', 'Internationella skyldigheter'],
      da: ['Den Europæiske Union', 'Internationale forpligtelser'], no: ['EU', 'Internasjonale forpliktelser'],
      fi: ['Euroopan unioni', 'Kansainväliset velvoitteet'], de: ['Europäische Union', 'Internationale Verpflichtungen'],
      fr: ['Union européenne', 'Obligations internationales'], es: ['Unión Europea', 'Obligaciones internacionales'],
      nl: ['Europese Unie', 'Internationale verplichtingen'], ar: ['الاتحاد الأوروبي', 'الالتزامات الدولية'],
      he: ['האיחוד האירופי', 'חובות בינלאומיות'], ja: ['欧州連合', '国際義務'], ko: ['유럽연합', '국제적 의무'], zh: ['欧盟', '国际义务'],
    } as Partial<Record<Language | string, string[]>>,
    riskItems: {
      en: ['Legislative gaps', 'Implementation challenges'], sv: ['Lagstiftningsluckor', 'Implementeringsutmaningar'],
      da: ['Lovgivningsmangler', 'Implementeringsudfordringer'], no: ['Lovgivningsmangler', 'Implementeringsutfordringer'],
      fi: ['Lainsäädäntöpuutteet', 'Toteutushaasteet'], de: ['Gesetzeslücken', 'Umsetzungsprobleme'],
      fr: ['Lacunes législatives', 'Défis de mise en œuvre'], es: ['Lagunas legislativas', 'Desafíos de implementación'],
      nl: ['Lacunes in wetgeving', 'Implementatie-uitdagingen'], ar: ['ثغرات تشريعية', 'تحديات التنفيذ'],
      he: ['פערים בחקיקה', 'אתגרי יישום'], ja: ['立法の欠陥', '実施上の課題'], ko: ['입법 공백', '시행 과제'], zh: ['立法缺陷', '实施挑战'],
    } as Partial<Record<Language | string, string[]>>,
  };

  const fallbackBranches: Pick<MindmapBranch, 'label' | 'color' | 'icon' | 'importance' | 'items'>[] = [
    { label: L(LABELS.policyDomains, lang, 'Policy Domains'), color: 'green', icon: '📋', importance: 'low',
      items: [L(FALLBACK_LABELS.documentsAnalysed, lang, '{n} parliamentary documents analysed').replace('{n}', String(docs.length))] },
    { label: L(LABELS.stakeholderNetwork, lang, 'Stakeholder Network'), color: 'cyan', icon: '👥', importance: 'low',
      items: [L(STAKEHOLDER_LABELS.government, lang, 'Government'), L(STAKEHOLDER_LABELS.parliament, lang, 'Parliament'), L(STAKEHOLDER_LABELS.civilSociety, lang, 'Civil Society')] },
    { label: L(LABELS.legislativeTimeline, lang, 'Legislative Timeline'), color: 'yellow', icon: '📅', importance: 'low',
      items: sessionLabel ? [sessionLabel] : [] },
    { label: L(LABELS.euInternationalContext, lang, 'EU & International Context'), color: 'blue', icon: '🌐', importance: 'low',
      items: FALLBACK_LABELS.euItems[lang] ?? FALLBACK_LABELS.euItems.en! },
    { label: L(LABELS.riskBlockers, lang, 'Risks & Blockers'), color: 'magenta', icon: '⚠️', importance: 'low',
      items: FALLBACK_LABELS.riskItems[lang] ?? FALLBACK_LABELS.riskItems.en! },
  ];
  let fallbackIdx = 0;
  while (branches.length < 5) {
    const fb = fallbackBranches[fallbackIdx % fallbackBranches.length];
    fallbackIdx++;
    // Skip if a branch with this label already exists
    if (!branches.some(b => b.label === fb.label)) {
      branches.push({ ...fb });
    } else if (fallbackIdx > fallbackBranches.length * 2) {
      // Safety: avoid infinite loop
      break;
    }
  }

  return branches;
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function generateSummary(
  docs: RawDocument[],
  lang: Language | string,
): string {
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 3);

  const organs = extractOrgans(docs);
  // Normalize doc types: map isSfsDoc() documents to 'sfs' so SFS detected via
  // dokumentnamn.startsWith('SFS') (without doktyp) are counted consistently.
  const docTypeCount = new Set(docs.map(d => isSfsDoc(d) ? 'sfs' : (d.doktyp || d.documentType)).filter(Boolean)).size;
  const euNote = hasEuConnection(docs) ? (L(EU_NOTES, lang, 'EU obligations form an important external driver.')) : '';

  const template = L(SUMMARY_TEMPLATES, lang,
    'Analysis of {count} parliamentary documents reveals {domains} as central policy domains. '
    + 'The legislative pipeline spans {docTypes} document types with {committees} committees involved. {euNote}');

  return template
    .replace('{count}', String(docs.length))
    .replace('{domains}', domainList.length > 0 ? domainList.join(', ') : L(MULTIPLE_POLICY_AREAS, lang, 'multiple policy areas'))
    .replace('{docTypes}', String(docTypeCount))
    .replace('{committees}', String(organs.length))
    .replace('{euNote}', euNote)
    .trimEnd();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build AI-enriched mindmap branches from a document collection.
 *
 * Runs three analysis passes:
 * 1. Content decomposition — legislative pipeline, policy domains, narrative frames
 * 2. Relationship discovery — cross-committee deps, stakeholder network, EU context, risks
 * 3. Validation — completeness, data context, legislative timeline, minimum branch count
 *
 * @param docs    Documents to analyse
 * @param topic   Optional focus topic string for context
 * @param lang    Output language for branch labels and summary
 * @returns       Branches, connections, and AI-generated summary ready for generateMindmapSection
 */
export function buildAIMindmapBranches(
  docs: RawDocument[],
  topic: string | null,
  lang: Language | string,
): MindmapAnalysisResult {
  if (docs.length === 0) {
    return {
      branches: [{
        label: L(LABELS.policyDomains, lang, 'Policy Domains'),
        color: 'cyan',
        icon: '📋',
        importance: 'low',
        items: [topic || L(EMPTY_DOCS_LABELS.noDocumentsItem, lang, 'No documents available')],
      }],
      connections: [],
      summary: topic
        ? L(EMPTY_DOCS_LABELS.conceptualMapFor, lang, 'Conceptual map for: {topic}').replace('{topic}', topic)
        : L(EMPTY_DOCS_LABELS.noDocuments, lang, 'No parliamentary documents available for analysis.'),
    };
  }

  const classified = classifyDocs(docs);

  // Pass 1 — content decomposition
  const pass1Branches = pass1ContentDecomposition(docs, classified, lang);

  // Pass 2 — relationship discovery
  const { branches: pass2Branches, connections } = pass2RelationshipDiscovery(docs, classified, lang);

  // Merge pass 1 + pass 2 (deduplicate by label)
  const merged: MindmapBranch[] = [...pass1Branches];
  for (const b of pass2Branches) {
    if (!merged.some(m => m.label === b.label)) {
      merged.push(b);
    }
  }

  // Pass 3 — validation and completeness
  const finalBranches = pass3ValidationAndCompleteness(docs, merged, lang);

  // Generate cohesive analytical summary
  const summary = generateSummary(docs, lang);

  return { branches: finalBranches, connections, summary };
}
