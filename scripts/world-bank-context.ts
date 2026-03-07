/**
 * @module WorldBank/Context
 * @description Economic context provider for news generation and political intelligence.
 * Maps World Bank indicators to Swedish political policy areas, enabling enriched
 * analysis that connects parliamentary decisions to economic outcomes.
 *
 * Used by agentic workflows and article quality enhancement to add economic depth
 * to political reporting.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from './types/language.js';
import { INDICATOR_IDS, COUNTRY_CODES } from './world-bank-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An economic indicator mapped to a policy area */
export interface EconomicIndicatorContext {
  /** World Bank indicator ID */
  readonly indicatorId: string;
  /** Human-readable name */
  readonly name: string;
  /** Concise description for article context */
  readonly description: string;
  /** Swedish policy areas this indicator relates to */
  readonly policyAreas: readonly string[];
  /** Relevant Riksdag committees */
  readonly committees: readonly string[];
  /** Unit of measurement */
  readonly unit: string;
}

/** Nordic country comparison set */
export interface NordicComparisonSet {
  readonly countries: readonly string[];
  readonly countryNames: Readonly<Record<string, string>>;
}

/** Localized economic section heading */
export interface EconomicSectionHeadings {
  readonly economicContext: string;
  readonly nordicComparison: string;
  readonly policyImplications: string;
  readonly country: string;
  readonly unit: string;
}

// ---------------------------------------------------------------------------
// Economic indicator mappings
// ---------------------------------------------------------------------------

/**
 * Maps World Bank indicators to Swedish political policy areas.
 * Each indicator is linked to relevant Riksdag committees and policy domains.
 */
