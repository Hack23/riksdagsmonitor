# Data download manifest — scaffold

**Workflow**: News Evening Analysis
**Run**: 26246287958 attempt 1
**Started (UTC)**: 2026-05-21T18:52:29Z
**Requested date**: 2026-05-21
**Subfolder**: evening-analysis
**Improvement mode**: false
**Status**: scaffold — populated as the pipeline progresses.

> This file is written before any MCP call so even a fully-failed run
> produces a non-empty diff and a partial PR rather than a silent no-op.

## MCP attempts
_(populated by 02-mcp-access.md §Three-attempt connect protocol)_

## Per-document table
_(populated by the download step)_

## Status update — Pass 2 complete

**MCP status**: live (confirmed 2026-05-21T18:53:04Z)
**Pass 1 snapshot**: analysis/daily/2026-05-21/evening-analysis/pass1/ (23 files)
**Pass 2 completed**: 2026-05-21T~19:10Z
**23 artifacts produced**: ✅ All Family A/B/C/D artifacts present
**Per-document (Family E)**: HD01JuU28, HD01FiU39, HD11822 document analyses in documents/
**Tier-C synthesis**: All 4 sibling folders cited (propositions, motions, committee-reports, interpellations)

## Documents retrieved

| dok_id | Type | Title | Coverage | Full text |
|--------|------|-------|---------|-----------|
| HD01JuU28 | bet/JuU | AI facial recognition | full_text | ✅ 102KB |
| HD01FiU39 | bet/FiU | Kontanternas funktionssätt | full_text | ✅ 102KB |
| HD01FiU40 | bet/FiU | Fondmarknad | full_text | ✅ 81KB |
| HD01CU36 | bet/CU | Områdessamverkan | full_text | ✅ 83KB |
| HD01CU41 | bet/CU | Hydropower/Habitats | full_text | ✅ 102KB |
| HD024187 | mot | V: Skatteverket | full_text | ✅ 32KB |
| HD024188 | mot | V: Säkerhetshot | full_text | ✅ 34KB |
| HD024189 | mot | EU-Uzbekistan | full_text | ✅ 34KB |
| HD024190 | mot | EU-Kyrgyzstan | full_text | ✅ 29KB |
| HD10499 | ip | Vattenbrist södra Sverige | metadata_only | — |
| HD10500 | ip | Köpings sjukhus | metadata_only | — |
| HD10501 | ip | Grundlagen | metadata_only | — |
| HD11821–11827 | fr | Various | metadata_only | HD11822 ✅ 5KB |

**AI FIRST**: Pass 2 read-back + improvement executed in full (see methodology-reflection.md)
