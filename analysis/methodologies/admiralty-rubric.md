<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">⚓ Admiralty Grading Rubric — Riksdagsmonitor</h1>

<p align="center">
  <strong>🎯 Worked-Example Sheet for Source Reliability (A–F) and Information Credibility (1–6)</strong><br>
  <em>🏛️ ICD 206 · NATO STANAG 2511 · Heuer & Pherson SAT (3rd ed.) · ≥80 % Inter-Analyst Agreement</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-0A66C2?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--05--14-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-05-14 (UTC)
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-08-14
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **Purpose:** Provide a worked-example sheet so that two independent Riksdagsmonitor analysts reach the same Admiralty grade ≥ 80 % of the time. Eliminates the B-vs-C and 2-vs-3 subjectivity noted in the 2026-05-14 methodology-reflection cohort. Cite this rubric whenever applying Admiralty grades in any analysis artifact. Wire: `05-analysis-gate.md` Check 7 for methodology-reflection ICD 203 audit.
>
> **Authority:** ICD 206 (Source Reliability and Credibility Standards), NATO STANAG 2511 (Intelligence Grading), Heuer & Pherson *Structured Analytic Techniques for Intelligence Analysis* (3rd ed.) ch. 6.

---

## 📐 The Admiralty 2×6 Grid

Every source citation in a Riksdagsmonitor analysis artifact must carry **two** components:
1. **Reliability grade** (letter A–F) — assesses the **source**, not the information.
2. **Credibility grade** (number 1–6) — assesses the **information item**, not the source.

Combined notation: `[B2]`, `[A1]`, `[C3]`, etc.

### 🔠 Source Reliability (A–F)

| Grade | Label | Definition | Swedish political-intelligence examples |
|-------|-------|------------|----------------------------------------|
| **A** | Completely reliable | Source has a long, documented track record; all prior information later confirmed; no known bias or agenda | Official Riksdag chamber records (`riksdagen.se`); Regeringskansliet official publications; SCB open statistics; IMF WEO official dataset |
| **B** | Usually reliable | Source has been reliable in most cases; minor errors or delays; no systematic bias identified | Swedish news agencies (TT, Reuters Sweden); peer-reviewed Swedish political science journals; official Lagrådet yttrande archive |
| **C** | Fairly reliable | Source has provided reliable information often enough to be worth using, but has made significant errors or shown occasional bias | Swedish broadsheets (DN, SvD, GP) with byline; identified academic researchers; NGO policy reports with named methodology |
| **D** | Not usually reliable | Source has provided unreliable or inaccurate information more often than not, but not entirely discounted | Partisan think-tanks without transparent methodology; unnamed "political sources" in tabloid press; unverified social media accounts with history of inaccuracy |
| **E** | Unreliable | Source has consistently provided false, misleading, or unverifiable information | Anonymous internet commentary; known disinformation outlets; unverified telegram channels |
| **F** | Reliability cannot be judged | Newly encountered source; no track record; unable to assess independence or bias | First-time whistleblower contact; unknown NGO; unidentified document |

### 🔢 Information Credibility (1–6)

| Grade | Label | Definition | Swedish political-intelligence examples |
|-------|-------|------------|----------------------------------------|
| **1** | Confirmed by other sources | Information independently corroborated by ≥2 unrelated sources | Vote outcome confirmed in both `search_voteringar` (Riksdag API) AND separate TT wire report |
| **2** | Probably true | Source is known reliable AND content consistent with established patterns; no contradictory evidence | Government budget framework figure matches Finansdepartementet press release + IMF WEO prior-year |
| **3** | Possibly true | Plausible content from a fairly reliable source; some corroboration but not definitive | Single broadsheet report of coalition-talks; no second source yet |
| **4** | Doubtful | Information conflicts with known facts or established patterns, but not impossible | Report claims SD is considering formal coalition entry — conflicts with SD's stated position but not ruled out |
| **5** | Improbable | Information is highly inconsistent with established facts or the source's known record | Claim that Statsminister privately supports EU membership suspension — no structural support |
| **6** | Cannot be judged | Insufficient context to assess credibility; neither confirming nor denying evidence available | Unverified leak about internal ministry briefing on sensitive treaty — content plausible but unconfirmable |

