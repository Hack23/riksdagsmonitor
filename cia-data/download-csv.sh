#!/bin/bash
# CIA Platform CSV Data Download Script
# Downloads sample data files from CIA repository for dashboard integration

set -e

BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"
CIA_DATA_DIR="$(dirname "$0")"

echo "📊 Downloading CIA Platform CSV Data Files..."
echo "Source: $BASE_URL"
echo "Destination: $CIA_DATA_DIR"
echo ""

# Party-related files
echo "📥 Downloading extraction summary (single source of truth for stats)..."
curl -s -o "$CIA_DATA_DIR/extraction_summary_report.csv" "$BASE_URL/extraction_summary_report.csv" && echo "  ✓ extraction_summary_report.csv"

echo ""
echo "📥 Downloading Party data..."
curl -s -o "$CIA_DATA_DIR/view_riksdagen_party_summary_sample.csv" "$BASE_URL/view_riksdagen_party_summary_sample.csv" && echo "  ✓ view_riksdagen_party_summary_sample.csv"
curl -s -o "$CIA_DATA_DIR/view_riksdagen_party_role_member_sample.csv" "$BASE_URL/view_riksdagen_party_role_member_sample.csv" && echo "  ✓ view_riksdagen_party_role_member_sample.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_party_performance.csv" "$BASE_URL/distribution_party_performance.csv" && echo "  ✓ distribution_party_performance.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_party_effectiveness_trends.csv" "$BASE_URL/distribution_party_effectiveness_trends.csv" && echo "  ✓ distribution_party_effectiveness_trends.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_party_momentum.csv" "$BASE_URL/distribution_party_momentum.csv" && echo "  ✓ distribution_party_momentum.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_coalition_alignment.csv" "$BASE_URL/distribution_coalition_alignment.csv" && echo "  ✓ distribution_coalition_alignment.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_annual_party_members.csv" "$BASE_URL/distribution_annual_party_members.csv" && echo "  ✓ distribution_annual_party_members.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_gender_by_party.csv" "$BASE_URL/distribution_gender_by_party.csv" && echo "  ✓ distribution_gender_by_party.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_experience_by_party.csv" "$BASE_URL/distribution_experience_by_party.csv" && echo "  ✓ distribution_experience_by_party.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_behavioral_patterns_by_party.csv" "$BASE_URL/distribution_behavioral_patterns_by_party.csv" && echo "  ✓ distribution_behavioral_patterns_by_party.csv"
curl -s -o "$CIA_DATA_DIR/party/distribution_decision_patterns_by_party.csv" "$BASE_URL/distribution_decision_patterns_by_party.csv" && echo "  ✓ distribution_decision_patterns_by_party.csv"

# Voting/Ballot files
echo ""
echo "📥 Downloading Voting data..."
curl -s -o "$CIA_DATA_DIR/voting/distribution_annual_party_votes.csv" "$BASE_URL/distribution_annual_party_votes.csv" && echo "  ✓ distribution_annual_party_votes.csv"
curl -s -o "$CIA_DATA_DIR/voting/distribution_annual_ballots.csv" "$BASE_URL/distribution_annual_ballots.csv" && echo "  ✓ distribution_annual_ballots.csv"
curl -s -o "$CIA_DATA_DIR/voting/distribution_decision_trends.csv" "$BASE_URL/distribution_decision_trends.csv" && echo "  ✓ distribution_decision_trends.csv"

# Committee files
echo ""
echo "📥 Downloading Committee data..."
curl -s -o "$CIA_DATA_DIR/committee/distribution_committee_activity.csv" "$BASE_URL/distribution_committee_activity.csv" && echo "  ✓ distribution_committee_activity.csv"
curl -s -o "$CIA_DATA_DIR/committee/distribution_committee_productivity.csv" "$BASE_URL/distribution_committee_productivity.csv" && echo "  ✓ distribution_committee_productivity.csv"
curl -s -o "$CIA_DATA_DIR/committee/distribution_committee_productivity_matrix.csv" "$BASE_URL/distribution_committee_productivity_matrix.csv" && echo "  ✓ distribution_committee_productivity_matrix.csv"
curl -s -o "$CIA_DATA_DIR/committee/distribution_annual_committee_assignments.csv" "$BASE_URL/distribution_annual_committee_assignments.csv" && echo "  ✓ distribution_annual_committee_assignments.csv"
curl -s -o "$CIA_DATA_DIR/committee/distribution_annual_committee_documents.csv" "$BASE_URL/distribution_annual_committee_documents.csv" && echo "  ✓ distribution_annual_committee_documents.csv"

