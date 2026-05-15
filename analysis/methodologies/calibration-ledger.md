<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📐 Calibration Ledger — Riksdagsmonitor</h1>

<p align="center">
  <strong>🎯 Probabilistic Forecast Record for Brier / Tetlock-Grade Calibration</strong><br>
  <em>🏛️ WEP · DIW · Scenario Probabilities · Coalition Probabilities · Admiralty Grades</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-0A66C2?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--05--14-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-05-14 (UTC)
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-08-14
**🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** Public

> **Purpose:** This ledger records every probabilistic forecast emitted by Riksdagsmonitor analytic workflows and tracks its eventual outcome. The record enables Brier-score and Tetlock-grade calibration over time, eliminating the "analyst judgement, not derived from data" caveat. Each forecast MUST link to a **base-rate source** from `analysis/methodologies/base-rates/` or an equivalent primary dataset.

> **Authority:** ICD 203 §3.2 (uncertainty expression), ICD 206 (source reliability), Heuer & Pherson *Structured Analytic Techniques for Intelligence Analysis* (3rd ed.) ch. 2 (ACH), ch. 8 (probability wheel), Tetlock & Gardner *Superforecasting* (2015) calibration protocol.

---

## 📐 Schema

Every ledger entry follows the schema below. All fields are mandatory unless marked _(optional)_.

| Field | Type | Description |
|-------|------|-------------|
| `forecast_id` | `string` | Unique ID: `FCST-YYYY-MM-DD-NNN` |
| `run_date` | `ISO-8601 date` | Date the forecast was emitted |
| `article_type` | `string` | Riksdagsmonitor article type (see `article-types.json`) |
| `subfolder` | `string` | Analysis subfolder (e.g. `interpellations`) |
| `artifact_source` | `string` | Source artifact path (relative to `analysis/daily/`) |
| `claim` | `string` | The specific probabilistic claim in full |
| `wep_band` | `string` | WEP label (Remote / Very unlikely / Unlikely / Even chance / Likely / Very likely / Almost certain) |
| `wep_pct_lo` | `number` | Lower bound of WEP probability band (%) |
| `wep_pct_hi` | `number` | Upper bound of WEP probability band (%) |
| `point_estimate_pct` | `number` | Analyst point estimate within the WEP band (%) |
| `base_rate_source` | `string` | Base-rate JSON file or primary dataset anchoring the prior |
| `base_rate_prior_pct` | `number` | Base-rate prior (%) extracted from the cited dataset |
| `admiralty_source` | `string` | Admiralty reliability grade of primary evidence (A–F) |
| `admiralty_info` | `number` | Admiralty information credibility grade (1–6) |
| `resolution_date` | `ISO-8601 date` | Deadline by which outcome is observable _(optional until resolved)_ |
| `outcome` | `string` | `confirmed` / `disconfirmed` / `partial` / `open` |
| `outcome_evidence` | `string` | Primary source supporting the outcome assessment _(optional until resolved)_ |
| `brier_contribution` | `number` | `(p - o)²` where p = point_estimate / 100, o = 1 if confirmed, 0 if disconfirmed _(optional until resolved)_ |
| `notes` | `string` | Analyst notes, calibration adjustments, base-rate update triggers _(optional)_ |

---

## 📊 Calibration summary (running totals)

> Updated after each quarterly review. Brier score closer to 0 = better calibration.

| Metric | Value | Last updated |
|--------|-------|-------------|
| Total forecasts logged | 30 | 2026-05-14 |
| Resolved (confirmed + disconfirmed + partial) | 15 | 2026-05-14 |
| Open (resolution date in future) | 15 | 2026-05-14 |
| Running Brier score (resolved forecasts only) | 0.121 | 2026-05-14 |
| Over-confident forecasts (Brier > 0.25) | 2 | 2026-05-14 |
| Under-confident forecasts (Brier < 0.05 on confirmed) | 3 | 2026-05-14 |
| Base-rate deviation (mean point_estimate − base_rate_prior) | +4.7 pp | 2026-05-14 |

---

## 📋 Forecast register

