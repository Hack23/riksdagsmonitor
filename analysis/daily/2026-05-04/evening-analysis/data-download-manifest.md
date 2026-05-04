# Data Download Manifest — Evening Analysis 2026-05-04

**Workflow**: news-evening-analysis  
**Run ID**: 25336216212  
**UTC Timestamp**: 2026-05-04T18:55:00Z  
**Riksmöte**: 2025/26  
**Requested Date**: 2026-05-04  
**Effective Date**: 2026-05-04 (no lookback required — 14 documents found)  
**Analysis Depth**: deep (Tier-C, 1.0× period multiplier)  
**Days to Election**: 132

---

## Document Table

| dok_id | Title | Type | Committee | Date | Full-Text | Parti |
|--------|-------|------|-----------|------|-----------|-------|
| HD01KU39 | Ökad insyn i politiska processer | bet (Betänkande) | KU | 2026-05-04 | metadata-only (document not yet published) | — |
| HD01FiU49 | Utvärdering av statens upplåning och skuldförvaltning 2021–2025 | bet (Betänkande) | FiU | 2026-05-04 | metadata-only (document not yet published) | — |
| HD024141 | Med anledning av prop. 2025/26:242 (skogsbruk) | mot | MJU | 2026-05-04 | partial | V |
| HD024142 | Med anledning av prop. 2025/26:246 (unga lagöverträdare) | mot | JuU | 2026-05-04 | partial | V |
| HD024143 | Med anledning av prop. 2025/26:242 (skogsbruk) | mot | MJU | 2026-05-04 | partial | [unconfirmed] |
| HD024144 | Med anledning av prop. 2025/26:242 (skogsbruk) | mot | MJU | 2026-05-04 | partial | [unconfirmed] |
| HD024145 | Med anledning av prop. 2025/26:242 (skogsbruk) | mot | MJU | 2026-05-04 | partial | [unconfirmed] |
| HD024146 | Med anledning av prop. 2025/26:246 (unga lagöverträdare) | mot | JuU | 2026-05-04 | partial | [unconfirmed] |
| HD024147 | Med anledning av prop. 2025/26:242 (skogsbruk) | mot | MJU | 2026-05-04 | partial | [unconfirmed] |
| HD024148 | Med anledning av prop. 2025/26:246 (unga lagöverträdare) | mot | JuU | 2026-05-04 | partial | [unconfirmed] |
| HD10462 | Skatt på bekämpningsmedel | ip (Interpellation) | — | 2026-05-04 | partial | S |
| HD10463 | Effekter för Östergötland av ändrad sträckning av Ostlänken | ip (Interpellation) | — | 2026-05-04 | partial | S |
| HD11779 | Utbildning även för den som inte är långtidsarbetslös | fr (Fråga) | — | 2026-05-04 | partial | C |
| HD11780 | Investeringar i svenska biodrivmedel | fr (Fråga) | — | 2026-05-04 | partial | S |

---

## MCP Server Availability

- **riksdag-regering**: Live (status checked 2026-05-04T18:52:11Z)
- **IMF CLI**: Partial — pre-warm succeeded but rate-limit hit on compare call; using cached WEO Apr-2026 data from sibling analyses (NGDP_RPCH_2026: 2.1%, GGXWDG_NGDP: ~34%)
- Download pipeline: 180 total documents, 14 selected for 2026-05-04

---

## Full-Text Fetch Outcomes

| dok_id | Full-text attempt | Result |
|--------|-------------------|--------|
| HD01KU39 | Attempted via get_dokument_innehall | Not published yet; scheduled for June 2026 debate. metadata-only |
| HD01FiU49 | Attempted via get_dokument_innehall | Not published yet; processes Skrivelse HD03104. metadata-only |
| HD024142 | Full text retrieved | V motion: rejects prop 246 except youth supervision and juvenile justice strengthening; demands outright rejection of 13-year criminal age |
| HD024141 | Partial summary retrieved | V: demands outright rejection of prop 242 (forest management) except appeal route reform |

---

## Prior-Voteringar Enrichment

Prior committee votes searched (KU, FiU, JuU, MJU — last 4 riksmöten):
- **KU transparency votes (2022–2025)**: No directly comparable KU39 transparency vote found in last 4 riksmöten. The previous transparency package (KU35 2024/25) passed with S abstention rather than opposition.
- **FiU debt management**: Riksgälden evaluation votes do not generate formal divisions — committee endorses without recorded votes.
- **JuU youth crime (2024–2025)**: Prior youth crime votes (HD01JuU6, 2025/26) — V voted Nej on criminal age expansion. S voted Nej on 13-year threshold in committee; majority (M+KD+SD+L) voted Ja. This pattern will recur on prop 246.
- **MJU forest management**: Prior MJU votes on forest policy (2023–2025): V routinely votes Nej. S voted with majority on previous forest code amendments. C/MP split by issue.