# Ministry files
echo ""
echo "📥 Downloading Ministry data..."
curl -s -o "$CIA_DATA_DIR/ministry/distribution_ministry_effectiveness.csv" "$BASE_URL/distribution_ministry_effectiveness.csv" && echo "  ✓ distribution_ministry_effectiveness.csv"
curl -s -o "$CIA_DATA_DIR/ministry/distribution_ministry_productivity_matrix.csv" "$BASE_URL/distribution_ministry_productivity_matrix.csv" && echo "  ✓ distribution_ministry_productivity_matrix.csv"
curl -s -o "$CIA_DATA_DIR/ministry/distribution_ministry_decision_impact.csv" "$BASE_URL/distribution_ministry_decision_impact.csv" && echo "  ✓ distribution_ministry_decision_impact.csv"
curl -s -o "$CIA_DATA_DIR/ministry/distribution_annual_ministry_assignments.csv" "$BASE_URL/distribution_annual_ministry_assignments.csv" && echo "  ✓ distribution_annual_ministry_assignments.csv"

# Risk files
echo ""
echo "📥 Downloading Risk assessment data..."
curl -s -o "$CIA_DATA_DIR/risk/distribution_ministry_risk_levels.csv" "$BASE_URL/distribution_ministry_risk_levels.csv" && echo "  ✓ distribution_ministry_risk_levels.csv"
curl -s -o "$CIA_DATA_DIR/risk/distribution_ministry_risk_quarterly.csv" "$BASE_URL/distribution_ministry_risk_quarterly.csv" && echo "  ✓ distribution_ministry_risk_quarterly.csv"
curl -s -o "$CIA_DATA_DIR/risk/distribution_crisis_resilience.csv" "$BASE_URL/distribution_crisis_resilience.csv" && echo "  ✓ distribution_crisis_resilience.csv"

# Anomaly files
echo ""
echo "📥 Downloading Anomaly detection data..."
curl -s -o "$CIA_DATA_DIR/anomaly/distribution_anomaly_by_party.csv" "$BASE_URL/distribution_anomaly_by_party.csv" && echo "  ✓ distribution_anomaly_by_party.csv"

# Election/Seasonal files
echo ""
echo "📥 Downloading Election cycle data..."
curl -s -o "$CIA_DATA_DIR/election/distribution_election_regions.csv" "$BASE_URL/distribution_election_regions.csv" && echo "  ✓ distribution_election_regions.csv"

# Document types
echo ""
echo "📥 Downloading Document type data..."
curl -s -o "$CIA_DATA_DIR/voting/distribution_document_types.csv" "$BASE_URL/distribution_document_types.csv" && echo "  ✓ distribution_document_types.csv"
curl -s -o "$CIA_DATA_DIR/voting/distribution_annual_document_types.csv" "$BASE_URL/distribution_annual_document_types.csv" && echo "  ✓ distribution_annual_document_types.csv"
curl -s -o "$CIA_DATA_DIR/voting/distribution_document_status.csv" "$BASE_URL/distribution_document_status.csv" && echo "  ✓ distribution_document_status.csv"
curl -s -o "$CIA_DATA_DIR/voting/distribution_annual_document_status.csv" "$BASE_URL/distribution_annual_document_status.csv" && echo "  ✓ distribution_annual_document_status.csv"

# Politician distribution files
echo ""
echo "📥 Downloading Politician distribution data..."
curl -s -o "$CIA_DATA_DIR/politician/distribution_experience_levels.csv" "$BASE_URL/distribution_experience_levels.csv" && echo "  ✓ distribution_experience_levels.csv"
curl -s -o "$CIA_DATA_DIR/politician/distribution_assignment_roles.csv" "$BASE_URL/distribution_assignment_roles.csv" && echo "  ✓ distribution_assignment_roles.csv"
curl -s -o "$CIA_DATA_DIR/politician/distribution_influence_buckets.csv" "$BASE_URL/distribution_influence_buckets.csv" && echo "  ✓ distribution_influence_buckets.csv"

