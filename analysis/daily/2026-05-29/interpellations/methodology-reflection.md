# Methodology Reflection — Interpellation Debates 2026-05-29

## Analytic Standards Applied

This package was produced under **ICD 203 (Analytic Standards)** — calibrated/estimative confidence language, explicit source characterisation, consideration of alternative hypotheses, and distinction between underlying information and analytic judgement. Source reliability is graded with **Admiralty codes** [A1]–[C4]. The analysis follows `analysis/methodologies/ai-driven-analysis-guide.md` and the AI-FIRST two-pass quality process. [A1]

---

## Data Provenance

- **Primary documents**: 7 interpellations (HD10522–HD10528), riksmöte 2025/26, retrieved from data.riksdagen.se via the riksdag-regering MCP. Five have full text [A2]; two are metadata-only (HD10525, HD10526) [B3].
- **Lifecycle dates** (all 7): inlämnad 2026-05-28, överlämnad 2026-05-29, anmäld 2026-06-01, sista svarsdatum 2026-06-12. [A2]
- **Economic context**: IMF WEO Apr-2026 (cached `data/imf-context.json`); live SDMX fetch was unavailable this cycle (sandbox egress). Vintage 1 month — **not stale**; stamped in every provenance block. [B3]
- **Electoral anchor**: 2026-09-13 election, 107 days from analysis date → **1.5× significance multiplier** applied throughout. [A1]

---

## Method Notes

- **DIW scoring** (Detectability, Impact, Weight; 1–3 each → 0–10 scaled × 1.5) ranked the four clusters; bank fraud topped at 7.8. Scores are analyst-calibrated, not mechanically derived, and are transparent in significance-scoring.md.
- **Clustering** by respondent and theme drove the synthesis: labour (Britz/L), bank fraud (Wykman/M), energy (Svantesson/M), municipal welfare (Slottner/KD).
- **Alternative hypotheses** were stress-tested in devils-advocate.md (four counter-hypotheses), satisfying the ICD 203 requirement to consider alternatives.

---

## Limitations & Gaps

1. **Two metadata-only documents** cap confidence on the ILO and equalisation themes; readings are explicitly inference-based [B3].
2. **No live economic data** this cycle; cached IMF vintage used (within tolerance).
3. **Coordination is inferred** from convergence, not proven by a retrieved strategy document — confidence on *intent* is deliberately lower than on *structure*.
4. **Government counter-evidence** (enumerated anti-fraud workstreams; municipal cost-shift data) was not retrieved, limiting falsification of the opposition's "insufficient" and "cost-shifting" claims.

These gaps are logged as collection priorities in forward-indicators.md (F-INT-04) and intelligence-assessment.md (Intelligence Gaps).

---

## AI-FIRST Two-Pass Quality Process

- **Pass 1** created all 23 always-on artifacts, 7 per-document analyses, and the PIR sidecar with full, document-specific content.
- **Pass 2** read every artifact back, deepened evidence and cross-references, verified attributions against source JSON, confirmed Mermaid colour styling on synthesis files, and tightened estimative language to ICD 203 standards.

**Pass-2 status: executed in full**

---

## Self-Assessment

The package's strongest elements are the per-document evidence anchoring (dated a-kassa reform; eight bank-fraud questions; SD-on-M Vattenfall filing) and the disciplined separation of high-confidence structure from lower-confidence intent. Its principal residual weakness is the two metadata-only documents, which should be the first collection action next cycle. Overall analytic confidence in the core judgements: **Moderate-High**. [B2]

## Pass-2 Improvement Log

Pass 2 made the following substantive changes beyond cosmetic edits: (1) decomposed the synthesis net assessment into three separable confidence tiers (observable structure / inferential coordination / prospective payoff) to prevent over-reading; (2) added a residual-risk analysis to threat-analysis.md identifying T-INT-03 (structural SD–M divergence) as least mitigable despite a lower DIW than the bank-fraud cluster — a non-obvious reprioritisation; (3) mapped every scenario to a falsifying forward indicator so the scenario tree is testable rather than narrative; (4) hardened estimative language to ICD 203 uppercase confidence tokens across the intelligence assessment; (5) added a Statskontoret evaluation pathway as the concrete cost-shift mitigation. The most important analytic shift between passes was recognising that the **highest-significance item (bank fraud) is not the highest-residual-risk item (coalition energy divergence)** — significance and durability are distinct axes. [B2]
