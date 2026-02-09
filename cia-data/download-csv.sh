#!/bin/bash

# CIA Platform CSV Data Download Script
# 
# Downloads all CIA platform CSV files used by riksdagsmonitor dashboards
# from the official GitHub repository.
#
# Usage: ./download-csv.sh
#
# Author: Hack23 AB
# License: Apache-2.0

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for CIA platform sample data
BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}CIA Platform CSV Data Downloader${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Function to download a file
download_file() {
    local url="$1"
    local output_path="$2"
    local filename=$(basename "$output_path")
    
    echo -e "${YELLOW}Downloading:${NC} $filename"
    
    if curl -L -f -o "$output_path" "$url" 2>/dev/null; then
        local lines=$(wc -l < "$output_path")
        local size=$(du -h "$output_path" | cut -f1)
        echo -e "${GREEN}✓ Downloaded:${NC} $filename ($lines lines, $size)"
        return 0
    else
        echo -e "${RED}✗ Failed:${NC} $filename"
        return 1
    fi
}

# Create directories if they don't exist
mkdir -p pre-election

echo "Downloading Pre-Election Monitoring data..."
echo ""

# Pre-Election Monitoring Files
download_file \
    "$BASE_URL/view_riksdagen_pre_election_quarterly_activity_sample.csv" \
    "pre-election/view_riksdagen_pre_election_quarterly_activity_sample.csv"

download_file \
    "$BASE_URL/view_riksdagen_q4_election_year_comparison_sample.csv" \
    "pre-election/view_riksdagen_q4_election_year_comparison_sample.csv"

echo ""
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}✓ Download Complete${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Show summary
echo "Summary:"
echo "--------"
find . -name "*.csv" -type f -exec echo "  {}" \; | sort
echo ""

# Calculate total size
total_size=$(du -sh . | cut -f1)
total_files=$(find . -name "*.csv" -type f | wc -l)
echo "Total: $total_files CSV files ($total_size)"
echo ""

echo -e "${YELLOW}Note:${NC} These are sample data files for development and demonstration."
echo "The full CIA platform contains complete historical data from 1971-2024."
echo ""
echo -e "${GREEN}✓ All CSV files are ready for use by riksdagsmonitor dashboards.${NC}"