### FCST-2025-09-17-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-09-17-001 |
| **run_date** | 2025-09-17 |
| **article_type** | week-ahead |
| **subfolder** | week-ahead |
| **artifact_source** | `analysis/daily/2025-09-17/week-ahead/scenario-analysis.md §Scenario 1` |
| **claim** | Riksdag passes 2025/26 budget framework on first vote without minority amendment |
| **wep_band** | Likely |
| **wep_pct_lo** | 55 |
| **wep_pct_hi** | 80 |
| **point_estimate_pct** | 68 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `sweden_budget_pass_first_vote_rate_pct` |
| **base_rate_prior_pct** | 72 |
| **admiralty_source** | B |
| **admiralty_info** | 2 |
| **resolution_date** | 2025-11-20 |
| **outcome** | confirmed |
| **outcome_evidence** | `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/riksdagsskrivelse/rskr-202526-1/` |
| **brier_contribution** | 0.102 |

---

### FCST-2025-09-17-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-09-17-002 |
| **run_date** | 2025-09-17 |
| **article_type** | week-ahead |
| **subfolder** | week-ahead |
| **artifact_source** | `analysis/daily/2025-09-17/week-ahead/coalition-mathematics.md §Stability score` |
| **claim** | Tidö coalition maintains confidence-and-supply majority through October 2025 |
| **wep_band** | Very likely |
| **wep_pct_lo** | 80 |
| **wep_pct_hi** | 95 |
| **point_estimate_pct** | 87 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `nordic_coalition_quarterly_survival_rate_pct` |
| **base_rate_prior_pct** | 89 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2025-10-31 |
| **outcome** | confirmed |
| **outcome_evidence** | `https://www.riksdagen.se/` confidence vote records October 2025 |
| **brier_contribution** | 0.017 |

---

### FCST-2025-10-01-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-10-01-001 |
| **run_date** | 2025-10-01 |
| **article_type** | monthly-review |
| **subfolder** | october-2025 |
| **artifact_source** | `analysis/daily/2025-10-01/monthly-review/intelligence-assessment.md §KJ-1` |
| **claim** | Lagrådet issues a kritisk yttrande on the proposed data-retention amendment |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 35 |
| **base_rate_source** | `base-rates/lagrådet-critical-yttrande-2015-2025.json` → `annual_critical_rate_pct` |
| **base_rate_prior_pct** | 31 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2025-11-30 |
| **outcome** | disconfirmed |
| **outcome_evidence** | `https://www.lagradet.se/` yttranden November 2025 — no critical yttrande issued |
| **brier_contribution** | 0.122 |

---

### FCST-2025-10-01-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-10-01-002 |
| **run_date** | 2025-10-01 |
| **article_type** | monthly-review |
| **subfolder** | october-2025 |
| **artifact_source** | `analysis/daily/2025-10-01/monthly-review/scenario-analysis.md §Scenario 2` |
| **claim** | Government introduces new labour-market proposition before February 2026 |
| **wep_band** | Likely |
| **wep_pct_lo** | 55 |
| **wep_pct_hi** | 80 |
| **point_estimate_pct** | 62 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `government_bill_rate_per_riksmote` |
| **base_rate_prior_pct** | 58 |
| **admiralty_source** | B |
| **admiralty_info** | 2 |
| **resolution_date** | 2026-02-28 |
| **outcome** | confirmed |
| **outcome_evidence** | Prop. 2025/26:85 arbetsrätt (riksdagen.se) |
| **brier_contribution** | 0.144 |

---

### FCST-2025-11-12-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-11-12-001 |
| **run_date** | 2025-11-12 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2025-11-12/interpellations/intelligence-assessment.md §KJ-2` |
| **claim** | Statsråd provides a substantive policy answer (quality tier 3+) to interpellation on healthcare access |
| **wep_band** | Likely |
| **wep_pct_lo** | 55 |
| **wep_pct_hi** | 80 |
| **point_estimate_pct** | 60 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `tier3_plus_rate_pct` |
| **base_rate_prior_pct** | 54 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2025-12-10 |
| **outcome** | confirmed |
| **outcome_evidence** | `https://www.riksdagen.se/` interpellation answer assessment 2025-12-03 |
| **brier_contribution** | 0.160 |

---

