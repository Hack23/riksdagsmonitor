/**
 * @module SCB/Context
 * @description Context provider for Statistics Sweden (SCB) data enrichment.
 * Maps SCB statistical indicators to Swedish policy areas and provides
 * localized section headings for article generation.
 *
 * Mirrors the pattern of world-bank-context.ts but for Swedish national
 * statistics sourced through the SCB MCP server.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from './types/language.js';
import { SCB_DOMAINS } from './scb-client.js';
import type { SCBDomainConfig } from './scb-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An SCB indicator mapped to a policy domain and Riksdag committees */
export interface SCBIndicatorContext {
  /** Policy domain key (matches SCB_DOMAINS) */
  readonly domain: string;
  /** Human-readable name */
  readonly name: string;
  /** Concise description for article context */
  readonly description: string;
  /** Relevant Riksdag committees */
  readonly committees: readonly string[];
  /** SCB table IDs for data access */
  readonly tableIds: readonly string[];
  /** Key indicators available in this domain */
  readonly indicators: readonly string[];
}

/** Localized headings for SCB statistics sections in articles */
export interface SCBSectionHeadings {
  readonly statisticalContext: string;
  readonly officialStatistics: string;
  readonly dataSource: string;
}

// ---------------------------------------------------------------------------
// SCB indicator mappings (12 domains → committees)
// ---------------------------------------------------------------------------

/**
 * Maps SCB statistical domains to Swedish parliamentary committees.
 * Each indicator context links SCB data to the relevant Riksdag committee
 * for cross-referencing legislative analysis with official statistics.
 */
export const SCB_INDICATOR_CONTEXTS: readonly SCBIndicatorContext[] = [
  {
    domain: 'fiscal',
    name: 'Public Finances',
    description: 'Government revenue, expenditure, and budget balance from SCB national accounts.',
    committees: ['FiU'],
    tableIds: ['TAB1291', 'TAB1292'],
    indicators: ['Government revenue', 'Government expenditure', 'Budget balance'],
  },
  {
    domain: 'defence',
    name: 'Defence Spending',
    description: 'Military expenditure as share of GDP, relevant to NATO commitments.',
    committees: ['FöU'],
    tableIds: [],
    indicators: ['Defence spending % GDP'],
  },
  {
    domain: 'environment',
    name: 'Environmental Statistics',
    description: 'Greenhouse gas emissions and renewable energy share from SCB environment accounts.',
    committees: ['MJU'],
    tableIds: ['TAB5404', 'TAB5407'],
    indicators: ['GHG emissions', 'Renewable energy share'],
  },
  {
    domain: 'education',
    name: 'Education Statistics',
    description: 'Student enrollment and graduation rates from SCB education database.',
    committees: ['UbU'],
    tableIds: ['TAB4787', 'TAB4790'],
    indicators: ['Student enrollment', 'Graduation rates'],
  },
  {
    domain: 'healthcare',
    name: 'Healthcare Statistics',
    description: 'Healthcare spending and hospital capacity from SCB health accounts.',
    committees: ['SoU'],
    tableIds: [],
    indicators: ['Healthcare spending', 'Hospital beds'],
  },
  {
    domain: 'migration',
    name: 'Migration Statistics',
    description: 'Immigration, emigration, and net migration from SCB population statistics.',
    committees: ['SfU'],
    tableIds: ['TAB637', 'TAB4230'],
    indicators: ['Immigration', 'Emigration', 'Net migration'],
  },
  {
    domain: 'eu-foreign',
    name: 'Foreign Trade',
    description: 'Export/import values and trade balance from SCB trade statistics.',
    committees: ['NU', 'UU'],
    tableIds: ['TAB2661'],
    indicators: ['Export value', 'Import value', 'Trade balance'],
  },
  {
    domain: 'justice',
    name: 'Crime Statistics',
    description: 'Reported crimes and conviction rates from SCB justice statistics.',
    committees: ['JuU'],
    tableIds: ['TAB1172'],
    indicators: ['Reported crimes', 'Conviction rate'],
  },
  {
    domain: 'labour',
    name: 'Labour Market',
    description: 'Unemployment and employment rates from SCB labour force surveys.',
    committees: ['AU'],
    tableIds: ['TAB5765', 'TAB5616'],
    indicators: ['Unemployment rate', 'Employment rate'],
  },
  {
    domain: 'housing',
    name: 'Housing Market',
    description: 'Housing construction starts and price index from SCB building statistics.',
    committees: ['CU'],
    tableIds: ['TAB2052', 'TAB4709'],
    indicators: ['Housing starts', 'Price index'],
  },
  {
    domain: 'transport',
    name: 'Transport Statistics',
    description: 'Road traffic volume and public transit ridership from SCB transport data.',
    committees: ['TU'],
    tableIds: [],
    indicators: ['Road traffic', 'Transit ridership'],
  },
  {
    domain: 'trade',
    name: 'Economic Growth',
    description: 'GDP growth, business starts, and industrial production from SCB national accounts.',
    committees: ['FiU', 'NU'],
    tableIds: ['TAB5802', 'TAB5803'],
    indicators: ['GDP growth', 'Business starts', 'Industrial production'],
  },
  {
    domain: 'taxation',
    name: 'Tax Statistics',
    description: 'Tax revenue, income tax, and VAT statistics from SCB fiscal accounts.',
    committees: ['SkU', 'FiU'],
    tableIds: ['TAB1291'],
    indicators: ['Tax revenue', 'Income tax', 'VAT revenue'],
  },
  {
    domain: 'culture',
    name: 'Cultural Statistics',
    description: 'Cultural expenditure, library visits, and cultural participation from SCB cultural accounts.',
    committees: ['KrU'],
    tableIds: ['TAB5195'],
    indicators: ['Cultural expenditure', 'Library visits', 'Cultural participation'],
  },
  {
    domain: 'governance',
    name: 'Democratic Governance',
    description: 'Voter turnout and parliamentary transparency metrics for constitutional oversight.',
    committees: ['KU'],
    tableIds: [],
    indicators: ['Voter turnout', 'Parliamentary transparency'],
  },
] as const;

