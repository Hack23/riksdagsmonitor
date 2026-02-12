#!/bin/bash
# Refresh all CSV files used by dashboard JavaScript files
# Only downloads files that are actually referenced in JS code

set -e
BASE="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"
DIR="$(dirname "$0")"
cd "$DIR"

download() {
  local dir=$1
  local file=$2
  mkdir -p "$dir"
  if curl -sf -o "$dir/$file" "$BASE/$file"; then
    echo "✓ $dir/$file"
  else
    echo "✗ FAILED: $dir/$file"
  fi
}

echo "=== Refreshing dashboard CSV data from CIA ==="
echo ""

# --- Ministry dashboard (js/ministry-dashboard.js) ---
echo "📊 Ministry dashboard..."
download ministry distribution_ministry_risk_levels.csv
download ministry distribution_ministry_productivity_matrix.csv
download ministry distribution_ministry_decision_impact.csv
download ministry distribution_ministry_effectiveness.csv
download ministry distribution_ministry_risk_quarterly.csv
download ministry percentile_politician_influence_metrics.csv
download ministry percentile_ministry_decision_impact.csv
download ministry percentile_ministry_effectiveness_trend.csv
download ministry percentile_ministry_productivity_matrix.csv
download ministry percentile_ministry_risk_evolution.csv
download ministry view_ministry_productivity_matrix_sample.csv
download ministry view_ministry_risk_evolution_sample.csv
download ministry view_ministry_effectiveness_trends_sample.csv
download ministry view_ministry_decision_impact_sample.csv
download ministry distribution_annual_ministry_assignments.csv

# --- Party dashboard (js/party-dashboard.js) ---
echo ""
echo "📊 Party dashboard..."
download party distribution_party_performance.csv
download party distribution_party_effectiveness_trends.csv
download party distribution_party_momentum.csv
download party distribution_coalition_alignment.csv
download party distribution_annual_party_members.csv
download party distribution_annual_party_votes.csv
download party distribution_gender_by_party.csv
download party distribution_experience_by_party.csv
download party distribution_behavioral_patterns_by_party.csv
download party distribution_decision_patterns_by_party.csv
download party view_party_performance_metrics_sample.csv
download party view_party_effectiveness_trends_sample.csv
download party view_riksdagen_party_longitudinal_performance_sample.csv

# --- Coalition dashboard (scripts/coalition-dashboard.js) ---
echo ""
echo "📊 Coalition dashboard..."
download party distribution_coalition_alignment.csv
download parties distribution_behavioral_patterns_by_party.csv
download parties distribution_decision_patterns_by_party.csv
download voting distribution_voting_anomaly_classification.csv
download anomaly distribution_anomaly_by_party.csv
download voting distribution_annual_party_votes.csv

# --- Committees dashboard (scripts/committees-dashboard.js) ---
echo ""
echo "📊 Committees dashboard..."
download . distribution_committee_productivity_matrix.csv
download . view_riksdagen_committee_decisions.csv
download . distribution_annual_committee_documents.csv
download . view_riksdagen_committee_ballot_decision_party_summary.csv
download . percentile_seasonal_activity_patterns.csv
download committee distribution_committee_productivity_matrix.csv
download committee distribution_annual_committee_documents.csv
download committee distribution_committee_activity.csv
download committee distribution_committee_productivity.csv
download committee distribution_annual_committee_assignments.csv
download committee view_committee_productivity_matrix_sample.csv
download committee view_committee_productivity_sample.csv

# --- Anomaly detection dashboard (js/anomaly-detection-dashboard.js) ---
echo ""
echo "📊 Anomaly detection dashboard..."
download seasonal view_riksdagen_seasonal_anomaly_detection_sample.csv

# --- Election cycle dashboard (js/election-cycle-dashboard.js) ---
echo ""
echo "📊 Election cycle dashboard..."
download election-cycle view_election_cycle_comparative_analysis_sample.csv
download election-cycle view_election_cycle_decision_intelligence_sample.csv
download election-cycle view_election_cycle_predictive_intelligence_sample.csv
download election-cycle view_election_cycle_temporal_trends_sample.csv
download election-cycle view_riksdagen_election_proximity_trends_sample.csv
download election-cycle view_riksdagen_pre_election_quarterly_activity_sample.csv

# --- Pre-election dashboard (js/pre-election-dashboard.js) ---
echo ""
echo "📊 Pre-election dashboard..."
download pre-election view_riksdagen_pre_election_quarterly_activity_sample.csv
download pre-election view_riksdagen_q4_election_year_comparison_sample.csv

# --- Seasonal patterns dashboard (js/seasonal-patterns-dashboard.js) ---
echo ""
echo "📊 Seasonal patterns dashboard..."
download seasonal view_riksdagen_seasonal_activity_patterns_sample.csv
download seasonal view_riksdagen_seasonal_quarterly_activity_sample.csv

# --- Politician dashboard (js/politician-dashboard.js) ---
echo ""
echo "📊 Politician dashboard..."
download politician view_politician_risk_summary_sample.csv
download politician view_riksdagen_politician_influence_metrics_sample.csv
download politician view_politician_behavioral_trends_sample.csv
download politician distribution_experience_levels.csv
download politician distribution_influence_buckets.csv
download politician distribution_assignment_roles.csv

# --- Voting data (used by multiple dashboards) ---
echo ""
echo "📊 Voting data..."
download voting distribution_annual_ballots.csv
download voting distribution_decision_trends.csv
download voting distribution_document_types.csv
download voting distribution_annual_document_types.csv
download voting distribution_document_status.csv
download voting distribution_annual_document_status.csv
download voting distribution_anomaly_by_party.csv
download voting view_riksdagen_voting_anomaly_detection_sample.csv

# --- Risk data ---
echo ""
echo "📊 Risk data..."
download risk distribution_crisis_resilience.csv
download risk distribution_ministry_risk_levels.csv
download risk distribution_ministry_risk_quarterly.csv
download . distribution_politician_risk_levels.csv
download . distribution_risk_by_party.csv
download . distribution_risk_score_buckets.csv
download . percentile_risk_score_evolution.csv
download . percentile_voting_anomaly_detection.csv
download . distribution_crisis_resilience.csv
download . distribution_voting_anomaly_classification.csv

# --- Election data ---
echo ""
echo "📊 Election data..."
download election distribution_election_regions.csv

echo ""
echo "=== Done ==="
echo "Total CSV files: $(find . -name '*.csv' | wc -l)"