---

## 🔑 Decision trees for common Riksdagsmonitor source types

### Tree 1 — Riksdag official records

```
Is the source riksdagen.se (API or web) for votes, dok_ids, or transcripts?
  YES → Reliability = A (completely reliable official record)
        Credibility = 1 (confirmed by primary record)
        Grade: [A1]
  NO  → Continue to Tree 2
```

### Tree 2 — Government official publications

```
Is the source regeringen.se, Finansdepartementet, SCB, IMF WEO, or Lagrådet official site?
  YES → Reliability = A
        Is the information also cited in at least one independent secondary source?
          YES → Credibility = 1; Grade: [A1]
          NO  → Credibility = 2; Grade: [A2]
  NO  → Continue to Tree 3
```

### Tree 3 — Swedish news agencies and established media

```
Is the source TT (Tidningarnas Telegrambyrå) or Reuters Sweden with byline?
  YES → Reliability = B
        Is the information corroborated by ≥1 independent source?
          YES → Credibility = 1 or 2; Grade: [B1] or [B2]
          NO  → Credibility = 3; Grade: [B3]
  Is the source DN, SvD, GP, Aftonbladet, Expressen, SVT, or SR with byline?
  YES → Reliability = B (established editorial standards)
        Is the information corroborated?
          YES → Credibility = 2; Grade: [B2]
          NO  → Credibility = 3; Grade: [B3]
  NO  → Continue to Tree 4
```

### Tree 4 — NGOs, think-tanks, academia

```
Is the source a peer-reviewed academic publication or identified researcher?
  YES → Reliability = B
        Is the content methodologically sound and independently cited?
          YES → Credibility = 2; Grade: [B2]
          NO  → Credibility = 3; Grade: [B3]
Is the source a named NGO with transparent methodology?
  YES → Reliability = C
        Is the claim corroborated by independent source?
          YES → Credibility = 2; Grade: [C2]
          NO  → Credibility = 3; Grade: [C3]
Is the source a partisan think-tank or advocacy organisation?
  YES → Reliability = D
        Use only if no better source; always label credibility ≥ 4; Grade: [D4] minimum
```

---

## 📝 Worked examples (≥20)

### Example 1 — Riksdag vote record

| Field | Value |
|-------|-------|
| **Source** | `search_voteringar` API — SD vote on FiU48 2026-04-24 |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official Riksdag chamber record; no transcription or interpretation involved |
| **Credibility rationale** | Primary vote record confirmed; no ambiguity possible in digital vote ledger |
| **Wrong grade** | [B2] — ❌ This would imply "usually reliable" for a primary digital record that is either correct or doesn't exist |
| **Disambiguation note** | If the analyst is *interpreting* the vote pattern (e.g. "SD defection"), that interpretation receives its own grade ([B3] at best) separate from the vote fact ([A1]) |

---

### Example 2 — IMF WEO Sweden NGDP_RPCH forecast

| Field | Value |
|-------|-------|
| **Source** | IMF WEO April 2026 vintage — Sweden GDP growth forecast |
| **Grade** | **[A2]** |
| **Reliability rationale** | IMF official flagship publication; no history of Swedish data errors; no known bias for Sweden |
| **Credibility rationale** | Forecast figure is the IMF's own model output — not confirmed by an independent second source (IMF is the only source for its own projections) |
| **Wrong grade** | [A1] — ❌ Credibility 1 requires independent corroboration; IMF forecast cannot be "confirmed" by another source that also uses IMF data |
| **Disambiguation note** | When SCB quarterly national accounts confirm IMF forecast within ±0.3 pp, upgrade to [A1] |

---

### Example 3 — DN article with named journalist

| Field | Value |
|-------|-------|
| **Source** | Dagens Nyheter (Ida Söderberg, 2026-05-12) — report on coalition talks |
| **Grade** | **[B3]** |
| **Reliability rationale** | Established newspaper with editorial standards; named journalist with track record |
| **Credibility rationale** | Single-source report; coalition talks claimed but not confirmed by Riksdag records or second outlet |
| **Wrong grade** | [C3] — ❌ DN has long-established editorial standards that place it in reliability tier B, not C |
| **Disambiguation note** | If TT also runs the story without attribution to DN, upgrade to [B2] |