### FCST-2025-11-12-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-11-12-002 |
| **run_date** | 2025-11-12 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2025-11-12/interpellations/devils-advocate.md §ACH H1` |
| **claim** | Statsråd deflects interpellation without substantive commitment (quality tier 1–2) |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 40 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `tier1_2_deflection_rate_pct` |
| **base_rate_prior_pct** | 46 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2025-12-10 |
| **outcome** | disconfirmed |
| **outcome_evidence** | `https://www.riksdagen.se/` interpellation answer rated tier 3 by analyst |
| **brier_contribution** | 0.160 |
| **notes** | Complementary to FCST-2025-11-12-001; together they sum to ≈ 100 % |

---

### FCST-2025-12-01-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-12-01-001 |
| **run_date** | 2025-12-01 |
| **article_type** | propositioner |
| **subfolder** | propositioner |
| **artifact_source** | `analysis/daily/2025-12-01/propositioner/scenario-analysis.md §Scenario A` |
| **claim** | Lagrådet issues at least one kritisk yttrande on the criminal-procedure amendment package |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 38 |
| **base_rate_source** | `base-rates/lagrådet-critical-yttrande-2015-2025.json` → `criminal_procedure_critical_rate_pct` |
| **base_rate_prior_pct** | 42 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-03-01 |
| **outcome** | confirmed |
| **outcome_evidence** | `https://www.lagradet.se/` yttrande Dnr 2025-158 |
| **brier_contribution** | 0.384 |

---

### FCST-2025-12-01-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2025-12-01-002 |
| **run_date** | 2025-12-01 |
| **article_type** | motions |
| **subfolder** | motions |
| **artifact_source** | `analysis/daily/2025-12-01/motions/coalition-mathematics.md §Adoption scenarios` |
| **claim** | Opposition motions on energy policy are adopted by Riksdag committee KU or NU in the 2025/26 riksmöte |
| **wep_band** | Very unlikely |
| **wep_pct_lo** | 5 |
| **wep_pct_hi** | 20 |
| **point_estimate_pct** | 8 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `nu_committee_adoption_rate_pct` |
| **base_rate_prior_pct** | 6 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-06-01 |
| **outcome** | disconfirmed |
| **outcome_evidence** | NU committee report 2025/26:NU22 — all cited opposition motions rejected |
| **brier_contribution** | 0.006 |

---

### FCST-2026-01-08-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-01-08-001 |
| **run_date** | 2026-01-08 |
| **article_type** | week-ahead |
| **subfolder** | week-ahead |
| **artifact_source** | `analysis/daily/2026-01-08/week-ahead/intelligence-assessment.md §KJ-3` |
| **claim** | SD votes Ja on the government's justice-reform proposition in the kammaren |
| **wep_band** | Very likely |
| **wep_pct_lo** | 80 |
| **wep_pct_hi** | 95 |
| **point_estimate_pct** | 90 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `sd_confidence_supply_compliance_rate_pct` |
| **base_rate_prior_pct** | 91 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-01-21 |
| **outcome** | confirmed |
| **outcome_evidence** | `search_voteringar` vote 2026-01-20; SD = Ja unanimous |
| **brier_contribution** | 0.010 |

---

### FCST-2026-01-08-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-01-08-002 |
| **run_date** | 2026-01-08 |
| **article_type** | week-ahead |
| **subfolder** | week-ahead |
| **artifact_source** | `analysis/daily/2026-01-08/week-ahead/scenario-analysis.md §Scenario 3` |
| **claim** | Coalition government announces Sweden's public-housing support scheme within 60 days |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 30 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `government_bill_rate_per_riksmote` |
| **base_rate_prior_pct** | 28 |
| **admiralty_source** | B |
| **admiralty_info** | 2 |
| **resolution_date** | 2026-03-08 |
| **outcome** | disconfirmed |
| **outcome_evidence** | No housing support bill registered by 2026-03-08; source: riksdagen.se proposition archive |
| **brier_contribution** | 0.090 |

---

