/**
 * Single source of truth for the canonical schema of every CSV file
 * consumed by a Riksdagsmonitor dashboard.
 *
 * Each entry maps an absolute `/cia-data/...` path to:
 *   - `requiredColumns`: column names that MUST appear in the header
 *     row. Dashboard code is allowed to read ONLY these columns; any
 *     legacy fallback column read is a contract violation.
 *   - `dashboard`: human-readable dashboard slug the CSV belongs to
 *     (used for grouping in test output).
 *   - `minRows`: minimum number of data rows expected (defaults to 1).
 *
 * This contract is enforced from three sides:
 *   1. Build-time vitest contract test
 *      (`tests/cia-csv-contracts.test.ts`) walks the real `cia-data/`
 *      tree and asserts every contract.
 *   2. Runtime validator (`src/browser/cia/csv-validator.ts`) checks
 *      fetched rows against this registry and throws a clear,
 *      visible Error so missing columns surface as an error banner
 *      instead of a silently-empty chart.
 *   3. Cypress contract spec
 *      (`cypress/e2e/dashboards-per-chart/csv-contracts.cy.js`)
 *      re-runs the same assertions against the served preview /
 *      production site, guarding the deploy pipeline.
 *
 * RULE: No legacy column fallbacks. If a CSV producer changes its
 * schema, update this file (and the dashboard code that reads it) in
 * the same commit. Do NOT add `column_a ?? column_b` fallbacks in
 * dashboard rendering code.
 */
export interface CsvContract {
  readonly path: string;
  readonly dashboard: string;
  readonly requiredColumns: readonly string[];
  readonly minRows?: number;
}

