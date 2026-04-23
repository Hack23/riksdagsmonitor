# Implementation Feasibility — Committee Reports 2026-04-23

**Methodology**: `analysis/methodologies/strategic-extensions-methodology.md` §Feasibility
**Analyst**: James Pether Sörling | **Date**: 2026-04-23

## Feasibility Scorecard

| Document | Implementation type | Risk level | Key bottleneck | Feasibility |
|----------|--------------------|-----------|--------------|----|
| HD01FiU48 | Legislative + regulatory (tax rules) | LOW | Existing Skatteverket infrastructure | HIGH |
| HD01KU33 | Constitutional second vote | MEDIUM | Post-election Riksdag composition | MEDIUM |
| HD01KU32 | Constitutional second vote | MEDIUM | Same as KU33 | MEDIUM |
| HD01CU27 | Brottsbalken amendment (property sanctions) | LOW | Courts/prosecution capacity | HIGH |
| HD01CU28 | IT registry (bostadsrätter) | MEDIUM-HIGH | IT system build, LB/HSB compliance | MEDIUM |
| HD01CU22 | New myndighet (guardianship oversight) | HIGH | Funding, staffing, IVO redesign | MEDIUM-LOW |
| HD01MJU21 | Agricultural/climate monitoring | LOW | Existing JV/SBA infrastructure | HIGH |
| HD01MJU19 | Waste law amendment | LOW | Industry compliance | HIGH |
| HD01SfU20 | Civil preparedness update | LOW | Existing MSB infrastructure | HIGH |
| HD01TU16 | Driver education deregulation | LOW | Transport agency rule update | HIGH |

## Critical Path Analysis

### CU28 — Bostadsrättsregister IT System
Most complex single implementation item. Sweden's existing property registries are managed by Lantmäteriet; integrating bostadsrätt ownership is novel. Risks:
- GDPR-compliant data architecture required (personal data + ownership records)
- Industry resistance from HSB, Riksbyggen, SBC (>700,000 bostadsrätter)
- IT procurement under LOU (Lagen om offentlig upphandling) — 12–18 month procurement cycle
- Target implementation date per government: Q2 2027 (post-election)

**Feasibility assessment**: MEDIUM — technically achievable but procurement and compliance delays likely push full implementation to 2027–2028.

### CU22 — New Supervisory Myndighet
Creating a new oversight authority requires:
- Government proposition 2026/27 (next parliament)
- Appropriations from Riksdag
- Staff recruitment (estimated 40–80 FTEs)
- IVO role redesign to avoid overlap

**Feasibility assessment**: LOW in the immediate term; MEDIUM over 2027–2028 horizon. Likely requires next government commitment regardless of election outcome.

### KU33/KU32 — Constitutional Amendments
Purely procedural; no administration required. The second vote is a Riksdag decision, not an executive implementation task. Risk is political (election outcome) not administrative.

## Resource Requirements Summary

| Resource type | High demand items | Estimated cost |
|--------------|-------------------|---------------|
| IT investment | CU28 registry | SEK 150–300M (estimate) |
| Staffing | CU22 new authority | SEK 80–120M/year |
| Fiscal | FiU48 energy support | SEK 4.1bn (per legislation) |
| Court capacity | CU27 new offences | Marginal increase |
| Regulatory | TU16, MJU19 | Low (rule update only) |

Confidence: Implementation cost estimates are structural [B3]; IT cost estimates are high-uncertainty [C4].
