#!/bin/bash
# CIA Platform CSV Data Validation Script
# Validates encoding, structure, and data quality of downloaded CSV files

set -e

CIA_DATA_DIR="$(dirname "$0")"
ERRORS=0
WARNINGS=0
VALIDATED=0

echo "🔍 CIA Platform CSV Data Validation"
echo "===================================="
echo ""

# Function to check file encoding (accept UTF-8 or ASCII)
check_encoding() {
  local file="$1"
  if file "$file" | grep -qE "UTF-8|ASCII"; then
    return 0
  else
    echo "  ❌ ERROR: Unknown encoding: $(file -b "$file")"
    return 1
  fi
}

# Function to check CSV structure
check_csv_structure() {
  local file="$1"
  local lines=$(wc -l < "$file")
  
  if [ "$lines" -lt 2 ]; then
    echo "  ⚠️  WARNING: Less than 2 lines (header only)"
    return 1
  fi
  
  # Check header exists
  if ! head -1 "$file" | grep -q ","; then
    echo "  ❌ ERROR: Invalid CSV header (no commas)"
    return 2
  fi
  
  return 0
}

# Function to check file size
check_file_size() {
  local file="$1"
  local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
  
  # Allow small files for metadata/aggregated summaries (50 bytes minimum)
  if [ "$size" -lt 50 ]; then
    echo "  ⚠️  WARNING: Very small file ($size bytes) - might be placeholder"
    return 1
  fi
  
  return 0
}

# Validate all CSV files
echo "📊 Validating CSV files in $CIA_DATA_DIR..."
echo ""

# Find all CSV files recursively
while IFS= read -r file; do
  VALIDATED=$((VALIDATED + 1))
  local_file=$(basename "$file")
  local_dir=$(dirname "$file" | sed "s|$CIA_DATA_DIR/||")
  
  echo "[$VALIDATED] Validating $local_dir/$local_file"
  
  has_error=0
  has_warning=0
  
  # Check encoding
  if ! check_encoding "$file"; then
    ERRORS=$((ERRORS + 1))
    has_error=1
  fi
  
  # Check CSV structure
  result=$(check_csv_structure "$file"; echo $?)
  if [ "$result" -eq 1 ]; then
    WARNINGS=$((WARNINGS + 1))
    has_warning=1
  elif [ "$result" -eq 2 ]; then
    ERRORS=$((ERRORS + 1))
    has_error=1
  fi
  
  # Check file size
  if ! check_file_size "$file"; then
    WARNINGS=$((WARNINGS + 1))
    has_warning=1
  fi
  
  if [ "$has_error" -eq 0 ] && [ "$has_warning" -eq 0 ]; then
    echo "  ✓ Valid"
  fi
  
  echo ""
done < <(find "$CIA_DATA_DIR" -name "*.csv" -type f)

echo ""
echo "===================================="
echo "📊 Validation Summary"
echo "===================================="
echo "Files validated: $VALIDATED"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Validation FAILED - $ERRORS errors found"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo "⚠️  Validation completed with $WARNINGS warnings"
  exit 0
else
  echo "✅ All CSV files validated successfully!"
  exit 0
fi
