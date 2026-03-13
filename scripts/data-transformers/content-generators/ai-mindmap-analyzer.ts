/**
 * @module data-transformers/content-generators/ai-mindmap-analyzer
 * @description AI-driven conceptual mindmap analyzer for political documents.
 *
 * Analyzes a set of parliamentary documents and produces a structured
 * `AIMindmapAnalysis` that maps political relationships across five dimensions:
 *
 * 1. **Power Dynamics** — who holds influence and who is affected
 * 2. **Policy Impact** — what changes and for whom
 * 3. **Timeline & Urgency** — when effects materialize
 * 4. **Geographic / Institutional Scope** — where this applies
 * 5. **Motivations & Rationale** — why this matters
 *
 * Each dimension branch includes:
 * - AI-weighted items (critical / significant / moderate / minor)
 * - Stakeholder sub-branches (Government, Opposition, Civil Society)
 *
 * Cross-branch connections show relationships between dimensions.
 *
 * The returned `AIMindmapAnalysis` is designed to be passed directly to
 * `generateMindmapSection` via `buildMindmapOptionsFromAnalysis()`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { RawDocument } from '../types.js';
import { detectPolicyDomains } from '../policy-analysis.js';
import type {
  MindmapBranch,
  MindmapBranchColor,
  MindmapConnection,
  AIMindmapItem,
  SubBranch,
  MindmapSectionOptions,
} from './mindmap-section.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Complete AI-driven mindmap analysis output */
export interface AIMindmapAnalysis {
  /** AI-synthesized thesis statement for the central node */
  centralThesis: string;
  /** Five political dimension branches */
  branches: MindmapBranch[];
  /** Cross-branch connection indicators */
  connections: MindmapConnection[];
  /** Confidence score in [0, 1] based on data richness */
  confidenceScore: number;
}

// ---------------------------------------------------------------------------
// Localised labels (14 languages)
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<string, Partial<Record<Language, string>>> = {
  power: {
    en: 'Power Dynamics', sv: 'Maktdynamik', da: 'Magtdynamik', no: 'Maktdynamikk',
    fi: 'Valtadynamiikka', de: 'Machtdynamik', fr: 'Dynamiques de pouvoir', es: 'Dinámicas de poder',
    nl: 'Machtsdynamiek', ar: 'ديناميكيات القوة', he: 'דינמיקת כוח', ja: '権力力学', ko: '권력 역학', zh: '权力动态',
  },
  impact: {
    en: 'Policy Impact', sv: 'Politisk påverkan', da: 'Politisk påvirkning', no: 'Politisk innvirkning',
    fi: 'Politiikan vaikutus', de: 'Politische Auswirkungen', fr: 'Impact politique', es: 'Impacto político',
    nl: 'Beleidsimpact', ar: 'الأثر السياسي', he: 'השפעת מדיניות', ja: '政策影響', ko: '정책 영향', zh: '政策影响',
  },
  timeline: {
    en: 'Timeline & Urgency', sv: 'Tidslinje & Angelägenhet', da: 'Tidslinje & Hastighed', no: 'Tidslinje & Hastighet',
    fi: 'Aikajana & Kiireellisyys', de: 'Zeitplan & Dringlichkeit', fr: 'Calendrier & Urgence', es: 'Cronograma & Urgencia',
    nl: 'Tijdlijn & Urgentie', ar: 'الجدول الزمني والإلحاح', he: 'ציר זמן ודחיפות', ja: 'タイムライン・緊急性', ko: '타임라인 & 긴급성', zh: '时间线与紧迫性',
  },
  scope: {
    en: 'Geographic / Institutional Scope', sv: 'Geografisk / Institutionell räckvidd', da: 'Geografisk / Institutionel rækkevidde',
    no: 'Geografisk / Institusjonell rekkevidde', fi: 'Maantieteellinen / Institutionaalinen laajuus',
    de: 'Geografischer / Institutioneller Geltungsbereich', fr: 'Portée géographique / institutionnelle',
    es: 'Alcance geográfico / institucional', nl: 'Geografisch / Institutioneel bereik',
    ar: 'النطاق الجغرافي / المؤسسي', he: 'היקף גיאוגרפי / מוסדי', ja: '地理的・制度的範囲', ko: '지리적 / 제도적 범위', zh: '地理/制度范围',
  },
  motivation: {
    en: 'Motivations & Rationale', sv: 'Motiveringar & Rationale', da: 'Motivationer & Begrundelse', no: 'Motivasjoner & Begrunnelse',
    fi: 'Motivaatiot & Perustelu', de: 'Motivationen & Begründung', fr: 'Motivations & Justification', es: 'Motivaciones & Justificación',
    nl: 'Motivaties & Rationale', ar: 'الدوافع والمبررات', he: 'מניעים והנמקות', ja: '動機と根拠', ko: '동기 및 근거', zh: '动机与理由',
  },
};

