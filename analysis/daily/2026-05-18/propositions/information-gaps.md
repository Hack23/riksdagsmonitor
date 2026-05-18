# Information Gaps

**Article date**: 2026-05-18 | **Subfolder**: propositions | **Admiralty**: A1

## Known Unknowns

| Gap | Impact | Addressable by |
|-----|--------|---------------|
| G1: Full text not available for HD03262, HD03264, HD03265, HD03258, HD03254 | MEDIUM — cannot cite specific articles or proposed legislative text | Future full-text fetch from data.riksdagen.se |
| G2: Voteringar (voting records) — MCP returned empty results for JuU/SfU 2023/24-2024/25 | MEDIUM — cannot cite specific vote percentages or individual MP records | Alternative query parameters; direct database access |
| G3: Current polling data not available (no live polling tool) | HIGH — electoral probability estimates are structural, not current-poll-based | External polling source integration |
| G4: Lagrådet status on HD03262 | HIGH — critical constitutional check; opinion status unknown | riksdagen.se document status monitor |
| G5: Individual MP positions (L members on HD03265) | MEDIUM | Anföranden search for party speeches in committee |
| G6: EU Commission CEAS implementation timeline confirmation | MEDIUM | EU Eur-Lex CEAS package status |
| G7: SÄPO classified threat context for HD03267 | HIGH — proposition may respond to specific intelligence | Not addressable by open sources |
| G8: Nordic peer GDP comparison (IMF returned null) | LOW — context only | IMF Datamapper retry |

## Assumptions Made Under Uncertainty

| Assumption | Confidence | Basis |
|-----------|-----------|-------|
| Election date 2026-09-13 | HIGH | Swedish Constitution: second Sunday of September in election year |
| L will support migration cluster with amendments | MEDIUM | Historical Tidöavtal pattern; Liberalerna public statements 2022-2025 |
| S will formally oppose HD03262 | HIGH | Consistent S position since 2016; ideological commitment |
| e-ID proposal has cross-party support | HIGH | Longstanding political consensus; no party has publicly opposed concept |
| Sweden's GDP growth ~2.1% 2026 | HIGH | IMF WEO-2026-04 (pre-warmed, status ok) |
| HD03254 reflects NATO SC/FI integration requirements | MEDIUM | Pattern from Norway/Finland post-accession |

## Intelligence Requirements for Next Collection
- IRN-1: Retrieve full text of HD03262 and HD03264 for legal article-level analysis
- IRN-2: Search anföranden for party migration speeches since January 2026
- IRN-3: Check Lagrådet website for HD03262 referral status
- IRN-4: Query SfU calendar for upcoming hearings (HD03262 priority)
- IRN-5: Nordic peer economic comparison via SCB for Swedish-specific labour market impacts

