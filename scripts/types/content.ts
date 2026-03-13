/**
 * @module Types/Content
 * @description Content label and committee name types for multi-language article generation.
 */

/** Breadcrumb navigation labels */
export interface BreadcrumbLabels {
  home: string;
  news: string;
}

/** Footer section labels */
export interface FooterLabelSet {
  sourcesTitle: string;
  dataSources: string;
  generatedBy: string;
  generatedByValue: string;
  analysisTools: string;
  analysisToolsValue: string;
  backToNews: string;
  skipToContent: string;
  themeToDark: string;
  themeToLight: string;
}

/** Localized names for a single committee (English + Swedish) */
export interface CommitteeName {
  en: string;
  sv: string;
}

/** Map from committee code to localized names */
export type CommitteeNameMap = Record<string, CommitteeName>;

/** Full set of content labels used in article body generation */
export interface ContentLabelSet {
  whyMatters: string;
  whyMattersDefault: string;
  keyEvents: string;
  whatToWatch: string;
  latestReports: string;
  noReports: string;
  committee: string;
  document: string;
  reportDefault: string;
  govProps: string;
  noProps: string;
  propDefault: string;
  oppMotions: string;
  noMotions: string;
  author: string;
  party: string;
  motionDefault: string;
  genericContent: string;
  monitorDev: string;
  committeeDebates: string;
  committeeDebatesDesc: (n: number) => string;
  govProposals: string;
  govProposalsDesc: (n: number) => string;
  weekAhead: string;
  committeeReportsTag: string;
  govPropsTag: string;
  oppMotionsTag: string;
  interpellationsTag: string;
  committeeReport: string;
  on: string;
  governmentProposition: string;
  regarding: string;
  referredTo: string;
  motionBy: string;
  parliamentaryMotion: string;
  unknown: string;
  reportsOverview: (n: number) => string;
  reportSignificance: string;
  readFullReport: string;
  propsOverview: (n: number) => string;
  propSignificance: string;
  readFullProp: string;
  motionsOverview: (n: number) => string;
  motionSignificance: string;
  readFullMotion: string;
  policyContext: string;
  filedBy: string;
  /** Label for document publication date (e.g. "Published", "Publicerad") */
  published: string;
  // Analytical section labels
  politicalContext: string;
  policyImplications: string;
  keyTakeaways: string;
  thematicAnalysis: string;
  legislativePipeline: string;
  oppositionStrategy: string;
  coalitionDynamics: string;
  whatThisMeans: string;
  whyItMatters: string;
  committeeBreakdown: (n: number, c: number) => string;
  propsBreakdown: (n: number) => string;
  motionsBreakdown: (n: number) => string;
  // Localized body text labels (avoid hardcoded en/sv fallbacks)
  committeeCountContext: (n: number) => string;
  committeeActivityTakeaway: (committees: string, extra: number) => string;
  committeeMomentumTakeaway: (n: number) => string;
  oppositionStrategyContext: (n: number) => string;
  policyImplicationsContext: (propCount: number, domainCount: number) => string;
  genericOverview: (n: number) => string;
  partyMotionsFiled: (party: string, n: number) => string;
  otherCommittee: string;
  otherDocuments: string;
  policySignificanceTouches: (domains: string) => string;
  policySignificanceGeneric: string;
  processedThisPeriod: string;
  generalMatters: string;
  responsesToProp: string;
  independentMotions: string;
  govEngagement: string;
  twitterLabel1: string;
  twitterLabel2: string;
  jobTitle: string;
  siteDescription: string;
  // Deep Analysis section labels (5W framework)
  deepAnalysis: string;
  deepAnalysisWho: string;
  deepAnalysisWhat: string;
  deepAnalysisWhen: string;
  deepAnalysisWhy: string;
  deepAnalysisWinners: string;
  deepAnalysisImpact: string;
  deepAnalysisConsequences: string;
  deepAnalysisCritical: string;
  deepAnalysisPerspectives: string;
  // SWOT analysis section labels
  swotAnalysis: string;
  swotStrengths: string;
  swotWeaknesses: string;
  swotOpportunities: string;
  swotThreats: string;
  swotContext: string;
  swotImpactHigh: string;
  swotImpactMedium: string;
  swotImpactLow: string;
  // Dashboard section labels
  dashboardTitle: string;
  dashboardSummary: string;
  // Multi-panel dashboard labels
  dashboardPanel: string;
  dashboardInterpretation: string;
  dashboardAiInsights: string;
  dashboardConfidence: string;
  dashboardStakeholder: string;
}