const STAKEHOLDER_LABELS: Record<string, Partial<Record<Language, string>>> = {
  gov: {
    en: 'Government', sv: 'Regering', da: 'Regering', no: 'Regjering', fi: 'Hallitus',
    de: 'Regierung', fr: 'Gouvernement', es: 'Gobierno', nl: 'Regering',
    ar: 'الحكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府',
  },
  opp: {
    en: 'Opposition', sv: 'Opposition', da: 'Opposition', no: 'Opposisjon', fi: 'Oppositio',
    de: 'Opposition', fr: 'Opposition', es: 'Oposición', nl: 'Oppositie',
    ar: 'المعارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派',
  },
  civil: {
    en: 'Civil Society', sv: 'Civilsamhälle', da: 'Civilsamfund', no: 'Sivilsamfunn', fi: 'Kansalaisyhteiskunta',
    de: 'Zivilgesellschaft', fr: 'Société civile', es: 'Sociedad civil', nl: 'Maatschappelijk middenveld',
    ar: 'المجتمع المدني', he: 'החברה האזרחית', ja: '市民社会', ko: '시민 사회', zh: '公民社会',
  },
};

const THESIS_TEMPLATES: Partial<Record<Language, (topic: string, count: number, domains: string) => string>> = {
  en: (t, n, d) => `Parliamentary analysis of ${t} encompasses ${n} document${n !== 1 ? 's' : ''} spanning ${d}, reflecting active legislative engagement across power, impact, and scope dimensions.`,
  sv: (t, n, d) => `Riksdagsanalys av ${t} omfattar ${n} dokument inom ${d}, vilket speglar aktivt lagstiftningsengagemang.`,
  da: (t, n, d) => `Parlamentarisk analyse af ${t} dækker ${n} dokument${n !== 1 ? 'er' : ''} inden for ${d}.`,
  no: (t, n, d) => `Parlamentarisk analyse av ${t} dekker ${n} dokument${n !== 1 ? 'er' : ''} innen ${d}.`,
  fi: (t, n, d) => `Parlamentaarinen analyysi aiheesta ${t} kattaa ${n} asiakirja${n !== 1 ? 'a' : 'n'} alueella ${d}.`,
  de: (t, n, d) => `Parlamentarische Analyse zu ${t} umfasst ${n} Dokument${n !== 1 ? 'e' : ''} in den Bereichen ${d}.`,
  fr: (t, n, d) => `L'analyse parlementaire de ${t} couvre ${n} document${n !== 1 ? 's' : ''} dans les domaines ${d}.`,
  es: (t, n, d) => `El análisis parlamentario de ${t} abarca ${n} documento${n !== 1 ? 's' : ''} en los ámbitos ${d}.`,
  nl: (t, n, d) => `Parlementaire analyse van ${t} omvat ${n} document${n !== 1 ? 'en' : ''} over ${d}.`,
  ar: (t, n, _d) => `التحليل البرلماني لـ${t} يشمل ${n} وثيقة.`,
  he: (t, n, _d) => `הניתוח הפרלמנטרי של ${t} כולל ${n} מסמכים.`,
  ja: (t, n, d) => `${t}に関する議会分析は${d}にわたる${n}件の文書を包含しています。`,
  ko: (t, n, d) => `${t}에 대한 의회 분석은 ${d}에 걸쳐 ${n}개의 문서를 포함합니다.`,
  zh: (t, n, d) => `关于${t}的议会分析涵盖${d}领域的${n}份文件。`,
};

