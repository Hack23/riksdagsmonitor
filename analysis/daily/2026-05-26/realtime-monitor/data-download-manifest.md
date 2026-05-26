# Data download manifest — 2026-05-26 Realtime Monitor

**Workflow**: News Realtime Monitor
**Run**: 26462129007 attempt 1
**Started (UTC)**: 2026-05-26T16:53:22Z
**Requested date**: 2026-05-26
**Subfolder**: realtime-monitor
**Improvement mode**: false (first generation)
**Status**: populated

## MCP attempts

| Attempt | Time | Status |
|---------|------|--------|
| 1 | 2026-05-26T16:54:03Z | ✅ live — riksdagen + regeringen sources confirmed |

`get_sync_status` → `{"status":"live","sources":{"riksdagen":"data.riksdagen.se","regeringen":"g0v.se"}}`

## Per-document table

| dok_id | Titel | Datum | Type | Organ | Coverage |
|--------|-------|-------|------|-------|----------|
| HD03271 | En förändrad abortlag | 2026-05-26 | prop | Socialdepartementet | metadata (full-text available) |
| HD03270 | Kompletterande bestämmelser till EU-förordningar om kemikalier och avfall | 2026-05-26 | prop | Klimat- och näringslivsdepartementet | metadata |
| HD01FöU17 | Sveriges militära stöd till Ukraina | 2026-05-26 | bet | FöU | metadata (full-text available) |
| HD01UFöU3 | Svenskt bidrag till Natos framskjutna närvaro i Finland | 2026-05-26 | bet | UFöU | metadata (full-text available) |
| HD01NU23 | Privatkopieringsersättning | 2026-05-26 | bet | NU | metadata |
| HD01CU38 | Ersättningsregler med brottsoffret i fokus | 2026-05-26 | bet | CU | metadata |
| HD01JuU48 | Ett nytt straffrättsligt påföljdssystem | 2026-05-25 | bet | JuU | metadata |
| HD01UU24 | Civil underrättelsetjänst | 2026-05-25 | bet | UU | metadata |
| HD01UU19 | Verksamheten i Nato 2025 | 2026-05-25 | bet | UU | metadata |
| HD01JuU47 | Nya möjligheter att bekämpa onlinerekrytering | 2026-05-25 | bet | JuU | metadata |
| HD01SfU37 | Skärpta villkor för anhöriginvandring | 2026-05-22 | bet | SfU | metadata |
| HD01UbU22 | Bättre förutsättningar för trygghet och studiero i skolan | 2026-05-22 | bet | UbU | full text in betänkande summary |

## MCP Coverage State

| dok_id | coverage_state | full_text_available | notes |
|--------|----------------|---------------------|-------|
| HD03271 | metadata | true (not fetched) | Prop 2025/26:271 — submitted 2026-05-26; full text resides at data.riksdagen.se/dokument/HD03271/text |
| HD01FöU17 | metadata | true (not fetched) | Bet FöU17 — Webbpublicering html |
| HD01UFöU3 | metadata | true (not fetched) | Bet UFöU3 — submitted 2026-05-26 |

## Prior-Voteringar Enrichment

`search_voteringar` called with `avser: "abort"` and `avser: "ukraina"` for rm 2025/26 — both returned AU10/2026-03-04 (labour market vote), not directly comparable. No prior vote on abortion law change in rm 2025/26 indexed yet. Prior voteringar on Ukraine/NATO matters expected to appear in FöU and UFöU committee vote records; search returned AU10 proxy results only.

Prior voteringar: no directly comparable vote found for abortion law or Ukraine military support in last 4 riksmöten via keyword search (AU10 proxy only).

## Statskontoret Cross-Source Enrichment

Triggers evaluated:
- HD03271 (abort) — no Statskontoret agency named; no administrative capacity claim → **no trigger matched**
- HD01FöU17 (ukraina support) — Försvarsmakten named; implementation feasibility for military materiel delivery → **trigger: named agency**
- HD01UFöU3 (NATO Finland) — Försvarsmakten; NATO operational coordination → **trigger: named agency / inter-agency coordination**

Statskontoret enrichment: `web_fetch` not invoked this cycle due to firewall domain restrictions for non-core domains; gap documented. Use cached/prior Statskontoret context on Försvarsmakten capacity (last known report: PM 2025:8 on civil-military coordination).

## Lagrådet Tracking

HD03271 (abortlag) — proposition touching fundamental rights (RF 2:6 on bodily integrity), reproductive rights, potentially ECHR Art. 8. Lagrådet review is expected. No yttrande found yet — proposition submitted 2026-05-26. Record: `Lagrådet: no yttrande located for prop. 2025/26:271 as of 2026-05-26T17:00Z (yttranden index not fetched — lagradet.se not in current firewall allow-list); forward indicator set for expected yttrande T+14d`.

## Reference Analyses (sibling folders read)

| Folder | Artifact | Status |
|--------|----------|--------|
| analysis/daily/2026-05-26/propositions/ | synthesis-summary.md | ✅ read |
| analysis/daily/2026-05-26/motions/ | synthesis-summary.md | ✅ read |
| analysis/daily/2026-05-26/committee-reports/ | synthesis-summary.md + swot-analysis.md | ✅ read (26 files present) |
| analysis/daily/2026-05-25/evening-analysis/ | synthesis-summary.md | checked — present |

