# Data Download Manifest — Propositions 2026-04-21

**Generated**: 2026-04-21 20:10 UTC  
**Produced By**: news-propositions workflow  
**MCP Source**: riksdag-regering-ai.onrender.com  
**Riksmöte**: 2025/26  
**Analysis Type**: propositions

## Documents Fetched

| Dok ID | Prop. No. | Title (EN) | Date | Minister | Committee |
|--------|-----------|------------|------|---------|-----------|
| HD03246 | 2025/26:246 | Stricter rules for young offenders | 2026-04-16 | Gunnar Strömmer (JuD) | JuU |
| HD03244 | 2025/26:244 | Interoperability requirements for public admin | 2026-04-16 | Erik Slottner (FiD) | TU |
| HD03242 | 2025/26:242 | Clear regulatory framework for active forestry | 2026-04-16 | Peter Kullgren (L&ID) | MJU |
| HD03232 | 2025/26:232 | Ukraine International Compensation Commission | 2026-04-16 | Maria Malmer Stenergard (UD) | UU |
| HD03231 | 2025/26:231 | Special Tribunal for Crime of Aggression vs Ukraine | 2026-04-16 | Maria Malmer Stenergard (UD) | UU |
| HD03243 | 2025/26:243 | Improved Swedish tonnage taxation rules | 2026-04-14 | Elisabeth Svantesson (FiD) | SkU |
| HD03218 | 2025/26:218 | Double sentences for organized crime networks | 2026-04-09 | Gunnar Strömmer (JuD) | JuU |
| HD03217 | 2025/26:217 | Extended criminal liability for civil servants | 2026-04-09 | Gunnar Strömmer (JuD) | JuU |

## Previously Covered (Last Run 2026-04-20 — Skip)

| Dok ID | Covered In |
|--------|-----------|
| HD03100 | 2026-04-20-government-propositions |
| HD0399 | 2026-04-20-government-propositions |
| HD03236 | 2026-04-20-government-propositions |
| HD03239 | 2026-04-20-government-propositions |
| HD03240 | 2026-04-20-government-propositions |
| HD03237 | 2026-04-20-government-propositions |
| HD03238 | 2026-04-20-government-propositions |
| HD03233 | 2026-04-20-government-propositions |
| HD03220 | 2026-04-20-government-propositions |

## Economic Data Fetched

- Sweden GDP Growth (10-year): 2024: +0.82%, 2023: -0.20%, 2022: +1.26%
- Sweden Unemployment (2025): 8.69%, (2024): 8.40%
- Sweden Inflation (2024): 2.84%, (2023): 8.55%
- Nordic GDP Growth 2024: DK +3.48%, NO +2.10%, SE +0.82%, FI +0.42%

## MCP Tools Used

- `get_sync_status` — MCP health verification
- `get_propositioner(rm="2025/26", limit=25)` — Propositions listing
- `get_dokument_innehall(dok_id="HD03246", include_full_text=true)` — Full text HD03246
- `get_dokument_innehall(dok_id="HD03242", include_full_text=true)` — Full text HD03242
- `world-bank.get-economic-data(countryCode="SE", indicator="GDP_GROWTH", years=10)`
- `world-bank.get-economic-data(countryCode="SE", indicator="UNEMPLOYMENT", years=10)`
- `world-bank.get-economic-data(countryCode="SE", indicator="INFLATION", years=10)`
- `world-bank.get-economic-data(countryCode="DK/NO/FI", indicator="GDP_GROWTH", years=5)` — Nordic comparison