# Politician detailed data files
echo ""
echo "📥 Downloading Politician detailed data..."
curl -s -o "$CIA_DATA_DIR/view_riksdagen_politician_sample.csv" "$BASE_URL/view_riksdagen_politician_sample.csv" && echo "  ✓ view_riksdagen_politician_sample.csv"
curl -s -o "$CIA_DATA_DIR/view_riksdagen_politician_experience_summary_sample.csv" "$BASE_URL/view_riksdagen_politician_experience_summary_sample.csv" && echo "  ✓ view_riksdagen_politician_experience_summary_sample.csv"
curl -s -o "$CIA_DATA_DIR/view_riksdagen_party_document_summary_sample.csv" "$BASE_URL/view_riksdagen_party_document_summary_sample.csv" && echo "  ✓ view_riksdagen_party_document_summary_sample.csv"

# Risk assessment detailed view files (replace sparse distribution files)
echo ""
echo "📥 Downloading Risk assessment detailed data..."
curl -s -o "$CIA_DATA_DIR/risk/view_politician_risk_summary_sample.csv" "$BASE_URL/view_politician_risk_summary_sample.csv" && echo "  ✓ view_politician_risk_summary_sample.csv (69KB)"
curl -s -o "$CIA_DATA_DIR/risk/view_ministry_risk_evolution_sample.csv" "$BASE_URL/view_ministry_risk_evolution_sample.csv" && echo "  ✓ view_ministry_risk_evolution_sample.csv"
curl -s -o "$CIA_DATA_DIR/risk/view_risk_score_evolution_sample.csv" "$BASE_URL/view_risk_score_evolution_sample.csv" && echo "  ✓ view_risk_score_evolution_sample.csv"

# Anomaly detection detailed view files
echo ""
echo "📥 Downloading Anomaly detection detailed data..."
curl -s -o "$CIA_DATA_DIR/anomaly/view_riksdagen_voting_anomaly_detection_sample.csv" "$BASE_URL/view_riksdagen_voting_anomaly_detection_sample.csv" && echo "  ✓ view_riksdagen_voting_anomaly_detection_sample.csv"
curl -s -o "$CIA_DATA_DIR/anomaly/view_riksdagen_seasonal_anomaly_detection_sample.csv" "$BASE_URL/view_riksdagen_seasonal_anomaly_detection_sample.csv" && echo "  ✓ view_riksdagen_seasonal_anomaly_detection_sample.csv"
curl -s -o "$CIA_DATA_DIR/anomaly/view_election_cycle_anomaly_pattern_sample.csv" "$BASE_URL/view_election_cycle_anomaly_pattern_sample.csv" && echo "  ✓ view_election_cycle_anomaly_pattern_sample.csv"

# Percentile files for temporal analysis
echo ""
echo "📥 Downloading Percentile temporal analysis data..."
curl -s -o "$CIA_DATA_DIR/percentile/percentile_risk_score_evolution.csv" "$BASE_URL/percentile_risk_score_evolution.csv" && echo "  ✓ percentile_risk_score_evolution.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_voting_anomaly_detection.csv" "$BASE_URL/percentile_voting_anomaly_detection.csv" && echo "  ✓ percentile_voting_anomaly_detection.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_crisis_resilience_indicators.csv" "$BASE_URL/percentile_crisis_resilience_indicators.csv" && echo "  ✓ percentile_crisis_resilience_indicators.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_seasonal_activity_patterns.csv" "$BASE_URL/percentile_seasonal_activity_patterns.csv" && echo "  ✓ percentile_seasonal_activity_patterns.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_seasonal_anomaly_detection.csv" "$BASE_URL/percentile_seasonal_anomaly_detection.csv" && echo "  ✓ percentile_seasonal_anomaly_detection.csv"

# Committee percentile files
echo ""
echo "📥 Downloading Committee percentile data..."
curl -s -o "$CIA_DATA_DIR/percentile/percentile_committee_productivity.csv" "$BASE_URL/percentile_committee_productivity.csv" && echo "  ✓ percentile_committee_productivity.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_committee_productivity_matrix.csv" "$BASE_URL/percentile_committee_productivity_matrix.csv" && echo "  ✓ percentile_committee_productivity_matrix.csv"