export const ECONOMIC_INDICATORS: readonly EconomicIndicatorContext[] = [
  {
    indicatorId: INDICATOR_IDS.gdpGrowth,
    name: 'GDP Growth',
    description: 'Annual GDP growth rate — a key measure of economic performance that directly impacts government fiscal capacity and policy options.',
    policyAreas: ['fiscal policy', 'economic growth', 'budget'],
    committees: ['FiU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.unemployment,
    name: 'Unemployment Rate',
    description: 'Total unemployment as percentage of labor force — central to labor market policy debates and welfare spending.',
    policyAreas: ['labor market', 'welfare', 'employment policy'],
    committees: ['AU'],
    unit: '% of labor force',
  },
  {
    indicatorId: INDICATOR_IDS.inflation,
    name: 'Consumer Price Inflation',
    description: 'Annual change in consumer prices — affects household purchasing power and Riksbank monetary policy.',
    policyAreas: ['monetary policy', 'cost of living', 'economic stability'],
    committees: ['FiU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.govExpenditure,
    name: 'Government Expenditure',
    description: 'General government final consumption expenditure as share of GDP — reflects the size and scope of public sector.',
    policyAreas: ['public spending', 'fiscal policy', 'budget'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.tradeGdpPct,
    name: 'Trade Openness',
    description: 'Total trade (exports + imports) as percentage of GDP — measures Sweden\'s economic integration and trade dependency.',
    policyAreas: ['trade policy', 'EU relations', 'economic integration'],
    committees: ['NU', 'UU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.militaryExpenditure,
    name: 'Military Expenditure',
    description: 'Defense spending as share of GDP — critical context for NATO accession debates and security policy.',
    policyAreas: ['defense', 'security policy', 'NATO'],
    committees: ['FöU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.co2Emissions,
    name: 'CO₂ Emissions per Capita',
    description: 'Carbon dioxide emissions per person — relevant to climate policy and environmental legislation.',
    policyAreas: ['climate policy', 'environmental regulation', 'green transition'],
    committees: ['MJU'],
    unit: 'metric tons per capita',
  },
  {
    indicatorId: INDICATOR_IDS.rdExpenditure,
    name: 'R&D Expenditure',
    description: 'Research and development spending as share of GDP — indicator of innovation capacity and knowledge economy investment.',
    policyAreas: ['research policy', 'innovation', 'education'],
    committees: ['UbU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.giniIndex,
    name: 'GINI Index',
    description: 'Income inequality measure (0 = perfect equality, 100 = maximum inequality) — central to social policy and redistribution debates.',
    policyAreas: ['income distribution', 'social policy', 'welfare'],
    committees: ['SoU', 'AU'],
    unit: 'index (0-100)',
  },
  {
    indicatorId: INDICATOR_IDS.currentAccountBalance,
    name: 'Current Account Balance',
    description: 'Current account balance as share of GDP — reflects Sweden\'s external economic position and trade competitiveness.',
    policyAreas: ['trade policy', 'economic stability', 'fiscal policy'],
    committees: ['FiU', 'NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.taxRevenue,
    name: 'Tax Revenue',
    description: 'Tax revenue as share of GDP — central to taxation policy debates and fiscal capacity.',
    policyAreas: ['taxation', 'fiscal policy', 'public finances'],
    committees: ['SkU', 'FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.ruleOfLaw,
    name: 'Rule of Law',
    description: 'World Governance Indicator for rule of law — reflects judicial independence, property rights, and constitutional order.',
    policyAreas: ['rule of law', 'constitutional affairs', 'judicial independence'],
    committees: ['KU', 'JuU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.voiceAccountability,
    name: 'Voice and Accountability',
    description: 'World Governance Indicator for citizen participation and press freedom — core to democratic governance oversight.',
    policyAreas: ['democracy', 'press freedom', 'constitutional affairs'],
    committees: ['KU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.govEffectiveness,
    name: 'Government Effectiveness',
    description: 'World Governance Indicator for quality of public services and policy implementation.',
    policyAreas: ['public administration', 'government quality', 'institutional capacity'],
    committees: ['KU', 'FiU'],
    unit: 'index (-2.5 to 2.5)',
  },
] as const;

// ---------------------------------------------------------------------------
// Nordic comparison configuration
// ---------------------------------------------------------------------------

/** Standard Nordic + Germany comparison set for benchmarking Sweden */
export const NORDIC_COMPARISON: NordicComparisonSet = {
  countries: [
    COUNTRY_CODES.sweden,
    COUNTRY_CODES.denmark,
    COUNTRY_CODES.norway,
    COUNTRY_CODES.finland,
    COUNTRY_CODES.germany,
  ],
  countryNames: {
    [COUNTRY_CODES.sweden]: 'Sweden',
    [COUNTRY_CODES.denmark]: 'Denmark',
    [COUNTRY_CODES.norway]: 'Norway',
    [COUNTRY_CODES.finland]: 'Finland',
    [COUNTRY_CODES.germany]: 'Germany',
  },
} as const;

// ---------------------------------------------------------------------------
// Localized headings for economic context sections
// ---------------------------------------------------------------------------

/**
 * Localized section headings for economic context in articles.
 * Follows the same pattern as EDITORIAL_PILLAR_HEADINGS.
 */
export const ECONOMIC_SECTION_HEADINGS: Readonly<Record<Language, EconomicSectionHeadings>> = {
  en: {
    economicContext: 'Economic Context',
    nordicComparison: 'Nordic Comparison',
    policyImplications: 'Policy Implications',
    country: 'Country',
    unit: 'Unit',
  },
  sv: {
    economicContext: 'Ekonomisk kontext',
    nordicComparison: 'Nordisk jämförelse',
    policyImplications: 'Policyimplikationer',
    country: 'Land',
    unit: 'Enhet',
  },
  da: {
    economicContext: 'Økonomisk kontekst',
    nordicComparison: 'Nordisk sammenligning',
    policyImplications: 'Politiske implikationer',
    country: 'Land',
    unit: 'Enhed',
  },
  no: {
    economicContext: 'Økonomisk kontekst',
    nordicComparison: 'Nordisk sammenligning',
    policyImplications: 'Politiske implikasjoner',
    country: 'Land',
    unit: 'Enhet',
  },
  fi: {
    economicContext: 'Taloudellinen konteksti',
    nordicComparison: 'Pohjoismainen vertailu',
    policyImplications: 'Politiikan vaikutukset',
    country: 'Maa',
    unit: 'Yksikkö',
  },
  de: {
    economicContext: 'Wirtschaftlicher Kontext',
    nordicComparison: 'Nordischer Vergleich',
    policyImplications: 'Politische Auswirkungen',
    country: 'Land',
    unit: 'Einheit',
  },
  fr: {
    economicContext: 'Contexte économique',
    nordicComparison: 'Comparaison nordique',
    policyImplications: 'Implications politiques',
    country: 'Pays',
    unit: 'Unité',
  },
  es: {
    economicContext: 'Contexto económico',
    nordicComparison: 'Comparación nórdica',
    policyImplications: 'Implicaciones políticas',
    country: 'País',
    unit: 'Unidad',
  },
  nl: {
    economicContext: 'Economische context',
    nordicComparison: 'Noordse vergelijking',
    policyImplications: 'Beleidsimplicaties',
    country: 'Land',
    unit: 'Eenheid',
  },
  ar: {
    economicContext: 'السياق الاقتصادي',
    nordicComparison: 'المقارنة الاسكندنافية',
    policyImplications: 'تداعيات السياسات',
    country: 'الدولة',
    unit: 'الوحدة',
  },
  he: {
    economicContext: 'הקשר כלכלי',
    nordicComparison: 'השוואה סקנדינבית',
    policyImplications: 'השלכות מדיניות',
    country: 'מדינה',
    unit: 'יחידה',
  },
  ja: {
    economicContext: '経済的背景',
    nordicComparison: '北欧比較',
    policyImplications: '政策的含意',
    country: '国',
    unit: '単位',
  },
  ko: {
    economicContext: '경제적 맥락',
    nordicComparison: '북유럽 비교',
    policyImplications: '정책적 시사점',
    country: '국가',
    unit: '단위',
  },
  zh: {
    economicContext: '经济背景',
    nordicComparison: '北欧比较',
    policyImplications: '政策影响',
    country: '国家',
    unit: '单位',
  },
} as const;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Get the localized economic section heading.
 *
 * @param lang - Language code
 * @param section - Section key
 * @returns Localized heading string
 */
export function getEconomicHeading(
  lang: Language | string,
  section: keyof EconomicSectionHeadings,
): string {
  const headings = ECONOMIC_SECTION_HEADINGS[lang as Language] ?? ECONOMIC_SECTION_HEADINGS.en;
  return headings[section];
}

/**
 * Find relevant economic indicators for a given policy area or committee.
 *
 * @param query - Policy area or committee abbreviation to search for
 * @returns Matching economic indicators
 */
export function findRelevantIndicators(query: string): readonly EconomicIndicatorContext[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }
  return ECONOMIC_INDICATORS.filter(
    (indicator) =>
      indicator.policyAreas.some((area) => area.toLowerCase().includes(q)) ||
      indicator.committees.some((c) => c.toLowerCase() === q),
  );
}

/**
 * Get the World Bank API query parameters for Swedish economic indicators.
 * Used by agentic workflows to know which indicators to fetch.
 *
 * @returns Array of { countryCode, indicatorId, name } for all configured indicators
 */
export function getSwedishIndicatorQueries(): readonly { countryCode: string; indicatorId: string; name: string }[] {
  return ECONOMIC_INDICATORS.map((indicator) => ({
    countryCode: COUNTRY_CODES.sweden,
    indicatorId: indicator.indicatorId,
    name: indicator.name,
  }));
}

/**
 * Detect economic context references in article content.
 * Used by article quality enhancer to score economic depth.
 *
 * @param content - HTML or text content to analyze
 * @returns True if economic context is present
 */
export function hasEconomicContext(content: string): boolean {
  const text = content.toLowerCase();
  const patterns: readonly RegExp[] = [
    /\bgdp\b/i,
    /\bunemployment\b/i,
    /\binflation\b/i,
    /\beconomic\s+(growth|context|impact)\b/i,
    /\bworld\s+bank\b/i,
    /\bbnp\b/i, // Swedish: bruttonationalprodukt
    /\barbetslöshet/i, // Swedish: unemployment (arbetslöshet, arbetslösheten, etc.)
    /\bekonomi/i, // Swedish: economy
    /\bhandelsbalans/i, // Swedish: trade balance (handelsbalans, handelsbalansen, etc.)
    /\bstatsskuld/i, // Swedish: national debt (statsskuld, statsskulden, etc.)
    /\bförsvarsutgift/i, // Swedish: defense expenditure (försvarsutgift, försvarsutgifter, försvarsutgifterna, etc.)
    /\bforskningsutgift/i, // Swedish: R&D expenditure (forskningsutgift, forskningsutgifter, forskningsutgifterna, etc.)
    /\bNY\.GDP/i, // World Bank indicator IDs
    /\bSL\.UEM/i,
    /\bFP\.CPI/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}
