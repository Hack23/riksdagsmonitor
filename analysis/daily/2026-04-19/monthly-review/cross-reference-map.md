# Cross-Reference Map — Monthly Review: March 20 – April 19, 2026

**Analysis Date**: 2026-04-19  
**Article Type**: monthly-review

---

## Document Relationship Graph

```mermaid
graph TD
    BUDGET["📊 SPRING BUDGET PACKAGE"]
    HD03100["HD03100\nSpring Economic Proposition"]
    HD0399["HD0399\nVårändringsbudget"]
    HD03236["HD03236\nExtra budget — fuel tax"]
    HD03241["HD03241\nFiscal framework review"]
    
    CRIME["⚖️ CRIME REFORM PACKAGE"]
    HD03218["HD03218\nDouble penalties networks"]
    HD03246["HD03246\nYouth offender rules"]
    HD03217["HD03217\nCivil servant liability"]
    HD03237["HD03237\nPaid police training"]
    
    ENV["🌲 ENVIRONMENTAL REFORM"]
    HD03238["HD03238\nNew permit agency"]
    HD03239["HD03239\nWind power municipalities"]
    HD03240["HD03240\nElectricity system law"]
    HD03242["HD03242\nActive forestry"]
    
    SOCIAL["👥 SOCIAL AGENDA"]
    HD03245["HD03245\nViolence against women"]
    HD10438["HD10438\nShelter closures (interp.)"]
    HD10437["HD10437\nWage transparency (interp.)"]
    
    NATO["🛡️ SECURITY"]
    HD03220["HD03220\nNATO Finland contribution"]
    
    BUDGET --> HD03100
    BUDGET --> HD0399
    BUDGET --> HD03236
    BUDGET --> HD03241
    
    CRIME --> HD03218
    CRIME --> HD03246
    CRIME --> HD03217
    CRIME --> HD03237
    
    ENV --> HD03238
    ENV --> HD03239
    ENV --> HD03240
    ENV --> HD03242
    
    SOCIAL --> HD03245
    HD03245 -.->|"Contradicts"| HD10438
    HD10437 -.->|"Relates to"| HD03245
    
    NATO --> HD03220
    HD03220 -.->|"Requires funding from"| BUDGET
    
    HD03218 -.->|"Requires police from"| HD03237
    HD03238 -.->|"Interacts with"| HD03239
    HD03238 -.->|"Interacts with"| HD03242
```

---

## Cross-Reference Table

| Primary dok_id | Related dok_id | Relationship | Significance |
|---------------|----------------|-------------|-------------|
| HD03236 | HD03100 | Supplementary budget to spring prop | Critical fiscal linkage |
| HD03218 | HD03237 | Crime bill needs police capacity | Implementation dependency |
| HD03245 | HD10438 | Strategy vs. on-the-ground reality | Policy credibility gap |
| HD03238 | HD03239 | Same agency will handle wind power | Institutional overlap |
| HD03238 | HD03242 | Permit agency + forestry = deregulation agenda | Thematic cluster |
| HD03220 | HD0399 | NATO costs financed through spring budget | Budget dependency |
| HD01KU32 | HD01KU33 | Both constitutional changes — same vilande cycle | Process linkage |
| HD10437 | HD03245 | Wage gap + violence — gender equality cluster | Thematic |
| HD11719 | HD10438 | Both reveal state protection failures for women | Social cohesion signal |

---

## Sibling Article Type Connections

| This Article | Sibling Type | Connection |
|-------------|-------------|-----------|
| Monthly review (2026-04-19) | Week-ahead (2026-04-14) | Month-end review captures week-ahead items that concluded |
| Monthly review (2026-04-19) | Propositions (2026-04-14) | Validates proposition-level analysis with monthly synthesis |
| Monthly review (2026-04-19) | Monthly review (2026-03-19) | Prior month comparative baseline |

---

## Legislative Pipeline Dependencies

```mermaid
flowchart LR
    A[Spring Prop HD03100] -->|Frames| B[Autumn Budget Sept 2026]
    B -->|Influences| C[Post-election government programme]
    D[Crime Bills HD03218/46/17] -->|Require| E[Police capacity increase]
    E -->|Funded by| A
    F[Environmental reforms] -->|Subject to| G[EU compliance review Q3 2026]
    H[Constitutional changes KU32/33] -->|Require| I[Post-election parliament confirmation]
```
