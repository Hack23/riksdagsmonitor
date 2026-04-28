/**
 * @module WorldBank/Client
 * @description TypeScript REST client for the World Bank Open Data API.
 * Provides direct HTTP access to World Bank economic indicators for Sweden
 * and Nordic comparison countries, used to enrich political intelligence
 * with economic context.
 *
 * Based on the World Bank MCP Server pattern (https://github.com/anshumax/world_bank_mcp_server)
 * but implemented as a native TypeScript HTTP client for build-time data fetching.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 * @see https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single World Bank indicator data point */
export interface WorldBankDataPoint {
  readonly countryId: string;
  readonly countryName: string;
  readonly indicatorId: string;
  readonly indicatorName: string;
  readonly date: string;
  readonly value: number;
}

/** Metadata about a World Bank indicator */
export interface WorldBankIndicator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
}


/** Raw indicator value from the API */
interface RawIndicatorValue {
  indicator?: { id?: string; value?: string };
  country?: { id?: string; value?: string };
  date?: string;
  value?: number | null;
}

/** Client configuration */
export interface WorldBankClientConfig {
  readonly baseURL?: string;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.worldbank.org/v2';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * World Bank API source IDs for different indicator databases.
 * Most indicators use the default WDI source (2), but Worldwide
 * Governance Indicators (WGI) require source=75.
 */
export const WB_SOURCES = {
  /** World Development Indicators (default) */
  wdi: 2,
  /** Worldwide Governance Indicators — needed for CC.EST, RQ.EST, PV.EST, GE.EST, RL.EST, VA.EST */
  wgi: 75,
} as const;

/** Indicator IDs that require source=75 (WGI) for REST API access */
export const WGI_INDICATOR_IDS = new Set([
  'RL.EST', 'VA.EST', 'GE.EST', 'RQ.EST', 'CC.EST', 'PV.EST',
]);

/** ISO 3166-1 alpha-3 codes for Sweden and comparison countries */
export const COUNTRY_CODES = {
  sweden: 'SWE',
  denmark: 'DNK',
  norway: 'NOR',
  finland: 'FIN',
  germany: 'DEU',
  eu: 'EUU',
} as const;

/**
 * Comprehensive World Bank indicator IDs for Swedish political intelligence.
 *
 * Organised into 17 domains covering all Riksdag committee policy areas.
 * Total: 144 verified indicators with Sweden annual time-series data.
 *
 * Access methods:
 * - **MCP tools**: get-economic-data, get-social-data, get-education-data, get-health-data
 * - **REST API**: api.worldbank.org/v2 (default source=2/WDI)
 * - **WGI REST API**: api.worldbank.org/v2 with source=75 (governance indicators)
 *
 * Full machine-readable inventory: analysis/worldbank/indicators-inventory.json
 * Committee mapping: analysis/worldbank/indicator-policy-mapping.md
 */
/**
 * **Non-economic** World Bank indicator codes the platform may consume.
 *
 * **Economic context (macro / fiscal / monetary / external-sector / trade /
 * commodity / FX / interest rates / labour-market headlines) is sourced
 * from IMF only** via `scripts/imf-fetch.ts` — this object intentionally
 * does NOT expose any of the legacy WB economic codes. Attempting to
 * reach for `INDICATOR_IDS.gdp` / `unemployment` / `inflation` / etc. is
 * a TypeScript compile error pointing the author at IMF.
 *
 * Categories surfaced here are the residue WB still publishes
 * authoritatively: demographics, health, education, environment,
 * infrastructure, innovation (R&D / patents), defence historicals,
 * WGI governance, inequality, gender, energy use.
 *
 * Full machine-readable inventory: `analysis/worldbank/indicators-inventory.json`
 * Committee mapping: `analysis/worldbank/indicator-policy-mapping.md`
 */
export const INDICATOR_IDS = {
  // ===========================================================================
  // 1. DEMOGRAPHICS & POPULATION (SoU — Social Affairs Committee)
  // ===========================================================================
  /** Population, total */
  population: 'SP.POP.TOTL',
  /** Population growth (annual %) */
  populationGrowth: 'SP.POP.GROW',
  /** Population ages 65 and above (% of total) */
  population65Plus: 'SP.POP.65UP.TO.ZS',
  /** Population ages 0-14 (% of total) */
  populationChildren: 'SP.POP.0014.TO.ZS',
  /** Population ages 15-64 (% of total) */
  populationWorkingAge: 'SP.POP.1564.TO.ZS',
  /** Urban population (% of total) */
  urbanPopulation: 'SP.URB.TOTL.IN.ZS',
  /** Rural population (% of total) */
  ruralPopulation: 'SP.RUR.TOTL.ZS',
  /** Age dependency ratio (% of working-age population) */
  ageDependencyRatio: 'SP.POP.DPND',
  /** Age dependency ratio, old (% of working-age) */
  ageDependencyOld: 'SP.POP.DPND.OL',
  /** Age dependency ratio, young (% of working-age) */
  ageDependencyYoung: 'SP.POP.DPND.YG',
  /** Net migration */
  netMigration: 'SM.POP.NETM',
  /** Refugee population by country/territory of asylum */
  refugeePopulation: 'SM.POP.REFG',
  /** Life expectancy at birth, total (years) */
  lifeExpectancy: 'SP.DYN.LE00.IN',
  /** Life expectancy at birth, female (years) */
  lifeExpectancyFemale: 'SP.DYN.LE00.FE.IN',
  /** Life expectancy at birth, male (years) */
  lifeExpectancyMale: 'SP.DYN.LE00.MA.IN',
  /** Birth rate, crude (per 1,000 people) */
  birthRate: 'SP.DYN.CBRT.IN',
  /** Death rate, crude (per 1,000 people) */
  deathRate: 'SP.DYN.CDRT.IN',
  /** Fertility rate, total (births per woman) */
  fertilityRate: 'SP.DYN.TFRT.IN',
  /** Adolescent fertility rate (births per 1,000 women ages 15-19) */
  adolescentFertility: 'SP.ADO.TFRT',
  /** Mortality rate, infant (per 1,000 live births) */
  infantMortality: 'SP.DYN.IMRT.IN',
  /** Mortality rate, under-5 (per 1,000 live births) */
  under5Mortality: 'SH.DYN.MORT',
  /** Individuals using the Internet (% of population) */
  internetUsers: 'IT.NET.USER.ZS',

  // ===========================================================================
  // 2. HEALTH (SoU)
  // ===========================================================================
  /** Current health expenditure (% of GDP) */
  healthExpenditure: 'SH.XPD.CHEX.GD.ZS',
  /** Current health expenditure per capita (current US$) */
  healthExpenditurePerCapita: 'SH.XPD.CHEX.PC.CD',
  /** Domestic general government health expenditure (% of GDP) */
  govHealthExpenditure: 'SH.XPD.GHED.GD.ZS',
  /** Domestic general government health exp. (% of current health exp.) */
  govHealthShare: 'SH.XPD.GHED.CH.ZS',
  /** Domestic private health expenditure (% of current health exp.) */
  privateHealthShare: 'SH.XPD.PVTD.CH.ZS',
  /** Out-of-pocket expenditure (% of current health expenditure) */
  outOfPocketHealth: 'SH.XPD.OOPC.CH.ZS',
  /** Physicians (per 1,000 people) */
  physicians: 'SH.MED.PHYS.ZS',
  /** Hospital beds (per 1,000 people) */
  hospitalBeds: 'SH.MED.BEDS.ZS',
  /** Nurses and midwives (per 1,000 people) */
  nursesAndMidwives: 'SH.MED.NUMW.P3',
  /** Suicide mortality rate (per 100,000 population) */
  suicideMortality: 'SH.STA.SUIC.P5',
  /** Prevalence of current tobacco use (% of adults) */
  tobaccoUse: 'SH.PRV.SMOK',
  /** Total alcohol consumption per capita (liters of pure alcohol) */
  alcoholConsumption: 'SH.ALC.PCAP.LI',
  /** Immunization, measles (% of children ages 12-23 months) */
  measlesImmunization: 'SH.IMM.MEAS',
  /** Immunization, DPT (% of children ages 12-23 months) */
  dptImmunization: 'SH.IMM.IDPT',

  // ===========================================================================
  // 3. EDUCATION (UbU — Education Committee)
  // ===========================================================================
  /** Government expenditure on education, total (% of GDP) */
  educationExpenditure: 'SE.XPD.TOTL.GD.ZS',
  /** Government expenditure on education (% of government expenditure) */
  educationGovShare: 'SE.XPD.TOTL.GB.ZS',
  /** School enrollment, primary (% gross) */
  schoolEnrollment: 'SE.PRM.ENRR',
  /** School enrollment, secondary (% gross) */
  secondaryEnrollment: 'SE.SEC.ENRR',
  /** School enrollment, tertiary (% gross) */
  tertiaryEnrollment: 'SE.TER.ENRR',
  /** Primary completion rate (% of relevant age group) */
  primaryCompletion: 'SE.PRM.CMPT.ZS',

  // ===========================================================================
  // 4. ENVIRONMENT & CLIMATE (MJU — Environment Committee)
  // ===========================================================================
  /** CO2 emissions (metric tons per capita) */
  co2Emissions: 'EN.ATM.CO2E.PC',
  /** CO2 emissions (kt) */
  co2EmissionsTotal: 'EN.ATM.CO2E.KT',
  /** Energy use (kg of oil equivalent per capita) */
  energyUse: 'EG.USE.PCAP.KG.OE',
  /** Renewable energy consumption (% of total final energy) */
  renewableEnergy: 'EG.FEC.RNEW.ZS',
  /** Renewable electricity output (% of total electricity output) */
  renewableElectricity: 'EG.ELC.RNEW.ZS',
  /** Forest area (% of land area) */
  forestArea: 'AG.LND.FRST.ZS',
  /** PM2.5 air pollution, mean annual exposure (µg/m³) */
  airPollution: 'EN.ATM.PM25.MC.M3',
  /** Electricity production from nuclear sources (% of total) */
  nuclearElectricity: 'EG.ELC.NUCL.ZS',
  /** Electricity production from hydroelectric sources (% of total) */
  hydroElectricity: 'EG.ELC.HYRO.ZS',
  /** Electricity production from renewables excl. hydro (% of total) */
  renewableElecExHydro: 'EG.ELC.RNWX.ZS',

  // ===========================================================================
  // 5. INFRASTRUCTURE & TECHNOLOGY (TU — Transport Committee)
  // ===========================================================================
  /** Fixed broadband subscriptions (per 100 people) */
  broadbandSubscriptions: 'IT.NET.BBND.P2',
  /** Mobile cellular subscriptions (per 100 people) */
  mobileSubscriptions: 'IT.CEL.SETS.P2',
  /** Secure Internet servers (per 1 million people) */
  secureServers: 'IT.NET.SECR.P6',
  /** Air transport, passengers carried */
  airPassengers: 'IS.AIR.PSGR',
  /** Patent applications, residents */
  patentsResident: 'IP.PAT.RESD',
  /** Patent applications, nonresidents */
  patentsNonresident: 'IP.PAT.NRES',

  // ===========================================================================
  // 6. INNOVATION & RESEARCH (UbU)
  // ===========================================================================
  /** Research and development expenditure (% of GDP) */
  rdExpenditure: 'GB.XPD.RSDV.GD.ZS',
  /** Researchers in R&D (per million people) */
  researchersPerMillion: 'SP.POP.SCIE.RD.P6',
  /** Scientific and technical journal articles */
  scientificArticles: 'IP.JRN.ARTC.SC',

  // ===========================================================================
  // 7. MILITARY & SECURITY (FöU — Defense Committee, historicals only)
  // ===========================================================================
  /** Military expenditure (% of GDP) */
  militaryExpenditure: 'MS.MIL.XPND.GD.ZS',
  /** Military expenditure (current USD) */
  militaryExpenditureUsd: 'MS.MIL.XPND.CD',
  /** Military expenditure (% of central government expenditure) */
  militaryGovShare: 'MS.MIL.XPND.ZS',
  /** Armed forces personnel, total */
  armedForcesTotal: 'MS.MIL.TOTL.P1',
  /** Armed forces personnel (% of total labor force) */
  armedForcesLaborShare: 'MS.MIL.TOTL.TF.ZS',

  // ===========================================================================
  // 8. GOVERNANCE & INSTITUTIONS (KU, JuU)
  // Note: WGI indicators require source=75 in REST API calls
  // ===========================================================================
  /** Rule of Law: Estimate (-2.5 to 2.5) [source=75] */
  ruleOfLaw: 'RL.EST',
  /** Voice and Accountability: Estimate [source=75] */
  voiceAccountability: 'VA.EST',
  /** Government Effectiveness: Estimate [source=75] */
  govEffectiveness: 'GE.EST',
  /** Regulatory Quality: Estimate [source=75] */
  regulatoryQuality: 'RQ.EST',
  /** Control of Corruption: Estimate [source=75] */
  controlOfCorruption: 'CC.EST',
  /** Political Stability and Absence of Violence: Estimate [source=75] */
  politicalStability: 'PV.EST',

  // ===========================================================================
  // 9. INEQUALITY (SoU, AU)
  // ===========================================================================
  /** GINI index */
  giniIndex: 'SI.POV.GINI',
  /** Income share held by highest 10% */
  incomeTop10: 'SI.DST.10TH.10',
  /** Income share held by lowest 10% */
  incomeBottom10: 'SI.DST.FRST.10',
  /** Income share held by lowest 20% */
  incomeBottom20: 'SI.DST.FRST.20',
  /** Income share held by highest 20% */
  incomeTop20: 'SI.DST.05TH.20',

  // ===========================================================================
  // 10. GENDER & SOCIAL INCLUSION (AU, KU)
  // ===========================================================================
  /** Proportion of seats held by women in national parliaments (%) */
  womenInParliament: 'SG.GEN.PARL.ZS',

  // ===========================================================================
  // 11. ENERGY (MJU, NU)
  // ===========================================================================
  /** Electric power consumption (kWh per capita) */
  electricPowerConsumption: 'EG.USE.ELEC.KH.PC',
} as const;

// ---------------------------------------------------------------------------
// WorldBankClient class
// ---------------------------------------------------------------------------

/**
 * HTTP client for the World Bank Open Data API.
 * Fetches economic indicator data for Sweden and comparison countries.
 */
export class WorldBankClient {
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;

