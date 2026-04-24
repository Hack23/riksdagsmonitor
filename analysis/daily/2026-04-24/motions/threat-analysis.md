# Threat Analysis — Opposition Motions — 2026-04-24

**Author**: James Pether Sörling · Per [`political-threat-framework.md`](../../../methodologies/political-threat-framework.md)

**Overall Threat Level**: HIGH · **Severity**: HIGH (T-4, T-7) / MEDIUM (T-1, T-2, T-3, T-5) / LOW (T-6) · **Confidence**: MEDIUM (B2 — multi-source motion-wave pattern, plausibility judgements per row).

This analysis adopts the Political Threat Taxonomy — adversarial actors, techniques, and targets that could exploit or undermine the democratic process around this motion wave. **This is NOT political opposition research**; it is threat modelling against democratic legitimacy.

## Political Threat Taxonomy

| Threat ID | Actor class | Technique | Target | Plausibility |
|-----------|-------------|-----------|--------|-------------:|
| T-1 | Foreign influence (state-linked) | Frame V avslag on utvisning ([HD024090](https://data.riksdagen.se/dokument/HD024090.html)) as state-capture narrative | V voter base / centre swing | Medium |
| T-2 | Foreign influence | Amplify MP krigsmateriel ([HD024096](https://data.riksdagen.se/dokument/HD024096.html)) to depict Sweden as unreliable Nato ally | Nato discourse in Sweden + allies | Medium |
| T-3 | Domestic extremist | Weaponise prop 235 debate to mobilise anti-migrant mobilisation | Public order / community safety | Medium |
| T-4 | Disinformation (platform) | Mischaracterise S drivmedel motion ([HD024082](https://data.riksdagen.se/dokument/HD024082.html)) as endorsing higher fuel tax | Rural/commuter voters | High |
| T-5 | Legitimate political (within rules) | Tidö parties frame coordinated motion wave as "obstruction" to legitimise procedural shortcuts | Democratic debate norms | Medium |
| T-6 | Cyber | Attempt to compromise Riksdag.se delivery of motion documents during debate window | Information integrity | Low |
| T-7 | Institutional | Utskott-chair use of extra-budget procedure ([prop 236](https://data.riksdagen.se/dokument/HD024082.html) FiU route) to compress opposition time | Deliberative quality | High |

## Attack tree — T-4 (disinfo on drivmedel)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart TB
    Goal([Erode S credibility on fuel prices]) --> A[Mischaracterise HD024082]
    A --> A1[Clip Damberg quote]
    A --> A2[Substitute avslag frame]
    A --> A3[Side-by-side with MP HD024098]
    A1 --> B[Distribute via platforms]
    A2 --> B
    A3 --> B
    B --> B1[Facebook boost]
    B --> B2[X reply-reply chains]
    B --> B3[Telegram channels]
    B1 --> Impact([S rural vote erosion])
    B2 --> Impact
    B3 --> Impact

    style Goal fill:#ff006e,stroke:#fff,color:#fff
    style Impact fill:#ff006e,stroke:#fff,color:#fff
    style A fill:#ffbe0b,stroke:#000,color:#000
    style B fill:#ffbe0b,stroke:#000,color:#000
```

## Kill chain — T-2 (Nato-alliance framing on krigsmateriel)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    R[Reconnaissance<br/>Identify MP motion HD024096] --> W[Weaponisation<br/>Selective translation to EN]
    W --> D[Delivery<br/>Amplify via RT/Sputnik-adjacent] 
    D --> E[Exploitation<br/>Reshare in EU Nato discourse]
    E --> I[Installation<br/>Seed Nato-sceptic narrative]
    I --> C[Command<br/>Repeat cycle at Almedalen]
    C --> Ob[Objectives<br/>Signal Swedish unreliability]

    style R fill:#00d9ff,stroke:#000,color:#000
    style Ob fill:#ff006e,stroke:#fff,color:#fff
```

## MITRE-style TTP mapping

| Tactic | Technique | Procedure (observed / plausible) | Evidence |
|--------|-----------|----------------------------------|----------|
| TA-Info-Manip | Selective quotation | Crop S motion to omit "återkomma till riksdagen" qualifier | [HD024082](https://data.riksdagen.se/dokument/HD024082.html) text structure |
| TA-Delegitimise | Frame substitution | Label V avslag as "amnesti" | [HD024090](https://data.riksdagen.se/dokument/HD024090.html) |
| TA-Polarise | Issue wedge | Rural vs urban on drivmedel | [HD024092](https://data.riksdagen.se/dokument/HD024092.html), [HD024098](https://data.riksdagen.se/dokument/HD024098.html) |
| TA-Amplify | Bot / coordinated inauthentic | Reshare cycles on X/Facebook during utskott hearings | riksdagen.se calendar |
| TA-Suppress | Procedural compression | Extra ändringsbudget route (prop 236) | [HD024082](https://data.riksdagen.se/dokument/HD024082.html) FiU timeline |

## Adversary goals & cost/impact ranking

```mermaid
%%{init: {'theme':'dark'}}%%
quadrantChart
    title Threat ranking — Plausibility vs Impact
    x-axis Low Plausibility --> High Plausibility
    y-axis Low Impact --> High Impact
    quadrant-1 Critical watch
    quadrant-2 Monitor
    quadrant-3 Low priority
    quadrant-4 High-effort adversary
    "T-1 V framed capture": [0.55, 0.70]
    "T-2 Nato unreliable": [0.60, 0.80]
    "T-3 extremist mobil": [0.55, 0.70]
    "T-4 drivmedel disinfo": [0.85, 0.70]
    "T-5 obstruction frame": [0.60, 0.60]
    "T-6 cyber Riksdag": [0.20, 0.80]
    "T-7 procedural compression": [0.85, 0.65]
```

## Defensive recommendations

1. **Against T-4**: S and V independently publish plain-language explainers of their drivmedel motions within 72 hours of first debate; cite [HD024082](https://data.riksdagen.se/dokument/HD024082.html) and [HD024092](https://data.riksdagen.se/dokument/HD024092.html) directly.
2. **Against T-2**: MP coordinates with Swedish embassy comms on English-language explanation of [HD024096](https://data.riksdagen.se/dokument/HD024096.html), distinguishing ethical-export framework from Nato alignment.
3. **Against T-7**: Opposition files ordningsfråga at extra-budget procedural votes; document compression in KU annual report.
4. **Against T-3**: Coordination with MSB (Myndigheten för samhällsskydd och beredskap) on monitoring extremist mobilisation around prop 235 debate windows ([msb.se](https://www.msb.se/)).

## Residual threat posture

- High-plausibility / high-impact quadrant: T-4, T-2, T-7.
- Watch list next 30 days: platform-level content around drivmedel and utvisning debates.
- Escalation trigger: detectable coordinated inauthentic behaviour on any opposition motion hashtag.

---

*This document models adversarial threats to democratic process around the motion wave — it is not an assessment of any specific party's motives. Source: threat framework + riksdag-regering MCP.*
