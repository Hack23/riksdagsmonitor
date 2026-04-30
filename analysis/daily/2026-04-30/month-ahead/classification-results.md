# Classification Results — Month Ahead May 2026

**Author**: James Pether Sörling | **Date**: 2026-04-30

## Classification Framework

7-dimension classification per document: (1) Policy Domain, (2) Political Salience, (3) Electoral Impact, (4) Implementation Complexity, (5) EU/International Dimension, (6) Security/Defence Dimension, (7) GDPR/Privacy Dimension

## Priority Tier Assignments

### Priority Tier 1 — Immediate Action

| dok_id | Domain | Salience | Electoral | Impl. | EU | Security | Privacy |
|--------|--------|----------|-----------|-------|-----|---------|---------|
| HD03259 | Infrastructure/Climate | Very High | Very High | Very High | High | Medium | Low |
| HD01KU36 | Governance/Digital | High | High | Medium | High | Low | Very High |
| HD03253 | Finance/Banking | Medium | Low | High | Very High | Low | Low |
| HD03252 | Justice/Welfare | High | Very High | High | Low | Low | Medium |

### Priority Tier 2 — Monitor

| dok_id | Domain | Salience | Electoral | Impl. | EU | Security | Privacy |
|--------|--------|----------|-----------|-------|-----|---------|---------|
| HD01JuU9 | Justice | Medium | Medium | High | Medium | Low | Medium |
| HD10461 | Research/Defence | High | Medium | Medium | High | High | Low |
| HD01NU22 | Competition | Medium | Low | High | Very High | Low | Low |
| HD10460 | Culture/Heritage | Medium | High | Medium | Low | Low | Low |

### Priority Tier 3 — Background

| dok_id | Domain | Salience |
|--------|--------|----------|
| HD11772 | Foreign policy/Aid | Medium |
| HD11774 | Housing | Medium |
| HD11769 | Health | Low |
| HD11768 | Animal welfare | Low |
| HD11771–HD11776 | Various | Low |

## Retention and Access

- All documents: PUBLIC under Offentlighetsprincipen (RF 2:1)
- GDPR Art. 9(2)(e)(g): Political opinions of named MPs in interpellation debates are publicly made statements
- Retention: 5 years for analysis artifacts; source documents permanent (Riksdag archive)
- Classification review: Quarterly

## Classification Diagram

```mermaid
%%{init: {"theme": "dark"}}%%
pie title Document Classification Distribution
    "prop (Propositions)" : 11
    "bet (Committee Reports)" : 10
    "fr (Written Questions)" : 2
```

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    DOCS["30 Documents\nClassified"] --> PROP["11 Propositions\nExec → Parliament"]
    DOCS --> BET["10 Committee Reports\nChamber-ready"]
    DOCS --> FR["2 Written Questions\nOpposition monitoring"]
    PROP --> IM["Immigration\nCluster HD03262-65"]
    PROP --> NTP["HD03259\n970bn SEK Transport"]
    BET --> KU["HD01KU36\nDigital Integrity"]
    style DOCS fill:#00d9ff,color:#0a0e27
    style PROP fill:#1a1e3d,color:#ffbe0b
    style BET fill:#1a1e3d,color:#ffbe0b
    style FR fill:#1a1e3d,color:#00d9ff
    style IM fill:#ff006e,color:#fff
    style NTP fill:#1a1e3d,color:#ffbe0b
    style KU fill:#1a1e3d,color:#00d9ff
```
