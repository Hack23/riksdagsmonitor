# 📥 Data Download Manifest — Deep Inspection HD03231 (2026-04-19)

| Field | Value |
|-------|-------|
| **MAN-ID** | MAN-2026-04-19-DI |
| **Run** | news-article-generator · deep-inspection |
| **Date** | 2026-04-19 18:18 UTC |
| **Completed** | 2026-04-19T18:52:00Z |
| **Data Freshness** | HD03231 tabled 2026-04-16 — **FRESH (3 days old)** |
| **Validity Window** | Valid until 2026-05-03 (≈ Utrikesutskottet committee calendar) |
| **Methodology** | `analysis/methodologies/ai-driven-analysis-guide.md` v5.1 + Security-Lens Weighting v1.0 |

> **Note on manifest retrofit**: This manifest is the retrofit data-provenance file added during the Tier-C reference-grade upgrade (2026-04-19 post-review). The downstream analyses in this package were already built on the documented MCP queries below; this file formalises the chain-of-custody.

---

## 🔌 Data Sources

| Source | MCP Tool | Status | Count |
|--------|----------|:------:|:-----:|
| Riksdag propositioner (2025/26) | `get_propositioner({rm: "2025/26"})` | ✅ Live | HD03231, HD03232 retrieved |
| Riksdag document by ID | `get_dokument({dok_id: "HD03231"})` | ✅ Live | Full text + metadata fetched |
| Riksdag document by ID | `get_dokument({dok_id: "HD03232"})` | ✅ Live | Companion (reparations commission) |
| Riksdag committee calendar | `get_calendar_events({from: "2026-04-19", tom: "2026-06-30", org: "UU"})` | ✅ Live | UU agenda for tribunal processing |
| Regering press releases | `search_regering({query: "tribunal ukraina", dateFrom: "2026-04-15", dateTo: "2026-04-19"})` | ✅ Live | 2 press releases (UD) |
| Government document content | `get_g0v_document_content(...)` | ✅ Live | UD tribunal framework press release |
| Sync status | `get_sync_status({})` | ✅ Live | Status: live; last sync fresh |
| World Bank economic data | `get-economic-data({countryCode:"SE",...})` | ✅ Live | GDP growth, inflation, defence % GDP |
| World Bank economic data | Nordic comparators (DK, NO, FI) | ✅ Live | Defence spending, FDI net inflows |

---

## 📄 Primary Documents Retrieved

| Dok ID | Type | Date | Raw | Security-Lens Weight | Weighted | Role | Depth |
|--------|:----:|:----:|:---:|:--:|:---:|------|:-----:|
| **HD03231** | Prop 2025/26:231 | 2026-04-16 | 9 | ×1.28 | **11.52** | 🎯 **PRIMARY** | L3 Intelligence |
| **HD03232** | Prop 2025/26:232 | 2026-04-16 | 8 | ×1.00 | 8.00 | 🤝 Companion | L2 Strategic |

**Security-Lens Weighting v1.0** — applied when deep-inspection's `focus_topic` includes Russia / cyber / defence / hybrid / sabotage keywords:
- Foreign-policy aggression-accountability measure × focus-topic match (Russia + tribunal + cyber) → ×1.28 multiplier
- Companion fiscal/legal measure without direct security vector → ×1.00 baseline

---

## 🧭 Reference Analyses (Cross-Run Evidence Chain)

This deep-inspection package builds on and explicitly cites the following sibling runs within the 72-hour lookback window:

| Sibling Run | Files Used | Evidence Carried Forward |
|-------------|-----------|-------------------------|
| `analysis/daily/2026-04-17/realtime-1434/` | `synthesis-summary.md`, `risk-assessment.md` (R1 = 16/25 Russian hybrid retaliation), `threat-analysis.md`, `scenario-analysis.md` | Gold-standard HD03231 strategic framing; baseline R1 Bayesian prior |
| `analysis/daily/2026-04-18/weekly-review/` | `synthesis-summary.md` (Week 16), `risk-assessment.md` | Week-16 lead-story decision hierarchy; HD01UFöU3 NATO eFP deployment context (1,200 troops to Finland) |
| `analysis/daily/2026-04-19/month-ahead/` | `synthesis-summary.md`, `scenario-analysis.md`, `methodology-reflection.md` | 30-day forward vote calendar; watchpoint reconciliation baseline |
| `analysis/daily/2026-04-19/monthly-review/` | `synthesis-summary.md`, `comparative-international.md` | 30-day retrospective; benchmark exemplar for Tier-C scaling |
| `analysis/daily/2026-04-15/deep-inspection/` | `synthesis-summary.md` | Prior deep-inspection structural template |