const CONNECTION_LABELS: Record<string, Partial<Record<Language, string>>> = {
  powerImpact: {
    en: 'Power holders shape impact', sv: 'Maktinnehavare formar påverkan', da: 'Magtindehavere former indvirkning',
    no: 'Maktinnehavere former innvirkning', fi: 'Vallanpitäjät muovaavat vaikutusta',
    de: 'Machtinhaber gestalten Wirkung', fr: 'Les détenteurs du pouvoir façonnent l\'impact',
    es: 'Los titulares del poder dan forma al impacto', nl: 'Machthebbers vormen impact',
    ar: 'أصحاب السلطة يشكلون التأثير', he: 'בעלי הכוח מעצבים את ההשפעה', ja: '権力保有者が影響を形成', ko: '권력 보유자가 영향을 형성', zh: '权力持有者塑造影响',
  },
  timelineScope: {
    en: 'Timeline shapes institutional reach', sv: 'Tidslinje formar institutionell räckvidd', da: 'Tidslinje former institutionel rækkevidde',
    no: 'Tidslinje former institusjonell rekkevidde', fi: 'Aikajana muokkaa institutionaalista ulottuvuutta',
    de: 'Zeitplan prägt institutionelle Reichweite', fr: 'Le calendrier façonne la portée institutionnelle',
    es: 'El cronograma da forma al alcance institucional', nl: 'Tijdlijn vormt institutioneel bereik',
    ar: 'الجدول الزمني يشكل النطاق المؤسسي', he: 'ציר הזמן מעצב את ההיקף המוסדי', ja: 'タイムラインが制度的範囲を形成', ko: '타임라인이 제도적 범위를 형성', zh: '时间线塑造制度影响范围',
  },
  impactMotivation: {
    en: 'Policy outcomes drive stakeholder motivation', sv: 'Politiska utfall driver intressentmotivation',
    da: 'Politiske resultater driver interessentmotivation', no: 'Politiske resultater driver interessentmotivasjon',
    fi: 'Politiikan tulokset ohjaavat sidosryhmien motivaatiota', de: 'Politikergebnisse treiben Stakeholder-Motivation an',
    fr: 'Les résultats politiques motivent les parties prenantes', es: 'Los resultados políticos impulsan la motivación',
    nl: 'Beleidsresultaten drijven stakeholdermotivatie aan', ar: 'النتائج السياسية تدفع دوافع أصحاب المصلحة',
    he: 'תוצאות המדיניות מניעות את מוטיבציית בעלי העניין', ja: '政策成果が利害関係者の動機を促進', ko: '정책 결과가 이해관계자 동기 유발', zh: '政策结果推动利益相关者动机',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function l(lang: Language | string, map: Partial<Record<Language, string>>): string {
  return map[lang as Language] ?? map.en ?? '';
}

function getDocTitle(d: RawDocument): string {
  return (d.titel || d.title || d.rubrik || d.dokumentnamn || d.dok_id || '').slice(0, 60);
}

function classify(count: number): AIMindmapItem['weight'] {
  if (count >= 5) return 'critical';
  if (count >= 3) return 'significant';
  if (count >= 1) return 'moderate';
  return 'minor';
}

// ---------------------------------------------------------------------------
// Branch builders
// ---------------------------------------------------------------------------

function buildPowerBranch(
  docs: RawDocument[],
  lang: Language | string,
): MindmapBranch {
  const propDocs  = docs.filter(d => ['prop', 'skr', 'pressm'].includes(d.doktyp || d.documentType || ''));
  const oppDocs   = docs.filter(d => ['bet', 'mot'].includes(d.doktyp || d.documentType || ''));
  const otherDocs = docs.filter(d => !propDocs.includes(d) && !oppDocs.includes(d));

  const aiItems: AIMindmapItem[] = [
    {
      text: `${l(lang, STAKEHOLDER_LABELS.gov)}: ${propDocs.length} ${propDocs.length === 1 ? 'document' : 'documents'}`,
      weight: classify(propDocs.length),
    },
    {
      text: `${l(lang, STAKEHOLDER_LABELS.opp)}: ${oppDocs.length} ${oppDocs.length === 1 ? 'document' : 'documents'}`,
      weight: classify(oppDocs.length),
    },
  ];
  if (otherDocs.length > 0) {
    aiItems.push({ text: `${l(lang, STAKEHOLDER_LABELS.civil)}: ${otherDocs.length} ${otherDocs.length === 1 ? 'document' : 'documents'}`, weight: classify(otherDocs.length) });
  }

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: propDocs.slice(0, 2).map(d => getDocTitle(d)).filter(Boolean),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: oppDocs.slice(0, 2).map(d => getDocTitle(d)).filter(Boolean),
    },
  ].filter(sb => sb.items && sb.items.length > 0);

  return {
    label: l(lang, DIMENSION_LABELS.power),
    color: 'cyan' as MindmapBranchColor,
    icon: '🏛️',
    dimension: 'power',
    aiItems,
    subBranches,
  };
}

