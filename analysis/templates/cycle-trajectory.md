<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📈 Cycle Trajectory Template</h1>

<p align="center">
  <strong>🗳️ The 24th Artifact — Election-Cycle Workflow ONLY</strong><br>
  <em>📊 Multi-Year Trend · ICD 203 BLUF · Horizon Bands T+1y / T+2y / T+5y</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Version-1.0-0A66C2?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Effective-2026--05--01-success?style=for-the-badge" alt="Effective Date"/>
  <img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-05-01 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** Public

> **📌 Template instructions:** Produce ONLY for `news-election-cycle`. Save as `analysis/daily/${ARTICLE_DATE}/election-cycle/${CYCLE_ANCHOR}/cycle-trajectory.md`. **Blocking** for the cycle workflow's analysis gate (see `.github/prompts/05-analysis-gate.md` § long-horizon checks). Other workflows MUST NOT produce this artifact.

> **✨ What to produce:** A multi-year trend assessment of Swedish political-economic trajectory across the full 4-year mandate, expressed as ICD 203 BLUF + WEP per year, with explicit horizon bands T+1y / T+2y / T+5y. Combines SCB national-accounts trajectory + IMF WEO multi-vintage projections + Riksdag throughput metrics (vote counts, committee productivity, KU reprimands).

---

## 🔄 Tradecraft Context

| Element | Value |
|---------|-------|
| **Methodology** | Multi-year trend synthesis (Strategic Extensions + Long-Horizon Forecasting); ICD 203 BLUF mandatory at every horizon band |
| **Primary sources** | SCB national accounts (NR0103), IMF WEO (multi-vintage compare across at least Apr + Oct of the cycle), Riksdag voteringar bulk export, KU årsredogörelse |
| **Time-frame** | Full mandate (≥ 4 years) |
| **Update cadence** | Twice yearly (March + September) at every cycle workflow run |
| **Cycle anchor** | `current` (Tidö 2022-26) OR `next` (post-2026) — derived from registry |
| **Audience** | Decision-makers, civil-society groups, journalists, academic political-science readers |

---

## 1 — BLUF (ICD 203)

```
TRAJECTORY-BLUF — <CYCLE_ID>:
  We assess [WEP] that the <CYCLE_LABEL> will <outcome statement>
  with confidence [HIGH/MEDIUM/LOW] [horizon:cycle].
  Key driver: <single most important factor>.
  Falsification trigger: <specific dated event that would update this assessment>.
```

Every word matters. WEP language at the `cycle` band cannot exceed `likely` without ≥ 3 cycle-aged corroborated sources.

---

## 2 — Horizon-Stratified Year-by-Year Outlook

For each of the four mandate years, populate:

### Year T+1 (closest year)

| Dimension | Trajectory | WEP | Confidence | Sources |
|-----------|------------|-----|------------|---------|
| Macro (NGDP_RPCH) | … | … | … | IMF WEO …; SCB … |
| Fiscal (GGXWDG_NGDP) | … | … | … | IMF FM …; ESV … |
| Coalition cohesion | … | … | … | Voteringar … |
| Legislative throughput (votes/year) | … | … | … | Riksdag bulk … |
| KU reprimands (count/year) | … | … | … | KU årsredogörelse … |

### Year T+2 (mid-mandate)
*(same dimension table)*

### Year T+3
*(same dimension table)*

### Year T+5 (post-mandate, projection)
*(same dimension table — IMF projection-year stamps mandatory)*

**Aggregator rule.** Each year's table must be present **even if** the trajectory is "no observable change yet" — the deliberate emptiness encodes the WEP correctly.

---

## 3 — Multi-Vintage IMF Compare

| Indicator | WEO Apr-2026 (T+1) | WEO Oct-2026 (T+1) | Delta | Implication |
|-----------|---------------------|----------------------|-------|--------------|
| NGDP_RPCH (SWE) | … | … | … | … |
| GGXWDG_NGDP (SWE) | … | … | … | … |
| (Nordic peers DNK, NOR, FIN — same indicators) | … | … | … | … |

> A delta > 0.3 pp between vintages MUST trigger an editorial review note in `methodology-reflection.md`.

---

## 4 — Cumulative Riksdag Throughput

For the cycle being analysed:

| Metric | Cycle-to-date | Annual run-rate | vs prev cycle | Note |
|--------|---------------|------------------|----------------|-------|
| Total propositions tabled | … | … | … | … |
| Total motions tabled | … | … | … | … |
| Total chamber votes | … | … | … | … |
| Average coalition cohesion | … | … | … | … |
| KU reprimands count | … | … | … | … |
| Lagrådet `kritik` count | … | … | … | … |

---

## 5 — Cycle-Anchor-Specific Block

### When `cycleAnchor=current` (Tidö Mandate scorecard mode)

A condensed scorecard table mirroring `election-2026-analysis.md → mandate fulfilment` but ordered by topic. ≥ 10 rows expected (Tidö-agreement bullets, ranked by KCRIT).

### When `cycleAnchor=next` (Coalition formation forecast mode)

A 4 × 3 = 12-leaf scenario table:

| Base scenario (top-level) | Probability | Branch (governing coalition) | Branch probability | Implication |
|---------------------------|-------------|--------------------------------|----------------------|--------------|
| (4 base scenarios × 3 governing-coalition branches each) | sum 100 % | … | sum 100 % within branch | … |

Each branch lists which parties form government, who provides confidence support, and the opposition. Branches are anchored on Sainte-Laguë seat projections (cite source + retrieved-at).

---

## 6 — Falsification Triggers

| Trigger | Threshold | Horizon | Source | Action if breached |
|---------|-----------|---------|--------|---------------------|
| (≥ 5 rows) … | … | T+1y / T+2y / T+5y | … | … |

---

## 7 — Pass-2 Self-Audit

- [ ] BLUF present + WEP at `cycle` band passes degradation rule
- [ ] Year-by-year tables populated for T+1, T+2, T+3, T+5
- [ ] Multi-vintage IMF compare ≥ 4 indicators × ≥ 4 countries (SWE + 3 Nordic peers)
- [ ] Riksdag throughput table populated with cycle-to-date and prev-cycle comparison
- [ ] Cycle-anchor-specific block (`current` scorecard or `next` 12-leaf forecast)
- [ ] Falsification triggers ≥ 5 rows with thresholds + sources
- [ ] Every WEP term carries `[horizon:<band>]` tag
- [ ] IMF citations carry projection-year stamps T+1 / T+2 / T+5

---

## 8 — Filename + Aggregator

This template is canonical at `cycle-trajectory.md`. Aggregator section title: **"Cycle Trajectory"**. Loaded by `scripts/render-lib/aggregator/order.ts` only when `subfolder=election-cycle`.