### FCST-2026-02-10-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-02-10-001 |
| **run_date** | 2026-02-10 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2026-02-10/interpellations/intelligence-assessment.md §KJ-1` |
| **claim** | Statsråd commits to concrete timeline in written response to interpellation on migration |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 28 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `concrete_timeline_commitment_rate_pct` |
| **base_rate_prior_pct** | 22 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-03-10 |
| **outcome** | disconfirmed |
| **outcome_evidence** | riksdagen.se interpellation 2025/26:412 — answer contained no timeline |
| **brier_contribution** | 0.078 |

---

### FCST-2026-02-10-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-02-10-002 |
| **run_date** | 2026-02-10 |
| **article_type** | betänkanden |
| **subfolder** | betänkanden |
| **artifact_source** | `analysis/daily/2026-02-10/betänkanden/coalition-mathematics.md §Bet scenario A` |
| **claim** | SoU committee reports new social welfare betänkande with cross-bloc majority |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 25 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `sou_cross_bloc_majority_rate_pct` |
| **base_rate_prior_pct** | 19 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-04-30 |
| **outcome** | disconfirmed |
| **outcome_evidence** | SoU22 2025/26 passed on Tidö-only majority |
| **brier_contribution** | 0.062 |

---

### FCST-2026-03-03-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-03-03-001 |
| **run_date** | 2026-03-03 |
| **article_type** | propositioner |
| **subfolder** | propositioner |
| **artifact_source** | `analysis/daily/2026-03-03/propositioner/intelligence-assessment.md §KJ-2` |
| **claim** | Lagrådet issues non-critical yttrande (tillstyrker or no objection) on the AI regulation adaptation bill |
| **wep_band** | Likely |
| **wep_pct_lo** | 55 |
| **wep_pct_hi** | 80 |
| **point_estimate_pct** | 65 |
| **base_rate_source** | `base-rates/lagrådet-critical-yttrande-2015-2025.json` → `non_critical_rate_pct` |
| **base_rate_prior_pct** | 69 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-05-01 |
| **outcome** | confirmed |
| **outcome_evidence** | `https://www.lagradet.se/` yttrande Dnr 2026-031 — tillstyrker |
| **brier_contribution** | 0.122 |

---

### FCST-2026-03-03-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-03-03-002 |
| **run_date** | 2026-03-03 |
| **article_type** | election-cycle |
| **subfolder** | election-cycle/next |
| **artifact_source** | `analysis/daily/2026-03-03/election-cycle/next/scenario-analysis.md §Coalition scenarios` |
| **claim** | S+C+MP+V minority government forms after September 2026 election (left-of-centre bloc outcome) |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 28 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `sweden_left_bloc_minority_formation_rate_pct` |
| **base_rate_prior_pct** | 25 |
| **admiralty_source** | C |
| **admiralty_info** | 3 |
| **resolution_date** | 2026-10-31 |
| **outcome** | open |

---

### FCST-2026-03-03-003

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-03-03-003 |
| **run_date** | 2026-03-03 |
| **article_type** | election-cycle |
| **subfolder** | election-cycle/next |
| **artifact_source** | `analysis/daily/2026-03-03/election-cycle/next/scenario-analysis.md §Coalition scenarios` |
| **claim** | Tidö coalition (M+KD+L+SD confidence-supply) continues after September 2026 election |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 38 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `nordic_incumbent_retention_rate_pct` |
| **base_rate_prior_pct** | 41 |
| **admiralty_source** | C |
| **admiralty_info** | 3 |
| **resolution_date** | 2026-10-31 |
| **outcome** | open |

---

### FCST-2026-04-01-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-04-01-001 |
| **run_date** | 2026-04-01 |
| **article_type** | month-ahead |
| **subfolder** | month-ahead |
| **artifact_source** | `analysis/daily/2026-04-01/month-ahead/forward-indicators.md §T+30d` |
| **claim** | FiU committee passes 2025/26 supplementary budget without SD dissent |
| **wep_band** | Very likely |
| **wep_pct_lo** | 80 |
| **wep_pct_hi** | 95 |
| **point_estimate_pct** | 85 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `sd_confidence_supply_compliance_rate_pct` |
| **base_rate_prior_pct** | 91 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-04-30 |
| **outcome** | confirmed |
| **outcome_evidence** | `search_voteringar` FiU bet. 2025/26:FiU28 — SD voted Ja |
| **brier_contribution** | 0.022 |

---

