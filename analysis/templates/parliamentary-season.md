<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🏛️ Parliamentary Season Template</h1>

<p align="center">
  <strong>📅 Riksmöte Calendar Lens — Quarter / Year / Cycle Workflows Only</strong><br>
  <em>🗓️ Chamber Sittings · Committee Schedules · Tabling Deadlines · Lagrådet Referrals</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Version-1.0-0A66C2?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Effective-2026--05--01-success?style=for-the-badge" alt="Effective Date"/>
  <img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-05-01 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 559534-7807) | **🏷️ Classification:** Public

> **📌 Template instructions:** Produce for `news-quarter-ahead`, `news-year-ahead`, `news-election-cycle`. Save as `analysis/daily/${ARTICLE_DATE}/${DOC_TYPE}/parliamentary-season.md`. Integrates with `forward-indicators.md`, `scenario-analysis.md`, `coalition-mathematics.md`, and the long-horizon prompt module `.github/prompts/ext/long-horizon-forecasting.md`.

> **✨ What to produce:** A calendar-driven outlook for the next 90 days (quarter), 365 days (year), or full mandate (cycle), keyed to the Riksmöte rhythm — when the chamber sits, when committees meet, when the government must table BP/VP, when Lagrådet referrals are due, and when interpellation windows open and close.

