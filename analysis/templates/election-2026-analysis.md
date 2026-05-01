<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🗳️ Election Cycle Analysis Template</h1>

<p align="center">
  <strong>📊 Electoral Lens — Parameterised by Cycle Anchor (current / next)</strong><br>
  <em>🎯 Coalition Scenarios · Voter Salience · Campaign Vulnerability · Policy Legacy</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.1-0A66C2?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--04--25-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 2.0 | **📅 Last Updated:** 2026-05-01 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template instructions:** Produce for every workflow that declares `electionCycleAnchor ∈ {current, next, both}` in `analysis/article-types.json`. Save as `analysis/daily/${ARTICLE_DATE}/${DOC_TYPE}/election-2026-analysis.md` (stable filename) or `election-cycle-analysis.md` (post-rollover alias). Integrates with `voter-segmentation.md`, `coalition-mathematics.md`, and `synthesis-summary.md`.

> **✨ What to produce:** A focused electoral assessment of the day's documents against the active election cycle (resolved at runtime), classified CRITICAL → NEGLIGIBLE, with coalition-scenario consequences and a dated watchlist.

---

## 🔧 Cycle-Anchor Parameter Resolution

> **Resolution source:** `scripts/horizon-context.ts` → `activeCycleAnchor(articleDate)` + `analysis/article-types.json → electionCycles`.

| Parameter | Source | Value |
|-----------|--------|-------|
| **`cycleAnchor`** | `activeCycleAnchor(articleDate)` | `current` \| `next` |
| **`cycleStart`** | `electionCycles[cycleAnchor].start` | e.g. `2022-09-11` (current) or `2026-09-13` (next) |
| **`cycleEnd`** | `electionCycles[cycleAnchor].end` | e.g. `2026-09-13` (current) or `2030-09-08` (next) |
| **`cycleLabel`** | `electionCycles[cycleAnchor].label` | e.g. `Tidö 2022–2026` (current) or `Post-2026 Mandate` (next) |
| **`governingCoalition`** | `electionCycles[cycleAnchor].governingCoalition` | party array or `null` (next) |
| **`daysSinceCycleStart`** | `articleDate − cycleStart` (days) | computed at runtime |
| **`daysToCycleEnd`** | `cycleEnd − articleDate` (days) | computed at runtime |
| **`daysToElection`** | `daysToElection(articleDate)` | signed integer (negative = past) |

**Cycle-anchor footnote:** The Swedish general elections anchoring this template are **2026-09-13** (next election from the current cycle) and **2030-09-08** (projected next election from the post-2026 cycle). See `analysis/article-types.json → electionCycles` for the authoritative dates.

---

## 🔄 Tradecraft Context

| Element | Value |
|---------|-------|
| **F3EAD Stage** | **ANALYZE → DISSEMINATE** — electoral intelligence product |
| **PIRs Served** | **PIR-6** (Election Integrity), **PIR-1** (Coalition Stability) |
| **Admiralty Floor** | Polling data requires **[B2]** (named pollster, date, MoE); seat projections require **[B2]** |
| **WEP + ODNI** | Electoral outcome scenarios use **WEP** (likely/very likely for coalition continuity; roughly even for bloc shift); confidence **MODERATE** (polling inherent uncertainty) |
| **Source Diversity Floor** | P0 (election outcome claims): ≥4 sources (≥3 polls + ≥1 historical model); single poll labeled `[unconfirmed — single source]` |
| **SAT(s) Applied** | Morphological Analysis (bloc combinations), Indicators and Signposts (campaign milestones) |
| **ICD 203 Standards** | 2 (uncertainties — polling MoE), 5 (customer relevance — electoral calendar), 9 (visual information) |

---

## 📋 Electoral Context

