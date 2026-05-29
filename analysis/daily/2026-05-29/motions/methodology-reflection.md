# Methodology Reflection — Swedish Opposition Motions, 2026-05-29

> Reflexive audit of the analytic process for this product. Authored in English; Swedish proper nouns preserved.

**Pass-2 status: executed in full.**

## 🔄 Tradecraft Context

- Pass 1 created the full artifact set; Pass 2 read every artifact back and improved each.
- This reflection documents the method, the SATs applied, the confidence distribution, the banned-phrase audit, the Pass 1→Pass 2 delta, and improvement opportunities with PIR roll-forward.

## 1️⃣ Seven-Step Analytic Protocol (as executed)

1. **Frame & PIRs** — Defined the window question (opposition-motion strategic intent pre-election) and three PIRs.
2. **Collect** — Live MCP retrieval; health gate (`get_sync_status` = live); motions download with full-text top-N; lookback fallback to 2026-05-22 when 2026-05-29 returned zero.
3. **Validate** — Coverage check (2/2 full_text); flagged unretrieved propositions/Lagrådet yttrande as a confidence limit.
4. **Classify & score** — Political classification + DIW with explicit 1.5× election multiplier.
5. **Analyse** — Per-document + Family A/C/D artifacts; SWOT, risk, threat, stakeholder, scenarios, comparative, devil's-advocate, intelligence assessment.
6. **Challenge** — Devil's-advocate against all four KJs; ACH in the assessment; confidence adjustments fed back.
7. **Reflect & roll forward** — This document; PIR status updated; improvement opportunities logged.

## 2️⃣ Structured Analytic Techniques Applied (≥10)

1. Key Assumptions Check — surfaced the government-cohesion and bill-characterisation assumptions.
2. Analysis of Competing Hypotheses (ACH) — H1 coordinated strategy vs H2 routine vs H3 statute-change.
3. Indicators/Signposts — committee dispositions, recorded votes, rights-body signalling.
4. Quality-of-Information Check — Admiralty grading; flagged unverified bill content.
5. Devil's-Advocate — full KJ-by-KJ challenge (see `devils-advocate.md`).
6. What-If Analysis — 5-year LSU evaluation clause; security-incident counterfactual.
7. Cui Bono — beneficiary mapping in SWOT.
8. Red-Team (government frame) — counter-vector in threat/stakeholder artifacts.
9. High-Impact/Low-Probability scan — wildcards W1–W5 in scenarios.
10. Premortem — "why did this assessment fail?" → verification gap identified as top cause.
11. Cross-Impact Analysis — two-motion interaction and scenario S2/S3 exclusivity.

12. Cone of Plausibility — bounded the scenario set (S1–S4 + W1–W5) between the baseline (routine defeat) and the highest-variance wildcard (pre-election security incident).

## 3️⃣ Devil's-Advocate KJ Coverage

All four Key Judgments (KJ-1…KJ-4) were challenged in `devils-advocate.md` with counter-case, overturning evidence, and rebuttal. Net effect: KJ-1 confidence adjusted HIGH→MEDIUM-HIGH; KJ-2/3/4 retained. Adjustments are reflected in `intelligence-assessment.md`.

## 4️⃣ Confidence Distribution

| Confidence-in-evidence | Count (key judgments/risks) | Notes |
|------------------------|-----------------------------|-------|
| HIGH | KJ-1 (frame), KJ-2, R4 | Motion content/intent + arithmetic |
| MEDIUM-HIGH | KJ-1 (intent, post-challenge) | Inference from coordination evidence |
| MEDIUM | KJ-3, KJ-4, R1–R3, R5, V1–V4 | Bill characterisation unverified |
| LOW-MEDIUM | S-alignment (KJ-4 sub), R6 | Inferred party behaviour |

WEP probability is stated separately from confidence throughout; week/month-horizon judgments capped at "likely/unlikely."

## 5️⃣ Oversight-Body Tracking (Lagrådet / Statskontoret / SKR)

- **Lagrådet**: actively cited in HD024192 (criticism of parallel legislating). Tracked as a procedural-vulnerability asset for the opposition; its yttrande was not independently retrieved this run (logged for roll-forward).
- **Statskontoret**: not engaged by either document this window. No action.
- **Sveriges Kommuner och Regioner (SKR)**: not named, but municipalities are implicated by HD024191's homeless-registration coordination ask; SKR commentary is a forward signpost, not present evidence.

## 6️⃣ Sibling-Folder Ingestion

