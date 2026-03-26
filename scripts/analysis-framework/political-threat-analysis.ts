/**
 * @module analysis-framework/political-threat-analysis
 * @description PRIDES political threat analysis engine for parliamentary documents.
 *
 * Inspired by ISMS Threat_Modeling.md (STRIDE framework, threat agent classification),
 * adapted for political intelligence analysis of Swedish parliamentary context.
 *
 * ## PRIDES Framework (Political STRIDE Adaptation)
 * | ISMS STRIDE              | Political PRIDES              |
 * |--------------------------|-------------------------------|
 * | Spoofing                 | Polarization                  |
 * | Tampering                | Regulatory Overreach          |
 * | Repudiation              | Institutional Erosion         |
 * | Information Disclosure   | Democratic Deficit            |
 * | Denial of Service        | Economic Disruption           |
 * | Elevation of Privilege   | Societal Impact               |
 *
 * ## Threat Agents
 * - Ruling coalition — Policy agenda risks, power concentration
 * - Opposition parties — Obstruction, populist pressure
 * - External actors — Foreign influence, EU regulatory pressure
 * - Special interests — Lobbying, regulatory capture
 * - Media — Narrative manipulation, selective reporting
 * - Institutional — Bureaucratic inertia, implementation failures
 *
 * The engine is **pure** — deterministic for the same input, no side effects.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../data-transformers/types.js';
import type {
  PoliticalThreatAnalysis,
  PoliticalThreatProfile,
  PridesCategory,
  ThreatAgent,
  ThreatSeverity,
} from './methodology-types.js';

// ---------------------------------------------------------------------------
// Keyword banks per PRIDES category
// ---------------------------------------------------------------------------

/** P — Polarization: Intentional division, misleading rhetoric */
const POLARIZATION_KEYWORDS: readonly string[] = [
  'polarisering', 'splittring', 'oss och dem', 'extremism',
  'hatretorik', 'desinformation', 'propaganda', 'populism',
  'migrationsretorik', 'nationalistisk', 'sverigevänner', 'globalister',
  'polarization', 'division', 'extremism', 'disinformation', 'hate rhetoric',
  'us vs them', 'populist', 'nationalist rhetoric',
];

/** R — Regulatory Overreach: Abuse of legislative power, norm erosion */
const REGULATORY_OVERREACH_KEYWORDS: readonly string[] = [
  'demokratiunderskott', 'maktkoncentration', 'undantag från lagstiftning',
  'kringgå regler', 'undantas granskning', 'överprövar',
  'extraordinary powers', 'bypass parliament', 'circumvent legislation',
  'concentration of power', 'legislative overreach', 'executive overreach',
  'undantagstillstånd', 'nödbefogenheter',
];

/** I — Institutional Erosion: Weakening democratic institutions, accountability gaps */
const INSTITUTIONAL_EROSION_KEYWORDS: readonly string[] = [
  'urholkning', 'försvagning', 'KU-granskning', 'konstitutionsbrott',
  'bristande ansvar', 'accountability gap', 'institutional capture',
  'ansvarslöshet', 'bristande transparens', 'domstolspackning',
  'court packing', 'institutional capture', 'accountability deficit',
  'erosion of institutions', 'democratic backsliding', 'judicial independence',
];

/** D — Democratic Deficit: Lack of transparency, restricted public access */
const DEMOCRATIC_DEFICIT_KEYWORDS: readonly string[] = [
  'offentlighetsprincipen', 'sekretess', 'hemligstämplad', 'begränsad insyn',
  'informationsbegränsning', 'censur', 'pressfrihet', 'yttrandefrihet',
  'transparency', 'freedom of information', 'secrecy', 'censorship',
  'restricted access', 'press freedom', 'freedom of speech',
  'öppenhet', 'transparens', 'insyn', 'offentlighet',
];

/** E — Economic Disruption: Policy-driven economic harm, fiscal irresponsibility */
const ECONOMIC_DISRUPTION_KEYWORDS: readonly string[] = [
  'budgetkris', 'finanskris', 'ekonomisk destabilisering', 'statsbankrutt',
  'skuldkris', 'valutakris', 'inflation spiral', 'hyperinflation',
  'economic crisis', 'fiscal irresponsibility', 'debt crisis', 'budget crisis',
  'economic harm', 'fiscal disruption', 'austerity', 'economic shock',
  'statsfinansiell kris', 'budgetunderskott', 'skuldsättning',
];

