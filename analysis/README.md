<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🔬 Riksdagsmonitor — Analysis Directory</h1>

<p align="center">
  <strong>📊 Intermediate Analysis Artifacts for Agentic Political Intelligence Workflows</strong><br>
  <em>🎯 Daily · Weekly · Monthly · Templates · Methodologies · Reference</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-26  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

The `analysis/` directory stores **intermediate analysis artifacts** produced and consumed by Riksdagsmonitor's agentic workflows. These artifacts bridge raw Swedish parliamentary data (sourced via the riksdag-regering-mcp server) and the final published political intelligence articles, news summaries, and dashboards.

Analysis artifacts are **not** final content — they are structured intermediate products that enable:

- 🔄 **Workflow composition**: Upstream agents deposit analysis; downstream agents consume it
- 📐 **Consistent methodology**: Templates enforce analytical rigor across 14 languages
- 📊 **Temporal aggregation**: Daily → Weekly → Monthly intelligence roll-ups
- 🧠 **Reusable intelligence**: Cross-workflow pattern sharing and knowledge accumulation
- 🎯 **Quality assurance**: Structured templates enable validation before article generation

---

## 📁 Directory Structure

```
analysis/
├── README.md                          ← This file
├── data/                              ← Persistent MCP data repository (collision-free)
│   ├── README.md                      ← Data repository documentation
│   ├── documents/                     ← Parliamentary documents by type
│   │   ├── propositions/              ← Government propositions ({dok_id}.json + .meta.json)
│   │   ├── motions/                   ← Parliamentary motions
│   │   ├── committeeReports/          ← Committee reports
│   │   ├── votes/                     ← Voting records
│   │   ├── speeches/                  ← Parliamentary speeches
│   │   ├── questions/                 ← Written questions
│   │   └── interpellations/           ← Interpellations
│   ├── votes/                         ← Date-stamped vote ballots (YYYY-MM-DD/)
│   ├── events/                        ← Date-stamped calendar events (YYYY-MM-DD/)
│   ├── mps/                           ← MP profiles (intressent_id.json)
│   ├── worldbank/                     ← World Bank economic indicators
│   ├── scb/                           ← Statistics Sweden (SCB) table data
│   └── mcp-responses/                 ← Generic MCP tool response archive
├── templates/                         ← Reusable analysis templates (all with color-coded Mermaid)
│   ├── political-classification.md    ← Event classification template
│   ├── risk-assessment.md             ← Political risk template
│   ├── threat-analysis.md             ← STRIDE-inspired threat template
│   ├── swot-analysis.md               ← SWOT quadrant template
│   ├── stakeholder-impact.md          ← Stakeholder impact template
│   ├── significance-scoring.md        ← Significance scoring template
│   ├── synthesis-summary.md           ← Daily synthesis template (aggregates all above)
│   └── per-file-political-intelligence.md ← Per-file AI analysis template
├── methodologies/                     ← Detailed methodology guides
│   ├── political-classification-guide.md
│   ├── political-risk-methodology.md
│   ├── political-threat-framework.md
│   ├── political-swot-framework.md
│   └── political-style-guide.md
├── reference/                         ← ISMS adaptation mappings
│   ├── isms-classification-adaptation.md
│   ├── isms-risk-assessment-adaptation.md
│   ├── isms-threat-modeling-adaptation.md
│   └── isms-style-guide-adaptation.md
├── daily/                             ← Per-day analysis artifacts (YYYY-MM-DD/)
│   └── README.md
├── weekly/                            ← Per-week aggregations (YYYY-WNN/)
│   └── README.md
└── monthly/                           ← Per-month strategic briefs (YYYY-MM/)
    └── README.md
```

---

## 📅 Naming Conventions

