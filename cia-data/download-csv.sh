#!/bin/bash
#
# CIA Data Download Script
# 
# Downloads all CSV data files from the CIA platform sample data repository
# for use by Riksdagsmonitor dashboards.
#
# Usage: ./download-csv.sh
#
# Author: Hack23 AB
# License: Apache-2.0

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL for CIA sample data
BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CIA Data Download Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to download a file
download_file() {
    local url=$1
    local output=$2
    local description=$3
    
    echo -e "${BLUE}Downloading:${NC} $description"
    if curl -f -s -o "$output" "$url"; then
        local lines=$(wc -l < "$output")
        local size=$(du -h "$output" | cut -f1)
        echo -e "${GREEN}✓ Success:${NC} $size, $lines lines"
    else
        echo -e "${RED}✗ Failed:${NC} $description"
        return 1
    fi
    echo ""
}

# Create directories if they don't exist
mkdir -p election-cycle

echo -e "${BLUE}Downloading Election Cycle Data...${NC}"
echo ""

# Election Cycle CSV files
download_file \
    "$BASE_URL/view_election_cycle_comparative_analysis_sample.csv" \
    "election-cycle/view_election_cycle_comparative_analysis_sample.csv" \
    "Comparative Analysis (1994-2034)"

download_file \
    "$BASE_URL/view_election_cycle_decision_intelligence_sample.csv" \
    "election-cycle/view_election_cycle_decision_intelligence_sample.csv" \
    "Decision Intelligence"

download_file \
    "$BASE_URL/view_election_cycle_predictive_intelligence_sample.csv" \
    "election-cycle/view_election_cycle_predictive_intelligence_sample.csv" \
    "Predictive Intelligence"

download_file \
    "$BASE_URL/view_election_cycle_temporal_trends_sample.csv" \
    "election-cycle/view_election_cycle_temporal_trends_sample.csv" \
    "Temporal Trends"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Download Complete!${NC}"
echo ""
echo "Files downloaded to:"
echo "  - election-cycle/ (4 files)"
echo ""
echo "Total size: $(du -sh . | cut -f1)"
echo ""
echo -e "${BLUE}========================================${NC}"
