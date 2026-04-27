/**
 * @module CIA/Types
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * CIA Intelligence Data Type Definitions.
 *
 * Pure TypeScript interface declarations (DTOs) consumed by the CIA data
 * pipeline (`data-loader.ts`, `loaders/*.ts`) and the visualization layer
 * (`visualizations.ts`). This module is **side-effect free** and contains no
 * runtime logic — it can be imported independently of the HTTP / CSV client
 * code, which keeps the visualization bundle small and lets consumers depend
 * on the data shape without pulling in network code.
 *
 * Originally lived inline in `data-loader.ts`; extracted as part of the
 * monolith decomposition (issue: refactor `data-loader.ts` into focused
 * modules) so each interface can be consumed in isolation.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

/* ------------------------------------------------------------------ */
/*  CSV source map shapes                                             */
/* ------------------------------------------------------------------ */

/** Definition for a single CSV data source mapping. */
export interface CSVSourceDefinition {
  /** Relative path within the csvBaseURL directory. */
  local: string;
  /** Human-readable description of the data product. */
  description: string;
}

/** Map of all known CSV source categories. */
export interface CSVSourceMap {
  personStatus: CSVSourceDefinition;
  riskByParty: CSVSourceDefinition;
  riskLevels: CSVSourceDefinition;
  annualBallots: CSVSourceDefinition;
  crisisResilience: CSVSourceDefinition;
  partyPerformance: CSVSourceDefinition;
  partyMetrics: CSVSourceDefinition;
  partyMomentum: CSVSourceDefinition;
  partyMembers: CSVSourceDefinition;
  influenceMetrics: CSVSourceDefinition;
  riskSummary: CSVSourceDefinition;
  committeeProductivity: CSVSourceDefinition;
  committeeActivity: CSVSourceDefinition;
  partyEffectiveness: CSVSourceDefinition;
  electionForecast: CSVSourceDefinition;
  coalitionScenarios: CSVSourceDefinition;
  coalitionAlignment: CSVSourceDefinition;
  genderByParty: CSVSourceDefinition;
  experienceByParty: CSVSourceDefinition;
  ministryEffectiveness: CSVSourceDefinition;
  annualDocTypes: CSVSourceDefinition;
  decisionTrends: CSVSourceDefinition;
  electionRegions: CSVSourceDefinition;
  governmentRoles: CSVSourceDefinition;
  riskEvolution: CSVSourceDefinition;
  behavioralPatterns: CSVSourceDefinition;
}

/** A single parsed CSV row (header-keyed, auto-typed values). */
export interface CSVRow {
  [key: string]: string | number;
}

/* ── Overview dashboard shapes ── */

export interface KeyMetrics {
  totalMPs: number;
  totalParties: number;
  totalRiskRules: number;
  governmentCoalition: string;
  coalitionSeats: number;
  oppositionSeats: number;
  majorityMargin: number;
}

export interface RiskAlerts {
  critical: number;
  major: number;
  minor: number;
  last90Days: { critical: number; major: number; minor: number };
}

export interface ParliamentActivity {
  votesLastMonth: number;
  documentsProcessed: number;
  motionsSubmitted: number;
  committeeMeetings: number;
}

export interface CoalitionStability {
  stabilityScore: number;
  riskLevel: string;
  defectionProbability: number;
  ideologicalTension: string;
}

export interface DataQuality {
  completeness: number;
  lastDataSync: string;
  coverage: string;
}

export interface OverviewDashboard {
  title: string;
  description: string;
  lastUpdated: string;
  keyMetrics: KeyMetrics;
  riskAlerts: RiskAlerts;
  parliamentActivity: ParliamentActivity;
  coalitionStability: CoalitionStability;
  dataQuality: DataQuality;
  _source: string;
}

/* ── Party performance shapes ── */

export interface PartyMetricsData {
  seats: number;
  voteShare: number;
  memberCount: number;
  documentsAuthored: number;
  motionsSubmitted: number;
  successRate: number;
}

export interface PartyVoting {
  totalVotes: number;
  cohesionScore: number;
  rebellionRate: number;
}

export interface PartyTrends {
  supportTrend: string;
  activityTrend: string;
  performanceLevel: string;
}

export interface PartyEntry {
  id: string;
  partyName: string;
  shortName: string;
  metrics: PartyMetricsData;
  voting: PartyVoting;
  trends: PartyTrends;
  _source: string;
}

