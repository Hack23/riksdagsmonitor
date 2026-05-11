/**
 * @module WorldBank/Context
 * @description **Non-economic-only** context provider for political intelligence.
 *
 * World Bank is **NEVER** used for economic context in Riksdagsmonitor — not as
 * primary, not as secondary, not as fallback, not as historical. All economic
 * context (macro / fiscal / monetary / external-sector / trade / commodity / FX
 * / interest rates / labour-market headlines) is sourced from **IMF** via
 * `scripts/imf-fetch.ts` (catalogue: `analysis/imf/indicators-inventory.json`).
 *
 * This module exposes only the **non-economic residue** WB still publishes
 * authoritatively: WGI governance (`source=75`), environment, social /
 * health / education participation, demographics, defence historicals,
 * agriculture, innovation (R&D / patents), inequality (GINI / income
 * distribution), and crime / justice.
 *
 * **SINGLE SOURCE OF TRUTH**: indicator data is loaded from
 * `analysis/worldbank/indicators-inventory.json`. To add or modify indicators
 * edit the JSON file only — no TypeScript changes are required.
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

/**
 * A **non-economic** WB indicator mapped to a Swedish policy area.
 *
 * Note: economic codes (national accounts, government finance, trade,
 * inflation, headline labour, financial-sector interest rates) are **not**
 * present in this inventory. Use IMF citations via `scripts/imf-fetch.ts`
 * for any economic context.
 */
export interface WorldBankIndicatorContext {
  /** World Bank indicator ID (non-economic only) */
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
    return resolve(process.cwd(), 'analysis', 'worldbank', 'indicators-inventory.json');
  }
}

/**
 * Load and transform indicators from the JSON inventory file.
 * The inventory catalogues World Bank's documented scope (governance,
 * environment, social, demographics, health, education, defence
 * historicals, innovation, infrastructure, inequality, gender, energy,
 * agriculture, crime/justice). Each indicator is mapped to a
 * {@link WorldBankIndicatorContext}.
 */
function loadIndicatorsFromInventory(): readonly WorldBankIndicatorContext[] {
  try {
    const raw = readFileSync(resolveInventoryPath(), 'utf-8');
    const inventory: IndicatorInventory = JSON.parse(raw);

    const indicators: WorldBankIndicatorContext[] = [];
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
    const error =
      err instanceof Error
        ? err
        : new Error(`[world-bank-context] Failed to load indicators inventory: ${String(err)}`);

    if (process.env.NODE_ENV === 'test') {
      return [];
    }

    console.error(`[world-bank-context] Failed to load indicators inventory: ${error.message}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Indicator mappings (loaded from JSON — non-economic residue only)
// ---------------------------------------------------------------------------

/**
 * World Bank indicators mapped to Swedish political policy areas. The
 * inventory holds the indicators World Bank publishes authoritatively —
 * WGI governance (`source=75`), environment, social / health / education
 * participation, demographics, defence historicals, agriculture,
 * innovation (R&D / patents), inequality (GINI / income distribution)
 * and crime / justice.
 *
 * Economic context (macro / fiscal / monetary / external-sector / trade /
 * commodity / FX / interest rates / labour-market headlines) is sourced
 * from IMF via `scripts/imf-fetch.ts`; SCB supplies Swedish-specific
 * ground truth.
 *
 * Authority: `.github/aw/ECONOMIC_DATA_CONTRACT.md` v3.0 ·
 * `analysis/imf/indicators-inventory.json` ·
 * `analysis/worldbank/indicators-inventory.json` v4.0.
 */
export const WORLD_BANK_INDICATORS: readonly WorldBankIndicatorContext[] =
  loadIndicatorsFromInventory();

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
 * Find non-economic World Bank indicators relevant to a Swedish policy area
 * or committee. The inventory contains only non-economic residue, so all
 * results are safe to surface in articles. For economic context use IMF.
 *
 * @param query - Policy area or committee abbreviation to search for
 * @returns Matching non-economic indicators
 */
export function findRelevantIndicators(query: string): readonly WorldBankIndicatorContext[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }
  return WORLD_BANK_INDICATORS.filter(
    (indicator) =>
      indicator.policyAreas.some((area) => area.toLowerCase().includes(q)) ||
      indicator.committees.some((c) => c.toLowerCase() === q),
  );
}

/**
 * Get the World Bank API query parameters for the **non-economic** Swedish
 * indicators surfaced by this module. Used by agentic workflows to know
 * which non-economic indicators to fetch from World Bank. Economic context
 * queries go through `scripts/imf-fetch.ts` instead.
 *
 * @returns Array of { countryCode, indicatorId, name } for all configured indicators
 */
export function getSwedishIndicatorQueries(): readonly { countryCode: string; indicatorId: string; name: string }[] {
  return WORLD_BANK_INDICATORS.map((indicator) => ({
    countryCode: COUNTRY_CODES.sweden,
    indicatorId: indicator.indicatorId,
    name: indicator.name,
  }));
}

/**
 * Detect economic context references in article content.
 *
 * Recognises canonical IMF citations (`WEO:NGDP_RPCH`, `FM:GGXWDG_NGDP`,
 * `CPI:_T.IX`, `BOP:*`, `GFS_COFOG:GF02_T`, `IMTS:XG_FOB_USD`, `PCPS:*`,
 * `MFS_IR:MMRT_RT_PT_A_PT`, `ER:USD_XDC.PA_RT`) and natural-language
 * economic terms in English and Swedish. Used by the article quality
 * enhancer to score economic depth.
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
    /\b(?:IMF|International\s+Monetary\s+Fund)\b/i, // IMF — primary and only economic source
    /\bbnp\b/i, // Swedish: bruttonationalprodukt
    /\barbetslöshet/i, // Swedish: unemployment
    /\bekonomi/i, // Swedish: economy
    /\bhandelsbalans/i, // Swedish: trade balance
    /\bstatsskuld/i, // Swedish: national debt
    /\bförsvarsutgift/i, // Swedish: defense expenditure
    /\bforskningsutgift/i, // Swedish: R&D expenditure
    /\bmilitärut/i, // Swedish: military expenditure
    /\bskattein/i, // Swedish: tax revenue
    /\bgini/i, // GINI index (inequality — non-economic residue)
    /\bco2\b/i, // CO2 emissions
    /\bnato\s*2\s*%/i, // NATO 2% target
    /\bförny(?:else)?bart?\s+energi/i, // Swedish: renewable energy
    /\bbirth\s*rate\b/i,
    /\bfertility\s*rate\b/i,
    /\blife\s*expectancy\b/i,
    /\bMS\.MIL/i, // WB defence historicals (non-economic residue)
    /\bSI\.POV\.GINI/i, // WB inequality residue
    /\bEN\.ATM/i, // WB environment residue
    /\bSH\.XPD/i, // WB health residue
    /\bSE\.XPD/i, // WB education residue
    /\b(?:WEO|FM|IFS|BOP|BOP_AGG|GFS_COFOG|MFS_IR|DOTS|PCPS|ER):[A-Z][A-Z0-9_]+/i,
    /\bWEO\s+(?:Apr|Oct|April|October)-\d{4}\b/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}
