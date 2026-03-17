/**
 * @module CIA/DataLoader
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * CIA Intelligence Data Loader & Pipeline Orchestrator.
 * Core data acquisition module implementing multi-source intelligence data loading
 * from the Citizen Intelligence Agency (CIA) Platform. Manages CSV export ingestion
 * for 19+ intelligence product categories and JSON fallback for model-generated
 * electoral forecasts. Provides resilient data pipeline with local-first strategy
 * and remote fallback capabilities.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024

 *
 * @intelligence CIA Platform Data Pipeline Orchestrator — core data acquisition module implementing multi-source intelligence data loading from 19+ CIA product categories. Manages CSV export ingestion and JSON fallback for electoral forecasts. Provides resilient pipeline with local-first strategy and remote fallback.
 *
 * @business Data infrastructure investment — the CIA data pipeline is the foundation for all analytical products. Pipeline reliability directly impacts user experience and platform credibility. Modular architecture enables future data source expansion (European Parliament, Nordic councils).
 *
 * @marketing Data transparency asset — transparent data sourcing (CIA Platform, open government data) builds trust with all audience segments. Data pipeline documentation demonstrates commitment to accuracy and verifiability, key messaging for press and academic audiences.
 * */

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
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

/* ------------------------------------------------------------------ */
/*  CIADataLoader class                                               */
/* ------------------------------------------------------------------ */

export class CIADataLoader {
  readonly csvBaseURL: string;
  readonly fallbackURL: string;

