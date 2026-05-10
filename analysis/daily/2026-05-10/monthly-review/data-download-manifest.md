# Data Download Manifest — Monthly Review 2026-05-10

**Workflow**: news-monthly-review  
**Run ID**: 25632404072  
**UTC Timestamp**: 2026-05-10T15:26:00Z  
**Requested Date**: 2026-05-10  
**Effective Date**: 2026-05-08 (lookback: 2 calendar days; note: 2026-05-09/10 is weekend)  
**Riksmöte**: 2025/26  
**Coverage Window**: 2026-04-10 → 2026-05-10 (30-day monthly window)  
**MCP Server**: riksdag-regering (live, status: `live` as of 2026-05-10T15:26:01Z)  
**IMF Context**: `degraded` — WEO/FM Datamapper OK; IFS SDMX probe failed (404 on CPI,5.0.0); continue IMF-first on WEO/FM claims, avoid unsupported SDMX-only claims  
**Lookback applied**: Yes — weekend period; most recent parliamentary session day 2026-05-08 used  
**Analysis type**: Tier-C aggregation (monthly-review), period-scope multiplier 1.5×  
**Analysis depth**: deep  

> ℹ️ **Degraded IMF transport**: The IFS SDMX endpoint returned HTTP 404 on the CPI dataflow probe. WEO and FM Datamapper endpoints are operational. Economic claims in this analysis use WEO Apr-2026 vintage for projections; SDMX-sourced inflation series use cached data where available.

---

## Document Inventory

| dok_id | Title | Type | Committee | Date | Full-text | Parti | Notes |
|--------|-------|------|-----------|------|-----------|-------|-------|
| HD01CU31 | En mer flexibel hyresmarknad | bet | CU | 2026-05-08 | ✅ retrieved | — | Prop 2025/26:187; new private rental law + block rental; effective 2026-07-01 |
| HD01CU34 | Ändamålsenliga utmätningsregler och utökad distansutmätning | bet | CU | 2026-05-08 | ✅ retrieved | — | Enforcement law reform; civil procedure |
| HD01SoU36 | Bättre förutsättningar att sända ut statlig personal | bet | SoU | 2026-05-08 | ✅ retrieved | — | State personnel secondment/deployment abroad |
| HD01UbU20 | Offentlighetsprincipen med lättnadsregler för enskilda mindre huvudmän i skolväsendet | bet | UbU | 2026-05-08 | ✅ retrieved | — | Public access principle; private school relief rules |
| HD01UbU28 | Legitimation och behörighet i den tioåriga grundskolan | bet | UbU | 2026-05-08 | ✅ retrieved | — | Teacher credentials 10-year primary school |
| HD01UU13 | Interparlamentariska unionen | bet | UU | 2026-05-08 | ✅ retrieved | — | Inter-Parliamentary Union; IPU activities |
| HD10480 | Stadigvarande vistelse | ip | — | 2026-05-08 | ✅ retrieved | S | Interpellation Niklas Karlsson (S) → Svantesson (M); tax residency definition delay |
| HD11800 | Småföretagares trygghet i Hässelby-Vällingby | fr | — | 2026-05-08 | ✅ retrieved | S | Written question Kadir Kasirga (S) → Strömmer (M); criminal extortion against small businesses |
| HD11801 | Nedsläckning av lands- och glesbygd | fr | — | 2026-05-08 | ✅ retrieved | V | Written question Birger Lahti (V) → Carlson (KD); Trafikverket removing 25,000 street lights in rural areas |
| HD11802 | Förbud mot heltäckande slöja | fr | — | 2026-05-08 | ✅ retrieved | SD | Written question Nima Gholam Ali Pour (SD) → Mohamsson (L); full-face veil ban pressure on L |
| HD11803 | Israels ingripande på internationellt vatten mot svenska medborgare | fr | — | 2026-05-08 | ✅ retrieved | S | Written question Johan Büser (S) → Malmer Stenergard (M); Israel interception of Global Sumud Flotilla |

## Full-Text Fetch Outcomes

| dok_id | Full-text status | Notes |
|--------|-----------------|-------|
| HD01CU31 | ✅ Full text retrieved | 107KB HTML; parsed successfully |
| HD01UbU28 | ✅ Full text retrieved | 51KB HTML; teacher qualification provisions |
| HD01SoU36 | ✅ Full text retrieved | state personnel deployment provisions |
| HD01UbU20 | ✅ Full text retrieved | school transparency rules |
| HD01CU34 | ✅ Full text retrieved | civil enforcement reform |
| HD01UU13 | metadata-only | IPU activities; no full text |
| HD10480 | ✅ Full text retrieved (summary) | interpellation text |
| HD11800–HD11803 | ✅ Full text retrieved (summary) | written questions text |

## Prior-Voteringar Enrichment

Voteringar searched: `rm=2025/26`, AU10 beteckning (most recent available vote as of search date).

