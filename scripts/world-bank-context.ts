/**
 * @module WorldBank/Context
 * @description Economic context provider for news generation and political intelligence.
 * Maps World Bank indicators to Swedish political policy areas, enabling enriched
 * analysis that connects parliamentary decisions to economic outcomes.
 *
 * **SINGLE SOURCE OF TRUTH**: Indicator data is loaded from
 * `analysis/worldbank/indicators-inventory.json` — the canonical machine-readable
 * inventory. Both AI agents (`view` tool) and this TypeScript module consume the
 * same JSON, ensuring consistency. To add or modify indicators, edit the JSON file
 * only — this module picks up changes automatically.
 *
 * Used by agentic workflows and article quality enhancement to add economic depth
 * to political reporting.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Language } from './types/language.js';
import { COUNTRY_CODES } from './world-bank-client.js';

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
// JSON inventory types (mirrors analysis/worldbank/indicators-inventory.json)
// ---------------------------------------------------------------------------

interface InventoryIndicator {
  id: string;
  key: string;
  name: string;
  unit: string;
  description?: string;
  policyAreas?: string[];
  committees?: string[];
  mcpTool?: string;
  mcpParam?: string;
  source?: number;
}

interface InventoryDomain {
  label: string;
  committees: string[];
  indicatorCount: number;
  indicators: InventoryIndicator[];
}

interface IndicatorInventory {
  version: string;
  totalIndicators: number;
  domains: Record<string, InventoryDomain>;
}

// ---------------------------------------------------------------------------
// Load indicators from JSON inventory (single source of truth)
// ---------------------------------------------------------------------------

/**
 * Resolve the path to the indicators inventory JSON.
 * Works both when running from the repo root (`npx tsx scripts/...`) and
 * from within the scripts directory.
 */
function resolveInventoryPath(): string {
  try {
    const thisDir = dirname(fileURLToPath(import.meta.url));
    return resolve(thisDir, '..', 'analysis', 'worldbank', 'indicators-inventory.json');
  } catch {
    // Fallback for environments where import.meta.url is unavailable
    return resolve(process.cwd(), 'analysis', 'worldbank', 'indicators-inventory.json');
  }
}

/**
 * Load and transform indicators from the JSON inventory file.
 * Each indicator in the JSON is mapped to an EconomicIndicatorContext
 * with description, policyAreas, and committees.
 */
function loadIndicatorsFromInventory(): readonly EconomicIndicatorContext[] {
  try {
    const raw = readFileSync(resolveInventoryPath(), 'utf-8');
    const inventory: IndicatorInventory = JSON.parse(raw);

    const indicators: EconomicIndicatorContext[] = [];
    for (const domain of Object.values(inventory.domains)) {
      for (const ind of domain.indicators) {
        indicators.push({
          indicatorId: ind.id,
          name: ind.name,
          description: ind.description ?? `${ind.name} — ${domain.label} indicator for Sweden.`,
          policyAreas: ind.policyAreas ?? [domain.label.toLowerCase()],
          committees: ind.committees ?? domain.committees,
          unit: ind.unit,
        });
      }
    }
    return indicators;
  } catch (err: unknown) {
    // Log warning so broken paths / invalid JSON are visible in build output.
    // Only silently degrade in test environments where the FS may be mocked.
    if (process.env.NODE_ENV !== 'test') {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[world-bank-context] Failed to load indicators inventory: ${msg}`);
    }
    return [];
  }
}

// ---------------------------------------------------------------------------
// Economic indicator mappings (loaded from JSON)
// ---------------------------------------------------------------------------

/**
 * All World Bank indicators mapped to Swedish political policy areas.
 * Loaded from `analysis/worldbank/indicators-inventory.json` — the single source of truth.
 *
 * To add indicators: edit the JSON file, NOT this module.
 * Full inventory: analysis/worldbank/indicators-inventory.json
 * Committee mapping: analysis/worldbank/indicator-policy-mapping.md
 */
export const ECONOMIC_INDICATORS: readonly EconomicIndicatorContext[] = loadIndicatorsFromInventory();

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
    policyImplications: 'Poliittiset vaikutukset',
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
    /\bförsvarsutgift/i, // Swedish: defense expenditure (försvarsutgift, försvarsutgifter, etc.)
    /\bforskningsutgift/i, // Swedish: R&D expenditure (forskningsutgift, forskningsutgifter, etc.)
    /\bmilitärut/i, // Swedish: military expenditure (militärutgift, etc.)
    /\bskattein/i, // Swedish: tax revenue (skatteintäkt, skatteintäkter, etc.)
    /\bgini/i, // GINI index
    /\bco2\b/i, // CO2 emissions
    /\bnato\s*2\s*%/i, // NATO 2% target
    /\bförnyelsebart?\s+energi/i, // Swedish: renewable energy (förnybar/förnyelsebar energi)
    /\bbirth\s*rate\b/i,
    /\bfertility\s*rate\b/i,
    /\blife\s*expectancy\b/i,
    /\bNY\.GDP/i, // World Bank indicator IDs
    /\bSL\.UEM/i,
    /\bFP\.CPI/i,
    /\bMS\.MIL/i,
    /\bGC\.TAX/i,
    /\bSI\.POV\.GINI/i,
    /\bEN\.ATM/i,
    /\bSH\.XPD/i,
    /\bSE\.XPD/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}
