# Devil's Advocate / ACH Matrix — Committee Reports 2026-04-24

**Framework**: Analysis of Competing Hypotheses (ACH) — Heuer methodology; Red-Team challenge.
**Confidence**: MEDIUM (C3) — hypotheses test analytic robustness of the mainline reading.

## Competing hypotheses

### H1 — Mainline: Coordinated pre-election signalling cluster
The five-report tabling is a deliberate Tidö composition to front-load delivery signals ahead of Sep 2026.

### H2 — Bureaucratic coincidence
The clustering is a mechanical consequence of the Riksdag calendar — betänkanden accumulate for chamber decision before summer recess; committee-chair scheduling is the driver, not strategic messaging.

### H3 — Defensive scrambling
The cluster reflects Tidö anxiety about slipping delivery metrics; signature items are being rushed through committee to lock in a pre-election record before unfavourable data emerges.

### H4 — Coalition-internal settlement
The composition is the output of intra-coalition horse-trading: SD got CU25 + SfU23 hard framing; L got SfU23 carve-out + AU15 ratification; M balances; KD neutralised on CU29 cost caution — each party gets enough to defend its vote.

## ACH matrix

Evidence mapped to consistency with each hypothesis (C = consistent, I = inconsistent, N = neutral, ? = ambiguous).

| # | Evidence | H1 Coordinated | H2 Coincidence | H3 Defensive | H4 Coalition |
|:-:|----------|:--------------:|:--------------:|:------------:|:------------:|
| E1 | Five reports across 4 committees tabled same day (`HD01CU25`, `HD01SfU23`, `HD01FiU23`, `HD01AU15`, `HD01CU29`) | C | N | C | C |
| E2 | Three of five (CU25, SfU23, FiU23) are signature Tidö-trajectory items | C | I | C | C |
| E3 | Two of five (AU15, CU29) are broad-consensus items providing breadth cover | C | N | N | C |
| E4 | Riksdag pre-recess window historically packed with committee reports | N | C | N | N |
| E5 | SfU23 carve-out structure (tightening + exemption) matches typical horse-trade pattern | N | N | N | C |
| E6 | No extraordinary procedural acceleration documented for any of the five | I | C | I | N |
| E7 | Tidö public messaging in April 2026 emphasising delivery-ledger framing ([regeringen.se](https://www.regeringen.se/)) | C | I | C | N |
| E8 | Delivery-metric trajectory in Q1 2026 mixed (CU capacity ambiguous) | ? | N | C | N |

**Tally of inconsistent evidence** (minimising is the ACH-preferred hypothesis): H1 = 1, H2 = 3, H3 = 1, H4 = 0.

**Preferred hypothesis**: H4 (coalition-internal settlement) shows zero inconsistencies but H1 (coordinated signalling) and H3 (defensive) are both well-supported. H1 and H4 are in fact **compatible** — strategic signalling and horse-trading are concurrent. H2 is weakest but cannot be dismissed because E4 + E6 support it.

**Decision**: present H1 as mainline, with explicit acknowledgement that H4 (horse-trading) is the likely intra-coalition mechanism. H3 is the **downside scenario** to monitor.

## Red-Team challenge

**Claim we are most likely wrong about**: the CU25 DIW of 85. Red team contends: (a) CU25 may be operationally blocked by local-council procedural challenges before construction starts, reducing actual impact despite high symbolic weight; (b) prior Kriminalvården capacity-plan misses (2020, 2023) suggest a base rate of under-delivery that should drag CU25's implementation-impact sub-score down; (c) if delivery is performative rather than operational, DIW may reflect attention-weight more than decision-weight.

**Response**: the DIW 85 score already integrates a 75 on institutional weight (moderate, not maximal) reflecting operational uncertainty, and an electoral-salience 95 captures the symbolic weight separately. The sensitivity band 78–88 in `significance-scoring.md` is consistent with the Red-Team concerns. We retain the mainline estimate but log this as a **Priority-1 audit item** for the +60 d Kriminalvården Q2 report.

**Second challenge**: SfU23 may be overrated as a coalition-stress driver (DIW 80, coalition-stress 85). Red team: L may not actually defect because the researcher carve-out already accommodates its preference; the "SD–L tension" narrative may be media framing more than institutional reality. **Response**: carve-out acceptance depends on ministerial ordinance scope, which is TBD — residual tension real but conditional. Retain current scoring.

## Rejected hypothesis log

- **H2 (bureaucratic coincidence)**: retained as null hypothesis for methodology purposes only. Inconsistent with E1 (simultaneous signature + breadth mix) and E2 (three signature items > base rate).
- **Sub-hypothesis**: "the cluster signals Tidö pivot away from S-type welfare agenda". Rejected — no evidence in tabled items supports a welfare pivot; AU15 is labour-protection and CU29 is distributive.

## Sources

- `get_dokument` × 5 [A1]
- regeringen.se communications trend [A2]
- Historical Riksdag calendar: [riksdagen.se/kalender](https://www.riksdagen.se/) [A1]

## Pass 2 refinements

Pass 2 re-read this artifact in full, cross-checked every `dok_id` citation against [`data-download-manifest.md`](./data-download-manifest.md), confirmed Admiralty codes are consistent with §Source diversity in [`methodology-reflection.md`](./methodology-reflection.md), and verified cluster-level internal consistency against [`intelligence-assessment.md`](./intelligence-assessment.md). No judgments were reversed; confidence labels retained. Additional evidence row: `HD01CU25`, `HD01SfU23`, `HD01FiU23`, `HD01AU15`, `HD01CU29` at [data.riksdagen.se](https://data.riksdagen.se/) [A1].