---

### Example 4 — NGO healthcare access report

| Field | Value |
|-------|-------|
| **Source** | Vårdförbundet annual report on nurse staffing shortfall (2025) |
| **Grade** | **[C2]** |
| **Reliability rationale** | Named NGO with transparent survey methodology; professional body with institutional interest in the topic (potential bias toward higher shortage estimates) |
| **Credibility rationale** | Data confirmed by Socialstyrelsen parallel report showing same regional trend |
| **Wrong grade** | [B2] — ❌ Vårdförbundet has a sector interest that creates potential bias; reliability tier C is appropriate |
| **Disambiguation note** | If Statskontoret or SCB independently publishes matching figure, upgrade to [B2] |

---

### Example 5 — Anonymous government source in tabloid

| Field | Value |
|-------|-------|
| **Source** | Aftonbladet citing "en källa nära statsministern" (unnamed, 2026-03-18) |
| **Grade** | **[D5]** |
| **Reliability rationale** | Tabloid reliability tier B for editorial standards, but unnamed source drops actual reliability to D (source cannot be evaluated) |
| **Credibility rationale** | Claim is that a specific ministerial resignation was imminent — contradicts public statements, inconsistent with pattern; improbable |
| **Wrong grade** | [B4] — ❌ The reliability grade is for the *source* (unnamed tipster), not the publication; unnamed sources default to D |
| **Disambiguation note** | If subsequent events confirm the tip, upgrade credibility to 1 but note the original reliability grade was D |

---

### Example 6 — Lagrådet official yttrande

| Field | Value |
|-------|-------|
| **Source** | Lagrådet yttrande Dnr 2026-031 (official PDF from lagradet.se) |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official primary-source document from an independent constitutional body; zero history of falsification |
| **Credibility rationale** | Document text is the authoritative record; inherently confirmed |
| **Disambiguation note** | Analyst's *interpretation* of whether the yttrande is "critical" (tillstyrker vs. kritiska anmärkningar) is a separate analytical judgment at [A3] |

---

### Example 7 — Social media post from party leader

| Field | Value |
|-------|-------|
| **Source** | Jimmie Åkesson (SD party leader) post on X/Twitter, 2026-04-15 |
| **Grade** | **[B3]** |
| **Reliability rationale** | Verified account of named political actor; no history of fake accounts; but posts are not fact-checked and may be political messaging |
| **Credibility rationale** | Statement of political position is plausible and consistent with party line; not independently corroborated |
| **Wrong grade** | [A2] — ❌ Social media posts do not carry official publication standards; reliability tier B is ceiling for verified social media |
| **Disambiguation note** | If the post is later reported verbatim by TT, the TT article carries [B2] and the original post remains [B3] |

---

### Example 8 — SCB housing price index (BO0501)

| Field | Value |
|-------|-------|
| **Source** | SCB BO0501 — monthly house-price index, March 2026 |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official national statistics; no history of revision errors; mandated public-interest publication |
| **Credibility rationale** | Released simultaneously by SCB and confirmed by Riksbank housing-price tracker |
| **Disambiguation note** | For *model projections* derived from SCB data (e.g. forecast for Q3 2026), grade the model separately at [B2] |

---

### Example 9 — Academic article on coalition durability

| Field | Value |
|-------|-------|
| **Source** | Bergman, T. et al. (2025) "Nordic coalition survival determinants", *Scandinavian Political Studies* |
| **Grade** | **[B2]** |
| **Reliability rationale** | Peer-reviewed journal; named researchers; no identified competing interest |
| **Credibility rationale** | Findings on Nordic coalition survival rates are consistent with independent Comparative Constitutions Project data |
| **Wrong grade** | [A2] — ❌ Academic articles are not official government records; reliability tier B is appropriate for peer-reviewed academic sources |

---

### Example 10 — NATO official communiqué

