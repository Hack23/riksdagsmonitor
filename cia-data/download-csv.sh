#!/bin/bash
# Download/Update CIA CSV data files for riksdagsmonitor dashboards
# Source: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data

BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

echo "================================================"
echo "  CIA Data Downloader for Riksdagsmonitor"
echo "================================================"
echo ""
echo "Downloading CSV files from CIA platform..."
echo "Source: $BASE_URL"
echo ""

# Function to download with progress
download_file() {
    local url=$1
    local path=$2
    local category=$3
    
    echo -n "  ⬇️  $(basename $path)... "
    if curl -sL "$url" -o "$path" 2>/dev/null; then
        local size=$(du -h "$path" | cut -f1)
        echo "✅ ($size)"
    else
        echo "❌ Failed"
    fi
}

# Seasonal & Temporal Analysis
echo "📊 Seasonal & Temporal Data"
download_file "$BASE_URL/view_riksdagen_seasonal_anomaly_detection_sample.csv" "seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv"
download_file "$BASE_URL/view_riksdagen_seasonal_activity_patterns_sample.csv" "seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv"
download_file "$BASE_URL/view_riksdagen_voting_anomaly_detection_sample.csv" "voting/view_riksdagen_voting_anomaly_detection_sample.csv"
echo ""

# Election Cycle Analysis
echo "🗳️  Election Cycle Data"
download_file "$BASE_URL/view_riksdagen_election_proximity_trends_sample.csv" "election-cycle/view_riksdagen_election_proximity_trends_sample.csv"
download_file "$BASE_URL/view_election_cycle_comparative_analysis_sample.csv" "election-cycle/view_election_cycle_comparative_analysis_sample.csv"
download_file "$BASE_URL/view_election_cycle_predictive_intelligence_sample.csv" "election-cycle/view_election_cycle_predictive_intelligence_sample.csv"
download_file "$BASE_URL/view_riksdagen_pre_election_quarterly_activity_sample.csv" "election-cycle/view_riksdagen_pre_election_quarterly_activity_sample.csv"
echo ""

# Party Performance
echo "🏛️  Party Performance Data"
download_file "$BASE_URL/distribution_annual_party_votes.csv" "party/distribution_annual_party_votes.csv"
download_file "$BASE_URL/distribution_party_performance.csv" "party/distribution_party_performance.csv"
download_file "$BASE_URL/view_party_performance_metrics_sample.csv" "party/view_party_performance_metrics_sample.csv"
download_file "$BASE_URL/view_party_effectiveness_trends_sample.csv" "party/view_party_effectiveness_trends_sample.csv"
download_file "$BASE_URL/view_riksdagen_party_longitudinal_performance_sample.csv" "party/view_riksdagen_party_longitudinal_performance_sample.csv"
echo ""

# Committee Data
echo "👥 Committee Data"
download_file "$BASE_URL/view_committee_productivity_sample.csv" "committee/view_committee_productivity_sample.csv"
download_file "$BASE_URL/view_committee_productivity_matrix_sample.csv" "committee/view_committee_productivity_matrix_sample.csv"
download_file "$BASE_URL/distribution_committee_productivity_matrix.csv" "committee/distribution_committee_productivity_matrix.csv"
echo ""

# Ministry Data
echo "🏢 Ministry Data"
download_file "$BASE_URL/view_ministry_risk_evolution_sample.csv" "ministry/view_ministry_risk_evolution_sample.csv"
download_file "$BASE_URL/view_ministry_effectiveness_trends_sample.csv" "ministry/view_ministry_effectiveness_trends_sample.csv"
download_file "$BASE_URL/view_ministry_productivity_matrix_sample.csv" "ministry/view_ministry_productivity_matrix_sample.csv"
download_file "$BASE_URL/distribution_ministry_risk_levels.csv" "ministry/distribution_ministry_risk_levels.csv"
echo ""

# Politician Data
echo "👤 Politician Data"
download_file "$BASE_URL/view_politician_risk_summary_sample.csv" "politician/view_politician_risk_summary_sample.csv"
download_file "$BASE_URL/view_politician_behavioral_trends_sample.csv" "politician/view_politician_behavioral_trends_sample.csv"
download_file "$BASE_URL/view_riksdagen_politician_influence_metrics_sample.csv" "politician/view_riksdagen_politician_influence_metrics_sample.csv"
echo ""

# Distribution/Statistical Data
echo "📈 Distribution & Statistical Data"
download_file "$BASE_URL/distribution_decision_trends.csv" "distribution/distribution_decision_trends.csv"
download_file "$BASE_URL/distribution_risk_score_buckets.csv" "distribution/distribution_risk_score_buckets.csv"
download_file "$BASE_URL/distribution_coalition_alignment.csv" "distribution/distribution_coalition_alignment.csv"
echo ""

# Summary
echo "================================================"
echo "✅ Download Complete!"
echo "================================================"
echo ""
echo "Summary:"
file_count=$(find . -name "*.csv" -type f | wc -l)
total_size=$(du -sh . | cut -f1)
echo "  Files: $file_count CSV files"
echo "  Size:  $total_size"
echo ""
echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
