<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📒 Per-Document Methodology</h1>

<p align="center">
  <strong>📊 Family E — Atomic Evidence Layer</strong><br>
  <em>🎯 Per-Document Analysis · Cluster Analysis · Political-Intelligence Unit of Record</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.5-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--05--15-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.5 | **📅 Last Updated:** 2026-05-15 (UTC)
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-07-21
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

<!-- BEGIN AI-FIRST METHODOLOGY CARD -->

## 🎯 AI-FIRST Methodology Card

> **🚦 Read this card before writing a single paragraph.** It names the artifact this methodology owns, the gate check it satisfies, the evidence-density target it must hit, and the Pass-1 / Pass-2 discipline required by `.github/copilot-instructions.md` §5 (AI-FIRST Quality Principle).

| Field | Value |
|-------|-------|
| **Purpose** | Family E — atomic evidence layer; step-by-step production of `documents/{dok_id}-analysis.md` (one per document) and `{theme}-cluster-analysis.md` (when ≥ 4 near-duplicates merit merged treatment). |
| **Inputs** | Riksdag/Government MCP document fetch (full text); `political-classification-guide.md`; DIW 6-dimension scoring |
| **Outputs** | `documents/{dok_id}-analysis.md`; `documents/{theme}-cluster-analysis.md` |
| **Owning artifact(s)** | Family E only — disjoint from `per-artifact-methodologies.md` (which covers Families A–D + supplementary) |
| **Owning gate check** | Check 2 (per-document coverage — one `.md` per `dok_id` in manifest, metadata-only documents tagged not skipped) |
| **Citation density target** | ≥ 3 evidence anchors per document analysis; ≥ 2 named MPs/parties; cluster files ≥ 1 anchor per merged document |
| **Banned phrases** | Enforced via [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) |
| **Threshold source** | [`reference-quality-thresholds.json`](reference-quality-thresholds.json) → `thresholds[articleType][artifact]` (fallback `defaults.coreArtifactFloor`) |

### ✅ Pass-1 checklist (creation — minimal viable artifact)

- [ ] DIW 6-dimension score with weighted total in [0, 100]
- [ ] Citation in canonical format `dok_id (chamber, date, sponsors)` per claim
- [ ] Cluster decision rule (4 conditions) explicitly evaluated when output is a cluster file
- [ ] Produce every required sub-section listed in the owning template
- [ ] Add ≥ 1 evidence anchor (`dok_id`, vote id, named MP, or primary-source URL) per analytical claim
- [ ] Apply the correct WEP confidence band for the run's horizon (`72h / week / month / quarter / year / cycle`)
- [ ] Include ≥ 1 themed Mermaid diagram with `style …` or `themeVariables` config (where structurally meaningful)
- [ ] Cross-link the relevant template under `analysis/templates/` and the gate check it satisfies

### 🔁 Pass-2 checklist (read-back & improve — AI-FIRST mandatory)

- [ ] Tag Family E tier (`L1_surface` / `L2_strategic` / `L2_plus_priority` / `L3_intelligence_grade`) in significance-scoring
- [ ] Confirm metadata-only documents are tagged, not silently dropped
- [ ] Re-read the file end-to-end; flag every claim that lacks an evidence anchor and add one
- [ ] Replace every banned phrase listed in [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) with an evidence-anchored alternative
- [ ] Tighten WEP language: never above **likely** without ≥ 3 cycle-aged sources for `year`/`cycle` horizons
- [ ] Strengthen Mermaid (color-coded `style …` directives, `themeVariables`, ≥ 5 nodes where the structure admits it)
- [ ] Add ≥ 1 second-order effect, cui-bono note, or counterfactual where the artifact admits one
- [ ] Verify citation density meets the per-file target below and the gate's evidence-density rules

### 🟢 Exemplar (good — pattern-match this)

