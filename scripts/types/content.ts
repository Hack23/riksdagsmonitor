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
}