/** S — Societal Impact: Disproportionate impact on vulnerable groups, rights erosion */
const SOCIETAL_IMPACT_KEYWORDS: readonly string[] = [
  'marginaliserade', 'utsatta grupper', 'diskriminering', 'rättighetsförlust',
  'ojämlikhet', 'fattigdom', 'barnfattigdom', 'hemlöshet', 'ofärd',
  'vulnerable groups', 'rights erosion', 'discrimination', 'inequality',
  'poverty', 'homelessness', 'marginalized communities', 'social exclusion',
  'grundläggande rättigheter', 'mänskliga rättigheter', 'human rights',
];

// ---------------------------------------------------------------------------
// Threat agent detection
// ---------------------------------------------------------------------------

/** Keywords identifying ruling coalition as threat agent */
const RULING_COALITION_INDICATORS: readonly string[] = [
  'regeringen', 'statsminister', 'finansminister', 'tidöavtal',
  'samarbetspartier', 'SD-stöd', 'alliansen', 'högeralliansen',
  'government', 'prime minister', 'ruling coalition', 'Tidö agreement',
];

/** Keywords identifying opposition parties as threat agent */
const OPPOSITION_INDICATORS: readonly string[] = [
  'opposition', 'oppositionsparti', 'S-ledd', 'vänsterblocket',
  'socialdemokraterna', 'vänsterpartiet', 'miljöpartiet',
  'opposition parties', 'left bloc', 'Social Democrats',
  'riksdagen avslår', 'motarbetar', 'blockerar', 'obstruerar',
];

/** Keywords identifying external actors as threat agent */
const EXTERNAL_ACTOR_INDICATORS: readonly string[] = [
  'EU-kommissionen', 'Bryssel', 'NATO', 'utländsk', 'Putin',
  'Ryssland', 'Kina', 'utländsk inblandning', 'foreign interference',
  'EU directive', 'Brussels', 'foreign actors', 'Russia', 'China',
  'geopolitisk', 'geopolitical',
];

/** Keywords identifying special interests as threat agent */
const SPECIAL_INTEREST_INDICATORS: readonly string[] = [
  'lobbyism', 'lobbying', 'branschintresse', 'särintresse',
  'näringsliv', 'industri', 'arbetsgivarorganisation', 'regulatory capture',
  'corporate influence', 'industry lobby', 'special interests',
  'finansiella intressen', 'partifinansiering',
];

/** Keywords identifying media as threat agent */
const MEDIA_INDICATORS: readonly string[] = [
  'mediabevakning', 'pressfrihet', 'narrativ', 'ryktesspridning',
  'desinformation', 'selektiv rapportering', 'mediaspinn',
  'media narrative', 'misinformation', 'selective reporting',
  'media manipulation', 'spin', 'fake news', 'alternativa fakta',
];