| Scope   | Format      | Example         | Description                         |
|---------|-------------|-----------------|-------------------------------------|
| Daily   | `YYYY-MM-DD`| `2026-03-26/`   | ISO 8601 calendar date              |
| Weekly  | `YYYY-WNN`  | `2026-W13/`     | ISO 8601 week number (Mon–Sun)      |
| Monthly | `YYYY-MM`   | `2026-03/`      | ISO 8601 year-month                 |
| Ad-hoc  | descriptive | `coalition-risk/`| Named topic directories when needed |

**Rules:**
- All directory names use zero-padded numbers (`W03`, not `W3`)
- Weekly directories align with ISO 8601: weeks start **Monday**
- Never use locale-specific date formats (no `26/3/2026` or `Mar-26`)

---

## 🤖 Workflow Integration

The following agentic workflows produce analysis artifacts. All workflows **MUST** follow the per-file AI analysis protocol — read methodology documents, then analyze each downloaded file individually:

### 🌅 Daily Morning Workflows (scheduled Mon–Fri)

| Workflow | Schedule | Primary Output |
|----------|----------|----------------|
| `news-committee-reports` | 04:00 UTC Mon–Fri | Committee report articles |
| `news-propositions` | 05:00 UTC Mon–Fri | Proposition articles |
| `news-motions` | 06:00 UTC Mon–Fri | Motion articles |
| `news-interpellations` | 07:00 UTC Mon–Fri | Interpellation articles |

### 🌆 `news-evening-analysis` (18:00 UTC Mon–Fri, 16:00 UTC Sat)

The evening analysis workflow is the most comprehensive. It:
1. Downloads data via `populate-analysis-data.ts` + `pre-article-analysis.ts`
2. Runs per-file AI analysis on all pending files (reading methodology docs first)
3. Composes daily synthesis from per-file analyses
4. Generates evening analysis articles

### 📡 `news-realtime-monitor` (10:00+14:00 UTC Mon–Fri, 12:00 UTC weekends)

Real-time monitoring of parliamentary activity with per-file analysis on new data.

### 📅 Weekly & Monthly Workflows

| Workflow | Schedule | Output |
|----------|----------|--------|
| `news-week-ahead` | Fridays 07:00 UTC | Weekly forecast + aggregated SWOT |
| `news-weekly-review` | Scheduled | Weekly parliamentary wrap-up |
| `news-month-ahead` | Scheduled | Monthly forecast |
| `news-monthly-review` | Scheduled | Monthly strategic brief |

---

## 📐 Template Usage Guide

### Using a Template

1. **Copy** the template from `analysis/templates/` to the appropriate dated subdirectory
2. **Rename** using scope/workflow conventions from the target directory `README.md` (e.g. daily: `morning-risk-snapshot.md` / `evening-swot-update.md` / `realtime-HHMM-risk-delta.md`, weekly: `week-summary-swot.md`, monthly: `monthly-risk-register.md`)
3. **Fill** all required fields (marked `[REQUIRED]`)
4. **Complete** optional fields where evidence is available
5. **Validate** against the methodology guide before consuming downstream

### Template Quick Reference

| Template | When to Use | Key Output |
|----------|-------------|------------|
| `political-classification.md` | New political event arrives | Sensitivity + urgency classification |
| `risk-assessment.md` | Coalition/policy risk spike | Risk scores + mitigation map |
| `threat-analysis.md` | STRIDE-format threat review | Threat inventory + actor mapping |
| `swot-analysis.md` | Weekly/strategic SWOT pass | Quadrant entries with evidence |
| `stakeholder-impact.md` | Policy decision announced | Impact by stakeholder group |
| `significance-scoring.md` | Deciding what to publish | Composite score → publish/skip |
| `synthesis-summary.md` | Daily synthesis (aggregation) | Combined intelligence dashboard |
| `per-file-political-intelligence.md` | Per-file AI analysis | Full deep analysis per document |

---

## 📚 Related Scripts

