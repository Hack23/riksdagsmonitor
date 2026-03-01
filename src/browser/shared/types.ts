/**
 * @module Shared/Types
 * @description Core type definitions for Riksdagsmonitor browser modules.
 * Provides shared interfaces for chart configuration, data loading, and dashboard components.

 *
 * @intelligence Intelligence domain type system — canonical data models for political entities (MPs, parties, coalitions, voting records), risk scoring dimensions, and intelligence product schemas. Ensures type-safe data flow from CIA Platform CSV exports through analysis pipelines to visualization output.
 *
 * @business Developer experience investment — strong typing reduces integration bugs, accelerates onboarding for contributors, and makes the API surface self-documenting. Critical for future developer ecosystem (API consumers, plugin authors, third-party integrations).
 *
 * @marketing Technical credibility asset — TypeScript type definitions demonstrate engineering maturity to technical audiences (CTOs, developers, open-source community). Publishable as npm types package for ecosystem growth.
 * */

// ─── Chart Types ─────────────────────────────────────────────────────────────

export interface ThemeColors {
  readonly cyan: string;
  readonly magenta: string;
  readonly yellow: string;
  readonly green: string;
  readonly orange: string;
  readonly purple: string;
  readonly red: string;
  readonly blue: string;
  readonly tooltipBg: string;
  readonly bodyText: string;
  readonly parties: Readonly<Record<string, string>>;
}

export interface Breakpoints {
  readonly mobile: number;
  readonly tablet: number;
  readonly desktop: number;
  readonly large: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: boolean | { duration: number };
  plugins?: Record<string, unknown>;
  scales?: Record<string, unknown>;
}

// ─── Data Loading Types ──────────────────────────────────────────────────────

export interface DataSource {
  /** Primary URL (local/relative) */
  primary: string;
  /** Fallback URLs (remote CDN, GitHub raw, etc.) */
  fallbacks?: string[];
}

export interface LoadOptions {
  /** Cache key for localStorage caching */
  cacheKey?: string;
  /** Cache TTL in milliseconds (default: 7 days) */
  cacheTTL?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Retry backoff in milliseconds (default: 2000) */
  retryBackoff?: number;
  /** Parse as CSV using d3.csvParse (default: false) */
  parseCSV?: boolean;
}

export interface LoadResult<T> {
  data: T;
  source: 'cache' | 'network';
  url: string;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardModule {
  /** Initialize the dashboard, finding its DOM container and loading data */
  init(): Promise<void>;
  /** Optional cleanup/destroy */
  destroy?(): void;
}

export interface DashboardConfig {
  /** CSS selector for the dashboard container */
  containerId: string;
  /** Data sources for the dashboard */
  dataSources: DataSource[];
  /** Whether to show loading state on init */
  showLoading?: boolean;
}

// ─── CSV Row Types ───────────────────────────────────────────────────────────

export interface CSVRow {
  [key: string]: string;
}

// ─── News Article Types ──────────────────────────────────────────────────────

export interface NewsArticleMetadata {
  slug: string;
  date: string;
  type: string;
  languages: string[];
  title: Record<string, string>;
  description: Record<string, string>;
  section: string;
  author: string;
}
