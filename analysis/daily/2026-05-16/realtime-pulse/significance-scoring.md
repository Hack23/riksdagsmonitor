# Significance Scoring — Realtime Pulse 2026-05-16

<!-- analysis-type: significance-scoring -->
<!-- article-date: 2026-05-16 -->
<!-- subfolder: realtime-pulse -->
<!-- pass: 2 (final) -->

**Election proximity**: ≤6 months → **1.5× DIW multiplier active**  
**Date**: 2026-05-16 | T−119 days to election (September 13, 2026)

---

## DIW Scoring Framework

The Document Intelligence Weight (DIW) measures parliamentary document significance across five dimensions:
- **Political salience** (0–2): How contested/visible is the issue?
- **Policy impact** (0–2): Does it change law, budget, or executive power?
- **Electoral relevance** (0–2): Does it affect vote intention or campaign narrative?
- **Geopolitical dimension** (0–2): International/security dimension present?
- **Constitutional weight** (0–2): Fundamental rights or RF implications?

Maximum raw = 10; Adjusted score = raw × 1.5× multiplier (capped at 10 for election proximity).

---

## Document Scoring

### HD11813 — Ny rysk lag om angrepp på andra länder

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Political salience | 2.0 | Hotbild mot Sverige; utrikespolitik högst på agendan |
| Policy impact | 1.5 | Skriftlig fråga → begränsad direkt policy-impact, men Stenergards svar sätter officiell position |
| Electoral relevance | 2.0 | Valdebattens säkerhetspolitiska axel; SD vs M |
| Geopolitical dimension | 2.0 | Direkt rysk eskalation mot internationell rättsordning |
| Constitutional weight | 1.0 | ICC-åtaganden (Romstadgan) har konstitutionell dimension |

**Raw DIW**: 8.5 | **Adjusted**: 10.0 (capped) | **Tier**: L1 Critical

---

### HD11812 — Drönarkrig (Aurora 26)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Political salience | 2.0 | Aurora 26 gap: hög mediedagordning |
| Policy impact | 1.5 | Jonson-svar kan signalera budget-omprioritering |
| Electoral relevance | 2.0 | Försvar = valrörelseprofilfråga för SD |
| Geopolitical dimension | 2.0 | Ukraina-samarbete; NATO-förmåga |
| Constitutional weight | 0.0 | Ej grundlagsdimension |

**Raw DIW**: 7.5 | **Adjusted**: 10.0 (capped) | **Tier**: L2 Strategic

---

### HD10494 — Erkännande av tjetjenska republiken Itjkerien

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Political salience | 1.5 | Symbolisk men nischad utrikespolitik |
| Policy impact | 1.0 | Interpellation → svar, ej lag |
| Electoral relevance | 1.5 | SD:s anti-ryska positionering |
| Geopolitical dimension | 2.0 | Rysslands reaktion; NATO-signalering |
| Constitutional weight | 1.0 | Folkrättslig dimension |

**Raw DIW**: 7.0 | **Adjusted**: 10.0 (capped) | **Tier**: L2 Strategic

---

### HD024184 — C motion mot prop 258 (trade union del)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Political salience | 1.5 | Prop 258 aktiv KU-beredning; Lagrådets yttrande ger extra synlighet |
| Policy impact | 1.0 | Motionen avslås troligen; begränsad direkt påverkan |
| Electoral relevance | 1.5 | C:s föreningsfrihetsprofil; LO-frågan inför val |
| Geopolitical dimension | 0.0 | Ingen geopolitisk dimension |
| Constitutional weight | 1.5 | RF 2 kap. föreningsfrihet; Lagrådet involverat |

**Raw DIW**: 5.5 | **Adjusted**: 8.25 | **Tier**: L3 Intelligence

---

## Sammanfattningstabell

| Rank | dok_id | Raw DIW | Adjusted DIW | Tier | Notes |
|------|--------|---------|--------------|------|-------|
| 1 | HD11813 | 8.5 | 10.0 | L1 Critical | Capped; rysk lag = maxsignifikans |
| 2 | HD11812 | 7.5 | 10.0 | L2 Strategic | Capped; Aurora 26 drönargap |
| 3 | HD10494 | 7.0 | 10.0 | L2 Strategic | Capped; Ichkerien-erkännande |
| 4 | HD024184 | 5.5 | 8.25 | L3 Intelligence | Lagrådets yttrande höjer score |

---

## Bundle Score

**Unweighted bundle average**: 7.1/10  
**Election-adjusted bundle average**: 9.6/10 (effective)  
**Lead story**: HD11813 (rysk lag) — geopolitisk dominans
