# Cross-Reference Map — 2026-04-24 Opposition Parliamentary Activity

**F3EAD Stage**: ANALYZE | **Methodology**: structural-metadata-methodology.md §Relationship taxonomy
**Edge types used**: amends, thematic, coordinated-filing, committee-routed, rebuts

## Policy Cluster Map

```mermaid
graph TD
    A["HD11749\nBarnrätt i kriminalvård"] -- "thematic" --> B["HD11747\nFunktionsnedsatta\narbetsmiljö"]
    A -- "thematic" --> C["HD01SoU25\nÄldre och\nnärstående"]
    B -- "coordinated-filing" --> D["HD11748\nSahabo/Burundi"]
    B -- "coordinated-filing" --> A
    E["HD10448\nVindkraft/SD"] -- "rebuts" --> F["Windeurope rapport\n2026-04-21"]
    G["HD01JuU10\nNy vapenlag"] -- "committee-routed" --> H["JuU"]
    I["HD01JuU31\nPolisreformen 2015"] -- "committee-routed" --> H
    J["HD01CU24\nByggprocess"] -- "committee-routed" --> K["CU"]
    C -- "committee-routed" --> L["SoU"]
    
    style A fill:#F44336,color:#FFFFFF
    style B fill:#FF9800,color:#FFFFFF
    style C fill:#4CAF50,color:#FFFFFF
    style D fill:#FF9800,color:#FFFFFF
    style E fill:#1E88E5,color:#FFFFFF
    style F fill:#7B1FA2,color:#FFFFFF
    style G fill:#4CAF50,color:#FFFFFF
    style H fill:#1565C0,color:#FFFFFF
    style I fill:#4CAF50,color:#FFFFFF
    style J fill:#4CAF50,color:#FFFFFF
    style K fill:#1565C0,color:#FFFFFF
    style L fill:#1565C0,color:#FFFFFF
```

## Coordinated Filing Pattern (S opposition cluster)

HD11747 + HD11748 + HD11749 all filed by S MPs on the same date (2026-04-24). This is consistent with a **coordinated parliamentary filing strategy**: simultaneous multi-front questions maximise pressure on multiple ministers and media bandwidth.

| Edge | From | To | Type | Basis |
|------|----|---|------|-------|
| Coordinated | HD11747 | HD11748 | coordinated-filing | Same party, same date, different ministers |
| Coordinated | HD11747 | HD11749 | coordinated-filing | Same party, same date, different ministers |
| Thematic | HD11749 | HD01SoU25 | thematic | Both concern vulnerable population welfare + care rights |
| Thematic | HD11749 | HD11747 | thematic | Both target vulnerable groups + government implementation failure |
| Rebuttal | HD10448 | Windeurope 2026-04-21 | rebuts | Fransson directly challenges Windeurope report |
| Committee | HD01JuU10 | HD01JuU31 | committee-routed | Both JuU betänkanden on same day |
| Amends | HD01JuU10 | Prop. vapenlag | amends | Committee approves government proposition |

## Legislative Chain: New Firearms Law

`Prop. (vapenlag) → JuU10 → Riksdag vote (approves) → Ny vapenlag in force`

## Opposition Accountability Chain

`IF Metall larnar → HD11747 (Haraldsson) → Britz svar 2026-05-06 → [escalation] → Interpellation?`
`IMR oroar sig → HD11749 (Wallentheim) → Mohamsson svar 2026-05-06 → [escalation] → KU?`
`Windeurope rapport → SVT/SR rapporterar → HD10448 (Fransson) → Busch svar 2026-05-08`