// ---------------------------------------------------------------------------
// Localized headings for SCB statistics sections
// ---------------------------------------------------------------------------

/**
 * Localized section headings for SCB statistics in articles.
 * Follows the same 14-language pattern as ECONOMIC_SECTION_HEADINGS.
 */
export const SCB_SECTION_HEADINGS: Readonly<Record<Language, SCBSectionHeadings>> = {
  en: {
    statisticalContext: 'Statistical Context',
    officialStatistics: 'Official Statistics',
    dataSource: 'Data Source: Statistics Sweden (SCB)',
  },
  sv: {
    statisticalContext: 'Statistisk kontext',
    officialStatistics: 'Officiell statistik',
    dataSource: 'Datakälla: Statistiska centralbyrån (SCB)',
  },
  da: {
    statisticalContext: 'Statistisk kontekst',
    officialStatistics: 'Officiel statistik',
    dataSource: 'Datakilde: Statistiska centralbyrån (SCB)',
  },
  no: {
    statisticalContext: 'Statistisk kontekst',
    officialStatistics: 'Offisiell statistikk',
    dataSource: 'Datakilde: Statistiska centralbyrån (SCB)',
  },
  fi: {
    statisticalContext: 'Tilastollinen konteksti',
    officialStatistics: 'Viralliset tilastot',
    dataSource: 'Tietolähde: Statistiska centralbyrån (SCB)',
  },
  de: {
    statisticalContext: 'Statistischer Kontext',
    officialStatistics: 'Amtliche Statistik',
    dataSource: 'Datenquelle: Statistiska centralbyrån (SCB)',
  },
  fr: {
    statisticalContext: 'Contexte statistique',
    officialStatistics: 'Statistiques officielles',
    dataSource: 'Source des données : Statistiska centralbyrån (SCB)',
  },
  es: {
    statisticalContext: 'Contexto estadístico',
    officialStatistics: 'Estadísticas oficiales',
    dataSource: 'Fuente de datos: Statistiska centralbyrån (SCB)',
  },
  nl: {
    statisticalContext: 'Statistische context',
    officialStatistics: 'Officiële statistieken',
    dataSource: 'Databron: Statistiska centralbyrån (SCB)',
  },
  ar: {
    statisticalContext: 'السياق الإحصائي',
    officialStatistics: 'الإحصاءات الرسمية',
    dataSource: 'مصدر البيانات: المكتب المركزي للإحصاء (SCB)',
  },
  he: {
    statisticalContext: 'הקשר סטטיסטי',
    officialStatistics: 'סטטיסטיקה רשמית',
    dataSource: 'מקור נתונים: הלשכה המרכזית לסטטיסטיקה (SCB)',
  },
  ja: {
    statisticalContext: '統計的背景',
    officialStatistics: '公式統計',
    dataSource: 'データソース：スウェーデン統計局（SCB）',
  },
  ko: {
    statisticalContext: '통계적 맥락',
    officialStatistics: '공식 통계',
    dataSource: '데이터 출처: 스웨덴 통계청 (SCB)',
  },
  zh: {
    statisticalContext: '统计背景',
    officialStatistics: '官方统计',
    dataSource: '数据来源：瑞典统计局（SCB）',
  },
} as const;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Get the localized SCB section heading.
 *
 * @param lang - Language code
 * @param section - Section key
 * @returns Localized heading string
 */
