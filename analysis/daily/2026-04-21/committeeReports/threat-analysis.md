# Threat Analysis — Committee Reports 2026-04-21

**Date**: 2026-04-21 | **Analyst**: news-committee-reports | **Framework**: STRIDE + Political Threat

## Threat Severity: MEDIUM
**Confidence near MEDIUM** — Significant legislative activity with ECHR and EU compliance exposure.

## Primary Threats

### T1: Constitutional/Legal Challenge (SfU22)
**Threat Level**: HIGH | **Likelihood**: 3/5 | **Impact**: 5/5

- Geographic restriction on inhibited aliens may violate ECHR Protocol 4, Article 2 (freedom of movement)
- Mandatory police check-ins without criminal charge touches ECHR Article 5 (liberty)
- Migration Court of Appeal challenge expected within 6 months of implementation

**Kill Chain**: FARR files court challenge → Migrationsöverdomstolen rules on proportionality → If violation found, Government must amend law → Political damage to coalition

### T2: EU Non-Compliance Cascade
**Threat Level**: MEDIUM | **Likelihood**: 2/5 | **Impact**: 4/5

Multiple reports carry EU compliance dimensions:
- TU21: eIDAS2 deadline (2026) — failure risks EU Commission infringement proceedings
- MJU21: CAP eco-scheme performance — Sweden below EU average; Commission monitoring
- TU22: EU Tachograph Regulation compliance — cross-border enforcement gap

### T3: Coalition Fracture on Agriculture (MJU21)
**Threat Level**: MEDIUM | **Likelihood**: 3/5 | **Impact**: 3/5

C-party represents rural constituencies that could defect over binding agricultural climate conditions. If C abstains on MJU21 implementation vote, coalition majority margin drops from 176 to below 175 threshold.

### T4: Banking Sector Resistance to State e-ID (TU21)
**Threat Level**: MEDIUM-LOW | **Likelihood**: 4/5 | **Impact**: 3/5

BankID consortium (operated by Swedish banks) generates €200M+ annually in identity verification revenues. Major lobbying effort expected against state e-ID. Risk: implementation delayed past 2028 eIDAS2 effective date.

## Threat Mindmap

```mermaid
mindmap
  root((Committee Reports 2026-04-21))
    Constitutional
      SfU22 ECHR exposure
        Freedom of movement
        Liberty without charge
      KU42 Budget oversight gaps
    EU Compliance
      TU21 eIDAS2 deadline
      MJU21 CAP performance
      TU22 Tachograph regulation
    Political
      Coalition fracture
        C-party agriculture
        L-party ECHR concerns
      Opposition campaigns
        S humanitarian framing
        MP climate ambition
    Implementation
      SfU22 enforcement capacity
      TU21 banking resistance
      TU19 NATO port security
```

## Attack Tree — SfU22 Legal Challenge

```mermaid
graph TB
    ROOT["SfU22 struck down by court"] --> A["ECHR violation found"]
    ROOT --> B["EU Charter violation"]
    A --> A1["Art. 5 — Detention without charge"]
    A --> A2["Protocol 4 Art. 2 — Free movement restriction"]
    B --> B1["Charter Art. 7 — Respect for private life"]
    B --> B2["Charter Art. 18 — Right to asylum undermined"]
    A1 --> M1["FARR legal challenge\n(P=0.8 files within 90 days of implementation)"]
    A2 --> M2["Migrationsöverdomstolen preliminary ruling\n(P=0.6 grants inhibition)"]
    style ROOT fill:#ff4444,color:#fff
    style A fill:#cc3300,color:#fff
    style B fill:#cc3300,color:#fff
```