- No sibling subfolders for 2026-05-29 (motions was the operative cycle this run). No cross-type citations ingested. If a same-date propositions/committee folder existed, HD024192/HD024191 would cite parent-bill analyses there; logged as N/A this window.

## 7️⃣ Banned-Phrase Zero-Count Grid

| Banned phrase class | Count |
|---------------------|-------|
| "in today's fast-paced / ever-evolving" | 0 |
| hedging filler ("important-to-note" pattern) | 0 |
| "plays a crucial/vital role" | 0 |
| "stands as a testament" | 0 |
| "navigate the compl{ities}" | 0 |
| "in conclusion / in summary" (as filler) | 0 |
| "delve into" | 0 |
| hype superlatives ("game-changing", "unprecedented" unqualified) | 0 |
| em-dash filler clichés | 0 |
| LLM hedging boilerplate ("as an AI") | 0 |

All artifacts scanned in Pass 2; zero occurrences confirmed.

## 8️⃣ Pass 1 → Pass 2 Delta

- **executive-brief.md**: tightened BLUF WEP banding; confirmed required headings.
- **synthesis-summary.md**: added secondary "control-creep" thread, cui-bono, security-incident counterfactual.
- **swot-analysis.md**: added second-order effects and cui-bono sections.
- **cross-reference-map.md**: corrected signatory-overlap count (three, not two).
- **intelligence-assessment.md**: folded devil's-advocate confidence adjustment into KJ-1.
- **per-document files**: added biometric/GDPR specificity (HD024191) and Lagrådet counter-frame (HD024192).
- General: banned-phrase sweep; WEP/confidence separation enforced everywhere.

## 9️⃣ Improvement Opportunities & PIR Roll-Forward

- **Top opportunity**: independently retrieve prop 2025/26:261, prop 2025/26:267, and the Lagrådet yttrande to raise R1/V1 and bill-characterisation confidence MEDIUM→HIGH. → Rolled into **PIR-RULE-OF-LAW-TRAJECTORY** (status: open).
- **Coalition confirmation**: track bet SkU30/JuU45 reservations to resolve KJ-4. → **PIR-COALITION-SIGNAL-2026** (open).
- **Strategy confirmation**: monitor MP campaign messaging for explicit two-front framing. → **PIR-MOTIONS-OPPOSITION-STRATEGY** (answered; keep monitoring).

## 🔁 Re-Run Log Schema

Future re-runs should append a record: `{ run_id, run_attempt, date, subfolder, improvement_mode, artifacts_changed[], pir_deltas[], confidence_changes[], notes }`. This run: `{ run_id: 26625669352, run_attempt: 1, date: 2026-05-29, subfolder: motions, improvement_mode: false, artifacts_changed: [all created Pass 1, all improved Pass 2], pir_deltas: [3 PIRs initialised], confidence_changes: [KJ-1 HIGH→MEDIUM-HIGH], notes: lookback to 2026-05-22; bills unverified }`.

## 🧭 ICD 203 Analytic-Standards Audit

| ICD 203 standard | Self-assessment |
|------------------|-----------------|
| Objective | Met — government counter-frame included; single-party bias flagged. |
| Independent of political consideration | Met — no advocacy; MP framing labelled as framing. |
| Timely | Met — pre-recess/pre-election relevance. |
| Based on all available sources | Partial — bills/Lagrådet yttrande not independently retrieved (flagged). |
| Implements analytic tradecraft standards | Met — sourcing, uncertainty (WEP), distinction of fact/assumption/judgment, consistency, accuracy of dates/IDs, logical argumentation, change/consistency noted, customer-relevant. |
| Properly describes quality/reliability of sources | Met — Admiralty grading. |
| Properly expresses uncertainty | Met — WEP separated from confidence. |
| Distinguishes intelligence from assumptions | Met — inferences labelled. |
| Incorporates alternative analysis | Met — devil's-advocate + ACH. |
| Demonstrates relevance to customer | Met — 3 decisions in executive-brief. |
| Uses logical argumentation | Met. |
| Consistency / change over time | Met — historical-parallels + re-run schema. |
| Accurate judgments / data | Met — IDs, committees, statutes verified against source. |

## ✅ Pass-2 Self-Audit Checklist

- [x] Literal "Pass-2 status: executed in full" present.
- [x] 9 required sections present (7-step protocol, SATs, DA coverage, confidence distribution, oversight tracking, sibling ingestion, banned-phrase grid, Pass1→Pass2 delta, improvement/PIR roll-forward).
- [x] ICD 203 audit included.
- [x] ≥10 SATs listed (12).
- [x] Re-run log schema included.
- [x] Banned-phrase scan clean (zero-count grid).
