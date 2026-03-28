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
├── data/                              ← Persistent MCP data repository
│   ├── README.md                      ← Data repository documentation
│   ├── documents/                     ← Parliamentary documents by type
│   │   ├── propositions/              ← Government propositions (dok_id.json)
│   │   ├── motions/                   ← Parliamentary motions
│   │   ├── committeeReports/          ← Committee reports
│   │   ├── votes/                     ← Voting records
│   │   ├── speeches/                  ← Parliamentary speeches
│   │   ├── questions/                 ← Written questions
│   │   ├── interpellations/           ← Interpellations
│   │   └── government/                ← Government documents (SOU, Ds)
│   ├── votes/                         ← Date-stamped vote ballots (YYYY-MM-DD/)
│   ├── events/                        ← Date-stamped calendar events (YYYY-MM-DD/)
│   └── mps/                           ← MP profiles (intressent_id.json)
├── templates/                         ← Reusable analysis templates
│   ├── political-classification.md    ← Event classification template
│   ├── risk-assessment.md             ← Political risk template
│   ├── threat-analysis.md             ← STRIDE-inspired threat template
│   ├── swot-analysis.md               ← SWOT quadrant template
│   ├── stakeholder-impact.md          ← Stakeholder impact template
│   └── significance-scoring.md        ← Significance scoring template
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

The following agentic workflows are intended to write analysis artifacts to this directory **before** article generation. This persistence layer is being established incrementally — workflows listed below will write to `analysis/` as each is updated to support the analysis output pipeline:

### 🌅 Daily Morning Workflows (scheduled Mon–Fri)

The following per-type workflows produce morning analysis artifacts. `news-article-generator` is **manual-only** (`workflow_dispatch`) and is not scheduled:

| Workflow | Schedule | Primary Output |
|----------|----------|----------------|
| `news-committee-reports` | 04:00 UTC Mon–Fri | Committee report articles |
| `news-propositions` | 05:00 UTC Mon–Fri | Proposition articles |
| `news-motions` | 06:00 UTC Mon–Fri | Motion articles |
| `news-interpellations` | 07:00 UTC Mon–Fri | Interpellation articles |

These workflows read from `riksdag-regering-mcp` (32 tools) and write analysis artifacts to `analysis/daily/YYYY-MM-DD/`:
- `morning-significance-scores.json` — ranked political events
- `morning-classification.md` — event classification results
- `morning-risk-snapshot.md` — current risk landscape

### 🌆 `news-evening-analysis` (18:00 UTC Mon–Fri, 16:00 UTC Sat)
Reads from: `analysis/daily/YYYY-MM-DD/morning-*.md` + live MCP data  
Writes to: `analysis/daily/YYYY-MM-DD/`  
Produces:
- `evening-swot-update.md` — daily SWOT delta
- `evening-stakeholder-impact.md` — impact assessment
- `evening-threat-snapshot.md` — updated threat landscape

### 📡 `news-realtime-monitor` (10:00+14:00 UTC Mon–Fri, 12:00 UTC weekends)
Reads from: live riksdag-regering-mcp data  
Writes to: `analysis/daily/YYYY-MM-DD/`  
Produces:
- `realtime-HHMM-classification.md` — timestamped event classifications
- `realtime-HHMM-risk-delta.md` — risk changes since last run

### 📅 `news-week-ahead` (Weekly, Fridays 07:00 UTC)
Reads from: `analysis/daily/YYYY-MM-DD/` for the current ISO week-to-date (Mon–Thu + any Fri artifacts before 07:00 UTC)  
Writes to: `analysis/weekly/YYYY-WNN/`  
Produces:
- `week-summary-swot.md` — aggregated weekly SWOT
- `week-ahead-risk-register.md` — projected risks for next week
- `week-ahead-calendar.md` — upcoming legislative and political calendar
- `week-significance-trends.md` — significance score trends

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

**Document Control:**  
- **Repository:** https://github.com/Hack23/riksdagsmonitor  
- **Path:** `/analysis/README.md`  
- **Format:** Markdown  
- **Classification:** Public  
- **Next Review:** 2026-06-26
# Analysis Directory

This directory contains pre-computed political intelligence analysis files, methodologies, and output templates for the Riksdagsmonitor article generation pipeline.

## Directory Structure

```
analysis/
├── README.md                           ← This file
├── methodologies/                      ← Analysis framework documentation
│   ├── political-style-guide.md       ← Political Intelligence Style Guide (v1.0)
│   └── ...                            ← Additional methodology docs
└── daily/                             ← Daily pre-computed analysis output
    └── YYYY-MM-DD/                    ← Date-stamped analysis directories
        ├── classification-results.md  ← Document classification and priority
        ├── risk-assessment.md         ← Risk level analysis and factors
        ├── swot-analysis.md           ← SWOT analysis (pre-computed)
        ├── threat-analysis.md         ← Threat indicators and democratic health
        ├── stakeholder-perspectives.md ← Multi-perspective analysis (6 lenses)
        ├── significance-scoring.md    ← Significance scores and urgency
        └── synthesis-summary.md       ← Overall narrative direction
```

## Usage

The `scripts/analysis-reader.ts` module reads these files and provides a structured TypeScript API for article generators.

```typescript
import { readDailyAnalysis } from '../scripts/analysis-reader.js';

const analysis = await readDailyAnalysis('2026-03-26');
if (analysis.hasAnalysis) {
  const { classification, riskAssessment, swot, significance } = analysis;
  // Use pre-computed data to enrich article generation
} else {
  // Fallback: perform inline analysis using ai-analysis and analysis-framework modules
}
```

## Fallback Behavior

When daily analysis files are absent, article generators fall back to inline analysis using:
- `scripts/ai-analysis/` — SWOT and risk analysis modules
- `scripts/analysis-framework/` — Multi-perspective analysis framework

See `scripts/analysis-reader.ts` for the complete API and fallback logic.

## Methodologies

See `analysis/methodologies/political-style-guide.md` for the comprehensive Political Intelligence Style Guide governing:
- Article structure standards per article type
- Writing quality requirements (evidence density, attribution, confidence)
- Icon conventions for classification levels
- Forward indicator requirements
- Multi-language translation standards
