<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📅 Daily Analysis Directory</h1>

<p align="center">
  <strong>📊 Per-Day Analysis Artifacts from Agentic Workflows</strong><br>
  <em>🎯 YYYY-MM-DD naming · Morning · Evening · Realtime artifacts</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

The `analysis/daily/` directory stores per-day analysis artifacts produced by Riksdagsmonitor's agentic workflows. Each day that an agentic workflow runs, a new subdirectory is created using the ISO 8601 date format `YYYY-MM-DD`. These artifacts are **intermediate products** — they feed into article generation and weekly aggregation but are not published directly.

---

## 📅 Naming Convention

```
analysis/daily/
├── YYYY-MM-DD/                  ← ISO 8601 date (always zero-padded)
│   ├── committeeReports/        ← Committee reports analysis (news-committee-reports workflow)
│   │   ├── synthesis-summary.md
│   │   ├── classification-results.md
│   │   ├── risk-assessment.md
│   │   ├── swot-analysis.md
│   │   ├── threat-analysis.md
│   │   ├── stakeholder-perspectives.md
│   │   ├── significance-scoring.md
│   │   ├── cross-reference-map.md
│   │   ├── data-download-manifest.md
│   │   └── documents/           ← Per-document analysis files
│   ├── propositions/            ← Government propositions (news-propositions workflow)
│   │   └── (same 9 batch files + documents/)
│   ├── motions/                 ← Opposition motions (news-motions workflow)
│   │   └── (same 9 batch files + documents/)
│   ├── interpellations/         ← Interpellation debates (news-interpellations workflow)
│   │   └── (same 9 batch files + documents/)
│   ├── evening-analysis/        ← Evening analysis (news-evening-analysis workflow)
│   │   └── (same 9 batch files + documents/)
│   ├── realtime-HHMM/           ← Time-stamped realtime (news-realtime-monitor workflow)
│   │   └── (same 9 batch files + documents/)
│   ├── week-ahead/              ← Week-ahead forecasting (news-week-ahead workflow)
│   │   └── (same 9 batch files)
│   ├── month-ahead/             ← Month-ahead forecasting (news-month-ahead workflow)
│   │   └── (same 9 batch files)
│   ├── weekly-review/           ← Weekly review (news-weekly-review workflow)
│   │   └── (same 9 batch files)
│   ├── monthly-review/          ← Monthly review (news-monthly-review workflow)
│   │   └── (same 9 batch files)
│   └── general/                 ← Legacy unscoped files (pre-April 2026)
```

**🚨 CRITICAL: Every article type MUST use its own subdirectory.** Never write analysis `.md` files directly to the `YYYY-MM-DD/` root directory. This prevents merge conflicts when multiple workflows run concurrently on the same date. The `analysis-reader.ts` automatically scans subdirectories.

**Rules:**
- Always use `YYYY-MM-DD` — never `DD-MM-YYYY`, `MM/DD/YYYY`, or named months
- Zero-pad day and month: `2026-03-05` not `2026-3-5`
- Each workflow writes ONLY to its own article-type subdirectory
- Never write `.md` files to the root date directory — always use a subfolder
- Realtime files are timestamped `HHMM` in 24-hour UTC: `realtime-1400/`
- If a workflow runs without `--doc-type`, it MUST relocate artifacts using `mv` (not `cp`) into its subfolder

---

## 📁 Files Created Per Article Type

Each article-type subdirectory contains the same 9 batch analysis files:

| File | Format | Purpose | Template |
|------|--------|---------|----------|
| `synthesis-summary.md` | Markdown | Overall synthesis of all analyzed documents | `analysis/templates/synthesis-summary.md` |
| `classification-results.md` | Markdown | Event classification results | `analysis/templates/political-classification.md` |
| `risk-assessment.md` | Markdown | Risk landscape assessment | `analysis/templates/risk-assessment.md` |
| `swot-analysis.md` | Markdown | Evidence-based SWOT analysis | `analysis/templates/swot-analysis.md` |
| `threat-analysis.md` | Markdown | Political threat taxonomy | `analysis/templates/threat-analysis.md` |
| `stakeholder-perspectives.md` | Markdown | Stakeholder impact assessment | `analysis/templates/stakeholder-impact.md` |
| `significance-scoring.md` | Markdown | Ranked significance scores | `analysis/templates/significance-scoring.md` |
| `cross-reference-map.md` | Markdown | Cross-references between documents | — |
| `data-download-manifest.md` | Markdown | Data sourcing and download manifest | — |

Additionally, the `documents/` subfolder contains per-document analysis files (`*.json` and `*-analysis.md`).

### Workflow → Subfolder Mapping

| Workflow | Subfolder | Schedule |
|----------|-----------|----------|
| `news-committee-reports` | `committeeReports/` | Mon–Fri 04:00 UTC |
| `news-propositions` | `propositions/` | Mon–Fri 05:00 UTC |
| `news-motions` | `motions/` | Mon–Fri 06:00 UTC |
| `news-interpellations` | `interpellations/` | Mon–Fri 07:00 UTC |
| `news-evening-analysis` | `evening-analysis/` | Mon–Fri 18:00 UTC / Sat 16:00 UTC |
| `news-realtime-monitor` | `realtime-HHMM/` | Mon–Fri 10:00+14:00 UTC / weekends 12:00 UTC |
| `news-week-ahead` | `week-ahead/` | Fridays 07:00 UTC |
| `news-month-ahead` | `month-ahead/` | Last weekday of month |
| `news-weekly-review` | `weekly-review/` | Sundays 15:00 UTC |
| `news-monthly-review` | `monthly-review/` | 1st of month |
| `news-article-generator` | `article-generator-HHMM/` or type-specific | On-demand |

---

## 🗂️ Creating a New Day's Directory

Daily directories are created automatically by agentic workflows. For manual creation:

```bash
# Create today's directory
TODAY=$(date -u +%Y-%m-%d)
mkdir -p "analysis/daily/${TODAY}"

# Verify structure
ls -la "analysis/daily/${TODAY}"
```

---

## 📊 Weekly Aggregation Cross-Reference

Daily artifacts are aggregated into weekly summaries by the `news-week-ahead` workflow (runs **Fridays 07:00 UTC**). The aggregation process:

1. Reads `morning-significance-scores.json` files for the current ISO week-to-date (Mon–Thu) plus any Fri artifacts available before 07:00 UTC
2. Identifies top-scoring events and trending topics
3. Merges daily SWOT artifacts (Mon–Thu evening + any early Fri morning) into a weekly SWOT
4. Consolidates risk deltas into a projected risk register
5. Writes aggregated output to `analysis/weekly/YYYY-WNN/`

**Week boundary:** ISO 8601 weeks run **Monday through Sunday**. The `news-week-ahead` workflow runs Friday 07:00 UTC and aggregates the current week's daily artifacts accumulated so far (Mon–Thu, plus any early Fri artifacts) to preview the upcoming parliamentary week.

---

## 🗑️ Retention Policy

| Age | Status | Storage |
|-----|--------|---------|
| 0–30 days | **Active** | Full git history; all files present |
| 31–90 days | **Recent** | Git history; may be compressed in future |
| 91+ days | **Archive** | Consider git archival branch or LFS |
| 180+ days | **Historical** | External storage; not required in working tree |

**Note:** Weekly and monthly aggregations serve as summaries for historical periods. Individual daily files older than 90 days carry lower informational value than their weekly aggregations.

---

**Document Control:**  
- **Path:** `/analysis/daily/README.md`  
- **Classification:** Public  
- **Next Review:** 2026-06-26
