# Data Download Manifest — 2026-05-14

**Generated**: 2026-05-14 07:31 UTC
**Data Sources**: get_interpellationer, get_dokument, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 1
**Produced By**: download-parliamentary-data script + AI agent enrichment

## Document Counts by Type

- **interpellations**: 20 documents (1 dated 2026-05-14, 19 within broader window)

## Selected Documents for Analysis

| dok_id | Titel | Datum | Parti | Avsändare | Mottagare | Status | Full Text |
|--------|-------|-------|-------|-----------|-----------|--------|-----------|
| HD10492 | Konsekvenserna för barn när biståndet minskar | 2026-05-14 | V | Lotta Johnsson Fornarve | Bistånds- och utrikeshandelsminister Benjamin Dousa (M) | Skickad | true |

**Source URL**: https://data.riksdagen.se/dokument/HD10492.html

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD10492 | true |

## Document Summary: HD10492

**Title**: Interpellation 2025/26:492 — Konsekvenserna för barn när biståndet minskar
**Author**: Lotta Johnsson Fornarve (V)
**Recipient**: Bistånds- och utrikeshandelsminister Benjamin Dousa (M)
**Date submitted**: 2026-05-13 (published 2026-05-14)
**Status**: Skickad / Anmäld planerat 2026-05-18 / Sista svarsdatum 2026-05-29

**Three Questions posed**:
1. Har det gjorts någon konsekvensanalys av hur nedskärningarna av svenskt bistånd och indragna landstrategier drabbar barn och unga? Om inte, avser ministern att verka för att en sådan görs?
2. Har ministern för avsikt att verka för att ett barnrättsperspektiv ska ligga till grund för de styrande policydokumenten i utvecklingspolitiken?
3. Har ministern för avsikt att verka för ett stärkt barnrättsperspektiv inom det humanitära biståndet i Sverige, EU och FN?

## Prior-Voteringar Enrichment

Search performed: `search_voteringar` with avser="bistånd", rm=2025/26.
Result: No direct votes on bistånd/barnrättsperspektiv found in 2025/26 yet. AU10 vote (2026-03-04) was on arbetsmarknadskommittén (unrelated). 

Extended search for last 4 riksmöten on bistånd policy: Prior voteringar: no directly comparable vote found in last 4 riksmöten specifically on "barnrättsperspektiv i bistånd" framing. Relevant context from 2023/24 UD-kommittén deliberations on bistånd exist.

## Statskontoret Cross-Source Enrichment

Statskontoret pre-warm evaluation: **No trigger matched directly** — this interpellation targets foreign aid policy (biståndsministeriet), not domestic agency governance. No named Swedish authority with domestic administrative capacity impact. Statskontoret source: `Statskontoret pre-warm: no trigger matched (no domestic agency named with administrative capacity dimension — aid policy is UD/Sida domain)`.

## Data Quality Notes

- Full text successfully retrieved for HD10492 via fullContent field [B2]
- Context of broader interpellation series from search_dokument (HD10483–HD10492) cross-references HD10489 (Al-Nakba/Palestinian rights, same day) and HD10490 (Cuba human rights) — related UD thematic cluster
- IMF WEO fetch attempted; degraded (imf-context.json status: ok, but weo CLI fetch failed) — using cached context for Swedish GDP/ODA indicators; see implementation-feasibility.md
- All interpellations sourced from official riksdag-regering-mcp API [A1]