export const CSV_CONTRACTS: readonly CsvContract[] = [
  // --------------------------------------------------------------
  // /dashboards/parties.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/party/distribution_party_performance.csv',
    dashboard: 'parties',
    requiredColumns: [
      'party',
      'party_name',
      'active_members',
      'inactive_members',
      'documents_last_year',
      'motions_last_year',
      'propositions_last_year',
      'docs_per_member',
      'performance_level',
    ],
  },
  {
    path: '/cia-data/party/distribution_party_effectiveness_trends.csv',
    dashboard: 'parties',
    requiredColumns: [
      'party',
      'year',
      'quarter',
      'documents_produced',
      'motions_count',
      'active_members',
      'avg_win_rate',
      'effectiveness_assessment',
    ],
  },
  {
    path: '/cia-data/party/distribution_party_momentum.csv',
    dashboard: 'parties',
    requiredColumns: [
      'party',
      'year',
      'quarter',
      'period',
      'participation_rate',
      'momentum',
      'trend_direction',
      'stability_classification',
    ],
  },
  {
    path: '/cia-data/party/distribution_coalition_alignment.csv',
    dashboard: 'parties',
    requiredColumns: [
      'party1',
      'party2',
      'shared_votes',
      'aligned_votes',
      'opposed_votes',
      'alignment_rate',
      'coalition_likelihood',
      'bloc_relationship',
    ],
  },
  {
    path: '/cia-data/party/distribution_annual_party_members.csv',
    dashboard: 'parties',
    requiredColumns: ['year', 'party', 'active_members'],
  },
  // --------------------------------------------------------------
  // /dashboards/coalitions.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/parties/distribution_behavioral_patterns_by_party.csv',
    dashboard: 'coalitions',
    requiredColumns: [
      'party',
      'behavioral_assessment',
      'politician_count',
      'avg_absence_rate',
    ],
  },
  {
    path: '/cia-data/parties/distribution_decision_patterns_by_party.csv',
    dashboard: 'coalitions',
    requiredColumns: [
      'party',
      'committee',
      'decision_year',
      'decision_count',
      'total_decisions',
      'avg_approval_rate',
    ],
  },
  {
    path: '/cia-data/anomaly/distribution_anomaly_by_party.csv',
    dashboard: 'coalitions',
    requiredColumns: [
      'party',
      'anomaly_classification',
      'politician_count',
      'avg_rebellions',
    ],
  },
  // --------------------------------------------------------------
  // /dashboards/committees.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/distribution_committee_productivity_matrix.csv',
    dashboard: 'committees',
    requiredColumns: [
      'committee_code',
      'committee_name',
      'year',
      'quarter',
      'total_documents',
      'active_members',
      'productivity_level',
      'productivity_assessment',
    ],
  },
  {
    path: '/cia-data/distribution_annual_committee_documents.csv',
    dashboard: 'committees',
    requiredColumns: ['year', 'committee', 'doc_count'],
  },
  // --------------------------------------------------------------
  // /dashboards/election-cycle.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/election-cycle/view_election_cycle_comparative_analysis_sample.csv',
    dashboard: 'election-cycle',
    requiredColumns: [
      'year',
      'is_election_year',
      'total_ballots',
      'attendance_rate',
      'avg_yes_rate',
      'documents_produced',
      'motions_filed',
      'proposals_filed',
      'nearest_election_year',
      'years_from_election',
      'election_proximity',
    ],
  },
  {
    path: '/cia-data/election-cycle/view_election_cycle_decision_intelligence_sample.csv',
    dashboard: 'election-cycle',
    requiredColumns: [
      'election_cycle_id',
      'cycle_year',
      'calendar_year',
      'semester',
      'party',
      'total_proposals',
      'approved_proposals',
      'rejected_proposals',
      'avg_approval_rate',
      'decision_effectiveness',
      'temporal_approval_rate',
      'ntile_effectiveness',
      'decision_trend',
      'legislative_momentum',
    ],
  },
  {
    path: '/cia-data/election-cycle/view_election_cycle_predictive_intelligence_sample.csv',
    dashboard: 'election-cycle',
    requiredColumns: [
      'election_cycle_id',
      'cycle_year',
      'calendar_year',
      'semester',
      'risk_forecast_category',
      'politicians_at_risk',
      'avg_risk_score_change',
      'ministries_at_risk',
      'forecast_confidence',
      'predictive_alert_level',
    ],
  },
  {
    path: '/cia-data/election-cycle/view_election_cycle_temporal_trends_sample.csv',
    dashboard: 'election-cycle',
    requiredColumns: [
      'election_cycle_id',
      'cycle_year',
      'calendar_year',
      'semester',
      'is_pre_election_semester',
      'avg_attendance_rate',
      'total_ballots',
      'avg_approval_rate',
      'attendance_trend',
      'overall_performance_score',
    ],
  },
  // --------------------------------------------------------------
  // /dashboards/seasonal-patterns.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv',
    dashboard: 'seasonal-patterns',
    requiredColumns: [
      'year',
      'quarter',
      'is_election_year',
      'election_cycle',
      'total_ballots',
      'active_politicians',
      'attendance_rate',
      'documents_produced',
      'ballot_z_score',
      'doc_z_score',
      'attendance_z_score',
      'base_activity_classification',
      'qoq_ballot_change_pct',
      'seasonal_pattern_classification',
    ],
  },
  // --------------------------------------------------------------
  // /dashboards/pre-election.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/pre-election/view_riksdagen_pre_election_quarterly_activity_sample.csv',
    dashboard: 'pre-election',
    requiredColumns: [
      'year',
      'is_election_year',
      'total_ballots',
      'avg_attendance_rate',
      'avg_win_rate',
      'avg_rebel_rate',
      'total_documents',
      'total_proposals',
      'total_motions',
      'total_new_assignments',
      'avg_party_win_rate',
      'avg_party_absence_rate',
      'party_documents_total',
      'baseline_ballots',
      'baseline_documents',
      'baseline_assignments',
      'ballot_deviation_from_baseline',
      'document_deviation_from_baseline',
      'assignment_deviation_from_baseline',
      'ballot_percent_change_from_baseline',
      'document_percent_change_from_baseline',
      'ballot_z_score',
      'document_z_score',
      'q4_activity_classification',
      'yoy_ballot_change_pct',
    ],
  },
  {
    path: '/cia-data/pre-election/view_riksdagen_q4_election_year_comparison_sample.csv',
    dashboard: 'pre-election',
    requiredColumns: [
      'year',
      'is_election_year',
      'total_ballots',
      'attendance_rate',
      'documents_produced',
      'ballot_deviation_from_baseline',
      'doc_deviation_from_baseline',
      'attendance_deviation_from_baseline',
      'ballot_percent_change',
      'doc_percent_change',
      'q4_pattern',
      'activity_classification',
    ],
  },
  // --------------------------------------------------------------
  // /dashboards/anomaly-detection.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv',
    dashboard: 'anomaly-detection',
    requiredColumns: [
      'year',
      'quarter',
      'is_election_year',
      'total_ballots',
      'active_politicians',
      'attendance_rate',
      'documents_produced',
      'ballot_z_score',
      'doc_z_score',
      'attendance_z_score',
      'activity_classification',
      'anomaly_type',
      'anomaly_direction',
      'max_z_score',
      'anomaly_severity',
    ],
  },
  // --------------------------------------------------------------
  // /dashboards/ministers.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/ministry/distribution_ministry_productivity_matrix.csv',
    dashboard: 'ministers',
    requiredColumns: [
      'ministry_name',
      'year',
      'documents_produced',
      'propositions',
      'government_bills',
      'unique_contributors',
      'performance_assessment',
    ],
  },
  {
    path: '/cia-data/ministry/distribution_ministry_risk_levels.csv',
    dashboard: 'ministers',
    requiredColumns: ['risk_level', 'period_count', 'percentage', 'avg_documents'],
  },
  {
    path: '/cia-data/ministry/distribution_ministry_decision_impact.csv',
    dashboard: 'ministers',
    requiredColumns: [
      'ministry_code',
      'committee',
      'decision_type',
      'total_proposals',
      'approved_proposals',
      'rejected_proposals',
      'approval_rate',
    ],
  },
  {
    path: '/cia-data/ministry/distribution_ministry_effectiveness.csv',
    dashboard: 'ministers',
    requiredColumns: [
      'ministry_name',
      'year',
      'quarter',
      'documents_produced',
      'government_bills',
      'active_members',
      'effectiveness_assessment',
    ],
  },
  {
    path: '/cia-data/ministry/distribution_ministry_risk_quarterly.csv',
    dashboard: 'ministers',
    requiredColumns: ['year', 'quarter', 'risk_level', 'ministry_count', 'avg_documents'],
  },
  {
    path: '/cia-data/politician/view_riksdagen_politician_influence_metrics_sample.csv',
    dashboard: 'ministers',
    requiredColumns: [
      'person_id',
      'first_name',
      'last_name',
      'party',
      'network_connections',
      'network_median',
      'influence_classification',
      'broker_classification',
      'influence_assessment',
    ],
  },
  {
    path: '/cia-data/ministry/view_ministry_productivity_matrix_sample.csv',
    dashboard: 'ministers',
    requiredColumns: [
      'org_code',
      'name',
      'year',
      'documents_produced',
      'propositions',
      'government_bills',
      'unique_contributors',
      'avg_documents',
      'productivity_quartile',
      'performance_assessment',
    ],
  },
  {
    path: '/cia-data/ministry/view_ministry_risk_evolution_sample.csv',
    dashboard: 'ministers',
    requiredColumns: [
      'org_code',
      'name',
      'assessment_period',
      'year',
      'quarter',
      'documents_produced',
      'legislative_count',
      'active_members',
      'document_trend',
      'risk_level',
      'risk_assessment',
    ],
  },
  // --------------------------------------------------------------
  // /dashboards/risk.html
  // --------------------------------------------------------------
  {
    path: '/cia-data/politician/view_politician_risk_summary_sample.csv',
    dashboard: 'risk',
    requiredColumns: [
      'person_id',
      'first_name',
      'last_name',
      'party',
      'status',
      'total_violations',
      'risk_score',
      'risk_level',
      'risk_assessment',
    ],
  },
  // --------------------------------------------------------------
  // /dashboard/index.html — CIA hub
  // --------------------------------------------------------------
  {
    path: '/cia-data/election/election_forecast.csv',
    dashboard: 'cia-hub',
    requiredColumns: [
      'id',
      'name',
      'currentSeats',
      'predictedSeats',
      'change',
      'voteShare',
      'confidenceMin',
      'confidenceMax',
    ],
  },
  {
    path: '/cia-data/election/coalition_scenarios.csv',
    dashboard: 'cia-hub',
    requiredColumns: [
      'name',
      'probability',
      'composition',
      'totalSeats',
      'majority',
      'riskLevel',
    ],
  },
];

/**
 * Look up the contract for a given absolute `/cia-data/...` path.
 * Returns `null` when no contract is registered (e.g. an export
 * that is not yet wired into a dashboard).
 */
export function getCsvContract(path: string): CsvContract | null {
  return CSV_CONTRACTS.find((c) => c.path === path) ?? null;
}

/**
 * All contracts grouped by dashboard slug, useful for iterating
 * per-dashboard in tests.
 */
export function contractsByDashboard(): Record<string, readonly CsvContract[]> {
  const out: Record<string, CsvContract[]> = {};
  for (const c of CSV_CONTRACTS) {
    if (!out[c.dashboard]) out[c.dashboard] = [];
    out[c.dashboard].push(c);
  }
  return out;
}