---

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#parliamentary-season) |
> | **Owning gate check** | Long-horizon Check (quarter/year/cycle blocking) — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | `get_calendar_events`, Riksmöte schedule |
> | **Horizon band** | mixed (quarter/year/cycle) (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Family D — Electoral & Domain (long-horizon) |
> | **Aggregation order** | 15 of 30 in canonical order (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `parliamentary-season.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
> | **Canonical evidence anchor** | `\| claim \| evidence (dok_id / vote / MP) \| retrieved_at \| confidence \|` — every analytical claim row uses this schema. |
>
> Cross-reference: [`README.md §Template ↔ Methodology ↔ Gate-Check Matrix`](README.md#-template--methodology--gate-check-matrix).

<!--
AI-FIRST Pass-1 / Pass-2 self-check (HTML comment — invisible in rendered articles; not stripped by aggregator unless under a "## Pass 2 …" heading).

PASS 1 (creation, minimal viable artifact):
  • Fill every REQUIRED slot above; cite ≥ 1 dok_id / vote / MP / primary-source URL per major claim.
  • Use the canonical evidence anchor schema for every analytical claim row.
  • Mermaid blocks use the cyberpunk %%{init: theme/themeVariables}%% prologue and at least one `style …` or `classDef …` directive (Check 5 of 05-analysis-gate.md).

PASS 2 (read-back & improve — AI-FIRST mandatory, ≥ 180 s after Pass 1):
  • Re-read the file end-to-end; for each section verify (a) ≥ 1 evidence anchor row, (b) WEP language tightened (no "may/might/could" hedges), (c) named actors with intressent_id where applicable, (d) Mermaid colour theming present.
  • Banned-phrase scan: "intelligence theatre", "sources say", "reportedly", "it is widely believed", "experts agree", "AI_MUST_REPLACE".
  • Citation density target: ≥ 1 evidence anchor row per 100 words of analytical prose.
  • Neutrality arithmetic: equal analytical depth across the 8 Riksdag parties (S, M, SD, V, MP, C, L, KD); flag and correct any bias in the Pass-2 Self-Audit section.

ANTI-TEMPLATE — DO NOT:
  • Ship plain prose without evidence anchor tables.
  • Leave AI_MUST_REPLACE / [REQUIRED: …] placeholders in the rendered output.
  • Cite a non-primary URL when a `dok_id` or vote record is available.
  • Treat co-occurrence of keywords as coordination; uni-directional chains as bi-directional.
  • Use a Mermaid block without colour theming (Check 5 will block aggregation).
  • Skip the Pass-2 read-back (Check 6 verifies mtime ≥ birth + 180 s OR a differing pass1/ snapshot).
-->

## 🔄 Tradecraft Context

| Element | Value |
|---------|-------|
| **Methodology** | Calendar lens (legislative monitoring) — derived from Riksdagen's published kalender + government's regeringskansliet propositions schedule |
| **Primary sources** | `riksdagen.se/sv/kalender`, `regeringen.se`, Lagrådet announcements, Riksbank monetary-policy calendar, SCB release calendar |
| **Time-frame** | Per-workflow horizon (quarter / year / cycle) |
| **Update cadence** | Re-checked at every long-horizon run |
| **Owning artifact** | `parliamentary-season.md` (this template) |
| **Audience** | Decision-makers, journalists, civil-society groups |

---

## 1 — Riksmöte Phase

| Phase | Span | Implication |
|-------|------|-------------|
| **Höstsession (Autumn)** | Sep → mid-Dec | Government tables BP (statsbudget) by 20 Sep; budget vote ~mid-Dec; opening regeringsförklaring on the third Tuesday of September |
| **Juluppehåll (Christmas recess)** | mid-Dec → mid-Jan | Limited committee activity; KU referrals can still be filed |
| **Vårsession (Spring)** | mid-Jan → mid-Jun | Spring fiscal policy bill (VP) by 15 Apr; key votes on EU presidency files; partiledardebatt cycle |
| **Sommaruppehåll (Summer recess)** | mid-Jun → late Aug | No chamber sittings; KU summer report; Almedalsveckan (early July) shapes agenda for Höstsession |

**Operational rule.** Every quarter-ahead / year-ahead / election-cycle artifact MUST identify the **current phase** at the top of this section and the **next phase boundary** in days.

### Riksmöte phase ribbon

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","lineColor":"#FFBE0B","secondaryColor":"#7B1FA2","tertiaryColor":"#2E7D32","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart LR
    H["🍂 Höstsession<br/>Sep → mid-Dec<br/>BP tabling · budget vote"]:::active
    JR["🎄 Juluppehåll<br/>mid-Dec → mid-Jan<br/>KU filings only"]:::recess
    V["🌱 Vårsession<br/>mid-Jan → mid-Jun<br/>VP · partiledardebatt"]:::active
    SR["☀️ Sommaruppehåll<br/>mid-Jun → late-Aug<br/>Almedalen · KU report"]:::recess
    H --> JR --> V --> SR --> H

    classDef active fill:#1565C0,color:#ffffff,stroke:#FFBE0B,stroke-width:2px
    classDef recess fill:#7B1FA2,color:#ffffff,stroke:#FFBE0B,stroke-dasharray:4 3
```

The ribbon distinguishes **session** phases (solid borders — active chamber business) from **recess** phases (dashed borders — chamber suspended, but KU filings and government-tabling deadlines still tick). At runtime the analyst marks the *current* phase by adding a `:::current` override (e.g. `V["…"]:::current`) — the diagram above shows the structural alternation pattern only.

---

## 2 — Committee Schedule (next horizon)

For each parliamentary committee that will be active in the horizon window:

| Committee | Sittings (count + dates) | Key items expected | Risk to government |
|-----------|--------------------------|---------------------|---------------------|
| KU | … | … | … |
| FiU | … | … | … |
| SoU | … | … | … |
| FöU | … | … | … |
| JuU | … | … | … |
| UbU | … | … | … |
| SfU | … | … | … |
| (others as relevant) | … | … | … |

**Evidence rule.** Every row carries either a `riksdagen.se` calendar URL or a `dok_id` for the ärende.

---

## 3 — Government Propositions Schedule

| Date (or window) | Proposition | Department | Status (planned / drafted / lagrådsremissad / propad) | Coalition risk |
|------------------|-------------|------------|--------------------------------------------------------|-----------------|
| … | BP 2027 (statsbudget) | Finansdepartementet | … | … |
| … | VP 2026 (vårproposition) | Finansdepartementet | … | … |
| … | … | … | … | … |

**Quarter-ahead:** ≥ 5 rows. **Year-ahead:** ≥ 12 rows. **Cycle:** ≥ 20 rows (or all known propositions for the mandate).

---

## 4 — Lagrådet Referrals (Lagrådsremisser)

Every legislative proposal of constitutional significance MUST pass through Lagrådet (the Council on Legislation) before going to chamber. Track:

| Date | Bill | Department | Lagrådet outcome | Cabinet response |
|------|------|------------|-------------------|-------------------|
| … | … | … | (kritik / utan kritik / delvis) | (justering / oförändrat / dragit tillbaka) |

**Evidence rule.** Every row links to `lagradet.se` or the `regeringen.se` lagrådsremiss page.

---

## 5 — Interpellation & Question Windows

The chamber holds **frågestund** Thursdays during sittings; **interpellationsdebatt** is scheduled per minister rotation:

| Window | Active ministers | Hot topics expected | Opposition strategy |
|--------|------------------|---------------------|----------------------|
| … | … | … | … |

---

## 6 — Riksbank & SCB Calendar Integration

For year-ahead and cycle workflows ONLY (quarter-ahead optional):

| Date | Source | Release | Likely market/political reaction |
|------|--------|---------|-----------------------------------|
| … | Riksbank | Penningpolitisk rapport | … |
| … | SCB | Quarterly NA | … |
| … | SCB | KPI/KPIF (monthly) | … |
| … | Konjunkturinstitutet | KI-barometern | … |

---

## 7 — Cross-Horizon Carry-Forward

| Predecessor analysis | Date | Key finding still live | Action this run |
|---------------------|------|-------------------------|-------------------|
| `analysis/daily/.../<predecessor>` | … | … | reaffirm / update / supersede |

**Quarter-ahead** carries from week-ahead + month-ahead. **Year-ahead** carries from quarter-ahead × 2. **Cycle** carries from year-ahead × 2.

---

## 8 — Watchlist (with horizon tags)

| Indicator | Threshold | Horizon | Source | PIR |
|-----------|-----------|---------|--------|-----|
| Government BP tabling delay | > 7 days from 20 Sep | `quarter` | regeringen.se | PIR-3 |
| KU reprimand count this period | ≥ 2 | `quarter`/`year` | riksdagen.se KU | PIR-1 |
| Coalition cohesion drift | < 95 % | `quarter` | Voteringar API | PIR-1 |
| Lagrådet `kritik` rate | > 35 % of remisser | `year` | lagradet.se | PIR-7 |
| (others) | … | … | … | … |

**Quarter-ahead:** ≥ 5 watchlist items. **Year-ahead:** ≥ 8. **Cycle:** ≥ 12.

### Watchlist heat-map

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","lineColor":"#FFBE0B","secondaryColor":"#7B1FA2","tertiaryColor":"#2E7D32","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart TB
    subgraph QUARTER["⏱️ Quarter horizon (≤ 90 d)"]
        Q1["BP tabling delay<br/>> 7d from 20 Sep"]:::high
        Q2["KU reprimands<br/>≥ 2 this period"]:::med
        Q3["Coalition cohesion<br/>below 95 %"]:::high
    end
    subgraph YEAR["📅 Year horizon (≤ 365 d)"]
        Y1["Lagrådet kritik rate<br/>> 35 %"]:::med
        Y2["IMF WEO vintage drift<br/>> 0.3 pp"]:::low
    end
    subgraph CYCLE["🗳️ Cycle horizon (≤ 1460 d)"]
        C1["Mandate fulfilment<br/>below 60 %"]:::high
        C2["Demographic drift<br/>SCB BE0101"]:::low
    end

    Q1 -.escalates to.-> C1
    Q3 -.escalates to.-> Y1

    classDef high fill:#D32F2F,color:#ffffff,stroke:#FFBE0B,stroke-width:2px
    classDef med fill:#FF9800,color:#000000,stroke:#FFBE0B
    classDef low fill:#2E7D32,color:#ffffff,stroke:#FFBE0B
```

Colour coding: 🔴 red = blocking watchlist item that triggers a same-day editorial review; 🟠 orange = elevated concern that requires Pass-2 evidence refresh; 🟢 green = baseline indicator monitored at the lower cadence. Dotted edges show how shorter-horizon breaches typically escalate into longer-horizon PIRs.

---

## 9 — Pass-2 Self-Audit

- [ ] Current Riksmöte phase identified + next boundary in days
- [ ] Committee schedule covers ≥ 4 committees (quarter), ≥ 6 (year), all (cycle)
- [ ] Propositions table at minimum row counts above
- [ ] Lagrådet referrals: every row carries primary URL
- [ ] Riksbank/SCB calendar populated for year/cycle
- [ ] Cross-horizon carry-forward rows present (quarter cites week+month; year cites quarter×2; cycle cites year×2)
- [ ] Every WEP term carries `[horizon:<band>]` tag
- [ ] Watchlist items meet floor

---

## 10 — Filename Variants

This template is canonical at `parliamentary-season.md`. Aggregator section title: **"Parliamentary Season Outlook"**.
