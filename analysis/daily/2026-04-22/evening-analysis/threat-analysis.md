# Threat Analysis — Evening Analysis 2026-04-22

**Analyst**: James Pether Sörling
**Framework**: political-threat-framework.md (Political Threat Taxonomy, attack tree)
**Date**: 2026-04-22 | **Riksmöte**: 2025/26
**Overall Threat Level**: Elevated | **Confidence**: [B2]

---

## Political Threat Taxonomy Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#C62828', 'primaryTextColor': '#FFFFFF', 'background': '#0a0e27', 'lineColor': '#90CAF9'}}}%%
mindmap
    root((Sweden Political<br/>Threat Landscape<br/>2026-04-22))
        Accountability Threats
            Ministerial Accountability
                HD10442 Svantesson atstorningsvard
                Court-documented false statements
            Parliamentary Accountability
                5 interpellations in 48 hours
        Fiscal-Economic Threats
            Pre-Election Budget Pressure
                4.1 GSEK HD01FiU48 deterioration
                GDP growth 0.82% only
            Climate-Fiscal Contradiction
                Fuel tax cut vs Paris targets
                S dual-track undermines credibility
        Constitutional Threats
            Grundlag Reform Risk
                HD01KU33 press freedom concerns
                Two simultaneous first readings
        Electoral Threats
            Opposition Mobilisation
                S+V+MP counter-motion coalition
                Coordinated accountability offensive
```

---

## Attack Tree Analysis

```mermaid
flowchart TD
    GOAL["Opposition Goal: Force Government Accountability Crisis<br/>Before September 2026 Election"]

    A1["Path 1: Ministerial Accountability<br/>(HD10442 + court documentation)"]
    A2["Path 2: Fiscal Credibility<br/>(Climate contradiction + 4.1 GSEK)"]
    A3["Path 3: Social Failures<br/>(HD10443 social dumpning)"]

    A1a["File HD10442 with court evidence<br/>DONE 2026-04-21"]
    A1b["Force Svantesson to answer<br/>Debate post-May 5"]
    A1c["Media amplification<br/>Pending IP scheduling"]

    A2a["File HD024082/092/098 motions<br/>DONE 2026-04-15 to 2026-04-17"]
    A2b["Vote Ja on HD01FiU48 (tactical)<br/>DONE 2026-04-22"]
    A2c["Expose contradiction in media<br/>Campaign material pending"]

    A3a["File HD10443 social dumpning<br/>DONE 2026-04-22"]
    A3b["Link to HD10423 already in pipeline"]
    A3c["Frame as systemic governance failure"]

    GOAL --> A1
    GOAL --> A2
    GOAL --> A3
    A1 --> A1a --> A1b --> A1c
    A2 --> A2a --> A2b --> A2c
    A3 --> A3a --> A3b --> A3c

    style GOAL fill:#C62828,color:#FFFFFF
    style A1 fill:#E53935,color:#FFFFFF
    style A2 fill:#E53935,color:#FFFFFF
    style A3 fill:#E53935,color:#FFFFFF
    style A1a fill:#2E7D32,color:#FFFFFF
    style A2a fill:#2E7D32,color:#FFFFFF
    style A3a fill:#2E7D32,color:#FFFFFF
```

---

## Parliamentary Accountability Chain

| Phase | Action | Actor | Status | Source |
|-------|--------|-------|--------|--------|
| Evidence gathering | Identify Svantesson statements on atstorningsvard | S research | Complete | HD10442 references |
| Weaponisation | Obtain court ruling vindicating Region Stockholm | Legal research | Complete | HD10442 cites court case |
| Delivery | File interpellation HD10442 with court documentation | Markus Kallifatides (S) | **Complete** 2026-04-21 | riksdagen.se |
| Response forcing | Force parliamentary debate | Speaker scheduling | Pending (post-May 5) | riksdagen.se |
| Media escalation | Coverage of false statements | Swedish press | Pending | — |
| Electoral use | S uses answer in campaign materials | S party | Pending (election day) | — |

---

## MITRE-Style TTP Mapping (Political Tactics)

| TTP | Tactic | Technique | Procedure | Source |
|-----|--------|-----------|-----------|--------|
| S-001 | Accountability | Court-documented accountability | File IP with court ruling as evidence — higher evidentiary standard than typical IP | HD10442 (riksdagen.se) |
| S-002 | Dual-track positioning | Simultaneous support and opposition | Vote for measure in chamber while filing counter-motion | HD01FiU48 vote + HD024082 |
| S-003 | Coordinated offensive | Multi-minister targeting | File 5 IPs in 48 hours targeting 2 ministers | HD10442-HD10446 |
| SD-001 | Coalition support | Key vote solidarity | Voted Ja on HD01FiU48 alongside government | HD01FiU48 vote records |

---

## Threat Probability Assessment

| Threat | Current State | Probability | Timeline | Admiralty |
|--------|--------------|-------------|----------|-----------|
| S successfully damages Svantesson in HD10442 IP debate | IP scheduled, court docs strong | Likely [B2] 65% | Post 2026-05-05 | [B2] |
| S climate voters defect to MP/V due to HD01FiU48 Ja vote | Counter-motions + Ja vote contradiction | Possible [B3] 40% | By election 2026-09-13 | [B3] |
| Social dumpning (HD10443) generates media investigation | Two S IPs on same theme | Possible [B3] 35% | 2026-04 to 2026-05 | [B3] |
| Government fiscal credibility challenged before June budget | 4.1 GSEK + weak GDP | Unlikely [D4] 20% | 2026-05 to 2026-06 | [D4] |