| Field | Value |
|-------|-------|
| **Analysis ID** | `ELC-YYYY-MM-DD-NNN` |
| **Generated** | `YYYY-MM-DD HH:MM UTC` |
| **Cycle anchor** | `${cycleAnchor}` (`current` or `next`) |
| **Cycle label** | `${cycleLabel}` |
| **Cycle window** | `${cycleStart}` → `${cycleEnd}` |
| **Days since cycle start** | `${daysSinceCycleStart}` |
| **Days to cycle end** | `${daysToCycleEnd}` |
| **Days to election** | `${daysToElection}` |
| **Phase** | `Pre-campaign · Campaign (Aug-Sep) · Final week · Post-election` |
| **Latest SIFO (government block)** | `XX%` |
| **Latest SIFO (opposition block)** | `XX%` |
| **Electoral significance verdict** | `🔴 CRITICAL / 🟠 HIGH / 🟡 MODERATE / 🟢 LOW / ⚪ NEGLIGIBLE` |

---

## 🧭 Electoral Significance Classification

```mermaid
flowchart LR
    DOC["📄 Today's documents"] --> EVAL["🧪 Evaluate 5 dimensions"]
    EVAL --> D1["🎯 Electoral Impact"]
    EVAL --> D2["🧩 Coalition Scenarios"]
    EVAL --> D3["🫂 Voter Salience"]
    EVAL --> D4["⚔️ Campaign Vulnerability"]
    EVAL --> D5["📜 Policy Legacy"]
    D1 --> VERDICT["🏷️ Verdict<br/>CRITICAL / HIGH / MODERATE / LOW / NEGLIGIBLE"]
    D2 --> VERDICT
    D3 --> VERDICT
    D4 --> VERDICT
    D5 --> VERDICT

    style DOC fill:#1565C0,color:#FFFFFF
    style EVAL fill:#7B1FA2,color:#FFFFFF
    style VERDICT fill:#D32F2F,color:#FFFFFF
```

| Tier | Criterion | Example |
|:----:|-----------|---------|
| 🔴 CRITICAL | Event will directly affect the outcome | Coalition fracture, grundlag change, scandal confirmation |
| 🟠 HIGH | Significant pre-election narrative contribution | Fiscal package, major justice bill, foreign-policy pivot |
| 🟡 MODERATE | Peripheral electoral relevance | Sector-specific reform with indirect voter effect |
| 🟢 LOW | Minimal electoral impact | Routine administrative change |
| ⚪ NEGLIGIBLE | No discernible electoral dimension | Technical corrigenda |

---

## 🎯 5-Dimension Electoral Assessment

### Dimension 1 — Electoral Impact

| Item | Value |
|------|-------|
| Claim | `e.g., HD03236 raises incumbent retention probability by 2–4 pp` |
| Evidence | SIFO month-on-month change in target segments |
| Confidence | 🟩 HIGH |
| Net shift | +2–4 pp incumbent |

### Dimension 2 — Coalition Scenarios

| Coalition configuration | Before today | After today | Delta |
|-------------------------|:------------:|:-----------:|:-----:|
| M-KD-L + SD (current) | 47.0 % | 47.5 % | +0.5 pp |
| S-C-MP-V | 51.5 % | 51.0 % | −0.5 pp |
| Centre-grand coalition (S-C-M) | 48.0 % | 47.8 % | −0.2 pp |

### Dimension 3 — Voter Salience

| Segment | Affected (n) | Direction | Source |
|---------|:------------:|:---------:|--------|
| Rural drivers | 1.2 M | ➕ positive for incumbent | HD03236 fuel-tax |
| Suburban homeowners | 1.8 M | ➕ positive for incumbent | HD03236 energy support |
| Urban renters | 2.1 M | ➖ no benefit | HD03236 excludes rental property owners |
| Climate-conscious voters | 0.9 M | ➖ negative for incumbent | Fuel-tax cut vs. Green Deal |

### Dimension 4 — Campaign Vulnerability

| Attack vector | Who exploits | Evidence line | Severity |
|---------------|:-----------:|---------------|:--------:|
| "Regressive fuel-tax cut benefits rich" | S + V | Distributional analysis | 🟠 HIGH |
| "EU non-compliance" | MP + C | State-aid risk | 🟡 MEDIUM |
| "Ignores renters" | V | Excluded segment | 🟠 HIGH |

### Dimension 5 — Policy Legacy

| Horizon | Legacy question | Verdict |
|---------|-----------------|:-------:|
| `${cycleEnd}` (campaign / formation) | Asset or liability? | 🟢 Asset for rural districts; 🟠 Liability for urban renters |
| +1 year post-cycle | Reversible? | 🟡 Reversible but costly |
| +4 years (legacy) | Institutional change? | 🟢 No lasting institutional effect |

