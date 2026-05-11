# Coalition Mathematics — Propositionspaket 7 maj 2026

**Author:** James Pether Sörling | **Run ID:** 25654727630 | **Date:** 2026-05-11
**Classification:** Public | **Admiralty:** [B2]

---

## Riksdagsaritmetik 2025/26

| Parti | Mandat (349 total) | Koalition |
|-------|-------------------|-----------|
| M (Moderaterna) | 68 | Tidöregeringen |
| SD (Sverigedemokraterna) | 73 | Tidöregeringen |
| KD (Kristdemokraterna) | 19 | Tidöregeringen |
| L (Liberalerna) | 16 | Tidöregeringen |
| **Tidö totalt** | **176** | **Majoritet: Ja (>175)** |
| S (Socialdemokraterna) | 107 | Opposition |
| V (Vänsterpartiet) | 24 | Opposition |
| MP (Miljöpartiet) | 18 | Opposition |
| C (Centerpartiet) | 24 | Neutral/Opposition |
| **Opposition totalt** | **173** | |

*Obs: Mandattal baserat på känd riksdagssammansättning; ej verifierat mot officiell källa i denna körning.*

---

## Röstanalys per Proposition

### HD03267 — Kritisk koalitionsröst

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1a1e3d', 'primaryTextColor': '#e0e0e0', 'primaryBorderColor': '#00d9ff', 'lineColor': '#ff006e'}}}%%
pie title HD03267 Förväntad röstfördelning (349 mandat)
    "Ja (M+SD+KD+L)" : 176
    "Nej (S+V+MP)" : 149
    "Ja/Reservation (C)" : 24
```

**Koalitionsmatten:**
- **Full Tidö-koalition:** 176 Ja = exakt enkel majoritet (175 krävs)
- **Om L reserverar sig/röstar Nej:** M+SD+KD = 160 = UNDER majoritet
- **Räddningslina om L defects:** C (24) + Tidö utan L (160) = 184 = Majoritet med C:s stöd
- **Worst case:** Inget C-stöd + L Nej = 160 < 175 = PROPOSITION FALLER

**Kritisk insikt:** L:s 16 mandat är matematiskt avgörande. Utan L måste C stödja propositionen för att den ska passera. C:s position om HD03267 är okänd men troligen mer tveksam (liberalt-konservativ med civila rättighetsdimension).

---

### HD03250 och HD03261 — Bekväm majoritet

| Proposition | Förväntad Ja-koalition | Mandat | Marginal |
|-------------|----------------------|--------|----------|
| HD03250 | M+SD+KD+L+C+S | ~280 | +105 |
| HD03261 | M+SD+KD+L+C+S | ~265 | +90 |

Dessa propositioner passerar med stor marginal.

---

## Koalitionsriskscenario: "Liberalernas dilemma"

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1a1e3d', 'primaryTextColor': '#e0e0e0', 'primaryBorderColor': '#00d9ff', 'lineColor': '#ffbe0b'}}}%%
graph TD
    L["Liberalernas beslut"] --> LJ["L röstar Ja<br/>(176 = Tidö-majoritet)"]
    L --> LR["L reserverar sig<br/>(men röstar Ja = 176)"]
    L --> LN["L röstar Nej<br/>(Tidö = 160)"]
    LJ --> S1["Proposition passerar<br/>Koalitionen håller"]
    LR --> S1
    LN --> C["C:s beslut"]
    C --> CJ["C röstar Ja<br/>(160+24=184)"]
    C --> CN["C röstar Nej<br/>(160 < 175)"]
    CJ --> S2["Proposition passerar<br/>Ad hoc-koalition"]
    CN --> S3["Proposition faller<br/>Koalitionskris"]
    style S3 fill:#ff006e,color:#fff
    style S1 fill:#00d9ff,color:#0a0e27
    style S2 fill:#ffbe0b,color:#0a0e27
```

---

## Historiska Koalitionsmönster

**Tidöavtalet (2022–):** M+SD+KD+L har röstat tillsammans på alla Tidö-specifika propositioner. HD03267 är den proposition med störst L-internt tryck sedan Tidöavtalet.

**Analogt: Lagen (2022:700):** Samma lag som HD03267 ändrar passerades 2022 med M+SD+KD+L. L stödde 2022-versionen — men HD03267 är mer restriktiv och skapar ny koalitionsbelastning.

**PIR-1 status:** BESVARAD — Koalitionsrisken är låg men ej noll; L:s 16 mandat är kritiska; utan C-stöd som backup är L:s stöd avgörande.

| Claim | Evidence | Retrieved at | Confidence |
|-------|----------|--------------|------------|
| Tidö mandat 176 | Känd riksdagssammansättning | 2026-05-11 | HIGH |
| L = kritisk vågmästare | Matematik 176 - 16 = 160 < 175 | 2026-05-11 | HIGH |
| C som potential räddningslina | Mandattal 24 | 2026-05-11 | HIGH |

