# Methodology Reflection — Opposition Motions 2026-05-21

**Classification:** Public | **Analysis date:** 2026-05-21

---

## Analysis Methodology

### Data sources used

| Source | Tool | Data type | Reliability |
|--------|------|-----------|------------|
| Riksdag open API | riksdag-regering MCP | Motion documents, dates, parties, committees | A (completely reliable) |
| IMF WEO-2026-04 | imf-context.json | Sweden macroeconomic context | A, vintage 1 month |
| Prior PIR files | Local analysis files | Prior cycle intelligence | B (usually reliable) |
| Lagrådet opinions | Prior PIR records | Legal assessment | A (official body) |
| Historical Riksdag record | Prior research/SOM | Electoral parallels | B |

### Analytical frameworks applied

1. **ACH (Analysis of Competing Hypotheses)**: Applied in Devil's Advocate analysis to challenge dominant narratives
2. **Admiralty Scale**: Applied in Intelligence Assessment for source and information reliability grading
3. **STRIDE-adapted threat analysis**: Parliamentary domain adaptation for threat classification
4. **Structured Scenario Analysis (alternative futures)**: Four scenarios with probability weighting
5. **Historical analogy**: Five historical parallels identified and assessed
6. **SWOT**: Applied to both opposition strategy and government position
7. **WEP language ladder**: Applied to all probabilistic statements (is likely / might / possible / is unlikely)

---

## Analytical Limitations

### What we know with high confidence
- Document metadata (date, party, committee, dok_id) — verified via MCP
- Motion content intent (from titles and summaries) — verified
- Parliamentary arithmetic (coalition seat counts) — stable since 2022 election
- Lagrådet verdict content — confirmed in prior PIRs

### What we know with medium confidence
- Full text of motions (HTML retrieved but quality varies)
- Opposition party motivation vs. stated position
- Media framing predictions
- Committee scheduling timelines

### What we don't know
- Exact KU and SfU scheduling dates for committee hearings
- Whether government plans any amendments to prop 258 in response to C
- Whether L will publicly acknowledge ECHR risk in prop 258
- Migrationsverket's latest capacity assessment
- Actual household debt data beyond IMF estimates (~89-91% GDP)

---

## AI-FIRST Quality Assessment

### Pass 1 (initial creation)
All 23 artifacts created from: (a) downloaded motion metadata, (b) partial HTML text for top 3 documents, (c) prior PIR context, (d) IMF context data, (e) analytical frameworks.

### Pass 2 quality improvements applied
- Added cross-references between artifacts (cross-reference-map.md)
- Strengthened Devil's Advocate challenges (3 additional counter-arguments)
- Extended comparative analysis with EU legal context for ECHR
- Added granular voter segmentation with segment size estimates
- Verified coalition mathematics with seat-count precision
- Added WEP language to all scenario probability statements
- Completed forward indicators trigger-action map

### Known quality gaps
- Full text analysis limited (HTML not stripped to plain text)
- No IMF SDMX endpoint data (SDMX probes ok but no specific indicators fetched)
- Migration implementation assessment relies on general knowledge, not fresh Migrationsverket data

---

## Data Freshness

| Data element | Age | Stale threshold | Status |
|--------------|-----|----------------|--------|
| Motion documents (HD024185-186) | <24h | 7 days | FRESH |
| IMF WEO context | 1 month | 6 months | FRESH |
| Prior PIR context | 1 day (2026-05-20) | 14 days | FRESH |
| Lagrådet opinion | 2 months (2026-03-24) | 12 months | FRESH |
| Coalition arithmetic | 3.5 years (2022 election) | N/A (until next election) | VALID |

---

*Methodology documentation follows Hack23 ISMS data quality standards and analysis/methodologies/ai-driven-analysis-guide.md*
