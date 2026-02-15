# 🏷️ Label System for Riksdagsmonitor

This document describes the automatic labeling system for the riksdagsmonitor repository. Labels are automatically applied to pull requests based on file changes, PR titles, and PR body content.

**Last Updated:** 2026-02-15  
**Maintained by:** Hack23 AB

---

## 📋 Overview

The riksdagsmonitor repository uses an automated labeling system powered by GitHub Actions to categorize pull requests and issues. This helps maintain organization, improves searchability, and provides quick visual context about changes.

### Key Features
- ✅ **Automatic labeling** based on file paths, PR titles, and descriptions
- ✅ **46 labels** covering all aspects of the project
- ✅ **Size labels** automatically calculated from PR diff
- ✅ **Security hardened** workflows with SHA pinning
- ✅ **Status tracking** with priority and progress labels

---

## 🚀 Setup

### Initial Setup

Run the label setup workflow to create all required labels:

1. Go to **Actions** → **Setup Repository Labels**
2. Click **Run workflow**
3. (Optional) Check "Recreate all labels" to delete existing labels first
4. Wait for completion (usually < 1 minute)

**Direct link:** [Setup Repository Labels Workflow](../../actions/workflows/setup-labels.yml)

### Automatic Labeling

Once labels are created, the automatic labeler runs on every PR:
- Triggers on PR **opened**, **synchronize**, **reopened**, **edited**
- Applies labels based on `.github/labeler.yml` configuration
- Adds size labels based on diff statistics
- Posts a summary comment on new PRs

---

## 🏷️ Label Categories

### 🗳️ Content & Features

Labels for content generation and feature development:

| Label | Color | Description |
|-------|-------|-------------|
| `news` | ![#ff6b9d](https://via.placeholder.com/15/ff6b9d/000000?text=+) | News articles and content generation |
| `dashboard` | ![#1e88e5](https://via.placeholder.com/15/1e88e5/000000?text=+) | Interactive dashboards (Chart.js/D3.js) |
| `visualization` | ![#9c27b0](https://via.placeholder.com/15/9c27b0/000000?text=+) | Data visualization features |
| `intelligence` | ![#6a1b9a](https://via.placeholder.com/15/6a1b9a/000000?text=+) | Political intelligence analysis |

**Auto-applies when:**
- Changing files in `news/`, `dashboard/`, `js/*-dashboard.js`
- PR title starts with `news:`, `dashboard:`, `viz:`
- PR body contains `- [x] 📰 News Content`, `- [x] 📊 Dashboard`

---

### 💻 Technology

Labels for technical implementation:

| Label | Color | Description |
|-------|-------|-------------|
| `html-css` | ![#e1bee7](https://via.placeholder.com/15/e1bee7/000000?text=+) | HTML/CSS changes |
| `javascript` | ![#f9a825](https://via.placeholder.com/15/f9a825/000000?text=+) | JavaScript code changes |
| `workflow` | ![#1976d2](https://via.placeholder.com/15/1976d2/000000?text=+) | GitHub Actions workflows |
| `security` | ![#d32f2f](https://via.placeholder.com/15/d32f2f/000000?text=+) | Security improvements |

**Auto-applies when:**
- Changing `.html`, `.css`, `.js` files
- Modifying `.github/workflows/` files
- Updating security documentation
- PR title starts with `html:`, `js:`, `workflow:`, `security:`

---

### 📊 Data Integration

Labels for data pipeline and integration:

| Label | Color | Description |
|-------|-------|-------------|
| `cia-data` | ![#00897b](https://via.placeholder.com/15/00897b/000000?text=+) | CIA platform data integration |
| `riksdag-data` | ![#0277bd](https://via.placeholder.com/15/0277bd/000000?text=+) | Riksdag-Regering MCP data |
| `data-pipeline` | ![#00695c](https://via.placeholder.com/15/00695c/000000?text=+) | ETL and data processing |
| `schema` | ![#546e7a](https://via.placeholder.com/15/546e7a/000000?text=+) | Data schema changes |

**Auto-applies when:**
- Changing files in `cia-data/`, `data/cia/`, `schemas/`
- Modifying `scripts/load-cia-*.js`, `scripts/mcp-client.js`
- PR title starts with `cia:`, `riksdag:`, `pipeline:`, `schema:`

---

### 🌍 Internationalization

Labels for multi-language support (14 languages):

| Label | Color | Description |
|-------|-------|-------------|
| `i18n` | ![#4caf50](https://via.placeholder.com/15/4caf50/000000?text=+) | Internationalization/localization |
| `translation` | ![#66bb6a](https://via.placeholder.com/15/66bb6a/000000?text=+) | Translation updates |
| `rtl` | ![#8bc34a](https://via.placeholder.com/15/8bc34a/000000?text=+) | RTL language support (Arabic, Hebrew) |

**Auto-applies when:**
- Changing `index_*.html`, `sitemap_*.html`, `news/**/*-*.html`
- Modifying `TRANSLATION_GUIDE.md`
- PR title starts with `i18n:`, `translation:`, `rtl:`

**Supported Languages:**
- English (EN), Swedish (SV), Danish (DA), Norwegian (NO), Finnish (FI)
- German (DE), French (FR), Spanish (ES), Dutch (NL)
- Arabic (AR), Hebrew (HE), Japanese (JA), Korean (KO), Chinese (ZH)

---

### 🔒 ISMS & Compliance

Labels for security and compliance frameworks:

| Label | Color | Description |
|-------|-------|-------------|
| `isms` | ![#b71c1c](https://via.placeholder.com/15/b71c1c/000000?text=+) | ISMS compliance changes |
| `iso-27001` | ![#c62828](https://via.placeholder.com/15/c62828/000000?text=+) | ISO 27001 controls |
| `nist-csf` | ![#d32f2f](https://via.placeholder.com/15/d32f2f/000000?text=+) | NIST CSF compliance |
| `cis-controls` | ![#e53935](https://via.placeholder.com/15/e53935/000000?text=+) | CIS Controls |

**Auto-applies when:**
- Changing `SECURITY_ARCHITECTURE.md`, `THREAT_MODEL.md`, `ISMS_COMPLIANCE_AUDIT_REPORT.md`
- Modifying `.github/skills/iso-27001-controls/`, `.github/skills/nist-csf-mapping/`
- PR title starts with `isms:`, `iso-27001:`, `nist:`, `cis:`

**Frameworks:**
- **ISO 27001:2022** - Information security management
- **NIST CSF 2.0** - Cybersecurity framework
- **CIS Controls v8.1** - Security best practices

---

### 🏗️ Infrastructure & Operations

Labels for CI/CD and infrastructure:

| Label | Color | Description |
|-------|-------|-------------|
| `ci-cd` | ![#1565c0](https://via.placeholder.com/15/1565c0/000000?text=+) | CI/CD pipeline changes |
| `deployment` | ![#0d47a1](https://via.placeholder.com/15/0d47a1/000000?text=+) | Deployment configuration |
| `performance` | ![#ff6f00](https://via.placeholder.com/15/ff6f00/000000?text=+) | Performance optimization |
| `monitoring` | ![#558b2f](https://via.placeholder.com/15/558b2f/000000?text=+) | Monitoring and alerting |

**Auto-applies when:**
- Changing `.github/workflows/` files
- Modifying `CNAME`, `robots.txt`, `vite.config.js`
- PR title starts with `ci:`, `deploy:`, `perf:`, `monitoring:`

---

### 🔄 Quality & Testing

Labels for code quality and testing:

| Label | Color | Description |
|-------|-------|-------------|
| `testing` | ![#26c6da](https://via.placeholder.com/15/26c6da/000000?text=+) | Test coverage |
| `accessibility` | ![#7e57c2](https://via.placeholder.com/15/7e57c2/000000?text=+) | WCAG 2.1 AA compliance |
| `documentation` | ![#0075ca](https://via.placeholder.com/15/0075ca/000000?text=+) | Documentation updates |
| `refactor` | ![#ffb74d](https://via.placeholder.com/15/ffb74d/000000?text=+) | Code refactoring |

**Auto-applies when:**
- Changing files in `tests/`, `cypress/`, `*.test.js`
- Modifying `**/*.md` files
- PR title starts with `test:`, `a11y:`, `docs:`, `refactor:`

---

### 🏷️ Standard Labels

Essential workflow labels:

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | ![#d73a4a](https://via.placeholder.com/15/d73a4a/000000?text=+) | Bug fixes |
| `enhancement` | ![#a2eeef](https://via.placeholder.com/15/a2eeef/000000?text=+) | Enhancements |
| `dependencies` | ![#0366d6](https://via.placeholder.com/15/0366d6/000000?text=+) | Dependency updates |

**Auto-applies when:**
- PR title starts with `fix:`, `bug:`, `feat:`, `deps:`
- Changing `package.json`, `package-lock.json`
- PR body contains `- [x] 🐛 Bug Fix`, `- [x] ✨ Enhancement`

---

### 🤖 AI & Automation

Labels for GitHub Copilot agents and agentic workflows:

| Label | Color | Description |
|-------|-------|-------------|
| `agent` | ![#5319e7](https://via.placeholder.com/15/5319e7/000000?text=+) | Agent configuration |
| `skill` | ![#bfd4f2](https://via.placeholder.com/15/bfd4f2/000000?text=+) | Skill configuration |
| `agentic-workflow` | ![#6e40aa](https://via.placeholder.com/15/6e40aa/000000?text=+) | Agentic workflow changes |

**Auto-applies when:**
- Changing `.github/agents/`, `.github/skills/`, `AGENTS.md`, `SKILLS.md`
- Modifying `.github/workflows/*.md`, `.github/workflows/*.lock.yml`
- PR title starts with `agent:`, `skill:`, `aw:`

---

### 🚦 Priority Labels

Manual labels for prioritization:

| Label | Color | Description |
|-------|-------|-------------|
| `priority-critical` | ![#b60205](https://via.placeholder.com/15/b60205/000000?text=+) | Critical priority (security, outages) |
| `priority-high` | ![#d93f0b](https://via.placeholder.com/15/d93f0b/000000?text=+) | High priority (important features) |
| `priority-medium` | ![#fbca04](https://via.placeholder.com/15/fbca04/000000?text=+) | Medium priority (standard work) |
| `priority-low` | ![#0e8a16](https://via.placeholder.com/15/0e8a16/000000?text=+) | Low priority (nice-to-have) |

**Usage:** Manually add to PRs/issues to indicate urgency.

---

### 📏 Size Labels

Automatically calculated from PR diff:

| Label | Color | Lines Changed | Description |
|-------|-------|---------------|-------------|
| `size-xs` | ![#3cbf00](https://via.placeholder.com/15/3cbf00/000000?text=+) | < 10 | Extra small change |
| `size-s` | ![#5d9801](https://via.placeholder.com/15/5d9801/000000?text=+) | 10-50 | Small change |
| `size-m` | ![#7f7f00](https://via.placeholder.com/15/7f7f00/000000?text=+) | 50-250 | Medium change |
| `size-l` | ![#bf7e00](https://via.placeholder.com/15/bf7e00/000000?text=+) | 250-1000 | Large change |
| `size-xl` | ![#d93f0b](https://via.placeholder.com/15/d93f0b/000000?text=+) | > 1000 | Extra large change |

**Auto-applies:** Calculated from `additions + deletions` in PR diff.

---

### 🎭 Status Labels

Manual labels for workflow tracking:

| Label | Color | Description |
|-------|-------|-------------|
| `status-needs-review` | ![#fbca04](https://via.placeholder.com/15/fbca04/000000?text=+) | Needs code review |
| `status-in-progress` | ![#1d76db](https://via.placeholder.com/15/1d76db/000000?text=+) | Work in progress |
| `status-blocked` | ![#d93f0b](https://via.placeholder.com/15/d93f0b/000000?text=+) | Blocked by dependencies |
| `status-ready` | ![#0e8a16](https://via.placeholder.com/15/0e8a16/000000?text=+) | Ready to merge |

**Usage:** Manually add/update as PR progresses through workflow.

---

## 🔧 Configuration

### Labeler Configuration

The automatic labeler is configured in `.github/labeler.yml`. Labels are applied based on:

1. **File path patterns** - Uses glob patterns to match changed files
2. **PR title** - Matches title prefixes (e.g., `fix:`, `feat:`)
3. **PR body** - Matches checkbox patterns (e.g., `- [x] 🐛 Bug Fix`)

**Example:**
```yaml
news:
  - any:
      - changed-files:
          - any-glob-to-any-file:
              - "news/**/*.html"
              - "scripts/article-template.js"
      - title: "news:*"
      - body: "- [x] 📰 News Content"
```

### Modifying Labels

To modify the labeling system:

1. **Edit label definitions:** Modify `.github/workflows/setup-labels.yml`
2. **Edit auto-labeling rules:** Modify `.github/labeler.yml`
3. **Run setup workflow:** Actions → Setup Repository Labels
4. **Test on new PR:** Create a test PR to verify labels

---

## 📊 Usage Examples

### Example 1: News Article PR

**Files changed:**
- `news/2026-02-15-riksdag-budget-vote-en.html`
- `news/2026-02-15-riksdag-budget-vote-sv.html`

**Labels applied:**
- ✅ `news` (news article)
- ✅ `html-css` (HTML files)
- ✅ `i18n` (multi-language)
- ✅ `translation` (Swedish translation)
- ✅ `size-s` (< 50 lines)

---

### Example 2: Dashboard Enhancement

**Files changed:**
- `js/politician-dashboard.js`
- `politician-dashboard.html`
- `cia-data/politician/view_riksdagen_politician_ranking_sample.csv`

**PR Title:** `feat: Add politician influence network visualization`

**Labels applied:**
- ✅ `dashboard` (dashboard changes)
- ✅ `visualization` (data visualization)
- ✅ `javascript` (JS code)
- ✅ `html-css` (HTML file)
- ✅ `cia-data` (CIA data)
- ✅ `enhancement` (feature)
- ✅ `size-m` (50-250 lines)

---

### Example 3: Security Architecture Update

**Files changed:**
- `SECURITY_ARCHITECTURE.md`
- `THREAT_MODEL.md`
- `.github/skills/iso-27001-controls/SKILL.md`

**PR Title:** `security: Update ISO 27001 control mapping`

**Labels applied:**
- ✅ `security` (security changes)
- ✅ `isms` (ISMS compliance)
- ✅ `iso-27001` (ISO 27001)
- ✅ `documentation` (markdown files)
- ✅ `skill` (skill changes)
- ✅ `size-m` (50-250 lines)

---

### Example 4: CI/CD Workflow

**Files changed:**
- `.github/workflows/data-pipeline.yml`
- `.github/workflows/quality-checks.yml`

**PR Title:** `ci: Optimize data pipeline workflow`

**Labels applied:**
- ✅ `workflow` (GitHub Actions)
- ✅ `ci-cd` (CI/CD changes)
- ✅ `data-pipeline` (data pipeline)
- ✅ `performance` (optimization)
- ✅ `size-s` (< 50 lines)

---

## 🛠️ Troubleshooting

### Labels Not Applied

**Problem:** Labels are not being applied to PRs.

**Solutions:**
1. Check if labels exist: Actions → Setup Repository Labels → Run workflow
2. Verify labeler workflow ran: Actions → Pull Request Automatic Labeler
3. Check workflow logs for errors
4. Ensure `.github/labeler.yml` is valid YAML

---

### Missing Labels

**Problem:** Some labels don't exist in the repository.

**Solution:**
1. Go to Actions → Setup Repository Labels
2. Click "Run workflow"
3. (Optional) Check "Recreate all labels" to rebuild from scratch
4. Wait for completion
5. Re-trigger labeler on existing PRs

---

### Size Label Incorrect

**Problem:** Size label doesn't match PR diff.

**Explanation:** Size is calculated from total changes (additions + deletions), not just additions.

**Formula:**
```bash
TOTAL_CHANGES = ADDITIONS + DELETIONS
if TOTAL_CHANGES < 10: size-xs
elif TOTAL_CHANGES < 50: size-s
elif TOTAL_CHANGES < 250: size-m
elif TOTAL_CHANGES < 1000: size-l
else: size-xl
```

---

## 📚 References

- **Labeler Configuration:** [`.github/labeler.yml`](../.github/labeler.yml)
- **Setup Workflow:** [`.github/workflows/setup-labels.yml`](../.github/workflows/setup-labels.yml)
- **Labeler Workflow:** [`.github/workflows/labeler.yml`](../.github/workflows/labeler.yml)
- **GitHub Labeler Action:** [actions/labeler](https://github.com/actions/labeler)
- **ISMS Documentation:** [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)

---

## 🤝 Contributing

When contributing to the labeling system:

1. ✅ Test label changes on a test PR first
2. ✅ Document new labels in this file
3. ✅ Follow existing color scheme patterns
4. ✅ Ensure labels align with repository structure
5. ✅ Update WORKFLOWS.md if adding new workflows

---

**Last Updated:** 2026-02-15  
**Version:** 1.0  
**Maintained by:** Hack23 AB (Org.nr 5595347807)
