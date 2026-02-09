#!/bin/bash

# Download CIA Platform CSV Data
# Fetches latest sample data from the CIA repository

set -e

BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

echo "📥 Downloading CIA Platform CSV Data..."
echo ""

# Seasonal Activity Patterns
echo "📊 Seasonal Activity Patterns..."
curl -s -o seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv \
  "${BASE_URL}/view_riksdagen_seasonal_activity_patterns_sample.csv"
echo "✅ Downloaded view_riksdagen_seasonal_activity_patterns_sample.csv ($(wc -l < seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv) lines)"

echo ""
echo "✨ Download complete!"
echo ""
echo "📁 Files downloaded to:"
echo "  - seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv"
echo ""
echo "📊 Total files: 1"
echo "💾 Total size: $(du -sh seasonal/ | cut -f1)"
