#!/bin/bash

# Comprehensive validation script for Party Performance Dashboard implementation

echo "🔍 Validating Party Performance Dashboard Implementation"
echo "========================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check_result() {
    if [ "${1:-1}" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

echo "1. Directory Structure"
echo "----------------------"
[ -d "js" ] && check_result 0 "js/ directory exists" || check_result 1 "js/ directory exists"
[ -d "data/cia" ] && check_result 0 "data/cia/ directory exists" || check_result 1 "data/cia/ directory exists"
[ -f "js/party-dashboard.js" ] && check_result 0 "party-dashboard.js exists" || check_result 1 "party-dashboard.js exists"
echo ""

echo "2. Data Files"
echo "-------------"
[ -f "data/cia/distribution_party_effectiveness_trends.csv" ] && check_result 0 "party_effectiveness_trends.csv exists" || check_result 1 "party_effectiveness_trends.csv exists"
[ -f "data/cia/distribution_party_performance.csv" ] && check_result 0 "party_performance.csv exists" || check_result 1 "party_performance.csv exists"
[ -f "data/cia/distribution_party_momentum.csv" ] && check_result 0 "party_momentum.csv exists" || check_result 1 "party_momentum.csv exists"
[ -f "data/cia/distribution_coalition_alignment.csv" ] && check_result 0 "coalition_alignment.csv exists" || check_result 1 "coalition_alignment.csv exists"
echo ""

echo "3. English HTML (index.html)"
echo "----------------------------"
grep -q 'chart.js@4.4.2' index.html && check_result 0 "Chart.js CDN included" || check_result 1 "Chart.js CDN included"
grep -q 'party-dashboard.js' index.html && check_result 0 "Dashboard script included" || check_result 1 "Dashboard script included"
grep -q 'id="party-dashboard"' index.html && check_result 0 "Dashboard section present" || check_result 1 "Dashboard section present"
grep -q 'partyEffectivenessChart' index.html && check_result 0 "Effectiveness chart canvas present" || check_result 1 "Effectiveness chart canvas present"
grep -q 'partyComparisonChart' index.html && check_result 0 "Comparison chart canvas present" || check_result 1 "Comparison chart canvas present"
grep -q 'coalitionNetwork' index.html && check_result 0 "Coalition network div present" || check_result 1 "Coalition network div present"
grep -q 'partyMomentumChart' index.html && check_result 0 "Momentum chart canvas present" || check_result 1 "Momentum chart canvas present"
grep -q 'role="img"' index.html && check_result 0 "ARIA roles present" || check_result 1 "ARIA roles present"
grep -q 'sr-only' index.html && check_result 0 "Screen reader text present" || check_result 1 "Screen reader text present"
echo ""

echo "4. CSS Styles"
echo "-------------"
grep -q 'dashboard-container' styles.css && check_result 0 "Dashboard container styles present" || check_result 1 "Dashboard container styles present"
grep -q 'dashboard-grid' styles.css && check_result 0 "Dashboard grid styles present" || check_result 1 "Dashboard grid styles present"
grep -q 'chart-card' styles.css && check_result 0 "Chart card styles present" || check_result 1 "Chart card styles present"
grep -q 'coalition-item' styles.css && check_result 0 "Coalition item styles present" || check_result 1 "Coalition item styles present"
grep -q 'data-attribution' styles.css && check_result 0 "Data attribution styles present" || check_result 1 "Data attribution styles present"
echo ""

echo "5. Multi-Language Support (Sample Check)"
echo "-----------------------------------------"
LANGUAGES=("sv" "de" "fr" "ja" "zh")
for lang in "${LANGUAGES[@]}"; do
    file="index_${lang}.html"
    if [ -f "$file" ]; then
        grep -q 'id="party-dashboard"' "$file" && check_result 0 "$lang: Dashboard section present" || check_result 1 "$lang: Dashboard section present"
        grep -q 'chart.js@4.4.2' "$file" && check_result 0 "$lang: Chart.js CDN included" || check_result 1 "$lang: Chart.js CDN included"
    else
        check_result 1 "$lang: File not found"
    fi
done
echo ""

echo "6. JavaScript Implementation"
echo "----------------------------"
grep -q 'CONFIG' js/party-dashboard.js && check_result 0 "Configuration object present" || check_result 1 "Configuration object present"
grep -q 'TRANSLATIONS' js/party-dashboard.js && check_result 0 "Translations object present" || check_result 1 "Translations object present"
grep -q 'fetchData' js/party-dashboard.js && check_result 0 "Data fetching function present" || check_result 1 "Data fetching function present"
grep -q 'createEffectivenessChart' js/party-dashboard.js && check_result 0 "Effectiveness chart function present" || check_result 1 "Effectiveness chart function present"
grep -q 'createComparisonChart' js/party-dashboard.js && check_result 0 "Comparison chart function present" || check_result 1 "Comparison chart function present"
grep -q 'createCoalitionNetwork' js/party-dashboard.js && check_result 0 "Coalition network function present" || check_result 1 "Coalition network function present"
grep -q 'createMomentumChart' js/party-dashboard.js && check_result 0 "Momentum chart function present" || check_result 1 "Momentum chart function present"
grep -q 'IntersectionObserver' js/party-dashboard.js && check_result 0 "Lazy loading implemented" || check_result 1 "Lazy loading implemented"
echo ""

echo "7. Security & Performance"
echo "-------------------------"
grep -q 'integrity=' index.html && check_result 0 "SRI integrity hash present" || check_result 1 "SRI integrity hash present"
grep -q 'crossorigin="anonymous"' index.html && check_result 0 "CORS attribute present" || check_result 1 "CORS attribute present"
grep -q 'https://cdn.jsdelivr.net' index.html && check_result 0 "HTTPS CDN used" || check_result 1 "HTTPS CDN used"
grep -q 'localStorage' js/party-dashboard.js && check_result 0 "Local caching implemented" || check_result 1 "Local caching implemented"
grep -q 'freshnessThreshold' js/party-dashboard.js && check_result 0 "Data freshness check present" || check_result 1 "Data freshness check present"
echo ""

echo "8. Accessibility (WCAG 2.1 AA)"
echo "-------------------------------"
grep -q 'aria-label=' index.html && check_result 0 "ARIA labels present" || check_result 1 "ARIA labels present"
grep -q 'role="img"' index.html && check_result 0 "Image roles present" || check_result 1 "Image roles present"
grep -q 'role="region"' index.html && check_result 0 "Region roles present" || check_result 1 "Region roles present"
grep -q 'sr-only' index.html && check_result 0 "Screen reader only content present" || check_result 1 "Screen reader only content present"
echo ""

echo "========================================================"
echo "VALIDATION SUMMARY"
echo "========================================================"
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 All validation checks passed!${NC}"
    echo "✅ Party Performance Dashboard implementation is complete and validated."
    exit 0
else
    echo -e "${YELLOW}⚠️  Some validation checks failed.${NC}"
    echo "Please review the failed checks above."
    exit 1
fi
