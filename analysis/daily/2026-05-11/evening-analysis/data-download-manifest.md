---
artifact: data-download-manifest
date: 2026-05-11
subfolder: evening-analysis
workflow: news-evening-analysis
tier: C
pass: 2
---

# Data Download Manifest — 2026-05-11

## Download summary
- **Total fetched**: 180 documents
- **Date-filtered to 2026-05-11**: 15 documents
- **Types**: bet (4), mot (2), ip (9)
- **Committees**: KU (2), MJU (1), SoU (1), SfU (subject of motions)
- **Download time**: ~2026-05-11T17:15–17:20Z
- **Script**: `scripts/download-parliamentary-data.ts --date 2026-05-11 --limit 30`

## Documents acquired

| dok_id | Type | Title | Fulltext | Quality |
|--------|------|-------|----------|---------|
| HD01KU34 | bet | Grundlagsskyddad aborträtt | ✅ MCP+file | HIGH |
| HD01KU43 | bet | Riksdagens medalj | snippet | MEDIUM |
| HD01MJU23 | bet | Förenklingar i jaktlagstiftningen | snippet | MEDIUM |
| HD01SOU31 | bet | Nationell utredningsfunktion suicid | snippet | MEDIUM |
| HD024149 | mot | Vandel uppehållstillstånd (V) | ✅ MCP | HIGH |
| HD024150 | mot | Återvändande (V) | partial | MEDIUM |
| HD10481 | ip | Klimatmålen | snippet | LOW |
| HD10482 | ip | Svartarbete kontroll | snippet | LOW |
| HD11804 | ip | Skydd kvinnor | snippet | LOW |
| HD11805 | ip | EPG-toppmötet Armenien | snippet | LOW |
| HD11806 | ip | Europeiskt teknologiskt oberoende | snippet | LOW |
| HD11807 | ip | Kvinnojourer Malmö | snippet | LOW |
| HD11808 | ip | Exportindustrin | snippet | LOW |
| HD11809 | ip | Turkiet Hamas | snippet | LOW |
| HD11810 | ip | Livsmedelsproduktion | snippet | LOW |

## Full-text fetch outcomes
- **HD01KU34**: Full betänkande (105KB) — complete HTML text available. Includes majority position, reservations (V ×3, C ×4 points, MP ×2 points), special statements.
- **HD024149**: Full motion text fetched — includes inledning, Lagrådet section, legal arguments, yrkanden. HIGH quality.
- **HD024150**: Partial — motion metadata and intro fetched. Motion mirrors HD024149 structure for prop. 263.
- **Interpellations (9)**: Title and subject only — awaiting ministerial responses (interpellations are questions not yet answered).

## IMF context enrichment
- **Source**: `data/imf-context.json`
- **Status**: ok
- **Vintage**: WEO-2026-04 (1 month old, non-stale)
- **Probes passing**: WEO (datamapper ✅), FM (datamapper ✅), CPI SDMX (✅)
- **Key economic context**: Sweden GDP growth 2.0–2.4% (2026 projection), debt ~31% GDP, fiscal surplus ~0.5% GDP
- **economicProvenance**: `{provider: imf, dataflow: WEO, vintage: WEO-2026-04, retrieved_at: 2026-05-11T17:22Z}`

## Prior-voteringar enrichment
- **KU34 historical vote search**: Returns 2021/22 KU34 (different betänkande) — no direct precedent vote for this constitutional package (it's a 2022/23 → 2025/26 cross-Riksdag adoption).
- **SfU committee**: Motions HD024149/HD024150 filed 2026-05-11 — committee has not yet voted; these are the initial opposition challenge documents.
- **MJU23 historical context**: Jaktlagen revisions have had bipartisan support in 2019/20 and 2022/23; similar simplification packages passed 174+ yes votes.
- **SoU31 historical context**: Suicide prevention motions filed annually since 2018; this betänkande represents first institutional response via investigative function.

## Statskontoret cross-source triggers
- **Migrationsverket** named in HD024149: Statskontoret trigger ACTIVATED — vandel implementation will require Migrationsverket administrative capacity expansion. Statskontoret review of Migrationsverket governance recommended.
- **Polismyndigheten** referenced in HD10482 (undeclared work): Statskontoret trigger ACTIVATED — enforcement capacity cross-check warranted.
- **Socialstyrelsen** implicit in HD01SOU31: Statskontoret monitoring of suicide investigation body setup.

## Lagrådet tracking
- **HD024149 explicitly cites Lagrådet sharp criticism** of prop. 2025/26:264 legislative process — represents the 4th major Lagrådet critique of Tidö government legislative proposals in 2025/26 riksmöte.
- Pattern: Lagrådet critical of: speed of legislation, EU-law compatibility analysis quality, proportionality reasoning.

## PIR carry-forward
- PIR-001: Constitutional reform finalization — **CLOSED** (KU34 addresses this PIR)
- PIR-002: Migration regime tightening — **ONGOING** (props 264, 263 in committee)
- PIR-003: Election positioning of all 8 parties — **ONGOING** (interpellation pattern confirms)
- PIR-004: NATO/defence integration post-accession — **ACTIVE** (HD11805, HD11806, HD11809 contribute)

## Sibling folder cross-reference (Tier-C)
- `analysis/daily/2026-05-11/propositions/`: Relates to props 2025/26:264, 2025/26:263 (if present)
- `analysis/daily/2026-05-11/motions/`: HD024149, HD024150 originate here
- `analysis/daily/2026-05-11/committee-reports/`: HD01KU34, HD01MJU23, HD01SOU31
- `analysis/daily/2026-05-11/interpellations/`: HD10481–HD11810
