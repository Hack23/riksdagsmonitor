<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🏷️ Riksdagsmonitor — Label System</h1>

<p align="center">
  <strong>🤖 Automated Pull-Request &amp; Issue Categorisation</strong><br>
  <em>🎯 File-Path Routing · Title Detection · Body Heuristics · GitHub Actions Driven</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Version-1.1-555?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Effective-2026--05--03-success?style=for-the-badge" alt="Effective Date"/>
  <img src="https://img.shields.io/badge/Review-Annual-orange?style=for-the-badge" alt="Review Cycle"/>
</p>

**📋 Document Owner:** CEO | **📅 Last Updated:** 2026-05-03 (UTC) | **🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** 🟢 Public

> **🆕 What changed since last review (v1.0 → v1.1, 2026-05-03):**
> - 🔄 **Drift reconciliation** with the live label set (`gh label list --repo Hack23/riksdagsmonitor --limit 300`): the repository now carries **159 labels** (was 46 in v1.0). The categories below cover the original 46 plus the agentic-newsroom additions (`agent:*`, `component:*`, `priority:*`, `agentic-workflows`, `agentic-news`, `news-*`, `lang:*`, `article:*`, `committee-reports`, `motions`, `propositions`, `interpellations`, `evening-analysis`, `realtime-monitor`, `realtime-pulse`, `monthly-review`, `weekly-review`, `month-ahead`, `week-ahead`, `year-ahead`, `long-horizon`, `forward-look`, `analysis-data`, `analysis-only`, `auto-generated`, `ai-generated`, `multi-language`, `economic-context`, `cia-intelligence`, `automated-pipeline`, `data-update`, `heartbeat`, `npm`, `github-actions`, `code-quality`, `frontend`, `refactoring`, `typescript`, `validation`, `maintenance`, `news-content`, `news/content`, `news-generation`, `needs-editorial-review`, `interpellation-debates`, `type:*` variants).
> - 📋 The taxonomy is documented categorically below; for the canonical machine-readable taxonomy see [`.github/labeler.yml`](.github/labeler.yml) and the setup workflow [`.github/workflows/setup-labels.yml`](.github/workflows/setup-labels.yml).

This document describes the automatic labeling system for the riksdagsmonitor repository. Labels are automatically applied to pull requests based on file changes, PR titles, and PR body content.

---

## 📋 Overview

The riksdagsmonitor repository uses an automated labeling system powered by GitHub Actions to categorize pull requests and issues. This helps maintain organization, improves searchability, and provides quick visual context about changes.

### Key Features
- ✅ **Automatic labeling** based on file paths, PR titles, and descriptions
- ✅ **159 labels** covering content, agentic workflows, components, priorities, sizes, ISMS, language, and horizon tracks
- ✅ **Size labels** automatically calculated from PR diff
- ✅ **Security hardened** workflows with SHA pinning
- ✅ **Status tracking** with priority and progress labels
- ✅ **Agentic-newsroom taxonomy**: `agent:*` (per-Copilot-agent owner), `component:*` (subsystem), `priority:*` / `priority-*`, `agentic-workflows`, `news-generation`, `needs-editorial-review`, `auto-generated`, `ai-generated`, horizon tags (`week-ahead`, `month-ahead`, `quarter-ahead`, `year-ahead`, `long-horizon`, `forward-look`, `realtime-monitor`, `realtime-pulse`)

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
- Changing `SECURITY_ARCHITECTURE.md`, `THREAT_MODEL.md`, `CRA-ASSESSMENT.md`
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

---

## 🔗 Hack23 Ecosystem

<table>
<tr>
  <th width="33%">🌐 Platforms</th>
  <th width="33%">📦 Open-Source Projects</th>
  <th width="33%">🛡️ Governance &amp; Standards</th>
</tr>
<tr>
<td valign="top">
🗳️ <a href="https://riksdagsmonitor.com">Riksdagsmonitor</a> — Swedish Parliament intelligence<br>
🇪🇺 <a href="https://www.euparliamentmonitor.com">EU Parliament Monitor</a> — European coverage<br>
🕵️ <a href="https://www.hack23.com/cia">Citizen Intelligence Agency</a> — political-data engine<br>
🌐 <a href="https://www.hack23.com">Hack23 AB</a> — corporate site<br>
📰 <a href="https://hack23.com/blog.html">Hack23 Blog</a> — engineering &amp; policy<br>
💼 <a href="https://www.linkedin.com/company/hack23/">Hack23 on LinkedIn</a>
</td>
<td valign="top">
🗳️ <a href="https://github.com/Hack23/riksdagsmonitor">Hack23/riksdagsmonitor</a><br>
🕵️ <a href="https://github.com/Hack23/cia">Hack23/cia</a><br>
🇪🇺 <a href="https://github.com/Hack23/euparliamentmonitor">Hack23/euparliamentmonitor</a><br>
🔌 <a href="https://github.com/Hack23/european-parliament-mcp">Hack23/european-parliament-mcp</a><br>
✅ <a href="https://github.com/Hack23/cia-compliance-manager">Hack23/cia-compliance-manager</a><br>
🥋 <a href="https://github.com/Hack23/black-trigram">Hack23/black-trigram</a><br>
🏠 <a href="https://github.com/Hack23/homepage">Hack23/homepage</a>
</td>
<td valign="top">
🛡️ <a href="https://github.com/Hack23/ISMS-PUBLIC">Hack23 ISMS-PUBLIC</a> — public ISMS<br>
🔒 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md">Information Security Policy</a><br>
🤖 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md">AI Policy</a><br>
🧪 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md">Secure Development Policy</a><br>
🎯 <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md">Threat Modeling Policy</a><br>
⚠️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md">Vulnerability Management</a><br>
🏷️ <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md">Classification Framework</a>
</td>
</tr>
</table>

<p align="center">
<a href="https://www.bestpractices.dev/projects/12069"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices"/></a>
<a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/ISO_27001-2022-blue?style=flat-square&logo=iso&logoColor=white" alt="ISO 27001:2022"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/NIST_CSF-2.0-green?style=flat-square&logo=nist&logoColor=white" alt="NIST CSF 2.0"/></a>
<a href="https://github.com/Hack23/ISMS-PUBLIC"><img src="https://img.shields.io/badge/CIS_Controls-v8.1-orange?style=flat-square&logo=cisecurity&logoColor=white" alt="CIS Controls v8.1"/></a>
<a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="Apache 2.0"/></a>
</p>

<p align="center"><em>🗳️ Empower citizens · 🔍 Strengthen democratic accountability · 🕵️ Illuminate the political process</em></p>

<p align="center"><sub>© 2008–2026 <a href="https://www.hack23.com">Hack23 AB</a> (Org.nr 559534-7807) · Maintainer: <a href="https://www.linkedin.com/in/jamessorling/">James Pether Sörling, CISSP CISM</a></sub></p>
