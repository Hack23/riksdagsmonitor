# Data Download Manifest — Realtime Pulse 2026-05-05

**Author**: James Pether Sörling  
**Generated**: 2026-05-05T10:45:00Z  
**Classification**: PUBLIC  

---

## Run Configuration

| Field | Value |
|-------|-------|
| Article date | 2026-05-05 |
| Subfolder | realtime-pulse |
| Analysis depth | deep |
| Workflow | news-realtime-monitor |
| IMPROVEMENT_MODE | false (first generation) |
| MCP status | LIVE (riksdag-regering, confirmed via get_sync_status) |
| IMF API | PARTIALLY UNAVAILABLE (live data blocked; WEO Oct-2025 vintage used) |

---

## Sibling Folder Ingestion

| Folder | Path | Status | Key Documents |
|--------|------|--------|--------------|
| propositions | analysis/daily/2026-05-05/propositions/ | COMPLETE | HD03255 |
| committeeReports | analysis/daily/2026-05-05/committeeReports/ | COMPLETE | FiU49, KU39 |
| motions | analysis/daily/2026-05-05/motions/ | COMPLETE | HD024141–HD024148 |
| interpellations | analysis/daily/2026-05-05/interpellations/ | COMPLETE | HD10458–HD10463 |

All four sibling synthesis-summary.md, executive-brief.md, intelligence-assessment.md, and coalition-mathematics.md files were read as inputs to this aggregation.

---

## Primary Documents Referenced

### Propositions (1)

| dok_id | Title | Source URL | Retrieved | Data depth | Admiralty |
|--------|-------|-----------|-----------|-----------|----------|
| HD03255 | Prop. 2025/26:255 Finansinspektionens tillgång till hushållsdata | data.riksdagen.se/dokumentstatus/HD03255 | 2026-05-05T08:00:00Z | Full (via sibling analysis) | A1 |

### Committee Reports (2 planned, unpublished)

| dok_id | Title | Source URL | Retrieved | Data depth | Admiralty |
|--------|-------|-----------|-----------|-----------|----------|
| HD01FiU49 | FiU49 Statens upplåning och skuldförvaltning 2021–2025 | data.riksdagen.se | 2026-05-05 | metadata-only (planerat) | A3 |
| HD01KU39 | KU39 Ökad insyn i politiska processer | data.riksdagen.se | 2026-05-05 | metadata-only (planerat) | A3 |

### Motions (8)

| dok_id | Title | Party | Source | Admiralty |
|--------|-------|-------|--------|----------|
| HD024141 | Skogsbruk motion (V) | V | data.riksdagen.se [A1] | A2 |
| HD024142 | Kriminell ålder motion (V) | V | data.riksdagen.se [A1] | A2 |
| HD024143 | Skogsbruk motion (SD) | SD | data.riksdagen.se [A1] | A2 |
| HD024144 | Skogsbruk motion (S) | S | data.riksdagen.se [A1] | A2 |
| HD024145 | Skogsbruk motion (C) | C | data.riksdagen.se [A1] | A2 |
| HD024146 | Kriminell ålder motion (C) | C | data.riksdagen.se [A1] | A2 |
| HD024147 | Skogsbruk motion (MP) | MP | data.riksdagen.se [A1] | A2 |
| HD024148 | Kriminell ålder motion (MP) | MP | data.riksdagen.se [A1] | A2 |

### Interpellations (5)

| dok_id | Title | Source | Admiralty |
|--------|-------|--------|----------|
| HD10458 | Gang crime KPI — Justice Min. Strömmer | data.riksdagen.se [A1] | A2 |
| HD10459 | Agency activism — Civil Min. Slottner | data.riksdagen.se [A1] | A2 |
| HD10461 | ESA funding — Research Min. Edholm | data.riksdagen.se [A1] | A2 |
| HD10462 | Pesticide tax — Finance Min. Svantesson | data.riksdagen.se [A1] | A2 |
| HD10463 | Ostlänken routing — Infrastructure Min. Carlson | data.riksdagen.se [A1] | A2 |

---

## Full-Text Fetch Outcomes

| dok_id | Full text available | Source | Notes |
|--------|-------------------|--------|-------|
| HD03255 | YES (via propositions sibling) | riksdagen.se | Statutory household debt survey framework |
| HD024141–HD024148 | YES (via motions sibling) | riksdagen.se | All 8 opposition motions |
| HD10458–HD10463 | YES (via interpellations sibling) | riksdagen.se | All 5 interpellations |
| HD01FiU49 | NO — metadata-only | riksdagen.se | planerat status; text unpublished |
| HD01KU39 | NO — metadata-only | riksdagen.se | planerat status; text unpublished |

*Gate check 10 note*: ≥2 full-text retrievals confirmed (HD03255 + all 8 motions + all 5 interpellations — well above gate floor).

---

## PIR Carry-Forward

### From propositions/pir-status.json

| PIR ID | Status | Carried forward |
|--------|--------|----------------|
| PIR-5 (Lagrådet HD03255) | PENDING | YES → forward-indicators.md FI-Lagrådet |
| PIR-4 (ESRB compliance) | PARTIALLY_ADDRESSED | YES → comparative-international.md |

### From committeeReports/pir-status.json

| PIR ID | Status | Carried forward |
|--------|--------|----------------|
| PIR-3 (KU39 constitutional change) | OPEN | YES → highest priority forward indicator |
| PIR-1 (fiscal sustainability) | OPEN | YES → FiU49 evaluation monitor |

### From motions/pir-status.json

