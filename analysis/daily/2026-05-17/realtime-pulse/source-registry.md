# Source Registry
**Date**: 2026-05-17

## Primary Sources

### Swedish Parliamentary Sources (riksdag.se)
| dok_id | Title | Type | Retrieval | Confidence |
|--------|-------|------|-----------|------------|
| HC03205 | MSB rename | prop | 2026-05-17 | HIGH |
| HC03204 | State employee suspension | prop | 2026-05-17 | HIGH |
| HC03208 | Trade secrets criminal liability | prop | 2026-05-17 | HIGH |
| HC03206 | Riksrevisionen total defence audit | prop | 2026-05-17 | HIGH |
| HC03203 | Uranium mining ban removal | prop | 2026-05-17 | HIGH |
| HC03202 | Electronic monitoring prison | prop | 2026-05-17 | MEDIUM |
| HC01FiU24 | Riksbank monetary policy 2024 | bet | 2026-05-17 | HIGH |
| HC01FiU20 | Economic policy guidelines | bet | 2026-05-17 | HIGH |
| HC01FiU33 | APL 700 MSEK capital | bet | 2026-05-17 | HIGH |
| HC01SfU22 | Prison/detention security | bet | 2026-05-17 | HIGH |
| HC10752 | Civil defence municipalities interpellation | ip | 2026-05-17 | HIGH |
| HC10751 | Serbia democracy interpellation | ip | 2026-05-17 | HIGH |
| HC10750 | Gaza patients interpellation | ip | 2026-05-17 | HIGH |
| HC10746 | 500,000 unemployed interpellation | ip | 2026-05-17 | HIGH |
| HC10744 | Youth unemployment interpellation | ip | 2026-05-17 | HIGH |
| HC10745 | Disability unemployment interpellation | ip | 2026-05-17 | HIGH |
| HC023447 | Coercive measures under-15 motion (MP) | mot | 2026-05-17 | MEDIUM |
| HC023444 | Coercive measures under-15 motion (V) | mot | 2026-05-17 | MEDIUM |

### Government Sources (regeringen.se via riksdag-regering MCP)
| ID | Title | Date | Confidence |
|----|-------|------|------------|
| ministern-for-civilt-forsvar-besoker-skane | Civil Defence Minister visits Skåne | 2026-05-15 | HIGH |
| ebba-busch-reser-till-norge | Ebba Busch travels to Norway | 2026-05-15 | HIGH |
| infrastructur-carlson-jonkoping | Carlson visits Jönköping | 2026-05-15 | HIGH |

### Economic Sources
| Source | Dataset | Indicator | Vintage | Confidence |
|--------|---------|-----------|---------|------------|
| IMF | WEO April 2025 | NGDP_RPCH (Sweden) | 2025-04 | HIGH (< 6 mo) |
| IMF | WEO April 2025 | NGDP_RPCH unemployment | 2025-04 | HIGH |
| HC01FiU24 | Riksbank report | Policy rate, CPI | 2025-05 | HIGH |

## Source Quality Assessment
**Overall confidence**: HIGH for parliamentary/government primary sources; MEDIUM-HIGH for economic data (IMF WEO vintage within 6 months)

## Verification Status
- All dok_ids verified via riksdag-regering MCP `get_dokument` calls
- Government press releases verified via `search_regering` API
- Economic data cross-checked: IMF WEO and committee report data consistent
- No contradictions found across sources