  /** The 8 parties represented in the Swedish Riksdag. */
  static readonly RIKSDAG_PARTIES = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];

  /** Mapping of full Swedish committee names to their Riksdag org codes. */
  static readonly COMMITTEE_ORG_CODES: Record<string, string> = {
    'Konstitutionsutskottet': 'KU',
    'Civilutskottet': 'CU',
    'Trafikutskottet': 'TU',
    'Näringsutskottet': 'NU',
    'Miljö- och jordbruksutskottet': 'MJU',
    'Utrikesutskottet': 'UU',
    'Arbetsmarknadsutskottet': 'AU',
    'Socialförsäkringsutskottet': 'SfU',
    'Socialutskottet': 'SoU',
    'Justitieutskottet': 'JuU',
    'Skatteutskottet': 'SkU',
    'EU-nämnden': 'EUN',
    'Kulturutskottet': 'KrU',
    'Utbildningsutskottet': 'UbU',
    'Finansutskottet': 'FiU',
    'Försvarsutskottet': 'FöU',
    'Lagutskottet': 'LU',
    'Bostadsutskottet': 'BoU'
  };

  constructor() {
    this.csvBaseURL = '../cia-data/';
    this.fallbackURL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';
  }

  /** CSV data source definitions – maps to real PostgreSQL view exports. */
  static CSV_SOURCES: CSVSourceMap = {
    personStatus: {
      local: 'distribution_person_status.csv',
      description: 'Active MP counts by status'
    },
    riskByParty: {
      local: 'distribution_risk_by_party.csv',
      description: 'Risk levels per party'
    },
    riskLevels: {
      local: 'distribution_politician_risk_levels.csv',
      description: 'Aggregate risk level distribution'
    },
    annualBallots: {
      local: 'voting/distribution_annual_ballots.csv',
      description: 'Annual ballot/vote counts'
    },
    crisisResilience: {
      local: 'risk/distribution_crisis_resilience.csv',
      description: 'Coalition stability/resilience scores'
    },
    partyPerformance: {
      local: 'party/distribution_party_performance.csv',
      description: 'Party metrics (docs, motions, performance level)'
    },
    partyMetrics: {
      local: 'party/view_party_performance_metrics_sample.csv',
      description: 'Full party metrics with win rate, rebel rate, absence rate'
    },
    partyMomentum: {
      local: 'party/distribution_party_momentum.csv',
      description: 'Party trend direction and stability'
    },
    partyMembers: {
      local: 'party/distribution_annual_party_members.csv',
      description: 'Annual party membership counts'
    },
    influenceMetrics: {
      local: 'politician/view_riksdagen_politician_influence_metrics_sample.csv',
      description: 'MP influence scores and network connections'
    },
    riskSummary: {
      local: 'politician/view_politician_risk_summary_sample.csv',
      description: 'MP risk scores and assessments'
    },
    committeeProductivity: {
      local: 'committee/distribution_committee_productivity.csv',
      description: 'Committee productivity and member counts'
    },
    committeeActivity: {
      local: 'committee/distribution_committee_activity.csv',
      description: 'Committee document counts'
    },
    partyEffectiveness: {
      local: 'party/distribution_party_effectiveness_trends.csv',
      description: 'Party effectiveness trends with win rate'
    },
    electionForecast: {
      local: 'election/election_forecast.csv',
      description: 'Election 2026 seat predictions per party'
    },
    coalitionScenarios: {
      local: 'election/coalition_scenarios.csv',
      description: 'Coalition scenario probability modeling'
    },
    coalitionAlignment: {
      local: 'party/distribution_coalition_alignment.csv',
      description: 'Real party-pair voting alignment rates'
    },
    genderByParty: {
      local: 'party/distribution_gender_by_party.csv',
      description: 'Gender distribution per party'
    },
    experienceByParty: {
      local: 'party/distribution_experience_by_party.csv',
      description: 'Experience levels per party'
    },
    ministryEffectiveness: {
      local: 'ministry/distribution_ministry_effectiveness.csv',
      description: 'Ministry effectiveness assessments'
    },
    annualDocTypes: {
      local: 'voting/distribution_annual_document_types.csv',
      description: 'Annual document type counts'
    },
    decisionTrends: {
      local: 'voting/distribution_decision_trends.csv',
      description: 'Decision approval trends over time'
    },
    electionRegions: {
      local: 'election/distribution_election_regions.csv',
      description: 'MPs per election region'
    },
    governmentRoles: {
      local: 'view_riksdagen_goverment_role_member_sample.csv',
      description: 'Government minister role assignments'
    },
    riskEvolution: {
      local: 'distribution_risk_evolution_temporal.csv',
      description: 'Risk score changes over time'
    },
    behavioralPatterns: {
      local: 'party/distribution_behavioral_patterns_by_party.csv',
      description: 'Behavioral risk patterns per party'
    }
  };

  /**
   * Parse CSV text into array of objects using header row as keys.
   * @param csvText - Raw CSV text
   * @returns Parsed rows
   */
  parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic quoting)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      values.push(current.trim());

      const row: CSVRow = {};
      headers.forEach((h, idx) => {
        const val = values[idx] || '';
        const num = Number(val);
        row[h] = val !== '' && !isNaN(num) ? num : val;
      });
      rows.push(row);
    }
    return rows;
  }

  /**
   * Load CSV with local-first fallback.
   * @param localPath - Path relative to csvBaseURL
   * @param fallbackPath - Optional fallback path
   * @returns Parsed CSV rows
   */
  async loadCSV(localPath: string, fallbackPath?: string): Promise<CSVRow[]> {
    const urls: string[] = [
      `${this.csvBaseURL}${localPath}`
    ];
    if (fallbackPath) {
      urls.push(`${this.fallbackURL}${fallbackPath}`);
    }

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const text = await response.text();
        const rows = this.parseCSV(text);
        if (rows.length > 0) return rows;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn(`Failed to load CSV from ${url}:`, message);
      }
    }

    console.warn(`No data loaded for ${localPath}`);
    return [];
  }

  /**
   * Build overview dashboard from CSV sources.
   * Replaces overview-dashboard.json.
   */
  async loadOverviewDashboard(): Promise<OverviewDashboard> {
    const [personStatus, riskByParty, riskLevels, annualBallots, resilience] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.personStatus.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskByParty.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskLevels.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.annualBallots.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.crisisResilience.local)
    ]);

    // Count active MPs
    const activeRow = personStatus.find(r => r.status === 'Tjänstgörande riksdagsledamot');
    const totalMPs = activeRow ? (activeRow.person_count as number) : 349;

    // Count unique parties from risk data (only real riksdag parties)
    const riksdagParties = CIADataLoader.RIKSDAG_PARTIES;
    const partiesInData = new Set(
      riskByParty.map(r => r.party as string).filter(p => riksdagParties.includes(p))
    );
    const totalParties = partiesInData.size || 8;

    // Risk alerts from risk_by_party
    const highRisk = riskByParty.filter(r => r.risk_level === 'HIGH');
    const medRisk = riskByParty.filter(r => r.risk_level === 'MEDIUM');
    const lowRisk = riskByParty.filter(r => r.risk_level === 'LOW');
    const critical = highRisk.reduce((sum, r) => sum + ((r.politician_count as number) || 0), 0);
    const major = medRisk.reduce((sum, r) => sum + ((r.politician_count as number) || 0), 0);
    const minor = lowRisk.reduce((sum, r) => sum + ((r.politician_count as number) || 0), 0);

    // Total risk rules from risk levels
    const totalRiskRules = riskLevels.length > 0
      ? riskLevels.reduce((sum, r) => sum + ((r.politician_count as number) || 0), 0)
      : 45;

    // Latest year ballot activity
    const latestBallot: CSVRow = annualBallots.length > 0
      ? annualBallots[annualBallots.length - 1]
      : {};

    // Coalition stability from resilience scores (Tidö = M, KD, L, SD)
    const tidoParties = ['M', 'KD', 'L', 'SD'];
    const tidoResilience = resilience.filter(r => tidoParties.includes(r.party as string));
    const avgResilience = tidoResilience.length > 0
      ? Math.round(tidoResilience.reduce((s, r) => s + ((r.avg_resilience_score as number) || 0), 0) / tidoResilience.length)
      : 72;

    return {
      title: 'Swedish Riksdag Overview Dashboard',
      description: 'Live intelligence from CIA PostgreSQL database exports',
      lastUpdated: new Date().toISOString(),
      keyMetrics: {
        totalMPs,
        totalParties,
        totalRiskRules,
        governmentCoalition: 'Tidö Agreement',
        coalitionSeats: 176,
        oppositionSeats: 173,
        majorityMargin: 1
      },
      riskAlerts: {
        critical,
        major,
        minor,
        last90Days: { critical, major, minor }
      },
      parliamentActivity: {
        votesLastMonth: (latestBallot.total_votes as number) || 0,
        documentsProcessed: (latestBallot.unique_ballots as number) || 0,
        motionsSubmitted: 0,
        committeeMeetings: 0
      },
      coalitionStability: {
        stabilityScore: avgResilience,
        riskLevel: avgResilience >= 70 ? 'moderate' : 'high',
        defectionProbability: 100 - avgResilience,
        ideologicalTension: avgResilience < 60 ? 'high' : 'moderate'
      },
      dataQuality: {
        completeness: 98.5,
        lastDataSync: new Date().toISOString(),
        coverage: '50+ years (1971-2026)'
      },
      _source: 'csv'
    };
  }

  /**
   * Build election analysis from CSV sources.
   * Replaces election-analysis.json.
   */
  async loadElectionAnalysis(): Promise<ElectionAnalysis> {
    const [forecastRows, scenarioRows] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.electionForecast.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.coalitionScenarios.local)
    ]);

    const toFiniteNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = Number(value);
        if (Number.isFinite(num)) return num;
      }
      return undefined;
    };

    const toBoolean = (value: unknown): boolean | undefined => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
      }
      return undefined;
    };

    const parties = forecastRows.flatMap(r => {
      const name = String(r.name ?? '').trim();
      const currentSeats = toFiniteNumber(r.currentSeats);
      const predictedSeats = toFiniteNumber(r.predictedSeats);
      const change = toFiniteNumber(r.change);
      const voteShare = toFiniteNumber(r.voteShare);

      if (!name || currentSeats === undefined || predictedSeats === undefined || change === undefined || voteShare === undefined) {
        return [];
      }

      const confidenceMin = toFiniteNumber(r.confidenceMin);
      const confidenceMax = toFiniteNumber(r.confidenceMax);

      return [{
        name,
        currentSeats,
        predictedSeats,
        change,
        voteShare,
        confidenceInterval:
          confidenceMin !== undefined && confidenceMax !== undefined
            ? { min: confidenceMin, max: confidenceMax }
            : undefined
      }];
    });

    const coalitionScenarios = scenarioRows.flatMap(r => {
      const name = String(r.name ?? '').trim();
      const probability = toFiniteNumber(r.probability);
      const totalSeats = toFiniteNumber(r.totalSeats);
      const majority = toBoolean(r.majority);
      const riskLevel = String(r.riskLevel ?? '').trim();
      const composition = String(r.composition ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (
        !name ||
        probability === undefined ||
        totalSeats === undefined ||
        majority === undefined ||
        !riskLevel ||
        composition.length === 0
      ) {
        return [];
      }

      return [{
        name,
        probability,
        composition,
        totalSeats,
        majority,
        riskLevel
      }];
    });

    return {
      forecast: { parties },
      coalitionScenarios,
      keyFactors: [
        'Economic conditions',
        'Immigration policy',
        'Climate change priorities',
        'Healthcare reform',
        'NATO membership impact'
      ],
      electionDate: '2026-09-13'
    };
  }

  /**
   * Build party performance from CSV sources.
   * Replaces party-performance.json.
   */
  async loadPartyPerformance(): Promise<PartyPerformance> {
    const [performance, metrics, momentum] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyPerformance.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyMetrics.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyMomentum.local)
    ]);

    // Only include real riksdag parties
    const riksdagParties = CIADataLoader.RIKSDAG_PARTIES;
    const activePerformance = performance.filter(p => riksdagParties.includes(p.party as string));

    // Build a lookup from the detailed metrics
    const metricsMap: Record<string, CSVRow> = {};
    metrics.forEach(m => {
      if (riksdagParties.includes(m.party as string)) {
        metricsMap[m.party as string] = m;
      }
    });

    // Get latest momentum per party
    const latestMomentum: Record<string, CSVRow> = {};
    momentum
      .filter(m => riksdagParties.includes(m.party as string))
      .forEach(m => {
        const party = m.party as string;
        if (
          !latestMomentum[party] ||
          (m.year as number) > (latestMomentum[party].year as number) ||
          ((m.year as number) === (latestMomentum[party].year as number) &&
            (m.quarter as number) > (latestMomentum[party].quarter as number))
        ) {
          latestMomentum[party] = m;
        }
      });

    // Known seat counts (from 2022 election results)
    const seatMap: Record<string, number> = {
      S: 107, SD: 73, M: 68, C: 24, V: 24, KD: 19, L: 16, MP: 18
    };

    const parties: PartyEntry[] = activePerformance.map(p => {
      const party = p.party as string;
      const m = metricsMap[party] || {};
      const mom = latestMomentum[party] || {};

      return {
        id: party,
        partyName: (p.party_name as string) || party,
        shortName: party,
        metrics: {
          seats: seatMap[party] || 0,
          voteShare: 0,
          memberCount: (p.active_members as number) || 0,
          documentsAuthored: (p.documents_last_year as number) || 0,
          motionsSubmitted: (p.motions_last_year as number) || 0,
          successRate: (m.avg_win_rate as number) || 0
        },
        voting: {
          totalVotes: (m.total_votes_last_year as number) || 0,
          cohesionScore: (m.avg_participation_rate as number) || 0,
          rebellionRate: (m.avg_rebel_rate as number) || 0
        },
        trends: {
          supportTrend: ((mom.trend_direction as string) || 'stable').toLowerCase(),
          activityTrend: ((mom.stability_classification as string) || 'stable').toLowerCase(),
          performanceLevel: (m.performance_level as string) || (p.performance_level as string) || ''
        },
        _source: 'csv'
      };
    });

    // Sort by seats descending
    parties.sort((a, b) => (b.metrics.seats || 0) - (a.metrics.seats || 0));

    return {
      title: 'Party Performance Dashboard',
      description: 'Live party data from CIA PostgreSQL database exports',
      lastUpdated: new Date().toISOString(),
      parties,
      _source: 'csv'
    };
  }

  /**
   * Build top 10 influential MPs from CSV sources.
   * Replaces top10-influential-mps.json.
   */
  async loadTop10Influential(): Promise<Top10Influential> {
    const [influence, riskSummary] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.influenceMetrics.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskSummary.local)
    ]);

    // Build risk lookup by person_id
    const riskMap: Record<string, CSVRow> = {};
    riskSummary.forEach(r => {
      riskMap[r.person_id as string] = r;
    });

    // Sort by network_connections descending, take top 10
    const sorted = [...influence]
      .filter(mp => (mp.network_connections as number) > 0)
      .sort((a, b) => ((b.network_connections as number) || 0) - ((a.network_connections as number) || 0))
      .slice(0, 10);

    const rankings: MPRanking[] = sorted.map((mp, idx) => {
      const risk = riskMap[mp.person_id as string] || {};
      return {
        rank: idx + 1,
        id: String(mp.person_id),
        firstName: (mp.first_name as string) || '',
        lastName: (mp.last_name as string) || '',
        party: (mp.party as string) || '',
        role: (mp.influence_classification as string)
          ? (mp.influence_classification as string)
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/\b\w/g, (c: string) => c.toUpperCase())
          : '',
        influenceScore: (mp.network_connections as number) || 0,
        networkConnections: (mp.network_connections as number) || 0,
        brokerClassification: (mp.broker_classification as string) || '',
        riskLevel: (risk.risk_level as string) || '',
        riskScore: (risk.risk_score as number) || 0,
        _source: 'csv'
      };
    });

    return {
      title: 'Top 10 Most Influential MPs',
      description: 'Network analysis from CIA politician influence metrics view',
      lastUpdated: new Date().toISOString(),
      methodology: 'Ranked by network_connections from view_riksdagen_politician_influence_metrics',
      rankings,
      _source: 'csv'
    };
  }

  /**
   * Build committee network from CSV sources.
   * Replaces committee-network.json.
   * Filters out INACTIVE committees and deduplicates by name.
   */
  async loadCommitteeNetwork(): Promise<CommitteeNetwork> {
    const [productivity, activity] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.committeeProductivity.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.committeeActivity.local)
    ]);

    // Build activity lookup by org code
    const activityMap: Record<string, number> = {};
    activity.forEach(a => {
      activityMap[a.org as string] = (a.document_count as number) || 0;
    });

    // Use class-level committee name-to-org-code mapping
    const nameToOrgCode = CIADataLoader.COMMITTEE_ORG_CODES;

    // Deduplicate committees by name, keeping the entry with the most data
    const bestByName: Record<string, CSVRow> = {};
    productivity.forEach(c => {
      const name = c.committee_name as string;
      if (!name) return;
      const existing = bestByName[name];
      if (!existing || (c.total_documents as number) > (existing.total_documents as number) ||
          ((c.total_documents as number) === (existing.total_documents as number) &&
           (c.total_members as number) > (existing.total_members as number))) {
        bestByName[name] = c;
      }
    });

    // Filter out INACTIVE and zero-member committees; keep only real, active ones
    const committees: CommitteeEntry[] = Object.values(bestByName)
      .filter(c => {
        const name = c.committee_name as string;
        const members = (c.total_members as number) || 0;
        const level = (c.productivity_level as string) || '';
        // Keep committees with either documents or active members, skip generic "Riksdagen"
        return name !== 'Riksdagen' && members > 0 &&
          (level !== 'INACTIVE' || (c.total_documents as number) > 0);
      })
      .map(c => {
        const name = c.committee_name as string;
        const code = nameToOrgCode[name] || name.substring(0, 3).toUpperCase();
        const activityDocs = activityMap[code] || 0;
        return {
          id: code,
          name,
          memberCount: (c.total_members as number) || 0,
          influenceScore: c.docs_per_member
            ? Math.round((c.docs_per_member as number) * 100)
            : 0,
          documentsProcessed: (c.total_documents as number) || activityDocs,
          productivityLevel: (c.productivity_level as string) || '',
          meetingsPerYear: activityDocs > 0 ? Math.round(activityDocs / 25) : 0,
          keyIssues: [(c.productivity_level as string) || 'N/A'],
          _source: 'csv'
        };
      })
      .sort((a, b) => b.documentsProcessed - a.documentsProcessed);

    // Build simple network graph from committees
    const nodes: NetworkNode[] = committees.map(c => ({
      id: c.id,
      name: c.name,
      size: c.influenceScore
    }));

    // Create edges between committees that share similar productivity levels
    const edges: NetworkEdge[] = [];
    for (let i = 0; i < committees.length; i++) {
      for (let j = i + 1; j < committees.length && edges.length < 10; j++) {
        if (
          committees[i].productivityLevel === committees[j].productivityLevel &&
          committees[i].productivityLevel !== 'INACTIVE'
        ) {
          edges.push({
            source: committees[i].id,
            target: committees[j].id,
            weight: Math.min(committees[i].documentsProcessed, committees[j].documentsProcessed),
            type: 'productivity_similarity'
          });
        }
      }
    }

    return {
      title: 'Committee Network Analysis',
      description: 'Committee data from CIA committee productivity view',
      lastUpdated: new Date().toISOString(),
      committees,
      networkGraph: { nodes, edges },
      crossCommitteeMPs: [],
      _source: 'csv'
    };
  }

  /**
   * Build voting patterns from CSV sources.
   * Uses real coalition alignment data for the agreement matrix
   * and party effectiveness trends for win rates.
   */
  async loadVotingPatterns(): Promise<VotingPatterns> {
    const [coalitionAlignment, effectiveness, riskByParty] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.coalitionAlignment.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.partyEffectiveness.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.riskByParty.local)
    ]);

    const riksdagParties = CIADataLoader.RIKSDAG_PARTIES;
    const labels = riksdagParties;
    const partyNames = [
      'Social Democrats', 'Moderates', 'Sweden Democrats', 'Centre',
      'Left', 'Christian Democrats', 'Liberals', 'Green'
    ];

    // Build agreement matrix from real coalition alignment data
    const alignmentLookup: Record<string, number> = {};
    coalitionAlignment
      .filter(r => riksdagParties.includes(r.party1 as string) && riksdagParties.includes(r.party2 as string))
      .forEach(r => {
        const key1 = `${r.party1}:${r.party2}`;
        const key2 = `${r.party2}:${r.party1}`;
        const rate = Math.round(((r.alignment_rate as number) || 0) * 100);
        alignmentLookup[key1] = rate;
        alignmentLookup[key2] = rate;
      });

    // If real alignment data is available, use it; otherwise fall back to effectiveness-based
    const hasAlignmentData = Object.keys(alignmentLookup).length > 0;

    let agreementMatrix: number[][];
    if (hasAlignmentData) {
      agreementMatrix = labels.map(p1 =>
        labels.map(p2 => {
          if (p1 === p2) return 100;
          return alignmentLookup[`${p1}:${p2}`] ?? 50;
        })
      );
    } else {
      // Fallback: build from win rate similarity
      const latestWinRate: Record<string, CSVRow> = {};
      effectiveness
        .filter(e => riksdagParties.includes(e.party as string))
        .forEach(e => {
          const party = e.party as string;
          if (
            !latestWinRate[party] ||
            (e.year as number) > (latestWinRate[party].year as number) ||
            ((e.year as number) === (latestWinRate[party].year as number) &&
              (e.quarter as number) > (latestWinRate[party].quarter as number))
          ) {
            latestWinRate[party] = e;
          }
        });
      agreementMatrix = labels.map(p1 => {
        const wr1 = latestWinRate[p1] ? (latestWinRate[p1].avg_win_rate as number) : 50;
        return labels.map(p2 => {
          if (p1 === p2) return 100;
          const wr2 = latestWinRate[p2] ? (latestWinRate[p2].avg_win_rate as number) : 50;
          return Math.max(0, Math.round(100 - Math.abs(wr1 - wr2)));
        });
      });
    }

    // Rebellion tracking from risk data (HIGH risk ~ rebellious)
    const rebellionTracking: RebellionEntry[] = riksdagParties
      .map(party => {
        const partyRisks = riskByParty.filter(r => r.party === party);
        const highRisk = partyRisks.find(r => r.risk_level === 'HIGH');
        const total = partyRisks.reduce((s, r) => s + ((r.politician_count as number) || 0), 0);
        const highCount = highRisk ? (highRisk.politician_count as number) : 0;
        const rebellionRate = total > 0 ? Math.round((highCount / total) * 100 * 10) / 10 : 0;
        return {
          party,
          rebellionRate,
          trend: rebellionRate > 25 ? 'increasing' : rebellionRate > 15 ? 'stable' : 'decreasing'
        };
      })
      .filter(r => r.rebellionRate > 0);

    return {
      title: 'Voting Patterns Analysis',
      description: hasAlignmentData
        ? 'Real coalition alignment data from CIA voting analysis'
        : 'Derived from CIA party effectiveness trends and risk data',
      lastUpdated: new Date().toISOString(),
      analysisPeriod: '2022-2026',
      votingMatrix: { labels, partyNames, agreementMatrix },
      keyIssues: [],
      rebellionTracking,
      _source: 'csv'
    };
  }

  /**
   * Build ministry dashboard from CSV sources.
   */
  async loadMinistryDashboard(): Promise<MinistryDashboard> {
    const rows = await this.loadCSV(CIADataLoader.CSV_SOURCES.ministryEffectiveness.local);

    const ministries: MinistryEntry[] = rows
      .filter(r => r.ministry_name && (r.documents_produced as number) > 0)
      .map(r => ({
        name: r.ministry_name as string,
        effectiveness: (r.effectiveness_assessment as string) || '',
        documentsProduced: (r.documents_produced as number) || 0,
        governmentBills: (r.government_bills as number) || 0,
        year: (r.year as number) || 0,
        quarter: (r.quarter as number) || 0
      }))
      .sort((a, b) => b.documentsProduced - a.documentsProduced);

    return {
      title: 'Ministry Performance',
      description: 'Ministry effectiveness from CIA database exports',
      lastUpdated: new Date().toISOString(),
      ministries,
      _source: 'csv'
    };
  }

  /**
   * Build demographics dashboard from CSV sources.
   */
  async loadDemographics(): Promise<DemographicsDashboard> {
    const riksdagParties = CIADataLoader.RIKSDAG_PARTIES;
    const [genderRows, experienceRows] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.genderByParty.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.experienceByParty.local)
    ]);

    const genderByParty: GenderEntry[] = genderRows
      .filter(r => riksdagParties.includes(r.party as string))
      .map(r => ({
        party: r.party as string,
        gender: r.gender as string,
        count: (r.count as number) || 0
      }));

    const experienceByParty: ExperienceEntry[] = experienceRows
      .filter(r => riksdagParties.includes(r.party as string))
      .map(r => ({
        party: r.party as string,
        experienceLevel: (r.experience_level as string) || '',
        politicianCount: (r.politician_count as number) || 0
      }));

    return {
      title: 'Parliamentary Demographics',
      description: 'Gender and experience distribution from CIA database exports',
      lastUpdated: new Date().toISOString(),
      genderByParty,
      experienceByParty,
      _source: 'csv'
    };
  }

  /**
   * Build document activity dashboard from CSV sources.
   */
  async loadDocumentActivity(): Promise<DocumentActivityDashboard> {
    const [docTypeRows, decisionRows] = await Promise.all([
      this.loadCSV(CIADataLoader.CSV_SOURCES.annualDocTypes.local),
      this.loadCSV(CIADataLoader.CSV_SOURCES.decisionTrends.local)
    ]);

    const documentTypes: DocumentTypeEntry[] = docTypeRows
      .filter(r => (r.doc_count as number) > 0)
      .map(r => ({
        year: (r.year as number) || 0,
        documentType: (r.document_type as string) || '',
        docCount: (r.doc_count as number) || 0
      }));

    const decisionTrends: DecisionTrendEntry[] = decisionRows
      .filter(r => (r.decision_count as number) > 0)
      .map(r => ({
        year: (r.year as number) || 0,
        month: (r.month as number) || 0,
        decisionCount: (r.decision_count as number) || 0,
        approvedDecisions: (r.approved_decisions as number) || 0,
        rejectedDecisions: (r.rejected_decisions as number) || 0,
        approvalRate: (r.approval_rate as number) || 0
      }));

    return {
      title: 'Parliamentary Document Activity',
      description: 'Document production and decision trends from CIA database exports',
      lastUpdated: new Date().toISOString(),
      documentTypes,
      decisionTrends,
      _source: 'csv'
    };
  }

  /**
   * Build risk evolution dashboard from CSV sources.
   */
  async loadRiskEvolution(): Promise<RiskEvolutionDashboard> {
    const rows = await this.loadCSV(CIADataLoader.CSV_SOURCES.riskEvolution.local);

    const entries: RiskEvolutionEntry[] = rows
      .filter(r => (r.politician_count as number) > 0)
      .map(r => ({
        period: (r.assessment_period as string) || '',
        severity: (r.risk_severity as string) || '',
        politicianCount: (r.politician_count as number) || 0,
        avgRiskScore: (r.avg_risk_score as number) || 0
      }));

    return {
      title: 'Risk Score Evolution',
      description: 'Temporal risk score changes from CIA database exports',
      lastUpdated: new Date().toISOString(),
      entries,
      _source: 'csv'
    };
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