export interface PartyPerformance {
  title: string;
  description: string;
  lastUpdated: string;
  parties: PartyEntry[];
  _source: string;
}

/* ── Top-10 shapes ── */

export interface MPRanking {
  rank: number;
  id: string;
  firstName: string;
  lastName: string;
  party: string;
  role: string;
  influenceScore: number;
  networkConnections: number;
  brokerClassification: string;
  riskLevel: string;
  riskScore: number;
  _source: string;
}

export interface Top10Influential {
  title: string;
  description: string;
  lastUpdated: string;
  methodology: string;
  rankings: MPRanking[];
  _source: string;
}

/* ── Committee network shapes ── */

export interface CommitteeEntry {
  id: string;
  name: string;
  memberCount: number;
  influenceScore: number;
  documentsProcessed: number;
  productivityLevel: string;
  meetingsPerYear: number;
  keyIssues: string[];
  _source: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  size: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

export interface CommitteeNetwork {
  title: string;
  description: string;
  lastUpdated: string;
  committees: CommitteeEntry[];
  networkGraph: { nodes: NetworkNode[]; edges: NetworkEdge[] };
  crossCommitteeMPs: unknown[];
  _source: string;
}

/* ── Voting patterns shapes ── */

export interface VotingMatrix {
  labels: string[];
  partyNames: string[];
  agreementMatrix: number[][];
}

export interface RebellionEntry {
  party: string;
  rebellionRate: number;
  trend: string;
}

export interface VotingPatterns {
  title: string;
  description: string;
  lastUpdated: string;
  analysisPeriod: string;
  votingMatrix: VotingMatrix;
  keyIssues: unknown[];
  rebellionTracking: RebellionEntry[];
  _source: string;
}

/* ── Election analysis (JSON model) ── */

export interface ElectionAnalysis {
  forecast: {
    parties: Array<{
      name: string;
      currentSeats: number;
      predictedSeats: number;
      change: number;
      voteShare: number;
      confidenceInterval?: { min: number; max: number };
    }>;
  };
  coalitionScenarios: Array<{
    name: string;
    composition: string[];
    totalSeats: number;
    probability: number;
    majority: boolean;
    riskLevel: string;
  }>;
  keyFactors: string[];
  electionDate?: string;
}

/* ── Ministry dashboard shapes ── */

export interface MinistryEntry {
  name: string;
  effectiveness: string;
  documentsProduced: number;
  governmentBills: number;
  year: number;
  quarter: number;
}

export interface MinistryDashboard {
  title: string;
  description: string;
  lastUpdated: string;
  ministries: MinistryEntry[];
  _source: string;
}

/* ── Demographics shapes ── */

export interface GenderEntry {
  party: string;
  gender: string;
  count: number;
}

export interface ExperienceEntry {
  party: string;
  experienceLevel: string;
  politicianCount: number;
}

export interface DemographicsDashboard {
  title: string;
  description: string;
  lastUpdated: string;
  genderByParty: GenderEntry[];
  experienceByParty: ExperienceEntry[];
  _source: string;
}

/* ── Document activity shapes ── */

export interface DocumentTypeEntry {
  year: number;
  documentType: string;
  docCount: number;
}

export interface DecisionTrendEntry {
  year: number;
  month: number;
  decisionCount: number;
  approvedDecisions: number;
  rejectedDecisions: number;
  approvalRate: number;
}

export interface DocumentActivityDashboard {
  title: string;
  description: string;
  lastUpdated: string;
  documentTypes: DocumentTypeEntry[];
  decisionTrends: DecisionTrendEntry[];
  _source: string;
}

/* ── Risk evolution shapes ── */

export interface RiskEvolutionEntry {
  period: string;
  severity: string;
  politicianCount: number;
  avgRiskScore: number;
}

export interface RiskEvolutionDashboard {
  title: string;
  description: string;
  lastUpdated: string;
  entries: RiskEvolutionEntry[];
  _source: string;
}

/* ── Aggregate payload ── */

export interface CIADataPayload {
  overview: OverviewDashboard;
  election: ElectionAnalysis;
  partyPerf: PartyPerformance;
  top10: Top10Influential;
  committees: CommitteeNetwork;
  votingPatterns: VotingPatterns;
  ministry: MinistryDashboard;
  demographics: DemographicsDashboard;
  documentActivity: DocumentActivityDashboard;
  riskEvolution: RiskEvolutionDashboard;
}
