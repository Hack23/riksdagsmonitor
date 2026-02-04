# 📝 How to Create the 8 Riksdagsmonitor GitHub Issues

This guide provides **3 methods** to create the 8 comprehensive GitHub issues documented in this repository.

---

## 📋 Prerequisites

- GitHub account with write access to `Hack23/riksdagsmonitor`
- For CLI/API methods: GitHub Personal Access Token with `repo` scope

---

## Method 1: GitHub Web Interface (✅ Recommended)

**Best for**: Manual review and verification before creating issues

### Steps:

1. **Navigate to New Issue Page**:
   ```
   https://github.com/Hack23/riksdagsmonitor/issues/new
   ```

2. **Copy Issue Content**:
   - Open `GITHUB_ISSUES_TO_CREATE.md` for Issues #1-4
   - Open `GITHUB_ISSUES_TO_CREATE_PART2.md` for Issues #5-6
   - Find the issue body between the markdown code blocks

3. **Create Each Issue**:
   - Paste the title and body
   - Add labels manually (e.g., `type:feature`, `priority:high`, etc.)
   - Assign to: `copilot-swe-agent[bot]`
   - Click "Submit new issue"

4. **Repeat** for all 8 issues

### ✅ Advantages:
- Review content before submission
- No authentication setup required
- Visual interface for labels and assignments

### ❌ Disadvantages:
- Manual, time-consuming for 8 issues
- Prone to copy-paste errors

---

## Method 2: GitHub CLI (`gh`) (⚡ Fast & Automated)

**Best for**: Quick batch creation with command-line automation

### Setup:

1. **Install GitHub CLI**:
   ```bash
   # macOS
   brew install gh
   
   # Ubuntu/Debian
   sudo apt install gh
   
   # Windows
   winget install GitHub.cli
   ```

2. **Authenticate**:
   ```bash
   gh auth login
   ```

### Create Issues:

**Option A: Using the provided script** (if it exists):
```bash
# Make script executable
chmod +x scripts/create-github-issues.sh

# Run script
./scripts/create-github-issues.sh
```

**Option B: Manual commands** (one by one):

```bash
# Issue 1: CIA JSON Schema Integration
gh issue create \
  --repo "Hack23/riksdagsmonitor" \
  --title "CIA JSON Schema Integration & Validation Framework - Comprehensive Implementation" \
  --label "type:feature,priority:high,component:data-integration,component:ci-cd,agent:devops-engineer,cia-integration" \
  --assignee "copilot-swe-agent[bot]" \
  --body-file <(cat GITHUB_ISSUES_TO_CREATE.md | sed -n '/^## Issue #1/,/^## Issue #2/p')

# Issue 2: Multi-Language Content Enhancement
gh issue create \
  --repo "Hack23/riksdagsmonitor" \
  --title "Multi-Language Content Enhancement for All 14 Languages" \
  --label "type:feature,priority:high,component:i18n,component:content,agent:frontend-specialist" \
  --assignee "copilot-swe-agent[bot]" \
  --body-file <(cat GITHUB_ISSUES_TO_CREATE.md | sed -n '/^## Issue #2/,/^## Issue #3/p')

# ... repeat for all 8 issues
```

### ✅ Advantages:
- Fast automation
- Consistent formatting
- Easy to script and repeat

### ❌ Disadvantages:
- Requires GitHub CLI installation
- Authentication setup needed

---

## Method 3: GitHub REST API with Python (🔧 Programmatic)

**Best for**: Integration with other tools, CI/CD pipelines

### Setup:

1. **Create GitHub Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes: Select `repo` (full control of private repositories)
   - Generate and copy token

2. **Install Python dependencies**:
   ```bash
   pip3 install requests
   ```

### Create Issues:

```bash
# Set your token
export GITHUB_TOKEN="ghp_your_token_here"

# Run the Python script
python3 scripts/create_github_issues.py "$GITHUB_TOKEN"
```

**OR** pass token directly:

```bash
python3 scripts/create_github_issues.py ghp_your_token_here
```

### Script Output:

```
🚀 Creating 8 comprehensive GitHub issues for Hack23/riksdagsmonitor...

📝 Creating Issue 1: CIA JSON Schema Integration & Validation Framework...
✅ Issue 1 created: https://github.com/Hack23/riksdagsmonitor/issues/123
   Issue #123

📝 Creating Issue 2: Multi-Language Content Enhancement...
✅ Issue 2 created: https://github.com/Hack23/riksdagsmonitor/issues/124
   Issue #124

... (6 more issues)

🎉 Successfully created 8 out of 8 issues!

📊 Summary:
  - Issue #123: https://github.com/Hack23/riksdagsmonitor/issues/123
  - Issue #124: https://github.com/Hack23/riksdagsmonitor/issues/124
  ...

🔗 View all issues: https://github.com/Hack23/riksdagsmonitor/issues
```

