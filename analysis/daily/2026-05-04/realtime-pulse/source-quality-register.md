# Source Quality Register — Realtime Pulse 2026-05-04

**Pass**: 2 (improved)

---

## MCP Source Health

| Source | Status | Reliability | Last Check |
|--------|--------|-------------|------------|
| riksdag-regering MCP | LIVE | HIGH | 2026-05-04T10:25:31Z |
| Riksdag open data API | LIVE (partial) | MEDIUM-HIGH | 2026-05-04T10:27:00Z |
| IMF WEO Apr-2026 | Cached | HIGH | Vintage April 2026 |
| SCB (via MCP) | Not queried today | N/A | — |
| World Bank | Not queried today | N/A | — |

## Document Quality Assessment

| dok_id | Source | Full Text | Quality | Notes |
|--------|--------|-----------|---------|-------|
| HD10463 | Riksdag Frips system | ✅ Full HTML | HIGH | Clean XML, complete interpellation text |
| HD10462 | Riksdag | Partial summary | MEDIUM | Only summary in search results; full text not retrieved |
| HD01KU39 | Riksdag Brus | Metadata only | LOW | "Dokument ej publicerat" — registered but not yet published |
| HD01FiU49 | Riksdag Brus | Metadata only | LOW | "Dokument ej publicerat" — registered but not yet published |
| HD01NU19 | Riksdag | Full HTML | HIGH | Large document (>100KB); key content extracted from summary |
| HD01FöU13 | Riksdag | Full HTML | HIGH | 66KB; key content extracted |
| HD01JuU9 | Riksdag | Summary | MEDIUM | Committee summary available; full text not retrieved |
| HD01CU37 | Riksdag | Summary | MEDIUM | Committee summary available |
| HD01NU22 | Riksdag | Summary | MEDIUM | Committee summary available |
| HD01SoU33 | Riksdag | Summary | MEDIUM | Committee summary available |

## Reliability Caveats

1. **HD01KU39 and HD01FiU49** are registered but not yet published — intelligence based on title, organ, and committee schedule only. Content inferred from related documents (especially HD03258 for KU39).
2. **Anföranden** retrieved do not contain speech text (known Riksdag API limitation — API returns empty text fields). Speech topics are identified from debate names only.
3. **Voteringar** most recent available: AU10 from 2026-03-04 — no same-day voting data for 2026-05-04.
4. **PIR-RT-003 (polling)**: No third-party polling data (Demoskop, Novus) retrieved. Polling assessment based on prior analysis and year-ahead sibling.
5. **Lagrådet**: No yttrande documents retrieved for HD03262/HD03265 — absence is meaningful (PIR-RT-001 open).

## Confidence Levels by Analysis Area

| Area | Confidence | Basis |
|------|-----------|-------|
| Legislative programme status | HIGH | 8 committee reports with summaries/full text |
| Interpellation politics | HIGH | Full text of HD10463; summaries of others |
| Coalition dynamics | HIGH | Cross-document pattern recognition |
| Electoral scenarios | MEDIUM | Based on public data; no private polling |
| IMF economic context | HIGH | WEO April 2026 vintage; no update needed |
| Nuclear energy implementation | MEDIUM | Law pathway clear; industry response uncertain |
| L polling threshold | LOW | No fresh polling data today |
