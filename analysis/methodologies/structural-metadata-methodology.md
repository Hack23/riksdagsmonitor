<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📗 Structural Metadata Methodology</h1>

<p align="center">
  <strong>📊 Family B — Provenance & Linkage Layer</strong><br>
  <em>🎯 Data Download Manifest · Cross-Reference Map</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.2-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--04--25-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.3 | **📅 Last Updated:** 2026-04-25 (UTC)
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-07-21
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

<!-- BEGIN AI-FIRST METHODOLOGY CARD -->

## 🎯 AI-FIRST Methodology Card

> **🚦 Read this card before writing a single paragraph.** It names the artifact this methodology owns, the gate check it satisfies, the evidence-density target it must hit, and the Pass-1 / Pass-2 discipline required by `.github/copilot-instructions.md` §5 (AI-FIRST Quality Principle).

| Field | Value |
|-------|-------|
| **Purpose** | Family B — step-by-step production of `data-download-manifest.md` and `cross-reference-map.md` (provenance + relationship topology for every run). |
| **Inputs** | MCP tool output logs; document fetch manifests; full-text fetch outcomes |
| **Outputs** | `data-download-manifest.md`, `cross-reference-map.md` |
| **Owning artifact(s)** | Both Family B artifacts |
| **Owning gate check** | Check 1 (existence), Check 10 (top-2 full-text availability), and the SLA freshness rule in this methodology |
| **Citation density target** | Every fetched document = 1 manifest row with `dok_id`, source, freshness timestamp, fetch outcome, full-text status |
| **Banned phrases** | Enforced via [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) |
| **Threshold source** | [`reference-quality-thresholds.json`](reference-quality-thresholds.json) → `thresholds[articleType][artifact]` (fallback `defaults.coreArtifactFloor`) |

### ✅ Pass-1 checklist (creation — minimal viable artifact)

- [ ] Manifest covers every `dok_id` referenced in any other artifact
- [ ] Cross-reference map declares ≥ 1 relationship type from the 7-edge taxonomy per linked-document pair
- [ ] Produce every required sub-section listed in the owning template
- [ ] Add ≥ 1 evidence anchor (`dok_id`, vote id, named MP, or primary-source URL) per analytical claim
- [ ] Apply the correct WEP confidence band for the run's horizon (`72h / week / month / quarter / year / cycle`)
- [ ] Include ≥ 1 themed Mermaid diagram with `style …` or `themeVariables` config (where structurally meaningful)
- [ ] Cross-link the relevant template under `analysis/templates/` and the gate check it satisfies

### 🔁 Pass-2 checklist (read-back & improve — AI-FIRST mandatory)

- [ ] Run the gate's Check 10 mentally: is `## Full-Text Fetch Outcomes` present and ≥ 2 with `full_text_available=true`?
- [ ] Detect coordinated activity (≥ 3 same-day cross-party motions on same theme) and flag it
- [ ] Re-read the file end-to-end; flag every claim that lacks an evidence anchor and add one
- [ ] Replace every banned phrase listed in [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) with an evidence-anchored alternative
- [ ] Tighten WEP language: never above **likely** without ≥ 3 cycle-aged sources for `year`/`cycle` horizons
- [ ] Strengthen Mermaid (color-coded `style …` directives, `themeVariables`, ≥ 5 nodes where the structure admits it)
- [ ] Add ≥ 1 second-order effect, cui-bono note, or counterfactual where the artifact admits one
- [ ] Verify citation density meets the per-file target below and the gate's evidence-density rules

### 🟢 Exemplar (good — pattern-match this)

> _(manifest row)_ `H902FiU8 | riksdag-regering MCP / search_dokument | 2026-04-25T08:14Z | full_text_available=true | Admiralty=[A1] | refs: H902FiU1, H902UbU22`

### 🔴 Anti-exemplar (failure mode — never ship this)

> _(failure mode)_ `Several documents were downloaded.` — no row, no `dok_id`, no timestamp, no fetch outcome.

### 🔗 Cross-links