---

## 🧩 Coalition-Mathematics Hook

```mermaid
graph LR
    GOV["🏛️ Government bloc<br/>M + KD + L<br/>42% + SD 13% = 55"] --> SHIFT["+0.5 pp shift<br/>from HD03236"]
    SHIFT --> GOV2["🏛️ Post-shift bloc<br/>55.5"]
    OPP["🟥 Opposition bloc<br/>S + V + C + MP"] --> SHIFT2["−0.5 pp shift"]
    SHIFT2 --> OPP2["🟥 Post-shift bloc<br/>44.5"]

    style GOV fill:#1565C0,color:#FFFFFF
    style OPP fill:#D32F2F,color:#FFFFFF
    style SHIFT fill:#4CAF50,color:#FFFFFF
    style SHIFT2 fill:#FF9800,color:#FFFFFF
    style GOV2 fill:#7B1FA2,color:#FFFFFF
    style OPP2 fill:#7B1FA2,color:#FFFFFF
```

Cross-reference `coalition-mathematics.md` for full seat-projection arithmetic.

---

## 🗓️ Cycle Watchlist

> Populate with the key upcoming events within the active cycle window (`${cycleStart}` → `${cycleEnd}`).

| Date | Event | Why it matters |
|------|-------|----------------|
| `YYYY-MM-DD` | Key event within cycle | Impact on cycle outcome |
| `YYYY-MM-DD` | Polling milestone | Locks positional narrative |
| `${cycleEnd}` | **Cycle end (election / mandate expiry)** | Outcome |

---

## 🧠 Electoral-Strategy Read-Through

| Party | Most likely current move | Signal detected today |
|:-----:|------------------------------|----------------------|
| M | … | … |
| S | … | … |
| SD | … | … |
| C | … | … |
| MP | … | … |
| V | … | … |
| L | … | … |
| KD | … | … |

---

## 📊 Mandate-Fulfilment Scorecard (cycleAnchor=current ONLY)

> **Condition:** Include this section ONLY when `cycleAnchor=current`. Omit entirely when `cycleAnchor=next`.

Tracks the incumbent governing coalition's delivery against their mandate agreement (e.g., Tidö agreement for the 2022–2026 cycle).

| Domain | Agreement commitment | Status | Evidence |
|--------|---------------------|:------:|----------|
| Migration | Paradigm shift (reduced asylum) | 🟩 Delivered / 🟨 Partial / 🟥 Undelivered | `dok_id` or named act |
| Crime | Extended sentences, gang prevention | … | … |
| Energy | Nuclear planning, grid investment | … | … |
| Economy | Tax reform, fiscal consolidation | … | … |
| Healthcare | Care guarantee improvement | … | … |

| Accountability metric | Count / Status | Source |
|----------------------|:--------------:|--------|
| KU reprimands this cycle | `N` | KU årsredogörelse |
| Budget proposals delivered (BP) | `N of expected` | Riksdagen |
| Spring-bill (VP) delivery | `N of expected` | Riksdagen |
| Confidence votes survived | `N` | Voteringar |

---

## 🔮 Coalition-Formation Forecast (cycleAnchor=next ONLY)

> **Condition:** Include this section ONLY when `cycleAnchor=next`. Omit entirely when `cycleAnchor=current`.

Post-election scenario tree — assesses the most likely government-formation pathways for the upcoming mandate.

| Scenario | Parties | Projected seats | Probability (WEP) | Key assumption |
|----------|---------|:--------------:|:------------------:|----------------|
| Continuation (incumbent re-elected) | … | … | … | … |
| Centre-grand coalition | … | … | … | … |
| Left-green bloc | … | … | … | … |
| Minority government | … | … | … | … |

### Opposition trajectory

| Opposition actor | Strategic posture | Signal strength | Evidence |
|-----------------|-------------------|:--------------:|----------|
| Largest opposition party | … | … | … |
| Potential kingmaker | … | … | … |
| Threshold-risk party (< 4%) | … | … | … |

### Formation timeline

