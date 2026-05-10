# Data Download Manifest — Year Ahead 2026-05-10

**Workflow**: news-year-ahead
**Run ID**: 25599520638
**Generated**: 2026-05-10T11:08:00Z
**Requested Date**: 2026-05-10 (Saturday — non-business day; lookback fallback active)
**Effective Date**: 2026-05-08 (1 business day back)
**Window**: 30-document aggregation, 365-day horizon, 180-day lookback
**Riksmöte**: 2025/26
**Analysis Subfolder**: year-ahead

## Document Inventory (today's batch — 11 docs from 2026-05-08 lookback)

| dok_id | Title | Type | Committee | Date | Full-Text | Party | Status |
|--------|-------|------|-----------|------|-----------|-------|--------|
| HD01CU31 | En mer flexibel hyresmarknad | bet | CU | 2026-05-08 | metadata | — | Committee adopted |
| HD01CU34 | Ändamålsenliga utmätningsregler och utökad distansutmätning | bet | CU | 2026-05-08 | metadata | — | Committee adopted |
| HD01SoU36 | Bättre förutsättningar att sända ut statlig personal | bet | SoU | 2026-05-08 | metadata | — | Committee adopted |
| HD01UU13 | Interparlamentariska unionen | bet | UU | 2026-05-08 | metadata | — | Committee adopted |
| HD01UbU20 | Offentlighetsprincipen med lättnadsregler för enskilda mindre huvudmän i skolväsendet | bet | UbU | 2026-05-08 | metadata | — | Committee adopted |
| HD01UbU28 | Legitimation och behörighet i den tioåriga grundskolan | bet | UbU | 2026-05-08 | metadata | — | Committee adopted |
| HD10480 | Stadigvarande vistelse | fr | — | 2026-05-08 | metadata | S | Filed |
| HD11800 | Småföretagares trygghet i Hässelby-Vällingby | mot | — | 2026-05-08 | metadata | S | Filed |
| HD11801 | Nedsläckning av lands- och glesbygd | mot | — | 2026-05-08 | metadata | V | Filed |
| HD11802 | Förbud mot heltäckande slöja | mot | — | 2026-05-08 | metadata | SD | Filed |
| HD11803 | Israels ingripande på internationellt vatten mot svenska medborgare | mot | — | 2026-05-08 | metadata | S | Filed |

## Long-Horizon Predecessor Inventory

This year-ahead build extends the **2026-05-07 year-ahead baseline** (run ID 25527437086) with the new 2026-05-08 batch above plus the predecessor analyses below. All long-horizon judgments inherit confidence from the predecessor unless the new batch explicitly invalidates them.

| Predecessor folder | Type | Role |
|--------------------|------|------|
| analysis/daily/2026-05-07/year-ahead/ | year-ahead | Direct prior baseline (D-2) |
| analysis/daily/2026-05-10/monthly-review/ | monthly-review | Same-day monthly aggregation (predecessor required by long-horizon gate) |
| analysis/daily/2026-05-07/monthly-review/ | monthly-review | Most recent prior monthly synthesis |
| analysis/daily/2026-05-03/monthly-review/ | monthly-review | T-6d monthly synthesis |
| analysis/daily/2026-04-29/monthly-review/ | monthly-review | T-10d monthly synthesis |
| analysis/daily/2026-04-27/monthly-review/ | monthly-review | T-12d monthly synthesis |
| analysis/daily/2026-04-26/monthly-review/ | monthly-review | T-13d monthly synthesis |

> **Quarter-ahead predecessor gap**: No `quarter-ahead` folder exists in `analysis/daily/`. The long-horizon gate's `cross-horizon-citations: quarter-ahead` requirement is fulfilled by inheritance from `2026-05-07/year-ahead/` (which itself ingested the latest available quarter-equivalent monthly aggregations) and by the `monthly-review` chain above. Gap explicitly recorded — methodology-reflection.md flags this as a 🟡 partial citation.

## Document Counts by Type (today's pre-aggregation snapshot)

- **propositions**: 30 in raw pool (0 dated 2026-05-10, 6 dated 2026-05-08)
- **motions**: 30 in raw pool (4 dated 2026-05-08)
- **committeeReports**: 30 in raw pool (6 dated 2026-05-08)
- **interpellations**: 30 in raw pool (1 dated 2026-05-08)
- **questions**: 30 in raw pool
- **speeches**: 30 in raw pool
- **votes**: 0 (no votes recorded for the 2026-05-08 lookback window)

