/**
 * @module Intelligence/StatisticalClaimsDetector
 * @description Detects and fact-checks statistical claims made by politicians
 * in parliamentary speeches and debates. Cross-references claimed figures
 * against official data from World Bank and SCB (Statistics Sweden) MCP servers.
 *
 * This enables breaking-news or commentary articles when politicians use
 * statistics to validate policy claims — surfacing whether the data supports
 * or contradicts their assertions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from './types/language.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A statistical claim extracted from a speech or document */
export interface StatisticalClaim {
  /** The original text excerpt containing the claim */
  readonly sourceText: string;
  /** Detected statistical topic (e.g., 'unemployment', 'gdp', 'migration') */
  readonly topic: string;
  /** Claimed numeric value (if extractable) */
  readonly claimedValue?: number;
  /** Unit of the claimed value (e.g., 'percent', 'billions SEK') */
  readonly claimedUnit?: string;
  /** Person making the claim */
  readonly speaker?: string;
  /** Party affiliation */
  readonly party?: string;
  /** Data source for verification ('world-bank' | 'scb' | 'both') */
  readonly verificationSource: 'world-bank' | 'scb' | 'both';
  /** World Bank indicator ID for cross-reference (if applicable) */
  readonly worldBankIndicator?: string;
  /** SCB table ID for cross-reference (if applicable) */
  readonly scbTableId?: string;
}

/** Result of fact-checking a statistical claim */
export interface FactCheckResult {
  /** The original claim */
  readonly claim: StatisticalClaim;
  /** Official value from data source */
  readonly officialValue?: number;
  /** Unit of the official value */
  readonly officialUnit?: string;
  /** Period of the official data */
  readonly officialPeriod?: string;
  /** Verdict on the claim */
  readonly verdict: ClaimVerdict;
  /** Percentage deviation from official data (if both values available) */
  readonly deviationPercent?: number;
  /** Human-readable explanation */
  readonly explanation: string;
  /** Data source used for verification */
  readonly dataSource: string;
}

/** Possible verdicts for a statistical claim */
export type ClaimVerdict =
  | 'accurate'          // Claim matches official data (within 5%)
  | 'mostly-accurate'   // Claim is close but not exact (5-15% deviation)
  | 'misleading'        // Claim uses real data but in a misleading way (15-30%)
  | 'inaccurate'        // Claim significantly deviates from official data (>30%)
  | 'unverifiable'      // Cannot be verified against available data
  | 'outdated';         // Claim uses old data when newer is available

/** Localized headings for fact-check sections in articles */
export interface FactCheckHeadings {
  readonly factCheck: string;
  readonly claimVsReality: string;
  readonly verdict: string;
  readonly dataSource: string;
}

// ---------------------------------------------------------------------------
// Claim detection patterns
// ---------------------------------------------------------------------------

/** Pattern definitions for detecting statistical claims in text */
interface ClaimPattern {
  readonly pattern: RegExp;
  readonly topic: string;
  readonly verificationSource: 'world-bank' | 'scb' | 'both';
  readonly worldBankIndicator?: string;
  readonly scbTableId?: string;
}

/**
 * Patterns for detecting statistical claims in Swedish and English political text.
 * Each pattern maps to a specific topic and data source for verification.
 */
