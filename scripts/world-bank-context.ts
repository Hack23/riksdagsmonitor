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
 *
 * Full inventory: analysis/worldbank/indicators-inventory.json
 * Committee mapping: analysis/worldbank/indicator-policy-mapping.md
 */
export const ECONOMIC_INDICATORS: readonly EconomicIndicatorContext[] = [
  {
    indicatorId: INDICATOR_IDS.gdp,
    name: 'GDP (current US$)',
    description: 'Total economic output in current US dollars — headline measure for international comparison.',
    policyAreas: ['fiscal policy', 'economic growth'],
    committees: ['FiU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.gdpGrowth,
    name: 'GDP Growth',
    description: 'Annual GDP growth rate — key measure of economic performance impacting government fiscal capacity.',
    policyAreas: ['fiscal policy', 'economic growth', 'budget'],
    committees: ['FiU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.gdpConstantLcu,
    name: 'GDP (constant LCU)',
    description: 'GDP in constant local currency — real growth excluding price effects.',
    policyAreas: ['fiscal policy', 'economic growth'],
    committees: ['FiU'],
    unit: 'SEK (constant)',
  },
  {
    indicatorId: INDICATOR_IDS.gdpPpp,
    name: 'GDP, PPP',
    description: 'GDP adjusted for purchasing power — cross-country economic size comparison.',
    policyAreas: ['fiscal policy', 'EU relations'],
    committees: ['FiU', 'UU'],
    unit: 'international $',
  },
  {
    indicatorId: INDICATOR_IDS.gdpPerCapita,
    name: 'GDP per Capita',
    description: 'GDP per capita in current USD — standard of living measure relevant to welfare debates.',
    policyAreas: ['economic growth', 'welfare', 'standard of living'],
    committees: ['FiU', 'AU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.gdpPerCapitaGrowth,
    name: 'GDP per Capita Growth',
    description: 'Annual GDP per capita growth — tracks individual prosperity trends over time.',
    policyAreas: ['economic growth', 'welfare'],
    committees: ['FiU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.gdpPerCapitaPpp,
    name: 'GDP per Capita (PPP)',
    description: 'GDP per capita adjusted for purchasing power — better cross-country welfare comparison.',
    policyAreas: ['economic growth', 'welfare'],
    committees: ['FiU'],
    unit: 'international $',
  },
  {
    indicatorId: INDICATOR_IDS.gdpPerCapitaPppConst,
    name: 'GDP per Capita (PPP, constant)',
    description: 'Real GDP per capita PPP — comparable living standard measure across time and countries.',
    policyAreas: ['economic growth', 'welfare'],
    committees: ['FiU'],
    unit: '2021 international $',
  },
  {
    indicatorId: INDICATOR_IDS.govConsumption,
    name: 'Government Consumption',
    description: 'General government final consumption expenditure as share of GDP — public sector size.',
    policyAreas: ['public spending', 'fiscal policy'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.householdConsumption,
    name: 'Household Consumption',
    description: 'Household final consumption as share of GDP — private spending and demand strength.',
    policyAreas: ['cost of living', 'welfare', 'consumer policy'],
    committees: ['FiU', 'NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.grossCapitalFormation,
    name: 'Gross Capital Formation',
    description: 'Total investment as share of GDP — measures economic investment and future growth capacity.',
    policyAreas: ['investment', 'economic growth'],
    committees: ['FiU', 'NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.grossFixedCapital,
    name: 'Gross Fixed Capital Formation',
    description: 'Fixed investment (buildings, machinery) as share of GDP — infrastructure and productive capacity.',
    policyAreas: ['investment', 'infrastructure'],
    committees: ['FiU', 'TU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.grossSavings,
    name: 'Gross Savings',
    description: 'National savings as share of GDP — fiscal sustainability and future investment capacity.',
    policyAreas: ['fiscal policy', 'pension policy'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.adjNetNationalIncome,
    name: 'Adjusted Net National Income per Capita',
    description: 'Net income per person adjusted for depreciation — sustainable welfare measure.',
    policyAreas: ['economic growth', 'welfare'],
    committees: ['FiU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.gni,
    name: 'GNI (current US$)',
    description: 'Gross National Income — total economic value generated by residents.',
    policyAreas: ['fiscal policy', 'economic growth'],
    committees: ['FiU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.gniPerCapita,
    name: 'GNI per Capita',
    description: 'GNI per capita, Atlas method — income level classification used by World Bank.',
    policyAreas: ['economic growth', 'welfare'],
    committees: ['FiU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.gniPerCapitaPpp,
    name: 'GNI per Capita (PPP)',
    description: 'GNI per capita adjusted for purchasing power — real income comparison across countries.',
    policyAreas: ['economic growth', 'welfare'],
    committees: ['FiU'],
    unit: 'international $',
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
    indicatorId: INDICATOR_IDS.govExpenditure,
    name: 'Government Expenditure',
    description: 'Government expense as share of GDP — reflects public sector size and spending.',
    policyAreas: ['public spending', 'fiscal policy', 'budget'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.govRevenue,
    name: 'Government Revenue',
    description: 'Government revenue excluding grants as share of GDP — fiscal capacity measure.',
    policyAreas: ['fiscal policy', 'taxation', 'budget'],
    committees: ['FiU', 'SkU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.taxGoodsServices,
    name: 'Taxes on Goods & Services',
    description: 'VAT and excise taxes as share of total revenue — consumption tax burden.',
    policyAreas: ['taxation', 'consumer policy'],
    committees: ['SkU'],
    unit: '% of revenue',
  },
  {
    indicatorId: INDICATOR_IDS.taxIncome,
    name: 'Taxes on Income & Profits',
    description: 'Income and corporate taxes as share of revenue — direct tax structure.',
    policyAreas: ['taxation', 'labor market'],
    committees: ['SkU', 'AU'],
    unit: '% of revenue',
  },
  {
    indicatorId: INDICATOR_IDS.taxTrade,
    name: 'Taxes on International Trade',
    description: 'Trade taxes as share of revenue — trade policy and EU tariff coordination.',
    policyAreas: ['taxation', 'trade policy', 'EU relations'],
    committees: ['SkU', 'NU'],
    unit: '% of revenue',
  },
  {
    indicatorId: INDICATOR_IDS.netInvestment,
    name: 'Net Public Investment',
    description: 'Net investment in nonfinancial assets as share of GDP — public infrastructure spending.',
    policyAreas: ['infrastructure', 'public investment'],
    committees: ['FiU', 'TU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.cashSurplusDeficit,
    name: 'Cash Surplus/Deficit',
    description: 'Government cash surplus or deficit as share of GDP — fiscal balance indicator.',
    policyAreas: ['fiscal policy', 'budget'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.netLending,
    name: 'Net Lending/Borrowing',
    description: 'Government net lending or borrowing as share of GDP — fiscal position indicator.',
    policyAreas: ['fiscal policy', 'debt management'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.tradeGdpPct,
    name: 'Trade Openness',
    description: 'Total trade as percentage of GDP — economic integration and trade dependency.',
    policyAreas: ['trade policy', 'EU relations', 'economic integration'],
    committees: ['NU', 'UU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.exportsGdpPct,
    name: 'Exports (% of GDP)',
    description: 'Exports of goods and services as share of GDP — trade competitiveness.',
    policyAreas: ['trade policy', 'EU relations', 'competitiveness'],
    committees: ['NU', 'UU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.importsGdpPct,
    name: 'Imports (% of GDP)',
    description: 'Imports of goods and services as share of GDP — domestic demand and trade dependence.',
    policyAreas: ['trade policy', 'consumer policy'],
    committees: ['NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.exportsUsd,
    name: 'Exports (current US$)',
    description: 'Total exports in current dollars — absolute trade volume.',
    policyAreas: ['trade policy', 'competitiveness'],
    committees: ['NU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.importsUsd,
    name: 'Imports (current US$)',
    description: 'Total imports in current dollars — import dependency and demand.',
    policyAreas: ['trade policy'],
    committees: ['NU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.currentAccountBalance,
    name: 'Current Account Balance',
    description: 'Current account balance as share of GDP — external economic position.',
    policyAreas: ['trade policy', 'economic stability', 'fiscal policy'],
    committees: ['FiU', 'NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.fdiNet,
    name: 'FDI Net Inflows',
    description: 'Foreign direct investment, net inflows — foreign investment attractiveness.',
    policyAreas: ['trade policy', 'investment', 'economic growth'],
    committees: ['NU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.fdiNetGdpPct,
    name: 'FDI Net Inflows (% GDP)',
    description: 'FDI net inflows as share of GDP — investment openness relative to economy size.',
    policyAreas: ['trade policy', 'investment'],
    committees: ['NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.fdiOutGdpPct,
    name: 'FDI Net Outflows (% GDP)',
    description: 'FDI net outflows as share of GDP — Swedish companies\' international expansion.',
    policyAreas: ['trade policy', 'investment'],
    committees: ['NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.highTechExports,
    name: 'High-Technology Exports',
    description: 'High-tech exports as share of manufactured exports — innovation competitiveness.',
    policyAreas: ['trade policy', 'innovation', 'competitiveness'],
    committees: ['NU', 'UbU'],
    unit: '% of manufactured exports',
  },
  {
    indicatorId: INDICATOR_IDS.externalBalance,
    name: 'External Balance',
    description: 'External balance on goods and services — net trade position.',
    policyAreas: ['trade policy', 'competitiveness'],
    committees: ['NU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.unemployment,
    name: 'Unemployment Rate',
    description: 'Total unemployment as percentage of labor force — central to labor market policy.',
    policyAreas: ['labor market', 'welfare', 'employment policy'],
    committees: ['AU'],
    unit: '% of labor force',
  },
  {
    indicatorId: INDICATOR_IDS.unemploymentFemale,
    name: 'Unemployment, Female',
    description: 'Female unemployment rate — gender equality in labor market.',
    policyAreas: ['labor market', 'gender equality'],
    committees: ['AU'],
    unit: '% of female labor force',
  },
  {
    indicatorId: INDICATOR_IDS.unemploymentMale,
    name: 'Unemployment, Male',
    description: 'Male unemployment rate — gender comparison in labor market.',
    policyAreas: ['labor market'],
    committees: ['AU'],
    unit: '% of male labor force',
  },
  {
    indicatorId: INDICATOR_IDS.youthUnemployment,
    name: 'Youth Unemployment (15-24)',
    description: 'Youth unemployment rate — education-to-work transition effectiveness.',
    policyAreas: ['labor market', 'youth policy', 'education'],
    committees: ['AU', 'UbU'],
    unit: '% of labor force ages 15-24',
  },
  {
    indicatorId: INDICATOR_IDS.youthUnemploymentFemale,
    name: 'Youth Unemployment, Female',
    description: 'Female youth unemployment — gender gap in early career.',
    policyAreas: ['labor market', 'gender equality', 'youth policy'],
    committees: ['AU'],
    unit: '% ages 15-24',
  },
  {
    indicatorId: INDICATOR_IDS.youthUnemploymentMale,
    name: 'Youth Unemployment, Male',
    description: 'Male youth unemployment — gender comparison for young workers.',
    policyAreas: ['labor market', 'youth policy'],
    committees: ['AU'],
    unit: '% ages 15-24',
  },
  {
    indicatorId: INDICATOR_IDS.longTermUnemployment,
    name: 'Long-term Unemployment',
    description: 'Long-term unemployment share — structural labor market challenges.',
    policyAreas: ['labor market', 'welfare', 'social exclusion'],
    committees: ['AU', 'SoU'],
    unit: '% of total unemployment',
  },
  {
    indicatorId: INDICATOR_IDS.longTermUnemploymentFemale,
    name: 'Long-term Unemployment, Female',
    description: 'Female long-term unemployment — gender dimension of structural unemployment.',
    policyAreas: ['labor market', 'gender equality'],
    committees: ['AU'],
    unit: '% of female unemployment',
  },
  {
    indicatorId: INDICATOR_IDS.longTermUnemploymentMale,
    name: 'Long-term Unemployment, Male',
    description: 'Male long-term unemployment — structural unemployment by gender.',
    policyAreas: ['labor market'],
    committees: ['AU'],
    unit: '% of male unemployment',
  },
  {
    indicatorId: INDICATOR_IDS.laborForceParticipation,
    name: 'Labor Force Participation',
    description: 'Labor force participation rate — active workforce share.',
    policyAreas: ['labor market', 'employment policy'],
    committees: ['AU'],
    unit: '% of population ages 15+',
  },
  {
    indicatorId: INDICATOR_IDS.laborForceParticipationFemale,
    name: 'Labor Force Participation, Female',
    description: 'Female labor participation — gender equality benchmark.',
    policyAreas: ['labor market', 'gender equality'],
    committees: ['AU'],
    unit: '% of female population ages 15+',
  },
  {
    indicatorId: INDICATOR_IDS.laborForceParticipationMale,
    name: 'Labor Force Participation, Male',
    description: 'Male labor participation — baseline for gender gap analysis.',
    policyAreas: ['labor market'],
    committees: ['AU'],
    unit: '% of male population ages 15+',
  },
  {
    indicatorId: INDICATOR_IDS.laborForceTotal,
    name: 'Labor Force Total',
    description: 'Total labor force — absolute workforce size for policy planning.',
    policyAreas: ['labor market', 'demographics'],
    committees: ['AU'],
    unit: 'persons',
  },
  {
    indicatorId: INDICATOR_IDS.employmentRatio,
    name: 'Employment-to-Population Ratio',
    description: 'Employment rate — share of working-age population actually employed.',
    policyAreas: ['labor market', 'employment policy'],
    committees: ['AU'],
    unit: '% of population ages 15+',
  },
  {
    indicatorId: INDICATOR_IDS.employmentRatioFemale,
    name: 'Employment Ratio, Female',
    description: 'Female employment rate — gender equality in actual employment.',
    policyAreas: ['labor market', 'gender equality'],
    committees: ['AU'],
    unit: '% of female population ages 15+',
  },
  {
    indicatorId: INDICATOR_IDS.employmentRatioMale,
    name: 'Employment Ratio, Male',
    description: 'Male employment rate — gender comparison baseline.',
    policyAreas: ['labor market'],
    committees: ['AU'],
    unit: '% of male population ages 15+',
  },
  {
    indicatorId: INDICATOR_IDS.vulnerableEmployment,
    name: 'Vulnerable Employment',
    description: 'Vulnerable employment share — precarious work conditions indicator.',
    policyAreas: ['labor market', 'social protection', 'welfare'],
    committees: ['AU', 'SoU'],
    unit: '% of total employment',
  },
  {
    indicatorId: INDICATOR_IDS.selfEmployed,
    name: 'Self-Employment',
    description: 'Self-employed share — entrepreneurship and gig economy measure.',
    policyAreas: ['labor market', 'enterprise policy'],
    committees: ['AU', 'NU'],
    unit: '% of total employment',
  },
  {
    indicatorId: INDICATOR_IDS.wageSalariedWorkers,
    name: 'Wage & Salaried Workers',
    description: 'Wage workers share — formal employment structure.',
    policyAreas: ['labor market', 'employment policy'],
    committees: ['AU'],
    unit: '% of total employment',
  },
  {
    indicatorId: INDICATOR_IDS.laborProductivity,
    name: 'Labor Productivity',
    description: 'GDP per person employed — productivity and competitiveness measure.',
    policyAreas: ['economic growth', 'competitiveness', 'labor market'],
    committees: ['AU', 'FiU'],
    unit: 'constant 2021 PPP $',
  },
  {
    indicatorId: INDICATOR_IDS.inflation,
    name: 'Consumer Price Inflation',
    description: 'Annual change in consumer prices — affects household purchasing power.',
    policyAreas: ['monetary policy', 'cost of living', 'economic stability'],
    committees: ['FiU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.inflationGdpDeflator,
    name: 'GDP Deflator Inflation',
    description: 'GDP deflator annual change — broad price pressure measure.',
    policyAreas: ['monetary policy', 'economic stability'],
    committees: ['FiU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.consumerPriceIndex,
    name: 'Consumer Price Index',
    description: 'CPI level (2010=100) — price level tracking for purchasing power analysis.',
    policyAreas: ['cost of living', 'monetary policy'],
    committees: ['FiU'],
    unit: 'index (2010=100)',
  },
  {
    indicatorId: INDICATOR_IDS.domesticCreditBanks,
    name: 'Domestic Credit by Banks',
    description: 'Bank credit to private sector — financial sector depth and credit availability.',
    policyAreas: ['financial regulation', 'monetary policy'],
    committees: ['FiU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.realInterestRate,
    name: 'Real Interest Rate',
    description: 'Real interest rate — monetary conditions affecting investment and savings.',
    policyAreas: ['monetary policy', 'economic stability'],
    committees: ['FiU'],
    unit: '%',
  },
  {
    indicatorId: INDICATOR_IDS.lendingRate,
    name: 'Lending Interest Rate',
    description: 'Bank lending rate — credit cost for businesses and households.',
    policyAreas: ['monetary policy', 'consumer policy'],
    committees: ['FiU'],
    unit: '%',
  },
  {
    indicatorId: INDICATOR_IDS.depositRate,
    name: 'Deposit Interest Rate',
    description: 'Bank deposit rate — savings return for households.',
    policyAreas: ['monetary policy', 'consumer policy'],
    committees: ['FiU'],
    unit: '%',
  },
  {
    indicatorId: INDICATOR_IDS.population,
    name: 'Population',
    description: 'Total population — fundamental demographic context for all policy areas.',
    policyAreas: ['demographics', 'welfare planning'],
    committees: ['SoU'],
    unit: 'persons',
  },
  {
    indicatorId: INDICATOR_IDS.populationGrowth,
    name: 'Population Growth',
    description: 'Annual population growth rate — demographic trend affecting all policy planning.',
    policyAreas: ['demographics', 'migration', 'welfare'],
    committees: ['SoU'],
    unit: '% annual',
  },
  {
    indicatorId: INDICATOR_IDS.population65Plus,
    name: 'Population 65+ (%)',
    description: 'Share of population aged 65+ — aging society pressure on pensions and healthcare.',
    policyAreas: ['demographics', 'pension policy', 'health policy'],
    committees: ['SoU'],
    unit: '% of total',
  },
  {
    indicatorId: INDICATOR_IDS.populationChildren,
    name: 'Population 0-14 (%)',
    description: 'Share of population aged 0-14 — child welfare and education demand.',
    policyAreas: ['demographics', 'family policy', 'education'],
    committees: ['SoU', 'UbU'],
    unit: '% of total',
  },
  {
    indicatorId: INDICATOR_IDS.populationWorkingAge,
    name: 'Working-Age Population (%)',
    description: 'Share of population aged 15-64 — labor supply and tax base.',
    policyAreas: ['demographics', 'labor market', 'fiscal policy'],
    committees: ['SoU', 'AU', 'FiU'],
    unit: '% of total',
  },
  {
    indicatorId: INDICATOR_IDS.urbanPopulation,
    name: 'Urban Population (%)',
    description: 'Urban population share — urbanization trend affecting housing and infrastructure.',
    policyAreas: ['housing policy', 'infrastructure', 'regional policy'],
    committees: ['SoU', 'TU'],
    unit: '% of total',
  },
  {
    indicatorId: INDICATOR_IDS.ruralPopulation,
    name: 'Rural Population (%)',
    description: 'Rural population share — rural development and regional equity.',
    policyAreas: ['regional policy', 'agriculture'],
    committees: ['SoU', 'MJU'],
    unit: '% of total',
  },
  {
    indicatorId: INDICATOR_IDS.ageDependencyRatio,
    name: 'Age Dependency Ratio',
    description: 'Dependents per 100 working-age persons — welfare system pressure.',
    policyAreas: ['demographics', 'welfare', 'pension policy'],
    committees: ['SoU'],
    unit: '% of working-age',
  },
  {
    indicatorId: INDICATOR_IDS.ageDependencyOld,
    name: 'Old-Age Dependency Ratio',
    description: 'Elderly per 100 working-age — pension and healthcare sustainability.',
    policyAreas: ['pension policy', 'health policy', 'demographics'],
    committees: ['SoU'],
    unit: '% of working-age',
  },
  {
    indicatorId: INDICATOR_IDS.ageDependencyYoung,
    name: 'Young Dependency Ratio',
    description: 'Children per 100 working-age — education and family policy demand.',
    policyAreas: ['family policy', 'education', 'demographics'],
    committees: ['SoU', 'UbU'],
    unit: '% of working-age',
  },
  {
    indicatorId: INDICATOR_IDS.netMigration,
    name: 'Net Migration',
    description: 'Net migration — immigration policy impact and demographic change driver.',
    policyAreas: ['migration policy', 'demographics', 'integration'],
    committees: ['SoU', 'AU'],
    unit: 'persons',
  },
  {
    indicatorId: INDICATOR_IDS.refugeePopulation,
    name: 'Refugee Population',
    description: 'Refugees by country of asylum — refugee policy context and integration needs.',
    policyAreas: ['migration policy', 'integration', 'welfare'],
    committees: ['SoU'],
    unit: 'persons',
  },
  {
    indicatorId: INDICATOR_IDS.lifeExpectancy,
    name: 'Life Expectancy',
    description: 'Life expectancy at birth — health system performance and quality of life.',
    policyAreas: ['health policy', 'welfare', 'demographics'],
    committees: ['SoU'],
    unit: 'years',
  },
  {
    indicatorId: INDICATOR_IDS.lifeExpectancyFemale,
    name: 'Life Expectancy, Female',
    description: 'Female life expectancy — gender health equity measure.',
    policyAreas: ['health policy', 'gender equality'],
    committees: ['SoU'],
    unit: 'years',
  },
  {
    indicatorId: INDICATOR_IDS.lifeExpectancyMale,
    name: 'Life Expectancy, Male',
    description: 'Male life expectancy — gender health gap indicator.',
    policyAreas: ['health policy'],
    committees: ['SoU'],
    unit: 'years',
  },
  {
    indicatorId: INDICATOR_IDS.birthRate,
    name: 'Birth Rate',
    description: 'Crude birth rate — demographic trend affecting welfare planning and family policy.',
    policyAreas: ['demographics', 'family policy', 'welfare'],
    committees: ['SoU'],
    unit: 'per 1,000 people',
  },
  {
    indicatorId: INDICATOR_IDS.deathRate,
    name: 'Death Rate',
    description: 'Crude death rate — demographic and health system outcome indicator.',
    policyAreas: ['demographics', 'health policy'],
    committees: ['SoU'],
    unit: 'per 1,000 people',
  },
  {
    indicatorId: INDICATOR_IDS.fertilityRate,
    name: 'Fertility Rate',
    description: 'Total fertility rate — family policy effectiveness and demographic sustainability.',
    policyAreas: ['demographics', 'family policy'],
    committees: ['SoU'],
    unit: 'births per woman',
  },
  {
    indicatorId: INDICATOR_IDS.adolescentFertility,
    name: 'Adolescent Fertility Rate',
    description: 'Teen birth rate — reproductive health and youth welfare indicator.',
    policyAreas: ['youth policy', 'health policy', 'welfare'],
    committees: ['SoU'],
    unit: 'per 1,000 women ages 15-19',
  },
  {
    indicatorId: INDICATOR_IDS.infantMortality,
    name: 'Infant Mortality Rate',
    description: 'Infant deaths per 1,000 live births — healthcare quality for newborns.',
    policyAreas: ['health policy', 'child welfare'],
    committees: ['SoU'],
    unit: 'per 1,000 live births',
  },
  {
    indicatorId: INDICATOR_IDS.under5Mortality,
    name: 'Under-5 Mortality Rate',
    description: 'Child deaths under age 5 — pediatric healthcare and child welfare.',
    policyAreas: ['health policy', 'child welfare'],
    committees: ['SoU'],
    unit: 'per 1,000 live births',
  },
  {
    indicatorId: INDICATOR_IDS.healthExpenditure,
    name: 'Health Expenditure (% GDP)',
    description: 'Current health expenditure as share of GDP — healthcare investment level.',
    policyAreas: ['health policy', 'public spending', 'welfare'],
    committees: ['SoU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.healthExpenditurePerCapita,
    name: 'Health Expenditure per Capita',
    description: 'Health spending per person — healthcare investment in absolute terms.',
    policyAreas: ['health policy', 'public spending'],
    committees: ['SoU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.govHealthExpenditure,
    name: 'Government Health Expenditure',
    description: 'Domestic government health spending as share of GDP — public healthcare commitment.',
    policyAreas: ['health policy', 'public spending'],
    committees: ['SoU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.govHealthShare,
    name: 'Government Health Share',
    description: 'Government share of total health expenditure — public vs. private healthcare balance.',
    policyAreas: ['health policy', 'welfare'],
    committees: ['SoU'],
    unit: '% of health expenditure',
  },
  {
    indicatorId: INDICATOR_IDS.privateHealthShare,
    name: 'Private Health Expenditure Share',
    description: 'Private health spending share — out-of-pocket burden and private insurance role.',
    policyAreas: ['health policy', 'consumer policy'],
    committees: ['SoU'],
    unit: '% of health expenditure',
  },
  {
    indicatorId: INDICATOR_IDS.outOfPocketHealth,
    name: 'Out-of-Pocket Health Expenditure',
    description: 'Out-of-pocket health costs — financial burden on patients.',
    policyAreas: ['health policy', 'welfare', 'consumer protection'],
    committees: ['SoU'],
    unit: '% of health expenditure',
  },
  {
    indicatorId: INDICATOR_IDS.physicians,
    name: 'Physicians per 1,000',
    description: 'Physicians per 1,000 people — healthcare staffing capacity.',
    policyAreas: ['health policy', 'healthcare staffing'],
    committees: ['SoU'],
    unit: 'per 1,000 people',
  },
  {
    indicatorId: INDICATOR_IDS.hospitalBeds,
    name: 'Hospital Beds per 1,000',
    description: 'Hospital beds per 1,000 people — healthcare infrastructure capacity.',
    policyAreas: ['health policy', 'healthcare infrastructure'],
    committees: ['SoU'],
    unit: 'per 1,000 people',
  },
  {
    indicatorId: INDICATOR_IDS.nursesAndMidwives,
    name: 'Nurses & Midwives per 1,000',
    description: 'Nursing workforce per 1,000 — primary care capacity indicator.',
    policyAreas: ['health policy', 'healthcare staffing'],
    committees: ['SoU'],
    unit: 'per 1,000 people',
  },
  {
    indicatorId: INDICATOR_IDS.suicideMortality,
    name: 'Suicide Mortality Rate',
    description: 'Suicides per 100,000 population — mental health system effectiveness.',
    policyAreas: ['mental health policy', 'health policy', 'welfare'],
    committees: ['SoU'],
    unit: 'per 100,000',
  },
  {
    indicatorId: INDICATOR_IDS.tobaccoUse,
    name: 'Tobacco Use Prevalence',
    description: 'Current tobacco use among adults — public health policy target.',
    policyAreas: ['public health', 'health policy'],
    committees: ['SoU'],
    unit: '% of adults',
  },
  {
    indicatorId: INDICATOR_IDS.alcoholConsumption,
    name: 'Alcohol Consumption',
    description: 'Alcohol consumption per capita — public health and substance abuse policy.',
    policyAreas: ['public health', 'substance abuse policy'],
    committees: ['SoU'],
    unit: 'liters pure alcohol',
  },
  {
    indicatorId: INDICATOR_IDS.measlesImmunization,
    name: 'Measles Immunization',
    description: 'Measles vaccination coverage — childhood immunization program effectiveness.',
    policyAreas: ['public health', 'child health'],
    committees: ['SoU'],
    unit: '% of children 12-23 months',
  },
  {
    indicatorId: INDICATOR_IDS.dptImmunization,
    name: 'DPT Immunization',
    description: 'DPT vaccination coverage — childhood immunization program breadth.',
    policyAreas: ['public health', 'child health'],
    committees: ['SoU'],
    unit: '% of children 12-23 months',
  },
  {
    indicatorId: INDICATOR_IDS.educationExpenditure,
    name: 'Education Expenditure (% GDP)',
    description: 'Government education spending as share of GDP — investment level comparison.',
    policyAreas: ['education', 'public spending', 'human capital'],
    committees: ['UbU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.educationGovShare,
    name: 'Education (% Govt Expenditure)',
    description: 'Education as share of government budget — policy priority indicator.',
    policyAreas: ['education', 'budget'],
    committees: ['UbU', 'FiU'],
    unit: '% of govt expenditure',
  },
  {
    indicatorId: INDICATOR_IDS.schoolEnrollment,
    name: 'School Enrollment (Primary)',
    description: 'Gross primary enrollment ratio — education access.',
    policyAreas: ['education', 'child welfare'],
    committees: ['UbU'],
    unit: '% gross',
  },
  {
    indicatorId: INDICATOR_IDS.secondaryEnrollment,
    name: 'School Enrollment (Secondary)',
    description: 'Gross secondary enrollment — education progression.',
    policyAreas: ['education', 'youth policy'],
    committees: ['UbU'],
    unit: '% gross',
  },
  {
    indicatorId: INDICATOR_IDS.tertiaryEnrollment,
    name: 'School Enrollment (Tertiary)',
    description: 'Gross tertiary enrollment — higher education access and knowledge economy.',
    policyAreas: ['education', 'research policy', 'human capital'],
    committees: ['UbU'],
    unit: '% gross',
  },
  {
    indicatorId: INDICATOR_IDS.primaryCompletion,
    name: 'Primary Completion Rate',
    description: 'Primary completion rate — basic education system effectiveness.',
    policyAreas: ['education', 'child welfare'],
    committees: ['UbU'],
    unit: '% of relevant age group',
  },
  {
    indicatorId: INDICATOR_IDS.co2Emissions,
    name: 'CO₂ Emissions per Capita',
    description: 'Carbon dioxide per person — climate policy and environmental legislation.',
    policyAreas: ['climate policy', 'environmental regulation', 'green transition'],
    committees: ['MJU'],
    unit: 'metric tons per capita',
  },
  {
    indicatorId: INDICATOR_IDS.co2EmissionsTotal,
    name: 'CO₂ Emissions Total (kt)',
    description: 'Total CO₂ emissions — national carbon footprint.',
    policyAreas: ['climate policy', 'environmental regulation'],
    committees: ['MJU'],
    unit: 'kilotons',
  },
  {
    indicatorId: INDICATOR_IDS.energyUse,
    name: 'Energy Use per Capita',
    description: 'Energy consumption per person — energy efficiency and transition progress.',
    policyAreas: ['energy policy', 'climate policy'],
    committees: ['MJU', 'NU'],
    unit: 'kg oil equivalent',
  },
  {
    indicatorId: INDICATOR_IDS.renewableEnergy,
    name: 'Renewable Energy (%)',
    description: 'Renewable energy share of total consumption — green transition progress.',
    policyAreas: ['energy policy', 'climate policy', 'green transition'],
    committees: ['MJU', 'NU'],
    unit: '% of total energy',
  },
  {
    indicatorId: INDICATOR_IDS.renewableElectricity,
    name: 'Renewable Electricity (%)',
    description: 'Renewable electricity output share — power sector decarbonization.',
    policyAreas: ['energy policy', 'climate policy'],
    committees: ['MJU', 'NU'],
    unit: '% of total electricity',
  },
  {
    indicatorId: INDICATOR_IDS.forestArea,
    name: 'Forest Area (%)',
    description: 'Forest cover as share of land area — natural resource management.',
    policyAreas: ['environmental regulation', 'forestry', 'biodiversity'],
    committees: ['MJU'],
    unit: '% of land area',
  },
  {
    indicatorId: INDICATOR_IDS.airPollution,
    name: 'Air Pollution (PM2.5)',
    description: 'PM2.5 air pollution level — environmental health risk indicator.',
    policyAreas: ['environmental regulation', 'public health'],
    committees: ['MJU', 'SoU'],
    unit: 'µg/m³',
  },
  {
    indicatorId: INDICATOR_IDS.nuclearElectricity,
    name: 'Nuclear Electricity (%)',
    description: 'Nuclear power share — energy mix and nuclear policy debates.',
    policyAreas: ['energy policy', 'nuclear policy'],
    committees: ['MJU', 'NU'],
    unit: '% of total electricity',
  },
  {
    indicatorId: INDICATOR_IDS.hydroElectricity,
    name: 'Hydroelectric Power (%)',
    description: 'Hydroelectric share — renewable energy baseload capacity.',
    policyAreas: ['energy policy'],
    committees: ['MJU', 'NU'],
    unit: '% of total electricity',
  },
  {
    indicatorId: INDICATOR_IDS.renewableElecExHydro,
    name: 'Renewable Excl. Hydro (%)',
    description: 'Wind, solar, and other renewables — new renewable energy growth.',
    policyAreas: ['energy policy', 'climate policy', 'green transition'],
    committees: ['MJU', 'NU'],
    unit: '% of total electricity',
  },
  {
    indicatorId: INDICATOR_IDS.internetUsers,
    name: 'Internet Users',
    description: 'Internet users as share of population — digital infrastructure and e-government readiness.',
    policyAreas: ['digital policy', 'e-government', 'telecommunications'],
    committees: ['TU'],
    unit: '% of population',
  },
  {
    indicatorId: INDICATOR_IDS.broadbandSubscriptions,
    name: 'Broadband Subscriptions',
    description: 'Fixed broadband per 100 people — digital infrastructure quality.',
    policyAreas: ['digital policy', 'telecommunications', 'infrastructure'],
    committees: ['TU'],
    unit: 'per 100 people',
  },
  {
    indicatorId: INDICATOR_IDS.mobileSubscriptions,
    name: 'Mobile Subscriptions',
    description: 'Mobile cellular per 100 people — telecom market maturity.',
    policyAreas: ['telecommunications', 'digital policy'],
    committees: ['TU'],
    unit: 'per 100 people',
  },
  {
    indicatorId: INDICATOR_IDS.secureServers,
    name: 'Secure Internet Servers',
    description: 'Secure servers per million people — digital economy infrastructure and cybersecurity.',
    policyAreas: ['cybersecurity', 'digital policy'],
    committees: ['TU', 'FöU'],
    unit: 'per million people',
  },
  {
    indicatorId: INDICATOR_IDS.airPassengers,
    name: 'Air Transport Passengers',
    description: 'Air passengers carried — transport infrastructure usage and mobility.',
    policyAreas: ['transport policy', 'infrastructure'],
    committees: ['TU'],
    unit: 'persons',
  },
  {
    indicatorId: INDICATOR_IDS.patentsResident,
    name: 'Patent Applications (Resident)',
    description: 'Domestic patent filings — innovation output indicator.',
    policyAreas: ['innovation', 'research policy'],
    committees: ['UbU', 'NU'],
    unit: 'applications',
  },
  {
    indicatorId: INDICATOR_IDS.patentsNonresident,
    name: 'Patent Applications (Non-resident)',
    description: 'Foreign patent filings — attractiveness for innovation.',
    policyAreas: ['innovation', 'trade policy'],
    committees: ['NU'],
    unit: 'applications',
  },
  {
    indicatorId: INDICATOR_IDS.rdExpenditure,
    name: 'R&D Expenditure',
    description: 'Research & development spending as share of GDP — innovation capacity.',
    policyAreas: ['research policy', 'innovation', 'education'],
    committees: ['UbU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.researchersPerMillion,
    name: 'Researchers per Million',
    description: 'R&D researchers per million people — knowledge economy human capital.',
    policyAreas: ['research policy', 'education', 'human capital'],
    committees: ['UbU'],
    unit: 'per million people',
  },
  {
    indicatorId: INDICATOR_IDS.scientificArticles,
    name: 'Scientific Journal Articles',
    description: 'Scientific publications — research output and academic excellence.',
    policyAreas: ['research policy', 'education'],
    committees: ['UbU'],
    unit: 'articles',
  },
  {
    indicatorId: INDICATOR_IDS.ictServiceExports,
    name: 'ICT Service Exports',
    description: 'ICT service exports as share of total service exports — digital economy strength.',
    policyAreas: ['digital policy', 'trade policy', 'innovation'],
    committees: ['TU', 'NU'],
    unit: '% of service exports',
  },
  {
    indicatorId: INDICATOR_IDS.militaryExpenditure,
    name: 'Military Expenditure (% GDP)',
    description: 'Defense spending as share of GDP — NATO 2% target context and security policy.',
    policyAreas: ['defense', 'security policy', 'NATO'],
    committees: ['FöU'],
    unit: '% of GDP',
  },
  {
    indicatorId: INDICATOR_IDS.militaryExpenditureUsd,
    name: 'Military Expenditure (USD)',
    description: 'Defense spending in absolute terms — military capability measure.',
    policyAreas: ['defense', 'security policy'],
    committees: ['FöU'],
    unit: 'USD',
  },
  {
    indicatorId: INDICATOR_IDS.militaryGovShare,
    name: 'Military (% Govt Expenditure)',
    description: 'Defense as share of government budget — security policy priority.',
    policyAreas: ['defense', 'budget', 'security policy'],
    committees: ['FöU', 'FiU'],
    unit: '% of govt expenditure',
  },
  {
    indicatorId: INDICATOR_IDS.armedForcesTotal,
    name: 'Armed Forces Personnel',
    description: 'Total military personnel — defense capability measure.',
    policyAreas: ['defense', 'security policy'],
    committees: ['FöU'],
    unit: 'persons',
  },
  {
    indicatorId: INDICATOR_IDS.armedForcesLaborShare,
    name: 'Armed Forces (% Labor Force)',
    description: 'Military personnel as share of labor force — societal defense commitment.',
    policyAreas: ['defense', 'labor market'],
    committees: ['FöU'],
    unit: '% of labor force',
  },
  {
    indicatorId: INDICATOR_IDS.ruleOfLaw,
    name: 'Rule of Law',
    description: 'WGI rule of law estimate — judicial independence, property rights, constitutional order.',
    policyAreas: ['rule of law', 'constitutional affairs', 'judicial independence'],
    committees: ['KU', 'JuU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.voiceAccountability,
    name: 'Voice and Accountability',
    description: 'WGI voice and accountability — citizen participation and press freedom.',
    policyAreas: ['democracy', 'press freedom', 'constitutional affairs'],
    committees: ['KU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.govEffectiveness,
    name: 'Government Effectiveness',
    description: 'WGI government effectiveness — public service quality and policy implementation.',
    policyAreas: ['public administration', 'government quality', 'institutional capacity'],
    committees: ['KU', 'FiU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.regulatoryQuality,
    name: 'Regulatory Quality',
    description: 'WGI regulatory quality — private sector development and regulation effectiveness.',
    policyAreas: ['regulation', 'business climate', 'competitiveness'],
    committees: ['NU', 'KU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.controlOfCorruption,
    name: 'Control of Corruption',
    description: 'WGI corruption control — anti-corruption effectiveness and institutional integrity.',
    policyAreas: ['anti-corruption', 'rule of law', 'institutional integrity'],
    committees: ['KU', 'JuU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.politicalStability,
    name: 'Political Stability',
    description: 'WGI political stability and absence of violence — governance stability.',
    policyAreas: ['political stability', 'security policy', 'democracy'],
    committees: ['KU', 'FöU'],
    unit: 'index (-2.5 to 2.5)',
  },
  {
    indicatorId: INDICATOR_IDS.giniIndex,
    name: 'GINI Index',
    description: 'Income inequality measure (0=equality, 100=inequality) — social policy and redistribution.',
    policyAreas: ['income distribution', 'social policy', 'welfare'],
    committees: ['SoU', 'AU'],
    unit: 'index (0-100)',
  },
  {
    indicatorId: INDICATOR_IDS.incomeTop10,
    name: 'Income Share: Top 10%',
    description: 'Income share of richest 10% — inequality concentration measure.',
    policyAreas: ['income distribution', 'taxation', 'social policy'],
    committees: ['SoU', 'SkU'],
    unit: '% of income',
  },
  {
    indicatorId: INDICATOR_IDS.incomeBottom10,
    name: 'Income Share: Bottom 10%',
    description: 'Income share of poorest 10% — poverty depth measure.',
    policyAreas: ['poverty', 'social policy', 'welfare'],
    committees: ['SoU'],
    unit: '% of income',
  },
  {
    indicatorId: INDICATOR_IDS.incomeBottom20,
    name: 'Income Share: Bottom 20%',
    description: 'Income share of poorest 20% — broad poverty measure.',
    policyAreas: ['poverty', 'social policy', 'welfare'],
    committees: ['SoU'],
    unit: '% of income',
  },
  {
    indicatorId: INDICATOR_IDS.incomeTop20,
    name: 'Income Share: Top 20%',
    description: 'Income share of richest 20% — wealth concentration.',
    policyAreas: ['income distribution', 'taxation'],
    committees: ['SoU', 'SkU'],
    unit: '% of income',
  },
  {
    indicatorId: INDICATOR_IDS.womenInParliament,
    name: 'Women in Parliament',
    description: 'Share of parliamentary seats held by women — gender equality in politics.',
    policyAreas: ['gender equality', 'democratic representation', 'constitutional affairs'],
    committees: ['KU', 'AU'],
    unit: '% of total seats',
  },
  {
    indicatorId: INDICATOR_IDS.electricPowerConsumption,
    name: 'Electric Power Consumption',
    description: 'Electricity consumption per capita — energy demand and efficiency.',
    policyAreas: ['energy policy', 'infrastructure'],
    committees: ['MJU', 'NU'],
    unit: 'kWh per capita',
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