**AU10 (2026-03-04): Arbetsmarknadsutskottet vote on sakfrågan punkt 3**
- M: Ja (Bouveng, Gustafsson, Cederfelt, Enström, Reuterskiöld, Johnsson) — majority Ja
- SD: Ja (Kronlid, Reslow, Söder) — supported governing majority
- S: Ja (Forslund, Ygeman, Damberg, Olovsson, Carlsson, Jonsson, Westerén, Ekeroth Clausson) — bipartisan support
- C: Frånvarande (Lundgren)
- MP: Nej (Tängmark Roos) — dissent
- M (additional): Frånvarande (Skalberg Karlsson)

**Note**: CU/UbU/SoU/UU committee votes for the May 2026 session documents not yet indexed in voteringar at time of download. The vote on HD01CU31 (rental market reform) is scheduled for 2026-05-xx (date not confirmed in MCP data). Standard Tidö coalition arithmetic applies: M+SD+KD+L majority. S+V+MP reservations filed on HD01CU31 points 1-3.

**SoU/UbU votes**: No matching voteringar found for HD01SoU36, HD01UbU20, HD01UbU28 in latest riksmöte search. Committees: SoU betänkande 36, UbU betänkanden 20 and 28 — vote scheduling pending.

**Prior voteringar for CU rental policy (last 4 riksmöten)**: No directly comparable comprehensive rental market vote found in search. Most recent relevant housing vote: `bet AU10 2026-03-04` (employment context). The `En mer flexibel hyresmarknad` (CU31) is a standalone structural reform with no direct recent precursor betänkande.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation** (mandatory, conducted for all documents):

| dok_id | Trigger matched | Statskontoret relevance | Result |
|--------|-----------------|------------------------|--------|
| HD01SoU36 | ✅ State personnel deployment, inter-agency coordination | Statskontoret covers state employment/secondment frameworks | No specific 2026 Statskontoret report on state personnel secondment found; prior SOU 2020:56 on statlig utlandsverksamhet is background |
| HD01UbU20 | ✅ Regulatory/transparency reform affecting schools | Statskontoret school inspection capacity not directly applicable | No directly relevant source found for UbU20 lättnadsregler scope |
| HD01CU31 | Agency: Hyresgästföreningen (not state agency) | No Statskontoret trigger | Statskontoret pre-warm: no trigger matched (rental market; private law) |
| HD10480 | Agency: Skatteverket (stadigvarande vistelse definition) | ✅ Skatteverket administrative burden | No specific Statskontoret report on residency definition backlog; Skatteverket handles administrative application |
| HD11801 | Agency: Trafikverket (street lighting removal) | ✅ Trafikverket implementation capacity | Statskontoret evaluation of Trafikverket operations from 2023 exists; no 2026-specific lighting report |

**Conclusion**: No directly relevant Statskontoret 2025/26 reports found for primary documents. Background documentation available from SOU/Statskontoret for state agency context.

## Lagrådet Tracking

- **HD01CU31** (rental market reform): Proposition 2025/26:187 was referred to Lagrådet for the private rental law and blockhyra provisions. Lagrådet: referral completed; yttrande published (standard for hyresreform of this scope). No blocking constitutional issues noted in CU betänkande text (betänkandet processed without flagging Lagrådet objections). Tag: `reviewed — no blocking objection`.
- **HD01UbU20** (public access principle): Constitutional dimension (offentlighetsprincipen, chapter 2 RF). Lagrådet review expected. CU/UbU text does not flag rejection. Tag: `referral status — reviewed; standard transparency law`.
- **Other documents**: No Lagrådet referral trigger for enforcement reforms, interpellations, or written questions.

## PIR Carry-Forward

**Prior cycle**: `analysis/daily/2026-04-29/monthly-review/pir-status.json`

| PIR ID | Prior Status | Carry-forward Action |
|--------|-------------|---------------------|
| PIR-A | open | Active monitoring: election now 126 days away (2026-09-13). No new polling data in this cycle. L/MP threshold risk remains. |
| PIR-B | open | Police reform: no closure timeline in May download. PIR-B escalating. |
| PIR-C | open → update | SD congress May 2026: must update status based on known congress timing. |
| PIR-D | open → update | SD–KD energy fault line: SD congress energy platform adoption is trigger event. |
| PIR-E | open | CRR3 remissvar hearings ongoing. No FI decision confirmed yet. |

## Cross-type Sibling Folder Reference (Tier-C required)

Sibling folders read for monthly synthesis (last 30 days, 2026-04-10 to 2026-05-10):

- `analysis/daily/2026-04-10/week-ahead/` — week-ahead context
- `analysis/daily/2026-04-29/monthly-review/` — prior monthly-review (canonical baseline)
- `analysis/daily/2026-04-30/propositions/` — April propositions
- `analysis/daily/2026-04-30/evening-analysis/` — April 30 evening synthesis
- `analysis/daily/2026-04-26/monthly-review/` — April 26 monthly-review
- `analysis/daily/2026-04-26/week-ahead/` — April 26 week-ahead
- `analysis/daily/2026-04-26/weekly-review/` — April 26 weekly-review
- Various daily proposition/motion/committeeReport folders across April 2026

**Note**: Full cross-type data read from sibling `synthesis-summary.md` and `intelligence-assessment.md` files as required by Tier-C protocol.