const CLAIM_PATTERNS: readonly ClaimPattern[] = [
  // Unemployment claims
  {
    pattern: /arbetslöshet(?:en)?\s+(?:ligger\s+på|är|uppgår\s+till|(?:har\s+)?(?:sjunkit|ökat|minskat)\s+till)\s+(\d+[,.]?\d*)\s*(?:procent|%)/gi,
    topic: 'unemployment',
    verificationSource: 'both',
    worldBankIndicator: 'SL.UEM.TOTL.ZS',
    scbTableId: 'TAB5765',
  },
  {
    pattern: /unemployment\s+(?:rate\s+)?(?:is|stands?\s+at|(?:has\s+)?(?:fallen|risen|dropped)\s+to)\s+(\d+[,.]?\d*)\s*(?:percent|%)/gi,
    topic: 'unemployment',
    verificationSource: 'both',
    worldBankIndicator: 'SL.UEM.TOTL.ZS',
    scbTableId: 'TAB5765',
  },
  // GDP claims
  {
    pattern: /(?:BNP|bruttonationalprodukt)(?:en)?\s+(?:växer|ökar|krymper|sjunker|har\s+(?:vuxit|ökat|krympt))\s+(?:med\s+)?(\d+[,.]?\d*)\s*(?:procent|%)/gi,
    topic: 'gdp',
    verificationSource: 'both',
    worldBankIndicator: 'NY.GDP.MKTP.KD.ZG',
    scbTableId: 'TAB5802',
  },
  {
    pattern: /GDP\s+(?:growth\s+)?(?:grew|expanded|contracted|shrank)\s+(?:by\s+)?(\d+[,.]?\d*)\s*(?:percent|%)/gi,
    topic: 'gdp',
    verificationSource: 'both',
    worldBankIndicator: 'NY.GDP.MKTP.KD.ZG',
    scbTableId: 'TAB5802',
  },
  // Inflation claims
  {
    pattern: /inflation(?:en)?\s+(?:ligger\s+på|är|uppgår\s+till|(?:har\s+)?(?:sjunkit|ökat)\s+till)\s+(\d+[,.]?\d*)\s*(?:procent|%)/gi,
    topic: 'inflation',
    verificationSource: 'both',
    worldBankIndicator: 'FP.CPI.TOTL.ZG',
  },
  {
    pattern: /inflation\s+(?:rate\s+)?(?:is|stands?\s+at|(?:has\s+)?(?:fallen|risen)\s+to)\s+(\d+[,.]?\d*)\s*(?:percent|%)/gi,
    topic: 'inflation',
    verificationSource: 'both',
    worldBankIndicator: 'FP.CPI.TOTL.ZG',
  },
  // Migration claims
  {
    pattern: /(?:invandring|immigration)(?:en)?\s+(?:ligger\s+på|är|uppgår\s+till|(?:har\s+)?(?:ökat|minskat)\s+till)\s+(\d+[\s,.]?\d*)\s*(?:personer|person|människor)?/gi,
    topic: 'migration',
    verificationSource: 'scb',
    scbTableId: 'TAB637',
  },
  {
    pattern: /immigration\s+(?:stands?\s+at|(?:has\s+)?(?:risen|fallen)\s+to)\s+(\d+[\s,.]?\d*)\s*(?:people|persons?)?/gi,
    topic: 'migration',
    verificationSource: 'scb',
    scbTableId: 'TAB637',
  },
  // Crime statistics claims
  {
    pattern: /(?:brott|brottslighet)(?:en)?\s+(?:har\s+)?(?:ökat|minskat)\s+(?:med\s+)?(\d+[,.]?\d*)\s*(?:procent|%)/gi,
    topic: 'crime',
    verificationSource: 'scb',
    scbTableId: 'TAB1172',
  },
  // Defence spending claims
  {
    pattern: /försvarsutgift(?:er|erna)?\s+(?:ligger\s+på|uppgår\s+till|är)\s+(\d+[,.]?\d*)\s*(?:procent|%)\s*(?:av\s+BNP)?/gi,
    topic: 'defence',
    verificationSource: 'both',
    worldBankIndicator: 'MS.MIL.XPND.GD.ZS',
  },
  {
    pattern: /(?:military|defence|defense)\s+spending\s+(?:is|stands?\s+at)\s+(\d+[,.]?\d*)\s*(?:percent|%)\s*(?:of\s+GDP)?/gi,
    topic: 'defence',
    verificationSource: 'both',
    worldBankIndicator: 'MS.MIL.XPND.GD.ZS',
  },
  // Education spending claims
  {
    pattern: /utbildning(?:sutgifter|sbudget)?\s+(?:uppgår\s+till|är|ligger\s+på)\s+(\d+[,.]?\d*)\s*(?:miljarder|procent|%)/gi,
    topic: 'education',
    verificationSource: 'scb',
    scbTableId: 'TAB4787',
  },
  // Housing claims
  {
    pattern: /bostadsbyggande(?:t)?\s+(?:har\s+)?(?:ökat|minskat)\s+(?:med\s+)?(\d+[,.]?\d*)\s*(?:procent|%|bostäder)/gi,
    topic: 'housing',
    verificationSource: 'scb',
    scbTableId: 'TAB2052',
  },
  // Generic numeric claims with percent
  {
    pattern: /(\d+[,.]?\d*)\s*(?:procent|%)\s+(?:av\s+)?(?:BNP|bruttonationalprodukt)/gi,
    topic: 'gdp-share',
    verificationSource: 'scb',
  },
];

// ---------------------------------------------------------------------------
// Localized headings
// ---------------------------------------------------------------------------

/**
 * Localized section headings for fact-check sections in articles.
 */
