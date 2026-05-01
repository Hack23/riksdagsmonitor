<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🔁 Horizon PIR Roll-Forward Template</h1>

<p align="center">
  <strong>📋 Supplementary — Captures PIR Genealogy Across Long-Horizon Runs</strong><br>
  <em>🧭 Quarter / Year / Cycle — Never Blocking, Always Recommended</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Version-1.0-0A66C2?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Effective-2026--05--01-success?style=for-the-badge" alt="Effective Date"/>
  <img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-05-01 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** Public

> **📌 Template instructions:** Produce for `news-quarter-ahead`, `news-year-ahead`, `news-election-cycle` runs whenever an immediate predecessor exists. Save as `analysis/daily/${ARTICLE_DATE}/${DOC_TYPE}/horizon-pir-rollforward.md`. **Supplementary** — never blocking on its own; if absent the workflow MUST add a `<!-- horizon-pir-rollforward: skipped — <reason> -->` comment in `methodology-reflection.md`.

> **✨ What to produce:** A genealogical record of every Priority Intelligence Requirement (PIR) carried forward from the predecessor run, plus every PIR newly created in this run, plus every PIR archived (resolved or obsoleted). Wired into `scripts/roll-forward-pirs.ts`.

---

## 🔄 Tradecraft Context

| Element | Value |
|---------|-------|
| **Methodology** | PIR roll-forward (intelligence-cycle continuity); replaces inline PIR-roll-forward prose previously scattered through `intelligence-assessment.md` and `methodology-reflection.md` |
| **Primary input** | Predecessor `pir-status.json` (most recent same-type folder) + current run's `pir-status.json` |
| **Owner** | Workflow author + `scripts/roll-forward-pirs.ts` |
| **Trigger** | Long-horizon workflow with immediate predecessor (within `lookbackDays` per registry) |
| **Audience** | Internal continuity; auditors verifying analytic discipline |

---

## 1 — Predecessor Manifest

```
Predecessor folder: analysis/daily/<YYYY-MM-DD>/<subfolder>/
Predecessor pir-status.json: <SHA-256 of file content>
Days since predecessor: <NN>
```

If no predecessor exists, this section reads:

```
First long-horizon run for this subfolder type. PIR genealogy starts at this run.
```

---

## 2 — PIR Genealogy Table

| PIR ID | First seen | Status (this run) | Origin | Successor | Notes |
|--------|------------|---------------------|---------|-----------|-------|
| PIR-1-coalition-stability | 2024-09-13 | active | inherited | — | Continued from predecessor, evidence updated |
| PIR-7-democratic-norms | 2023-04-12 | active | inherited (cycle-spanning) | — | Marked `inheritsCycle: true` |
| PIR-23-pension-reform | 2026-05-01 | new | this run | — | Created in response to BP 2027 leak |
| PIR-15-energy-policy | 2024-12-15 | archived | inherited | PIR-15b | Resolved by Energiöverenskommelsen 2.0 |
| … | … | … | … | … | … |

**Status taxonomy:** `active` | `archived` | `superseded` | `dormant` | `provisional`.

**Origin taxonomy:** `inherited` | `inherited (cycle-spanning)` | `this run` | `revived`.

---

## 3 — PIR Coverage Map

For each PIR carried forward, indicate which artifacts in this run engage with it:

| PIR ID | `intelligence-assessment.md` | `forward-indicators.md` | `scenario-analysis.md` | `risk-assessment.md` | `cycle-trajectory.md` (cycle only) |
|--------|------------------------------|----------------------|------------------------|----------------------|-----------------------------------|
| PIR-1-coalition-stability | ✅ | ✅ | ✅ | ✅ | ✅ |
| PIR-7-democratic-norms | ✅ | ✅ | — | ✅ | ✅ |
| (one row per active PIR) | … | … | … | … | … |

A PIR not engaged in any artifact is a Pass-2 rewrite trigger (it should either be archived or actively addressed).

---

## 4 — Newly Created PIRs

For each PIR created in this run:

```
### PIR-NN-<short-name>
- **Created:** <YYYY-MM-DD>
- **Owner artifact:** <e.g. risk-assessment.md>
- **Question:** <single sentence — what intelligence question is this PIR designed to answer?>
- **Confidence required to retire:** <HIGH/MEDIUM/LOW + evidence type>
- **Inherits cycle:** true | false (defaults false; only set true if the PIR is constitutional, demographic, or geopolitical in nature)
- **Obsolescence date:** <YYYY-MM-DD or "indefinite — cycle-spanning">
- **First evidence:** <dok_id or URL>
```

---

## 5 — Archived PIRs

For each PIR archived in this run:

| PIR ID | Archived reason | Successor (if any) | Final WEP / confidence | Final evidence |
|--------|-----------------|---------------------|------------------------|----------------|
| … | resolved / obsoleted / superseded / cycle-rollover | … | … | … |

---

## 6 — Cycle-Rollover Special Case

When `.github/prompts/ext/cycle-rollover.md` is active (within ± 30 days of an election anchor), this template includes an additional section:

```
### Cycle-Rollover Manifest
- Closing cycle: 2022-2026
- Opening cycle: 2026-2030
- Inherited PIRs (cycle-spanning): <count>
- Archived PIRs (cycle-bounded): <count>
- New PIRs (opening cycle baseline): <count>
- Carry-forward artifacts written to: analysis/cycles/2022-2026/
```

Outside the ± 30-day window, this section is omitted.

---

## 7 — Pass-2 Self-Audit

- [ ] Predecessor manifest populated (or first-run note present)
- [ ] PIR genealogy table covers every PIR in current `pir-status.json`
- [ ] PIR coverage map indicates which artifacts engage with each PIR
- [ ] Every newly-created PIR has all 7 fields populated
- [ ] Every archived PIR has reason + final WEP
- [ ] Cycle-rollover section present iff within ± 30 days of an election anchor

---

## 8 — Filename + Aggregator

Canonical filename `horizon-pir-rollforward.md`. Aggregator section title: **"Horizon PIR Roll-Forward"**. Loaded only by long-horizon workflows (week / month / quarter / year / cycle aheads).