| Phase | Expected date range | Key actor | Trigger |
|-------|--------------------:|-----------|---------|
| Election day | `${cycleStart}` | Electorate | Vote |
| Exploratory talks | +1–14 days | Talman | Convention |
| Government declaration | +14–45 days | PM candidate | Riksdag vote |
| First budget (BP) | +60–120 days | New government | Fiscal calendar |

---

## 🔁 Update Cadence

| Frequency | Action |
|-----------|--------|
| Every run | Update days-to-election and phase fields |
| Weekly (Sunday) | Update SIFO figures and coalition-scenario deltas |
| On any CRITICAL event | Immediate rewrite of 5-dimension assessment |

---

## 📎 Links

| Link | Path |
|------|------|
| Voter segmentation | `voter-segmentation.md` |
| Coalition mathematics | `coalition-mathematics.md` |
| Scenario analysis | `scenario-analysis.md` |
| Synthesis summary | `synthesis-summary.md` |

---

**Document Control**
- **Template path:** `/analysis/templates/election-2026-analysis.md`
- **Also known as:** `election-cycle-analysis.md` (canonical post-rollover alias), `election-2026-implications.md` (legacy filename variant)
- **Referenced by:** [ai-driven-analysis-guide.md § Step 5](../methodologies/ai-driven-analysis-guide.md#step-5--extensions-f3ead-analyze-continued)
- **Parameter source:** `scripts/horizon-context.ts` → `activeCycleAnchor()`, `daysToElection()`; `analysis/article-types.json → electionCycles`
- **Classification:** Public
- **Next Review:** 2026-07-21

---

## ✅ Pass-2 Self-Audit Checklist (v4.4 — required)

> **Purpose:** AI-FIRST principle requires a Pass-2 read-back-and-improve. After producing this artifact in Pass 1, re-read it end-to-end and verify each item below. Document any remediation in [`methodology-reflection.md`](methodology-reflection.md) §"Pass-2 audit log". Any unchecked ❌ box at the end of Pass 2 forces a Pass-3 rewrite of the affected section.

- [ ] **Tradecraft anchors honoured** — F3EAD stage matches the artifact's role; PIRs declared in the §Tradecraft Context block are actually addressed in the body; Admiralty grades attached to every external source; WEP band + ODNI confidence on every probabilistic judgement.
- [ ] **Source diversity floor met** — at least the minimum number of independent MCP sources required by the artifact's tradecraft block are cited; single-source claims are explicitly labelled `[SINGLE-SOURCE — corroboration pending]`.
- [ ] **Evidence specificity** — every quantified claim cites a `dok_id` (Riksdag), an SCB / IMF dataflow code, or a named external source with date; no "according to data" / "studies show" hand-waves.
- [ ] **Named-actor discipline** — every political claim names ≥ 1 person (party + role + dated act/quote) or labels the absence (`[diffuse — no named actor]`).
- [ ] **Counter-narrative present** — at least one explicit competing hypothesis, dissent quote, or framed objection appears in the body; "no opposition recorded" is itself a finding to label, not silence.
- [ ] **Election cycle lens applied** — the §"Cycle Watchlist" subsection addresses electoral salience, coalition pressure, and forward indicators for the active `${cycleAnchor}` cycle; not boilerplate. If `cycleAnchor=current`, §"Mandate-Fulfilment Scorecard" is present and populated. If `cycleAnchor=next`, §"Coalition-Formation Forecast" is present and populated.
- [ ] **No illustrative content shipped as fact** — every `[REQUIRED]` placeholder is filled OR removed; every `Example:` block is clearly fenced or removed; no fabricated `dok_id`, vote count, or quote leaks into the final artifact.
- [ ] **Cross-references resolve** — every `[link](file.md)` in this artifact points to a file that exists in the run folder (`analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`) or to a methodology / template under `analysis/`.
- [ ] **Mermaid renders** — every fenced ` ```mermaid ` block parses (no missing class definitions, no orphan nodes, no >40-node graphs that overflow viewport on mobile).
- [ ] **Line-floor check** — artifact length ≥ the per-artifact floor in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json); shorter artifacts trigger Pass-2 rewrite, never a `[truncated]` note.

