# 📊 Riksdagsmonitor Analysis Framework

## Overview

This directory serves as the **shared knowledge base** for all agentic workflows in Riksdagsmonitor. Analysis results are generated here by data pipelines, AI analysis workflows, and intelligence operatives, then consumed by news generation workflows to produce high-quality articles.

The framework adapts **Information Security Management System (ISMS)** methodologies from [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) and applies them systematically to **political intelligence analysis**.

## Directory Structure

```
analysis/
├── README.md                           # This file — framework documentation
├── reference/                          # ISMS reference documents (downloaded)
│   ├── isms-classification.md          # From ISMS-PUBLIC/CLASSIFICATION.md
│   ├── isms-threat-modeling.md         # From ISMS-PUBLIC/Threat_Modeling.md
│   ├── isms-risk-assessment.md         # From ISMS-PUBLIC/Risk_Assessment_Methodology.md
│   ├── isms-style-guide.md             # From ISMS-PUBLIC/STYLE_GUIDE.md
│   ├── cia-swot.md                     # From cia/SWOT.md
│   └── riksdagsmonitor-threat-model.md # From riksdagsmonitor/THREAT_MODEL.md
├── daily/                              # Daily analysis outputs
│   └── YYYY-MM-DD/                     # Date-partitioned
│       ├── documents-downloaded.md     # Manifest of all downloaded documents
│       ├── political-significance.md   # Significance scoring results
│       ├── stakeholder-swot.md         # Multi-stakeholder SWOT analysis
│       ├── pestle-analysis.md          # PESTLE analysis results
│       ├── risk-assessment.md          # Risk & opportunity assessment
│       ├── coalition-dynamics.md       # Coalition analysis
│       ├── executive-summary.md        # Executive summary for article writers
│       └── raw/                        # Raw document data (JSON, gitignored)
│           └── *.json
├── weekly/                             # Weekly aggregated analysis
│   └── YYYY-WXX/                       # Week-partitioned
│       ├── weekly-synthesis.md
│       ├── trend-analysis.md
│       └── key-developments.md
├── monthly/                            # Monthly aggregated analysis
│   └── YYYY-MM/
│       ├── monthly-synthesis.md
│       ├── policy-landscape.md
│       └── strategic-assessment.md
└── templates/                          # Analysis output templates
    ├── daily-analysis-template.md
    ├── weekly-synthesis-template.md
    ├── monthly-assessment-template.md
    ├── swot-template.md
    ├── risk-assessment-template.md
    └── classification-template.md
```

## ISMS → Political Intelligence Methodology Mapping

The following table maps established ISMS concepts to their political intelligence equivalents. Each reference document in `analysis/reference/` provides the foundational methodology that is adapted for political analysis.

| ISMS Concept | Reference Document | Political Intelligence Equivalent | Application |
|---|---|---|---|
| **Information Classification** (C/I/A) | `isms-classification.md` | **Political Document Classification** (Sensitivity/Impact/Urgency) | Classify political documents by sensitivity level, potential impact on governance, and urgency of coverage |
| **Threat Modeling** (STRIDE) | `isms-threat-modeling.md` | **Political Threat Assessment** (Stakeholder/Risk/Impact/Dynamics/Evolution) | Systematic identification of political risks using adapted STRIDE categories |
| **Risk Assessment** (Likelihood × Impact) | `isms-risk-assessment.md` | **Political Risk Scoring** (Probability × Consequence) | Quantitative scoring of political developments using calibrated likelihood and impact scales |
| **SWOT Analysis** | `cia-swot.md` | **Multi-Stakeholder SWOT** (Government/Parliament/Civil Society) | Strategic assessment from multiple political perspectives with evidence citations |
| **Style Guide** | `isms-style-guide.md` | **Editorial Standards & Analytical Writing Quality** | Consistent terminology, citation standards, and analytical writing quality |
| **Threat Model** | `riksdagsmonitor-threat-model.md` | **Platform Risk Categorization** | Risk categorization and mitigation patterns for the monitoring platform itself |

### STRIDE → Political Threat Categories