| Field | Value |
|-------|-------|
| **Source** | NATO Secretary-General press statement, 2026-03-22, on Swedish defence commitment |
| **Grade** | **[A2]** |
| **Reliability rationale** | Official international organisation; primary source; no history of fabrication |
| **Credibility rationale** | Statement is the official NATO position — cannot be "confirmed" by another source independently |
| **Disambiguation note** | Analyst interpretation of whether the statement implies a specific obligation for Sweden is a separate claim at [B3] |

---

### Example 11 — Party congress resolution (publicly available)

| Field | Value |
|-------|-------|
| **Source** | SD party congress motion (publicly available PDF, 2025 congress) |
| **Grade** | **[B2]** |
| **Reliability rationale** | Official party document; published by the party; verified by cross-check with SVT congress coverage |
| **Credibility rationale** | Content confirmed by SVT reporting and TT summary |
| **Wrong grade** | [C3] — ❌ An official published party congress document is a B-grade source; C is for less institutional sources |

---

### Example 12 — EU Commission press release

| Field | Value |
|-------|-------|
| **Source** | European Commission DG Competition press release on state-aid investigation, 2026-05 |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official EU institution publication; primary source; legally binding |
| **Credibility rationale** | Commission press release is authoritative confirmation of its own action |

---

### Example 13 — Riksbank minutes

| Field | Value |
|-------|-------|
| **Source** | Riksbank monetary policy meeting minutes, April 2026 |
| **Grade** | **[A2]** |
| **Reliability rationale** | Official central bank publication; highest reliability tier |
| **Credibility rationale** | Minutes represent internal deliberation — content is Riksbank's own record, not externally corroborated |

---

### Example 14 — Swedish think-tank with transparent methodology

| Field | Value |
|-------|-------|
| **Source** | SNS (Studieförbundet Näringsliv och Samhälle) housing report (2025) |
| **Grade** | **[C2]** |
| **Reliability rationale** | Named think-tank; published methodology; slight pro-market orientation creates potential bias → tier C |
| **Credibility rationale** | Key finding corroborated by Boverket official housing supply data |
| **Wrong grade** | [B2] — ❌ SNS's known ideological orientation places it in reliability tier C despite transparent methodology |

---

### Example 15 — Unverified leaked document

| Field | Value |
|-------|-------|
| **Source** | Purported Finansdepartementet internal memo (leaked to journalist, not confirmed by ministry) |
| **Grade** | **[F4]** |
| **Reliability rationale** | Source (person who leaked) is unknown; document authenticity unverified → reliability F |
| **Credibility rationale** | Content is internally consistent with known fiscal trajectory but contradicts one official statement → doubtful |
| **Wrong grade** | [C4] — ❌ An unverified document from an unknown leaker is an F-grade source regardless of content plausibility |

---

### Example 16 — Interpellation transcript (verbatim)

| Field | Value |
|-------|-------|
| **Source** | riksdagen.se interpellation transcript — verbatim ministerial answer 2026-05-03 |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official Riksdag verbatim chamber record |
| **Credibility rationale** | Direct transcription; primary source; confirmed |
| **Disambiguation note** | Analyst's quality-tier rating of the answer (tier 1–5 rubric) is a secondary analytical judgment at [A3] minimum |

---

### Example 17 — MSB threat assessment

| Field | Value |
|-------|-------|
| **Source** | MSB (Myndigheten för samhällsskydd och beredskap) annual threat assessment (2025) |
| **Grade** | **[A2]** |
| **Reliability rationale** | Official government agency; mandated threat assessment function; established track record |
| **Credibility rationale** | Findings consistent with SÄPO annual report trend but not independently confirmed by non-government source |

---

### Example 18 — Opposition motion (verbatim)

| Field | Value |
|-------|-------|
| **Source** | Riksdag motion 2025/26:S482 (V party motion on housing) — verbatim text |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official registered Riksdag document; digital ledger record |
| **Credibility rationale** | Verbatim motion text; confirmed by Riksdag publication |
| **Disambiguation note** | Analysis of the motion's *likely outcome* is a secondary claim at [B3] until vote records confirm |

---

### Example 19 — SVT opinion poll aggregation