| Path | Purpose |
|------|---------|
| `scripts/analysis-framework/` | Core analysis pipeline (TypeScript) |
| `scripts/analysis-framework/lenses/` | Per-perspective classifiers (citizen, economic, government, international, media, opposition) |
| `scripts/analysis-framework/significance-scorer.ts` | Significance score computation |
| `scripts/analysis-framework/cross-reference.ts` | Cross-document reference linking |
| `scripts/pre-article-analysis/data-persistence.ts` | MCP data persistence to `analysis/data/` |
| `scripts/pre-article-analysis/data-downloader.ts` | Document download from riksdag-regering-mcp |
| `scripts/pre-article-analysis/pdf-converter.ts` | PDF-to-text/markdown conversion utility |
| `scripts/ai-analysis/` | AI-assisted analysis generation |
| `scripts/ai-analysis/swot/` | SWOT generation pipeline |
| `scripts/prompts/v1/political-analysis.md` | LLM prompt templates for analysis |
| `scripts/prompts/v1/swot-generation.md` | SWOT-specific LLM prompts |
| `scripts/prompts/v1/stakeholder-perspectives.md` | Stakeholder lens prompts |

---

## 🔗 Related Documentation

- [📐 ARCHITECTURE.md](../ARCHITECTURE.md) — System architecture overview
- [🧠 MINDMAP.md](../MINDMAP.md) — Conceptual relationship map
- [🔄 FLOWCHART.md](../FLOWCHART.md) — Data flow diagrams
- [🛡️ THREAT_MODEL.md](../THREAT_MODEL.md) — Platform threat analysis
- [💼 SWOT.md](../SWOT.md) — Platform strategic analysis
- [🔐 SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md) — Security controls

---

## 🤖 Per-File AI Analysis (Primary Analysis Mode)

The primary analysis mode is **per-file AI analysis**: for every downloaded MCP data file, the AI agent produces a deep analysis markdown file stored alongside it. This replaces the older batch daily analysis approach.

### How It Works

```mermaid
flowchart LR
    A["📥 MCP Download<br/>(scripts)"] --> B["📋 Catalog<br/>pending files"]
    B --> C["📖 AI reads<br/>methodology docs"]
    C --> D["🔍 Per-file analysis<br/>following template"]
    D --> E["💾 {id}.analysis.md<br/>alongside data"]
    E --> F["📊 Compose<br/>daily synthesis"]

    style A fill:#0d6efd,color:#fff
    style D fill:#28a745,color:#fff
    style F fill:#6f42c1,color:#fff
```

| Step | Action | Tool / Reference |
|------|--------|-----------------|
| 1. Download | Scripts fetch MCP data to `analysis/data/` | `scripts/populate-analysis-data.ts` |
| 2. Catalog | List files needing analysis | `scripts/catalog-downloaded-data.ts --pending-only` |
| 3. Read methods | AI reads ALL methodology docs before analyzing | `analysis/methodologies/*.md` |
| 4. Analyze | AI fills per-file template for each data file | `analysis/templates/per-file-political-intelligence.md` |
| 5. Write | Save `{id}.analysis.md` next to `{id}.json` | e.g. `analysis/data/documents/propositions/H901.analysis.md` |
| 6. Synthesize | Compose daily synthesis from per-file analyses | `analysis/daily/YYYY-MM-DD/synthesis-summary.md` |

> **Quality Standard:** Every per-file analysis must match [SWOT.md](../SWOT.md) and [THREAT_MODEL.md](../THREAT_MODEL.md) formatting quality — Hack23 header badges, color-coded Mermaid diagrams, evidence tables with confidence labels, and actionable intelligence.

### Methodology Documents (AI Must Read Before Analyzing)