export const FACT_CHECK_HEADINGS: Readonly<Record<Language, FactCheckHeadings>> = {
  en: {
    factCheck: 'Fact Check',
    claimVsReality: 'Claim vs. Reality',
    verdict: 'Verdict',
    dataSource: 'Data Source',
  },
  sv: {
    factCheck: 'Faktakoll',
    claimVsReality: 'Påstående kontra verklighet',
    verdict: 'Bedömning',
    dataSource: 'Datakälla',
  },
  da: {
    factCheck: 'Faktatjek',
    claimVsReality: 'Påstand kontra virkelighed',
    verdict: 'Vurdering',
    dataSource: 'Datakilde',
  },
  no: {
    factCheck: 'Faktasjekk',
    claimVsReality: 'Påstand kontra virkelighet',
    verdict: 'Vurdering',
    dataSource: 'Datakilde',
  },
  fi: {
    factCheck: 'Faktatarkistus',
    claimVsReality: 'Väite vastaan todellisuus',
    verdict: 'Arvio',
    dataSource: 'Tietolähde',
  },
  de: {
    factCheck: 'Faktencheck',
    claimVsReality: 'Behauptung vs. Realität',
    verdict: 'Bewertung',
    dataSource: 'Datenquelle',
  },
  fr: {
    factCheck: 'Vérification des faits',
    claimVsReality: 'Affirmation vs. Réalité',
    verdict: 'Verdict',
    dataSource: 'Source des données',
  },
  es: {
    factCheck: 'Verificación de datos',
    claimVsReality: 'Afirmación vs. Realidad',
    verdict: 'Veredicto',
    dataSource: 'Fuente de datos',
  },
  nl: {
    factCheck: 'Feitencontrole',
    claimVsReality: 'Bewering vs. Werkelijkheid',
    verdict: 'Oordeel',
    dataSource: 'Databron',
  },
  ar: {
    factCheck: 'تدقيق الحقائق',
    claimVsReality: 'الادعاء مقابل الواقع',
    verdict: 'الحكم',
    dataSource: 'مصدر البيانات',
  },
  he: {
    factCheck: 'בדיקת עובדות',
    claimVsReality: 'טענה מול מציאות',
    verdict: 'הכרעה',
    dataSource: 'מקור נתונים',
  },
  ja: {
    factCheck: 'ファクトチェック',
    claimVsReality: '主張 vs. 現実',
    verdict: '判定',
    dataSource: 'データソース',
  },
  ko: {
    factCheck: '팩트체크',
    claimVsReality: '주장 대 현실',
    verdict: '판정',
    dataSource: '데이터 출처',
  },
  zh: {
    factCheck: '事实核查',
    claimVsReality: '声称与现实',
    verdict: '判定',
    dataSource: '数据来源',
  },
} as const;

// ---------------------------------------------------------------------------
// Core detection functions
// ---------------------------------------------------------------------------

/**
 * Extract statistical claims from text content (speech, debate transcript, document).
 *
 * Scans for patterns where politicians cite specific numbers related to
 * economic indicators, social statistics, or policy metrics that can be
 * verified against World Bank or SCB data.
 *
 * @param text - Text content to analyze (speech transcript, article, etc.)
 * @param speaker - Optional speaker name
 * @param party - Optional party affiliation
 * @returns Array of detected statistical claims
 */
