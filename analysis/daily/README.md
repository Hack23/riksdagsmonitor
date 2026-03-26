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
├── YYYY-MM-DD/          ← ISO 8601 date (always zero-padded)
│   ├── morning-significance-scores.json
│   ├── morning-classification.md
│   ├── morning-risk-snapshot.md
│   ├── evening-swot-update.md
│   ├── evening-stakeholder-impact.md
│   ├── evening-threat-snapshot.md
│   ├── realtime-HHMM-classification.md   ← timestamped (e.g. realtime-1000-classification.md)
│   └── realtime-HHMM-risk-delta.md
```

The filenames above are **aggregated time-of-day artifacts** for a given date (morning, evening, realtime).
Per-event political classification artifacts follow the separate convention defined in
`analysis/templates/political-classification.md`: `YYYY-MM-DD-{event-slug}-classification.md` (one file per political event).
Both naming schemes are intentional and complementary.

**Rules:**
- Always use `YYYY-MM-DD` — never `DD-MM-YYYY`, `MM/DD/YYYY`, or named months
- Zero-pad day and month: `2026-03-05` not `2026-3-5`
- If multiple runs occur on the same day, append to the same directory (never create `2026-03-26-v2/`)
- Realtime files are timestamped `HHMM` in 24-hour UTC: `realtime-1400-classification.md`

---

## 📁 Files Created Per Day

### 🌅 Morning Files (created by scheduled daily workflows: `news-committee-reports` 04:00, `news-propositions` 05:00, `news-motions` 06:00, `news-interpellations` 07:00 UTC Mon–Fri)

| File | Format | Purpose | Template |
|------|--------|---------|----------|
| `morning-significance-scores.json` | JSON | Ranked list of all political events with composite significance scores | TypeScript significance scorer (`scripts/analysis-framework/significance-scorer.ts`) |
| `morning-classification.md` | Markdown | Event classification results for all scored events | `political-classification.md` |
| `morning-risk-snapshot.md` | Markdown | Current risk landscape based on morning MCP data | `risk-assessment.md` |

### 🌆 Evening Files (created by `news-evening-analysis`, 18:00 UTC Mon–Fri / 16:00 UTC Sat)

| File | Format | Purpose | Template |
|------|--------|---------|----------|
| `evening-swot-update.md` | Markdown | Delta SWOT — what changed from morning assessment | `swot-analysis.md` |
| `evening-stakeholder-impact.md` | Markdown | Stakeholder impact assessment for top events | `stakeholder-impact.md` |
| `evening-threat-snapshot.md` | Markdown | Updated threat landscape after full day's events | `threat-analysis.md` |

### 📡 Realtime Files (created by `news-realtime-monitor`, 10:00+14:00 UTC Mon–Fri / 12:00 UTC weekends)

| File | Format | Purpose | Template |
|------|--------|---------|----------|
| `realtime-HHMM-classification.md` | Markdown | Point-in-time event classifications | `political-classification.md` |
| `realtime-HHMM-risk-delta.md` | Markdown | Risk score changes since previous realtime run | `risk-assessment.md` delta format |

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