| Priority | Document | Key Content |
|:--------:|----------|-------------|
| 🔴 1 | [political-swot-framework.md](methodologies/political-swot-framework.md) | Evidence hierarchy, confidence levels, temporal decay, aggregation |
| 🔴 2 | [political-risk-methodology.md](methodologies/political-risk-methodology.md) | 5×5 Likelihood×Impact matrix, coalition risk index |
| 🔴 3 | [political-threat-framework.md](methodologies/political-threat-framework.md) | STRIDE-to-political mapping, threat actor matrix |
| 🟠 4 | [political-classification-guide.md](methodologies/political-classification-guide.md) | Sensitivity levels, domain taxonomy, urgency matrix |
| 🟠 5 | [political-style-guide.md](methodologies/political-style-guide.md) | Writing standards, evidence density, attribution |
| 🟠 6 | [ai-driven-analysis-guide.md](methodologies/ai-driven-analysis-guide.md) | Per-file protocol, quality gates, document-type focus |

### Analysis Prompts (v2)

| Prompt | Purpose |
|--------|---------|
| [per-file-intelligence-analysis.md](../scripts/prompts/v2/per-file-intelligence-analysis.md) | Step-by-step per-file analysis protocol |
| [political-analysis.md](../scripts/prompts/v2/political-analysis.md) | Core political analysis framework (6 lenses) |
| [swot-generation.md](../scripts/prompts/v2/swot-generation.md) | SWOT generation with pre-computed data |
| [political-risk-prompt.md](../scripts/prompts/v2/political-risk-prompt.md) | Risk assessment prompt |
| [political-threat-prompt.md](../scripts/prompts/v2/political-threat-prompt.md) | Threat analysis prompt |
| [quality-criteria.md](../scripts/prompts/v2/quality-criteria.md) | Quality self-assessment rubric (≥7/10) |

### Conflict Resolution

When multiple workflows run concurrently:
- **Per-file analyses** (`{id}.analysis.md`) are inherently conflict-free — each file analyzed independently
- **Daily synthesis** files should use append-or-replace strategy: later runs overwrite earlier synthesis
- **Weekly aggregations** compose from per-file analyses, not from daily synthesis

---

## 📚 Related Scripts

| Path | Purpose |
|------|---------|
| `scripts/catalog-downloaded-data.ts` | Catalog downloaded files, list pending analysis |
| `scripts/populate-analysis-data.ts` | Standalone MCP data fetcher (7 data types) |
| `scripts/pre-article-analysis.ts` | Orchestrates 10-step analysis pipeline |
| `scripts/analysis-framework/` | Core analysis pipeline (TypeScript) |
| `scripts/analysis-framework/lenses/` | Per-perspective classifiers (citizen, economic, government, international, media, opposition) |
| `scripts/analysis-framework/significance-scorer.ts` | Significance score computation |
| `scripts/analysis-framework/cross-reference.ts` | Cross-document reference linking |
| `scripts/pre-article-analysis/data-persistence.ts` | MCP data persistence to `analysis/data/` |
| `scripts/pre-article-analysis/data-downloader.ts` | Document download from riksdag-regering-mcp |
| `scripts/ai-analysis/` | AI-assisted analysis generation |
| `scripts/ai-analysis/swot/` | SWOT generation pipeline |
| `scripts/analysis-reader.ts` | Read daily analysis files with fallback |
| `scripts/prompts/v2/` | LLM prompt templates for analysis (v2) |

---

## 🔗 Related Documentation

- [📐 ARCHITECTURE.md](../ARCHITECTURE.md) — System architecture overview
- [🧠 MINDMAP.md](../MINDMAP.md) — Conceptual relationship map
- [🔄 FLOWCHART.md](../FLOWCHART.md) — Data flow diagrams
- [🛡️ THREAT_MODEL.md](../THREAT_MODEL.md) — Platform threat analysis (**formatting exemplar**)
- [💼 SWOT.md](../SWOT.md) — Platform strategic analysis (**formatting exemplar**)
- [🔐 SECURITY_ARCHITECTURE.md](../SECURITY_ARCHITECTURE.md) — Security controls

---

**Document Control:**  
- **Repository:** https://github.com/Hack23/riksdagsmonitor  
- **Path:** `/analysis/README.md`  
- **Format:** Markdown  
- **Classification:** Public  
- **Next Review:** 2026-06-28