| STRIDE Category | Political Intelligence Adaptation | Example |
|---|---|---|
| **S**poofing | **Disinformation** — False attribution of statements or positions | Misrepresenting party positions on policy |
| **T**ampering | **Data Manipulation** — Altering records or statistics | Selective presentation of voting records |
| **R**epudiation | **Accountability Gaps** — Denying actions or commitments | Politicians denying previous policy positions |
| **I**nformation Disclosure | **Leaks & Premature Disclosure** — Unauthorized information release | Leaked committee deliberations or draft legislation |
| **D**enial of Service | **Obstruction** — Blocking democratic processes | Filibustering, procedural delays, committee boycotts |
| **E**levation of Privilege | **Power Abuse** — Exceeding mandated authority | Executive overreach, bypassing parliamentary oversight |

### Classification Levels for Political Documents

Adapted from the ISMS classification framework:

| Dimension | Levels | Description |
|---|---|---|
| **Sensitivity** | `public` / `restricted` / `confidential` | How sensitive is the political content? |
| **Impact** | `critical` / `high` / `medium` / `low` | What is the potential impact on governance? |
| **Urgency** | `breaking` / `major` / `standard` / `background` | How urgently should this be reported? |

### Risk Scoring Matrix

Adapted from the ISMS risk assessment methodology:

| | Impact: Low (1) | Impact: Medium (2) | Impact: High (3) | Impact: Critical (4) |
|---|---|---|---|---|
| **Probability: Very Likely (4)** | 4 | 8 | 12 | 16 |
| **Probability: Likely (3)** | 3 | 6 | 9 | 12 |
| **Probability: Possible (2)** | 2 | 4 | 6 | 8 |
| **Probability: Unlikely (1)** | 1 | 2 | 3 | 4 |

**Risk Thresholds:**
- **Critical** (12-16): Immediate coverage required, breaking news priority
- **High** (8-11): Major article topic, same-day coverage
- **Medium** (4-7): Standard article inclusion, routine monitoring
- **Low** (1-3): Background monitoring, weekly synthesis inclusion

## Integration with Existing Pipeline

### AnalysisResult Interface Alignment

The analysis output templates are designed to align with the existing `AnalysisResult` TypeScript interface defined in `scripts/ai-analysis/types.ts`:

| AnalysisResult Field | Template Section | Analysis Output |
|---|---|---|
| `stakeholderSwot` | `swot-template.md` | Multi-stakeholder SWOT with evidence citations |
| `policyAssessment` | `daily-analysis-template.md` § Policy Assessment | Policy domain and narrative analysis |
| `watchPoints` | `risk-assessment-template.md` § Watch Points | Detected risk indicators with urgency levels |
| `confidenceScore` | All templates § Metadata | Analysis confidence scoring (0-100) |
| `dashboardData` | `daily-analysis-template.md` § Dashboard Data | Visualization-ready metrics |
| `mindmapBranches` | `daily-analysis-template.md` § Conceptual Map | Conceptual relationship mapping |

### Workflow Integration

```
┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐
│  Data Download    │───▶│  Analysis Pipeline │───▶│  analysis/daily/ │
│  (riksdag-api)   │    │  (ai-analysis/)    │    │  (markdown)      │
└──────────────────┘    └────────────────────┘    └────────┬─────────┘
                                                           │
┌──────────────────┐    ┌────────────────────┐             │
│  Reference Docs  │───▶│  Methodology       │─────────────┘
│  (analysis/ref/) │    │  Application       │
└──────────────────┘    └────────────────────┘
                                                           │
                        ┌────────────────────┐    ┌────────▼─────────┐
                        │  News Generation   │◀───│  Executive       │
                        │  (generate-news/)  │    │  Summary         │
                        └────────────────────┘    └──────────────────┘
```

## Populating Reference Documents

To download or update the ISMS reference documents:

```bash
npx tsx scripts/download-isms-references.ts
```

This script fetches the latest versions of all 6 reference documents from their respective GitHub repositories and saves them to `analysis/reference/`.

## Data Retention

- **`analysis/daily/*/raw/`** — Raw JSON data files are **gitignored** (large, regeneratable)
- **`analysis/daily/*.md`** — Markdown analysis files are **tracked in git** for transparency and audit trail
- **`analysis/weekly/`** and **`analysis/monthly/`** — Aggregated analyses are tracked in git
- **`analysis/reference/`** — ISMS reference documents are tracked in git
- **`analysis/templates/`** — Templates are tracked in git

---

**Document Control:**
- **Owner:** Hack23 AB
- **Classification:** Public
- **Created:** 2026-03-25
- **Framework Version:** 1.0.0
