/**
 * @module CIA/DataLoader
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * CIA Intelligence Data Loader & Pipeline Orchestrator.
 *
 * Thin orchestrator that wires together the per-domain loaders in `loaders/`
 * with a single `LoadCSV` closure built from `csvBaseURL` + `fallbackURL`.
 * Public API (constructor, static `CSV_SOURCES`, `parseCSV`, `loadCSV`,
 * `load*()` methods, `loadAll`) is preserved for existing consumers
 * (`dashboard-init.ts`, `election-predictions.ts`, `visualizations.ts`).
 *
 * Was originally a 1 300-line monolith; decomposed into focused modules:
 *   - `types.ts`   — DTO interfaces
 *   - `sources.ts` — CSV source URL inventory + Riksdag constants
 *   - `csv-utils.ts` — `parseCSV` / `loadCSV` helpers
 *   - `loaders/*.ts` — one file per domain (10 loaders)
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @version 3.0.0
 * @since 2024
 *
 * @intelligence CIA Platform Data Pipeline Orchestrator — core data acquisition module implementing multi-source intelligence data loading from 19+ CIA product categories. Manages CSV export ingestion and JSON fallback for electoral forecasts. Provides resilient pipeline with local-first strategy and remote fallback.
 *
 * @business Data infrastructure investment — the CIA data pipeline is the foundation for all analytical products. Pipeline reliability directly impacts user experience and platform credibility. Modular architecture enables future data source expansion (European Parliament, Nordic councils).
 *
 * @marketing Data transparency asset — transparent data sourcing (CIA Platform, open government data) builds trust with all audience segments. Data pipeline documentation demonstrates commitment to accuracy and verifiability, key messaging for press and academic audiences.
 */

import type {
  CIADataPayload,
  CSVRow,
  CSVSourceMap,
  CommitteeNetwork,
  DemographicsDashboard,
  DocumentActivityDashboard,
  ElectionAnalysis,
  MinistryDashboard,
  OverviewDashboard,
  PartyPerformance,
  RiskEvolutionDashboard,
  Top10Influential,
  VotingPatterns
} from './types.js';

import {
  COMMITTEE_DOCS_PER_MEETING_ESTIMATE,
  COMMITTEE_ORG_CODES,
  CSV_SOURCES,
  RIKSDAG_PARTIES
} from './sources.js';

import {
  type LoadCSV,
  createLoadCSV,
  loadCSV as loadCSVFn,
  parseCSV as parseCSVFn
} from './csv-utils.js';

import {
  loadCommitteeNetwork,
  loadDemographics,
  loadDocumentActivity,
  loadElectionAnalysis,
  loadMinistryDashboard,
  loadOverviewDashboard,
  loadPartyPerformance,
  loadRiskEvolution,
  loadTop10Influential,
  loadVotingPatterns
} from './loaders/index.js';

/* ------------------------------------------------------------------ */
/*  Backward-compatible re-exports                                    */
/* ------------------------------------------------------------------ */

// Types
export type * from './types.js';

/* ------------------------------------------------------------------ */
/*  CIADataLoader class — thin orchestrator                           */
/* ------------------------------------------------------------------ */

/**
 * Aggregator that delegates per-domain loading to the dedicated modules in
 * `loaders/`. Maintains the original public API so existing callers compile
 * unchanged after the decomposition refactor.
 */
export class CIADataLoader {
  readonly csvBaseURL: string;
  readonly fallbackURL: string;

  /** The 8 parties represented in the Swedish Riksdag. */
  static readonly RIKSDAG_PARTIES: readonly string[] = RIKSDAG_PARTIES;

  /** Mapping of full Swedish committee names to their Riksdag org codes. */
  static readonly COMMITTEE_ORG_CODES: Readonly<Record<string, string>> = COMMITTEE_ORG_CODES;

  /**
   * Heuristic divisor to estimate meetings/year from committee document counts.
   * Assumption: ~25 published documents per active committee meeting.
   */
  static readonly COMMITTEE_DOCS_PER_MEETING_ESTIMATE = COMMITTEE_DOCS_PER_MEETING_ESTIMATE;