---

## Statskontoret Cross-Source Enrichment

Triggers evaluated for all 14 documents:

| Document | Trigger fired? | Statskontoret action |
|----------|---------------|----------------------|
| HD01KU39 | YES — governance/transparency reform affecting agency reporting | No Statskontoret report directly on political process transparency found; www.statskontoret.se search conducted. Closest: Statskontoret "Förvaltningspolitik" annual report 2025 — notes transparency as a governance metric. |
| HD01FiU49 | YES — evaluation of Riksgälden (state debt agency) | Statskontoret has not published a separate Riksgälden evaluation; FiU itself performs the review per riksdagsordningen. |
| HD10463 | YES — Trafikverket named; Ostlänken regional infrastructure | Statskontoret "Infrastrukturplanering" 2024 report cited in prior analyses — notes Trafikverket prioritization methodology. |
| Others | No trigger (no named agency, no administrative dimension) | Statskontoret pre-warm: no trigger matched |

---

## Lagrådet Tracking

Evaluated for government propositions in today's batch: HD01KU39 (transparency) and HD01FiU49 (debt) are betänkanden (committee reports), not government propositions — Lagrådet review not applicable to betänkanden.

For today's interpellations (HD10462, HD10463): interpellations do not require Lagrådet review.

Note: HD03262–HD03265 (migration propositions, from propositions sibling folder) — Lagrådet referral PIR-RT-001 remains open per realtime-pulse. No yttrande published as of 2026-05-04T18:55Z. Lagrådet site www.lagradet.se accessible; searched for HD03262/HD03265 — no published yttrande found yet.

---

## Withdrawn Documents

No withdrawn documents in today's direct batch.

Note: HD024127 (interpellation retraction, from yesterday's motions analysis) previously documented as withdrawn — not in today's batch.

---

## PIR Carry-Forward

Open PIRs from prior evening-analysis cycles propagated forward:

**From 2026-04-30 (most recent evening-analysis)**:
- PIR-EVE-01: Migration package passage — PARTIALLY RESOLVED: HD03262–265 confirmed on parliamentary calendar, Lagrådet not yet published (still open)
- PIR-EVE-02: HD03254 military cooperation → Saab procurement — OPEN
- PIR-EVE-03: SD coalition discipline on HD03258 — OPEN
- PIR-EVE-04: Legislative capacity before summer recess — OPEN; KU39 scheduled June 16 vote signals adequate capacity
- PIR-EVE-05: ECHR/EU legal challenges on HD03262 — OPEN

**From 2026-04-29**:
- PIR-EA-01: C bloc-exit voting strategy — OPEN
- PIR-EA-02: HVB criminal infiltration investigation — OPEN
- PIR-EA-03: China risk parliamentary inquiry — OPEN
- PIR-EA-04: SD gas bridge demand — OPEN

**From realtime-pulse 2026-05-04**:
- PIR-RT-001: Lagrådet on HD03262/HD03265 — OPEN (CRITICAL)
- PIR-RT-003: Post-migration polling trends — OPEN (HIGH)
- PIR-RT-005: Carlson Ostlänken answer by May 25 — NEW (HIGH)
- PIR-RT-006: Energy company response to NU19 — NEW (HIGH)

---

## Reference Analyses (Tier-C Sibling Ingestion)

Sibling analyses read for Tier-C cross-synthesis:

| Folder | Analysis | Status |
|--------|----------|--------|
| analysis/daily/2026-05-04/propositions | synthesis-summary.md + intelligence-assessment.md | ✅ Read |
| analysis/daily/2026-05-04/motions | synthesis-summary.md | ✅ Read |
| analysis/daily/2026-05-04/interpellations | synthesis-summary.md | ✅ Read |
| analysis/daily/2026-05-04/realtime-pulse | synthesis-summary.md | ✅ Read |
| analysis/daily/2026-05-04/election-cycle | synthesis-summary.md | ✅ Read |
| analysis/daily/2026-05-04/year-ahead | synthesis-summary.md | ✅ Read |

---

## Economic Provenance

```json
{
  "provider": "imf",
  "dataflow": "WEO_Apr_2026",
  "vintage": "April 2026",
  "retrieved_at": "2026-05-04",
  "indicators": {
    "NGDP_RPCH_2026": "2.1%",
    "GGXWDG_NGDP_2026": "~34%",
    "PCPIEPCH_2026": "declining (toward 2% target)",
    "GGXCNL_NGDP_2026": "approximately -0.6%"
  },
  "note": "Direct API call rate-limited; values from cached sibling-analysis provenance blocks (propositions, year-ahead, realtime-pulse)"
}
```
