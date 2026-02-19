#!/bin/bash
# Script to add language switchers to news articles that are missing them
# Usage: ./scripts/add-language-switchers.sh

set -e

# Define article base names that need language switchers
ARTICLE_BASES=(
  "2026-02-18-committee-reports"
  "2026-02-18-government-propositions"
  "2026-02-18-parliamentary-questions"
  "2026-02-18-opposition-motions"
)

# Define all 14 languages
LANGUAGES=(en sv da no fi de fr es nl ar he ja ko zh)

# Language display names with flags
declare -A LANG_DISPLAY
LANG_DISPLAY[en]="🇬🇧 English"
LANG_DISPLAY[sv]="🇸🇪 Svenska"
LANG_DISPLAY[da]="🇩🇰 Dansk"
LANG_DISPLAY[no]="🇳🇴 Norsk"
LANG_DISPLAY[fi]="🇫🇮 Suomi"
LANG_DISPLAY[de]="🇩🇪 Deutsch"
LANG_DISPLAY[fr]="🇫🇷 Français"
LANG_DISPLAY[es]="🇪🇸 Español"
LANG_DISPLAY[nl]="🇳🇱 Nederlands"
LANG_DISPLAY[ar]="🇸🇦 العربية"
LANG_DISPLAY[he]="🇮🇱 עברית"
LANG_DISPLAY[ja]="🇯🇵 日本語"
LANG_DISPLAY[ko]="🇰🇷 한국어"
LANG_DISPLAY[zh]="🇨🇳 中文"

# Function to generate language switcher HTML
generate_lang_switcher() {
  local base_name=$1
  local current_lang=$2
  
  echo '  <nav class="language-switcher" role="navigation" aria-label="Language versions">'
  
  for lang in "${LANGUAGES[@]}"; do
    local active=""
    if [ "$lang" = "$current_lang" ]; then
      active=" active"
    fi
    echo "    <a href=\"${base_name}-${lang}.html\" class=\"lang-link${active}\" hreflang=\"${lang}\">${LANG_DISPLAY[$lang]}</a>"
  done
  
  echo '  </nav>'
}

# Function to add language switcher to a file
add_lang_switcher() {
  local file=$1
  local base_name=$2
  local lang=$3
  
  # Check if file already has language switcher
  if grep -q "language-switcher" "$file"; then
    echo "  ✓ Already has language switcher: $file"
    return 0
  fi
  
  echo "  + Adding language switcher to: $file"
  
  # Generate the language switcher HTML
  local switcher=$(generate_lang_switcher "$base_name" "$lang")
  
  # Create a temporary file
  local temp_file="${file}.tmp"
  
  # Insert language switcher after <body> tag
  awk -v switcher="$switcher" '
    /<body>/ {
      print
      print switcher
      next
    }
    { print }
  ' "$file" > "$temp_file"
  
  # Replace original file with modified version
  mv "$temp_file" "$file"
  
  echo "  ✓ Added language switcher to: $file"
}

# Main execution
echo "=== Adding Language Switchers to News Articles ==="
echo ""

total_files=0
added_count=0

for base in "${ARTICLE_BASES[@]}"; do
  echo "Processing: $base"
  
  for lang in "${LANGUAGES[@]}"; do
    file="news/${base}-${lang}.html"
    
    if [ -f "$file" ]; then
      ((total_files++))
      
      if ! grep -q "language-switcher" "$file"; then
        add_lang_switcher "$file" "$base" "$lang"
        ((added_count++))
      else
        echo "  ✓ Already has language switcher: $file"
      fi
    else
      echo "  ⚠ File not found: $file"
    fi
  done
  
  echo ""
done

echo "=== Summary ==="
echo "Total files processed: $total_files"
echo "Language switchers added: $added_count"
echo "Files already had switchers: $((total_files - added_count))"
echo ""
echo "✓ Done!"
