#!/bin/bash
# Script to create all 8 GitHub issues for riksdagsmonitor CIA integration
# This script requires GitHub CLI (gh) to be installed and authenticated

set -e

REPO="Hack23/riksdagsmonitor"
ISSUE_DIR="/tmp"

echo "🚀 Creating 8 GitHub Issues for Riksdagsmonitor CIA Integration..."
echo ""

# Function to create issue and capture URL
create_issue() {
    local num=$1
    local title=$2
    local file=$3
    local labels=$4
    
    echo "📝 Creating Issue $num: $title"
    
    # Create the issue without assignee first (will assign via API separately if needed)
    ISSUE_URL=$(gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body-file "$file" \
        --label "$labels" 2>&1 | tail -1)
    
    if [[ $ISSUE_URL == https://github.com/* ]]; then
        echo "✅ Created: $ISSUE_URL"
        echo ""
        return 0
    else
        echo "❌ Failed to create issue"
        echo "Error: $ISSUE_URL"
        echo ""
        return 1
    fi
}

# Issue 1
create_issue 1 \
    "Implement CIA JSON Schema Validation and Integration Framework" \
    "$ISSUE_DIR/issue-001-schema-validation.md" \
    "type:feature,priority:high,component:data-integration"

# Issue 2
create_issue 2 \
    "Create Multi-Language Dashboard with CIA Data Products" \
    "$ISSUE_DIR/issue-002-multilanguage-dashboard.md" \
    "type:feature,priority:high,component:visualization,component:i18n"

# Issue 3
create_issue 3 \
    "Implement Swedish Election 2026 Prediction Dashboard" \
    "$ISSUE_DIR/issue-003-election-prediction.md" \
    "type:feature,priority:high,component:visualization,component:prediction"

# Issue 4
create_issue 4 \
    "Create Nightly News Generation Workflow for Daily Updates" \
    "$ISSUE_DIR/issue-004-nightly-news-workflow.md" \
    "type:feature,priority:high,component:automation,component:content"

# Issue 5
create_issue 5 \
    "Implement Committee Meeting Analysis and Future Events Prediction" \
    "$ISSUE_DIR/issue-005-committee-future-events.md" \
    "type:feature,priority:high,component:automation,component:prediction"

# Issue 6
create_issue 6 \
    "Implement Top 10 Rankings Visualizations" \
    "$ISSUE_DIR/issue-006-top10-rankings.md" \
    "type:feature,priority:medium,component:visualization"

# Issue 7
create_issue 7 \
    "Create Interactive Committee Network Analysis Dashboard" \
    "$ISSUE_DIR/issue-007-committee-network.md" \
    "type:feature,priority:medium,component:visualization"

# Issue 8
create_issue 8 \
    "Enhance Documentation and Quality Validation for CIA Integration" \
    "$ISSUE_DIR/issue-008-documentation-quality.md" \
    "type:documentation,priority:medium,component:documentation"

echo ""
echo "✨ All 8 issues created successfully!"
echo ""
echo "Next steps:"
echo "1. Review issues at: https://github.com/$REPO/issues"
echo "2. Assign issues to copilot-swe-agent[bot] using GitHub UI or API"
echo "3. Use custom_instructions for specialized guidance per issue"
