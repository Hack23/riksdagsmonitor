#!/bin/bash

# Download CIA Platform CSV Data
# Fetches latest sample data from the CIA repository

set -e

BASE_URL="https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data"

echo "📥 Downloading CIA Platform CSV Data..."
echo ""

# Seasonal Activity Patterns
echo "📊 Seasonal Activity Patterns..."
curl -sS --fail --location -o seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv \
  "${BASE_URL}/view_riksdagen_seasonal_activity_patterns_sample.csv"

# Basic validation to avoid silently treating HTML error pages as CSV
if [ ! -s seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv ]; then
  echo "❌ Download failed: seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv is empty or missing." >&2
  exit 1
fi

first_line="$(head -n 1 seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv || true)"
if printf '%s\n' "$first_line" | grep -q '^<'; then
  echo "❌ Download failed: seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv appears to contain HTML, not CSV." >&2
  exit 1
fi

if ! printf '%s\n' "$first_line" | grep -q ','; then
  echo "❌ Download failed: seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv does not look like CSV (no comma in header)." >&2
  exit 1
fi

echo "✅ Downloaded view_riksdagen_seasonal_activity_patterns_sample.csv ($(wc -l < seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv) lines)"

echo ""
echo "✨ Download complete!"
echo ""
echo "📁 Files downloaded to:"
echo "  - seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv"
echo ""
echo "📊 Total files: 1"
echo "💾 Total size: $(du -sh seasonal/ | cut -f1)"