| PIR ID | Status | Carried forward |
|--------|--------|----------------|
| LAGRÅDET-246 (youth crime) | ACTIVE | YES → forward-indicators.md LAGRÅDET-246 |
| EU-HABITATS-SE | ACTIVE | YES → forward-indicators.md EU-HABITATS |
| COALITION-C-JuU | ACTIVE | YES → coalition-mathematics.md |

---

## Prior-Voteringar Enrichment

No directly comparable prior votes found in last 4 riksmöten for KU39 transparency reform (novel legislative framing). For forestry deregulation, prior context from MJU/JuU is captured in motions sibling `historical-parallels.md`. For HD03246 (youth crime age cut), JuU voting history shows SD+M+KD+L majority on law-and-order measures — no directly comparable vote on criminal responsibility age.

Prior voteringar summary: **no directly comparable vote found in last 4 riksmöten** for KU39 transparency scope; prior forestry deregulation votes available in motions sibling folder.

---

## Statskontoret Cross-Source Enrichment

**Trigger evaluation** (mandatory per protocol):

| Trigger | Fired? | Action |
|---------|--------|--------|
| Names a recognised agency (FI, Riksgälden) | YES | Evaluated |
| Administrative-capacity claim (FI data collection) | YES | Evaluated |
| Implementation feasibility risk (KU39 lobbying register) | YES | Evaluated |
| Governance/public-sector efficiency | YES | Evaluated |

**Result**: Statskontoret search conducted via web_fetch for FI administrative capacity and lobbying register implementation capacity. No specific Statskontoret evaluation of HD03255 or KU39 implementation found. General Statskontoret observations on agency capacity applied in implementation-feasibility.md.  
**Source**: `https://www.statskontoret.se/` (accessed 2026-05-05) — no specific report matching these documents.  
**Record**: Statskontoret: no directly relevant source found for HD03255 survey capacity / KU39 lobbying register implementation.

---

## Lagrådet Tracking

| Document | Lagrådet referral | Status |
|----------|-------------------|--------|
| HD03255 | Expected | Referral pending / no yttrande published as of 2026-05-05T10:45:00Z |
| HD03246 (youth crime) | Expected | Referral pending / no yttrande published as of 2026-05-05T10:45:00Z |

Forward indicator added: Lagrådet yttranden expected Q2 2026.

---

## Economic Data Sources

| Source | Data | Vintage | Status |
|--------|------|---------|--------|
| Riksbank FSR 2025 | Household debt/GDP ~170% | Nov 2025 | Available (public URL) |
| IMF WEO | GGXWDG_NGDP ~35%, NGDP_RPCH 2.1% | Oct 2025 | Vintage (live API partially blocked) |
| SCB | Swedish AKU unemployment ~8.5% | Feb 2026 | Available |

---

## Improvement Pass — New Documents (2026-05-05 Data Refresh)

**Refresh timestamp**: See methodology-reflection.md Re-run log  
**IMPROVEMENT_MODE**: true  
**New documents found**: 9  

### Full-Text Fetch Outcomes

| dok_id | Title | Type | Admiralty | Full Text Fetched | Notes |
|--------|-------|------|----------|------------------|-------|
| HD10464 | Avveckling av Sida | Interpellation (SD→M) | A1 | YES | Full text — Hamas-linked payment 55 MSEK, Afghanistan 14 BSEK |
| HD10465 | Statlig närvaro och service | Interpellation (S→KD) | A1 | YES | Full text — 148→125 servicekontor, 130 MSEK cut |
| HD10466 | Opolitiska tjänstemän vid Regeringskansliet | Interpellation (SD→M) | A1 | YES | Full text — 2018 skamlistan, 261 UD signatories |
| HD10467 | Nedläggning av Skatteverkets kontor i Vetlanda | Interpellation | A1 | PARTIAL | Snippet only — complements HD10465 |
| HD01JuU30 | Frihetsberövande påföljder för barn och unga | Betänkande (JuU) | A1 | PARTIAL | Key metadata confirmed; full HTML large (105KB) |
| HD11781 | Producentansvar för engångsplast | Motion (SD) | A1 | PARTIAL | Snippet |
| HD11782 | Klassning av Silc som extremistisk organisation | Motion (SD) | A1 | PARTIAL | Snippet |
| HD11783 | Återtaget flygtillstånd för Taiwans president | Motion (SD) | A1 | PARTIAL | Snippet |
| HD11784 | Kostnader för Ostlänkens anslutning till Linköping | Motion (S) | A1 | PARTIAL | Snippet |

### Per-Document Analysis Files Created

| dok_id | Analysis file | Admiralty | DIW |
|--------|-------------|----------|-----|
| HD10464 | documents/HD10464-analysis.md | A1 | 0.80 |
| HD10465 | documents/HD10465-analysis.md | A1 | 0.62 |
| HD10466 | documents/HD10466-analysis.md | A1 | 0.82 |
| HD10467 | documents/HD10467-analysis.md | A1 | 0.55 |
| HD01JuU30 | documents/HD01JuU30-analysis.md | A1 | 0.82 |
| HD11781 | documents/HD11781-analysis.md | A1 | 0.42 |
| HD11782 | documents/HD11782-analysis.md | A1 | 0.60 |
| HD11783 | documents/HD11783-analysis.md | A1 | 0.58 |
| HD11784 | documents/HD11784-analysis.md | A1 | 0.65 |

### Answer Deadlines Registered (New Interpellations)

| dok_id | Sista svarsdatum | PIR |
|--------|-----------------|-----|
| HD10464 | 2026-05-26 | PIR-NEW-10464 |
| HD10465 | 2026-05-26 | PIR-NEW-10465 |
| HD10466 | 2026-05-26 | PIR-NEW-10466 |
| HD10467 | 2026-05-26 | (not registered separately) |
