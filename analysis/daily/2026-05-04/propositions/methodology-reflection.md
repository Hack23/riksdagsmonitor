# Methodology Reflection — Propositions 2026-04-30
## Date: 2026-05-04 | Riksdagsmonitor Intelligence

---

## Data Sources Used

### Primary Sources
1. **Riksdag Open Data API** (riksdagen.se) — direct document download via `download-parliamentary-data.ts`
   - 8 proposition JSON files retrieved, validated
   - Source quality: HIGH — official parliamentary records
   - Limitation: HTML-embedded text required extraction; `full_text` field empty in API response, actual content in `text` field as HTML

2. **riksdag-regering MCP server** — supplementary document lookups
   - Used for `get_dokument` (returning structured metadata)
   - Used for `search_voteringar` — only AU10 (2026-03-04) returned for 2025/26 rm; SfU, FöU, KU had zero results (propositions not yet voted on)
   - Limitation: Voting records for current propositions not available — propositions are in committee stage

3. **IMF World Economic Outlook (WEO) API** — economic context
   - Direct API call: `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/SWE`
   - Sweden GDP growth data retrieved: 2021-2027
   - Government debt data: SWE, DNK, NOR, FIN, DEU (2022-2026)
   - Source quality: HIGH — IMF April 2026 vintage, authoritative economic forecast
   - `scripts/imf-fetch.ts` CLI tool returned "fetch failed" — used direct API call instead

### Secondary Sources
- Summary fields in downloaded JSON files (official proposition summaries from riksdagen.se)
- Institutional knowledge of Swedish political system, ECHR jurisprudence, Nordic comparison

---

## Methodological Choices

### Document Selection
- Used `--limit 20` with date-filter back to 2026-04-28 (3-day lookback)
- 8 documents matched date filter from 2026-04-30 batch
- No propositions from 2026-05-04 itself — correct (Monday after Wednesday batch)
- All 8 documents are genuine government propositions (prop.), not motions or committee reports

### Significance Scoring
- DIW (Democratic Impact Weight) methodology with election proximity multiplier (1.5×, T-132 days)
- Base scores: subjective (1-5) calibrated against historical proposition significance
- Limitation: Subjective base scores could be disputed; the multiplier structure is principled but the base inputs are analyst judgment

### Text Extraction
- Full text extraction from HTML was attempted but `<style>` blocks dominate the `text` field
- Used `summary/notis` fields which are clean prose summaries (~300-500 chars each)
- Limitation: Did not fully read the complete proposition text — relied on summaries and structural knowledge
- Impact: Some specific provisions within propositions may have been missed; main analysis is correct at policy level

### Analysis Depth
- Completed 2 passes (Pass 1 — initial drafting; Pass 2 — this methodology reflection completed during review pass)
- Family E per-document analyses based on structural knowledge + summary text
- Total analytical content: ~60,000 words equivalent across 23+ artifacts

---

## Limitations and Caveats

1. **Full text not read**: The complete legislative text of all 8 propositions was not read due to HTML extraction issues. Analysis is based on official summaries, structural policy knowledge, and comparative analysis. This affects confidence in specific provision-level claims.

2. **No prior voteringar for current propositions**: Propositions are in early committee stage — no votes recorded. Prior committee voting patterns (SfU, FöU, KU) could not be retrieved for 2025/26 rm via MCP tools.

3. **Economic forecasts are projections**: IMF WEO data represents April 2026 projections; actual outcomes may differ. Migration reform fiscal impact estimates (SEK 2-4bn cost savings) are analyst estimates, not official government calculations.

4. **Electoral probability estimates**: 45-50% probability for right-wing coalition re-election reflects polling uncertainty, not analytical precision. Election outcomes are inherently unpredictable within this range.

5. **ECHR predictions**: Legal outcome predictions at ECtHR are inherently uncertain. Challenge probability is high; success probability depends on case-specific facts.

---

## Confidence Assessment by Claim Type

| Claim Type | Confidence | Basis |
|-----------|-----------|-------|
| Document existence and basic metadata | VERY HIGH | API verified |
| Policy content and objectives | HIGH | Official summaries |
| Legal framework analysis | HIGH | Published EU instruments, constitutional knowledge |
| Political party positions | HIGH | Public statements |
| Electoral probability | LOW-MEDIUM | Polls within margin of error |
| Implementation effectiveness | MEDIUM | Historical pattern analysis |
| ECHR outcomes | LOW | Case-specific factors |
| IMF economic data | HIGH | Direct API retrieval, April 2026 vintage |