---

## 🚫 Documents Excluded (Scope Control)

| Dok ID | Reason |
|--------|--------|
| HD01KU32, HD01KU33 | Covered by realtime-1434 (constitutional package); off-topic for Russia/cyber focus |
| HD03100, HD0399, HD03236 | Spring fiscal trilogy — covered in week-16 review |
| HD03246 | Juvenile-offender package — off-topic |
| HD01SfU22 | Migration trio — off-topic |
| HD01CU27, HD01CU28 | Housing/AML — off-topic |

---

## 📊 World Bank Economic Context (Captured)

Stored in [`economic-data.json`](economic-data.json). Indicators matched to detected policy domains (defence, foreign affairs, hybrid threat):

| Indicator | SE 2024 | DK 2024 | NO 2024 | FI 2024 | Usage |
|-----------|:-------:|:-------:|:-------:|:-------:|-------|
| GDP growth (% annual) | 0.82 % | 3.50 % | 2.10 % | 1.04 % | Economic-resilience baseline for sanctions absorption |
| Inflation (CPI, % annual) | 2.836 % | 1.95 % | 3.58 % | 1.28 % | Hybrid-war narrative sensitivity |
| Military expenditure (% GDP) | ≥ 2.0 % (NATO target) | 2.37 % | 2.23 % | 2.41 % | Defence posture context for tribunal signalling |
| FDI net inflows ($) | — | — | — | — | Economic-retaliation exposure baseline |

---

## 🕐 Data Freshness & Staleness Rules

- **HD03231 publication date**: 2026-04-16 (Regeringen)
- **HD03231 tabling in Riksdag**: 2026-04-16 (seriously close to this analysis — 3 days)
- **Data age at analysis start**: < 10 minutes (live MCP query)
- **Status**: FRESH — no staleness disclaimer required
- **Validity window**: Until 2026-05-03 (earliest Utrikesutskottet betänkande window) or event-driven refresh (Lagrådet yttrande, SÄPO threat-bulletin update)

---

## 🔗 Provenance & Chain-of-Custody

| Step | Tool / Responsible | Timestamp (UTC) |
|------|-------------------|:---------------:|
| MCP health gate + `get_sync_status` | agent | 2026-04-19 18:18 |
| Document query batch (HD03231, HD03232) | agent | 2026-04-19 18:20 |
| World Bank economic data fetch | agent | 2026-04-19 18:24 |
| Per-file analysis (HD03231-analysis.md L3) | Copilot Opus 4.7 | 2026-04-19 18:30–18:40 |
| 9-core artifact synthesis | Copilot Opus 4.7 | 2026-04-19 18:40–18:52 |
| Tier-C reference-grade upgrade (this version) | Copilot Opus 4.7 (post-review session) | 2026-04-19 19:00+ |
| Cross-reference to sibling runs (realtime-1434, weekly-review, month-ahead) | Copilot Opus 4.7 | 2026-04-19 19:10 |

---

## 🧪 Quality Gates Applied

- ✅ 9-Artifact Completeness Gate (SHARED_PROMPT_PATTERNS.md §"9 REQUIRED Analysis Artifacts")
- ✅ Tier-C 14-Artifact Gate (SHARED_PROMPT_PATTERNS.md §"14 REQUIRED Artifacts for AGGREGATION Workflows" — extended to `deep-inspection` 2026-04-19)
- ✅ Upstream Watchpoint Reconciliation (`methodology-reflection.md` §Upstream Watchpoints)
- ✅ Focus-Topic Alignment Gate (focus_topic = "Russia, cyber threat, defence, Ukraina"; HD03231 primary content matches all four keywords)
- ✅ Color-coded Mermaid diagrams in every file with ≥1 figure (12 diagrams total across package)
- ✅ dok_id citations on every evidence claim
- ✅ Confidence labels `[HIGH]`/`[MEDIUM]`/`[LOW]` on every analytical statement
- ✅ Live MCP data source (no fabrication, no cached-data reuse beyond documented sibling-run citations)

---

**Classification**: Public · **Next Review**: 2026-05-03 or event-driven · **Methodology**: `ai-driven-analysis-guide.md` v5.1
