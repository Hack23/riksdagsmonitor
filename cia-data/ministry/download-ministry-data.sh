#!/bin/bash

# Download Ministry Dashboard CSV Data
# Downloads all ministry-related CSV files from CIA platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

echo "🎖️ Downloading Ministry Dashboard CSV Data"
echo "============================================="
echo "Source: CIA Platform"
echo "URL: $BASE_URL"
echo "Directory: $SCRIPT_DIR"
echo ""

# Array of files to download
FILES=(
    "distribution_ministry_risk_levels.csv"
    "distribution_ministry_productivity_matrix.csv"
    "distribution_ministry_effectiveness.csv"
    "distribution_ministry_decision_impact.csv"
    "distribution_ministry_risk_quarterly.csv"
    "distribution_annual_ministry_assignments.csv"
    "percentile_ministry_risk_evolution.csv"
    "percentile_ministry_productivity_matrix.csv"
    "percentile_ministry_effectiveness_trend.csv"
    "percentile_ministry_decision_impact.csv"
    "percentile_politician_influence_metrics.csv"
    "view_ministry_risk_evolution_sample.csv"
    "view_ministry_productivity_matrix_sample.csv"
    "view_ministry_effectiveness_trends_sample.csv"
    "view_ministry_decision_impact_sample.csv"
)

SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL=${#FILES[@]}

# Download each file
for file in "${FILES[@]}"; do
    echo -n "Downloading $file... "
    
    if curl -s -f "$BASE_URL/$file" -o "$SCRIPT_DIR/$file"; then
        LINES=$(wc -l < "$SCRIPT_DIR/$file" | tr -d ' ')
        SIZE=$(stat -c%s "$SCRIPT_DIR/$file" 2>/dev/null || stat -f%z "$SCRIPT_DIR/$file" 2>/dev/null || echo "unknown")
        if [ "$SIZE" != "unknown" ]; then
            # Convert bytes to human readable
            if [ "$SIZE" -lt 1024 ]; then
                SIZE="${SIZE}B"
            elif [ "$SIZE" -lt 1048576 ]; then
                SIZE="$((SIZE / 1024))KB"
            else
                SIZE="$((SIZE / 1048576))MB"
            fi
        fi
        echo "✓ ($SIZE, $LINES lines)"
        ((SUCCESS_COUNT++))
    else
        echo "✗ (404 or error)"
        ((FAIL_COUNT++))
    fi
done

echo ""
echo "============================================="
echo "Download Summary:"
echo "  ✓ Success: $SUCCESS_COUNT/$TOTAL files"
if [ $FAIL_COUNT -gt 0 ]; then
    echo "  ✗ Failed: $FAIL_COUNT/$TOTAL files"
fi
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh "$SCRIPT_DIR" 2>/dev/null | cut -f1 || echo "unknown")
echo "Total data size: $TOTAL_SIZE"
echo ""

# Show sample of first file
if [ -f "$SCRIPT_DIR/distribution_ministry_risk_levels.csv" ]; then
    echo "Sample (distribution_ministry_risk_levels.csv):"
    head -3 "$SCRIPT_DIR/distribution_ministry_risk_levels.csv"
    echo ""
fi

echo "✓ Ministry dashboard data updated successfully!"
echo "Files location: $SCRIPT_DIR"
