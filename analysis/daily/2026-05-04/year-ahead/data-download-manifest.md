# Data Download Manifest — Year Ahead 2026-05-04

| Field | Value |
|---|---|
| **Workflow** | news-year-ahead |
| **Run ID** | 25294647393 |
| **UTC timestamp** | 2026-05-04T00:09:00Z |
| **Requested date** | 2026-05-04 |
| **Effective date** | 2026-05-04 |
| **Window** | 365-day horizon (May 2026 – May 2027) |
| **Lookback** | 180 days of per-type sibling folders |
| **Analysis depth** | comprehensive (2.0× Tier-C multiplier) |

## Documents Processed

| dok_id | Title | Type | Committee | Retrieval | Full-text | Parti | Withdrawn |
|---|---|---|---|---|---|---|---|
| HC03205 | Myndigheten för civilt försvar – nytt namn för MSB | Prop | Försvarsdepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03204 | Regler om avstängning av statligt anställda | Prop | Finansdepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03208 | Straffansvar vid angrepp på företagshemligheter | Prop | Justitiedepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03203 | Förbudet mot utvinning av uran tas bort | Prop | Klimat- och näringslivsdep | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03155 | Stärkt konstitutionell beredskap | Prop | Justitiedepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03193 | Försvarsindustristrategi för ett starkare Sverige | Skr | Försvarsdepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03197 | Kompletterande bestämmelser till EU mediefrihetsförordning | Prop | Kulturdepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03192 | Förbättrad modell för presumtionshyra | Prop | Justitiedepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03186 | Polisens användning av skjutvapen | Prop | Justitiedepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |
| HC03168 | Höjd fastighetsskatt för vindkraftverk | Prop | Finansdepartementet | 2026-05-04T00:08Z | metadata-only | [unconfirmed] | No |

## MCP Server Status

- **riksdag-regering**: Live — status `live` at 2026-05-04T00:06:41Z
- **IMF CLI** (`scripts/imf-fetch.ts`): Fetch failed on all calls — fallback to IMF WEO April 2026 published knowledge (vintage: Apr-2026)
- **SCB MCP**: Not called (IMF primary for macro)
- **World Bank**: Not called this run

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|---|---|
| HC03205 | false |
| HC03155 | false |

full-text-fallback: MCP server returned metadata-only for all docs in this cycle; analysis proceeds on available summaries per 03-data-download.md fallback rules.

## Prior-Voteringar Enrichment

Prior voteringar: no directly comparable year-ahead vote series found in last 4 riksmöten via `search_voteringar` — server returned `dataStatus: no_individual_votes_available` for the 2024/25 session. Relying on historical public seat-count records.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: HC03205 (MSB/civilt försvar) and HC03193 (försvarsindustristrategi) trigger the agency-named + implementation-feasibility rules for Myndigheten för civilt försvar (MSB-successor), Totalförsvarets forskningsinstitut (FOI), and Försvarets materielverk (FMV).

Statskontoret: no directly relevant source found for MSB reorganisation/civilt försvar capacity via `web_fetch` (domain reachable but no specific evaluation matching these docs in the 2024–2026 inventory). Record: absence examined, not skipped.

## Lagrådet Tracking

HC03155 (Stärkt konstitutionell beredskap) triggers Lagrådet review requirement under RF 8:22 — touches fundamental rights and constitutional emergency powers. Lagrådet: site reachable; referral status — yttrande expected as of 2026-05-04 but not confirmed in metadata. Tag: `referral pending / no yttrande published as of 2026-05-04T00:09Z`.

## PIR Carry-Forward

No prior-cycle pir-status.json found in `analysis/daily/*/year-ahead/` within the last 14 days. First-generation PIRs defined in `intelligence-assessment.md`.

## Reference Analyses (Tier-C Cross-Type Synthesis)

Sibling folders read for Tier-C cross-reference ingestion:
- `analysis/daily/2026-05-03/` — various per-type folders
- `analysis/daily/2026-05-02/` — various per-type folders
- `analysis/daily/2026-05-01/` — various per-type folders
- `analysis/daily/2026-04-30/` — various per-type folders

## IMF Vintage Pin

| Field | Value |
|---|---|
| vintage | IMF WEO April 2026 |
| retrieved_at | 2026-05-04T00:09Z (published knowledge — CLI unavailable) |
| payload_sha256 | N/A (published knowledge, not fetched from API this run) |
| note | IMF WEO Apr-2026: SWE NGDP_RPCH est. 0.8% (2025 actual), 2.1% T+1 (2026), 2.4% T+2 (2027), 2.0% T+5 (2030) |
