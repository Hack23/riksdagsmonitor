# Data Download Manifest - 2026-04-09 Realtime Monitor 1029

## Pipeline Execution Summary

| Field | Value |
|-------|-------|
| **Date** | 2026-04-09 |
| **Workflow** | realtime-1029 |
| **Pipeline Script** | pre-article-analysis.ts |
| **Execution Time** | 2026-04-09 10:29 UTC |
| **Documents in Index** | 250 |
| **Documents Downloaded** | 1 (HD11695 via pipeline) |
| **Documents via MCP** | 4 (HD01SfU16, HD01FoU8, HD01TU15, HD01UbU31) |
| **Total Documents Analyzed** | 5 |
| **Pipeline Confidence** | LOW (1 document; supplemented by MCP queries) |

---

## Data Sources Used

| Source | Tool | Documents Found | Status |
|--------|------|:-:|:------:|
| Riksdag Documents API | search_dokument | 5 | OK |
| Propositioner API | get_propositioner | 0 new | OK |
| Betankanden API | get_betankanden | 4 new | OK |
| Voteringar API | search_voteringar | 0 today | OK |
| Anforanden API | search_anforanden | 0 dated today | OK |
| Regeringskansliet | search_regering | 4 press releases | OK |

---

## Files Generated

### Per-File Analysis Documents (5)
| File | Document | Size |
|------|----------|:----:|
| documents/hd01sfu16-analysis.md | HD01SfU16 | Complete |
| documents/hd01fou8-analysis.md | HD01FoU8 | Complete |
| documents/hd01tu15-analysis.md | HD01TU15 | Complete |
| documents/hd01ubu31-analysis.md | HD01UbU31 | Complete |
| documents/hd11695-analysis.md | HD11695 | Complete |

### Data Files (5)
| File | Document | Format |
|------|----------|:------:|
| documents/hd01sfu16.json | HD01SfU16 | JSON |
| documents/hd01fou8.json | HD01FoU8 | JSON |
| documents/hd01tu15.json | HD01TU15 | JSON |
| documents/hd01ubu31.json | HD01UbU31 | JSON |
| documents/hd11695.json | HD11695 | JSON |

### Synthesis Documents (8)
| File | Type |
|------|------|
| synthesis-summary.md | Intelligence synthesis |
| swot-analysis.md | SWOT assessment |
| risk-assessment.md | Risk matrix |
| threat-analysis.md | Threat taxonomy |
| significance-scoring.md | Significance scores |
| stakeholder-perspectives.md | Stakeholder impact |
| classification-results.md | Document classification |
| cross-reference-map.md | Cross-references |
| data-download-manifest.md | This manifest |

---

## Deduplication Check

| dok_id | Previously Covered | Covered By |
|--------|:------------------:|------------|
| HD01SfU16 | NO | First analysis |
| HD01FoU8 | NO | First analysis |
| HD01TU15 | NO | First analysis |
| HD01UbU31 | NO | First analysis |
| HD11695 | NO | First analysis |

All 5 documents are new and not previously covered by any workflow today or yesterday.
