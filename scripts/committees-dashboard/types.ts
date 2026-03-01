/**
 * @module Analytics/CommitteeIntelligence/Types
 * @description TypeScript type and interface declarations for the Committee Intelligence Dashboard.
 * All interfaces used across the committee dashboard modules are defined here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */


/// <reference lib="dom" />

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

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

export interface NetworkNode extends SimulationNodeDatum {
  id: string;
  code: string;
  name: string;
  color: string;
  productivity: number;
  decisions: number;
  radius: number;
}

export interface NetworkLink extends SimulationLinkDatum<NetworkNode> {
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

