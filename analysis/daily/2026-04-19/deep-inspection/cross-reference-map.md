# Cross-Reference Map — Deep Inspection: HD03231 Ukraine Aggression Tribunal

| Field | Value |
|-------|-------|
| **XRF-ID** | XRF-2026-04-19-DI |
| **Analysis Date** | 2026-04-19 18:36 UTC |
| **Framework** | Cross-document intelligence map; reference ecosystem |
| **Primary Document** | HD03231 |
| **Validity Window** | Valid until 2026-05-03 |

---

## 🔗 Document Relationships

```mermaid
graph TD
    HD03231["📜 HD03231<br/>Prop. 2025/26:231<br/>Ukraine Aggression Tribunal<br/>2026-04-16"]
    HD03232["📜 HD03232<br/>Prop. 2025/26:232<br/>International Compensation<br/>Commission (Ukraine)<br/>2026-04-16"]
    REF1434["📁 Realtime-1434<br/>Reference Dossier<br/>2026-04-17<br/>(Gold Standard)"]
    
    subgraph PREVIOUS["🕐 Previous Analysis Context"]
        REF_SYN["synthesis-summary.md<br/>Lead: KU33/KU32 (primary)<br/>HD03231: Secondary"]
        REF_THR["threat-analysis.md<br/>T6: Russian Hybrid<br/>MEDIUM-HIGH/HIGH"]
        REF_HDO["HD03231-analysis.md<br/>Full L2+ analysis<br/>Significance 8.55"]
    end

    subgraph LEGAL["⚖️ Legal Instruments"]
        HAGUE_CONV["Hague Convention<br/>Dec 16 2025<br/>Treaty text signed"]
        ROME_ART8["Rome Statute Art. 8bis<br/>Kampala 2017 amendments<br/>Aggression definition"]
        COE_EPA["Council of Europe<br/>Expanded Partial<br/>Agreement (EPA)"]
        SCSL["Special Court for<br/>Sierra Leone (SCSL)<br/>2002-2013 precedent"]
    end

    subgraph SECURITY_CONTEXT["🛡️ Security Context References"]
        NATO_ART5["NATO Article 5<br/>Sweden accession<br/>March 2024"]
        SÄPO_RPT["SÄPO Annual Report<br/>2025 (published)"]
        MSB_HOT["MSB Hotbildsanalys<br/>2025/2026"]
        NCSC_ADVIS["NCSC/GovCERT<br/>Advisories 2025-26"]
    end

    HD03231 -->|"companion prop"| HD03232
    HD03231 -->|"ratifies"| HAGUE_CONV
    HAGUE_CONV -->|"implements"| COE_EPA
    COE_EPA -->|"fills gap in"| ROME_ART8
    SCSL -->|"structural precedent"| HD03231

    REF1434 --> REF_SYN
    REF1434 --> REF_THR
    REF1434 --> REF_HDO
    REF_HDO -->|"upgrades to L3"| HD03231

    NATO_ART5 -->|"context"| HD03231
    HD03231 -->|"elevates"| SÄPO_RPT
    HD03231 -->|"elevates"| MSB_HOT
    HD03231 -->|"triggers advisory"| NCSC_ADVIS

    style HD03231 fill:#D32F2F,color:#FFFFFF
    style HD03232 fill:#FF9800,color:#FFFFFF
    style REF1434 fill:#1565C0,color:#FFFFFF
    style HAGUE_CONV fill:#4CAF50,color:#FFFFFF
    style COE_EPA fill:#4CAF50,color:#FFFFFF
    style NATO_ART5 fill:#1565C0,color:#FFFFFF
```

---

## 📚 Reference Documents & Citations

| Reference | Type | Relevance to HD03231 | Access |
|-----------|------|---------------------|:---:|
| `analysis/daily/2026-04-17/realtime-1434/documents/HD03231-analysis.md` | Prior AI analysis (L2+) | Gold-standard per-document analysis; this deep-inspection upgrades to L3 | Local |
| `analysis/daily/2026-04-17/realtime-1434/threat-analysis.md` | Prior threat analysis | T6 (Russian hybrid) at MEDIUM-HIGH/HIGH first established here | Local |
| `analysis/daily/2026-04-17/realtime-1434/synthesis-summary.md` | Prior synthesis | HD03231 as "Secondary" in realtime-1434; now LEAD in deep-inspection | Local |
| [ICC Rome Statute Art. 8bis](https://www.icc-cpi.int/sites/default/files/RS-Eng.pdf) | International treaty | Defines "crime of aggression"; Special Tribunal fills gap where ICC cannot act | External |
| [Council of Europe EPA framework](https://www.coe.int) | Institutional framework | HD03231 ratifies Sweden's accession to EPA structure | External |
| [SCSL Statute (2002)](https://www.rscsl.org) | Precedent | Hybrid international tribunal design; in absentia procedures | External |
| [NATO Art. 5 (Washington Treaty)](https://www.nato.int) | Strategic context | Sweden's collective-defence anchor; changes threat calculus | External |
| [MSB Hotbildsanalys 2025](https://www.msb.se) | Security context | Current Swedish security posture vs Russian hybrid threats | External |

---

## 🔄 Document Evolution Tracking

| Version | Date | Analysis Depth | Key Changes |
|---------|------|:---:|------------|
| Initial analysis | 2026-04-17 | L2+ Strategic | Security dimensions identified; T6 flagged MEDIUM-HIGH |
| **Deep-inspection** | **2026-04-19** | **L3 Intelligence Grade** | Full Kill Chain; Diamond Model; Attack Tree; 8-stakeholder SWOT; risk scored 20/25 for R1 |

---

## 🌐 Related Swedish Foreign Policy Instruments (Context Map)

| Instrument | Date | Relationship to HD03231 |
|-----------|------|------------------------|
| **NATO accession** | March 2024 | Security anchor; changes Russia threat calculus for HD03231 targeting |
| **Ukraine aid package** (annual) | 2022–2026 | Policy continuity; HD03231 is legal-institutional complement to aid |
| **HD03232 (Reparations Commission)** | 2026-04-16 | Companion proposition; EUR 260B immobilised Russian assets framework |
| **Swedish humanitarian aid to Ukraine** | 2022–2026 | Humanitarian track; HD03231 is accountability track |
| **GDPR/UD data protection** | Ongoing | UD data security is now relevant to tribunal planning security |