> _(per-doc lede)_ "**`H902UbU22` — Motion (UbU)**: M (Acketoft) + KD (Larsson) co-sign 2026-04-22, 14 sponsors. DIW=64/100 (priority L2_plus). Cui bono: M consolidates education narrative ahead of T+30 vote. Citation: riksdagen.se/dok/H902UbU22 ([A1])."

### 🔴 Anti-exemplar (failure mode — never ship this)

> _(failure mode)_ "This document discusses education policy. Various parties have positions on education." — no `dok_id`, no DIW, no sponsors, no date.

### 🔗 Cross-links

- **Template(s)**: `analysis/templates/per-file-political-intelligence.md`
- **Gate check**: [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md#checks-all-must-pass)
- **AI-FIRST canon**: [`.github/copilot-instructions.md` §5](../../.github/copilot-instructions.md) · [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md)
- **Style canon**: [`political-style-guide.md`](political-style-guide.md) · [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md)
- **Catalog row**: [`artifact-catalog.md`](artifact-catalog.md)

<!-- END AI-FIRST METHODOLOGY CARD -->

---


## 🔄 Tradecraft Anchors

| Element | Value | Reference |
|---------|-------|----------|
| **F3EAD Stage** | **FINISH** | Per-document analysis completes document-identity establishment and extracts initial intelligence value |
| **PIRs Served** | Per-document: tag each analysis with the PIR it informs (e.g., FöU document → PIR-4; FiU → PIR-5; KU → PIR-7) | See [`political-style-guide.md` §PIR/EEI Catalog](political-style-guide.md#-priority-intelligence-requirements-pir--essential-elements-of-information-eei) |
| **Admiralty Floor** | Document itself is **[A1]**; interpretive claims require ≥[B2] corroboration | See [`political-style-guide.md` §Admiralty Code](political-style-guide.md#-admiralty-source-reliability-code-nato-stanag-2022) |
| **WEP Requirement** | Forward-looking claims in per-document analysis use WEP language; factual statements use confidence scale | See [`political-style-guide.md` §WEP + ODNI](political-style-guide.md#-words-of-estimative-probability-wep--odni-confidence-overlay) |
| **ICD 203 Gate** | Standard 1 (source quality), 6 (logical argumentation), 9 (visual information) | See [`political-style-guide.md` §ICD 203](political-style-guide.md#-icd-203-analytic-tradecraft-standards-mapping) |
| **SAT(s)** | Quality of Information Check (evidence assessment per document) | See [`political-style-guide.md` §SATs](political-style-guide.md#-structured-analytic-techniques-sats-catalog) |

---

## 🎯 Purpose

> **🚧 Scope contract (v1.4 — 2026-05-03).** This file is the **sole canonical home for Family E (per-document and per-cluster atomic evidence)**. It is **disjoint from** [`per-artifact-methodologies.md`](per-artifact-methodologies.md), which covers Families A, B, C, D and S only. If you find yourself documenting Family A synthesis, B manifests, C extensions or D domain lenses here, stop and move that material to `per-artifact-methodologies.md` (or its dedicated family methodology — `synthesis-methodology.md`, `structural-metadata-methodology.md`, `strategic-extensions-methodology.md`, `electoral-domain-methodology.md`). The methodology → template → gate-check matrix in [`README.md`](README.md#methodology--template--gate-check-matrix-v46--2026-05-03) is the single cross-walk.

Family E produces the **atomic evidence unit** of the Riksdagsmonitor platform — one analysis file per Riksdag or Government document encountered (or one file per cluster when near-duplicate documents warrant merged treatment).

Every higher-family product (A synthesis, B provenance, C strategic, D domain-specific) reads from Family E. If Family E is thin, shallow, or miscited, everything above it fails.

### Two file shapes

| Template | Filename pattern | Use when |
|----------|-----------------|----------|
| `per-file-political-intelligence.md` | `{dok_id}-analysis.md` (e.g. `HD01KU32-analysis.md`, `HD10428-analysis.md`) | Single document analysed on its own merits |
| `per-file-political-intelligence.md` (cluster variant) | `{theme}-cluster-analysis.md` (e.g. `hd03231-hd03232-analysis.md`) | ≥2 documents are near-duplicates or a coordinated bundle; merging avoids repetitive output |

```mermaid
flowchart LR
    classDef src fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    classDef single fill:#E8F5E9,stroke:#4CAF50,color:#1B5E20
    classDef cluster fill:#FFF8E1,stroke:#FFC107,color:#3E2723
    classDef out fill:#F3E5F5,stroke:#7B1FA2,color:#311B92

    S[Riksdag/Regering<br/>documents in window]:::src

    D{Near-duplicate or<br/>coordinated bundle?}

    SI["Single-doc analysis<br/>{dok_id}-analysis.md"]:::single
    CL["Cluster analysis<br/>{theme}-cluster-analysis.md"]:::cluster

    UP[Upstream consumption<br/>Family A / B / C / D]:::out

    S --> D
    D -->|no| SI
    D -->|yes| CL
    SI --> UP
    CL --> UP
```

---

## 📄 Part 1 — Single-Document Analysis

### Purpose
Produce one rigorous **political-intelligence analysis** of a single document (`dok_id`) that downstream synthesis can consume without re-reading the source.

### Input
- The document itself (full text via `get_dokument` or `get_dokument_innehall`)
- The document's metadata (doktyp, rm, organ, sponsor, committee)
- Related documents identified via cross-reference (prior versions, rebuttals)
- Actor voting history from `search_voteringar` (when applicable)

### Output — required structure

Every single-doc file contains, in order:

1. **Header** — Hack23 logo + title + badges + document-control metadata
2. **Document identity block** —
   - `dok_id` · doktyp · rm · datum · organ · direct URL · status
3. **One-sentence headline** (≤25 words)
4. **Political context** (≤120 words) — why this document exists now, which prior process produced it
5. **Key provisions / content extraction** — bulleted, each bullet citing a section/paragraph
6. **Sponsor & signatory analysis** — who filed, party abbreviation, prior filing pattern
7. **Political-intelligence significance** — DIW score with per-dimension breakdown (6 dimensions)
8. **Stakeholder impact summary** — winners / losers (brief — defers detail to Family A)
9. **Voting analysis** (when applicable) — party vote split, notable defectors, cohesion note
10. **Cross-references** — amends / continues / rebuts / bundled-with
11. **Analytical caveats** — any evidence gap or uncertainty
12. **Mermaid** — one color-coded diagram chosen by doctype (see taxonomy below)
13. **Confidence label** — 5-level scale on the overall assessment
14. **Links** to Family A synthesis and Family B manifest entries

### Per-doctype Mermaid taxonomy

The following doctypes are recognised by `search_dokument`, `get_propositioner`, `get_betankanden`, `get_motioner`, `get_fragor`, and `get_interpellationer`. Use the **canonical Mermaid choice** below; deviate only if the document's own structure makes a different shape clearly more legible (and document the deviation in the file's preamble).

#### Core 7 doctypes (covered ≥ 95 % of typical run volume)

| Doctype | Riksdag definition | Mermaid choice | Purpose |
|---------|---------------------|---------------|---------|
| `prop` (proposition) | Government bill — formal proposal from the government to the Riksdag | Flowchart: filing → committee → vote → outcome | Government flagship path |
| `mot` (motion) | MP-filed motion (single-member, party motion, follow-on motion) | Graph: sponsor cluster ↔ target proposition | Opposition / committee-floor response |
| `bet` (betänkande) | Committee report on a referred matter | Flowchart: reviewed docs → committee stance → recommendation + vote splits | Committee verdict |
| `ip` (interpellation) | Long-form oversight question (verbal reply within 2 weeks) | Timeline: question filed → minister reply → follow-up debate | Oversight exchange |
| `fr` (skriftlig fråga) | Short written question (written reply within 6 working days) | Timeline (shorter) | Quick oversight |
| `SOU` / `Ds` (utredning) | Government investigation report (SOU = stand-alone, Ds = ministerial-series) | Flowchart: mandate → method → recommendations | Investigation structure |
| `skr` (skrivelse) | Government communication or report to the Riksdag (informational, no proposal) | Flowchart: government decision → reporting obligation | Executive accountability |

#### Extended 5 doctype variants (added v1.2 — handle these with care)

| Doctype | Riksdag definition | Mermaid choice | When to use |
|---------|---------------------|---------------|-------------|
| `motion-package` | Coordinated set of motions filed by the same sponsor cluster on the same day with a shared title prefix or numbering scheme — e.g. an opposition party's full annual budget counter-package, or a "100-punkts-program" | **Cluster Mermaid** — outer subgraph for the package, inner nodes for member motions, edges to common target dok_id(s) | When ≥ 3 motions share sponsor, date (±1), and theme; produce **one** Family E cluster file (per [`per-document-methodology.md` §"Cluster Analysis"](#part-2--cluster-analysis)) rather than 3+ singleton files. Annotate each member motion with its sequence inside the package. |
| `fpm` (finansplan-motion / "shadow budget") | Annual opposition counter-budget filed within 14 days of the government's `prop. 1` (budgetpropositionen). Numbering convention `mot. 2025/26:Fi.NNN` with `Fi`-prefix | Flowchart: government `prop. 1` ↔ opposition `fpm` envelope ↔ FiU committee referral ↔ allocation deltas table | Treat as **fpm**, not generic `mot`: the analytic interest is the *delta envelope* (per-utgiftsområde diff) and the macroeconomic-assumption disagreement, not individual line items. Always pair with [`coalition-mathematics.md`](../templates/coalition-mathematics.md) for confidence-vote arithmetic and with [`comparative-international.md`](../templates/comparative-international.md) when the fpm cites peer-country macro frames. |
| `utskottsbetänkande-variants` (`bet`-with-reservation, `bet`-with-yttrande, `bet`-rambeslut) | A `bet` doctype subspecies: (a) `bet`-with-reservation = committee majority report + ≥1 minority reservation requiring separate analysis; (b) `bet`-with-yttrande = committee yttrande from another committee included; (c) `bet`-rambeslut = framework decision affecting subsequent `bet`s in the same area | Flowchart: majority recommendation → **parallel branch** for each reservation/yttrande → vote splits per branch | Detect via the `bet` text containing "Reservation 1", "Yttrande från [committee]", or "Rambeslut". Each reservation/yttrande receives its **own evidence row** in the Family E file. Do NOT collapse reservations into a single bullet — they are the textual record of intra-committee dissent and are first-class analytical content. |
| `KU-anmälan` (KU-granskning) | Constitutional Committee scrutiny case: an MP-filed complaint that a minister or the government has acted improperly. Filed under chapter 13 § 1 RF; cumulates into the spring KU-betänkande. | Flowchart: anmälan filed → KU referral → minister hearing → KU verdict (kritik / utan kritik / ej kritik) | Doctype is `bet` from KU's perspective but an anmälan in the underlying record. Mark **`KU-anmälan`** in the doctype field and pair with the named minister as the political subject. KU verdicts are high-significance institutional events even when DIW magnitude is modest — flag them P1 at minimum during the spring window. |
| `EU-nämnd / EU-överläggning` | Government consultation with the EU Committee before a Council of Ministers position is taken | Flowchart: government brief → committee position → recorded consensus / dissent → minister mandate | Doctype is often metadata-only (`yttr` / `prot` from EU-nämnden) — but the position recorded shapes Sweden's EU-Council vote. Always cite the minister, the Council formation, and any party-bloc dissent. |

> **Doctype detection algorithm (binding):** read the document's metadata first (`doktyp` field from `get_dokument` / `search_dokument`), then run keyword detection on the title + first 200 words to detect variants (`Reservation`, `Finansplan`, `100-punkts`, `KU-granskning`, `EU-nämnden`). Where the metadata says `mot` but the variant detector fires `motion-package` or `fpm`, **the variant takes precedence** for analytical handling — a `fpm` analysed as a generic `mot` misses the entire delta-envelope analysis the artifact exists to produce.

### Example Mermaid — proposition flowchart

```mermaid
flowchart LR
    classDef gov fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    classDef com fill:#FFC107,stroke:#F57F17,color:#3E2723
    classDef vote fill:#4CAF50,stroke:#1B5E20,color:#FFFFFF
    classDef risk fill:#FF9800,stroke:#E65100,color:#FFFFFF
    classDef block fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF

    G[Government files<br/>prop 2025/26:108]:::gov
    C[Committee FiU<br/>review + amendments]:::com
    O{Opposition<br/>motion response}:::risk
    V[Chamber vote<br/>expected 2026-05-28]:::vote
    R[Royal assent + SFS<br/>publication]:::vote
    B[Block: L threshold risk<br/>if 3-seat coalition wobble]:::block

    G --> C
    C --> O
    O -->|rebut| C
    C --> V
    V --> R
    V -.risk.- B
```

### Quality gate per single-doc file
- [ ] `dok_id` exact-match in manifest (Family B)
- [ ] Headline ≤25 words
- [ ] Political-context paragraph cites ≥1 prior `dok_id` or named event
- [ ] Key provisions section cites specific sections/paragraphs
- [ ] DIW score broken down across 6 dimensions
- [ ] Voting analysis present when vote data exists
- [ ] Mermaid matches doctype taxonomy
- [ ] Confidence label on overall assessment
- [ ] Cross-references populated (even if "none" with explicit note)

---

## 🧩 Part 2 — Cluster Analysis

### Purpose
Merge analysis when ≥2 documents warrant joint treatment — typically **near-duplicate motions, coordinated filings, or bundled propositions** — to avoid repetitive output while preserving evidence for each `dok_id`.

### When to cluster — decision rule

Cluster **when all of the following hold**:
1. Shared policy domain at the third-level taxonomy (e.g. "defence procurement — NATO interoperability")
2. Filed within ±7 days of each other
3. Either (a) sponsors are aligned (same party or coalition bloc) **or** (b) text similarity ≥70 % across paragraphs
4. Individual DIW scores are within ±1.5 of each other

Produce single-doc analyses instead when any condition fails.

### Cluster-file structure

Differs from single-doc by adding:

1. **Cluster header** — cluster theme name + list of contributing `dok_id`s + reason for clustering
2. **Documents-in-cluster table** — one row per `dok_id` with title, sponsor, date, DIW, filing delta
3. **Joint political-intelligence significance** — consolidated DIW reasoning
4. **Cluster-specific Mermaid** — color-coded network showing inter-document relationships
5. **Per-document micro-summaries** — ≤60 words per `dok_id` preserving each source's specifics
6. **Differential notes** — where the documents diverge (amendments, emphasis, sponsor)

### Example Mermaid — cluster network

```mermaid
graph TB
    classDef core fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF
    classDef peer fill:#FF9800,stroke:#E65100,color:#FFFFFF
    classDef support fill:#4CAF50,stroke:#1B5E20,color:#FFFFFF
    classDef target fill:#1565C0,stroke:#0D47A1,color:#FFFFFF

    M1[mot 2025/26:3231<br/>S — lead filing]:::core
    M2[mot 2025/26:3232<br/>S — companion]:::peer
    M3[mot 2025/26:3245<br/>V — aligned support]:::support
    T[prop 2025/26:108<br/>government target]:::target

    M1 -.rebuts.- T
    M2 -.rebuts.- T
    M3 -.rebuts.- T
    M1 ---|companion| M2
    M1 ---|aligned| M3
```

### Quality gate per cluster file
- [ ] All contributing `dok_id`s listed in the header table
- [ ] Decision-rule condition met is stated explicitly
- [ ] Text-similarity or sponsor-alignment evidence present
- [ ] Joint DIW reasoning explains aggregation
- [ ] Differential notes preserve each document's specifics
- [ ] Every `dok_id` in the cluster still appears in Family B manifest with its own row

---

## 🔎 Evidence & Confidence Standards (Family E)

### Evidence hierarchy (from political-swot-framework.md, reused here)

| Confidence | Acceptable evidence |
|:----------:|---------------------|
| 🟦 VERY HIGH | Official Riksdag document PDF retrieved via `get_dokument`, SCB published table, recorded vote count |
| 🟩 HIGH | Riksdag or Regeringen API record, published committee minutes, named anförande |
| 🟧 MEDIUM | Press release, verified public statement with named source |
| 🟥 LOW | Single unverified outlet, unattributed quote, inference from pattern |
| ⬛ VERY LOW | Analyst inference only |

### Required citation format
- Riksdag documents: `(dok_id 2025/26:108)` — backtick-optional
- Anförande: `(anförande 2025/26:KU1 — [Politician Name, party])`
- Votes: `(vote 2025/26:XX — Ja: 175, Nej: 168, Avstår: 6)`
- SCB: `(SCB — <table-id> — <vintage>)`
- IMF (**primary economic citation**): `(IMF WEO Apr-2026 — NGDP_RPCH SWE)` / `(IMF FM Oct-2025 — GGXWDG_NGDP)` / `(IMF SDMX IFS — PCPI_IX SWE 2026M03)`
- World Bank (**non-economic residue only**): `(WB WGI 2024 — CC.EST SWE)` / `(WB EN.ATM.CO2E.PC 2024)`

### Party neutrality
Every Family E file gives **equal analytical depth** to whatever parties are involved. A single-doc file on a government proposition should still reflect on opposition objections where those have been filed; a motion analysis should still reflect on the government's likely response where documented.

---

## 🛠️ Production Workflow — step-by-step

```mermaid
flowchart TD
    classDef fetch fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    classDef decide fill:#FFF8E1,stroke:#FFC107,color:#3E2723
    classDef write fill:#E8F5E9,stroke:#4CAF50,color:#1B5E20
    classDef gate fill:#FF9800,stroke:#E65100,color:#FFFFFF
    classDef out fill:#F3E5F5,stroke:#7B1FA2,color:#311B92

    F[Step 1 — Fetch doc set via MCP<br/>search_dokument + get_dokument]:::fetch
    E[Step 2 — Extract key provisions<br/>and sponsor metadata]:::fetch

    D{Step 3 — Cluster?<br/>apply 4-rule decision}:::decide

    S1["Step 4a — Write single-doc analysis<br/>→ {dok_id}-analysis.md"]:::write
    S2["Step 4b — Write cluster analysis<br/>→ {theme}-cluster-analysis.md"]:::write

    Sc[Step 5 — Score DIW across<br/>6 dimensions · assign tier]:::write
    Cx[Step 6 — Populate cross-references<br/>amends / rebuts / bundled]:::write
    M[Step 7 — Render doctype-appropriate Mermaid<br/>with canonical palette]:::write

    G{Gate — passes<br/>per-file quality gate?}:::gate

    O[Family E complete<br/>ready for Family A/B consumption]:::out

    F --> E
    E --> D
    D -->|no| S1
    D -->|yes| S2
    S1 --> Sc
    S2 --> Sc
    Sc --> Cx
    Cx --> M
    M --> G
    G -->|pass| O
    G -->|fail| E
```

### Time budget (automated workflow)

| Step | Share of Family E runtime |
|------|:-------------------------:|
| Step 1 — Fetch | 10 % |
| Step 2 — Extract | 15 % |
| Step 3 — Cluster decision | 5 % |
| Step 4a/4b — Write | 40 % |
| Step 5 — DIW scoring | 15 % |
| Step 6 — Cross-refs | 10 % |
| Step 7 — Mermaid | 5 % |

---

## ✅ Family-E Completion Checklist

- [ ] One file per `dok_id` (or one cluster file per qualifying cluster)
- [ ] Each file has Hack23 header + document-control footer
- [ ] Every `dok_id` referenced elsewhere in the workflow appears as a Family E file
- [ ] DIW scored in 6 dimensions per file
- [ ] Doctype-matched Mermaid included per file
- [ ] Confidence label on overall assessment per file
- [ ] Cross-references populated per file
- [ ] Cluster files list all contributing `dok_id`s and differential notes
- [ ] Every file passes its quality gate before Family A synthesis begins

---

## 🔗 Template bindings

| Template | Methodology section |
|----------|---------------------|
| `analysis/templates/per-file-political-intelligence.md` | Parts 1 & 2 above |

---

## 📐 Cross-references to other methodology layers

- **Downstream consumers:** [synthesis-methodology.md](./synthesis-methodology.md) (Family A) · [structural-metadata-methodology.md](./structural-metadata-methodology.md) (Family B) · [strategic-extensions-methodology.md](./strategic-extensions-methodology.md) (Family C) · [electoral-domain-methodology.md](./electoral-domain-methodology.md) (Family D)
- **Frameworks:** [political-classification-guide.md](./political-classification-guide.md) · [political-swot-framework.md](./political-swot-framework.md) · [political-risk-methodology.md](./political-risk-methodology.md) · [political-threat-framework.md](./political-threat-framework.md)
- **Style:** [political-style-guide.md](./political-style-guide.md)
- **Master protocol:** [ai-driven-analysis-guide.md](./ai-driven-analysis-guide.md)

---

## 🔐 ISMS Alignment

| Control | How this methodology satisfies it |
|---------|----------------------------------|
| ISO 27001 A.5.12 (Classification) | DIW + tier assignment is classification per document |
| ISO 27001 A.5.14 (Information transfer) | Fetch is logged via Family B manifest |
| ISO 27001 A.5.34 (Privacy / PII) | Only public political data processed; named-person data is from published Riksdag records under GDPR Art. 9(2)(e) |
| NIST CSF ID.AM-5 (Resources prioritised by classification) | DIW tier drives downstream Family C/D triggering |
| NIST CSF PR.IP-9 (Response/recovery plans) | Cross-refs support impact/dependency mapping |
| CIS 3.2 (Inventory of data) | Each Family E file = one inventory record |
| GDPR Art. 5(1)(a)(b)(c) | Purpose limitation, data minimisation, accuracy enforced at per-doc level |

---

## 📜 Changelog

- **v1.5 (2026-05-15)** — Aligned version badge with header text; bumped date to 2026-05-15.
- **v1.3 (2026-04-25)** — Extended doctype taxonomy with 5 variants (`motion-package`, `fpm`, `utskottsbetänkande-variants`, `KU-anmälan`, `EU-nämnd`) + binding doctype-detection algorithm.

---

## 📄 Document Control

**Owner:** CEO (Intelligence Program) · **Reviewer:** CISO + Chief Analyst · **Review Cycle:** Quarterly
**Next Review:** 2026-07-21 · **Related:** [ai-driven-analysis-guide.md](./ai-driven-analysis-guide.md), [synthesis-methodology.md](./synthesis-methodology.md), [structural-metadata-methodology.md](./structural-metadata-methodology.md)

---

*Generated following Riksdagsmonitor Per-Document Methodology v1.0 — Family E Atomic Evidence Layer.*