## Data Quality Notes

All documents sourced from official `riksdag-regering` MCP (HTTP, gateway port 8080).
Data sourced from 2026-05-08 via lookback fallback (Saturday gap).
All 11 selected documents are `metadata` only — full text not retrieved. Top-3 floor not enforceable for this specific batch because all 6 propositions in the raw pool failed the dated-filter; lookback recovery returned only `bet` + `mot` + `fr` items. Documented as 🟡 partial in `methodology-reflection.md §Content Metrics`.

## Full-Text Fetch Outcomes

| dok_id | Type | Full-text status | Reason |
|--------|------|------------------|--------|
| All 11 docs | bet/mot/fr | metadata | Lookback batch returned no enriched payloads in the 2026-05-08 window; full-text retrieval not retried (gate-allowed for non-L2 batch) |

## Prior-Voteringar Enrichment

Inherited from 2026-05-07 baseline. Net new for 2026-05-08 batch: no directly comparable vote found in last 4 riksmöten for the new committee betänkanden (CU, SoU, UbU, UU) — all are first-vote items in the 2025/26 cycle. Recorded as `Prior voteringar: no directly comparable vote found in last 4 riksmöten` for HD01CU31, HD01CU34, HD01SoU36, HD01UU13, HD01UbU20, HD01UbU28.

## Statskontoret Cross-Source Enrichment

- HD01CU31 (En mer flexibel hyresmarknad) → trigger: implementation feasibility (rental-market regulation touches Boverket + Hyresnämnderna) → Statskontoret report on Boverket capacity not directly applicable; recorded as `Statskontoret: no directly relevant 2025/26 report found for hyresmarknad-reform`.
- HD01UbU28 (Legitimation och behörighet i den tioåriga grundskolan) → trigger: Skolverket administrative-capacity → inherit 2026-05-07 baseline citation (Statskontoret 2024:14 Skolverket licensing throughput).
- HD11801 (Nedsläckning av lands- och glesbygd) → trigger: PTS / Energimyndigheten oversight → no directly relevant Statskontoret report; recorded.
- All other 2026-05-08 batch docs: no agency named, no administrative dimension fired.

## Lagrådet Tracking

No new government propositions in the 2026-05-08 batch. Lagrådet pipeline inherited from 2026-05-07 baseline (HD03250 e-legitimation, HD03261 Skatteverket folkbokföring, HD03267 säkerhetshot — all referred per prior manifest).

## Withdrawn Documents

None in 2026-05-08 batch.

## PIR Carry-Forward

Read 5 most recent `pir-status.json` from `*/year-ahead/*` within 14 days. Open PIRs carried forward (full list in `pir-status.json`):

- **PIR-Y-2026-01** (Election outcome — 2026-09-13) — status: open; horizon: T+127d; T-2 from prior baseline; re-evaluated below in `intelligence-assessment.md`.
- **PIR-Y-2026-02** (Tidö coalition durability through Q3 2026) — status: open; horizon: T+150d.
- **PIR-Y-2026-03** (NATO/Försvarsbeslut 2026 implementation) — status: open; horizon: T+365d.
- **PIR-Y-2026-04** (BP autumn 2026 fiscal framework) — status: open; horizon: T+180d.
- **PIR-Y-2026-05** (EU Council Swedish presidency follow-on FY2027) — status: open; horizon: T+540d.

## IMF vintage pin

| Field | Value |
|-------|-------|
| `vintage` | WEO Apr-2026 (most recent) |
| `retrieved_at` | 2026-05-10T11:08:00Z (inherited from 2026-05-07 baseline; no fresh IMF call this run — vintage unchanged within 2-day window) |
| `payload_sha256` | inherited (no re-fetch) |
| `dataflows` | WEO + FM + DOTS (Nordic peers SWE, DNK, NOR, FIN, DEU) |
| `nordic_peer_compare` | inherited from 2026-05-07; no Nordic-peer rows changed in 2 days (annual cadence) |

> **Vintage note**: WEO Apr-2026 is the active vintage; next refresh expected at WEO Oct-2026. All `[T+1]`, `[T+2]`, `[T+5]` projection-year stamps in long-horizon Family-C/D artifacts derive from this vintage.
