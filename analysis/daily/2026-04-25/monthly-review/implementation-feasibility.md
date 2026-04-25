# Implementation Feasibility — Monthly Review 2026-04-25

**Author**: James Pether Sörling | **Confidence**: MEDIUM (B2)

## Implementation matrix

| dok_id | Owner | Critical-path constraint | Window to visible effect | Feasibility |
|--------|-------|---------------------------|---------------------------|-------------|
| HD01JuU10 | Polismyndigheten + Domstolsverket | Tillståndshanterings­kapacitet | 9–18 months | MEDIUM-HIGH; depends on HD01JuU31 closure [riksdagen.se HD01JuU10] |
| HD01JuU31 | Polismyndigheten | RiR 2026:6 9 öppna rekommendationer | 24+ months | LOW-MEDIUM; second audit cycle expected ~2029 [riksdagen.se HD01JuU31] |
| HD01SoU25 | Försäkringskassan + kommuner | Anhörigstrategi finansiering (HD03100 saknar post) | 12–18 months | MEDIUM; R-1 binding [riksdagen.se HD01SoU25] |
| HD01CU24 | Boverket + kommuner | Kommunal handläggar­kapacitet | 6–12 months for permits, 18+ for påbörjade bostäder | MEDIUM; mätbart Q3 2026 [riksdagen.se HD01CU24] |
| HD03100 fiscal | Treasury | Implementeringsklart Q3 2026 | live | HIGH (sibling) |
| HD03240 elmarknad | Energimyndigheten + Svenska Kraftnät | Teknisk omkonfigurering | 12+ months | MEDIUM (sibling) |
| UFöU3 NATO eFP | FM | Förbandsutbyggnad 1200 trupp | 6–9 months | HIGH (sibling) |
| HD01FiU48 fuel | Treasury (live) | Implementerat 2026-05-01 | live | HIGH |

## Capacity-bottleneck panorama

```mermaid
flowchart TD
  T[Legislation committed]:::a --> P[Polismyndigheten]:::b
  T --> F[Försäkringskassan + kommuner]:::b
  T --> B[Boverket + kommuner]:::b
  T --> E[Energimyndigheten]:::b
  P --> P1[RiR 2026:6 9 rekommendationer öppna]:::r
  F --> F1[HD01SoU25 anhörig saknar finansiering]:::r
  B --> B1[Handläggar­kapacitet i kommun]:::y
  E --> E1[Teknisk reform 12+ mån]:::y
  classDef a fill:#0a0e27,stroke:#00d9ff,color:#e0e0e0
  classDef b fill:#1a1e3d,stroke:#ffbe0b,color:#ffffff
  classDef r fill:#1a1e3d,stroke:#ff006e,color:#ffffff
  classDef y fill:#0a0e27,stroke:#ffbe0b,color:#ffbe0b
  style P1 stroke-width:2px
  style F1 stroke-width:2px
```

## Forward implementation triggers

- HD01JuU10 vapenregister IT-modernisering: status report expected Q3 2026 from Polismyndigheten.
- HD01SoU25 anhörigstrategi national director: appointment expected 2026-06-30.
- HD01CU24 kommunala handläggningstider: SCB BO0101 measurable from Q3 2026.
- HD01JuU31 first reorganisation announcement window: 2026-08-31 (before pre-campaign manifestos).

[riksdagen.se HD01JuU31] [riksdagen.se HD01JuU10] [riksdagen.se HD01SoU25] [riksdagen.se HD01CU24]