function buildImpactBranch(
  domainList: string[],
  lang: Language | string,
): MindmapBranch {
  const aiItems: AIMindmapItem[] = domainList.slice(0, 5).map((domain, i) => ({
    text: domain,
    weight: (i === 0 ? 'critical' : i < 3 ? 'significant' : 'moderate') as AIMindmapItem['weight'],
  }));

  if (aiItems.length === 0) {
    aiItems.push({ text: 'Legislative change', weight: 'moderate' });
  }

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: domainList.slice(0, 2),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: domainList.slice(1, 3),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: domainList.slice(0, 2),
    },
  ].filter(sb => sb.items && sb.items.length > 0);

  return {
    label: l(lang, DIMENSION_LABELS.impact),
    color: 'red' as MindmapBranchColor,
    icon: '⚡',
    dimension: 'impact',
    aiItems,
    subBranches,
  };
}

function buildTimelineBranch(
  docs: RawDocument[],
  lang: Language | string,
): MindmapBranch {
  const recentDocs = docs.filter(d => {
    if (!d.datum) return false;
    const date = new Date(d.datum);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    return date >= cutoff;
  });

  const propDocs = docs.filter(d => ['prop'].includes(d.doktyp || d.documentType || ''));
  const urgencyWeight: AIMindmapItem['weight'] =
    recentDocs.length > 5 ? 'critical' :
    recentDocs.length > 2 ? 'significant' :
    recentDocs.length > 0 ? 'moderate' : 'minor';

  const aiItems: AIMindmapItem[] = [
    { text: `Recent activity: ${recentDocs.length} documents (last 3 months)`, weight: urgencyWeight },
    { text: `Active propositions: ${propDocs.length}`, weight: classify(propDocs.length) },
    { text: `Total legislative pipeline: ${docs.length}`, weight: classify(docs.length) },
  ];

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: ['Implementation planning', 'Resource allocation'],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: ['Amendment window', 'Scrutiny deadlines'],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: ['Compliance timeline', 'Adaptation period'],
    },
  ];

  return {
    label: l(lang, DIMENSION_LABELS.timeline),
    color: 'yellow' as MindmapBranchColor,
    icon: '⏱️',
    dimension: 'timeline',
    aiItems,
    subBranches,
  };
}

function buildScopeBranch(
  intlDocs: RawDocument[],
  docs: RawDocument[],
  lang: Language | string,
): MindmapBranch {
  const committees = [...new Set(docs.map(d => d.organ || d.committee || '').filter(Boolean))].slice(0, 3);
  const hasEU = intlDocs.length > 0;

  const aiItems: AIMindmapItem[] = [
    {
      text: `National scope: ${docs.length} parliamentary documents`,
      weight: classify(docs.length),
    },
  ];
  if (hasEU) {
    aiItems.push({ text: `EU / international: ${intlDocs.length} documents`, weight: classify(intlDocs.length) });
  }
  committees.forEach((c, i) => {
    aiItems.push({ text: `Committee: ${c}`, weight: i === 0 ? 'significant' : 'moderate' });
  });

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: ['National implementation', hasEU ? 'EU transposition' : 'Domestic regulation'].filter(Boolean),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: committees.length > 0 ? committees : ['Parliamentary committees'],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: ['Sector-wide compliance', 'Regional variation'],
    },
  ].filter(sb => sb.items && sb.items.length > 0);

  return {
    label: l(lang, DIMENSION_LABELS.scope),
    color: 'blue' as MindmapBranchColor,
    icon: '🌍',
    dimension: 'scope',
    aiItems,
    subBranches,
  };
}

function buildMotivationBranch(
  docs: RawDocument[],
  topic: string | null,
  domainList: string[],
  lang: Language | string,
): MindmapBranch {
  const topicStr = topic || 'legislative reform';
  const keyTitles = docs.slice(0, 3).map(d => getDocTitle(d)).filter(Boolean);

  const aiItems: AIMindmapItem[] = [
    {
      text: `Policy objective: ${topicStr}`,
      weight: 'critical',
    },
    {
      text: `Addressed areas: ${domainList.slice(0, 2).join(', ') || 'General legislation'}`,
      weight: 'significant',
    },
    ...keyTitles.map(t => ({ text: t, weight: 'moderate' as AIMindmapItem['weight'] })),
  ];

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: [`Advance ${topicStr} agenda`, 'Meet EU / international commitments'],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: [`Scrutinise ${topicStr} implementation`, 'Represent constituent concerns'],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: ['Operational compliance', 'Sector investment planning'],
    },
  ];

  return {
    label: l(lang, DIMENSION_LABELS.motivation),
    color: 'green' as MindmapBranchColor,
    icon: '💡',
    dimension: 'motivation',
    aiItems,
    subBranches,
  };
}

