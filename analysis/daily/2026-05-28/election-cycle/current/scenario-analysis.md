---
artifact_family: A
artifact_type: scenario-analysis
article_date: 2026-05-28
subfolder: election-cycle/current
classification: PUBLIC
workflow: news-election-cycle
horizon: cycle
---

# Scenario Analysis — Tidö Mandate T-107 Outcome Tree

*Election horizon: September 13, 2026. WEP confidence language per horizon band.*

## Scenario Tree (4 Primary + 5 Wildcards)

```mermaid
graph TD
    ROOT["Election outcome Sep 13, 2026 — T-107 days"]
    
    S1["Scenario 1: Tidö Continuation<br>M+KD+L+SD form new government<br>WEP: 35-45%"]
    S2["Scenario 2: S-led Bloc Government<br>S+MP+V+C form minority/majority<br>WEP: 40-50%"]
    S3["Scenario 3: Grand Coalition<br>M+S cross-bloc cooperation<br>WEP: 5-10%"]
    S4["Scenario 4: Hung Parliament<br>Neither bloc wins majority; repeat election possible<br>WEP: 5-10%"]

    ROOT --> S1
    ROOT --> S2
    ROOT --> S3
    ROOT --> S4

    S1B1["S1-B1: SD maintains 20%+<br>Clear M+KD+L+SD majority"]
    S1B2["S1-B2: SD at 17-20%<br>Majority contingent on L staying above 4%"]
    S1B3["S1-B3: SD-lite<br>M governs with SD support but KD not in cabinet<br>Post-abortion KD losses"]

    S2B1["S2-B1: S majority bloc (S+MP+V)<br>Excludes C, does not need C"]
    S2B2["S2-B2: S+C centre-left<br>C chooses S-bloc; MP included only if needed"]
    S2B3["S2-B3: S minority government<br>Governs with case-by-case support, new election within 2y"]

    S1 --> S1B1
    S1 --> S1B2
    S1 --> S1B3
    S2 --> S2B1
    S2 --> S2B2
    S2 --> S2B3

    W1["W1: Abortion cascade event<br>Massive pre-election mobilisation; S+bloc +4pp surge<br>WEP: 20%"]
    W2["W2: Security crisis (Baltic, Ukraine)<br>Incumbent rally effect; Tidö +3-5pp<br>WEP: 5%"]
    W3["W3: Economic shock (Riksbank, US tariffs)<br>GDP <1.5% Q3; incumbent penalty<br>WEP: 8%"]
    W4["W4: L defects post-abortion bill<br>Formal coalition collapse; caretaker government<br>WEP: 3%"]
    W5["W5: V overperforms polls in urban<br>V at 10%+; shifts bloc arithmetic dramatically<br>WEP: 12%"]
```

## Scenario Probability Distribution (T-107)

| Scenario | Probability | Key Driver |
|---|---|---|
| S1: Tidö Continuation | **40%** | Economic competence, SD consolidation |
| S2: S-led Bloc | **47%** | Abortion mobilisation, unemployment |
| S3: Grand Coalition | **8%** | Neither bloc wins majority, stalemate |
| S4: Hung Parliament | **5%** | Highly fragmented vote, Riksdag deadlock |

*WEP assessment for cycle horizon: LIKELY [55–65%] for S-led bloc outcome; ROUGHLY EVEN for Tidö continuation.*

## Branch Details: Most Likely Outcome (S2-B2)

**S2-B2: S+C centre-left government (WEP: 22%)**  
- Prerequisite: S polls 31%+, C polls 6%+
- PM candidate: Magdalena Andersson (S)
- Cabinet: S (majority of ministers) + C (Finance or Trade ministers)
- MP and V provide confidence and supply from outside
- **Abortion policy reversal**: HD03271 repealed within 100 days
- **Economic policy**: continuity on fiscal surplus rules; C secures rural and enterprise agenda
- **NATO**: full continuity — C and S both strongly pro-NATO
- **Migration**: some liberalisation (S+MP pressure) vs. C demand for control — tension but functional compromise possible
- **Defence**: maintained at 2.6%+ (NATO obligation, cross-party consensus)

## Wildcard Escalation: W1 (Abortion Cascade)

If feminist mobilisation achieves 50,000+ march in Stockholm before August 31:
- S poll surge to 34%+
- MP poll surge from 4% to 6% (youth mobilisation)
- L urban vote collapses from 5% to 3.5% (below threshold → wasted votes)
- **Net effect**: S-led bloc majority becomes highly probable (WEP: >65%)