/** Keywords identifying institutional actors as threat agent */
const INSTITUTIONAL_INDICATORS: readonly string[] = [
  'myndighet', 'ämbetsverk', 'byråkrati', 'förvaltning',
  'implementeringsproblem', 'handläggningsproblem', 'processbrist',
  'agency', 'bureaucracy', 'implementation failure', 'administrative',
  'institutional inertia', 'bureaucratic resistance',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDocText(doc: RawDocument): string {
  return [
    doc.titel, doc.rubrik, doc.undertitel, doc.title,
    doc.summary, doc.notis, doc.fullText,
  ].filter(Boolean).join(' ');
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function countMatches(text: string, keywords: readonly string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
}

// ---------------------------------------------------------------------------
// Threat agent detection
// ---------------------------------------------------------------------------

function detectThreatAgents(doc: RawDocument, text: string): ThreatAgent[] {
  const agents: ThreatAgent[] = [];

  // Always include the most relevant institutional actor(s) based on document type
  const docType = doc.doktyp ?? '';
  const committee = doc.organ ?? '';

  if (containsAny(text, RULING_COALITION_INDICATORS) || ['prop', 'skr', 'sou'].includes(docType)) {
    agents.push('ruling-coalition');
  }
  if (containsAny(text, OPPOSITION_INDICATORS) || ['mot', 'ip', 'fr'].includes(docType)) {
    agents.push('opposition-parties');
  }
  if (containsAny(text, EXTERNAL_ACTOR_INDICATORS) || committee === 'UU' || committee === 'FöU') {
    agents.push('external-actors');
  }
  if (containsAny(text, SPECIAL_INTEREST_INDICATORS)) {
    agents.push('special-interests');
  }
  if (containsAny(text, MEDIA_INDICATORS)) {
    agents.push('media');
  }
  if (containsAny(text, INSTITUTIONAL_INDICATORS) || ['bet', 'ds', 'dir'].includes(docType)) {
    agents.push('institutional');
  }

  // Ensure at least one agent is always assigned
  if (agents.length === 0) {
    agents.push('ruling-coalition');
  }

  return [...new Set(agents)]; // deduplicate
}

// ---------------------------------------------------------------------------
// Per-PRIDES-category severity assessment
// ---------------------------------------------------------------------------

function assessPolarizationSeverity(text: string, cia: CIAContext | undefined): ThreatSeverity {
  const matches = countMatches(text, POLARIZATION_KEYWORDS);
  const stability = cia?.coalitionStability?.stabilityScore;
  if (matches >= 3 || (matches >= 2 && stability !== undefined && stability < 40)) return 'high';
  if (matches >= 2) return 'medium';
  if (matches >= 1) return 'low';
  return 'low';
}

function assessRegulatoryOverreachSeverity(text: string): ThreatSeverity {
  const matches = countMatches(text, REGULATORY_OVERREACH_KEYWORDS);
  if (matches >= 3) return 'critical';
  if (matches >= 2) return 'high';
  if (matches >= 1) return 'medium';
  return 'low';
}

function assessInstitutionalErosionSeverity(doc: RawDocument, text: string): ThreatSeverity {
  if (doc.organ === 'KU') return 'high'; // KU is the institutional accountability body
  const matches = countMatches(text, INSTITUTIONAL_EROSION_KEYWORDS);
  if (matches >= 3) return 'critical';
  if (matches >= 2) return 'high';
  if (matches >= 1) return 'medium';
  return 'low';
}

function assessDemocraticDeficitSeverity(doc: RawDocument, text: string): ThreatSeverity {
  const matches = countMatches(text, DEMOCRATIC_DEFICIT_KEYWORDS);
  if (doc.organ === 'KU' && matches >= 2) return 'critical';
  if (matches >= 3) return 'high';
  if (matches >= 2) return 'medium';
  if (matches >= 1) return 'low';
  return 'low';
}

function assessEconomicDisruptionSeverity(doc: RawDocument, text: string, cia: CIAContext | undefined): ThreatSeverity {
  const matches = countMatches(text, ECONOMIC_DISRUPTION_KEYWORDS);
  const stability = cia?.coalitionStability?.stabilityScore;
  if (doc.organ === 'FiU' && matches >= 2) return 'critical';
  if (matches >= 3 || (matches >= 2 && stability !== undefined && stability < 40)) return 'high';
  if (matches >= 2) return 'medium';
  if (matches >= 1) return 'low';
  return 'low';
}

function assessSocietalImpactSeverity(doc: RawDocument, text: string): ThreatSeverity {
  const matches = countMatches(text, SOCIETAL_IMPACT_KEYWORDS);
  const committee = doc.organ ?? '';
  if (new Set(['SoU', 'SfU', 'AU']).has(committee) && matches >= 2) return 'high';
  if (matches >= 3) return 'high';
  if (matches >= 2) return 'medium';
  if (matches >= 1) return 'low';
  return 'low';
}

// ---------------------------------------------------------------------------
// Observable indicator extraction
// ---------------------------------------------------------------------------

function extractIndicators(doc: RawDocument, category: PridesCategory): string[] {
  const indicators: string[] = [];
  const docId = doc.dok_id;

  if (docId) {
    indicators.push(`Parliamentary document ${docId} (${doc.doktyp ?? 'unknown'}) identified as signal`);
  }
  if (doc.speeches && doc.speeches.length > 0) {
    const count = doc.speeches.length;
    indicators.push(`${count} parliamentary speech${count > 1 ? 'es' : ''} associated with this document`);
  }
  if (doc.organ) {
    indicators.push(`Committee involvement: ${doc.organ}`);
  }

  switch (category) {
    case 'polarization':
      indicators.push('Polarising language or divisive framing detected in document text');
      break;
    case 'regulatory-overreach':
      indicators.push('Legislative content suggests concentration of regulatory authority');
      break;
    case 'institutional-erosion':
      if (doc.organ === 'KU') {
        indicators.push('Constitutional Committee (KU) scrutiny indicates accountability concern');
      } else {
        indicators.push('Institutional accountability gaps detected in document analysis');
      }
      break;
    case 'democratic-deficit':
      indicators.push('Transparency or public access concerns identified in document content');
      break;
    case 'economic-disruption':
      indicators.push('Economic policy signals with potential fiscal disruption identified');
      break;
    case 'societal-impact':
      indicators.push('Content affecting vulnerable groups or fundamental rights detected');
      break;
  }

  return indicators;
}

// ---------------------------------------------------------------------------
// Democratic countermeasures
// ---------------------------------------------------------------------------

function getCountermeasures(category: PridesCategory): string[] {
  switch (category) {
    case 'polarization':
      return [
        'Public discourse institutions (SVT, SR) provide balanced media coverage',
        'Civil society organisations and fact-checkers challenge polarising narratives',
        'Cross-party parliamentary dialogue and consensus-seeking culture',
        'Swedish press freedom protections (Tryckfrihetsförordningen)',
      ];
    case 'regulatory-overreach':
      return [
        'Lagrådet (Council on Legislation) reviews proposed laws for constitutionality',
        'Constitutional Committee (KU) scrutinises government exercise of power',
        'Riksdag can vote no-confidence in the government (misstroendevotum)',
        'Ombudsman institutions (JO, JK) investigate complaints against government',
      ];
    case 'institutional-erosion':
      return [
        'Independent judiciary and administrative courts provide institutional check',
        'Parliamentary Ombudsman (JO) investigates institutional maladministration',
        'Riksdag constitutional review through KU provides political accountability',
        'ECHR and EU Charter of Fundamental Rights provide supranational protection',
      ];
    case 'democratic-deficit':
      return [
        'Offentlighetsprincipen (principle of public access) mandates transparency',
        'Data protection authority (IMY) enforces GDPR and privacy rights',
        'Freedom of the press constitutional protections (TF, YGL)',
        'Whistleblower protection legislation safeguards public interest disclosure',
      ];
    case 'economic-disruption':
      return [
        'Independent Riksbank provides monetary policy stabilisation',
        'EU Stability and Growth Pact constrains extreme fiscal departures',
        'Swedish Fiscal Policy Council (Finanspolitiska rådet) monitors fiscal discipline',
        'Cross-party budget framework prevents extreme year-on-year spending changes',
      ];
    case 'societal-impact':
      return [
        'Equality ombudsman (DO) enforces anti-discrimination legislation',
        'Swedish welfare state baseline protections provide safety net',
        'ECHR Article 14 and EU equality law provide rights protection',
        'Parliamentary debate and committee hearings surface societal impact concerns',
      ];
  }
}

// ---------------------------------------------------------------------------
// Rationale builder
// ---------------------------------------------------------------------------

function buildThreatRationale(
  doc: RawDocument,
  category: PridesCategory,
  severity: ThreatSeverity,
  text: string,
): string {
  const docType = doc.doktyp ?? 'document';
  const committee = doc.organ ?? 'unknown';
  const severityLabel = severity.toUpperCase();

  const categoryDescriptions: Readonly<Record<PridesCategory, string>> = {
    'polarization': 'polarising rhetoric and divisive political framing',
    'regulatory-overreach': 'potential abuse of legislative or executive power',
    'institutional-erosion': 'signals of weakening democratic institutions or accountability gaps',
    'democratic-deficit': 'restricted transparency or limited public access to information',
    'economic-disruption': 'policy-driven economic harm or fiscal irresponsibility',
    'societal-impact': 'disproportionate impact on vulnerable groups or rights erosion',
  };

  const description = categoryDescriptions[category];

  const hasContent = (doc.fullText || doc.fullContent || doc.summary) ? 'Full document content available.' : 'Based on metadata signals only.';

  return `${severityLabel} PRIDES threat: ${description} detected in ${docType} document from committee ${committee}. ${hasContent} Document ${doc.dok_id ?? 'unknown'} presents observable signals matching this threat category based on ${text.length > 200 ? 'comprehensive' : 'limited'} text analysis.`;
}

// ---------------------------------------------------------------------------
// Single category analysis
// ---------------------------------------------------------------------------

function analyseSingleCategory(
  doc: RawDocument,
  cia: CIAContext | undefined,
  category: PridesCategory,
  text: string,
): PoliticalThreatAnalysis | null {
  let severity: ThreatSeverity;

  switch (category) {
    case 'polarization':
      severity = assessPolarizationSeverity(text, cia);
      break;
    case 'regulatory-overreach':
      severity = assessRegulatoryOverreachSeverity(text);
      break;
    case 'institutional-erosion':
      severity = assessInstitutionalErosionSeverity(doc, text);
      break;
    case 'democratic-deficit':
      severity = assessDemocraticDeficitSeverity(doc, text);
      break;
    case 'economic-disruption':
      severity = assessEconomicDisruptionSeverity(doc, text, cia);
      break;
    case 'societal-impact':
      severity = assessSocietalImpactSeverity(doc, text);
      break;
  }

  // Only return analysis for threats with at least 'low' detection signal
  // In practice, every category is at minimum 'low' since we detect from doc structure
  // We always return an analysis object (even for 'low') so callers can filter
  const threatAgents = detectThreatAgents(doc, text);

  return {
    pridesCategory: category,
    threatAgents,
    severity,
    indicators: extractIndicators(doc, category),
    countermeasures: getCountermeasures(category),
    rationale: buildThreatRationale(doc, category, severity, text),
  };
}

// ---------------------------------------------------------------------------
// All PRIDES categories
// ---------------------------------------------------------------------------

const ALL_PRIDES_CATEGORIES: readonly PridesCategory[] = [
  'polarization',
  'regulatory-overreach',
  'institutional-erosion',
  'democratic-deficit',
  'economic-disruption',
  'societal-impact',
];

const SEVERITY_ORDER: Readonly<Record<ThreatSeverity, number>> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse a parliamentary document using the PRIDES political threat framework.
 *
 * Applies the ISMS-inspired PRIDES methodology (Political STRIDE adaptation)
 * to identify and characterise threats to democratic governance from the document.
 *
 * The function is **pure** — deterministic for the same input, no side effects.
 *
 * @param doc  - The parliamentary document to analyse
 * @param cia  - Optional CIA context (coalition data improves threat calibration)
 * @returns    Complete PRIDES threat profile
 *
 * @example
 * ```typescript
 * const profile = analysePoliticalThreats(doc, ciaContext);
 * console.log(profile.overallThreatLevel); // 'critical' | 'high' | 'medium' | 'low' | 'none'
 * console.log(profile.primaryThreat);      // dominant PRIDES category
 * ```
 */
export function analysePoliticalThreats(
  doc: RawDocument,
  cia?: CIAContext,
): PoliticalThreatProfile {
  const text = getDocText(doc);

  const threatAnalyses: PoliticalThreatAnalysis[] = ALL_PRIDES_CATEGORIES.map(category =>
    analyseSingleCategory(doc, cia, category, text)
  ).filter((a): a is PoliticalThreatAnalysis => a !== null);

  if (threatAnalyses.length === 0) {
    return {
      threatAnalyses: [],
      primaryThreat: undefined,
      overallThreatLevel: 'none',
      activeThreatAgents: [],
    };
  }

  // Sort by severity descending
  const sorted = [...threatAnalyses].sort(
    (a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0)
  );

  const primaryThreat = sorted[0]?.pridesCategory;
  const overallThreatLevel = sorted[0]?.severity ?? 'none';

  // Deduplicate threat agents across all analyses
  const agentSet = new Set<ThreatAgent>();
  for (const analysis of threatAnalyses) {
    for (const agent of analysis.threatAgents) {
      agentSet.add(agent);
    }
  }

  return {
    threatAnalyses,
    primaryThreat,
    overallThreatLevel,
    activeThreatAgents: [...agentSet],
  };
}

/**
 * Analyse threats for a specific PRIDES category only.
 *
 * Use when you need a targeted threat analysis for a single category
 * rather than the full PRIDES profile.
 *
 * @param doc      - The parliamentary document to analyse
 * @param category - The specific PRIDES category to analyse
 * @param cia      - Optional CIA context
 * @returns        Threat analysis for the specified category, or null if not detectable
 */
export function analyseSinglePridesCategory(
  doc: RawDocument,
  category: PridesCategory,
  cia?: CIAContext,
): PoliticalThreatAnalysis | null {
  const text = getDocText(doc);
  return analyseSingleCategory(doc, cia, category, text);
}
