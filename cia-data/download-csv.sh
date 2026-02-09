#!/bin/bash

set -euo pipefail

# Download CIA platform sample data files for riksdagsmonitor dashboard
# Base URL for CIA sample data
BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

# Ensure downloads are saved relative to this script's directory (cia-data/)
cd "$(dirname "$0")"

# Function to download and validate HTTP response
download_file() {
  local filename="$1"
  local http_code=$(curl -sS -w "%{http_code}" -o "$filename" "$BASE_URL/$filename")
  
  if [ "$http_code" != "200" ]; then
    echo "✗ Failed to download $filename (HTTP $http_code)"
    rm -f "$filename"
    return 1
  fi
  
  # Check if file contains "404" text (HTML error page)
  if grep -q "404" "$filename" 2>/dev/null; then
    echo "✗ Failed to download $filename (404 Not Found)"
    rm -f "$filename"
    return 1
  fi
  
  echo "✓ Downloaded $filename"
  return 0
}

echo "Downloading CIA risk assessment data..."
echo ""

# Risk Assessment Files
download_file "distribution_politician_risk_levels.csv"
download_file "distribution_risk_by_party.csv"
download_file "distribution_risk_score_buckets.csv"
download_file "percentile_risk_score_evolution.csv"

# Anomaly Detection Files
download_file "distribution_voting_anomaly_classification.csv"
download_file "percentile_voting_anomaly_detection.csv"

# Crisis Resilience Files
download_file "distribution_crisis_resilience.csv"

# Top 10 Lists (may not exist in source repository)
download_file "top10_ethics_concerns.csv" || echo "⚠ top10_ethics_concerns.csv not available in source repository"
download_file "top10_electoral_risk.csv" || echo "⚠ top10_electoral_risk.csv not available in source repository"

echo ""
echo "Download complete! Successfully downloaded files saved in cia-data directory."
echo ""
echo "Summary:"
ls -lh *.csv 2>/dev/null | wc -l | xargs echo "Total CSV files:"
du -sh . | awk '{print "Total size: " $1}'
