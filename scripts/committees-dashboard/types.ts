/**
 * @module Analytics/CommitteeIntelligence/Types
 * @description TypeScript type and interface declarations for the Committee Intelligence Dashboard.
 * All interfaces used across the committee dashboard modules are defined here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const d3: any;

 * - Committee effectiveness indicates government functioning
 * - Productivity trends show policy momentum
 * - Coalition control of committees affects policy implementation
 * - Committee conflicts indicate policy disputes
 * 
 * @gdpr Public Committee Records
 * - Committee decisions are public
 * - Member participation public (published records)
 * - Aggregation protects individual privacy
 * - Retention follows parliamentary archive standards
 * 
 * @security Committee Data Integrity
 * - Data sourced from official CIA platform
 * - Timestamps prevent tampering
 * - Checksums validate authenticity
 * - Anomaly detection identifies corruption
 * 
 * @author Hack23 AB (Committee Intelligence & Governance Analytics)
 * @license Apache-2.0
 * @version 2.1.0
 * @since 2024-07-12
 * @see https://d3js.org/ (D3.js Data Visualization)
 * @see https://www.chartjs.org/ (Chart.js Charting)
 * @see https://github.com/Hack23/cia (CIA Platform)
 * @see Issue #111 (Committee Dashboard Enhancement)
 * @see https://www.riksdagen.se/sv/sa-funkar-riksdagen/utskott/ (Committee Information)
 */

/// <reference lib="dom" />

import * as d3 from 'd3';

// Chart.js and Papa Parse are loaded as browser globals via script tags
declare const Chart: any;
declare const Papa: {
  parse(input: string, config?: {
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean;
  }): { data: Record<string, any>[]; errors: { message: string }[] };
};

// ==============================================
// INTERFACES
// ==============================================

export interface CommitteeNameLocalized {
  sv: string;
  en: string;
}

export interface CommitteeDefinition {
  code: string;
  name: string;
  nameLocalized: CommitteeNameLocalized;
  color: string;
  domain: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  prefix: string;
}

export interface DimensionSpec {
  width: number;
  height: number;
}

export interface DimensionsConfig {
  network: DimensionSpec;
  heatmap: DimensionSpec;
  chart: { aspectRatio: number };
}

export interface DataUrlsConfig {
  productivityMatrix: string[];
  committeeDecisions: string[];
  annualDocuments: string[];
  ballotSummary: string[];
  seasonalPatterns: string[];
}

export interface AppConfig {
  dataUrls: DataUrlsConfig;
  cache: CacheConfig;
  committees: CommitteeDefinition[];
  dimensions: DimensionsConfig;
}

export interface ProductivityMatrixRow {
  committee_code?: string;
  year?: string | number;
  productivity_level?: string;
  [key: string]: any;
}

export interface AnnualDocumentRow {
  committee?: string;
  year?: string | number;
  doc_count?: string | number;
  [key: string]: any;
}

export interface SeasonalPatternRow {
  year?: string | number;
  quarter?: string | number;
  median?: string | number;
  total_ballots?: string | number;
  value?: string | number;
  [key: string]: any;
}

export interface CommitteeData {
  productivityMatrix: ProductivityMatrixRow[];
  committeeDecisions: Record<string, any>[];
  annualDocuments: AnnualDocumentRow[];
  ballotSummary: Record<string, any>[];
  seasonalPatterns: SeasonalPatternRow[];
}

export interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  code: string;
  name: string;
  color: string;
  productivity: number;
  decisions: number;
  radius: number;
}

export interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  value: number;
}

export interface HeatMapCell {
  committee: string;
  year: string;
  value: number;
}

export interface HeatMapData {
  matrix: HeatMapCell[];
  years: string[];
  committees: string[];
}

export interface CacheEntry {
  data: Record<string, any>[];
  timestamp: number;
}