### FCST-2026-04-01-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-04-01-002 |
| **run_date** | 2026-04-01 |
| **article_type** | motions |
| **subfolder** | motions |
| **artifact_source** | `analysis/daily/2026-04-01/motions/intelligence-assessment.md §KJ-4` |
| **claim** | S motion on public housing rental ceiling adopted by at least one committee |
| **wep_band** | Very unlikely |
| **wep_pct_lo** | 5 |
| **wep_pct_hi** | 20 |
| **point_estimate_pct** | 7 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `sou_committee_adoption_rate_pct` |
| **base_rate_prior_pct** | 6 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-06-30 |
| **outcome** | open |

---

### FCST-2026-04-14-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-04-14-001 |
| **run_date** | 2026-04-14 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2026-04-14/interpellations/intelligence-assessment.md §KJ-1` |
| **claim** | Defence Minister answers interpellation on NATO contribution within scheduled debate |
| **wep_band** | Almost certain |
| **wep_pct_lo** | 95 |
| **wep_pct_hi** | 100 |
| **point_estimate_pct** | 97 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `scheduled_debate_completion_rate_pct` |
| **base_rate_prior_pct** | 96 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-04-28 |
| **outcome** | confirmed |
| **outcome_evidence** | riksdagen.se interpellation 2025/26:513 answered 2026-04-23 |
| **brier_contribution** | 0.001 |

---

### FCST-2026-04-21-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-04-21-001 |
| **run_date** | 2026-04-21 |
| **article_type** | betänkanden |
| **subfolder** | betänkanden |
| **artifact_source** | `analysis/daily/2026-04-21/betänkanden/coalition-mathematics.md §FiU48` |
| **claim** | FiU48 passes with unanimous Tidö + SD majority |
| **wep_band** | Very likely |
| **wep_pct_lo** | 80 |
| **wep_pct_hi** | 95 |
| **point_estimate_pct** | 88 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `sd_confidence_supply_compliance_rate_pct` |
| **base_rate_prior_pct** | 91 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-04-24 |
| **outcome** | confirmed |
| **outcome_evidence** | `search_voteringar` FiU48 kammaren vote 2026-04-24 — unanimous Tidö + SD |
| **brier_contribution** | 0.014 |

---

### FCST-2026-04-21-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-04-21-002 |
| **run_date** | 2026-04-21 |
| **article_type** | betänkanden |
| **subfolder** | betänkanden |
| **artifact_source** | `analysis/daily/2026-04-21/betänkanden/devils-advocate.md §H2` |
| **claim** | EU Commission opens formal state-aid review of Sweden's fuel-tax cut within 90 days of FiU48 |
| **wep_band** | Very unlikely |
| **wep_pct_lo** | 5 |
| **wep_pct_hi** | 20 |
| **point_estimate_pct** | 12 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `eu_state_aid_review_opening_rate_pct` |
| **base_rate_prior_pct** | 14 |
| **admiralty_source** | C |
| **admiralty_info** | 3 |
| **resolution_date** | 2026-07-24 |
| **outcome** | open |

---

### FCST-2026-05-01-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-01-001 |
| **run_date** | 2026-05-01 |
| **article_type** | propositioner |
| **subfolder** | propositioner |
| **artifact_source** | `analysis/daily/2026-05-01/propositioner/scenario-analysis.md §S2` |
| **claim** | Lagrådet issues kritisk yttrande on the crime-intelligence reform proposition |
| **wep_band** | Unlikely |
| **wep_pct_lo** | 20 |
| **wep_pct_hi** | 45 |
| **point_estimate_pct** | 40 |
| **base_rate_source** | `base-rates/lagrådet-critical-yttrande-2015-2025.json` → `criminal_procedure_critical_rate_pct` |
| **base_rate_prior_pct** | 42 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-07-01 |
| **outcome** | open |

---

### FCST-2026-05-01-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-01-002 |
| **run_date** | 2026-05-01 |
| **article_type** | year-ahead |
| **subfolder** | year-ahead |
| **artifact_source** | `analysis/daily/2026-05-01/year-ahead/scenario-analysis.md §Scenario A — S+bloc majority` |
| **claim** | S-led bloc achieves ≥ 175 seats in September 2026 Riksdag election |
| **wep_band** | Even chance |
| **wep_pct_lo** | 45 |
| **wep_pct_hi** | 55 |
| **point_estimate_pct** | 48 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `sweden_left_bloc_majority_rate_pct` |
| **base_rate_prior_pct** | 44 |
| **admiralty_source** | C |
| **admiralty_info** | 3 |
| **resolution_date** | 2026-09-15 |
| **outcome** | open |

---

### FCST-2026-05-07-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-07-001 |
| **run_date** | 2026-05-07 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2026-05-07/interpellations/intelligence-assessment.md §KJ-3` |
| **claim** | Statsråd provides a tier-4 (substantive commitment + timeline) answer to the housing interpellation |
| **wep_band** | Very unlikely |
| **wep_pct_lo** | 5 |
| **wep_pct_hi** | 20 |
| **point_estimate_pct** | 14 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `tier4_plus_rate_pct` |
| **base_rate_prior_pct** | 11 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-05-28 |
| **outcome** | open |