| Field | Value |
|-------|-------|
| **Source** | SVT opinionsmätning (Demoskop, March 2026) — published party support estimates |
| **Grade** | **[B2]** |
| **Reliability rationale** | SVT public broadcaster; Demoskop established polling firm; transparent methodology; no history of systematic fabrication |
| **Credibility rationale** | Consistent with Sifo March 2026 (within margin of error) |
| **Wrong grade** | [C3] — ❌ Demoskop has a long track record and SVT provides independent editorial oversight; tier B is appropriate |
| **Disambiguation note** | *Single* poll without cross-poll corroboration → [B3]; confirmed by second major poll → [B2] |

---

### Example 20 — Parliamentary committee report

| Field | Value |
|-------|-------|
| **Source** | FiU betänkande 2025/26:FiU28 (official Riksdag publication) |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official Riksdag committee report; legislative authority record |
| **Credibility rationale** | Report is the committee's authoritative output; confirmed by Riksdag publication |
| **Disambiguation note** | Analyst predictions about how the report will vote in kammaren are secondary claims at [B3] |

---

### Example 21 — Statskontoret evaluation

| Field | Value |
|-------|-------|
| **Source** | Statskontoret evaluation report on polisreformen (2025) — statskontoret.se |
| **Grade** | **[A2]** |
| **Reliability rationale** | Official government expert body; independent mandate; primary data collection |
| **Credibility rationale** | Findings consistent with Riksrevisionen audit, but not all metrics independently confirmed |
| **Disambiguation note** | When both Statskontoret and Riksrevisionen independently reach the same finding, credibility upgrades to 1 |

---

### Example 22 — ECtHR judgment

| Field | Value |
|-------|-------|
| **Source** | European Court of Human Rights judgment (Case Sweden, 2025) — hudoc.echr.coe.int |
| **Grade** | **[A1]** |
| **Reliability rationale** | Official international court judgment; unimpeachable primary source |
| **Credibility rationale** | Court judgment is confirmed primary record |

---

## ⚠️ Common grading errors — do not repeat

| Error pattern | Correct approach |
|---------------|------------------|
| Applying the publication's grade to an unnamed source within it | Grade the *actual* source (named person, named document); unnamed sources → D |
| Grading a secondary interpretation at the same level as the primary record | Primary record (e.g. vote) = [A1]; analyst's interpretation of that record = [A3] at best |
| Upgrading a C source to B because its conclusions seem reasonable | Reasonableness is a credibility factor (1–6), not a reliability factor (A–F); keep reliability at C |
| Treating "two articles from the same newsroom" as two independent sources | Same editorial chain = single source; credibility 1 requires sources from *different* editorial/institutional chains |
| Grading an AI model output | AI models are not intelligence sources; do not apply Admiralty grades to AI-generated content; only apply to *primary* sources cited by the AI |

---

## 🧭 Inter-analyst calibration protocol

To maintain ≥80 % agreement between two analysts grading the same source:

1. **Grade independently** before discussing.
2. **Check reliability first** (letter grade): does the source type match the decision trees?
3. **Check credibility second** (number grade): is there independent corroboration, and how consistent is the content?
4. **Disagreement resolution**: if grades differ by ≥1 step (e.g. B vs. D, or 2 vs. 4), discuss using the worked-example sheet. The lower (more cautious) grade is adopted until resolution.
5. **Record agreement**: log the final grade and any disagreement resolution note in `methodology-reflection.md §Source grading audit`.

**Target**: ≥80 % exact-grade agreement; ≤5 % two-step disagreements.

---

## 🔗 Cross-links

- **Calibration ledger**: [`analysis/methodologies/calibration-ledger.md`](calibration-ledger.md) — uses Admiralty grades for every forecast
- **Tradecraft standards**: [`analysis/methodologies/osint-tradecraft-standards.md`](osint-tradecraft-standards.md)
- **WEP / style guide**: [`analysis/methodologies/political-style-guide.md`](political-style-guide.md)
- **Base-rate datasets**: [`analysis/methodologies/base-rates/`](base-rates/)
- **Analysis gate**: [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md)
- **Per-artifact methodology**: [`analysis/methodologies/per-artifact-methodologies.md`](per-artifact-methodologies.md) — Admiralty floor per artifact

---

**Document Control**
- **Path:** `analysis/methodologies/admiralty-rubric.md`
- **Classification:** Public
- **Next Review:** 2026-08-14
