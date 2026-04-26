# Data Download Manifest — Monthly Review 2026-04-26

**Workflow**: news-monthly-review
**Run ID**: 24954190812
**UTC Timestamp**: 2026-04-26T10:19:00Z
**Requested date**: 2026-04-26
**Effective date**: 2026-04-24 (1-day lookback — no new documents on 2026-04-26)
**Riksmöte**: 2025/26
**Analysis window**: 2026-03-27 → 2026-04-26 (30 days)

## MCP Server Availability

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ live | get_sync_status OK, session healthy |
| scb | ✅ available | Not queried this run |
| world-bank | ✅ available | Not queried this run (economic → IMF-first) |

## Documents Selected (primary batch, 2026-04-24 via lookback)

| dok_id | Title | Type | Committee | Retrieved | Full-text |
|--------|-------|------|-----------|-----------|-----------|
| HD01JuU10 | Ny vapenlag | Betänkande | JuU | 2026-04-26T10:19Z | ✅ full |
| HD01JuU31 | Polisreformen 2015 — RiR 2026:6 uppföljning | Betänkande | JuU | 2026-04-26T10:19Z | ✅ full |
| HD01SoU25 | Äldreomsorg och stöd till anhöriga | Betänkande | SoU | 2026-04-26T10:19Z | ✅ full |
| HD01CU24 | Effektiv och säker byggprocess | Betänkande | CU | 2026-04-26T10:19Z | ✅ full |
| HD10448 | Desinformation om vindkraft (interpellation) | Interpellation | — | 2026-04-26T10:19Z | ✅ full |
| HD11747 | Lönestöd och farlig arbetsmiljö (interpellation) | Interpellation | — | 2026-04-26T10:19Z | ✅ full |
| HD11748 | Sahabo/Burundi-konsulärt ärende (interpellation) | Interpellation | — | 2026-04-26T10:19Z | ✅ full |
| HD11749 | Barns rätt till skolgång i anstalt (interpellation) | Interpellation | — | 2026-04-26T10:19Z | ✅ full |

## Additional propositions (2026-04-23, from riksdag-regering API)

| dok_id | Title | Type | Department | Date |
|--------|-------|------|-----------|------|
| HD03256 | Kraftfullare åtgärder mot manipulation av färdskrivare | Proposition | Landsbygd/Infrastruktur | 2026-04-23 |
| HD03252 | Begränsning av socialförsäkringsförmåner för fängelsedömda | Proposition | Justitie | 2026-04-23 |
| HD03253 | EU:s bankpaket | Proposition | Finans | 2026-04-23 |
| HD03104 | Utvärdering av statens upplåning och skuldförvaltning 2021–2025 | Skrivelse | Finans | 2026-04-23 |

## Cross-Source Enrichment (Statskontoret)

| Source | Relevance |
|--------|-----------|
| Statskontoret: no directly relevant source found for 2026-04-26 window | — |

## Sibling analyses (30-day window, for cross-reference)

- analysis/daily/2026-04-25/monthly-review/ (prior-day reference)
- analysis/daily/2026-04-24/committeeReports/
- analysis/daily/2026-04-23/propositions/ (if present)
- analysis/daily/2026-04-22/ (HD01FiU48 supermajoritet)
- analysis/daily/2026-04-13/ (HD03100 vårproposition + HD03240 elmarknadsreform)

## Reference Analyses (Tier-C ingestion)

| Date | Subfolder | synthesis-summary.md | intelligence-assessment.md |
|------|-----------|----------------------|---------------------------|
| 2026-04-25 | monthly-review | ✅ read | ✅ read |
| 2026-04-22 | committeeReports | ✅ referenced (HD01FiU48) | — |
| 2026-04-13 | propositions | ✅ referenced (HD03100, HD03240) | — |