export function getSCBHeading(
  lang: Language | string,
  section: keyof SCBSectionHeadings,
): string {
  const headings = SCB_SECTION_HEADINGS[lang as Language] ?? SCB_SECTION_HEADINGS.en;
  return headings[section];
}

/**
 * Find relevant SCB indicator contexts for a given policy area or committee.
 *
 * @param query - Policy domain, committee abbreviation, or free text
 * @returns Matching SCB indicator contexts
 */
export function findRelevantSCBIndicators(query: string): readonly SCBIndicatorContext[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }
  return SCB_INDICATOR_CONTEXTS.filter(
    (ctx) =>
      ctx.domain.toLowerCase().includes(q) ||
      ctx.name.toLowerCase().includes(q) ||
      ctx.committees.some((c) => c.toLowerCase() === q) ||
      ctx.indicators.some((ind) => ind.toLowerCase().includes(q)),
  );
}

/**
 * Get SCB domain configs that have known table IDs for a given committee.
 *
 * @param committee - Riksdag committee abbreviation (e.g., 'FiU', 'AU')
 * @returns Matching SCB domain configs with table data
 */
export function getSCBTablesForCommittee(committee: string): readonly SCBDomainConfig[] {
  const c = committee.trim().toLowerCase();
  return SCB_DOMAINS.filter(
    (d) =>
      d.tables.length > 0 &&
      SCB_INDICATOR_CONTEXTS.some(
        (ctx) =>
          ctx.domain === d.domain &&
          ctx.committees.some((comm) => comm.toLowerCase() === c),
      ),
  );
}

/**
 * Detect whether content references Swedish statistics or SCB data.
 * Used by article quality enhancer to score statistical depth.
 *
 * @param content - HTML or text content to analyze
 * @returns True if SCB statistical context is present
 */
export function hasSCBContext(content: string): boolean {
  const text = content.toLowerCase();
  const patterns: readonly RegExp[] = [
    /\bscb\b/i,
    /\bstatistiska centralbyrån\b/i,
    /\bstatistics sweden\b/i,
    /\bofficiell statistik\b/i,
    /\bofficial statistics\b/i,
    /\barbetskraftsundersökning/i, // AKU - Labour Force Survey
    /\bnationalräkenskaper/i, // National Accounts
    /\bkonsumentprisindex/i, // CPI
    /\bfolkmängd/i, // Population
    /\bbefolkningsstatistik/i, // Population statistics
    /\bbostadsbyggande/i, // Housing construction
    /\butrikeshandel/i, // Foreign trade
    /\bbrå\b/i, // Crime statistics authority
    /\bTAB\d{3,5}\b/i, // SCB table IDs
  ];

  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Get SCB query parameters for all domains with table IDs.
 * Used by agentic workflows to know which tables to fetch.
 *
 * @returns Array of { domain, query, tableIds } for domains with data
 */
export function getSCBQueryParams(): readonly { domain: string; query: string; tableIds: readonly string[] }[] {
  return SCB_DOMAINS
    .filter((d) => d.tables.length > 0)
    .map((d) => ({
      domain: d.domain,
      query: d.query,
      tableIds: d.tables,
    }));
}
