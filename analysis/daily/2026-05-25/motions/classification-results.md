# Political Classification Results — Opposition Motions 2026-05-25

**Analysis date**: 2026-05-25

## Classification Framework

Applied: Riksdagsmonitor Political Classification Guide — ideological spectrum, policy area taxonomy, procedural type, opposition strategy type.

## Per-Document Classification

| dok_id | Policy Area | Ideological Position | Opposition Strategy | Procedural Type | DIW |
|--------|-------------|---------------------|--------------------|-----------------|----|
| HD024192 | Criminal Justice / Security Law / Fundamental Rights | Centre-Left / Green | Targeted Amendment (proportionality) | Kommittémotion | L2+ |
| HD024188 | Criminal Justice / Security Law | Left | Blanket Rejection | Kommittémotion | L2+ |
| HD024191 | Privacy / Civil Registration / Biometrics | Centre-Left / Green | Conditional Support with Safeguards | Kommittémotion | L2 |
| HD024190 | Foreign Affairs / EU External Relations | Centre-Left / Green | Rejection on Human Rights | Kommittémotion | L1 |
| HD024189 | Foreign Affairs / EU External Relations | Centre-Left / Green | Rejection on Human Rights | Kommittémotion | L1 |
| HD024188 | Privacy / Biometrics / Data Protection | Left | Blanket Rejection | Kommittémotion | L2 |
| HD024186 | Financial Statistics / Household Finance | Centre-Left / Green | Scope Expansion | Kommittémotion | L1 |
| HD024185 | Financial Statistics / Household Finance | Centre-Left | Methodology Rejection | Kommittémotion | L2 |

## Thematic Clusters

### Cluster A: Security-State Expansion (JuU) — HD024192, HD024188
- **Unifying frame**: Government expansion of exceptional security powers (LSU) erodes fundamental rights
- **Party split**: V = maximal rejection; MP = targeted proportionality defence
- **Primary document**: Prop. 2025/26:267 [Admiralty B1]

### Cluster B: Biometric/Privacy (SkU) — HD024187, HD024191
- **Unifying frame**: Purpose-creep in biometric data use violates GDPR Art. 5(1)(b) and RF 2:6
- **Party split**: V = full rejection; MP = conditional support + safeguards
- **Primary document**: Prop. 2025/26:261 [Admiralty B1]

### Cluster C: Financial Data Methodology (FiU) — HD024185, HD024186
- **S and MP** disagree on solution (rejection vs. expansion), but both oppose current government methodology
- **Primary document**: Prop. 2025/26:255 [Admiralty B2]

### Cluster D: EU External Relations (UU) — HD024190, HD024189
- **MP**: Consistent human-rights-based rejection of EU partnerships with non-democratic states
- **Primary documents**: Prop. 2025/26:248, 2025/26:249 [Admiralty B3]

## Ideological Taxonomy

```mermaid
quadrantChart
    title Opposition Strategies: Scope × Radicalism
    x-axis Narrow Scope --> Broad Scope
    y-axis Incremental --> Radical
    quadrant-1 Radical-Broad
    quadrant-2 Radical-Narrow
    quadrant-3 Incremental-Narrow
    quadrant-4 Incremental-Broad
    HD024188 V-LSU: [0.15, 0.90]
    HD024187 V-Biometrics: [0.20, 0.85]
    HD024192 MP-LSU: [0.40, 0.45]
    HD024185 S-Debt: [0.25, 0.50]
    HD024191 MP-Biometrics: [0.55, 0.30]
    HD024186 MP-Debt: [0.70, 0.25]
    HD024190 MP-Kyrgyzstan: [0.30, 0.60]
    HD024189 MP-Uzbekistan: [0.30, 0.60]

%%{init: {'themeVariables': {'quadrant1Fill': '#1a0d2e', 'quadrant2Fill': '#2d0f20', 'quadrant3Fill': '#0a1a0a', 'quadrant4Fill': '#0d1a2d', 'quadrantPointFill': '#00d9ff', 'quadrantXAxisTextFill': '#e0e0e0', 'quadrantYAxisTextFill': '#e0e0e0'}}}%%
```

```mermaid
graph TD
    subgraph LS["Left-Socialist V"]
        V1[Blanket rejection approach\nLSU + Biometrics]
    end
    subgraph CL["Centre-Left-Green MP"]
        MP1[Proportionality doctrine\nTargeted amendments + Safeguards]
    end
    subgraph SD2["Social-Democratic S"]
        S1[Methodology-based opposition\nDebt statistics]
    end

    style LS fill:#2d0f20,color:#ff006e
    style CL fill:#0d2233,color:#00d9ff
    style SD2 fill:#1a0a0a,color:#ffbe0b
    style V1 fill:#3d0f20,color:#ff006e
    style MP1 fill:#0d2d33,color:#00d9ff
    style S1 fill:#2d0a0a,color:#ffbe0b
```