### ✅ Advantages:
- Fully automated
- Programmatic control
- Easy to integrate with CI/CD

### ❌ Disadvantages:
- Requires Python and requests library
- Token management needed
- More technical setup

---

## Method 4: Manual GitHub REST API (cURL)

**Best for**: Testing or one-off issue creation

### Setup:

Create a GitHub Personal Access Token (see Method 3, step 1)

### Create Issue via cURL:

```bash
# Set your token
export GITHUB_TOKEN="ghp_your_token_here"

# Create Issue 1
curl -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/Hack23/riksdagsmonitor/issues \
  -d @scripts/create-issue-1.json
```

Where `scripts/create-issue-1.json` contains:

```json
{
  "title": "CIA JSON Schema Integration & Validation Framework - Comprehensive Implementation",
  "body": "... (full issue body) ...",
  "labels": ["type:feature", "priority:high", "component:data-integration"],
  "assignees": ["copilot-swe-agent[bot]"]
}
```

### ✅ Advantages:
- No dependencies (just cURL)
- Works on any platform

### ❌ Disadvantages:
- Very manual
- Requires creating JSON payloads for each issue

---

## 📊 What Issues Will Be Created?

| # | Title | Agent | Effort | Labels |
|---|-------|-------|--------|--------|
| 1 | CIA JSON Schema Integration & Validation Framework | devops-engineer | 3-4 weeks | type:feature, priority:high, data-integration, ci-cd |
| 2 | Multi-Language Content Enhancement (14 Languages) | frontend-specialist | 4-5 weeks | type:feature, priority:high, i18n, content |
| 3 | Swedish Election 2026 Dashboard & Predictions | frontend-specialist | 6 weeks | type:feature, priority:high, visualization, election |
| 4 | Party Performance & Cabinet Scorecard Visualizations | frontend-specialist | 7 weeks | type:feature, priority:high, visualization, dashboard |
| 5 | Top 10 Rankings Dashboard Implementation | frontend-specialist | 8 weeks | type:feature, priority:high, visualization, rankings |
| 6 | Committee Network Analysis & Influence Mapping | frontend-specialist | 8 weeks | type:feature, priority:high, visualization, network-analysis |
| 7 | Nightly News Generation Workflow | devops-engineer | 6 weeks | type:feature, priority:high, automation, ci-cd |
| 8 | Digital Twin Data Integration & OSINT Intelligence Pipeline | security-architect + performance-engineer | 8-10 weeks | type:feature, priority:high, data-integration, osint |

**Total Effort**: 50-55 weeks  
**Total Issues**: 8  
**Assignee**: `copilot-swe-agent[bot]` for all issues

---

## 🔐 Security Considerations

### Token Security:
- **Never commit tokens** to git repositories
- Use environment variables or secret managers
- Rotate tokens regularly
- Use minimal necessary scopes (`repo` only)

### GitHub Token Best Practices:
```bash
# Set token as environment variable (doesn't persist in shell history)
read -s GITHUB_TOKEN
export GITHUB_TOKEN

# Or use a secrets manager
export GITHUB_TOKEN=$(security find-generic-password -s github-token -w)
```

---

## ✅ Verification

After creating the issues, verify:

1. **All 8 issues created**:
   ```bash
   gh issue list --repo Hack23/riksdagsmonitor --limit 10
   ```

2. **All assigned to copilot-swe-agent[bot]**:
   ```bash
   gh issue list --repo Hack23/riksdagsmonitor --assignee "copilot-swe-agent[bot]"
   ```

3. **Labels applied correctly**:
   - Check each issue has appropriate labels (type, priority, component, agent)

4. **Content is complete**:
   - Each issue has objectives, acceptance criteria, references
   - CIA data context included
   - ISMS compliance mapping present

---

## 🚀 Next Steps After Creation

1. **Monitor Progress**: Track issue completion in GitHub Projects
2. **Review PRs**: Review pull requests from Copilot agents
3. **Provide Feedback**: Comment on issues with additional context
4. **Deploy**: Merge approved changes to main branch

---

## 📚 Related Documentation

- **ISSUES_README.md** - Complete overview of all 8 issues
- **GITHUB_ISSUES_TO_CREATE.md** - Full issue bodies (Issues #1-4)
- **GITHUB_ISSUES_TO_CREATE_PART2.md** - Full issue bodies (Issues #5-6)
- **ISSUE_CREATION_SUMMARY.md** - Summary with statistics
- **scripts/create_github_issues.py** - Python automation script
- **scripts/create-issue-1.json** - Example JSON payload

---

## 🤝 Support

**Issues or Questions?**
- Repository: https://github.com/Hack23/riksdagsmonitor
- ISMS: https://github.com/Hack23/ISMS-PUBLIC
- Contact: Hack23 AB (Org.nr 5595347807)

---

**Created**: 2026-02-04  
**Last Updated**: 2026-02-04  
**Maintained by**: Hack23 AB