  constructor(config: WorldBankClientConfig = {}) {
    this.baseURL = config.baseURL ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /**
   * Fetch indicator data for a specific country.
   *
   * @param countryCode - ISO 3166-1 alpha-3 country code (e.g., 'SWE')
   * @param indicatorId - World Bank indicator ID (e.g., 'NY.GDP.MKTP.KD.ZG')
   * @param perPage - Maximum number of records to fetch (default: 50)
   * @returns Array of data points sorted by date descending
   */
  async getIndicator(
    countryCode: string,
    indicatorId: string,
    perPage = 50,
  ): Promise<WorldBankDataPoint[]> {
    // WGI governance indicators require source=75
    const sourceParam = WGI_INDICATOR_IDS.has(indicatorId) ? `&source=${WB_SOURCES.wgi}` : '';
    const url = `${this.baseURL}/country/${encodeURIComponent(countryCode)}/indicator/${encodeURIComponent(indicatorId)}?format=json&per_page=${perPage}${sourceParam}`;

    const data = await this.fetchWithRetry(url);

    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      return [];
    }

    return (data[1] as RawIndicatorValue[])
      .filter((item): item is RawIndicatorValue & { value: number } => item.value !== null && item.value !== undefined)
      .map((item) => ({
        countryId: item.country?.id ?? countryCode,
        countryName: item.country?.value ?? countryCode,
        indicatorId: item.indicator?.id ?? indicatorId,
        indicatorName: item.indicator?.value ?? indicatorId,
        date: item.date ?? '',
        value: item.value,
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.date, 10);
        const yearB = parseInt(b.date, 10);
        if (isNaN(yearA) && isNaN(yearB)) return 0;
        if (isNaN(yearA)) return 1;
        if (isNaN(yearB)) return -1;
        return yearB - yearA;
      });
  }

