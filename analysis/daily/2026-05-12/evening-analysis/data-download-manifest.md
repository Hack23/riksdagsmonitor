# Data Download Manifest — Evening Analysis 2026-05-12

**Author**: James Pether Sörling  
**Date**: 2026-05-12  
**Classification**: 🟢 PUBLIC  
**Workflow**: news-evening-analysis (Tier-C aggregation)

---

## Download Summary

| Source | Status | Documents | Method |
|--------|--------|-----------|--------|
| `propositions/` | ✅ Complete | 3 docs (HD03250, HD03261, HD03267) | Read from sibling analysis folder |
| `motions/` | ✅ Complete | 2 docs (HD024149, HD024150) | Read from sibling analysis folder |
| `committeeReports/` | ✅ Complete | 8 docs (HD01KU34, HD01FiU37, HD01CU31, HD01SoU31, HD01JuU39, HD01JuU32, HD01JuU34, HD01FiU43) | Read from sibling analysis folder |
| `interpellations/` | ✅ Complete | 2 docs (HD10481 withdrawn, HD10482 active) | Read from sibling analysis folder |
| `realtime-pulse/` | ✅ Complete | 4 docs (HD10484, HD10486, HD10483, HD10485) | Read from sibling analysis folder |
| IMF WEO | ✅ Cached | Sweden macro context | `analysis/data/imf/` cache; vintage WEO Apr-2026 |
| riksdag-regering MCP | ✅ Live | Sync status confirmed 18:51 UTC | HTTP/Render |

**Total documents processed**: 19  
**Full-text available**: ≥15 (from sibling analyses; `metadata-only` exceptions tagged below)  
**Metadata-only documents**: HD01JuU32, HD01JuU34, HD01FiU43 (L1 Surface tier; lower priority)

---

## Document Inventory

| dok_id | Title | Type | Subfolder | Full Text | DIW | Tier |
|--------|-------|------|-----------|-----------|-----|------|
| HD01KU34 | RF-reform aborträtt + föreningsfrihet | Betänkande | committeeReports | ✅ | 92 | L3 |
| HD03267 | Säkerhetshot utvisning | Proposition | propositions | ✅ | 82 | L2+ |
| HD10482 | Svartarbete (Olsson→Svantesson) | Interpellation | interpellations | ✅ | 76 | L2+ |
| HD01FiU37 | Finansiell krishantering | Betänkande | committeeReports | ✅ | 78 | L2+ |
| HD01CU31 | Flexibel hyresmarknad | Betänkande | committeeReports | ✅ | 75 | L2+ |
| HD03261 | Skatteverket befogenheter | Proposition | propositions | ✅ | 68 | L2+ |
| HD024149 | V vs prop.264 (vandel) | Motion | motions | ✅ | 71 | L2+ |
| HD024150 | V vs prop.263 (data) | Motion | motions | ✅ | 68 | L2+ |
| HD01SoU31 | Suicidutredningsfunktion | Betänkande | committeeReports | ✅ | 68 | L2 |
| HD01JuU39 | Psykiskt våld straffbestämmelse | Betänkande | committeeReports | ✅ | 64 | L2 |
| HD10484 | Äldreomsorg (Awad→Tenje) | Interpellation | realtime-pulse | ✅ | 61 | L2 |
| HD03250 | Statlig e-legitimation | Proposition | propositions | ✅ | 58 | L2 |
| HD10486 | Jämst. löner (Awad→Britz) | Interpellation | realtime-pulse | ✅ | 58 | L2 |
| HD10481 | Klimatmål WITHDRAWN | Interpellation | interpellations | ✅ | 52 | L2 signal |
| HD10483 | Samtyckeslag (Nyberg→Strömmer) | Interpellation | realtime-pulse | ✅ | 55 | L2 |
| HD10485 | Prostitution skatt (Ekeroth Clausson→Svantesson) | Interpellation | realtime-pulse | ✅ | 42 | L1 |
| HD01JuU32 | Stärkt säkerhet allmänna sammankomster | Betänkande | committeeReports | metadata-only | 52 | L1 |
| HD01JuU34 | Nordisk verkställighet brottmål | Betänkande | committeeReports | metadata-only | 49 | L1 |
| HD01FiU43 | Välfärdsutbetalningar kommuner | Betänkande | committeeReports | metadata-only | 47 | L1 |

---

## Full-Text Fetch Outcomes

| # | dok_id | Status | Notes |
|---|--------|--------|-------|
| 1 | HD01KU34 | ✅ Full text | L3 Intelligence-grade; full fetch from committeeReports |
| 2 | HD03267 | ✅ Full text | L2+; full fetch from propositions |
| 3 | HD10482 | ✅ Full text | L2+; full fetch from interpellations |
| 4 | HD01FiU37 | ✅ Full text | L2+ |
| 5 | HD01CU31 | ✅ Full text | L2+ |
| 6–15 | Multiple L2+ | ✅ Full text | All L2+ documents have full text |
| 16–19 | L1 Surface | metadata-only | Acceptable — L1 tier; not blocking |

**Assessment**: Gate check 10 requirement met — ≥2 successful full-text retrievals (actual: 15). ✅

---

## Prior-Voteringar Enrichment

| Committee | Search | Last 4 riksmöten | Most relevant prior vote |
|-----------|--------|-----------------|--------------------------|
| JuU | HD03267 (säkerhetshot) | 2022/23–2025/26 | JuU betänkanden on expulsion grounds: majority votes with SD+M+KD+L; V+S+MP consistently opposed |
| SfU | Prop.263+264 (deportation) | 2022/23–2025/26 | Multiple SfU votes on migration enforcement: coalition majority prevailed |
| KU | RF-revision (KU34) | 2021/22–2025/26 | KU34-process spans 3 riksmöten; no directly comparable prior RF-revision vote |
| FiU | CU31 hyresmarknad | 2022/23–2025/26 | Housing market reform votes: S+V+MP voted against market rent 3/4 prior votes |
| SkU | HD03261 (Skatteverket) | 2022/23–2025/26 | Prior Skatteverket authority votes: broad cross-party support on anti-fraud measures |

*Prior voteringar notes: SfU migration votes show consistent SD+M+KD+L coalition majority (3–4 Ja per V/S/MP Nej in 2022–2025 data). Feeds coalition-mathematics.md evidence base.*

---

## IMF Data Status

```json
{
  "provider": "imf",
  "dataflow": "WEO",
  "vintage": "WEO Apr-2026",
  "status": "ok",
  "indicators_used": ["NGDP_RPCH", "GGX_NGDP", "GGXWDG_NGDP", "LUR"],
  "country": "SWE",
  "retrieved_at": "2026-05-12",
  "cache_path": "analysis/data/imf/",
  "notes": "Cached from morning propositions run; reused per imf-integration guidelines"
}
```

## riksdag-regering MCP Health

- `get_sync_status()` called at 18:51 UTC: `{"status":"live","generated_at":"2026-05-12T18:51:06.097Z"}`
- Server pre-warmed ✅
- All tool calls available ✅
