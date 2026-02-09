#!/bin/bash
# Download CIA CSV data files

BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

echo "Downloading CIA CSV data files..."

# Risk Assessment Files
curl -sS -o distribution_politician_risk_levels.csv "$BASE_URL/distribution_politician_risk_levels.csv"
echo "✓ Downloaded distribution_politician_risk_levels.csv"

curl -sS -o distribution_risk_by_party.csv "$BASE_URL/distribution_risk_by_party.csv"
echo "✓ Downloaded distribution_risk_by_party.csv"

curl -sS -o distribution_risk_score_buckets.csv "$BASE_URL/distribution_risk_score_buckets.csv"
echo "✓ Downloaded distribution_risk_score_buckets.csv"

curl -sS -o percentile_risk_score_evolution.csv "$BASE_URL/percentile_risk_score_evolution.csv"
echo "✓ Downloaded percentile_risk_score_evolution.csv"

# Anomaly Detection Files
curl -sS -o distribution_voting_anomaly_classification.csv "$BASE_URL/distribution_voting_anomaly_classification.csv"
echo "✓ Downloaded distribution_voting_anomaly_classification.csv"

curl -sS -o percentile_voting_anomaly_detection.csv "$BASE_URL/percentile_voting_anomaly_detection.csv"
echo "✓ Downloaded percentile_voting_anomaly_detection.csv"

# Crisis Resilience Files
curl -sS -o distribution_crisis_resilience.csv "$BASE_URL/distribution_crisis_resilience.csv"
echo "✓ Downloaded distribution_crisis_resilience.csv"

# Top 10 Lists
curl -sS -o top10_ethics_concerns.csv "$BASE_URL/top10_ethics_concerns.csv"
echo "✓ Downloaded top10_ethics_concerns.csv"

curl -sS -o top10_electoral_risk.csv "$BASE_URL/top10_electoral_risk.csv"
echo "✓ Downloaded top10_electoral_risk.csv"

echo ""
echo "Download complete! Files saved in cia-data directory."
echo ""
echo "Summary:"
ls -lh *.csv | wc -l | xargs echo "Total CSV files:"
du -sh . | awk '{print "Total size: " $1}'