- **Template(s)**: `analysis/templates/data-download-manifest.md`, `analysis/templates/cross-reference-map.md`
- **Gate check**: [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md#checks-all-must-pass)
- **AI-FIRST canon**: [`.github/copilot-instructions.md` §5](../../.github/copilot-instructions.md) · [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md)
- **Style canon**: [`political-style-guide.md`](political-style-guide.md) · [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md)
- **Catalog row**: [`artifact-catalog.md`](artifact-catalog.md)

<!-- END AI-FIRST METHODOLOGY CARD -->

---


## 🔄 Tradecraft Anchors

| Element | Value | Reference |
|---------|-------|-----------|
| **F3EAD Stage** | **FIND → FIX** | This methodology covers collection and document-identity establishment |
| **PIRs Served** | All PIRs — manifest establishes the evidence foundation for every PIR | See [`political-style-guide.md` §PIR/EEI Catalog](political-style-guide.md#-priority-intelligence-requirements-pir--essential-elements-of-information-eei) |
| **Admiralty Floor** | Data sources recorded with Admiralty code per Collection Management Matrix | See [`political-style-guide.md` §Collection Management Matrix](political-style-guide.md#%EF%B8%8F-collection-management-matrix) |
| **WEP Requirement** | N/A — structural metadata, no probability claims | — |
| **ICD 203 Gate** | Standard 1 (properly describe quality and reliability of underlying sources) | See [`political-style-guide.md` §ICD 203](political-style-guide.md#-icd-203-analytic-tradecraft-standards-mapping) |
| **SAT(s)** | Quality of Information Check | See [`political-style-guide.md` §SATs](political-style-guide.md#-structured-analytic-techniques-sats-catalog) |

---

## 🎯 Purpose

Family B establishes **data provenance and connective tissue** for every Riksdagsmonitor workflow. Without it, downstream Family A/C/D/E products have no auditable chain of custody and no way to detect cross-document patterns.

The two outputs work together:
- **`data-download-manifest.md`** — answers *"Where did this evidence come from, when, and is it verifiable?"*
- **`cross-reference-map.md`** — answers *"How do these documents relate to each other and to prior intelligence?"*

Both files are produced for every workflow run — daily, weekly, monthly, realtime.

```mermaid
flowchart LR
    classDef src fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    classDef prov fill:#E8F5E9,stroke:#4CAF50,color:#1B5E20
    classDef link fill:#FFF8E1,stroke:#FFC107,color:#3E2723
    classDef out fill:#F3E5F5,stroke:#7B1FA2,color:#311B92

    R[riksdag-regering MCP]:::src
    G[regeringen.se]:::src
    S[SCB PxWeb]:::src
    W[IMF<br/>WEO+FM+IFS+BOP+GFS_COFOG+DOTS+PCPS+MFS_IR+ER<br/>🏛️ primary economic source]:::src
    WB[World Bank<br/>WGI / environment / social residue<br/>⚠️ non-economic only]:::src
    ST[Statskontoret<br/>agency-capacity reports]:::src

    M[data-download-manifest.md<br/>📥 provenance ledger]:::prov
    X[cross-reference-map.md<br/>🔗 linkage graph]:::link

    R --> M
    G --> M
    S --> M
    W --> M
    WB --> M
    ST --> M
    M --> X
    X --> FamilyA[Family A — synthesis consumes linkages]:::out
    X --> FamilyE[Family E — per-doc references xref]:::out
```

---

## 📥 Part 1 — Data Download Manifest (`data-download-manifest.md`)

### Purpose
Maintain an **auditable ledger** of every piece of data that fed the workflow. The manifest is the single file a reviewer consults to answer "is this analysis reproducible from primary sources?".

### Input
- MCP tool-call logs from riksdag-regering, scb, world-bank (non-economic residue only), imf (bash script — primary economic source)
- Any `web_fetch` results from regeringen.se, riksdagen.se, Statskontoret, myndighet sites
- Static reference files (SCB tables, IMF datasets, World Bank non-economic indicators) with their version/vintage

### Output — required structure

1. **Summary header** — workflow name · run timestamp · data cutoff (CET) · record count
2. **Source-by-source table** — one row per source, columns:
   - `Source` · `Endpoint / MCP tool` · `Parameters` · `Records returned` · `Vintage / rm` · `Integrity (SHA or URL)` · `Retrieved at`
3. **Document ledger** — every `dok_id` touched with:
   - `dok_id` · `doktyp` · `titel` · `datum` · `direct URL` · `tool used` · `confidence that retrieval was complete`
4. **Stale-data flags** — any source older than its SLA (e.g. SCB table >90 days, IMF WEO >12 months, World Bank non-economic residue >24 months) flagged with ⚠️
5. **Completeness Mermaid** — color-coded freshness ring/donut

### Required Mermaid — data freshness

```mermaid
pie showData
    title Data freshness at workflow cutoff
    "Fresh (≤24h) — Riksdag live APIs" : 62
    "Recent (≤7d) — Regeringen releases" : 18
    "Quarterly (≤90d) — SCB tables" : 12
    "Annual (≤24mo) — World Bank (non-economic residue only — WGI, environment, social)" : 6
    "Stale (>SLA) — flagged" : 2
```

### Provenance rules
- Every entry in the manifest **must** be retrievable later via its URL or MCP tool call
- Any transformation (filter, aggregation, derivation) is documented with a one-line explanation
- When a source returns zero records, that is recorded as an explicit empty-set row (not omitted)
- MCP tool calls use the exact parameter names from the MCP schema — no paraphrasing

### Quality gate
- [ ] Record count reconciles with the number of documents analysed in Family E
- [ ] Every `dok_id` in synthesis-summary.md appears in the document ledger
- [ ] No source missing `Retrieved at` timestamp
- [ ] Freshness Mermaid sums to 100 %
- [ ] All flagged stale sources have a replacement plan or documented acceptance

---

## 🔗 Part 2 — Cross-Reference Map (`cross-reference-map.md`)

### Purpose
Expose the **relational structure** of the evidence set so Family A synthesis can narrate patterns (bundles, coordinated filings, thematic clusters, rebuttals, continuations) and Family C/D products can detect coalition behaviour and temporal trends.

### Input
- Full Family E per-document analyses (they declare their referenced `dok_id`s)
- Previous 30 days of cross-reference-map.md files (to detect continuations)
- Party sponsorship metadata from `search_dokument`
- Committee (`organ`) routing

### Output — required structure

1. **Summary statistics** — node count, edge count, connected components, max in-degree document
2. **Relationship matrix** — one row per relationship type:
   - `Relationship` (bundle, rebuttal, amends, continues, coordinated-filing, thematic, committee-routed)
   - `Count` · `Strongest example with dok_id pair`
3. **Linkage graph Mermaid** — color-coded by relationship type, nodes sized/colored by significance tier
4. **Temporal chain table** — documents that continue or amend prior ones, with date deltas
5. **Coordinated-activity callouts** — patterns flagged for Family C devils-advocate / intelligence-assessment attention

### Required Mermaid — relationship-typed graph

```mermaid
graph LR
    classDef p0 fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF
    classDef p1 fill:#FF9800,stroke:#E65100,color:#FFFFFF
    classDef p2 fill:#FFC107,stroke:#F57F17,color:#3E2723
    classDef p3 fill:#9E9E9E,stroke:#424242,color:#FFFFFF
    classDef prior fill:#1565C0,stroke:#0D47A1,color:#FFFFFF

    prop108[prop 2025/26:108<br/>budget proposition]:::p0
    bet_FiU2[bet FiU2<br/>finance committee]:::p1
    mot3412[mot 3412<br/>S opposition motion]:::p1
    mot3415[mot 3415<br/>V opposition motion]:::p2
    prior_prop[prop 2024/25:89<br/>prior year precedent]:::prior

    prop108 ==>|amends| prior_prop
    bet_FiU2 ==>|reviews| prop108
    mot3412 -..->|rebuts| prop108
    mot3415 -..->|rebuts| prop108
    mot3412 -.coordinated.- mot3415
```

### Relationship taxonomy (canonical — 7 edge types · use these names exactly)

The taxonomy distinguishes **edge types** (atomic relationships between two specific `dok_id`s — what goes on the Mermaid arrow) from **cluster types** (semantic groupings of multiple edges — what `cross-reference-map.md` Section "Cluster Deep-Dive" enumerates). Every Mermaid edge in the cross-reference-map MUST carry exactly one of these 7 edge labels:

| # | Edge type | Meaning | Mermaid style | Detection rule |
|:-:|-----------|---------|---------------|----------------|
| 1 | `amends` | New doc modifies a prior binding instrument (statute, regulation, prior proposition) | solid bold arrow `==>` | Explicit "ändrar / upphäver / ersätter" textual reference, **OR** matching SFS-number cross-reference |
| 2 | `continues` | Follow-up action in an ongoing legislative process (prop → bet → kammarvotering → uppföljning) | solid arrow `-->` | Explicit dok_id cross-reference + same policy chain + monotonic dates ≤ 180 days |
| 3 | `rebuts` | Opposition or counter-filing directly against a government / majority document | dotted arrow `-..->` | Filed within 30 days of target + opposition sponsor + named target dok_id in motion text |
| 4 | `coordinated-filing` | Two or more docs filed by aligned actors on the same theme within ±1 day | dashed line `-.coord.-` | Same `rm` + same calendar date (±1) + adjacent policy domain + distinct sponsors from aligned bloc |
| 5 | `bundle` | Docs released as a package by the **same** sponsor (e.g. budget propositions + supplementary motions) | solid line `---` with label | Same primary sponsor + same calendar date ±0 + explicit "denna proposition tillsammans med …" language or matching package title |
| 6 | `thematic` | Shared policy domain without sponsor coordination | thin arrow `-->` | Shared classification-results.md taxonomy node + no other rule fires |
| 7 | `committee-routed` | Shared organ path (utskott or kammarutskottet referral) | annotation on node, edge `--` with `committee` label | Same handling committee in `bet`/`prop` metadata |

#### Edge-type → cluster-type crosswalk (binding)

The 7 atomic edge types map to the 7 semantic cluster types enumerated in [`cross-reference-map.md` §"Relationship Types"](../templates/cross-reference-map.md#-relationship-types--when-to-use-each). **Every cluster row in the template must be supported by ≥1 atomic edge of an admissible type:**

| Cluster type (template) | Admissible edge types (methodology) |
|-------------------------|-------------------------------------|
| 📦 Policy cluster | `bundle`, `thematic`, `coordinated-filing` |
| ⚙️ Legislative chain | `continues`, `amends`, `committee-routed` |
| ⚔️ Opposition strategy | `rebuts`, `coordinated-filing` |
| 🧩 Coalition signal | `bundle`, `coordinated-filing`, `committee-routed` |
| ⏱️ Temporal alignment | `coordinated-filing` (only) |
| 🌍 External parallel | `thematic` only — paired with `comparative-international.md` peer-country row |
| 🕰️ Historical parallel | `thematic` only — paired with `historical-parallels.md` precedent row |

A cluster that cannot be decomposed into one of these edge-type combinations is mis-typed; either rename the cluster or split it into separate clusters.

### Coordinated activity detection
Apply this rule set when ≥2 documents meet all conditions:
- Same `rm` (session) + same calendar date (±1 day)
- Same or adjacent policy domain (use classification-results.md taxonomy)
- Distinct sponsors from aligned or opposing blocs (not single-party duplicates)

When triggered, the map calls out the cluster and recommends Family C `devils-advocate.md` + `intelligence-assessment.md` be produced.

### Quality gate
- [ ] Every relationship has ≥1 concrete `dok_id` pair
- [ ] Graph is connected or explicitly notes isolated components
- [ ] Temporal chains include date deltas in days
- [ ] Coordinated-activity callouts name involved parties and sponsors
- [ ] Mermaid color/style map matches the canonical taxonomy above

---

## 🛠️ Production Workflow — step-by-step

```mermaid
flowchart TD
    classDef src fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    classDef step fill:#E8F5E9,stroke:#4CAF50,color:#1B5E20
    classDef gate fill:#FFF8E1,stroke:#FFC107,color:#3E2723
    classDef out fill:#F3E5F5,stroke:#7B1FA2,color:#311B92

    I1[MCP tool logs + web_fetch]:::src

    S1[Step 1 — Enumerate every<br/>tool call + URL fetched]:::step
    S2[Step 2 — Compute freshness<br/>against per-source SLA]:::step
    S3[Step 3 — Build manifest<br/>→ data-download-manifest.md]:::step
    G1{Gate — manifest reconciles<br/>with Family E doc count?}:::gate

    S4[Step 4 — Extract relationships<br/>from Family E analyses]:::step
    S5[Step 5 — Detect coordinated<br/>activity patterns]:::step
    S6[Step 6 — Render graph<br/>→ cross-reference-map.md]:::step
    G2{Gate — all relationships<br/>evidenced with dok_id?}:::gate

    O[Family B complete<br/>ready for Family A synthesis]:::out

    I1 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> G1
    G1 -->|pass| S4
    G1 -->|fail| S1
    S4 --> S5
    S5 --> S6
    S6 --> G2
    G2 -->|pass| O
    G2 -->|fail| S4
```

### SLA table — data freshness tolerances

| Source | Fresh | Recent | Acceptable | Stale (flag) |
|--------|:-----:|:------:|:----------:|:------------:|
| Riksdag live APIs | ≤24 h | ≤7 d | ≤30 d | >30 d |
| Regeringen.se | ≤24 h | ≤7 d | ≤30 d | >30 d |
| SCB PxWeb | ≤7 d | ≤30 d | ≤90 d | >90 d |
| **IMF WEO / FM / IFS / BOP / GFS_COFOG / DOTS / PCPS / MFS_IR / ER** *(primary economic — all macro / fiscal / monetary / external / commodity / FX context)* | ≤3 mo | ≤6 mo | ≤12 mo | >12 mo |
| World Bank indicators *(non-economic residue only — WGI / environment / social / education participation / defence historicals)* | ≤12 mo | ≤24 mo | ≤36 mo | >36 mo |

---

## ✅ Family-B Completion Checklist

- [ ] `data-download-manifest.md` — summary header · source table · document ledger · stale-flag section · freshness Mermaid
- [ ] `cross-reference-map.md` — stats · relationship matrix · graph Mermaid · temporal chain table · coordinated-activity callouts
- [ ] Every `dok_id` present in Family E is present in the document ledger
- [ ] Every edge in cross-reference-map has a concrete `dok_id` pair citation
- [ ] Stale-data flags either have a remediation plan or a documented acceptance
- [ ] Coordinated-activity callouts either trigger Family C or document why they do not

---

## 🔗 Template bindings

| Template | Methodology section |
|----------|--------------------|
| `analysis/templates/data-download-manifest.md` | Part 1 above |
| `analysis/templates/cross-reference-map.md` | Part 2 above |

---

## 📐 Cross-references to other methodology layers

- **Upstream:** Family E per-document analyses — see [per-document-methodology.md](./per-document-methodology.md)
- **Downstream:** Family A synthesis reads this layer first — see [synthesis-methodology.md](./synthesis-methodology.md)
- **Triggers:** Coordinated-activity detection routes to Family C — see [strategic-extensions-methodology.md](./strategic-extensions-methodology.md)
- **Master protocol:** [ai-driven-analysis-guide.md](./ai-driven-analysis-guide.md)

---

## 🔐 ISMS Alignment

| Control | How this methodology satisfies it |
|---------|----------------------------------|
| ISO 27001 A.5.12 (Classification of information) | Every data source tagged with freshness and confidence class |
| ISO 27001 A.5.14 (Information transfer) | Manifest records endpoints, parameters, timestamps — fully auditable |
| ISO 27001 A.8.15 (Logging) | Manifest is the workflow's append-only audit log |
| NIST CSF ID.AM-3 | Manifest enumerates every data asset used |
| NIST CSF PR.DS-6 | Integrity verification via SHA / URL for every record |
| CIS 3.1 + 8.1 | Data inventory + audit log management |
| GDPR Art. 5(1)(a)(c)(f) | Lawfulness + data minimisation + integrity documented per source |

---

## 📄 Document Control

**Owner:** CEO (Intelligence Program) · **Reviewer:** CISO + Data Engineering Lead · **Review Cycle:** Quarterly
**Next Review:** 2026-07-21 · **Related:** [ai-driven-analysis-guide.md](./ai-driven-analysis-guide.md), [synthesis-methodology.md](./synthesis-methodology.md)

---

*Generated following Riksdagsmonitor Structural Metadata Methodology v1.0 — Family B Provenance & Linkage Layer.*
