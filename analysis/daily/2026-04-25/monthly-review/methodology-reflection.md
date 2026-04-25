# Methodology Reflection — Monthly Review 2026-04-25

**Author**: James Pether Sörling | **Confidence**: HIGH (A1)
**Standards reference**: ICD 203 (Analytic Standards), Heuer & Pherson Structured Analytic Techniques

## ICD 203 audit

### (a) Objectivity / independence of political consideration

✅ Analyst attestation: no advisory, employment, or financial relationship with any Riksdag party, ministry, or affiliated body in the past 24 months. Source diet (riksdagen.se primary documents + sibling self-references) eliminates source-side political bias.

⚠️ Residual concern: confirmation bias toward Tidö-delivery thesis given prior monthly review's same conclusion. Mitigation: explicit devils-advocate.md with four competing hypotheses; H1/H2 corrections accepted into mainline.

### (b) Clear distinction between facts, assumptions, and judgments

✅ Each KJ explicitly labelled with confidence band; PIRs separated from KJs; carried-forward PIRs are explicitly tagged as such.

⚠️ Forward-poll claims (PIR-A) rely on single-source Demoskop projection — flagged as MEDIUM confidence rather than HIGH; assumption of 4–6 week SOM-lag is methodological assumption, not fact.

### (c) WEP language

✅ Used "highly likely / likely / possible / unlikely" mapped to numeric probability ranges per Kent Scale; confidence labels (VERY HIGH / HIGH / MEDIUM / LOW / VERY LOW) used consistently.

### (d) Stress-testing via competing hypotheses

✅ Devils-advocate.md applies ACH against 4 hypotheses; H1 (theatre vs delivery) and H2 (SD discipline duration) accepted as mainline corrections.

### (e) Source citation

✅ All claims trace to either (i) primary `dok_id` (HD01CU24, HD01JuU10, HD01JuU31, HD01SoU25, HD10448, HD11747, HD11748, HD11749), (ii) sibling synthesis files, or (iii) named institutional sources (RiR 2026:6, riksdagen.se).

⚠️ One claim ("Demoskop 4–6 week SOM-lag") cites general methodology rather than specific report; weakest link in source chain.

## ACH worksheet status

| Hypothesis | Status | Action |
|------------|--------|--------|
| Mainline (delivery + impl pivot) | retained, terminology corrected | adopted |
| H1 — theatre, not delivery | partially accepted | reword "delivered" → "committed and structurally locked-in" |
| H2 — SD strategic patience | partially accepted | downgrade SD-discipline confidence June+ |
| H3 — Trojan disinfo frame | rejected (insufficient evidence) | track post-reply media |
| H4 — opposition opportunity | accepted | strengthens R-2 |

## Methodology Improvements

### Improvement 1: Quantify SOM-lag explicitly

**Issue**: Vague "4–6 week SOM-lag" reference. **Action**: Codify in `analysis/methodologies/` a calibrated SOM-Demoskop transmission table with citations. **Owner**: data-pipeline-specialist. **Target**: 2026-05-15.

### Improvement 2: Add Polismyndigheten capacity dashboard

**Issue**: HD01JuU31 implementation tracking is currently narrative-only. **Action**: Build a recurring dashboard on (a) RiR 2026:6 recommendation closure rate, (b) Polismyndigheten Q-on-Q personnel changes, (c) Brå crime statistics. **Owner**: intelligence-operative + data-visualization-specialist. **Target**: 2026-06-01.

### Improvement 3: Counter-motion-rate baseline benchmark

**Issue**: SD's zero-counter-motion claim relies on sibling synthesis files; lacks Nordic-wide benchmark. **Action**: Build comparator dataset for Denmark/Norway/Finland confidence-coalition counter-motion rates 2018–2025. **Owner**: comparative-international skills set. **Target**: 2026-06-30.

### Improvement 4: Earlier wedge-architecture detection

**Issue**: HD11747/11748/11749 wedge taxonomy was identified *after* documents appeared rather than predicted. **Action**: Forward-indicators.md template should pre-register wedge categories so detection is faster. **Owner**: news-journalist + analyst-of-record. **Target**: 2026-05-08.

## What worked well this cycle

- ✅ Tier-C sibling-folder ingestion gave robust 30-day picture from only 8 fresh primaries.
- ✅ DIW ranking remained stable across sensitivity perturbation (top-3 unchanged).
- ✅ Carried-forward PIR ledger from 2026-04-23 closed cleanly with vote evidence.

## What didn't

- ⚠️ HD03100 fiscal text not directly read this cycle (sibling-only); should refresh quarterly.
- ⚠️ Lookback fallback (1-day) means "monthly" is arithmetic only on siblings; document this explicitly in manifest.
- ⚠️ One MCP enrichment retry needed.