  /**
   * Fetch the latest available value for an indicator.
   *
   * @param countryCode - ISO 3166-1 alpha-3 country code
   * @param indicatorId - World Bank indicator ID
   * @returns Most recent data point, or null if no data
   */
  async getLatestIndicator(
    countryCode: string,
    indicatorId: string,
  ): Promise<WorldBankDataPoint | null> {
    const results = await this.getIndicator(countryCode, indicatorId, 10);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Compare an indicator across multiple countries.
   *
   * @param countryCodes - Array of ISO 3166-1 alpha-3 codes
   * @param indicatorId - World Bank indicator ID
   * @returns Map of country code → latest data point
   */
  async compareCountries(
    countryCodes: readonly string[],
    indicatorId: string,
  ): Promise<Map<string, WorldBankDataPoint | null>> {
    const results = new Map<string, WorldBankDataPoint | null>();

    // Fetch sequentially to respect API rate limits
    for (const code of countryCodes) {
      try {
        const latest = await this.getLatestIndicator(code, indicatorId);
        results.set(code, latest);
      } catch {
        results.set(code, null);
      }
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async fetchWithRetry(url: string, attempt = 0): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = 1000 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let defaultWorldBankClient: WorldBankClient | null = null;

/** Get or create the default singleton WorldBankClient */
export function getDefaultWorldBankClient(): WorldBankClient {
  if (!defaultWorldBankClient) {
    defaultWorldBankClient = new WorldBankClient();
  }
  return defaultWorldBankClient;
}