export function detectStatisticalClaims(
  text: string,
  speaker?: string,
  party?: string,
): StatisticalClaim[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const claims: StatisticalClaim[] = [];
  const seen = new Set<string>();

  for (const claimPattern of CLAIM_PATTERNS) {
    // Reset regex state for each iteration
    const pattern = new RegExp(claimPattern.pattern.source, claimPattern.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const sourceText = match[0];
      // Deduplicate by source text
      const key = `${claimPattern.topic}:${sourceText}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Parse the claimed numeric value
      let claimedValue: number | undefined;
      if (match[1]) {
        const normalized = match[1].replace(/\s/g, '').replace(',', '.');
        claimedValue = parseFloat(normalized);
        if (isNaN(claimedValue)) claimedValue = undefined;
      }

      // Determine unit from context
      const claimedUnit = detectUnit(sourceText);

      claims.push({
        sourceText,
        topic: claimPattern.topic,
        claimedValue,
        claimedUnit,
        speaker,
        party,
        verificationSource: claimPattern.verificationSource,
        worldBankIndicator: claimPattern.worldBankIndicator,
        scbTableId: claimPattern.scbTableId,
      });
    }
  }

  return claims;
}

/**
 * Determine the verdict for a claim based on deviation from official data.
 *
 * @param claimedValue - The value claimed by the politician
 * @param officialValue - The official value from data source
 * @returns Verdict and deviation percentage
 */
export function assessClaim(
  claimedValue: number,
  officialValue: number,
): { verdict: ClaimVerdict; deviationPercent: number } {
  if (officialValue === 0) {
    return {
      verdict: claimedValue === 0 ? 'accurate' : 'unverifiable',
      deviationPercent: claimedValue === 0 ? 0 : 100,
    };
  }

  const deviation = Math.abs(claimedValue - officialValue) / Math.abs(officialValue) * 100;

  if (deviation <= 5) {
    return { verdict: 'accurate', deviationPercent: deviation };
  }
  if (deviation <= 15) {
    return { verdict: 'mostly-accurate', deviationPercent: deviation };
  }
  if (deviation <= 30) {
    return { verdict: 'misleading', deviationPercent: deviation };
  }
  return { verdict: 'inaccurate', deviationPercent: deviation };
}

/**
 * Generate a human-readable explanation for a fact-check result.
 *
 * @param claim - The statistical claim
 * @param officialValue - Official value (if available)
 * @param officialPeriod - Period of official data
 * @param verdict - The assessed verdict
 * @param lang - Language code for localization
 * @returns Explanation string
 */
export function generateExplanation(
  claim: StatisticalClaim,
  officialValue: number | undefined,
  officialPeriod: string | undefined,
  verdict: ClaimVerdict,
  lang: Language | string = 'en',
): string {
  const isSwedish = lang === 'sv';

  if (verdict === 'unverifiable') {
    return isSwedish
      ? `Påståendet om ${claim.topic} kunde inte verifieras mot tillgängliga datakällor.`
      : `The claim about ${claim.topic} could not be verified against available data sources.`;
  }

  if (claim.claimedValue === undefined || officialValue === undefined) {
    return isSwedish
      ? `Kvantitativt påstående om ${claim.topic} detekterat men saknar verifierbart värde.`
      : `Quantitative claim about ${claim.topic} detected but lacks a verifiable value.`;
  }

  const sourceName = claim.verificationSource === 'scb'
    ? 'SCB (Statistics Sweden)'
    : claim.verificationSource === 'world-bank'
      ? 'World Bank'
      : 'SCB / World Bank';

  const period = officialPeriod ? ` (${officialPeriod})` : '';

  const verdictLabels: Record<ClaimVerdict, { en: string; sv: string }> = {
    accurate: { en: 'Accurate', sv: 'Korrekt' },
    'mostly-accurate': { en: 'Mostly accurate', sv: 'I huvudsak korrekt' },
    misleading: { en: 'Misleading', sv: 'Missvisande' },
    inaccurate: { en: 'Inaccurate', sv: 'Felaktigt' },
    unverifiable: { en: 'Unverifiable', sv: 'Ej verifierbart' },
    outdated: { en: 'Outdated data', sv: 'Föråldrade data' },
  };

  const verdictLabel = isSwedish ? verdictLabels[verdict].sv : verdictLabels[verdict].en;

  if (isSwedish) {
    return `${verdictLabel}: Påstått värde ${claim.claimedValue}${claim.claimedUnit ? ' ' + claim.claimedUnit : ''} jämfört med officiellt värde ${officialValue}${period} enligt ${sourceName}.`;
  }

  return `${verdictLabel}: Claimed value ${claim.claimedValue}${claim.claimedUnit ? ' ' + claim.claimedUnit : ''} compared to official value ${officialValue}${period} from ${sourceName}.`;
}

/**
 * Get localized fact-check section heading.
 *
 * @param lang - Language code
 * @param section - Section key
 * @returns Localized heading string
 */
export function getFactCheckHeading(
  lang: Language | string,
  section: keyof FactCheckHeadings,
): string {
  const headings = FACT_CHECK_HEADINGS[lang as Language] ?? FACT_CHECK_HEADINGS.en;
  return headings[section];
}

/**
 * Check if content contains statistical claims worth fact-checking.
 * Quick pre-filter before running full detection.
 *
 * @param content - Text content to check
 * @returns True if content likely contains statistical claims
 */
export function hasStatisticalClaims(content: string): boolean {
  const text = content.toLowerCase();
  const patterns: readonly RegExp[] = [
    /\d+[,.]?\d*\s*(?:procent|percent|%)/i,
    /(?:ökade?|minskade?|sjönk|steg)\s+(?:med|till)\s+\d/i,
    /\b(?:increased?|decreased?|fell|rose|dropped)\s+(?:by|to)\s+\d/i,
    /\barbetslöshet/i,
    /\bunemployment/i,
    /\bBNP\b/i,
    /\bGDP\b/i,
    /\binflation/i,
    /\binvandring/i,
    /\bimmigration\b/i,
    /\bbrott/i,
    /\bcrime\b/i,
    /\bförsvarsutgift/i,
    /\bmilitary\s+spending\b/i,
  ];

  return patterns.some((p) => p.test(text));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Detect the unit of measurement from claim text.
 */
function detectUnit(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/procent|percent|%/.test(lower)) return 'percent';
  if (/miljarder/.test(lower)) return 'billions SEK';
  if (/miljoner/.test(lower)) return 'millions SEK';
  if (/personer|person|människor|people|persons?/.test(lower)) return 'persons';
  if (/bostäder/.test(lower)) return 'housing units';
  return undefined;
}
