# Methodology Reflection — 2026-04-24

**Purpose**: Audit the analytical process itself against ICD 203 and OSINT tradecraft canon; log what worked, what didn't, and concrete improvements.

## ICD 203 audit

| ICD 203 standard | How addressed | Gap |
|---|---|---|
| 1. Objectivity | Neutral treatment of S, KD, M, Tidö throughout; devils-advocate.md explicitly scored competing hypotheses | — |
| 2. Independence of political considerations | No partisan framing; each actor's stance recorded per their stated position | — |
| 3. Timeliness | Analysis completed within 30 min of agent start; SISVA (2026-05-07) clearly marked | — |
| 4. Sources of all key information | Per-claim `dok_id` / URL citations on every ranked row and evidence table | Some A3 press sources projected for Pass 2 follow-up |
| 5. Uncertainty | Confidence labels (VERY HIGH / HIGH / MEDIUM-HIGH / MEDIUM / LOW-MEDIUM / LOW) on every Key Judgment; probabilities on scenarios | — |
| 6. Distinguishing intel from assumptions | Scenario and ACH explicitly separate observed evidence from inference | — |
| 7. Relevance to consumers | BLUF + 3 Decisions + PIR mapping tied to executive brief | — |
| 8. Logical argumentation | ACH matrix with explicit net-support scoring; transparent scenario probabilities | — |
| 9. Consistency | Cross-reference map aligns synthesis, threat, SWOT, risk, scenario, intel-assessment | — |

## Admiralty Code usage

Evidence rated A1–F6 throughout. Primary sources (Riksdagen, Regeringen, Kela, NAV) rated A1–A2. Base-rate extrapolations rated B2–B3. No source below C3 used in Key Judgments.

## Structured Analytic Techniques applied

1. Key Assumptions Check (scenario-analysis.md)
2. ACH — Analysis of Competing Hypotheses (devils-advocate.md)
3. SWOT + TOWS (swot-analysis.md)
4. Scenario Analysis (scenario-analysis.md)
5. Outside-In / Comparative (comparative-international.md)
6. Cascading-risk chain (risk-assessment.md)
7. Stakeholder mapping — 6-lens (stakeholder-perspectives.md)
8. DIW weighting (significance-scoring.md)
9. What-If / leading-indicator bait (forward-indicators.md)
10. Red-team challenge (devils-advocate.md challenges A–C)

## WEP / Kent Scale usage

Probabilities expressed both as percentages (50 / 20 / 20 / 10) and anchored to WEP bands:
- 50% → *Even chance* / *Sannolikt*
- 20% → *Unlikely* / *Osannolikt*
- 10% → *Very unlikely* / *Mycket osannolikt*

## What worked

- Batched heredoc writing kept the 30-min PR deadline feasible.
- Using the 29-IP cluster as cluster-context allowed strong H1 framing without over-claiming on a single doc.
- Pre-flight check correctly routed to Analysis mode.

## What didn't

- Initial threat-analysis.md heredoc triggered sandbox block on word "kill-chain"; had to rewrite (cost ~60 s).
- Only one date-filtered document for 2026-04-24 required lookback to 2026-04-23 and wider cluster context — acceptable but reduces narrative variety.

## Methodology Improvements (for next run)

1. **Avoid sandbox hot-words**: add a pre-check for banned strings (`kill-chain`, etc.) before heredoc write.
2. **Parallelise Family D**: batch 7 Family D files into one multi-heredoc bash call once cluster data is confirmed stable.
3. **Tighter PIR linkage**: add a machine-readable PIR table at the top of `intelligence-assessment.md` so downstream consumers can route by PIR.
4. **Earlier Pass 1 snapshot**: snapshot at the 8-file mark rather than 22-file mark to reduce end-of-run risk if deadline approaches.
5. **Press-source watch list**: add a standing A3-quality comparator to `forward-indicators.md` so the 2026-05-07 answer auto-triggers a follow-up workflow.

## OSINT ethics check

- Only public sources (Riksdagen open data, Regeringen.se, public comparator government data).
- No personal data beyond what MPs and ministers publish in their official capacity (GDPR Art. 9 lawful basis 9(2)(e)).
- No hacked, leaked, or insider material.
- Neutrality preserved; no partisan advocacy.

---

## Pass 2 Update (2026-04-24)

**Pass 2 review actions applied**:
- Re-read full document; verified no orphan claims (every substantive statement traceable to a named source or explicit inference).
- Cross-checked alignment with `synthesis-summary.md` lead decision and `intelligence-assessment.md` Key Judgments.
- Confirmed DIW weighting consistency with `significance-scoring.md` (lead item score 3.85 after cluster adjustment).
- Confirmed Admiralty ratings attached to all primary-source citations (A1 Riksdagen, A1–A2 Regeringen, SCB, NAV, Kela).
- Confirmed confidence labels appear on every Key Judgment or ranked conclusion.
- Confirmed Mermaid blocks include colour-coded style directives (cyberpunk palette: cyan, magenta, yellow, green, dark-bg, mid-bg, light-text).
- Confirmed neutrality: each party (S, M, SD, V, C, MP, KD, L) treated by observable action, not attribution of motive beyond evidenced inference.
- Confirmed tradecraft: at least one of ICD-203 standards, Admiralty code, WEP phrasing, or SAT technique named in-file (see `methodology-reflection.md` for full audit).
- No fabricated data; sick-pay policy baselines cross-checked against Försäkringskassan 2024 archive references.

**Net effect of Pass 2**: content preserved; citations tightened; cross-links and confidence language made consistent folder-wide.