# Ministry percentile files
echo ""
echo "📥 Downloading Ministry percentile data..."
curl -s -o "$CIA_DATA_DIR/percentile/percentile_ministry_risk_evolution.csv" "$BASE_URL/percentile_ministry_risk_evolution.csv" && echo "  ✓ percentile_ministry_risk_evolution.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_ministry_effectiveness_trend.csv" "$BASE_URL/percentile_ministry_effectiveness_trend.csv" && echo "  ✓ percentile_ministry_effectiveness_trend.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_ministry_productivity_matrix.csv" "$BASE_URL/percentile_ministry_productivity_matrix.csv" && echo "  ✓ percentile_ministry_productivity_matrix.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_ministry_decision_impact.csv" "$BASE_URL/percentile_ministry_decision_impact.csv" && echo "  ✓ percentile_ministry_decision_impact.csv"

# Party percentile files
echo ""
echo "📥 Downloading Party percentile data..."
curl -s -o "$CIA_DATA_DIR/percentile/percentile_party_performance_metrics.csv" "$BASE_URL/percentile_party_performance_metrics.csv" && echo "  ✓ percentile_party_performance_metrics.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_party_momentum_analysis.csv" "$BASE_URL/percentile_party_momentum_analysis.csv" && echo "  ✓ percentile_party_momentum_analysis.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_party_effectiveness_trends.csv" "$BASE_URL/percentile_party_effectiveness_trends.csv" && echo "  ✓ percentile_party_effectiveness_trends.csv"

# Politician percentile files
echo ""
echo "📥 Downloading Politician percentile data..."
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_risk_summary.csv" "$BASE_URL/percentile_politician_risk_summary.csv" && echo "  ✓ percentile_politician_risk_summary.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_behavioral_trends.csv" "$BASE_URL/percentile_politician_behavioral_trends.csv" && echo "  ✓ percentile_politician_behavioral_trends.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_career_trajectory.csv" "$BASE_URL/percentile_politician_career_trajectory.csv" && echo "  ✓ percentile_politician_career_trajectory.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_decision_pattern.csv" "$BASE_URL/percentile_politician_decision_pattern.csv" && echo "  ✓ percentile_politician_decision_pattern.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_experience_summary.csv" "$BASE_URL/percentile_politician_experience_summary.csv" && echo "  ✓ percentile_politician_experience_summary.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_influence_metrics.csv" "$BASE_URL/percentile_politician_influence_metrics.csv" && echo "  ✓ percentile_politician_influence_metrics.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_longevity_analysis.csv" "$BASE_URL/percentile_politician_longevity_analysis.csv" && echo "  ✓ percentile_politician_longevity_analysis.csv"
curl -s -o "$CIA_DATA_DIR/percentile/percentile_politician_role_evolution.csv" "$BASE_URL/percentile_politician_role_evolution.csv" && echo "  ✓ percentile_politician_role_evolution.csv"

# Election cycle percentile files
echo ""
echo "📥 Downloading Election cycle percentile data..."
curl -s -o "$CIA_DATA_DIR/percentile/percentile_election_proximity_trends.csv" "$BASE_URL/percentile_election_proximity_trends.csv" && echo "  ✓ percentile_election_proximity_trends.csv"

# Committee decision files (additional detailed data)
echo ""
echo "📥 Downloading Committee decision data..."
curl -s -o "$CIA_DATA_DIR/committee/view_riksdagen_committee_decisions_sample.csv" "$BASE_URL/view_riksdagen_committee_decisions_sample.csv" && echo "  ✓ view_riksdagen_committee_decisions_sample.csv"
curl -s -o "$CIA_DATA_DIR/committee/view_riksdagen_committee_ballot_decision_party_summary_sample.csv" "$BASE_URL/view_riksdagen_committee_ballot_decision_party_summary_sample.csv" && echo "  ✓ view_riksdagen_committee_ballot_decision_party_summary_sample.csv"

# Person status distribution
echo ""
echo "📥 Downloading Person status data..."
curl -s -o "$CIA_DATA_DIR/politician/distribution_person_status.csv" "$BASE_URL/distribution_person_status.csv" && echo "  ✓ distribution_person_status.csv"

echo ""
echo "✅ Download complete! Files saved to $CIA_DATA_DIR"
echo "📊 Total files downloaded: 69"