  /** CSV data source definitions – maps to real PostgreSQL view exports. */
  static readonly CSV_SOURCES: Readonly<CSVSourceMap> = CSV_SOURCES;

  /** Loader closure bound to this instance's URL configuration. */
  private readonly loadCSVFn: LoadCSV;

  constructor() {
    this.csvBaseURL = '/cia-data/';
    this.fallbackURL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';
    this.loadCSVFn = createLoadCSV(this.csvBaseURL, this.fallbackURL);
  }

  /**
   * Parse CSV text into array of objects using header row as keys.
   * @param csvText - Raw CSV text
   * @returns Parsed rows
   */
  parseCSV(csvText: string): CSVRow[] {
    return parseCSVFn(csvText);
  }

  /**
   * Load CSV with local-first fallback.
   * @param localPath - Path relative to csvBaseURL
   * @param fallbackPath - Optional fallback path
   * @returns Parsed CSV rows
   */
  async loadCSV(localPath: string, fallbackPath?: string): Promise<CSVRow[]> {
    return loadCSVFn(this.csvBaseURL, this.fallbackURL, localPath, fallbackPath);
  }

  /** Build overview dashboard from CSV sources. Replaces overview-dashboard.json. */
  async loadOverviewDashboard(): Promise<OverviewDashboard> {
    return loadOverviewDashboard(this.loadCSVFn);
  }

  /** Build election analysis from CSV sources. Replaces election-analysis.json. */
  async loadElectionAnalysis(): Promise<ElectionAnalysis> {
    return loadElectionAnalysis(this.loadCSVFn);
  }

  /** Build party performance from CSV sources. Replaces party-performance.json. */
  async loadPartyPerformance(): Promise<PartyPerformance> {
    return loadPartyPerformance(this.loadCSVFn);
  }

  /** Build top 10 influential MPs from CSV sources. Replaces top10-influential-mps.json. */
  async loadTop10Influential(): Promise<Top10Influential> {
    return loadTop10Influential(this.loadCSVFn);
  }

  /** Build committee network from CSV sources. Replaces committee-network.json. */
  async loadCommitteeNetwork(): Promise<CommitteeNetwork> {
    return loadCommitteeNetwork(this.loadCSVFn);
  }

  /**
   * Build voting patterns from CSV sources.
   * Uses real coalition alignment data for the agreement matrix when present;
   * otherwise falls back to win-rate similarity.
   */
  async loadVotingPatterns(): Promise<VotingPatterns> {
    return loadVotingPatterns(this.loadCSVFn);
  }

  /** Build ministry dashboard from CSV sources. */
  async loadMinistryDashboard(): Promise<MinistryDashboard> {
    return loadMinistryDashboard(this.loadCSVFn);
  }

  /** Build demographics dashboard from CSV sources. */
  async loadDemographics(): Promise<DemographicsDashboard> {
    return loadDemographics(this.loadCSVFn);
  }

  /** Build document activity dashboard from CSV sources. */
  async loadDocumentActivity(): Promise<DocumentActivityDashboard> {
    return loadDocumentActivity(this.loadCSVFn);
  }

  /** Build risk evolution dashboard from CSV sources. */
  async loadRiskEvolution(): Promise<RiskEvolutionDashboard> {
    return loadRiskEvolution(this.loadCSVFn);
  }

  /**
   * Load all data in parallel.
   * @returns Object with all data
   */
  async loadAll(): Promise<CIADataPayload> {
    const [overview, election, partyPerf, top10, committees, votingPatterns, ministry, demographics, documentActivity, riskEvolution] =
      await Promise.all([
        this.loadOverviewDashboard(),
        this.loadElectionAnalysis(),
        this.loadPartyPerformance(),
        this.loadTop10Influential(),
        this.loadCommitteeNetwork(),
        this.loadVotingPatterns(),
        this.loadMinistryDashboard(),
        this.loadDemographics(),
        this.loadDocumentActivity(),
        this.loadRiskEvolution()
      ]);

    return {
      overview,
      election,
      partyPerf,
      top10,
      committees,
      votingPatterns,
      ministry,
      demographics,
      documentActivity,
      riskEvolution
    };
  }
}