// ---------------------------------------------------------------------------
// Connection builder
// ---------------------------------------------------------------------------

function buildConnections(branches: MindmapBranch[], lang: Language | string): MindmapConnection[] {
  const labelOf = (dim: string): string => {
    const branch = branches.find(b => b.dimension === dim);
    return branch?.label ?? dim;
  };

  return [
    {
      fromBranch: labelOf('power'),
      toBranch:   labelOf('impact'),
      relationship: l(lang, CONNECTION_LABELS.powerImpact),
    },
    {
      fromBranch: labelOf('timeline'),
      toBranch:   labelOf('scope'),
      relationship: l(lang, CONNECTION_LABELS.timelineScope),
    },
    {
      fromBranch: labelOf('impact'),
      toBranch:   labelOf('motivation'),
      relationship: l(lang, CONNECTION_LABELS.impactMotivation),
    },
  ].filter(c => c.fromBranch && c.toBranch);
}

// ---------------------------------------------------------------------------
// Central thesis builder
// ---------------------------------------------------------------------------

function buildCentralThesis(
  docs: RawDocument[],
  topic: string | null,
  domainList: string[],
  lang: Language | string,
): string {
  const count = docs.length;
  const topicStr = topic || 'parliamentary activity';
  const domainsStr = domainList.slice(0, 3).join(', ') || 'policy';

  const templateFn = THESIS_TEMPLATES[lang as Language] ?? THESIS_TEMPLATES.en!;
  return templateFn(topicStr, count, domainsStr);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build an AI-driven mindmap analysis from a set of parliamentary documents.
 *
 * Produces a structured `AIMindmapAnalysis` with five political dimension
 * branches, stakeholder sub-branches, AI-weighted items, cross-branch
 * connections, and a synthesized central thesis statement.
 *
 * @example
 * ```ts
 * const analysis = buildAIMindmapAnalysis(docs, 'Cybersecurity Policy', 'en');
 * const opts = buildMindmapOptionsFromAnalysis(analysis, 'en');
 * const section = generateMindmapSection(opts);
 * ```
 */
export function buildAIMindmapAnalysis(
  docs: RawDocument[],
  topic: string | null,
  lang: Language | string,
): AIMindmapAnalysis {
  // Detect policy domains across all documents
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 6);

  // Classify EU / international documents
  const intlDocs = docs.filter(d => ['fpm', 'eu'].includes(d.doktyp || d.documentType || ''));

  // Build the five dimension branches
  const branches: MindmapBranch[] = [
    buildPowerBranch(docs, lang),
    buildImpactBranch(domainList, lang),
    buildTimelineBranch(docs, lang),
    buildScopeBranch(intlDocs, docs, lang),
    buildMotivationBranch(docs, topic, domainList, lang),
  ];

  // Build cross-branch connections
  const connections = buildConnections(branches, lang);

  // Synthesize central thesis
  const centralThesis = buildCentralThesis(docs, topic, domainList, lang);

  // Confidence score: data richness proxy
  const confidenceScore = Math.min(
    1,
    (Math.min(docs.length, 10) / 10) * 0.6 + (Math.min(domainList.length, 6) / 6) * 0.4,
  );

  return { centralThesis, branches, connections, confidenceScore };
}

/**
 * Convert an `AIMindmapAnalysis` to `MindmapSectionOptions` for rendering.
 *
 * @param analysis - Output from `buildAIMindmapAnalysis`
 * @param lang - Target language for section labels
 * @param topic - Central topic text for the mindmap root node
 * @param overrides - Optional overrides for title, summary, etc.
 */
export function buildMindmapOptionsFromAnalysis(
  analysis: AIMindmapAnalysis,
  lang: Language | string,
  topic: string,
  overrides?: Partial<Pick<MindmapSectionOptions, 'title' | 'summary'>>,
): MindmapSectionOptions {
  return {
    topic,
    branches: analysis.branches,
    lang,
    centralThesis: analysis.centralThesis,
    connections: analysis.connections,
    ...overrides,
  };
}