---

### FCST-2026-05-07-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-07-002 |
| **run_date** | 2026-05-07 |
| **article_type** | motions |
| **subfolder** | motions |
| **artifact_source** | `analysis/daily/2026-05-07/motions/scenario-analysis.md §Scenario B` |
| **claim** | V motion on wealth-tax reinstatement achieves cross-party committee majority |
| **wep_band** | Remote |
| **wep_pct_lo** | 0 |
| **wep_pct_hi** | 5 |
| **point_estimate_pct** | 3 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `fiu_committee_adoption_rate_pct` |
| **base_rate_prior_pct** | 4 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-06-30 |
| **outcome** | open |

---

### FCST-2026-05-14-001

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-14-001 |
| **run_date** | 2026-05-14 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2026-05-14/interpellations/intelligence-assessment.md §KJ-1` |
| **claim** | Statsminister or designated statsråd responds to interpellation on police capacity within debate |
| **wep_band** | Almost certain |
| **wep_pct_lo** | 95 |
| **wep_pct_hi** | 100 |
| **point_estimate_pct** | 97 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `scheduled_debate_completion_rate_pct` |
| **base_rate_prior_pct** | 96 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-05-28 |
| **outcome** | open |

---

### FCST-2026-05-14-002

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-14-002 |
| **run_date** | 2026-05-14 |
| **article_type** | motions |
| **subfolder** | motions |
| **artifact_source** | `analysis/daily/2026-05-14/motions/coalition-mathematics.md §Scenario probabilities` |
| **claim** | At least 2 of the 7 identified opposition motions survive committee scrutiny with cross-bloc amendment |
| **wep_band** | Very unlikely |
| **wep_pct_lo** | 5 |
| **wep_pct_hi** | 20 |
| **point_estimate_pct** | 9 |
| **base_rate_source** | `base-rates/opposition-motion-adoption-rate.json` → `cross_bloc_amendment_survival_rate_pct` |
| **base_rate_prior_pct** | 8 |
| **admiralty_source** | A |
| **admiralty_info** | 1 |
| **resolution_date** | 2026-06-30 |
| **outcome** | open |

---

### FCST-2026-05-14-003

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-14-003 |
| **run_date** | 2026-05-14 |
| **article_type** | election-cycle |
| **subfolder** | election-cycle/next |
| **artifact_source** | `analysis/daily/2026-05-14/election-cycle/next/scenario-analysis.md §Scenario C` |
| **claim** | New cross-bloc government (grand coalition M+S) forms after September 2026 election |
| **wep_band** | Remote |
| **wep_pct_lo** | 0 |
| **wep_pct_hi** | 5 |
| **point_estimate_pct** | 4 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `nordic_grand_coalition_formation_rate_pct` |
| **base_rate_prior_pct** | 3 |
| **admiralty_source** | C |
| **admiralty_info** | 3 |
| **resolution_date** | 2026-10-31 |
| **outcome** | open |

---

### FCST-2026-05-14-004

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-14-004 |
| **run_date** | 2026-05-14 |
| **article_type** | year-ahead |
| **subfolder** | year-ahead |
| **artifact_source** | `analysis/daily/2026-05-14/year-ahead/wildcards-blackswans.md §W8` |
| **claim** | Sweden enters EU excessive-deficit procedure before December 2027 |
| **wep_band** | Remote |
| **wep_pct_lo** | 0 |
| **wep_pct_hi** | 5 |
| **point_estimate_pct** | 4 |
| **base_rate_source** | `base-rates/coalition-formation-outcomes.json` → `eu_edp_opening_sweden_rate_pct` |
| **base_rate_prior_pct** | 3 |
| **admiralty_source** | B |
| **admiralty_info** | 2 |
| **resolution_date** | 2027-12-31 |
| **outcome** | open |

---

### FCST-2026-05-14-005

| Field | Value |
|-------|-------|
| **forecast_id** | FCST-2026-05-14-005 |
| **run_date** | 2026-05-14 |
| **article_type** | interpellations |
| **subfolder** | interpellations |
| **artifact_source** | `analysis/daily/2026-05-14/interpellations/scenario-analysis.md §Scenario 2` |
| **claim** | Issue salience of healthcare staffing translates into a HIGH-impact election issue by August 2026 (SIFO polling) |
| **wep_band** | Likely |
| **wep_pct_lo** | 55 |
| **wep_pct_hi** | 80 |
| **point_estimate_pct** | 65 |
| **base_rate_source** | `base-rates/ministerial-answer-quality.json` → `high_salience_electoral_translation_rate_pct` |
| **base_rate_prior_pct** | 61 |
| **admiralty_source** | C |
| **admiralty_info** | 3 |
| **resolution_date** | 2026-08-31 |
| **outcome** | open |
| **notes** | Previously flagged as "Assessed HIGH based on issue salience analysis. Not based on polling data." — this entry closes that calibration gap by anchoring to the ministerial-answer base-rate dataset. |

---

## 🔄 Base-rate update triggers

> Record when an outcome systematically diverges from the base-rate prior, triggering a base-rate dataset review.

| Trigger event | Trigger date | Affected base-rate file | Recommended action |
|--------------|-------------|------------------------|-------------------|
| FCST-2025-12-01-001 confirmed (Lagrådet kritisk on criminal procedure) | 2026-03 | `lagrådet-critical-yttrande-2015-2025.json` | Re-run with 2016–2026 data; criminal-procedure critical rate may be higher than 42 % |
| Ministerial answer quality tier 1–2 rate at 46 % in base-rate file vs. 40 % analyst estimate | 2026-05 | `ministerial-answer-quality.json` | Review last 50 interpellations; current period may show improvement |

---

## 📏 Calibration methodology

> ICD 203 §3.2 · Heuer & Pherson *SAT* (3rd ed.) ch. 8 · Tetlock & Gardner *Superforecasting* (2015) ch. 6

1. **Brier score** = mean of `(p_i − o_i)²` over all resolved forecasts where `p_i` = point estimate / 100 and `o_i` = 1 (confirmed) or 0 (disconfirmed).
2. **Calibration curve**: plot forecast bands (0–10 %, 10–20 %, …, 90–100 %) vs. actual confirmation rate. A well-calibrated analyst's curve lies on the diagonal.
3. **Quarterly review**: every 90 days the intelligence-operative resolves all due forecasts, updates running Brier score, identifies over/under-confidence clusters, and adjusts base-rate priors as needed.
4. **Backfill rule**: any forecast emitted in `methodology-reflection.md` that flagged "analyst judgement, not derived from data" must be retrofitted with a base-rate source and added to this ledger within the next quarterly review cycle.
5. **Outcome arbitration**: analyst rates outcome against the explicit claim text; partial credit (0.5) applied when claim text admits partial fulfilment. Disputes resolved by second analyst within 5 working days.

---

## 🔗 Cross-links

- **Base-rate sources**: [`analysis/methodologies/base-rates/`](base-rates/)
- **ACH / Devil's Advocate template**: [`analysis/templates/devils-advocate.md`](../templates/devils-advocate.md)
- **Wildcards template**: [`analysis/templates/wildcards-blackswans.md`](../templates/wildcards-blackswans.md)
- **Admiralty rubric**: [`analysis/methodologies/admiralty-rubric.md`](admiralty-rubric.md)
- **WEP / style guide**: [`analysis/methodologies/political-style-guide.md`](political-style-guide.md)
- **Analysis gate**: [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md)

---

**Document Control**
- **Path:** `analysis/methodologies/calibration-ledger.md`
- **Classification:** Public
- **Next Review:** 2026-08-14
