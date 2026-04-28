# Threat Analysis — Opposition Motions 2026-04-28

**Author**: James Pether Sörling  
**Date**: 2026-04-28  
**Confidence**: MEDIUM [B3]  
**Framework**: Political Threat Taxonomy + Attack Tree

## Threat Taxonomy

### Threat Category 1: Legislative Defeat of Opposition Motion
**Actor**: Governing coalition (M/KD/L/C) + SD  
**Target**: Motion HD024099 / S's parliamentary agenda  
**Likelihood**: HIGH (0.72)  
**Method**: JuU majority rejection of motion; straight committee vote along coalition + SD lines  
**Evidence**: Governing coalition has consistent JuU majority; no cross-coalition amendments signalled [riksdagen.se voting data, B2]  
**Admiralty**: [B2]

### Threat Category 2: Electoral Narrative Attack
**Actor**: Governing coalition communications (M)  
**Target**: S's accountability reform brand  
**Likelihood**: MEDIUM-HIGH (0.55)  
**Method**: Frame S's rejection as "Socialdemokraterna vill skydda korrupta tjänstemän"  
**Evidence**: Historical 2022 election pattern: M framed S as soft on crime [C2]  
**Admiralty**: [C2]

### Threat Category 3: Chapter 10 BrB Reform Stagnation
**Actor**: Government (Justitiedepartementet)  
**Target**: S's constructive anti-corruption agenda  
**Likelihood**: HIGH (0.60)  
**Method**: Decline to bring forward Chapter 10 BrB proposals before election  
**Evidence**: Not listed in government spring 2026 legislative programme [C3]  
**Admiralty**: [C3]

## Attack Tree

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#ff006e', 'secondaryColor': '#00d9ff', 'background': '#0a0e27'}}}%%
flowchart TD
    Root["Target: Defeat HD024099"] --> T1["Legislative Defeat\nJuU majority vote"]
    Root --> T2["Narrative Attack\nMedia framing"]
    Root --> T3["Reform Stagnation\nDefer Ch.10 BrB"]
    T1 --> T1a["All demands rejected"]
    T1 --> T1b["Partial win: valve §2"]
    T2 --> T2a["Media amplification"]
    T3 --> T3a["No bill before Oct 2026"]
    style Root fill:#ff006e,color:#fff
    style T1 fill:#ffbe0b,color:#0a0e27
    style T2 fill:#ffbe0b,color:#0a0e27
    style T3 fill:#ffbe0b,color:#0a0e27
    style T1b fill:#00d9ff,color:#0a0e27
    style T3a fill:#ff006e,color:#fff
```

## TTP Mapping (Political Domain)

| Tactic | Technique | Procedure | Evidence |
|--------|-----------|-----------|---------|
| Narrative Control | Framing | Government positions prop. 2025/26:217 as "mandatory accountability" | HD03217 |
| Coalition Management | SD line discipline | Coalition maintains SD JuU votes on criminal justice | riksdagen.se voting data |
| Legislative Velocity | Deadline compression | 1 Aug 2026 date limits amendment window | HD03217 §1 |
| Opposition Isolation | Single-party motion | HD024099 filed by S alone; no V/MP/C cosignatories | riksdagen.se/HD024099 |
