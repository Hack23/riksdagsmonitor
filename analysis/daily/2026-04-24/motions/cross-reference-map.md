# Cross-Reference Map — Opposition Motions — 2026-04-24

**Author**: James Pether Sörling

Maps policy clusters, legislative chains, opposition coordination patterns across 20 motions.

## Policy cluster graph

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart TB
    subgraph Fiscal[Fiscal / Economy — FiU]
        P236([Prop 236<br/>Drivmedel]) --> HD024082[S HD024082]
        P236 --> HD024092[V HD024092]
        P236 --> HD024098[MP HD024098]
    end
    subgraph Defence[Defence / Foreign — UU FöU]
        P228([Prop 228<br/>Krigsmateriel]) --> HD024079[S HD024079]
        P228 --> HD024091[V HD024091]
        P228 --> HD024096[MP HD024096]
    end
    subgraph Migration[Migration — SfU]
        P235([Prop 235<br/>Utvisning]) --> HD024081[S HD024081]
        P235 --> HD024090[V HD024090]
        P235 --> HD024097[MP HD024097]
        P229([Prop 229<br/>Mottagandelag]) --> HD024089[C HD024089]
        P215([Prop 215<br/>Tidsbeg boende]) --> HD024093[C HD024093]
    end
    subgraph Welfare[Welfare / Health — SoU]
        P216([Prop 216<br/>Med kompetens]) --> HD024078[S HD024078]
        P216 --> HD024083[V HD024083]
        P216 --> HD024087[MP HD024087]
        P216 --> HD024094[C HD024094]
    end
    subgraph Civil[Civil / Labour — CU AU]
        P222([Prop 222<br/>Ersättn]) --> HD024080[S HD024080]
        P222 --> HD024086[MP HD024086]
        P223([Prop 223<br/>Konsumkredit]) --> HD024084[V HD024084]
        P223 --> HD024088[C HD024088]
        P214([Prop 214<br/>Cybersäk]) --> HD024085[MP HD024085]
        P214 --> HD024095[C HD024095]
    end

    style Fiscal fill:#00d9ff,stroke:#000,color:#000
    style Defence fill:#ff006e,stroke:#fff,color:#fff
    style Migration fill:#ffbe0b,stroke:#000,color:#000
    style Welfare fill:#8338ec,stroke:#fff,color:#fff
    style Civil fill:#3a86ff,stroke:#fff,color:#fff
```

## Legislative chain

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    GovProp[Regering props<br/>214-236] --> Filed[Filed<br/>riksdag.se]
    Filed --> Window[Motion window<br/>15 days]
    Window --> Mot[20 motions<br/>filed 2026-04-15..17]
    Mot --> Utskott[Utskott hearings<br/>FiU SfU SoU CU UU AU FöU]
    Utskott --> Bet[Betänkande<br/>2026-05/06 expected]
    Bet --> Kammarvote[Kammarvote<br/>2026-06 pre-summer]
    Kammarvote --> Law[Adopted law<br/>or partial]
    Law --> SFS[SFS<br/>publication]

    style GovProp fill:#00d9ff,stroke:#000,color:#000
    style Kammarvote fill:#ff006e,stroke:#fff,color:#fff
    style Law fill:#ffbe0b,stroke:#000,color:#000
```

## Opposition coordination matrix

| Cluster | S | V | MP | C | Coordination pattern |
|---------|:-:|:-:|:-:|:-:|----------------------|
| Drivmedel (236) | ✓ | ✓ | ✓ |  | Three-party parallel (no co-sign) |
| Krigsmateriel (228) | ✓ | ✓ | ✓ |  | Three-party parallel, divergent content |
| Utvisning (235) | ✓ | ✓ | ✓ |  | Three-party parallel, converging on rättssäkerhet |
| Medicinsk kompetens (216) | ✓ | ✓ | ✓ | ✓ | **Four-party wave** — strongest coordination |
| Mottagandelag (229) |  |  |  | ✓ | Single-party (C) |
| Tidsbeg boende (215) |  |  |  | ✓ | Single-party (C) |
| Ersättning (222) | ✓ |  | ✓ |  | Two-party |
| Konsumentkredit (223) |  | ✓ |  | ✓ | Two-party |
| Cybersäk (214) |  |  | ✓ | ✓ | Two-party |

## Issue-linkage network

- **Drivmedel ↔ migration**: V explicitly frames both as distributional questions (HD024092 + HD024090). Rhetorical thread: "who pays".
- **Krigsmateriel ↔ cyber**: MP links defence-industry scrutiny to civil cyber resilience (HD024096 + HD024085).
- **Medicinsk kompetens ↔ mottagandelag**: C links healthcare workforce to migration system capacity (HD024094 + HD024089).
- **Utvisning ↔ tidsbeg boende**: Both migration-regime bills; C on one, V/MP/S on the other — divergent issue selection among opposition.

## Historical precedents (same-day cross-ref)

- 2026-04-23 motions cluster (see [`../2026-04-23/motions/`](../../2026-04-23/motions/)) — previous day's motion wave preceded this one; check continuity.
- 2026-04-18 propositions cluster — originating Tidö legislative package.

## External links

- Riksdagen open data: [data.riksdagen.se](https://data.riksdagen.se/)
- All dok_ids resolvable at `https://data.riksdagen.se/dokument/{dok_id}.html`
- Regeringen propositions: [regeringen.se/propositioner](https://www.regeringen.se/rattsliga-dokument/proposition/)

---

*Cross-reference map generated from 20 motion manifest. Verifiable via `search_dokument` on any dok_id.*
