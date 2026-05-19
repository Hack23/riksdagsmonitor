/**
 * @module analysis-reader/types
 * @description Public type definitions for the analysis-reader module —
 * classification, risk, SWOT, threat, stakeholder, significance and
 * synthesis result interfaces, plus the aggregated `DailyAnalysis` shape.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Urgency label for political significance assessment */
export type UrgencyLabel = 'breaking' | 'major' | 'standard' | 'background';

/** Political intelligence classification level */
export type ClassificationLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Editorial priority level */
export type PriorityLevel = 'breaking' | 'major' | 'standard' | 'background';

/** Confidence label for analytical claims */
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

/** Risk level for political assessments */
export type RiskLevel = 'high' | 'elevated' | 'moderate' | 'low';

/** Democratic health assessment label */
export type DemocraticHealthLabel = 'HIGH' | 'MEDIUM' | 'LOW' | 'AT_RISK';

/** Parsed classification results from `classification-results.md` */
export interface ClassificationResult {
  /** Overall classification level */
  level: ClassificationLevel;
  /** Editorial priority */
  priority: PriorityLevel;
  /** Overall confidence in the classification */
  confidence: ConfidenceLabel;
  /** Raw summary text extracted from the markdown */
  summary: string;
  /** Document IDs classified in this analysis */
  documentIds: string[];
  /** Policy domains identified */
  domains: string[];
}

/** Parsed risk assessment from `risk-assessment.md` */
export interface RiskAssessment {
  /** Overall risk level */
  level: RiskLevel;
  /** Key risk factors (parsed bullet list) */
  factors: string[];
  /** Risk indicators (inline ⚠️ tagged items) */
  indicators: string[];
  /** Overall confidence in the risk assessment */
  confidence: ConfidenceLabel;
  /** Raw summary text */
  summary: string;
}

/** Single SWOT entry with confidence and impact */
export interface AnalysisSwotEntry {
  /** Description text */
  text: string;
  /** Confidence level of this entry */
  confidence: ConfidenceLabel;
  /** Relative impact */
  impact?: 'high' | 'medium' | 'low';
  /** Source document IDs */
  sourceDocIds?: string[];
}

/** Parsed SWOT analysis from `swot-analysis.md` */
export interface SwotAnalysisResult {
  /** Subject of the SWOT analysis */
  subject: string;
  strengths: AnalysisSwotEntry[];
  weaknesses: AnalysisSwotEntry[];
  opportunities: AnalysisSwotEntry[];
  threats: AnalysisSwotEntry[];
  /** Additional context note */
  context?: string;
}

/** Parsed threat analysis from `threat-analysis.md` */
export interface ThreatAnalysisResult {
  /** Named threat indicators (🎯 tagged items) */
  indicators: string[];
  /** Democratic health assessment (HIGH/MEDIUM/LOW/AT_RISK) */
  democraticHealth: DemocraticHealthLabel;
  /** Key threat actors */
  actors: string[];
  /** Overall confidence in the threat analysis */
  confidence: ConfidenceLabel;
  /** Raw summary text */
  summary: string;
}

/** Parsed stakeholder perspectives from `stakeholder-perspectives.md` */
export interface StakeholderPerspectivesResult {
  /** Government/coalition perspective summary */
  government: string;
  /** Opposition perspective summary */
  opposition: string;
  /** Citizen perspective summary */
  citizen: string;
  /** Economic perspective summary */
  economic: string;
  /** International perspective summary */
  international: string;
  /** Media/discourse perspective summary */
  media: string;
}

/** Parsed significance scoring from `significance-scoring.md` */
export interface SignificanceScoringResult {
  /** Significance score (0–100) */
  score: number;
  /** Urgency label */
  urgency: UrgencyLabel;
  /** Ranked list of most significant documents */
  topDocuments: Array<{ docId: string; score: number; reason: string }>;
  /** Overall confidence in significance scoring */
  confidence: ConfidenceLabel;
}

/** Parsed synthesis summary from `synthesis-summary.md` */
export interface SynthesisSummaryResult {
  /** Primary narrative direction for the lede */
  narrativeDirection: string;
  /** Key themes identified across all documents */
  keyThemes: string[];
  /** Recommended article focus */
  articleFocus: string;
  /** Forward indicators for "What to Watch Next" */
  forwardIndicators: string[];
  /** When lookback was used, the actual date of the data (YYYY-MM-DD).
   *  `null` when documents match the requested article date exactly. */
  dataFreshness: string | null;
}

/** Complete pre-computed daily analysis for a given date */
export interface DailyAnalysis {
  /** Date of the analysis (YYYY-MM-DD) */
  date: string;
  /** Classification results (from classification-results.md) */
  classification: ClassificationResult | null;
  /** Risk assessment (from risk-assessment.md) */
  riskAssessment: RiskAssessment | null;
  /** SWOT analysis (from swot-analysis.md) */
  swot: SwotAnalysisResult | null;
  /** Threat analysis (from threat-analysis.md) */
  threatAnalysis: ThreatAnalysisResult | null;
  /** Stakeholder perspectives (from stakeholder-perspectives.md) */
  stakeholderPerspectives: StakeholderPerspectivesResult | null;
  /** Significance scoring (from significance-scoring.md) */
  significance: SignificanceScoringResult | null;
  /** Synthesis summary (from synthesis-summary.md) */
  synthesis: SynthesisSummaryResult | null;
  /** Whether any analysis files were found */
  hasAnalysis: boolean;
}
