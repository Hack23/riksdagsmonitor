/**
 * @module ai-analysis/visualisation
 * @description Mindmap branch and dashboard data builders extracted from the
 *   monolithic analysis pipeline.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { RawDocument } from '../../data-transformers/types.js';
import { detectNarrativeFrames } from '../../data-transformers/policy-analysis.js';
import { localizeDocType } from '../../data-transformers/content-generators/index.js';
import { type LangRecord, normalizedDocType } from '../helpers.js';
import type { AnalysisMindmapBranch, DashboardData } from '../types.js';
import { GOV_NAMES, OPP_NAMES, PRIVATE_NAMES } from '../swot/index.js';
import { DASHBOARD_DOCS_ANALYSED } from '../domains/index.js';

// ---------------------------------------------------------------------------
// Palette for dashboard type distribution charts
// ---------------------------------------------------------------------------

const TYPE_PALETTE: readonly string[] = [
  '#00d9ff', '#ff006e', '#ffbe0b', '#7b2fff', '#00c58e',
  '#ff6b35', '#4dd0e1', '#f48fb1', '#a5d6a7', '#ce93d8',
];

/**
 * Stable type→color mapping so the same doc type always gets the same color
 * regardless of document encounter order. Known types get fixed assignments;
 * unknown types fall through to the palette by sorted-key index.
 */
const STABLE_TYPE_COLORS: Record<string, string> = {
  prop: '#00d9ff',   // propositions (government bills)
  mot: '#ff006e',    // motions (opposition proposals)
  bet: '#ffbe0b',    // betänkanden (committee reports)
  sfs: '#7b2fff',    // enacted laws/statutes
  ip: '#00c58e',     // interpellations
  fpm: '#ff6b35',    // EU position papers (faktapromemorior)
  skr: '#4dd0e1',    // government written communications
  ds: '#f48fb1',     // departmental memoranda
  sou: '#a5d6a7',    // government inquiry reports
  dir: '#ce93d8',    // commission directives
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

// ---------------------------------------------------------------------------
// Localised section labels
// ---------------------------------------------------------------------------

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
export function narrativeFramesLabel(lang: Language): string {
  const m: LangRecord = { en: 'Narrative Frames', sv: 'Narrativa ramar', da: 'Narrative rammer', no: 'Narrative rammer', fi: 'Narratiiviset kehykset', de: 'Narrative Rahmen', fr: 'Cadres narratifs', es: 'Marcos narrativos', nl: 'Narratieve frames', ar: 'الإطارات السردية', he: 'מסגרות נרטיביות', ja: '物語フレーム', ko: '서사 프레임', zh: '叙事框架' };
  return m[lang] ?? m.en!;
}

// ---------------------------------------------------------------------------
// Mindmap branch builder
// ---------------------------------------------------------------------------

export function buildMindmapBranches(
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

// ---------------------------------------------------------------------------
// Dashboard data builder
// ---------------------------------------------------------------------------

export function buildDashboardData(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): DashboardData {
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = normalizedDocType(d);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const typeKeys = Object.keys(typeCounts).sort();
  const typeDistribution = typeKeys.map((t, i) => ({
    label: localizeDocType(t, lang, typeCounts[t] ?? 0),
    value: typeCounts[t] ?? 0,
    color: STABLE_TYPE_COLORS[t] ?? TYPE_PALETTE[i % TYPE_PALETTE.length] ?? '#00d9ff',
  }));

  const docIntelLabel = DASHBOARD_TITLE[lang] ?? DASHBOARD_TITLE.en!;
  const title = topic ? `${docIntelLabel} — ${topic}` : docIntelLabel;
  const docsAnalysedFn = DASHBOARD_DOCS_ANALYSED[lang] ?? DASHBOARD_DOCS_ANALYSED.en!;
  const summary = docsAnalysedFn(docs.length);

  return { title, summary, typeDistribution };
}
